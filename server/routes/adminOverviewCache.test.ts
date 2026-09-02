import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * CACHE DO GET /overview.
 *
 * A rota fazia dez consultas por requisição e o F5 do painel as repetia
 * inteiras: entre 1,4s e 4,2s medidos em 2026-08-22 contra o Supabase de
 * produção. Este arquivo é separado de `adminOverviewCards.test.ts` porque lá o
 * `cacheConnection` é `null` de propósito (as asserções de conteúdo precisam
 * que toda chamada recompute); aqui ele é um Redis de mentira em memória, que é
 * a única forma de o hit existir para ser observado.
 *
 * O QUE SE AFIRMA É `computedAt`, não o tempo de resposta. Cronômetro em teste
 * é medida de carga da máquina; `computedAt` é o instante em que a computação
 * REALMENTE rodou, e dois iguais provam que a segunda não rodou.
 */

const redis = vi.hoisted(() => ({
  loja: new Map<string, string>(),
  gets: [] as string[],
  sets: [] as string[],
}));

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
  cacheConnection: {
    get: async (chave: string) => {
      redis.gets.push(chave);
      return redis.loja.get(chave) ?? null;
    },
    set: async (chave: string, valor: string) => {
      redis.sets.push(chave);
      redis.loja.set(chave, valor);
      return "OK";
    },
  },
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
    aiCostUsdBrlRate: null,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/profilesCount", () => ({
  contarPerfisTotal: vi.fn(async () => 5456),
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
    req.user = { id: "admin-1", email: "admin@exemplo.com" };
    next();
  },
  requireAdmin: (_q: unknown, _r: unknown, next: () => void) => next(),
  checkProStatus: (_q: unknown, _r: unknown, next: () => void) => next(),
  requirePro: (_q: unknown, _r: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_q: unknown, _r: unknown, next: () => void) => next(),
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

function base(over: Record<string, RespostaTabela> = {}) {
  estado.double = criarSupabaseDouble(
    {
      profiles: { rows: [{ created_at: "2026-05-04T00:00:00Z" }], count: 40 },
      subscriptions: { rows: [] },
      influencers: { rows: [] },
      finance_transactions: { rows: [] },
      expenses: { rows: [] },
      ai_usage_logs: { rows: [] },
      subscription_snapshots: { rows: [] },
      ...over,
    },
    {},
    undefined,
    1000,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  redis.loja.clear();
  redis.gets.length = 0;
  redis.sets.length = 0;
});

describe("cache do GET /overview", () => {
  it("duas chamadas na MESMA janela recomputam uma vez só", async () => {
    base();
    const primeira = await chamarAdmin("GET", "/overview?window=30");
    const segunda = await chamarAdmin("GET", "/overview?window=30");

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);
    // O instante da computação é o MESMO: a segunda leu a entrada da primeira.
    expect(segunda.body.computedAt).toBe(primeira.body.computedAt);
    expect(typeof primeira.body.computedAt).toBe("string");
    // E escreveu uma vez, não duas.
    expect(redis.sets).toEqual(["admincache:overview:30"]);
    // CONTROLE NEGATIVO: cachear não pode alterar o que a rota responde.
    expect(segunda.body.data.cards).toEqual(primeira.body.data.cards);
    expect(segunda.body.data.window).toBe("30");
  });

  it("janelas diferentes NÃO dividem a entrada", async () => {
    // O defeito que a chave por janela existe para impedir: seis cards certos
    // sobre o período errado são indistinguíveis dos certos na tela.
    base();
    const trinta = await chamarAdmin("GET", "/overview?window=30");
    const sete = await chamarAdmin("GET", "/overview?window=7");
    const tudo = await chamarAdmin("GET", "/overview?window=all");

    expect(redis.sets).toEqual([
      "admincache:overview:30",
      "admincache:overview:7",
      "admincache:overview:all",
    ]);
    // `computedAt` NAO participa da prova de que computou separado, pelo mesmo
    // motivo registrado em adminActiveDailyWindow.test.ts: as computacoes cabem
    // no mesmo milissegundo, e ai o `not.toBe` reprovava comportamento correto.
    // Quem prova sao os `redis.sets` acima, que so tem tres escritas se as tres
    // rodaram; do timestamp se exige apenas nao andar para tras.
    expect(new Date(sete.body.computedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(trinta.body.computedAt).getTime(),
    );
    expect(new Date(tudo.body.computedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(trinta.body.computedAt).getTime(),
    );
    // Cada uma responde sobre a SUA janela, e o rótulo prova isso.
    expect(sete.body.data.window).toBe("7");
    expect(tudo.body.data.window).toBe("all");
    expect(sete.body.data.windowLabel).not.toBe(trinta.body.data.windowLabel);
  });

  it("erro NÃO vira entrada de cache: a chamada seguinte recomputa", async () => {
    // Um 500 cacheado seria state collapse: a falha de um instante viraria a
    // resposta do painel por até um minuto, e um retry não sairia dela.
    base({ profiles: { rows: [], error: { message: "timeout" } } });
    const falha = await chamarAdmin("GET", "/overview?window=30");
    expect(falha.status).toBe(500);
    expect(redis.sets).toEqual([]);
    expect(redis.loja.size).toBe(0);

    base();
    const sucesso = await chamarAdmin("GET", "/overview?window=30");
    expect(sucesso.status).toBe(200);
    expect(redis.sets).toEqual(["admincache:overview:30"]);
  });

  it("o rótulo da janela fica FORA do cache, recalculado a cada chamada", async () => {
    // Os limites da janela dependem do dia civil corrente. Se entrassem na
    // entrada, uma virada de meia-noite dentro do TTL serviria o intervalo com o
    // nome do dia anterior, e a tela mostraria seis números certos sob um
    // período errado.
    base();
    const primeira = await chamarAdmin("GET", "/overview?window=30");
    const segunda = await chamarAdmin("GET", "/overview?window=30");
    expect(segunda.body.computedAt).toBe(primeira.body.computedAt);
    // O texto veio do `resolverJanela` desta requisição, não da entrada.
    expect(redis.loja.get("admincache:overview:30")).not.toContain(
      segunda.body.data.windowLabel,
    );
    expect(segunda.body.data.windowLabel).toBe(primeira.body.data.windowLabel);
  });
});
