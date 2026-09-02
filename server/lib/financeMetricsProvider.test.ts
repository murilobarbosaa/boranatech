import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RECEITA COM MAIS DE UM PROVEDOR NO LEDGER.
 *
 * O que estes casos travam e a passagem de "tudo e Stripe" para "Stripe e
 * Asaas", e o risco nao e a aritmetica: e o ROTULO. `taxasStripeCents` somava
 * todas as taxas porque todas eram da Stripe, e continuar somando com Pix
 * dentro faria o painel afirmar que a Stripe cobrou uma taxa que quem cobrou
 * foi o Asaas. O numero seguiria certo; a frase, nao.
 *
 * O duble substitui SO a paginacao: `getFinanceSummary` chama `coletarTudo`
 * duas vezes (transacoes e despesas), e o que se quer exercitar e o laco de
 * acumulacao, nao o PostgREST.
 */

const estado = vi.hoisted(() => ({
  transacoes: [] as Array<Record<string, unknown>>,
  despesas: [] as Array<Record<string, unknown>>,
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      const q: Record<string, unknown> = {};
      for (const m of ["select", "gte", "lte", "order", "range"]) {
        q[m] = () => q;
      }
      return q;
    },
  },
}));

vi.mock("./paginate", () => ({
  coletarTudo: async (_fetch: unknown, label: string) =>
    label.startsWith("expenses") ? estado.despesas : estado.transacoes,
}));

import { getFinanceSummary } from "./financeMetrics";

const DE = new Date("2026-09-01T00:00:00.000Z");
const ATE = new Date("2026-09-30T23:59:59.000Z");

/** Cobranca real da Stripe: R$ 29,90, taxa de R$ 1,57. */
const CHARGE_STRIPE = {
  provider: "stripe",
  type: "charge",
  gross_cents: 2990,
  fee_cents: 157,
  net_cents: 2833,
  plan_code: "pro_monthly",
  occurred_at: "2026-09-03T12:00:00.000Z",
};

/** Cobranca real do Asaas: R$ 12,90, taxa de R$ 1,99 (12,90 menos 10,91). */
const CHARGE_ASAAS = {
  provider: "asaas",
  type: "charge",
  gross_cents: 1290,
  fee_cents: 199,
  net_cents: 1091,
  plan_code: "pro_monthly",
  occurred_at: "2026-09-01T13:11:33.000Z",
};

beforeEach(() => {
  estado.transacoes = [];
  estado.despesas = [];
});

describe("taxas: o rotulo passou a valer", () => {
  it("taxasCents soma OS DOIS provedores", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    // 157 + 199, escrito a mao.
    expect(r.taxasCents).toBe(356);
  });

  it("taxasStripeCents soma SO a Stripe", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.taxasStripeCents).toBe(157);
  });

  it("os dois campos DIVERGEM quando ha Pix, e e esse o ponto", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.taxasCents).not.toBe(r.taxasStripeCents);
  });

  it("CONTROLE NEGATIVO: so com Stripe, os dois campos coincidem", async () => {
    // Comportamento preservado para quem nao usa Pix: o numero antigo nao mudou.
    estado.transacoes = [CHARGE_STRIPE];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.taxasCents).toBe(157);
    expect(r.taxasStripeCents).toBe(157);
  });
});

describe("receita bruta e liquida somam todos os provedores", () => {
  it("a cobranca Pix ENTRA na receita, que era o buraco", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    // 2990 + 1290 e 2833 + 1091, escritos a mao.
    expect(r.receitaBrutaCents).toBe(4280);
    expect(r.receitaLiquidaCents).toBe(3924);
  });

  it("CONTROLE NEGATIVO: so Pix, e a receita e so dele", async () => {
    estado.transacoes = [CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.receitaBrutaCents).toBe(1290);
    expect(r.receitaLiquidaCents).toBe(1091);
  });
});

describe("receitaPorProvider", () => {
  it("quebra os quatro numeros por provedor", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.receitaPorProvider).toEqual([
      {
        provider: "asaas",
        brutaCents: 1290,
        liquidaCents: 1091,
        taxasCents: 199,
        reembolsosCents: 0,
      },
      {
        provider: "stripe",
        brutaCents: 2990,
        liquidaCents: 2833,
        taxasCents: 157,
        reembolsosCents: 0,
      },
    ]);
  });

  it("a soma da quebra REPRODUZ os totais, e por isso nenhuma tela escolhe", async () => {
    estado.transacoes = [CHARGE_STRIPE, CHARGE_ASAAS];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    const soma = (campo: "brutaCents" | "liquidaCents" | "taxasCents") =>
      r.receitaPorProvider.reduce((a, p) => a + p[campo], 0);

    expect(soma("brutaCents")).toBe(r.receitaBrutaCents);
    expect(soma("liquidaCents")).toBe(r.receitaLiquidaCents);
    expect(soma("taxasCents")).toBe(r.taxasCents);
  });

  it("estorno do Asaas entra com magnitude positiva em reembolsos", async () => {
    estado.transacoes = [
      CHARGE_ASAAS,
      {
        provider: "asaas",
        type: "refund",
        gross_cents: -1290,
        fee_cents: 0,
        net_cents: -1290,
        plan_code: "pro_monthly",
        occurred_at: "2026-09-05T13:00:00.000Z",
      },
    ];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.reembolsosCents).toBe(1290);
    expect(r.receitaPorProvider[0].reembolsosCents).toBe(1290);
    // Bruto NAO desconta reembolso (bruto e bruto); liquido desconta.
    expect(r.receitaBrutaCents).toBe(1290);
    expect(r.receitaLiquidaCents).toBe(-199);
  });

  it("linha SEM provider e contada como stripe, o default da coluna", async () => {
    // Linha gravada entre a migration e o deploy do codigo que escreve a
    // coluna. Um balde "desconhecido" tiraria essa receita da leitura por
    // provedor sem tirar do total, e as duas deixariam de fechar.
    const { provider: _ignorado, ...semProvider } = CHARGE_STRIPE;
    estado.transacoes = [semProvider];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    expect(r.receitaPorProvider).toHaveLength(1);
    expect(r.receitaPorProvider[0].provider).toBe("stripe");
    expect(r.taxasStripeCents).toBe(157);
  });

  it("payout continua FORA da receita, em qualquer provedor", async () => {
    estado.transacoes = [
      CHARGE_ASAAS,
      {
        provider: "asaas",
        type: "payout",
        gross_cents: -1091,
        fee_cents: 0,
        net_cents: -1091,
        plan_code: null,
        occurred_at: "2026-09-10T13:00:00.000Z",
      },
    ];

    const r = await getFinanceSummary({ from: DE, to: ATE });

    // Payout e movimento para o banco, nao receita.
    expect(r.receitaLiquidaCents).toBe(1091);
    expect(r.receitaPorProvider).toHaveLength(1);
  });
});
