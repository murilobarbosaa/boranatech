import * as Sentry from "@sentry/react";

// Sentry do browser (client bundle). Espelha a politica do server/lib/sentry.ts:
// so inicializa quando o DSN esta presente; ausente vira no-op total (sem
// captura), pra dev/preview e pra qualquer build sem a env configurada.
//
// DSN: publico por natureza (vai no bundle, o browser precisa dele pra enviar
// evento), por isso pode ir com prefixo VITE_. Use um DSN de projeto SEPARADO
// do backend (VITE_SENTRY_DSN != SENTRY_DSN) pra nao misturar erros de browser
// com erros de server nem somar cota entre os dois.
//
// Escopo enxuto: sem session replay e sem tracing (tracesSampleRate ausente
// desliga o browser tracing), pra nao estourar cota. sampleRate conservador no
// stream de erros: o browser gera muito ruido de extensao/terceiros, e os
// eventos de diagnostico do contador (stats/users-count) valem em AGREGADO, uma
// amostra ja revela a distribuicao (429 vs HTML vs count nulo) por dispositivo.

// Fracao dos eventos de erro efetivamente enviados. Conservador de proposito.
const ERROR_SAMPLE_RATE = 0.25;

export function initClientSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // release opcional: so quando o build injeta VITE_SENTRY_RELEASE (ex.: SHA
    // do commit). Ausente, o Sentry agrupa sem versao, sem quebrar nada.
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    sampleRate: ERROR_SAMPLE_RATE,
    sendDefaultPii: false,
  });
}
