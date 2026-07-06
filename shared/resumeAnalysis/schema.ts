import { z } from "zod";

// Schemas e score deterministico do Analisador de Curriculo (Pro), no molde
// do LinkedIn (shared/linkedin/schema.ts): heuristicas DETERMINISTICAS dao a
// nota (mesma entrada = mesma nota, sempre); a IA so preenche o qualitativo
// e recebe o breakdown para COMENTAR a nota, nunca para muda-la.
//
// Compatibilidade com o strict mode da OpenAI: os campos condicionais do
// schema voltado a IA sao .nullable() (o modelo devolve null, nunca omite);
// min/max de arrays sao removidos do JSON Schema pelo toOpenAIStrictSchema
// mas continuam valendo no safeParse local (violacao vira retry).

export const ResumeAnalyzeRequestSchema = z.object({
  resumeText: z.string().min(200).max(12_000),
  targetRole: z.string().max(120).optional(),
  jobPostingText: z.string().max(4_000).optional(),
});

export type ResumeAnalyzeRequest = z.infer<typeof ResumeAnalyzeRequestSchema>;

// Faixas: mesmos cortes e espirito do LinkedIn (inicio, em construcao, forte,
// magnetico), definidas aqui para o modulo ser independente.
export const RESUME_FAIXAS = [
  "inicio",
  "em-construcao",
  "forte",
  "magnetico",
] as const;

export type ResumeFaixa = (typeof RESUME_FAIXAS)[number];

// TODO(Ana): revisar os rotulos das faixas do curriculo.
export const RESUME_FAIXA_LABELS: Record<ResumeFaixa, string> = {
  inicio: "Início",
  "em-construcao": "Em construção",
  forte: "Forte",
  magnetico: "Magnético",
};

export function resumeFaixaFromScore(score: number): ResumeFaixa {
  if (score <= 39) return "inicio";
  if (score <= 69) return "em-construcao";
  if (score <= 89) return "forte";
  return "magnetico";
}

export interface ResumeScoreCriterion {
  id: string;
  label: string;
  // Peso maximo do criterio (a soma dos pesos e 100).
  weight: number;
  // Pontos efetivamente ganhos neste criterio (0..weight).
  achieved: number;
  detail: string;
}

export interface ResumeScoreResult {
  score: number;
  faixa: ResumeFaixa;
  criterios: ResumeScoreCriterion[];
}

// Pesos dos criterios. Ajustaveis; a soma DEVE permanecer 100. // TODO: calibrar.
// Calibracao: os dois checks novos (github_link e palavras_vagas) entraram
// tirando pontos proporcionalmente dos cinco originais (20/30/15/20/15 virou
// 18/28/13/18/13), mantendo secoes como o criterio mais pesado e o github como
// bonus pequeno; 18+28+13+18+13+4+6 = 100.
const WEIGHT_CONTACT = 18;
const WEIGHT_SECTIONS = 28;
const WEIGHT_LENGTH = 13;
const WEIGHT_ACTION_VERBS = 18;
const WEIGHT_METRICS = 13;
const WEIGHT_GITHUB = 4;
const WEIGHT_VAGUE = 6;

// Normaliza para deteccao por palavra-chave: minusculas e sem acentos
// (remove os combinantes U+0300..U+036F apos decompor em NFD).
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/;
const SOCIAL_RE = /linkedin\.com|github\.com/;

// Grupos de palavras-chave que identificam cada secao essencial. Basta UMA
// palavra do grupo aparecer para a secao contar como presente. BILINGUE
// (pt-BR e en): curriculo em ingles com Work Experience/Education/Goal/Skills
// pontua igual ao equivalente em portugues. Case-insensitive e sem acentos
// (o normalize ja cuida).
const SECTION_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  {
    label: "experiencia",
    keywords: [
      "experiencia",
      "atuacao profissional",
      "historico profissional",
      "experience",
      "work experience",
      "employment history",
      "professional background",
    ],
  },
  {
    label: "formacao",
    keywords: [
      "formacao",
      "educacao",
      "academic",
      "graduacao",
      "curso superior",
      "education",
      "degree",
    ],
  },
  {
    label: "habilidades",
    keywords: [
      "habilidade",
      "skills",
      "competencia",
      "tecnologias",
      "stack",
      "technologies",
      "competencies",
    ],
  },
  {
    label: "objetivo ou resumo",
    keywords: [
      "objetivo",
      "resumo",
      "sobre mim",
      "perfil profissional",
      "goal",
      "summary",
      "objective",
      "about me",
      "professional profile",
    ],
  },
];

