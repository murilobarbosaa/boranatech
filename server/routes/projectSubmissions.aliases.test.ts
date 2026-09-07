import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO da rota de entrega (lote 04).
 *
 * O que precisa ficar amarrado: o alias resolvido ANTES do banco, a validacao
 * contra o tipo de entrega do modulo v2, o intervalo entre verificacoes, a
 * regra de "verificado so com todas ok", e o 503 da janela em que o codigo ja
 * subiu e o SQL ainda nao rodou.
 */

const USER_ID = "11111111-1111-1111-1111-111111111111";

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
}));
const checagens = vi.hoisted(() => ({ rodar: vi.fn() }));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    githubToken: "",
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/projectAutoChecks", () => ({
  rodarChecagens: checagens.rodar,
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: USER_ID, email: "a@b.com", role: "authenticated" };
    next();
  },
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  resolveProStatus: async () => true,
  isDevProUser: () => false,
}));

import {
  criarSupabaseDouble,
  type LinhaQualquer,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import submissionsRouter from "./projectSubmissions";
import { criarClienteRota } from "./adminTestClient";

const chamar = criarClienteRota(submissionsRouter, "/api/project-submissions");

const CANONICO = "landing-page-pessoal";
const ALIAS = "portfolio-pessoal-html-css";
const V1 = "calculadora-js";
const REPO = "https://github.com/fulano/portfolio";
const SITE = "https://fulano.github.io/portfolio";

function entrega(over: LinhaQualquer = {}): LinhaQualquer {
  return {
    project_id: CANONICO,
    tipo_entrega: "repo_deploy",
    deploy_url: SITE,
    repo_url: REPO,
    artifact_url: null,
    retro: {},
    is_public: false,
    public_code: "BNT-ABCD-EFGH",
    status: "entregue",
    auto_check: null,
    auto_check_at: null,
    created_at: "2026-09-06T10:00:00.000Z",
    updated_at: "2026-09-06T10:00:00.000Z",
    ...over,
  };
}

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
) {
  estado.double = criarSupabaseDouble(respostas);
  return estado.double;
}

/** Respostas em sequencia: a n-esima consulta recebe a n-esima resposta. */
function emSequencia(...respostas: RespostaTabela[]) {
  let i = 0;
  return () => respostas[Math.min(i++, respostas.length - 1)];
}

beforeEach(() => {
  checagens.rodar.mockReset();
  checagens.rodar.mockResolvedValue([]);
  montar({ project_submissions: { rows: [] } });
});

