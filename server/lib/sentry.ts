import * as Sentry from "@sentry/node";

import { env } from "./env";

// Rastreio de erros 5xx e de jobs (auditoria, secao 9). SO erros: tracing
// custa e nao e o objetivo (tracesSampleRate 0).
//
// ORDEM DE CARGA: este modulo se auto-inicializa na avaliacao e DEVE ser o
// primeiro import de server/index.ts. O build e um bundle ESM unico (esbuild)
// em que a ordem de avaliacao segue a ordem dos imports; com @sentry/node em
// --external e o init aqui, o Sentry sobe antes do Express e do resto do app.
//
// PII: beforeSend remove headers de credencial e NUNCA anexa body de request.
// Erros esperados do nosso createError (statusCode < 500) sao descartados.

function initSentry() {
  if (!env.sentryDsn) {
    console.log("[sentry] SENTRY_DSN ausente. Sentry desativado (no-op).");
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event, hint) {
      const original = hint?.originalException as
        | { statusCode?: unknown }
        | null
        | undefined;
      // createError sempre seta statusCode numerico; < 500 e erro esperado
      // de negocio (404, 429...), nao vai pro Sentry.
      if (
        typeof original?.statusCode === "number" &&
        original.statusCode < 500
      ) {
        return null;
      }

      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.Authorization;
          delete event.request.headers.cookie;
          delete event.request.headers.Cookie;
        }
      }

      return event;
    },
  });

  console.log(`[sentry] inicializado (environment: ${env.nodeEnv})`);
}

initSentry();
