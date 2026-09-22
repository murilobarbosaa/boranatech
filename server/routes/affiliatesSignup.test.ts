import { Router } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * POST /api/affiliates/signup (lote 11i): o cadastro pelo link vira UM evento
 * `signup` por conta.
 *
 * O `validateSupabaseJwt` e dublado como pass-through e o `requireAuth` e o
 * minimo (401 sem usuario): o envelope poe `req.user` como o JWT poria. O
 * banco e o double; o indice unico parcial e simulado pelo 23505 que o teste
 * devolve na insercao. O Redis fica nulo (sem throttle), como no teste do
 * clique.
 */

const estado = vi.hoisted(() => ({
  client: null as unknown,
  usuario: null as null | { id: string; email: string; role: string },
}));

vi.mock("../lib/env", () => ({
  env: { creatorEventsSalt: "sal", supabaseUrl: "https://exemplo.supabase.co" },
}));
vi.mock("../lib/redis", () => ({
  cacheConnection: null,
  queueConnection: null,
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.client;
  },
}));
vi.mock("../middleware/auth", () => ({
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  requireAuth: (
    req: { user?: unknown },
    _res: unknown,
    next: (err?: unknown) => void,
  ) =>
    req.user
      ? next()
      : next(
          Object.assign(new Error("Autenticação necessária."), {
            statusCode: 401,
            code: "unauthorized",
          }),
        ),
}));

import {
  criarSupabaseDouble,
  respostaQueFiltra,
  type Chamada,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import { criarClienteRota } from "./adminTestClient";
import affiliatesRouter from "./affiliates";

const NOVA = "11111111-1111-1111-1111-111111111111";
const DONA = "22222222-2222-2222-2222-222222222222";
const VELHA = "33333333-3333-3333-3333-333333333333";
const AFILIADO_ID = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1";

const AFILIADOS = [
  { id: AFILIADO_ID, code: "ANACRIA", status: "active", user_id: DONA },
  {
    id: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
    code: "PAUSADO",
    status: "paused",
    user_id: null,
  },
];

const AGORA = Date.now();
const PERFIS = [
  {
    user_id: NOVA,
    created_at: new Date(AGORA - 2 * 60 * 60 * 1000).toISOString(),
  },
  { user_id: DONA, created_at: new Date(AGORA - 60 * 60 * 1000).toISOString() },
  {
    user_id: VELHA,
    created_at: new Date(AGORA - 72 * 60 * 60 * 1000).toISOString(),
  },
];

let double: ReturnType<typeof criarSupabaseDouble>;

function montar(
  tabelas: Record<
    string,
    RespostaTabela | ((c: Chamada) => RespostaTabela)
  > = {},
) {
  double = criarSupabaseDouble({
    affiliates: respostaQueFiltra(AFILIADOS),
    profiles: respostaQueFiltra(PERFIS),
    creator_events: { rows: [] },
    ...tabelas,
  });
  estado.client = double.client;
}

const envelope = Router();
envelope.use((req, _res, next) => {
  if (estado.usuario) req.user = estado.usuario;
  next();
});
envelope.use(affiliatesRouter);
const chamar = criarClienteRota(envelope, "/api/affiliates");

function comoUsuario(id: string) {
  estado.usuario = {
    id,
    email: `${id.slice(0, 4)}@exemplo.com`,
    role: "authenticated",
  };
}

beforeEach(() => {
  estado.usuario = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/affiliates/signup", () => {
  it("401 sem usuario", async () => {
    montar();
    const r = await chamar("POST", "/signup", { code: "ANACRIA" });
    expect(r.status).toBe(401);
    expect(double.chamadas).toHaveLength(0);
  });

  it("conta nova com codigo ativo: 201 registrado, um insert signup com o afiliado", async () => {
    comoUsuario(NOVA);
    montar();
    const r = await chamar("POST", "/signup", { code: " anacria " });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ registrado: true });
    const insercoes = double
      .de("creator_events")
      .filter((c) => c.op === "insert");
    expect(insercoes).toHaveLength(1);
    expect(insercoes[0].payload).toEqual({
      affiliate_id: AFILIADO_ID,
      event_type: "signup",
      user_id: NOVA,
      metadata: { origem: "cadastro" },
    });
    // O afiliado e lido ATIVO, como no clique.
    expect(double.de("affiliates")[0].filtros).toEqual(
      expect.arrayContaining([
        { tipo: "eq", coluna: "code", valor: "ANACRIA" },
        { tipo: "eq", coluna: "status", valor: "active" },
      ]),
    );
  });

  it("segunda chamada: o 23505 do indice parcial vira 200 registrado=false, sem erro", async () => {
    comoUsuario(NOVA);
    montar({
      creator_events: {
        rows: [],
        error: { code: "23505", message: "duplicate key value" },
      },
    });
    const r = await chamar("POST", "/signup", { code: "ANACRIA" });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ registrado: false });
  });

  it("dono do codigo: 403 own_code, sem insert", async () => {
    comoUsuario(DONA);
    montar();
    const r = await chamar("POST", "/signup", { code: "ANACRIA" });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("own_code");
    expect(double.de("creator_events")).toHaveLength(0);
  });

  it("conta com mais de 48 horas: 409 account_too_old, sem insert", async () => {
    comoUsuario(VELHA);
    montar();
    const r = await chamar("POST", "/signup", { code: "ANACRIA" });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("account_too_old");
    expect(double.de("creator_events")).toHaveLength(0);
  });

  it("codigo inativo, inexistente ou mal formado: 404 generico, sem insert", async () => {
    comoUsuario(NOVA);
    for (const code of ["PAUSADO", "NAOEXISTE", "x", 12]) {
      montar();
      const r = await chamar("POST", "/signup", { code });
      expect(r.status, String(code)).toBe(404);
      expect(r.body.error.code).toBe("affiliate_not_found");
      expect(double.de("creator_events")).toHaveLength(0);
    }
  });

  it("outro erro do banco na insercao: 500 db_error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    comoUsuario(NOVA);
    montar({ creator_events: { rows: [], error: { message: "boom" } } });
    const r = await chamar("POST", "/signup", { code: "ANACRIA" });
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });
});
