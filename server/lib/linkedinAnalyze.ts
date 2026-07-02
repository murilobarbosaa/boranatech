import { AREA_LABELS, type AreaSlug } from "../../shared/areas";
import {
  LINKEDIN_LEVEL_LABELS,
  LinkedinQualitativeSchema,
  MERCADO_LABELS,
  FAIXA_LABELS,
  type LinkedinAnalysisResponse,
  type LinkedinAnalyzeRequest,
  type LinkedinDeterministicResult,
  type LinkedinQualitative,
  type Mercado,
} from "../../shared/linkedin/schema";
import { ENGLISH_TITLES, PT_TITLES } from "../../shared/linkedin/titles";
import { env } from "./env";
import { runLinkedinChecks } from "./linkedinChecks";
import { fetchWithTimeout } from "./http";
import { parseLinkedinText, type LinkedinParsed } from "./linkedinParse";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "./openai";
import { toOpenAIStrictSchema } from "./openaiStrictSchema";

/**
 * Orquestração do analisador de LinkedIn, no mesmo padrão de githubAnalyze.ts.
 *
 * Parse e checagens são determinísticos e produzem a nota. A IA só preenche a
 * parte qualitativa (diagnóstico e reescritas), recebendo as checagens já
 * calculadas como fatos. Perfil quase vazio usa um atalho caloroso sem IA.
 */

const SOBRE_LIMIT = 3000;
const EXPERIENCIAS_LIMIT = 4000;

const AI_MAX_ATTEMPTS = 3;
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

const SYSTEM_PROMPT = `Você é um especialista sênior em LinkedIn para carreiras de tecnologia no Brasil, mentor da plataforma BoraNaTech. Seu público é iniciante: estagiários, juniores e pessoas em transição de carreira. Seu trabalho é interpretar uma análise já calculada e reescrever as partes do perfil para que ele seja encontrado por recrutadores e receba mensagens.

REGRA DOS FATOS: as checagens automáticas, a nota e as listas de palavras-chave encontradas e faltantes que você vai receber já foram calculadas e são fatos. Você não reavalia, não recalcula nota, não contradiz as checagens e não inventa informações que não estão no perfil. Se o perfil não menciona algo, você não pode afirmar que a pessoa sabe aquilo. Nas sugestões de skills, proponha apenas o que é plausível a partir do que o perfil já evidencia, e deixe claro que a pessoa só deve adicionar o que realmente sabe.

COMO RECRUTADORES BUSCAM: recrutadores usam o LinkedIn Recruiter com buscas por cargo atual, cargos anteriores, competências cadastradas e palavras-chave booleanas. Os campos que mais pesam na busca são a headline, os títulos das experiências e a seção de competências. O texto do Sobre é indexado, mas pesa menos. Por isso o cargo-alvo precisa aparecer literalmente na headline e em pelo menos um título de experiência, e as tecnologias precisam estar escritas por extenso no perfil, em português e quando fizer sentido também em inglês.

MERCADO-ALVO: o usuário informa se busca trabalho no Brasil, no exterior ou nos dois. Recrutadores internacionais buscam em inglês, então para mercado exterior a headline, os títulos de experiência, as competências e o Sobre devem estar em inglês, e todas as suas reescritas devem ser em inglês. Para o mercado Brasil, as reescritas são em português, mas o cargo na headline pode ser em inglês porque é assim que se busca em tecnologia. Para quem busca os dois mercados, a regra é: headline com cargo e tecnologias em inglês, Sobre em português com um parágrafo final em inglês resumindo perfil e disponibilidade, e bullets de experiência em português com termos técnicos em inglês. Quando o mercado for exterior ou ambos, inclua nas melhorias: configurar o Open to Work com vagas remotas e os países desejados, mencionar o nível de inglês com honestidade e o fuso horário no Sobre, e considerar o recurso de perfil secundário em outro idioma do LinkedIn. O modelo de mensagem para recrutador deve estar em inglês quando o mercado for exterior, e em português nos demais casos.

FÓRMULA DA HEADLINE: cargo-alvo, separador de barra vertical, 2 a 4 tecnologias principais, separador, um diferencial curto ou contexto honesto (por exemplo: em transição de carreira, foco em back-end, construindo projetos open source). Nada de frases como apaixonado por tecnologia ou em busca de oportunidades. A headline aparece em toda busca e em todo comentário, é o campo mais valioso do perfil.

ESTRUTURA DO SOBRE: primeira linha é um gancho de até 140 caracteres, porque é o que aparece antes do ver mais. Depois um parágrafo de prova concreta com projetos, contexto e o que a pessoa já construiu. Depois a stack escrita por extenso em texto corrido, porque isso é indexado. Fecha com um convite claro ao contato, mencionando o tipo de oportunidade buscada.

EXPERIÊNCIAS PARA INICIANTES: quem não tem experiência formal deve cadastrar projetos próprios como experiência, com título honesto (por exemplo: Desenvolvedor Back-end, Projeto pessoal) e descrição em bullets. Cada bullet segue verbo de ação no passado, o que foi feito, com qual tecnologia, e resultado ou métrica quando existir. Isso é prática legítima e recomendada, não é mentira, desde que descreva trabalho real.

CALIBRAGEM DE TOM: a nota e a faixa indicam o estágio do perfil. Faixa início pede acolhimento e foco nos 3 passos de maior impacto, sem soterrar a pessoa. Faixa em construção pede reconhecimento do que existe e direção objetiva. Faixas forte e magnético pedem refinamento fino e ambição. Sempre direto, encorajador e concreto, nunca condescendente.

ESTILO: português do Brasil. Proibido travessão e meia-risca, use ponto, vírgula ou parênteses. Sem emojis. Textos reescritos prontos para copiar e colar, na primeira pessoa quando for texto do perfil do usuário.

Responda apenas com o JSON do schema.`;

