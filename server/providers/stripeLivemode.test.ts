import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * EVENTO DE MODO TESTE NO BANCO DE PRODUÇÃO.
 *
 * Não é hipótese: em 2026-08-14 a varredura achou em `billing_events` de
 * PRODUÇÃO um `checkout.session.completed` de `cs_test_a1hjDcpNU…`
 * (R$ 24,90, 2026-07-15). Ele virou uma das duas sessões "sem linha em
 * subscriptions", ou seja, um falso positivo permanente dentro da única
 * ferramenta que existe para achar pagamento perdido.
 *
 * O que estes testes travam:
 *   - em produção, `livemode:false` NÃO é persistido nem processado;
 *   - a resposta é 2xx, para a Stripe não entrar em loop de retry;
 *   - **fora** de produção nada muda (é lá que evento de teste é o fluxo normal);
 *   - **`livemode:true` continua sendo persistido** — o controle negativo sem o
 *     qual um filtro que barrasse tudo passaria neste arquivo.
 */

const estado = vi.hoisted(() => ({
  isProd: true,
  evento: null as unknown,
  upserts: [] as unknown[],
  breadcrumbs: [] as unknown[],
}));

vi.mock("../lib/env", () => ({
  env: {
    get isProd() {
      return estado.isProd;
    },
    stripeWebhookSecret: "whsec_x",
    stripeSecretKey: "sk_test_x",
    billingEnabled: true,
    appPublicUrl: "https://exemplo.com",
    stripePriceIds: {
      pro_monthly: "price_m",
      pro_semiannual: "price_s",
      pro_annual: "price_a",
    },
  },
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: () => estado.evento },
  }),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => ({
      upsert: (linha: unknown) => {
        estado.upserts.push({ tabela, linha });
        return { select: () => Promise.resolve({ data: [linha], error: null }) };
      },
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

vi.mock("@sentry/node", () => ({
  addBreadcrumb: (b: unknown) => estado.breadcrumbs.push(b),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("../lib/coupons", () => ({ findValidCoupon: vi.fn() }));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: vi.fn(),
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: vi.fn() }));
vi.mock("../lib/stripeSync", () => ({ syncBalanceTransactions: vi.fn() }));
vi.mock("../lib/paymentMethod", () => ({
  patchDeMeioDePagamento: () => ({}),
}));

import { stripeProvider } from "./stripe";

function evento(over: Record<string, unknown> = {}) {
  return {
    id: "evt_1",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    livemode: true,
    data: { object: { id: "sub_1", metadata: {} } },
    ...over,
  };
}

async function chamar() {
  return stripeProvider.handleWebhook({
    headers: { "stripe-signature": "sig" },
    rawBody: Buffer.from("{}"),
  } as never);
}

beforeEach(() => {
  estado.isProd = true;
  estado.upserts = [];
  estado.breadcrumbs = [];
  estado.evento = evento();
});

describe("em produção", () => {
  it("evento de modo teste NÃO é persistido nem processado", async () => {
    estado.evento = evento({ id: "evt_test", livemode: false });

    const r = (await chamar()) as Record<string, unknown>;

    expect(estado.upserts).toEqual([]);
    expect(r.ignoredTestMode).toBe(true);
  });

  it("responde 2xx (não lança), para a Stripe não reenviar em loop", async () => {
    // 4xx/5xx significa "tente de novo" para a Stripe. O evento chegou e foi
    // entendido; a decisão de não guardá-lo é nossa, e um retry não mudaria
    // nada — só multiplicaria o mesmo evento pelo prazo inteiro de retry.
    estado.evento = evento({ livemode: false });

    const r = (await chamar()) as Record<string, unknown>;

    expect(r.received).toBe(true);
  });

  it("deixa rastro no Sentry, sem virar issue", async () => {
    estado.evento = evento({ id: "evt_test", livemode: false });

    await chamar();

    expect(estado.breadcrumbs).toHaveLength(1);
    expect(estado.breadcrumbs[0]).toMatchObject({
      category: "webhook",
      data: { eventId: "evt_test" },
    });
  });

  it("CONTROLE NEGATIVO: evento livemode continua sendo persistido", async () => {
    // Sem este teste, um filtro que barrasse TODO evento passaria nos três
    // anteriores e derrubaria o billing inteiro em silêncio.
    estado.evento = evento({ livemode: true });

    const r = (await chamar()) as Record<string, unknown>;

    expect(estado.upserts).toHaveLength(1);
    expect(estado.upserts[0]).toMatchObject({ tabela: "billing_events" });
    expect(r.ignoredTestMode).toBeUndefined();
  });
});

describe("fora de produção", () => {
  it("evento de modo teste segue o fluxo normal (comportamento preservado)", async () => {
    // É em dev/sandbox que evento de teste é o único que existe. Barrá-lo ali
    // deixaria o ambiente de desenvolvimento sem billing nenhum.
    estado.isProd = false;
    estado.evento = evento({ livemode: false });

    const r = (await chamar()) as Record<string, unknown>;

    expect(estado.upserts).toHaveLength(1);
    expect(r.ignoredTestMode).toBeUndefined();
  });
});
