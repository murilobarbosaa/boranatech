import * as Sentry from "@sentry/node";

import { env } from "./env";

// Rastreio de erros 5xx e de jobs (auditoria, secao 9) + tracing de rota com
// amostragem dinamica (tracesSampler): 0 fora de producao, 0 em health/assets,
// 0.3 nas rotas caras (badges, admin finance/billing-metrics), 0.05 de baseline.
// @sentry/node v10 auto-instrumenta http+express via OTel; como o init roda
// antes do Express (ver ORDEM DE CARGA), basta amostrar aqui, sem integration.
//
// ORDEM DE CARGA: este modulo se auto-inicializa na avaliacao e DEVE ser o
// primeiro import de server/index.ts. O build e um bundle ESM unico (esbuild)
// em que a ordem de avaliacao segue a ordem dos imports; com @sentry/node em
// --external e o init aqui, o Sentry sobe antes do Express e do resto do app.
//
// PII: beforeSend remove headers de credencial e NUNCA anexa body de request;
// beforeSendTransaction zera a query_string das transacoes (mesmo rigor no path
// de tracing). Erros esperados do nosso createError (statusCode < 500) sao
// descartados.

// Path da transacao a partir do samplingContext do OTel. url.path e o mais
// limpo (sem query string); http.route e a rota parametrizada; name vem no
// formato "GET /api/..." (por isso o match usa includes, nao startsWith).
function transactionPath(samplingContext: {
  name?: string;
  attributes?: Record<string, unknown>;
}): string {
  const attrs = samplingContext.attributes ?? {};
  const candidate =
    attrs["url.path"] ??
    attrs["http.route"] ??
    attrs["http.target"] ??
    samplingContext.name ??
    "";
  return typeof candidate === "string" ? candidate : "";
}

function tracesSampler(samplingContext: {
  name?: string;
  attributes?: Record<string, unknown>;
}): number {
  if (!env.isProd) return 0;

  const path = transactionPath(samplingContext);

  if (path.includes("/api/health") || path.includes("/assets")) return 0;

  if (
    path.includes("/api/badges") ||
    path.includes("/api/admin/finance") ||
    path.includes("/api/admin/billing-metrics")
  ) {
    return 0.3;
  }

  return 0.05;
}

function initSentry() {
  if (!env.sentryDsn) {
    console.log("[sentry] SENTRY_DSN ausente. Sentry desativado (no-op).");
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampler,
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
    beforeSendTransaction(event) {
      if (event.request) {
        delete event.request.query_string;
      }
      return event;
    },
  });

  console.log(`[sentry] inicializado (environment: ${env.nodeEnv})`);
}

initSentry();
