import { z } from "zod";

const quantity = z.number().int().safe().nonnegative();
const PixCurrencyBucketSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    payments: quantity,
    people: quantity,
    grossCents: quantity,
    withoutPerson: quantity,
  })
  .strict()
  .superRefine((bucket, ctx) => {
    if (
      bucket.people > bucket.payments ||
      bucket.withoutPerson > bucket.payments
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "contagem de pessoas ou pagamentos sem pessoa excede pagamentos",
      });
    }
  });

export const PaymentMethodSummarySchema = z
  .object({
    status: z.enum(["partial", "not_collected"]),
    pix: z.array(PixCurrencyBucketSchema).max(32),
    paymentsWithoutMethod: quantity,
    methodConflicts: quantity,
    excludedEconomicOrCurrency: quantity,
    coverage: z
      .object({
        localRowsRead: quantity,
        observedPayments: quantity,
        duplicateRowsIgnored: quantity,
        historicalCompleteness: z.literal("not_verifiable"),
        transactionalSnapshot: z.literal(false),
      })
      .strict(),
  })
  .strict()
  .superRefine((summary, ctx) => {
    const currencies = summary.pix.map((bucket) => bucket.currency);
    if (new Set(currencies).size !== currencies.length) {
      ctx.addIssue({
        code: "custom",
        message: "moedas Pix repetidas",
        path: ["pix"],
      });
    }
    if (
      summary.status === "not_collected" &&
      (summary.coverage.localRowsRead !== 0 || summary.pix.length !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "histórico não coletado não pode conter valores Pix",
      });
    }
  });

export type PaymentMethodSummary = z.infer<typeof PaymentMethodSummarySchema>;
