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
  posts_no_mes: 2,
  posts_aguardando: 1,
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

// Publicacoes do quadro (lote 09, status no lote 10b): o enriquecimento conta
// em `creator_posts` as CONFIRMADAS desde o inicio do mes civil de Brasilia e
// as PENDENTES de qualquer data. O double nao simula `gte`, entao o responder
// olha o filtro de status: duas confirmadas viram `posts_no_mes: 2`, e uma
// pendente vira `posts_aguardando: 1`.
const PUBLICACOES_DO_MES = (c: Chamada): RespostaTabela => {
  const status = c.filtros.find((f) => f.coluna === "status")?.valor;
  if (status === "confirmado")
    return { rows: [{ user_id: UID }, { user_id: UID }] };
  if (status === "pendente") return { rows: [{ user_id: UID }] };
  throw new Error(`[teste] contagem de creator_posts sem filtro de status`);
};

// 16/09/2026 ao meio-dia UTC. O mes civil de Brasilia comeca em 01/09 00h de
// Brasilia, que e este instante em UTC.
const AGORA_ISO = "2026-09-16T12:00:00.000Z";
const INICIO_DO_MES_ISO = "2026-09-01T03:00:00.000Z";

describe("GET /creators", () => {
  it("padrao: ativos de todos os kinds, pagina 1 de 25, UMA chamada agregada", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(AGORA_ISO));
    montar(
      {
        creator_pix_keys: respostaQueFiltra([CHAVE_PIX]),
        creator_profiles: respostaQueFiltra([PERFIL_CREATOR]),
        creator_posts: PUBLICACOES_DO_MES,
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
      // As duas leituras seguintes sao as das publicacoes, tambem UMA de
      // cada para a pagina inteira: as confirmadas com o corte no inicio do
      // mes civil de Brasilia (o numero do ranking), e as pendentes sem corte
      // (a pendencia do admin, de qualquer data).
      [
        "creator_posts",
        ["user_id"],
        [
          { tipo: "in", coluna: "user_id", valor: [UID] },
          { tipo: "eq", coluna: "status", valor: "confirmado" },
          {
            tipo: "gte",
            coluna: "created_at",
            valor: INICIO_DO_MES_ISO,
          },
        ],
      ],
      [
        "creator_posts",
        ["user_id"],
        [
          { tipo: "in", coluna: "user_id", valor: [UID] },
          { tipo: "eq", coluna: "status", valor: "pendente" },
        ],
      ],
    ]);
    expect(JSON.stringify(r.body)).not.toContain("52998224725");
  });

  it("creator sem chave, sem perfil e sem publicacao: os tres campos com valor, nunca ausentes", async () => {
    montar(
      {
        creator_pix_keys: respostaQueFiltra([]),
        creator_profiles: respostaQueFiltra([]),
        creator_posts: { rows: [] },
      },
      async () => ({ data: [LINHA_DO_QUADRO], error: null }),
    );
    const r = await chamarAdmin("GET", "/creators");
    expect(r.status).toBe(200);
    expect(r.body.data.rows[0].tem_pix).toBe(false);
    expect(r.body.data.rows[0].instagram_handle).toBeNull();
    expect(r.body.data.rows[0].posts_no_mes).toBe(0);
    expect(r.body.data.rows[0].posts_aguardando).toBe(0);
  });

  it("erro na leitura das chaves: 500, nunca tem_pix false", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar(
      {
        creator_pix_keys: { error: { message: "timeout" } },
        creator_profiles: respostaQueFiltra([]),
        // Registrada de proposito: sem isto o 500 viria da tabela nao
        // registrada, e o teste passaria sem exercitar o erro de chave.
        creator_posts: { rows: [] },
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
        creator_posts: { rows: [] },
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
      // Fixture sem a coluna: o padrao (lote 10c).
      calendar_color: "violet",
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

// PUBLICACOES DE UM CREATOR NA VISAO ADMIN (lote 09). A leitura e a mesma
// capacidade do painel; a remocao e a unica forma de tirar do ranking o que nao
// e sobre a Bora na Tech, e ela e AUDITADA ANTES de apagar.
const POST_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const PUBLICACAO = {
  id: POST_ID,
  network: "instagram",
  kind: "reel",
  url: "https://www.instagram.com/reel/Cx1AbCdEf_-/",
  status: "pendente",
  confirmed_at: null,
  created_at: "2026-09-15T12:00:00Z",
};

describe("GET /creators/:userId/posts", () => {
  it("lista as publicacoes do creator, com o total e o do mes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(AGORA_ISO));
    montar({ creator_posts: { rows: [PUBLICACAO] } });
    const r = await chamarAdmin("GET", `/creators/${UID}/posts`);
    expect(r.status).toBe(200);
    expect(r.body.data.posts).toEqual([PUBLICACAO]);
    expect(r.body.data.total).toBe(1);
    // A fixture e pendente e o double devolve as mesmas linhas para as duas
    // contagens por status: o que se afirma aqui e o formato da resposta; a
    // separacao confirmadas/pendentes e provada em creator.test.ts.
    expect(r.body.data.no_mes).toBe(1);
    expect(r.body.data.aguardando).toBe(1);
  });

  it("uuid invalido: 400, sem tocar no banco", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/creators/nao-e-uuid/posts");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_user_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("erro de leitura: 500 db_error, nunca lista vazia", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({ creator_posts: { error: { message: "timeout" } } });
    const r = await chamarAdmin("GET", `/creators/${UID}/posts`);
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
    expect(r.body.data).toBeUndefined();
  });
});

describe("DELETE /creators/:userId/posts/:postId", () => {
  function tabelas(
    over: Record<string, unknown> = {},
  ): Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)> {
    return {
      creator_posts: (c: Chamada) =>
        c.op === "delete"
          ? { rows: [{ id: POST_ID }] }
          : { rows: [PUBLICACAO] },
      content_audit_logs: { rows: [{}] },
      ...over,
    } as Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)>;
  }

  it("audita ANTES de apagar, com a linha inteira em before_json", async () => {
    montar(tabelas());
    const r = await chamarAdmin(
      "DELETE",
      `/creators/${UID}/posts/${POST_ID}`,
      {},
    );
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { id: POST_ID } });

    const ordem = estado.double.chamadas.map((c) => `${c.table}:${c.op}`);
    // A auditoria entra ENTRE a leitura e o delete: depois de apagar nao ha
    // mais o que guardar em before_json.
    expect(ordem).toEqual([
      "creator_posts:select",
      "content_audit_logs:insert",
      "creator_posts:delete",
    ]);
    const auditoria = estado.double.de("content_audit_logs")[0];
    expect(auditoria.payload).toEqual({
      actor_user_id: "admin-1",
      action: "delete",
      resource_type: "creator_post",
      resource_id: POST_ID,
      resource_slug: null,
      before_json: PUBLICACAO,
      after_json: null,
    });
  });

  it("auditoria que falha IMPEDE a remocao (fail-closed)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar(tabelas({ content_audit_logs: { error: { message: "check" } } }));
    const r = await chamarAdmin(
      "DELETE",
      `/creators/${UID}/posts/${POST_ID}`,
      {},
    );
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(
      estado.double.de("creator_posts").filter((c) => c.op === "delete"),
    ).toHaveLength(0);
  });

  it("publicacao de outro creator: 404 e nada e auditado nem apagado", async () => {
    montar({
      creator_posts: { rows: [] },
      content_audit_logs: { rows: [{}] },
    });
    const r = await chamarAdmin(
      "DELETE",
      `/creators/${UID}/posts/${POST_ID}`,
      {},
    );
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("post_not_found");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("creator_posts").filter((c) => c.op === "delete"),
    ).toHaveLength(0);
  });

  it("id de publicacao invalido: 400, sem tocar no banco", async () => {
    montar({});
    const r = await chamarAdmin(
      "DELETE",
      `/creators/${UID}/posts/nao-e-uuid`,
      {},
    );
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_post_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });
});

