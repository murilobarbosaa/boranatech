export const ADMIN_ATTENTION_CONTRACT_VERSION = 3 as const;

export const ATTENTION_KINDS = [
  "subscription_local_past_due",
  "subscription_scheduled_exit",
  "orphan_payment_open",
  "ai_cost_spike",
  "previous_month_without_expense",
  "influencer_active_access",
  "influencer_trial_access",
  "manual_subscription_ending",
] as const;

export type AttentionKind = (typeof ATTENTION_KINDS)[number];
export type AttentionSeverity = "critical" | "attention";
export type AttentionSourceStatus =
  | "available"
  | "partial"
  | "unavailable"
  | "not_collected";
export type AttentionSection = "usuarios" | "financeiro" | "ia";

export const ATTENTION_SOURCE_IDS = [
  "failed_charges_reconciled",
  "failed_payouts_reconciled",
  "subscriptions",
  "cancellation_reasons",
  "billing_orphan_payments",
  "ai_usage_logs",
  "expenses",
  "influencers",
] as const;

export const ATTENTION_ITEM_SOURCES = [
  "subscriptions",
  "billing_orphan_payments",
  "ai_usage_logs",
  "expenses",
  "influencers+subscriptions",
] as const;

export type AttentionSourceId = (typeof ATTENTION_SOURCE_IDS)[number];
export type AttentionItemSource = (typeof ATTENTION_ITEM_SOURCES)[number];

export type AttentionAction =
  | { type: "open_user"; userId: string }
  | { type: "open_orphan"; orphanId: string }
  | { type: "open_section"; section: AttentionSection };

export type AttentionItem = {
  kind: AttentionKind;
  key: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  source: AttentionItemSource;
  subject: { type: "user" | "subscription" | "orphan" | "area"; id?: string };
  action: AttentionAction;
  occurredAt?: string;
  stateUpdatedAt?: string;
  value?: {
    semantics: "detector_recorded_amount" | "estimated_ai_cost";
    currency: "BRL" | "USD";
    minorUnits: number;
  };
  declaredReason?: string;
};

export type AttentionSource = {
  source: AttentionSourceId;
  status: AttentionSourceStatus;
  detail: string;
};

