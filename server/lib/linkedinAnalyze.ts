import { AREA_LABELS, type AreaSlug } from "../../shared/areas";
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
  type Mercado,
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
  type Violacao,
} from "../../shared/linkedin/lastro";
import {
  ALL_TECHNOLOGIES,
  keyTechnologiesForArea,
  matchTechnologies,
} from "./skillNormalize";
import { fetchWithTimeout } from "./http";
import {
  parseLinkedinText,
  type LinkedinParsed,
} from "../../shared/linkedin/parse";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "./openai";
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

const SYSTEM_PROMPT = `Você é um especialista sênior em LinkedIn para carreiras de tecnologia no Brasil, mentor da plataforma BoraNaTech. Seu público vai de iniciantes (estagiários, trainees, juniores, pessoas em transição de carreira) a profissionais de nível pleno. Seu trabalho é interpretar uma análise já calculada e reescrever as partes do perfil para que ele seja encontrado por recrutadores e receba mensagens.

REGRA DOS FATOS: as checagens automáticas, a nota e as listas de palavras-chave encontradas e faltantes que você vai receber já foram calculadas e são fatos. Você não reavalia, não recalcula nota, não contradiz as checagens e não inventa informações que não estão no perfil. Se o perfil não menciona algo, você não pode afirmar que a pessoa sabe aquilo. Nas sugestões de skills, proponha apenas o que é plausível a partir do que o perfil já evidencia, e deixe claro que a pessoa só deve adicionar o que realmente sabe.

DIVERGÊNCIA ENTRE CHECAGEM E TEXTO (válvula da regra dos fatos): as checagens são automáticas e podem estar erradas em um caso específico. Se o texto do perfil contradisser uma checagem de forma verificável, aponte a divergência em vez de repetir a checagem. Exemplo: se uma checagem disser que as experiências têm descrição, mas houver no texto uma experiência sem nenhuma descrição própria, diga isso e cite qual. Isso não é recalcular a nota nem discutir a checagem: é relatar o que você está vendo no texto. Na dúvida, siga a checagem.

TECNOLOGIA SÓ COM LASTRO: em bulletsReescritos, você só pode nomear uma tecnologia dentro do bullet de uma experiência se ela aparecer no texto DAQUELA experiência. Tecnologia que aparece no Sobre, na headline ou em OUTRA experiência não vale como lastro para esta. Se o texto da experiência não nomeia a stack, escreva o bullet sem tecnologia nenhuma, descrevendo o que foi feito e o resultado. É melhor um bullet sem stack do que um bullet com stack inventada.

EXPERIÊNCIA SEM DESCRIÇÃO: se uma experiência vier marcada como SEM DESCRIÇÃO PRÓPRIA NO PERFIL, não escreva bullets para ela em hipótese nenhuma. Não há o que reescrever: qualquer bullet ali seria inventado por você. Em vez disso, inclua uma melhoria nomeando essa experiência e dizendo como escrever a descrição dela.

EXPERIÊNCIA COM DESCRIÇÃO CURTA DEMAIS: se uma experiência vier marcada como DESCRIÇÃO CURTA DEMAIS PARA REESCREVER, também não escreva bullets para ela. A diferença para o caso acima é que aqui existe texto, e ele vem transcrito na marcação: use esse texto para escrever uma melhoria específica, citando o que a pessoa já escreveu e dizendo o que falta acrescentar. Não trate essa experiência como vazia, porque ela não está.

NÚMERO NÃO MUDA DE DONO: métricas, percentuais e volumes só podem ser reescritos com o MESMO sujeito e o MESMO recorte que têm no perfil. Se o texto diz que uma técnica específica reduziu a latência em uma situação específica, não atribua esse número ao projeto inteiro, a outra técnica, nem a outra métrica. Na dúvida sobre a que o número se refere, escreva o bullet sem o número.

CAMPOS PARA COLAR SÓ COM O QUE EXISTE: headlines, sobreReescrito e bulletsReescritos só podem citar tecnologias que aparecem no perfil. As tecnologias marcadas como SEM NENHUMA evidência no perfil não entram em nenhum texto para colar: elas só podem aparecer em skillsParaEstudar, escolhidas daquela lista e escritas exatamente como aparecem nela. A lista de tecnologias que o perfil comprova e que faltam nas competências já vem calculada e é exibida pela plataforma: você não a reescreve nem a repete como lista, no máximo comenta na prosa.

COMO RECRUTADORES BUSCAM: recrutadores usam o LinkedIn Recruiter com buscas por cargo atual, cargos anteriores, competências cadastradas e palavras-chave booleanas. Os campos que mais pesam na busca são a headline, os títulos das experiências e a seção de competências. O texto do Sobre é indexado, mas pesa menos. Por isso o cargo-alvo precisa aparecer literalmente na headline e em pelo menos um título de experiência, e as tecnologias precisam estar escritas por extenso no perfil, em português e quando fizer sentido também em inglês.

MERCADO-ALVO: o usuário informa se busca trabalho no Brasil, no exterior ou nos dois. Recrutadores internacionais buscam em inglês, então para mercado exterior a headline, os títulos de experiência, as competências e o Sobre devem estar em inglês, e todas as suas reescritas devem ser em inglês. Para o mercado Brasil, as reescritas são em português, mas o cargo na headline pode ser em inglês porque é assim que se busca em tecnologia. Para quem busca os dois mercados, a regra é: headline com cargo e tecnologias em inglês, Sobre em português com um parágrafo final em inglês resumindo perfil e disponibilidade, e bullets de experiência em português com termos técnicos em inglês. Quando o mercado for exterior ou ambos, inclua nas melhorias: configurar o Open to Work com vagas remotas e os países desejados, mencionar o nível de inglês com honestidade e o fuso horário no Sobre, e considerar o recurso de perfil secundário em outro idioma do LinkedIn. O modelo de mensagem para recrutador deve estar em inglês quando o mercado for exterior, e em português nos demais casos.

IDIOMA DA SAÍDA (REGRA DURA): o idioma de cada campo do JSON segue esta tabela, sem exceção. Campos de texto para colar no perfil seguem o mercado-alvo: com mercado exterior, headlines, sobreReescrito, bulletsReescritos e modeloMensagemRecrutador saem em INGLÊS; com mercado Brasil, esses mesmos campos saem em português (só o cargo na headline pode ficar em inglês) e modeloMensagemRecrutador em português; com mercado ambos, valem as regras de mistura do parágrafo MERCADO-ALVO e modeloMensagemRecrutador em português. Já resumo, pontosFortes, pontosFracos, melhorias e proximoPasso são a conversa da plataforma com o usuário, não texto para colar: ficam SEMPRE em português do Brasil, para qualquer mercado.

FÓRMULA DA HEADLINE: cargo-alvo, separador de barra vertical, 2 a 4 tecnologias principais, separador, um diferencial curto ou contexto honesto (por exemplo: em transição de carreira, foco em back-end, construindo projetos open source). Nada de frases como apaixonado por tecnologia ou em busca de oportunidades. A headline aparece em toda busca e em todo comentário, é o campo mais valioso do perfil.

ESTRUTURA DO SOBRE: primeira linha é um gancho de até 140 caracteres, porque é o que aparece antes do ver mais. Depois um parágrafo de prova concreta com projetos, contexto e o que a pessoa já construiu. Depois a stack escrita por extenso em texto corrido, porque isso é indexado. Fecha com um convite claro ao contato, mencionando o tipo de oportunidade buscada.

EXPERIÊNCIAS PARA INICIANTES: quem não tem experiência formal deve cadastrar projetos próprios como experiência, com título honesto (por exemplo: Desenvolvedor Back-end, Projeto pessoal) e descrição em bullets. Cada bullet segue verbo de ação no passado, o que foi feito, com qual tecnologia, e resultado ou métrica quando existir. Isso é prática legítima e recomendada, não é mentira, desde que descreva trabalho real.

CALIBRAGEM DE TOM: a nota e a faixa indicam o estágio do perfil. Faixa início pede acolhimento e foco nos 3 passos de maior impacto, sem soterrar a pessoa. Faixa em construção pede reconhecimento do que existe e direção objetiva. Faixas forte e magnético pedem refinamento fino e ambição. Sempre direto, encorajador e concreto, nunca condescendente.

NÍVEL PLENO: quando o nível do usuário for Pleno, trate como senioridade intermediária, não como iniciante. Aprofunde o lado técnico e os resultados: arquitetura, decisões de projeto, impacto medível e métricas nas reescritas. Não infle senioridade: nada de se vender como sênior, especialista ou líder se o perfil não evidencia isso. As orientações de projetos próprios como experiência valem menos aqui; priorize dar densidade ao que a pessoa já viveu profissionalmente.

ESTILO: português do Brasil. Proibido travessão e meia-risca, use ponto, vírgula ou parênteses. Sem emojis. Textos reescritos prontos para copiar e colar, na primeira pessoa quando for texto do perfil do usuário.

QUANTIDADES OBRIGATÓRIAS: de 3 a 5 pontosFortes, de 3 a 5 pontosFracos e de 4 a 7 melhorias. Em cada melhoria, comoFazer tem de 2 a 4 frases, começando por um primeiro passo executável HOJE e citando o campo do perfil quando aplicável (headline, Sobre, competências, experiências). proximoPasso: preencha SEMPRE, escolhendo entre as melhorias de prioridade alta a ÚNICA ação de maior impacto que a pessoa consegue executar hoje, concreta e específica ao perfil analisado.

Responda apenas com o JSON do schema.`;
// TODO(Ana): revisar o bloco de quantidades e proximoPasso do prompt.
// TODO(Ana): revisar o paragrafo NIVEL PLENO e a frase de publico do prompt.

