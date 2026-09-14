import { z } from "zod";
import { inicioDoDiaBrasilia, somarDiaCivil } from "./brasiliaDay";

export const ADMIN_FINANCE_CONTRACT_VERSION = 1 as const;
export const ADMIN_FINANCE_TIMEZONE = "America/Sao_Paulo" as const;

export const FinanceAvailabilitySchema = z.enum([
  "available",
  "partial",
  "unavailable",
  "not_collected",
]);
export type FinanceAvailability = z.infer<typeof FinanceAvailabilitySchema>;

const instantSchema = z
  .string()
  .max(40)
  .refine((value) => Number.isFinite(Date.parse(value)), "instante inválido");
const daySchema = z
  .string()
  .max(10)
  .regex(/^\d{4}-\d{2}-\d{2}$/);
const currencySchema = z.string().regex(/^[A-Z]{3}$/);
const safeIntegerSchema = z.number().int().safe();
const nonNegativeIntegerSchema = safeIntegerSchema.nonnegative();

export const FinancePeriodSchema = z
  .object({
    preset: z.enum(["30d", "90d", "previous_month", "custom"]),
    startDay: daySchema,
    endDayInclusive: daySchema,
    from: instantSchema,
    toExclusive: instantSchema,
    timezone: z.literal(ADMIN_FINANCE_TIMEZONE),
    basis: z.literal("complete_calendar_days"),
  })
  .strict()
  .superRefine((period, ctx) => {
    if (Date.parse(period.from) >= Date.parse(period.toExclusive)) {
      ctx.addIssue({
        code: "custom",
        message: "período vazio ou invertido",
        path: ["toExclusive"],
      });
    }
    if (period.startDay > period.endDayInclusive) {
      ctx.addIssue({
        code: "custom",
        message: "dias civis invertidos",
        path: ["endDayInclusive"],
      });
    }
    try {
      if (period.from !== inicioDoDiaBrasilia(period.startDay)) {
        ctx.addIssue({
          code: "custom",
          message: "início instantâneo diverge do dia civil",
          path: ["from"],
        });
      }
      if (
        period.toExclusive !==
        inicioDoDiaBrasilia(somarDiaCivil(period.endDayInclusive, 1))
      ) {
        ctx.addIssue({
          code: "custom",
          message: "fim exclusivo diverge do dia civil",
          path: ["toExclusive"],
        });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "período civil inválido" });
    }
  });

const metricBase = {
  status: FinanceAvailabilitySchema,
  sources: z.array(z.string().min(1).max(80)).min(1).max(8),
  coverage: z.string().min(1).max(500),
  freshness: instantSchema.nullable(),
  limitations: z.array(z.string().min(1).max(500)).max(24),
};

export const FinanceMoneyMetricSchema = z
  .object({
    ...metricBase,
    valueCents: safeIntegerSchema.nullable(),
    currency: currencySchema.nullable(),
  })
  .strict()
  .superRefine((metric, ctx) => {
    const hasValue = metric.valueCents !== null;
    const hasCurrency = metric.currency !== null;
    if (hasValue !== hasCurrency) {
      ctx.addIssue({
        code: "custom",
        message: "valor e moeda devem estar presentes juntos",
      });
    }
    if (
      (metric.status === "unavailable" || metric.status === "not_collected") &&
      hasValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "métrica indisponível não pode carregar zero ou valor",
        path: ["valueCents"],
      });
    }
    if (
      (metric.status === "available" || metric.status === "partial") &&
      !hasValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "métrica disponível precisa de valor finito",
        path: ["valueCents"],
      });
    }
  });

export const FinanceCountMetricSchema = z
  .object({
    ...metricBase,
    value: nonNegativeIntegerSchema.nullable(),
  })
  .strict()
  .superRefine((metric, ctx) => {
    const hasValue = metric.value !== null;
    if (
      (metric.status === "unavailable" || metric.status === "not_collected") &&
      hasValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "métrica indisponível não pode carregar zero ou valor",
        path: ["value"],
      });
    }
    if (
      (metric.status === "available" || metric.status === "partial") &&
      !hasValue
    ) {
      ctx.addIssue({
        code: "custom",
        message: "métrica disponível precisa de valor finito",
        path: ["value"],
      });
    }
  });

