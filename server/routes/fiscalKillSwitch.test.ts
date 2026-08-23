import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * KILL-SWITCH DAS ROTAS FISCAIS.
 *
 * As quatro rotas do dominio fiscal operavam com `NFSE_ENABLED` desligado, e
 * eram o unico caminho medido em que ausencia de configuracao fiscal chegava ao
 * banco. Este arquivo trava os dois lados de cada uma: o desfecho NOMEADO com o
 * switch desligado, e o comportamento de hoje intacto com ele ligado.
 *
 * Por que um duble LOCAL de supabaseAdmin, e nao o `criarSupabaseDouble` de
 * `adminUsersHarness.test.ts`: aquele harness valida a tabela contra
 * `shared/database.types.ts`, e `fiscal_invoices` nao esta la (nem na lista de
 * tabelas pendentes dele). Usa-lo faria estes testes morrerem com
 * `[double] tabela "fiscal_invoices" nao existe`, e a correcao seria editar o
 * harness compartilhado, que e usado por varias suites e esta fora do escopo
 * deste lote. O duble daqui e minimo de proposito: ele existe para registrar o
 * que a rota consultou e o que ela escreveu.
 */

type Resposta = { data: unknown; error: unknown };

type Chamada = {
  table: string;
  op: "select" | "update" | "insert";
  payload?: Record<string, unknown>;
};

interface QueryBuilder extends PromiseLike<Resposta> {
  select(...args: unknown[]): QueryBuilder;
  eq(...args: unknown[]): QueryBuilder;
  in(...args: unknown[]): QueryBuilder;
  order(...args: unknown[]): QueryBuilder;
  limit(...args: unknown[]): QueryBuilder;
  range(...args: unknown[]): QueryBuilder;
  update(payload: Record<string, unknown>): QueryBuilder;
  insert(payload: Record<string, unknown>): QueryBuilder;
  maybeSingle(): Promise<Resposta>;
}

const estado = vi.hoisted(() => ({
  nfseEnabled: false,
  respostas: {} as Record<string, Resposta>,
  chamadas: [] as Array<{
    table: string;
    op: "select" | "update" | "insert";
    payload?: Record<string, unknown>;
  }>,
  enfileirados: [] as string[],
}));

function construir(table: string, op: Chamada["op"]): QueryBuilder {
  const resposta: Resposta = estado.respostas[table] ?? {
    data: null,
    error: null,
  };
  const registro: Chamada = { table, op };
  estado.chamadas.push(registro);

  const alvo: QueryBuilder = {
    select: () => alvo,
    eq: () => alvo,
    in: () => alvo,
    order: () => alvo,
    limit: () => alvo,
    range: () => alvo,
    update: (payload) => {
      registro.op = "update";
      registro.payload = payload;
      return alvo;
    },
    insert: (payload) => {
      registro.op = "insert";
      registro.payload = payload;
      return alvo;
    },
    maybeSingle: async () => resposta,
    then: (aoResolver, aoRejeitar) =>
      Promise.resolve(resposta).then(aoResolver, aoRejeitar),
  };
  return alvo;
}

vi.mock("../lib/env", () => ({
  env: {
    get nfseEnabled() {
      return estado.nfseEnabled;
    },
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
  supabaseAdmin: {
    from: (table: string) => construir(table, "select"),
    // Vazio de proposito: `fetchAuthUsersByIds` chama daqui e o proprio codigo
    // da rota trata a falha com `.catch`, caindo para o e-mail do snapshot da
    // nota. Este teste exercita esse caminho, que e o de producao quando o Auth
    // nao responde.
    auth: { admin: {} },
    rpc: async () => ({ data: null, error: null }),
  },
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
vi.mock("../lib/fiscalQueue", () => ({
  enqueueFiscalInvoice: async (stripeChargeId: string) => {
    estado.enfileirados.push(stripeChargeId);
  },
}));
vi.mock("../lib/fiscalStorage", () => ({
  signedFiscalUrl: async () => null,
}));
vi.mock("../lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({}),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/stripeSync", () => ({ syncBalanceTransactions: vi.fn() }));
vi.mock("../providers", () => ({ stripeProvider: {} }));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: vi.fn(),
  getCachedProStatus: async () => null,
  setCachedProStatus: async () => {},
}));
vi.mock("../lib/posthog", () => ({
  getPaidFunnelSignals: async () => null,
  getPosthogStats: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogHealth: async () => ({ state: "error", reason: "nao usado" }),
  getPosthogPersonActivity: async () => ({ state: "error", reason: "n/a" }),
  getPosthogFeatureUsage: async () => ({ state: "error", reason: "n/a" }),
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _r: unknown,
    next: () => void,
  ) => {
    req.user = { id: "user-1", email: "a@x.com", role: "authenticated" };
    next();
  },
  requireAdmin: (_q: unknown, _r: unknown, next: () => void) => next(),
  checkProStatus: (_q: unknown, _r: unknown, next: () => void) => next(),
  requirePro: (_q: unknown, _r: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_q: unknown, _r: unknown, next: () => void) => next(),
  resolveProStatus: async () => false,
  isDevProUser: () => false,
}));

