import { afterEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
}));
const cache = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: [] as string[],
}));

vi.mock("../lib/queue", () => ({
  emailQueue: null,
  enqueueEmail: vi.fn(),
  createEmailWorker: vi.fn(),
}));
vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: {
    get: async (key: string) => cache.values.get(key) ?? null,
    set: async (key: string, value: string) => {
      cache.sets.push(key);
      cache.values.set(key, value);
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
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: "admin-1", email: "admin@exemplo.com" };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  resolveProStatus: async () => false,
  isDevProUser: () => false,
}));

import { criarSupabaseDouble } from "./adminUsersHarness.test";
import adminRouter, {
  carregarOverviewSeries,
  overviewSeriesContractRequested,
} from "./admin";
import { errorHandler, type AppError } from "../middleware/error";
import { montarSeriesDaVisao } from "../lib/overviewSeries";
import { resolverJanela } from "../lib/overviewWindow";

function finance(over: Record<string, unknown>) {
  return {
    id: "ft-base",
    provider: "stripe",
    provider_transaction_id: "bt-base",
    stripe_charge_id: "ch-base",
    type: "charge",
    gross_cents: 1000,
    occurred_at: "2026-09-10T12:00:00Z",
    created_at: "2026-09-10T12:05:00Z",
    user_id: "u1",
    plan_code: "pro_monthly",
    ...over,
  };
}

function setup(
  financeError: { message: string } | null = null,
  financeCount?: number,
  overrides: {
    profiles?: Array<{ user_id: string; created_at: string }>;
    financeRows?: Array<ReturnType<typeof finance>>;
    aiRows?: Array<Record<string, unknown>>;
  } = {},
) {
  estado.double = criarSupabaseDouble(
    {
      profiles: {
        rows: overrides.profiles ?? [
          { user_id: "u1", created_at: "2026-09-01T12:00:00Z" },
          { user_id: "u2", created_at: "2026-09-02T12:00:00Z" },
        ],
      },
      finance_transactions: financeError
        ? { rows: [], error: financeError }
        : {
            count: financeCount,
            rows: overrides.financeRows ?? [
              finance({
                id: "old",
                stripe_charge_id: "ch-old",
                occurred_at: "2026-07-01T12:00:00Z",
              }),
              finance({
                id: "new-u1",
                provider: "asaas",
                provider_transaction_id: "pay-u1",
                stripe_charge_id: null,
              }),
              finance({
                id: "new-u2",
                user_id: "u2",
                stripe_charge_id: "ch-u2",
              }),
              finance({
                id: "orphan",
                user_id: null,
                stripe_charge_id: "ch-orphan",
              }),
              finance({
                id: "duplicate",
                user_id: "u2",
                stripe_charge_id: "ch-u2",
              }),
              finance({
                id: "old-signup",
                user_id: "u-old",
                stripe_charge_id: "ch-old-signup",
              }),
            ],
          },
      subscriptions: {
        rows: [
          {
            id: "sub-pay-u1",
            provider: "asaas",
            provider_subscription_id: "pay-u1",
            payment_method: "pix",
          },
          // Linhas de acesso pendentes sem charge no ledger não criam pagamento.
          {
            id: "sub-pay-pending",
            provider: "asaas",
            provider_subscription_id: "pay-pending",
            payment_method: "pix",
          },
          {
            id: "sub-boleto-pending",
            provider: "stripe",
            provider_subscription_id: "cs-boleto-pending",
            payment_method: "boleto",
          },
        ],
      },
      ai_usage_logs: {
        rows: overrides.aiRows ?? [
          {
            id: "ai-u1",
            user_id: "u1",
            tool: "linkedin",
            status: "success",
            cost_estimate: "0.01",
            created_at: "2026-09-10T13:00:00Z",
          },
          {
            id: "ai-u2",
            user_id: "u2",
            tool: "linkedin",
            status: "error",
            cost_estimate: "0",
            created_at: "2026-09-10T13:00:00Z",
          },
        ],
      },
      subscription_snapshots: { rows: [] },
    },
    {},
    undefined,
    2,
  );
}

