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

import { normalizeProfileLines } from "./normalizeProfileText";

export interface LinkedinExperiencia {
  /** Só o cargo. A empresa nunca vem colada aqui. */
  titulo: string;
  /**
   * Empresa do cargo. No formato agrupado o export escreve a empresa uma vez
   * só, no topo do grupo, e ela é propagada para todos os cargos aninhados.
   * Só fica null quando o próprio PDF não traz empresa nenhuma antes da
   * primeira data.
   */
  empresa: string | null;
  descricao: string;
}

export interface LinkedinParsed {
  headline: string | null;
  sobre: string | null;
  experiencias: LinkedinExperiencia[];
  /** Competências lidas da seção do PDF (sinal extra, não é o form). */
  skillsPdf: string[];
  /**
   * Linhas das seções Formação e Certificações, cruas.
   *
   * Não entram em check nenhum e não tocam a nota: existem para a recomendação
   * de cursos poder deduplicar contra o que a pessoa já tem. Recomendar CS50 de
   * Harvard para quem tem Harvard na formação é o caso que motivou.
   */
  formacao: string[];
  certificacoes: string[];
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

/**
 * Marcador de bullet. Escrito com escape unicode pelo mesmo motivo de DASH:
 * caractere de travessão literal é proibido no projeto.
 */
const BULLET_RE = new RegExp(
  `^(?:[\\u2022\\u00b7\\u25aa\\u25e6\\u25cf*+]|${DASH})\\s+`,
);

const UNIDADE_DURACAO = "(?:anos?|meses|mes|years?|yrs?|months?|mos?)";
const DURACAO_RE = new RegExp(
  `^\\d+\\s+${UNIDADE_DURACAO}(?:\\s+\\d+\\s+${UNIDADE_DURACAO})*$`,
);

/**
 * A linha é só uma duração ("3 anos", "1 year 1 month", "(4 months)")?
 *
 * É o que distingue o bloco AGRUPADO do simples: quando uma empresa tem vários
 * cargos, o export coloca a duração total do grupo entre a empresa e o primeiro
 * cargo, e ela não é um intervalo de datas (não tem ano nem nome de mês), então
 * `isDateRangeLine` não a enxerga. Sem reconhecê-la aqui, ela fica órfã e cai na
 * descrição da experiência anterior, levando a empresa junto.
 */
function ehLinhaDeDuracao(linha: string): boolean {
  const limpo = linha.trim().replace(/^\(/, "").replace(/\)$/, "").trim();
  return DURACAO_RE.test(stripAccentsLower(limpo));
}

const MODALIDADE_RE = /^(?:remote|remoto|hibrido|hybrid|on-?site|presencial)\b/;

// Caixa da primeira letra sem `\p{Lu}`: o target do tsconfig não aceita a flag
// `u`, e comparar com toLocaleUpperCase cobre acentuada do mesmo jeito. Dígito
// e pontuação não são nem uma coisa nem outra.
function comecaMaiuscula(valor: string): boolean {
  const c = valor.charAt(0);
  return c !== "" && c === c.toLocaleUpperCase() && c !== c.toLocaleLowerCase();
}

function comecaMinuscula(valor: string): boolean {
  const c = valor.charAt(0);
  return c !== "" && c === c.toLocaleLowerCase() && c !== c.toLocaleUpperCase();
}

/**
 * A linha é uma localização de trabalho?
 *
 * Substitui a heurística de comprimento (`< 18`), que era uma regra de tamanho
 * fazendo trabalho de regra de forma: pulava "Brazil" e "São Paulo, Brazil" mas
 * deixava "Campinas, São Paulo, Brazil" (27 caracteres) entrar na descrição.
 *
 * A forma de uma localização é: poucas palavras, no máximo quatro partes
 * separadas por vírgula, cada parte começando em maiúscula, sem pontuação de
 * fim de frase e sem marcador de bullet. Uma frase de descrição que comece com
 * nome de cidade não passa, porque tem mais de sete palavras ou termina em
 * ponto. Só é consultada na posição logo após a data, onde o export põe a
 * localização, nunca no meio do texto.
 */
function ehLinhaDeLocalizacao(linha: string): boolean {
  const t = linha.trim();
  if (t.length === 0 || t.length > 60) return false;
  if (BULLET_RE.test(t)) return false;
  if (/[.;:]$/.test(t)) return false;
  if (isDateRangeLine(t)) return false;
  if (ehLinhaDeDuracao(t)) return false;
  if (matchSectionHeader(t)) return false;
  if (t.split(/\s+/).length > 7) return false;
  if (MODALIDADE_RE.test(stripAccentsLower(t))) return true;
  const partes = t
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (partes.length === 0 || partes.length > 4) return false;
  return partes.every(
    (p) => comecaMaiuscula(p) && p.split(/\s+/).length <= 4,
  );
}

/**
 * A linha pode ser empresa ou cargo (cabeçalho de bloco de experiência)?
 *
 * O que ela precisa REJEITAR é o que produziu dois dos bugs: bullet de
 * descrição (o último bullet de um cargo virava parte do título do cargo
 * seguinte) e linha de duração órfã (a duração do grupo virava parte do
 * título). Frase de descrição também não passa: termina em pontuação, ou é
 * longa, ou começa em minúscula.
 */
function ehLinhaDeCabecalho(linha: string): boolean {
  const t = linha.trim();
  if (t.length === 0 || t.length > 80) return false;
  if (BULLET_RE.test(t)) return false;
  if (/[.;:,]$/.test(t)) return false;
  if (isDateRangeLine(t)) return false;
  if (ehLinhaDeDuracao(t)) return false;
  if (matchSectionHeader(t)) return false;
  if (t.split(/\s+/).length > 12) return false;
  if (comecaMinuscula(t)) return false;
  return true;
}

const EMAIL_RE = /\S+@\S+\.\S+/;
const URL_RE = /(https?:\/\/|www\.|linkedin\.com|github\.com)/i;
const PHONE_RE = /^[\s()+\d.-]{7,}$/;

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

/**
 * Um bloco de experiência já delimitado: onde o cabeçalho começa, onde está a
 * data que ancora o bloco, e o que o cabeçalho continha.
 */
interface BlocoExperiencia {
  headerStart: number;
  dateIdx: number;
  empresa: string | null;
  titulo: string;
}

/**
 * Lê o cabeçalho de um bloco andando PARA TRÁS a partir da linha de data.
 *
 * O export do LinkedIn tem dois formatos, e este é o único lugar do parser que
 * sabe disso:
 *
 *   SIMPLES                        AGRUPADO (uma empresa, vários cargos)
 *   Empresa                        Empresa
 *   Cargo                          1 year 1 month     <- duração do grupo
 *   janeiro de 2022 - Present      Cargo 1
 *   3 anos                         agosto de 2024 - novembro de 2024
 *   São Paulo, Brasil              São Paulo, Brasil
 *   descrição...                   descrição...
 *                                  Cargo 2            <- SEM empresa de novo
 *                                  novembro de 2023 - novembro de 2024
 *                                  descrição...
 *
 * Daí a ordem da leitura: cargo, depois duração opcional do grupo, depois
 * empresa opcional. `limite` é o índice da data anterior: o cabeçalho nunca a
 * atravessa.
 */
function lerCabecalho(
  content: string[],
  dateIdx: number,
  limite: number,
): BlocoExperiencia {
  let i = dateIdx - 1;
  let titulo = "";
  let empresa: string | null = null;
  if (i > limite && ehLinhaDeCabecalho(content[i])) {
    titulo = content[i];
    i -= 1;
  }
  if (i > limite && ehLinhaDeDuracao(content[i])) i -= 1;
  if (titulo && i > limite && ehLinhaDeCabecalho(content[i])) {
    empresa = content[i];
    i -= 1;
  }
  return { headerStart: i + 1, dateIdx, empresa, titulo };
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
    return [{ titulo, empresa: null, descricao }];
  }

