import { beforeEach, describe, expect, it, vi } from "vitest";

// Estado das linhas que o supabaseAdmin mockado devolve. vi.hoisted pra poder
// ser referenciado dentro da factory do vi.mock (que sobe antes dos imports).
const supaState = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));

// Query builder chainable e thenable: qualquer .select/.eq/.order/.ilike/.in
// retorna o mesmo objeto; await resolve com as linhas do estado.
vi.mock("../lib/supabaseAdmin", () => {
  const makeQuery = () => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "ilike", "in"]) {
      q[m] = () => q;
    }
    q.single = () =>
      Promise.resolve({ data: supaState.rows[0] ?? null, error: null });
    q.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve({ data: supaState.rows, error: null }).then(resolve, reject);
    return q;
  };
  return { supabaseAdmin: { from: () => makeQuery() } };
});

// Cache: executa a funcao de computo direto, sem Redis.
vi.mock("../lib/cache", () => ({
  getOrCompute: (
    _key: unknown,
    _ttl: unknown,
    fn: () => Promise<unknown>,
  ) => fn(),
  cacheKey: (...args: unknown[]) => JSON.stringify(args),
}));

// Auth: no-op. Chamamos o handler principal direto e controlamos req.isPro,
// entao nao precisamos (nem queremos) carregar o auth real (env/jose).
vi.mock("../middleware/auth", () => ({
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import contentRouter from "./content";
import {
  FREE_COURSES_SAMPLE_SIZE,
  FREE_PLATFORMS_SAMPLE_SIZE,
} from "../../shared/freeTierLimits";
import { projetos } from "../../shared/projects/catalog";

type Layer = {
  route?: { path: string; stack: Array<{ handle: (...a: unknown[]) => unknown }> };
};

// Pega o ULTIMO handler da rota (o principal, depois do checkProStatus).
function getHandler(path: string) {
  const stack = (contentRouter as unknown as { stack: Layer[] }).stack;
  const layer = stack.find((l) => l.route?.path === path);
  if (!layer?.route) throw new Error(`rota ${path} não encontrada`);
  const routeStack = layer.route.stack;
  return routeStack[routeStack.length - 1].handle;
}

async function call(
  path: string,
  opts: { isPro?: boolean; user?: unknown } = {},
) {
  const handler = getHandler(path);
  let body: { data: unknown[]; lockedCount: number } | undefined;
  const headers: Record<string, string> = {};
  const res = {
    set: (k: string, v: string) => {
      headers[k] = v;
      return res;
    },
    // Espelha res.vary do Express: acrescenta o campo ao header Vary (dedup).
    vary: (field: string) => {
      const cur = headers["Vary"] ? headers["Vary"].split(", ") : [];
      if (!cur.includes(field)) cur.push(field);
      headers["Vary"] = cur.join(", ");
      return res;
    },
    json: (b: { data: unknown[]; lockedCount: number }) => {
      body = b;
    },
    status: () => res,
  };
  const req = { query: {}, isPro: opts.isPro, user: opts.user };
  await handler(req, res, (err?: unknown) => {
    if (err) throw err;
  });
  if (!body) throw new Error("handler não chamou res.json");
  return { body, headers };
}

function makeCourses(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `curso-${i}`,
    title: `Curso ${i}`,
    link: `https://exemplo.dev/curso-${i}`,
  }));
}

