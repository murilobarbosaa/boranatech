// Helpers puros de normalizacao do pipeline de vagas. Contrato: NUNCA
// inventar valor; quando o dado nao permite classificar, o retorno e null e a
// UI trata a ausencia.

const MAX_DESCRIPTION_CHARS = 4000;

// Remove tags e entidades HTML basicas e colapsa espacos. Suficiente para os
// snippets da Jooble/Adzuna e o content escapado do Greenhouse; nao e um
// sanitizador de HTML (o texto vai pra coluna text, nunca re-renderizado
// como HTML).
export function stripHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(
  text: string,
  max: number = MAX_DESCRIPTION_CHARS,
): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Mapa explicito pais -> moeda para o salario estruturado da Adzuna (a API
// nao devolve currency; a moeda e a do site do pais). Nunca converter moeda.
const EURO_COUNTRIES = ["pt", "de", "fr", "es", "it", "nl", "at"];

export function currencyForCountry(country: string): string | null {
  const cc = country.toLowerCase();
  if (cc === "br") return "BRL";
  if (cc === "us") return "USD";
  if (cc === "ca") return "CAD";
  if (cc === "gb") return "GBP";
  if (cc === "pl") return "PLN";
  if (EURO_COUNTRIES.includes(cc)) return "EUR";
  return null;
}

// Mesmos keywords do detectSeniority legado do syncJobs, mas com fallback
// null em vez de "junior": ausencia de sinal nao vira dado.
export function normalizeSeniority(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("sênior") || t.includes("senior") || t.includes("sr."))
    return "senior";
  if (t.includes("pleno") || t.includes("mid")) return "pleno";
  if (
    t.includes("estágio") ||
    t.includes("estagiário") ||
    t.includes("estagio") ||
    t.includes("intern")
  )
    return "estagio";
  if (t.includes("júnior") || t.includes("junior") || t.includes("jr."))
    return "junior";
  return null;
}

export function normalizeContract(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bclt\b/.test(t)) return "clt";
  if (/\bpj\b/.test(t)) return "pj";
  return null;
}

export function normalizeModality(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("híbrido") || t.includes("hibrido") || t.includes("hybrid"))
    return "hybrid";
  if (t.includes("remoto") || t.includes("remote") || t.includes("home office"))
    return "remote";
  if (
    t.includes("presencial") ||
    t.includes("alocado") ||
    t.includes("on-site") ||
    t.includes("onsite") ||
    t.includes("on site")
  )
    return "onsite";
  return null;
}

// Deteccao de area por keyword do titulo, herdada do syncJobs legado, com
// UMA mudanca: fallback null em vez de "backend" (nao inventar area).
export function detectArea(title: string): string | null {
  const t = title.toLowerCase();
  if (
    t.includes("front") ||
    t.includes("react") ||
    t.includes("vue") ||
    t.includes("angular")
  )
    return "frontend";
  if (
    t.includes("back") ||
    t.includes("node") ||
    t.includes("python") ||
    t.includes("java")
  )
    return "backend";
  if (t.includes("dados") || t.includes("data") || t.includes("analytics"))
    return "dados";
  if (t.includes("ux") || t.includes("design") || t.includes("ui"))
    return "uxui";
  if (t.includes("devops") || t.includes("cloud") || t.includes("infra"))
    return "devops";
  if (t.includes("mobile") || t.includes("ios") || t.includes("android"))
    return "mobile";
  if (t.includes("segurança") || t.includes("security") || t.includes("cyber"))
    return "ciberseguranca";
  return null;
}

// Narrowing helpers para respostas externas (unknown -> tipos primitivos).
export function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
