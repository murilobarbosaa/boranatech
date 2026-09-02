import { z } from "zod";

import { CHAT_KICKOFF } from "../../../shared/aiRoadmap";
import { AI_TOOLS } from "../aiTools";
import { env } from "../env";
import { fetchWithTimeout } from "../http";
import { buildOpenAIHeaders, OPENAI_BASE_URL } from "../openai";
import { erroDaRespostaOpenAi, isFalhaPermanente } from "../openaiFailure";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import {
  novoUsoAcumulado,
  somarUso,
  somarUsoDeChamadas,
  usoDoContrato,
  type UsoAcumulado,
  type UsoMedido,
} from "../aiUsoMedido";
import { fetchUserContextPool } from "../userContext/pool";
import { textoDaNotaLinkedin } from "../linkedinNotaPendente";

/**
 * Chat de intake do roadmap com IA (feature Pro). A conversa produz um intake
 * PROPOSTO turno a turno; NADA aqui gera roadmap nem confia no que o modelo
 * devolve para a geracao: a rota POST /api/roadmaps-ia/generate revalida tudo
 * com RoadmapIntakeSchema. O contrato do turno segue o padrao de
 * server/lib/careerPlan/intakeChat.ts: POST unico por turno, response_format
 * json_schema strict, sem streaming, historico efemero reenviado pelo client.
 *
 * Divergencias conscientes em relacao ao careerPlan: roteiro proprio de 7 etapas
 * (o form coleta parametros, o chat coleta historia), campos narrativos novos
 * (startingPoint, motivation, constraints) e o campo format NAO e perguntado
 * (decisao de produto: o gerador nao ramifica sobre ele; o client assume o
 * default "misto"). Por isso format fica de fora do intake proposto aqui.
 */

const TOOL_CONFIG = AI_TOOLS["roadmap-intake-chat"];

const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 1_500;

/**
 * Formato de um `code` do Zod: minusculas e underscore, nada mais.
 *
 * Este casamento NAO e uma tentativa de adivinhar o code; e uma cerca. O
 * argumento da funcao e `unknown[]`, entao nada garante em tipo que o `code` de
 * um item seja um dos literais do Zod (`too_big`, `invalid_format`, ...). Como o
 * valor sai daqui direto para `ai_usage_logs` via `classificarFalhaDeTurno`,
 * qualquer coisa fora dessa forma vira `(sem-codigo)` em vez de virar texto
 * livre no banco. Os codes do Zod 4 cabem todos aqui.
 */
const FORMA_DE_CODE_DO_ZOD = /^[a-z_]{1,40}$/;

/**
 * Caminhos dos campos que falharam a validacao, com o `code` do Zod, e so isso.
 *
 * Recebe `error.issues` do Zod e devolve algo como
 * `intake.goal:invalid_value,reply:too_big`. Nunca toca em `message`,
 * `received`, `expected` ou qualquer outro campo do issue: esses podem carregar
 * o valor que veio do modelo, que por sua vez pode conter a fala da pessoa. O
 * `code` e seguro por natureza, porque e um literal de um conjunto fechado, e a
 * cerca acima garante isso mesmo com entrada malformada.
 *
 * POR QUE O CODE ENTROU (BUG-73): o caminho sozinho diz que `reply` falhou, e
 * nao se falhou por estourar o teto, por vir vazio ou por nao ser string. Os 7
 * turnos medidos em 30 dias apareciam todos como `schema_mismatch:reply`, um
 * balde so, e a correcao depende de qual dos tres e.
 *
 * O COMPRIMENTO DE `reply` NAO ENTRA AQUI, e nem no valor gravado no banco: ver
 * `diagnosticoDeTurnoReprovado`.
 *
 * Um issue sem `code` reconhecivel vira `caminho:(sem-codigo)`, e nao `caminho`
 * pelado, de proposito: a forma pelada e indistinguivel do formato antigo, e um
 * diagnostico degradado que se parece com um diagnostico certo e pior que um
 * ruidoso.
 *
 * Deduplicado e ordenado para o registro ser estavel entre ocorrencias iguais, e
 * limitado a 10 entradas porque a lista existe para diagnosticar, nao para
 * reproduzir a resposta.
 */
