import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CHURN: mede EFEITO, nunca intenção.
 *
 * O defeito que estes testes travam tinha data marcada. Até 2026-07-31 a função
 * contava saídas por `subscriptions.canceled_at`, protegida por uma única guarda
 * (a idade da base), e essa guarda EXPIRA sozinha. Medido em produção: a
 * assinatura mais antiga é de 13/07 e o período mais curto termina em 13/08, então
 * por volta de 12/08 a guarda deixaria de valer e a função passaria a devolver
 * `0 / N = 0%` sobre uma base em que nenhuma assinatura teve a chance de acabar.
 * Zero medido e zero por impossibilidade de medir são coisas diferentes.
 */

const estado = vi.hoisted(() => ({
  tabelas: {} as Record<string, { rows: unknown[]; count?: number }>,
  /** Teto de linhas por página, como o `db-max-rows` do PostgREST. */
  maxRows: null as number | null,
}));

/**
 * O dublê APLICA os filtros de intervalo (`gte`/`lte`/`lt`) de verdade.
 *
 * Não é zelo: `getChurnSnapshot` faz quatro consultas diferentes a
 * `subscriptions`, e um dublê que ignora filtros devolve a mesma coisa para as
 * quatro. Na primeira versão deste arquivo ele fazia isso, e a consulta de
 * "quem saiu na janela" recebia linhas SEM `canceled_at` como se tivessem
 * saído — o teste media o dublê, não a função. Linha que não tem a coluna fica
 * de fora do intervalo, que é o que o Postgres faz com NULL.
 */
vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: string) {
      const q: Record<string, unknown> = {};
      let contar = false;
      const intervalos: Array<{
        op: "gte" | "lte" | "lt";
        coluna: string;
        valor: string;
      }> = [];

      const linhas = () => {
        const t = estado.tabelas[table];
        if (!t) throw new Error(`tabela nao registrada no teste: ${table}`);
        return (t.rows as Array<Record<string, unknown>>).filter((row) =>
          intervalos.every(({ op, coluna, valor }) => {
            const v = row[coluna];
            if (typeof v !== "string") return false;
            if (op === "gte") return v >= valor;
            if (op === "lte") return v <= valor;
            return v < valor;
          }),
        );
      };

      q.select = (_c?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head || opts?.count === "exact") contar = true;
        return q;
      };
      let rangeFrom: number | null = null;
      let rangeTo: number | null = null;
      q.range = (from: number, to: number) => {
        rangeFrom = from;
        rangeTo = to;
        return q;
      };
      for (const m of ["gte", "lte", "lt"] as const) {
        q[m] = (coluna: string, valor: string) => {
          intervalos.push({ op: m, coluna, valor });
          return q;
        };
      }
      // `or` e `eq` ficam sem efeito de propósito: nenhum cenário aqui depende
      // deles para separar consultas, e implementá-los pela metade seria pior
      // que não implementar.
      for (const m of ["eq", "in", "or", "order", "limit"]) {
        q[m] = () => q;
      }
      q.maybeSingle = () =>
        Promise.resolve().then(() => ({
          data: linhas()[0] ?? null,
          error: null,
        }));
      q.then = (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) =>
        Promise.resolve()
          .then(() => {
            const t = estado.tabelas[table];
            if (!t) throw new Error(`tabela nao registrada no teste: ${table}`);
            const todas = linhas();
            let rows = todas;
            if (rangeFrom !== null && rangeTo !== null) {
              rows = todas.slice(rangeFrom, rangeTo + 1);
            }
            // Teto DEPOIS do range, igual ao PostgREST.
            if (estado.maxRows !== null && rows.length > estado.maxRows) {
              rows = rows.slice(0, estado.maxRows);
            }
            return {
              data: contar ? null : rows,
              error: null,
              count: contar ? (t.count ?? todas.length) : null,
            };
          })
          .then(ok, ko);
      return q;
    },
  },
}));
vi.mock("./planPrice", () => ({
  resolvePlanPriceCents: (_c: string, fallback: number) => fallback,
}));

import { getChurnSnapshot } from "./billingMetrics";

const ONTEM = new Date(Date.now() - 24 * 3600_000).toISOString();
const HA_60_DIAS = new Date(Date.now() - 60 * 24 * 3600_000).toISOString();
const DAQUI_A_UM_ANO = new Date(Date.now() + 365 * 24 * 3600_000).toISOString();

/**
 * Linha de assinatura com plano: `getMrrSnapshot` é chamado no cálculo do LTV
 * sempre que o churn é maior que zero, e ele exige `plans.code`.
 */
