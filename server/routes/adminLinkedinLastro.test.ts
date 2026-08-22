import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PAINEL DE VIOLACOES DE LASTRO (Fase 3, lote 4).
 *
 * As violacoes so viviam no Sentry, por um caminho AMOSTRADO (um evento por
 * tipo por minuto). Este endpoint le o resumo COMPLETO que a analise persiste e
 * agrega por tipo na janela fixa.
 *
 * O que estes testes protegem nao e a aritmetica pura (isso e
 * `shared/linkedin/lastroResumo.test.ts` e o teste de `agregarResumos` abaixo),
 * e sim a FIACAO: que a rota exista atras das guardas de admin, que ela peca
 * APENAS a coluna do resumo, que analise antiga sem resumo nao seja contada
 * como zero, e que nenhum texto de usuario atravesse a resposta.
 *
 * Nenhuma rede: o supabase e dublado pelo harness da casa.
 */

/**
 * DUBLE DA CASA, desde a Fase 4 lote 5.
 *
 * Ate aqui este arquivo usava stub local, e o motivo estava escrito: o
 * `criarSupabaseDouble` validava cada coluna do `select` contra
 * `shared/database.types.ts` e nao conhecia a sintaxe de ACESSO A JSONB do
 * PostgREST (`result->qualitative->lastroResumo`), que e a desta rota. O lote 5
 * ensinou o duble a resolver essa forma, entao a razao do desvio acabou.
 *
 * O QUE SE GANHA na volta: a validacao de nome de coluna contra o schema real.
 * Antes, um nome errado so seria pego pela assercao da string de `select`, que
 * e defesa em profundidade e continua abaixo, mas confere TEXTO, nao existencia.
 * Agora as duas coisas valem: a coluna base tem de existir no schema E a string
 * tem de ser a esperada.
 */
