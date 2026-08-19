import * as Sentry from "@sentry/node";

import { AREA_LABELS } from "../../shared/areas";
import {
  LINKEDIN_LEVEL_LABELS,
  LinkedinQualitativeSchema,
  MERCADO_LABELS,
  FAIXA_LABELS,
  QUALITATIVE_VERSION,
  DETERMINISTIC_VERSION,
  type LinkedinAnalysisResponse,
  type LinkedinAnalyzeRequest,
  type LinkedinDeterministicResult,
  type LinkedinMelhoria,
  type LinkedinQualitative,
} from "../../shared/linkedin/schema";
import { ENGLISH_TITLES, PT_TITLES } from "../../shared/linkedin/titles";
import { env } from "./env";
import { parseSkillsInput, runLinkedinChecks } from "./linkedinChecks";
import {
  numeraisSemLastro,
  removerNumeralSemLastro,
} from "../../shared/linkedin/numeralLastro";
import {
  removerTermoSemLastro,
  type TipoViolacao,
  type Violacao,
} from "../../shared/linkedin/lastro";
import {
  ALL_TECHNOLOGIES,
  keyTechnologiesForArea,
  matchTechnologies,
} from "./skillNormalize";
import { estimateCost, estimateCostFromTokens } from "./aiTools";
import { fetchWithTimeout, UpstreamTimeoutError } from "./http";
import {
  parseLinkedinText,
  type LinkedinParsed,
} from "../../shared/linkedin/parse";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "./openai";
import { erroDaRespostaOpenAi, isFalhaPermanente } from "./openaiFailure";
import { toOpenAIStrictSchema } from "./openaiStrictSchema";

/**
 * Orquestração do analisador de LinkedIn, no mesmo padrão de githubAnalyze.ts.
 *
 * Parse e checagens são determinísticos e produzem a nota. A IA só preenche a
 * parte qualitativa (diagnóstico e reescritas), recebendo as checagens já
 * calculadas como fatos. Perfil quase vazio usa um atalho caloroso sem IA.
 */

/**
 * Conteudo minimo de descricao para uma experiencia poder receber bullets.
 *
 * REVALIDADO na Fase 1B, depois que o B.1 foi corrigido. A justificativa
 * anterior ("meio do vao entre 39 e 56") estava contaminada: o 39 nao era uma
 * descricao curta, era o cabecalho da experiencia SEGUINTE engolido pelo bug.
 * Com o parser corrigido, a distribuicao real das 13 experiencias das 6
 * fixtures e:
 *
 *   0 caracteres .... 1 experiencia   (CTO, que de fato nao tem descricao)
 *   1 a 47 .......... 0 experiencias  <- vao SEM NENHUM DADO
 *   48 ou mais ...... 12 experiencias (a menor legitima tem 56)
 *
 * Ou seja: a unica fronteira que o corpus sustenta e zero contra nao-zero.
 * Qualquer valor entre 1 e 55 e igualmente sem evidencia, e o teto e 56, para
 * nao recusar a unica descricao curta real que existe.
 *
 * Por que manter um corte acima de zero, entao: os dois erros nao custam o
 * mesmo. Recusar bullets de uma descricao curta e real custa um bullet, e a
 * pessoa recebe no lugar uma melhoria dizendo como escrever a descricao, o que
 * e bom conselho para uma descricao de 30 caracteres. Aceitar uma descricao
 * curta demais custa um bullet inventado colado no LinkedIn de alguem, e a
 * verificacao determinista NAO pega esse caso: ela confere numeral e
 * tecnologia, e um bullet fabricado sem numero e sem stack passa limpo
 * (blindspot registrado em docs/rubrica-fidelidade.md, secao 8).
 *
 * 48 fica, agora com a justificativa certa: e conservador por escolha, com 8
 * caracteres de folga abaixo do unico dado real, e o vao que ele cobre esta
 * vazio no corpus. Se algum dia aparecer descricao legitima nessa faixa, este
 * numero muda com dado na mao, nao por gosto.
 */
const MIN_DESCRICAO_PARA_BULLETS = 48;

const SOBRE_LIMIT = 3000;
/**
 * Orçamento de caracteres do bloco de experiências no prompt.
 *
 * 4000 -> 6000 na Fase 2A. Medição que motivou: com o bloco já limpo pela 1A e
 * pela 1B, o perfil real ocupa 4040 caracteres, e a soma das 5 descrições com
 * cabeçalhos dá cerca de 4900. Em 4000 o alvo "bullets para toda experiência
 * com descrição própria" só era alcançável cortando as 5 descrições a 45% do
 * tamanho; em 6000 todas entram inteiras e ainda sobra folga.
 *
 * O que custa: 2000 caracteres a mais são cerca de 500 tokens de entrada, ou
 * US$ 0,000075 por análise ao preço do gpt-4o-mini, contra os US$ 0,001294 por
 * análise medidos em produção. Menos de 6% no pior caso, e só em perfil que
 * chega a encostar no teto.
 *
 * Por que o teto continua existindo: ele protege o caso patológico (perfil com
 * 20 experiências longas), onde o corte ainda acontece, agora repartido em vez
 * de por posição.
 */
const EXPERIENCIAS_LIMIT = 6000;

// Duas tentativas de 45s (pior caso ~90s + backoff), nao tres de 60s: fazer a
// pessoa esperar quase tres minutos para receber o mesmo erro so castiga. Melhor
// falhar rapido e deixar ela tentar de novo. Modelo e max_tokens ficam intactos.
const AI_MAX_ATTEMPTS = 2;
const AI_BACKOFF_MS = [400, 800];
const MAX_TOKENS = 4000;

const QUALITATIVE_JSON_SCHEMA = toOpenAIStrictSchema(LinkedinQualitativeSchema);

/** Texto não aproveitável: a rota transforma em 422. */
export class LinkedinUnreadableError extends Error {
  constructor() {
    super("Não foi possível ler o perfil a partir do texto enviado.");
    this.name = "LinkedinUnreadableError";
  }
}

/**
 * Resposta da IA cortada pelo teto de max_tokens (finish_reason "length").
 * Distinta de JSON malformado: aqui o JSON esta correto, só incompleto, e
 * repetir a chamada corta no mesmo lugar. A rota transforma em 502 com
 * mensagem propria.
 */
export class LinkedinTruncatedError extends Error {
  constructor() {
    super("A resposta da IA foi cortada pelo limite de tamanho.");
    this.name = "LinkedinTruncatedError";
  }
}

