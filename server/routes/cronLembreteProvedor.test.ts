import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QUEM RECEBE LEMBRETE DE RENOVACAO.
 *
 * O lembrete leva a `POST /api/billing/renew`, que tem provider e metodo FIXOS
 * EM DURO (`stripeProvider`, `paymentMethod: "boleto"`). Um assinante Pix
 * receberia um e-mail de boleto e o clique geraria cobranca na Stripe, no
 * provedor errado. A exclusao e por PROVEDOR e nao por metodo, porque a pergunta
 * e quem renova, nao como a pessoa pagou.
 *
 * O dube APLICA os filtros. Um que so registrasse a query provaria a intencao,
 * nao quais linhas ela pega, e "quais linhas" e a pergunta perigosa: larga
 * demais manda e-mail errado, estreita demais deixa assinante sem aviso de
 * vencimento.
 */

const estado = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
}));

vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    stripePriceIds: { pro_monthly: "p", pro_semiannual: "p", pro_annual: "p" },
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    billingEnabled: false,
    asaasEnabled: false,
    cronSecret: "s",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100,
  },
}));
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("este teste nao chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta() {
    const iguais: Record<string, unknown> = {};
    const diferentes: Record<string, unknown> = {};
    let maiorQue: { coluna: string; valor: string } | null = null;
    let menorIgual: { coluna: string; valor: string } | null = null;

    const casa = (row: Record<string, unknown>) =>
      Object.entries(iguais).every(([c, v]) => row[c] === v) &&
      Object.entries(diferentes).every(([c, v]) => row[c] !== v) &&
      (maiorQue === null ||
        (typeof row[maiorQue.coluna] === "string" &&
          String(row[maiorQue.coluna]) > maiorQue.valor)) &&
      (menorIgual === null ||
        (typeof row[menorIgual.coluna] === "string" &&
          String(row[menorIgual.coluna]) <= menorIgual.valor));

    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.order = () => q;
    q.eq = (coluna: string, valor: unknown) => {
      iguais[coluna] = valor;
      return q;
    };
    q.neq = (coluna: string, valor: unknown) => {
      diferentes[coluna] = valor;
      return q;
    };
    q.gt = (coluna: string, valor: string) => {
      maiorQue = { coluna, valor };
      return q;
    };
    q.lte = (coluna: string, valor: string) => {
      menorIgual = { coluna, valor };
      return q;
    };
    q.range = async () => ({ data: estado.rows.filter(casa), error: null });
    return q;
  }
  return { supabaseAdmin: { from: () => consulta() } };
});

import { selecionarAssinaturasAVencer } from "./cron";

const AGORA = "2026-09-01T00:00:00.000Z";
const JANELA = "2026-10-02T00:00:00.000Z";
/** Dentro da janela de lembrete. */
const VENCE_EM_BREVE = "2026-09-20T00:00:00.000Z";

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    user_id: "u1",
    provider: "stripe",
    renewal_type: "manual",
    status: "active",
    current_period_end: VENCE_EM_BREVE,
    renewal_reminders_sent: [],
    plan_id: "plan-1",
    ...over,
  };
}

async function selecionadas() {
  const r = (await selecionarAssinaturasAVencer(0, 99, AGORA, JANELA)) as {
    data: Array<Record<string, unknown>>;
  };
  return r.data;
}

describe("assinante Pix NAO recebe lembrete de renovacao", () => {
  beforeEach(() => {
    estado.rows = [];
  });

  it("linha Pix ativa dentro da janela nao e selecionada", async () => {
    estado.rows = [
      linha({ id: "pix", provider: "asaas", payment_method: "pix" }),
    ];

    expect(await selecionadas()).toEqual([]);
  });

  it("linha de BOLETO equivalente segue selecionada (regressao)", async () => {
    // O boleto tem os MESMOS `renewal_type`, `status` e vencimento. A unica
    // diferenca e o provedor, e e essa a diferenca que decide.
    estado.rows = [
      linha({ id: "boleto", provider: "stripe", payment_method: "boleto" }),
    ];

    const out = await selecionadas();
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("boleto");
  });

  it("mistura realista: so o boleto sai", async () => {
    estado.rows = [
      linha({ id: "pix", provider: "asaas", payment_method: "pix" }),
      linha({ id: "boleto", provider: "stripe", payment_method: "boleto" }),
    ];

    const out = await selecionadas();
    expect(out.map((r) => r.id)).toEqual(["boleto"]);
  });
});

describe("os demais filtros continuam valendo", () => {
  beforeEach(() => {
    estado.rows = [];
  });

  it("cartao (renewal_type auto) nunca entrou e continua fora", async () => {
    estado.rows = [linha({ id: "cartao", renewal_type: "auto" })];
    expect(await selecionadas()).toEqual([]);
  });

  it("assinatura ja cancelada fica fora", async () => {
    estado.rows = [linha({ id: "morta", status: "canceled" })];
    expect(await selecionadas()).toEqual([]);
  });

  it("vencimento fora da janela fica fora, dos dois lados", async () => {
    estado.rows = [
      linha({
        id: "ja-venceu",
        current_period_end: "2026-08-01T00:00:00.000Z",
      }),
      linha({ id: "longe", current_period_end: "2027-01-01T00:00:00.000Z" }),
    ];
    expect(await selecionadas()).toEqual([]);
  });
});
