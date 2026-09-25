import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O PIX DO ASAAS NO PIPELINE DE NFS-e.
 *
 * O que estes testes travam, pelo webhook real (`processAsaasEvent`) e pelo
 * registro e pela fila REAIS (`registerFiscalInvoice`, `enqueueFiscalInvoice`,
 * `applyRefundToFiscalInvoice`, `enqueueFiscalCancel`). So as bordas sao
 * dubladas: o banco, o BullMQ, os efeitos de ativacao e o ledger.
 *
 *   - pagamento Pix que ativa registra UMA nota, com `payment_provider = 'asaas'`
 *     e a chave do pagamento, mesmo com RECEIVED e CONFIRMED chegando;
 *   - kill-switch desligado nao toca a tabela;
 *   - falha do registro nao derruba o webhook nem apaga o dedupe;
 *   - estorno integral chega ao cancelamento pela chave Asaas.
 *
 * Expectativas em literais escritos a mao.
 */

type LinhaFiscal = Record<string, unknown> & { charge_key: string };

const estado = vi.hoisted(() => ({
  nfseEnabled: true,
  /** fiscal_invoices, com o unique de charge_key aplicado no upsert. */
  notas: [] as Array<Record<string, unknown> & { charge_key: string }>,
  /** Upserts em fiscal_invoices, na ordem, com as opcoes. */
  upsertsFiscais: [] as Array<{ carga: unknown; opcoes: unknown }>,
  /** Toda leitura ou escrita em fiscal_invoices, para o teste do kill-switch. */
  toquesFiscais: 0,
  erroNoUpsertFiscal: null as { message: string } | null,
  /** Jobs adicionados na fila fiscal (BullMQ dublado). */
  jobs: [] as Array<{ nome: string; dados: unknown; opcoes: unknown }>,
  eventosVistos: new Set<string>(),
  billingEventsApagados: [] as string[],
  linhaSubscription: null as Record<string, unknown> | null,
  activation: null as unknown,
  sentryExcecoes: 0,
}));

vi.mock("../lib/env", () => ({
  env: {
    get nfseEnabled() {
      return estado.nfseEnabled;
    },
    supabaseUrl: "https://exemplo.supabase.co",
    asaasApiUrl: "https://api-sandbox.asaas.com/v3",
    asaasApiKey: "chave-de-teste",
    asaasWebhookToken: "token-de-teste",
    asaasEnabled: true,
    redisUrl: "",
    isProd: false,
  },
}));

vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {
    estado.sentryExcecoes += 1;
  },
  addBreadcrumb: () => {},
  withScope: () => {},
}));

// Fila com conexao "presente" e BullMQ dublado: o `add` e gravado, com o jobId
// que o codigo real calculou.
vi.mock("../lib/redis", () => ({ queueConnection: {}, cacheConnection: null }));
vi.mock("bullmq", () => ({
  Queue: class {
    async add(nome: string, dados: unknown, opcoes: unknown) {
      estado.jobs.push({ nome, dados, opcoes });
      return {};
    }
  },
  Worker: class {},
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: async () => {} }));