export const SYSTEM_PROMPT = `Você é um especialista sênior em LinkedIn para carreiras de tecnologia no Brasil, mentor da plataforma BoraNaTech. Seu público inclui iniciantes, profissionais intermediários e profissionais experientes. Seu trabalho é interpretar uma análise já calculada e reescrever as partes do perfil para que ele seja encontrado por recrutadores e receba mensagens.

REGRA DOS FATOS: as checagens automáticas confirmadas e as listas de palavras-chave encontradas e faltantes que você vai receber já foram calculadas e são fatos. Quando a leitura estiver marcada como incompleta, os checks pendentes e a nota/faixa são provisórios, não fatos definitivos. Você não reavalia nem recalcula a nota, não contradiz as checagens confirmadas e não inventa informações que não estão no perfil. Se o perfil não menciona algo, você não pode afirmar que a pessoa sabe aquilo. Nas sugestões de skills, proponha apenas o que é plausível a partir do que o perfil já evidencia, e deixe claro que a pessoa só deve adicionar o que realmente sabe.

DIVERGÊNCIA ENTRE CHECAGEM E TEXTO (válvula da regra dos fatos): as checagens são automáticas e podem estar erradas em um caso específico. Se o texto do perfil contradisser uma checagem de forma verificável, aponte a divergência em vez de repetir a checagem. Exemplo: se uma checagem disser que as experiências têm descrição, mas houver no texto uma experiência sem nenhuma descrição própria, diga isso e cite qual. Isso não é recalcular a nota nem discutir a checagem: é relatar o que você está vendo no texto. Na dúvida, siga a checagem.

TECNOLOGIA SÓ COM LASTRO: em bulletsReescritos, você só pode nomear uma tecnologia dentro do bullet de uma experiência se ela aparecer no texto DAQUELA experiência. Tecnologia que aparece no Sobre, na headline ou em OUTRA experiência não vale como lastro para esta. Se o texto da experiência não nomeia a stack, escreva o bullet sem tecnologia nenhuma, descrevendo o que foi feito e o resultado. É melhor um bullet sem stack do que um bullet com stack inventada.

EXPERIÊNCIA SEM DESCRIÇÃO: se uma experiência vier marcada como SEM DESCRIÇÃO PRÓPRIA NO PERFIL, não escreva bullets para ela em hipótese nenhuma. Não há o que reescrever: qualquer bullet ali seria inventado por você. Em vez disso, inclua uma melhoria nomeando essa experiência e dizendo como escrever a descrição dela.

EXPERIÊNCIA COM DESCRIÇÃO CURTA DEMAIS: se uma experiência vier marcada como DESCRIÇÃO CURTA DEMAIS PARA REESCREVER, também não escreva bullets para ela. A diferença para o caso acima é que aqui existe texto, e ele vem transcrito na marcação: use esse texto para escrever uma melhoria específica, citando o que a pessoa já escreveu e dizendo o que falta acrescentar. Não trate essa experiência como vazia, porque ela não está.

NÚMERO DA EXPERIÊNCIA (REGRA DURA): a lista de experiências que você recebe é numerada. Todo bloco de bulletsReescritos tem de trazer, no campo experienciaNumero, o número da experiência a que os bullets se referem, copiado daquela lista. Só valem números que estão nela. Bloco com número que não existe é descartado inteiro pela plataforma, então inventar um número não faz o texto passar, só faz o trabalho ser jogado fora. Não escreva bloco para experiência marcada como SEM DESCRIÇÃO PRÓPRIA NO PERFIL nem como DESCRIÇÃO CURTA DEMAIS PARA REESCREVER. O campo contexto continua sendo o título que a pessoa lê acima dos bullets, mas quem manda na atribuição é o número.

NÚMERO NÃO MUDA DE DONO: métricas, percentuais e volumes só podem ser reescritos com o MESMO sujeito e o MESMO recorte que têm no perfil. Se o texto diz que uma técnica específica reduziu a latência em uma situação específica, não atribua esse número ao projeto inteiro, a outra técnica, nem a outra métrica. Na dúvida sobre a que o número se refere, escreva o bullet sem o número.

CAMPOS PARA COLAR SÓ COM O QUE EXISTE: headlines, sobreReescrito e bulletsReescritos só podem citar tecnologias que aparecem no perfil. As tecnologias marcadas como SEM NENHUMA evidência no perfil não entram em nenhum texto para colar: elas só podem aparecer em skillsParaEstudar, escolhidas daquela lista e escritas exatamente como aparecem nela. A lista de tecnologias que o perfil comprova e que faltam nas competências já vem calculada e é exibida pela plataforma: você não a reescreve nem a repete como lista, no máximo comenta na prosa.

COMO RECRUTADORES BUSCAM: recrutadores usam o LinkedIn Recruiter com buscas por cargo atual, cargos anteriores, competências cadastradas e palavras-chave booleanas. Os campos que mais pesam na busca são a headline, os títulos das experiências e a seção de competências. O texto do Sobre é indexado, mas pesa menos. Por isso o cargo-alvo precisa aparecer literalmente na headline e em pelo menos um título de experiência, e as tecnologias precisam estar escritas por extenso no perfil, em português e quando fizer sentido também em inglês.

MERCADO-ALVO: o usuário informa se busca trabalho no Brasil, no exterior ou nos dois. Recrutadores internacionais buscam em inglês, então para mercado exterior a headline, os títulos de experiência, as competências e o Sobre devem estar em inglês, e todas as suas reescritas devem ser em inglês. Para o mercado Brasil, as reescritas são em português, mas o cargo na headline pode ser em inglês porque é assim que se busca em tecnologia. Para quem busca os dois mercados, a regra é: headline com cargo e tecnologias em inglês, Sobre em português com um parágrafo final em inglês resumindo perfil e disponibilidade, e bullets de experiência em português com termos técnicos em inglês. Quando o mercado for exterior ou ambos, inclua nas melhorias: configurar o Open to Work com vagas remotas e os países desejados, mencionar o nível de inglês com honestidade e o fuso horário no Sobre, e considerar o recurso de perfil secundário em outro idioma do LinkedIn. O modelo de mensagem para recrutador deve estar em inglês quando o mercado for exterior, e em português nos demais casos.

IDIOMA DA SAÍDA (REGRA DURA): o idioma de cada campo do JSON segue esta tabela, sem exceção. Campos de texto para colar no perfil seguem o mercado-alvo: com mercado exterior, headlines, sobreReescrito, bulletsReescritos e modeloMensagemRecrutador saem em INGLÊS; com mercado Brasil, esses mesmos campos saem em português (só o cargo na headline pode ficar em inglês) e modeloMensagemRecrutador em português; com mercado ambos, valem as regras de mistura do parágrafo MERCADO-ALVO e modeloMensagemRecrutador em português. Já resumo, pontosFortes, pontosFracos, melhorias e proximoPasso são a conversa da plataforma com o usuário, não texto para colar: ficam SEMPRE em português do Brasil, para qualquer mercado.

FÓRMULA DA HEADLINE: cargo-alvo, separador de barra vertical, 2 a 4 tecnologias principais, separador, um diferencial curto ou contexto honesto (por exemplo: em transição de carreira, foco em back-end, construindo projetos open source). Nada de frases como apaixonado por tecnologia ou em busca de oportunidades. A headline aparece em toda busca e em todo comentário, é o campo mais valioso do perfil.

ESTRUTURA DO SOBRE: primeira linha é um gancho de até 140 caracteres, porque é o que aparece antes do ver mais. Depois um parágrafo de prova concreta com projetos, contexto e o que a pessoa já construiu. Depois a stack escrita por extenso em texto corrido, porque isso é indexado. Fecha com um convite claro ao contato, mencionando o tipo de oportunidade buscada.

EXPERIÊNCIAS PARA INICIANTES: quem não tem experiência formal deve cadastrar projetos próprios como experiência, com título honesto (por exemplo: Desenvolvedor Back-end, Projeto pessoal) e descrição em bullets. Cada bullet segue verbo de ação no passado, o que foi feito, com qual tecnologia, e resultado ou métrica quando existir. Isso é prática legítima e recomendada, não é mentira, desde que descreva trabalho real.

CALIBRAGEM DE TOM: quando a leitura estiver completa, a nota e a faixa ajudam a calibrar o estágio do perfil. Faixa início pede acolhimento e foco nos 3 passos de maior impacto, sem soterrar a pessoa. Faixa em construção pede reconhecimento do que existe e direção objetiva. Faixas forte e magnético pedem refinamento fino e ambição. Se a nota estiver marcada como provisória, NÃO elogie, critique nem calibre fortemente o tom por ela ou pela faixa; use somente as evidências confirmadas do perfil. Sempre direto, encorajador e concreto, nunca condescendente.

SENIORIDADE E SELETOR, NOS DOIS SENTIDOS: o nível escolhido no formulário é contexto inicial de linguagem, nunca teto nem autorização para reduzir ou inflar a senioridade. Use as evidências do próprio perfil, como anos de atuação, cargos, responsabilidade por arquitetura, liderança, escopo e impacto, para calibrar a profundidade. Se a pessoa marcou Pleno ou Júnior, mas o perfil comprova atuação experiente, não a trate como iniciante nem a rebaixe artificialmente. Se marcou Júnior e o perfil não comprova senioridade superior, não a chame de sênior, especialista ou líder. Nunca atribua cargo, escopo ou liderança que o perfil não evidencia. O perfil comprovado define ao mesmo tempo o piso e o teto da senioridade usada na resposta.

ESTILO: português do Brasil. Proibido travessão e meia-risca, use ponto, vírgula ou parênteses. Sem emojis. Textos reescritos prontos para copiar e colar, na primeira pessoa quando for texto do perfil do usuário.

QUANTIDADES OBRIGATÓRIAS: de 3 a 5 pontosFortes, de 3 a 5 pontosFracos e de 4 a 7 melhorias. Em cada melhoria, comoFazer tem de 2 a 4 frases, começando por um primeiro passo executável HOJE e citando o campo do perfil quando aplicável (headline, Sobre, competências, experiências). proximoPasso: preencha SEMPRE, escolhendo entre as melhorias de prioridade alta a ÚNICA ação de maior impacto que a pessoa consegue executar hoje, concreta e específica ao perfil analisado.

Responda apenas com o JSON do schema.`;
// TODO(Ana): revisar o bloco de quantidades e proximoPasso do prompt.

