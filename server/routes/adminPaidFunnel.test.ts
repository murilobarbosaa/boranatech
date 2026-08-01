import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FUNIL ATE O ASSINANTE PAGO: a juncao de duas fontes.
 *
 * O que estes testes protegem nao e a aritmetica (isso e `paidFunnel.test.ts`),
 * e sim a JUNCAO: que o passo do banco seja a intersecao com quem iniciou
 * checkout, que a janela seja a mesma dos dois lados, que quem pagou sem rastro
 * no PostHog fique FORA do funil e declarado, e que o PostHog fora do ar nao
 * apague o fato que veio do banco.
 *
 * O PostHog e dublado por mock de modulo: `getPaidFunnelSignals` e a fronteira,
 * entao o teste controla o que ela devolve sem tocar em rede.
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
  getStripe: () => ({}),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/stripeSync", () => ({ syncBalanceTransactions: vi.fn() }));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: vi.fn(),
  getCachedProStatus: async () => null,
  setCachedProStatus: async () => {},
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _r: unknown,
    next: () => void,
  ) => {
    req.user = { id: "admin-1", email: "a@x.com", role: "authenticated" };
    next();
  },
  requireAdmin: (_q: unknown, _r: unknown, next: () => void) => next(),
  checkProStatus: (_q: unknown, _r: unknown, next: () => void) => next(),
  requirePro: (_q: unknown, _r: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_q: unknown, _r: unknown, next: () => void) => next(),
  resolveProStatus: async () => false,
  isDevProUser: () => false,
}));

const posthogMock = vi.hoisted(() => ({
  sinais: null as unknown,
}));
vi.mock("../lib/posthog", () => ({
  getPaidFunnelSignals: async () => posthogMock.sinais,
  getPosthogStats: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogHealth: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogPersonActivity: async () => ({ state: "error", reason: "n/a" }),
  getPosthogFeatureUsage: async () => ({ state: "error", reason: "n/a" }),
}));

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

function montar(respostas: Record<string, RespostaTabela>) {
  estado.double = criarSupabaseDouble(respostas, {}, undefined, 1000);
}

/** Uma assinatura PAGA (tem período de acesso) do usuário dado. */
function paga(userId: string) {
  return {
    id: `s-${userId}`,
    user_id: userId,
    status: "active",
    current_period_start: "2026-07-20T10:00:00Z",
    created_at: "2026-07-20T10:00:00Z",
    plans: { price_cents: 22200 },
  };
}

/** Boleto emitido e NÃO pago: sem período de acesso. */
function boletoPendente(userId: string) {
  return {
    id: `s-${userId}`,
    user_id: userId,
    status: "pending",
    current_period_start: null,
    created_at: "2026-07-29T01:00:00Z",
    plans: { price_cents: 22200 },
  };
}