// Efeitos de ativacao e ledger fora do que se mede aqui.
vi.mock("./shared", () => ({
  applyActivationEffects: async () => {},
  isFirstPurchase: async () => true,
  recordNonRenewalIntent: async () => {},
  revertNonRenewalIntent: async () => {},
}));
vi.mock("../lib/asaasLedgerWriter", () => ({
  registrarNoLedger: async () => {},
}));
vi.mock("../lib/asaasClient", () => ({ asaasFetch: async () => ({}) }));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const filtros: Array<[string, unknown]> = [];
    let patch: Record<string, unknown> | null = null;
    const q: Record<string, unknown> = {};
    for (const m of ["select", "in", "gt", "neq", "order", "limit", "not"]) {
      q[m] = () => q;
    }
    q.eq = (coluna: string, valor: unknown) => {
      filtros.push([coluna, valor]);
      return q;
    };
    const casa = (l: Record<string, unknown>) =>
      filtros.every(([c, v]) => l[c] === v);

    q.maybeSingle = async () => {
      if (tabela === "fiscal_invoices") {
        estado.toquesFiscais += 1;
        return { data: estado.notas.find(casa) ?? null, error: null };
      }
      if (tabela === "plans") {
        return {
          data: { id: "plan-anual", code: "pro_annual", name: "Pro Anual" },
          error: null,
        };
      }
      if (tabela === "subscriptions") {
        // A ancora do periodo le por `user_id`; o lookup da linha, por
        // cobranca ou por id. So o lookup devolve a linha.
        const ehAncora = filtros.some(([c]) => c === "user_id");
        return {
          data: ehAncora ? null : estado.linhaSubscription,
          error: null,
        };
      }
      return { data: null, error: null };
    };
    q.then = (resolve: (v: unknown) => unknown) => {
      if (tabela === "fiscal_invoices" && patch) {
        estado.toquesFiscais += 1;
        for (const l of estado.notas.filter(casa)) Object.assign(l, patch);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve);
    };
    q.update = (p: Record<string, unknown>) => {
      patch = p;
      return q;
    };
    q.delete = () => {
      const encadeavel = {
        eq: (_c: string, id: string) => {
          if (tabela === "billing_events")
            estado.billingEventsApagados.push(id);
          return Promise.resolve({ error: null });
        },
      };
      return encadeavel;
    };
    q.upsert = (carga: Record<string, unknown>, opcoes: unknown) => {
      if (tabela === "billing_events") {
        const id = String(carga.id);
        const novo = !estado.eventosVistos.has(id);
        estado.eventosVistos.add(id);
        return {
          select: async () => ({ data: novo ? [{ id }] : [], error: null }),
        };
      }
      if (tabela === "fiscal_invoices") {
        estado.toquesFiscais += 1;
        estado.upsertsFiscais.push({ carga, opcoes });
        if (estado.erroNoUpsertFiscal) {
          return Promise.resolve({ error: estado.erroNoUpsertFiscal });
        }
        // O unique de charge_key com `ignoreDuplicates`: conflito vira no-op.
        const chave = String(carga.charge_key);
        if (!estado.notas.some((n) => n.charge_key === chave)) {
          estado.notas.push({ ...carga, charge_key: chave });
        }
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    };
    return q;
  }

  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      rpc: async (nome: string) => {
        if (nome === "activate_subscription_exclusive") {
          return { data: estado.activation, error: null };
        }
        return { data: null, error: null };
      },
      auth: { admin: { getUserById: async () => ({ data: { user: null } }) } },
    },
  };
});

import { processAsaasEvent } from "./asaas";

const USER = "11111111-1111-1111-1111-111111111111";

function evento(tipo: string, id: string) {
  return {
    id,
    event: tipo,
    dateCreated: "2026-09-20 10:11:33",
    payment: {
      id: "pay_8x2k1m9q",
      value: 222,
      netValue: 217.72,
      externalReference: "row-1",
    },
  } as Parameters<typeof processAsaasEvent>[0];
}

function ativacao(ativou: boolean) {
  return [
    {
      out_activated: ativou,
      out_superseded_count: 0,
      out_user_id: USER,
      out_plan_id: "plan-anual",
      out_affiliate_code: null,
      out_coupon_code: null,
    },
  ];
}

