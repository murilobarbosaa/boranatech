import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VARREDURA DE HISTÓRICO INTEIRO E CLASSIFICAÇÃO DOS ÓRFÃOS.
 *
 * O defeito medido: o órfão real desta base (`sub_1Tv4SX…`, pago em
 * 2026-07-19) só apareceu numa varredura manual em 2026-08-14, **26 dias
 * depois**. O job diário rodava com janela de 7 dias e reportava "0 órfãos"
 * todo dia, certo sobre a janela que enxergava, e inútil. É a mesma classe que
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
  /** Sessoes buscadas por id pelo caminho do ESTOQUE ABERTO. */
  sessoesPorId: {} as Record<string, unknown>,
  sessionRetrieveCalls: [] as string[],
}));

const supaSpy = vi.hoisted(() => ({
  /** provider_subscription_id que EXISTEM em subscriptions. */
  chavesExistentes: [] as string[],
  /** user_id que ainda existem em profiles. */
  perfis: [] as string[],
  upserts: [] as unknown[],
  updates: [] as unknown[],
  /** Linhas ABERTAS de billing_orphan_payments (resolved_at nulo). */
  abertas: [] as Array<Record<string, unknown>>,
  /** Erro forcado na leitura das abertas. */
  abertasError: null as { message: string } | null,
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
        retrieve: async (id: string) => {
          stripeSpy.sessionRetrieveCalls.push(id);
          const s = stripeSpy.sessoesPorId[id];
          if (!s) throw new Error(`session ${id} nao registrada no duble`);
          return s;
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
    // billing_orphan_payments.select(...).is("resolved_at", null): leitura do
    // ESTOQUE ABERTO. Distinto do `is` devolvido por `q.in` acima, que fecha a
    // cadeia do UPDATE.
    q.is = () => {
      if (tabela !== "billing_orphan_payments") {
        throw new Error(`.is() inesperado na tabela ${tabela}`);
      }
      return Promise.resolve(
        supaSpy.abertasError
          ? { data: null, error: supaSpy.abertasError }
          : { data: supaSpy.abertas, error: null },
      );
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

import { detectOrphanPayments, statusDaRunDeOrfaos } from "./orphanPayments";

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
  stripeSpy.sessoesPorId = {};
  stripeSpy.sessionRetrieveCalls = [];
  supaSpy.chavesExistentes = [];
  supaSpy.perfis = [];
  supaSpy.upserts = [];
  supaSpy.updates = [];
  supaSpy.abertas = [];
  supaSpy.abertasError = null;
});

describe("alcance da varredura", () => {
  it("modo full NÃO manda corte inferior para a Stripe", async () => {
    // CONTROLE NEGATIVO da correção inteira: se `created` voltar a aparecer,
    // o modo full vira uma janela grande, que continua sendo uma janela, e o
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

/**
 * ESTOQUE ABERTO, INDEPENDENTE DA JANELA.
 *
 * O defeito que estes casos travam e o mesmo da varredura, um degrau adiante: o
 * orfao de 2026-07-19 chegou a ser DETECTADO e REGISTRADO em 2026-08-14, e ainda
 * assim o job voltou a sair 'success' assim que a sessao saiu dos 7 dias. Em 117
 * runs medidas em 2026-08-26 existe UMA unica nao-sadia, e foi a varredura
 * `full` manual. Registro existia, pessoa continuava sem o que pagou, e o
 * instrumento dizia verde.
 *
 * A pergunta que estes casos fazem nao tem janela: "ha linha ABERTA que ainda
 * pede acao?".
 */
describe("estoque aberto", () => {
  /** Linha de billing_orphan_payments como o banco devolve. */
  function aberta(over: Record<string, unknown> = {}) {
    return {
      stripe_session_id: "cs_live_antiga",
      customer_email: "amanda@exemplo.com",
      detected_at: "2026-08-14T05:52:27.955+00:00",
      ...over,
    };
  }

  it("linha aberta ACIONAVEL fora da janela mantem a run em partial", async () => {
    // Varredura nao acha nada: a sessao e velha demais para a janela.
    stripeSpy.sessions = [];
    // ...mas a linha continua aberta, e relida ela segue acionavel (o user_id
    // nao existe em profiles, e o customer nao tem marca de conta excluida).
    supaSpy.abertas = [aberta()];
    stripeSpy.sessoesPorId = {
      cs_live_antiga: sessao({ id: "cs_live_antiga", subscription: "sub_old" }),
    };
    supaSpy.perfis = [];

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.orphans).toBe(0);
    expect(scan.orphansAcionaveis).toBe(0);
    expect(scan.unresolvedAcionaveis).toBe(1);
    expect(scan.unresolvedItens).toEqual([
      {
        sessionId: "cs_live_antiga",
        customerEmail: "amanda@exemplo.com",
        categoria: "sem_usuario_no_banco",
        detectedAt: "2026-08-14T05:52:27.955+00:00",
      },
    ]);
    // A asserção que importa: a varredura estava limpa e a run NAO sai verde.
    expect(statusDaRunDeOrfaos(scan)).toBe("partial");
  });

  it("apenas conta_excluida aberta: a run sai success", async () => {
    // Ruido conhecido e nomeado nao pode deixar o job amarelo para sempre, senao
    // ninguem olha mais a lista de crons. E o mesmo criterio do
    // `orphansAcionaveis` da varredura, agora aplicado ao estoque.
    stripeSpy.sessions = [];
    supaSpy.abertas = [aberta({ stripe_session_id: "cs_live_excluida" })];
    stripeSpy.sessoesPorId = {
      cs_live_excluida: sessao({
        id: "cs_live_excluida",
        customer: "cus_excluido",
      }),
    };
    stripeSpy.customers = {
      cus_excluido: {
        id: "cus_excluido",
        metadata: { account_deleted_at: "2026-08-17T14:28:21.780Z" },
      },
    };

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.unresolvedAcionaveis).toBe(0);
    expect(scan.unresolvedItens).toEqual([]);
    expect(statusDaRunDeOrfaos(scan)).toBe("success");
  });

  it("linha aberta que a varredura JA achou nao e contada duas vezes", async () => {
    // Sem isto o mesmo orfao entraria em `orphansAcionaveis` e em
    // `unresolvedAcionaveis`, e qualquer contagem lida do payload dobraria.
    stripeSpy.sessions = [sessao()];
    supaSpy.perfis = ["user-1"];
    supaSpy.abertas = [aberta({ stripe_session_id: "cs_live_1" })];

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.orphansAcionaveis).toBe(1);
    expect(scan.unresolvedAcionaveis).toBe(0);
    // E nao gastou chamada da Stripe relendo o que ja estava em maos.
    expect(stripeSpy.sessionRetrieveCalls).toEqual([]);
    expect(statusDaRunDeOrfaos(scan)).toBe("partial");
  });

  it("sessao que nao volta da Stripe vira NAO VERIFICADA, nao verde", async () => {
    // Mesmo criterio do `contarLinhas` devolvendo -1: nao saber classificar nao
    // e sinonimo de estar limpo. Se isto virasse zero, uma falha de rede seria
    // indistinguivel de "estoque resolvido".
    stripeSpy.sessions = [];
    supaSpy.abertas = [aberta({ stripe_session_id: "cs_live_sumida" })];
    stripeSpy.sessoesPorId = {}; // o duble lanca

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.unresolvedAcionaveis).toBe(0);
    expect(scan.unresolvedNaoVerificadas).toBe(1);
    expect(statusDaRunDeOrfaos(scan)).toBe("partial");
  });

  it("falha ao LER a tabela nao vira verde", async () => {
    stripeSpy.sessions = [];
    supaSpy.abertasError = { message: "timeout" };

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.unresolvedLeituraOk).toBe(false);
    expect(statusDaRunDeOrfaos(scan)).toBe("partial");
  });

  it("CONTROLE NEGATIVO: sem linha aberta e sem orfao, a run sai success", async () => {
    stripeSpy.sessions = [];
    supaSpy.abertas = [];

    const scan = await detectOrphanPayments({ windowDays: 7 });

    expect(scan.unresolvedAcionaveis).toBe(0);
    expect(scan.unresolvedNaoVerificadas).toBe(0);
    expect(scan.unresolvedLeituraOk).toBe(true);
    expect(statusDaRunDeOrfaos(scan)).toBe("success");
  });
});
