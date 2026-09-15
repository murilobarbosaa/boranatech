import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QUADRO DE CREATORS DO ADMIN: GET /creators, /creators/resumo e
 * /creators/:userId, mais a invalidacao do cache de status de creator na
 * concessao e na revogacao.
 *
 * As guardas (requireAuth e requireAdmin) sao mockadas aqui para injetar um
 * admin; quem prova que as tres rotas novas estao atras delas e
 * adminUsersGuards.test.ts, que NAO as mocka.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  rpc: (async () => ({ data: null, error: null })) as (
    nome: string,
    args: unknown,
  ) => Promise<unknown>,
  invalidateCreatorCache: vi.fn(),
}));

vi.mock("../lib/queue", () => ({
  emailQueue: null,
  enqueueEmail: vi.fn(),
  createEmailWorker: vi.fn(),
}));
vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    stripePriceIds: {
      pro_monthly: "price_m",
      pro_semiannual: "price_s",
      pro_annual: "price_a",
    },
    stripeWebhookSecret: "whsec_x",
    appUrl: "https://exemplo.com",
    stripeSecretKey: "",
    billingEnabled: false,
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100000,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/creatorStatusCache", () => ({
  invalidateCreatorStatusCache: (...a: unknown[]) =>
    estado.invalidateCreatorCache(...a),
  getCachedCreatorStatus: async () => ({ estado: "indisponivel" }),
  setCachedCreatorStatus: async () => {},
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: "admin-1", email: "admin@x.com", role: "authenticated" };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  resolveProStatus: async () => false,
  isDevProUser: () => false,
}));

import {
  criarSupabaseDouble,
  respostaQueFiltra,
  type Chamada,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

const UID = "33333333-3333-3333-3333-333333333333";

function montar(
  tabelas: Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)>,
  rpc?: (nome: string, args: unknown) => Promise<unknown>,
) {
  estado.rpc = rpc ?? (async () => ({ data: null, error: null }));
  estado.double = criarSupabaseDouble(tabelas, {}, (nome, args) =>
    estado.rpc(nome, args),
  );
}

const LINHA_DO_QUADRO = {
  user_id: UID,
  kind: "influencer",
  granted_at: "2026-09-01T12:00:00Z",
  revoked_at: null,
  name: "Ana",
  email: "ana@x.com",
  handle: "ana",
  avatar_url: null,
  codigos: [
    { code: "ANA30", status: "active" },
    { code: "ANAYT", status: "paused" },
  ],
  codigos_count: 2,
  clicks: 140,
  sales: 3,
  revenue_cents: 6279,
  commission_due_cents: 1884,
  commission_paid_cents: 0,
  ultimo_evento_at: "2026-09-18T01:30:00Z",
  total_count: 7,
};

const ITEM_DO_QUADRO = {
  user_id: UID,
  kind: "influencer",
  granted_at: "2026-09-01T12:00:00Z",
  revoked_at: null,
  name: "Ana",
  email: "ana@x.com",
  handle: "ana",
  avatar_url: null,
  codigos_count: 2,
  codigos: [
    { code: "ANA30", status: "active" },
    { code: "ANAYT", status: "paused" },
  ],
  totais: {
    clicks: 140,
    sales: 3,
    revenue_cents: 6279,
    commission_due_cents: 1884,
    commission_paid_cents: 0,
  },
  ultimo_evento_at: "2026-09-18T01:30:00Z",
  tem_pix: true,
  instagram_handle: "ana.cria",
};

// Perfil de creator e chave Pix (lote 08). A chave e um CPF de teste valido: a
// mesma do teste de shared/creatorProfile, para as mascaras baterem.
const CHAVE_PIX = {
  user_id: UID,
  key_type: "cpf",
  key_value: "52998224725",
  updated_at: "2026-09-14T12:00:00Z",
};
const PERFIL_CREATOR = {
  user_id: UID,
  instagram_handle: "ana.cria",
  tiktok_handle: null,
  instagram_followers: 12500,
  tiktok_followers: null,
  followers_updated_at: "2026-09-14T12:00:00Z",
  visible_to_creators: true,
};

