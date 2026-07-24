import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getNewsletterState,
  peekNewsletterState,
  resetNewsletterStateCache,
} from "./newsletterState";

// Cache de modulo do estado da newsletter: evita 1 request por navegacao (o
// Footer remonta a cada rota). Cobre dedupe da chamada em voo, nao-cache de
// erro (retry), fail-closed e invalidacao manual. O estado nao depende do
// usuario (so de env do server), entao nao ha invalidacao de login/logout.

const realFetch = globalThis.fetch;

// Mock leve no formato que o modulo usa (res.ok + res.json()), sem depender de
// Response global do ambiente.
function fetchOk(body: unknown) {
  return { ok: true, json: async () => body } as unknown as Response;
}
function fetchFail() {
  return { ok: false, json: async () => ({}) } as unknown as Response;
}

beforeEach(() => {
  resetNewsletterStateCache();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("getNewsletterState", () => {
  it("serve o valor cacheado sem segundo request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fetchOk({ status: "on" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await getNewsletterState()).toBe("on");
    expect(await getNewsletterState()).toBe("on");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dedupa chamadas concorrentes: dois mounts simultaneos = 1 request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fetchOk({ status: "on" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const [a, b] = await Promise.all([
      getNewsletterState(),
      getNewsletterState(),
    ]);

    expect(a).toBe("on");
    expect(b).toBe("on");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("erro NAO vira cache permanente: permite retry no proximo mount", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fetchFail())
      .mockResolvedValueOnce(fetchOk({ status: "on" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(getNewsletterState()).rejects.toThrow();
    expect(await getNewsletterState()).toBe("on");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fail-closed: status ausente ou diferente de 'on' vira 'off'", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fetchOk({}));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await getNewsletterState()).toBe("off");
  });
});

describe("peekNewsletterState", () => {
  it("null antes de resolver, valor apos resolver", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fetchOk({ status: "on" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(peekNewsletterState()).toBeNull();
    await getNewsletterState();
    expect(peekNewsletterState()).toBe("on");
  });
});

describe("resetNewsletterStateCache", () => {
  it("limpa o cache: a proxima chamada refetcha", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fetchOk({ status: "on" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await getNewsletterState()).toBe("on");
    resetNewsletterStateCache();
    expect(await getNewsletterState()).toBe("on");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