export interface AnalyzeAiIo {
  inputChars: number;
  outputChars: number;
  /** Tokens EXATOS de `usage` da OpenAI. 0 quando a resposta nao trouxe. */
  inputTokens: number;
  outputTokens: number;
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
    .map(
      (check) =>
        `- [${check.aprovado ? "aprovado" : "reprovado"}] ${check.label}: ${check.detail}`,
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
function temConteudoParaBullets(exp: LinkedinParsed["experiencias"][number]): boolean {
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

// Exportada para teste: e o texto exato que chega ao modelo, e as tres
// marcacoes (vazia, curta, suficiente) so tem valor se forem verificaveis.
export function experienciasBlock(parsed: LinkedinParsed): string {
  if (parsed.experiencias.length === 0)
    return "(nenhuma experiência detectada)";

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
    if (estado === "vazia") {
      return {
        cabecalho,
        corpo:
          "(SEM DESCRIÇÃO PRÓPRIA NO PERFIL: não escreva bullets para esta experiência)",
        cortavel: false,
      };
    }
    if (estado === "curta") {
      return {
        cabecalho,
        corpo: `(DESCRIÇÃO CURTA DEMAIS PARA REESCREVER, transcrita aqui só como contexto: "${exp.descricao}". Não escreva bullets para esta experiência: o que existe não sustenta um bullet sem você completar o que não está escrito)`,
        cortavel: false,
      };
    }
    return { cabecalho, corpo: exp.descricao, cortavel: true };
  });

  const montar = (corpos: string[]) =>
    partes.map((p, i) => `${p.cabecalho}\n${corpos[i]}`).join("\n\n");

  const inteiro = montar(partes.map((p) => p.corpo));
  if (inteiro.length <= EXPERIENCIAS_LIMIT) return inteiro;

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
  const cortaveis = partes.map((p, i) => (p.cortavel ? i : -1)).filter((i) => i >= 0);
  const fixo = partes.reduce(
    (soma, p, i) =>
      soma + p.cabecalho.length + 1 + (p.cortavel ? MARCA_CORTE.length : p.corpo.length),
    0,
  ) + (partes.length - 1) * 2;
  const cotas = repartirOrcamento(
    EXPERIENCIAS_LIMIT - fixo,
    cortaveis.map((i) => partes[i].corpo.length),
  );
  const corpos = partes.map((p) => p.corpo);
  cortaveis.forEach((idx, k) => {
    const cota = Math.max(cotas[k], 0);
    if (partes[idx].corpo.length > cota) {
      corpos[idx] = `${partes[idx].corpo.slice(0, cota).trimEnd()}${MARCA_CORTE}`;
    }
  });
  return montar(corpos);
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
    "Checagens automáticas já calculadas (são fatos, não reavalie nem contradiga):",
    checksBlock(deterministic),
    "",
    `Nota determinística já calculada: ${deterministic.score} de 100 (faixa ${FAIXA_LABELS[deterministic.faixa]}). Não recalcule a nota.`,
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
    `Headline extraída: ${parsed.headline ?? "(não detectada)"}`,
    "",
    "Sobre (texto cru, pode estar truncado):",
    parsed.sobre ? truncate(parsed.sobre, SOBRE_LIMIT) : "(sem seção Sobre)",
    "",
    "Experiências (texto cru, pode estar truncado):",
    experienciasBlock(parsed),
    "",
    `Competências coladas pelo usuário: ${request.skills.trim() || "(nenhuma)"}.`,
    `Respostas do formulário de sinais: ${sinais}.`,
  ].join("\n");
}

