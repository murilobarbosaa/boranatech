import { describe, expect, it } from "vitest";

import {
  MAX_FINANCE_HISTORY_DAYS,
  parseAdminFinanceContract,
} from "./adminFinance";
import { inicioDoDiaBrasilia, somarDiaCivil } from "./brasiliaDay";

function metric(valueCents: number | null = 1000) {
  return {
    status: valueCents === null ? "unavailable" : "partial",
    valueCents,
    currency: valueCents === null ? null : "BRL",
    sources: ["finance_transactions"],
    coverage: "sintética",
    freshness: "2026-09-02T03:00:00.000Z",
    limitations: [],
  };
}

function count(value: number | null = 1) {
  return {
    status: value === null ? "not_collected" : "partial",
    value,
    sources: ["finance_transactions"],
    coverage: "sintética",
    freshness: "2026-09-02T03:00:00.000Z",
    limitations: [],
  };
}

function contract() {
  const money = metric();
  const counted = count();
  return {
    contractVersion: 1,
    status: "partial",
    computedAt: "2026-09-14T12:00:00.000Z",
    period: {
      preset: "custom",
      startDay: "2026-09-01",
      endDayInclusive: "2026-09-02",
      from: "2026-09-01T03:00:00.000Z",
      toExclusive: "2026-09-03T03:00:00.000Z",
      timezone: "America/Sao_Paulo",
      basis: "complete_calendar_days",
    },
    cash: {
      status: "partial",
      source: "finance_transactions",
      coverage: {
        localRowsRead: 1,
        canonicalTransactions: 1,
        duplicateRowsIgnored: 0,
        paymentIdentitiesFromAdm001: 1,
        reconciledWithProviders: false,
        transactionalSnapshot: false,
        externalCoverage: "not_collected",
      },
      freshness: "2026-09-02T03:00:00.000Z",
      seriesDetail: undefined as
        | {
            status: "unavailable";
            reason: "daily_limit_exceeded" | "series_build_failed";
            maxDailyPoints: number;
          }
        | undefined,
      currencies: [
        {
          currency: "BRL",
          positiveEntries: money,
          refunds: money,
          fees: money,
          calculableNet: money,
          payments: counted,
          identifiedPeople: counted,
          transactionsWithoutPerson: counted,
          series: [
            {
              day: "2026-09-01",
              positiveEntriesCents: 1000,
              refundsCents: 1000,
              feesCents: 1000,
              calculableNetCents: 1000,
            },
            {
              day: "2026-09-02",
              positiveEntriesCents: 0,
              refundsCents: 0,
              feesCents: 0,
              calculableNetCents: 0,
            },
          ],
        },
      ],
      registeredPayments: counted,
      registeredPaymentPeople: counted,
      registeredPaymentsWithoutPerson: counted,
      excludedTransactions: counted,
      conflictingIdentities: counted,
      exclusionsByReason: {
        unsupportedType: 0,
        unsupportedProvider: 0,
        missingIdentity: 0,
        invalidAmount: 0,
        invalidCurrency: 0,
        invalidInstant: 0,
        outsidePeriod: 0,
        economicConflict: 0,
      },
      limitations: ["exemplo sintético"],
    },
    accesses: {
      status: "partial",
      source: "subscriptions",
      coverage: {
        localRowsRead: 1,
        transactionalSnapshot: false,
        historicalContractCoverage: "unavailable",
        peopleWithConflictingAccesses: 0,
      },
      freshness: "2026-09-02T03:00:00.000Z",
      automaticActive: counted,
      manualPrepaidActive: counted,
      trialing: counted,
      unclassified: counted,
      conflictingPeople: counted,
      scheduledCancellation: counted,
      catalogMonthlyValues: [],
      catalogValueExclusions: counted,
      limitations: ["exemplo sintético"],
    },
    unavailableIndicators: [
      {
        names: ["MRR contratual"],
        status: "unavailable",
        value: null,
        sources: ["subscriptions"],
        coverage: "sem fatos contratuais",
        freshness: null,
        limitations: ["não mensurável"],
        requiredFacts: ["obrigação imutável"],
      },
    ],
  };
}