export function caminhosDoSchema(issues: readonly unknown[]): string {
  const caminhos = new Set<string>();
  for (const issue of issues) {
    const p = (issue as { path?: unknown })?.path;
    const codeBruto = (issue as { code?: unknown })?.code;
    const code =
      typeof codeBruto === "string" && FORMA_DE_CODE_DO_ZOD.test(codeBruto)
        ? codeBruto
        : "(sem-codigo)";
    if (!Array.isArray(p)) {
      caminhos.add(`(desconhecido):${code}`);
      continue;
    }
    // Cada segmento vira string por conta propria; indices numericos de array
    // sao posicao, nao conteudo, entao sao seguros.
    const caminho = p
      .map((seg) => (typeof seg === "number" ? String(seg) : String(seg)))
      .join(".");
    caminhos.add(`${caminho || "(raiz)"}:${code}`);
  }
  // Array.from em vez de spread: o `target` deste tsconfig nao permite iterar
  // Set com spread (TS2802).
  return Array.from(caminhos).sort().slice(0, 10).join(",");
}

/** Diagnostico de um turno reprovado, separado por ONDE cada parte pode ir. */
export interface DiagnosticoDeTurno {
  /** Caminhos com code. Baixa cardinalidade: pode ir para `ai_usage_logs`. */
  campos: string;
  /**
   * Comprimento de `reply`, ou `null` quando `reply` nao veio como string.
   *
   * FICA SO NO LOG DO SERVIDOR. Nao vai para o codigo gravado no banco porque
   * comprimento e alta cardinalidade: 601, 612, 634 virariam tres codigos
   * distintos, e a agregacao por tipo de falha (que e o que revelou os 7 turnos
   * do BUG-73) deixaria de existir justamente na coluna feita para ela. O
   * `classificarFalhaDeTurno` diz no cabecalho que reduz a falha a um codigo de
   * BAIXA cardinalidade, e isto respeita esse contrato.
   *
   * O Zod nao ajuda aqui: o issue `too_big` traz `origin`, `code`, `maximum`,
   * `inclusive`, `path` e `message`, e nenhum campo com o valor recebido nem com
   * o tamanho dele (medido no zod 4.4.3). Por isso o comprimento sai do `parsed`
   * e nao dos issues.
   */
  replyChars: number | null;
}

/**
 * Monta o diagnostico de um turno que o schema reprovou.
 *
 * SO O COMPRIMENTO de `reply`, nunca o texto: a regra de nao persistir nem logar
 * a fala da pessoa vale igual aqui, e um numero responde a pergunta que
 * `reply:too_big` deixa em aberto ("estourou os 600 por quanto?") sem carregar
 * nada do conteudo.
 */
export function diagnosticoDeTurnoReprovado(
  parsed: unknown,
  issues: readonly unknown[],
): DiagnosticoDeTurno {
  const reply =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { reply?: unknown }).reply
      : undefined;
  return {
    campos: caminhosDoSchema(issues),
    replyChars: typeof reply === "string" ? reply.length : null,
  };
}

// Semente de abertura da conversa. Ela existe so para dar um primeiro turno
// nao-vazio ao modelo e NAO aparece como bolha na tela.
//
// Ate a fase 2 quem a prefixava era o CLIENT, a cada turno. O efeito era que ela
// ocupava uma vaga de `userCount` e o orcamento real da pessoa ficava um turno
// menor que o anunciado. Agora ela e injetada aqui, na montagem do prompt, e
// nunca entra na contagem. `validateIntakeChatBody` REMOVE a semente se ela vier
// no corpo, para o bundle antigo em cache (que ainda a prefixa) nao produzir
// semente duplicada depois do deploy.
//
// O TEXTO vem de shared/aiRoadmap.ts porque o client tambem precisa dele (retry
// de compatibilidade do turno de abertura na janela de deploy) e as duas copias
// tinham que ser identicas. Reexportado aqui para nao mudar quem ja importa.
export { CHAT_KICKOFF };

// ORCAMENTO DE TURNOS.
//
// O teto precisa caber o PIOR CASO do roteiro que o proprio prompt manda o
// modelo seguir. Quando nao cabe, a conversa morre antes do resumo e a pessoa
// fica sem roadmap: foi exatamente o que aconteceu com o teto de 12 contra um
// roteiro que precisa de ate 15, agravado pela semente que comia uma vaga.
//
// Os tres numeros abaixo sao a TRANSCRICAO do roteiro em
// INTAKE_CHAT_SYSTEM_PROMPT. Mudou o roteiro, mude-os aqui junto: o teste
// invariante em intakeChat.test.ts recalcula o pior caso a partir deles e cai se
// MAX_USER_MESSAGES deixar de caber. Sem esses numeros o roteiro so existiria
// dentro de uma string de prompt, e nao haveria o que um teste checasse.
export const ROTEIRO_ETAPAS = 7;
export const ROTEIRO_REPERGUNTAS_POR_ETAPA = 1;
export const ROTEIRO_TURNOS_DE_CONFIRMACAO = 1;

