import { describe, expect, it } from "vitest";
import { MAX_FINANCE_HISTORY_DAYS } from "../../shared/adminFinance";
import { inicioDoDiaBrasilia, somarDiaCivil } from "../../shared/brasiliaDay";
import { classifyRegisteredPayments } from "./registeredPayments";

import {
  analyzeCurrentAccesses,
  analyzeRegisteredCash,
  resolveHonestFinanceAllPeriod,
  resolveHonestFinancePeriod,
} from "./honestFinance";

const period = resolveHonestFinancePeriod(
  { preset: "custom", fromDay: "2026-09-01", toDay: "2026-09-02" },
  new Date("2026-09-14T12:00:00Z"),
);

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    provider: "stripe",
    provider_transaction_id: "ch_1",
    stripe_balance_transaction_id: null,
    stripe_charge_id: "stripe-charge-1",
    type: "charge",
    gross_cents: 10_000,
    fee_cents: 500,
    net_cents: 9_500,
    currency: "brl",
    occurred_at: "2026-09-01T15:00:00-03:00",
    created_at: "2026-09-01T18:01:00Z",
    user_id: "user-1",
    plan_code: "pro_monthly",
    ...overrides,
  };
}

function access(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    user_id: "user-1",
    provider: "stripe",
    provider_subscription_id: "provider-sub-1",
    status: "active",
    renewal_type: "auto",
    current_period_end: "2026-10-01T03:00:00Z",
    cancel_at_period_end: false,
    updated_at: "2026-09-01T13:00:00Z",
    plans: { code: "pro_monthly", currency: "BRL", interval: "month" },
    ...overrides,
  };
}

