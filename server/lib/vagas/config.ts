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

// Cadencia minima entre rodadas por fonte (gate via Redis no orquestrador).
export const SYNC_INTERVALS_MIN: Record<JobSource, number> = {
  github: 60,
  adzuna: 360,
  jooble: 360,
  ats_boards: 360,
};

export const FETCH_TIMEOUT_MS = 15_000;
