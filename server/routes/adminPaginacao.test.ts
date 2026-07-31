import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TETO DE 1000 LINHAS do PostgREST nas rotas de agregação do admin.
 *
 * O defeito, medido em produção em 2026-07-31: `/ai-stats` fazia um `.select()`
 * solto sobre `ai_usage_logs` e somava o que viesse. O PostgREST corta em
 * `db-max-rows`, então a soma parava na milésima linha e o painel exibia
 * R$ 1,45 onde o custo real era R$ 1,58, sobre 1167 linhas. Nenhum sinal de que
 * faltava algo.
 *
 * O teste AFIRMA O TOTAL, não a pertinência: registra mais linhas do que o teto
 * e exige que a soma seja a do CONJUNTO INTEIRO. Um teste que só verificasse
 * "as tools conhecidas apareceram" passaria alegremente sobre as 1000
 * primeiras — seria o mesmo instrumento que falha passando.
 *
 * O dublê aplica `maxRows` DEPOIS do range, exatamente como o `db-max-rows` faz:
 * é o que torna a condição simulável. Enquanto `range` era no-op no dublê, uma
 * rota paginada e uma truncada davam o mesmo resultado aqui.
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

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

/** O teto real do PostgREST na configuração de hoje. */
const MAX_ROWS = 1000;

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  maxRows: number | null = MAX_ROWS,
  authAdmin: Record<string, unknown> = {},
) {
  estado.double = criarSupabaseDouble(respostas, authAdmin, undefined, maxRows);
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// O próprio dublê: sem isto, os testes abaixo poderiam passar sobre um dublê
// que ignora o teto, e não provariam nada.
// ---------------------------------------------------------------------------

describe("o dublê reproduz o teto do servidor", () => {
  it("sem paginar, uma consulta solta recebe no MÁXIMO maxRows linhas", async () => {
    montar({
      ai_usage_logs: {
        rows: Array.from({ length: 1500 }, (_, i) => ({ id: String(i) })),
      },
    });

    const q = (
      estado.double.client.from("ai_usage_logs") as {
        select: (c: string) => PromiseLike<{ data: unknown[] }>;
      }
    ).select("id");
    const r = await q;
    expect(r.data).toHaveLength(MAX_ROWS);
  });

  it("`range` recorta de verdade, e o teto se aplica DEPOIS", async () => {
    montar(
      {
        ai_usage_logs: {
          rows: Array.from({ length: 1500 }, (_, i) => ({ id: String(i) })),
        },
        // Teto pequeno para ver os dois efeitos separados.
      },
      10,
    );

    const q = (
      estado.double.client.from("ai_usage_logs") as {
        select: (c: string) => Record<string, Function>;
      }
    ).select("id");
    const r = (await q.range(5, 100)) as { data: Array<{ id: string }> };
    // range pediu 96 linhas a partir da 6a; o teto corta em 10.
    expect(r.data).toHaveLength(10);
    expect(r.data[0].id).toBe("5");
  });
});

// ---------------------------------------------------------------------------
// GET /ai-stats
// ---------------------------------------------------------------------------

describe("GET /ai-stats soma TODAS as linhas da janela", () => {
  /** 1500 chamadas: 1000 cabem no teto, 500 só aparecem paginando. */
  function logs() {
    return Array.from({ length: 1500 }, (_, i) => ({
      id: String(i).padStart(5, "0"),
      // As 1000 primeiras são de uma tool, as 500 finais de OUTRA: assim uma
      // rota truncada não só soma menos, ela perde uma ferramenta inteira.
      tool: i < 1000 ? "roadmap-generator" : "resume-builder",
      status: "success",
      cost_estimate: "0.01",
    }));
  }

  it("o custo total é o das 1500, não o das 1000 que couberam", async () => {
    montar({ ai_usage_logs: { rows: logs() } });

    const r = await chamarAdmin("GET", "/ai-stats");

    expect(r.status).toBe(200);
    const total = Object.values(
      r.body.data as Record<string, { calls: number; cost: number }>,
    ).reduce((soma, item) => soma + item.calls, 0);
    expect(total).toBe(1500);

    const custo = Object.values(
      r.body.data as Record<string, { cost: number }>,
    ).reduce((soma, item) => soma + item.cost, 0);
    expect(custo).toBeCloseTo(15, 6);
  });

  it("a ferramenta que só existe DEPOIS do teto aparece", async () => {
    // É o caso que o painel escondeu em produção: não some só valor, some
    // linha inteira da lista de features.
    montar({ ai_usage_logs: { rows: logs() } });

    const r = await chamarAdmin("GET", "/ai-stats");

    expect(Object.keys(r.body.data).sort()).toEqual([
      "resume-builder",
      "roadmap-generator",
    ]);
    expect(r.body.data["resume-builder"].calls).toBe(500);
    expect(r.body.data["roadmap-generator"].calls).toBe(1000);
  });

  it("a varredura ORDENA, senão o OFFSET pode pular ou repetir linha", async () => {
    montar({ ai_usage_logs: { rows: logs() } });
    await chamarAdmin("GET", "/ai-stats");

    const consultas = estado.double.de("ai_usage_logs");
    // Paginou: mais de uma consulta à mesma tabela.
    expect(consultas.length).toBeGreaterThan(1);
    // E TODA página pediu ordenação. O dublê valida a coluna do order contra o
    // schema gerado do banco, então isto também prova que `id` existe lá.
    for (const c of consultas) expect(c.ordem).toEqual(["id"]);
  });

  it("volume abaixo do teto continua correto (sem regressão)", async () => {
    montar({
      ai_usage_logs: {
        rows: [
          {
            id: "1",
            tool: "agent-chat",
            status: "success",
            cost_estimate: "0.5",
          },
          {
            id: "2",
            tool: "agent-chat",
            status: "error",
            cost_estimate: "0.25",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/ai-stats");

    expect(r.body.data["agent-chat"]).toEqual({
      calls: 2,
      success: 1,
      cost: 0.75,
    });
  });

  it("erro do banco vira 500, não um agregado parcial", async () => {
    montar({ ai_usage_logs: { error: { message: "timeout" } } });
    const r = await chamarAdmin("GET", "/ai-stats");
    expect(r.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /beta-codes
// ---------------------------------------------------------------------------

describe("GET /beta-codes conta TODOS os desbloqueios", () => {
  it("success_count não para no teto", async () => {
    // 615 linhas hoje em produção; o teste usa 1500 para cruzar o teto.
    montar({
      beta_access_codes: {
        rows: [
          {
            id: "c1",
            code: "BETA",
            label: "Lote 1",
            active: true,
            created_at: "2026-07-01T00:00:00Z",
            revoked_at: null,
          },
        ],
      },
      beta_unlock_logs: {
        rows: Array.from({ length: 1500 }, (_, i) => ({
          id: String(i).padStart(5, "0"),
          code_id: "c1",
          created_at: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
        })),
      },
    });

    const r = await chamarAdmin("GET", "/beta-codes");

    expect(r.status).toBe(200);
    expect(r.body.data[0].success_count).toBe(1500);
  });

  it("falha nos logs NÃO derruba a lista de códigos", async () => {
    // Postura preservada: o agregado zera, os códigos aparecem.
    montar({
      beta_access_codes: {
        rows: [
          {
            id: "c1",
            code: "BETA",
            label: null,
            active: true,
            created_at: "2026-07-01T00:00:00Z",
            revoked_at: null,
          },
        ],
      },
      beta_unlock_logs: { error: { message: "timeout" } },
    });

    const r = await chamarAdmin("GET", "/beta-codes");

    expect(r.status).toBe(200);
    expect(r.body.data[0].success_count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /dashboard — os dois ramos de acesso Pro
// ---------------------------------------------------------------------------

describe("GET /dashboard separa os dois ramos de acesso Pro", () => {
  function assinatura(userId: string) {
    return {
      user_id: userId,
      status: "active",
      created_at: "2026-07-01T00:00:00Z",
      current_period_end: "2099-01-01T00:00:00Z",
      plans: { code: "pro_annual" },
    };
  }

  it("expõe assinatura e concessão como campos SEPARADOS", async () => {
    // O card mostrava só o primeiro ramo e escondia 25 pessoas com acesso.
    montar({
      profiles: { rows: [], count: 3346 },
      subscriptions: {
        rows: [assinatura("a"), assinatura("b")],
        count: 2,
      },
      areas: { rows: [], count: 10 },
      courses: { rows: [], count: 450 },
      ai_usage_logs: { rows: [], count: 1252 },
      content_audit_logs: { rows: [] },
      influencers: { rows: [{ user_id: "c" }, { user_id: "d" }] },
    });

    const r = await chamarAdmin("GET", "/dashboard");

    expect(r.status).toBe(200);
    expect(r.body.data.counts).toMatchObject({
      pro_by_subscription: 2,
      pro_by_influencer: 2,
      pro_total: 4,
    });
    // O campo antigo continua existindo, com o mesmo significado de sempre:
    // quem lê "Assinaturas ativas" fala de assinatura, não de acesso.
    expect(r.body.data.counts.active_subscriptions).toBe(2);
  });

  it("o tally é PAGINADO: base acima do teto não encolhe em silêncio", async () => {
    // Mesmo teto de 1000 do /ai-stats. Sem paginar, uma base grande faria o
    // painel subestimar o próprio número de assinantes.
    montar({
      profiles: { rows: [], count: 0 },
      subscriptions: {
        rows: Array.from({ length: 1200 }, (_, i) => assinatura(`u${i}`)),
        count: 1200,
      },
      areas: { rows: [], count: 0 },
      courses: { rows: [], count: 0 },
      ai_usage_logs: { rows: [], count: 0 },
      content_audit_logs: { rows: [] },
      influencers: { rows: [] },
    });

    const r = await chamarAdmin("GET", "/dashboard");

    expect(r.body.data.counts.pro_by_subscription).toBe(1200);
  });
});

// ---------------------------------------------------------------------------
// Varreduras GLOBAIS que alimentam filtro e lista
// ---------------------------------------------------------------------------

describe("as varreduras globais do admin não param no teto", () => {
  function assinaturaAtiva(i: number) {
    return {
      id: `s${String(i).padStart(5, "0")}`,
      user_id: `u${i}`,
      status: "active",
      created_at: "2026-07-01T00:00:00Z",
      current_period_end: "2099-01-01T00:00:00Z",
      plans: { code: "pro_annual", name: "Pro", price_cents: 2990 },
    };
  }

  it("GET /churn-risk enxerga assinatura acima do teto", async () => {
    montar(
      {
        subscriptions: {
          rows: Array.from({ length: 1500 }, (_, i) => assinaturaAtiva(i)),
        },
        profiles: { rows: [] },
      },
      MAX_ROWS,
      // A rota cruza com o Auth para achar quem nunca logou; aqui só precisa
      // responder, o alvo do teste é a varredura de assinaturas.
      { listUsers: async () => ({ data: { users: [] }, error: null }) },
    );

    const r = await chamarAdmin("GET", "/churn-risk");

    expect(r.status).toBe(200);
    // Sem paginar, a lista de risco pararia em 1000 e ninguém veria a diferença.
    expect(estado.double.de("subscriptions").length).toBeGreaterThan(1);
  });

  it("GET /affiliates-stats devolve TODOS os afiliados", async () => {
    montar({
      affiliates: {
        rows: Array.from({ length: 1500 }, (_, i) => ({
          id: `a${String(i).padStart(5, "0")}`,
          code: `PARC${i}`,
          revenue_cents: i,
        })),
      },
    });

    const r = await chamarAdmin("GET", "/affiliates-stats");

    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1500);
  });
});

// ---------------------------------------------------------------------------
// GET /cancellation-reasons
// ---------------------------------------------------------------------------

describe("GET /cancellation-reasons", () => {
  function cancelamento(i: number, over: Record<string, unknown> = {}) {
    return {
      id: `c${String(i).padStart(5, "0")}`,
      reason_code: "expensive",
      provider_subscription_id: `sub_${i}`,
      status: "scheduled",
      ...over,
    };
  }

  function assinatura(i: number) {
    return {
      id: `s${String(i).padStart(5, "0")}`,
      provider_subscription_id: `sub_${i}`,
    };
  }

  it("o tally não para no teto: conta TODAS as linhas", async () => {
    // O padrão antigo (`from += PAGE`, break em `rows.length < PAGE`) funcionava
    // por coincidência, porque PAGE era igual ao db-max-rows. Este cenário põe o
    // teto ABAIXO do PAGE antigo, que é exatamente onde ele quebrava.
    montar({
      subscription_cancellations: {
        rows: Array.from({ length: 1500 }, (_, i) => cancelamento(i)),
      },
      subscriptions: {
        rows: Array.from({ length: 1500 }, (_, i) => assinatura(i)),
      },
    });

    const r = await chamarAdmin("GET", "/cancellation-reasons");

    expect(r.status).toBe(200);
    expect(r.body.data.total).toBe(1500);
    const expensive = r.body.data.byReason.find(
      (x: { code: string }) => x.code === "expensive",
    );
    expect(expensive.count).toBe(1500);
    expect(expensive.percent).toBe(100);
  });

  it("a varredura ORDENA em toda página", async () => {
    montar({
      subscription_cancellations: {
        rows: Array.from({ length: 1500 }, (_, i) => cancelamento(i)),
      },
      subscriptions: { rows: [] },
    });
    await chamarAdmin("GET", "/cancellation-reasons");

    // Só a consulta do TALLY: a de comentários também seleciona reason_code, e
    // ela ordena por canceled_at de propósito (é uma lista, não uma varredura).
    const tally = estado.double
      .de("subscription_cancellations")
      .filter((c) => c.colunas.includes("provider_subscription_id"));
    expect(tally.length).toBeGreaterThan(1);
    for (const c of tally) expect(c.ordem).toEqual(["id"]);
  });

  it("distingue quem NÃO tem assinatura vinculada, sem tirar do total", async () => {
    // A decisão: as linhas do gateway anterior continuam no total (é churn de
    // gente real), e o endpoint passa a poder dizer quantas são.
    montar({
      subscription_cancellations: {
        rows: [
          cancelamento(1),
          cancelamento(2, { reason_code: "unused" }),
          // Órfã: a assinatura não existe mais.
          cancelamento(99, {
            provider_subscription_id: "sub_d658ndm843tcl3lw",
            reason_code: "paused",
          }),
        ],
      },
      subscriptions: { rows: [assinatura(1), assinatura(2)] },
    });

    const r = await chamarAdmin("GET", "/cancellation-reasons");

    expect(r.body.data.total).toBe(3);
    expect(r.body.data.unlinkedCount).toBe(1);
    // E continua contando no motivo: não foi removida da distribuição.
    expect(
      r.body.data.byReason.find((x: { code: string }) => x.code === "paused")
        .count,
    ).toBe(1);
  });

  it("cancelamento SEM provider_subscription_id também conta como não vinculado", async () => {
    montar({
      subscription_cancellations: {
        rows: [cancelamento(1, { provider_subscription_id: null })],
      },
      subscriptions: { rows: [] },
    });

    const r = await chamarAdmin("GET", "/cancellation-reasons");
    expect(r.body.data.unlinkedCount).toBe(1);
  });

  it("base toda vinculada devolve zero, não um número inventado", async () => {
    montar({
      subscription_cancellations: { rows: [cancelamento(1), cancelamento(2)] },
      subscriptions: { rows: [assinatura(1), assinatura(2)] },
    });

    const r = await chamarAdmin("GET", "/cancellation-reasons");
    expect(r.body.data.unlinkedCount).toBe(0);
    expect(r.body.data.total).toBe(2);
  });

  it("a lista de assinaturas também é paginada (senão viva vira órfã)", async () => {
    // Se `idsExistentes` truncasse, assinatura viva viraria "sem vínculo" e o
    // número mentiria para MAIS.
    montar({
      subscription_cancellations: {
        rows: [cancelamento(1499)],
      },
      subscriptions: {
        rows: Array.from({ length: 1500 }, (_, i) => assinatura(i)),
      },
    });

    const r = await chamarAdmin("GET", "/cancellation-reasons");
    expect(r.body.data.unlinkedCount).toBe(0);
  });
});