async function chamarHandlerRegistrado(contract: unknown, window = "30") {
  const layer = (
    adminRouter as unknown as {
      stack: Array<{
        route?: {
          path: string;
          stack: Array<{
            handle: (
              req: Record<string, unknown>,
              res: Record<string, unknown>,
              next: (error?: unknown) => void,
            ) => unknown;
          }>;
        };
      }>;
    }
  ).stack.find((item) => item.route?.path === "/overview-series");
  if (!layer?.route) throw new Error("handler /overview-series não registrado");

  let status = 200;
  let body: unknown;
  let pending: Promise<unknown> | null = null;
  const req = {
    query: { contract, window },
    method: "GET",
    path: "/overview-series",
  };
  const res = {
    locals: {},
    status(code: number) {
      status = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  };
  const next = (error?: unknown) => {
    if (!error) return;
    pending = Promise.resolve(
      errorHandler(error as AppError, req as never, res as never, () => {}),
    );
  };
  await layer.route.stack.at(-1)!.handle(req, res, next);
  if (pending) await pending;
  return { status, body };
}

afterEach(() => {
  vi.clearAllMocks();
  cache.values.clear();
  cache.sets.length = 0;
});

describe("GET /overview-series contrato v3", () => {
  it("handler registrado negocia v3 e devolve 409 controlado para contrato incompatível", async () => {
    const incompatible = await chamarHandlerRegistrado("2");
    expect(incompatible).toEqual({
      status: 409,
      body: {
        error: {
          code: "overview_series_contract_mismatch",
          message: "Contrato da Visão incompatível. Atualize a página.",
        },
      },
    });

    setup();
    const compatible = await chamarHandlerRegistrado("3");
    expect(compatible.status).toBe(200);
    expect((compatible.body as any).data.contractVersion).toBe(3);
    expect(cache.sets).toEqual(["admincache:overview-series:v3:30"]);
  });

  it("handler registrado propaga falha de leitura como 500 sem gravar cache", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    setup({ message: "timeout sintético" });
    const response = await chamarHandlerRegistrado("3");
    expect(response).toEqual({
      status: 500,
      body: {
        error: { code: "db_error", message: "Erro ao ler a base." },
      },
    });
    expect(cache.sets).toEqual([]);
    consoleError.mockRestore();
  });
  it("exige negociação explícita para bundle antigo não interpretar payload novo", () => {
    expect(overviewSeriesContractRequested(undefined)).toBe(false);
    expect(overviewSeriesContractRequested("1")).toBe(false);
    expect(overviewSeriesContractRequested("2")).toBe(false);
    expect(overviewSeriesContractRequested("3")).toBe(true);
  });

  it("pagina até provar o total e reconcilia gráfico/funil sem chamar assinatura de pagamento", async () => {
    setup();
    const response = await carregarOverviewSeries("30");

    expect(response.data.contractVersion).toBe(3);
    expect(response.data.pagamentos.pagamentosUtilizaveisNoPeriodo).toBe(4);
    expect(response.data.pagamentos.pessoasIdentificadas).toBe(3);
    expect(response.data.pagamentos.semPessoaNoPeriodo).toBe(1);
    expect(response.data.pagamentos.cobertura.registrosDuplicados).toBe(1);
    expect(response.data.pagamentos.porMeio).toEqual([
      { rotulo: "Não identificado", pagamentos: 3 },
      { rotulo: "Pix", pagamentos: 1 },
    ]);
    expect(response.data.funil.passos.map((p) => p.valor)).toEqual([2, 2, 1]);
    expect(
      response.data.pagamentos.series.reduce(
        (total, serie) => total + (serie.total ?? 0),
        0,
      ),
    ).toBe(response.data.pagamentos.pagamentosUtilizaveisNoPeriodo);

    const financeCalls = estado.double.de("finance_transactions");
    expect(financeCalls.length).toBeGreaterThan(2);
    expect(financeCalls[0].ordem).toEqual(["occurred_at", "id"]);
    expect(financeCalls[0].filtros).toEqual(
      expect.arrayContaining([
        { tipo: "eq", coluna: "type", valor: "charge" },
        expect.objectContaining({ tipo: "lte", coluna: "occurred_at" }),
      ]),
    );
    expect(estado.double.de("subscriptions")[0].colunas).not.toContain(
      "raw_provider_payload",
    );
    expect(cache.sets).toEqual(["admincache:overview-series:v3:30"]);
  });

  it("falha de leitura retorna erro; não inventa zero nem fórmula antiga", async () => {
    setup({ message: "timeout sintético" });
    await expect(carregarOverviewSeries("30")).rejects.toThrow(
      "Erro ao ler a base.",
    );
    expect(cache.sets).toEqual([]);
  });

  it("contagem divergente torna a leitura incompleta em erro explícito", async () => {
    setup(null, 99);
    await expect(carregarOverviewSeries("30")).rejects.toThrow(
      "Erro ao ler a base.",
    );
    expect(cache.sets).toEqual([]);
  });

  it("rejeita identidade de linha repetida antes da deduplicação financeira", async () => {
    setup(null, undefined, {
      financeRows: [
        finance({ id: "same-row", stripe_charge_id: "ch-a" }),
        finance({ id: "same-row", stripe_charge_id: "ch-b" }),
      ],
    });
    await expect(carregarOverviewSeries("30")).rejects.toMatchObject({
      context: expect.objectContaining({
        motivo: "identidade_de_linha_repetida",
        rowKey: "same-row",
      }),
    });
    expect(cache.sets).toEqual([]);
  });

  it("inclui perfil na borda por instante mesmo com representação +00:00", async () => {
    setup(null, undefined, {
      profiles: [{ user_id: "u1", created_at: "2026-09-05T03:00:00+00:00" }],
      financeRows: [],
    });
    const response = await montarSeriesDaVisao(
      resolverJanela("7", new Date("2026-09-11T15:00:00.000Z")),
    );
    const cadastros = response.series.find((s) => s.chave === "cadastros");
    expect(cadastros?.total).toBe(1);
    expect(response.funil.passos[0].valor).toBe(1);
  });

  it("reconcilia custo e lacunas das séries com o agrupamento por ferramenta", async () => {
    const created_at = "2026-09-10T13:00:00Z";
    const row = (
      id: string,
      tool: string,
      status: string,
      cost_estimate: string | null,
    ) => ({ id, user_id: "u1", tool, status, cost_estimate, created_at });
    setup(null, undefined, {
      aiRows: [
        row("invalid", "invalid-parser", "success", "0.25lixo"),
        row("valid", "valid", "success", "0.25"),
        row("zero", "zero", "success", "0"),
        row("null", "null", "success", null),
        row("negative", "negative", "success", "-1"),
        row("error-zero", "error-zero", "error", "0"),
        row("error-null", "error-null", "error", null),
        row("error-positive", "error-positive", "error", "0.10"),
      ],
    });
    const response = await carregarOverviewSeries("30");
    const series = Object.fromEntries(
      response.data.series.map((item) => [item.chave, item.total]),
    );
    const tools = Object.fromEntries(
      response.data.ferramentas.map((item) => [item.tool, item]),
    );

    expect(series.custoIaUsd).toBeCloseTo(0.35, 10);
    expect(series.chamadasSemCustoMedido).toBe(4);
    expect(tools["invalid-parser"]).toMatchObject({
      custoUsd: 0,
      semCustoMedido: 1,
    });
    expect(tools.valid).toMatchObject({
      custoUsd: 0.25,
      semCustoMedido: 0,
    });
    expect(tools["error-zero"].semCustoMedido).toBe(0);
    expect(tools["error-null"].semCustoMedido).toBe(0);
    expect(tools["error-positive"].custoUsd).toBeCloseTo(0.1, 10);
  });
});