// 7 respostas de etapa + 7 reperguntas + 1 confirmacao do resumo = 15.
export const ROTEIRO_PIOR_CASO =
  ROTEIRO_ETAPAS * (1 + ROTEIRO_REPERGUNTAS_POR_ETAPA) +
  ROTEIRO_TURNOS_DE_CONFIRMACAO;

// 20 = pior caso (15) + 5 de folga para o que o roteiro nao prevê (a pessoa
// corrigir uma resposta, pedir para repetir, mudar de ideia sobre o objetivo).
export const MAX_USER_MESSAGES = 20;

// COTA DIARIA vs ORCAMENTO DE TURNOS.
//
// Cada turno bem-sucedido loga uma linha 'success' em ai_usage_logs e consome
// uma unidade da cota DEDICADA do chat (get_ai_usage_today_by_tool com
// tool = 'roadmap-intake-chat'). Logo, subir MAX_USER_MESSAGES sem olhar a cota
// apenas MUDA a porta em que a pessoa trava: em vez de "limite da conversa" ela
// bate em "limite diario", no meio da mesma conversa.
//
//   MAX_USER_MESSAGES (20) x CONVERSAS_COMPLETAS_POR_DIA (2) = 40 <= 60 (cota)
//
// A cota default (ROADMAP_INTAKE_CHAT_DEFAULT_DAILY_LIMIT) da 3 conversas
// completas por dia, entao ha folga. O teste invariante trava a desigualdade.
export const CONVERSAS_COMPLETAS_POR_DIA = 2;
export const COTA_DIARIA_MINIMA =
  MAX_USER_MESSAGES * CONVERSAS_COMPLETAS_POR_DIA;

// A partir de quantas mensagens restantes o modelo e instruido a aterrissar
// (pular reperguntas e ir para o resumo). Ver "# Orcamento da conversa" no
// system prompt: o numero aqui e o mesmo citado la.
export const POUSO_SUAVE_RESTANTES = 3;

// TETO DE CARACTERES: comprimir, nao rejeitar.
//
// O teto antigo (9.000) era uma REJEICAO: acima dele a rota devolvia
// payload_too_large e a conversa morria. Com 20 turnos ele passaria a ser
// atingivel numa conversa legitima (20 respostas + 20 falas do Natechinho de ate
// 600 chars da algo perto de 18.000), ou seja, viraria o mesmo beco sem saida em
// outra porta.
//
// Agora sao dois tetos com papeis diferentes:
//
//  - PROMPT_HISTORY_MAX_CHARS: teto do que vai NO PROMPT. Acima dele o historico
//    e comprimido (ver compressHistory). Dimensionado ACIMA do pior caso de uma
//    conversa normal, de proposito: compressao e rede de seguranca, nao rotina.
//  - MAX_BODY_CHARS: teto ABSOLUTO do corpo aceito, contra abuso. Uma ordem de
//    grandeza acima, porque so precisa barrar payload construido a mao.
//
// A contagem do orcamento de turnos (userCount) roda sobre o historico INTEIRO,
// antes da compressao: comprimir o prompt nao pode dar turnos de brinde.
export const PROMPT_HISTORY_MAX_CHARS = 24_000;
export const MAX_BODY_CHARS = 120_000;

// Quantas mensagens do FIM sempre sobrevivem a compressao. O resumo da etapa 7 e
// a confirmacao da pessoa vivem no fim da conversa, e sao exatamente o que o
// turno seguinte precisa ler para marcar ready.
export const COMPRESS_KEEP_TAIL = 10;

// Marcador que entra no lugar dos turnos descartados. Sem ele o modelo pode
// concluir que nunca perguntou o que perguntou, e repetir etapas ja vencidas.
const COMPRESS_MARKER =
  "(Os turnos mais antigos desta conversa foram omitidos por tamanho. O intake ja capturado continua valendo; nao repita perguntas cujas respostas voce ja tem.)";

