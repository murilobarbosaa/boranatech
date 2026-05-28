import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supaSpy = vi.hoisted(() => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  return { from, select };
});

vi.mock("./../lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: supaSpy.from },
}));

import statsRouter, { __resetForTests } from "./stats";

// TTL do cache fresh do endpoint. Replicado aqui (não exportado por design,
// para não inflar a superfície pública do módulo de produção).
const FRESH_TTL_MS = 5 * 60 * 1000;

type Body = { count: number | null };

function getUsersCountHandler() {
  const layer = (statsRouter as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> }).stack
    .find((l) => l.route?.path === "/users-count");
  if (!layer || !layer.route) throw new Error("rota /users-count não encontrada");
  return layer.route.stack[0].handle as (
    req: unknown,
    res: { status: (n: number) => unknown; json: (body: Body) => void },
    next: () => void,
  ) => Promise<void> | void;
}

async function callEndpoint(): Promise<{ status: number; body: Body }> {
  const handler = getUsersCountHandler();
  let status = 200;
  let body: Body | undefined;
  const res = {
    status(n: number) {
      status = n;
      return res;
    },
    json(b: Body) {
      body = b;
    },
  };
  await handler({}, res, () => {});
  if (body === undefined) throw new Error("handler não chamou res.json");
  return { status, body };
}

describe("GET /api/stats/users-count — last-known-good em memória, sem 0 inventado", () => {
  beforeEach(() => {
    __resetForTests();
    supaSpy.from.mockClear();
    supaSpy.select.mockReset();
  });

  afterEach(() => {
    __resetForTests();
    vi.useRealTimers();
  });

  it("[no-lkg-degraded-null] sem lkg prévio, Supabase resolve count:null sem erro -> 200 {count: null}, nada cacheado", async () => {
    supaSpy.select.mockResolvedValueOnce({ count: null, error: null });

    const r = await callEndpoint();
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ count: null });
    // Crucial: NÃO virou 0.
    expect(r.body.count).not.toBe(0);

    // Segundo request: como nada foi cacheado, rebate Supabase. Cura natural.
    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    const r2 = await callEndpoint();
    expect(r2.body).toEqual({ count: 32 });
    expect(supaSpy.select).toHaveBeenCalledTimes(2);
  });

  it("[no-lkg-error-null] sem lkg prévio, query throw -> 200 {count: null}, nada cacheado", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    supaSpy.select.mockResolvedValueOnce({ count: null, error: new Error("db down") });

    const r = await callEndpoint();
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ count: null });
    expect(r.body.count).not.toBe(0);

    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    const r2 = await callEndpoint();
    expect(r2.body).toEqual({ count: 32 });
    expect(supaSpy.select).toHaveBeenCalledTimes(2);

    errSpy.mockRestore();
  });

  it("[ttl-cache-hit-skips-supabase] sucesso popula lkg; 2º request imediato serve lkg do TTL fresh, sem rebater Supabase", async () => {
    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    const r1 = await callEndpoint();
    expect(r1.body).toEqual({ count: 32 });
    expect(supaSpy.select).toHaveBeenCalledTimes(1);

    // Configura uma 2ª resposta DIFERENTE para detectar se Supabase foi rebatido.
    supaSpy.select.mockResolvedValueOnce({ count: 999, error: null });
    const r2 = await callEndpoint();
    expect(r2.body).toEqual({ count: 32 });
    expect(supaSpy.select).toHaveBeenCalledTimes(1);
  });

  it("[degraded-after-success-serves-lkg] após TTL, query degradada (count:null sem erro) serve lkg, NUNCA 0", async () => {
    vi.useFakeTimers();

    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    await callEndpoint();

    vi.advanceTimersByTime(FRESH_TTL_MS + 1);

    supaSpy.select.mockResolvedValueOnce({ count: null, error: null });
    const r = await callEndpoint();
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ count: 32 });
    expect(r.body.count).not.toBe(0);
    expect(supaSpy.select).toHaveBeenCalledTimes(2);

    // Cura: terceira tentativa também não serve 0 e não envenena lkg.
    vi.advanceTimersByTime(FRESH_TTL_MS + 1);
    supaSpy.select.mockResolvedValueOnce({ count: null, error: null });
    const r2 = await callEndpoint();
    expect(r2.body).toEqual({ count: 32 });
  });

  it("[error-after-success-serves-lkg] após TTL, query throw serve lkg", async () => {
    vi.useFakeTimers();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    await callEndpoint();

    vi.advanceTimersByTime(FRESH_TTL_MS + 1);

    supaSpy.select.mockResolvedValueOnce({ count: null, error: new Error("connection reset") });
    const r = await callEndpoint();
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ count: 32 });
    expect(supaSpy.select).toHaveBeenCalledTimes(2);

    errSpy.mockRestore();
  });

  it("[lkg-updates-on-fresh-success] após TTL, novo sucesso sobrescreve lkg", async () => {
    vi.useFakeTimers();

    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    await callEndpoint();

    vi.advanceTimersByTime(FRESH_TTL_MS + 1);

    supaSpy.select.mockResolvedValueOnce({ count: 45, error: null });
    const r = await callEndpoint();
    expect(r.body).toEqual({ count: 45 });

    // Próximo dentro do NOVO TTL: serve 45 (não 32 e não rebate Supabase).
    supaSpy.select.mockResolvedValueOnce({ count: 999, error: null });
    const r3 = await callEndpoint();
    expect(r3.body).toEqual({ count: 45 });
    expect(supaSpy.select).toHaveBeenCalledTimes(2);
  });

  it("[reset-clears-lkg] __resetForTests zera estado entre cenários", async () => {
    supaSpy.select.mockResolvedValueOnce({ count: 32, error: null });
    await callEndpoint();

    __resetForTests();

    // Sem lkg: degradada vira null.
    supaSpy.select.mockResolvedValueOnce({ count: null, error: null });
    const r = await callEndpoint();
    expect(r.body).toEqual({ count: null });
  });
});
