// Persistencia do progresso da trilha em localStorage, por slug (uma chave por
// area, pra nao colidir quando houver mais roadmaps). IO isolado: qualquer falha
// (chave ausente, JSON corrompido, storage indisponivel) degrada para "sem
// progresso" (Set vazio), nunca confunde "falhou ao ler" com outro estado.

const KEY_PREFIX = "bora-na-tech:roadmap-progress:";

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

export function loadProgress(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveProgress(slug: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(Array.from(ids)));
  } catch {
    // no-op: persistir progresso e best-effort.
  }
}