// CONFERENCIA DE PUBLICACOES (lote 10b): a lista de pendentes de todos os
// creators e a confirmacao, que e o que faz a publicacao valer ponto.
const OUTRO_UID = "44444444-4444-4444-4444-444444444444";
const OUTRO_POST_ID = "9d2c1b0a-8f7e-4d6c-b5a4-3f2e1d0c9b8a";

const PENDENTE_DE_OUTRO = {
  ...PUBLICACAO,
  id: OUTRO_POST_ID,
  user_id: OUTRO_UID,
  url: "https://www.tiktok.com/@bia.souza/video/7311122233344455566",
  network: "tiktok",
  kind: "video",
  created_at: "2026-09-14T12:00:00Z",
};
const PENDENTE = { ...PUBLICACAO, user_id: UID };

const CONFIRMADA = {
  ...PUBLICACAO,
  status: "confirmado",
  confirmed_at: AGORA_ISO,
};

describe("GET /creators/posts", () => {
  it("lista as pendentes de todos os creators, mais antigas primeiro, com o dono resolvido em lote", async () => {
    montar({
      creator_posts: respostaQueFiltra([PENDENTE, PENDENTE_DE_OUTRO]),
      profiles: respostaQueFiltra([
        { user_id: UID, name: "Ana Cria", avatar_url: "https://a/ana.png" },
        { user_id: OUTRO_UID, name: null, avatar_url: null },
      ]),
      creator_profiles: respostaQueFiltra([
        { user_id: UID, instagram_handle: "ana.cria" },
      ]),
    });
    const r = await chamarAdmin("GET", "/creators/posts?status=pendente");
    expect(r.status).toBe(200);
    expect(r.body.data.total).toBe(2);
    expect(r.body.data.page).toBe(1);
    // Padrao 50, e nao os 25 do resto do admin.
    expect(r.body.data.pageSize).toBe(50);
    expect(r.body.data.rows.map((x: { id: string }) => x.id)).toEqual([
      OUTRO_POST_ID,
      POST_ID,
    ]);
    expect(r.body.data.rows[1].creator).toEqual({
      name: "Ana Cria",
      avatar_url: "https://a/ana.png",
      instagram_handle: "ana.cria",
    });
    // Sem perfil de creator: os campos existem, nulos; a linha nao some.
    expect(r.body.data.rows[0].creator).toEqual({
      name: null,
      avatar_url: null,
      instagram_handle: null,
    });

    const leitura = estado.double.de("creator_posts")[0];
    expect(leitura.filtros).toEqual([
      { tipo: "eq", coluna: "status", valor: "pendente" },
    ]);
    expect(leitura.ordemDetalhe).toEqual([
      { coluna: "created_at", ascending: true },
    ]);
    // Uma consulta por tabela para a pagina inteira, nunca uma por linha.
    expect(estado.double.de("profiles")).toHaveLength(1);
    expect(estado.double.de("profiles")[0].filtros).toEqual([
      // Na ordem da pagina (mais antiga primeiro), sem repetir dono.
      { tipo: "in", coluna: "user_id", valor: [OUTRO_UID, UID] },
    ]);
    expect(estado.double.de("creator_profiles")).toHaveLength(1);
  });

  it("page e pageSize entram no range; pageSize acima de 100 cai em 100", async () => {
    montar({
      creator_posts: respostaQueFiltra([]),
      profiles: respostaQueFiltra([]),
      creator_profiles: respostaQueFiltra([]),
    });
    const r = await chamarAdmin("GET", "/creators/posts?page=3&pageSize=500");
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ rows: [], total: 0, page: 3, pageSize: 100 });
  });

  it("status que nao e pendente: 400, nunca o padrao em silencio", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/creators/posts?status=confirmado");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_status");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("erro de leitura: 500 db_error, nunca lista vazia", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({ creator_posts: { error: { message: "timeout" } } });
    const r = await chamarAdmin("GET", "/creators/posts");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });
});

