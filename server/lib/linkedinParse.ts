/**
 * Parser do texto extraído do PDF de perfil do LinkedIn.
 *
 * Função pura, sem IO. Tolera ausência de qualquer seção. Detecta cabeçalhos
 * em português e inglês. Nunca inventa conteúdo: campo não detectado vira
 * null ou array vazio. Quando nada de útil é extraído, usable fica false e a
 * rota transforma isso num 422 pedindo pra colar o texto manualmente.
 *
 * O layout do "Salvar como PDF" do LinkedIn costuma trazer a coluna lateral
 * (Contato, Principais competências, Idiomas, Certificações) antes do nome e
 * da headline, que aparecem logo antes da seção Resumo. A detecção de headline
 * é best-effort: prefere null a devolver lixo (o nome da pessoa, um e-mail).
 */

export interface LinkedinExperiencia {
  titulo: string;
  descricao: string;
}

export interface LinkedinParsed {
  headline: string | null;
  sobre: string | null;
  experiencias: LinkedinExperiencia[];
  /** Competências lidas da seção do PDF (sinal extra, não é o form). */
  skillsPdf: string[];
  /** Falso quando o texto não tem nada de aproveitável. Vira 422 na rota. */
  usable: boolean;
}

type SectionKey =
  | "contato"
  | "sobre"
  | "experiencia"
  | "formacao"
  | "skills"
  | "idiomas"
  | "certificacoes";

interface SectionHeaderHit {
  index: number;
  key: SectionKey;
}

function stripAccentsLower(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Cabeçalhos de seção, já em forma sem acento e minúscula.
const SECTION_HEADERS: { key: SectionKey; labels: string[] }[] = [
  { key: "contato", labels: ["contact", "contato"] },
  { key: "sobre", labels: ["summary", "resumo", "sobre", "about"] },
  {
    key: "experiencia",
    labels: ["experience", "experiencia", "experiencia profissional"],
  },
  {
    key: "formacao",
    labels: ["education", "formacao academica", "formacao", "educacao"],
  },
  {
    key: "skills",
    labels: [
      "top skills",
      "principais competencias",
      "skills",
      "competencias",
      "aptidoes",
    ],
  },
  { key: "idiomas", labels: ["languages", "idiomas"] },
  {
    key: "certificacoes",
    labels: [
      "licenses & certifications",
      "licencas e certificados",
      "certifications",
      "certificacoes",
      "certificados",
    ],
  },
];

function matchSectionHeader(line: string): SectionKey | null {
  const l = stripAccentsLower(line);
  if (l.length === 0 || l.length > 40) return null;
  for (const entry of SECTION_HEADERS) {
    if (entry.labels.includes(l)) return entry.key;
  }
  return null;
}

// Dashes (hífen ASCII e variantes Unicode) sem usar o caractere literal,
// que é proibido em strings do projeto.
const DASH = "[\\u2010-\\u2015-]";

const MONTHS_RE =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)";

const YEAR_RE = /\b(?:19|20)\d{2}\b/;
const SEP_RE = new RegExp(`(?:${DASH}|\\bto\\b|\\bate\\b)`);
const END_RE = /(?:present|presente|atual|momento|\b(?:19|20)\d{2}\b)/;
const MONTH_PRESENT_RE = new RegExp(`${MONTHS_RE}`, "i");

/** A linha é um intervalo de datas (delimita uma experiência)? */
function isDateRangeLine(line: string): boolean {
  const l = stripAccentsLower(line);
  if (l.length > 80) return false;
  const hasStart = YEAR_RE.test(l) || MONTH_PRESENT_RE.test(l);
  if (!hasStart) return false;
  if (!SEP_RE.test(l)) return false;
  return END_RE.test(l);
}

const EMAIL_RE = /\S+@\S+\.\S+/;
const URL_RE = /(https?:\/\/|www\.|linkedin\.com|github\.com)/i;
const PHONE_RE = /^[\s()+\d.-]{7,}$/;
const PAGE_RE = /^(page|pagina)\s+\d+\s+(of|de)\s+\d+$/i;

const HEADLINE_SIGNAL_RE = new RegExp(
  [
    "developer",
    "desenvolvedor",
    "engineer",
    "engenheiro",
    "analyst",
    "analista",
    "designer",
    "student",
    "estudante",
    "programador",
    "programmer",
    "scientist",
    "cientista",
    "fullstack",
    "full-stack",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "devops",
    "data",
    "dados",
    "product",
    "produto",
    "mobile",
    "cloud",
    "security",
    "seguranca",
    "qa",
    "sre",
    "dba",
    "buscando",
    "oportunidade",
    "apaixonad",
    "aprendiz",
    "transicao",
    "aspirante",
    "recolocacao",
    "open to",
    "em busca",
  ].join("|"),
  "i",
);

function isHeadlineCandidate(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 6 || trimmed.length > 250) return false;
  if (matchSectionHeader(trimmed)) return false;
  if (EMAIL_RE.test(trimmed)) return false;
  if (URL_RE.test(trimmed)) return false;
  if (PHONE_RE.test(trimmed)) return false;
  if (PAGE_RE.test(trimmed)) return false;
  if (isDateRangeLine(trimmed)) return false;
  return true;
}

/**
 * Sinal real de headline: barra de cargo, palavra de papel ou clichê de
 * perfil. Comprimento sozinho NÃO conta: uma linha longa qualquer (nome
 * composto, texto de corpo, lixo de PDF) não vira headline. Assim a headline
 * escolhida é sempre uma linha com cara de headline, não a última linha longa.
 */
