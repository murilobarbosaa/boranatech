import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * REGRESSAO DA STRIPE depois da chave de cobranca agnostica.
 *
 * O Pix entrou no pipeline fiscal trocando a chave da tabela e da fila. O que
 * nao pode mudar para a Stripe: a nota continua nascendo com
 * `payment_provider = 'stripe'`, chave `stripe:<charge>` e `stripe_charge_id`
 * PREENCHIDO, que e a coluna pela qual o resto do sistema ainda junta nota com
 * finance_transactions.
 *
 * Boleto pelo handler REAL do webhook (`onBoletoAsyncPaymentSucceeded`) ate o
 * registro e a fila reais. Cartao (`invoice.paid`) pelo registro real com o
 * MESMO input que o gancho da fatura monta: o handler da fatura nao e exportado
 * e so e alcancavel pelo `handleWebhook` inteiro.
 *
 * FISCAL-REGRAS 01: a linha nasce 'awaiting_batch' e NINGUEM enfileira no
 * pagamento (R2); o meio vem da charge (R1); a competencia e o dia de Brasilia
 * do evento de pagamento (R6).
 */

const estado = vi.hoisted(() => ({
  upsertsFiscais: [] as Array<{
    carga: Record<string, unknown>;
    opcoes: unknown;
  }>,
  jobs: [] as Array<{ nome: string; dados: unknown; opcoes: unknown }>,
  meios: ["cartao", "pix", "boleto"] as string[],
}));

vi.mock("../lib/env", () => ({
  env: {
    nfseEnabled: true,
    get nfseMeiosEmissao() {
      return estado.meios;
    },
    nfseEmitirDesde: "2026-08-01",
    redisUrl: "",
    supabaseUrl: "https://exemplo.supabase.co",
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    stripePriceIds: {
      pro_monthly: "price_monthly",
      pro_semiannual: "price_semiannual",
      pro_annual: "price_annual",
    },
    appPublicUrl: "https://exemplo.com.br",
    billingEnabled: true,
    isProd: false,
  },
}));

vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  addBreadcrumb: () => {},
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    paymentIntents: {
      retrieve: async (id: string) => {
        expect(id).toBe("pi_boleto_1");
        return { latest_charge: "ch_boleto_1" };
      },
    },
    charges: {
      retrieve: async (id: string) => {
        expect(id).toBe("ch_boleto_1");
        return { id, payment_method_details: { type: "boleto" } };
      },
    },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

vi.mock("../lib/redis", () => ({ queueConnection: {}, cacheConnection: null }));
vi.mock("bullmq", () => ({
  Queue: class {
    async add(nome: string, dados: unknown, opcoes: unknown) {
      estado.jobs.push({ nome, dados, opcoes });
      return {};
    }
  },
  Worker: class {},
}));

vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: async () => {} }));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: async () => {},
}));
vi.mock("../lib/coupons", () => ({ findValidCoupon: async () => null }));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const q: Record<string, unknown> = {};
    for (const m of [
      "select",
      "eq",
      "neq",
      "in",
      "gt",
      "order",
      "limit",
      "is",
    ]) {
      q[m] = () => q;
    }
    q.maybeSingle = async () => {
      if (tabela === "subscriptions") {
        return {
          data: { id: SUB_ROW, user_id: USER, status: "pending" },
          error: null,
        };
      }
      if (tabela === "plans") {
        return { data: { code: "pro_annual", name: "Pro Anual" }, error: null };
      }
      return { data: null, error: null };
    };
    q.upsert = (carga: Record<string, unknown>, opcoes: unknown) => {
      if (tabela === "fiscal_invoices") {
        estado.upsertsFiscais.push({ carga, opcoes });
      }
      return Promise.resolve({ error: null });
    };
    for (const op of ["update", "insert", "delete"]) q[op] = () => q;
    q.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    return q;
  }
  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      rpc: async (nome: string) =>
        nome === "activate_subscription_exclusive"
          ? {
              data: [
                {
                  out_activated: true,
                  out_superseded_count: 0,
                  out_user_id: USER,
                  out_plan_id: "33333333-3333-3333-3333-333333333333",
                  out_affiliate_code: null,
                  out_coupon_code: null,
                },
              ],
              error: null,
            }
          : { data: null, error: null },
      auth: {
        admin: {
          getUserById: async () => ({
            data: { user: { email: "", user_metadata: {} } },
            error: null,
          }),
        },
      },
    },
  };
});

import { registerFiscalInvoice } from "../lib/fiscalQueue";
import { onBoletoAsyncPaymentSucceeded } from "./stripe";

const USER = "11111111-1111-1111-1111-111111111111";
const SUB_ROW = "22222222-2222-2222-2222-222222222222";

function boletoPago() {
  return {
    id: "evt_boleto_pago",
    type: "checkout.session.async_payment_succeeded",
    created: 1756400000,
    data: {
      object: {
        id: "cs_test_boleto",
        payment_status: "paid",
        amount_total: 15540,
        payment_intent: "pi_boleto_1",
        metadata: {
          payment_method: "boleto",
          access_days: "365",
          supabase_user_id: USER,
          plan_id: "pro_annual",
        },
      },
    },
  } as unknown as Parameters<typeof onBoletoAsyncPaymentSucceeded>[0];
}