async function runQualitativeOnce(
  userText: string,
  onAiIo?: (io: AnalyzeAiIo) => void,
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
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const choice = payload.choices?.[0];
  // finish_reason "length" = a resposta bateu no max_tokens e veio cortada. Sem
  // esta checagem o sintoma era "JSON invalido", que manda diagnosticar o
  // parser quando o problema e orcamento de saida. Erro proprio, e a tentativa
  // seguinte nao adianta nada (o mesmo prompt corta no mesmo lugar), entao
  // LinkedinTruncatedError nao e retentado.
  if (choice?.finish_reason === "length") {
    throw new LinkedinTruncatedError();
  }
  const content = choice?.message?.content;
  if (!content) {
    throw new Error("A IA não retornou conteúdo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA não veio em JSON válido: ${detail}.`);
  }

  const validation = LinkedinQualitativeSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(
      `Resposta da IA não bateu com o schema esperado: ${issues}`,
    );
  }

  // Tokens exatos quando a OpenAI mandar; chars seguem gravados para o
  // fallback de custo e para comparacao historica.
  onAiIo?.({
    inputChars: userText.length,
    outputChars: content.length,
    inputTokens: payload.usage?.prompt_tokens ?? 0,
    outputTokens: payload.usage?.completion_tokens ?? 0,
  });
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
    try {
      return await runQualitativeOnce(userText, onAiIo);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[linkedin-analyze] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      // Truncamento e deterministico: o mesmo prompt com o mesmo max_tokens
      // corta de novo. Retentar so faz a pessoa esperar o dobro pelo mesmo
      // erro, entao aborta o loop na hora.
      if (err instanceof LinkedinTruncatedError) break;
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar a análise da IA.");
}

/**
 * Qualitativo determinístico e caloroso para perfil quase vazio (sem
 * headline, sem Sobre, sem experiências). Garante o tom e evita gastar token.
 * Edge case aceito: os textos ficam em português mesmo com mercado exterior
 * (só o cargo das headlines troca pra inglês). Perfil quase vazio não tem o
 * que colar ainda, então a regra IDIOMA DA SAÍDA do prompt não se aplica.
 */
function warmEmptyQualitative(
  area: AreaSlug,
  mercado: Mercado,
  deterministic: LinkedinDeterministicResult,
): LinkedinQualitative {
  const cargoPt = PT_TITLES[area][0];
  const cargoEn = ENGLISH_TITLES[area][0];
  const cargo = mercado === "brasil" ? cargoPt : cargoEn;
  const faltantesTop = deterministic.keywordsFaltantes.slice(0, 6);

  return {
    resumo:
      "Seu perfil está praticamente em branco, e tudo bem, todo mundo começa assim. O caminho aqui é simples: preencher a headline, escrever um Sobre curto e cadastrar pelo menos um projeto como experiência. Esses três passos já fazem você aparecer nas buscas.",
    pontosFortes: [
      "Você já deu o primeiro passo, que é querer melhorar o perfil.",
    ],
    pontosFracos: [
      "A headline ainda não comunica seu cargo nem sua stack.",
      "Falta uma seção Sobre que conte sua história.",
      "Não há experiências ou projetos cadastrados para os recrutadores verem.",
    ],
    melhorias: [
      {
        prioridade: "alta",
        titulo: "Escreva uma headline com cargo e tecnologias",
        comoFazer: `Use a fórmula cargo, barra, tecnologias. Por exemplo: ${cargo} | comece listando as tecnologias que você estuda.`,
      },
      {
        prioridade: "alta",
        titulo: "Cadastre um projeto como experiência",
        comoFazer:
          "Pegue um projeto que você já fez (mesmo de curso) e cadastre como experiência, com um título honesto e 3 bullets do que você fez e com qual tecnologia.",
      },
      {
        prioridade: "media",
        titulo: "Escreva um Sobre curto",
        comoFazer:
          "Comece com uma frase de gancho, conte o que você estuda e está construindo, liste sua stack por extenso e termine com um convite ao contato.",
      },
      {
        // TODO(Ana): revisar a quarta melhoria do perfil quase vazio.
        prioridade: "baixa",
        titulo: "Cadastre suas competências",
        comoFazer:
          "Na seção Competências, adicione as tecnologias que você já estuda, começando pelas da sua área. Adicione só o que você realmente sabe, mesmo que no básico.",
      },
    ],
    // TODO(Ana): revisar o proximo passo do perfil quase vazio.
    proximoPasso: `Preencha hoje sua headline com a fórmula cargo e tecnologias, por exemplo: ${cargo} | listando as tecnologias que você estuda.`,
    headlines: [
      `${cargo} | em busca da primeira oportunidade, construindo projetos`,
      `${cargo} | estudando e praticando todos os dias`,
      `${cargo} | foco em ${AREA_LABELS[area]}, aprendendo na prática`,
    ],
    sobreReescrito:
      "Estou começando minha jornada em tecnologia e construindo meu portfólio na prática. Tenho estudado as bases da área e aplicado em projetos pessoais. Quero uma primeira oportunidade para crescer junto a um time. Pode me chamar aqui no LinkedIn para conversar.",
    bulletsReescritos: [],
    // Perfil quase vazio nao comprova tecnologia nenhuma, entao "adicionar
    // agora" fica legitimamente vazio e as faltantes viram trilha de estudo.
    skillsParaEstudar: faltantesTop,
    modeloMensagemRecrutador:
      "Olá, tudo bem? Estou começando na área de tecnologia e tenho acompanhado as vagas da sua empresa. Adoraria me conectar e ficar no seu radar para futuras oportunidades de início de carreira. Obrigado!",
  };
}

/**
 * Casa um bloco de bulletsReescritos com a experiencia de origem pelo campo
 * `contexto`, por sobreposicao de tokens do titulo. Mesmo criterio da rubrica.
 */
function experienciaDoBloco(
  contexto: string,
  experiencias: LinkedinParsed["experiencias"],
): LinkedinParsed["experiencias"][number] | null {
  const alvo = contexto.toLowerCase();
  let melhor = -1;
  let score = 0;
  experiencias.forEach((exp, index) => {
    // Cargo E empresa: é o mesmo par que o prompt mostra em `contexto`, e a
    // empresa é o que desempata dois cargos parecidos no mesmo perfil.
    const hits = `${exp.titulo} ${exp.empresa ?? ""}`
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 3 && alvo.includes(token)).length;
    if (hits > score) {
      score = hits;
      melhor = index;
    }
  });
  return melhor < 0 ? null : experiencias[melhor];
}