/**
 * Mantem o historico do PROMPT dentro de PROMPT_HISTORY_MAX_CHARS descartando os
 * turnos mais ANTIGOS, no molde do trimHistory de server/routes/interview.ts.
 *
 * Estrategia escolhida (descartar, nao resumir): resumir exigiria uma segunda
 * chamada de IA por turno, com custo, latencia e um modo de falha proprio (o que
 * fazer quando o resumo falha?). Descartar e deterministico e barato, e o que
 * importa para o proximo turno esta no fim da conversa, nao no comeco: a semente
 * e injetada sempre, o intake acumulado ja vem estruturado no proprio objeto
 * `intake` de cada turno, e o resumo da etapa 7 fica entre as ultimas mensagens.
 */
export function compressHistory(
  messages: IntakeChatMessage[],
): IntakeChatMessage[] {
  const size = (msgs: IntakeChatMessage[]) =>
    msgs.reduce((acc, m) => acc + m.content.length, 0);
  if (size(messages) <= PROMPT_HISTORY_MAX_CHARS) return messages;

  const tail = messages.slice(-COMPRESS_KEEP_TAIL);
  const head = messages.slice(
    0,
    Math.max(0, messages.length - COMPRESS_KEEP_TAIL),
  );
  while (
    head.length > 0 &&
    size([...head, ...tail]) > PROMPT_HISTORY_MAX_CHARS
  ) {
    head.shift();
  }
  return [{ role: "assistant", content: COMPRESS_MARKER }, ...head, ...tail];
}

// Campos do intake proposto pelo chat. NAO inclui format (nao perguntado; o
// client assume "misto"). goal/hoursPerWeek/deadline usam os MESMOS enums de
// RoadmapIntakeSchema (shared/aiRoadmap.ts); os demais sao texto livre.
export const INTAKE_FIELDS = [
  "goal",
  "hoursPerWeek",
  "deadline",
  "stackFocus",
  "startingPoint",
  "motivation",
  "constraints",
] as const;

// O intake proposto pelo turno. Todos os campos sao NULLABLE (o chat preenche o
// que ja sabe e deixa null o que falta). Os enums espelham exatamente os de
// RoadmapIntakeSchema; stackFocus e os campos narrativos sao texto livre (o
// stackFocus e normalizado depois do parse para respeitar o regex do schema).
const IntakeProposalSchema = z.object({
  goal: z
    .enum(["primeira-vaga", "transicao", "freela", "aprofundar"])
    .nullable(),
  hoursPerWeek: z.enum(["ate-5", "5-10", "10-20", "20-mais"]).nullable(),
  deadline: z.enum(["3m", "6m", "12m", "sem-prazo"]).nullable(),
  stackFocus: z.string().nullable(),
  startingPoint: z.string().nullable(),
  motivation: z.string().nullable(),
  constraints: z.string().nullable(),
});

// Um turno do chat de intake. reply e a fala do Natechinho (uma unica pergunta
// por turno); missing lista os campos ainda em aberto; ready so vira true quando
// os campos essenciais estiverem preenchidos E a pessoa confirmar o resumo
// (regra no prompt).
export const IntakeChatTurnSchema = z.object({
  reply: z.string().min(1).max(600),
  intake: IntakeProposalSchema,
  missing: z.array(z.enum(INTAKE_FIELDS)),
  ready: z.boolean(),
});

export type IntakeProposal = z.infer<typeof IntakeProposalSchema>;
export type IntakeChatTurn = z.infer<typeof IntakeChatTurnSchema>;

export const INTAKE_CHAT_JSON_SCHEMA =
  toOpenAIStrictSchema(IntakeChatTurnSchema);

export interface IntakeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type IntakeChatBodyValidation =
  | {
      ok: true;
      messages: IntakeChatMessage[];
      // Mensagens de usuario ja gastas e quantas ainda cabem. A rota devolve
      // `restantes` ao client, que avisa a pessoa antes de o teto chegar: teto
      // que surpreende e indistinguivel de bug.
      userCount: number;
      restantes: number;
    }
  | {
      ok: false;
      error: "invalid_request" | "payload_too_large" | "turn_limit";
    };

// Remove a semente de abertura de qualquer posicao do historico.
//
// Por que em QUALQUER posicao e nao so na primeira: o bundle antigo da Vercel
// prefixa a semente a cada turno, e uma aba aberta desde antes do deploy vai
// continuar fazendo isso ate recarregar (nao existe prazo para isso acontecer).
// Rascunhos do localStorage tambem podem carrega-la. Remover por igualdade de
// conteudo cobre os tres casos com uma regra so, e o custo de remover uma
// mensagem que a pessoa por acaso digitou identica a semente e zero: o servidor
// injeta a semente de volta na montagem do prompt.
function stripKickoff(messages: IntakeChatMessage[]): IntakeChatMessage[] {
  return messages.filter(
    (m) => !(m.role === "user" && m.content.trim() === CHAT_KICKOFF),
  );
}

