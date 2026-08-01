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
import { diaBrasilia } from "../../shared/brasiliaDay";
import { somarDia } from "../lib/signupSeries";
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

// ---------------------------------------------------------------------------
// GET /subscription-history
// ---------------------------------------------------------------------------

describe("GET /subscription-history", () => {
  /** Série contígua terminando na data dada. */
  function serie(dias: number, ate: string) {
    const fim = new Date(`${ate}T00:00:00Z`);
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(fim);
      d.setUTCDate(d.getUTCDate() - (dias - 1 - i));
      return {
        id: `sn${String(i).padStart(4, "0")}`,
        snapshot_date: d.toISOString().slice(0, 10),
        active_count: 10 + i,
        trialing_count: 0,
        mrr_cents: 100000 + i * 1000,
      };
    });
  }

  it("série contígua sai sem buracos e com os extremos declarados", async () => {
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");

    expect(r.status).toBe(200);
    expect(r.body.data.points).toHaveLength(16);
    expect(r.body.data.gaps).toEqual([]);
    expect(r.body.data.firstSnapshotDate).toBe("2026-07-16");
    expect(r.body.data.lastSnapshotDate).toBe("2026-07-31");
    expect(
      r.body.data.points.every((p: { missing: boolean }) => !p.missing),
    ).toBe(true);
  });

  it("BURACO é reportado como buraco, sem interpolar nem omitir", async () => {
    // Série com 18/07 e 19/07 ausentes. A rota não pode nem pular os dias (o
    // gráfico ligaria 17 a 20 numa reta) nem inventar valores.
    const rows = serie(16, "2026-07-31").filter(
      (r) => !["2026-07-18", "2026-07-19"].includes(r.snapshot_date),
    );
    montar({ subscription_snapshots: { rows } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");

    expect(r.body.data.gaps).toEqual(["2026-07-18", "2026-07-19"]);
    // Os dias continuam NA série, marcados e com métricas nulas.
    expect(r.body.data.points).toHaveLength(16);
    const faltante = r.body.data.points.find(
      (p: { date: string }) => p.date === "2026-07-18",
    );
    expect(faltante).toMatchObject({
      missing: true,
      activeCount: null,
      mrrCents: null,
    });
  });

  it("janela MAIOR que o histórico declara o início real", async () => {
    // Pedir 30 dias com 16 de série não pode devolver 30 pontos: os 14
    // anteriores ao primeiro snapshot não existem e inventá-los seria mentira.
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=30");

    expect(r.body.data.points).toHaveLength(16);
    expect(r.body.data.firstSnapshotDate).toBe("2026-07-16");
    expect(r.body.data.gaps).toEqual([]);
  });

  it("janela de 7 dias recorta a partir do ÚLTIMO snapshot, não de hoje", async () => {
    // O snapshot do dia só é gravado às 05:10 UTC. Ancorar em "hoje" criaria um
    // buraco que é só o dia ainda não ter acontecido.
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=7");

    expect(r.body.data.points).toHaveLength(7);
    expect(r.body.data.points[0].date).toBe("2026-07-25");
    expect(r.body.data.points[6].date).toBe("2026-07-31");
  });

  it("janela desconhecida cai no padrão, não em erro nem em 90 dias", async () => {
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });
    const r = await chamarAdmin("GET", "/subscription-history?window=90");
    expect(r.body.data.window).toBe("30");
  });

  it("série VAZIA devolve estado nomeado, não gráfico plano", async () => {
    montar({ subscription_snapshots: { rows: [] } });

    const r = await chamarAdmin("GET", "/subscription-history");

    expect(r.status).toBe(200);
    expect(r.body.data.points).toEqual([]);
    expect(r.body.data.firstSnapshotDate).toBeNull();
    expect(r.body.data.change).toBeNull();
  });

  it("erro de banco é FAIL-LOUD: 500, não série vazia", async () => {
    // Série vazia por falha silenciosa desenharia um gráfico plano, que é
    // afirmação falsa sobre o negócio.
    montar({ subscription_snapshots: { error: { message: "timeout" } } });
    const r = await chamarAdmin("GET", "/subscription-history");
    expect(r.status).toBe(500);
  });

  it("staleDays denuncia cron parado", async () => {
    // É o único sinal que a série dá de que parou de crescer: nada lê
    // cron_run_logs hoje.
    const ontem = new Date(Date.now() - 24 * 3600_000)
      .toISOString()
      .slice(0, 10);
    montar({ subscription_snapshots: { rows: serie(5, ontem) } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");
    expect(r.body.data.staleDays).toBe(1);
  });

  it("a leitura é paginada e avisa quando trunca", async () => {
    montar({ subscription_snapshots: { rows: serie(1200, "2029-01-01") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");

    expect(r.body.data.truncated).toBe(true);
    expect(r.body.data.points).toHaveLength(400);
    // Mantém a PONTA RECENTE: é ela que interessa num gráfico de tendência.
    expect(r.body.data.points[399].date).toBe("2029-01-01");
  });
});

describe("GET /signup-history", () => {
  // "Hoje" vem do relógio real, como na rota. Fixar por fuso é o que impede o
  // teste de passar em -03 e falhar no CI, que roda em UTC (`vitest.config.ts`
  // fixa TZ, e este cálculo respeita a mesma regra da rota).
  const hoje = diaBrasilia(new Date().toISOString())!;

  /** Um instante às 15h de Brasília do dia dado (18:00Z), sem ambiguidade. */
  function meioDia(dia: string) {
    return { id: `p-${dia}-${Math.random()}`, created_at: `${dia}T18:00:00Z` };
  }

  it("conta TODAS as linhas: a série não para no teto de 1000", async () => {
    // O defeito de classe: 1500 cadastros num dia, e o gráfico desenharia uma
    // barra de 1000 sem nada acusar. É o mesmo mecanismo que cortou o custo de
    // IA em produção, e aqui sairia como "queda de cadastros".
    const ontem = somarDia(hoje, -1);
    montar({
      profiles: {
        rows: Array.from({ length: 1500 }, (_, i) => ({
          id: `p${i}`,
          created_at: `${ontem}T18:00:00Z`,
        })),
      },
    });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    expect(r.status).toBe(200);
    const ponto = r.body.data.points.find(
      (p: { date: string }) => p.date === ontem,
    );
    expect(ponto.count).toBe(1500);
  });

  it("a varredura ORDENA: sem ordem, o OFFSET pula ou repete linha", async () => {
    montar({ profiles: { rows: [meioDia(hoje)] } });
    await chamarAdmin("GET", "/signup-history?window=7");

    for (const chamada of estado.double.de("profiles")) {
      expect(chamada.ordem).toContain("created_at");
    }
  });

  it("agrupa pelo dia de BRASÍLIA, não pelo dia UTC", async () => {
    // 02:30Z é 23:30 do dia anterior em Brasília. Agrupar por UTC empurraria
    // este cadastro para a barra de amanhã.
    const ontem = somarDia(hoje, -1);
    montar({
      profiles: { rows: [{ id: "p1", created_at: `${hoje}T02:30:00Z` }] },
    });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    const pontos = r.body.data.points as Array<{ date: string; count: number }>;
    expect(pontos.find((p) => p.date === ontem)!.count).toBe(1);
    expect(pontos.find((p) => p.date === hoje)!.count).toBe(0);
  });

  it("o corte inferior cobre o dia inteiro em Brasília", async () => {
    // O limite é `inicio T00:00:00Z`, e ele é folgado porque Brasília está
    // ATRÁS de UTC: o dia civil só começa às 03:00Z. Se este filtro virar uma
    // data com hora, o começo do primeiro dia some do gráfico.
    montar({ profiles: { rows: [meioDia(somarDia(hoje, -10))] } });
    await chamarAdmin("GET", "/signup-history?window=7");

    const varredura = estado.double
      .de("profiles")
      .flatMap((c) => c.filtros)
      .filter((f) => f.tipo === "gte" && f.coluna === "created_at");
    expect(varredura.length).toBeGreaterThan(0);
    for (const f of varredura) {
      expect(f.valor).toBe(`${somarDia(hoje, -6)}T00:00:00Z`);
    }
  });

  it("dia sem cadastro é uma barra ZERO, não um buraco omitido", async () => {
    montar({
      profiles: {
        rows: [meioDia(somarDia(hoje, -6)), meioDia(somarDia(hoje, -2))],
      },
    });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    const pontos = r.body.data.points as Array<{ date: string; count: number }>;
    // Sete dias contíguos, nenhum omitido: aqui zero É medição, ao contrário
    // do histórico de snapshots, onde dia ausente significa que ninguém mediu.
    expect(pontos).toHaveLength(7);
    expect(pontos.filter((p) => p.count === 0)).toHaveLength(5);
    expect(pontos.every((p) => typeof p.count === "number")).toBe(true);
  });

  it("marca SÓ o último dia como parcial", async () => {
    montar({ profiles: { rows: [meioDia(hoje)] } });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    const pontos = r.body.data.points as Array<{
      date: string;
      partial: boolean;
    }>;
    expect(pontos.filter((p) => p.partial)).toHaveLength(1);
    expect(pontos[pontos.length - 1]).toMatchObject({
      date: hoje,
      partial: true,
    });
  });

  it("janela MAIOR que a base declara o início real, sem inventar zeros", async () => {
    const primeiro = somarDia(hoje, -3);
    montar({ profiles: { rows: [meioDia(primeiro)] } });

    const r = await chamarAdmin("GET", "/signup-history?window=30");

    // Quatro dias, não trinta: dias anteriores ao primeiro cadastro não são
    // zeros medidos, são dias em que a base não existia.
    expect(r.body.data.points).toHaveLength(4);
    expect(r.body.data.points[0].date).toBe(primeiro);
    expect(r.body.data.firstSignupDate).toBe(primeiro);
  });

  it("'tudo' começa no primeiro cadastro", async () => {
    const primeiro = somarDia(hoje, -5);
    montar({ profiles: { rows: [meioDia(primeiro)] } });

    const r = await chamarAdmin("GET", "/signup-history?window=all");

    expect(r.body.data.points).toHaveLength(6);
    expect(r.body.data.points[0].date).toBe(primeiro);
  });

  it("janela desconhecida cai em 30, não em erro", async () => {
    montar({ profiles: { rows: [meioDia(hoje)] } });
    const r = await chamarAdmin("GET", "/signup-history?window=90");
    expect(r.status).toBe(200);
    expect(r.body.data.window).toBe("30");
  });

  it("base VAZIA devolve o dia de hoje, não uma série falsa", async () => {
    montar({ profiles: { rows: [] } });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    expect(r.status).toBe(200);
    expect(r.body.data.firstSignupDate).toBe(hoje);
    expect(r.body.data.points).toEqual([
      { date: hoje, count: 0, partial: true },
    ]);
  });

  it("erro de banco é FAIL-LOUD: 500, não série zerada", async () => {
    // Série vazia por falha de leitura desenharia um gráfico plano, que afirma
    // que ninguém se cadastrou.
    montar({ profiles: { error: { message: "boom" } } });

    const r = await chamarAdmin("GET", "/signup-history?window=7");

    expect(r.status).toBe(500);
  });
});

describe("variação da série", () => {
  function serie(dias: number, ate: string, mrrInicial = 100000) {
    const fim = new Date(`${ate}T00:00:00Z`);
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(fim);
      d.setUTCDate(d.getUTCDate() - (dias - 1 - i));
      return {
        id: `sn${String(i).padStart(4, "0")}`,
        snapshot_date: d.toISOString().slice(0, 10),
        active_count: 10 + i,
        trialing_count: 0,
        mrr_cents: mrrInicial + i * 1000,
      };
    });
  }

  it("com dois pontos ou mais, devolve início, fim e variação", async () => {
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");

    expect(r.body.data.change).toMatchObject({
      fromDate: "2026-07-16",
      toDate: "2026-07-31",
      fromMrrCents: 100000,
      toMrrCents: 115000,
      mrrDeltaCents: 15000,
      fromActiveCount: 10,
      toActiveCount: 25,
      activeDelta: 15,
    });
    expect(r.body.data.change.mrrDeltaPercent).toBeCloseTo(15, 6);
  });

  it("com UM ponto só, NÃO inventa variação", async () => {
    // Card sem Δ é honesto; card com Δ falso não.
    montar({ subscription_snapshots: { rows: serie(1, "2026-07-31") } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");
    expect(r.body.data.change).toBeNull();
  });

  it("base ZERO devolve percentual NULO, nunca infinito", async () => {
    // "+∞%" num card destrói a confiança na página inteira.
    montar({
      subscription_snapshots: {
        rows: serie(3, "2026-07-31", 0).map((r, i) => ({
          ...r,
          mrr_cents: i === 0 ? 0 : 5000,
        })),
      },
    });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");

    expect(r.body.data.change.fromMrrCents).toBe(0);
    expect(r.body.data.change.mrrDeltaCents).toBe(5000);
    expect(r.body.data.change.mrrDeltaPercent).toBeNull();
  });

  it("dia faltante não vira extremo da variação", async () => {
    // Se o primeiro dia da janela estiver ausente, comparar contra ele daria
    // uma variação contra null.
    const rows = serie(5, "2026-07-31").filter(
      (r) => r.snapshot_date !== "2026-07-27",
    );
    montar({ subscription_snapshots: { rows } });

    const r = await chamarAdmin("GET", "/subscription-history?window=all");
    expect(r.body.data.change.fromDate).toBe("2026-07-28");
  });

  it("período anterior: indisponível com histórico curto, disponível com longo", async () => {
    // 16 dias não sustentam "30 vs 30 anteriores". A rota DIZ que não dá, em vez
    // de comparar contra zero.
    montar({ subscription_snapshots: { rows: serie(16, "2026-07-31") } });
    let r = await chamarAdmin("GET", "/subscription-history?window=30");
    expect(r.body.data.previousPeriodAvailable).toBe(false);
    // Mas 16 dias JÁ sustentam "7 vs 7 anteriores".
    r = await chamarAdmin("GET", "/subscription-history?window=7");
    expect(r.body.data.previousPeriodAvailable).toBe(true);

    montar({ subscription_snapshots: { rows: serie(60, "2026-09-13") } });
    r = await chamarAdmin("GET", "/subscription-history?window=30");
    expect(r.body.data.previousPeriodAvailable).toBe(true);
  });

  it("para 'all' o período anterior não se aplica", async () => {
    montar({ subscription_snapshots: { rows: serie(60, "2026-09-13") } });
    const r = await chamarAdmin("GET", "/subscription-history?window=all");
    expect(r.body.data.previousPeriodAvailable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /overview — os seis cards
// ---------------------------------------------------------------------------

describe("GET /overview", () => {
  function assinatura(over: Record<string, unknown> = {}) {
    return {
      id: "s1",
      user_id: "u1",
      status: "active",
      cancel_at_period_end: false,
      created_at: "2026-07-01T00:00:00Z",
      current_period_end: "2099-01-01T00:00:00Z",
      provider_subscription_id: "sub_1",
      plans: {
        code: "pro_monthly",
        name: "Mensal",
        price_cents: 2990,
        interval: "month",
      },
      ...over,
    };
  }

  function base(over: Record<string, RespostaTabela> = {}) {
    montar({
      profiles: { rows: [], count: 100 },
      subscriptions: { rows: [assinatura()] },
      influencers: { rows: [] },
      finance_transactions: { rows: [] },
      expenses: { rows: [] },
      ai_usage_logs: { rows: [] },
      ...over,
    });
  }

  it("devolve os seis cards e a janela resolvida", async () => {
    base();
    const r = await chamarAdmin("GET", "/overview?window=30");

    expect(r.status).toBe(200);
    expect(r.body.data.window).toBe("30");
    expect(Object.keys(r.body.data.cards).sort()).toEqual([
      "acessoPro",
      "custoIa",
      "mrr",
      "novosUsuarios",
      "receita",
      "receitaEmRisco",
    ]);
  });

  it("window inválida cai em 30, não em 90", async () => {
    base();
    const r = await chamarAdmin("GET", "/overview?window=90");
    expect(r.body.data.window).toBe("30");
  });

  it("RECEITA EM RISCO usa a MESMA normalização mensal do MRR", async () => {
    // A trava contra a terceira implementação: se alguém recalcular
    // 22200/12 ou 12900/6 noutro lugar, os números aqui deixam de bater com o
    // MRR e este teste cai.
    base({
      subscriptions: {
        rows: [
          // anual, agendada: 22200/12 = 1850
          assinatura({
            id: "a",
            cancel_at_period_end: true,
            plans: {
              code: "pro_annual",
              name: "Anual",
              price_cents: 22200,
              interval: "year",
            },
          }),
          // semestral, agendada: 12900/6 = 2150
          assinatura({
            id: "b",
            cancel_at_period_end: true,
            plans: {
              code: "pro_semiannual",
              name: "Semestral",
              price_cents: 12900,
              interval: "semiannual",
            },
          }),
          // mensal, NÃO agendada: entra no MRR e fica fora do risco
          assinatura({ id: "c" }),
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview");

    expect(r.body.data.cards.mrr.value).toBe(1850 + 2150 + 2990);
    expect(r.body.data.cards.receitaEmRisco).toMatchObject({
      count: 2,
      mrrCents: 1850 + 2150,
    });
    // O percentual é do MRR, e sai da mesma soma.
    expect(r.body.data.cards.receitaEmRisco.percentOfMrr).toBeCloseTo(
      ((1850 + 2150) / (1850 + 2150 + 2990)) * 100,
      6,
    );
  });

  it("sem MRR, o percentual em risco é NULO e não divide por zero", async () => {
    base({ subscriptions: { rows: [] } });
    const r = await chamarAdmin("GET", "/overview");
    expect(r.body.data.cards.mrr.value).toBe(0);
    expect(r.body.data.cards.receitaEmRisco.percentOfMrr).toBeNull();
  });

  it("acesso Pro traz os dois ramos separados", async () => {
    base({ influencers: { rows: [{ user_id: "u9" }] } });
    const r = await chamarAdmin("GET", "/overview");
    expect(r.body.data.cards.acessoPro).toMatchObject({
      bySubscription: 1,
      byInfluencer: 1,
      total: 2,
    });
  });

  it("cada card decide o Δ pela SUA série", async () => {
    // profiles desde 2026-05-04 (sustenta 30 dias); finance desde 2026-07-13
    // (não sustenta). Uma regra global da página erraria em um dos dois.
    base({
      profiles: { rows: [{ created_at: "2026-05-04T00:00:00Z" }], count: 100 },
      finance_transactions: {
        rows: [
          {
            id: "f1",
            type: "charge",
            gross_cents: 1000,
            fee_cents: 0,
            net_cents: 1000,
            plan_code: "pro_monthly",
            occurred_at: "2026-07-13T00:00:00Z",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview?window=30");

    expect(r.body.data.cards.novosUsuarios.change.disponivel).toBe(true);
    expect(r.body.data.cards.receita.change).toMatchObject({
      disponivel: false,
      motivo: "historico_insuficiente",
    });
  });

  it("em 'tudo' nenhum card promete Δ", async () => {
    base({
      profiles: { rows: [{ created_at: "2026-01-01T00:00:00Z" }], count: 100 },
    });
    const r = await chamarAdmin("GET", "/overview?window=all");
    expect(r.body.data.cards.novosUsuarios.change).toMatchObject({
      disponivel: false,
      motivo: "janela_sem_anterior",
    });
    expect(r.body.data.windowStartIso).toBeNull();
  });

  it("erro de banco é fail-loud, não card zerado", async () => {
    base({ profiles: { error: { message: "timeout" } } });
    const r = await chamarAdmin("GET", "/overview");
    expect(r.status).toBe(500);
  });
});
