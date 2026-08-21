import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ALCANCE do sync de balance transactions.
 *
 * O caso real que motivou estes testes (medido em 2026-08-01): a correcao que
 * resolve o dono de cobranca de boleto subiu SEIS DIAS depois de uma cobranca
 * ter sido ingerida sem dono. Como a janela do cron era de 72h, aquela linha
 * nunca mais foi visitada e ficou orfa para sempre, com R$ 90,30 invisiveis no
 * extrato do proprio cliente. Os tres boletos ingeridos dentro da janela se
 * consertaram sozinhos.
 *
 * O que estes testes travam nao e o NUMERO da janela (esse e uma constante que
 * pode mudar), e sim a PROPRIEDADE que faz a janela valer alguma coisa: revisitar
 * uma linha ja gravada REESCREVE o dono, entao ampliar o alcance conserta o
 * passado; e revisitar uma linha ja resolvida nao muda nada.
 */

const estado = vi.hoisted(() => ({
  bts: [] as unknown[],
  /** Toda chamada de `upsert` em finance_transactions, na ordem. */
  upserts: [] as Array<Record<string, unknown>>,
  /** `since` (epoch em segundos) que o sync mandou para a Stripe. */
  createdGte: null as number | null,
  /** Dono resolvivel por customer id. */
  donosPorCustomer: {} as Record<
    string,
    { user_id: string; plans: { code: string } }
  >,
}));

vi.mock("./env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    stripeSecretKey: "sk_live_x",
  },
}));

vi.mock("./stripeClient", () => ({
  getStripe: () => ({
    balanceTransactions: {
      list: (params: { created?: { gte?: number } }) => {
        estado.createdGte = params.created?.gte ?? null;
        // O SDK devolve um auto-paginador; para o loop `for await` do sync,
        // basta um async iterable das linhas DENTRO da janela.
        const dentro = (estado.bts as Array<{ created: number }>).filter(
          (bt) => estado.createdGte === null || bt.created >= estado.createdGte,
        );
        return {
          async *[Symbol.asyncIterator]() {
            for (const bt of dentro) yield bt;
          },
        };
      },
    },
    charges: { retrieve: async () => ({ customer: null }) },
  }),
}));

vi.mock("./supabaseAdmin", () => {
  const consulta = (table: string) => {
    if (table === "finance_transactions") {
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ limit: async () => ({ data: [] }) }) }),
        }),
        upsert: async (linha: Record<string, unknown>) => {
          estado.upserts.push(linha);
          return { error: null };
        },
      };
    }
    // subscriptions: resolveByCustomer e ownerByPaymentIntent.
    let customerId: string | null = null;
    const encadeia = {
      select: () => encadeia,
      eq: (coluna: string, valor: string) => {
        if (coluna === "provider_customer_id") customerId = valor;
        return encadeia;
      },
      order: () => encadeia,
      limit: () => encadeia,
      maybeSingle: async () => ({
        data: customerId ? (estado.donosPorCustomer[customerId] ?? null) : null,
        error: null,
      }),
    };
    return encadeia;
  };
  return { supabaseAdmin: { from: (table: string) => consulta(table) } };
});

import {
  CHARGE_SEM_DONO_CORTE_DIAS,
  SYNC_FINANCE_WINDOW_DAYS,
} from "./financeSyncWindow";
import { syncBalanceTransactions } from "./stripeSync";

const DIA_MS = 24 * 60 * 60 * 1000;
const AGORA = Date.parse("2026-08-01T04:20:00Z");

/** Uma balance transaction de cobranca de cartao, com customer. */
function cobranca(id: string, diasAtras: number, customer: string | null) {
  return {
    id,
    type: "charge",
    amount: 2990,
    fee: 345,
    net: 2645,
    currency: "brl",
    created: Math.floor((AGORA - diasAtras * DIA_MS) / 1000),
    source: {
      object: "charge",
      id: `ch_${id}`,
      livemode: true,
      customer,
      invoice: null,
    },
  };
}

beforeEach(() => {
  estado.bts = [];
  estado.upserts = [];
  estado.createdGte = null;
  estado.donosPorCustomer = {};
});

