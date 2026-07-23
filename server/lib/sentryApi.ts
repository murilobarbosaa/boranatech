import { env } from "./env";

// Leitura de issues via API REST do Sentry pra aba Bugs & Erros do admin.
// Mesmo contrato de estados do posthog.ts: not_configured (falta env, o
// endpoint vira 503), rate_limited (429 do Sentry, repassado como 429),
// error (HTTP nao-2xx, timeout ou payload inesperado) e ok. Nunca lanca.

export type SentryIssue = {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

export type SentryIssuesResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | {
      state: "ok";
      issues: SentryIssue[];
      nextCursor: string | null;
      prevCursor: string | null;
    };

const SENTRY_API_BASE = "https://sentry.io/api/0";
const REQUEST_TIMEOUT_MS = 10_000;
// Lote da busca por id numerico: uma request por lote, nunca uma por card.
const SENTRY_ID_QUERY_CHUNK = 25;

// O Sentry pagina por cursor no header Link, no formato:
//   <url>; rel="previous"; results="false"; cursor="0:0:1",
//   <url>; rel="next"; results="true"; cursor="0:100:0"
// So existe pagina naquela direcao quando results="true"; cursor com
// results="false" e devolvido mesmo assim e NAO deve ser repassado.
export function parseLinkCursor(
  linkHeader: string | null,
  rel: "next" | "previous",
): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    if (!part.includes(`rel="${rel}"`)) continue;
    if (!part.includes('results="true"')) return null;
    const match = part.match(/cursor="([^"]+)"/);
    return match ? match[1] : null;
  }
  return null;
}

function toIssue(raw: Record<string, unknown>): SentryIssue {
  // count vem como string na API do Sentry; o resto ja vem no tipo esperado.
  // Campo ausente ou de tipo errado vira default neutro, nunca crash.
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  const num = (value: unknown) => {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    id: str(raw.id),
    shortId: str(raw.shortId),
    title: str(raw.title),
    culprit: str(raw.culprit),
    level: str(raw.level),
    status: str(raw.status),
    count: num(raw.count),
    userCount: num(raw.userCount),
    firstSeen: str(raw.firstSeen),
    lastSeen: str(raw.lastSeen),
    permalink: str(raw.permalink),
  };
}

