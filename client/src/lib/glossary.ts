import { dictionaryTerms } from "@/lib/platformData";

export interface GlossaryEntry {
  term: string;
  meaning: string;
  slug: string;
}

export function normalizeTermKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const glossaryMap = new Map<string, GlossaryEntry>();

for (const item of dictionaryTerms) {
  const slug = normalizeTermKey(item.term);
  const existing = glossaryMap.get(slug);
  if (existing) {
    if (import.meta.env.DEV) {
      console.warn(
        `[glossary] chave duplicada "${slug}": mantido "${existing.term}", ignorado "${item.term}".`,
      );
    }
    continue;
  }
  glossaryMap.set(slug, { term: item.term, meaning: item.meaning, slug });
}

export function getGlossaryTerm(key: string): GlossaryEntry | null {
  return glossaryMap.get(normalizeTermKey(key)) ?? null;
}