describe("caixa financeiro honesto", () => {
  it.each([
    MAX_FINANCE_HISTORY_DAYS - 1,
    MAX_FINANCE_HISTORY_DAYS,
    MAX_FINANCE_HISTORY_DAYS + 1,
  ])("mantém o agregado de movimentos antigos com %i dias", (length) => {
    const endDayInclusive = "2026-09-13";
    const startDay = somarDiaCivil(endDayInclusive, -(length - 1));
    const allPeriod = {
      ...period,
      preset: "all" as const,
      startDay,
      endDayInclusive,
      from: inicioDoDiaBrasilia(startDay),
      toExclusive: inicioDoDiaBrasilia("2026-09-14"),
    };
    const cash = analyzeRegisteredCash({
      period: allPeriod,
      rows: [
        transaction({ occurred_at: `${startDay}T12:00:00-03:00` }),
        transaction({
          id: "row-2",
          provider_transaction_id: "ch_2",
          stripe_charge_id: "stripe-charge-2",
          currency: "USD",
          occurred_at: "2026-09-13T12:00:00-03:00",
          gross_cents: 2_000,
          fee_cents: 100,
          net_cents: 1_900,
        }),
      ],
    });
    expect(cash.currencies.map((bucket) => bucket.currency)).toEqual([
      "BRL",
      "USD",
    ]);
    expect(cash.currencies[0].positiveEntries.valueCents).toBe(10_000);
    expect(cash.currencies[1].positiveEntries.valueCents).toBe(2_000);
    expect(cash.seriesDetail?.status).toBe(
      length > MAX_FINANCE_HISTORY_DAYS ? "unavailable" : "available",
    );
    expect(cash.currencies[0].series).toHaveLength(
      length > MAX_FINANCE_HISTORY_DAYS ? 0 : length,
    );
    if (length > MAX_FINANCE_HISTORY_DAYS) {
      expect(cash.seriesDetail?.reason).toBe("daily_limit_exceeded");
    }
  });

  it("deduplica e exclui conflitos atravessando páginas no histórico longo", () => {
    const startDay = "2010-01-01";
    const allPeriod = {
      ...period,
      preset: "all" as const,
      startDay,
      endDayInclusive: "2026-09-13",
      from: inicioDoDiaBrasilia(startDay),
      toExclusive: inicioDoDiaBrasilia("2026-09-14"),
    };
    const rows = Array.from({ length: 1_001 }, (_, index) =>
      transaction({
        id: `row-${index}`,
        provider_transaction_id: `ch-${index}`,
        stripe_charge_id: `stripe-charge-${index}`,
        occurred_at: "2010-01-01T12:00:00-03:00",
      }),
    );
    // Identidades econômicas cruzam a borda típica de páginas de 1.000 linhas.
    rows[999] = transaction({
      id: "row-999",
      provider_transaction_id: "dup",
      stripe_charge_id: "duplicate-across-page",
      occurred_at: "2010-01-01T12:00:00-03:00",
    });
    rows[1_000] = transaction({
      id: "row-1000",
      provider_transaction_id: "dup",
      stripe_charge_id: "duplicate-across-page",
      occurred_at: "2010-01-01T12:00:00-03:00",
    });
    rows[0] = transaction({
      id: "row-0",
      stripe_charge_id: "conflict-across-page",
      occurred_at: "2010-01-01T12:00:00-03:00",
    });
    rows[500] = transaction({
      id: "row-500",
      stripe_charge_id: "conflict-across-page",
      occurred_at: "2010-01-01T12:00:00-03:00",
      gross_cents: 12_000,
    });
    const cash = analyzeRegisteredCash({ period: allPeriod, rows });
    expect(cash.seriesDetail?.reason).toBe("daily_limit_exceeded");
    expect(cash.coverage.duplicateRowsIgnored).toBe(2);
    expect(cash.conflictingIdentities.value).toBe(1);
    expect(cash.exclusionsByReason.economicConflict).toBe(2);
    expect(cash.coverage.canonicalTransactions).toBe(998);
    expect(cash.currencies[0].positiveEntries.valueCents).toBe(9_980_000);
  });

  it("falha restrita à série não apaga agregado; linha inválida é excluída", () => {
    const cash = analyzeRegisteredCash({
      period,
      rows: [transaction()],
      seriesDays: () => {
        throw new Error("série indisponível");
      },
    });
    expect(cash.seriesDetail?.reason).toBe("series_build_failed");
    expect(cash.currencies[0].series).toEqual([]);
    expect(cash.currencies[0].calculableNet.valueCents).toBe(9_500);
    const invalid = analyzeRegisteredCash({
      period,
      rows: [transaction({ gross_cents: null })],
    });
    expect(invalid.currencies).toEqual([]);
    expect(invalid.exclusionsByReason.invalidAmount).toBe(1);
  });
  it("separa moedas, sem produzir um total misto", () => {
    const cash = analyzeRegisteredCash({
      period,
      rows: [
        transaction(),
        transaction({
          id: "row-2",
          provider_transaction_id: "ch_2",
          stripe_charge_id: "stripe-charge-2",
          currency: "USD",
          gross_cents: 2_000,
          fee_cents: 100,
          net_cents: 1_900,
        }),
      ],
    });

    expect(cash.status).toBe("partial");
    expect(cash.currencies.map((bucket) => bucket.currency)).toEqual([
      "BRL",
      "USD",
    ]);
    expect(
      cash.currencies.map((bucket) => bucket.positiveEntries.valueCents),
    ).toEqual([10_000, 2_000]);
    expect(cash).not.toHaveProperty("total");
  });

  it("não infere reembolso externo ausente do ledger", () => {
    const cash = analyzeRegisteredCash({ period, rows: [transaction()] });
    expect(cash.currencies[0].refunds.valueCents).toBe(0);
    expect(cash.limitations.join(" ")).toMatch(/admin_refunds/);
    expect(cash.limitations.join(" ")).toMatch(/Cobertura histórica/);
  });

  it("exclui toda identidade com conflito econômico e diagnostica o motivo", () => {
    const cash = analyzeRegisteredCash({
      period,
      rows: [transaction(), transaction({ id: "row-2", gross_cents: 12_000 })],
    });
    expect(cash.coverage.canonicalTransactions).toBe(0);
    expect(cash.conflictingIdentities.value).toBe(1);
    expect(cash.exclusionsByReason.economicConflict).toBe(2);
    expect(cash.currencies).toEqual([]);
  });

  it("reconhece offsets equivalentes como o mesmo instante canônico", () => {
    const cash = analyzeRegisteredCash({
      period,
      rows: [
        transaction({ occurred_at: "2026-09-01T15:00:00-03:00" }),
        transaction({ id: "row-2", occurred_at: "2026-09-01T18:00:00Z" }),
      ],
    });
    expect(cash.coverage.canonicalTransactions).toBe(1);
    expect(cash.coverage.duplicateRowsIgnored).toBe(1);
    expect(cash.conflictingIdentities.value).toBe(0);
  });

  it("não converte fonte sem linhas em R$ 0", () => {
    const cash = analyzeRegisteredCash({ period, rows: [] });
    expect(cash.status).toBe("partial");
    expect(cash.currencies).toEqual([]);
    expect(cash.excludedTransactions.value).toBe(0);
  });

  it("reconcilia o total de pagamentos exatamente com o classificador ADM-001", () => {
    const rows = [
      transaction(),
      transaction({
        id: "row-2",
        provider_transaction_id: "balance-duplicada",
        fee_cents: null,
        currency: null,
      }),
      transaction({
        id: "row-3",
        stripe_charge_id: "stripe-charge-sem-pessoa",
        provider_transaction_id: "balance-3",
        user_id: null,
      }),
      transaction({
        id: "row-4",
        type: "refund",
        stripe_charge_id: "stripe-charge-refund",
        provider_transaction_id: "refund-1",
        gross_cents: -1_000,
        fee_cents: 0,
        net_cents: -1_000,
      }),
    ];
    const adm001 = classifyRegisteredPayments({
      rows,
      cutoff: period.toExclusive,
    });
    const cash = analyzeRegisteredCash({ period, rows });

    expect(adm001.payments).toHaveLength(2);
    expect(cash.registeredPayments.value).toBe(adm001.payments.length);
    expect(cash.registeredPaymentsWithoutPerson.value).toBe(1);
    expect(cash.coverage.paymentIdentitiesFromAdm001).toBe(2);
    expect(cash.exclusionsByReason.invalidAmount).toBe(1);
  });

  it("mantém invariantes locais por tipo, moeda e centavos inteiros", () => {
    const cash = analyzeRegisteredCash({
      period,
      rows: [
        transaction(),
        transaction({
          id: "refund",
          provider_transaction_id: "refund",
          type: "refund",
          gross_cents: -1_250,
          fee_cents: 0,
          net_cents: -1_250,
        }),
        transaction({
          id: "adjustment",
          provider_transaction_id: "adjustment",
          type: "adjustment",
          gross_cents: 333,
          fee_cents: 0,
          net_cents: 333,
        }),
        transaction({
          id: "dispute",
          provider_transaction_id: "dispute",
          type: "dispute",
          gross_cents: -2_000,
          fee_cents: 150,
          net_cents: -2_150,
        }),
      ],
    });
    const brl = cash.currencies[0];
    expect(brl.positiveEntries.valueCents).toBe(10_000);
    expect(brl.refunds.valueCents).toBe(1_250);
    expect(brl.fees.valueCents).toBe(650);
    expect(brl.calculableNet.valueCents).toBe(6_433);
    expect(Number.isSafeInteger(brl.calculableNet.valueCents)).toBe(true);
  });
});

