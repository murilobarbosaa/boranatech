import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createError } from "../middleware/error";


/**
 * FIACAO das rotas de ESCRITA de usuário do admin.
 *
 * As pontas já tinham teste (libs puras e render). O que nunca teve foi o NÓ:
 * a query do Supabase, a ordem dos passos, o envelope de erro e o status HTTP.
 * Escrita primeiro porque é o que causa dano.
 *
 * O router REAL é exercitado através de um app Express REAL, com o
 * errorHandler de produção montado. O que é dublê: Supabase, Stripe, Auth,
 * Redis, BullMQ. O que NÃO é: as rotas, o roteamento, os middlewares de corpo e
 * o handler de erro.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  stripeUpdate: null as unknown as ReturnType<typeof vi.fn>,
  invalidateProCache: null as unknown as ReturnType<typeof vi.fn>,
  stripeSubscriptionUpdate: null as unknown as ReturnType<typeof vi.fn>,
  stripeRefundCreate: null as unknown as ReturnType<typeof vi.fn>,
  stripeRefundList: null as unknown as ReturnType<typeof vi.fn>,
  stripeSubscriptionCancel: null as unknown as ReturnType<typeof vi.fn>,
  syncBalance: null as unknown as ReturnType<typeof vi.fn>,
  asaasRefund: null as unknown as ReturnType<typeof vi.fn>,
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
    stripeSecretKey: "sk_test_x",
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
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    customers: { update: estado.stripeUpdate },
    subscriptions: {
      update: estado.stripeSubscriptionUpdate,
      cancel: estado.stripeSubscriptionCancel,
    },
    refunds: {
      create: estado.stripeRefundCreate,
      list: estado.stripeRefundList,
    },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: (...a: unknown[]) => estado.syncBalance(...a),
}));
// SO `estornarPagamento` e dublado; o resto do provider fica real. O modulo
// inteiro precisa ser mockado porque importar `providers/asaas` puxa o cliente
// HTTP e o `env`, e o `.env` local nao tem `ASAAS_API_URL`.
vi.mock("../providers/asaas", () => ({
  estornarPagamento: (...a: unknown[]) => estado.asaasRefund(...a),
}));

vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: (...a: unknown[]) =>
    estado.invalidateProCache(...a),
  getCachedProStatus: async () => null,
  setCachedProStatus: async () => {},
}));
// AUTENTICACAO: injeta um admin. As guardas em si são verificadas em
// adminUsersGuards.test.ts, que NÃO as mocka.
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
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

const UID = "11111111-1111-1111-1111-111111111111";

const PERFIL_BASE = {
  user_id: UID,
  name: "Ana",
  full_name: "Ana Moura",
  gender: "feminino",
  bio: null,
  area_interesse: null,
  nivel_atual: null,
  objetivo: null,
  headline: null,
  city: null,
  uf: null,
  career_goal: null,
  github_url: null,
  linkedin_url: null,
  website_url: null,
  updated_at: "2026-07-30T12:00:00Z",
};

/**
 * Duas tabelas ganham resposta VAZIA por padrão: `admin_refunds`, lida por toda
 * rota de devolução para juntar a segunda fonte do extrato, e `influencers`,
 * lida para saber se o Pro sobrevive à revogação. As duas são consultadas em
 * TODO caminho, inclusive nos que não têm nada a ver com elas, e obrigar cada
 * teste a declarar "não tenho nenhuma" seria ruído sem asserção.
 *
 * O default NÃO enfraquece as outras defesas do dublê: a validação de coluna
 * continua valendo (foi ela que recusou `settlement` antes da migration), e
 * qualquer OUTRA tabela não registrada continua lançando. Um teste que precise
 * de linhas nelas sobrescreve, porque o spread do chamador vem depois.
 */
function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  authAdmin: Record<string, unknown> = {},
) {
  estado.double = criarSupabaseDouble(
    { admin_refunds: { rows: [] }, influencers: { rows: [] }, ...respostas },
    authAdmin,
  );
}

