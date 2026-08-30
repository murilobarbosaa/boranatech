import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GET /signup-history: a JANELA.
 *
 * A rota IRMA (/users-active-daily) nasceu recusando lixo com 400 nomeado; esta
 * caia no padrao calado, e a divergencia ficou registrada como divida. Um
 * seletor quebrado pedindo `window=90` desenhava um grafico CORRETO do periodo
 * ERRADO, e nao ha sintoma nenhum para quem olha.
 *
 * AUSENCIA nao e lixo, e a distincao e o que este arquivo trava nos dois
 * sentidos: sem parametro a rota assume 30 (contrato documentado, e o chamador
 * real depende disso), com parametro invalido ela recusa.
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

function base() {
  estado.double = criarSupabaseDouble({
    profiles: { rows: [{ created_at: "2026-05-04T00:00:00Z" }], count: 1 },
  });
}

describe("GET /signup-history: whitelist de janela", () => {
  it("sem parametro assume 30, o contrato documentado", async () => {
    base();
    const r = await chamarAdmin("GET", "/signup-history");

    expect(r.status).toBe(200);
    expect(r.body.data.window).toBe("30");
  });

  it("as TRES janelas validas continuam passando", async () => {
    // O chamador real (SignupChart) manda exatamente estes valores. Se o 400
    // novo recusasse um deles, o grafico da Visao quebraria, e este teste e o
    // que impede a correcao de virar regressao.
    for (const janela of ["7", "30", "all"]) {
      base();
      const r = await chamarAdmin("GET", `/signup-history?window=${janela}`);
      expect(r.status, `window=${janela}`).toBe(200);
      expect(r.body.data.window).toBe(janela);
    }
  });

  it("janela FORA da whitelist recusa com 400 nomeado", async () => {
    base();
    const r = await chamarAdmin("GET", "/signup-history?window=90");

    expect(r.status).toBe(400);
    expect(r.body.error?.code ?? r.body.code).toBe("invalid_window");
    expect(r.body.data).toBeUndefined();
  });

  it("lixo e vazio tambem recusam, em vez de cair no padrao", async () => {
    for (const bruto of ["", "0", "-7", "30d", "abc", "tudo"]) {
      base();
      const r = await chamarAdmin(
        "GET",
        `/signup-history?window=${encodeURIComponent(bruto)}`,
      );
      expect(r.status, `window=${bruto}`).toBe(400);
    }
  });

  it("a recusa acontece ANTES de consultar o banco", async () => {
    // Recusar depois de pagar a consulta seria um 400 que custa o mesmo que um
    // 200. Alem do desperdicio, um erro de banco mascararia o erro de validacao.
    base();
    await chamarAdmin("GET", "/signup-history?window=90");
    expect(estado.double.chamadas).toHaveLength(0);
  });
});