// Validacao pura do corpo, extraida para ser testavel sem HTTP. Limpa mensagens
// invalidas, remove a semente, aplica o teto de chars e o teto de mensagens de
// usuario. A rota so mapeia o erro para o status/codigo correspondente.
//
// Historico VAZIO e valido: e o turno de abertura. Antes da fase 2 ele era
// rejeitado como invalid_request, porque o client sempre mandava a semente e um
// corpo vazio nunca acontecia; agora que a semente e do servidor, corpo vazio e
// o caso normal do primeiro turno.
export function validateIntakeChatBody(
  body: unknown,
): IntakeChatBodyValidation {
  const rec = (body ?? {}) as { messages?: unknown };
  const raw = rec.messages;
  if (!Array.isArray(raw)) {
    return { ok: false, error: "invalid_request" };
  }

  const cleaned: IntakeChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as { role?: unknown; content?: unknown };
    const role =
      m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
    if (!role || typeof m.content !== "string") continue;
    if (!m.content.trim()) continue;
    cleaned.push({ role, content: m.content });
  }

  const semSemente = stripKickoff(cleaned);

  const totalChars = semSemente.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > MAX_BODY_CHARS) {
    return { ok: false, error: "payload_too_large" };
  }

  const userCount = semSemente.filter((m) => m.role === "user").length;
  if (userCount > MAX_USER_MESSAGES) {
    return { ok: false, error: "turn_limit" };
  }

  return {
    ok: true,
    messages: semSemente,
    userCount,
    restantes: MAX_USER_MESSAGES - userCount,
  };
}

// Normaliza o stackFocus proposto pelo modelo para respeitar o regex de
// RoadmapIntakeSchema (minusculas, numeros e hifen, ate 32 chars), espelhando a
// sanitizacao do input do client. Vazio apos normalizar vira null.
function normalizeStackFocus(raw: string | null): string | null {
  if (raw === null) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  return cleaned === "" ? null : cleaned;
}