beforeEach(() => {
  estado.nfseEnabled = true;
  estado.notas = [];
  estado.upsertsFiscais = [];
  estado.toquesFiscais = 0;
  estado.erroNoUpsertFiscal = null;
  estado.jobs = [];
  estado.eventosVistos = new Set();
  estado.billingEventsApagados = [];
  estado.sentryExcecoes = 0;
  estado.linhaSubscription = {
    id: "row-1",
    user_id: USER,
    status: "pending",
    plan_id: "plan-anual",
    affiliate_code: null,
    coupon_code: null,
    provider_subscription_id: "pay_8x2k1m9q",
  };
  estado.activation = ativacao(true);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("gancho fiscal do Pix", () => {
  it("pagamento que ativa registra a nota com provedor e chave do Asaas", async () => {
    const r = await processAsaasEvent(
      evento("PAYMENT_RECEIVED", "evt_recebido"),
    );

    expect(r).toEqual({ received: true, activated: true });
    expect(estado.notas).toHaveLength(1);
    expect(estado.notas[0]).toMatchObject({
      user_id: USER,
      subscription_id: "row-1",
      payment_provider: "asaas",
      charge_key: "asaas:pay_8x2k1m9q",
      stripe_charge_id: null,
      stripe_invoice_id: null,
      stripe_payment_intent_id: null,
      status: "pending",
      amount_cents: 22200,
      plan_code: "pro_annual",
    });
    expect(estado.upsertsFiscais[0].opcoes).toEqual({
      onConflict: "charge_key",
      ignoreDuplicates: true,
    });
    expect(estado.jobs).toEqual([
      {
        nome: "issue",
        dados: { kind: "issue", chargeKey: "asaas:pay_8x2k1m9q" },
        opcoes: { jobId: "issue-asaas-pay_8x2k1m9q" },
      },
    ]);
  });

  it("RECEIVED e depois CONFIRMED do mesmo pagamento: UMA nota", async () => {
    await processAsaasEvent(evento("PAYMENT_RECEIVED", "evt_recebido"));
    // O que o banco faria depois da RPC: a linha ficou ativa por este pagamento.
    estado.linhaSubscription = {
      ...estado.linhaSubscription,
      status: "active",
    };
    await processAsaasEvent(evento("PAYMENT_CONFIRMED", "evt_confirmado"));

    expect(estado.notas).toHaveLength(1);
    expect(estado.notas[0].charge_key).toBe("asaas:pay_8x2k1m9q");
  });

  it("mesmo se os DOIS eventos chegassem a registrar, a chave deduplica", async () => {
    // Corrida em que os dois eventos veem a linha ainda pendente: o segundo
    // registro cai no unique de charge_key e no mesmo jobId.
    await processAsaasEvent(evento("PAYMENT_RECEIVED", "evt_recebido"));
    await processAsaasEvent(evento("PAYMENT_CONFIRMED", "evt_confirmado"));

    expect(estado.upsertsFiscais).toHaveLength(2);
    expect(estado.notas).toHaveLength(1);
    expect(estado.jobs.map((j) => j.opcoes)).toEqual([
      { jobId: "issue-asaas-pay_8x2k1m9q" },
      { jobId: "issue-asaas-pay_8x2k1m9q" },
    ]);
  });

  it("com a emissao desligada nao toca fiscal_invoices", async () => {
    estado.nfseEnabled = false;
    const r = await processAsaasEvent(
      evento("PAYMENT_RECEIVED", "evt_recebido"),
    );

    expect(r).toEqual({ received: true, activated: true });
    expect(estado.toquesFiscais).toBe(0);
    expect(estado.jobs).toEqual([]);
  });

  it("falha do registro NAO derruba o webhook nem apaga o dedupe", async () => {
    estado.erroNoUpsertFiscal = { message: "banco fora" };
    const r = await processAsaasEvent(
      evento("PAYMENT_RECEIVED", "evt_recebido"),
    );

    expect(r).toEqual({ received: true, activated: true });
    expect(estado.billingEventsApagados).toEqual([]);
    expect(estado.sentryExcecoes).toBe(1);
    expect(estado.jobs).toEqual([]);
  });
});

describe("estorno Pix na nota fiscal", () => {
  it("PAYMENT_REFUNDED integral enfileira o cancelamento pela chave Asaas", async () => {
    estado.notas = [
      {
        id: "nota-1",
        status: "issued",
        precisa_revisao: false,
        payment_provider: "asaas",
        charge_key: "asaas:pay_8x2k1m9q",
      } as LinhaFiscal,
    ];

    const r = await processAsaasEvent(
      evento("PAYMENT_REFUNDED", "evt_estorno"),
    );

    expect(r).toEqual({ received: true, activated: false });
    expect(estado.jobs).toEqual([
      {
        nome: "cancel",
        dados: {
          kind: "cancel",
          chargeKey: "asaas:pay_8x2k1m9q",
          justificativa: "Reembolso integral ao tomador",
        },
        opcoes: { jobId: "cancel-asaas-pay_8x2k1m9q" },
      },
    ]);
  });

  it("com a emissao desligada o estorno nao toca fiscal_invoices", async () => {
    estado.nfseEnabled = false;
    await processAsaasEvent(evento("PAYMENT_REFUNDED", "evt_estorno"));

    expect(estado.toquesFiscais).toBe(0);
    expect(estado.jobs).toEqual([]);
  });
});