export type AttentionContractV3 = {
  contractVersion: typeof ADMIN_ATTENTION_CONTRACT_VERSION;
  items: AttentionItem[];
  queryStartedAt: string;
  queryCompletedAt: string;
  computedAt: string;
  consistency: "multi_query_no_snapshot";
  sources: AttentionSource[];
  coverage: {
    completeHistoryVerified: false;
    transactionalSnapshot: false;
    limitations: string[];
  };
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/;
const KINDS = new Set<string>(ATTENTION_KINDS);
const EXPECTED_SOURCES = new Set<string>(ATTENTION_SOURCE_IDS);
const ITEM_SOURCES = new Set<string>(ATTENTION_ITEM_SOURCES);
const SOURCE_STATES = new Set<string>([
  "available",
  "partial",
  "unavailable",
  "not_collected",
]);
const SECTIONS = new Set<string>(["usuarios", "financeiro", "ia"]);

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIso(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_WITH_ZONE.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isAction(value: unknown): value is AttentionAction {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "open_user") return isUuid(value.userId);
  if (value.type === "open_orphan") return isUuid(value.orphanId);
  return (
    value.type === "open_section" &&
    typeof value.section === "string" &&
    SECTIONS.has(value.section)
  );
}

function sourceStatusInvariant(source: string, status: string): boolean {
  if (
    source === "failed_charges_reconciled" ||
    source === "failed_payouts_reconciled"
  )
    return status === "not_collected";
  if (source === "ai_usage_logs" || source === "cancellation_reasons")
    return (
      status === "available" || status === "partial" || status === "unavailable"
    );
  if (source === "influencers")
    return (
      status === "available" || status === "partial" || status === "unavailable"
    );
  return status === "available" || status === "unavailable";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function itemInvariant(value: Record<string, unknown>): boolean {
  const kind = value.kind as AttentionKind;
  const source = value.source;
  const subject = value.subject as Record<string, unknown>;
  const action = value.action as Record<string, unknown>;
  const subjectId = subject.id;

  if (
    kind === "subscription_local_past_due" ||
    kind === "subscription_scheduled_exit" ||
    kind === "manual_subscription_ending"
  ) {
    return (
      source === "subscriptions" &&
      subject.type === "subscription" &&
      isUuid(subjectId) &&
      ((action.type === "open_user" && isUuid(action.userId)) ||
        (action.type === "open_section" && action.section === "usuarios")) &&
      value.value === undefined &&
      (kind === "subscription_scheduled_exit" ||
        value.declaredReason === undefined)
    );
  }
  if (kind === "orphan_payment_open") {
    return (
      source === "billing_orphan_payments" &&
      subject.type === "orphan" &&
      isUuid(subjectId) &&
      action.type === "open_orphan" &&
      action.orphanId === subjectId &&
      (value.value === undefined ||
        ((value.value as Record<string, unknown>).semantics ===
          "detector_recorded_amount" &&
          (value.value as Record<string, unknown>).currency === "BRL")) &&
      value.declaredReason === undefined
    );
  }
  if (kind === "ai_cost_spike") {
    return (
      source === "ai_usage_logs" &&
      subject.type === "area" &&
      subjectId === "ia" &&
      action.type === "open_section" &&
      action.section === "ia" &&
      isRecord(value.value) &&
      value.value.semantics === "estimated_ai_cost" &&
      value.value.currency === "USD" &&
      value.declaredReason === undefined
    );
  }
  if (kind === "previous_month_without_expense") {
    return (
      source === "expenses" &&
      subject.type === "area" &&
      subjectId === "financeiro" &&
      action.type === "open_section" &&
      action.section === "financeiro" &&
      value.value === undefined &&
      value.declaredReason === undefined
    );
  }
  if (
    kind === "influencer_active_access" ||
    kind === "influencer_trial_access"
  ) {
    return (
      source === "influencers+subscriptions" &&
      subject.type === "user" &&
      isUuid(subjectId) &&
      action.type === "open_user" &&
      action.userId === subjectId &&
      value.value === undefined &&
      value.declaredReason === undefined
    );
  }
  return false;
}

function isItem(value: unknown): value is AttentionItem {
  if (!isRecord(value) || !KINDS.has(String(value.kind))) return false;
  if (
    !isNonEmptyString(value.key) ||
    (value.severity !== "critical" && value.severity !== "attention") ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.detail) ||
    !isNonEmptyString(value.source) ||
    !ITEM_SOURCES.has(value.source) ||
    !isRecord(value.subject) ||
    !["user", "subscription", "orphan", "area"].includes(
      String(value.subject.type),
    ) ||
    !isAction(value.action)
  )
    return false;
  if (value.occurredAt !== undefined && !isIso(value.occurredAt)) return false;
  if (value.stateUpdatedAt !== undefined && !isIso(value.stateUpdatedAt))
    return false;
  if (
    value.declaredReason !== undefined &&
    !isNonEmptyString(value.declaredReason)
  )
    return false;
  if (value.value !== undefined) {
    if (
      !isRecord(value.value) ||
      !["detector_recorded_amount", "estimated_ai_cost"].includes(
        String(value.value.semantics),
      ) ||
      !["BRL", "USD"].includes(String(value.value.currency)) ||
      typeof value.value.minorUnits !== "number" ||
      !Number.isSafeInteger(value.value.minorUnits) ||
      value.value.minorUnits < 0
    )
      return false;
  }
  return itemInvariant(value);
}

export function isAttentionContractV3(
  value: unknown,
): value is AttentionContractV3 {
  if (!isRecord(value) || value.contractVersion !== 3) return false;
  if (
    !Array.isArray(value.items) ||
    !value.items.every(isItem) ||
    !isIso(value.queryStartedAt) ||
    !isIso(value.queryCompletedAt) ||
    !isIso(value.computedAt) ||
    value.consistency !== "multi_query_no_snapshot" ||
    !Array.isArray(value.sources) ||
    value.sources.length !== ATTENTION_SOURCE_IDS.length ||
    !value.sources.every(
      (source) =>
        isRecord(source) &&
        isNonEmptyString(source.source) &&
        EXPECTED_SOURCES.has(source.source) &&
        SOURCE_STATES.has(String(source.status)) &&
        sourceStatusInvariant(source.source, String(source.status)) &&
        isNonEmptyString(source.detail),
    ) ||
    !isRecord(value.coverage) ||
    value.coverage.completeHistoryVerified !== false ||
    value.coverage.transactionalSnapshot !== false ||
    !Array.isArray(value.coverage.limitations) ||
    value.coverage.limitations.length === 0 ||
    !value.coverage.limitations.every(isNonEmptyString)
  )
    return false;
  const sourceIds = value.sources.map((source) => source.source);
  if (new Set(sourceIds).size !== ATTENTION_SOURCE_IDS.length) return false;
  const itemKeys = value.items.map((item) => item.key);
  if (new Set(itemKeys).size !== itemKeys.length) return false;
  const started = Date.parse(value.queryStartedAt);
  const completed = Date.parse(value.queryCompletedAt);
  const computed = Date.parse(value.computedAt);
  return started <= completed && completed <= computed;
}

export function attentionActionUrl(action: AttentionAction): string {
  const params = new URLSearchParams();
  if (action.type === "open_user") {
    params.set("section", "usuarios");
    params.set("user", action.userId);
  } else if (action.type === "open_orphan") {
    params.set("section", "financeiro");
    params.set("panel", "orphans");
    params.set("orphan", action.orphanId);
  } else {
    params.set("section", action.section);
  }
  return `/admin?${params.toString()}`;
}