// TODO(Ana): revisar e refinar toda a copy deste prompt (a fala do Natechinho no
// campo reply chega ao usuario).
export const INTAKE_CHAT_SYSTEM_PROMPT =
  "Você é o Natechinho, mentor de carreira tech do BoraNaTech, em voz masculina. Você conduz uma conversa curta em português do Brasil para montar o intake de um roadmap de estudos personalizado, com tom direto, acolhedor e sem condescendência. Você não gera o roadmap; quem gera é outra etapa. Aqui você só reúne e confirma o que a pessoa quer e o momento dela.\n\n" +
  "# Você já conhece a pessoa\n" +
  "O contexto abaixo do prompt traz o que a plataforma já sabe da pessoa (quiz de carreira, objetivo no perfil, trilhas em andamento, skills declaradas, ritmo real de estudo, análises de GitHub, LinkedIn e currículo, entrevistas). Nunca pergunte o que o contexto já responde: CONFIRME em vez de perguntar. Exemplo: se o contexto diz que o quiz apontou back-end e o objetivo de carreira fala em primeira vaga, diga algo como 'seu quiz apontou back-end e seu objetivo fala em primeira vaga, ainda é por aí ou mudou?' em vez de perguntar do zero. Nunca invente um fato que não esteja no contexto nem no que a pessoa disse.\n\n" +
  "# Como conduzir\n" +
  "Faça UMA pergunta objetiva por turno, nunca duas sobre assuntos diferentes. Siga o roteiro abaixo na ordem. Se uma resposta vier vaga ou genérica, REPERGUNTE UMA ÚNICA VEZ com uma pergunta mais concreta e, com o que a pessoa der, siga em frente para a próxima etapa. Nunca julgue a resposta da pessoa. Nunca prometa nem descreva o roadmap antes do fim da conversa.\n\n" +
  "# Roteiro (uma etapa por vez, nesta ordem)\n" +
  "1. Objetivo e por que agora. Confirme o objetivo usando o quiz e o objetivo de carreira do contexto quando existirem; pergunte o que mudaria na vida dela se der certo. Captura goal e motivation.\n" +
  "2. Ponto de partida honesto. O que ela já sabe de verdade, o que já tentou e onde travou. Se o contexto mostra trilhas em andamento ou skills declaradas, cite e peça confirmação em vez de perguntar do zero. Captura startingPoint.\n" +
  "3. Tempo real por semana. Se o contexto traz o ritmo dos últimos 30 dias, use como espelho honesto ('nos últimos 30 dias você estudou cerca de X por semana; dá pra manter, aumentar ou vai ser menos?'). Captura hoursPerWeek.\n" +
  "4. Prazo e o que está em jogo. Quando ela quer chegar lá e o que depende disso. Captura deadline e complementa motivation se aparecer algo novo.\n" +
  "5. Obstáculos. O que pode atrapalhar (jornada de trabalho, família, inglês fraco, máquina ruim, ansiedade com prazo). Captura constraints.\n" +
  "6. Foco de stack, só se fizer sentido para o objetivo. Se ela citar uma stack, normalize para minúsculas, números e hífen, no máximo 32 caracteres (ex: 'React e AWS' pode virar 'react'); se não fizer sentido ou ela não quiser, deixe stackFocus null. Captura stackFocus.\n" +
  "7. Resumo e confirmação. Resuma em 4 a 6 linhas o que você entendeu (objetivo, ponto de partida, tempo, prazo, obstáculos e foco) e peça confirmação. Só marque ready true no turno seguinte, depois que a pessoa confirmar o resumo.\n\n" +
  "# Valores dos campos de escolha (mapeie a fala da pessoa para um destes)\n" +
  "goal: 'primeira-vaga' (conquistar a primeira vaga), 'transicao' (mudar de carreira para tech), 'freela' (trabalhar como freelancer), 'aprofundar' (aprofundar na área atual).\n" +
  "hoursPerWeek: 'ate-5' (até 5h por semana), '5-10' (5 a 10h), '10-20' (10 a 20h), '20-mais' (mais de 20h).\n" +
  "deadline: '3m' (3 meses), '6m' (6 meses), '12m' (12 meses), 'sem-prazo' (sem prazo definido).\n\n" +
  "# Preenchimento do intake\n" +
  "A cada turno, preencha o objeto intake com o que você já sabe (do contexto ou do que a pessoa disse) e deixe null o que ainda não tem. Liste em missing os campos ainda em aberto. Os campos de escolha (goal, hoursPerWeek, deadline) devem ser exatamente um dos valores válidos acima; quando não souber, deixe null em vez de chutar. O campo format não existe aqui: nunca pergunte o formato de estudo, outra etapa assume o padrão.\n\n" +
  "# Orçamento da conversa\n" +
  "A cada turno você recebe uma linha dizendo quantas mensagens ainda restam nesta conversa. Esse número é um teto real: quando ele chega a zero a pessoa não consegue mais responder, então a conversa precisa ATERRISSAR antes disso, nunca ser interrompida no meio.\n" +
  `Quando restarem ${POUSO_SUAVE_RESTANTES} mensagens ou menos, pare de reperguntar: aceite o que já tem, deixe null o que não souber e vá direto para a etapa 7 (resumo e confirmação).\n` +
  "Quando restar 1 mensagem, apresente o resumo de forma que a única coisa que falte da pessoa seja confirmar, para que a confirmação caiba no último turno.\n" +
  "Nunca gaste as últimas mensagens com perguntas novas.\n\n" +
  "# Quando encerrar\n" +
  "ready só pode ser true quando goal, hoursPerWeek e deadline estiverem preenchidos, o ponto de partida e os obstáculos já tiverem sido conversados, E a pessoa tiver confirmado o resumo da etapa 7. Antes disso, ready é false. Nunca marque ready no mesmo turno em que mostra o resumo pela primeira vez.\n\n" +
  "# Escrita\n" +
  "Nunca use travessão nem meia-risca em nenhuma mensagem. Use ponto, vírgula ou parênteses. Hífen apenas em palavras compostas legítimas ou no foco de stack.";

interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IntakeChatAiIo {
  inputChars: number;
  outputChars: number;
  /**
   * USO MEDIDO da OpenAI, somado sobre TODAS as tentativas deste request.
   *
   * AUSENTE quando nenhuma resposta trouxe `usage`. Ausencia e ausencia: nao
   * existe `inputTokens: 0` aqui, porque zero seria uma medicao ("a chamada nao
   * consumiu nada") indistinguivel de "nao medi". Quem le decide entre o custo
   * por tokens e o fallback declarado por caracteres a partir DESTA distincao.
   *
   * SOMA POR REQUEST, e ela inclui as tentativas que FALHARAM depois de a
   * OpenAI responder (JSON invalido, schema reprovado). Elas foram cobradas do
   * mesmo jeito, e ate aqui sumiam da conta: o callback so disparava no sucesso.
   * E a mesma regra que o analisador de LinkedIn ja aplica desde a Fase 2.
   */
  uso?: { inputTokens: number; outputTokens: number };
}