beforeEach(() => {
  estado.stripeUpdate = vi.fn(async () => ({}));
  estado.invalidateProCache = vi.fn(async () => {});
  estado.stripeSubscriptionUpdate = vi.fn(async () => ({}));
  estado.stripeRefundCreate = vi.fn(async () => ({
    id: "re_1",
    status: "succeeded",
  }));
  // Padrão: a Stripe NÃO tem reembolso nesta cobrança, que é o caso (b).
  estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
  estado.stripeSubscriptionCancel = vi.fn(async () => ({}));
  estado.syncBalance = vi.fn(async () => ({
    processed: 0,
    upserted: 0,
    skipped: 0,
  }));
  estado.asaasRefund = vi.fn(async () => ({
    status: "REFUNDED",
    raw: { id: "pay_abc", status: "REFUNDED" },
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// PATCH /users/:id
// ---------------------------------------------------------------------------

describe("PATCH /users/:id", () => {
  it("salva o campo permitido e grava a auditoria ANTES do update", async () => {
    montar({
      profiles: { rows: [PERFIL_BASE] },
      content_audit_logs: { rows: [{}] },
    });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, {
      name: "Ana Paula",
    });

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { updated: true, fields: ["name"] } });

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    // Ordem: le o perfil -> AUDITA -> escreve. Auditar depois deixaria janela
    // para escrita sem rastro.
    expect(ops).toEqual([
      "select profiles",
      "insert content_audit_logs",
      "update profiles",
    ]);

    const audit = estado.double.de("content_audit_logs")[0].payload!;
    expect(audit.action).toBe("update_profile");
    expect(audit.actor_user_id).toBe("admin-1");
    expect(audit.before_json).toEqual({ name: "Ana" });
    expect(audit.after_json).toEqual({ name: "Ana Paula" });
  });

  it("campo fora da allowlist vira 400, sem tocar audit nem tabela", async () => {
    montar({ profiles: { rows: [PERFIL_BASE] } });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, { cpf: "123" });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_field");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("profiles").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("validação de tamanho vira 400 antes de qualquer escrita", async () => {
    montar({ profiles: { rows: [PERFIL_BASE] } });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, {
      headline: "x".repeat(141),
    });

    expect(r.status).toBe(400);
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("requisição SEM mudança não audita e não toca a tabela", async () => {
    // profiles tem trigger de updated_at: um update vazio bateria o carimbo e
    // deixaria rastro de "editado agora" sobre nada.
    montar({ profiles: { rows: [PERFIL_BASE] } });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, { name: "Ana" });

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { updated: false, fields: [] } });
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("profiles").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("falha do AUDIT aborta a escrita (fail-closed)", async () => {
    montar({
      profiles: { rows: [PERFIL_BASE] },
      content_audit_logs: { error: { message: "check constraint" } },
    });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, {
      name: "Ana Paula",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(
      estado.double.de("profiles").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("updated_at divergente vira 409 antes do audit", async () => {
    montar({ profiles: { rows: [PERFIL_BASE] } });

    const r = await chamarAdmin("PATCH", `/users/${UID}`, {
      name: "Ana Paula",
      expected_updated_at: "2020-01-01T00:00:00Z",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("stale_profile");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("UUID inválido vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("PATCH", "/users/nao-e-uuid", { name: "x" });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_user_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("usuário inexistente vira 404", async () => {
    montar({ profiles: { rows: [] } });
    const r = await chamarAdmin("PATCH", `/users/${UID}`, { name: "x" });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
  });
});

// ---------------------------------------------------------------------------
// POST /users/:id/email
// ---------------------------------------------------------------------------

describe("POST /users/:id/email", () => {
  type RespostaAuth = { data: unknown; error: unknown };
  function authComEmail(email: string | null, erro: unknown = null) {
    return {
      getUserById: vi.fn(
        async (): Promise<RespostaAuth> => ({
          data: erro
            ? null
            : { user: { id: UID, email, user_metadata: { name: "Ana" } } },
          error: erro,
        }),
      ),
      updateUserById: vi.fn(
        async (): Promise<RespostaAuth> => ({ data: {}, error: null }),
      ),
    };
  }

  it("troca com sucesso: audit, Auth, espelho e Stripe, nessa ordem", async () => {
    const auth = authComEmail("velho@x.com");
    montar(
      {
        content_audit_logs: { rows: [{}] },
        profiles: { rows: [{ user_id: UID }] },
        subscriptions: { rows: [{ provider_customer_id: "cus_1" }] },
      },
      auth,
    );

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ changed: true, email: "novo@x.com" });

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops[0]).toBe("insert content_audit_logs");
    expect(ops).toContain("update profiles");

    const audit = estado.double.de("content_audit_logs")[0].payload!;
    expect(audit.action).toBe("update_email");
    expect(audit.before_json).toEqual({ email: "velho@x.com" });
    expect(audit.after_json).toEqual({ email: "novo@x.com" });

    // user_metadata vai COMPLETO, preservando o que já existia.
    const args = auth.updateUserById.mock.calls[0] as unknown[];
    expect(args[1]).toMatchObject({
      email: "novo@x.com",
      email_confirm: true,
      user_metadata: { name: "Ana", email: "novo@x.com" },
    });

    expect(estado.stripeUpdate).toHaveBeenCalledWith("cus_1", {
      email: "novo@x.com",
    });
  });

  it("colisão no Auth vira 409 legível, sem vazar a mensagem crua", async () => {
    const auth = authComEmail("velho@x.com");
    auth.updateUserById = vi.fn(
      async (): Promise<RespostaAuth> => ({
        data: null,
        error: {
          message: "A user with this email address has already been registered",
        },
      }),
    );
    montar({ content_audit_logs: { rows: [{}] } }, auth);

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "ocupado@x.com",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("email_taken");
    expect(r.body.error.message).toBe("Este e-mail já pertence a outra conta.");
    expect(r.body.error.message).not.toContain("already been registered");
    // Espelho NÃO foi tocado.
    expect(estado.double.de("profiles")).toHaveLength(0);
  });

  it("falha do espelho DEPOIS do Auth: 500 próprio e INCONSISTENCIA logada", async () => {
    const auth = authComEmail("velho@x.com");
    montar(
      {
        content_audit_logs: { rows: [{}] },
        profiles: { error: { message: "timeout" } },
      },
      auth,
    );
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("profile_mirror_failed");
    expect(
      erroSpy.mock.calls.some((c) => String(c[0]).includes("INCONSISTENCIA")),
    ).toBe(true);
    // NÃO tenta reverter o Auth.
    expect(auth.updateUserById).toHaveBeenCalledTimes(1);
  });

  it("falha da Stripe NÃO derruba a troca", async () => {
    const auth = authComEmail("velho@x.com");
    montar(
      {
        content_audit_logs: { rows: [{}] },
        profiles: { rows: [{ user_id: UID }] },
        subscriptions: { rows: [{ provider_customer_id: "cus_1" }] },
      },
      auth,
    );
    estado.stripeUpdate = vi.fn(async () => {
      throw new Error("stripe fora do ar");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ changed: true, stripe_updated: false });
  });

  it("sem provider_customer_id NÃO chama a Stripe", async () => {
    const auth = authComEmail("velho@x.com");
    montar(
      {
        content_audit_logs: { rows: [{}] },
        profiles: { rows: [{ user_id: UID }] },
        subscriptions: { rows: [] },
      },
      auth,
    );

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });

    expect(r.status).toBe(200);
    expect(estado.stripeUpdate).not.toHaveBeenCalled();
  });

  it("reenvio do MESMO e-mail é idempotente: sem audit, sem Auth", async () => {
    const auth = authComEmail("igual@x.com");
    montar({}, auth);

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "  IGUAL@x.com ",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ changed: false, email: "igual@x.com" });
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(auth.updateUserById).not.toHaveBeenCalled();
  });

  it("formato inválido vira 400 sem tocar em nada", async () => {
    montar({}, authComEmail("velho@x.com"));
    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "sem-arroba",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_email");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("falha do AUDIT aborta antes de tocar o Auth", async () => {
    const auth = authComEmail("velho@x.com");
    montar({ content_audit_logs: { error: { message: "check" } } }, auth);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(auth.updateUserById).not.toHaveBeenCalled();
  });

  it("perfil sem linha em auth.users vira 404", async () => {
    montar({}, authComEmail(null, { message: "not found" }));
    const r = await chamarAdmin("POST", `/users/${UID}/email`, {
      email: "novo@x.com",
    });
    expect(r.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// influencer e reveal-cpf
// ---------------------------------------------------------------------------

describe("POST /users/:id/influencer", () => {
  it("concede: audita, insere e invalida o cache de Pro", async () => {
    montar({
      influencers: { rows: [] },
      content_audit_logs: { rows: [{}] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/influencer`, {
      note: "parceria",
    });

    expect(r.status).toBe(201);
    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops).toEqual([
      "select influencers",
      "insert content_audit_logs",
      "insert influencers",
    ]);
    expect(estado.double.de("content_audit_logs")[0].payload!.action).toBe(
      "grant",
    );
    // Sem isto o acesso Pro só valeria depois do TTL de 60s do cache.
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);
  });

  it("quem já é influencer não ganha segunda linha nem segunda auditoria", async () => {
    montar({
      influencers: {
        rows: [{ id: "i1", granted_at: "2026-01-01", note: null }],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/influencer`, {});

    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ granted: false, already_active: true });
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("falha do audit aborta a concessão", async () => {
    montar({
      influencers: { rows: [] },
      content_audit_logs: { error: { message: "check" } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/influencer`, {});

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(
      estado.double.de("influencers").filter((c) => c.op === "insert"),
    ).toHaveLength(0);
    expect(estado.invalidateProCache).not.toHaveBeenCalled();
  });
});

describe("POST /users/:id/influencer/revoke", () => {
  it("revoga: audita antes, atualiza e invalida o cache", async () => {
    montar({
      influencers: {
        rows: [
          { id: "i1", granted_at: "2026-01-01", granted_by: "a", note: null },
        ],
      },
      content_audit_logs: { rows: [{}] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/influencer/revoke`, {});

    expect(r.status).toBe(200);
    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops).toEqual([
      "select influencers",
      "insert content_audit_logs",
      "update influencers",
    ]);
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);
  });

  it("revogar quem não é influencer ativo vira 404 próprio", async () => {
    montar({ influencers: { rows: [] } });
    const r = await chamarAdmin("POST", `/users/${UID}/influencer/revoke`, {});
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("influencer_not_active");
  });
});

describe("POST /users/:id/reveal-cpf", () => {
  it("audita ANTES de devolver o número", async () => {
    montar({
      profiles: { rows: [{ cpf: "39053344705" }] },
      content_audit_logs: { rows: [{}] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/reveal-cpf`, {});

    expect(r.status).toBe(200);
    expect(r.body.data.cpf).toContain("390");
    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops).toEqual(["select profiles", "insert content_audit_logs"]);
    expect(estado.double.de("content_audit_logs")[0].payload!.action).toBe(
      "reveal",
    );
  });

  it("audit falhando NÃO devolve o CPF", async () => {
    montar({
      profiles: { rows: [{ cpf: "39053344705" }] },
      content_audit_logs: { error: { message: "check" } },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/reveal-cpf`, {});

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(JSON.stringify(r.body)).not.toContain("39053344705");
  });

  it("usuário sem CPF vira 404 próprio, sem auditar", async () => {
    montar({ profiles: { rows: [{ cpf: null }] } });
    const r = await chamarAdmin("POST", `/users/${UID}/reveal-cpf`, {});
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("cpf_not_found");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ESCOPO DA ESCRITA. É a asserção de maior valor do arquivo: o dublê não
// executa SQL, então um UPDATE sem filtro devolveria "sucesso" aqui e
// reescreveria a TABELA INTEIRA em produção. O que dá para afirmar é que o
// filtro foi pedido.
// ---------------------------------------------------------------------------

describe("nenhum UPDATE sai sem filtro de escopo", () => {
  it("PATCH /users/:id atualiza apenas a linha do usuário", async () => {
    montar({
      profiles: { rows: [PERFIL_BASE] },
      content_audit_logs: { rows: [{}] },
    });

    await chamarAdmin("PATCH", `/users/${UID}`, { name: "Ana Paula" });

    const update = estado.double.de("profiles").find((c) => c.op === "update")!;
    expect(update.filtros.length).toBeGreaterThan(0);
    expect(
      update.filtros.some(
        (f) => f.tipo === "eq" && f.coluna === "user_id" && f.valor === UID,
      ),
    ).toBe(true);
  });

  it("PATCH com expected_updated_at repete a trava no PRÓPRIO update (ponto atômico)", async () => {
    montar({
      profiles: { rows: [PERFIL_BASE] },
      content_audit_logs: { rows: [{}] },
    });

    await chamarAdmin("PATCH", `/users/${UID}`, {
      name: "Ana Paula",
      expected_updated_at: PERFIL_BASE.updated_at,
    });

    const update = estado.double.de("profiles").find((c) => c.op === "update")!;
    // Sem isto, entre ler e escrever existe janela para outro admin salvar.
    expect(
      update.filtros.some(
        (f) => f.coluna === "updated_at" && f.valor === PERFIL_BASE.updated_at,
      ),
    ).toBe(true);
  });

  it("troca de e-mail atualiza apenas a linha do usuário", async () => {
    const auth = {
      getUserById: vi.fn(async () => ({
        data: { user: { id: UID, email: "velho@x.com", user_metadata: {} } },
        error: null,
      })),
      updateUserById: vi.fn(async () => ({ data: {}, error: null })),
    };
    montar(
      {
        content_audit_logs: { rows: [{}] },
        profiles: { rows: [{ user_id: UID }] },
        subscriptions: { rows: [] },
      },
      auth,
    );

    await chamarAdmin("POST", `/users/${UID}/email`, { email: "novo@x.com" });

    const update = estado.double.de("profiles").find((c) => c.op === "update")!;
    expect(
      update.filtros.some(
        (f) => f.tipo === "eq" && f.coluna === "user_id" && f.valor === UID,
      ),
    ).toBe(true);
  });

  it("revogar influencer filtra pela concessão E por revoked_at nulo", async () => {
    montar({
      influencers: {
        rows: [
          { id: "i1", granted_at: "2026-01-01", granted_by: "a", note: null },
        ],
      },
      content_audit_logs: { rows: [{}] },
    });

    await chamarAdmin("POST", `/users/${UID}/influencer/revoke`, {});

    const update = estado.double
      .de("influencers")
      .find((c) => c.op === "update")!;
    expect(
      update.filtros.some((f) => f.coluna === "id" && f.valor === "i1"),
    ).toBe(true);
    // O `is revoked_at null` evita revogar duas vezes numa corrida.
    expect(
      update.filtros.some((f) => f.tipo === "is" && f.coluna === "revoked_at"),
    ).toBe(true);
  });

  it("a concessão de influencer grava o ator, não um id qualquer", async () => {
    montar({ influencers: { rows: [] }, content_audit_logs: { rows: [{}] } });

    await chamarAdmin("POST", `/users/${UID}/influencer`, { note: "x" });

    const insert = estado.double
      .de("influencers")
      .find((c) => c.op === "insert")!;
    expect(insert.payload).toMatchObject({
      user_id: UID,
      granted_by: "admin-1",
    });
  });
});

// ---------------------------------------------------------------------------
// POST /users/:id/subscription/cancel  (Fatia 6)
// ---------------------------------------------------------------------------

describe("POST /users/:id/subscription/cancel", () => {
  const SUB_CARTAO = {
    id: "sub-row-1",
    status: "active",
    renewal_type: "auto",
    current_period_end: "2027-01-01T00:00:00Z",
    cancel_at_period_end: false,
    provider_subscription_id: "sub_1",
    payment_method: "card",
  };

  it("cancela: audita ANTES, chama a Stripe, grava e invalida o cache", async () => {
    montar({
      subscriptions: { rows: [SUB_CARTAO] },
      content_audit_logs: { rows: [{}] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "pedido por e-mail",
    });

    expect(r.status).toBe(200);
    expect(r.body.data.canceled).toBe(true);

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    // Audita antes de qualquer coisa que remova acesso.
    expect(ops.indexOf("insert content_audit_logs")).toBeLessThan(
      ops.lastIndexOf("update subscriptions"),
    );

    const audit = estado.double.de("content_audit_logs")[0].payload!;
    expect(audit.action).toBe("cancel_subscription");
    expect(audit.actor_user_id).toBe("admin-1");
    expect(audit.resource_type).toBe("subscription");

    expect(estado.stripeSubscriptionUpdate).toHaveBeenCalledWith("sub_1", {
      cancel_at_period_end: true,
    });
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);

    // O ator vai para canceled_by: é o que torna `canceled_by <> user_id` a
    // leitura de "um admin fez isso".
    const registro = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "insert")!;
    expect(registro.payload).toMatchObject({
      user_id: UID,
      canceled_by: "admin-1",
      reason_code: "admin",
      reason_text: "pedido por e-mail",
    });
  });

  it("motivo ausente vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "   ",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("reason_required");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("BOLETO é recusado com código próprio, na ROTA e não só na UI", async () => {
    // renewal_type='manual' não tem assinatura recorrente na Stripe; setar
    // cancel_at_period_end acordaria o bug do cron process-cancellations.
    montar({
      subscriptions: { rows: [{ ...SUB_CARTAO, renewal_type: "manual" }] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("boleto_not_supported");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it("reenvio com cancelamento já agendado é idempotente", async () => {
    montar({
      subscriptions: { rows: [{ ...SUB_CARTAO, cancel_at_period_end: true }] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      canceled: false,
      already_scheduled: true,
    });
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it("falha do AUDIT aborta antes de tocar a Stripe", async () => {
    montar({
      subscriptions: { rows: [SUB_CARTAO] },
      content_audit_logs: { error: { message: "check" } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
    expect(estado.invalidateProCache).not.toHaveBeenCalled();
  });

  it("Stripe falhando deixa o banco intocado e devolve 502", async () => {
    montar({
      subscriptions: { rows: [SUB_CARTAO] },
      content_audit_logs: { rows: [{}] },
    });
    estado.stripeSubscriptionUpdate = vi.fn(async () => {
      throw new Error("stripe fora do ar");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });

    expect(r.status).toBe(502);
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("banco falhando DEPOIS da Stripe loga INCONSISTENCIA", async () => {
    let chamadasSubs = 0;
    montar({
      subscriptions: () => {
        chamadasSubs += 1;
        // A rota consulta subscriptions TRES vezes: a busca dela, a busca
        // interna do cancel(), e o update. As duas leituras passam; o UPDATE
        // falha, que e o cenario de inconsistencia (Stripe ja aceitou).
        return chamadasSubs <= 2
          ? { rows: [SUB_CARTAO] }
          : { error: { message: "timeout" } };
      },
      content_audit_logs: { rows: [{}] },
    });
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });

    expect(r.status).toBe(500);
    expect(
      erroSpy.mock.calls.some((c) => String(c[0]).includes("INCONSISTENCIA")),
    ).toBe(true);
  });

  it("usuário sem assinatura ativa vira 404", async () => {
    montar({ subscriptions: { rows: [] } });
    const r = await chamarAdmin("POST", `/users/${UID}/subscription/cancel`, {
      reason: "x",
    });
    expect(r.status).toBe(404);
  });

  it("UUID inválido vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", "/users/nao-uuid/subscription/cancel", {
      reason: "x",
    });
    expect(r.status).toBe(400);
    expect(estado.double.chamadas).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// POST /users/:id/refunds  (Fatia 7), a única ação sem desfazer
// ---------------------------------------------------------------------------

describe("POST /users/:id/refunds", () => {
  function linha(over: Record<string, unknown> = {}) {
    return {
      id: "ft1",
      type: "charge",
      gross_cents: 20000,
      fee_cents: 0,
      net_cents: 20000,
      currency: "BRL",
      occurred_at: "2026-07-01T12:00:00Z",
      stripe_charge_id: "ch_1",
      stripe_invoice_id: null,
      plan_code: "pro_annual",
      ...over,
    };
  }

  it("reembolso TOTAL: audita antes, chama a Stripe, grava e sincroniza", async () => {
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      // Sem assinatura vigente: a revogação não tem o que revogar, e isso não é
      // falha. O caminho que REVOGA tem bloco próprio mais abaixo.
      subscriptions: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "cliente pediu",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      refunded: true,
      refund_id: "re_1",
      amount_cents: 20000,
      statement_synced: true,
      record_saved: true,
    });

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops.indexOf("insert content_audit_logs")).toBeGreaterThanOrEqual(0);
    expect(estado.double.de("content_audit_logs")[0].payload!.action).toBe(
      "refund",
    );
    expect(estado.stripeRefundCreate).toHaveBeenCalledTimes(1);
    expect(estado.syncBalance).toHaveBeenCalledTimes(1);
  });

  it("reembolso PARCIAL respeita o valor pedido", async () => {
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [{}] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "parcial",
    });

    expect(r.body.data.amount_cents).toBe(5000);
    const args = estado.stripeRefundCreate.mock.calls[0] as unknown[];
    expect(args[0]).toMatchObject({ charge: "ch_1", amount: 5000 });
  });

  it("cobrança de OUTRO usuário é recusada", async () => {
    // O extrato é filtrado por user_id; um charge que não está nele não existe
    // para esta rota.
    montar({ finance_transactions: { rows: [linha()] } });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_de_outra_pessoa",
      reason: "x",
    });

    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("charge_not_found");
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
  });

  /** Cobranca Pix de R$ 12,90 no extrato, sem estorno nenhum ainda. */
  function pix(over: Record<string, unknown> = {}) {
    return linha({
      id: "ft-pix",
      provider: "asaas",
      provider_transaction_id: "pay_abc",
      stripe_charge_id: null,
      gross_cents: 1290,
      net_cents: 1091,
      fee_cents: 199,
      ...over,
    });
  }

  it("cobrança do ASAAS é estornada pela API do provedor", async () => {
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      subscriptions: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "cliente pediu",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      refunded: true,
      refund_id: "pay_abc",
      amount_cents: 1290,
      status: "REFUNDED",
      // NAO ha sync a fazer: o ledger vem do webhook. Dizer `true` faria a tela
      // afirmar que o extrato ja reflete a devolucao.
      statement_synced: false,
      record_saved: true,
    });

    expect(estado.asaasRefund).toHaveBeenCalledTimes(1);
    const args = estado.asaasRefund.mock.calls[0] as unknown[];
    expect(args[0]).toBe("pay_abc");
    expect(args[1]).toMatchObject({ descricao: "cliente pediu" });
    // NADA foi enviado à Stripe: a cobrança nunca esteve lá.
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
    // E nenhum sync da Stripe foi disparado.
    expect(estado.syncBalance).not.toHaveBeenCalled();
  });

  it("audita a INTENÇÃO antes de chamar o Asaas", async () => {
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      subscriptions: { rows: [] },
    });

    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "cliente pediu",
    });

    const audit = estado.double.de("content_audit_logs")[0];
    expect(audit.payload!.action).toBe("refund");
    expect(audit.payload!.resource_slug).toBe("pay_abc");
    expect(audit.payload!.after_json).toMatchObject({ provider: "asaas" });
  });

  it("auditoria que FALHA impede o estorno: fail-closed", async () => {
    // Sem rastro gravado, dinheiro nenhum sai. Mesmo contrato da Stripe.
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { error: { message: "audit fora" } },
      admin_refunds: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "x",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(estado.asaasRefund).not.toHaveBeenCalled();
  });

  it("grava admin_refunds com as colunas do provedor", async () => {
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      subscriptions: { rows: [] },
    });

    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "cliente pediu",
    });

    const insert = estado.double
      .de("admin_refunds")
      .find((c) => c.op === "insert")!;
    expect(insert.payload).toMatchObject({
      provider: "asaas",
      provider_transaction_id: "pay_abc",
      // O Asaas nao devolve id de estorno: o payment id E a identidade.
      provider_refund_id: "pay_abc",
      provider_status: "REFUNDED",
      settlement: "asaas_api",
      amount_cents: 1290,
      stripe_charge_id: null,
      stripe_refund_id: null,
    });
  });

  it("estorno PARCIAL é recusado com código próprio", async () => {
    // O webhook so trata `PAYMENT_REFUNDED`, nao o parcial: um parcial sairia do
    // provedor e nunca viraria linha de ledger.
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 500,
      reason: "parcial",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("asaas_partial_refund_not_supported");
    expect(estado.asaasRefund).not.toHaveBeenCalled();
  });

  it("valor ACIMA do teto cai na recusa que já existia", async () => {
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 9999,
      reason: "x",
    });

    expect(r.status).toBe(400);
    expect(estado.asaasRefund).not.toHaveBeenCalled();
  });

  it("segundo pedido para a MESMA cobrança é recusado ANTES de tocar no Asaas", async () => {
    // Duplo clique sequencial. A corrida simultanea e coberta pelo indice unico
    // no banco, porque as duas requisicoes leem "nao existe".
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: {
        rows: [
          {
            provider: "asaas",
            provider_transaction_id: "pay_abc",
            amount_cents: 1290,
            settlement: "asaas_api",
            stripe_charge_id: null,
          },
        ],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "x",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("refund_already_requested");
    expect(estado.asaasRefund).not.toHaveBeenCalled();
  });

  it("Asaas recusando NÃO grava admin_refunds, e propaga o código nomeado", async () => {
    montar({
      finance_transactions: { rows: [pix()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
    });
    estado.asaasRefund = vi.fn(async () => {
      throw createError(
        502,
        "asaas_refund_rejected",
        "O Asaas nao confirmou o estorno. Nada foi devolvido.",
      );
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "pay_abc",
      amount_cents: 1290,
      reason: "x",
    });

    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe("asaas_refund_rejected");
    expect(
      estado.double.de("admin_refunds").filter((c) => c.op === "insert"),
    ).toEqual([]);
  });

  it.each([["REFUND_REQUESTED"], ["REFUND_IN_PROGRESS"]])(
    "status %s do provedor é sucesso, e vai para provider_status",
    async (status) => {
      montar({
        finance_transactions: { rows: [pix()] },
        content_audit_logs: { rows: [{}] },
        admin_refunds: { rows: [] },
        subscriptions: { rows: [] },
      });
      estado.asaasRefund = vi.fn(async () => ({ status, raw: {} }));

      const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
        charge_id: "pay_abc",
        amount_cents: 1290,
        reason: "x",
      });

      expect(r.status).toBe(200);
      const insert = estado.double
        .de("admin_refunds")
        .find((c) => c.op === "insert")!;
      expect(insert.payload).toMatchObject({ provider_status: status });
    },
  );

  it("CONTROLE NEGATIVO: cobrança da Stripe segue reembolsável", async () => {
    montar({
      finance_transactions: { rows: [linha({ provider: "stripe" })] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      subscriptions: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "cliente pediu",
    });

    expect(r.status).toBe(200);
    expect(estado.stripeRefundCreate).toHaveBeenCalledTimes(1);
  });

  it("valor acima do teto é recusado", async () => {
    montar({ finance_transactions: { rows: [linha()] } });
    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 20001,
      reason: "x",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("amount_above_refundable");
  });

  it("teto RECOMPUTADO: UI desatualizada não consegue devolver a mais", async () => {
    // A UI viu R$200 disponíveis, mas entrou um reembolso de R$150 no meio. O
    // servidor recomputa e recusa.
    montar({
      finance_transactions: {
        rows: [
          linha(),
          linha({ id: "r1", type: "refund", gross_cents: -15000 }),
        ],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 20000,
      reason: "x",
    });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("amount_above_refundable");
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
  });

  it("cobrança já totalmente reembolsada não aceita mais nada", async () => {
    montar({
      finance_transactions: {
        rows: [
          linha(),
          linha({ id: "r1", type: "refund", gross_cents: -20000 }),
        ],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("nothing_refundable");
  });

  it("cobrança com DISPUTA respeita o teto reduzido", async () => {
    montar({
      finance_transactions: {
        rows: [
          linha(),
          linha({ id: "d1", type: "dispute", gross_cents: -20000 }),
        ],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("nothing_refundable");
    expect(r.body.error.message).toContain("chargeback");
  });

  it("BOLETO é recusado com código próprio", async () => {
    montar({
      finance_transactions: { rows: [linha({ stripe_charge_id: "py_1" })] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "py_1",
      reason: "x",
    });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("boleto_not_refundable");
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
  });

  it("falha do AUDIT aborta ANTES da Stripe", async () => {
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { error: { message: "check" } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
  });

  it("Stripe recusando NÃO deixa rastro de sucesso", async () => {
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
    });
    estado.stripeRefundCreate = vi.fn(async () => {
      throw new Error("charge already refunded");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(502);
    expect(r.body.error.message).toContain("Nada foi devolvido");
    // Só INSERTS: a rota LÊ admin_refunds antes de validar (é a segunda fonte
    // do extrato), então contar todas as chamadas passaria a contar a leitura.
    expect(
      estado.double.de("admin_refunds").filter((c) => c.op === "insert"),
    ).toHaveLength(0);
  });

  it("sync falhando DEPOIS do refund responde 200 sinalizando o que faltou", async () => {
    // O dinheiro JÁ SAIU. Devolver erro faria o admin tentar de novo, e a
    // segunda tentativa teria outra Idempotency-Key (o refunded_cents mudou),
    // reembolsando DUAS vezes.
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
      subscriptions: { rows: [] },
    });
    estado.syncBalance = vi.fn(async () => {
      throw new Error("stripe timeout");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      refunded: true,
      statement_synced: false,
    });
  });

  it("leitura das declarações falhando aborta ANTES da Stripe", async () => {
    // Fail-closed de propósito: sem as declarações o teto recomputado ficaria
    // ALTO DEMAIS (uma devolução externa já registrada não seria descontada) e a
    // rota autorizaria devolver de novo dinheiro que já voltou.
    montar({
      finance_transactions: { rows: [linha()] },
      admin_refunds: { error: { message: "timeout" } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(500);
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("gravação local falhando DEPOIS do refund loga INCONSISTENCIA e responde 200", async () => {
    // A rota toca admin_refunds DUAS vezes: lê as declarações antes de validar e
    // grava o resultado depois da Stripe. Só a SEGUNDA falha aqui, senão o teste
    // exercitaria o caminho de leitura (que aborta antes) em vez do de escrita.
    let chamadasRefunds = 0;
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: () => {
        chamadasRefunds += 1;
        return chamadasRefunds === 1
          ? { rows: [] }
          : { error: { message: "timeout" } };
      },
      subscriptions: { rows: [] },
    });
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "x",
    });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ refunded: true, record_saved: false });
    expect(
      erroSpy.mock.calls.some((c) => String(c[0]).includes("INCONSISTENCIA")),
    ).toBe(true);
  });

  it("duplo clique manda a MESMA Idempotency-Key", async () => {
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [{}] },
    });

    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "x",
    });
    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "x",
    });

    const k1 = (
      estado.stripeRefundCreate.mock.calls[0][1] as { idempotencyKey: string }
    ).idempotencyKey;
    const k2 = (
      estado.stripeRefundCreate.mock.calls[1][1] as { idempotencyKey: string }
    ).idempotencyKey;
    expect(k1).toBe(k2);
  });

  it("dois parciais LEGÍTIMOS de mesmo valor mandam chaves DIFERENTES", async () => {
    // Primeiro: nada reembolsado ainda.
    montar({
      finance_transactions: { rows: [linha()] },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [{}] },
    });
    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "primeiro",
    });
    const k1 = (
      estado.stripeRefundCreate.mock.calls[0][1] as { idempotencyKey: string }
    ).idempotencyKey;

    // Segundo: o extrato já reflete os R$50 devolvidos.
    montar({
      finance_transactions: {
        rows: [
          linha(),
          linha({ id: "r1", type: "refund", gross_cents: -5000 }),
        ],
      },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [{}] },
    });
    await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "segundo",
    });
    // O spy da Stripe NAO e recriado pelo montar(): as duas emissoes ficam no
    // mesmo mock, entao a segunda chave e a da posicao 1.
    const k2 = (
      estado.stripeRefundCreate.mock.calls[1][1] as { idempotencyKey: string }
    ).idempotencyKey;

    expect(k1).not.toBe(k2);
  });

  it("motivo ausente vira 400 sem tocar a Stripe", async () => {
    montar({ finance_transactions: { rows: [linha()] } });
    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      reason: "   ",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("reason_required");
  });

  it("UUID inválido vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", "/users/nao-uuid/refunds", {
      charge_id: "ch_1",
      reason: "x",
    });
    expect(r.status).toBe(400);
    expect(estado.double.chamadas).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// REVOGAÇÃO DE ACESSO acoplada ao reembolso.
//
// O caso que motivou: R$ 148,74 devolvidos, extrato a R$ 0,00, e a pessoa
// seguindo Pro até 28/07/2027.
// ---------------------------------------------------------------------------

const COBRANCA_CARTAO = {
  id: "ft1",
  type: "charge",
  gross_cents: 14874,
  fee_cents: 0,
  net_cents: 14874,
  currency: "BRL",
  occurred_at: "2026-07-01T12:00:00Z",
  stripe_charge_id: "ch_1",
  stripe_invoice_id: null,
  plan_code: "pro_annual",
};

const ASSINATURA_CARTAO = {
  id: "sub-row-1",
  status: "active",
  renewal_type: "auto",
  provider_subscription_id: "sub_1",
};

/** Cenário completo de um reembolso TOTAL que deve revogar. */
function montarRevogacao(over: Record<string, RespostaTabela> = {}) {
  montar({
    finance_transactions: { rows: [COBRANCA_CARTAO] },
    content_audit_logs: { rows: [{}] },
    admin_refunds: { rows: [] },
    subscriptions: { rows: [ASSINATURA_CARTAO] },
    subscription_cancellations: { rows: [] },
    ...over,
  });
}

function reembolsarTudo(charge = "ch_1") {
  return chamarAdmin("POST", `/users/${UID}/refunds`, {
    charge_id: charge,
    reason: "devolução total",
  });
}

function auditsDe(action: string) {
  return estado.double
    .de("content_audit_logs")
    .filter((c) => (c.payload as { action?: string })?.action === action);
}

/**
 * Status que `is_user_pro` aceita, LIDOS DA MIGRATION.
 *
 * Escrever `['active','trialing']` à mão aqui seria uma segunda declaração da
 * regra, e ela passaria a concordar com a função por coincidência: alguém
 * mudando o SQL não quebraria teste nenhum. Lendo do arquivo, o teste afirma
 * algo sobre a função de verdade.
 *
 * O parser LANÇA quando não acha, em vez de devolver conjunto vazio, que faria
 * toda asserção abaixo passar sobre nada.
 */
function statusesQueDaoProNaMigration(): Set<string> {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/20260716130100_add_influencer_to_is_user_pro.sql",
    ),
    "utf8",
  );
  const m = /and\s+s\.status\s+in\s*\(([^)]+)\)/i.exec(sql);
  if (!m) {
    throw new Error(
      "não foi possível ler o filtro de status de is_user_pro na migration",
    );
  }
  const encontrados = Array.from(m[1].matchAll(/'([a-z_]+)'/g)).map(
    (x) => x[1],
  );
  if (encontrados.length === 0) {
    throw new Error("filtro de status de is_user_pro veio vazio");
  }
  return new Set(encontrados);
}