describe("alcance da janela", () => {
  it("linha DENTRO da janela é revisitada e ganha dono", async () => {
    // A cobranca tem 5 dias: fora das 72h antigas, dentro dos 7 dias novos.
    estado.bts = [cobranca("txn_velha", 5, "cus_1")];
    estado.donosPorCustomer["cus_1"] = {
      user_id: "user-1",
      plans: { code: "pro_semiannual" },
    };

    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });

    expect(estado.upserts).toHaveLength(1);
    // O UPSERT ESCREVE user_id. É esta propriedade que faz ampliar a janela
    // consertar o passado, em vez de só evitar problema novo.
    expect(estado.upserts[0]).toMatchObject({
      stripe_balance_transaction_id: "txn_velha",
      user_id: "user-1",
      plan_code: "pro_semiannual",
    });
  });

  it("linha FORA da janela não é tocada", async () => {
    estado.bts = [cobranca("txn_antiga", 10, "cus_1")];
    estado.donosPorCustomer["cus_1"] = {
      user_id: "user-1",
      plans: { code: "pro_monthly" },
    };

    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });

    expect(estado.upserts).toHaveLength(0);
  });

  it("a janela antiga de 72h NÃO alcançaria a linha de 5 dias", async () => {
    // O caso real, reduzido: é exatamente por isso que a cobrança de 24/07
    // ficou órfã enquanto as de 29/07 se curaram sozinhas.
    estado.bts = [cobranca("txn_velha", 5, "cus_1")];
    estado.donosPorCustomer["cus_1"] = {
      user_id: "user-1",
      plans: { code: "pro_semiannual" },
    };

    await syncBalanceTransactions({ since: new Date(AGORA - 3 * DIA_MS) });

    expect(estado.upserts).toHaveLength(0);
  });

  it("revisitar linha JÁ RESOLVIDA é no-op: mesmo id, mesmo dono", async () => {
    estado.bts = [cobranca("txn_ok", 2, "cus_1")];
    estado.donosPorCustomer["cus_1"] = {
      user_id: "user-1",
      plans: { code: "pro_annual" },
    };

    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });
    const primeira = [...estado.upserts];
    estado.upserts = [];
    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });

    // Idempotente pelo bt id: a segunda passada escreve o MESMO conteúdo na
    // MESMA chave. Ampliar o alcance não pode reprocessar dinheiro.
    expect(estado.upserts).toEqual(primeira);
    expect(estado.upserts[0].stripe_balance_transaction_id).toBe("txn_ok");
  });

  it("ampliar o alcance não muda o que é gravado, só quantas linhas entram", async () => {
    estado.bts = [
      cobranca("txn_1", 1, "cus_1"),
      cobranca("txn_5", 5, "cus_1"),
      cobranca("txn_10", 10, "cus_1"),
    ];
    estado.donosPorCustomer["cus_1"] = {
      user_id: "user-1",
      plans: { code: "pro_monthly" },
    };

    await syncBalanceTransactions({ since: new Date(AGORA - 3 * DIA_MS) });
    const com72h = estado.upserts.map((u) => u.stripe_balance_transaction_id);
    estado.upserts = [];
    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });
    const com7d = estado.upserts.map((u) => u.stripe_balance_transaction_id);

    expect(com72h).toEqual(["txn_1"]);
    expect(com7d).toEqual(["txn_1", "txn_5"]);
    // A de 10 dias continua fora nos dois: alcance maior, não infinito. Quem
    // cobre o que sobra é o guard da faixa de saúde, não uma janela sem fim.
    expect(com7d).not.toContain("txn_10");
  });

  it("linha sem dono resolvível entra com user_id null, sem derrubar o sync", async () => {
    // É assim que a órfã nasce: o dinheiro entra, a atribuição não. O sync não
    // pode falhar por isso, senão uma linha sem dono travaria a rodada inteira.
    estado.bts = [cobranca("txn_orfa", 1, "cus_desconhecido")];

    await syncBalanceTransactions({ since: new Date(AGORA - 7 * DIA_MS) });

    expect(estado.upserts).toHaveLength(1);
    expect(estado.upserts[0].user_id).toBeNull();
    expect(estado.upserts[0].gross_cents).toBe(2990);
  });
});

describe("a invariante entre a janela e o corte do guard", () => {
  it("o corte do guard é MAIOR que a janela do sync", () => {
    // Se o corte ficar menor ou igual, o guard passa a acusar linha que o cron
    // ainda vai resolver sozinho na próxima passada. É a razão de os dois
    // números morarem no mesmo arquivo: aqui a relação é verificável, em dois
    // módulos separados ela seria só uma intenção escrita em comentário.
    expect(CHARGE_SEM_DONO_CORTE_DIAS).toBeGreaterThan(
      SYNC_FINANCE_WINDOW_DAYS,
    );
  });

  it("a janela cobre a retentativa de webhook da Stripe, de ~3 dias", () => {
    expect(SYNC_FINANCE_WINDOW_DAYS).toBeGreaterThanOrEqual(3);
  });

  it("a janela cobre o intervalo REAL entre ingestão e correção", () => {
    // 6 dias: a cobrança de boleto entrou em 24/07 sem dono e a correção que a
    // resolveria subiu em 30/07. Este é o piso que o incidente estabeleceu, e
    // afirmá-lo é o que impede a janela de voltar para 72h sem que alguém
    // enfrente o motivo pelo qual ela cresceu. Encolher abaixo disto é decisão
    // deliberada, que quebra este teste e obriga a reescrever esta frase.
    expect(SYNC_FINANCE_WINDOW_DAYS).toBeGreaterThanOrEqual(6);
  });
});
