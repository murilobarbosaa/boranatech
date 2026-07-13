// Config das fontes de vagas (front VAGAS, fase 2). Valores calibrados pela
// validacao externa do Passo 0 (2026-07-12); ajustar aqui, nunca inline nos
// adapters.

import type { JobSource } from "./types";

// Paises validados na Adzuna (todos 200 na API). "pt" ficou FORA: a Adzuna
// nao cobre Portugal (404) e a chave Jooble atual tambem nao (ver abaixo);
// Portugal fica sem fonte ate haver chave Jooble do site pt.
export const ADZUNA_COUNTRIES = [
  "br",
  "us",
  "ca",
  "gb",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pl",
  "at",
] as const;

// Categoria de TI da Adzuna, validada em br, us e de (tag identica).
export const ADZUNA_IT_CATEGORY = "it-jobs";

// Fallback de busca por keyword quando a category falhar, por idioma do pais.
export const ADZUNA_KEYWORD_FALLBACK: Record<string, string> = {
  br: "desenvolvedor",
  us: "software developer",
  ca: "software developer",
  gb: "software developer",
  de: "softwareentwickler",
  fr: "developpeur",
  es: "desarrollador",
  it: "sviluppatore",
  nl: "software developer",
  pl: "programista",
  at: "softwareentwickler",
};

// A chave Jooble e emitida POR SITE de pais e a nossa e do jooble.org (US):
// us.jooble.org responde 200 com ela; br/pt/de/es/fr.jooble.org respondem
// 403. Por isso a fonte roda so a unidade us por enquanto; para outros
// paises seria preciso pedir chave no site do pais correspondente.
export const JOOBLE_UNITS: { country: string; host: string }[] = [
  { country: "us", host: "jooble.org" },
];

export const JOOBLE_KEYWORDS = [
  "software developer",
  "frontend developer",
  "backend developer",
];

// Repos de vagas do GitHub com issue aberta nos ultimos 60 dias (validacao
// do Passo 0). Ficaram fora: androiddevbr/vagas (zero issues abertas),
// CangaceirosDevels/vagas_de_emprego (parado desde 2025-02) e soujava/vagas
// (404).
export const GITHUB_REPOS = [
  "frontendbr/vagas",
  "backend-br/vagas",
  "react-brasil/vagas",
  "vuejs-br/vagas",
] as const;

// Paginas de issues por repo por rodada (50 por pagina). Sem token o adapter
// reduz para 1 pagina (rate limit anonimo de 60 req/h).
export const GITHUB_MAX_PAGES = 2;

// Boards de ATS vivos na validacao do Passo 0. Ficaram fora (404): wellhub,
// loft e creditas no Greenhouse; wildlifestudios, loggi e olist no Lever.
export const ATS_BOARDS: {
  ats: "greenhouse" | "lever";
  token: string;
  company: string;
}[] = [
  { ats: "greenhouse", token: "nubank", company: "Nubank" },
  { ats: "greenhouse", token: "quintoandar", company: "QuintoAndar" },
  { ats: "greenhouse", token: "gympass", company: "Wellhub" },
  { ats: "greenhouse", token: "ebanx", company: "EBANX" },
  { ats: "greenhouse", token: "vtex", company: "VTEX" },
  { ats: "lever", token: "cloudwalk", company: "CloudWalk" },
];

// Filtro de inclusao BR/LATAM dos boards de ATS (formatos reais observados:
// "São Paulo, São Paulo, Brazil", "BRA - English", "Curitiba | On-site",
// "Rio de Janeiro; São Paulo", "USA, Miami"). "remot" cobre remoto/remote:
// Remote generico e aceito porque o config so tem empresas com operacao BR;
// limitacao registrada (vaga remote-global da empresa entra como br).
export const ATS_BR_LOCATION_PATTERNS = [
  "brasil",
  "brazil",
  "bra -",
  "sao paulo",
  "são paulo",
  "rio de janeiro",
  "curitiba",
  "latam",
  "remot",
];

// --- Relevancia TI (fase 6) ---
// Listas do isTechJob (relevance.ts). Calibradas com amostra real de titulos
// publicados (adzuna/jooble/ats_boards, 2026-07-12). NOTA: os params
// upstream da Adzuna (what_or + title_only) foram testados e REJEITADOS:
// derrubam o volume para quase zero (br 4803 -> 1) sem melhorar a qualidade.

