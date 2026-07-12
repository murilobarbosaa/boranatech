// Filtro deterministico de relevancia TI do pipeline de vagas (fase 6).
// Sem IA e sem chamadas externas: só o titulo contra as listas do config.
// Motivo: a categoria it-jobs da Adzuna e ruidosa na origem e os boards de
// ATS devolvem a empresa inteira (vendas, juridico, tax...). O github fica
// ISENTO no orquestrador (repos de comunidade sao 100% TI por curadoria) e
// source='manual' nunca passa por aqui.

import {
  RELEVANCE_EXCLUSIONS,
  RELEVANCE_STRONG_ACRONYMS,
  RELEVANCE_STRONG_SUBSTRINGS,
  RELEVANCE_STRONG_WORDS,
} from "./config";
import { detectArea } from "./normalize";

// Minusculas, sem acentos, hifens/underscores viram espaco, apostrofes
// normalizadas: "Développeur Front-End" -> "developpeur front end".
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Fronteira "razoavel": inicio/fim ou qualquer coisa que nao seja letra ou
// digito dos dois lados (cobre "qa," "(qa)" "qa:" sem casar "aqua").
const WORD_REGEXES = RELEVANCE_STRONG_WORDS.map(
  (term) =>
    new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`),
);

const ACRONYM_REGEXES = RELEVANCE_STRONG_ACRONYMS.map(
  (term) => new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(term)}([^A-Za-z0-9]|$)`),
);

function hasStrongTerm(rawTitle: string, normalized: string): boolean {
  if (WORD_REGEXES.some((re) => re.test(normalized))) return true;
  if (RELEVANCE_STRONG_SUBSTRINGS.some((s) => normalized.includes(s)))
    return true;
  // Siglas em maiuscula sobre o titulo ORIGINAL (IT/TI/AI... como palavra).
  return ACRONYM_REGEXES.some((re) => re.test(rawTitle));
}

export function isTechJob(title: string): boolean {
  const normalized = normalizeTitle(title);
  if (!normalized) return false;

  // 1) termo forte: entra, sem veto possivel.
  if (hasStrongTerm(title, normalized)) return true;

  // 2) exclusao: veta o tier ambiguo abaixo (ex.: "recruiter" contem "ui").
  if (RELEVANCE_EXCLUSIONS.some((term) => normalized.includes(term))) {
    return false;
  }

  // 3) tier ambiguo: as keywords de area do detectArea (substring larga).
  return detectArea(title) !== null;
}