function assinatura(over: Record<string, unknown> = {}) {
  return {
    id: "row_1",
    created_at: HA_60_DIAS,
    provider_subscription_id: "sub_1",
    status: "active",
    plans: { code: "pro_monthly", price_cents: 2990, interval: "month" },
    ...over,
  };
}

/**
 * As três contagens que a função pede de `subscriptions` chegam pelo mesmo
 * dublê, então os cenários abaixo declaram `count` explicitamente quando o
 * número importa.
 */
function montar(over: {
  subscriptions?: { rows: unknown[]; count?: number };
  cancelamentos?: unknown[];
  plans?: unknown[];
}) {
  estado.tabelas = {
    subscriptions: over.subscriptions ?? { rows: [assinatura()], count: 0 },
    subscription_cancellations: { rows: over.cancelamentos ?? [] },
    plans: { rows: over.plans ?? [] },
  };
}

beforeEach(() => {
  estado.tabelas = {};
  estado.maxRows = null;
});

describe("guardas de ausência: estado nomeado, nunca um número inventado", () => {
  it("base mais nova que a janela devolve o motivo próprio", async () => {
    montar({ subscriptions: { rows: [{ created_at: ONTEM }], count: 5 } });
    const r = await getChurnSnapshot({});
    expect(r.status).toBe("insufficient_data");
    expect(r.status === "insufficient_data" && r.reason).toBe(
      "subscription_base_younger_than_window",
    );
  });

  it("NENHUM período encerrado NÃO vira 0%: é o zero falso de 12/08", async () => {
    // É o teste central desta correção. A base é velha o bastante (a guarda
    // antiga já teria liberado), há assinantes no início da janela, e ninguém
    // saiu — porque ninguém PODIA sair ainda.
    montar({
      subscriptions: {
        rows: [{ created_at: HA_60_DIAS, provider_subscription_id: "sub_1" }],
        count: 0, // nenhuma com current_period_end <= agora
      },
    });

    const r = await getChurnSnapshot({});

    expect(r.status).toBe("insufficient_data");
    expect(r.status === "insufficient_data" && r.reason).toBe(
      "no_subscription_period_ended",
    );
    // E principalmente: NÃO existe churnRate nenhum na resposta.
    expect(r).not.toHaveProperty("churnRate");
  });

  it("o estado de ausência ainda informa agendados e revertidos", async () => {
    // "Dados insuficientes" que não diz mais nada é pior do que precisa ser.
    montar({
      subscriptions: { rows: [assinatura()], count: 0 },
      cancelamentos: [
        {
          provider_subscription_id: "sub_1",
          status: "scheduled",
          canceled_at: ONTEM,
          effective_at: DAQUI_A_UM_ANO,
        },
        {
          provider_subscription_id: "sub_1",
          status: "reverted",
          canceled_at: ONTEM,
          effective_at: null,
        },
      ],
    });

    const r = await getChurnSnapshot({});
    expect(r.scheduledNotCounted).toBe(1);
    expect(r.revertedInWindow).toBe(1);
  });
});

