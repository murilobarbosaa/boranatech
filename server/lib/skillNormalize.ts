import { TECH_AREA_MAP } from "../../shared/techAreas";

/**
 * Normalização e matching de skills/tecnologias para o analisador de LinkedIn.
 *
 * Tudo aqui é função pura, sem IO. A fonte das tecnologias por área é
 * shared/techAreas.ts (TECH_AREA_MAP), a mesma usada pelo client.
 */

/** Lowercase, sem acento, sem espaço duplo, trim. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Grupos de aliases. Cada grupo lista as formas equivalentes (serão
 * normalizadas). Inclua sempre a forma normalizada do nome canônico da
 * tecnologia no grupo, pra ligar a tecnologia aos seus apelidos. Estruturado
 * como lista de listas pra ser trivial de expandir.
 */
const ALIAS_GROUPS: string[][] = [
  ["js", "javascript"],
  ["ts", "typescript"],
  ["node", "nodejs", "node.js"],
  ["react", "reactjs", "react.js"],
  ["vue", "vuejs", "vue.js"],
  ["next", "nextjs", "next.js"],
  ["postgres", "postgresql"],
  ["c#", "csharp"],
  [".net", "dotnet"],
  ["tailwind", "tailwindcss", "tailwind css"],
  ["golang", "go"],
  ["k8s", "kubernetes"],
  ["aws", "amazon web services"],
  ["gcp", "google cloud"],
  ["sql server", "mssql"],
  ["html", "html5"],
  ["css", "css3"],
  ["power bi", "powerbi"],
  ["sci-kit", "scikit-learn", "sklearn"],
];

/** Mapa term normalizado -> lista de variantes normalizadas do mesmo grupo. */
const ALIAS_LOOKUP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of ALIAS_GROUPS) {
    const normalizedGroup = Array.from(new Set(group.map(normalize)));
    for (const term of normalizedGroup) {
      map.set(term, normalizedGroup);
    }
  }
  return map;
})();

/** Escapa caracteres especiais de regex. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Presença de um termo no texto com fronteiras de palavra. O texto e o termo
 * já devem estar normalizados. As fronteiras evitam que "java" case dentro de
 * "javascript" e que "c" case dentro de "c#" ou "c++": um termo só vale se não
 * estiver colado a outro caractere alfanumerico (ou a # e + no fim, pra
 * proteger linguagens como C de casar em C# ou C++).
 */
export function containsTerm(textNormalized: string, termNormalized: string): boolean {
  if (!termNormalized) return false;
  const re = new RegExp(
    `(?<![a-z0-9])${escapeRegExp(termNormalized)}(?![a-z0-9#+])`,
  );
  return re.test(textNormalized);
}

/** Lista de busca de uma tecnologia: o nome mais os apelidos do grupo. */
function searchTermsFor(techName: string): string[] {
  const n = normalize(techName);
  const group = ALIAS_LOOKUP.get(n);
  if (group) {
    return Array.from(new Set([n, ...group]));
  }
  return [n];
}

/** Todas as tecnologias conhecidas (chaves do mapa canônico). */
export const ALL_TECHNOLOGIES: string[] = Object.keys(TECH_AREA_MAP);

/** Tecnologias-chave de uma área (derivadas do TECH_AREA_MAP). */
export function keyTechnologiesForArea(area: string): string[] {
  return ALL_TECHNOLOGIES.filter((tech) => TECH_AREA_MAP[tech]?.includes(area));
}

export interface TechMatchResult {
  encontradas: string[];
  faltantes: string[];
}

/**
 * Dado um texto livre e uma lista de tecnologias, separa em encontradas e
 * faltantes usando normalização, aliases e fronteiras de palavra. Preserva a
 * ordem da lista de entrada.
 */
export function matchTechnologies(text: string, techs: string[]): TechMatchResult {
  const haystack = normalize(text);
  const encontradas: string[] = [];
  const faltantes: string[] = [];
  for (const tech of techs) {
    const terms = searchTermsFor(tech);
    const hit = terms.some((term) => containsTerm(haystack, term));
    if (hit) {
      encontradas.push(tech);
    } else {
      faltantes.push(tech);
    }
  }
  return { encontradas, faltantes };
}

/** Quantas tecnologias conhecidas (de qualquer área) aparecem no texto. */
export function countKnownTechnologies(text: string): number {
  return matchTechnologies(text, ALL_TECHNOLOGIES).encontradas.length;
}

// Matching de cargo (títulos) por tokens, tolerante a senioridade e a
// variações de hífen (front-end vs frontend).

const ROLE_STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "of",
  "the",
  "and",
  "a",
  "o",
]);

const ROLE_SENIORITY = new Set([
  "junior",
  "jr",
  "pleno",
  "senior",
  "sr",
  "mid",
  "i",
  "ii",
  "iii",
  "associate",
  "trainee",
  "estagio",
  "estagiario",
  "especialista",
]);

/** Normalização de papel: remove hífens e pontos pra colar front-end e frontend. */
function roleNormalize(value: string): string {
  return normalize(value).replace(/[-.]/g, "");
}

/**
 * Colapsa gênero gramatical: remove a vogal final a/o de tokens longos
 * (desenvolvedora vira desenvolvedor, engenheira e engenheiro viram engenheir).
 * Aplicado depois de remover senioridade, pra "pleno" ainda ser reconhecido.
 */
function degender(token: string): string {
  return token.length > 4 && /[ao]$/.test(token) ? token.slice(0, -1) : token;
}

/** Tokens de conteúdo de um texto (sem stopwords). */
function roleTokens(value: string): string[] {
  return roleNormalize(value)
    .split(" ")
    .filter((token) => token.length > 0)
    .filter((token) => !ROLE_STOPWORDS.has(token));
}

/** Tokens distintivos de um título: sem stopwords e sem senioridade. */
function titleCoreTokens(title: string): string[] {
  return roleTokens(title).filter((token) => !ROLE_SENIORITY.has(token));
}

/**
 * O texto contém algum dos títulos? Casa quando todos os tokens distintivos
 * de algum título aparecem no conjunto de tokens do texto. Order-independent,
 * tolerante a senioridade e a gênero ("Desenvolvedor Front-end Júnior" casa
 * com um perfil que diz "desenvolvedora frontend").
 */
export function matchesAnyTitle(text: string, titles: string[]): boolean {
  const textTokens = new Set(roleTokens(text).map(degender));
  if (textTokens.size === 0) return false;
  return titles.some((title) => {
    const core = titleCoreTokens(title).map(degender);
    return core.length > 0 && core.every((token) => textTokens.has(token));
  });
}

// Heurística de idioma (PT vs EN) por marcadores. Pura e testável.

const PT_MARKERS = new Set([
  "de",
  "para",
  "com",
  "que",
  "em",
  "uma",
  "desenvolvedor",
  "analise",
  "dados",
  "experiencia",
  "seguranca",
]);

const EN_MARKERS = new Set([
  "the",
  "and",
  "with",
  "for",
  "of",
  "to",
  "developer",
  "engineer",
  "data",
  "experience",
  "security",
]);

/**
 * Texto majoritariamente em inglês? Conta marcadores EN contra PT. Empate e
 * ausência total de sinal contam como não-inglês, pra não marcar um texto em
 * português como inglês por falta de pista.
 */
export function isMostlyEnglish(text: string): boolean {
  const tokens = normalize(text).split(" ");
  let en = 0;
  let pt = 0;
  for (const token of tokens) {
    if (EN_MARKERS.has(token)) en += 1;
    if (PT_MARKERS.has(token)) pt += 1;
  }
  return en > pt;
}
