import {
  ADMIN_FINANCE_TIMEZONE,
  type AdminFinanceContract,
  type FinanceAvailability,
  type FinanceCountMetric,
  type FinanceMoneyMetric,
} from "../../shared/adminFinance";
import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import { getPlanPriceCents } from "../../shared/planPricing";
import { createError } from "../middleware/error";
import { coletarTudoProvandoTotal } from "./paginate";
import {
  classifyRegisteredPayments,
  type FinancePaymentRow,
} from "./registeredPayments";
import { supabaseAdmin } from "./supabaseAdmin";

export type HonestFinancePreset = "30d" | "90d" | "previous_month" | "custom";

export type HonestFinancePeriod = AdminFinanceContract["period"];

const DAY_MS = 24 * 60 * 60 * 1000;
const REVENUE_TYPES = new Set(["charge", "refund", "adjustment", "dispute"]);
const INTERVAL_MONTHS: Record<string, number> = {
  month: 1,
  monthly: 1,
  semiannual: 6,
  semiannually: 6,
  year: 12,
  annual: 12,
  yearly: 12,
};

function invalidPeriod(message: string): never {
  throw createError(400, "invalid_finance_period", message);
}

function validCivilDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  try {
    return somarDiaCivil(day, 0) === day;
  } catch {
    return false;
  }
}

/** Resolve apenas dias civis COMPLETOS de America/Sao_Paulo. */
export function resolveHonestFinancePeriod(
  query: Record<string, unknown>,
  now: Date = new Date(),
): HonestFinancePeriod {
  const today = diaBrasilia(now.toISOString());
  if (!today) invalidPeriod("Não foi possível determinar o dia atual.");
  const presetRaw = typeof query.preset === "string" ? query.preset : "30d";
  if (!["30d", "90d", "previous_month", "custom"].includes(presetRaw)) {
    invalidPeriod("Período financeiro inválido.");
  }
  const preset = presetRaw as HonestFinancePreset;
  let startDay: string;
  let endDayInclusive: string;

  if (preset === "custom") {
    const fromDay = typeof query.fromDay === "string" ? query.fromDay : "";
    const toDay = typeof query.toDay === "string" ? query.toDay : "";
    if (!validCivilDay(fromDay) || !validCivilDay(toDay)) {
      invalidPeriod(
        "Informe datas civis válidas para o período personalizado.",
      );
    }
    if (fromDay > toDay)
      invalidPeriod("A data inicial deve anteceder a final.");
    if (toDay >= today) {
      invalidPeriod("O painel financeiro aceita somente dias completos.");
    }
    const days = Math.floor(
      (Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) /
        DAY_MS,
    );
    if (days > 365) invalidPeriod("O período máximo é de 366 dias completos.");
    startDay = fromDay;
    endDayInclusive = toDay;
  } else if (preset === "previous_month") {
    const currentMonthStart = `${today.slice(0, 7)}-01`;
    endDayInclusive = somarDiaCivil(currentMonthStart, -1);
    startDay = `${endDayInclusive.slice(0, 7)}-01`;
  } else {
    const days = preset === "90d" ? 90 : 30;
    endDayInclusive = somarDiaCivil(today, -1);
    startDay = somarDiaCivil(today, -days);
  }

  return {
    preset,
    startDay,
    endDayInclusive,
    from: inicioDoDiaBrasilia(startDay),
    toExclusive: inicioDoDiaBrasilia(somarDiaCivil(endDayInclusive, 1)),
    timezone: ADMIN_FINANCE_TIMEZONE,
    basis: "complete_calendar_days",
  };
}

type RawFinanceRow = FinancePaymentRow & {
  id: string;
  provider: string | null;
  provider_transaction_id: string | null;
  stripe_balance_transaction_id: string | null;
  stripe_charge_id: string | null;
  type: string;
  gross_cents: number | string | null;
  fee_cents: number | string | null;
  net_cents: number | string | null;
  currency: string | null;
  occurred_at: string | null;
  created_at: string | null;
  user_id: string | null;
  plan_code: string | null;
};