/**
 * Desfecho de UMA tentativa de chamada a OpenAI, com nome proprio.
 *
 * Cada nome corresponde a um ponto de saida real de `runQualitativeOnce`, e a
 * lista existe para o painel poder responder "o que custou e nao entregou".
 * `nao_classificado` nao deve acontecer: ele cobre um caminho de saida futuro
 * que alguem esqueca de rotular, e existe para aparecer como lacuna em vez de
 * se disfarcar de `rede`, que seria um diagnostico plausivel e errado.
 */
export type DesfechoTentativa =
  | "sucesso"
  | "json_invalido"
  | "schema_invalido"
  | "truncada"
  | "sem_conteudo"
  | "http_erro"
  | "timeout"
  | "rede"
  | "nao_classificado";

/**
 * Por que nao houve `usage`. E o estado NOMEADO que substitui o zero.
 *
 *   - `sem_resposta`: a tentativa nao chegou a receber corpo (timeout, rede);
 *   - `corpo_de_erro`: a OpenAI respondeu nao-ok, e corpo de erro dela nao
 *     carrega `usage`;
 *   - `ausente_no_corpo`: veio 200, mas sem o objeto `usage`.
 */
export type MotivoSemUso =
  | "sem_resposta"
  | "corpo_de_erro"
  | "ausente_no_corpo";

/**
 * Tokens de uma tentativa: ou MEDIDOS, ou indisponiveis com motivo.
 *
 * Uniao discriminada, e nao dois numeros com zero de sentinela, porque era
 * exatamente essa a confusao antiga: `inputTokens: 0` significava tanto "a
 * OpenAI nao mandou usage" quanto "custou zero", e nenhum consumidor tinha como
 * separar os dois. Mesma familia do `contarLinhas` devolvendo -1 registrada no
 * CLAUDE.md, onde falha de medicao virava numero plausivel.
 */
export type UsoDaTentativa =
  | { medido: true; inputTokens: number; outputTokens: number }
  | { medido: false; motivo: MotivoSemUso };

/**
 * Evento de contabilizacao de UMA tentativa.
 *
 * Ate a Fase 2 este evento nascia uma unica vez, depois do JSON valido e do Zod
 * valido, entao toda tentativa que falhou era gratuita aos olhos do painel: a
 * tentativa 1 invalida sumia atras da 2 valida, e duas tentativas falhas viravam
 * uma linha de erro sem token nenhum, no exato caso em que se pagou duas vezes.
 * Agora o evento nasce por tentativa, no ponto em que o desfecho e conhecido.
 */
export interface AnalyzeAiIo {
  /** 1-based, na ordem em que as tentativas aconteceram. */
  tentativa: number;
  desfecho: DesfechoTentativa;
  inputChars: number;
  /** Ausente quando a tentativa nao chegou a receber conteudo do modelo. */
  outputChars?: number;
  uso: UsoDaTentativa;
}

/**
 * O mesmo evento enquanto esta sendo PREENCHIDO, dentro da tentativa.
 *
 * `desfecho: null` e o estado inicial e nao vaza para fora: quem emite converte
 * em `nao_classificado`. O registro e criado pelo LACO e nao pela funcao da
 * tentativa, de proposito: assim ele existe mesmo quando a tentativa morre
 * antes da primeira linha util, e o `finally` do laco garante um evento por
 * tentativa por construcao, sem depender de alguem lembrar de emitir em cada
 * um dos sete pontos de saida.
 */
interface RegistroDaTentativa {
  tentativa: number;
  desfecho: DesfechoTentativa | null;
  inputChars: number;
  outputChars?: number;
  uso: UsoDaTentativa;
}

/**
 * Teto do texto da trilha gravado em `ai_usage_logs.error_message`. A coluna e
 * `text` e nao tem limite no Postgres, entao isto e higiene de log, no mesmo
 * espirito do `ZOD_ISSUES_LOG_MAX` de `server/routes/ai.ts`. Com o teto atual
 * de duas tentativas a trilha tem cerca de 60 caracteres.
 */
const TRILHA_LOG_MAX = 500;

/** O que a rota grava em `ai_usage_logs`, somado sobre TODAS as tentativas. */
export interface CamposDeUsoDaAnalise {
  /** Quantas tentativas alcancaram a OpenAI. Zero no atalho sem IA. */
  tentativas: number;
  inputChars: number;
  outputChars: number;
  /** Soma dos tokens MEDIDOS. Ver `tokensMedidos` antes de ler como custo. */
  inputTokens: number;
  outputTokens: number;
  /** Houve ao menos uma tentativa com `usage` de verdade. */
  tokensMedidos: boolean;
  costEstimate: number;
  /** Desfecho e tokens de cada tentativa, para o campo de texto do log. */
  trilha: string;
}

/** `9999/888`, ou o motivo nomeado de nao haver medicao. */
function tokensNaTrilha(uso: UsoDaTentativa): string {
  return uso.medido
    ? `${uso.inputTokens}/${uso.outputTokens}`
    : `sem tokens (${uso.motivo})`;
}

/**
 * Fecha a conta da analise inteira a partir dos eventos por tentativa.
 *
 * Uma funcao so, chamada pelos DOIS ramos da rota (sucesso e catch), porque a
 * linha de erro precisa carregar exatamente os mesmos totais da linha de
 * sucesso. Duas formulas para o mesmo fato divergem na primeira mudanca de
 * criterio, e o ramo de erro e justamente o que ninguem olha.
 *
 * REGRA DO CUSTO, em tres degraus, do mais medido ao menos:
 *   1. algum `usage` medido: conta pelos tokens somados, que e o dado exato;
 *   2. nenhum `usage`, mas houve conteudo de saida: cai na estimativa por
 *      chars, que e o fallback que ja existia no caminho de sucesso;
 *   3. nenhum dos dois (timeout, 401): custo ZERO e a trilha dizendo por que.
 *      Estimar por chars aqui inventaria um numero: nao se sabe se a OpenAI
 *      chegou a processar a chamada, e numero plausivel e pior que lacuna.
 */
