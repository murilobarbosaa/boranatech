import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GUARD DE COBRANCA SEM DONO, na rota da faixa de saude.
 *
 * `healthBand.test.ts` cobre a REGRA (o que vira aviso, com que texto e que
 * severidade). Aqui e a CONSULTA: quais linhas ela pega, o que ela exclui, e o
 * que acontece quando ela falha. E a pergunta perigosa, porque um filtro largo
 * demais contaria payout (que nao tem dono por definicao) e um filtro estreito
 * demais nao acusaria nada, que foi o estado da coisa por 8 dias.
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
import {
  CHARGE_SEM_DONO_CORTE_DIAS,
  SYNC_FINANCE_WINDOW_DAYS,
} from "../lib/financeSyncWindow";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

const DIA_MS = 24 * 60 * 60 * 1000;

function montar(respostas: Record<string, RespostaTabela>) {
  estado.double = criarSupabaseDouble(respostas, {}, undefined, 1000);
}

/** Uma linha de finance_transactions com a idade dada. */
function linha(
  tipo: string,
  grossCents: number,
  diasAtras: number,
  userId: string | null,
) {
  return {
    id: `ft-${tipo}-${diasAtras}-${grossCents}`,
    type: tipo,
    gross_cents: grossCents,
    user_id: userId,
    occurred_at: new Date(Date.now() - diasAtras * DIA_MS).toISOString(),
  };
}

/** O resto da faixa em estado saudável, para o aviso testado sair sozinho. */
function faixaSaudavel(financeRows: Array<Record<string, unknown>>) {
  montar({
    finance_transactions: { rows: financeRows },
    subscription_snapshots: {
      rows: [
        { id: "s1", snapshot_date: new Date().toISOString().slice(0, 10) },
      ],
    },
    subscriptions: { rows: [] },
    profiles: { rows: [{ user_id: "u1" }] },
  });
}

async function problemas() {
  const r = await chamarAdmin("GET", "/health-band");
  return (r.body.data?.problemas ?? []) as Array<{
    id: string;
    detalhe: string;
    severidade: string;
  }>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("guard de cobrança sem dono", () => {
  // O QUE ESTE ARQUIVO PODE PROVAR, e o que ele NAO pode.
  //
  // O dublê do harness REGISTRA os filtros e não os aplica. Então um teste do
  // tipo "payout não acusa" passaria aqui mesmo se o filtro `type=charge` fosse
  // removido do código: as linhas voltam todas de qualquer jeito, e o teste
  // estaria verde sobre uma consulta errada. Seria o instrumento que falha
  // PASSANDO, a classe que o CLAUDE.md documenta.
  //
  // O que discrimina as linhas é INTEIRAMENTE o conjunto de filtros, e é ele
  // que dá para afirmar de verdade. Por isso o teste central abaixo afirma o
  // conjunto EXATO (não "contém type=charge", mas "são exatamente estes três"):
  // remover o corte por idade, trocar `is null` por outra coisa ou soltar o
  // `type` derruba o teste. Quem aplica os filtros é o PostgREST, e ele não é
  // objeto de teste nosso.
  //
  // A regra de exibição (quando vira aviso, com que texto, com que severidade, e
  // o silêncio no zero) é testada em `server/lib/healthBand.test.ts`, onde as
  // entradas são controladas uma a uma sem dublê nenhum no caminho.

  it("a consulta pede EXATAMENTE os três filtros que a discriminam", async () => {
    faixaSaudavel([]);
    await problemas();

    const filtros = estado.double
      .de("finance_transactions")
      .flatMap((c) => c.filtros);

    // `type=charge` é o que mantém payout fora (não tem dono POR DEFINIÇÃO, e
    // ficar sem é o correto) e também refund e dispute, que têm caminho próprio
    // de atribuição pela cobrança-mãe.
    expect(filtros).toContainEqual({
      tipo: "eq",
      coluna: "type",
      valor: "charge",
    });
    expect(filtros).toContainEqual({
      tipo: "is",
      coluna: "user_id",
      valor: null,
    });
    // AFIRMA O TOTAL, não a pertinência: com três filtros conhecidos e o total
    // travado, tirar qualquer um deles quebra aqui.
    expect(filtros).toHaveLength(3);
    expect(filtros.map((f) => `${f.tipo}:${f.coluna}`).sort()).toEqual([
      "eq:type",
      "is:user_id",
      "lt:occurred_at",
    ]);
  });

  it("o corte por idade é MAIOR que a janela do sync", async () => {
    // A regra: só acusa o que o sync já não alcança mais. Corte menor ou igual
    // à janela faria a faixa gritar com linha que o cron ainda vai resolver.
    faixaSaudavel([]);
    await problemas();

    const corte = estado.double
      .de("finance_transactions")
      .flatMap((c) => c.filtros)
      .find((f) => f.tipo === "lt" && f.coluna === "occurred_at");
    expect(corte).toBeDefined();

    const idadeDoCorte =
      (Date.now() - Date.parse(String(corte!.valor))) / DIA_MS;
    expect(idadeDoCorte).toBeGreaterThan(SYNC_FINANCE_WINDOW_DAYS);
    expect(idadeDoCorte).toBeCloseTo(CHARGE_SEM_DONO_CORTE_DIAS, 1);
  });

  it("o que a consulta devolve vira aviso, com o valor em reais", async () => {
    faixaSaudavel([linha("charge", 9030, 30, null)]);

    const p = (await problemas()).find((x) => x.id === "charge-sem-dono");

    expect(p).toBeDefined();
    expect(p!.detalhe).toContain("90,30");
    expect(p!.severidade).toBe("atencao");
  });

  it("consulta vazia NÃO produz o aviso", async () => {
    faixaSaudavel([]);

    expect(
      (await problemas()).find((x) => x.id === "charge-sem-dono"),
    ).toBeUndefined();
  });

  it("soma TODAS as linhas devolvidas, não só a primeira", async () => {
    faixaSaudavel([
      linha("charge", 9030, 30, null),
      linha("charge", 2990, 40, null),
    ]);

    const p = (await problemas()).find((x) => x.id === "charge-sem-dono")!;
    expect(p.detalhe).toContain("120,20");
    expect(p.detalhe).toContain("2 cobranças");
  });

  it("falha de LEITURA não vira silêncio: a rota devolve 500", async () => {
    // Zero por erro de banco apagaria o aviso, e falha de infra contada como
    // saúde é o `contarLinhas` devolvendo -1 do CLAUDE.md com o sinal trocado.
    montar({
      finance_transactions: { error: { message: "boom" } },
      subscription_snapshots: {
        rows: [
          { id: "s1", snapshot_date: new Date().toISOString().slice(0, 10) },
        ],
      },
      subscriptions: { rows: [] },
      profiles: { rows: [{ user_id: "u1" }] },
    });

    const r = await chamarAdmin("GET", "/health-band");
    expect(r.status).toBe(500);
  });
});