// Radicais de verbos de acao, pt-BR e en (cobrem variacoes: "desenvolvi",
// "desenvolvendo", "developed", "developing"). Casados com fronteira de
// palavra no inicio (\b + radical) para radical curto nao casar dentro de
// outra palavra (ex: "led" dentro de "knowledge"). Os radicais en evitam
// sobrepor os pt/neutros ja presentes (implement, integr) para o mesmo verbo
// nao contar como dois tipos.
const ACTION_VERB_STEMS = [
  "desenvolv",
  "implement",
  "lider",
  "criei",
  "otimiz",
  "automatiz",
  "constru",
  "reduzi",
  "aument",
  "migr",
  "projet",
  "integr",
  "entreg",
  "coorden",
  "develop",
  "buil",
  "design",
  "creat",
  "led",
  "launch",
  "deliver",
  "optimiz",
  "automated",
  "reduc",
  "increas",
  "improv",
  "manag",
  "achiev",
];
// Quantos radicais distintos valem pontuacao cheia. // TODO: calibrar.
const ACTION_VERBS_TARGET = 5;

// Numeros que sugerem metrica ou resultado: percentuais, dinheiro ou
// quantidades com dois ou mais digitos.
const METRIC_RE = /\d+\s*%|r\$\s?\d+|\b\d{2,}\b/g;
// Quantas ocorrencias valem pontuacao cheia. // TODO: calibrar.
const METRICS_TARGET = 3;

function contactCriterion(raw: string, norm: string): ResumeScoreCriterion {
  const found = [
    EMAIL_RE.test(raw),
    PHONE_RE.test(raw),
    SOCIAL_RE.test(norm),
  ].filter(Boolean).length;
  const achieved = Math.round((WEIGHT_CONTACT * found) / 3);
  // TODO(Ana): revisar os textos de detail dos criterios do score.
  return {
    id: "contato",
    label: "Contato detectavel",
    weight: WEIGHT_CONTACT,
    achieved,
    detail: `${found} de 3 canais encontrados (email, telefone, LinkedIn ou GitHub).`,
  };
}

function sectionsCriterion(norm: string): ResumeScoreCriterion {
  const present = SECTION_KEYWORDS.filter((group) =>
    group.keywords.some((keyword) => norm.includes(keyword)),
  );
  const achieved = Math.round(
    (WEIGHT_SECTIONS * present.length) / SECTION_KEYWORDS.length,
  );
  const missing = SECTION_KEYWORDS.filter((g) => !present.includes(g)).map(
    (g) => g.label,
  );
  return {
    id: "secoes",
    label: "Secoes essenciais",
    weight: WEIGHT_SECTIONS,
    achieved,
    detail:
      missing.length === 0
        ? "Todas as secoes essenciais presentes."
        : `Faltando: ${missing.join(", ")}.`,
  };
}

function lengthCriterion(raw: string): ResumeScoreCriterion {
  const chars = raw.length;
  // Faixas de tamanho: muito curto nao mostra a pessoa; muito longo ninguem le.
  let fraction: number;
  let detail: string;
  if (chars < 800) {
    fraction = 0.3;
    detail = "Muito curto: dificilmente cobre o essencial.";
  } else if (chars < 2000) {
    fraction = 0.7;
    detail = "Um pouco curto: da pra detalhar mais as experiencias.";
  } else if (chars <= 9000) {
    fraction = 1;
    detail = "Tamanho adequado.";
  } else {
    fraction = 0.6;
    detail = "Longo demais: corte o que nao sustenta o objetivo.";
  }
  return {
    id: "tamanho",
    label: "Tamanho adequado",
    weight: WEIGHT_LENGTH,
    achieved: Math.round(WEIGHT_LENGTH * fraction),
    detail,
  };
}

function actionVerbsCriterion(norm: string): ResumeScoreCriterion {
  const found = ACTION_VERB_STEMS.filter((stem) =>
    new RegExp(`\\b${stem}`).test(norm),
  ).length;
  const fraction = Math.min(1, found / ACTION_VERBS_TARGET);
  return {
    id: "verbos",
    label: "Verbos de acao",
    weight: WEIGHT_ACTION_VERBS,
    achieved: Math.round(WEIGHT_ACTION_VERBS * fraction),
    detail: `${found} tipos de verbo de acao encontrados (alvo: ${ACTION_VERBS_TARGET}).`,
  };
}

const GITHUB_RE = /github\.com\//;

// Bonus explicito de GitHub: o check de contato continua aceitando LinkedIn
// OU GitHub como canal; este da hint proprio pra quem ainda nao linkou.
function githubCriterion(norm: string): ResumeScoreCriterion {
  const has = GITHUB_RE.test(norm);
  // TODO(Ana): revisar os textos de detail do check de GitHub.
  return {
    id: "github_link",
    label: "Perfil GitHub linkado",
    weight: WEIGHT_GITHUB,
    achieved: has ? WEIGHT_GITHUB : 0,
    detail: has
      ? "Link do GitHub encontrado."
      : "Sem link do GitHub: em tecnologia, ele e seu portfolio. Adicione.",
  };
}

