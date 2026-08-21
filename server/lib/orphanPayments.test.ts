import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VARREDURA DE HISTÓRICO INTEIRO E CLASSIFICAÇÃO DOS ÓRFÃOS.
 *
 * O defeito medido: o órfão real desta base (`sub_1Tv4SX…`, pago em
 * 2026-07-19) só apareceu numa varredura manual em 2026-08-14, **26 dias
 * depois**. O job diário rodava com janela de 7 dias e reportava "0 órfãos"
 * todo dia — certo sobre a janela que enxergava, e inútil. É a mesma classe que
 * o CLAUDE.md persegue: instrumento que falha PASSANDO, sobre uma superfície
 * menor que a do problema.
 *
 * Os testes abaixo travam as duas propriedades novas: o modo `full` não manda
 * corte inferior nenhum para a Stripe, e a classificação separa o que pede ação
 * do ruído conhecido.
 *
 * NENHUMA rede: Stripe e Supabase são dublês. Nenhuma escrita, nem em modo teste.
 */

const stripeSpy = vi.hoisted(() => ({
  listParams: [] as unknown[],
  sessions: [] as unknown[],
  customers: {} as Record<string, unknown>,
  retrieveCalls: [] as string[],
}));

const supaSpy = vi.hoisted(() => ({
  /** provider_subscription_id que EXISTEM em subscriptions. */
  chavesExistentes: [] as string[],
  /** user_id que ainda existem em profiles. */
  perfis: [] as string[],
  upserts: [] as unknown[],
  updates: [] as unknown[],
}));

vi.mock("./stripeClient", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        list: (params: unknown) => {
          stripeSpy.listParams.push(params);
          return {
            [Symbol.asyncIterator]: async function* () {
              for (const s of stripeSpy.sessions) yield s;
            },
          };
        },
      },
    },
    customers: {
      retrieve: async (id: string) => {
        stripeSpy.retrieveCalls.push(id);
        const c = stripeSpy.customers[id];
        if (!c) throw new Error(`customer ${id} não registrado no dublê`);
        return c;
      },
    },
  }),
}));

// Dublê mínimo do supabase-js no formato que este módulo usa: `.select().in()`
// resolve como Promise de `{data, error}`, e o upsert/update de
// `billing_orphan_payments` fica registrado para os testes de dryRun.
vi.mock("./supabaseAdmin", () => {
  function builder(tabela: string) {
    const estado = { colunas: "" };
    const q: Record<string, unknown> = {};
    q.select = (cols: string) => {
      estado.colunas = cols;
      return q;
    };
    q.in = (_coluna: string, valores: string[]) => {
      if (tabela === "subscriptions") {
        return Promise.resolve({
          data: valores
            .filter((v) => supaSpy.chavesExistentes.includes(v))
            .map((v) => ({ provider_subscription_id: v })),
          error: null,
        });
      }
      if (tabela === "profiles") {
        return Promise.resolve({
          data: valores
            .filter((v) => supaSpy.perfis.includes(v))
            .map((v) => ({ user_id: v })),
          error: null,
        });
      }
      // billing_orphan_payments.update(...).in(...).is(...)
      return { is: () => Promise.resolve({ error: null }) };
    };
    q.upsert = (rows: unknown) => {
      supaSpy.upserts.push(rows);
      return { select: () => Promise.resolve({ data: rows, error: null }) };
    };
    q.update = (patch: unknown) => {
      supaSpy.updates.push(patch);
      return q;
    };
    return q;
  }
  return { supabaseAdmin: { from: (tabela: string) => builder(tabela) } };
});

import { detectOrphanPayments } from "./orphanPayments";

/** Sessão paga, fora da carência (30 dias atrás). */
function sessao(over: Record<string, unknown> = {}) {
  return {
    id: "cs_live_1",
    payment_status: "paid",
    mode: "subscription",
    created: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
    livemode: true,
    subscription: "sub_1",
    customer: "cus_1",
    customer_email: "alguem@exemplo.com",
    client_reference_id: "user-1",
    metadata: { supabase_user_id: "user-1", plan_id: "pro_monthly" },
    amount_total: 2990,
    currency: "brl",
    ...over,
  };
}

beforeEach(() => {
  stripeSpy.listParams = [];
  stripeSpy.sessions = [];
  stripeSpy.customers = { cus_1: { id: "cus_1", metadata: {} } };
  stripeSpy.retrieveCalls = [];
  supaSpy.chavesExistentes = [];
  supaSpy.perfis = [];
  supaSpy.upserts = [];
  supaSpy.updates = [];
});

