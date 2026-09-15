import {
  canonicalPaymentKey,
  classifyRegisteredPayments,
  type FinancePaymentRow,
  type PaymentMethodEvidence,
} from "./registeredPayments";

export type MethodFinanceRow = FinancePaymentRow & {
  currency: string | null;
  fee_cents: number | string | null;
  net_cents: number | string | null;
};

export type PaymentMethodFilter = "pix" | "card" | "boleto" | "unknown";

/** Seleciona o conjunto comprovado antes de paginar, preservando total global. */
export function pageMethodTransactions<
  T extends {
    id: string;
    type: string;
    currency: string | null;
    occurred_at: string | null;
  },
>(input: {
  rows: T[];
  matchingIds: Set<string>;
  currency: string;
  type: string;
  page: number;
  pageSize: number;
}) {
  const filtered = input.rows
    .filter(
      (row) =>
        input.matchingIds.has(row.id) &&
        (!input.currency || row.currency?.toUpperCase() === input.currency) &&
        (!input.type || row.type === input.type),
    )
    .sort(
      (a, b) =>
        Date.parse(b.occurred_at ?? "") - Date.parse(a.occurred_at ?? "") ||
        b.id.localeCompare(a.id),
    );
  const start = (input.page - 1) * input.pageSize;
  return {
    rows: filtered.slice(start, start + input.pageSize),
    total: filtered.length,
    page: input.page,
    pageSize: input.pageSize,
  };
}

const METHOD_LABEL: Record<PaymentMethodFilter, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  unknown: "Não identificado",
};

function safeCents(value: number | string | null): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isSafeInteger(parsed)
    ? parsed
    : null;
}

/** Usa a identidade e a evidência de meio canônicas da ADM-001. */
export function analyzePaymentMethods(input: {
  rows: MethodFinanceRow[];
  evidence: PaymentMethodEvidence[];
  cutoff: string;
}) {
  const rowsByPayment = new Map<string, MethodFinanceRow[]>();
  for (const row of input.rows) {
    if (row.type !== "charge") continue;
    const key = canonicalPaymentKey(row);
    if (!key) continue;
    const group = rowsByPayment.get(key) ?? [];
    group.push(row);
    rowsByPayment.set(key, group);
  }
  const registered = classifyRegisteredPayments({
    rows: input.rows,
    methodEvidence: input.evidence.filter(
      (row) =>
        row.provider === "asaas" &&
        Boolean(row.provider_subscription_id?.trim()) &&
        rowsByPayment.has(
          `asaas:payment:${row.provider_subscription_id?.trim()}`,
        ),
    ),
    cutoff: input.cutoff,
  });

  const buckets = new Map<
    string,
    {
      currency: string;
      payments: number;
      people: Set<string>;
      grossCents: number;
      withoutPerson: number;
    }
  >();
  const rowIdsByMethod: Record<PaymentMethodFilter, Set<string>> = {
    pix: new Set(),
    card: new Set(),
    boleto: new Set(),
    unknown: new Set(),
  };
  let withoutMethod = 0;
  let excludedEconomicOrCurrency = 0;
  for (const payment of registered.payments) {
    const sourceRows = rowsByPayment.get(payment.paymentKey) ?? [];
    const currencies = new Set(
      sourceRows.map((row) => row.currency?.trim().toUpperCase() ?? ""),
    );
    const fingerprints = new Set(
      sourceRows.map((row) =>
        JSON.stringify([
          safeCents(row.gross_cents),
          safeCents(row.fee_cents),
          safeCents(row.net_cents),
          Date.parse(row.occurred_at ?? ""),
        ]),
      ),
    );
    const currency = Array.from(currencies)[0];
    if (
      currencies.size !== 1 ||
      !/^[A-Z]{3}$/.test(currency) ||
      fingerprints.size !== 1 ||
      sourceRows.some(
        (row) =>
          safeCents(row.gross_cents) !== payment.grossCents ||
          safeCents(row.fee_cents) === null ||
          safeCents(row.net_cents) === null,
      )
    ) {
      excludedEconomicOrCurrency += 1;
      continue;
    }
    const method = (Object.keys(METHOD_LABEL) as PaymentMethodFilter[]).find(
      (key) => METHOD_LABEL[key] === payment.method,
    )!;
    if (method === "unknown") withoutMethod += 1;
    for (const row of sourceRows) rowIdsByMethod[method].add(row.id);
    if (method !== "pix") continue;
    const bucket = buckets.get(currency) ?? {
      currency,
      payments: 0,
      people: new Set<string>(),
      grossCents: 0,
      withoutPerson: 0,
    };
    bucket.payments += 1;
    bucket.grossCents += payment.grossCents;
    if (!Number.isSafeInteger(bucket.grossCents)) {
      throw new Error(
        "Pix: soma monetária fora do intervalo seguro de centavos",
      );
    }
    if (payment.userId) bucket.people.add(payment.userId);
    else bucket.withoutPerson += 1;
    buckets.set(currency, bucket);
  }

  return {
    status:
      input.rows.length === 0
        ? ("not_collected" as const)
        : ("partial" as const),
    pix: Array.from(buckets.values())
      .sort((a, b) =>
        a.currency === "BRL"
          ? -1
          : b.currency === "BRL"
            ? 1
            : a.currency.localeCompare(b.currency),
      )
      .map((bucket) => ({
        currency: bucket.currency,
        payments: bucket.payments,
        people: bucket.people.size,
        grossCents: bucket.grossCents,
        withoutPerson: bucket.withoutPerson,
      })),
    paymentsWithoutMethod: withoutMethod,
    methodConflicts: registered.coverage.meiosPersistidosConflitantes,
    excludedEconomicOrCurrency,
    coverage: {
      localRowsRead: input.rows.length,
      observedPayments: registered.payments.length,
      duplicateRowsIgnored: registered.coverage.registrosDuplicados,
      historicalCompleteness: "not_verifiable" as const,
      transactionalSnapshot: false as const,
    },
    rowIdsByMethod,
  };
}
