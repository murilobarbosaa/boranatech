import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VIOLACAO DE UNICIDADE NA RECONCILIACAO (23505).
 *
 * A fase 1 do `reconcile-subscriptions` seleciona linhas 'incomplete' e pode
 * escrever 'active'. Com o indice parcial `subscriptions_one_active_per_user`
 * (migration 20260829120000) aplicado, essa escrita bate no indice quando o dono
 * JA tem assinatura ativa, e o banco recusa com 23505.
 *
 * O 23505 aqui e o veredito CORRETO, nao um defeito a corrigir: a escrita e uma
 * so (diferente do par que a ativacao de boleto tinha), entao nao ha estado
 * intermediario a proteger. O que faltava era alguem OLHAR. Duas assinaturas do
 * mesmo dono chegando a 'active' significa possivel pagamento duplo, e um
 * contador `failed` subindo no payload da rodada nao faz ninguem agir: a linha
 * some no meio do relatorio e volta identica na rodada seguinte, para sempre.
 *
 * Estes casos travam as duas metades da decisao: 23505 captura no Sentry E
 * propaga; qualquer outra falha propaga como sempre propagou, SEM captura.
 */

const estado = vi.hoisted(() => ({
  /** Estado que a Stripe devolve para a assinatura. */
  stripeState: {
    status: "active",
    currentPeriodStart: "2026-08-01T00:00:00.000Z",
    currentPeriodEnd: "2026-09-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    canceledAt: null as string | null,
  },
  /** Erro que o UPDATE devolve, ou null para sucesso. */
  updateError: null as { code?: string; message: string } | null,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
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
    stripePriceIds: { pro_monthly: "p", pro_semiannual: "p", pro_annual: "p" },
    stripeWebhookSecret: "whsec_x",
    appUrl: "https://exemplo.com",
    stripeSecretKey: "sk_test_x",
    billingEnabled: false,
    cronSecret: "s",
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100,
  },
}));
// cron.ts arrasta o modulo de IA no import; mocado so para o arquivo carregar.
vi.mock("../lib/openai", () => ({ getOpenAI: () => ({}), openai: {} }));
vi.mock("../lib/aiEnrich", () => ({ enrichNews: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("este teste nao chama a Stripe diretamente");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));

vi.mock("@sentry/node", () => ({
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ mensagem, opcoes });
  },
  captureException: () => {},
  addBreadcrumb: () => {},
}));

// O estado vivo da Stripe e a entrada da funcao; o duble o entrega direto.
vi.mock("../providers/stripe", () => ({
  getStripeSubscriptionState: async () => estado.stripeState,
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta() {
    const q: Record<string, unknown> = {};
    q.update = () => q;
    q.select = () => q;
    q.eq = async () => ({ data: null, error: estado.updateError });
    return q;
  }
  return { supabaseAdmin: { from: () => consulta() } };
});

import { reconcileStripeRow } from "./cron";

const LINHA_INCOMPLETE = {
  id: "sub-nova",
  user_id: "user-1",
  provider: "stripe",
  status: "incomplete",
  provider_subscription_id: "sub_stripe_123",
  current_period_end: null,
};

describe("23505 na ativacao: captura no Sentry e propaga", () => {
  beforeEach(() => {
    estado.capturas = [];
    estado.updateError = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("propaga o erro, como sempre propagou", async () => {
    estado.updateError = {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    };

    await expect(reconcileStripeRow(LINHA_INCOMPLETE)).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("captura no Sentry com o contexto que a investigacao precisa", async () => {
    estado.updateError = {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    };

    await expect(reconcileStripeRow(LINHA_INCOMPLETE)).rejects.toThrow();

    expect(estado.capturas).toHaveLength(1);
    const captura = estado.capturas[0];
    expect(captura.mensagem).toBe("stripe_reconcile_assinatura_duplicada");
    expect(captura.opcoes.level).toBe("error");
    expect(captura.opcoes.extra).toMatchObject({
      user_id: "user-1",
      subscription_id: "sub-nova",
      provider_subscription_id: "sub_stripe_123",
      status_anterior: "incomplete",
      status_pretendido: "active",
    });
  });

  it("fingerprint fixo: serie no tempo, nao uma issue por assinatura", async () => {
    estado.updateError = { code: "23505", message: "duplicate key" };
    await expect(reconcileStripeRow(LINHA_INCOMPLETE)).rejects.toThrow();

    expect(estado.capturas[0].opcoes.fingerprint).toEqual([
      "stripe-reconcile-assinatura-duplicada",
    ]);
  });
});

describe("as demais falhas seguem exatamente como antes", () => {
  beforeEach(() => {
    estado.capturas = [];
    estado.updateError = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("erro que NAO e 23505 propaga SEM captura", async () => {
    estado.updateError = { code: "57014", message: "statement timeout" };

    await expect(reconcileStripeRow(LINHA_INCOMPLETE)).rejects.toMatchObject({
      code: "57014",
    });
    expect(estado.capturas).toEqual([]);
  });

  it("erro SEM code propaga SEM captura", async () => {
    estado.updateError = { message: "falha de rede" };

    await expect(reconcileStripeRow(LINHA_INCOMPLETE)).rejects.toThrow();
    expect(estado.capturas).toEqual([]);
  });

  it("sucesso nao captura nada e devolve o desfecho de ativacao", async () => {
    estado.updateError = null;

    const resultado = await reconcileStripeRow(LINHA_INCOMPLETE);

    expect(estado.capturas).toEqual([]);
    expect(resultado).toMatchObject({ outcome: "activated" });
  });
});