export interface AnalyzeAiIo {
  inputChars: number;
  outputChars: number;
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

function experienciasBlock(parsed: LinkedinParsed): string {
  if (parsed.experiencias.length === 0)
    return "(nenhuma experiência detectada)";
  const text = parsed.experiencias
    .map((exp, index) => {
      const titulo = exp.titulo || "(sem título)";
      const desc = exp.descricao || "(sem descrição)";
      return `${index + 1}. ${titulo}\n${desc}`;
    })
    .join("\n\n");
  return truncate(text, EXPERIENCIAS_LIMIT);
}

function buildUserPrompt(
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
    `Palavras-chave da área faltantes: ${
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
    { service: "openai", timeoutMs: 60_000 },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
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

  onAiIo?.({ inputChars: userText.length, outputChars: content.length });
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
    ],
    headlines: [
      `${cargo} | em busca da primeira oportunidade, construindo projetos`,
      `${cargo} | estudando e praticando todos os dias`,
      `${cargo} | foco em ${AREA_LABELS[area]}, aprendendo na prática`,
    ],
    sobreReescrito:
      "Estou começando minha jornada em tecnologia e construindo meu portfólio na prática. Tenho estudado as bases da área e aplicado em projetos pessoais. Quero uma primeira oportunidade para crescer junto a um time. Pode me chamar aqui no LinkedIn para conversar.",
    bulletsReescritos: [],
    skillsSugeridas: faltantesTop,
    modeloMensagemRecrutador:
      "Olá, tudo bem? Estou começando na área de tecnologia e tenho acompanhado as vagas da sua empresa. Adoraria me conectar e ficar no seu radar para futuras oportunidades de início de carreira. Obrigado!",
  };
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

  const qualitative = quaseVazio
    ? warmEmptyQualitative(request.area, request.mercado, deterministic)
    : await runQualitative(
        buildUserPrompt(request, parsed, deterministic),
        onAiIo,
      );

  return {
    response: {
      area: request.area,
      level: request.level,
      mercado: request.mercado,
      deterministic,
      qualitative,
    },
    parsed,
  };
}