export function camposDeUsoDaAnalise(
  tentativas: readonly AnalyzeAiIo[],
  model: string = DEFAULT_MODEL,
): CamposDeUsoDaAnalise {
  let inputChars = 0;
  let outputChars = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let tokensMedidos = false;
  const partes: string[] = [];

  for (const t of tentativas) {
    inputChars += t.inputChars;
    outputChars += t.outputChars ?? 0;
    if (t.uso.medido) {
      tokensMedidos = true;
      inputTokens += t.uso.inputTokens;
      outputTokens += t.uso.outputTokens;
    }
    partes.push(`${t.tentativa} ${t.desfecho} ${tokensNaTrilha(t.uso)}`);
  }

  const costEstimate = tokensMedidos
    ? estimateCostFromTokens(inputTokens, outputTokens, model)
    : outputChars > 0
      ? estimateCost(inputChars, outputChars, model)
      : 0;

  return {
    tentativas: tentativas.length,
    inputChars,
    outputChars,
    inputTokens,
    outputTokens,
    tokensMedidos,
    costEstimate,
    trilha:
      tentativas.length === 0
        ? ""
        : `tentativas: ${tentativas.length} | ${partes.join("; ")}`.slice(
            0,
            TRILHA_LOG_MAX,
          ),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n... (texto truncado em ${limit} caracteres)`;
}

function checksBlock(deterministic: LinkedinDeterministicResult): string {
  return deterministic.checks
    .map((check) =>
      check.pendente
        ? `- [pendente] ${check.label}: não foi possível confirmar este critério com a headline extraída.`
        : `- [${check.aprovado ? "aprovado" : "reprovado"}] ${check.label}: ${check.detail}`,
    )
    .join("\n");
}

/**
 * Estado da descricao de uma experiencia.
 *
 * Zero e curto sao coisas diferentes e recebem tratamento diferente: "vazia" e
 * um fato do perfil (a pessoa nao escreveu nada) e "curta" e um julgamento
 * nosso sobre quantidade de texto. Antes os dois caiam na mesma copy, que
 * dizia "sem descricao propria" para uma experiencia que tinha descricao.
 */
type EstadoDescricao = "vazia" | "curta" | "suficiente";

export function estadoDescricao(
  exp: LinkedinParsed["experiencias"][number],
): EstadoDescricao {
  const n = exp.descricao.trim().length;
  if (n === 0) return "vazia";
  return n >= MIN_DESCRICAO_PARA_BULLETS ? "suficiente" : "curta";
}

/** A experiencia tem descricao propria suficiente para sustentar bullets? */
function temConteudoParaBullets(
  exp: LinkedinParsed["experiencias"][number],
): boolean {
  return estadoDescricao(exp) === "suficiente";
}

const MARCA_CORTE = "\n(descrição cortada pelo limite do prompt)";

/**
 * Reparte um orçamento de caracteres entre descrições, sem deixar nenhuma zerada.
 *
 * Water-filling: quem já cabe na cota leva o tamanho inteiro e devolve a sobra
 * ao bolo; quem não cabe divide o que restou. Uma descrição curta não desperdiça
 * cota, e uma descrição gigante não engole as outras.
 */
function repartirOrcamento(disponivel: number, tamanhos: number[]): number[] {
  const cotas = new Array<number>(tamanhos.length).fill(0);
  let restante = Math.max(disponivel, 0);
  let abertos = tamanhos.map((_, i) => i);
  while (abertos.length > 0) {
    const cota = Math.floor(restante / abertos.length);
    const cabem = abertos.filter((i) => tamanhos[i] <= cota);
    if (cabem.length === 0) {
      for (const i of abertos) cotas[i] = cota;
      break;
    }
    for (const i of cabem) {
      cotas[i] = tamanhos[i];
      restante -= tamanhos[i];
    }
    abertos = abertos.filter((i) => tamanhos[i] > cota);
  }
  return cotas;
}

/**
 * Uma experiencia exatamente como ela chega ao modelo.
 *
 * FONTE UNICA da numeracao, do intervalo valido e do texto enviado. O prompt
 * renderiza esta lista e o lastro valida contra ela; nao existe uma segunda
 * derivacao do mesmo fato.
 *
 * Ate a Fase 2 a numeracao vivia dentro de `experienciasBlock` e o lastro
 * reencontrava a experiencia por sobreposicao de tokens entre o `contexto`
 * escrito pelo modelo e `titulo + empresa`. Duas derivacoes independentes do
 * mesmo fato erram em direcoes diferentes, e esta errava em tres: bloco cujo
 * contexto nao casava com nada voltava INTACTO (unico caminho em que conteudo
 * inteiramente fabricado chegava ao usuario), empate escolhia a primeira
 * experiencia em silencio, e dois cargos iguais em empresas diferentes so se
 * distinguiam se o modelo tivesse escrito a empresa no contexto.
 */
export interface ExperienciaNumerada {
  /** 1-based. E o mesmo numero que o prompt mostra e que o bloco devolve. */
  numero: number;
  experiencia: LinkedinParsed["experiencias"][number];
  estado: EstadoDescricao;
  /** `1. Cargo (Empresa)`, a linha que o modelo le. */
  cabecalho: string;
  /**
   * Corpo enviado ao modelo, JA com o corte de EXPERIENCIAS_LIMIT aplicado.
   * Em `vazia` e `curta` e a marcacao, nao a descricao: esses estados nao
   * sustentam bullet nenhum e o bloco correspondente e descartado.
   */
  corpo: string;
}

/**
 * Texto que serve de lastro para os bullets desta experiencia.
 *
 * E o que o modelo VIU, nao a descricao inteira do perfil: numeral que ficou
 * fora do prompt por corte de orcamento nao pode lastrear nada, porque o
 * modelo nao teve como le-lo. Hoje nenhuma das seis fixtures chega perto do
 * teto (a maior da 4905 de 6000), entao a escolha e inerte na pratica e so
 * fecha o caso patologico.
 */
export function origemDoLastro(item: ExperienciaNumerada): string {
  return `${item.experiencia.titulo} ${item.corpo}`;
}

// Exportada para teste: daqui saem o texto exato que chega ao modelo E o
// intervalo de numeros que o lastro aceita. As tres marcacoes (vazia, curta,
// suficiente) so tem valor se forem verificaveis.
export function listaDeExperiencias(
  parsed: LinkedinParsed,
): ExperienciaNumerada[] {
  const partes = parsed.experiencias.map((exp, index) => {
    // Cargo e empresa vêm separados do parser. Aqui eles voltam a aparecer
    // juntos, mas atribuídos ao bloco certo: antes a empresa caía na
    // descrição da experiência ANTERIOR e o modelo tinha que reassociar
    // sozinho o que o parser bagunçava.
    const cargo = exp.titulo || "(sem título)";
    const titulo = exp.empresa ? `${cargo} (${exp.empresa})` : cargo;
    // Marcada explicitamente para o modelo. Vazia e curta sao marcacoes
    // distintas: na vazia nao ha texto nenhum, na curta ha texto e o modelo
    // precisa saber que ele existe para poder cita-lo na melhoria.
    const estado = estadoDescricao(exp);
    const cabecalho = `${index + 1}. ${titulo}`;
    const comum = { numero: index + 1, experiencia: exp, estado, cabecalho };
    if (estado === "vazia") {
      return {
        ...comum,
        corpo:
          "(SEM DESCRIÇÃO PRÓPRIA NO PERFIL: não escreva bullets para esta experiência)",
        cortavel: false,
      };
    }
    if (estado === "curta") {
      return {
        ...comum,
        corpo: `(DESCRIÇÃO CURTA DEMAIS PARA REESCREVER, transcrita aqui só como contexto: "${exp.descricao}". Não escreva bullets para esta experiência: o que existe não sustenta um bullet sem você completar o que não está escrito)`,
        cortavel: false,
      };
    }
    return { ...comum, corpo: exp.descricao, cortavel: true };
  });

  const comCorpos = (corpos: string[]): ExperienciaNumerada[] =>
    partes.map(({ cortavel: _cortavel, ...item }, i) => ({
      ...item,
      corpo: corpos[i],
    }));

  const tamanhoDoBloco = (corpos: string[]) =>
    partes.reduce(
      (soma, p, i) => soma + p.cabecalho.length + 1 + corpos[i].length,
      0,
    ) +
    Math.max(partes.length - 1, 0) * 2;

  const originais = partes.map((p) => p.corpo);
  if (tamanhoDoBloco(originais) <= EXPERIENCIAS_LIMIT)
    return comCorpos(originais);

  // ORÇAMENTO ESTOURADO. O corte antigo era um `slice` no fim do texto, o que
  // significa: as experiências mais antigas somem inteiras, sem cabeçalho, sem
  // nada, e o modelo não escreve bullet para o que não viu. Era isso que fazia
  // só 3 das 6 experiências do perfil real receberem bullets (rodada 2, E.5).
  //
  // Critério novo, declarado: nenhuma experiência desaparece. Todos os
  // cabeçalhos entram, todas as marcações de vazia e curta entram inteiras
  // (são curtas e carregam instrução), e o que sobra do orçamento é repartido
  // entre as descrições. Cortar por igual custa detalhe do fim de uma descrição
  // longa; cortar por posição custava a experiência inteira.
  const cortaveis = partes
    .map((p, i) => (p.cortavel ? i : -1))
    .filter((i) => i >= 0);
  const fixo =
    partes.reduce(
      (soma, p, i) =>
        soma +
        p.cabecalho.length +
        1 +
        (p.cortavel ? MARCA_CORTE.length : p.corpo.length),
      0,
    ) +
    (partes.length - 1) * 2;
  const cotas = repartirOrcamento(
    EXPERIENCIAS_LIMIT - fixo,
    cortaveis.map((i) => partes[i].corpo.length),
  );
  const corpos = partes.map((p) => p.corpo);
  cortaveis.forEach((idx, k) => {
    const cota = Math.max(cotas[k], 0);
    if (partes[idx].corpo.length > cota) {
      corpos[idx] =
        `${partes[idx].corpo.slice(0, cota).trimEnd()}${MARCA_CORTE}`;
    }
  });
  return comCorpos(corpos);
}

/** O bloco de experiências do prompt, renderizado da lista numerada única. */
export function experienciasBlock(parsed: LinkedinParsed): string {
  const lista = listaDeExperiencias(parsed);
  if (lista.length === 0) return "(nenhuma experiência detectada)";
  return lista.map((item) => `${item.cabecalho}\n${item.corpo}`).join("\n\n");
}

// Exportada para teste: e o unico lugar onde SOBRE_LIMIT e observavel, e um
// limiar que nenhum teste alcancava era exatamente o buraco da Fase 1B-bis.
export function buildUserPrompt(
  request: LinkedinAnalyzeRequest,
  parsed: LinkedinParsed,
  deterministic: LinkedinDeterministicResult,
): string {
  const area = request.area;
  const label = AREA_LABELS[area];
  const marketTitles =
    request.mercado === "brasil"
      ? [...PT_TITLES[area], ...ENGLISH_TITLES[area]]
      : ENGLISH_TITLES[area];

  const objetivoBlock = request.objetivo?.trim()
    ? [`Objetivo do usuário: ${request.objetivo.trim()}`, ""]
    : [];

  // Calculado em linkedinChecks (subtracao de conjuntos), nao pedido ao modelo.
  const comprovadasForaDasCompetencias =
    deterministic.skillsParaAdicionarAgora ?? [];

  const sinais = [
    `foto profissional: ${request.foto}`,
    `banner personalizado: ${request.banner}`,
    `open to work: ${request.openToWork}`,
    `faixa de conexões: ${request.conexoes}`,
    `frequência de atividade: ${request.atividade}`,
  ].join(", ");

  return [
    `Área alvo: ${label}.`,
    `Cargos da área (referência de busca): ${marketTitles.join(", ")}.`,
    `Títulos de busca em inglês da área: ${ENGLISH_TITLES[area].join(", ")}.`,
    `Nível do usuário: ${LINKEDIN_LEVEL_LABELS[request.level]}.`,
    `Mercado alvo: ${MERCADO_LABELS[request.mercado]}.`,
    "",
    ...objetivoBlock,
    // ANTES do bloco de checagens, e nao junto de cada item. O modelo forma a
    // leitura enquanto le os checks; instrucao no meio da lista chega tarde, e
    // marcar item a item convida a comentar item a item, que e o oposto do que
    // se quer. Ordem de apresentacao como parte do contrato, nao formatacao.
    //
    // CONDICIONAL: so entra quando a leitura esta em duvida. Se valesse sempre,
    // a IA pararia de diagnosticar headline nos ~82% em que a leitura esta boa,
    // e isso seria uma piora maior que o problema. `linkedinPromptPendente.test.ts`
    // afirma as duas condicoes.
    ...(deterministic.notaIncompleta === true
      ? [
          "LEITURA DA HEADLINE: em dúvida. O texto que extraímos pode estar cortado.",
          `A nota ${deterministic.score} e a faixa ${FAIXA_LABELS[deterministic.faixa]} abaixo são PROVISÓRIAS e NÃO podem ser apresentadas ao usuário como avaliação definitiva. Não diga \"sua nota é\", não elogie nem critique a faixa e não calibre fortemente o tom por esses valores.`,
          "Por isso: NÃO afirme nada sobre o que a headline atual contém ou deixa de conter (não diga que falta stack, que está curta, que não tem cargo, nem elogie o que ela tem). Sugira uma headline nova normalmente, justificando pela área, pelo nível e pelas competências, nunca por comparação com a atual. E não mencione ao usuário que a leitura falhou: isso é estado do sistema, não conselho de carreira.",
          "",
        ]
      : []),
    "Checagens automáticas já calculadas (são fatos, não reavalie nem contradiga):",
    checksBlock(deterministic),
    "",
    deterministic.notaIncompleta === true
      ? `Nota determinística provisória, a confirmar: ${deterministic.score} de 100 (faixa provisória ${FAIXA_LABELS[deterministic.faixa]}). Não recalcule nem apresente como definitiva.`
      : `Nota determinística já calculada: ${deterministic.score} de 100 (faixa ${FAIXA_LABELS[deterministic.faixa]}). Não recalcule a nota.`,
    "",
    `Palavras-chave da área encontradas no perfil: ${
      deterministic.keywordsEncontradas.join(", ") || "nenhuma"
    }.`,
    // A lista de faltantes ia crua para o modelo e era lida como lista de
    // tarefas: as duas execucoes de controle mandaram o usuario anunciar
    // Next.js e Tailwind na headline sem ele nunca ter usado nenhum dos dois.
    // Separar por EVIDENCIA resolve na origem: o que ele comprova no perfil e
    // sugestao legitima de competencia, o resto e no maximo estudo futuro.
    `Tecnologias que o perfil COMPROVA e que estão fora das competências cadastradas (JÁ CALCULADO, a plataforma mostra esta lista sozinha; você NÃO a reescreve, apenas pode comentá-la na prosa): ${
      comprovadasForaDasCompetencias.join(", ") || "nenhuma"
    }.`,
    `Tecnologias da área SEM NENHUMA evidência no perfil (é DESTA lista, e só dela, que sai skillsParaEstudar): ${
      deterministic.keywordsFaltantes.join(", ") || "nenhuma"
    }.`,
    "",
    `Headline efetiva da análise: ${deterministic.headline ?? "(não detectada)"}`,
    "",
    "Sobre (texto cru, pode estar truncado):",
    parsed.sobre ? truncate(parsed.sobre, SOBRE_LIMIT) : "(sem seção Sobre)",
    "",
    // O rótulo declara a numeração no mesmo lugar em que ela aparece. A lista
    // e o intervalo que o lastro aceita saem os dois de `listaDeExperiencias`.
    `Experiências (texto cru, pode estar truncado). A lista é numerada de 1 a ${listaDeExperiencias(parsed).length}, e cada bloco de bulletsReescritos tem de devolver esse número em experienciaNumero:`,
    experienciasBlock(parsed),
    "",
    `Competências coladas pelo usuário: ${request.skills.trim() || "(nenhuma)"}.`,
    `Respostas do formulário de sinais: ${sinais}.`,
  ].join("\n");
}