describe("PUT /:projectId", () => {
  it("grava o id canonico quando a chamada vem pelo alias", async () => {
    const d = montar({
      project_submissions: emSequencia({ rows: [] }, { rows: [entrega()] }),
    });
    const r = await chamar("PUT", `/${ALIAS}`, {
      deployUrl: SITE,
      repoUrl: REPO,
    });
    expect(r.status).toBe(200);
    const upsert = d.chamadas.find((c) => c.op === "upsert")!;
    expect(upsert.payload!.project_id).toBe(CANONICO);
    expect(upsert.payload!.tipo_entrega).toBe("repo_deploy");
    expect(upsert.payload!.status).toBe("entregue");
    expect(upsert.payload!.auto_check).toBeNull();
  });

  it("projeto sem detalhe v2 nao tem entrega por link", async () => {
    const d = montar({ project_submissions: { rows: [] } });
    const r = await chamar("PUT", `/${V1}`, { repoUrl: REPO });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("validation_unavailable");
    expect(d.chamadas).toHaveLength(0);
  });

  it("id fora do catalogo da 404 antes do banco", async () => {
    const d = montar({ project_submissions: { rows: [] } });
    const r = await chamar("PUT", "/nao-existe", { repoUrl: REPO });
    expect(r.status).toBe(404);
    expect(d.chamadas).toHaveLength(0);
  });

  it("repositorio invalido da 400 sem nenhum upsert", async () => {
    const d = montar({ project_submissions: { rows: [] } });
    const r = await chamar("PUT", `/${CANONICO}`, {
      deployUrl: SITE,
      repoUrl: "https://gitlab.com/fulano/projeto",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_request");
    expect(d.chamadas.filter((c) => c.op === "upsert")).toHaveLength(0);
  });

  it("reenvio mantem o codigo publico que ja existia", async () => {
    const d = montar({
      project_submissions: emSequencia(
        { rows: [{ public_code: "BNT-ZZZZ-ZZZZ" }] },
        { rows: [entrega()] },
      ),
    });
    const r = await chamar("PUT", `/${CANONICO}`, {
      deployUrl: SITE,
      repoUrl: REPO,
    });
    expect(r.status).toBe(200);
    const upsert = d.chamadas.find((c) => c.op === "upsert")!;
    expect(upsert.payload!.public_code).toBe("BNT-ZZZZ-ZZZZ");
  });
});

describe("GET /", () => {
  it("colapsa alias e canonico numa entrega so", async () => {
    montar({
      project_submissions: {
        rows: [entrega(), entrega({ project_id: ALIAS })],
      },
    });
    const r = await chamar("GET", "/");
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(r.body.data[0].projectId).toBe(CANONICO);
  });
});

describe("POST /:projectId/verify", () => {
  it("sem entrega, 404", async () => {
    montar({ project_submissions: { rows: [] } });
    const r = await chamar("POST", `/${CANONICO}/verify`);
    expect(r.status).toBe(404);
    expect(checagens.rodar).not.toHaveBeenCalled();
  });

  it("dentro de 60 s, 429 e nenhuma checagem roda", async () => {
    montar({
      project_submissions: {
        rows: [entrega({ auto_check_at: new Date().toISOString() })],
      },
    });
    const r = await chamar("POST", `/${CANONICO}/verify`);
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("rate_limited");
    expect(checagens.rodar).not.toHaveBeenCalled();
  });

  it("todas ok grava verificado", async () => {
    checagens.rodar.mockResolvedValue([
      { check: "repo_publico", status: "ok", mensagem: "ok" },
      { check: "readme_existe", status: "ok", mensagem: "ok" },
    ]);
    const d = montar({
      project_submissions: emSequencia(
        { rows: [entrega()] },
        { rows: [entrega({ status: "verificado" })] },
      ),
    });
    const r = await chamar("POST", `/${CANONICO}/verify`);
    expect(r.status).toBe(200);
    const update = d.chamadas.find((c) => c.op === "update")!;
    expect(update.payload!.status).toBe("verificado");
  });

  it("uma falhou mantem entregue", async () => {
    checagens.rodar.mockResolvedValue([
      { check: "repo_publico", status: "ok", mensagem: "ok" },
      { check: "deploy_responde", status: "falhou", mensagem: "nao respondeu" },
    ]);
    const d = montar({
      project_submissions: emSequencia(
        { rows: [entrega()] },
        { rows: [entrega()] },
      ),
    });
    const r = await chamar("POST", `/${CANONICO}/verify`);
    expect(r.status).toBe(200);
    const update = d.chamadas.find((c) => c.op === "update")!;
    expect(update.payload!.status).toBe("entregue");
  });

  it("uma em erro NAO vira verificado", async () => {
    // "nao consegui olhar" nao e "esta certo".
    checagens.rodar.mockResolvedValue([
      { check: "repo_publico", status: "ok", mensagem: "ok" },
      { check: "deploy_responde", status: "erro", mensagem: "sem resposta" },
    ]);
    const d = montar({
      project_submissions: emSequencia(
        { rows: [entrega()] },
        { rows: [entrega()] },
      ),
    });
    await chamar("POST", `/${CANONICO}/verify`);
    const update = d.chamadas.find((c) => c.op === "update")!;
    expect(update.payload!.status).toBe("entregue");
  });
});

describe("tabela ainda nao criada em producao", () => {
  it("GET devolve 503, nao 500", async () => {
    montar({
      project_submissions: {
        error: {
          code: "42P01",
          message: 'relation "public.project_submissions" does not exist',
        },
      },
    });
    const r = await chamar("GET", "/");
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("feature_unavailable");
  });

  it("PUT devolve 503, nao 500", async () => {
    montar({
      project_submissions: {
        error: {
          code: "42P01",
          message: 'relation "public.project_submissions" does not exist',
        },
      },
    });
    const r = await chamar("PUT", `/${CANONICO}`, {
      deployUrl: SITE,
      repoUrl: REPO,
    });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("feature_unavailable");
  });
});