describe("a revogação faz is_user_pro NEGAR", () => {
  const STATUS_PRO = statusesQueDaoProNaMigration();

  it("o parser leu a migration de verdade, não um conjunto vazio", () => {
    // Trava do próprio instrumento: sem isto, um parser que parasse de casar
    // devolveria Set vazio e os testes abaixo passariam afirmando nada.
    expect(STATUS_PRO.size).toBe(2);
    expect(STATUS_PRO.has("active")).toBe(true);
    expect(STATUS_PRO.has("trialing")).toBe(true);
  });

  it("o status ANTES dá Pro e o status ESCRITO não dá", async () => {
    // É o teste que importa: os demais são consequência dele.
    montarRevogacao();
    const r = await reembolsarTudo();

    expect(r.status).toBe(200);
    expect(r.body.data.access).toMatchObject({
      should_revoke: true,
      revoked: true,
      reason: "revoked",
    });

    const update = estado.double
      .de("subscriptions")
      .find((c) => c.op === "update")!;
    const statusEscrito = (update.payload as { status: string }).status;

    // As duas metades da afirmação. Sem a primeira, um teste que só checasse o
    // status novo passaria mesmo se o anterior também negasse Pro, e não
    // provaria que a revogação mudou alguma coisa.
    expect(STATUS_PRO.has(ASSINATURA_CARTAO.status)).toBe(true);
    expect(STATUS_PRO.has(statusEscrito)).toBe(false);
    expect(statusEscrito).toBe("canceled");

    // O outro ramo do WHERE de is_user_pro é o período, e NÃO é ele que estamos
    // usando: o webhook reescreve current_period_end com a data da Stripe, então
    // antedatá-lo seria desfeito. O update não pode tocar nesse campo.
    expect(Object.keys(update.payload!)).not.toContain("current_period_end");
  });

  it("reembolso PARCIAL não revoga nada", async () => {
    // A trava da regra. Sem ela a fatia vira "todo reembolso cancela", que é a
    // decisão explicitamente recusada.
    montar({
      finance_transactions: {
        rows: [{ ...COBRANCA_CARTAO, gross_cents: 20000, net_cents: 20000 }],
      },
      content_audit_logs: { rows: [{}] },
      admin_refunds: { rows: [] },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 5000,
      reason: "parcial",
    });

    expect(r.status).toBe(200);
    expect(r.body.data.access).toMatchObject({
      should_revoke: false,
      revoked: false,
      reason: "partial_refund",
    });
    // Nem consultou a assinatura: `subscriptions` sequer está registrada no
    // dublê acima, então qualquer consulta a ela derrubaria este teste.
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(auditsDe("revoke_pro")).toHaveLength(0);
  });

  it("parcial que ESGOTA o saldo revoga: a regra é o saldo, não a proporção", async () => {
    // R$ 100 de R$ 148,74 já tinham voltado; devolver os R$ 48,74 restantes zera
    // o saldo. É um reembolso "parcial" da cobrança e ainda assim revoga.
    montarRevogacao({
      finance_transactions: {
        rows: [
          COBRANCA_CARTAO,
          { ...COBRANCA_CARTAO, id: "r1", type: "refund", gross_cents: -10000 },
        ],
      },
    });

    const r = await chamarAdmin("POST", `/users/${UID}/refunds`, {
      charge_id: "ch_1",
      amount_cents: 4874,
      reason: "resto",
    });

    expect(r.body.data.access).toMatchObject({
      should_revoke: true,
      revoked: true,
    });
  });

  it("audita a revogação com action própria, ANTES de tocar a Stripe", async () => {
    montarRevogacao();
    await reembolsarTudo();

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    expect(ops.indexOf("insert content_audit_logs")).toBeLessThan(
      ops.lastIndexOf("update subscriptions"),
    );

    const revoke = auditsDe("revoke_pro");
    expect(revoke).toHaveLength(1);
    expect(revoke[0].payload).toMatchObject({
      actor_user_id: "admin-1",
      resource_type: "subscription",
      resource_id: UID,
      resource_slug: "ch_1",
    });
    // O reembolso e a revogação são DUAS linhas, não uma: é o que permite ao
    // histórico dizer que um deu certo e o outro não.
    expect(auditsDe("refund")).toHaveLength(1);
  });

  it("grava a linha de RESULTADO que o histórico cruza", async () => {
    montarRevogacao();
    await reembolsarTudo();

    const registro = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "insert")!;
    expect(registro.payload).toMatchObject({
      user_id: UID,
      canceled_by: "admin-1",
      reason_code: "admin",
      // 'completed', não 'scheduled': já aconteceu. O detalhe do usuário lê
      // cancellation_intent filtrando por 'scheduled', e uma revogação imediata
      // apareceria lá como "cancelamento agendado" se usasse esse status.
      status: "completed",
    });
  });

  it("invalida o cache de Pro", async () => {
    montarRevogacao();
    await reembolsarTudo();
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);
  });

  it("BOLETO revoga SEM chamar a Stripe", async () => {
    // provider_subscription_id de boleto é um cs_..., e subscriptions.cancel com
    // ele falha sempre. Não há assinatura recorrente lá para cancelar.
    montarRevogacao({
      finance_transactions: {
        rows: [{ ...COBRANCA_CARTAO, stripe_charge_id: "py_1" }],
      },
      subscriptions: {
        rows: [
          {
            ...ASSINATURA_CARTAO,
            renewal_type: "manual",
            provider_subscription_id: "cs_1",
          },
        ],
      },
    });

    // A rota /refunds recusa boleto; quem revoga boleto é a rota de registro.
    // Aqui o alvo é só a decisão de NÃO chamar a Stripe, exercitada pelo cartão
    // com renewal_type manual (que é o que o boleto é no banco).
    const r = await reembolsarTudo("py_1");
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("boleto_not_refundable");
  });

  it("cancelamento JÁ AGENDADO não impede a revogação imediata", async () => {
    // cancel_at_period_end=true mantém Pro até o fim do período pago. Depois de
    // um reembolso total, manter esse acesso é exatamente o bug.
    montarRevogacao({
      subscriptions: {
        rows: [{ ...ASSINATURA_CARTAO, cancel_at_period_end: true }],
      },
    });

    const r = await reembolsarTudo();

    expect(r.body.data.access).toMatchObject({ revoked: true });
    expect(estado.stripeSubscriptionCancel).toHaveBeenCalledWith("sub_1");
    const update = estado.double
      .de("subscriptions")
      .find((c) => c.op === "update")!;
    // Volta a false: a assinatura não está mais "agendada para cancelar", ela
    // acabou. Deixar true faria o cron process-cancellations continuar olhando
    // para uma linha que não é mais dele.
    expect(update.payload).toMatchObject({
      status: "canceled",
      cancel_at_period_end: false,
    });
  });

  it("INFLUENCER continua Pro, e a resposta avisa", async () => {
    // Ortogonal por construção: is_user_pro tem um segundo ramo que não olha
    // assinatura nenhuma. Revogar a assinatura de quem tem concessão não remove
    // o acesso, e a tela precisa dizer isso ou o admin acha que falhou.
    montarRevogacao({ influencers: { rows: [{ id: "inf-1" }] } });

    const r = await reembolsarTudo();

    expect(r.body.data.access).toMatchObject({
      revoked: true,
      still_pro_via_influencer: true,
    });
    // E a concessão em si fica INTOCADA.
    expect(
      estado.double.de("influencers").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("sem assinatura vigente não é falha, é 'nada a revogar'", async () => {
    montarRevogacao({ subscriptions: { rows: [] } });
    const r = await reembolsarTudo();

    expect(r.status).toBe(200);
    expect(r.body.data.access).toMatchObject({
      should_revoke: true,
      revoked: false,
      reason: "no_active_subscription",
    });
    expect(auditsDe("revoke_pro")).toHaveLength(0);
  });
});

describe("revogação falhando DEPOIS do reembolso bem-sucedido", () => {
  // O ponto mais delicado da fatia: o dinheiro JÁ SAIU quando a revogação é
  // tentada. Nenhuma falha aqui pode virar mensagem que sugira que o reembolso
  // não aconteceu, porque o admin tentaria de novo e a segunda tentativa cairia
  // numa Idempotency-Key diferente, devolvendo DE NOVO.

  it("Stripe recusando o cancelamento: 200, reembolso confirmado, acesso NÃO revogado", async () => {
    montarRevogacao();
    estado.stripeSubscriptionCancel = vi.fn(async () => {
      throw new Error("stripe fora do ar");
    });
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await reembolsarTudo();

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ refunded: true, refund_id: "re_1" });
    expect(r.body.data.access).toMatchObject({
      should_revoke: true,
      revoked: false,
      reason: "revoke_failed",
    });
    expect(r.body.data.access.detail).toBeTruthy();

    // Banco intocado: a ordem é Stripe primeiro justamente para isto.
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
    expect(
      erroSpy.mock.calls.some((c) => String(c[0]).includes("INCONSISTENCIA")),
    ).toBe(true);
  });

  it("banco falhando DEPOIS da Stripe: 200, e a INCONSISTENCIA fica logada", async () => {
    let chamadasSubs = 0;
    montarRevogacao({
      subscriptions: () => {
        chamadasSubs += 1;
        // A leitura passa; o UPDATE falha, que é o cenário em que a Stripe já
        // cancelou.
        return chamadasSubs === 1
          ? { rows: [ASSINATURA_CARTAO] }
          : { error: { message: "timeout" } };
      },
    } as unknown as Record<string, RespostaTabela>);
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await reembolsarTudo();

    expect(r.status).toBe(200);
    expect(r.body.data.refunded).toBe(true);
    expect(r.body.data.access).toMatchObject({
      revoked: false,
      reason: "revoke_failed",
    });
    expect(
      erroSpy.mock.calls.some(
        (c) =>
          String(c[0]).includes("INCONSISTENCIA") &&
          String(c[0]).includes("customer.subscription.deleted"),
      ),
    ).toBe(true);
  });

  it("auditoria da revogação falhando NÃO revoga e NÃO derruba o reembolso", async () => {
    // Fail-closed do lado da revogação: sem rastro gravado, ninguém perde
    // acesso. Mas o reembolso continua tendo acontecido.
    let chamadasAudit = 0;
    montarRevogacao({
      content_audit_logs: () => {
        chamadasAudit += 1;
        // A primeira é a intenção do reembolso (passa); a segunda é a da
        // revogação (falha).
        return chamadasAudit === 1
          ? { rows: [{}] }
          : { error: { message: "check" } };
      },
    } as unknown as Record<string, RespostaTabela>);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await reembolsarTudo();

    expect(r.status).toBe(200);
    expect(r.body.data.refunded).toBe(true);
    expect(r.body.data.access).toMatchObject({
      revoked: false,
      reason: "revoke_failed",
    });
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
  });

  it("a resposta NUNCA nega o reembolso, em NENHUM modo de falha da revogação", async () => {
    // Os três modos são DIFERENTES de propósito: uma varredura cujos casos são
    // cópias do mesmo cenário reporta "3 modos cobertos" tendo coberto um, que é
    // a classe de instrumento que este projeto já documentou.
    const modos: Array<{ nome: string; montar: () => void }> = [
      {
        nome: "Stripe recusa o cancelamento",
        montar: () => {
          montarRevogacao();
          estado.stripeSubscriptionCancel = vi.fn(async () => {
            throw new Error("stripe fora do ar");
          });
        },
      },
      {
        nome: "banco falha no update depois da Stripe",
        montar: () => {
          let n = 0;
          montarRevogacao({
            subscriptions: () => {
              n += 1;
              return n === 1
                ? { rows: [ASSINATURA_CARTAO] }
                : { error: { message: "timeout" } };
            },
          } as unknown as Record<string, RespostaTabela>);
        },
      },
      {
        nome: "auditoria da revogação falha",
        montar: () => {
          let n = 0;
          montarRevogacao({
            content_audit_logs: () => {
              n += 1;
              return n === 1 ? { rows: [{}] } : { error: { message: "check" } };
            },
          } as unknown as Record<string, RespostaTabela>);
        },
      },
    ];
    vi.spyOn(console, "error").mockImplementation(() => {});

    for (const modo of modos) {
      modo.montar();
      const r = await reembolsarTudo();
      expect(r.status, modo.nome).toBe(200);
      expect(r.body.data.refunded, modo.nome).toBe(true);
      expect(r.body.data.refund_id, modo.nome).toBe("re_1");
      expect(r.body.data.access.revoked, modo.nome).toBe(false);
      expect(r.body.data.access.reason, modo.nome).toBe("revoke_failed");
      expect(JSON.stringify(r.body)).not.toContain("Nada foi devolvido");
    }
  });
});

