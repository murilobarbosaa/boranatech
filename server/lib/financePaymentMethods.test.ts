import { describe, expect, it } from "vitest";
import { PaymentMethodSummarySchema } from "../../shared/adminFinanceMethods";
import {
  analyzePaymentMethods,
  pageMethodTransactions,
  type MethodFinanceRow,
} from "./financePaymentMethods";

const cutoff = "2026-09-03T03:00:00.000Z";
function charge(
  id: string,
  paymentId: string,
  userId: string | null,
  overrides: Partial<MethodFinanceRow> = {},
): MethodFinanceRow {
  return {
    id,
    provider: "asaas",
    provider_transaction_id: paymentId,
    stripe_charge_id: null,
    type: "charge",
    gross_cents: 10_000,
    fee_cents: 0,
    net_cents: 10_000,
    currency: "BRL",
    occurred_at: "2026-09-01T12:00:00.000Z",
    created_at: "2026-09-01T12:01:00.000Z",
    user_id: userId,
    plan_code: "pro",
    ...overrides,
  };
}
function evidence(paymentId: string, method: string | null) {
  return {
    id: paymentId,
    provider: "asaas",
    provider_subscription_id: paymentId,
    payment_method: method,
  };
}

describe("meios de pagamentos financeiros", () => {
  it("conta Pix por pagamento deduplicado e pessoas distintas, sem somar moedas", () => {
    const rows = [
      charge("a", "pay-a", "user-1"),
      charge("a-duplicate", "pay-a", "user-1"),
      charge("b", "pay-b", "user-1"),
      charge("c", "pay-c", null),
      charge("d", "pay-d", "user-2", { currency: "USD" }),
    ];
    const result = analyzePaymentMethods({
      rows,
      evidence: ["pay-a", "pay-b", "pay-c", "pay-d"].map((id) =>
        evidence(id, "pix"),
      ),
      cutoff,
    });
    expect(result.pix).toEqual([
      {
        currency: "BRL",
        payments: 3,
        people: 1,
        grossCents: 30_000,
        withoutPerson: 1,
      },
      {
        currency: "USD",
        payments: 1,
        people: 1,
        grossCents: 10_000,
        withoutPerson: 0,
      },
    ]);
    expect(result.coverage.duplicateRowsIgnored).toBe(1);
    expect(Array.from(result.rowIdsByMethod.pix)).toEqual([
      "a",
      "a-duplicate",
      "b",
      "c",
      "d",
    ]);
  });

  it("não infere Pix do provedor ou de uma assinatura sem vínculo com o pagamento", () => {
    const rows = [
      charge("a", "pay-a", "user-1"),
      charge("b", "pay-b", "user-2"),
    ];
    const result = analyzePaymentMethods({
      rows,
      evidence: [evidence("pay-a", "boleto"), evidence("unrelated", "pix")],
      cutoff,
    });
    expect(result.pix).toEqual([]);
    expect(result.paymentsWithoutMethod).toBe(1);
    expect(Array.from(result.rowIdsByMethod.boleto)).toEqual(["a"]);
    expect(Array.from(result.rowIdsByMethod.unknown)).toEqual(["b"]);
  });
  it("conta três pessoas distintas em três pagamentos e exclui pessoa ausente", () => {
    const rows = [
      charge("a", "pay-a", "person-a"),
      charge("b", "pay-b", "person-b"),
      charge("c", "pay-c", "person-c"),
      charge("d", "pay-d", null),
    ];
    const result = analyzePaymentMethods({
      rows,
      evidence: ["pay-a", "pay-b", "pay-c", "pay-d"].map((id) =>
        evidence(id, "pix"),
      ),
      cutoff,
    });
    expect(result.pix).toEqual([
      {
        currency: "BRL",
        payments: 4,
        people: 3,
        grossCents: 40_000,
        withoutPerson: 1,
      },
    ]);
  });

  it("expõe conflito de meio e exclui conflito econômico ou de moeda", () => {
    const rows = [
      charge("a", "pay-a", "user-1"),
      charge("a-usd", "pay-a", "user-1", { currency: "USD" }),
      charge("b", "pay-b", "user-2"),
      charge("c", "pay-c", "user-3"),
      charge("c-conflict", "pay-c", "user-3", { gross_cents: 12_000 }),
    ];
    const result = analyzePaymentMethods({
      rows,
      evidence: [
        evidence("pay-a", "pix"),
        evidence("pay-b", "pix"),
        evidence("pay-b", "card"),
        evidence("pay-c", "pix"),
      ],
      cutoff,
    });
    expect(result.pix).toEqual([]);
    expect(result.methodConflicts).toBe(1);
    expect(result.excludedEconomicOrCurrency).toBe(1);
    expect(result.rowIdsByMethod.pix.size).toBe(0);
  });

  it("distingue histórico sem linhas de zero observado e ignora payout", () => {
    expect(
      analyzePaymentMethods({ rows: [], evidence: [], cutoff }).status,
    ).toBe("not_collected");
    const result = analyzePaymentMethods({
      rows: [
        charge("po", "pay-a", null, { type: "payout", gross_cents: -10_000 }),
      ],
      evidence: [evidence("pay-a", "pix")],
      cutoff,
    });
    expect(result.status).toBe("partial");
    expect(result.pix).toEqual([]);
    expect(result.rowIdsByMethod.pix.size).toBe(0);
  });

  it("valida o contrato de meios e recusa moeda repetida ou valor inválido", () => {
    const result = analyzePaymentMethods({
      rows: [charge("a", "pay-a", "u1")],
      evidence: [evidence("pay-a", "pix")],
      cutoff,
    });
    const { rowIdsByMethod: _ids, ...publicResult } = result;
    expect(PaymentMethodSummarySchema.parse(publicResult).pix[0].payments).toBe(
      1,
    );
    expect(() =>
      PaymentMethodSummarySchema.parse({
        ...publicResult,
        pix: [...publicResult.pix, ...publicResult.pix],
      }),
    ).toThrow();
    expect(() =>
      PaymentMethodSummarySchema.parse({
        ...publicResult,
        pix: [{ ...publicResult.pix[0], grossCents: Number.NaN }],
      }),
    ).toThrow();
  });

  it("filtra o conjunto completo antes da página 2 e preserva o total global", () => {
    const rows = Array.from({ length: 30 }, (_, index) =>
      charge(`row-${index}`, `pay-${index}`, null),
    );
    const matchingIds = new Set(rows.slice(0, 27).map((row) => row.id));
    const page = pageMethodTransactions({
      rows,
      matchingIds,
      currency: "BRL",
      type: "charge",
      page: 2,
      pageSize: 25,
    });
    expect(page.total).toBe(27);
    expect(page.rows).toHaveLength(2);
    expect(page.rows.every((row) => matchingIds.has(row.id))).toBe(true);
  });
  it("encontra Pix depois da posição 25 e combina meio, moeda e tipo no conjunto completo", () => {
    const rows = Array.from({ length: 30 }, (_, index) =>
      charge(
        `row-${String(index).padStart(2, "0")}`,
        `pay-${index}`,
        `person-${index}`,
        index === 0 ? { currency: "USD" } : {},
      ),
    );
    const matchingIds = new Set([rows[0].id, rows[29].id]);
    expect(
      pageMethodTransactions({
        rows,
        matchingIds,
        currency: "USD",
        type: "charge",
        page: 1,
        pageSize: 25,
      }),
    ).toMatchObject({
      total: 1,
      rows: [expect.objectContaining({ id: rows[0].id })],
    });
    expect(
      pageMethodTransactions({
        rows,
        matchingIds,
        currency: "BRL",
        type: "refund",
        page: 1,
        pageSize: 25,
      }).total,
    ).toBe(0);
    expect(
      pageMethodTransactions({
        rows,
        matchingIds,
        currency: "BRL",
        type: "charge",
        page: 1,
        pageSize: 25,
      }).rows[0].id,
    ).toBe(rows[29].id);
  });
});