function hasHeadlineSignal(line: string): boolean {
  if (line.includes("|")) return true;
  return HEADLINE_SIGNAL_RE.test(stripAccentsLower(line));
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trim();
}

function detectHeadline(
  lines: string[],
  firstMainIndex: number,
): string | null {
  const preamble =
    firstMainIndex >= 0 ? lines.slice(0, firstMainIndex) : lines.slice(0, 20);
  const candidates = preamble.filter(isHeadlineCandidate);
  const strong = candidates.filter(hasHeadlineSignal);
  if (strong.length === 0) return null;
  // O nome vem antes da headline; pegamos a candidata forte mais próxima da
  // primeira seção principal (a última da lista).
  return clip(strong[strong.length - 1], 250);
}

/** Índices de todos os cabeçalhos de seção encontrados, em ordem. */
function findSectionHeaders(lines: string[]): SectionHeaderHit[] {
  const hits: SectionHeaderHit[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const key = matchSectionHeader(lines[i]);
    if (key) hits.push({ index: i, key });
  }
  return hits;
}

/** Linhas de conteúdo de uma seção: do cabeçalho até o próximo cabeçalho. */
function sectionLines(
  lines: string[],
  hits: SectionHeaderHit[],
  key: SectionKey,
): string[] {
  const start = hits.find((hit) => hit.key === key);
  if (!start) return [];
  const next = hits.find((hit) => hit.index > start.index);
  const end = next ? next.index : lines.length;
  return lines.slice(start.index + 1, end);
}

function parseSkills(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    for (const part of line.split(/[,;|]/)) {
      const skill = part.trim();
      if (skill.length >= 2 && skill.length <= 60) out.push(skill);
    }
  }
  return Array.from(new Set(out)).slice(0, 50);
}

function parseExperiencias(lines: string[]): LinkedinExperiencia[] {
  const content = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (content.length === 0) return [];

  const dateIdx: number[] = [];
  for (let i = 0; i < content.length; i += 1) {
    if (isDateRangeLine(content[i])) dateIdx.push(i);
  }

  // Sem nenhuma linha de data: trata a seção inteira como uma experiência.
  if (dateIdx.length === 0) {
    const titulo = content[0] ?? "";
    const descricao = content.slice(1).join(" ").trim();
    if (!titulo && !descricao) return [];
    return [{ titulo, descricao }];
  }

  const experiencias: LinkedinExperiencia[] = [];
  for (let e = 0; e < dateIdx.length; e += 1) {
    const di = dateIdx[e];
    const prevDi = e > 0 ? dateIdx[e - 1] : -1;
    // Título: a linha não-vazia logo antes da data (o cargo). Pega até 2 linhas
    // anteriores que não sejam outra data, sem invadir o bloco anterior.
    const tituloParts: string[] = [];
    for (let k = di - 1; k > prevDi && tituloParts.length < 2; k -= 1) {
      if (isDateRangeLine(content[k])) break;
      tituloParts.unshift(content[k]);
    }
    const titulo = tituloParts.join(" ").trim();
    // Descrição: linhas depois da data até a próxima data. A primeira linha
    // logo após a data costuma ser duração ou localização, então pulamos uma
    // linha curta sem letras suficientes.
    const nextDi = e + 1 < dateIdx.length ? dateIdx[e + 1] : content.length;
    let descStart = di + 1;
    const firstAfter = content[descStart] ?? "";
    if (
      firstAfter &&
      (isDateRangeLine(firstAfter) ||
        /\b(yrs?|mos?|anos?|meses|mes)\b/i.test(firstAfter) ||
        firstAfter.length < 18)
    ) {
      descStart += 1;
    }
    const descricao = content.slice(descStart, nextDi).join(" ").trim();
    if (titulo || descricao) {
      experiencias.push({ titulo, descricao });
    }
  }
  return experiencias;
}

export function parseLinkedinText(text: string): LinkedinParsed {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      headline: null,
      sobre: null,
      experiencias: [],
      skillsPdf: [],
      usable: false,
    };
  }

  const hits = findSectionHeaders(lines);
  const mainKeys: SectionKey[] = ["sobre", "experiencia", "formacao"];
  const firstMain = hits.find((hit) => mainKeys.includes(hit.key));
  const firstMainIndex = firstMain ? firstMain.index : -1;

  const headline = detectHeadline(lines, firstMainIndex);

  const sobreRaw = sectionLines(lines, hits, "sobre").join(" ").trim();
  const sobre = sobreRaw.length > 0 ? sobreRaw : null;

  const experiencias = parseExperiencias(
    sectionLines(lines, hits, "experiencia"),
  );

  const skillsPdf = parseSkills(sectionLines(lines, hits, "skills"));

  // Sinal real de headline: barra de cargo, palavra de papel ou clichê de
  // perfil, nao so comprimento. Uma linha longa qualquer (lixo de PDF que nao
  // e um perfil) nao conta como aproveitavel, e a rota devolve 422.
  const headlineWordSignal =
    headline !== null &&
    (headline.includes("|") ||
      HEADLINE_SIGNAL_RE.test(stripAccentsLower(headline)));

  // Aproveitavel quando ha qualquer seção reconhecida ou um sinal real de
  // perfil. Pura repetição ou simbolos, sem nada disso, cai no 422.
  const usable =
    hits.length > 0 ||
    headlineWordSignal ||
    sobre !== null ||
    experiencias.length > 0 ||
    skillsPdf.length > 0;

  return { headline, sobre, experiencias, skillsPdf, usable };
}
