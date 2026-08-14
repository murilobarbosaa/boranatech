import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

import { chunkDaMensagem } from "./lazyWithRetry";

/**
 * Observador de `vite:preloadError`. NAO recupera nada, e isso e o desenho.
 *
 * ─── NAO CHAME `event.preventDefault()` AQUI ────────────────────────────────
 *
 * Parece que cancelar o evento so impede o Vite de relancar o erro. Nao e isso
 * que acontece. O handler do Vite roda DENTRO de um `.catch` encadeado:
 *
 *   node_modules/.pnpm/vite@7.3.6_.../vite/dist/node/chunks/config.js
 *     23433   return baseModule().catch(handlePreloadError);
 *     23421   function handlePreloadError(err$2) {
 *     23422     const e$1 = new Event("vite:preloadError", { cancelable: true });
 *     23423     e$1.payload = err$2;
 *     23424     window.dispatchEvent(e$1);
 *     23425     if (!e$1.defaultPrevented) throw err$2;
 *     23426   }
 *
 * Com o evento cancelado, `handlePreloadError` retorna normalmente. Um handler
 * de `.catch` que retorna normalmente RESOLVE a promise, e resolve com
 * `undefined`. Ou seja: cancelar nao engole so o relance, engole a REJEICAO
 * INTEIRA e devolve `undefined` no lugar do modulo.
 *
 * Quem recebe esse `undefined` e o `React.lazy`, que le `.default` dele:
 *
 *   TypeError: undefined is not an object (evaluating 'y._result.default')  [Safari]
 *   TypeError: Cannot read properties of undefined (reading 'default')      [Chrome]
 *   culprit: lazyInitializer(react/cjs/react.production)
 *
 * Sentry BORANATECH-FRONT-P e -Q. E como a promise RESOLVE, o `try/catch` de
 * `lazyWithRetry` nunca roda: o retry de 300ms, a guarda anti-loop e o caminho
 * de ErrorBoundary ficam todos desligados. Cancelar o evento desliga o
 * mecanismo que ja tratava skew de deploy.
 *
 * Medido: os 7 eventos de -P/-Q pareiam no MESMO SEGUNDO, mesma rota e mesmo
 * usuario, com um `chunk_reload` de `cooldown=false`. O reload ate acontecia; o
 * que nao acontecia era ele chegar antes do React ler `.default`, porque
 * `location.reload()` nao interrompe o JS que ja esta rodando.
 *
 * ─── Divisao de responsabilidade ────────────────────────────────────────────
 *
 * Reload tem DONO UNICO: `lazyWithRetry`. Ele ja tem retry, guarda anti-loop e
 * degradacao para o ErrorBoundary, tudo com teste. Esta guarda so OBSERVA, para
 * que exista telemetria do evento do Vite sem ninguem competindo pela
 * recuperacao (dois mecanismos de reload disputando foi a corrida que produziu
 * -P e -Q).
 *
 * POR QUE O ARQUIVO EXISTE. O registro morava solto em `main.tsx` escutando
 * `"vite:preloaderror"`, tudo minusculo, enquanto o Vite despacha com E
 * maiusculo. Nome de evento DOM e case-sensitive: a guarda era codigo morto, e
 * o sintoma era `Unable to preload CSS for ...` derrubando a pagina
 * (BORANATECH-FRONT-K). Erro de uma letra que so aparece em producao precisa de
 * teste, e teste exige que o registro seja chamavel.
 */

/**
 * Tag `origem` deste evento. DISTINTA de `chunk-reload` de proposito.
 *
 * Um unico incidente nas rotas de `App.tsx` produz os DOIS eventos: este,
 * quando o Vite avisa, e o `chunk_reload`, quando o `lazyWithRetry` decide
 * recarregar. Com a mesma tag, a serie contaria o mesmo incidente duas vezes e
 * "quantos reloads aconteceram" sairia inflado. Separadas, a razao entre as
 * duas passa a ser um dado: quantos avisos do Vite viraram reload de fato.
 */
export const SENTRY_ORIGEM_PRELOAD_EVENT = "preload-event";

/**
 * Reporte do evento, sem nenhuma decisao de recuperacao.
 *
 * `warning` e nao `error`: por si so isto nao e falha para o usuario. A falha,
 * se houver, e reportada pelo dono da recuperacao. Fingerprint fixo pelo mesmo
 * motivo do `chunk_reload`: o interesse e a serie no tempo, e um issue por hash
 * de chunk faria cada deploy criar issues novas e a curva sumir.
 */
export function reportPreloadEvent(importError?: unknown): void {
  const message =
    importError instanceof Error
      ? importError.message
      : String(importError ?? "unknown");
  const chunk = chunkDaMensagem(message);
  console.error("[preloadErrorGuard] vite:preloadError", { message, chunk });
  try {
    posthog.capture("vite_preload_error", { message, chunk });
  } catch {
    // Telemetria nunca pode interferir no desfecho do import.
  }
  try {
    Sentry.captureMessage("vite_preload_error", {
      level: "warning",
      tags: { origem: SENTRY_ORIGEM_PRELOAD_EVENT, chunk },
      fingerprint: ["vite-preload-error"],
      extra: { message },
    });
  } catch {
    // idem: Sentry sem DSN e no-op, e nunca pode lancar dentro do listener.
  }
}

/**
 * `target` e `onPreloadEvent` entram por parametro pelo mesmo motivo de
 * `sortear` em `lib/sentry.ts`: teste que depende do `window` global vaza
 * listener entre casos.
 */
export function registerPreloadErrorGuard(
  target: EventTarget = window,
  onPreloadEvent: (error?: unknown) => void = reportPreloadEvent,
): void {
  target.addEventListener("vite:preloadError", (event) => {
    // Sem `preventDefault`: o Vite relanca (config.js:23425), a promise rejeita
    // e o `lazyWithRetry` trata. Ver o bloco no topo do arquivo antes de mexer.
    onPreloadEvent((event as Event & { payload?: unknown }).payload);
  });
}