export async function listSentryIssues(params?: {
  query?: string;
  cursor?: string;
  statsPeriod?: string;
}): Promise<SentryIssuesResult> {
  const missing: string[] = [];
  if (!env.sentryAuthToken) missing.push("SENTRY_AUTH_TOKEN");
  if (!env.sentryOrgSlug) missing.push("SENTRY_ORG_SLUG");
  if (!env.sentryProjectSlug) missing.push("SENTRY_PROJECT_SLUG");
  if (missing.length > 0) return { state: "not_configured", missing };

  const url = new URL(
    `${SENTRY_API_BASE}/projects/${env.sentryOrgSlug}/${env.sentryProjectSlug}/issues/`,
  );
  url.searchParams.set("query", params?.query ?? "is:unresolved");
  url.searchParams.set("statsPeriod", params?.statsPeriod ?? "14d");
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.sentryAuthToken}` },
      signal: controller.signal,
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      return {
        state: "rate_limited",
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
      };
    }

    if (!response.ok) {
      return {
        state: "error",
        reason: `Sentry respondeu ${response.status}.`,
        httpStatus: response.status,
      };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return { state: "error", reason: "Resposta do Sentry fora do formato esperado." };
    }

    const link = response.headers.get("Link");
    return {
      state: "ok",
      issues: payload.map((raw) => toIssue(raw as Record<string, unknown>)),
      nextCursor: parseLinkCursor(link, "next"),
      prevCursor: parseLinkCursor(link, "previous"),
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      state: "error",
      reason: aborted
        ? `Timeout de ${REQUEST_TIMEOUT_MS / 1000}s na API do Sentry.`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida na API do Sentry.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// --- Escrita e leitura pontual para a sincronizacao do bug tracker ---------
// Mesmo contrato de estados das leituras acima. Nenhuma funcao lanca: erro e
// sempre um estado discriminado, para o job/rota decidirem retry vs seguir.

export type SentryShortIdResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "not_found" }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; groupId: string };

export type SentryWriteResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok" };

export type SentryIssuesByIdResult =
  | { state: "not_configured"; missing: string[] }
  | { state: "rate_limited"; retryAfterSeconds: number | null }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; issues: SentryIssue[] };

type SentryConfig = { token: string; org: string; project: string };

function resolveSentryConfig():
  | { ok: true; config: SentryConfig }
  | { ok: false; missing: string[] } {
  const missing: string[] = [];
  if (!env.sentryAuthToken) missing.push("SENTRY_AUTH_TOKEN");
  if (!env.sentryOrgSlug) missing.push("SENTRY_ORG_SLUG");
  if (!env.sentryProjectSlug) missing.push("SENTRY_PROJECT_SLUG");
  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    config: {
      token: env.sentryAuthToken,
      org: env.sentryOrgSlug,
      project: env.sentryProjectSlug,
    },
  };
}

// Fetch com timeout + mapeamento de 429/abort para estados. O caller trata o
// status HTTP do Response. Nunca lanca.
async function sentryFetch(
  url: URL | string,
  init: RequestInit & { token: string },
): Promise<
  | { kind: "response"; response: Response }
  | { kind: "rate_limited"; retryAfterSeconds: number | null }
  | { kind: "error"; reason: string }
> {
  const { token, headers, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...rest,
      headers: { Authorization: `Bearer ${token}`, ...(headers ?? {}) },
      signal: controller.signal,
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      return {
        kind: "rate_limited",
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
      };
    }
    return { kind: "response", response };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      kind: "error",
      reason: aborted
        ? `Timeout de ${REQUEST_TIMEOUT_MS / 1000}s na API do Sentry.`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida na API do Sentry.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

// GET /organizations/{org}/shortids/{short_id}/ -> groupId numerico. not_found
// (404) sinaliza issue deletada (o caller marca o card como orfao).
export async function resolveShortId(
  shortId: string,
): Promise<SentryShortIdResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const url = `${SENTRY_API_BASE}/organizations/${cfg.config.org}/shortids/${encodeURIComponent(shortId)}/`;
  const r = await sentryFetch(url, { token: cfg.config.token });
  if (r.kind === "rate_limited")
    return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
  if (r.kind === "error") return { state: "error", reason: r.reason };

  const { response } = r;
  if (response.status === 404) return { state: "not_found" };
  if (!response.ok)
    return {
      state: "error",
      reason: `Sentry respondeu ${response.status}.`,
      httpStatus: response.status,
    };

  const payload = (await response.json().catch(() => null)) as {
    groupId?: unknown;
  } | null;
  const groupId =
    typeof payload?.groupId === "string"
      ? payload.groupId
      : typeof payload?.groupId === "number"
        ? String(payload.groupId)
        : "";
  if (!groupId) return { state: "error", reason: "shortid sem groupId." };
  return { state: "ok", groupId };
}

// PUT /issues/{numeric_id}/ { status }. Achado do teste manual: reverter para
// unresolved seta substatus 'regressed' no Sentry sem evento novo; NAO usamos
// status/substatus como sinal de recorrencia (o job usa lastSeen > resolved_at).
export async function updateIssueStatus(
  numericId: string,
  status: "resolved" | "unresolved",
): Promise<SentryWriteResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const url = `${SENTRY_API_BASE}/issues/${encodeURIComponent(numericId)}/`;
  const r = await sentryFetch(url, {
    token: cfg.config.token,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (r.kind === "rate_limited")
    return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
  if (r.kind === "error") return { state: "error", reason: r.reason };
  if (!r.response.ok)
    return {
      state: "error",
      reason: `Sentry respondeu ${r.response.status}.`,
      httpStatus: r.response.status,
    };
  return { state: "ok" };
}

// Estado atual de varias issues por id numerico, em lote (chunks de
// SENTRY_ID_QUERY_CHUNK), para a reconciliacao. Uma request por lote, nunca uma
// por card. Filtro por id: query `issue.id:[a, b, ...]`. VALIDAR EMPIRICAMENTE
// (sintaxe de busca do Sentry, como as notas de PostgREST no projeto): uma issue
// nao retornada no lote e tratada pelo job como "sem evento novo" (fail-safe:
// nunca reabre por ausencia).
export async function getIssuesByNumericIds(
  numericIds: string[],
): Promise<SentryIssuesByIdResult> {
  const cfg = resolveSentryConfig();
  if (!cfg.ok) return { state: "not_configured", missing: cfg.missing };

  const ids = Array.from(
    new Set(numericIds.filter((id) => id.trim().length > 0)),
  );
  if (ids.length === 0) return { state: "ok", issues: [] };

  const collected: SentryIssue[] = [];
  for (let i = 0; i < ids.length; i += SENTRY_ID_QUERY_CHUNK) {
    const chunk = ids.slice(i, i + SENTRY_ID_QUERY_CHUNK);
    const url = new URL(
      `${SENTRY_API_BASE}/projects/${cfg.config.org}/${cfg.config.project}/issues/`,
    );
    url.searchParams.set("query", `issue.id:[${chunk.join(", ")}]`);
    // statsPeriod VAZIO de proposito. Este endpoint (GET .../issues/) so aceita
    // '', '24h' ou '14d'; qualquer outro valor (ex.: 90d) responde 400 "Invalid
    // stats_period". Precisamos do lastSeen ABSOLUTO, sem janela que esconda
    // cards resolvidos ha mais de 14d, e '' nao aplica corte por tempo. NAO
    // trocar por 90d/30d: a lista de valores aceitos e fechada.
    url.searchParams.set("statsPeriod", "");

    const r = await sentryFetch(url, { token: cfg.config.token });
    if (r.kind === "rate_limited")
      return { state: "rate_limited", retryAfterSeconds: r.retryAfterSeconds };
    if (r.kind === "error") return { state: "error", reason: r.reason };
    if (!r.response.ok) {
      // Corpo da resposta no reason: o Sentry devolve a causa em texto (ex.:
      // {"detail":"Invalid stats_period..."}). Sem isso o log so via "400" e a
      // causa real so aparecia testando a API na mao.
      const body = (await r.response.text().catch(() => "")).slice(0, 500);
      return {
        state: "error",
        reason: `Sentry respondeu ${r.response.status}${body ? `: ${body}` : "."}`,
        httpStatus: r.response.status,
      };
    }

    const payload: unknown = await r.response.json().catch(() => null);
    if (!Array.isArray(payload))
      return {
        state: "error",
        reason: "Resposta do Sentry fora do formato esperado.",
      };
    for (const raw of payload)
      collected.push(toIssue(raw as Record<string, unknown>));
  }

  return { state: "ok", issues: collected };
}
