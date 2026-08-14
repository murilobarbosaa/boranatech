import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * EXATIDÃO DOS CARDS DA VISÃO (Fase 1).
 *
 * Cada bloco aqui trava um defeito MEDIDO em produção em 2026-08-14, registrado
 * em `docs/investigacoes/2026-08-14-admin-visao-metricas.md`:
 *
 *   - o admin não tinha card de total, e a única forma de ver 5.456 era mudar o
 *     seletor para "Tudo", o que muda os outros cinco cards junto;
 *   - a tela exibia 96 + 25 e o total era 124, porque as 3 pessoas com
 *     assinatura E concessão de influencer (`both`) não iam no payload;
 *   - o custo de IA saía em dólar com símbolo de real.
 *
 * CONTROLE NEGATIVO EM TODO BLOCO. Um teste que só afirma "o campo existe"
 * passaria sobre um backend que devolve o número errado; o que separa é a
 * asserção do que NÃO deve acontecer.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
  // Valor devolvido pela fonte ÚNICA de contagem total de perfis. É o que a
  // home serve e o que o card "Usuários totais" tem de servir.
  totalDePerfis: 5456 as number | null,
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
    // AUSENTE de propósito: é o estado padrão de produção hoje, e o card não
    // pode inventar uma linha em BRL sem cotação.
    aiCostUsdBrlRate: null,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));

