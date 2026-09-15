import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DESPACHO POR PROVEDOR em POST /api/billing/cancel e /api/billing/reactivate.
 *
 * Ate 2026-09-12 as duas rotas chamavam so a Stripe, que filtra
 * `provider='stripe'`: o assinante Pix recebia 404 "Nenhuma assinatura ativa
 * encontrada." sobre uma assinatura ativa, e a tela trocava isso por um toast
 * generico. Em producao, nenhum assinante Pix tinha conseguido registrar a
 * propria intencao de nao renovar.
 *
 * O router e os providers sao REAIS; o que e duble: Supabase, Stripe, cliente
 * HTTP do Asaas, auth, fila e cache.
 *
 * O duble do Supabase NAO aplica filtros: toda leitura de `subscriptions`
 * devolve as mesmas linhas. Por isso os casos afirmam o FILTRO DE PROVEDOR que
 * chegou as consultas, e nao so a resposta. Sem isso, o caminho da Stripe
 * "acharia" a linha do Asaas no duble e o caso do Pix passaria sem a correcao.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  stripeSubscriptionUpdate: null as unknown as ReturnType<typeof vi.fn>,
  asaasFetch: null as unknown as ReturnType<typeof vi.fn>,
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
    billingEnabled: true,
    asaasEnabled: true,
    asaasApiUrl: "https://api-sandbox.asaas.com/v3",
    asaasApiKey: "chave-de-teste",
    asaasWebhookToken: "token-de-teste",
    nfseEnabled: false,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    subscriptions: { update: estado.stripeSubscriptionUpdate },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: vi.fn(),
}));
vi.mock("../lib/asaasClient", () => ({
  asaasFetch: (...a: unknown[]) => estado.asaasFetch(...a),
}));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
  getCachedProStatus: async () => null,
  setCachedProStatus: async () => {},
}));
vi.mock("../lib/fiscalStorage", () => ({ signedFiscalUrl: async () => null }));
vi.mock("../lib/renewalToken", () => ({
  verifyRenewalToken: () => ({ status: "invalid" }),
  issueRenewalToken: () => "t",
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = {
      id: "22222222-2222-2222-2222-222222222222",
      email: "pessoa@x.com",
      role: "authenticated",
    };
    next();
  },
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import billingRouter from "./billing";
import { criarClienteRota } from "./adminTestClient";

const chamar = criarClienteRota(billingRouter, "/api/billing");

const UID = "22222222-2222-2222-2222-222222222222";

const PIX = {
  id: "row-pix",
  user_id: UID,
  provider: "asaas",
  status: "active",
  renewal_type: "manual",
  payment_method: "pix",
  provider_subscription_id: "pay_1",
  current_period_end: "2099-01-01T00:00:00Z",
  cancel_at_period_end: false,
};

const BOLETO = {
  id: "row-boleto",
  user_id: UID,
  provider: "stripe",
  status: "active",
  renewal_type: "manual",
  payment_method: "boleto",
  provider_subscription_id: "cs_live_1",
  current_period_end: "2099-01-01T00:00:00Z",
  cancel_at_period_end: false,
};

const CARTAO = {
  id: "row-cartao",
  user_id: UID,
  provider: "stripe",
  status: "active",
  renewal_type: "auto",
  payment_method: "card",
  provider_subscription_id: "sub_1",
  current_period_end: "2099-01-01T00:00:00Z",
  cancel_at_period_end: false,
};

function montar(respostas: Record<string, RespostaTabela>) {
  estado.double = criarSupabaseDouble(respostas);
}

/** Filtros de provedor que chegaram a `subscriptions`, na ordem. */
function filtrosDeProvedor(): string[] {
  return estado.double
    .de("subscriptions")
    .flatMap((c) => c.filtros)
    .filter((f) => f.coluna === "provider")
    .map((f) => `${f.tipo} ${String(f.valor)}`);
}

function escritas() {
  return estado.double.chamadas.filter((c) => c.op !== "select");
}

beforeEach(() => {
  estado.stripeSubscriptionUpdate = vi.fn(async () => ({}));
  estado.asaasFetch = vi.fn(async () => ({}));
});

describe("POST /api/billing/cancel", () => {
  it("Pix: despacha para o Asaas, registra a intencao e nao chama provedor remoto", async () => {
    montar({
      subscriptions: { rows: [PIX] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamar("POST", "/cancel", { reason_code: "expensive" });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      non_renewal: true,
      cancel_at_period_end: false,
      effective_at: "2099-01-01T00:00:00Z",
    });
    expect(filtrosDeProvedor()).toEqual(["eq asaas"]);

    const registro = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "insert");
    expect(registro?.payload).toMatchObject({
      user_id: UID,
      canceled_by: UID,
      provider_subscription_id: "pay_1",
      reason_code: "expensive",
      status: "scheduled",
    });
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
    expect(estado.asaasFetch).not.toHaveBeenCalled();
  });

  it("a busca que decide o provedor NAO filtra provedor e so ve assinatura vigente", async () => {
    montar({
      subscriptions: { rows: [PIX] },
      subscription_cancellations: { rows: [] },
    });

    await chamar("POST", "/cancel", {});

    const primeira = estado.double.de("subscriptions")[0];
    expect(primeira.filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
      {
        tipo: "in",
        coluna: "status",
        valor: ["active", "trialing", "past_due"],
      },
    ]);
  });

  it("boleto: continua no caminho manual da Stripe, sem chamar a Stripe", async () => {
    montar({
      subscriptions: { rows: [BOLETO] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamar("POST", "/cancel", { reason_code: "unused" });

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      non_renewal: true,
      cancel_at_period_end: false,
      effective_at: "2099-01-01T00:00:00Z",
    });
    expect(filtrosDeProvedor()).toEqual(["eq stripe"]);

    const registro = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "insert");
    expect(registro?.payload).toMatchObject({
      provider_subscription_id: "cs_live_1",
      reason_code: "unused",
      status: "scheduled",
    });
    expect(
      estado.double.de("subscriptions").filter((c) => c.op === "update"),
    ).toEqual([]);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
    expect(estado.asaasFetch).not.toHaveBeenCalled();
  });

  it("cartao: continua agendando cancel_at_period_end na Stripe", async () => {
    montar({
      subscriptions: { rows: [CARTAO] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamar("POST", "/cancel", {});

    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      cancel_at_period_end: true,
      effective_at: "2099-01-01T00:00:00Z",
    });
    expect(filtrosDeProvedor()).toEqual(["eq stripe"]);
    expect(estado.stripeSubscriptionUpdate).toHaveBeenCalledWith("sub_1", {
      cancel_at_period_end: true,
    });
    const update = estado.double
      .de("subscriptions")
      .find((c) => c.op === "update");
    expect(update?.payload).toEqual({ cancel_at_period_end: true });
    expect(estado.asaasFetch).not.toHaveBeenCalled();
  });

  it("sem assinatura vigente: 404 not_found e nada e escrito", async () => {
    montar({ subscriptions: { rows: [] } });

    const r = await chamar("POST", "/cancel", {});

    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
    expect(r.body.error.message).toBe("Nenhuma assinatura ativa encontrada.");
    expect(escritas()).toEqual([]);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it("erro de banco na busca: 500, sem sucesso silencioso e sem provedor", async () => {
    montar({ subscriptions: { rows: [], error: { message: "boom" } } });

    const r = await chamar("POST", "/cancel", {});

    expect(r.status).toBe(500);
    expect(escritas()).toEqual([]);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
    expect(estado.asaasFetch).not.toHaveBeenCalled();
  });

  it("reason_code invalido: 400 antes de qualquer consulta", async () => {
    montar({});

    const r = await chamar("POST", "/cancel", { reason_code: "inventado" });

    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_reason_code");
    expect(estado.double.chamadas).toEqual([]);
  });
});

describe("POST /api/billing/reactivate", () => {
  it("Pix: despacha para o Asaas e desfaz a intencao de nao renovar", async () => {
    montar({
      subscriptions: { rows: [PIX] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamar("POST", "/reactivate");

    expect(r.status).toBe(200);
    expect(r.body.data.cancel_at_period_end).toBe(false);
    expect(r.body.data.redirect_to_checkout).toBeUndefined();
    expect(filtrosDeProvedor()).toEqual(["eq asaas"]);

    const update = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "update");
    expect(update?.payload).toEqual({ status: "reverted" });
    expect(update?.filtros).toEqual([
      { tipo: "eq", coluna: "provider_subscription_id", valor: "pay_1" },
      { tipo: "eq", coluna: "status", valor: "scheduled" },
    ]);
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
    expect(estado.asaasFetch).not.toHaveBeenCalled();
  });

  it("boleto: continua no caminho manual da Stripe", async () => {
    montar({
      subscriptions: { rows: [BOLETO] },
      subscription_cancellations: { rows: [] },
    });

    const r = await chamar("POST", "/reactivate");

    expect(r.status).toBe(200);
    expect(r.body.data.cancel_at_period_end).toBe(false);
    expect(filtrosDeProvedor()).toEqual(["eq stripe"]);
    const update = estado.double
      .de("subscription_cancellations")
      .find((c) => c.op === "update");
    expect(update?.payload).toEqual({ status: "reverted" });
    expect(estado.stripeSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it("sem assinatura vigente: segue mandando para o checkout, como antes", async () => {
    montar({ subscriptions: { rows: [] } });

    const r = await chamar("POST", "/reactivate");

    expect(r.status).toBe(200);
    expect(r.body.data.redirect_to_checkout).toBe(true);
    expect(r.body.data.checkout_path).toBe("/planos");
    expect(escritas()).toEqual([]);
  });
});
