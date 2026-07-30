import { describe, expect, it } from "vitest";

import {
  buildTransactionList,
  refundStateOf,
  type FinanceRow,
} from "./userTransactions";

/**
 * Extrato de compras por usuario e, principalmente, o ESTADO DE REEMBOLSO de
 * cada cobranca.
 *
 * refunded_cents e refundable_cents sao o que a Fatia 7 vai consultar para
 * decidir se oferece o reembolso e qual o teto do valor. Sem eles a UI deixa
 * reembolsar duas vezes. Nao "simplificar" para o cliente somar: uma soma feita
 * no navegador so enxerga as linhas que couberam na pagina.
 */

function row(over: Partial<FinanceRow> = {}): FinanceRow {
  return {
    id: "ft1",
    type: "charge",
    gross_cents: 10000,
    fee_cents: 500,
    net_cents: 9500,
    currency: "BRL",
    occurred_at: "2026-07-01T12:00:00Z",
    stripe_charge_id: "ch_1",
    stripe_invoice_id: null,
    plan_code: "pro_annual",
    ...over,
  };
}

describe("refundStateOf", () => {
  it("sem reembolso e none", () => {
    expect(refundStateOf(10000, 0)).toBe("none");
  });

  it("reembolso menor que a cobranca e partial", () => {
    expect(refundStateOf(10000, 3000)).toBe("partial");
  });

  it("reembolso igual a cobranca e full", () => {
    expect(refundStateOf(10000, 10000)).toBe("full");
  });

  it("reembolso maior que a cobranca ainda e full, nao 'mais que full'", () => {
    // Nao deveria acontecer, mas se acontecer o estado util e "nao ha o que
    // reembolsar", nao um estado novo que a UI nao conhece.
    expect(refundStateOf(10000, 12000)).toBe("full");
  });

  it("cobranca de valor zero nao vira partial por divisao estranha", () => {
    expect(refundStateOf(0, 0)).toBe("none");
  });
});