beforeEach(() => {
  estado.invalidateCreatorCache = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GET /creators", () => {
  it("padrao: ativos de todos os kinds, pagina 1 de 25, UMA chamada agregada", async () => {
    montar(
      {
        creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
        creator_profiles: respostaQueFiltra([PERFIL_CREATOR]),
      },
      async () => ({ data: [LINHA_DO_QUADRO], error: null }),
    );
    const r = await chamarAdmin("GET", "/creators");

    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({
      rows: [ITEM_DO_QUADRO],
      total: 7,
      page: 1,
      pageSize: 25,
    });
    expect(estado.double.rpcCalls).toEqual([
      {
        nome: "admin_creators_page",
        args: { p_status: "active", p_kind: "all", p_limit: 25, p_offset: 0 },
      },
    ]);
    // ultimo_evento_at e totais vem da MESMA chamada agregada. O enriquecimento
    // do lote 08 faz UMA leitura por tabela para a pagina inteira (`in`), nunca
    // uma por creator, e a de chave Pix pede so `user_id`: o quadro sabe SE ha
    // chave, e nunca qual.
    expect(
      estado.double.chamadas.map((c) => [c.table, c.colunas, c.filtros]),
    ).toEqual([
      [
        "creator_pix_keys",
        ["user_id"],
        [{ tipo: "in", coluna: "user_id", valor: [UID] }],
      ],
      [
        "creator_profiles",
        ["user_id", "instagram_handle"],
        [{ tipo: "in", coluna: "user_id", valor: [UID] }],
      ],
    ]);
    expect(JSON.stringify(r.body)).not.toContain("52998224725");
  });

  it("creator sem chave e sem perfil: tem_pix false e instagram null, nunca ausentes", async () => {
    montar(
      {
        creator_pix_keys: respostaQueFiltra([]),
        creator_profiles: respostaQueFiltra([]),
      },
      async () => ({ data: [LINHA_DO_QUADRO], error: null }),
    );
    const r = await chamarAdmin("GET", "/creators");
    expect(r.status).toBe(200);
    expect(r.body.data.rows[0].tem_pix).toBe(false);
    expect(r.body.data.rows[0].instagram_handle).toBeNull();
  });

  it("erro na leitura das chaves: 500, nunca tem_pix false", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar(
      {
        creator_pix_keys: { error: { message: "timeout" } },
        creator_profiles: respostaQueFiltra([]),
      },
      async () => ({ data: [LINHA_DO_QUADRO], error: null }),
    );
    const r = await chamarAdmin("GET", "/creators");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });

  it("filtros e paginacao chegam como argumentos da funcao", async () => {
    montar(
      {
        creator_pix_keys: respostaQueFiltra([]),
        creator_profiles: respostaQueFiltra([]),
      },
      async () => ({ data: [LINHA_DO_QUADRO], error: null }),
    );
    const r = await chamarAdmin(
      "GET",
      "/creators?status=revoked&kind=afiliado&page=2&pageSize=10",
    );
    expect(r.status).toBe(200);
    expect(estado.double.rpcCalls[0].args).toEqual({
      p_status: "revoked",
      p_kind: "afiliado",
      p_limit: 10,
      p_offset: 10,
    });
  });

  it("status invalido: 400, sem chamar o banco", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/creators?status=ativos");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_status");
    expect(estado.double.rpcCalls).toHaveLength(0);
  });

  it("kind invalido: 400, sem chamar o banco", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/creators?kind=parceiro");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_creator_kind");
    expect(estado.double.rpcCalls).toHaveLength(0);
  });

  it("pagina alem do fim: total vem de uma segunda leitura, nunca zero", async () => {
    montar({}, async (_nome, args) => {
      const { p_offset } = args as { p_offset: number };
      return {
        data: p_offset === 0 ? [{ ...LINHA_DO_QUADRO, total_count: "7" }] : [],
        error: null,
      };
    });
    const r = await chamarAdmin("GET", "/creators?page=3");
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ rows: [], total: 7, page: 3, pageSize: 25 });
    expect(estado.double.rpcCalls.map((c) => c.args)).toEqual([
      { p_status: "active", p_kind: "all", p_limit: 25, p_offset: 50 },
      { p_status: "active", p_kind: "all", p_limit: 1, p_offset: 0 },
    ]);
  });

  it("conjunto vazio na primeira pagina: total 0 com uma chamada so", async () => {
    montar({}, async () => ({ data: [], error: null }));
    const r = await chamarAdmin("GET", "/creators");
    expect(r.body.data).toEqual({ rows: [], total: 0, page: 1, pageSize: 25 });
    expect(estado.double.rpcCalls).toHaveLength(1);
  });

  it("erro da funcao: 500, nunca lista vazia", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({}, async () => ({ data: null, error: { message: "timeout" } }));
    const r = await chamarAdmin("GET", "/creators");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });

  it("linha com contador nulo: 500, nunca uma linha com zero", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({}, async () => ({
      data: [{ ...LINHA_DO_QUADRO, clicks: null }],
      error: null,
    }));
    const r = await chamarAdmin("GET", "/creators");
    expect(r.status).toBe(500);
  });
});

