import { describe, expect, it, vi } from "vitest";
import {
  createPosthogPagesCache,
  type PagesPeriod,
  type PosthogPagesState,
} from "./posthogPages";

const A: PagesPeriod = {
  from: "2026-07-01T00:00:00.000Z",
  to: "2026-09-16T00:00:00.000Z",
  timezone: "UTC",
};
const B: PagesPeriod = { ...A, from: "2026-08-01T00:00:00.000Z" };
function ok(period: PagesPeriod, computedAt: string): PosthogPagesState {
  return {
    state: "ok",
    hasData: false,
    stats: { totalPageviews: 0, pages: [] },
    period,
    computedAt,
    availability: {
      pages: { state: "available" },
      timeScroll: { state: "available" },
      exitRate: { state: "available" },
    },
    coverage: {
      pages: "top_10",
      timeAndScroll: "$pageleave",
      exitRate: "session_last_page",
      complete: true,
    },
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("cache de leitura integral por período", () => {
  it("deduplica pedidos simultâneos equivalentes e preserva computedAt real no hit", async () => {
    const first = deferred<PosthogPagesState>();
    const read = vi.fn(() => first.promise);
    const cache = createPosthogPagesCache(read, () => 1000);
    const one = cache.get(A);
    const two = cache.get(A);
    expect(read).toHaveBeenCalledTimes(1);
    first.resolve(ok(A, "2026-09-15T12:00:00.000Z"));
    expect(await one).toEqual(await two);
    expect(await cache.get(A)).toMatchObject({
      computedAt: "2026-09-15T12:00:00.000Z",
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("troca de período é outro scan; refresh força leitura e falha não entra no cache", async () => {
    let time = 1000;
    const read = vi
      .fn()
      .mockImplementation(async (period: PagesPeriod) =>
        ok(period, `2026-09-15T12:00:0${read.mock.calls.length}.000Z`),
      );
    const cache = createPosthogPagesCache(read, () => time);
    await cache.get(A);
    await cache.get(B);
    expect(read).toHaveBeenCalledTimes(2);
    const fresh = await cache.get(A, true);
    expect(fresh.state).toBe("ok");
    expect(read).toHaveBeenCalledTimes(3);
    read.mockResolvedValueOnce({
      state: "error",
      reason: "falha",
      code: "posthog_pages_core_unavailable",
      failures: [{ query: "pages", code: "timeout" }],
      period: A,
    });
    expect((await cache.get(A, true)).state).toBe("error");
    expect(await cache.get(A)).toEqual(fresh);
    time += 60_001;
    await cache.get(A);
    expect(read).toHaveBeenCalledTimes(5);
  });

  it("guarda parcial identificada por 60s sem retry automático e refresh recupera", async () => {
    let time = 1000;
    const partial = ok(A, "2026-09-15T12:00:00.000Z");
    if (partial.state !== "ok") throw new Error("fixture");
    partial.availability.timeScroll = {
      state: "unavailable",
      failures: [{ query: "pageleave", code: "timeout" }],
    };
    partial.coverage.complete = false;
    const read = vi
      .fn()
      .mockResolvedValueOnce(partial)
      .mockResolvedValueOnce(ok(A, "2026-09-15T12:01:00.000Z"))
      .mockImplementation(async (period: PagesPeriod) =>
        ok(period, "2026-09-15T12:02:00.000Z"),
      );
    const cache = createPosthogPagesCache(read, () => time);
    expect((await cache.get(A)).state).toBe("ok");
    expect(await cache.get(A)).toMatchObject({
      coverage: { complete: false },
      computedAt: "2026-09-15T12:00:00.000Z",
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(await cache.get(A, true)).toMatchObject({
      coverage: { complete: true },
    });
    expect(read).toHaveBeenCalledTimes(2);
    time += 60_001;
    expect((await cache.get(A)).state).toBe("ok");
  });

  it("falha principal retorna fotografia do mesmo período, vencida e marcada como anterior", async () => {
    let time = 1000;
    const read = vi
      .fn()
      .mockResolvedValueOnce(ok(A, "2026-09-15T12:00:00.000Z"))
      .mockResolvedValueOnce({
        state: "error",
        code: "posthog_pages_core_unavailable",
        reason: "falha",
        failures: [{ query: "pages", code: "timeout" }],
        period: A,
      })
      .mockImplementation(async (period: PagesPeriod) =>
        ok(period, "2026-09-15T12:02:00.000Z"),
      );
    const cache = createPosthogPagesCache(read, () => time);
    await cache.get(A);
    time += 60_001;
    const failed = await cache.get(A);
    expect(failed).toMatchObject({
      state: "error",
      previous: { computedAt: "2026-09-15T12:00:00.000Z" },
    });
    expect(read).toHaveBeenCalledTimes(2);
    await cache.get(B);
    expect(read).toHaveBeenCalledTimes(3);
  });
  it("refresh parcial não apaga a última fotografia completa para uma falha principal posterior", async () => {
    const full = ok(A, "2026-09-15T12:00:00.000Z");
    const partial = ok(A, "2026-09-15T12:01:00.000Z");
    if (partial.state !== "ok") throw new Error("fixture");
    partial.availability.exitRate = {
      state: "unavailable",
      failures: [{ query: "exit_last", code: "timeout" }],
    };
    partial.coverage.complete = false;
    const read = vi
      .fn()
      .mockResolvedValueOnce(full)
      .mockResolvedValueOnce(partial)
      .mockResolvedValueOnce({
        state: "error",
        code: "posthog_pages_core_unavailable",
        reason: "falha",
        failures: [{ query: "pages", code: "timeout" }],
        period: A,
      });
    const cache = createPosthogPagesCache(read, () => 1000);
    await cache.get(A);
    expect(await cache.get(A, true)).toMatchObject({
      coverage: { complete: false },
    });
    expect(await cache.get(A, true)).toMatchObject({
      state: "error",
      previous: {
        computedAt: "2026-09-15T12:00:00.000Z",
        coverage: { complete: true },
      },
    });
  });

  it("leitura antiga não sobrescreve cache novo após refresh concorrente", async () => {
    const old = deferred<PosthogPagesState>();
    const fresh = deferred<PosthogPagesState>();
    const read = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(fresh.promise);
    const cache = createPosthogPagesCache(read, () => 1000);
    const olderRequest = cache.get(A);
    const refreshRequest = cache.get(A, true);
    fresh.resolve(ok(A, "2026-09-15T12:01:00.000Z"));
    await refreshRequest;
    old.resolve(ok(A, "2026-09-15T12:00:00.000Z"));
    await olderRequest;
    expect(await cache.get(A)).toMatchObject({
      computedAt: "2026-09-15T12:01:00.000Z",
    });
  });
});
