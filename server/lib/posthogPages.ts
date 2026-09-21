import { env } from "./env";
import {
  assemblePageStats,
  pageQueries,
  posthogWindow,
  PosthogQueryError,
  runPosthogQuery,
  type PageStat,
} from "./posthog";
import { POSTHOG_QUERY_TIMEOUT_MS } from "./posthogTimeout";

export const POSTHOG_PAGES_TIMEOUT_MS = POSTHOG_QUERY_TIMEOUT_MS;
export const POSTHOG_PAGES_CACHE_TTL_MS = 60_000;
export const POSTHOG_PAGES_MAX_INTERVAL_DAYS = 400;

export type PagesPeriod = { from: string; to: string; timezone: "UTC" };
export type PagesFailureCode =
  | "timeout"
  | "http_error"
  | "invalid_payload"
  | "network_error";
export type PagesFailure = {
  query: PageQueryName;
  code: PagesFailureCode;
  httpStatus?: number;
};
export type PagesGroup =
  | { state: "available" }
  | { state: "unavailable"; failures: PagesFailure[] };
export type PagesAvailability = {
  pages: { state: "available" };
  timeScroll: PagesGroup;
  exitRate: PagesGroup;
};
export type PosthogPagesOk = {
  state: "ok";
  hasData: boolean;
  stats: { totalPageviews: number; pages: PageStat[] };
  period: PagesPeriod;
  computedAt: string;
  availability: PagesAvailability;
  coverage: {
    pages: "top_10";
    timeAndScroll: "$pageleave";
    exitRate: "session_last_page";
    complete: boolean;
  };
};
export type PosthogPagesState =
  | { state: "not_configured"; missing: string[]; period: PagesPeriod }
  | {
      state: "error";
      reason: string;
      code: "posthog_pages_core_unavailable";
      failures: PagesFailure[];
      period: PagesPeriod;
      previous?: PosthogPagesOk;
    }
  | PosthogPagesOk;

export type PageQueryName =
  | "pageviews"
  | "pages"
  | "pageleave"
  | "exit_last"
  | "exit_sessions";

class PagesQueryFailure extends Error {
  constructor(
    readonly query: PageQueryName,
    readonly code: PagesFailureCode,
    readonly status?: number,
  ) {
    super(code);
  }
  publicFailure(): PagesFailure {
    return {
      query: this.query,
      code: this.code,
      ...(this.status === undefined ? {} : { httpStatus: this.status }),
    };
  }
}

function validNumber(value: unknown): boolean {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" || value.trim() === "")
  )
    return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0;
}

function validOptionalNumber(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    ((typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) &&
      Number.isFinite(Number(value)))
  );
}

function validRows(
  name: PageQueryName,
  results: unknown,
): results is unknown[][] {
  if (!Array.isArray(results) || !results.every(Array.isArray)) return false;
  if (name === "pageviews")
    return (
      results.length === 1 &&
      results[0].length >= 1 &&
      validNumber(results[0][0])
    );
  if (name === "pages" || name === "exit_last" || name === "exit_sessions") {
    return results.every(
      (row) =>
        (typeof row[0] === "string" || row[0] === null) && validNumber(row[1]),
    );
  }
  return results.every(
    (row) =>
      (typeof row[0] === "string" || row[0] === null) &&
      validOptionalNumber(row[1]) &&
      validOptionalNumber(row[2]) &&
      validNumber(row[3]),
  );
}

async function queryPages(
  name: PageQueryName,
  sql: string,
  period: PagesPeriod,
) {
  const started = performance.now();
  try {
    const response = await runPosthogQuery(sql);
    if (!validRows(name, response.results))
      throw new PagesQueryFailure(name, "invalid_payload");
    console.info("[posthog-pages] query ok", {
      query: name,
      durationMs: Math.round(performance.now() - started),
      period,
    });
    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - started);
    const code: PagesFailureCode =
      error instanceof PagesQueryFailure
        ? error.code
        : error instanceof PosthogQueryError
          ? "http_error"
          : error instanceof Error &&
              (error.name === "TimeoutError" || error.name === "AbortError")
            ? "timeout"
            : error instanceof SyntaxError
              ? "invalid_payload"
              : "network_error";
    const status =
      error instanceof PosthogQueryError
        ? error.httpStatus
        : error instanceof PagesQueryFailure
          ? error.status
          : undefined;
    console.warn("[posthog-pages] query failed", {
      query: name,
      durationMs: duration,
      category: code,
      ...(status === undefined ? {} : { httpStatus: status }),
      period,
    });
    throw error instanceof PagesQueryFailure
      ? error
      : new PagesQueryFailure(name, code, status);
  }
}