const estado = vi.hoisted(() => ({
  linhas: [] as unknown[],
  duble: null as { chamadas: { table: string; colunas: string[] }[] } | null,
  erro: null as { message: string } | null,
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
vi.mock("../lib/supabaseAdmin", async () => {
  const { criarSupabaseDouble } = await import("./adminUsersHarness.test");
  const duble = criarSupabaseDouble({
    linkedin_analyses: () => ({
      rows: estado.erro ? [] : (estado.linhas as Record<string, unknown>[]),
      error: estado.erro,
    }),
  });
  estado.duble = duble;
  return { supabaseAdmin: duble.client };
});
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
vi.mock("../lib/posthog", () => ({
  getPaidFunnelSignals: async () => null,
  getPosthogStats: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogHealth: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogPersonActivity: async () => ({ state: "error", reason: "n/a" }),
  getPosthogFeatureUsage: async () => ({ state: "error", reason: "n/a" }),
}));

import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";
import { LASTRO_JANELA_DIAS } from "../../shared/linkedin/lastro";
import { agregarResumos } from "../../shared/linkedin/readQualitative";
import { CONTAGEM_INDISPONIVEL } from "../../shared/linkedin/readQualitative";

const chamarAdmin = criarClienteAdmin(adminRouter);

function montar(linhas: unknown[]) {
  estado.linhas = linhas;
  estado.erro = null;
  if (estado.duble) estado.duble.chamadas.length = 0;
}

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  montar([]);
});

describe("agregarResumos: a aritmetica, pura", () => {
  it("soma por tipo e no total, apenas sobre quem tem resumo", () => {
    const agregado = agregarResumos([
      { total: 2, porTipo: { idioma_incorreto: 1, numeral_fabricado: 1 } },
      { total: 3, porTipo: { idioma_incorreto: 3 } },
      { total: 0, porTipo: {} },
    ]);
    expect(agregado).toEqual({
      analises: 3,
      comResumo: 3,
      semResumo: 0,
      total: 5,
      porTipo: { idioma_incorreto: 4, numeral_fabricado: 1 },
    });
  });

  it("analise SEM resumo nao vira zero: sai do denominador e e declarada", () => {
    // O caso que o painel precisa poder contar honestamente: toda analise
    // gravada antes deste lote entra na janela sem o dado. Soma-las como zero
    // produziria "nenhuma violacao nesta semana" a partir do que ninguem mediu.
    const agregado = agregarResumos([
      { total: 4, porTipo: { bullet_sem_origem: 4 } },
      { total: CONTAGEM_INDISPONIVEL, porTipo: {} },
      { total: CONTAGEM_INDISPONIVEL, porTipo: {} },
    ]);
    expect(agregado.analises).toBe(3);
    expect(agregado.comResumo).toBe(1);
    expect(agregado.semResumo).toBe(2);
    expect(agregado.total).toBe(4);
  });

  it("conjunto vazio: tudo zero, e nenhuma chave inventada", () => {
    expect(agregarResumos([])).toEqual({
      analises: 0,
      comResumo: 0,
      semResumo: 0,
      total: 0,
      porTipo: {},
    });
  });

  it("a soma do mapa fecha com o total", () => {
    const agregado = agregarResumos([
      { total: 2, porTipo: { idioma_incorreto: 2 } },
      { total: 1, porTipo: { vazamento_delimitador: 1 } },
    ]);
    const soma = Object.values(agregado.porTipo).reduce((a, b) => a + b, 0);
    expect(soma).toBe(agregado.total);
  });
});

describe("GET /linkedin-lastro: a fiacao", () => {
  it("pede APENAS a coluna do resumo, e nao a analise inteira", async () => {
    // A trava que substitui a validacao de coluna do double compartilhado, e
    // que ao mesmo tempo e a garantia de privacidade mais forte do endpoint: o
    // texto do modelo nem sai do banco. A mesma forma de acesso a JSONB ja
    // roda em producao no `select` do historico, em `server/routes/linkedin.ts`.
    montar([]);
    await chamarAdmin("GET", "/linkedin-lastro");
    // DEFESA EM PROFUNDIDADE, mantida de proposito. O duble ja recusa coluna
    // base inexistente contra o schema; esta assercao confere o TEXTO exato do
    // caminho jsonb, que o schema nao tem como validar (as chaves depois da
    // coluna vivem dentro do documento). As duas cobrem coisas diferentes.
    expect(
      (estado.duble?.chamadas ?? []).map((c) => c.colunas.join(",")),
    ).toEqual(["result->qualitative->lastroResumo"]);
  });

  it("agrega as linhas da janela e declara o periodo", async () => {
    montar([
      { lastroResumo: { total: 2, porTipo: { idioma_incorreto: 2 } } },
      { lastroResumo: { total: 1, porTipo: { numeral_fabricado: 1 } } },
    ]);
    const r = await chamarAdmin("GET", "/linkedin-lastro");

    expect(r.status).toBe(200);
    expect(r.body.data.total).toBe(3);
    expect(r.body.data.porTipo).toEqual({
      idioma_incorreto: 2,
      numeral_fabricado: 1,
    });
    expect(r.body.data.analises).toBe(2);
    expect(r.body.data.comResumo).toBe(2);
    expect(r.body.data.janelaDias).toBe(LASTRO_JANELA_DIAS);
    expect(r.body.data.truncado).toBe(false);
  });

  it("linha ANTIGA sem resumo entra em semResumo, nunca em zero violacoes", async () => {
    montar([
      { lastroResumo: { total: 3, porTipo: { bullet_sem_origem: 3 } } },
      {},
      { lastroResumo: null },
    ]);
    const r = await chamarAdmin("GET", "/linkedin-lastro");

    expect(r.status).toBe(200);
    expect(r.body.data.analises).toBe(3);
    expect(r.body.data.comResumo).toBe(1);
    expect(r.body.data.semResumo).toBe(2);
    expect(r.body.data.total).toBe(3);
  });

  it("janela sem nenhuma analise responde vazio, e nao erro", async () => {
    montar([]);
    const r = await chamarAdmin("GET", "/linkedin-lastro");

    expect(r.status).toBe(200);
    expect(r.body.data.analises).toBe(0);
    expect(r.body.data.total).toBe(0);
    expect(r.body.data.porTipo).toEqual({});
  });

  it("PRIVACIDADE: nada alem de contagem atravessa a resposta", async () => {
    // Se a rota selecionasse a analise inteira em vez da coluna do resumo, o
    // texto do modelo passaria por aqui. O marcador prova que nao passa.
    montar([
      {
        lastroResumo: { total: 1, porTipo: { idioma_incorreto: 1 } },
        resumo: "ZQXJTEXTODOUSUARIOZQXJ",
        headline: "ZQXJHEADLINEZQXJ",
      },
    ]);
    const r = await chamarAdmin("GET", "/linkedin-lastro");

    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toContain("ZQXJ");
  });

  it("tipo desconhecido gravado por versao futura e descartado", async () => {
    montar([
      {
        lastroResumo: {
          total: 2,
          porTipo: { idioma_incorreto: 1, tipo_do_futuro: 1 },
        },
      },
    ]);
    const r = await chamarAdmin("GET", "/linkedin-lastro");

    expect(r.body.data.porTipo).toEqual({ idioma_incorreto: 1 });
  });
});