// Monta o bloco de contexto do usuario no mesmo espirito do buildGenerationContext
// da geracao e do buildIntakeContext do careerPlan: fatos estruturados do
// fetchUserContextPool, sem inventar nada. O enquadramento e "confirme, nao
// pergunte": o modelo usa isso para nao repetir perguntas cuja resposta ja esta
// no contexto (etapas 1, 2 e 3 do roteiro).
async function buildIntakeContext(userId: string): Promise<string> {
  const pool = await fetchUserContextPool(userId);
  const lines: string[] = [];

  lines.push(
    "Contexto da pessoa na plataforma (fatos; confirme em vez de perguntar, nunca invente além disto):",
  );

  if (pool.quiz.ok && pool.quiz.data) {
    const quiz = pool.quiz.data;
    const parts = [
      quiz.area ? `área indicada ${quiz.area}` : null,
      quiz.level ? `nível ${quiz.level}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Quiz de carreira: ${parts.join(", ")}.`);
    }
  }

  if (pool.profile.ok && pool.profile.data) {
    const profile = pool.profile.data;
    if (profile.careerGoal) {
      lines.push(`- Objetivo de carreira no perfil: ${profile.careerGoal}`);
    }
    if (profile.headline) {
      lines.push(`- Headline do perfil: ${profile.headline}`);
    }
  }

  if (pool.courses.ok && pool.courses.data.length > 0) {
    for (const course of pool.courses.data) {
      lines.push(
        `- Trilha em andamento na plataforma: ${course.title ?? course.courseSlug}, ${course.completedItems} passos concluídos.`,
      );
    }
  }

  if (pool.skills.ok && pool.skills.data.length > 0) {
    const skills = pool.skills.data
      .map((s) => `${s.label} (${s.level})`)
      .join(", ");
    lines.push(`- Skills declaradas: ${skills}.`);
  }

  if (pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0) {
    const diary = pool.studyDiary.data;
    const weekly = Math.round((diary.totalMinutes30d / 30) * 7);
    lines.push(
      `- Ritmo real de estudo nos últimos 30 dias: ${diary.totalMinutes30d} minutos em ${diary.activeDays30d} dias ativos (média de cerca de ${weekly} minutos por semana).`,
    );
  }

  if (pool.roadmaps.ok && pool.roadmaps.data.length > 0) {
    for (const roadmap of pool.roadmaps.data) {
      lines.push(
        `- Roadmap concluído ou avançado: ${roadmap.title ?? roadmap.roadmapId}, ${roadmap.completedSteps} de ${roadmap.totalSteps ?? "?"} passos.`,
      );
    }
  }

  if (pool.github.ok && pool.github.data) {
    const gh = pool.github.data;
    if (typeof gh.score === "number") {
      lines.push(
        `- Análise de GitHub mais recente: nota ${gh.score}${gh.faixa ? `, faixa ${gh.faixa}` : ""}.`,
      );
    }
  }

  if (pool.linkedin.ok && pool.linkedin.data) {
    const li = pool.linkedin.data;
    if (typeof li.score === "number") {
      lines.push(
        `- Análise de LinkedIn mais recente: ${textoDaNotaLinkedin(li.score, li.faixa, li.notaIncompleta)}.`,
      );
    }
  }

  if (pool.resumeAnalysis.ok && pool.resumeAnalysis.data) {
    const ra = pool.resumeAnalysis.data;
    if (typeof ra.score === "number") {
      lines.push(
        `- Análise de currículo mais recente: nota ${ra.score}${ra.targetRole ? `, cargo alvo ${ra.targetRole}` : ""}.`,
      );
    }
  }

  if (pool.interview.ok && pool.interview.data) {
    const i = pool.interview.data;
    lines.push(
      `- Última entrevista simulada: área ${i.area ?? "não registrada"}, ${i.goodCount} de ${i.questionCount} respostas boas.`,
    );
  }

  return lines.join("\n");
}

