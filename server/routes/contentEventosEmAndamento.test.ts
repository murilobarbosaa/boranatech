import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Captura os argumentos que a rota passa ao query builder. O mock de
// server/routes/content.test.ts nao serve aqui: ele nao registra `.or()` nem
// conhece `.is()` e `.limit()`, e e a string do `.or()` que este arquivo existe
// para travar.
const supaState = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  orArgs: [] as string[],
  count: 0 as number | null,
}));

vi.mock("../lib/supabaseAdmin", () => {
  const makeQuery = () => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "order", "ilike", "in", "limit"]) {
      q[m] = () => q;
    }
    q.or = (expr: string) => {
      supaState.orArgs.push(expr);
      return q;
    };
    q.then = (
      resolve: (v: unknown) => unknown,
      reject: (e: unknown) => unknown,
    ) =>
      Promise.resolve({
        data: supaState.rows,
        error: null,
        count: supaState.count,
      }).then(resolve, reject);
    return q;
  };
  return { supabaseAdmin: { from: () => makeQuery() } };
});

vi.mock("../lib/cache", () => ({
  getOrCompute: (_k: unknown, _t: unknown, fn: () => Promise<unknown>) => fn(),
  cacheKey: (...args: unknown[]) => JSON.stringify(args),
}));

vi.mock("../middleware/auth", () => ({
  checkProStatus: (_r: unknown, _s: unknown, next: () => void) => next(),
  requireAuth: (_r: unknown, _s: unknown, next: () => void) => next(),
}));

import contentRouter from "./content";

type Layer = {
  route?: {
    path: string;
    stack: Array<{ handle: (...a: unknown[]) => unknown }>;
  };
};

function getHandler(path: string) {
  const stack = (contentRouter as unknown as { stack: Layer[] }).stack;
  const layer = stack.find((l) => l.route?.path === path);
  if (!layer?.route) throw new Error(`rota ${path} nao encontrada`);
  const rs = layer.route.stack;
  return rs[rs.length - 1].handle;
}

async function chamarEventos() {
  const handler = getHandler("/eventos");
  let body: { data: unknown[]; total: number | null } | undefined;
  const res = {
    set: () => res,
    vary: () => res,
    json: (b: { data: unknown[]; total: number | null }) => {
      body = b;
    },
    status: () => res,
  };
  await handler({ query: {} }, res, (err?: unknown) => {
    if (err) throw err;
  });
  if (!body) throw new Error("handler nao chamou res.json");
  return body;
}

/**
 * Interpretador do subconjunto de sintaxe do PostgREST que esta rota usa
 * (`campo.gte.valor` e `campo.is.null`, separados por virgula, com OR entre
 * eles).
 *
 * POR QUE ELE EXISTE. O supabaseAdmin mockado devolve as linhas do estado sem
 * filtrar nada, entao um teste que so olhasse o payload passaria com QUALQUER
 * predicado, inclusive com o ramo novo ausente. Sem interpretar a string, nao
 * da para afirmar "entra" ou "nao entra".
 *
 * POR QUE ISTO NAO E DERIVAR A EXPECTATIVA DA IMPLEMENTACAO. Ele e uma segunda
 * implementacao, escrita a mao aqui, que so sabe ler a string ja pronta; ele
 * nao importa nada de content.ts e nao sabe como aquele arquivo monta o filtro.
 * As expectativas de cada caso (`true` / `false`) estao escritas literalmente
 * nos testes, e o teste da string completa abaixo trava o texto exato.
 */
function linhaPassaNoOr(
  expr: string,
  linha: { starts_on: string | null; ends_on: string | null },
): boolean {
  return expr.split(",").some((clausula) => {
    const [campo, op, valor] = clausula.split(".");
    const atual = linha[campo as "starts_on" | "ends_on"];
    if (op === "is" && valor === "null") return atual === null;
    if (op === "gte") return atual !== null && atual >= valor;
    throw new Error(`clausula nao reconhecida no teste: ${clausula}`);
  });
}

describe("GET /api/content/eventos: ramo de evento em andamento", () => {
  beforeEach(() => {
    supaState.rows = [];
    supaState.orArgs = [];
    supaState.count = 0;
    // Data congelada: 2026-09-02, 15h em Brasilia (18h UTC). Fixa para a
    // string esperada abaixo poder ser literal.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T18:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("monta o filtro de data com os TRES ramos, na ordem, com a mesma data", async () => {
    await chamarEventos();
    expect(supaState.orArgs).toHaveLength(1);
    // Literal, escrita a mao. Se alguem trocar a ordem, o operador, ou usar
    // uma data diferente em um dos ramos, este teste quebra.
    expect(supaState.orArgs[0]).toBe(
      "starts_on.gte.2026-09-02,starts_on.is.null,ends_on.gte.2026-09-02",
    );
  });

  it("usa a data de Brasilia, nao a de UTC, quando as duas divergem", async () => {
    // 2026-09-03 as 00h30 UTC e ainda 2026-09-02 as 21h30 em Brasilia.
    vi.setSystemTime(new Date("2026-09-03T00:30:00Z"));
    await chamarEventos();
    expect(supaState.orArgs[0]).toBe(
      "starts_on.gte.2026-09-02,starts_on.is.null,ends_on.gte.2026-09-02",
    );
  });

  it("evento que comecou ontem e termina amanha ENTRA", async () => {
    await chamarEventos();
    const evento = { starts_on: "2026-09-01", ends_on: "2026-09-03" };
    expect(linhaPassaNoOr(supaState.orArgs[0], evento)).toBe(true);
  });

  it("evento que terminou ontem NAO entra", async () => {
    await chamarEventos();
    const evento = { starts_on: "2026-08-30", ends_on: "2026-09-01" };
    expect(linhaPassaNoOr(supaState.orArgs[0], evento)).toBe(false);
  });

  it("evento que comeca amanha ENTRA (comportamento existente preservado)", async () => {
    await chamarEventos();
    const evento = { starts_on: "2026-09-03", ends_on: "2026-09-04" };
    expect(linhaPassaNoOr(supaState.orArgs[0], evento)).toBe(true);
  });

  it("evento sem data ENTRA (comportamento existente preservado)", async () => {
    await chamarEventos();
    const evento = { starts_on: null, ends_on: null };
    expect(linhaPassaNoOr(supaState.orArgs[0], evento)).toBe(true);
  });

  it("evento que termina HOJE ainda entra: o corte e `gte`, nao `gt`", async () => {
    await chamarEventos();
    const evento = { starts_on: "2026-09-01", ends_on: "2026-09-02" };
    expect(linhaPassaNoOr(supaState.orArgs[0], evento)).toBe(true);
  });

  it("total null nao vira data.length", async () => {
    supaState.rows = [{ id: "a" }];
    supaState.count = null;
    const body = await chamarEventos();
    expect(body.total).toBeNull();
  });
});