export type FinanceMoneyMetric = z.infer<typeof FinanceMoneyMetricSchema>;
export type FinanceCountMetric = z.infer<typeof FinanceCountMetricSchema>;

const CashSeriesPointSchema = z
  .object({
    day: daySchema,
    positiveEntriesCents: safeIntegerSchema,
    refundsCents: safeIntegerSchema,
    feesCents: safeIntegerSchema,
    calculableNetCents: safeIntegerSchema,
  })
  .strict();

const CashCurrencySchema = z
  .object({
    currency: currencySchema,
    positiveEntries: FinanceMoneyMetricSchema,
    refunds: FinanceMoneyMetricSchema,
    fees: FinanceMoneyMetricSchema,
    calculableNet: FinanceMoneyMetricSchema,
    payments: FinanceCountMetricSchema,
    identifiedPeople: FinanceCountMetricSchema,
    transactionsWithoutPerson: FinanceCountMetricSchema,
    series: z.array(CashSeriesPointSchema).max(366),
  })
  .strict()
  .superRefine((bucket, ctx) => {
    for (const [name, metric] of Object.entries({
      positiveEntries: bucket.positiveEntries,
      refunds: bucket.refunds,
      fees: bucket.fees,
      calculableNet: bucket.calculableNet,
    })) {
      if (metric.currency !== bucket.currency) {
        ctx.addIssue({
          code: "custom",
          message: "moeda da métrica diverge do agrupamento",
          path: [name, "currency"],
        });
      }
    }
    const days = bucket.series.map((point) => point.day);
    if (new Set(days).size !== days.length) {
      ctx.addIssue({
        code: "custom",
        message: "série contém dias repetidos",
        path: ["series"],
      });
    }
    if (days.some((day, index) => index > 0 && day <= days[index - 1])) {
      ctx.addIssue({
        code: "custom",
        message: "série está desalinhada ou fora de ordem",
        path: ["series"],
      });
    }
  });

const ExclusionReasonsSchema = z
  .object({
    unsupportedType: nonNegativeIntegerSchema,
    unsupportedProvider: nonNegativeIntegerSchema,
    missingIdentity: nonNegativeIntegerSchema,
    invalidAmount: nonNegativeIntegerSchema,
    invalidCurrency: nonNegativeIntegerSchema,
    invalidInstant: nonNegativeIntegerSchema,
    outsidePeriod: nonNegativeIntegerSchema,
    economicConflict: nonNegativeIntegerSchema,
  })
  .strict();

const CashSchema = z
  .object({
    status: FinanceAvailabilitySchema,
    source: z.literal("finance_transactions"),
    coverage: z
      .object({
        localRowsRead: nonNegativeIntegerSchema,
        canonicalTransactions: nonNegativeIntegerSchema,
        duplicateRowsIgnored: nonNegativeIntegerSchema,
        paymentIdentitiesFromAdm001: nonNegativeIntegerSchema,
        reconciledWithProviders: z.literal(false),
        transactionalSnapshot: z.literal(false),
        externalCoverage: z.literal("not_collected"),
      })
      .strict(),
    freshness: instantSchema.nullable(),
    currencies: z.array(CashCurrencySchema).max(32),
    registeredPayments: FinanceCountMetricSchema,
    registeredPaymentPeople: FinanceCountMetricSchema,
    registeredPaymentsWithoutPerson: FinanceCountMetricSchema,
    excludedTransactions: FinanceCountMetricSchema,
    conflictingIdentities: FinanceCountMetricSchema,
    exclusionsByReason: ExclusionReasonsSchema,
    limitations: z.array(z.string().min(1).max(500)).min(1).max(24),
  })
  .strict();

const AccessCatalogBucketSchema = z
  .object({
    currency: currencySchema,
    automaticActive: FinanceMoneyMetricSchema,
    manualPrepaidActive: FinanceMoneyMetricSchema,
  })
  .strict();

