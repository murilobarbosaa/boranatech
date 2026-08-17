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
import { criarClienteAdmin, type RespostaHttp } from "./adminTestClient";
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

// ---------------------------------------------------------------------------
// FASE 2 — card e gráfico sobre a MESMA janela
// ---------------------------------------------------------------------------

describe("card e gráfico concordam sobre o intervalo (regressão dos 182)", () => {
  /**
   * O defeito medido em 2026-08-14 às 04:53 UTC: o card "Novos usuários" dizia
   * 4.788 e o gráfico "Cadastros por dia" logo abaixo dizia 4.606, os dois
   * rotulados "últimos 30 dias". Nenhum estava errado por dentro; eles usavam
   * definições diferentes de "30 dias" — instante deslizante em UTC contra dia
   * civil de Brasília.
   *
   * ALCANCE DECLARADO deste teste. O dublê devolve o `count` configurado sem
   * aplicar filtro, então ele NÃO pode provar "os dois somam o mesmo número" —
   * uma asserção assim aqui mediria o dublê. O que ele prova, e é a causa raiz,
   * é que **as duas rotas pedem ao banco o MESMO instante de corte** e que o
   * gráfico cobre exatamente os dias civis que o card declara. Divergência de
   * intervalo era o mecanismo; igualdade de intervalo é o que fecha a classe.
   */
  it("as duas rotas usam o MESMO instante de corte inferior", async () => {
    // A fixture precisa de um perfil ANTIGO: o gráfico nunca começa antes do
    // primeiro cadastro da base (inventar dias anteriores seria desenhar zeros
    // que não são medição), então com a base vazia ele colapsaria em um dia só
    // e o teste compararia a janela contra esse colapso, não contra si mesma.
    base();
    await chamarAdmin("GET", "/overview?window=7");
    const corteDoCard = estado.double
      .de("profiles")
      .flatMap((c) => c.filtros)
      .filter((f) => f.tipo === "gte" && f.coluna === "created_at")
      .map((f) => f.valor);

    base();
    await chamarAdmin("GET", "/signup-history?window=7");
    const corteDoGrafico = estado.double
      .de("profiles")
      .flatMap((c) => c.filtros)
      .filter((f) => f.tipo === "gte" && f.coluna === "created_at")
      .map((f) => f.valor);

    expect(corteDoCard.length).toBeGreaterThan(0);
    expect(corteDoGrafico.length).toBeGreaterThan(0);
    // O card faz DUAS contagens de perfis, a da janela atual e a do período
    // anterior, então registra dois cortes. O que tem de coincidir com o
    // gráfico é o da janela ATUAL, que é o mais recente dos dois.
    const inicioAtualDoCard = corteDoCard.slice().sort().at(-1);
    expect(inicioAtualDoCard).toBe(corteDoGrafico[0]);
    // E ele é meia-noite de Brasília, não meia-noite UTC.
    expect(String(inicioAtualDoCard)).toMatch(/T03:00:00\.000Z$/);
  });

  it("o gráfico cobre exatamente os dias civis que a janela declara", async () => {
    base();
    const cards = await chamarAdmin("GET", "/overview?window=7");

    base();
    const grafico = await chamarAdmin("GET", "/signup-history?window=7");

    const pontos = grafico.body.data.points as Array<{ date: string }>;
    expect(pontos).toHaveLength(7);
    expect(pontos[0].date).toBe(cards.body.data.windowFirstDay);
    expect(pontos[pontos.length - 1].date).toBe(cards.body.data.windowLastDay);
    // E o rótulo é literalmente o mesmo texto nos dois blocos.
    expect(grafico.body.data.windowLabel).toBe(cards.body.data.windowLabel);
    expect(grafico.body.data.tz).toBe(cards.body.data.tz);
  });

  it("o payload declara o intervalo e o fuso, para o badge não recalcular fuso", async () => {
    base();
    const r = await chamarAdmin("GET", "/overview?window=30");

    expect(r.body.data.tz).toBe("Brasília");
    expect(r.body.data.windowLabel).toMatch(/^\d{1,2} \w{3} - \d{1,2} \w{3}$/);
    expect(r.body.data.previousLabel).toMatch(
      /^\d{1,2} \w{3} - \d{1,2} \w{3}$/,
    );
    // CONTROLE NEGATIVO: em 'tudo' não existe período anterior, e o rótulo dele
    // é ausência declarada, não string vazia.
    base();
    const tudo = await chamarAdmin("GET", "/overview?window=all");
    expect(tudo.body.data.previousLabel).toBeNull();
    expect(tudo.body.data.windowFirstDay).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2.4 — staleDays: comportamento ATUAL fixado, pendência declarada
// ---------------------------------------------------------------------------

describe("frescor do snapshot no /subscription-history (D14)", () => {
  /**
   * Este bloco NÃO afirma que o comportamento está certo. Ele fixa o
   * comportamento atual para que a mudança futura seja deliberada, e mede a
   * janela diária em que ele mente.
   *
   * `staleDays` subtrai dois RÓTULOS de dia: o dia UTC gravado em
   * `snapshot_date` e o dia UTC de agora. O cron roda às 05:10 UTC, então entre
   * 00:00Z e 05:10Z o rótulo de hoje já virou e o snapshot ainda não rodou —
   * `staleDays = 1` sem nada estar atrasado. São 5h10 por dia.
   *
   * O dia civil de Brasília seria melhor (2h10), e mesmo assim não é o conserto:
   * o certo é medir duração desde o instante em que a próxima execução era
   * esperada. Ver o comentário em `server/routes/admin.ts`.
   */
  function comSnapshots(datas: string[]) {
    base({
      subscription_snapshots: {
        rows: datas.map((d) => ({
          snapshot_date: d,
          active_count: 1,
          trialing_count: 0,
          mrr_cents: 2990,
        })),
      },
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("depois da execução do dia, staleDays é 0", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T06:00:00Z")); // depois das 05:10Z
    comSnapshots(["2026-08-13", "2026-08-14"]);

    const r = await chamarAdmin("GET", "/subscription-history?window=7");

    expect(r.body.data.staleDays).toBe(0);
  });

  it("D14: ANTES da execução do dia, com o snapshot de ontem, NÃO acusa atraso", async () => {
    // ESTE TESTE FOI INVERTIDO na Fase 4. Ele fixava o defeito (o campo acusava
    // 1 dia às 01:30Z sem nada estar atrasado, 5h10 por dia); agora fixa a
    // correção. `staleHours` mede DURAÇÃO desde a última execução esperada, e
    // às 01:30Z a execução das 05:10Z ainda não era devida.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T01:30:00Z")); // 22:30 BRT de 13/08
    comSnapshots(["2026-08-12", "2026-08-13"]);

    const r = await chamarAdmin("GET", "/subscription-history?window=7");

    expect(r.body.data.staleHours).toBe(0);
    expect(r.body.data.snapshotAtrasado).toBe(false);
    // CONTROLE NEGATIVO: o comportamento ANTIGO daria 1 neste mesmo instante.
    // O alias `staleDays` (expand/contract) deriva do novo e também dá 0.
    expect(r.body.data.staleDays).toBe(0);
  });

  it("D14: uma execução inteira perdida continua sendo acusada", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T06:00:00Z"));
    comSnapshots(["2026-08-12"]);

    const r = await chamarAdmin("GET", "/subscription-history?window=7");

    expect(r.body.data.staleHours).toBe(48);
    expect(r.body.data.snapshotAtrasado).toBe(true);
    expect(r.body.data.staleDays).toBe(2);
  });

  it("cron parado de verdade continua sendo acusado", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T06:00:00Z"));
    comSnapshots(["2026-08-10"]);

    const r = await chamarAdmin("GET", "/subscription-history?window=7");

    expect(r.body.data.staleHours).toBe(96);
    expect(r.body.data.snapshotAtrasado).toBe(true);
    expect(r.body.data.staleDays).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// FASE 4 — séries diárias, funil e uso por ferramenta
// ---------------------------------------------------------------------------

describe("GET /overview-series", () => {
  /** Um cadastro num dia civil de Brasília (15:00Z = 12:00 local). */
  function perfil(dia: string, id: string) {
    // 03:30Z = 00:30 em Brasília do MESMO dia civil (a meia-noite local é
    // 03:00Z), e no passado em relação a qualquer hora de execução do teste. Com
    // 15:00Z a linha de "hoje" ficava no FUTURO e caía fora da janela, que é
    // como esta fixture descobriu que série e funil usavam critérios diferentes.
    return { user_id: id, created_at: `${dia}T03:30:00Z` };
  }
  /**
   * Um dia civil de Brasília N dias atrás, para fixture que precisa cair DENTRO
   * de uma janela de 7 dias em qualquer data de execução.
   *
   * Data fixa na fixture é dependência de calendário: `2026-08-10` estava dentro
   * da janela de 7 dias no dia em que o teste foi escrito e saiu dela na virada
   * seguinte, deixando a suíte vermelha sem nada ter quebrado. É a mesma família
   * do teste que falhava por hora do dia (`staleDays`, em adminPaginacao).
   */
  function diasAtras(n: number) {
    const d = new Date(Date.now() - n * 24 * 3600_000);
    // 03:30Z do dia civil de Brasília: o mesmo instante que `perfil` usa, então
    // o recorte é o mesmo dos dois lados.
    return new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  }
  function serie(r: RespostaHttp, chave: string) {
    return (
      r.body.data.series as Array<{
        chave: string;
        tipo: string;
        pontos: Array<{ date: string; value: number | null }>;
        total: number | null;
      }>
    ).find((s) => s.chave === chave)!;
  }

  it("FLUXO tem zero-fill: dia sem cadastro é uma barra ZERO, não um buraco", async () => {
    // Zero aqui é medição: ninguém se cadastrou. Omitir o dia faria o gráfico
    // parecer mais curto que o período.
    base({
      profiles: {
        rows: [perfil("2026-08-14", "u1"), perfil("2026-08-12", "u2")],
        count: 2,
      },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=7");

    const cadastros = serie(r, "cadastros");
    expect(cadastros.tipo).toBe("fluxo");
    expect(cadastros.pontos).toHaveLength(7);
    expect(cadastros.pontos.every((p) => typeof p.value === "number")).toBe(
      true,
    );
    expect(cadastros.pontos.filter((p) => p.value === 0).length).toBe(5);
  });

  it("ESTOQUE não fabrica dia: sem snapshot, o ponto é NULL, nunca 0", async () => {
    // A diferença que impede o gráfico de afirmar que o MRR caiu a zero num dia
    // em que ninguém mediu.
    base({
      profiles: { rows: [perfil("2026-08-14", "u1")], count: 1 },
      subscription_snapshots: {
        rows: [
          {
            snapshot_date: "2026-08-14",
            mrr_cents: 272550,
            active_count: 99,
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=7");

    const mrr = serie(r, "mrrCents");
    expect(mrr.tipo).toBe("estoque");
    const nulos = mrr.pontos.filter((p) => p.value === null);
    expect(nulos.length).toBe(6);
    // CONTROLE NEGATIVO: nenhum dia sem snapshot virou zero.
    expect(mrr.pontos.filter((p) => p.value === 0)).toEqual([]);
    // O total do estoque é o ÚLTIMO valor medido, não a soma.
    expect(mrr.total).toBe(272550);
  });

  it("toda série declara a DIREÇÃO, para o client não inferir pelo nome", async () => {
    base({ profiles: { rows: [perfil("2026-08-14", "u1")], count: 1 } });
    const r = await chamarAdmin("GET", "/overview-series?window=7");
    const direcoes = Object.fromEntries(
      (r.body.data.series as Array<{ chave: string; direcao: string }>).map(
        (s) => [s.chave, s.direcao],
      ),
    );
    expect(direcoes.cadastros).toBe("up_bom");
    expect(direcoes.receitaBrutaCents).toBe("up_bom");
    // Custo subindo é RUIM, e isso não está no nome da métrica.
    expect(direcoes.custoIaUsd).toBe("up_ruim");
    expect(direcoes.chamadasSemCustoMedido).toBe("up_ruim");
  });

  it("REGRESSÃO DOS 182, estendida: card e série somam o MESMO número", async () => {
    // A mesma fixture alimenta o card (contagem com janela) e a série diária. Se
    // o bucketing da série divergir da janela do card, os dois números se
    // separam — que é exatamente o defeito que a Fase 2 fechou entre card e
    // gráfico de cadastros.
    // DIAS RELATIVOS: os três precisam cair dentro da janela de 7 dias em
    // qualquer data de execução. Com datas fixas, `2026-08-10` saiu da janela na
    // virada do dia e a soma da série passou a divergir do card por calendário,
    // não por defeito.
    const linhas = [
      perfil(diasAtras(0), "u1"),
      perfil(diasAtras(1), "u2"),
      perfil(diasAtras(4), "u3"),
    ];
    base({ profiles: { rows: linhas, count: linhas.length } });

    const cards = await chamarAdmin("GET", "/overview?window=7");
    base({ profiles: { rows: linhas, count: linhas.length } });
    const series = await chamarAdmin("GET", "/overview-series?window=7");

    const soma = serie(series, "cadastros").pontos.reduce(
      (a, p) => a + (p.value ?? 0),
      0,
    );
    expect(soma).toBe(cards.body.data.cards.novosUsuarios.value);
    // E os dois blocos declaram o MESMO intervalo, com o mesmo texto.
    expect(series.body.data.windowLabel).toBe(cards.body.data.windowLabel);
  });

  it("funil traz taxas adjacentes e NENHUM delta entre janelas", async () => {
    base({
      // QUATRO PESSOAS, escolhidas para separar os três passos de ponta a ponta:
      //   u1  assinou E usou       -> conta nos três
      //   u2  assinou e NUNCA usou -> conta no 2º, NÃO no 3º (controle negativo)
      //   u3  usou e NÃO assinou   -> não conta em nenhum dos dois
      //   u4  só se cadastrou      -> só no topo
      // Com um assinante só, os passos 2 e 3 dariam o mesmo número e a
      // reordenação passaria sem ninguém notar.
      profiles: {
        rows: [
          perfil("2026-08-14", "u1"),
          perfil("2026-08-13", "u2"),
          perfil("2026-08-13", "u3"),
          perfil("2026-08-12", "u4"),
        ],
        count: 4,
      },
      ai_usage_logs: {
        rows: [
          {
            id: "l1",
            user_id: "u1",
            tool: "linkedin-analyzer",
            status: "success",
            cost_estimate: "0.5",
            created_at: "2026-08-14T03:30:00Z",
          },
          {
            id: "l2",
            user_id: "u3",
            tool: "linkedin-analyzer",
            status: "success",
            cost_estimate: "0.5",
            created_at: "2026-08-13T03:30:00Z",
          },
        ],
      },
      subscriptions: {
        rows: [
          assinatura({
            id: "s1",
            user_id: "u1",
            created_at: "2026-08-14T15:00:00Z",
          }),
          assinatura({
            id: "s2",
            user_id: "u2",
            created_at: "2026-08-13T15:00:00Z",
          }),
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=7");
    const f = r.body.data.funil;

    // D20: cadastro -> assinou Pro -> assinantes que já usaram.
    expect(f.passos.map((p: { chave: string }) => p.chave)).toEqual([
      "cadastro",
      "pro",
      "engajamento",
    ]);
    expect(f.passos.map((p: { valor: number }) => p.valor)).toEqual([4, 2, 1]);
    expect(f.passos[1].taxaSobreAnterior).toBeCloseTo(50, 6);
    // CONTROLE NEGATIVO ponta a ponta: 'u2' pagou e nunca usou, então o 3º passo
    // é 1 de 2, não 2 de 2. E 'u3' usou sem assinar e NÃO entra: se entrasse, a
    // taxa daria 100% e o problema de engajamento sumiria da tela.
    expect(f.passos[2].taxaSobreAnterior).toBeCloseTo(50, 6);
    // O delta NÃO existe, e o motivo é nomeado. Com 4 cadastros na fixture, o
    // motivo específico é o TAMANHO da coorte (mínimo de 100), não a
    // maturidade: motivo genérico mandaria investigar a coisa errada.
    expect(f.motivoSemDelta).toBe("coorte_anterior_pequena");
    expect(f.deltaPp).toBeNull();
    // Empate em 50%: o `reduce` mantém o PRIMEIRO, e a regra é determinística.
    expect(f.destaque).toBe("pro");
  });

  it("CONTROLE NEGATIVO: base vazia não vira NaN em lugar nenhum", async () => {
    base({
      profiles: { rows: [], count: 0 },
      subscriptions: { rows: [] },
      ai_usage_logs: { rows: [] },
      finance_transactions: { rows: [] },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=7");

    expect(r.status).toBe(200);
    const f = r.body.data.funil;
    expect(f.passos[1].taxaSobreAnterior).toBeNull();
    expect(f.destaque).toBeNull();
    expect(r.body.data.ferramentas).toEqual([]);
    const texto = JSON.stringify(r.body.data);
    expect(texto).not.toContain("NaN");
    expect(texto).not.toContain("Infinity");
  });

  it("uso por ferramenta separa custo medido de NÃO medido", async () => {
    // É este número que prioriza a Fase 5: a ferramenta com mais chamadas sem
    // custo é a que mais distorce o total.
    base({
      profiles: { rows: [perfil("2026-08-14", "u1")], count: 1 },
      ai_usage_logs: {
        rows: [
          {
            id: "l1",
            user_id: "u1",
            tool: "github-perfil",
            status: "success",
            cost_estimate: "0",
            created_at: "2026-08-14T03:30:00Z",
          },
          {
            id: "l2",
            user_id: "u1",
            tool: "linkedin-analyzer",
            status: "success",
            cost_estimate: "0.25",
            created_at: "2026-08-14T03:30:00Z",
          },
        ],
      },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=7");
    const porTool = Object.fromEntries(
      (
        r.body.data.ferramentas as Array<{
          tool: string;
          chamadas: number;
          custoUsd: number;
          semCustoMedido: number;
        }>
      ).map((f) => [f.tool, f]),
    );

    expect(porTool["github-perfil"]).toMatchObject({
      chamadas: 1,
      custoUsd: 0,
      semCustoMedido: 1,
    });
    expect(porTool["linkedin-analyzer"].semCustoMedido).toBe(0);
    expect(porTool["linkedin-analyzer"].custoUsd).toBeCloseTo(0.25, 6);
  });

  it("declara o que NÃO tem fonte local, em vez de omitir em silêncio", async () => {
    base({ profiles: { rows: [perfil("2026-08-14", "u1")], count: 1 } });
    const r = await chamarAdmin("GET", "/overview-series?window=7");
    const chaves = (
      r.body.data.semFonteLocal as Array<{ chave: string; motivo: string }>
    ).map((x) => x.chave);
    expect(chaves).toContain("chargesFalhadasPorDia");
    expect(chaves).toContain("aquisicaoPorCanal");
  });
});

describe("REGRESSÃO: série de 'tudo' começa no PRIMEIRO cadastro", () => {
  it("o início da série é o menor created_at, não a primeira linha lida", async () => {
    // BUG MEDIDO em 2026-08-14: a varredura de perfis ordena por `user_id`
    // (exigência da paginação por OFFSET), e o código usava `perfis[0]` como
    // primeiro dia da base. O menor UUID era de 2026-08-10 e o menor
    // `created_at` de 2026-05-04, então `window=all` desenhava CINCO dias e
    // somava 19 conversões onde existiam 104. Cinco barras plausíveis, nada
    // acusando.
    //
    // A fixture reproduz a condição: a linha ANTIGA vem DEPOIS na ordem de
    // leitura, exatamente como acontecia com o UUID.
    base({
      profiles: {
        rows: [
          { user_id: "aaa", created_at: "2026-08-13T03:30:00Z" },
          { user_id: "zzz", created_at: "2026-05-04T03:30:00Z" },
        ],
        count: 2,
      },
    });

    const r = await chamarAdmin("GET", "/overview-series?window=all");

    const cadastros = (
      r.body.data.series as Array<{ chave: string; pontos: unknown[] }>
    ).find((s) => s.chave === "cadastros")!;
    // De 04/05 até hoje são bem mais que os 5 dias do bug.
    expect(cadastros.pontos.length).toBeGreaterThan(90);
    expect((cadastros.pontos as Array<{ date: string }>)[0].date).toBe(
      "2026-05-04",
    );
  });
});
