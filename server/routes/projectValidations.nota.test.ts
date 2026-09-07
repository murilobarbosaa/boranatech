import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Validacao com NOTA (lote 06).
 *
 * O que precisa ficar amarrado: quem pode validar (v2 de codigo, e nao mais
 * so os 8 do catalogo), o cooldown antes da cota, a regra da melhor nota no
 * reenvio, e o fail closed quando a analise falha.
 */

const USER_ID = "11111111-1111-1111-1111-111111111111";

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  isPro: true,
}));
const ia = vi.hoisted(() => ({
  analyze: vi.fn(),
  persist: vi.fn(async () => "analise-1"),
  cota: vi.fn(async () => ({
    allowed: true,
    limit: 10,
    reservationId: "res-1",
    verificationFailed: false,
  })),
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
vi.mock("../lib/githubAnalyze", () => ({ analyzeGithub: ia.analyze }));
vi.mock("./github", () => ({
  persistGithubAnalysis: ia.persist,
  default: {},
}));
vi.mock("../lib/aiUsage", () => ({
  checkAiDailyLimit: ia.cota,
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

// landing-page-pessoal: v2 repo_deploy, 10 requisitos, SEM selo Pro.
const V2_CODIGO = "landing-page-pessoal";
// analise-dados-publicos: v2 notebook, entrega de artefato.
const V2_ARTEFATO = "analise-dados-publicos";
// pro-saas-dashboard: os 8 do catalogo, com requisitos proprios.
const PRO_CATALOGO = "pro-saas-dashboard";
// projeto v1 sem selo: nao tem requisito em lugar nenhum.
const V1 = "calculadora-js";
const REPO = "https://github.com/fulano/portfolio";

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
) {
  estado.double = criarSupabaseDouble(respostas);
  return estado.double;
}

function emSequencia(...respostas: RespostaTabela[]) {
  let i = 0;
  return () => respostas[Math.min(i++, respostas.length - 1)];
}

/** Resposta da IA com os N primeiros requisitos atendidos. */
function respostaIa(ids: string[], atendidos: number) {
  return {
    qualitative: {
      requisitosAvaliacao: ids.map((id, i) => ({
        id,
        veredito: i < atendidos ? "atende" : "nao_atende",
        evidencia: "e",
      })),
    },
  };
}

const IDS_10 = Array.from({ length: 10 }, (_, i) => `req-${i + 1}`);

beforeEach(() => {
  estado.isPro = true;
  ia.analyze.mockReset();
  ia.persist.mockClear();
  ia.cota.mockClear();
  ia.cota.mockResolvedValue({
    allowed: true,
    limit: 10,
    reservationId: "res-1",
    verificationFailed: false,
  });
  montar({ project_validations: { rows: [] } });
});

async function idsDoModulo(): Promise<string[]> {
  const { loadProjetoV2 } = await import("../../shared/projects/v2");
  const d = await loadProjetoV2(V2_CODIGO);
  return (d?.requisitos ?? []).map((r) => r.id);
}

describe("quem pode validar", () => {
  it("nao assinante leva 403 antes de tudo", async () => {
    estado.isPro = false;
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.status).toBe(403);
    expect(d.chamadas).toHaveLength(0);
    expect(ia.analyze).not.toHaveBeenCalled();
  });

  it("v2 de artefato nao valida por repositorio", async () => {
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_ARTEFATO}/submit`, { url: REPO });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("validation_unavailable");
    expect(d.chamadas).toHaveLength(0);
  });

  it("projeto v1 sem selo continua sem validacao", async () => {
    const r = await chamar("POST", `/${V1}/submit`, { url: REPO });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("validation_unavailable");
  });

  it("os 8 do catalogo continuam aceitos", async () => {
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${PRO_CATALOGO}/submit`, { url: REPO });
    expect(r.status).not.toBe(400);
    expect(d.chamadas.length).toBeGreaterThan(0);
  });
});

describe("cooldown", () => {
  it("dentro de 5 min, 429 sem gastar cota nem chamar a IA", async () => {
    montar({
      project_validations: {
        rows: [
          {
            id: "v1",
            status: "reprovado",
            created_at: new Date().toISOString(),
            requisitos_result: [],
          },
        ],
      },
    });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("rate_limited");
    expect(ia.cota).not.toHaveBeenCalled();
    expect(ia.analyze).not.toHaveBeenCalled();
  });

  it("passados os 5 min, segue para a cota", async () => {
    ia.analyze.mockResolvedValue(respostaIa(IDS_10, 10));
    montar({
      project_validations: emSequencia(
        {
          rows: [
            {
              id: "v1",
              status: "reprovado",
              created_at: new Date(Date.now() - 6 * 60_000).toISOString(),
              requisitos_result: [],
            },
          ],
        },
        { rows: [] },
      ),
    });
    await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(ia.cota).toHaveBeenCalledTimes(1);
  });
});

describe("nota", () => {
  it("8 de 10 grava aprovado", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 8));
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("aprovado");
    expect(r.body.nota.atendidos).toBe(8);
    expect(r.body.nota.percentual).toBe(80);
    expect(r.body.nota.perfeito).toBe(false);
    expect(r.body.gravado).toBe(true);
    const insert = d.chamadas.find((c) => c.op === "insert")!;
    expect(insert.payload!.status).toBe("aprovado");
  });

  it("7 de 10 grava reprovado e lista as pendencias", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 7));
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.status).toBe("reprovado");
    expect(r.body.nota.pendentes).toHaveLength(3);
    const insert = d.chamadas.find((c) => c.op === "insert")!;
    expect(insert.payload!.status).toBe("reprovado");
  });

  it("requisito omitido pela IA conta como pendente", async () => {
    const ids = await idsDoModulo();
    // A IA devolveu 9 dos 10 itens, todos "atende".
    ia.analyze.mockResolvedValue(respostaIa(ids.slice(0, 9), 9));
    montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.nota.atendidos).toBe(9);
    expect(r.body.nota.pendentes).toEqual([ids[9]]);
  });

  it("a resposta traz a lista de requisitos", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 10));
    montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.requisitos).toHaveLength(10);
    expect(r.body.requisitos[0]).toHaveProperty("descricao");
  });
});

