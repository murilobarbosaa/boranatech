import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GET /users-active-daily: a JANELA.
 *
 * Duas propriedades, e as duas falham em silencio se ninguem travar:
 *
 *   1. Janela invalida RECUSA. O padrao da casa no /signup-history e cair no
 *      "30" calado, e aqui isso seria pior: o grafico desenharia trinta dias
 *      corretos sob um rotulo que a pessoa acha que pediu de outro periodo.
 *      Um seletor quebrado ficaria invisivel para sempre.
 *
 *   2. A chave de cache CARREGA a janela. Com uma chave so, trocar de periodo
 *      devolveria o cacheado do anterior por ate cinco minutos, e o grafico
 *      mudaria de rotulo sem mudar de dado, que e a mesma mentira com outra
 *      causa.
 *
 * O QUE SE AFIRMA e `computedAt`, nao tempo de resposta: e o instante em que a
 * computacao REALMENTE rodou, e dois iguais provam que a segunda nao rodou.
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
    posthogApiKey: "phx_teste",
    posthogProjectId: "411657",
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

vi.mock("../lib/posthog", async (importActual) => {
  const real = await importActual<typeof import("../lib/posthog")>();
  return {
    ...real,
    // SO o colaborador e dublado. `isAtivosDiariosJanela` e as constantes de
    // janela continuam sendo as REAIS: e a whitelist de producao que este
    // arquivo testa, e reescreve-la aqui faria o teste concordar consigo mesmo.
    getAtivosDiarios: vi.fn(async (janela: "7" | "30" = "30") => ({
      state: "ok" as const,
      window: janela,
      dias: janela === "7" ? 7 : 30,
      pontos: Array.from({ length: janela === "7" ? 7 : 30 }, (_, i) => ({
        date: `2026-08-${String(i + 1).padStart(2, "0")}`,
        ativos: i,
      })),
    })),
  };
});

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

afterEach(() => {
  vi.clearAllMocks();
  redis.loja.clear();
  redis.gets.length = 0;
  redis.sets.length = 0;
});

describe("GET /users-active-daily: whitelist de janela", () => {
  it("sem parametro assume 30 dias, o contrato documentado", async () => {
    const r = await chamarAdmin("GET", "/users-active-daily");

    expect(r.status).toBe(200);
    expect(r.body.data.state).toBe("ok");
    expect(r.body.data.window).toBe("30");
    expect(r.body.data.pontos).toHaveLength(30);
  });

  it("janela 7 devolve SETE pontos, nao trinta", async () => {
    // CONTROLE do controle: sem ele, "o parametro e aceito" seria compativel
    // com "o parametro e ignorado", e a rota poderia responder 30 dias para
    // qualquer coisa.
    const r = await chamarAdmin("GET", "/users-active-daily?window=7");

    expect(r.status).toBe(200);
    expect(r.body.data.window).toBe("7");
    expect(r.body.data.pontos).toHaveLength(7);
    // A janela CHEGA no colaborador. Sem esta asercao, uma rota que validasse
    // certo e chamasse getAtivosDiarios() sem argumento passaria: o eco viria
    // do default e pareceria correto.
    const { getAtivosDiarios } = await import("../lib/posthog");
    expect(getAtivosDiarios).toHaveBeenCalledWith("7");
  });

  it("janela FORA da whitelist recusa com 400 nomeado, sem fallback calado", async () => {
    const r = await chamarAdmin("GET", "/users-active-daily?window=90");

    expect(r.status).toBe(400);
    expect(r.body.error?.code ?? r.body.code).toBe("invalid_window");
    // E NAO devolveu serie nenhuma: aceitar calado e exatamente o defeito.
    expect(r.body.data).toBeUndefined();
  });

  it("lixo e valor vazio tambem recusam, nao caem no padrao", async () => {
    for (const bruto of ["all", "", "0", "-7", "30d", "abc"]) {
      const r = await chamarAdmin(
        "GET",
        `/users-active-daily?window=${encodeURIComponent(bruto)}`,
      );
      expect(r.status, `window=${bruto} deveria recusar`).toBe(400);
    }
  });
});

describe("GET /users-active-daily: cache por janela", () => {
  it("duas chamadas na MESMA janela recomputam uma vez so", async () => {
    const primeira = await chamarAdmin("GET", "/users-active-daily?window=30");
    const segunda = await chamarAdmin("GET", "/users-active-daily?window=30");

    expect(segunda.body.computedAt).toBe(primeira.body.computedAt);
    expect(redis.sets).toEqual(["admincache:users-active-daily:30"]);
  });

  it("janelas DIFERENTES tem chaves diferentes e computam separado", async () => {
    // O defeito que isto trava: com uma chave so, pedir 7 depois de 30
    // devolveria a serie de 30 com o rotulo de 7, por ate cinco minutos.
    const trinta = await chamarAdmin("GET", "/users-active-daily?window=30");
    const sete = await chamarAdmin("GET", "/users-active-daily?window=7");

    expect(redis.sets).toEqual([
      "admincache:users-active-daily:30",
      "admincache:users-active-daily:7",
    ]);
    expect(sete.body.computedAt).not.toBe(trinta.body.computedAt);
    expect(sete.body.data.pontos).toHaveLength(7);
    expect(trinta.body.data.pontos).toHaveLength(30);
  });
});