type RawAccessRow = {
  id: string;
  user_id: string | null;
  provider: string | null;
  provider_subscription_id: string | null;
  status: string | null;
  renewal_type: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string | null;
  plans:
    | {
        code?: string | null;
        currency?: string | null;
        interval?: string | null;
      }
    | Array<{
        code?: string | null;
        currency?: string | null;
        interval?: string | null;
      }>
    | null;
};

type ExclusionReasons = AdminFinanceContract["cash"]["exclusionsByReason"];

function safeCents(value: number | string | null): number | null {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function validInstant(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function canonicalTransactionKey(row: RawFinanceRow): string | null {
  if (row.provider !== "stripe" && row.provider !== "asaas") return null;
  const id =
    (row.type === "charge" && row.provider === "stripe"
      ? nonEmpty(row.stripe_charge_id)
      : null) ??
    nonEmpty(row.provider_transaction_id) ??
    (row.provider === "stripe"
      ? nonEmpty(row.stripe_balance_transaction_id)
      : null);
  return id ? `${row.provider}:transaction:${id}` : null;
}

function latestInstant(values: Array<string | null>): string | null {
  const valid = values
    .map(validInstant)
    .filter((value): value is number => value !== null);
  return valid.length > 0 ? new Date(Math.max(...valid)).toISOString() : null;
}

function daysInPeriod(period: HonestFinancePeriod): string[] {
  const days: string[] = [];
  for (let day = period.startDay; day <= period.endDayInclusive; ) {
    days.push(day);
    day = somarDiaCivil(day, 1);
  }
  return days;
}

const CASH_LIMITATIONS = [
  "Cobertura histórica e reconciliação com Stripe e Asaas não são coletadas.",
  "A leitura paginada não possui snapshot transacional.",
  "Devoluções externas registradas em admin_refunds não existem neste ledger.",
  "Os valores são movimentos observados, não faturamento contábil nem receita total da empresa.",
];

function moneyMetric(input: {
  status: FinanceAvailability;
  valueCents: number | null;
  currency: string | null;
  sources: string[];
  coverage: string;
  freshness: string | null;
  limitations?: string[];
}): FinanceMoneyMetric {
  return { limitations: [], ...input };
}

function countMetric(input: {
  status: FinanceAvailability;
  value: number | null;
  sources: string[];
  coverage: string;
  freshness: string | null;
  limitations?: string[];
}): FinanceCountMetric {
  return { limitations: [], ...input };
}

type CashCandidate = {
  key: string;
  rowId: string;
  provider: "stripe" | "asaas";
  type: "charge" | "refund" | "adjustment" | "dispute";
  grossCents: number;
  feeCents: number;
  netCents: number;
  currency: string;
  occurredAt: string;
  occurredMs: number;
  userId: string | null;
};

export function analyzeRegisteredCash(input: {
  rows: RawFinanceRow[];
  period: HonestFinancePeriod;
}): AdminFinanceContract["cash"] {
  const exclusions: ExclusionReasons = {
    unsupportedType: 0,
    unsupportedProvider: 0,
    missingIdentity: 0,
    invalidAmount: 0,
    invalidCurrency: 0,
    invalidInstant: 0,
    outsidePeriod: 0,
    economicConflict: 0,
  };
  const fromMs = Date.parse(input.period.from);
  const toMs = Date.parse(input.period.toExclusive);
  const registered = classifyRegisteredPayments({
    rows: input.rows,
    cutoff: input.period.toExclusive,
  });
  const registeredInWindow = registered.payments.filter((payment) => {
    const instant = Date.parse(payment.occurredAt);
    return instant >= fromMs && instant < toMs;
  });
  const groups = new Map<string, CashCandidate[]>();

  for (const row of input.rows) {
    if (row.provider !== "stripe" && row.provider !== "asaas") {
      exclusions.unsupportedProvider += 1;
      continue;
    }
    if (!row.type || !REVENUE_TYPES.has(row.type)) {
      exclusions.unsupportedType += 1;
      continue;
    }
    const key = canonicalTransactionKey(row);
    if (!key) {
      exclusions.missingIdentity += 1;
      continue;
    }
    const grossCents = safeCents(row.gross_cents);
    const feeCents = safeCents(row.fee_cents);
    const netCents = safeCents(row.net_cents);
    if (grossCents === null || feeCents === null || netCents === null) {
      exclusions.invalidAmount += 1;
      continue;
    }
    const currency = nonEmpty(row.currency)?.toUpperCase() ?? "";
    if (!/^[A-Z]{3}$/.test(currency)) {
      exclusions.invalidCurrency += 1;
      continue;
    }
    const occurredMs = validInstant(row.occurred_at);
    if (occurredMs === null) {
      exclusions.invalidInstant += 1;
      continue;
    }
    if (occurredMs < fromMs || occurredMs >= toMs) {
      exclusions.outsidePeriod += 1;
      continue;
    }
    const type = row.type as CashCandidate["type"];
    if (
      (type === "charge" && grossCents <= 0) ||
      ((type === "refund" || type === "dispute") && grossCents >= 0)
    ) {
      exclusions.invalidAmount += 1;
      continue;
    }
    const candidate: CashCandidate = {
      key,
      rowId: row.id,
      provider: row.provider,
      type,
      grossCents,
      feeCents,
      netCents,
      currency,
      occurredAt: new Date(occurredMs).toISOString(),
      occurredMs,
      userId: nonEmpty(row.user_id),
    };
    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  const usable: CashCandidate[] = [];
  let duplicateRowsIgnored = 0;
  let conflictingIdentities = 0;
  for (const group of Array.from(groups.values())) {
    duplicateRowsIgnored += group.length - 1;
    const fingerprints = new Set(
      group.map((row) =>
        JSON.stringify([
          row.type,
          row.grossCents,
          row.feeCents,
          row.netCents,
          row.currency,
          row.occurredAt,
        ]),
      ),
    );
    if (fingerprints.size !== 1) {
      conflictingIdentities += 1;
      exclusions.economicConflict += group.length;
      continue;
    }
    const knownUsers = new Set(
      group.map((row) => row.userId).filter((id): id is string => Boolean(id)),
    );
    group.sort((a, b) => a.rowId.localeCompare(b.rowId));
    usable.push({
      ...group[0],
      userId: knownUsers.size === 1 ? Array.from(knownUsers)[0] : null,
    });
  }

  const days = daysInPeriod(input.period);
  type Bucket = {
    positive: number;
    refunds: number;
    fees: number;
    net: number;
    payments: number;
    people: Set<string>;
    withoutPerson: number;
    daily: Map<
      string,
      {
        positiveEntriesCents: number;
        refundsCents: number;
        feesCents: number;
        calculableNetCents: number;
      }
    >;
  };
  const buckets = new Map<string, Bucket>();
  for (const row of usable) {
    const bucket = buckets.get(row.currency) ?? {
      positive: 0,
      refunds: 0,
      fees: 0,
      net: 0,
      payments: 0,
      people: new Set<string>(),
      withoutPerson: 0,
      daily: new Map(),
    };
    const day = diaBrasilia(row.occurredAt);
    if (!day) {
      exclusions.invalidInstant += 1;
      continue;
    }
    const daily = bucket.daily.get(day) ?? {
      positiveEntriesCents: 0,
      refundsCents: 0,
      feesCents: 0,
      calculableNetCents: 0,
    };
    if (row.type === "charge") {
      bucket.positive += row.grossCents;
      bucket.payments += 1;
      daily.positiveEntriesCents += row.grossCents;
      if (row.userId) bucket.people.add(row.userId);
    }
    if (row.type === "refund") {
      bucket.refunds += Math.abs(row.grossCents);
      daily.refundsCents += Math.abs(row.grossCents);
    }
    bucket.fees += row.feeCents;
    bucket.net += row.netCents;
    daily.feesCents += row.feeCents;
    daily.calculableNetCents += row.netCents;
    if (!row.userId) bucket.withoutPerson += 1;
    bucket.daily.set(day, daily);
    buckets.set(row.currency, bucket);
  }

  const freshness = latestInstant(input.rows.map((row) => row.created_at));
  const status: FinanceAvailability = "partial";
  const coverage =
    "Paginação local conferida por contagem exata; cobertura externa não coletada.";
  const source = ["finance_transactions"];
  const currencies = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, bucket]) => ({
      currency,
      positiveEntries: moneyMetric({
        status: "partial",
        valueCents: bucket.positive,
        currency,
        sources: source,
        coverage,
        freshness,
        limitations: CASH_LIMITATIONS,
      }),
      refunds: moneyMetric({
        status: "partial",
        valueCents: bucket.refunds,
        currency,
        sources: source,
        coverage,
        freshness,
        limitations: CASH_LIMITATIONS,
      }),
      fees: moneyMetric({
        status: "partial",
        valueCents: bucket.fees,
        currency,
        sources: source,
        coverage,
        freshness,
        limitations: CASH_LIMITATIONS,
      }),
      calculableNet: moneyMetric({
        status: "partial",
        valueCents: bucket.net,
        currency,
        sources: source,
        coverage,
        freshness,
        limitations: CASH_LIMITATIONS,
      }),
      payments: countMetric({
        status: "partial",
        value: bucket.payments,
        sources: source,
        coverage,
        freshness,
      }),
      identifiedPeople: countMetric({
        status: "partial",
        value: bucket.people.size,
        sources: source,
        coverage,
        freshness,
        limitations: ["Pessoa é deduplicada apenas pelo user_id persistido."],
      }),
      transactionsWithoutPerson: countMetric({
        status: "partial",
        value: bucket.withoutPerson,
        sources: source,
        coverage,
        freshness,
      }),
      series: days.map((day) => ({
        day,
        positiveEntriesCents: bucket.daily.get(day)?.positiveEntriesCents ?? 0,
        refundsCents: bucket.daily.get(day)?.refundsCents ?? 0,
        feesCents: bucket.daily.get(day)?.feesCents ?? 0,
        calculableNetCents: bucket.daily.get(day)?.calculableNetCents ?? 0,
      })),
    }));

  const invalidRows = Object.values(exclusions).reduce(
    (sum, value) => sum + value,
    0,
  );
  const diagnosticStatus: FinanceAvailability = "partial";
  const paymentPeople = new Set(
    registeredInWindow
      .map((payment) => payment.userId)
      .filter((id): id is string => Boolean(id)),
  );
  return {
    status,
    source: "finance_transactions",
    coverage: {
      localRowsRead: input.rows.length,
      canonicalTransactions: usable.length,
      duplicateRowsIgnored,
      paymentIdentitiesFromAdm001: registeredInWindow.length,
      reconciledWithProviders: false,
      transactionalSnapshot: false,
      externalCoverage: "not_collected",
    },
    freshness,
    currencies,
    registeredPayments: countMetric({
      status: "partial",
      value: registeredInWindow.length,
      sources: source,
      coverage,
      freshness,
      limitations: [
        "Mesma identidade e elegibilidade da ADM-001; não depende de fee, net ou moeda para contar a cobrança.",
      ],
    }),
    registeredPaymentPeople: countMetric({
      status: "partial",
      value: paymentPeople.size,
      sources: source,
      coverage,
      freshness,
    }),
    registeredPaymentsWithoutPerson: countMetric({
      status: "partial",
      value: registeredInWindow.filter((payment) => !payment.userId).length,
      sources: source,
      coverage,
      freshness,
    }),
    excludedTransactions: countMetric({
      status: diagnosticStatus,
      value: invalidRows,
      sources: source,
      coverage,
      freshness,
    }),
    conflictingIdentities: countMetric({
      status: diagnosticStatus,
      value: conflictingIdentities,
      sources: source,
      coverage,
      freshness,
    }),
    exclusionsByReason: exclusions,
    limitations: CASH_LIMITATIONS,
  };
}