describe("reenvio e melhor nota", () => {
  function aprovadaCom(ids: string[], atendidos: number): LinhaQualquer {
    return {
      id: "aprovada-1",
      status: "aprovado",
      created_at: new Date(Date.now() - 10 * 60_000).toISOString(),
      requisitos_result: respostaIa(ids, atendidos).qualitative
        .requisitosAvaliacao,
    };
  }

  it("nota maior atualiza a linha aprovada", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 10));
    const d = montar({
      project_validations: { rows: [aprovadaCom(ids, 8)] },
    });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.gravado).toBe(true);
    const update = d.chamadas.find((c) => c.op === "update")!;
    expect(update).toBeDefined();
    expect(d.chamadas.filter((c) => c.op === "insert")).toHaveLength(0);
  });

  it("nota menor NAO grava e devolve a melhor", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 8));
    const d = montar({
      project_validations: { rows: [aprovadaCom(ids, 10)] },
    });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.status).toBe("aprovado");
    expect(r.body.gravado).toBe(false);
    expect(r.body.melhor.atendidos).toBe(10);
    expect(d.chamadas.filter((c) => c.op === "update")).toHaveLength(0);
    expect(d.chamadas.filter((c) => c.op === "insert")).toHaveLength(0);
  });

  it("nota igual atualiza (a analise nova e mais recente)", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 9));
    const d = montar({
      project_validations: { rows: [aprovadaCom(ids, 9)] },
    });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.gravado).toBe(true);
    expect(d.chamadas.find((c) => c.op === "update")).toBeDefined();
  });

  it("reprovacao depois de aprovada nao apaga a aprovada", async () => {
    const ids = await idsDoModulo();
    ia.analyze.mockResolvedValue(respostaIa(ids, 3));
    const d = montar({
      project_validations: { rows: [aprovadaCom(ids, 10)] },
    });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.body.status).toBe("reprovado");
    // Historico: entra como insert, e a linha aprovada fica intacta.
    expect(d.chamadas.find((c) => c.op === "insert")).toBeDefined();
    expect(d.chamadas.filter((c) => c.op === "update")).toHaveLength(0);
  });
});

describe("fail closed", () => {
  it("erro da analise nao grava linha nenhuma", async () => {
    ia.analyze.mockRejectedValue(new Error("github fora do ar"));
    const d = montar({ project_validations: { rows: [] } });
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, { url: REPO });
    expect(r.status).toBeGreaterThanOrEqual(500);
    expect(d.chamadas.filter((c) => c.op === "insert")).toHaveLength(0);
    expect(d.chamadas.filter((c) => c.op === "update")).toHaveLength(0);
  });

  it("URL de perfil e recusada", async () => {
    const r = await chamar("POST", `/${V2_CODIGO}/submit`, {
      url: "https://github.com/fulano",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_request");
    expect(ia.analyze).not.toHaveBeenCalled();
  });
});