function registrarViolacao(v: Violacao): void {
  // Log estruturado, mesmo formato da Fase 1A-bis, agora com o tipo
  // distinguido. Vira metrica de qualidade depois; sem painel agora.
  console.warn(
    JSON.stringify({
      level: "warn",
      msg: "ai_lastro_violado",
      tool: "linkedin-analyzer",
      tipo: v.tipo,
      campo: v.campo,
      contexto: v.contexto,
      termo: v.termo,
      acao: v.tipo === "bullet_sem_origem" ? "bloco_removido" : "termo_removido",
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

  // 2. BULLETS: bloco sem origem com conteudo sai inteiro; nos que ficam,
  // tecnologia e numeral conferidos contra o texto DAQUELA experiencia.
  const bulletsReescritos: typeof qualitative.bulletsReescritos = [];
  for (const bloco of qualitative.bulletsReescritos) {
    const exp = experienciaDoBloco(bloco.contexto, parsed.experiencias);
    // Sem origem identificavel, o bloco fica intacto: nao da para afirmar que
    // e falso, e apagar por precaucao destruiria dado bom.
    if (!exp) {
      bulletsReescritos.push(bloco);
      continue;
    }
    if (!temConteudoParaBullets(exp)) {
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

    const origem = `${exp.titulo} ${exp.descricao}`;
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
    mercado: request.mercado,
    skills: request.skills,
    foto: request.foto,
    banner: request.banner,
    openToWork: request.openToWork,
    conexoes: request.conexoes,
    atividade: request.atividade,
  });

  const quaseVazio =
    !parsed.headline && !parsed.sobre && parsed.experiencias.length === 0;

  const qualitativeCru = quaseVazio
    ? warmEmptyQualitative(request.area, request.mercado, deterministic)
    : await runQualitative(
        buildUserPrompt(request, parsed, deterministic),
        onAiIo,
      );

  const qualitative = aplicarLastro(qualitativeCru, parsed, deterministic);

  return {
    response: {
      area: request.area,
      level: request.level,
      mercado: request.mercado,
      // Carimbos de formato, lidos de volta por readQualitative/readDeterministic.
      qualitativeVersion: QUALITATIVE_VERSION,
      deterministicVersion: DETERMINISTIC_VERSION,
      deterministic,
      qualitative,
    },
    parsed,
  };
}