describe("GET /api/content/courses: fatiamento por tier", () => {
  beforeEach(() => {
    supaState.rows = makeCourses(10);
  });

  it("free -> so a amostra, com lockedCount; sem dados dos travados", async () => {
    const { body } = await call("/courses", { isPro: false });
    expect(body.data).toHaveLength(FREE_COURSES_SAMPLE_SIZE);
    expect(body.lockedCount).toBe(10 - FREE_COURSES_SAMPLE_SIZE);

    // Anti-regressao: nenhum link/titulo de curso travado no payload.
    const payload = JSON.stringify(body);
    for (let i = FREE_COURSES_SAMPLE_SIZE; i < 10; i++) {
      expect(payload).not.toContain(`curso-${i}`);
      expect(payload).not.toContain(`https://exemplo.dev/curso-${i}`);
    }
  });

  it("pro -> tudo, lockedCount 0", async () => {
    const { body } = await call("/courses", { isPro: true, user: { id: "u1" } });
    expect(body.data).toHaveLength(10);
    expect(body.lockedCount).toBe(0);
  });

  it("anonimo (isPro indefinido) -> tratado como free, amostra", async () => {
    const { body } = await call("/courses");
    expect(body.data).toHaveLength(FREE_COURSES_SAMPLE_SIZE);
    expect(body.lockedCount).toBe(10 - FREE_COURSES_SAMPLE_SIZE);
  });

  it("fail-closed: qualquer isPro != true (ex: string) cai no free", async () => {
    const { body } = await call("/courses", {
      isPro: "true" as unknown as boolean,
    });
    expect(body.data).toHaveLength(FREE_COURSES_SAMPLE_SIZE);
  });

  it("Cache-Control: NUNCA cacheavel em borda; private/no-store + Vary Authorization em todo tier", async () => {
    // O payload varia por Authorization; a CDN chaveia por URL. Cachear serviria
    // o payload de um tier pra outro. Anonimo, free autenticado e Pro: todos
    // private, no-store. Antes o anonimo saia como public (bug): amostra de 6
    // cacheada podia ser servida a um Pro.
    for (const opts of [
      {},
      { isPro: false, user: { id: "u1" } },
      { isPro: true, user: { id: "u1" } },
    ]) {
      const { headers } = await call("/courses", opts);
      expect(headers["Cache-Control"]).toBe("private, no-store");
      expect(headers["Vary"]).toContain("Authorization");
    }
  });
});

describe("GET /api/content/platforms: fatiamento por tier", () => {
  beforeEach(() => {
    supaState.rows = Array.from({ length: 8 }, (_, i) => ({
      id: `plat-${i}`,
      name: `Plataforma ${i}`,
      link: `https://exemplo.dev/plat-${i}`,
    }));
  });

  it("free -> amostra; pro -> tudo", async () => {
    const free = await call("/platforms", { isPro: false });
    expect(free.body.data).toHaveLength(FREE_PLATFORMS_SAMPLE_SIZE);
    expect(free.body.lockedCount).toBe(8 - FREE_PLATFORMS_SAMPLE_SIZE);

    const pro = await call("/platforms", { isPro: true, user: { id: "u1" } });
    expect(pro.body.data).toHaveLength(8);
    expect(pro.body.lockedCount).toBe(0);
  });
});

describe("GET /api/content/projects: gate por flag pro (slug canonico)", () => {
  const proSlug = projetos.find((p) => p.pro === true)?.id as string;

  beforeEach(() => {
    supaState.rows = [
      { slug: "projeto-livre-a", title: "Livre A" },
      { slug: proSlug, title: "SEGREDO PREMIUM" },
      { slug: "projeto-livre-b", title: "Livre B" },
    ];
  });

  it("existe pelo menos um slug pro no catalogo (pre-condicao do teste)", () => {
    expect(typeof proSlug).toBe("string");
  });

  it("free -> projeto premium fora do payload, contado em lockedCount", async () => {
    const { body } = await call("/projects", { isPro: false });
    expect(body.lockedCount).toBe(1);
    expect(body.data).toHaveLength(2);
    expect(JSON.stringify(body)).not.toContain("SEGREDO PREMIUM");
    expect(JSON.stringify(body)).not.toContain(proSlug);
  });

  it("pro -> recebe o projeto premium tambem", async () => {
    const { body } = await call("/projects", {
      isPro: true,
      user: { id: "u1" },
    });
    expect(body.lockedCount).toBe(0);
    expect(body.data).toHaveLength(3);
    expect(JSON.stringify(body)).toContain("SEGREDO PREMIUM");
  });
});