const AccessSchema = z
  .object({
    status: FinanceAvailabilitySchema,
    source: z.literal("subscriptions"),
    coverage: z
      .object({
        localRowsRead: nonNegativeIntegerSchema,
        transactionalSnapshot: z.literal(false),
        historicalContractCoverage: z.literal("unavailable"),
        peopleWithConflictingAccesses: nonNegativeIntegerSchema,
      })
      .strict(),
    freshness: instantSchema.nullable(),
    automaticActive: FinanceCountMetricSchema,
    manualPrepaidActive: FinanceCountMetricSchema,
    trialing: FinanceCountMetricSchema,
    unclassified: FinanceCountMetricSchema,
    conflictingPeople: FinanceCountMetricSchema,
    scheduledCancellation: FinanceCountMetricSchema,
    catalogMonthlyValues: z.array(AccessCatalogBucketSchema).max(32),
    catalogValueExclusions: FinanceCountMetricSchema,
    limitations: z.array(z.string().min(1).max(500)).min(1).max(24),
  })
  .strict();

const UnavailableIndicatorSchema = z
  .object({
    names: z.array(z.string().min(1).max(100)).min(1).max(32),
    status: z.literal("unavailable"),
    value: z.null(),
    sources: z.array(z.string().min(1).max(80)).min(1).max(8),
    coverage: z.string().min(1).max(500),
    freshness: instantSchema.nullable(),
    limitations: z.array(z.string().min(1).max(500)).min(1).max(24),
    requiredFacts: z.array(z.string().min(1).max(500)).min(1).max(24),
  })
  .strict();

export const AdminFinanceContractSchema = z
  .object({
    contractVersion: z.literal(ADMIN_FINANCE_CONTRACT_VERSION),
    status: FinanceAvailabilitySchema,
    computedAt: instantSchema,
    period: FinancePeriodSchema,
    cash: CashSchema,
    accesses: AccessSchema,
    unavailableIndicators: z.array(UnavailableIndicatorSchema).min(1).max(8),
  })
  .strict()
  .superRefine((contract, ctx) => {
    const currencies = contract.cash.currencies.map((item) => item.currency);
    if (new Set(currencies).size !== currencies.length) {
      ctx.addIssue({
        code: "custom",
        message: "moedas repetidas seriam somadas implicitamente",
        path: ["cash", "currencies"],
      });
    }
    const referenceDays = contract.cash.currencies[0]?.series.map(
      (point) => point.day,
    );
    contract.cash.currencies.forEach((bucket, index) => {
      if (
        referenceDays &&
        bucket.series.some(
          (point, pointIndex) => point.day !== referenceDays[pointIndex],
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: "séries de moedas diferentes estão desalinhadas",
          path: ["cash", "currencies", index, "series"],
        });
      }
      if (referenceDays && bucket.series.length !== referenceDays.length) {
        ctx.addIssue({
          code: "custom",
          message: "séries de moedas diferentes têm tamanhos distintos",
          path: ["cash", "currencies", index, "series"],
        });
      }
      const expectedDays: string[] = [];
      for (
        let day = contract.period.startDay;
        day <= contract.period.endDayInclusive;
        day = somarDiaCivil(day, 1)
      ) {
        expectedDays.push(day);
      }
      if (
        bucket.series.length !== expectedDays.length ||
        bucket.series.some(
          (point, pointIndex) => point.day !== expectedDays[pointIndex],
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: "série não cobre exatamente o período",
          path: ["cash", "currencies", index, "series"],
        });
      }
      const reconciliations = [
        ["positiveEntries", "positiveEntriesCents"],
        ["refunds", "refundsCents"],
        ["fees", "feesCents"],
        ["calculableNet", "calculableNetCents"],
      ] as const;
      for (const [metricName, seriesName] of reconciliations) {
        const sum = bucket.series.reduce(
          (total, point) => total + point[seriesName],
          0,
        );
        if (
          !Number.isSafeInteger(sum) ||
          bucket[metricName].valueCents !== sum
        ) {
          ctx.addIssue({
            code: "custom",
            message: "subtotal não reconcilia com a série",
            path: ["cash", "currencies", index, metricName],
          });
        }
      }
    });
  });

export type AdminFinanceContract = z.infer<typeof AdminFinanceContractSchema>;

export function parseAdminFinanceContract(
  value: unknown,
): AdminFinanceContract {
  const parsed = AdminFinanceContractSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Contrato financeiro v${ADMIN_FINANCE_CONTRACT_VERSION} incompatível: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}
