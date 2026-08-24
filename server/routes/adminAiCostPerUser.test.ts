import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GET /ai-cost-per-user.
 *
 * A rota que aposentou a copy falsa "Dados agregados por usuario disponiveis
 * apos 30 dias". Tres coisas se travam aqui e nenhuma e o feliz caminho:
 *
 *   - PRIVACIDADE: `profiles` tem `cpf`, e uma tabela de custo nao e lugar de
 *     documento de ninguem. O teste anti-leak varre o payload INTEIRO, nao a
 *     lista de campos que eu lembrei de conferir;
 *   - a JANELA vem da mesma FUNCAO que /ai-stats usa, provado por espiao, nao
 *     por dois numeros iguais por coincidencia;
 *   - o cache guarda SUCESSO, nunca erro.
 */

const redis = vi.hoisted(() => ({
  loja: new Map<string, string>(),
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
    get: async (chave: string) => redis.loja.get(chave) ?? null,
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

// ESPIAO NA JANELA. O modulo real roda inteiro; so `inicioDaJanelaDeIa` fica
// observavel, para o teste poder afirmar que as DUAS rotas passam por ela.
vi.mock("../lib/aiUsageStats", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/aiUsageStats")>();
  return { ...real, inicioDaJanelaDeIa: vi.fn(real.inicioDaJanelaDeIa) };
});

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import { inicioDaJanelaDeIa } from "../lib/aiUsageStats";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

let proximoId = 1;
function log(over: Record<string, unknown> = {}) {
  return {
    id: proximoId++,
    user_id: "ana",
    tool: "agent-chat",
    status: "success",
    cost_estimate: "1",
    created_at: "2026-08-20T12:00:00Z",
    ...over,
  };
}

function base(over: Record<string, RespostaTabela> = {}) {
  proximoId = 1;
  estado.double = criarSupabaseDouble(
    {
      ai_usage_logs: { rows: [] },
      profiles: { rows: [] },
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
  redis.sets.length = 0;
});

const CHAVE = "admincache:ai-cost-per-user:30d";

describe("GET /ai-cost-per-user", () => {
  it("resolve e-mail e nome do topo com UMA query, pela coluna user_id", async () => {
    // `profiles` tem `id` E `user_id`. Casar por `id` devolveria zero linhas e a
    // tela mostraria "perfil ausente" para todo mundo, sem erro nenhum: e a
    // classe de defeito que reporta sucesso sobre uma superficie vazia.
    base({
      ai_usage_logs: {
        rows: [
          log({ user_id: "uid-ana", cost_estimate: "2.00" }),
          log({ user_id: "uid-bia", cost_estimate: "0.50" }),
        ],
      },
      profiles: {
        rows: [
          {
            id: "pk-1",
            user_id: "uid-ana",
            name: "Ana",
            email: "ana@exemplo.com",
          },
          {
            id: "pk-2",
            user_id: "uid-bia",
            name: "Bia",
            email: "bia@exemplo.com",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/ai-cost-per-user");

    expect(r.status).toBe(200);
    expect(r.body.data.top).toHaveLength(2);
    expect(r.body.data.top[0]).toMatchObject({
      userId: "uid-ana",
      email: "ana@exemplo.com",
      nome: "Ana",
      perfilAusente: false,
      calls: 1,
      success: 1,
      semCustoMedido: 0,
    });
    expect(r.body.data.top[0].costUsd).toBeCloseTo(2, 10);
    expect(typeof r.body.computedAt).toBe("string");
  });

  it("perfil inexistente vira estado NOMEADO, nao e-mail nulo mudo", async () => {
    // e-mail nulo por perfil apagado e e-mail nulo por cadastro sem e-mail sao
    // coisas diferentes, e a tela nao teria como separar sem a marca.
    base({
      ai_usage_logs: { rows: [log({ user_id: "uid-fantasma" })] },
      profiles: { rows: [] },
    });

    const r = await chamarAdmin("GET", "/ai-cost-per-user");

    expect(r.body.data.top[0]).toMatchObject({
      userId: "uid-fantasma",
      email: null,
      nome: null,
      perfilAusente: true,
    });
  });

  it("o balde sem usuario vai no payload, separado do ranking", async () => {
    base({
      ai_usage_logs: {
        rows: [
          log({ user_id: null, cost_estimate: "9.00" }),
          log({ user_id: "uid-ana", cost_estimate: "1.00" }),
        ],
      },
      profiles: {
        rows: [
          { id: "pk-1", user_id: "uid-ana", name: "Ana", email: "a@e.com" },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/ai-cost-per-user");

    expect(r.body.data.top.map((l: { userId: string }) => l.userId)).toEqual([
      "uid-ana",
    ]);
    expect(r.body.data.semUsuario.costUsd).toBeCloseTo(9, 10);
    expect(r.body.data.usuariosDistintos).toBe(1);
  });

  it("sem balde, `semUsuario` e null declarado, nao objeto zerado", async () => {
    // Zeros seriam uma linha "sem usuario: 0 chamadas" na tela, que afirma a
    // existencia de um balde vazio onde nao ha balde nenhum.
    base({ ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] } });
    const r = await chamarAdmin("GET", "/ai-cost-per-user");
    expect(r.body.data.semUsuario).toBeNull();
  });

  it("PRIVACIDADE: nenhum campo de `profiles` alem de nome e e-mail sai daqui", async () => {
    // ANTI-LEAK POR VARREDURA, nao por lista de campos conferidos a mao: o
    // marcador entra numa coluna sensivel real (`cpf`) e a asserção percorre o
    // payload INTEIRO. Um `select("*")` futuro quebra este teste; uma lista
    // escrita a mao envelheceria em silencio na primeira coluna nova.
    const MARCADOR = "MARCADOR-SIGILOSO-99988877766";
    base({
      ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] },
      profiles: {
        rows: [
          {
            id: "pk-1",
            user_id: "uid-ana",
            name: "Ana",
            email: "ana@exemplo.com",
            cpf: MARCADOR,
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/ai-cost-per-user");

    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toContain(MARCADOR);
    // CONTROLE POSITIVO: o marcador ESTAVA no double, entao a ausencia acima e
    // uma medicao, e nao um teste que passaria sobre uma fixture vazia.
    expect(r.body.data.top[0].email).toBe("ana@exemplo.com");
  });

  it("erro de banco e FAIL-LOUD e NAO vira entrada de cache", async () => {
    base({
      ai_usage_logs: { rows: [], error: { message: "timeout" } },
    });
    const falha = await chamarAdmin("GET", "/ai-cost-per-user");
    expect(falha.status).toBe(500);
    expect(redis.sets).toEqual([]);
    expect(redis.loja.size).toBe(0);

    base({ ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] } });
    const ok = await chamarAdmin("GET", "/ai-cost-per-user");
    expect(ok.status).toBe(200);
    expect(redis.sets).toEqual([CHAVE]);
  });

  it("falha ao resolver perfis NAO degrada para `perfilAusente`", async () => {
    // Degradar aqui seria afirmar "esta pessoa nao tem perfil" quando o que
    // houve foi o banco cair. Fallback certo sobre o efeito, errado sobre o
    // mecanismo, e indistinguivel do certo na tela.
    base({
      ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] },
      profiles: { rows: [], error: { message: "boom" } },
    });
    const r = await chamarAdmin("GET", "/ai-cost-per-user");
    expect(r.status).toBe(500);
  });

  it("duas chamadas recomputam uma vez so, na chave fixa da janela da aba", async () => {
    base({ ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] } });
    const primeira = await chamarAdmin("GET", "/ai-cost-per-user");
    const segunda = await chamarAdmin("GET", "/ai-cost-per-user");

    expect(segunda.body.computedAt).toBe(primeira.body.computedAt);
    expect(redis.sets).toEqual([CHAVE]);
  });

  it("a janela vem da MESMA funcao que /ai-stats usa, provado por espiao", async () => {
    // A trava contra a duplicacao do "30 dias". Comparar dois valores iguais
    // provaria coincidencia; o que se afirma aqui e que as duas rotas passam
    // pela MESMA funcao, entao mexer nela move as duas juntas.
    base({ ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] } });
    await chamarAdmin("GET", "/ai-stats");
    const chamadasAposAiStats = vi.mocked(inicioDaJanelaDeIa).mock.calls.length;

    base({ ai_usage_logs: { rows: [log({ user_id: "uid-ana" })] } });
    await chamarAdmin("GET", "/ai-cost-per-user");

    expect(chamadasAposAiStats).toBeGreaterThan(0);
    expect(vi.mocked(inicioDaJanelaDeIa).mock.calls.length).toBeGreaterThan(
      chamadasAposAiStats,
    );
  });
});