import adminRouter from "./admin";
import billingRouter from "./billing";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);
const chamarBilling = criarClienteAdmin(billingRouter);

const NOTA_ID = "11111111-2222-4333-8444-555555555555";

beforeEach(() => {
  estado.nfseEnabled = false;
  estado.respostas = {};
  estado.chamadas = [];
  estado.enfileirados = [];
});

function chamadasDe(table: string): Chamada[] {
  return estado.chamadas.filter((c) => c.table === table);
}

describe("GET /billing/invoices", () => {
  it("com a emissao desligada devolve 200, lista vazia e o estado nomeado, sem tocar o banco", async () => {
    const r = await chamarBilling("GET", "/invoices");

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: [], nfse: "disabled" });
    // O ponto do lote: nenhuma consulta. Era daqui que saia o 500 quando a
    // migration nao estava aplicada.
    expect(chamadasDe("fiscal_invoices")).toHaveLength(0);
  });

  it("com a emissao ligada consulta a tabela e devolve o shape de hoje", async () => {
    estado.nfseEnabled = true;
    estado.respostas.fiscal_invoices = {
      data: [
        {
          id: NOTA_ID,
          numero: "42",
          serie: "1",
          codigo_verificacao: "abc",
          status: "issued",
          issued_at: "2026-08-01T00:00:00.000Z",
          amount_cents: 4990,
          plan_code: "pro_monthly",
          service_description: "Assinatura",
          pdf_path: null,
          xml_path: null,
        },
      ],
      error: null,
    };

    const r = await chamarBilling("GET", "/invoices");

    expect(r.status).toBe(200);
    expect(chamadasDe("fiscal_invoices")).toHaveLength(1);
    // Shape atual preservado: sem o campo `nfse`, que so existe no desligado.
    expect(r.body).toEqual({
      data: [
        {
          id: NOTA_ID,
          numero: "42",
          serie: "1",
          codigoVerificacao: "abc",
          status: "issued",
          issuedAt: "2026-08-01T00:00:00.000Z",
          amountCents: 4990,
          planCode: "pro_monthly",
          descricao: "Assinatura",
          pdfUrl: null,
          xmlUrl: null,
        },
      ],
    });
  });
});

describe("GET /admin/fiscal-invoices/summary", () => {
  it("com a emissao desligada devolve os agregados zerados com o estado nomeado, sem tocar o banco", async () => {
    const r = await chamarAdmin("GET", "/fiscal-invoices/summary");

    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      data: {
        porStatus: {
          pending: 0,
          processing: 0,
          issued: 0,
          failed: 0,
          canceled: 0,
          blocked_missing_data: 0,
        },
        precisaRevisao: 0,
        total: 0,
        ultimaReconciliacao: null,
      },
      nfse: "disabled",
    });
    expect(chamadasDe("fiscal_invoices")).toHaveLength(0);
    expect(chamadasDe("cron_run_logs")).toHaveLength(0);
  });

  it("com a emissao ligada agrega o que veio do banco", async () => {
    estado.nfseEnabled = true;
    estado.respostas.fiscal_invoices = {
      data: [
        { status: "issued", precisa_revisao: false },
        { status: "failed", precisa_revisao: true },
      ],
      error: null,
    };
    estado.respostas.cron_run_logs = { data: null, error: null };

    const r = await chamarAdmin("GET", "/fiscal-invoices/summary");

    expect(r.status).toBe(200);
    expect(chamadasDe("fiscal_invoices")).toHaveLength(1);
    const corpo = r.body as {
      data: {
        porStatus: Record<string, number>;
        precisaRevisao: number;
        total: number;
      };
      nfse?: string;
    };
    expect(corpo.data.porStatus.issued).toBe(1);
    expect(corpo.data.porStatus.failed).toBe(1);
    expect(corpo.data.precisaRevisao).toBe(1);
    expect(corpo.data.total).toBe(2);
    expect(corpo.nfse).toBeUndefined();
  });
});