export async function readPosthogPages(
  period: PagesPeriod,
): Promise<PosthogPagesState> {
  const missing: string[] = [];
  if (!env.posthogApiKey) missing.push("POSTHOG_API_KEY");
  if (!env.posthogProjectId) missing.push("POSTHOG_PROJECT_ID");
  if (missing.length) return { state: "not_configured", missing, period };

  const sql = pageQueries(
    posthogWindow(new Date(period.from), new Date(period.to)),
  );
  const names: PageQueryName[] = [
    "pageviews",
    "pages",
    "pageleave",
    "exit_last",
    "exit_sessions",
  ];
  const settled = await Promise.allSettled(
    names.map((name) => queryPages(name, sql[name], period)),
  );
  const failureAt = (index: number): PagesFailure | null => {
    const result = settled[index];
    if (result.status === "fulfilled") return null;
    const failure =
      result.reason instanceof PagesQueryFailure
        ? result.reason
        : new PagesQueryFailure(names[index], "network_error");
    return failure.publicFailure();
  };
  const coreFailures = [failureAt(0), failureAt(1)].filter(
    (failure): failure is PagesFailure => failure !== null,
  );
  if (coreFailures.length) {
    return {
      state: "error",
      period,
      code: "posthog_pages_core_unavailable",
      reason: "Falha ao consultar páginas e visualizações. Tente novamente.",
      failures: coreFailures,
    };
  }
  const pageviews =
    settled[0].status === "fulfilled" ? settled[0].value : { results: [] };
  const pages =
    settled[1].status === "fulfilled" ? settled[1].value : { results: [] };
  const timeFailure = failureAt(2);
  const exitFailures = [failureAt(3), failureAt(4)].filter(
    (failure): failure is PagesFailure => failure !== null,
  );
  const timeAvailable = timeFailure === null;
  const exitAvailable = exitFailures.length === 0;
  const empty = { results: [] };
  const pageLeave =
    timeAvailable && settled[2].status === "fulfilled"
      ? settled[2].value
      : empty;
  // Se apenas uma metade da taxa de saída falhou, ambas são descartadas para
  // que um denominador ou numerador incompleto jamais produza 0% plausível.
  const exitLast =
    exitAvailable && settled[3].status === "fulfilled"
      ? settled[3].value
      : empty;
  const exitSessions =
    exitAvailable && settled[4].status === "fulfilled"
      ? settled[4].value
      : empty;
  const totalPageviews = Number(pageviews.results[0][0]);
  const pageStats = assemblePageStats(pages, pageLeave, exitLast, exitSessions);
  const listedViews = pageStats.reduce((sum, page) => sum + page.views, 0);
  if (
    (totalPageviews > 0 && !pageStats.length) ||
    listedViews > totalPageviews ||
    (totalPageviews === 0 && pageStats.length)
  ) {
    console.warn("[posthog-pages] core consistency failed", {
      query: "pages",
      category: "invalid_payload",
      period,
    });
    return {
      state: "error",
      period,
      code: "posthog_pages_core_unavailable",
      reason: "Resposta de páginas inconsistente. Tente novamente.",
      failures: [{ query: "pages", code: "invalid_payload" }],
    };
  }
  const availability: PagesAvailability = {
    pages: { state: "available" },
    timeScroll: timeAvailable
      ? { state: "available" }
      : { state: "unavailable", failures: [timeFailure!] },
    exitRate: exitAvailable
      ? { state: "available" }
      : { state: "unavailable", failures: exitFailures },
  };
  return {
    state: "ok",
    hasData: totalPageviews > 0,
    stats: { totalPageviews, pages: pageStats },
    period,
    computedAt: new Date().toISOString(),
    availability,
    coverage: {
      pages: "top_10",
      timeAndScroll: "$pageleave",
      exitRate: "session_last_page",
      complete: timeAvailable && exitAvailable,
    },
  };
}

type ReadPages = (period: PagesPeriod) => Promise<PosthogPagesState>;
export function createPosthogPagesCache(
  read: ReadPages,
  now: () => number = Date.now,
) {
  const values = new Map<string, { value: PosthogPagesOk; expires: number }>();
  // Uma atualização parcial nunca apaga a última fotografia completa do
  // mesmo período; ela só pode ser exibida explicitamente como anterior.
  const lastComplete = new Map<string, PosthogPagesOk>();
  const inFlight = new Map<string, Promise<PosthogPagesState>>();
  const generations = new Map<string, number>();
  return {
    async get(
      period: PagesPeriod,
      refresh = false,
    ): Promise<PosthogPagesState> {
      const key = `${period.timezone}|${period.from}|${period.to}`;
      const cached = values.get(key);
      if (!refresh && cached && cached.expires > now()) return cached.value;
      // Valor vencido não é servido como atual; segue disponível somente como
      // anterior explícito se a próxima leitura principal falhar.
      const flightKey = `${key}|${refresh ? "refresh" : "normal"}`;
      const existing = inFlight.get(flightKey);
      if (existing) return existing;
      const generation = (generations.get(key) ?? 0) + 1;
      generations.set(key, generation);
      const pending = read(period)
        .then((value) => {
          if (value.state === "ok" && generations.get(key) === generation) {
            if (value.coverage.complete) {
              lastComplete.delete(key);
              lastComplete.set(key, value);
              while (lastComplete.size > 16)
                lastComplete.delete(lastComplete.keys().next().value!);
            }
            values.delete(key);
            values.set(key, {
              value,
              expires: now() + POSTHOG_PAGES_CACHE_TTL_MS,
            });
            while (values.size > 16) values.delete(values.keys().next().value!);
          }
          const previous = lastComplete.get(key) ?? values.get(key)?.value;
          if (value.state === "error" && previous) {
            return { ...value, previous };
          }
          return value;
        })
        .finally(() => {
          inFlight.delete(flightKey);
          if (
            !Array.from(inFlight.keys()).some((active) =>
              active.startsWith(`${key}|`),
            )
          ) {
            generations.delete(key);
          }
        });
      inFlight.set(flightKey, pending);
      return pending;
    },
    clear() {
      values.clear();
      lastComplete.clear();
      inFlight.clear();
      generations.clear();
    },
  };
}

export const posthogPagesCache = createPosthogPagesCache(readPosthogPages);