describe("GET /creators/resumo", () => {
  it("devolve os cards e pede a janela de 30 dias civis de Brasilia", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-09-20 12:00 em Brasilia: os 30 dias comecam em 22/08.
    vi.setSystemTime(new Date("2026-09-20T15:00:00Z"));
    montar({}, async () => ({
      data: [
        {
          creators_influencer: 21,
          creators_afiliado: 4,
          codigos_vinculados: 26,
          codigos_sem_dono: 15,
          clicks_periodo: 312,
          sales_periodo: 9,
          commission_due_cents: 48210,
        },
      ],
      error: null,
    }));

    const r = await chamarAdmin("GET", "/creators/resumo");

    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({
      creators_ativos: { influencer: 21, afiliado: 4 },
      codigos: { vinculados: 26, sem_dono: 15 },
      eventos_30d: {
        desde: "2026-08-22T03:00:00.000Z",
        clicks: 312,
        sales: 9,
      },
      commission_due_cents: 48210,
    });
    expect(estado.double.rpcCalls).toEqual([
      {
        nome: "creators_board_summary",
        args: { p_from: "2026-08-22T03:00:00.000Z" },
      },
    ]);
  });

  it("resposta sem a linha unica: 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({}, async () => ({ data: [], error: null }));
    const r = await chamarAdmin("GET", "/creators/resumo");
    expect(r.status).toBe(500);
  });

  it("erro da funcao: 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({}, async () => ({ data: null, error: { message: "timeout" } }));
    const r = await chamarAdmin("GET", "/creators/resumo");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });
});