// A FONTE ÚNICA, dublada. `stats.ts` (contador público da home) e `/overview`
// (card "Usuários totais") importam ESTA função; o teste de origem única lá
// embaixo prova que os dois chegam nela.
vi.mock("../lib/profilesCount", () => ({
  contarPerfisTotal: vi.fn(async () => estado.totalDePerfis),
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
import { contarPerfisTotal } from "../lib/profilesCount";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";
import statsRouter, { __resetForTests } from "./stats";

const chamarAdmin = criarClienteAdmin(adminRouter);

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
  estado.double = criarSupabaseDouble(
    {
      // `count` aqui é o que `contarPerfis` (a contagem COM janela) devolve.
      // Deliberadamente diferente de `estado.totalDePerfis`: é assim que se
      // enxerga qual card leu de onde.
      profiles: { rows: [{ created_at: "2026-05-04T00:00:00Z" }], count: 40 },
      subscriptions: { rows: [assinatura()] },
      influencers: { rows: [] },
      finance_transactions: { rows: [] },
      expenses: { rows: [] },
      ai_usage_logs: { rows: [] },
      ...over,
    },
    {},
    undefined,
    1000,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  estado.totalDePerfis = 5456;
});

// ---------------------------------------------------------------------------
// 1.1 — Usuários totais e a ORIGEM ÚNICA
// ---------------------------------------------------------------------------

describe("card Usuários totais (D1)", () => {
  it("vem da fonte sem recorte, e NÃO da contagem com janela", async () => {
    base();
    const r = await chamarAdmin("GET", "/overview?window=30");

    expect(r.status).toBe(200);
    expect(r.body.data.cards.usuariosTotais.value).toBe(5456);
    // CONTROLE NEGATIVO: o card com janela continua com o número da janela. Se
    // os dois viessem da mesma leitura, este expect seria 5456 e o defeito
    // original (um número só para duas perguntas) teria voltado.
    expect(r.body.data.cards.novosUsuarios.value).toBe(40);
    expect(r.body.data.cards.novosUsuarios.value).not.toBe(
      r.body.data.cards.usuariosTotais.value,
    );
  });

  it("é INVARIANTE ao seletor: 7, 30 e tudo devolvem o mesmo total", async () => {
    // O card "Novos usuários" muda com a janela por design; o total não pode.
    // Sem esta asserção, alguém acrescentaria um `.gte(created_at, …)` ao total
    // e o painel voltaria a ter dois números para a mesma pergunta.
    const valores: unknown[] = [];
    for (const janela of ["7", "30", "all"]) {
      base();
      const r = await chamarAdmin("GET", `/overview?window=${janela}`);
      valores.push(r.body.data.cards.usuariosTotais.value);
    }
    expect(valores).toEqual([5456, 5456, 5456]);
  });

  it("degradação do Supabase vira NULL, nunca 0", async () => {
    // Zero é indistinguível de "base vazia" e seria exibido como um fato.
    estado.totalDePerfis = null;
    base();
    const r = await chamarAdmin("GET", "/overview?window=30");
    expect(r.body.data.cards.usuariosTotais.value).toBeNull();
    expect(r.body.data.cards.usuariosTotais.value).not.toBe(0);
  });
});

describe("origem ÚNICA do total de usuários (home e admin)", () => {
  it("o contador da home e o card do admin chegam na MESMA função", async () => {
    // Este é o teste que o plano pediu como "estrutural": ele não compara
    // números mágicos, ele troca o valor da fonte e exige que OS DOIS mudem
    // juntos. Uma segunda query escrita à mão em qualquer um dos lados faz
    // este teste falhar, porque aquele lado não enxergaria o dublê.
    estado.totalDePerfis = 4242;
    base();
    __resetForTests();

    const admin = await chamarAdmin("GET", "/overview?window=30");
    const home = await chamarStats();

    expect(admin.body.data.cards.usuariosTotais.value).toBe(4242);
    expect(home.count).toBe(4242);
    expect(home.count).toBe(admin.body.data.cards.usuariosTotais.value);
    // E os dois passaram pela função dublada, não por caminhos paralelos.
    expect(vi.mocked(contarPerfisTotal)).toHaveBeenCalledTimes(2);
  });

  it("mudando a fonte, os dois mudam juntos (controle negativo)", async () => {
    estado.totalDePerfis = 1;
    base();
    __resetForTests();
    const a1 = await chamarAdmin("GET", "/overview?window=30");
    const h1 = await chamarStats();

    estado.totalDePerfis = 999;
    base();
    __resetForTests();
    const a2 = await chamarAdmin("GET", "/overview?window=30");
    const h2 = await chamarStats();

    expect([a1.body.data.cards.usuariosTotais.value, h1.count]).toEqual([1, 1]);
    expect([a2.body.data.cards.usuariosTotais.value, h2.count]).toEqual([
      999, 999,
    ]);
  });
});

/** Invoca o handler de /users-count direto, no padrão de stats.test.ts. */
async function chamarStats(): Promise<{ count: number | null }> {
  const layer = (
    statsRouter as unknown as {
      stack: Array<{
        route?: { path: string; stack: Array<{ handle: Function }> };
      }>;
    }
  ).stack.find((l) => l.route?.path === "/users-count");
  if (!layer?.route) throw new Error("rota /users-count não encontrada");
  const handler = layer.route.stack[0].handle as (
    req: unknown,
    res: {
      status: (n: number) => unknown;
      json: (b: { count: number | null }) => void;
    },
    next: () => void,
  ) => Promise<void>;
  let body: { count: number | null } | undefined;
  const res = {
    status() {
      return res;
    },
    json(b: { count: number | null }) {
      body = b;
    },
  };
  await handler({}, res, () => {});
  if (!body) throw new Error("handler não chamou res.json");
  return body;
}

// ---------------------------------------------------------------------------
// 1.2 — Acesso Pro: `both`, trialing, past_due
// ---------------------------------------------------------------------------

describe("card Assinantes Pro (D3)", () => {
  it("`both` vai no payload e o total é a UNIÃO, não a soma das parcelas", async () => {
    // Reproduz o caso de produção: u1 tem assinatura E concessão; u2 só
    // assinatura; u3 só concessão.
    //
    // OS DOIS RAMOS SÃO INCLUSIVOS, e este teste é o que fixa isso por escrito.
    // `tallyProSources` devolve `bySubscription = só_assinatura + both` e
    // `byInfluencer = só_influencer + both` (userListEnrichment.ts), com o
    // comentário "quem tem os dois conta nos DOIS ramos". Então quem soma as
    // duas parcelas exibidas conta as pessoas de `both` DUAS VEZES: em produção
    // (2026-08-14) são 99 + 28 = 127 contra um total real de 124.
    //
    // Era este o defeito, e a primeira versão da investigação o descreveu ao
    // contrário ("as 3 pessoas somem da tela"). Elas não somem: aparecem duas
    // vezes. A correção é a mesma — headline = `total` — mas o teste precisa
    // travar a semântica REAL, senão trava a errada.
    base({
      subscriptions: {
        rows: [
          assinatura({ id: "a", user_id: "u1" }),
          assinatura({ id: "b", user_id: "u2" }),
        ],
      },
      influencers: { rows: [{ user_id: "u1" }, { user_id: "u3" }] },
    });

    const r = await chamarAdmin("GET", "/overview?window=30");
    const pro = r.body.data.cards.acessoPro;

    expect(pro).toMatchObject({
      bySubscription: 2, // u1 + u2 (u1 é `both` e conta aqui também)
      byInfluencer: 2, // u1 + u3 (idem)
      both: 1, // u1
      total: 3, // a UNIÃO: u1, u2, u3
    });
    // CONTROLE NEGATIVO: somar as parcelas exibidas dá MAIS que o total. É por
    // isso que o headline precisa ser `total`, vindo pronto do backend.
    expect(pro.bySubscription + pro.byInfluencer).toBeGreaterThan(pro.total);
    // A identidade que vale: subtrair a interseção uma vez fecha a união.
    expect(pro.bySubscription + pro.byInfluencer - pro.both).toBe(pro.total);
  });

  it("trialing conta como acesso, mas fica FORA do MRR e vem em campo próprio", async () => {
    base({
      subscriptions: {
        rows: [
          assinatura({ id: "a", user_id: "u1" }),
          assinatura({ id: "b", user_id: "u2", status: "trialing" }),
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview?window=30");

    expect(r.body.data.cards.mrr.trialingCount).toBe(1);
    expect(r.body.data.cards.mrr.activeCount).toBe(1);
    // CONTROLE NEGATIVO: trial não paga, então não pode entrar no MRR nem no
    // ARPU. 2990, não 5980.
    expect(r.body.data.cards.mrr.value).toBe(2990);
    expect(r.body.data.cards.mrr.arpuCents).toBe(2990);
  });

  it("past_due NÃO concede Pro", async () => {
    // ALCANCE DECLARADO: o dublê REGISTRA `.in()` e `.or()` mas não os aplica
    // às linhas, então o recorte de status que `getMrrSnapshot` faz na QUERY é
    // insimulável aqui — uma asserção sobre `mrr.value` neste cenário estaria
    // medindo o dublê, não o código. O que este teste prova é o ramo que roda
    // em TypeScript: `subscriptionGrantsPro` (fail-closed em status fora de
    // {active, trialing}). Ver `server/lib/userListEnrichment.test.ts` para a
    // enumeração condição a condição da regra de Pro.
    base({
      subscriptions: {
        rows: [assinatura({ id: "a", user_id: "u1", status: "past_due" })],
      },
    });
    const r = await chamarAdmin("GET", "/overview?window=30");
    expect(r.body.data.cards.acessoPro.total).toBe(0);
    expect(r.body.data.cards.acessoPro.bySubscription).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 1.6 — Avulsos de boleto (cs_...): só o período pago vigente conta
// ---------------------------------------------------------------------------

describe("avulsos de boleto no acesso Pro", () => {
  function avulso(over: Record<string, unknown> = {}) {
    return assinatura({
      id: "av",
      user_id: "uav",
      provider_subscription_id: "cs_live_abc",
      plans: {
        code: "pro_semiannual",
        name: "Semestral",
        price_cents: 12900,
        interval: "semiannual",
      },
      ...over,
    });
  }

  it("avulso com período VIGENTE conta como Pro", async () => {
    base({ subscriptions: { rows: [avulso()] } });
    const r = await chamarAdmin("GET", "/overview?window=30");
    expect(r.body.data.cards.acessoPro.bySubscription).toBe(1);
    // 12900 / 6 meses
    expect(r.body.data.cards.mrr.value).toBe(2150);
  });

  it("avulso EXPIRADO não conta (controle negativo)", async () => {
    // Os 8 avulsos medidos em 2026-08-14 estavam todos vigentes (fim entre
    // 2027-01-22 e 2027-08-10), então hoje a contagem está certa. Este teste
    // existe para o dia em que o primeiro vencer: sem ele, o painel seguiria
    // contando alguém que perdeu o acesso.
    //
    // Mesmo alcance declarado do teste de past_due: o corte por
    // `current_period_end` que `getMrrSnapshot` faz via `.or()` não é
    // simulável no dublê, então aqui se prova o ramo TypeScript
    // (`subscriptionGrantsPro`), que é o que decide o ACESSO.
    base({
      subscriptions: {
        rows: [avulso({ current_period_end: "2026-01-01T00:00:00Z" })],
      },
    });
    const r = await chamarAdmin("GET", "/overview?window=30");
    expect(r.body.data.cards.acessoPro.bySubscription).toBe(0);
    expect(r.body.data.cards.acessoPro.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 1.3 — Receita: bruto principal, líquido ao lado
// ---------------------------------------------------------------------------

describe("card Receita no período (D4)", () => {
  it("bruto continua principal e o líquido vem junto, com taxas e reembolsos", async () => {
    base({
      finance_transactions: {
        rows: [
          {
            id: "f1",
            type: "charge",
            gross_cents: 2990,
            fee_cents: 158,
            net_cents: 2832,
            plan_code: "pro_monthly",
            occurred_at: "2026-08-01T00:00:00Z",
          },
          {
            id: "f2",
            type: "refund",
            gross_cents: -1000,
            fee_cents: 0,
            net_cents: -1000,
            plan_code: null,
            occurred_at: "2026-08-02T00:00:00Z",
          },
          // payout NÃO é receita e não pode entrar em nenhum dos números.
          {
            id: "f3",
            type: "payout",
            gross_cents: -5000,
            fee_cents: 0,
            net_cents: -5000,
            plan_code: null,
            occurred_at: "2026-08-03T00:00:00Z",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview?window=30");
    const receita = r.body.data.cards.receita;

    expect(receita.value).toBe(2990);
    expect(receita.reembolsosCents).toBe(1000);
    expect(receita.taxasCents).toBe(158);
    expect(receita.liquidaCents).toBe(2832 - 1000);
    // CONTROLE NEGATIVO: o bruto NÃO desconta reembolso nem taxa, e o líquido
    // NÃO é igual ao bruto. Se um dia forem iguais, alguém trocou a fonte.
    expect(receita.value).not.toBe(receita.liquidaCents);
    // E o payout ficou de fora dos dois.
    expect(receita.liquidaCents).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 1.4 — Custo de IA: unidade e piso declarado
// ---------------------------------------------------------------------------

describe("card Custo de IA (D6)", () => {
  function log(over: Record<string, unknown> = {}) {
    return {
      id: "l1",
      tool: "linkedin-analyzer",
      status: "success",
      cost_estimate: "0.5",
      ...over,
    };
  }

  it("expõe valueUsd e mantém valueBrl com o MESMO número durante a transição", async () => {
    base({ ai_usage_logs: { rows: [log(), log({ id: "l2" })] } });
    const r = await chamarAdmin("GET", "/overview?window=30");
    const custo = r.body.data.cards.custoIa;

    expect(custo.valueUsd).toBeCloseTo(1, 6);
    // O alias existe e carrega o MESMO valor: é o que impede o bundle antigo de
    // quebrar na janela de deploy. Removê-lo antes da hora faz este teste cair.
    expect(custo.valueBrl).toBe(custo.valueUsd);
  });

  it("conta as chamadas SEM custo medido e não as soma no total", async () => {
    base({
      ai_usage_logs: {
        rows: [
          log({ id: "l1", cost_estimate: "0.5" }),
          // github-perfil: executou, e o call site não passa costEstimate.
          log({ id: "l2", tool: "github-perfil", cost_estimate: "0" }),
          log({ id: "l3", tool: "career-plan", cost_estimate: null }),
          // CONTROLE NEGATIVO: erro não chamou o modelo. Custo zero aqui é o
          // valor CERTO, e não pode inflar o contador de "não medido".
          log({
            id: "l4",
            tool: "github-repo",
            status: "error",
            cost_estimate: "0",
          }),
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview?window=30");
    const custo = r.body.data.cards.custoIa;

    expect(custo.valueUsd).toBeCloseTo(0.5, 6);
    expect(custo.chamadasSemCustoMedido).toBe(2);
  });

  it("sem AI_COST_USD_BRL_RATE, NÃO existe linha em BRL", async () => {
    // Ausência declarada. Converter por 1 exibiria "R$ 2,41" de novo, que é
    // exatamente o defeito que esta fase corrige.
    base({ ai_usage_logs: { rows: [log()] } });
    const r = await chamarAdmin("GET", "/overview?window=30");
    expect(r.body.data.cards.custoIa.valorEmBrl).toBeNull();
    expect(r.body.data.cards.custoIa.cotacaoUsdBrl).toBeNull();
  });
});