/** Le `usage` da resposta. Ausencia vira motivo nomeado, nunca zero. */
function usoDoPayload(usage?: {
  prompt_tokens?: number;
  completion_tokens?: number;
}): UsoDaTentativa {
  const entrada = usage?.prompt_tokens;
  const saida = usage?.completion_tokens;
  if (typeof entrada !== "number" || typeof saida !== "number") {
    return { medido: false, motivo: "ausente_no_corpo" };
  }
  return { medido: true, inputTokens: entrada, outputTokens: saida };
}

/**
 * Emite o evento da tentativa. Blindado: telemetria de custo nao pode derrubar
 * a analise que ela existe para medir, entao a falha do consumidor vira aviso.
 * Guarda DENTRO da funcao, e nao em cada chamador, pelo motivo do CLAUDE.md.
 */
function emitirTentativa(
  registro: RegistroDaTentativa,
  onAiIo?: (io: AnalyzeAiIo) => void,
): void {
  if (!onAiIo) return;
  try {
    onAiIo({
      tentativa: registro.tentativa,
      desfecho: registro.desfecho ?? "nao_classificado",
      inputChars: registro.inputChars,
      outputChars: registro.outputChars,
      uso: registro.uso,
    });
  } catch (err) {
    console.warn(
      "[linkedin-analyze] falha ao contabilizar a tentativa:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * UMA tentativa. Ela nao emite nada: PREENCHE `registro` a medida que os fatos
 * ficam conhecidos (o `usage` assim que o corpo e lido, o desfecho na linha
 * imediatamente anterior a cada saida), e quem emite e o `finally` do laco.
 *
 * O usage NAO viaja dentro da excecao: erro continua sendo erro, e o dado de
 * custo continua sendo dado, gravado onde foi medido.
 */
async function runQualitativeOnce(
  userText: string,
  registro: RegistroDaTentativa,
): Promise<LinkedinQualitative> {
  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.5,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "linkedin_qualitative",
            strict: true,
            schema: QUALITATIVE_JSON_SCHEMA,
          },
        },
      }),
    },
    { service: "openai", timeoutMs: 45_000 },
  );

  if (!response.ok) {
    // Corpo de erro da OpenAI nao traz `usage`, e ele ja foi consumido como
    // texto por `erroDaRespostaOpenAi`. Estado nomeado, nao zero.
    registro.desfecho = "http_erro";
    registro.uso = { medido: false, motivo: "corpo_de_erro" };
    throw await erroDaRespostaOpenAi(response);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  // A PARTIR DAQUI o custo desta tentativa esta medido, tenha ela desfecho bom
  // ou ruim: a OpenAI cobra a chamada, nao o nosso parser.
  registro.uso = usoDoPayload(payload.usage);
  const choice = payload.choices?.[0];
  const conteudo = choice?.message?.content;
  if (typeof conteudo === "string") registro.outputChars = conteudo.length;
  // finish_reason "length" = a resposta bateu no max_tokens e veio cortada. Sem
  // esta checagem o sintoma era "JSON invalido", que manda diagnosticar o
  // parser quando o problema e orcamento de saida. Erro proprio, e a tentativa
  // seguinte nao adianta nada (o mesmo prompt corta no mesmo lugar), entao
  // LinkedinTruncatedError nao e retentado.
  if (choice?.finish_reason === "length") {
    registro.desfecho = "truncada";
    throw new LinkedinTruncatedError();
  }
  const content = conteudo;
  if (!content) {
    registro.desfecho = "sem_conteudo";
    throw new Error("A IA não retornou conteúdo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    registro.desfecho = "json_invalido";
    throw new Error(`Resposta da IA não veio em JSON válido: ${detail}.`);
  }

  const validation = LinkedinQualitativeSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    registro.desfecho = "schema_invalido";
    throw new Error(
      `Resposta da IA não bateu com o schema esperado: ${issues}`,
    );
  }
  // O contrato persistido aceita zero pontos fortes apenas no fallback
  // determinístico de perfil quase vazio. A saída do modelo continua obrigada
  // a trazer de 3 a 5, como declara o prompt, e uma violação segue retentando.
  if (validation.data.pontosFortes.length < 3) {
    registro.desfecho = "schema_invalido";
    throw new Error(
      "Resposta da IA não bateu com o schema esperado: pontosFortes exige ao menos 3 itens.",
    );
  }

  registro.desfecho = "sucesso";
  return validation.data;
}

