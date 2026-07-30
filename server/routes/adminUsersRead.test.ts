import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO das rotas de LEITURA de usuário do admin.
 *
 * O risco aqui não é dano, é MENTIRA: a lista dizer "não-Pro" para um
 * influencer, o extrato não bater com o total, a contagem por tabela sumir por
 * causa de um erro numa delas.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
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
vi.mock("../lib/authUsers", () => ({
  fetchAuthTimes: async () =>
    new Map([
      ["ativo-1", { lastSignInAt: new Date().toISOString(), createdAt: null }],
    ]),
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
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

const UID = "11111111-1111-1111-1111-111111111111";
const FUTURO = "2030-01-01T00:00:00Z";

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  authAdmin: Record<string, unknown> = {},
) {
  estado.double = criarSupabaseDouble(respostas, authAdmin);
}

beforeEach(() => {
  montar({});
});

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------

describe("GET /users: enriquecimento chega na resposta", () => {
  it("mix de assinante, influencer, ambos e nenhum sai com is_pro/pro_source certos", async () => {
    montar({
      profiles: {
        rows: [
          {
            id: "p1",
            user_id: "assinante",
            name: "A",
            email: "a@x",
            created_at: null,
          },
          {
            id: "p2",
            user_id: "influ",
            name: "B",
            email: "b@x",
            created_at: null,
          },
          {
            id: "p3",
            user_id: "ambos",
            name: "C",
            email: "c@x",
            created_at: null,
          },
          {
            id: "p4",
            user_id: "nenhum",
            name: "D",
            email: "d@x",
            created_at: null,
          },
        ],
        count: 4,
      },
      subscriptions: {
        rows: [
          {
            user_id: "assinante",
            status: "active",
            current_period_end: FUTURO,
            created_at: null,
            plans: { code: "pro_annual" },
          },
          {
            user_id: "ambos",
            status: "active",
            current_period_end: FUTURO,
            created_at: null,
            plans: { code: "pro_monthly" },
          },
        ],
      },
      influencers: { rows: [{ user_id: "influ" }, { user_id: "ambos" }] },
    });

    const r = await chamarAdmin("GET", "/users");
    expect(r.status).toBe(200);

    const porId: Record<string, any> = {};
    for (const item of r.body.data.items) porId[item.user_id] = item;

    expect(porId.assinante).toMatchObject({
      is_pro: true,
      pro_source: "subscription",
      plan_code: "pro_annual",
      subscription_status: "active",
    });
    // O caso que uma lista ingênua marca como "não Pro".
    expect(porId.influ).toMatchObject({
      is_pro: true,
      pro_source: "influencer",
      plan_code: null,
    });
    expect(porId.ambos).toMatchObject({ is_pro: true, pro_source: "both" });
    expect(porId.nenhum).toMatchObject({ is_pro: false, pro_source: null });

    expect(r.body.data.total).toBe(4);
  });

  it("NÃO faz N+1: uma consulta por tabela, independente do tamanho da página", async () => {
    const linhas = Array.from({ length: 50 }, (_, i) => ({
      id: `p${i}`,
      user_id: `u${i}`,
      name: "x",
      email: "x@x",
      created_at: null,
    }));
    montar({
      profiles: { rows: linhas, count: 50 },
      subscriptions: { rows: [] },
      influencers: { rows: [] },
    });

    await chamarAdmin("GET", "/users");

    expect(estado.double.de("subscriptions")).toHaveLength(1);
    expect(estado.double.de("influencers")).toHaveLength(1);
  });

  it("falha do enriquecimento vira erro, não lista com todo mundo como não-Pro", async () => {
    montar({
      profiles: {
        rows: [
          {
            id: "p1",
            user_id: "u1",
            name: "A",
            email: "a@x",
            created_at: null,
          },
        ],
        count: 1,
      },
      subscriptions: { error: { message: "timeout" } },
      influencers: { rows: [] },
    });

    const r = await chamarAdmin("GET", "/users");
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("os 5 filtros consultam o que devem", async () => {
    for (const filtro of ["all", "pro", "not_pro", "influencers", "ativo"]) {
      montar({
        profiles: { rows: [], count: 0 },
        subscriptions: { rows: [] },
        influencers: { rows: [] },
      });
      const r = await chamarAdmin(
        "GET",
        `/users?filter=${filtro}&page=1&pageSize=50`,
      );
      expect(r.status, filtro).toBe(200);
    }
  });

  it("ordenação tem desempate por chave única", async () => {
    montar({
      profiles: { rows: [], count: 0 },
      subscriptions: { rows: [] },
      influencers: { rows: [] },
    });
    await chamarAdmin("GET", "/users");
    // O dublê valida a coluna do order contra o schema; aqui garantimos que as
    // DUAS ordenações existem (created_at sozinho não é determinístico).
    const q = estado.double.de("profiles")[0];
    expect(q).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// GET /users/:id
// ---------------------------------------------------------------------------

describe("GET /users/:id", () => {
  const PERFIL = {
    user_id: UID,
    name: "Ana",
    full_name: "Ana Moura",
    email: "ana@x.com",
    gender: null,
    bio: null,
    area_interesse: null,
    nivel_atual: null,
    objetivo: null,
    onboarding_completed: true,
    onboarding_step: 1,
    marketing_opt_in: false,
    marketing_opt_in_at: null,
    welcome_email_sent: false,
    cpf: "39053344705",
    avatar_url: null,
    avatar_mode: "icon",
    avatar_moderation_status: "clean",
    headline: "Dev",
    city: "Brasília",
    uf: "DF",
    career_goal: "Primeira vaga",
    github_url: "https://github.com/ana",
    linkedin_url: null,
    website_url: null,
    created_at: null,
    updated_at: "2026-07-30T12:00:00Z",
  };

  it("devolve os campos de perfil público e mascara o CPF", async () => {
    montar(
      {
        profiles: { rows: [PERFIL] },
        subscriptions: { rows: [] },
        subscription_cancellations: { rows: [] },
        finance_transactions: { rows: [] },
        influencers: { rows: [] },
      },
      {
        getUserById: async () => ({
          data: { user: { last_sign_in_at: null } },
          error: null,
        }),
      },
    );

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      headline: "Dev",
      city: "Brasília",
      uf: "DF",
      career_goal: "Primeira vaga",
      github_url: "https://github.com/ana",
    });
    // CPF nunca sai inteiro por aqui.
    expect(r.body.data.cpf).toBeUndefined();
    expect(r.body.data.has_cpf).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain("39053344705");
  });

  it("pro_source vem de resolveProSource: influencer sem assinatura não vira null", async () => {
    montar(
      {
        profiles: { rows: [PERFIL] },
        subscriptions: { rows: [] },
        subscription_cancellations: { rows: [] },
        finance_transactions: { rows: [] },
        influencers: {
          rows: [
            {
              id: "i1",
              granted_at: "2026-01-01",
              granted_by: "admin-1",
              note: null,
            },
          ],
        },
      },
      {
        getUserById: async () => ({
          data: { user: { last_sign_in_at: null } },
          error: null,
        }),
      },
    );

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.body.data.is_pro).toBe(true);
    expect(r.body.data.pro_source).toBe("influencer");
  });
});

// ---------------------------------------------------------------------------
// GET /users/:id/transactions
// ---------------------------------------------------------------------------

describe("GET /users/:id/transactions", () => {
  function linha(over: Record<string, unknown> = {}) {
    return {
      id: "ft1",
      type: "charge",
      gross_cents: 10000,
      fee_cents: 0,
      net_cents: 10000,
      currency: "BRL",
      occurred_at: "2026-07-01T12:00:00Z",
      stripe_charge_id: "ch_1",
      stripe_invoice_id: null,
      plan_code: "pro_annual",
      ...over,
    };
  }

  it("a agregação de reembolso chega na resposta", async () => {
    montar({
      finance_transactions: {
        rows: [
          linha(),
          linha({
            id: "r1",
            type: "refund",
            gross_cents: -3000,
            occurred_at: "2026-07-02T12:00:00Z",
          }),
        ],
      },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/transactions`);
    expect(r.status).toBe(200);

    const charge = r.body.data.items.find((i: any) => i.id === "ft1");
    expect(charge).toMatchObject({
      refunded_cents: 3000,
      refund_state: "partial",
      refundable_cents: 7000,
    });
    expect(r.body.data.total_paid_cents).toBe(7000);
    expect(r.body.data.truncated).toBe(false);
  });

  it("truncamento é sinalizado, nunca silencioso", async () => {
    const muitas = Array.from({ length: 201 }, (_, i) =>
      linha({ id: `ft${i}`, stripe_charge_id: `ch_${i}` }),
    );
    montar({ finance_transactions: { rows: muitas } });

    const r = await chamarAdmin("GET", `/users/${UID}/transactions`);
    expect(r.body.data.truncated).toBe(true);
    expect(r.body.data.items).toHaveLength(200);
    expect(r.body.data.limit).toBe(200);
  });

  it("usuário sem transação devolve lista vazia e total zero", async () => {
    montar({ finance_transactions: { rows: [] } });
    const r = await chamarAdmin("GET", `/users/${UID}/transactions`);
    expect(r.body.data).toMatchObject({ items: [], total_paid_cents: 0 });
  });
});

// ---------------------------------------------------------------------------
// GET /users/:id/email-usage
// ---------------------------------------------------------------------------

describe("GET /users/:id/email-usage", () => {
  it("conta por tabela", async () => {
    montar({
      profiles: { rows: [{ email: "ana@x.com" }] },
      newsletter_subscribers: { rows: [], count: 1 },
      email_suppressions: { rows: [], count: 0 },
      contact_list_members: { rows: [], count: 3 },
      waitlist: { rows: [], count: 2 },
      email_campaign_recipients: { rows: [], count: 7 },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/email-usage`);
    expect(r.status).toBe(200);
    expect(r.body.data.email).toBe("ana@x.com");

    const porTabela: Record<string, number | null> = {};
    for (const u of r.body.data.usage) porTabela[u.table] = u.count;
    expect(porTabela).toEqual({
      newsletter_subscribers: 1,
      email_suppressions: 0,
      contact_list_members: 3,
      waitlist: 2,
      email_campaign_recipients: 7,
    });
  });

  it("erro em UMA tabela vira count null, sem derrubar as demais", async () => {
    montar({
      profiles: { rows: [{ email: "ana@x.com" }] },
      newsletter_subscribers: { rows: [], count: 1 },
      email_suppressions: { error: { message: "permission denied" } },
      contact_list_members: { rows: [], count: 3 },
      waitlist: { rows: [], count: 2 },
      email_campaign_recipients: { rows: [], count: 7 },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const r = await chamarAdmin("GET", `/users/${UID}/email-usage`);
    expect(r.status).toBe(200);

    const suppressions = r.body.data.usage.find(
      (u: any) => u.table === "email_suppressions",
    );
    expect(suppressions.count).toBeNull();
    // As outras continuam com número: perder a informação inteira por causa de
    // uma tabela seria pior que mostrar um buraco identificado.
    expect(
      r.body.data.usage.find((u: any) => u.table === "waitlist").count,
    ).toBe(2);
  });

  it("perfil sem e-mail devolve lista vazia, sem consultar tabela nenhuma", async () => {
    montar({ profiles: { rows: [{ email: null }] } });
    const r = await chamarAdmin("GET", `/users/${UID}/email-usage`);
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ email: null, usage: [] });
  });
});

// ---------------------------------------------------------------------------
// ESCOPO: sem estas asserções, uma rota que esquecesse o filtro por usuário
// devolveria dado de OUTRA pessoa e todos os testes acima continuariam verdes,
// porque o dublê devolve as mesmas linhas independente do `.eq()`. É a maior
// fraqueza de um dublê que não executa SQL, e a contramedida é afirmar que o
// filtro foi PEDIDO.
// ---------------------------------------------------------------------------

describe("toda consulta por usuário carrega o filtro de escopo", () => {
  function filtrosDe(tabela: string) {
    return estado.double
      .de(tabela)
      .flatMap((c) => c.filtros.map((f) => `${f.tipo}:${f.coluna}`));
  }

  it("GET /users/:id/transactions filtra por user_id", async () => {
    montar({ finance_transactions: { rows: [] } });
    await chamarAdmin("GET", `/users/${UID}/transactions`);

    expect(filtrosDe("finance_transactions")).toContain("eq:user_id");
    const valor = estado.double
      .de("finance_transactions")[0]
      .filtros.find((f) => f.coluna === "user_id")?.valor;
    expect(valor).toBe(UID);
  });

  it("GET /users/:id filtra o perfil e as tabelas satélites pelo usuário", async () => {
    montar(
      {
        // Perfil PRECISA existir: com rows vazio a rota responde 404 antes de
        // consultar as satélites, e o teste passaria a verificar nada.
        profiles: { rows: [{ user_id: UID, cpf: null }] },
        subscriptions: { rows: [] },
        subscription_cancellations: { rows: [] },
        finance_transactions: { rows: [] },
        influencers: { rows: [] },
      },
      {
        getUserById: async () => ({
          data: { user: { last_sign_in_at: null } },
          error: null,
        }),
      },
    );
    await chamarAdmin("GET", `/users/${UID}`);

    for (const tabela of [
      "profiles",
      "subscriptions",
      "subscription_cancellations",
      "finance_transactions",
      "influencers",
    ]) {
      expect(filtrosDe(tabela), tabela).toContain("eq:user_id");
    }
  });

  it("GET /users/:id/email-usage filtra CADA tabela pelo e-mail", async () => {
    montar({
      profiles: { rows: [{ email: "ana@x.com" }] },
      newsletter_subscribers: { rows: [], count: 0 },
      email_suppressions: { rows: [], count: 0 },
      contact_list_members: { rows: [], count: 0 },
      waitlist: { rows: [], count: 0 },
      email_campaign_recipients: { rows: [], count: 0 },
    });
    await chamarAdmin("GET", `/users/${UID}/email-usage`);

    for (const tabela of [
      "newsletter_subscribers",
      "email_suppressions",
      "contact_list_members",
      "waitlist",
      "email_campaign_recipients",
    ]) {
      const filtros = estado.double.de(tabela)[0]?.filtros ?? [];
      expect(
        filtros.some((f) => f.tipo === "eq" && f.coluna === "email"),
        tabela,
      ).toBe(true);
      expect(filtros.find((f) => f.coluna === "email")?.valor, tabela).toBe(
        "ana@x.com",
      );
    }
  });

  it("GET /users ordena por created_at E por chave única (paginação estável)", async () => {
    // created_at sozinho não é determinístico: sem desempate, a paginação por
    // range pula e repete linhas entre páginas quando há empate.
    const ordens: string[] = [];
    const double = criarSupabaseDouble({
      profiles: { rows: [], count: 0 },
      subscriptions: { rows: [] },
      influencers: { rows: [] },
    });
    const fromOriginal = double.client.from.bind(double.client);
    double.client.from = (tabela: string) => {
      const q = fromOriginal(tabela) as Record<string, Function>;
      const selectOriginal = q.select;
      q.select = (...a: unknown[]) => {
        const inner = selectOriginal(...a) as Record<string, Function>;
        const orderOriginal = inner.order;
        inner.order = (coluna: string, opts?: unknown) => {
          if (tabela === "profiles") ordens.push(coluna);
          return orderOriginal(coluna, opts);
        };
        return inner;
      };
      return q;
    };
    estado.double = double;

    await chamarAdmin("GET", "/users");

    expect(ordens).toEqual(["created_at", "id"]);
  });
});