function sinaisOk(
  over: Partial<{
    visitantes: number;
    cadastros: number;
    checkoutIds: string[];
    retornoIds: string[];
    truncated: boolean;
  }> = {},
) {
  posthogMock.sinais = {
    state: "ok",
    signals: {
      visitantes: 1000,
      cadastros: 500,
      checkoutIds: [],
      retornoIds: [],
      truncated: false,
      ...over,
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /paid-funnel", () => {
  it("o passo final é a INTERSEÇÃO, não a razão dos totais", async () => {
    // 3 iniciaram checkout; 2 deles pagaram. Um terceiro pagante (u9) nunca
    // apareceu no PostHog: ele NÃO entra no funil, senão o passo final falaria
    // de uma população que não está no denominador.
    sinaisOk({ checkoutIds: ["u1", "u2", "u3"] });
    montar({ subscriptions: { rows: [paga("u1"), paga("u2"), paga("u9")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.status).toBe(200);
    const passos = r.body.data.steps;
    expect(passos[2].people).toBe(3);
    expect(passos[3].people).toBe(2);
    expect(r.body.data.pagantesNaJanela).toBe(3);
    expect(r.body.data.assinantesSemRastro).toBe(1);
  });

  it("a conversão de cada passo sai calculada", async () => {
    sinaisOk({ visitantes: 1000, cadastros: 200, checkoutIds: ["u1", "u2"] });
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    const passos = r.body.data.steps;
    expect(passos[1].conversionFromPrev).toBeCloseTo(20, 5);
    expect(passos[2].conversionFromPrev).toBeCloseTo(1, 5);
    expect(passos[3].conversionFromPrev).toBeCloseTo(50, 5);
  });

  it("o maior vazamento vem identificado", async () => {
    sinaisOk({
      visitantes: 1000,
      cadastros: 900,
      checkoutIds: Array.from({ length: 30 }, (_, i) => `u${i}`),
    });
    montar({
      subscriptions: {
        rows: Array.from({ length: 25 }, (_, i) => paga(`u${i}`)),
      },
    });

    const r = await chamarAdmin("GET", "/paid-funnel");

    // 900 -> 30 é 3,3%; 30 -> 25 é 83%. O pior é o do meio.
    expect(r.body.data.biggestLeak.stepId).toBe("checkout");
  });

  it("a última etapa DECLARA que a fonte mudou", async () => {
    sinaisOk({ checkoutIds: ["u1"] });
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    const passos = r.body.data.steps;
    expect(
      passos.slice(0, 3).every((p: { fonte: string }) => p.fonte === "posthog"),
    ).toBe(true);
    expect(passos[3].fonte).toBe("posthog+banco");
  });

  it("amostra pequena dispara no passo cuja BASE é pequena", async () => {
    sinaisOk({ visitantes: 1000, cadastros: 800, checkoutIds: ["u1", "u2"] });
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    const passos = r.body.data.steps;
    expect(passos[1].smallSample).toBe(false);
    expect(passos[2].smallSample).toBe(false);
    // Base 2, abaixo do limiar de 20: a taxa de 50% é ruído.
    expect(passos[3].smallSample).toBe(true);
  });

  it("boleto emitido e NÃO pago fica fora do funil, e é declarado", async () => {
    sinaisOk({ checkoutIds: ["u1", "u2"] });
    montar({ subscriptions: { rows: [paga("u1"), boletoPendente("u2")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.body.data.steps[3].people).toBe(1);
    expect(r.body.data.boletosPendentes).toEqual({ count: 1, cents: 22200 });
  });

  it("PostHog fora NÃO derruba o bloco: o fato do banco sobrevive", async () => {
    posthogMock.sinais = { state: "error", reason: "timeout", httpStatus: 504 };
    montar({ subscriptions: { rows: [paga("u1"), paga("u2")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.status).toBe(200);
    expect(r.body.data.posthog.state).toBe("error");
    expect(r.body.data.steps).toEqual([]);
    // O número que veio de dentro de casa continua lá.
    expect(r.body.data.pagantesNaJanela).toBe(2);
  });

  it("PostHog não configurado degrada igual, sem virar erro de rota", async () => {
    posthogMock.sinais = {
      state: "not_configured",
      missing: ["POSTHOG_API_KEY"],
    };
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.status).toBe(200);
    expect(r.body.data.posthog.state).toBe("not_configured");
    expect(r.body.data.pagantesNaJanela).toBe(1);
  });

  it("a janela é a MESMA nos dois lados, e vem declarada", async () => {
    sinaisOk({ checkoutIds: ["u1"] });
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.body.data.janela.days).toBe(30);
    const de = Date.parse(r.body.data.janela.from);
    const ate = Date.parse(r.body.data.janela.to);
    expect(Math.round((ate - de) / (24 * 3600_000))).toBe(30);

    // E o banco foi lido COM esse recorte, não sem filtro: a janela declarada
    // na resposta e a janela consultada precisam ser a mesma coisa.
    const filtros = estado.double
      .de("subscriptions")
      .flatMap((c) => c.filtros)
      .filter((f) => f.coluna === "created_at");
    expect(filtros.find((f) => f.tipo === "gte")!.valor).toBe(
      r.body.data.janela.from,
    );
    expect(filtros.find((f) => f.tipo === "lte")!.valor).toBe(
      r.body.data.janela.to,
    );
  });

  it("o retorno da Stripe é anotação, não etapa, e conta quem voltou e assinou", async () => {
    sinaisOk({ checkoutIds: ["u1", "u2", "u3"], retornoIds: ["u2", "u3"] });
    montar({ subscriptions: { rows: [paga("u1"), paga("u2")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.body.data.steps).toHaveLength(4);
    expect(r.body.data.retornos).toEqual({ pessoas: 2, converteramDepois: 1 });
  });

  it("a leitura do banco é PAGINADA: base acima do teto não encolhe", async () => {
    const ids = Array.from({ length: 1500 }, (_, i) => `u${i}`);
    sinaisOk({ visitantes: 5000, cadastros: 3000, checkoutIds: ids });
    montar({ subscriptions: { rows: ids.map((id) => paga(id)) } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    // Sem paginar, o PostgREST cortaria em 1000 e a conversão final cairia para
    // 66% sem nada acusar.
    expect(r.body.data.steps[3].people).toBe(1500);
  });

  it("truncamento da junção é propagado, não escondido", async () => {
    sinaisOk({ checkoutIds: ["u1"], truncated: true });
    montar({ subscriptions: { rows: [paga("u1")] } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.body.data.truncated).toBe(true);
  });

  it("erro de banco é fail-loud: 500, não funil zerado", async () => {
    sinaisOk({ checkoutIds: ["u1"] });
    montar({ subscriptions: { error: { message: "boom" } } });

    const r = await chamarAdmin("GET", "/paid-funnel");

    expect(r.status).toBe(500);
  });
});
