import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO da rota de validacao de projeto: resolucao de alias e a ORDEM dos
 * gates.
 *
 * A ordem importa mais que cada gate isolado. Fail-closed quer dizer que o
 * 403 de nao-assinante vem antes de qualquer consulta, e que um id que nao
 * existe morre antes do banco. Um teste de funcao pura nao ve nada disso.
 *
 * O caminho que chama o leitor de GitHub e a OpenAI NAO e exercitado: todos os
 * casos param antes. `../lib/githubAnalyze` e `./github` sao mockados so para
 * o modulo carregar sem rede.
 */

const USER_ID = "11111111-1111-1111-1111-111111111111";

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  isPro: true,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    openaiApiKey: "sk-teste",
    githubToken: "",
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/githubAnalyze", () => ({
  analyzeGithub: vi.fn(async () => {
    throw new Error("analyzeGithub nao deveria ser chamado neste arquivo");
  }),
}));
vi.mock("./github", () => ({
  persistGithubAnalysis: vi.fn(async () => ({ id: "analise-1" })),
  default: {},
}));
vi.mock("../lib/aiUsage", () => ({
  checkAiDailyLimit: vi.fn(async () => ({ allowed: true, used: 0, limit: 10 })),
  logAiUsage: vi.fn(async () => {}),
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
  checkProStatus: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.isPro = estado.isPro;
    next();
  },
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
import validationsRouter from "./projectValidations";
import { criarClienteRota } from "./adminTestClient";

const chamar = criarClienteRota(validationsRouter, "/api/project-validations");

const CANONICO = "landing-page-pessoal";
const ALIAS = "portfolio-pessoal-html-css";
const PRO_ID = "pro-saas-dashboard";
const REPO = "https://github.com/fulano/meu-projeto";
const PERFIL = "https://github.com/fulano";

function validacao(over: LinhaQualquer = {}): LinhaQualquer {
  return {
    project_id: CANONICO,
    status: "reprovado",
    created_at: "2026-09-05T10:00:00.000Z",
    analysis_id: "a1",
    ...over,
  };
}

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
) {
  estado.double = criarSupabaseDouble(respostas);
  return estado.double;
}

beforeEach(() => {
  estado.isPro = true;
  montar({ project_validations: { rows: [] } });
});

describe("GET /", () => {
  it("1. colapsa alias e canonico, ficando com a validacao mais recente", async () => {
    const d = montar({
      project_validations: {
        // Ja na ordem de created_at desc (o duble nao ordena).
        rows: [
          validacao({
            project_id: CANONICO,
            status: "aprovado",
            created_at: "2026-09-05T12:00:00.000Z",
          }),
          validacao({
            project_id: ALIAS,
            status: "reprovado",
            created_at: "2026-01-01T00:00:00.000Z",
          }),
        ],
      },
    });
    const r = await chamar("GET", "/");
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(r.body.data[0].projectId).toBe(CANONICO);
    expect(r.body.data[0].status).toBe("aprovado");
    expect(d.chamadas[0].ordemDetalhe).toEqual([
      { coluna: "created_at", ascending: false },
    ]);
  });
});

describe("GET /:projectId", () => {
  it("2. busca pelo canonico E pelos aliases", async () => {
    const d = montar({
      project_validations: { rows: [validacao({ project_id: ALIAS })] },
    });
    const r = await chamar("GET", `/${ALIAS}`);
    expect(r.status).toBe(200);
    const filtro = d.chamadas[0].filtros.find(
      (f) => f.coluna === "project_id",
    )!;
    expect(filtro.tipo).toBe("in");
    expect(filtro.valor).toEqual([CANONICO, ALIAS]);
  });
});

describe("POST /:projectId/submit", () => {
  it("3. projeto gratuito nao tem validacao, mesmo chegando pelo alias", async () => {
    // O alias resolve para landing-page-pessoal, que nao e `pro`: hoje a
    // validacao e exclusiva de projeto premium. O teste documenta o
    // comportamento atual (lote 06 reabre a decisao).
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${ALIAS}/submit`, { url: REPO });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("validation_unavailable");
    expect(d.chamadas).toHaveLength(0);
  });

  it("4. nao-assinante leva 403 antes de qualquer consulta", async () => {
    estado.isPro = false;
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${PRO_ID}/submit`, { url: REPO });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("forbidden");
    expect(d.chamadas).toHaveLength(0);
  });

  it("5. URL de perfil e recusada, mas DEPOIS da consulta de aprovacao", async () => {
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${PRO_ID}/submit`, { url: PERFIL });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_request");
    // A ordem real da rota: o gate de URL vem DEPOIS da checagem de
    // "ja aprovado". Uma URL invalida custa uma consulta ao banco. Afirmado
    // aqui como esta, e nao como se gostaria, para a mudanca de ordem ser
    // deliberada quando vier.
    expect(d.chamadas).toHaveLength(1);
    expect(d.chamadas[0].table).toBe("project_validations");
    expect(d.chamadas[0].op).toBe("select");
  });

  it("6. id que nao existe no catalogo da 404", async () => {
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", "/id-que-nao-existe/submit", { url: REPO });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
    expect(d.chamadas).toHaveLength(0);
  });
});