describe("buildTransactionList", () => {
  it("usuario sem transacao devolve lista vazia e total zero", () => {
    const saida = buildTransactionList([]);
    expect(saida.items).toEqual([]);
    expect(saida.total_paid_cents).toBe(0);
  });

  it("so cobrancas: total e a soma e nada aparece como reembolsado", () => {
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({ id: "b", stripe_charge_id: "ch_b", gross_cents: 2990 }),
    ]);

    expect(saida.total_paid_cents).toBe(12990);
    expect(saida.items.every((i) => i.refund_state === "none")).toBe(true);
    expect(saida.items.every((i) => i.refunded_cents === 0)).toBe(true);
  });

  it("reembolso PARCIAL: agrega no charge e o teto cai", () => {
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "r",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -3000,
      }),
    ]);

    const charge = saida.items.find((i) => i.id === "a")!;
    // Agregado em MAGNITUDE positiva: "R$ 30 reembolsados" le melhor que -3000.
    expect(charge.refunded_cents).toBe(3000);
    expect(charge.refund_state).toBe("partial");
    expect(charge.refundable_cents).toBe(7000);

    // A LINHA do reembolso mantem o sinal negativo: a UI mostra o sinal.
    const refund = saida.items.find((i) => i.id === "r")!;
    expect(refund.gross_cents).toBe(-3000);
    expect(refund.refunded_cents).toBe(0);

    // E o total ja desconta.
    expect(saida.total_paid_cents).toBe(7000);
  });

  it("reembolso TOTAL: estado full e nada mais reembolsavel", () => {
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "r",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -10000,
      }),
    ]);

    const charge = saida.items.find((i) => i.id === "a")!;
    expect(charge.refund_state).toBe("full");
    expect(charge.refundable_cents).toBe(0);
    expect(saida.total_paid_cents).toBe(0);
  });

  it("VARIOS reembolsos no mesmo charge somam", () => {
    // Reembolso parcelado e o caso em que somar errado deixa reembolsar de
    // novo o que ja saiu.
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "r1",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -2000,
      }),
      row({
        id: "r2",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -3000,
      }),
      row({
        id: "r3",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -1000,
      }),
    ]);

    const charge = saida.items.find((i) => i.id === "a")!;
    expect(charge.refunded_cents).toBe(6000);
    expect(charge.refund_state).toBe("partial");
    expect(charge.refundable_cents).toBe(4000);
  });

  it("DISPUTA NAO entra em refunded_cents: e estado proprio", () => {
    // Chargeback nao e reembolso voluntario. Somar os dois faria a UI da Fatia
    // 7 dizer "ja reembolsado" para dinheiro que saiu por contestacao, e a acao
    // correta ali e contestar, nao reembolsar.
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "d",
        type: "dispute",
        stripe_charge_id: "ch_a",
        gross_cents: -10000,
      }),
    ]);

    const charge = saida.items.find((i) => i.id === "a")!;
    expect(charge.refunded_cents).toBe(0);
    expect(charge.refund_state).toBe("none");
    expect(charge.disputed_cents).toBe(10000);
    expect(charge.disputed).toBe(true);
    // Mas o dinheiro JA SAIU: o teto de reembolso tem que refletir isso, senao
    // a Fatia 7 tentaria reembolsar o que a Stripe ja retirou.
    expect(charge.refundable_cents).toBe(0);
  });

  it("disputa parcial com reembolso parcial: os dois descontam do teto", () => {
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "r",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -2000,
      }),
      row({
        id: "d",
        type: "dispute",
        stripe_charge_id: "ch_a",
        gross_cents: -3000,
      }),
    ]);

    const charge = saida.items.find((i) => i.id === "a")!;
    expect(charge.refunded_cents).toBe(2000);
    expect(charge.disputed_cents).toBe(3000);
    expect(charge.refundable_cents).toBe(5000);
    expect(charge.refund_state).toBe("partial");
  });

  it("linha SEM charge_id nao quebra e nao e agregada a ninguem", () => {
    const saida = buildTransactionList([
      row({ id: "a", stripe_charge_id: "ch_a", gross_cents: 10000 }),
      row({
        id: "solto",
        type: "refund",
        stripe_charge_id: null,
        gross_cents: -500,
      }),
    ]);

    expect(saida.items).toHaveLength(2);
    const charge = saida.items.find((i) => i.id === "a")!;
    expect(charge.refunded_cents).toBe(0);
    // Mesmo sem poder ligar a uma cobranca, o dinheiro saiu e entra no total.
    expect(saida.total_paid_cents).toBe(9500);
  });

  it("refund orfao (charge de outro usuario ou nao ingerida) nao inventa charge", () => {
    const saida = buildTransactionList([
      row({
        id: "r",
        type: "refund",
        stripe_charge_id: "ch_zzz",
        gross_cents: -500,
      }),
    ]);

    expect(saida.items).toHaveLength(1);
    expect(saida.total_paid_cents).toBe(-500);
  });

  it("ordena do mais recente para o mais antigo, com desempate por id", () => {
    const saida = buildTransactionList([
      row({ id: "b", occurred_at: "2026-01-01T00:00:00Z" }),
      row({ id: "c", occurred_at: "2026-07-01T00:00:00Z" }),
      row({ id: "a", occurred_at: "2026-07-01T00:00:00Z" }),
    ]);

    // Empate de occurred_at resolvido por id desc: ordem estavel entre
    // requisicoes, sem depender de o Postgres devolver na mesma sequencia.
    expect(saida.items.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("campos de reembolso so existem em charge: refund e dispute vem zerados", () => {
    const saida = buildTransactionList([
      row({
        id: "r",
        type: "refund",
        stripe_charge_id: "ch_a",
        gross_cents: -500,
      }),
    ]);

    const refund = saida.items[0];
    expect(refund.refunded_cents).toBe(0);
    expect(refund.refundable_cents).toBe(0);
    expect(refund.refund_state).toBe("none");
  });
});

describe("coerencia entre o total do extrato e o 'Valor pago (total)' do modal", () => {
  // O modal soma gross_cents das linhas charge/refund/dispute do usuario
  // (server/routes/admin.ts). O extrato precisa somar EXATAMENTE as mesmas
  // linhas, senao a tela mostra dois numeros diferentes para a mesma coisa,
  // um deles logo abaixo do outro.
  //
  // Nao ha nenhum refund em producao hoje, entao este cenario e montado a mao:
  // e o unico jeito de provar a coerencia antes de o primeiro reembolso existir.
  const linhas: FinanceRow[] = [
    row({ id: "c1", stripe_charge_id: "ch_1", gross_cents: 22200 }),
    row({ id: "c2", stripe_charge_id: "ch_2", gross_cents: 2990 }),
    row({
      id: "r1",
      type: "refund",
      stripe_charge_id: "ch_1",
      gross_cents: -5000,
    }),
    row({
      id: "d1",
      type: "dispute",
      stripe_charge_id: "ch_2",
      gross_cents: -2990,
    }),
  ];

  /** Reproduz o reduce da rota de detalhe, deliberadamente. */
  function totalDoModal(rows: FinanceRow[]): number {
    return rows
      .filter((r) => ["charge", "refund", "dispute"].includes(r.type))
      .reduce((soma, r) => soma + (r.gross_cents ?? 0), 0);
  }

  it("os dois numeros batem", () => {
    expect(buildTransactionList(linhas).total_paid_cents).toBe(
      totalDoModal(linhas),
    );
  });

  it("e batem depois de somar mais um reembolso", () => {
    const comMais = [
      ...linhas,
      row({
        id: "r2",
        type: "refund",
        stripe_charge_id: "ch_1",
        gross_cents: -1000,
      }),
    ];
    expect(buildTransactionList(comMais).total_paid_cents).toBe(
      totalDoModal(comMais),
    );
  });

  it("payout e adjustment ficam de fora dos DOIS, pelo mesmo motivo", () => {
    // Sao movimentos da conta Stripe, nao pagamentos do usuario. Se um dia
    // entrarem no extrato sem entrar no total (ou vice-versa), este teste cai.
    const comPayout = [
      ...linhas,
      row({
        id: "p",
        type: "payout",
        stripe_charge_id: null,
        gross_cents: -9999,
      }),
    ];
    expect(buildTransactionList(comPayout).total_paid_cents).toBe(
      totalDoModal(comPayout),
    );
  });
});