// Termos FORTES por palavra/frase (match com fronteira de palavra, sobre o
// titulo minusculo e sem acentos, hifens viram espaco). Nunca sao vetados
// pela lista de exclusao.
export const RELEVANCE_STRONG_WORDS = [
  // pt
  "desenvolvedor",
  "desenvolvedora",
  "programador",
  "programadora",
  "engenheiro de software",
  "engenharia de software",
  "analista de sistemas",
  "sistemas de informacao",
  "cientista de dados",
  "banco de dados",
  "dados",
  "tecnologia",
  "seguranca da informacao",
  // en
  "software",
  "developer",
  "data",
  "frontend",
  "front end",
  "backend",
  "back end",
  "full stack",
  "fullstack",
  "devops",
  "sre",
  "site reliability",
  "cloud",
  "cyber",
  "cybersecurity",
  "information security",
  "machine learning",
  "artificial intelligence",
  "quality assurance",
  "qa",
  "web",
  "website",
  "database",
  "sysadmin",
  "system administrator",
  "system engineer",
  "systems engineer",
  "systems analyst",
  "solution architect",
  "solutions architect",
  "data architect",
  "cloud architect",
  "scrum",
  "sap",
  "erp",
  "salesforce",
  "linux",
  "business intelligence",
  // calibracao fase 6 (falsos negativos da amostra real)
  "tester",
  "embedded",
  "enterprise architect",
  "network engineer",
  "db2",
  "sharepoint",
  "ict",
  // stacks (cobrem titulos tipo "Rust Engineer" sem a palavra software)
  "java",
  "python",
  "react",
  "angular",
  "node",
  "typescript",
  "javascript",
  "rust",
  "golang",
  "kotlin",
  "swift",
  "flutter",
  "php",
  "ruby",
  // fr
  "developpeur",
  "developpeuse",
  "informatique",
  "logiciel",
  "systemes d'information",
  // es
  "desarrollador",
  "desarrolladora",
  "informatica",
  // it
  "sistemista",
  // nl/pl (palavras simples; compostos ficam nos substrings)
  "programista",
  "programistka",
  "informatyk",
] as const;

// Termos FORTES por substring (linguas de palavra composta: alemao,
// holandes, italiano, polones). Sem fronteira de proposito: cobrem
// "Softwareentwickler", "Webontwikkelaar", "Sviluppatrice" etc.
export const RELEVANCE_STRONG_SUBSTRINGS = [
  "entwickler",
  "entwicklung",
  "informatik",
  "ontwikkelaar",
  "sviluppat",
  "informatyc",
  // calibracao fase 6: cobre Systemadministrator/in e variantes compostas
  "systemadmin",
  ".net",
  "c++",
  "c#",
] as const;

// Siglas fortes matchadas em MAIUSCULA no titulo ORIGINAL (com fronteira):
// evita colidir com o pronome ingles "it" e palavras comuns minusculas.
export const RELEVANCE_STRONG_ACRONYMS = [
  "IT",
  "TI",
  "AI",
  "IA",
  "QA",
  "SRE",
  "SAP",
  "ERP",
  "BI",
  "ML",
  "UX",
  "UI",
  "API",
  "AWS",
  // calibracao fase 6: EDV (TI em aleman), SOC (security operations center)
  "EDV",
  "SOC",
] as const;

// Exclusoes para falsos positivos do tier AMBIGUO (detectArea por substring:
// "recruiter" contem "ui", "back office" contem "back"...). Exclusao vence
// SOMENTE o tier ambiguo; termo forte acima nunca e vetado. Match por
// substring do titulo normalizado.
export const RELEVANCE_EXCLUSIONS = [
  "recruiter",
  "recruiting",
  "recrutamento",
  "talent acquisition",
  "back office",
  "front office",
  "front desk",
  "security guard",
  "vigilante",
  "marketing",
  "inside sales",
  "business development",
  // Todo titulo do board da QuintoAndar contem "ui" dentro do nome da
  // empresa (detectArea -> uxui); as vagas TI deles entram pelos termos
  // fortes, que a exclusao nao veta.
  "quintoandar",
  // Vagas militares/defesa dos EUA carregam "with Security Clearance" no
  // titulo e caiam no tier ambiguo via "security"; as de TI com clearance
  // entram pelos termos fortes (cloud, software, developer...).
  "security clearance",
] as const;

// Cadencia minima entre rodadas por fonte (gate via Redis no orquestrador).
export const SYNC_INTERVALS_MIN: Record<JobSource, number> = {
  github: 60,
  adzuna: 360,
  jooble: 360,
  ats_boards: 360,
};

export const FETCH_TIMEOUT_MS = 15_000;
