import { describe, expect, it, vi } from "vitest";

import { registerPreloadErrorGuard } from "./preloadErrorGuard";

/**
 * Guarda de skew de deploy do Vite: o NOME DO EVENTO.
 *
 * Este arquivo existe por causa de um bug de CAIXA. Ate 2026-08-13 o registro
 * morava solto em `main.tsx` e escutava `"vite:preloaderror"`, tudo minusculo,
 * enquanto o Vite despacha `"vite:preloadError"` com E maiusculo:
 *
 *   node_modules/.pnpm/vite@7.3.6_.../vite/dist/node/chunks/config.js:23422
 *     const e$1 = new Event("vite:preloadError", { cancelable: true });
 *
 * Nome de evento DOM e case-sensitive, entao o listener NUNCA disparava, o
 * `defaultPrevented` ficava `false` e o Vite relancava o erro (linha 23425 do
 * mesmo arquivo: `if (!e$1.defaultPrevented) throw err$2;`). O erro subia ate o
 * ErrorBoundary e derrubava a pagina inteira. Sentry BORANATECH-FRONT-K.
 *
 * POR QUE O CONTROLE NEGATIVO E OBRIGATORIO AQUI. Um teste que dispara o evento
 * escrito com a MESMA caixa errada do bug passa com o codigo errado, e teria
 * "confirmado" o defeito como acerto. O par positivo/negativo e o que prende a
 * caixa: o primeiro exige que a certa funcione, o segundo exige que a errada
 * NAO funcione. Trocar a string de volta derruba os dois.
 */

/** Alvo limpo por teste: `window` global vazaria listener entre os casos. */
function guardaSobreAlvoLimpo() {
  const alvo = new EventTarget();
  const recarregar = vi.fn();
  registerPreloadErrorGuard(alvo, recarregar);
  return { alvo, recarregar };
}

describe("registerPreloadErrorGuard", () => {
  it("reage a 'vite:preloadError' e cancela o evento, impedindo o relance do Vite", () => {
    const { alvo, recarregar } = guardaSobreAlvoLimpo();
    // Construido com a MESMA caixa e o MESMO `cancelable` do config.js:23422.
    const evento = new Event("vite:preloadError", { cancelable: true });

    const naoCancelado = alvo.dispatchEvent(evento);

    expect(recarregar).toHaveBeenCalledTimes(1);
    // `defaultPrevented` e exatamente o que o Vite le antes de decidir relancar.
    expect(evento.defaultPrevented).toBe(true);
    expect(naoCancelado).toBe(false);
  });

  it("CONTROLE NEGATIVO: nao reage a 'vite:preloaderror', a caixa errada do bug", () => {
    const { alvo, recarregar } = guardaSobreAlvoLimpo();
    const evento = new Event("vite:preloaderror", { cancelable: true });

    alvo.dispatchEvent(evento);

    expect(recarregar).not.toHaveBeenCalled();
    expect(evento.defaultPrevented).toBe(false);
  });
});