describe("contrato compartilhado do financeiro", () => {
  it("valida uma série única de Todo histórico local maior que 366 dias", () => {
    const all = contract();
    all.period.preset = "all";
    all.period.startDay = "2025-07-10";
    all.period.endDayInclusive = "2026-09-13";
    all.period.from = inicioDoDiaBrasilia(all.period.startDay);
    all.period.toExclusive = inicioDoDiaBrasilia("2026-09-14");
    const series = [];
    for (
      let day = all.period.startDay;
      day <= all.period.endDayInclusive;
      day = somarDiaCivil(day, 1)
    ) {
      series.push({
        day,
        positiveEntriesCents: day === all.period.startDay ? 1000 : 0,
        refundsCents: day === all.period.startDay ? 1000 : 0,
        feesCents: day === all.period.startDay ? 1000 : 0,
        calculableNetCents: day === all.period.startDay ? 1000 : 0,
      });
    }
    all.cash.currencies[0].series = series;
    expect(series.length).toBeGreaterThan(366);
    expect(parseAdminFinanceContract(all).period.preset).toBe("all");
  });

  it("mantém total histórico longo sem exigir série, mas só com detalhe explícito", () => {
    const all = contract();
    all.period.preset = "all";
    all.period.startDay = somarDiaCivil(
      all.period.endDayInclusive,
      -MAX_FINANCE_HISTORY_DAYS,
    );
    all.period.from = inicioDoDiaBrasilia(all.period.startDay);
    all.cash.currencies[0].series = [];
    expect(() => parseAdminFinanceContract(all)).toThrow(
      /série diária completa excede o limite de pontos/,
    );
    all.cash.seriesDetail = {
      status: "unavailable",
      reason: "daily_limit_exceeded",
      maxDailyPoints: MAX_FINANCE_HISTORY_DAYS,
    };
    const parsed = parseAdminFinanceContract(all);
    expect(parsed.cash.currencies[0].calculableNet.valueCents).toBe(1000);
    expect(parsed.cash.seriesDetail?.status).toBe("unavailable");
    all.cash.currencies[0].series = [
      {
        day: all.period.startDay,
        positiveEntriesCents: 1000,
        refundsCents: 1000,
        feesCents: 1000,
        calculableNetCents: 1000,
      },
    ];
    expect(() => parseAdminFinanceContract(all)).toThrow(
      /série indisponível não pode conter pontos parciais/,
    );
    all.cash.currencies[0].series = [];
    all.cash.seriesDetail.reason = "series_build_failed";
    expect(() => parseAdminFinanceContract(all)).toThrow(
      /motivo da indisponibilidade da série diverge do período/,
    );
  });

  it("não confunde falha da série com disponibilidade ou exatidão do agregado", () => {
    const detailFailure = contract();
    detailFailure.cash.seriesDetail = {
      status: "unavailable",
      reason: "series_build_failed",
      maxDailyPoints: MAX_FINANCE_HISTORY_DAYS,
    };
    detailFailure.cash.currencies[0].series = [];
    expect(
      parseAdminFinanceContract(detailFailure).cash.currencies[0]
        .positiveEntries.valueCents,
    ).toBe(1000);
    detailFailure.cash.currencies[0].positiveEntries.valueCents = null as never;
    expect(() => parseAdminFinanceContract(detailFailure)).toThrow(
      /métrica disponível precisa de valor finito/,
    );
  });

  it("aceita o contrato v1 completo", () => {
    expect(parseAdminFinanceContract(contract()).contractVersion).toBe(1);
  });

  it.each([NaN, Infinity, -Infinity])(
    "rejeita valor não finito: %s",
    (value) => {
      const valueContract = contract();
      valueContract.cash.currencies[0].positiveEntries.valueCents = value;
      expect(() => parseAdminFinanceContract(valueContract)).toThrow(
        /incompatível/,
      );
    },
  );

  it("rejeita zero em indicador indisponível", () => {
    const valueContract = contract();
    valueContract.cash.currencies[0].positiveEntries = metric(null) as never;
    valueContract.cash.currencies[0].positiveEntries.valueCents = 0;
    expect(() => parseAdminFinanceContract(valueContract)).toThrow(
      /indisponível/,
    );
  });

  it("rejeita cache de versão antiga e campo ausente", () => {
    expect(() =>
      parseAdminFinanceContract({ ...contract(), contractVersion: 0 }),
    ).toThrow(/v1 incompatível/);
    const missing = contract() as Record<string, unknown>;
    delete missing.computedAt;
    expect(() => parseAdminFinanceContract(missing)).toThrow(/computedAt/);
  });

  it("rejeita moedas repetidas e séries desalinhadas", () => {
    const mixed = contract();
    mixed.cash.currencies.push({
      ...structuredClone(mixed.cash.currencies[0]),
      series: [
        {
          day: "2026-09-02",
          positiveEntriesCents: 0,
          refundsCents: 0,
          feesCents: 0,
          calculableNetCents: 0,
        },
      ],
    });
    expect(() => parseAdminFinanceContract(mixed)).toThrow(
      /moedas repetidas|desalinhadas|tamanhos distintos/,
    );
  });

  it("rejeita métrica em moeda diferente do seu agrupamento", () => {
    const mixed = contract();
    mixed.cash.currencies[0].positiveEntries.currency = "USD";
    expect(() => parseAdminFinanceContract(mixed)).toThrow(
      /moeda da métrica diverge/,
    );
  });

  it("rejeita período incoerente e subtotal diferente da série", () => {
    const invalidPeriod = contract();
    invalidPeriod.period.from = "2026-09-01T00:00:00.000Z";
    expect(() => parseAdminFinanceContract(invalidPeriod)).toThrow(
      /início instantâneo diverge/,
    );

    const invalidSubtotal = contract();
    invalidSubtotal.cash.currencies[0].positiveEntries.valueCents = 999;
    expect(() => parseAdminFinanceContract(invalidSubtotal)).toThrow(
      /subtotal não reconcilia/,
    );
  });

  it("limita séries e coleções do payload", () => {
    const oversized = contract();
    oversized.cash.currencies[0].series = Array.from(
      { length: 367 },
      (_, index) => ({
        day: `2026-09-${String((index % 30) + 1).padStart(2, "0")}`,
        positiveEntriesCents: 0,
        refundsCents: 0,
        feesCents: 0,
        calculableNetCents: 0,
      }),
    );
    expect(() => parseAdminFinanceContract(oversized)).toThrow(/incompatível/);
  });
});