describe("POST /creators/:userId/posts/:postId/confirmar", () => {
  function tabelas(
    over: Record<string, unknown> = {},
  ): Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)> {
    return {
      creator_posts: (c: Chamada) =>
        c.op === "update" ? { rows: [CONFIRMADA] } : { rows: [PUBLICACAO] },
      content_audit_logs: { rows: [{}] },
      profiles: respostaQueFiltra([
        { user_id: UID, name: "Ana Cria", email: "ana@exemplo.com" },
      ]),
      notifications: (c: Chamada) =>
        c.op === "insert" ? { rows: [{ id: "notif-1" }] } : { rows: [] },
      notification_recipients: { rows: [] },
      ...over,
    } as Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)>;
  }

  it("audita ANTES de escrever, confirma so de pendente, e avisa o creator depois", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(AGORA_ISO));
    montar(tabelas());
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { post: CONFIRMADA } });

    const ordem = estado.double.chamadas.map((c) => `${c.table}:${c.op}`);
    // A auditoria entra ENTRE a leitura e o update; o aviso vem DEPOIS. As
    // duas leituras de `profiles` sao o contato (e-mail do creator) e a
    // resolucao do destinatario dentro de createTargetedNotification.
    expect(ordem).toEqual([
      "creator_posts:select",
      "content_audit_logs:insert",
      "creator_posts:update",
      "profiles:select",
      "profiles:select",
      "notifications:insert",
      "notification_recipients:insert",
    ]);
    const auditoria = estado.double.de("content_audit_logs")[0];
    expect(auditoria.payload).toEqual({
      actor_user_id: "admin-1",
      action: "update",
      resource_type: "creator_post",
      resource_id: POST_ID,
      resource_slug: null,
      before_json: PUBLICACAO,
      after_json: {
        ...PUBLICACAO,
        status: "confirmado",
        confirmed_at: AGORA_ISO,
        confirmed_by: "admin-1",
      },
    });
    const update = estado.double.de("creator_posts")[1];
    expect(update.payload).toEqual({
      status: "confirmado",
      confirmed_at: AGORA_ISO,
      confirmed_by: "admin-1",
    });
    // O `status = pendente` esta no proprio UPDATE: e o que fecha a corrida.
    expect(update.filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
      { tipo: "eq", coluna: "id", valor: POST_ID },
      { tipo: "eq", coluna: "status", valor: "pendente" },
    ]);
    const notificacao = estado.double.de("notifications")[0].payload!;
    expect(notificacao.title).toBe("Publicação confirmada");
    expect(String(notificacao.body)).toContain(PUBLICACAO.url);
    expect(notificacao.cta_url).toBe("/creator?aba=comunidade");
    expect(notificacao.created_by).toBe("admin-1");
  });

  it("ja confirmada: 409, sem auditar nem escrever", async () => {
    montar(tabelas({ creator_posts: { rows: [CONFIRMADA] } }));
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("post_already_confirmed");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("creator_posts").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("corrida: pendente na leitura, mas o update nao alcanca nada: 409", async () => {
    montar(
      tabelas({
        creator_posts: (c: Chamada) =>
          c.op === "update" ? { rows: [] } : { rows: [PUBLICACAO] },
      }),
    );
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("post_already_confirmed");
    expect(estado.double.de("notifications")).toHaveLength(0);
  });

  it("auditoria que falha IMPEDE a confirmacao (fail-closed)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar(tabelas({ content_audit_logs: { error: { message: "check" } } }));
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(
      estado.double.de("creator_posts").filter((c) => c.op === "update"),
    ).toHaveLength(0);
    expect(estado.double.de("notifications")).toHaveLength(0);
  });

  it("notificacao que falha NAO desfaz a confirmacao: 200 e aviso no log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    montar(tabelas({ notifications: { error: { message: "timeout" } } }));
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(200);
    expect(r.body.data.post.status).toBe("confirmado");
    expect(warn).toHaveBeenCalledWith(
      "[admin] falha ao avisar da publicacao confirmada:",
      expect.anything(),
    );
  });

  it("creator sem e-mail: confirma e nao avisa", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    montar(
      tabelas({
        profiles: respostaQueFiltra([
          { user_id: UID, name: "Ana", email: null },
        ]),
      }),
    );
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(200);
    expect(estado.double.de("notifications")).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("publicacao de outro creator: 404 e nada e auditado nem escrito", async () => {
    montar(tabelas({ creator_posts: { rows: [] } }));
    const r = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("post_not_found");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("ids invalidos: 400, sem tocar no banco", async () => {
    montar({});
    const a = await chamarAdmin(
      "POST",
      `/creators/nao-e-uuid/posts/${POST_ID}/confirmar`,
      {},
    );
    expect(a.status).toBe(400);
    expect(a.body.error.code).toBe("invalid_user_id");
    const b = await chamarAdmin(
      "POST",
      `/creators/${UID}/posts/nao-e-uuid/confirmar`,
      {},
    );
    expect(b.status).toBe(400);
    expect(b.body.error.code).toBe("invalid_post_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });
});