describe("GET /creators/:userId", () => {
  it("id que nao e uuid: 400", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/creators/nao-e-uuid");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_user_id");
  });

  it("uuid sem concessao nenhuma: 404 creator_not_found", async () => {
    montar({ creators: respostaQueFiltra([]) });
    const r = await chamarAdmin("GET", `/creators/${UID}`);
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("creator_not_found");
  });

  it("creator revogado: 200 com revoked_at e os campos do admin", async () => {
    montar({
      creators: respostaQueFiltra([
        {
          id: "c1",
          user_id: UID,
          kind: "afiliado",
          granted_at: "2026-09-01T12:00:00Z",
          revoked_at: "2026-09-19T12:00:00Z",
          granted_by: "admin-9",
        },
      ]),
      profiles: respostaQueFiltra([
        {
          user_id: UID,
          name: "Ana",
          handle: "ana",
          avatar_url: null,
          email: "ana@x.com",
        },
      ]),
      affiliates: respostaQueFiltra([]),
      creator_profiles: respostaQueFiltra([PERFIL_CREATOR]),
      creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
    });
    const r = await chamarAdmin("GET", `/creators/${UID}?janela=90d`);
    expect(r.status).toBe(200);
    expect(r.body.data.creator).toEqual({
      kind: "afiliado",
      granted_at: "2026-09-01T12:00:00Z",
      revoked_at: "2026-09-19T12:00:00Z",
      granted_by: "admin-9",
    });
    expect(r.body.data.perfil.email).toBe("ana@x.com");
    expect(r.body.data.janela).toBe("90d");
  });

  it("perfil_creator: redes, seguidores, consentimento e a chave MASCARADA", async () => {
    montar({
      creators: respostaQueFiltra([
        {
          id: "c1",
          user_id: UID,
          kind: "influencer",
          granted_at: "2026-09-01T12:00:00Z",
          revoked_at: null,
          granted_by: "admin-9",
        },
      ]),
      profiles: respostaQueFiltra([
        {
          user_id: UID,
          name: "Ana",
          handle: "ana",
          avatar_url: null,
          email: "ana@x.com",
        },
      ]),
      affiliates: respostaQueFiltra([]),
      creator_profiles: respostaQueFiltra([PERFIL_CREATOR]),
      creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
    });
    const r = await chamarAdmin("GET", `/creators/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.perfil_creator).toEqual({
      instagram_handle: "ana.cria",
      tiktok_handle: null,
      instagram_followers: 12500,
      tiktok_followers: null,
      followers_updated_at: "2026-09-14T12:00:00Z",
      visible_to_creators: true,
      pix: {
        tipo: "cpf",
        mascarada: "***.***.247-**",
        updated_at: "2026-09-14T12:00:00Z",
      },
    });
    expect(JSON.stringify(r.body)).not.toContain("52998224725");
  });

  it("quem nunca foi creator: 404 sem ler o perfil de creator", async () => {
    montar({ creators: respostaQueFiltra([]) });
    const r = await chamarAdmin("GET", `/creators/${UID}`);
    expect(r.status).toBe(404);
    expect(estado.double.de("creator_profiles")).toHaveLength(0);
    expect(estado.double.de("creator_pix_keys")).toHaveLength(0);
  });

  it("janela invalida: 400", async () => {
    montar({});
    const r = await chamarAdmin("GET", `/creators/${UID}?janela=semana`);
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_janela");
  });

  it("/creators/resumo nao e capturada como userId", async () => {
    montar({}, async () => ({ data: [], error: null }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await chamarAdmin("GET", "/creators/resumo");
    // 500 do resumo sem linha, e nao 400 de uuid invalido.
    expect(r.status).toBe(500);
    expect(estado.double.rpcCalls[0].nome).toBe("creators_board_summary");
  });
});

describe("POST /creators/:userId/reveal-pix", () => {
  it("id que nao e uuid: 400, sem ler nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", "/creators/nao-e-uuid/reveal-pix", {});
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_user_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("sem chave: 404 pix_not_found, e nada e auditado", async () => {
    montar({
      creator_pix_keys: respostaQueFiltra([]),
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin("POST", `/creators/${UID}/reveal-pix`, {});
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("pix_not_found");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("com chave: audita PRIMEIRO e so entao devolve a chave inteira", async () => {
    montar({
      creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin("POST", `/creators/${UID}/reveal-pix`, {});
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { tipo: "cpf", valor: "52998224725" } });
    const auditoria = estado.double.de("content_audit_logs");
    expect(auditoria).toHaveLength(1);
    expect(auditoria[0].op).toBe("insert");
    expect(auditoria[0].payload).toEqual({
      actor_user_id: "admin-1",
      action: "reveal",
      resource_type: "creator_pix_key",
      resource_id: UID,
      resource_slug: null,
      before_json: null,
      after_json: null,
    });
  });

  it("auditoria falhou: 500 audit_failed, SEM a chave", async () => {
    montar({
      creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
      content_audit_logs: { error: { message: "timeout" } },
    });
    const r = await chamarAdmin("POST", `/creators/${UID}/reveal-pix`, {});
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(JSON.stringify(r.body)).not.toContain("52998224725");
  });

  it("erro ao ler a chave: 500 db_error, sem auditar e sem chave", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creator_pix_keys: { error: { message: "timeout" } },
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin("POST", `/creators/${UID}/reveal-pix`, {});
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });
});

describe("concessao e revogacao invalidam o cache de status de creator", () => {
  it("conceder invalida creator_status do usuario", async () => {
    montar({
      creators: { rows: [] },
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin("POST", `/users/${UID}/influencer`, {
      kind: "afiliado",
    });
    expect(r.status).toBe(201);
    expect(estado.invalidateCreatorCache).toHaveBeenCalledWith(UID);
  });

  it("revogar invalida creator_status do usuario", async () => {
    montar({
      creators: {
        rows: [
          {
            id: "c1",
            granted_at: "2026-09-01T12:00:00Z",
            granted_by: "admin-1",
            note: null,
            kind: "afiliado",
          },
        ],
      },
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin("POST", `/users/${UID}/influencer/revoke`, {});
    expect(r.status).toBe(200);
    expect(estado.invalidateCreatorCache).toHaveBeenCalledWith(UID);
  });

  it("concessao abortada pela auditoria NAO invalida", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: { rows: [] },
      content_audit_logs: { error: { message: "check" } },
    });
    const r = await chamarAdmin("POST", `/users/${UID}/influencer`, {
      kind: "afiliado",
    });
    expect(r.status).toBe(500);
    expect(estado.invalidateCreatorCache).not.toHaveBeenCalled();
  });
});
