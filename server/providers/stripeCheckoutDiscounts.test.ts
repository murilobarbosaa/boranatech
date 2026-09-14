import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  affiliate: {
    id: "aff-1",
    code: "AFILIADO20",
    discount_percent: 20,
  } as Record<string, unknown> | null,
  coupon: null as Record<string, unknown> | null,
  subscriptionLookupError: null as Record<string, unknown> | null,
  sessions: [] as Array<Record<string, unknown>>,
}));

vi.mock("../lib/env", () => ({
  env: {
    appPublicUrl: "https://exemplo.com",
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    stripePriceIds: {
      pro_monthly: "price_m",
      pro_semiannual: "price_s",
      pro_annual: "price_a",
    },
  },
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    coupons: {
      retrieve: async () => ({ id: "coupon-existente" }),
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          estado.sessions.push(params);
          return {
            id: "cs_1",
            url: "https://stripe.test/checkout",
            subscription: "sub_1",
          };
        },
      },
    },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

vi.mock("../lib/supabaseAdmin", () => {
  function query(table: string) {
    const q: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "not", "limit"]) {
      q[method] = () => q;
    }
    q.maybeSingle = async () => {
      if (table === "subscriptions") {
        return { data: null, error: estado.subscriptionLookupError };
      }
      return {
        data: table === "affiliates" ? estado.affiliate : null,
        error: null,
      };
    };
    q.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    return q;
  }

  return {
    supabaseAdmin: {
      from: (table: string) => query(table),
      // Formato do cliente real: o supabase-js SEMPRE devolve { data, error }.
      // `vi.fn()` puro devolvia undefined, o que nenhuma chamada real faz.
      rpc: vi.fn(async () => ({ data: null, error: null })),
    },
  };
});

vi.mock("../lib/coupons", () => ({
  findValidCoupon: async () => estado.coupon,
}));
vi.mock("@sentry/node", () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock("../lib/fiscalQueue", () => ({ registerFiscalInvoice: vi.fn() }));
vi.mock("../lib/fiscalRefund", () => ({
  applyRefundToFiscalInvoice: vi.fn(),
}));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: vi.fn(),
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: vi.fn() }));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: vi.fn(),
}));
vi.mock("../lib/paymentMethod", () => ({
  patchDeMeioDePagamento: () => ({}),
}));

import { stripeProvider } from "./stripe";

function input(paymentMethod: "card" | "boleto") {
  return {
    user: { id: "user-1", email: "pessoa@exemplo.com" },
    planId: "pro_annual",
    affiliateCode: "AFILIADO20",
    couponCode: "",
    paymentMethod,
  } as const;
}

beforeEach(() => {
  estado.sessions = [];
  estado.affiliate = {
    id: "aff-1",
    code: "AFILIADO20",
    discount_percent: 20,
  };
  estado.coupon = null;
  estado.subscriptionLookupError = null;
});

describe("desconto Stripe preservado", () => {
  it.each(["card", "boleto"] as const)(
    "%s continua enviando o coupon de afiliado para a sessao",
    async (paymentMethod) => {
      await stripeProvider.createCheckout(input(paymentMethod));

      expect(estado.sessions).toHaveLength(1);
      expect(estado.sessions[0].discounts).toEqual([
        { coupon: "bnt_aff_20_once" },
      ]);
      expect(estado.sessions[0].metadata).toMatchObject({
        affiliate_code: "AFILIADO20",
        coupon_code: "",
      });
    },
  );

  it.each([
    { paymentMethod: "card", promotion: "affiliate" },
    { paymentMethod: "boleto", promotion: "affiliate" },
    { paymentMethod: "card", promotion: "coupon" },
    { paymentMethod: "boleto", promotion: "coupon" },
  ] as const)(
    "$paymentMethod propaga falha de elegibilidade com $promotion e nao cria sessao",
    async ({ paymentMethod, promotion }) => {
      estado.subscriptionLookupError = {
        message: "database unavailable",
      };

      await expect(
        stripeProvider.createCheckout({
          ...input(paymentMethod),
          affiliateCode: promotion === "affiliate" ? "AFILIADO20" : "",
          couponCode: promotion === "coupon" ? "PROMO30" : "",
        }),
      ).rejects.toMatchObject({
        statusCode: 500,
        code: "db_error",
        message:
          "Não foi possível verificar a elegibilidade do desconto. Tente novamente.",
      });

      expect(estado.sessions).toHaveLength(0);
    },
  );

  it.each(["card", "boleto"] as const)(
    "%s preserva a precedencia do cupom sem perder a atribuicao",
    async (paymentMethod) => {
      estado.coupon = {
        code: "PROMO30",
        discount_percent: 30,
        applicable_plans: null,
      };

      await stripeProvider.createCheckout({
        ...input(paymentMethod),
        couponCode: "PROMO30",
      });

      expect(estado.sessions).toHaveLength(1);
      expect(estado.sessions[0].discounts).toEqual([
        { coupon: "bnt_promo_30_once" },
      ]);
      expect(estado.sessions[0].metadata).toMatchObject({
        affiliate_code: "AFILIADO20",
        coupon_code: "PROMO30",
      });
    },
  );
});