async function callModelOnce(
  modelMessages: ModelMessage[],
  onIo: (io: IntakeChatAiIo) => void,
  acumulado: UsoAcumulado,
): Promise<IntakeChatTurn> {
  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: TOOL_CONFIG.model,
        temperature: TOOL_CONFIG.temperature,
        max_tokens: MAX_TOKENS,
        messages: modelMessages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "roadmap_intake_turn",
            strict: true,
            schema: INTAKE_CHAT_JSON_SCHEMA,
          },
        },
      }),
    },
    { service: "openai", timeoutMs: AI_TIMEOUT_MS },
  );

  if (!response.ok) {
    throw await erroDaRespostaOpenAi(response);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  // ANTES de qualquer reprova nossa: ver `somarUso`.
  somarUso(acumulado, payload.usage);
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A IA nao retornou conteudo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA nao veio em JSON valido: ${detail}.`);
  }

  const validation = IntakeChatTurnSchema.safeParse(parsed);
  if (!validation.success) {
    // SO OS CAMINHOS, nunca `message` nem `received`.
    //
    // A versao anterior mandava `JSON.stringify(issues)` inteiro, e o Zod
    // inclui ali o VALOR recebido em erro de enum e de tipo. Esse valor pode ser
    // a fala da pessoa, e a mensagem vai para o `console.error` do servidor.
    // Trocar por caminho de campo mantem o diagnostico (que campo o modelo
    // errou) e elimina a classe inteira de vazamento, no log e no banco.
    //
    // Motivo de existir: em 2026-08-03 sete turnos falharam com
    // `schema_mismatch` e o unico rastro era o codigo, sem dizer QUAL campo. Um
    // caminho sem rastro e um caminho que ninguem conserta, que e a licao da
    // fase 2 inteira. Ver docs/divida-fase2-roadmap-ia.md, item 10.
    const { campos, replyChars } = diagnosticoDeTurnoReprovado(
      parsed,
      validation.error.issues,
    );
    // `replyChars` fica AQUI e nao na mensagem: a mensagem vira codigo no banco
    // via classificarFalhaDeTurno, e comprimento la mataria a agregacao. No log
    // do servidor cardinalidade nao custa nada.
    console.error("[roadmap-ia] turno reprovado no schema", {
      campos,
      replyChars,
    });
    throw new Error(
      `Resposta da IA nao bateu com o schema: campos [${campos}]`,
    );
  }

  const inputChars = modelMessages.reduce(
    (acc, m) => acc + m.content.length,
    0,
  );
  onIo({
    inputChars,
    outputChars: content.length,
    uso: usoDoContrato(acumulado),
  });

  // Normaliza o stackFocus proposto para nao propor um intake que a geracao
  // (RoadmapIntakeSchema) rejeitaria pelo regex.
  const turn = validation.data;
  return {
    ...turn,
    intake: {
      ...turn.intake,
      stackFocus: normalizeStackFocus(turn.intake.stackFocus),
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Roda um turno do chat de intake: monta system prompt + contexto do usuario +
// historico e chama o modelo com retry/backoff no molde do careerPlan. Erro de
// parse/schema reprova a tentativa e entra no retry.
export async function runIntakeChatTurn(
  userId: string,
  messages: IntakeChatMessage[],
  onIo: (io: IntakeChatAiIo) => void,
  restantes: number = MAX_USER_MESSAGES,
): Promise<IntakeChatTurn> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  const context = await buildIntakeContext(userId);
  // A semente entra AQUI, sempre, e sempre na frente: o historico que chega ja
  // veio sem ela (stripKickoff), entao nao ha como duplicar, venha o corpo do
  // bundle novo ou do antigo.
  const modelMessages: ModelMessage[] = [
    { role: "system", content: INTAKE_CHAT_SYSTEM_PROMPT },
    { role: "system", content: context },
    // Orcamento numa mensagem PROPRIA e nao no system prompt: o prompt e
    // estatico e o numero muda a cada turno; separa-los mantem o prompt grande
    // identico entre chamadas.
    {
      role: "system",
      content: `Restam ${restantes} mensagens nesta conversa.`,
    },
    { role: "user", content: CHAT_KICKOFF },
    ...compressHistory(messages).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const acumulado = novoUsoAcumulado();
  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await callModelOnce(modelMessages, onIo, acumulado);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[roadmap-intake-chat] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      // Falha permanente da OpenAI (saldo esgotado, ou credencial invalida
      // num 401/403): a tentativa seguinte colhe exatamente o mesmo erro,
      // entao so custa um round-trip e o backoff. Rate limit e falha nao
      // classificada seguem retentando.
      if (isFalhaPermanente(err)) break;
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao rodar o turno do chat de intake.");
}
