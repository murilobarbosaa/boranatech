import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envState = vi.hoisted(() => ({
  apiKey: "phx_sintetica",
  projectId: "1",
}));
vi.mock("./env", () => ({
  env: {
    get posthogApiKey() {
      return envState.apiKey;
    },
    get posthogProjectId() {
      return envState.projectId;
    },
    posthogHost: "https://posthog.invalid",
  },
}));

import { getPosthogStats } from "./posthog";
import { readPosthogPages, type PagesPeriod } from "./posthogPages";

type QueryRecord = { name: string; durationMs: number };
function logicalName(query: string): string {
  if (query.includes("pro_gate_hit")) return "pro_gates";
  if (query.includes("$referring_domain")) return "acquisition";
  if (query.includes("event in (")) return "conversion_events";
  if (query.includes("count(distinct person_id)")) return "unique_users";
  if (query.includes("$pageleave")) return "pageleave";
  if (query.includes("last_page")) return "exit_last";
  if (query.includes("count(distinct properties.$session_id)"))
    return "exit_sessions";
  if (query.includes("group by page order by views")) return "pages";
  return "pageviews";
}

function mockQueries(
  slowName?: string,
  rows: Partial<Record<string, unknown[][]>> = {},
  fault?: { name: string; kind: "http" | "invalid" },
) {
  const records: QueryRecord[] = [];
  const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const query = JSON.parse(String(init?.body)).query.query as string;
    const name = logicalName(query);
    const started = performance.now();
    if (name === slowName) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      records.push({ name, durationMs: performance.now() - started });
      throw new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      );
    }
    records.push({ name, durationMs: performance.now() - started });
    if (fault?.name === name && fault.kind === "http")
      return new Response("select segredo phx_sintetica", { status: 503 });
    if (fault?.name === name && fault.kind === "invalid")
      return new Response(JSON.stringify({ results: [["invalido"]] }), {
        status: 200,
      });
    const results =
      rows[name] ??
      (name === "pageviews"
        ? [[100]]
        : name === "pages"
          ? [["/curso", 100]]
          : []);
    return new Response(JSON.stringify({ results }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, records };
}

beforeEach(() => {
  envState.apiKey = "phx_sintetica";
  envState.projectId = "1";
});
afterEach(() => vi.unstubAllGlobals());

const PERIOD: PagesPeriod = {
  from: "2026-07-01T00:00:00.000Z",
  to: "2026-09-16T00:00:00.000Z",
  timezone: "UTC",
};

describe("reprodução D08A na implementação anterior", () => {
  it("uma consulta exclusiva de Conversão aborta Páginas no leitor compartilhado", async () => {
    const { fetchMock, records } = mockQueries("conversion_events");
    const result = await getPosthogStats({
      from: new Date("2026-07-01T00:00:00Z"),
      to: new Date("2026-09-15T00:00:00Z"),
    });
    expect(result.state).toBe("error");
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(records.map((record) => record.name)).toContain("pages");
    expect(records.map((record) => record.name)).toContain("pageviews");
    expect(
      records.find((record) => record.name === "conversion_events")?.durationMs,
    ).toBeGreaterThanOrEqual(15);
    console.info("[D08A baseline sintética]", JSON.stringify(records));
  });
});

