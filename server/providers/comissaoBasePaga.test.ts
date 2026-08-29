import { describe, expect, it, vi } from "vitest";

import { paidAmountCentsFromEvent } from "./stripe";

/**
 * BASE DA COMISSAO DE AFILIADO: valor pago, nunca preco de tabela.
 *
 * O defeito que estes testes travam: a aritmetica da comissao mora num lugar so
 * (a funcao SQL `increment_affiliate_conversion`, que faz
 * `round(p_revenue_cents * commission_percent / 100.0)`), mas ela era alimentada
 * por DOIS caminhos com bases diferentes. O cartao mandava
 * `price.unit_amount`, o preco cadastrado na Stripe, que nao enxerga desconto
 * nenhum: os `discounts` sao aplicados na SESSAO, nao no Price. O boleto mandava
 * `session.amount_total`, o valor real. Resultado: a mesma venda com cupom
 * rendia comissoes diferentes conforme o meio de pagamento, e a do cartao era
 * calculada sobre dinheiro que ninguem recebeu.
 *
 * O teste e sobre o NUMERO que sai para a comissao, nao sobre o formato da
 * chamada: por isso exercita a funcao contra objetos de evento reais em vez de
 * inspecionar a query.
 */

// stripe.ts monta PLAN_BY_PRICE a partir de env.stripePriceIds no load do
// modulo, entao o import precisa de env mesmo para uma funcao pura. No CI nao
// existe .env (CLAUDE.md), e o mock e o que mantem este teste rodando sem segredo.
vi.mock("../lib/env", () => ({
  env: {
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

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      throw new Error("nenhum teste deste arquivo toca o banco");
    },
    rpc: () => {
      throw new Error("nenhum teste deste arquivo toca o banco");
    },
  },
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("nenhum teste deste arquivo chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

/** Preco de tabela do mensal: 29,90 em centavos. */
const MENSAL_TABELA_CENTS = 2990;
/** Mesmo mensal com cupom de 30 por cento: o que a pessoa de fato paga. */
const MENSAL_COM_CUPOM_CENTS = 2093;

type EventoFalso = Parameters<typeof paidAmountCentsFromEvent>[0];

function evento(type: string, object: Record<string, unknown>): EventoFalso {
  return { type, data: { object } } as unknown as EventoFalso;
}

describe("venda com cupom: a base e o valor pago, nao o preco de tabela", () => {
  it("checkout de cartao com 30 por cento de desconto devolve 2093, nao 2990", () => {
    const lido = paidAmountCentsFromEvent(
      evento("checkout.session.completed", {
        payment_status: "paid",
        amount_total: MENSAL_COM_CUPOM_CENTS,
      }),
    );

    expect(lido).toBe(MENSAL_COM_CUPOM_CENTS);
    expect(lido).not.toBe(MENSAL_TABELA_CENTS);
  });

  it("renovacao por fatura usa amount_paid, tambem ja descontado", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("invoice.paid", { amount_paid: MENSAL_COM_CUPOM_CENTS }),
      ),
    ).toBe(MENSAL_COM_CUPOM_CENTS);
  });

  it("boleto e cartao leem o MESMO numero para a mesma venda", () => {
    const cartao = paidAmountCentsFromEvent(
      evento("checkout.session.completed", {
        payment_status: "paid",
        amount_total: MENSAL_COM_CUPOM_CENTS,
      }),
    );
    const boleto = paidAmountCentsFromEvent(
      evento("checkout.session.async_payment_succeeded", {
        payment_status: "paid",
        amount_total: MENSAL_COM_CUPOM_CENTS,
      }),
    );

    expect(cartao).toBe(boleto);
  });

  it("sem desconto, a base continua sendo o valor cheio", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("checkout.session.completed", {
          payment_status: "paid",
          amount_total: MENSAL_TABELA_CENTS,
        }),
      ),
    ).toBe(MENSAL_TABELA_CENTS);
  });
});

describe("ausencia de cobranca e null, e null nao e zero", () => {
  it("customer.subscription.updated nao declara valor: null", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("customer.subscription.updated", { id: "sub_1" }),
      ),
    ).toBeNull();
  });

  it("customer.subscription.deleted tambem: null", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("customer.subscription.deleted", { id: "sub_1" }),
      ),
    ).toBeNull();
  });

  it("sessao ainda nao paga nao vira base de comissao", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("checkout.session.completed", {
          payment_status: "unpaid",
          amount_total: MENSAL_COM_CUPOM_CENTS,
        }),
      ),
    ).toBeNull();
  });

  it("cobranca de valor ZERO e zero, nao null: 100 por cento descontado foi uma venda", () => {
    // 'no_payment_required' e o que a Stripe devolve num mode:subscription
    // integralmente descontado. Devolver null aqui faria o log de "sem valor
    // declarado" disparar numa venda que declarou, sim, o valor dela: zero.
    expect(
      paidAmountCentsFromEvent(
        evento("checkout.session.completed", {
          payment_status: "no_payment_required",
          amount_total: 0,
        }),
      ),
    ).toBe(0);
  });

  it("fatura de valor zero tambem devolve zero", () => {
    expect(
      paidAmountCentsFromEvent(evento("invoice.paid", { amount_paid: 0 })),
    ).toBe(0);
  });
});

describe("campo ausente no objeto do evento", () => {
  it("sessao paga sem amount_total devolve null, nunca um numero inventado", () => {
    expect(
      paidAmountCentsFromEvent(
        evento("checkout.session.completed", { payment_status: "paid" }),
      ),
    ).toBeNull();
  });

  it("fatura sem amount_paid devolve null", () => {
    expect(paidAmountCentsFromEvent(evento("invoice.paid", {}))).toBeNull();
  });
});
