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

/**
 * O SDK deve reportar deste processo?
 *
 * O DEFEITO, medido em 2026-08-31. Ate aqui a unica guarda era a presenca do
 * DSN, e `environment: env.nodeEnv` apenas ROTULA o evento, nao filtra nada.
 * Resultado: rodar `pnpm dev` com o `.env` de producao mandava erro da maquina
 * local para o projeto de producao, e de la para o CRM como card. Evidencia:
 * `NODE-EXPRESS-6` (EADDRINUSE :::3100) tem 3 eventos, TODOS com
 * `environment=development` e `server_name=s0ft-750QFG`, e `NODE-EXPRESS-J`
 * ("Erro ao buscar notas fiscais") tem outros 2. Dois cards do quadro descrevem
 * porta ocupada na maquina de quem programa, nao falha de produto.
 *
 * NAO INICIALIZAR, em vez de descartar no `beforeSend`, e a escolha tem motivo.
 * Descartar depois funcionaria para o evento, mas o init faz mais que abrir um
 * transporte: o `@sentry/node` v10 auto-instrumenta http e express via OTel (ver
 * o cabecalho deste arquivo), e isso passaria a rodar em toda sessao de
 * desenvolvimento para nada. Nao inicializar e mais barato e, principalmente,
 * mais TOTAL: nao existe caminho de captura que escape da guarda, nem os que
 * alguem acrescentar depois sem lembrar do filtro. E a regra da casa de por a
 * protecao DENTRO em vez de em cada call site, aplicada ao SDK inteiro.
 *
 * O custo dessa escolha e nao dar para testar o pipeline localmente, e por isso
 * existe `SENTRY_ENABLE_NON_PROD`. Sem a valvula a decisao seria pior que o
 * problema: instrumento que ninguem consegue exercitar e instrumento em que
 * ninguem confia.
 *
 * Chamar `Sentry.captureMessage` com o SDK nao inicializado e no-op, nao erro.
 * Nenhum call site precisa de guarda propria, e nenhum precisou mudar.
 */
export function deveReportarAoSentry(params: {
  temDsn: boolean;
  isProd: boolean;
  escapeLigado: boolean;
}): boolean {
  const { temDsn, isProd, escapeLigado } = params;
  if (!temDsn) return false;
  return isProd || escapeLigado;
}

function initSentry() {
  if (!env.sentryDsn) {
    console.log("[sentry] SENTRY_DSN ausente. Sentry desativado (no-op).");
    return;
  }

  if (
    !deveReportarAoSentry({
      temDsn: Boolean(env.sentryDsn),
      isProd: env.isProd,
      escapeLigado: env.sentryEnableNonProd,
    })
  ) {
    console.log(
      `[sentry] ambiente '${env.nodeEnv}' nao e producao. Sentry desativado (no-op). ` +
        `Para exercitar o pipeline daqui, use SENTRY_ENABLE_NON_PROD=true.`,
    );
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