describe("GET /admin/fiscal-invoices", () => {
  it("com a emissao desligada devolve lista vazia com o estado nomeado, sem tocar o banco", async () => {
    const r = await chamarAdmin("GET", "/fiscal-invoices");

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: [], nfse: "disabled" });
    expect(chamadasDe("fiscal_invoices")).toHaveLength(0);
  });

  it("com a emissao ligada lista as notas no shape de hoje", async () => {
    estado.nfseEnabled = true;
    estado.respostas.fiscal_invoices = {
      data: [
        {
          id: NOTA_ID,
          user_id: "user-9",
          status: "failed",
          precisa_revisao: false,
          amount_cents: 4990,
          plan_code: "pro_monthly",
          numero: null,
          attempts: 2,
          error_code: "erro",
          error_message: "falhou",
          issued_at: null,
          created_at: "2026-08-01T00:00:00.000Z",
          tomador_nome: "Fulano",
          tomador_documento: "52998224725",
          tomador_email: "f@x.com",
        },
      ],
      error: null,
    };

    const r = await chamarAdmin("GET", "/fiscal-invoices");

    expect(r.status).toBe(200);
    expect(chamadasDe("fiscal_invoices")).toHaveLength(1);
    const corpo = r.body as {
      data: Array<{ id: string; email: string; tomadorDocumento: string }>;
      nfse?: string;
    };
    expect(corpo.data).toHaveLength(1);
    expect(corpo.data[0].id).toBe(NOTA_ID);
    // Auth indisponivel no duble: cai para o e-mail do snapshot, como em producao.
    expect(corpo.data[0].email).toBe("f@x.com");
    expect(corpo.nfse).toBeUndefined();
  });
});

describe("POST /admin/fiscal-invoices/:id/retry", () => {
  it("com a emissao desligada recusa com 409 nfse_disabled, sem escrever nem enfileirar", async () => {
    const r = await chamarAdmin("POST", `/fiscal-invoices/${NOTA_ID}/retry`);

    expect(r.status).toBe(409);
    const corpo = r.body as { error: { code: string; message: string } };
    expect(corpo.error.code).toBe("nfse_disabled");
    expect(corpo.error.message).toContain("desligada");
    // As duas provas que importam: nenhuma linha mudou de estado e nada foi
    // para a fila que, com o switch desligado, nao tem worker do outro lado.
    expect(estado.chamadas.filter((c) => c.op === "update")).toHaveLength(0);
    expect(chamadasDe("fiscal_invoices")).toHaveLength(0);
    expect(estado.enfileirados).toEqual([]);
  });

  it("com a emissao ligada reprocessa a nota e enfileira, como hoje", async () => {
    estado.nfseEnabled = true;
    estado.respostas.fiscal_invoices = {
      data: {
        id: NOTA_ID,
        status: "failed",
        stripe_charge_id: "ch_1",
      },
      error: null,
    };
    estado.respostas.audit_logs = { data: null, error: null };

    const r = await chamarAdmin("POST", `/fiscal-invoices/${NOTA_ID}/retry`);

    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { id: NOTA_ID, status: "pending" } });
    const updates = estado.chamadas.filter((c) => c.op === "update");
    expect(updates).toHaveLength(1);
    expect(updates[0].payload).toMatchObject({ status: "pending" });
    expect(estado.enfileirados).toEqual(["ch_1"]);
  });

  it("com a emissao desligada a recusa vem antes da validacao de id", async () => {
    const r = await chamarAdmin("POST", "/fiscal-invoices/nao-e-uuid/retry");

    // O kill-switch e a primeira coisa do handler de proposito: o desfecho nao
    // depende do formato do id, e nenhum caminho leva ao banco.
    expect(r.status).toBe(409);
    expect((r.body as { error: { code: string } }).error.code).toBe(
      "nfse_disabled",
    );
    expect(estado.chamadas).toHaveLength(0);
  });
});