async function runQualitative(
  userText: string,
  onAiIo?: (io: AnalyzeAiIo) => void,
): Promise<LinkedinQualitative> {
  if (!env.openaiApiKey) {
    throw new Error("Serviço de IA não configurado.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    // Um registro POR TENTATIVA, criado antes da chamada: se ela morrer no
    // transporte, o evento ainda sai, com o motivo nomeado do estado inicial.
    const registro: RegistroDaTentativa = {
      tentativa: attempt,
      desfecho: null,
      inputChars: userText.length,
      uso: { medido: false, motivo: "sem_resposta" },
    };
    try {
      return await runQualitativeOnce(userText, registro);
    } catch (err) {
      lastError = err;
      // Falhas ANTES da resposta nao passam por `runQualitativeOnce`, entao o
      // desfecho delas e classificado aqui, que continua sendo dentro da
      // tentativa. `??=` de proposito: o que a tentativa ja rotulou tem
      // precedencia, porque e mais especifico.
      registro.desfecho ??=
        err instanceof UpstreamTimeoutError ? "timeout" : "rede";
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[linkedin-analyze] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      // Truncamento e deterministico: o mesmo prompt com o mesmo max_tokens
      // corta de novo. Retentar so faz a pessoa esperar o dobro pelo mesmo
      // erro, entao aborta o loop na hora.
      if (err instanceof LinkedinTruncatedError) break;
      // Falha permanente da OpenAI (saldo esgotado, ou credencial invalida
      // num 401/403): a tentativa seguinte colhe exatamente o mesmo erro,
      // entao so custa um round-trip e o backoff. Rate limit e falha nao
      // classificada seguem retentando.
      if (isFalhaPermanente(err)) break;
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    } finally {
      // UM evento por tentativa, em TODA saida: sucesso (o `return` do `try`
      // passa por aqui antes de propagar), falha retentada, falha que aborta o
      // laco. E o `finally` que torna a garantia estrutural.
      emitirTentativa(registro, onAiIo);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar a análise da IA.");
}

/**
 * Qualitativo determinístico e caloroso para perfil quase vazio (sem
 * headline, sem Sobre, sem experiências). Garante o tom e evita gastar token.
 * Os campos para copiar respeitam o idioma do mercado mesmo sem chamar a IA.
 * Como não há evidência suficiente, o fallback prefere listas vazias e texto
 * explicitamente aspiracional a inventar tecnologias, projetos ou senioridade.
 */
export function warmEmptyQualitative(
  request: Pick<LinkedinAnalyzeRequest, "area" | "level" | "mercado" | "skills">,
  parsed: Pick<LinkedinParsed, "formacao" | "certificacoes" | "experiencias">,
  deterministic: LinkedinDeterministicResult,
): LinkedinQualitative {
  const { area, level, mercado } = request;
  const cargoPt = PT_TITLES[area][0];
  const cargoEn = ENGLISH_TITLES[area][0];
  const exterior = mercado === "exterior";
  const cargo = mercado === "brasil" ? cargoPt : cargoEn;
  const areaLabel = AREA_LABELS[area];
  const faltantesTop = deterministic.keywordsFaltantes.slice(0, 6);
  const evidenciasDisponiveis = [
    `o nível ${LINKEDIN_LEVEL_LABELS[level]} informado no formulário`,
    request.skills.trim().length > 0 ? "as competências informadas" : null,
    parsed.formacao.length > 0 ? "a formação detectada" : null,
    parsed.certificacoes.length > 0 ? "as certificações detectadas" : null,
    parsed.experiencias.length > 0 ? "as experiências detectadas" : null,
  ].filter((item): item is string => item !== null);
  const evidencias =
    evidenciasDisponiveis.length > 0
      ? ` Há evidência parcial em ${evidenciasDisponiveis.join(", ")}, mas ela não basta para inferir senioridade nem avaliar o perfil inteiro.`
      : " Isso não permite inferir senioridade nem dizer que a pessoa é iniciante.";
  const temSkillsInformadas = request.skills.trim().length > 0;

  const headlines = exterior
    ? [
        `Target role: ${cargoEn} | ${areaLabel}`,
        `${cargoEn} | Profile in progress | ${areaLabel}`,
        `${cargoEn} | Focused on ${areaLabel}`,
      ]
    : mercado === "ambos"
      ? [
          `Target role: ${cargoEn} | ${areaLabel}`,
          `${cargoEn} | Profile in progress | ${areaLabel}`,
          `${cargoEn} | Focused on ${areaLabel}`,
        ]
      : [
          `Objetivo: ${cargoPt} | ${areaLabel}`,
          `${cargoPt} | Perfil em construção | ${areaLabel}`,
          `${cargoPt} | Foco em ${areaLabel}`,
        ];

  const sobrePt =
    `Estou estruturando meu perfil para atuar como ${cargoPt} na área de ${areaLabel}. ` +
    "Antes de publicar uma versão definitiva, vou acrescentar os projetos que realmente desenvolvi, as tecnologias que uso e os resultados que consigo comprovar. " +
    "Se você recruta para essa área, pode me chamar aqui no LinkedIn para conversarmos.";
  const sobreEn =
    `I am structuring my profile for a ${cargoEn} role in ${areaLabel}. ` +
    "Before publishing a final version, I will add the projects I have actually built, the technologies I use, and results I can support with evidence. " +
    "If you recruit for this area, feel free to contact me here on LinkedIn.";

  return {
    resumo:
      "Não encontrei informações suficientes para avaliar esta parte do perfil com segurança." +
      evidencias +
      " Revise a extração e complete somente os campos que realmente estiverem ausentes.",
    // Não há evidência no perfil para declarar pontos fortes. O schema de
    // persistência permite vazio neste fallback; preencher três itens aqui
    // seria inventar qualidades apenas para satisfazer quantidade.
    pontosFortes: [],
    pontosFracos: [
      "A headline ainda não comunica seu cargo nem sua stack.",
      "Falta uma seção Sobre que conte sua história.",
      "Não há experiências ou projetos cadastrados para os recrutadores verem.",
    ],
    melhorias: [
      {
        prioridade: "alta",
        titulo: "Escreva uma headline com cargo e tecnologias",
        comoFazer: `Abra a headline hoje e comece com o cargo-alvo ${cargo}. Depois acrescente somente as tecnologias que você realmente usa em projetos, separadas por barra vertical.`,
      },
      {
        prioridade: "alta",
        titulo: "Cadastre um projeto como experiência",
        comoFazer:
          "Escolha hoje um projeto que você realmente fez, inclusive de curso, e cadastre como experiência. Use um título honesto e três bullets sobre o que você fez, com qual tecnologia e qual foi o resultado quando houver.",
      },
      {
        prioridade: "media",
        titulo: "Escreva um Sobre curto",
        comoFazer:
          "Escreva hoje uma primeira versão com uma frase de abertura e seu objetivo profissional. Conte apenas o que você estuda ou construiu de verdade, liste a stack comprovável por extenso e termine com um convite ao contato.",
      },
      {
        prioridade: "baixa",
        titulo: temSkillsInformadas
          ? "Revise as competências informadas"
          : "Cadastre suas competências",
        comoFazer: temSkillsInformadas
          ? "Abra hoje a seção Competências e confirme se as tecnologias informadas estão cadastradas e ordenadas no LinkedIn. Mantenha somente ferramentas que você realmente usa e não trate ausência de leitura do PDF como ausência de experiência."
          : "Abra hoje a seção Competências e liste as tecnologias que você já consegue usar. Comece pelas mais ligadas à sua área e não adicione ferramentas que ainda estão apenas no plano de estudo.",
      },
    ],
    proximoPasso: `Preencha hoje a headline com o cargo-alvo ${cargo} e acrescente apenas tecnologias que você realmente usa em projetos.`,
    headlines,
    sobreReescrito: exterior
      ? sobreEn
      : mercado === "ambos"
        ? `${sobrePt}\n\n${sobreEn}`
        : sobrePt,
    bulletsReescritos: [],
    // Perfil quase vazio nao comprova tecnologia nenhuma, entao "adicionar
    // agora" fica legitimamente vazio e as faltantes viram trilha de estudo.
    skillsParaEstudar: faltantesTop,
    modeloMensagemRecrutador: exterior
      ? `Hello, [name]. I am structuring my profile for a ${cargoEn} role and would like to learn more about opportunities in this area at [company]. Thank you for connecting.`
      : `Olá, [nome]. Estou estruturando meu perfil para atuar como ${cargoPt} e gostaria de conhecer melhor as oportunidades dessa área na [empresa]. Obrigado pela conexão.`,
  };
}

/**
 * Teto de eventos de lastro no Sentry, por tipo e por processo.
 *
 * Mesmo cuidado do modo degradado da cota: um dia ruim do modelo geraria um
 * evento por analise e o alerta viraria ruido. O `console.warn` continua saindo
 * em TODA ocorrencia, entao a contagem exata fica no log; o Sentry recebe a
 * amostra que faz o problema aparecer no painel.
 */
const INTERVALO_LASTRO_MS = 60 * 1000;

/** Violações que descartam o bloco inteiro, em vez de remover um termo dele. */
const TIPOS_DE_BLOCO: ReadonlySet<TipoViolacao> = new Set<TipoViolacao>([
  "bullet_sem_origem",
  "bloco_experiencia_invalida",
]);
const ultimoLastroPorTipo = new Map<string, number>();

function registrarViolacao(v: Violacao): void {
  // NIVEL: `warning`, nao `error`, e a diferenca e deliberada. O modo degradado
  // da cota e `error` porque significa que uma PROTECAO ESTA DESLIGADA; uma
  // violacao de lastro significa o oposto, que a protecao FUNCIONOU e removeu o
  // que o modelo tentou fabricar. O que se quer aqui e visibilidade (o evento
  // aparece no painel e da para contar), nao urgencia de plantao.
  //
  // Sem esta captura o evento morria no log do Railway: o Sentry deste projeto
  // nao declara `integrations`, e `captureConsoleIntegration` NAO e padrao no
  // @sentry/node, entao console.warn nunca chegava la.
  const agora = Date.now();
  const ultimo = ultimoLastroPorTipo.get(v.tipo) ?? 0;
  if (agora - ultimo >= INTERVALO_LASTRO_MS) {
    ultimoLastroPorTipo.set(v.tipo, agora);
    try {
      Sentry.captureMessage(`ai_lastro_violado: ${v.tipo}`, {
        level: "warning",
        tags: { area: "ai-lastro", tool: "linkedin-analyzer", tipo: v.tipo },
        // Um issue por TIPO: os quatro tipos sao problemas diferentes e nao
        // devem se esconder atras do volume um do outro.
        fingerprint: ["ai-lastro-violado", v.tipo],
        extra: { campo: v.campo, termo: v.termo, contexto: v.contexto },
      });
    } catch {
      // Sentry desligado (DSN ausente) e no-op por desenho.
    }
  }
  // Log estruturado, mesmo formato da Fase 1A-bis, agora com o tipo
  // distinguido. Sai em TODA ocorrencia: e ele que da a contagem exata.
  console.warn(
    JSON.stringify({
      level: "warn",
      msg: "ai_lastro_violado",
      tool: "linkedin-analyzer",
      tipo: v.tipo,
      campo: v.campo,
      contexto: v.contexto,
      termo: v.termo,
      // Os dois tipos de bloco descartam a unidade inteira; os de termo removem
      // uma palavra ou um numeral de dentro do texto. O rotulo tem de dizer
      // qual dos dois aconteceu, porque a leitura do log depende disso.
      acao: TIPOS_DE_BLOCO.has(v.tipo) ? "bloco_removido" : "termo_removido",
      retry: false,
    }),
  );
}

/**
 * Melhoria injetada quando uma experiencia nao recebeu bullets.
 *
 * Duas copies fechadas, uma por estado, porque o pedido a pessoa e diferente:
 * na vazia ela escreve do zero, na curta ela parte do que ja escreveu. Dizer
 * "esta sem descricao" para quem escreveu uma linha e simplesmente falso, e a
 * pessoa para de confiar no resto do relatorio.
 */
function melhoriaSemBullets(
  titulo: string,
  estado: "vazia" | "curta",
): LinkedinMelhoria {
  if (estado === "vazia") {
    return {
      prioridade: "alta",
      titulo: `Escreva a descrição da experiência ${titulo}`,
      comoFazer:
        "Essa experiência está no seu perfil só com cargo e data, sem uma linha do que você fez. Abra ela no LinkedIn hoje e escreva três bullets: o que você entregava, com qual tecnologia ou ferramenta, e um resultado concreto quando houver. Enquanto estiver vazia, ela quase não pesa na busca e quem abre o seu perfil não tem o que ler.",
    };
  }
  return {
    prioridade: "alta",
    titulo: `Amplie a descrição da experiência ${titulo}`,
    comoFazer:
      "Essa experiência tem descrição, mas em uma linha só, e por isso a plataforma não reescreveu ela: não dá para transformar uma frase em bullets sem completar o que você não escreveu. Volte nela e acrescente, a partir do que já está lá, com qual tecnologia ou ferramenta você fazia aquilo, para quem ou para quantas pessoas, e o que mudou depois. Três bullets já colocam essa experiência no mesmo nível das outras.",
  };
}

/**
 * Camada unica de lastro sobre o texto gerado. Ver shared/linkedin/lastro.ts
 * para a lista de campos cobertos e nao cobertos, com o motivo de cada um.
 */
function aplicarLastro(
  qualitative: LinkedinQualitative,
  parsed: LinkedinParsed,
  deterministic: LinkedinDeterministicResult,
): LinkedinQualitative {
  const violacoes: Violacao[] = [];

  // 1. HEADLINES: tecnologia so com lastro em keywordsEncontradas.
  const comprovadas = new Set(
    deterministic.keywordsEncontradas.map((t) => t.toLowerCase()),
  );
  const headlines = qualitative.headlines.map((headline) => {
    let saida = headline;
    for (const tech of matchTechnologies(headline, ALL_TECHNOLOGIES)
      .encontradas) {
      if (comprovadas.has(tech.toLowerCase())) continue;
      violacoes.push({
        tipo: "tecnologia_sem_lastro",
        campo: "headlines",
        contexto: headline,
        termo: tech,
      });
      saida = removerTermoSemLastro(saida, tech);
    }
    return saida;
  });

  // 2. BULLETS: atribuicao ESTRUTURAL, pelo numero da lista que foi ao prompt.
  //
  // FAIL-CLOSED, sem excecao: numero fora do intervalo real e experiencia sem
  // descricao suficiente descartam o bloco inteiro, e nao existe terceiro
  // caminho. O desenho anterior casava `contexto` por token e tinha um ramo
  // "nao identifiquei, deixa passar"; era por ele que um bloco inteiramente
  // fabricado chegava ao usuario sem uma unica conferencia.
  //
  // Numero repetido em dois blocos e permitido de proposito: os dois conferem
  // contra a MESMA experiencia, entao nao ha risco de lastro, e nenhum
  // consumidor assume unicidade (a interface renderiza a lista com chave por
  // indice e so le `contexto` e `bullets`). Deduplicar aqui seria descartar
  // bullet legitimo por uma regra que ninguem precisa.
  const porNumero = new Map(
    listaDeExperiencias(parsed).map((item) => [item.numero, item]),
  );
  const bulletsReescritos: typeof qualitative.bulletsReescritos = [];
  for (const bloco of qualitative.bulletsReescritos) {
    const item = porNumero.get(bloco.experienciaNumero);
    if (!item) {
      violacoes.push({
        tipo: "bloco_experiencia_invalida",
        campo: "bulletsReescritos",
        contexto: bloco.contexto,
        termo: `experienciaNumero ${bloco.experienciaNumero} fora de 1..${porNumero.size}`,
      });
      continue;
    }
    if (item.estado !== "suficiente") {
      // Origem sem descricao propria: TODO bullet aqui e fabricado, inclusive
      // os que nao citam numero nem tecnologia e por isso passariam batido.
      violacoes.push({
        tipo: "bullet_sem_origem",
        campo: "bulletsReescritos",
        contexto: bloco.contexto,
        termo: `${bloco.bullets.length} bullet(s)`,
      });
      continue;
    }

    const origem = origemDoLastro(item);
    const daOrigem = new Set(
      matchTechnologies(origem, ALL_TECHNOLOGIES).encontradas.map((t) =>
        t.toLowerCase(),
      ),
    );
    let bullets = bloco.bullets.map((bullet) => {
      let saida = bullet;
      for (const tech of matchTechnologies(bullet, ALL_TECHNOLOGIES)
        .encontradas) {
        if (daOrigem.has(tech.toLowerCase())) continue;
        violacoes.push({
          tipo: "tecnologia_sem_lastro",
          campo: "bulletsReescritos",
          contexto: bloco.contexto,
          termo: tech,
        });
        saida = removerTermoSemLastro(saida, tech);
      }
      return saida;
    });
    for (const ocorrencia of numeraisSemLastro(bullets, origem)) {
      violacoes.push({
        tipo:
          ocorrencia.motivo === "tipo_trocado"
            ? "numeral_tipo_trocado"
            : "numeral_fabricado",
        campo: "bulletsReescritos",
        contexto: bloco.contexto,
        termo: ocorrencia.numeral,
      });
      bullets = bullets.map((b) =>
        b === ocorrencia.bullet
          ? removerNumeralSemLastro(b, ocorrencia.numeral)
          : b,
      );
    }
    bulletsReescritos.push({ ...bloco, bullets });
  }

  // 3. A lacuna que o corte criou vira melhoria NOMEADA, no topo.
  const semDescricao = parsed.experiencias.filter(
    (exp) => !temConteudoParaBullets(exp),
  );
  let melhorias = qualitative.melhorias;
  if (semDescricao.length > 0) {
    const alvo = semDescricao[0];
    const nova = melhoriaSemBullets(
      alvo.titulo || "sem título",
      estadoDescricao(alvo) === "vazia" ? "vazia" : "curta",
    );
    const jaCitada = melhorias.some((m) =>
      m.titulo.toLowerCase().includes("descrição da experiência"),
    );
    // Teto de 7 do schema preservado: entra na frente e corta o excedente.
    if (!jaCitada) melhorias = [nova, ...melhorias].slice(0, 7);
  }

  for (const v of violacoes) registrarViolacao(v);
  if (violacoes.length === 0 && melhorias === qualitative.melhorias) {
    return qualitative;
  }
  return { ...qualitative, headlines, bulletsReescritos, melhorias };
}

export async function analyzeLinkedin(
  request: LinkedinAnalyzeRequest,
  onAiIo?: (io: AnalyzeAiIo) => void,
): Promise<{ response: LinkedinAnalysisResponse; parsed: LinkedinParsed }> {
  const parsed = parseLinkedinText(request.profileText);
  if (!parsed.usable) {
    throw new LinkedinUnreadableError();
  }

  const deterministic = runLinkedinChecks({
    parsed,
    profileText: request.profileText,
    area: request.area,
    level: request.level,
    mercado: request.mercado,
    skills: request.skills,
    foto: request.foto,
    banner: request.banner,
    openToWork: request.openToWork,
    conexoes: request.conexoes,
    atividade: request.atividade,
    headlineManual: request.headlineManual,
  });

  const quaseVazio =
    !deterministic.headline &&
    !parsed.sobre &&
    parsed.experiencias.length === 0;

  const qualitativeCru = quaseVazio
    ? warmEmptyQualitative(request, parsed, deterministic)
    : await runQualitative(
        buildUserPrompt(request, parsed, deterministic),
        onAiIo,
      );

  const qualitative = aplicarLastro(qualitativeCru, parsed, deterministic);
  /**
   * @deprecated Alias de compatibilidade para bundles antigos ainda abertos.
   * A remoção exige uma estratégia confiável de versionamento/telemetria de
   * clientes; tempo desde o deploy, sozinho, não prova que o cliente recarregou.
   */
  const qualitativeComAlias = {
    ...qualitative,
    skillsSugeridas: qualitative.skillsParaEstudar,
  };

  return {
    response: {
      area: request.area,
      level: request.level,
      mercado: request.mercado,
      // Carimbos de formato, lidos de volta por readQualitative/readDeterministic.
      qualitativeVersion: QUALITATIVE_VERSION,
      deterministicVersion: DETERMINISTIC_VERSION,
      deterministic,
      qualitative: qualitativeComAlias,
    },
    parsed,
  };
}