describe("o numerador conta EFEITO, não intenção", () => {
  /** Base com período já encerrado, para passar das guardas. */
  function baseComPeriodoEncerrado(cancelamentos: unknown[] = []) {
    montar({
      subscriptions: { rows: [assinatura()], count: 10 },
      cancelamentos,
    });
  }

  it("AGENDADO não entra no churn, e sai ao lado", async () => {
    // A trava da decisão: contar o agendado faria o mesmo fato virar churn E
    // receita em risco, e o painel passaria a somar a si mesmo.
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_1",
        status: "scheduled",
        canceled_at: ONTEM,
        effective_at: DAQUI_A_UM_ANO,
      },
    ]);

    const r = await getChurnSnapshot({});

    expect(r.status).toBe("ok");
    expect(r.canceledInWindow).toBe(0);
    expect(r.status === "ok" && r.churnRate).toBe(0);
    expect(r.scheduledNotCounted).toBe(1);
  });

  it("COMPLETED dentro da janela entra", async () => {
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_1",
        status: "completed",
        canceled_at: ONTEM,
        effective_at: ONTEM,
      },
    ]);

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(1);
    expect(r.status === "ok" && r.churnRate).toBeCloseTo(0.1, 6);
  });

  it("COMPLETED fora da janela não entra", async () => {
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_1",
        status: "completed",
        canceled_at: HA_60_DIAS,
        effective_at: HA_60_DIAS,
      },
    ]);

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(0);
  });

  it("REVERTIDO não entra no churn e é exposto: é sinal de retenção", async () => {
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_1",
        status: "reverted",
        canceled_at: ONTEM,
        effective_at: DAQUI_A_UM_ANO,
      },
    ]);

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(0);
    expect(r.revertedInWindow).toBe(1);
  });

  it("ÓRFÃ não entra no numerador, e é contada à parte", async () => {
    // O denominador vem de `subscriptions`; contar no numerador uma assinatura
    // que não está lá daria uma razão entre populações diferentes. Em produção
    // são 3 linhas de resíduo (gateway anterior e dado de teste).
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_que_nao_existe",
        status: "completed",
        canceled_at: ONTEM,
        effective_at: ONTEM,
      },
    ]);

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(0);
    expect(r.orphanCancellations).toBe(1);
  });

  it("a mesma assinatura nas DUAS fontes conta UMA vez", async () => {
    // `canceled_at` na assinatura E linha `completed` no registro é o caso
    // normal de quem terminou de verdade. Sem dedup o churn sairia dobrado.
    estado.tabelas = {
      subscriptions: {
        rows: [assinatura({ canceled_at: ONTEM })],
        count: 10,
      },
      subscription_cancellations: {
        rows: [
          {
            provider_subscription_id: "sub_1",
            status: "completed",
            canceled_at: ONTEM,
            effective_at: ONTEM,
          },
        ],
      },
      plans: { rows: [] },
    };

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(1);
  });

  it("boleto que só tem linha COMPLETED entra mesmo sem canceled_at", async () => {
    // O buraco que a segunda fonte fecha: boleto não tem subscription na
    // Stripe, então nenhum webhook escreve `canceled_at` e o cron o ignora de
    // propósito. Contando só por `canceled_at`, essa saída sumia para sempre.
    baseComPeriodoEncerrado([
      {
        provider_subscription_id: "sub_1",
        status: "completed",
        canceled_at: ONTEM,
        effective_at: ONTEM,
      },
    ]);

    const r = await getChurnSnapshot({});
    expect(r.canceledInWindow).toBe(1);
  });
});

describe("as varreduras de churn não param no teto do PostgREST", () => {
  /**
   * Reproduz o `db-max-rows`: o dublê devolve no MÁXIMO `TETO` linhas por
   * página, e é o `range` que faz a varredura avançar. Sem paginar, o numerador
   * pararia na milésima saída — e churn que erra para menos não levanta suspeita
   * de ninguém.
   */
  const TETO = 1000;

  it("conta saídas ACIMA do teto", async () => {
    const canceladas = Array.from({ length: 1500 }, (_, i) => ({
      id: `row_${String(i).padStart(5, "0")}`,
      provider_subscription_id: `sub_${i}`,
      created_at: HA_60_DIAS,
      canceled_at: ONTEM,
      status: "canceled",
      plans: { code: "pro_monthly", price_cents: 2990, interval: "month" },
    }));
    estado.tabelas = {
      subscriptions: { rows: canceladas, count: 5000 },
      subscription_cancellations: { rows: [] },
      plans: { rows: [] },
    };
    estado.maxRows = TETO;

    const r = await getChurnSnapshot({});

    expect(r.canceledInWindow).toBe(1500);
  });

  it("o conjunto de assinaturas existentes não encolhe (senão vira órfã falsa)", async () => {
    // `idsExistentes` decide o que é órfão. Truncado, assinatura viva viraria
    // órfã e a saída dela sairia do numerador — erro para menos, de novo.
    const vivas = Array.from({ length: 1500 }, (_, i) => ({
      id: `row_${String(i).padStart(5, "0")}`,
      provider_subscription_id: `sub_${i}`,
      created_at: HA_60_DIAS,
      status: "active",
      plans: { code: "pro_monthly", price_cents: 2990, interval: "month" },
    }));
    estado.tabelas = {
      subscriptions: { rows: vivas, count: 5000 },
      subscription_cancellations: {
        rows: [
          {
            // A ÚLTIMA da lista: só existe depois do teto.
            provider_subscription_id: "sub_1499",
            status: "completed",
            canceled_at: ONTEM,
            effective_at: ONTEM,
          },
        ],
      },
      plans: { rows: [] },
    };
    estado.maxRows = TETO;

    const r = await getChurnSnapshot({});

    expect(r.orphanCancellations).toBe(0);
    expect(r.canceledInWindow).toBe(1);
  });
});
