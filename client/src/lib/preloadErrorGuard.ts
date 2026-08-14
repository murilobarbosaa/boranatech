import { reloadOnceForStaleChunk } from "./lazyWithRetry";

/**
 * Guarda de skew de deploy do Vite.
 *
 * Depois de um deploy, o `index.html` que ja esta na memoria do browser aponta
 * para hashes de chunk que sumiram. O preload do chunk falha e o Vite despacha
 * um evento CANCELAVEL; se ninguem cancelar, ele RELANCA o erro:
 *
 *   node_modules/.pnpm/vite@7.3.6_.../vite/dist/node/chunks/config.js:23422-23425
 *     const e$1 = new Event("vite:preloadError", { cancelable: true });
 *     e$1.payload = err$2;
 *     window.dispatchEvent(e$1);
 *     if (!e$1.defaultPrevented) throw err$2;
 *
 * Cancelar e recarregar uma vez (com a guarda anti-loop de `lazyWithRetry`)
 * resolve, porque o HTML novo aponta para os hashes atuais.
 *
 * POR QUE ISTO SAIU DE `main.tsx`. O registro morava solto la, com o nome do
 * evento escrito `"vite:preloaderror"`, tudo minusculo. Nome de evento DOM e
 * case-sensitive, entao o listener nunca disparou: a guarda inteira era codigo
 * morto desde que foi escrita, e o sintoma era a pagina caindo no ErrorBoundary
 * com `Unable to preload CSS for ...` (Sentry BORANATECH-FRONT-K). Um erro de
 * uma letra que so aparece em producao e so em deploy e exatamente o tipo de
 * coisa que precisa de teste, e teste exigia que o registro fosse chamavel.
 *
 * `target` e `onPreloadError` entram por parametro pelo mesmo motivo de
 * `sortear` em `lib/sentry.ts`: teste que depende do `window` global vaza
 * listener entre casos, e teste que recarrega a pagina de verdade nao existe.
 */
export function registerPreloadErrorGuard(
  target: EventTarget = window,
  onPreloadError: () => void = reloadOnceForStaleChunk,
): void {
  target.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    onPreloadError();
  });
}