const ACCESS_LIMITATIONS = [
  "subscriptions representa o estado operacional atual, não histórico contratual.",
  "A leitura paginada não possui snapshot transacional.",
  "Contagens representam pessoas com um acesso atual não conflitante; não são clientes pagantes históricos.",
  "Valores usam o preço vigente de catálogo e não o preço contratado ou recebido.",
];

function unwrapPlan(row: RawAccessRow): {
  code?: string | null;
  currency?: string | null;
  interval?: string | null;
} {
  return Array.isArray(row.plans) ? (row.plans[0] ?? {}) : (row.plans ?? {});
}

export function analyzeCurrentAccesses(input: {
  rows: RawAccessRow[];
  computedAt: string;
}): AdminFinanceContract["accesses"] {
  const computedMs = Date.parse(input.computedAt);
  if (!Number.isFinite(computedMs)) {
    throw new Error("analyzeCurrentAccesses: computedAt inválido");
  }
  let automatic = 0;
  let manual = 0;
  let trialing = 0;
  let unclassified = 0;
  let conflictingPeople = 0;
  let scheduledCancellation = 0;
  let catalogValueExclusions = 0;
  const catalog = new Map<string, { automatic: number; manual: number }>();
  const currentRows = input.rows.filter((row) => {
    const endMs = validInstant(row.current_period_end);
    return endMs === null || endMs > computedMs;
  });
  const byPerson = new Map<string, RawAccessRow[]>();
  for (const row of currentRows) {
    const key = nonEmpty(row.user_id) ?? `row:${row.id}`;
    const group = byPerson.get(key) ?? [];
    group.push(row);
    byPerson.set(key, group);
  }

  for (const group of Array.from(byPerson.values())) {
    if (group.length > 1) {
      conflictingPeople += 1;
      catalogValueExclusions += group.length;
      continue;
    }
    const row = group[0];
    if (
      row.current_period_end !== null &&
      validInstant(row.current_period_end) === null
    ) {
      unclassified += 1;
      catalogValueExclusions += 1;
      continue;
    }
    if (row.status === "trialing") {
      trialing += 1;
      continue;
    }
    if (row.status !== "active") {
      unclassified += 1;
      continue;
    }
    const modality =
      row.renewal_type === "auto"
        ? "automatic"
        : row.renewal_type === "manual"
          ? "manual"
          : null;
    if (modality === "automatic") automatic += 1;
    else if (modality === "manual") manual += 1;
    else {
      unclassified += 1;
      continue;
    }
    if (row.cancel_at_period_end === true) scheduledCancellation += 1;

    const plan = unwrapPlan(row);
    const price = plan.code ? getPlanPriceCents(plan.code) : null;
    const months = plan.interval ? INTERVAL_MONTHS[plan.interval] : undefined;
    const currency = nonEmpty(plan.currency)?.toUpperCase() ?? "";
    if (
      price === null ||
      !months ||
      currency !== "BRL" ||
      !Number.isSafeInteger(price) ||
      price % months !== 0
    ) {
      catalogValueExclusions += 1;
      continue;
    }
    const bucket = catalog.get(currency) ?? { automatic: 0, manual: 0 };
    bucket[modality] += price / months;
    catalog.set(currency, bucket);
  }

  const freshness = latestInstant(input.rows.map((row) => row.updated_at));
  const coverage =
    "Estado local atual lido com paginação e contagem exata; sem histórico contratual.";
  const sources = ["subscriptions"];
  const catalogSources = ["subscriptions", "shared/planPricing.ts"];
  const count = (value: number, limitations: string[] = []) =>
    countMetric({
      status: "partial",
      value,
      sources,
      coverage,
      freshness,
      limitations,
    });
  return {
    status: "partial",
    source: "subscriptions",
    coverage: {
      localRowsRead: input.rows.length,
      transactionalSnapshot: false,
      historicalContractCoverage: "unavailable",
      peopleWithConflictingAccesses: conflictingPeople,
    },
    freshness,
    automaticActive: count(automatic, [
      "Ativo automático é estado de acesso, não prova de obrigação ou pagamento.",
    ]),
    manualPrepaidActive: count(manual, [
      "Acesso manual é pré-pago e não integra receita recorrente.",
    ]),
    trialing: count(trialing, ["Trial não é cliente pagante."]),
    unclassified: count(unclassified),
    conflictingPeople: count(conflictingPeople, [
      "Mais de uma subscription atual para a mesma pessoa não possui precedência canônica comprovada; todas ficam fora das contagens e do catálogo.",
    ]),
    scheduledCancellation: count(scheduledCancellation, [
      "Continua sendo acesso atual até current_period_end; não prova renovação futura.",
    ]),
    catalogMonthlyValues: Array.from(catalog.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, values]) => ({
        currency,
        automaticActive: moneyMetric({
          status: "partial",
          valueCents: values.automatic,
          currency,
          sources: catalogSources,
          coverage,
          freshness,
          limitations: ACCESS_LIMITATIONS,
        }),
        manualPrepaidActive: moneyMetric({
          status: "partial",
          valueCents: values.manual,
          currency,
          sources: catalogSources,
          coverage,
          freshness,
          limitations: ACCESS_LIMITATIONS,
        }),
      })),
    catalogValueExclusions: count(catalogValueExclusions),
    limitations: ACCESS_LIMITATIONS,
  };
}

