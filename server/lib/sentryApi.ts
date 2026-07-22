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