describe("acessos e catálogo", () => {
  it("separa automático, manual e trial; trial e manual não entram no automático", () => {
    const accesses = analyzeCurrentAccesses({
      computedAt: "2026-09-14T12:00:00Z",
      rows: [
        access(),
        access({ id: "sub-2", user_id: "user-2", renewal_type: "manual" }),
        access({
          id: "sub-3",
          user_id: "user-3",
          status: "trialing",
          renewal_type: "auto",
        }),
      ],
    });
    expect(accesses.automaticActive.value).toBe(1);
    expect(accesses.manualPrepaidActive.value).toBe(1);
    expect(accesses.trialing.value).toBe(1);
    expect(accesses.catalogMonthlyValues[0].automaticActive.valueCents).toBe(
      2990,
    );
    expect(
      accesses.catalogMonthlyValues[0].manualPrepaidActive.valueCents,
    ).toBe(2990);
    expect(accesses.limitations.join(" ")).toMatch(
      /preço vigente de catálogo/i,
    );
  });

  it("não escolhe subscription canônica quando a pessoa tem acessos simultâneos", () => {
    const accesses = analyzeCurrentAccesses({
      computedAt: "2026-09-14T12:00:00Z",
      rows: [
        access(),
        access({
          id: "sub-2",
          provider: "asaas",
          provider_subscription_id: "provider-sub-2",
        }),
      ],
    });
    expect(accesses.automaticActive.value).toBe(0);
    expect(accesses.conflictingPeople.value).toBe(1);
    expect(accesses.catalogMonthlyValues).toEqual([]);
    expect(accesses.catalogValueExclusions.value).toBe(2);
  });

  it("mantém cancelamento agendado como acesso atual, mas fora de promessa futura", () => {
    const accesses = analyzeCurrentAccesses({
      computedAt: "2026-09-14T12:00:00Z",
      rows: [access({ cancel_at_period_end: true })],
    });
    expect(accesses.automaticActive.value).toBe(1);
    expect(accesses.scheduledCancellation.value).toBe(1);
  });

  it("exclui mensalização que exigiria arredondar centavos", () => {
    const accesses = analyzeCurrentAccesses({
      computedAt: "2026-09-14T12:00:00Z",
      rows: [
        access({
          plans: {
            code: "pro_monthly",
            currency: "BRL",
            interval: "semiannual",
          },
        }),
      ],
    });
    expect(accesses.catalogMonthlyValues).toEqual([]);
    expect(accesses.catalogValueExclusions.value).toBe(1);
  });
});

