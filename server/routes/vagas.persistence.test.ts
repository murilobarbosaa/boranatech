import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const fixture = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  inserted: null as Record<string, unknown> | null,
  updated: null as Record<string, unknown> | null,
}));

vi.mock("../middleware/auth", () => ({
  requireAuth: (req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: "00000000-0000-4000-8000-000000000001" };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (
    req: { isPro?: boolean },
    _res: unknown,
    next: () => void,
  ) => {
    req.isPro = true;
    next();
  },
}));
vi.mock("../middleware/adminRbacObserve", () => ({
  observeAdminCapability: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: string) {
      if (table !== "external_jobs")
        throw new Error(`Tabela inesperada: ${table}`);
      return {
        insert(payload: Record<string, unknown>) {
          fixture.inserted = payload;
          return {
            select: () => ({
              single: async () => {
                fixture.row = {
                  id: "00000000-0000-4000-8000-000000000002",
                  ...payload,
                  published_at: "2026-09-22T00:00:00Z",
                };
                return { data: fixture.row, error: null };
              },
            }),
          };
        },
        update(patch: Record<string, unknown>) {
          fixture.updated = patch;
          return {
            eq() {
              return this;
            },
            select: () => ({
              single: async () => {
                fixture.row = { ...fixture.row, ...patch };
                return { data: fixture.row, error: null };
              },
            }),
          };
        },
        select() {
          return {
            eq() {
              return this;
            },
            order() {
              return this;
            },
            limit: async () => ({
              data: fixture.row ? [fixture.row] : [],
              error: null,
            }),
            maybeSingle: async () => ({ data: fixture.row, error: null }),
          };
        },
      };
    },
  },
}));

import vagasRouter from "./vagas";

let server: Server;
let baseUrl: string;
const valid = {
  title: "Vaga sintética",
  company: "Empresa Exemplo",
  location: "Remoto",
  url: "https://example.test/vaga",
};

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/vagas", vagasRouter);
  app.use(
    (
      error: { statusCode?: number; message: string },
      _req: unknown,
      res: express.Response,
      _next: unknown,
    ) => {
      res.status(error.statusCode ?? 500).json({ error: error.message });
    },
  );
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(
  async () => new Promise<void>((resolve) => server.close(() => resolve())),
);
beforeEach(() => {
  fixture.row = null;
  fixture.inserted = null;
  fixture.updated = null;
});

async function api(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
) {
  const response = await fetch(`${baseUrl}/api/vagas${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

describe("rota de vagas com persistência sintética", () => {
  it("INSERT sem salário escreve null explícito e responde ausência no Admin e público", async () => {
    const created = await api("/admin", "POST", valid);
    expect(created.status).toBe(201);
    expect(fixture.inserted).toMatchObject({
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      salary_is_predicted: null,
    });
    expect(created.body.data).toMatchObject({
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
    });
    const listed = await api("/admin", "GET");
    expect(listed.body.data.items[0].salaryMin).toBeNull();
    const detail = await api("/00000000-0000-4000-8000-000000000002", "GET");
    expect(detail.body.data).toMatchObject({
      salaryMin: null,
      salaryCurrency: null,
    });
  });

  it("salário informado persiste com moeda e PATCH omitido conserva o valor", async () => {
    expect(
      (
        await api("/admin", "POST", {
          ...valid,
          salary_min: 4500,
          salary_currency: "BRL",
        })
      ).status,
    ).toBe(201);
    expect(fixture.inserted).toMatchObject({
      salary_min: 4500,
      salary_currency: "BRL",
    });
    const edited = await api(
      "/admin/00000000-0000-4000-8000-000000000002",
      "PATCH",
      { title: "Vaga revisada" },
    );
    expect(edited.status).toBe(200);
    expect(fixture.updated).not.toHaveProperty("salary_min");
    expect(edited.body.data.salaryMin).toBe(4500);
  });

  it("PATCH null limpa salário e PATCH posterior pode informar outro valor", async () => {
    await api("/admin", "POST", {
      ...valid,
      salary_min: 4500,
      salary_currency: "BRL",
    });
    const cleared = await api(
      "/admin/00000000-0000-4000-8000-000000000002",
      "PATCH",
      { salary_min: null, salary_max: null, salary_currency: null },
    );
    expect(cleared.status).toBe(200);
    expect(fixture.updated).toMatchObject({
      salary_min: null,
      salary_max: null,
      salary_currency: null,
    });
    expect(cleared.body.data.salaryMin).toBeNull();
    const informed = await api(
      "/admin/00000000-0000-4000-8000-000000000002",
      "PATCH",
      { salary_max: 7000, salary_currency: "BRL" },
    );
    expect(informed.status).toBe(200);
    expect(informed.body.data).toMatchObject({
      salaryMin: null,
      salaryMax: 7000,
      salaryCurrency: "BRL",
    });
  });

  it.each([
    { salary_min: 4500, salary_currency: "BRL" },
    { salary_max: 7000, salary_currency: "BRL" },
  ])("aceita somente um limite positivo da faixa: %j", async (salary) => {
    const created = await api("/admin", "POST", { ...valid, ...salary });
    expect(created.status).toBe(201);
    expect(created.body.data.salaryMin).toBe(salary.salary_min ?? null);
    expect(created.body.data.salaryMax).toBe(salary.salary_max ?? null);
  });

  it("PATCH parcial usa moeda existente e rejeita faixa efetiva invertida", async () => {
    await api("/admin", "POST", {
      ...valid,
      salary_min: 4500,
      salary_max: 7000,
      salary_currency: "BRL",
    });
    expect(
      (
        await api("/admin/00000000-0000-4000-8000-000000000002", "PATCH", {
          salary_min: 5000,
        })
      ).status,
    ).toBe(200);
    expect(fixture.row?.salary_currency).toBe("BRL");
    const before = fixture.row;
    expect(
      (
        await api("/admin/00000000-0000-4000-8000-000000000002", "PATCH", {
          salary_min: 8000,
        })
      ).status,
    ).toBe(400);
    expect(fixture.row).toBe(before);
  });

  it.each([
    { salary_min: 0, salary_currency: "BRL" },
    { salary_min: -1, salary_currency: "BRL" },
    { salary_min: "abc", salary_currency: "BRL" },
    { salary_min: 7000, salary_max: 4500, salary_currency: "BRL" },
    { salary_min: 4500 },
  ])("recusa valor ou faixa inválida antes do INSERT: %j", async (salary) => {
    const response = await api("/admin", "POST", { ...valid, ...salary });
    expect(response.status).toBe(400);
    expect(fixture.inserted).toBeNull();
  });
});