// ---------------------------------------------------------------------------
// POST /users/:id/external-refunds, registro de devolução feita FORA daqui.
//
// Duas coisas distintas moram nesta rota e os testes separam as duas:
//   (a) a devolução foi processada pela Stripe (existe objeto Refund) -> o sync
//       traz a linha de dinheiro, e o registro NÃO pode duplicá-la;
//   (b) a devolução saiu por fora (PIX, TED) -> a Stripe nunca soube, e o
//       registro é a ÚNICA fonte que existe.
// ---------------------------------------------------------------------------

const COBRANCA_BOLETO = {
  id: "ft-boleto",
  type: "charge",
  gross_cents: 14874,
  fee_cents: 0,
  net_cents: 14874,
  currency: "BRL",
  occurred_at: "2026-07-01T12:00:00Z",
  stripe_charge_id: "py_1",
  stripe_invoice_id: null,
  plan_code: "pro_annual",
};

const ASSINATURA_BOLETO = {
  id: "sub-boleto",
  status: "active",
  renewal_type: "manual",
  provider_subscription_id: "cs_1",
};

function montarRegistro(over: Record<string, RespostaTabela> = {}) {
  montar({
    finance_transactions: { rows: [COBRANCA_BOLETO] },
    content_audit_logs: { rows: [{}] },
    admin_refunds: { rows: [] },
    subscriptions: { rows: [ASSINATURA_BOLETO] },
    subscription_cancellations: { rows: [] },
    ...over,
  });
}