// Intensificadores vagos, pt-BR e en. Excesso acima do limiar por 1000
// caracteres zera o criterio (penalidade leve: peso pequeno).
const VAGUE_WORDS = [
  "significantly",
  "considerably",
  "various",
  "numerous",
  "extensively",
  "substantially",
  "significativamente",
  "consideravelmente",
  "diversos",
  "diversas",
  "varios",
  "varias",
  "inumeros",
  "inumeras",
  "amplamente",
];
// Ocorrencias toleradas por 1000 caracteres. // TODO: calibrar.
const VAGUE_PER_1000_LIMIT = 2;

function vagueWordsCriterion(norm: string): ResumeScoreCriterion {
  let count = 0;
  for (const word of VAGUE_WORDS) {
    count += (norm.match(new RegExp(`\\b${word}\\b`, "g")) ?? []).length;
  }
  const per1000 = (count / Math.max(norm.length, 1)) * 1000;
  const ok = per1000 <= VAGUE_PER_1000_LIMIT;
  // TODO(Ana): revisar os textos de detail do check de palavras vagas.
  return {
    id: "palavras_vagas",
    label: "Sem palavras vagas em excesso",
    weight: WEIGHT_VAGUE,
    achieved: ok ? WEIGHT_VAGUE : 0,
    detail: ok
      ? "Sem excesso de intensificadores vagos."
      : `${count} intensificadores vagos (significativamente, diversos, various...): troque por numero ou corte.`,
  };
}

function metricsCriterion(norm: string): ResumeScoreCriterion {
  const found = (norm.match(METRIC_RE) ?? []).length;
  const fraction = Math.min(1, found / METRICS_TARGET);
  return {
    id: "metricas",
    label: "Numeros e resultados",
    weight: WEIGHT_METRICS,
    achieved: Math.round(WEIGHT_METRICS * fraction),
    detail: `${found} numeros ou metricas encontrados (alvo: ${METRICS_TARGET}).`,
  };
}

// Nota deterministica 0-100: soma dos pontos ganhos por criterio. Mesma
// entrada produz SEMPRE a mesma nota; a IA nao participa deste calculo.
export function computeResumeScore(resumeText: string): ResumeScoreResult {
  const raw = resumeText;
  const norm = normalize(resumeText);
  const criterios = [
    contactCriterion(raw, norm),
    sectionsCriterion(norm),
    lengthCriterion(raw),
    actionVerbsCriterion(norm),
    metricsCriterion(norm),
    githubCriterion(norm),
    vagueWordsCriterion(norm),
  ];
  const score = Math.min(
    100,
    criterios.reduce((sum, c) => sum + c.achieved, 0),
  );
  return { score, faixa: resumeFaixaFromScore(score), criterios };
}

// Vocabulario de secoes: o mesmo do CurriculoSchema (frente criar do zero),
// mais "contato" (cabecalho). Mantem as duas frentes falando a mesma lingua.
export const RESUME_SECTIONS = [
  "contato",
  "objetivo",
  "formacao",
  "experiencias",
  "projetos",
  "habilidades",
  "idiomas",
] as const;

const SugestaoSecaoSchema = z.object({
  secao: z.enum(RESUME_SECTIONS),
  diagnostico: z.string(),
  sugestaoReescrita: z.string(),
});

export type ResumeSugestaoSecao = z.infer<typeof SugestaoSecaoSchema>;

const AderenciaVagaSchema = z.object({
  avaliacao: z.string(),
  palavrasChavePresentes: z.array(z.string()),
  palavrasChaveFaltando: z.array(z.string()),
  recomendacoes: z.array(z.string()),
});

export type ResumeAderenciaVaga = z.infer<typeof AderenciaVagaSchema>;

// O que a IA devolve (json_schema strict). aderenciaVaga SO quando o input
// trouxe vaga; sem vaga o modelo devolve null (instruido no prompt e aceito
// pelo nullable).
export const ResumeAnalysisModelSchema = z.object({
  resumoGeral: z.string(),
  pontosFortes: z.array(z.string()).min(3).max(6),
  pontosFracos: z.array(z.string()).min(3).max(6),
  sugestoesPorSecao: z.array(SugestaoSecaoSchema).min(3).max(7),
  aderenciaVaga: AderenciaVagaSchema.nullable(),
});

export type ResumeAnalysisModel = z.infer<typeof ResumeAnalysisModelSchema>;