describe("períodos gerenciais", () => {
  it("Tudo começa no primeiro movimento financeiro local, sem corte de 366 dias", async () => {
    const findFirst = () => Promise.resolve("2025-07-10T23:30:00-03:00");
    const result = await resolveHonestFinanceAllPeriod(
      { preset: "all", asOfDay: "2026-09-14" },
      new Date("2026-09-14T12:00:00Z"),
      findFirst,
    );
    expect(result).toMatchObject({
      preset: "all",
      startDay: "2025-07-10",
      endDayInclusive: "2026-09-13",
      from: "2025-07-10T03:00:00.000Z",
      toExclusive: "2026-09-14T03:00:00.000Z",
    });
  });

  it("Tudo sem fato local não inventa início nem zero", async () => {
    await expect(
      resolveHonestFinanceAllPeriod(
        { preset: "all", asOfDay: "2026-09-14" },
        new Date("2026-09-14T12:00:00Z"),
        () => Promise.resolve(null),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("Tudo recusa dia de referência obsoleto, mas não corta histórico longo", async () => {
    await expect(
      resolveHonestFinanceAllPeriod(
        { preset: "all", asOfDay: "2026-09-13" },
        new Date("2026-09-14T12:00:00Z"),
        () => Promise.resolve("2026-01-01T12:00:00Z"),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    const all = await resolveHonestFinanceAllPeriod(
      { preset: "all", asOfDay: "2026-09-14" },
      new Date("2026-09-14T12:00:00Z"),
      () => Promise.resolve("2010-01-01T12:00:00Z"),
    );
    expect(all.startDay).toBe("2010-01-01");
  });

  it("usa apenas dias completos de America/Sao_Paulo", () => {
    const result = resolveHonestFinancePeriod(
      { preset: "30d" },
      new Date("2026-09-14T02:30:00-03:00"),
    );
    expect(result).toMatchObject({
      startDay: "2026-08-15",
      endDayInclusive: "2026-09-13",
      from: "2026-08-15T03:00:00.000Z",
      toExclusive: "2026-09-14T03:00:00.000Z",
      timezone: "America/Sao_Paulo",
      basis: "complete_calendar_days",
    });
  });

  it("instantes equivalentes com offsets distintos geram a mesma janela", () => {
    const a = resolveHonestFinancePeriod(
      { preset: "previous_month" },
      new Date("2026-09-14T10:00:00-03:00"),
    );
    const b = resolveHonestFinancePeriod(
      { preset: "previous_month" },
      new Date("2026-09-14T13:00:00Z"),
    );
    expect(a).toEqual(b);
    expect(a.startDay).toBe("2026-08-01");
    expect(a.endDayInclusive).toBe("2026-08-31");
  });
});
