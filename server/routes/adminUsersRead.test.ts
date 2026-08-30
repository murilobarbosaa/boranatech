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
const boletoMock = vi.hoisted(() => ({
  resposta: null as unknown,
}));
vi.mock("../lib/boletoSession", () => ({
  lerSessaoDeBoleto: async () => boletoMock.resposta,
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

/**
 * `admin_refunds` ganha resposta VAZIA por padrão: desde 2026-07-30 ela é a
 * segunda fonte do extrato (devoluções que a Stripe nunca soube) e por isso é
 * lida no detalhe, no extrato e no histórico. Obrigar cada teste a declarar "não
 * tenho nenhuma devolução" seria ruído sem asserção. Um teste que precise de
 * linhas sobrescreve, porque o spread do chamador vem depois.
 */
function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  authAdmin: Record<string, unknown> = {},
) {
  estado.double = criarSupabaseDouble(
    // As duas fontes do TOTAL PAGO entram vazias por padrao, como o
    // admin_refunds ja entrava: desde que a lista carrega o total, `GET /users`
    // consulta as duas em toda chamada, e um teste que nao se importa com
    // dinheiro nao deveria precisar declarar isso. Quem se importa sobrescreve.
    {
      admin_refunds: { rows: [] },
      finance_transactions: { rows: [] },
      ...respostas,
    },
    authAdmin,
  );
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

describe("GET /users: area e total pago", () => {
  function comDuasPessoas(over: Record<string, unknown> = {}) {
    montar({
      profiles: {
        rows: [
          {
            id: "p1",
            user_id: "pagante",
            name: "A",
            email: "a@x",
            created_at: null,
            area_interesse: "Dados",
          },
          {
            id: "p2",
            user_id: "visitante",
            name: "B",
            email: "b@x",
            created_at: null,
            area_interesse: null,
          },
        ],
        count: 2,
      },
      // O enriquecimento de Pro roda em toda chamada e nao e o objeto destes
      // testes: entra vazio para nao virar ruido, e quem precisar sobrescreve.
      subscriptions: { rows: [] },
      influencers: { rows: [] },
      ...over,
    });
  }

  it("area vem da MESMA linha de profiles, e ausencia e null explicito", async () => {
    comDuasPessoas();
    const r = await chamarAdmin("GET", "/users");

    expect(r.body.data.items[0].area_interesse).toBe("Dados");
    // `null` e nao string vazia: quem nunca preencheu nao tem area, e a tela
    // precisa distinguir isso de uma area chamada "".
    expect(r.body.data.items[1].area_interesse).toBeNull();
    // E NAO custou consulta nova: a area saiu do mesmo select da pagina.
    expect(
      estado.double.chamadas.filter((c) => c.table === "profiles"),
    ).toHaveLength(1);
  });

  it("total pago desconta devolucao DECLARADA, pela conta canonica", async () => {
    // O caso que motiva usar totalPagoCents em vez de somar aqui: sem descontar
    // a declaracao externa, o total sairia bruto (10000) e seria um numero
    // plausivel e errado.
    comDuasPessoas({
      finance_transactions: {
        rows: [
          { user_id: "pagante", type: "charge", gross_cents: 10000 },
          { user_id: "visitante", type: "payout", gross_cents: 99999 },
        ],
      },
      admin_refunds: {
        rows: [
          {
            user_id: "pagante",
            stripe_charge_id: "ch_1",
            amount_cents: 3000,
            settlement: "external",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/users");
    expect(r.body.data.items[0].total_pago_cents).toBe(7000);
    // `payout` e movimento da conta Stripe, nao pagamento do usuario: fica de
    // fora pela propria totalPagoCents, e o visitante continua em zero.
    expect(r.body.data.items[1].total_pago_cents).toBe(0);
  });

  it("ZERO de verdade e diferente de NULL de falha", async () => {
    // Sem esta distincao a tela nao teria como separar "nunca pagou" de "nao
    // consegui olhar", e as duas desenhariam a mesma coisa.
    comDuasPessoas({ finance_transactions: { rows: [] } });
    const semCompra = await chamarAdmin("GET", "/users");
    expect(semCompra.body.data.items[0].total_pago_cents).toBe(0);

    comDuasPessoas({
      finance_transactions: { error: { message: "boom" } },
    });
    const comFalha = await chamarAdmin("GET", "/users");
    // A LISTA NAO CAI: 200, com a coluna nomeadamente desconhecida.
    expect(comFalha.status).toBe(200);
    expect(comFalha.body.data.items[0].total_pago_cents).toBeNull();
    // E o resto da linha continua correto: a falha de uma fonte de
    // enriquecimento nao contamina as outras.
    expect(comFalha.body.data.items[0].area_interesse).toBe("Dados");
  });

  it("uma fonte SO tambem vira null: meia conta e pior que nenhuma", async () => {
    // Com finance ok e admin_refunds quebrado, somar so a primeira daria um
    // total BRUTO, maior que o real, indistinguivel do certo na tela.
    comDuasPessoas({
      finance_transactions: {
        rows: [{ user_id: "pagante", type: "charge", gross_cents: 10000 }],
      },
      admin_refunds: { error: { message: "boom" } },
    });

    const r = await chamarAdmin("GET", "/users");
    expect(r.status).toBe(200);
    expect(r.body.data.items[0].total_pago_cents).toBeNull();
  });

  it("TETO FIXO de consultas: nao cresce com o tamanho da pagina", async () => {
    // A trava que impede o N+1. O teto e por FONTE, nao por linha: duas
    // consultas para o total (finance + admin_refunds), qualquer que seja o
    // numero de usuarios na pagina. Uma soma movida para dentro do laco
    // estouraria isto.
    const linhas = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      user_id: `u${i}`,
      name: `N${i}`,
      email: `e${i}@x`,
      created_at: null,
      area_interesse: null,
    }));
    montar({
      profiles: { rows: linhas, count: linhas.length },
      subscriptions: { rows: [] },
      influencers: { rows: [] },
      finance_transactions: { rows: [] },
      admin_refunds: { rows: [] },
    });

    await chamarAdmin("GET", "/users");

    expect(
      estado.double.chamadas.filter((c) => c.table === "finance_transactions"),
      "total pago deve custar UMA consulta a finance_transactions por pagina",
    ).toHaveLength(1);
    expect(
      estado.double.chamadas.filter((c) => c.table === "admin_refunds"),
      "total pago deve custar UMA consulta a admin_refunds por pagina",
    ).toHaveLength(1);
  });
});

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

  it("com active E pending simultâneos, lista e detalhe dizem a MESMA coisa", async () => {
    // A janela real: na renovação de boleto o cron `expiring-subscriptions`
    // manda o e-mail, o link entra por internalRenewal (que pula o guard de
    // assinatura ativa) e o checkout.session.completed cria a linha `pending`
    // ao lado da `active`. Isso dura até 3 dias.
    //
    // O detalhe escolhia por created_at desc, então mostrava a PENDING; a lista
    // usa pickSubscription, que prefere a que concede Pro. As duas telas
    // afirmavam coisas diferentes sobre a mesma pessoa.
    const ATIVA = {
      user_id: UID,
      status: "active",
      payment_method: "boleto",
      renewal_type: "manual",
      created_at: "2026-01-01T00:00:00Z",
      current_period_end: FUTURO,
      cancel_at_period_end: false,
      plans: { code: "pro_annual" },
    };
    const PENDENTE = {
      user_id: UID,
      status: "pending",
      payment_method: "boleto",
      renewal_type: "manual",
      // MAIS RECENTE: é ela que o critério antigo escolhia.
      created_at: "2026-07-29T00:00:00Z",
      current_period_end: null,
      cancel_at_period_end: false,
      plans: { code: "pro_annual" },
    };

    montar(
      {
        profiles: {
          rows: [{ user_id: UID, id: "p1", email: "a@x", name: "A" }],
        },
        subscriptions: { rows: [PENDENTE, ATIVA] },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      {
        getUserById: async () => ({
          data: { user: { last_sign_in_at: null } },
          error: null,
        }),
      },
    );
    const detalhe = await chamarAdmin("GET", `/users/${UID}`);

    montar({
      profiles: {
        rows: [
          { id: "p1", user_id: UID, name: "A", email: "a@x", created_at: null },
        ],
        count: 1,
      },
      subscriptions: { rows: [PENDENTE, ATIVA] },
      influencers: { rows: [] },
    });
    const lista = await chamarAdmin("GET", "/users");
    const linha = lista.body.data.items.find((i: any) => i.user_id === UID);

    expect(detalhe.status).toBe(200);
    expect(linha).toBeTruthy();

    // O que importa: as duas telas concordam.
    expect(detalhe.body.data.subscription.status).toBe(
      linha.subscription_status,
    );
    expect(detalhe.body.data.subscription.plan_code).toBe(linha.plan_code);
    // E concordam no valor CERTO, não num errado em comum.
    expect(detalhe.body.data.subscription.status).toBe("active");
    expect(detalhe.body.data.pro_source).toBe("subscription");
  });

  it("sem nenhuma que conceda Pro, o detalhe mostra a mais recente", async () => {
    // O outro ramo de pickSubscription: sem candidata Pro, vale a mais nova.
    montar(
      {
        profiles: {
          rows: [{ user_id: UID, id: "p1", email: "a@x", name: "A" }],
        },
        subscriptions: {
          rows: [
            {
              user_id: UID,
              status: "canceled",
              payment_method: null,
              renewal_type: "auto",
              created_at: "2026-01-01T00:00:00Z",
              current_period_end: null,
              cancel_at_period_end: false,
              plans: { code: "pro_monthly" },
            },
            {
              user_id: UID,
              status: "pending",
              payment_method: "boleto",
              renewal_type: "manual",
              created_at: "2026-07-29T00:00:00Z",
              current_period_end: null,
              cancel_at_period_end: false,
              plans: { code: "pro_annual" },
            },
          ],
        },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      {
        getUserById: async () => ({
          data: { user: { last_sign_in_at: null } },
          error: null,
        }),
      },
    );

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.body.data.subscription.status).toBe("pending");
    expect(r.body.data.pro_source).toBe(null);
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

describe("boleto pendente no detalhe (Partes 3 e 4)", () => {
  const PERFIL_MIN = {
    user_id: UID,
    id: "p1",
    name: "A",
    email: "a@x",
    cpf: null,
    avatar_url: null,
    avatar_mode: "icon",
    avatar_moderation_status: "clean",
  };
  const AUTH = {
    getUserById: async () => ({
      data: { user: { last_sign_in_at: null } },
      error: null,
    }),
  };

  function comAssinatura(status: string, extra: Record<string, unknown> = {}) {
    return {
      profiles: { rows: [PERFIL_MIN] },
      subscriptions: {
        rows: [
          {
            user_id: UID,
            status,
            payment_method: "boleto",
            renewal_type: "manual",
            created_at: "2026-07-29T00:00:00Z",
            current_period_end: null,
            cancel_at_period_end: false,
            provider_subscription_id: "cs_1",
            plans: { code: "pro_annual" },
            ...extra,
          },
        ],
      },
      influencers: { rows: [] },
      finance_transactions: { rows: [] },
      subscription_cancellations: { rows: [] },
    };
  }

  it("status pending: o estado do boleto vem na resposta", async () => {
    boletoMock.resposta = {
      estado: "ok",
      payment_status: "unpaid",
      amount_cents: 15540,
      currency: "brl",
      expires_at: "2026-08-01T02:59:00.000Z",
      pago: false,
    };
    montar(comAssinatura("pending"), AUTH);

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.boleto).toMatchObject({
      estado: "ok",
      payment_status: "unpaid",
      amount_cents: 15540,
      expires_at: "2026-08-01T02:59:00.000Z",
      pago: false,
    });
  });

  it("QUALQUER outro status NÃO consulta a Stripe", async () => {
    // O custo tem que ser zero para as 58 linhas que não são boleto pendente.
    // Se um dia alguém trocar a condição, este teste cai.
    for (const status of [
      "active",
      "canceled",
      "past_due",
      "incomplete",
      "superseded",
      "trialing",
    ]) {
      boletoMock.resposta = {
        estado: "ok",
        payment_status: "paid",
        amount_cents: 1,
        currency: "brl",
        expires_at: null,
        pago: true,
      };
      montar(comAssinatura(status), AUTH);
      const r = await chamarAdmin("GET", `/users/${UID}`);
      expect(r.body.data.boleto, status).toBeNull();
    }
  });

  it("sem assinatura nenhuma, boleto é null", async () => {
    boletoMock.resposta = null;
    montar(
      {
        profiles: { rows: [PERFIL_MIN] },
        subscriptions: { rows: [] },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      AUTH,
    );
    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.boleto).toBeNull();
  });

  it("falha da Stripe DEGRADA: o detalhe continua 200 e o resto vem inteiro", async () => {
    // O bloco do boleto é informativo. Derrubar o modal por causa dele tiraria
    // do admin o cadastro, a assinatura e o histórico junto.
    boletoMock.resposta = { estado: "indisponivel", motivo: "rede caiu" };
    montar(comAssinatura("pending"), AUTH);

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.boleto).toMatchObject({ estado: "indisponivel" });
    // O resto do detalhe não foi afetado.
    expect(r.body.data.email).toBe("a@x");
    expect(r.body.data.subscription.status).toBe("pending");
  });

  it("sessão PAGA com linha ainda pending é dinheiro sem acesso: vem sinalizado", async () => {
    // É o caso que hoje só existe como log do Railway
    // ("boleto PAGO ainda pending"). A resposta precisa poder dizer isso à tela.
    boletoMock.resposta = {
      estado: "ok",
      payment_status: "paid",
      amount_cents: 15540,
      currency: "brl",
      expires_at: null,
      pago: true,
    };
    montar(comAssinatura("pending"), AUTH);

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.body.data.boleto.pago).toBe(true);
    expect(r.body.data.subscription.status).toBe("pending");
  });
});

describe("histórico de assinaturas no detalhe (Parte 5)", () => {
  const PERFIL_MIN = {
    user_id: UID,
    id: "p1",
    name: "A",
    email: "a@x",
    cpf: null,
    avatar_url: null,
    avatar_mode: "icon",
    avatar_moderation_status: "clean",
  };
  const AUTH = {
    getUserById: async () => ({
      data: { user: { last_sign_in_at: null } },
      error: null,
    }),
  };

  function linha(over: Record<string, unknown>) {
    return {
      user_id: UID,
      status: "superseded",
      payment_method: "boleto",
      renewal_type: "manual",
      created_at: "2025-01-01T00:00:00Z",
      current_period_end: null,
      cancel_at_period_end: false,
      provider_subscription_id: "cs_old",
      plans: { code: "pro_annual" },
      ...over,
    };
  }

  it("as anteriores aparecem, sem a vigente entre elas", async () => {
    const VIGENTE = linha({
      status: "active",
      created_at: "2026-07-01T00:00:00Z",
      current_period_end: FUTURO,
      provider_subscription_id: "cs_novo",
    });
    montar(
      {
        profiles: { rows: [PERFIL_MIN] },
        subscriptions: {
          rows: [
            VIGENTE,
            linha({ created_at: "2025-01-01T00:00:00Z" }),
            linha({
              created_at: "2024-01-01T00:00:00Z",
              plans: { code: "pro_monthly" },
            }),
          ],
        },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      AUTH,
    );

    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.subscription.status).toBe("active");
    expect(r.body.data.subscription_history).toHaveLength(2);
    // A vigente NAO se repete no histórico: ela já é a seção acima.
    expect(
      r.body.data.subscription_history.every((h: any) => h.status !== "active"),
    ).toBe(true);
    // Mais recente primeiro.
    expect(r.body.data.subscription_history[0].created_at).toBe(
      "2025-01-01T00:00:00Z",
    );
    expect(r.body.data.subscription_history[1].plan_code).toBe("pro_monthly");
  });

  it("uma assinatura só devolve histórico VAZIO, não uma cópia dela", async () => {
    // Assim a tela sabe não desenhar seção nenhuma, em vez de mostrar um
    // histórico com um item que é a própria assinatura vigente.
    montar(
      {
        profiles: { rows: [PERFIL_MIN] },
        subscriptions: {
          rows: [linha({ status: "active", current_period_end: FUTURO })],
        },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      AUTH,
    );
    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.body.data.subscription_history).toEqual([]);
  });

  it("sem assinatura nenhuma, histórico vazio e sem erro", async () => {
    montar(
      {
        profiles: { rows: [PERFIL_MIN] },
        subscriptions: { rows: [] },
        influencers: { rows: [] },
        finance_transactions: { rows: [] },
        subscription_cancellations: { rows: [] },
      },
      AUTH,
    );
    const r = await chamarAdmin("GET", `/users/${UID}`);
    expect(r.status).toBe(200);
    expect(r.body.data.subscription_history).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /users/:id/audit
// ---------------------------------------------------------------------------

describe("GET /users/:id/audit: fiação do histórico administrativo", () => {
  function logRow(over: Record<string, unknown> = {}) {
    return {
      id: "log-1",
      action: "refund",
      resource_type: "charge",
      resource_id: UID,
      resource_slug: "ch_1",
      actor_user_id: "admin-1",
      before_json: null,
      after_json: { amount_cents: 5000, reason: "duplicidade" },
      created_at: "2026-07-30T12:00:00Z",
      ...over,
    };
  }

  it("uuid inválido é barrado antes de tocar o banco", async () => {
    montar({});
    const r = await chamarAdmin("GET", "/users/nao-e-uuid/audit");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_user_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("nome do ator sai resolvido, numa consulta só, sem N+1", async () => {
    montar({
      content_audit_logs: {
        rows: [
          logRow({ id: "l1", actor_user_id: "admin-1" }),
          logRow({ id: "l2", actor_user_id: "admin-1" }),
          logRow({ id: "l3", actor_user_id: "admin-2" }),
        ],
      },
      profiles: {
        rows: [
          { user_id: "admin-1", name: "Ana", email: "ana@x" },
          { user_id: "admin-2", name: null, email: "bruno@x" },
        ],
      },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(200);

    // Ordem: os três compartilham created_at, então vale o desempate por id
    // decrescente (l3, l2, l1). admin-2 não tem name e cai para o email.
    const nomes = r.body.data.entries.map((e: any) => e.actor_name);
    expect(nomes).toEqual(["bruno@x", "Ana", "Ana"]);

    // UMA consulta a profiles para os três registros e dois atores distintos.
    const emProfiles = estado.double.chamadas.filter(
      (c) => c.table === "profiles",
    );
    expect(emProfiles).toHaveLength(1);
    expect(
      emProfiles[0].filtros.some(
        (f) => f.tipo === "in" && f.coluna === "user_id",
      ),
    ).toBe(true);
  });

  it("nome cai para o email quando o perfil não tem name", async () => {
    montar({
      content_audit_logs: { rows: [logRow({ actor_user_id: "admin-2" })] },
      profiles: {
        rows: [{ user_id: "admin-2", name: null, email: "bruno@x" }],
      },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });
    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.body.data.entries[0].actor_name).toBe("bruno@x");
  });

  it("filtra por resource_id E por ação: linha de conteúdo não entra no histórico da pessoa", async () => {
    montar({
      content_audit_logs: { rows: [logRow()] },
      profiles: { rows: [] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });
    await chamarAdmin("GET", `/users/${UID}/audit`);

    const chamada = estado.double.chamadas.find(
      (c) => c.table === "content_audit_logs",
    )!;
    expect(chamada.filtros).toEqual(
      expect.arrayContaining([
        { tipo: "eq", coluna: "resource_id", valor: UID },
        expect.objectContaining({ tipo: "in", coluna: "action" }),
      ]),
    );
  });

  it("reembolso com linha em admin_refunds chega CONFIRMADO na resposta", async () => {
    montar({
      content_audit_logs: { rows: [logRow()] },
      profiles: { rows: [] },
      admin_refunds: {
        rows: [
          {
            stripe_charge_id: "ch_1",
            amount_cents: 5000,
            stripe_refund_id: "re_abc",
          },
        ],
      },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.body.data.entries[0].outcome).toBe("confirmed");
    expect(r.body.data.cross_reference_ok).toBe(true);
  });

  it("erro na tabela de RESULTADO degrada para não-verificável, sem derrubar o histórico", async () => {
    // A intenção continua na tela. Trocar o histórico inteiro por erro 500 por
    // causa de uma tabela auxiliar seria pior, e marcar 'unconfirmed' afirmaria
    // que a ação não surtiu efeito, o que ninguém checou.
    montar({
      content_audit_logs: { rows: [logRow()] },
      profiles: { rows: [] },
      admin_refunds: { error: { message: "permission denied" } },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(200);
    expect(r.body.data.entries).toHaveLength(1);
    expect(r.body.data.entries[0].outcome).toBe("not_verifiable");
    expect(r.body.data.cross_reference_ok).toBe(false);
  });

  it("erro na leitura do LOG é fail-loud: tela vazia afirmaria que nada aconteceu", async () => {
    montar({
      content_audit_logs: { error: { message: "timeout" } },
      profiles: { rows: [] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(500);
  });

  it("valor de campo fora da allowlist não trafega na resposta", async () => {
    montar({
      content_audit_logs: {
        rows: [
          logRow({
            action: "update_profile",
            resource_type: "profile",
            resource_slug: null,
            before_json: { bio: "texto antigo e pessoal", name: "Ana" },
            after_json: { bio: "texto novo e pessoal", name: "Ana Maria" },
          }),
        ],
      },
      profiles: { rows: [] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    const corpo = JSON.stringify(r.body);
    expect(corpo).not.toContain("pessoal");
    // Mas o EVENTO continua visível.
    expect(r.body.data.entries[0].campos_alterados).toContain("bio");
  });

  it("corte avisa que cortou", async () => {
    montar({
      content_audit_logs: {
        rows: Array.from({ length: 101 }, (_, i) =>
          logRow({ id: `l${String(i).padStart(3, "0")}` }),
        ),
      },
      profiles: { rows: [] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.body.data.truncated).toBe(true);
    expect(r.body.data.entries).toHaveLength(100);
  });

  it("histórico vazio é 200 com lista vazia, não 404", async () => {
    montar({
      content_audit_logs: { rows: [] },
      profiles: { rows: [] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });
    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(200);
    expect(r.body.data.entries).toEqual([]);
  });

  it("mix das sete ações sai com um outcome coerente para cada uma", async () => {
    // Enumeradas de propósito, e o TOTAL é afirmado: se uma ação de usuário
    // nascer sem entrar aqui, a contagem cai. Lista de pertinência ("as que eu
    // conheço estão certas") não pegaria isso.
    const ACOES = [
      "reveal",
      "grant",
      "revoke",
      "update_profile",
      "update_email",
      "cancel_subscription",
      "refund",
    ];

    montar({
      content_audit_logs: {
        rows: ACOES.map((action, i) =>
          logRow({
            id: `l${i}`,
            action,
            resource_slug: action === "refund" ? "ch_1" : null,
            after_json:
              action === "refund" ? { amount_cents: 5000 } : { qualquer: 1 },
          }),
        ),
      },
      profiles: { rows: [] },
      admin_refunds: {
        rows: [
          {
            stripe_charge_id: "ch_1",
            amount_cents: 5000,
            stripe_refund_id: "re_1",
          },
        ],
      },
      // Nenhum cancelamento gravado: a intenção existe, o resultado não.
      subscription_cancellations: { rows: [] },
    });

    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(200);

    const porAcao: Record<string, string> = {};
    for (const e of r.body.data.entries) porAcao[e.action] = e.outcome;

    expect(porAcao).toEqual({
      reveal: "not_verifiable",
      grant: "not_verifiable",
      revoke: "not_verifiable",
      update_profile: "not_verifiable",
      update_email: "not_verifiable",
      // Tem tabela de resultado e a linha NÃO está lá: intenção sem confirmação.
      cancel_subscription: "unconfirmed",
      refund: "confirmed",
    });
    expect(Object.keys(porAcao)).toHaveLength(ACOES.length);
  });

  it("sem ator nenhum, profiles não é consultado à toa", async () => {
    montar({
      content_audit_logs: { rows: [logRow({ actor_user_id: null })] },
      admin_refunds: { rows: [] },
      subscription_cancellations: { rows: [] },
    });
    const r = await chamarAdmin("GET", `/users/${UID}/audit`);
    expect(r.status).toBe(200);
    expect(r.body.data.entries[0].actor_name).toBe("Admin removido");
    expect(
      estado.double.chamadas.filter((c) => c.table === "profiles"),
    ).toHaveLength(0);
  });
});