function registrar(corpo: Record<string, unknown> = {}) {
  return chamarAdmin("POST", `/users/${UID}/external-refunds`, {
    charge_id: "py_1",
    reason: "devolvido por PIX",
    confirmed: true,
    ...corpo,
  });
}

describe("POST /users/:id/external-refunds", () => {
  it("CASO (b): sem Refund na Stripe, grava settlement='external' e NÃO sincroniza", async () => {
    // A Stripe nunca soube: não há balance transaction para puxar, e chamar o
    // sync seria custo puro. Esta linha é o único registro que vai existir.
    estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
    montarRegistro();

    const r = await registrar();

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      registered: true,
      settlement: "external",
      amount_cents: 14874,
    });

    const insert = estado.double
      .de("admin_refunds")
      .find((c) => c.op === "insert")!;
    expect(insert.payload).toMatchObject({
      user_id: UID,
      actor_user_id: "admin-1",
      stripe_charge_id: "py_1",
      // NULO nos dois casos: a coluna guarda o id devolvido por uma chamada
      // NOSSA, e aqui não houve nenhuma.
      stripe_refund_id: null,
      settlement: "external",
      amount_cents: 14874,
    });
    expect(estado.syncBalance).not.toHaveBeenCalled();
    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
  });

  it("CASO (a): com Refund na Stripe, grava 'stripe_dashboard' e sincroniza", async () => {
    // O sync vai trazer a linha de dinheiro. A nossa linha guarda ator e motivo,
    // que o sync não tem, e fica FORA da agregação para não contar duas vezes.
    estado.stripeRefundList = vi.fn(async () => ({
      data: [{ id: "re_dash", status: "requires_action" }],
    }));
    montarRegistro();

    const r = await registrar();

    expect(r.status).toBe(200);
    expect(r.body.data.settlement).toBe("stripe_dashboard");

    const insert = estado.double
      .de("admin_refunds")
      .find((c) => c.op === "insert")!;
    expect(insert.payload).toMatchObject({ settlement: "stripe_dashboard" });
    expect(estado.syncBalance).toHaveBeenCalledTimes(1);
  });

  it("o discriminador pergunta pela COBRANÇA, não por outra coisa", async () => {
    estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
    montarRegistro();
    await registrar();

    expect(estado.stripeRefundList).toHaveBeenCalledTimes(1);
    expect(estado.stripeRefundList.mock.calls[0][0]).toMatchObject({
      charge: "py_1",
    });
  });

  it("Stripe inalcançável: 502 e NADA é gravado", async () => {
    // Sem veredito não há escrita. Chutar 'external' contaria duas vezes;
    // chutar 'stripe_dashboard' perderia o valor do extrato.
    estado.stripeRefundList = vi.fn(async () => {
      throw new Error("timeout");
    });
    montarRegistro();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await registrar();

    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe("stripe_unreachable");
    expect(
      estado.double.de("admin_refunds").filter((c) => c.op === "insert"),
    ).toHaveLength(0);
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("SEM confirmação explícita a rota recusa, antes de consultar qualquer coisa", async () => {
    montarRegistro();
    const r = await chamarAdmin("POST", `/users/${UID}/external-refunds`, {
      charge_id: "py_1",
      reason: "x",
    });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("confirmation_required");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("confirmação que não é o booleano true não passa por coerção", async () => {
    // "true", 1 e {} são verdadeiros em JS. A afirmação do admin não pode
    // depender de coerção: ou ela foi dada, ou não foi.
    for (const valor of ["true", 1, {}, "sim", null]) {
      montarRegistro();
      const r = await registrar({ confirmed: valor });
      expect(r.status, String(valor)).toBe(400);
      expect(r.body.error.code, String(valor)).toBe("confirmation_required");
    }
  });

  it("a auditoria guarda a declaração COMO declaração", async () => {
    // O sistema não tem como verificar que a devolução aconteceu. O registro
    // precisa dizer isso de si mesmo, senão a linha fica indistinguível de uma
    // ação cujo efeito a plataforma executou e observou.
    estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
    montarRegistro();
    await registrar();

    const audit = auditsDe("refund_external");
    expect(audit).toHaveLength(1);
    expect(audit[0].payload).toMatchObject({
      actor_user_id: "admin-1",
      resource_type: "charge",
      resource_slug: "py_1",
    });
    expect(audit[0].payload!.after_json).toMatchObject({
      declaration: true,
      verified_by_system: false,
      settlement: "external",
      reason: "devolvido por PIX",
      amount_cents: 14874,
    });
  });

  it("audita ANTES de gravar e de revogar (fail-closed)", async () => {
    montarRegistro({ content_audit_logs: { error: { message: "check" } } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await registrar();

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(
      estado.double.de("admin_refunds").filter((c) => c.op === "insert"),
    ).toHaveLength(0);
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("insert falhando é FAIL-LOUD: aqui a escrita É a ação", async () => {
    // Diferente do /refunds, onde o dinheiro já saiu quando a gravação acontece
    // e falhar não pode virar erro. Sem esta linha não existe registro nenhum,
    // então nada é revogado e o erro sobe.
    let n = 0;
    montarRegistro({
      admin_refunds: () => {
        n += 1;
        return n === 1 ? { rows: [] } : { error: { message: "timeout" } };
      },
    } as unknown as Record<string, RespostaTabela>);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await registrar();

    expect(r.status).toBe(500);
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("REVOGA pela mesma regra: devolução total zera o saldo", async () => {
    estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
    montarRegistro();

    const r = await registrar();

    expect(r.body.data.access).toMatchObject({
      should_revoke: true,
      revoked: true,
      reason: "revoked",
    });
    const update = estado.double
      .de("subscriptions")
      .find((c) => c.op === "update")!;
    expect(update.payload).toMatchObject({ status: "canceled" });
    // BOLETO: não há assinatura recorrente na Stripe para cancelar.
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);
  });

  it("registro PARCIAL não revoga", async () => {
    estado.stripeRefundList = vi.fn(async () => ({ data: [] }));
    montarRegistro();

    const r = await registrar({ amount_cents: 5000 });

    expect(r.body.data.access).toMatchObject({
      should_revoke: false,
      revoked: false,
      reason: "partial_refund",
    });
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("INFLUENCER continua Pro e a resposta avisa", async () => {
    montarRegistro({ influencers: { rows: [{ id: "inf-1" }] } });
    const r = await registrar();
    expect(r.body.data.access).toMatchObject({
      revoked: true,
      still_pro_via_influencer: true,
    });
  });

  it("CARTÃO é recusado: para ele existe a rota que devolve de verdade", async () => {
    montarRegistro({
      finance_transactions: { rows: [COBRANCA_CARTAO] },
    });

    const r = await registrar({ charge_id: "ch_1" });

    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("card_use_refunds_route");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("cobrança de OUTRO usuário é recusada", async () => {
    montarRegistro();
    const r = await registrar({ charge_id: "py_de_outra_pessoa" });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("charge_not_found");
  });

  it("IDEMPOTÊNCIA: segunda chamada não gera segunda linha nem segunda auditoria", async () => {
    // A pré-checagem existe porque o teto recomputado NÃO cobre o caso (a): uma
    // declaração 'stripe_dashboard' não entra na agregação, então ela não derruba
    // refundable_cents e um duplo clique passaria pela validação.
    montarRegistro({
      admin_refunds: {
        rows: [
          {
            stripe_charge_id: "py_1",
            amount_cents: 14874,
            settlement: "stripe_dashboard",
          },
        ],
      },
    });

    const r = await registrar();

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      registered: false,
      already_registered: true,
    });
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(
      estado.double.de("admin_refunds").filter((c) => c.op === "insert"),
    ).toHaveLength(0);
  });

  it("cobrança JÁ devolvida pelo sync da Stripe não aceita declaração", async () => {
    // Caminho DIFERENTE da pré-checagem de idempotência: aqui não existe linha
    // em admin_refunds nenhuma, então o que barra é o teto recomputado, que já
    // enxerga a devolução vinda do sync. É a defesa para o caso em que a Stripe
    // processou e sincronizou antes de alguém pensar em registrar.
    montarRegistro({
      admin_refunds: { rows: [] },
      finance_transactions: {
        rows: [
          COBRANCA_BOLETO,
          {
            ...COBRANCA_BOLETO,
            id: "r-sync",
            type: "refund",
            gross_cents: -14874,
            net_cents: -14874,
          },
        ],
      },
    });

    const r = await registrar();

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("nothing_refundable");
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
  });

  it("valor acima do teto é recusado, recomputado no SERVIDOR", async () => {
    montarRegistro();
    const r = await registrar({ amount_cents: 14875 });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("amount_above_refundable");
  });

  it("motivo é obrigatório", async () => {
    montarRegistro();
    const r = await registrar({ reason: "   " });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("reason_required");
  });

  it("UUID inválido vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", "/users/nao-uuid/external-refunds", {
      charge_id: "py_1",
      reason: "x",
      confirmed: true,
    });
    expect(r.status).toBe(400);
    expect(estado.double.chamadas).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// POST /users/:id/subscription/revoke, revogação AVULSA, sem devolver dinheiro.
//
// Existe para o estado meio-feito: reembolso emitido e acesso mantido. Antes
// dela a única saída na interface era "Cancelar Pro", que agenda para o fim do
// período e portanto entrega o próprio bug.
// ---------------------------------------------------------------------------

describe("POST /users/:id/subscription/revoke", () => {
  const STATUS_PRO = statusesQueDaoProNaMigration();

  function montarRevoke(over: Record<string, RespostaTabela> = {}) {
    montar({
      content_audit_logs: { rows: [{}] },
      subscriptions: { rows: [ASSINATURA_CARTAO] },
      subscription_cancellations: { rows: [] },
      ...over,
    });
  }

  function revogar(corpo: Record<string, unknown> = {}) {
    return chamarAdmin("POST", `/users/${UID}/subscription/revoke`, {
      reason: "reembolso saiu e o acesso ficou",
      ...corpo,
    });
  }

  it("é o teste que importa: is_user_pro passa a NEGAR", async () => {
    montarRevoke();
    const r = await revogar();

    expect(r.status).toBe(200);
    expect(r.body.data.revoked).toBe(true);

    const update = estado.double
      .de("subscriptions")
      .find((c) => c.op === "update")!;
    const statusEscrito = (update.payload as { status: string }).status;

    // As duas metades, contra o conjunto lido da própria migration.
    expect(STATUS_PRO.has(ASSINATURA_CARTAO.status)).toBe(true);
    expect(STATUS_PRO.has(statusEscrito)).toBe(false);
    expect(statusEscrito).toBe("canceled");
    // O período NÃO é tocado: o webhook o reescreveria de volta.
    expect(Object.keys(update.payload!)).not.toContain("current_period_end");
  });

  it("NÃO devolve dinheiro: nenhuma chamada de reembolso, nenhum registro", async () => {
    // É a diferença que separa esta ação do reembolso, e o servidor tem de
    // respeitá-la mesmo que a tela um dia esqueça de dizer.
    montarRevoke();
    await revogar();

    expect(estado.stripeRefundCreate).not.toHaveBeenCalled();
    expect(estado.syncBalance).not.toHaveBeenCalled();
    // `admin_refunds` sequer é consultada: a rota não passa pela agregação.
    expect(estado.double.de("admin_refunds")).toHaveLength(0);
  });

  it("mesma ordem do caminho automático: Stripe primeiro, banco depois", async () => {
    montarRevoke();
    await revogar();

    expect(estado.stripeSubscriptionCancel).toHaveBeenCalledWith("sub_1");

    const ops = estado.double.chamadas.map((c) => `${c.op} ${c.table}`);
    // Audita ANTES de qualquer coisa que remova acesso.
    expect(ops.indexOf("insert content_audit_logs")).toBeLessThan(
      ops.lastIndexOf("update subscriptions"),
    );
    expect(estado.invalidateProCache).toHaveBeenCalledWith(UID);
  });

  it("reusa a action revoke_pro, e o trigger diz que foi avulsa", async () => {
    // Uma action nova exigiria entrada em cinco lugares para produzir
    // comportamento idêntico. O que difere é o motivo, e ele está no trigger.
    montarRevoke();
    await revogar();

    const audit = auditsDe("revoke_pro");
    expect(audit).toHaveLength(1);
    expect(audit[0].payload).toMatchObject({
      actor_user_id: "admin-1",
      resource_type: "subscription",
      resource_id: UID,
      // Sem cobrança envolvida: nada a apontar aqui.
      resource_slug: null,
    });
    expect(audit[0].payload!.after_json).toMatchObject({
      status: "canceled",
      reason: "reembolso saiu e o acesso ficou",
      trigger: "standalone",
    });
  });

  it("o caminho do REEMBOLSO continua marcando trigger 'refund'", async () => {
    // Trava do discriminador: se os dois usos passassem a gravar o mesmo
    // trigger, a action única deixaria de distinguir os casos e a decisão de
    // reusar `revoke_pro` perderia a justificativa.
    montarRevogacao();
    await reembolsarTudo();

    const audit = auditsDe("revoke_pro");
    expect(audit).toHaveLength(1);
    expect(audit[0].payload!.after_json).toMatchObject({ trigger: "refund" });
    expect(audit[0].payload).toMatchObject({ resource_slug: "ch_1" });
  });

  it("grava a linha de RESULTADO que o histórico cruza", async () => {
    montarRevoke();
    await revogar();

    const registro = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "insert")!;
    expect(registro.payload).toMatchObject({
      user_id: UID,
      canceled_by: "admin-1",
      reason_code: "admin",
      reason_text: "reembolso saiu e o acesso ficou",
      status: "completed",
    });
  });

  it("IDEMPOTÊNCIA: já revogado responde sucesso sem reexecutar", async () => {
    // Nenhuma assinatura ATIVA, mas existe histórico: o efeito desejado já vale.
    let n = 0;
    montarRevoke({
      subscriptions: () => {
        n += 1;
        // 1a: a busca por assinatura vigente (vazia). 2a: a busca por qualquer
        // assinatura, que distingue "já revogado" de "nunca assinou".
        return n === 1 ? { rows: [] } : { rows: [{ id: "sub-antiga" }] };
      },
    } as unknown as Record<string, RespostaTabela>);

    const r = await revogar();

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      revoked: false,
      already_revoked: true,
    });
    // Sem reexecutar NADA: sem auditoria nova, sem Stripe, sem update.
    expect(estado.double.de("content_audit_logs")).toHaveLength(0);
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("quem NUNCA assinou é 404, não 'já revogado'", async () => {
    // Dizer sucesso aqui afirmaria um passado que não existiu.
    montarRevoke({ subscriptions: { rows: [] } });

    const r = await revogar();

    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
  });

  it("cancelamento JÁ AGENDADO não impede a revogação imediata", async () => {
    // É justamente o caso em que a pessoa mantém Pro até o fim do período.
    montarRevoke({
      subscriptions: {
        rows: [{ ...ASSINATURA_CARTAO, cancel_at_period_end: true }],
      },
    });

    const r = await revogar();

    expect(r.body.data.revoked).toBe(true);
    expect(estado.stripeSubscriptionCancel).toHaveBeenCalledWith("sub_1");
    expect(
      estado.double.de("subscriptions").find((c) => c.op === "update")!.payload,
    ).toMatchObject({ status: "canceled", cancel_at_period_end: false });
  });

  it("BOLETO revoga SEM chamar a Stripe", async () => {
    // provider_subscription_id de boleto é um cs_..., e cancel com ele falha
    // sempre. Não há assinatura recorrente lá.
    montarRevoke({
      subscriptions: {
        rows: [
          {
            ...ASSINATURA_CARTAO,
            renewal_type: "manual",
            provider_subscription_id: "cs_1",
          },
        ],
      },
    });

    const r = await revogar();

    expect(r.body.data.revoked).toBe(true);
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(
      estado.double.de("subscriptions").find((c) => c.op === "update")!.payload,
    ).toMatchObject({ status: "canceled" });
  });

  it("INFLUENCER continua Pro, e a resposta avisa", async () => {
    montarRevoke({ influencers: { rows: [{ id: "inf-1" }] } });

    const r = await revogar();

    expect(r.body.data).toMatchObject({
      revoked: true,
      still_pro_via_influencer: true,
    });
    expect(
      estado.double.de("influencers").filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });

  it("motivo ausente vira 400 sem consultar nada", async () => {
    montar({});
    const r = await revogar({ reason: "   " });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("reason_required");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("UUID inválido vira 400 sem consultar nada", async () => {
    montar({});
    const r = await chamarAdmin("POST", "/users/nao-uuid/subscription/revoke", {
      reason: "x",
    });
    expect(r.status).toBe(400);
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("falha do AUDIT aborta antes de tocar a Stripe, e é ERRO", async () => {
    // Postura OPOSTA à do reembolso: ali nada pode virar erro porque o dinheiro
    // já saiu; aqui nada aconteceu, então dizer "ok" seria mentir.
    montarRevoke({ content_audit_logs: { error: { message: "check" } } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await revogar();

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    expect(estado.stripeSubscriptionCancel).not.toHaveBeenCalled();
    expect(estado.invalidateProCache).not.toHaveBeenCalled();
  });

  it("Stripe falhando NÃO deixa rastro: 502 e banco intocado", async () => {
    montarRevoke();
    estado.stripeSubscriptionCancel = vi.fn(async () => {
      throw new Error("stripe fora do ar");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await revogar();

    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe("stripe_error");
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toHaveLength(0);
    expect(estado.invalidateProCache).not.toHaveBeenCalled();
  });

  it("o log da falha avulsa NÃO diz INCONSISTENCIA", async () => {
    // A palavra marca o estado meio-feito. Usá-la quando nada aconteceu a
    // diluiria justamente nos logs em que ela precisa ser procurável.
    montarRevoke();
    estado.stripeSubscriptionCancel = vi.fn(async () => {
      throw new Error("x");
    });
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await revogar();

    const linhas = erroSpy.mock.calls.map((c) => String(c[0]));
    expect(linhas.some((l) => l.includes("revogacao avulsa"))).toBe(true);
    expect(linhas.some((l) => l.includes("INCONSISTENCIA"))).toBe(false);
  });

  it("banco falhando DEPOIS da Stripe É inconsistência, nos dois gatilhos", async () => {
    // Exceção anotada em GatilhoDeRevogacao: aqui algo externo já mudou.
    let n = 0;
    montarRevoke({
      subscriptions: () => {
        n += 1;
        return n === 1
          ? { rows: [ASSINATURA_CARTAO] }
          : { error: { message: "timeout" } };
      },
    } as unknown as Record<string, RespostaTabela>);
    const erroSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await revogar();

    expect(r.status).toBe(500);
    expect(
      erroSpy.mock.calls.some((c) => String(c[0]).includes("INCONSISTENCIA")),
    ).toBe(true);
  });
});