describe("alcance da varredura", () => {
  it("modo full NÃO manda corte inferior para a Stripe", async () => {
    // CONTROLE NEGATIVO da correção inteira: se `created` voltar a aparecer,
    // o modo full vira uma janela grande — que continua sendo uma janela, e o
    // órfão de 26 dias volta a ser invisível assim que passar do limite.
    stripeSpy.sessions = [sessao()];
    supaSpy.chavesExistentes = ["sub_1"];

    await detectOrphanPayments({ full: true, dryRun: true });

    expect(stripeSpy.listParams).toHaveLength(1);
    expect(stripeSpy.listParams[0]).not.toHaveProperty("created");
  });

  it("modo janela CONTINUA mandando o corte (não virou full por acidente)", async () => {
    stripeSpy.sessions = [];
    await detectOrphanPayments({ windowDays: 7, dryRun: true });
    expect(stripeSpy.listParams[0]).toHaveProperty("created");
  });

  it("acha o pagamento antigo que a janela de 7 dias deixava passar", async () => {
    // Reprodução do caso real: sessão de 26 dias atrás, sem linha no banco.
    stripeSpy.sessions = [
      sessao({ created: Math.floor(Date.now() / 1000) - 26 * 24 * 60 * 60 }),
    ];
    supaSpy.chavesExistentes = []; // nenhuma linha em subscriptions
    supaSpy.perfis = []; // e nenhum perfil

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.orphans).toBe(1);
    expect(scan.findings[0].expectedProviderSubscriptionId).toBe("sub_1");
    expect(scan.findings[0].categoria).toBe("sem_usuario_no_banco");
  });
});

describe("classificação", () => {
  it("sessão de modo TESTE é ruído, não incidente", async () => {
    stripeSpy.sessions = [sessao({ id: "cs_test_1", livemode: false })];

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.porCategoria.modo_teste).toBe(1);
    expect(scan.orphans).toBe(1);
    // O que decide o alarme é o ACIONÁVEL, e teste não é acionável.
    expect(scan.orphansAcionaveis).toBe(0);
    // Classificado pelo campo `livemode`, não pelo prefixo do id: nem chegou a
    // consultar o customer.
    expect(stripeSpy.retrieveCalls).toEqual([]);
  });

  it("conta excluída é reconhecida pelo marcador no customer", async () => {
    stripeSpy.customers.cus_1 = {
      id: "cus_1",
      metadata: {
        account_deleted_at: "2026-08-10T12:00:00.000Z",
        deleted_user_id: "user-1",
      },
    };
    stripeSpy.sessions = [sessao()];

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.findings[0].categoria).toBe("conta_excluida");
    expect(scan.findings[0].contaExcluidaEm).toBe("2026-08-10T12:00:00.000Z");
    expect(scan.orphansAcionaveis).toBe(0);
  });

  it("usuário que AINDA existe e pagou sem linha é o caso acionável clássico", async () => {
    stripeSpy.sessions = [sessao()];
    supaSpy.perfis = ["user-1"]; // o perfil está lá
    supaSpy.chavesExistentes = []; // a assinatura não

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.findings[0].categoria).toBe("sem_assinatura");
    expect(scan.orphansAcionaveis).toBe(1);
  });

  it("falha ao ler o customer NÃO vira 'conta excluída' (fail-closed)", async () => {
    // CONTROLE NEGATIVO importante: silenciar por erro de leitura esconderia um
    // pagamento sem dono. Erra para o lado de pedir atenção humana.
    stripeSpy.customers = {}; // retrieve lança
    stripeSpy.sessions = [sessao()];
    supaSpy.perfis = ["user-1"];

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.findings[0].categoria).not.toBe("conta_excluida");
    expect(scan.findings[0].contaExcluidaEm).toBeNull();
    expect(scan.orphansAcionaveis).toBe(1);
  });

  it("sessão COM linha no banco não é órfã (controle negativo)", async () => {
    stripeSpy.sessions = [sessao()];
    supaSpy.chavesExistentes = ["sub_1"];

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.paidSessions).toBe(1);
    expect(scan.orphans).toBe(0);
    expect(scan.orphansAcionaveis).toBe(0);
  });
});

describe("dryRun", () => {
  it("NÃO grava nada, e diz isso na resposta", async () => {
    // A opção existe porque a primeira verificação do modo full foi feita sob a
    // regra "somente leitura" e gravou uma linha em produção: a função sempre
    // persistiu, e quem chamou só olhou para as chamadas à Stripe.
    stripeSpy.sessions = [sessao()];

    const scan = await detectOrphanPayments({ full: true, dryRun: true });

    expect(scan.dryRun).toBe(true);
    expect(supaSpy.upserts).toEqual([]);
    expect(supaSpy.updates).toEqual([]);
    // `persisted:false` de dry-run precisa ser distinguível de falha de escrita.
    expect(scan.persisted).toBe(false);
    expect(scan.newOrphans).toBe(0);
  });

  it("sem dryRun, grava (controle negativo do teste acima)", async () => {
    stripeSpy.sessions = [sessao()];

    const scan = await detectOrphanPayments({ full: true });

    expect(scan.dryRun).toBe(false);
    expect(supaSpy.upserts).toHaveLength(1);
    expect(scan.persisted).toBe(true);
  });
});