beforeEach(() => {
  estado.upsertsFiscais = [];
  estado.jobs = [];
  estado.meios = ["cartao", "pix", "boleto"];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("boleto pago segue registrando a nota da Stripe", () => {
  it("chave stripe:, provedor stripe e stripe_charge_id preenchido", async () => {
    await onBoletoAsyncPaymentSucceeded(
      boletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    expect(estado.upsertsFiscais).toHaveLength(1);
    expect(estado.upsertsFiscais[0].carga).toMatchObject({
      user_id: USER,
      subscription_id: SUB_ROW,
      payment_provider: "stripe",
      charge_key: "stripe:ch_boleto_1",
      stripe_charge_id: "ch_boleto_1",
      stripe_invoice_id: null,
      stripe_payment_intent_id: "pi_boleto_1",
      status: "awaiting_batch",
      competencia: "2026-08-29",
      meio_pagamento: "boleto",
      amount_cents: 15540,
      plan_code: "pro_annual",
    });
    expect(estado.upsertsFiscais[0].opcoes).toEqual({
      onConflict: "charge_key",
      ignoreDuplicates: true,
    });
    expect(estado.jobs).toEqual([]);
  });

  it("boleto fora de NFSE_MEIOS_EMISSAO nao gera linha", async () => {
    estado.meios = ["cartao", "pix"];
    await onBoletoAsyncPaymentSucceeded(
      boletoPago(),
      new Date("2026-08-29T12:00:00.000Z"),
    );

    expect(estado.upsertsFiscais).toEqual([]);
    expect(estado.jobs).toEqual([]);
  });
});

describe("fatura paga (cartao) segue registrando a nota da Stripe", () => {
  it("o input do gancho da fatura vira chave stripe: e stripe_charge_id", async () => {
    await registerFiscalInvoice({
      userId: USER,
      subscriptionId: SUB_ROW,
      paymentProvider: "stripe",
      providerChargeId: "ch_cartao_1",
      stripeInvoiceId: "in_cartao_1",
      stripePaymentIntentId: "pi_cartao_1",
      amountCents: 2990,
      planCode: "pro_monthly",
      periodStart: "2026-09-01T00:00:00.000Z",
      periodEnd: "2026-10-01T00:00:00.000Z",
      meio: "cartao",
      occurredAt: "2026-09-01T15:00:00.000Z",
    });

    expect(estado.upsertsFiscais).toHaveLength(1);
    expect(estado.upsertsFiscais[0].carga).toMatchObject({
      payment_provider: "stripe",
      charge_key: "stripe:ch_cartao_1",
      stripe_charge_id: "ch_cartao_1",
      stripe_invoice_id: "in_cartao_1",
      stripe_payment_intent_id: "pi_cartao_1",
      status: "awaiting_batch",
      competencia: "2026-09-01",
      meio_pagamento: "cartao",
      amount_cents: 2990,
    });
    // Registro imediato, emissao adiada (R2).
    expect(estado.jobs).toEqual([]);
  });

  it("competencia e o dia de BRASILIA da venda: 23:30 de 31/10 e outubro", async () => {
    await registerFiscalInvoice({
      userId: USER,
      subscriptionId: SUB_ROW,
      paymentProvider: "stripe",
      providerChargeId: "ch_cartao_2",
      stripeInvoiceId: null,
      stripePaymentIntentId: null,
      amountCents: 2990,
      planCode: "pro_monthly",
      periodStart: null,
      periodEnd: null,
      meio: "cartao",
      occurredAt: "2026-11-01T02:30:00.000Z",
    });

    expect(estado.upsertsFiscais[0].carga).toMatchObject({
      competencia: "2026-10-31",
    });
  });

  it("meio que nao se classifica nao gera linha", async () => {
    const decisao = await registerFiscalInvoice({
      userId: USER,
      subscriptionId: SUB_ROW,
      paymentProvider: "stripe",
      providerChargeId: "ch_link_1",
      stripeInvoiceId: null,
      stripePaymentIntentId: null,
      amountCents: 2990,
      planCode: "pro_monthly",
      periodStart: null,
      periodEnd: null,
      meio: null,
      occurredAt: "2026-09-01T15:00:00.000Z",
    });

    expect(decisao).toEqual({ elegivel: false, motivo: "meio_desconhecido" });
    expect(estado.upsertsFiscais).toEqual([]);
  });

  it("venda antes do corte nao gera linha", async () => {
    const decisao = await registerFiscalInvoice({
      userId: USER,
      subscriptionId: SUB_ROW,
      paymentProvider: "stripe",
      providerChargeId: "ch_antigo",
      stripeInvoiceId: null,
      stripePaymentIntentId: null,
      amountCents: 2990,
      planCode: "pro_monthly",
      periodStart: null,
      periodEnd: null,
      meio: "cartao",
      // 23:59 de 31/07 em Brasilia; o corte deste arquivo e 2026-08-01.
      occurredAt: "2026-08-01T02:59:00.000Z",
    });

    expect(decisao).toEqual({ elegivel: false, motivo: "before_cutoff" });
    expect(estado.upsertsFiscais).toEqual([]);
  });
});
