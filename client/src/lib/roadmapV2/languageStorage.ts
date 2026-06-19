// Persistencia da linguagem escolhida na trilha, por slug. Mesmo padrao de IO
// tolerante a falha do progressStorage: qualquer problema (chave ausente,
// storage indisponivel) degrada para null (sem preferencia salva) e o chamador
// decide o default. So faz sentido em trilhas que declaram `languages`.

const KEY_PREFIX = "bora-na-tech:roadmap-lang:";

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

export function loadLanguage(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(keyFor(slug));
  } catch {
    return null;
  }
}

export function saveLanguage(slug: string, languageId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(slug), languageId);
  } catch {
    // no-op: persistir preferencia e best-effort.
  }
}