  const blocos = dateIdx.map((di, e) =>
    lerCabecalho(content, di, e > 0 ? dateIdx[e - 1] : -1),
  );

  // Propagação da empresa do grupo. No formato agrupado o export escreve a
  // empresa UMA vez, no topo, e os cargos seguintes vêm sem ela. Ler isso como
  // "cargo sem empresa" é herdar o bug: a empresa existe no PDF e vale para
  // todos os cargos do grupo, não só para o primeiro. Um cargo sem linha de
  // empresa própria é, por construção do export, continuação do grupo anterior.
  // A primeira experiência não tem de quem herdar e continua null.
  for (let e = 1; e < blocos.length; e += 1) {
    if (blocos[e].empresa === null) blocos[e].empresa = blocos[e - 1].empresa;
  }

  return blocos.flatMap((bloco, e) => {
    // A descrição termina onde começa o CABEÇALHO do bloco seguinte, não na
    // data seguinte. É a correção de fundo: entre uma data e a próxima existe o
    // cabeçalho do vizinho, e a janela antiga o engolia. Com o fim no lugar
    // certo, "descrição vazia" passa a existir como resultado possível, em vez
    // de virar o nome da empresa seguinte.
    const fim =
      e + 1 < blocos.length ? blocos[e + 1].headerStart : content.length;
    // Depois da data vêm até duas linhas de metadado (duração e localização),
    // em qualquer ordem. Metadado não é descrição.
    let inicio = bloco.dateIdx + 1;
    for (let n = 0; n < 2 && inicio < fim; n += 1) {
      const linha = content[inicio];
      if (!ehLinhaDeDuracao(linha) && !ehLinhaDeLocalizacao(linha)) break;
      inicio += 1;
    }
    const descricao = content.slice(inicio, fim).join(" ").trim();
    if (!bloco.titulo && !bloco.empresa && !descricao) return [];
    return [{ titulo: bloco.titulo, empresa: bloco.empresa, descricao }];
  });
}

export function parseLinkedinText(text: string): LinkedinParsed {
  // UMA passada de normalizacao antes de qualquer parser especifico: junta
  // continuacao de linha quebrada pelo PDF e remove rodape de paginacao. Client
  // e servidor chamam esta mesma funcao, entao veem exatamente o mesmo texto.
  const lines = normalizeProfileLines(text);

  if (lines.length === 0) {
    return {
      headline: null,
      sobre: null,
      experiencias: [],
      skillsPdf: [],
      formacao: [],
      certificacoes: [],
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
  const formacao = sectionLines(lines, hits, "formacao").slice(0, 20);
  const certificacoes = sectionLines(lines, hits, "certificacoes").slice(0, 20);

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

  return {
    headline,
    sobre,
    experiencias,
    skillsPdf,
    formacao,
    certificacoes,
    usable,
  };
}