async function loadFinanceRows(
  period: HonestFinancePeriod,
): Promise<RawFinanceRow[]> {
  return coletarTudoProvandoTotal<RawFinanceRow>(
    (from, to) =>
      supabaseAdmin
        .from("finance_transactions")
        .select(
          "id, provider, provider_transaction_id, stripe_balance_transaction_id, stripe_charge_id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, created_at, user_id, plan_code",
          { count: "exact" },
        )
        .gte("occurred_at", period.from)
        .lt("occurred_at", period.toExclusive)
        .order("occurred_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    { op: "admin_finance_honest_transactions", rowKey: (row) => row.id },
  );
}

async function loadAccessRows(computedAt: string): Promise<RawAccessRow[]> {
  return coletarTudoProvandoTotal<RawAccessRow>(
    (from, to) =>
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id, user_id, provider, provider_subscription_id, status, renewal_type, current_period_end, cancel_at_period_end, updated_at, plans(code, currency, interval)",
          { count: "exact" },
        )
        .in("status", ["active", "trialing"])
        .or(`current_period_end.is.null,current_period_end.gt.${computedAt}`)
        .order("id", { ascending: true })
        .range(from, to),
    { op: "admin_finance_honest_accesses", rowKey: (row) => row.id },
  );
}

export async function getHonestFinanceDashboard(input: {
  period: HonestFinancePeriod;
  now?: Date;
}): Promise<AdminFinanceContract> {
  const computedAt = (input.now ?? new Date()).toISOString();
  const [financeRows, accessRows] = await Promise.all([
    loadFinanceRows(input.period),
    loadAccessRows(computedAt),
  ]);
  const cash = analyzeRegisteredCash({
    rows: financeRows,
    period: input.period,
  });
  const accesses = analyzeCurrentAccesses({ rows: accessRows, computedAt });
  return {
    contractVersion: 1,
    status: "partial",
    computedAt,
    period: input.period,
    cash,
    accesses,
    unavailableIndicators: [
      {
        names: [
          "MRR contratual",
          "ARR",
          "New MRR",
          "Expansion MRR",
          "Contraction MRR",
          "Reactivation MRR",
          "Churned MRR",
          "NRR",
          "churn de receita",
          "logo churn",
          "LTV",
        ],
        status: "unavailable",
        value: null,
        sources: ["subscriptions", "finance_transactions"],
        coverage:
          "Os fatos locais atuais não preservam obrigação e ciclos contratuais por instante.",
        freshness: accesses.freshness,
        limitations: [
          "Preço de catálogo não substitui valor contratado.",
          "Estado atual de acesso não reconstrói retenção histórica.",
        ],
        requiredFacts: [
          "obrigações contratuais imutáveis",
          "valor e moeda contratados por ciclo",
          "timeline de início, mudança, pausa, cancelamento e reativação",
        ],
      },
    ],
  };
}