describe("leitor isolado de Páginas", () => {
  const queries = [
    "pageviews",
    "pages",
    "pageleave",
    "exit_last",
    "exit_sessions",
  ] as const;
  for (const name of queries) {
    for (const kind of [
      "success",
      "timeout",
      "http",
      "invalid",
      "empty",
    ] as const) {
      it(`matriz ${name}: ${kind}`, async () => {
        const rows: Partial<Record<string, unknown[][]>> =
          kind === "empty" && (name === "pageviews" || name === "pages")
            ? { pageviews: [[0]], pages: [] }
            : kind === "empty"
              ? { [name]: [] }
              : {};
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { fetchMock, records } = mockQueries(
          kind === "timeout" ? name : undefined,
          rows,
          kind === "http" || kind === "invalid" ? { name, kind } : undefined,
        );
        try {
          const result = await readPosthogPages(PERIOD);
          expect(fetchMock).toHaveBeenCalledTimes(5);
          expect(records.map((record) => record.name).sort()).toEqual(
            [...queries].sort(),
          );
          if (kind === "success" || kind === "empty") {
            expect(result.state).toBe("ok");
            if (result.state === "ok") {
              expect(result.coverage.complete).toBe(true);
              if (name === "pageviews" || name === "pages")
                expect(result.hasData).toBe(kind !== "empty");
            }
          } else if (name === "pageviews" || name === "pages") {
            expect(result.state).toBe("error");
            if (result.state === "error") {
              expect(result.code).toBe("posthog_pages_core_unavailable");
              expect(result.failures).toEqual([
                {
                  query: name,
                  code:
                    kind === "http"
                      ? "http_error"
                      : kind === "invalid"
                        ? "invalid_payload"
                        : "timeout",
                  ...(kind === "http" ? { httpStatus: 503 } : {}),
                },
              ]);
            }
          } else {
            expect(result.state).toBe("ok");
            if (result.state === "ok") {
              expect(result.stats.totalPageviews).toBe(100);
              expect(result.stats.pages[0].views).toBe(100);
              expect(result.coverage.complete).toBe(false);
              const group =
                name === "pageleave"
                  ? result.availability.timeScroll
                  : result.availability.exitRate;
              expect(group).toMatchObject({
                state: "unavailable",
                failures: [
                  {
                    query: name,
                    code:
                      kind === "http"
                        ? "http_error"
                        : kind === "invalid"
                          ? "invalid_payload"
                          : "timeout",
                  },
                ],
              });
              if (name === "pageleave") {
                expect(result.stats.pages[0].avgTimeSeconds).toBeNull();
                expect(result.stats.pages[0].avgScrollPercent).toBeNull();
              } else expect(result.stats.pages[0].exitRatePercent).toBeNull();
            }
          }
          if (kind === "http" || kind === "timeout" || kind === "invalid") {
            const logs = warn.mock.calls.filter(
              (call) => call[0] === "[posthog-pages] query failed",
            );
            expect(logs).toHaveLength(1);
            expect(logs[0][1]).toMatchObject({
              query: name,
              category:
                kind === "http"
                  ? "http_error"
                  : kind === "invalid"
                    ? "invalid_payload"
                    : "timeout",
              period: PERIOD,
            });
            const serialized = JSON.stringify(logs[0]);
            expect(serialized).not.toContain("select ");
            expect(serialized).not.toContain("phx_");
            expect(serialized).not.toContain("person_id");
          }
        } finally {
          warn.mockRestore();
        }
      });
    }
  }
  it.each(["pageleave", "exit_last", "exit_sessions"] as const)(
    "mede uma consulta comportamental lenta %s sem chamada extra",
    async (name) => {
      const started = performance.now();
      const { fetchMock, records } = mockQueries(name);
      const result = await readPosthogPages(PERIOD);
      const elapsedMs = performance.now() - started;
      expect(result.state).toBe("ok");
      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(records).toHaveLength(5);
      expect(
        records.find((record) => record.name === name)!.durationMs,
      ).toBeGreaterThanOrEqual(15);
      console.info(
        "[D08A R1 sintética]",
        JSON.stringify({ slow: name, elapsedMs, queries: records }),
      );
    },
  );
  it("dispensa quatro consultas: Conversão lenta não derruba Páginas", async () => {
    const { fetchMock, records } = mockQueries("conversion_events");
    const result = await readPosthogPages(PERIOD);
    expect(result.state).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(records.map((record) => record.name).sort()).toEqual([
      "exit_last",
      "exit_sessions",
      "pageleave",
      "pages",
      "pageviews",
    ]);
    expect(records.every((record) => record.durationMs >= 0)).toBe(true);
    if (result.state === "ok") {
      expect(result.stats.totalPageviews).toBe(100);
      expect(result.stats.pages[0]).toMatchObject({
        page: "/curso",
        views: 100,
        avgTimeSeconds: null,
        avgScrollPercent: null,
        exitRatePercent: null,
      });
      expect(result.coverage.pages).toBe("top_10");
      expect(result.period).toEqual(PERIOD);
    }
  });

  it("nomeia timeout comportamental sem entregar HogQL ou corpo bruto", async () => {
    const { records } = mockQueries("pageleave");
    const result = await readPosthogPages(PERIOD);
    expect(result.state).toBe("ok");
    if (result.state !== "ok") return;
    expect(result.availability.timeScroll).toMatchObject({
      state: "unavailable",
      failures: [{ query: "pageleave", code: "timeout" }],
    });
    expect(result.stats.pages[0]).toMatchObject({
      views: 100,
      avgTimeSeconds: null,
      avgScrollPercent: null,
    });
    expect(result.coverage.complete).toBe(false);
    expect(
      records.find((record) => record.name === "pageleave")?.durationMs,
    ).toBeGreaterThanOrEqual(15);
  });

  it("distingue não configurado de leitura válida vazia", async () => {
    envState.apiKey = "";
    expect(await readPosthogPages(PERIOD)).toMatchObject({
      state: "not_configured",
      missing: ["POSTHOG_API_KEY"],
    });
    envState.apiKey = "phx_sintetica";
    const { fetchMock } = mockQueries(undefined, {
      pageviews: [[0]],
      pages: [],
    });
    const result = await readPosthogPages(PERIOD);
    expect(result).toMatchObject({
      state: "ok",
      hasData: false,
      stats: { totalPageviews: 0, pages: [] },
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("mantém médias ausentes como null e calcula sinais presentes pelo mesmo contrato", async () => {
    mockQueries(undefined, {
      pageleave: [["/curso", null, null, 4]],
      exit_last: [["/curso", 2]],
      exit_sessions: [["/curso", 10]],
    });
    const result = await readPosthogPages(PERIOD);
    expect(result.state).toBe("ok");
    if (result.state === "ok")
      expect(result.stats.pages[0]).toMatchObject({
        avgTimeSeconds: null,
        avgScrollPercent: null,
        exitRatePercent: 20,
      });
  });

  it("recusa resposta truncada em vez de inventar zero", async () => {
    mockQueries(undefined, { pageviews: [], pages: [] });
    const result = await readPosthogPages(PERIOD);
    expect(result).toMatchObject({
      state: "error",
      failures: [{ query: "pageviews", code: "invalid_payload" }],
    });
  });

  it("aceita números serializados e não devolve corpo bruto de erro HTTP", async () => {
    mockQueries(undefined, { pageviews: [["100"]], pages: [[null, "100"]] });
    const valid = await readPosthogPages(PERIOD);
    expect(valid).toMatchObject({
      state: "ok",
      stats: { totalPageviews: 100 },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("select segredo phx_sintetica", { status: 400 }),
        ),
    );
    const failed = await readPosthogPages(PERIOD);
    expect(failed.state).toBe("error");
    if (failed.state !== "error") return;
    expect(failed.failures).toContainEqual({
      query: "pageviews",
      code: "http_error",
      httpStatus: 400,
    });
    expect(failed.reason).not.toContain("select");
    expect(failed.reason).not.toContain("phx_");
  });
});
