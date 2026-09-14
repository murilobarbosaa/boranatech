import {
  ADMIN_ATTENTION_CONTRACT_VERSION,
  isUuid,
  type AttentionAction,
  type AttentionContractV3,
  type AttentionItem,
  type AttentionSource,
} from "../../shared/adminAttention";
import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";
import {
  assinaturaVencendoSemRenovacao,
  VENCENDO_JANELA_DIAS,
} from "./billingMetrics";
import { classificarCustoDeIa } from "./aiUsageStats";
import { creatorKindOf } from "./creatorKind";
import { coletarTudoProvandoTotal } from "./paginate";
import { supabaseAdmin } from "./supabaseAdmin";

const SPIKE_DIAS_DE_BASE = 14;
export const SPIKE_MULTIPLICADOR = 3;
export const SPIKE_PISO_USD = 0.5;

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  status: string;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  current_period_start: string | null;
  last_event_at: string | null;
  provider_subscription_id: string | null;
  renewal_type: string | null;
  payment_method: string | null;
  created_at: string;
};

function validIso(value: unknown): string | undefined {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return undefined;
  return new Date(value).toISOString();
}

function userAction(userId: string | null): AttentionAction {
  return isUuid(userId)
    ? { type: "open_user", userId }
    : { type: "open_section", section: "usuarios" };
}

function setSource(
  sources: AttentionSource[],
  source: AttentionSource["source"],
  status: AttentionSource["status"],
  detail: string,
) {
  const next = { source, status, detail };
  const index = sources.findIndex((item) => item.source === source);
  if (index < 0) sources.push(next);
  else sources[index] = next;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function fronteirasDoMesAnterior(now: Date) {
  const today = diaBrasilia(now.toISOString()) ?? "1970-01-01";
  const [yearText, monthText] = today.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    inicio: `${previousYear}-${pad(previousMonth)}-01`,
    fim: `${year}-${pad(month)}-01`,
    rotulo: `${pad(previousMonth)}/${previousYear}`,
  };
}

function sortItems(items: AttentionItem[]) {
  const time = (item: AttentionItem) => {
    const value = item.occurredAt ?? item.stateUpdatedAt;
    return value ? Date.parse(value) : Number.POSITIVE_INFINITY;
  };
  items.sort(
    (a, b) =>
      Number(b.severity === "critical") - Number(a.severity === "critical") ||
      time(a) - time(b) ||
      a.key.localeCompare(b.key),
  );
}

export async function montarPainelDeAtencao(
  now = new Date(),
): Promise<AttentionContractV3> {
  const queryStartedAt = new Date().toISOString();
  const cutoff = new Date(Math.min(now.getTime(), Date.now()));
  const items: AttentionItem[] = [];
  const sources: AttentionSource[] = [
    {
      source: "failed_charges_reconciled",
      status: "not_collected",
      detail:
        "Tentativas falhadas e obrigações abertas não são reconciliadas localmente.",
    },
    {
      source: "failed_payouts_reconciled",
      status: "not_collected",
      detail: "O estado reconciliado de repasses não é mantido localmente.",
    },
  ];

  let subscriptions: SubscriptionRow[] = [];
  try {
    subscriptions = await coletarTudoProvandoTotal<SubscriptionRow>(
      (from, to) =>
        supabaseAdmin
          .from("subscriptions")
          .select(
            "id, user_id, status, cancel_at_period_end, current_period_end, current_period_start, last_event_at, provider_subscription_id, renewal_type, payment_method, created_at",
            { count: "exact" },
          )
          .in("status", ["active", "trialing", "past_due", "pending"])
          .order("id", { ascending: true })
          .range(from, to) as never,
      { op: "attention subscriptions", rowKey: (row) => row.id },
    );
    setSource(
      sources,
      "subscriptions",
      "available",
      "Estados locais de acesso lidos até o corte, sem snapshot transacional.",
    );
  } catch {
    setSource(
      sources,
      "subscriptions",
      "unavailable",
      "A leitura local de assinaturas falhou.",
    );
  }

  const reasons = new Map<string, string>();
  if (
    sources.some(
      (source) =>
        source.source === "subscriptions" && source.status === "available",
    )
  ) {
    try {
      const rows = await coletarTudoProvandoTotal<{
        id: string;
        provider_subscription_id: string | null;
        reason_code: string | null;
      }>(
        (from, to) =>
          supabaseAdmin
            .from("subscription_cancellations")
            .select("id, provider_subscription_id, reason_code", {
              count: "exact",
            })
            .eq("status", "scheduled")
            .order("id", { ascending: true })
            .range(from, to) as never,
        { op: "attention cancellation reasons", rowKey: (row) => row.id },
      );
      for (const row of rows)
        if (row.provider_subscription_id && row.reason_code)
          reasons.set(row.provider_subscription_id, row.reason_code);
      setSource(
        sources,
        "cancellation_reasons",
        "available",
        "Motivos declarados de saídas agendadas foram lidos localmente.",
      );
    } catch {
      setSource(
        sources,
        "cancellation_reasons",
        "unavailable",
        "Os alertas permanecem, mas os motivos declarados não foram lidos.",
      );
    }
  } else {
    setSource(
      sources,
      "cancellation_reasons",
      "partial",
      "Os motivos não foram consultados porque a leitura de assinaturas falhou.",
    );
  }

  const pendingByUser = new Map<string, number>();
  for (const row of subscriptions) {
    if (row.status !== "pending" || !row.user_id) continue;
    const time = Date.parse(row.created_at);
    if (Number.isFinite(time))
      pendingByUser.set(
        row.user_id,
        Math.max(time, pendingByUser.get(row.user_id) ?? 0),
      );
  }

  for (const row of subscriptions) {
    if (row.status === "pending") continue;
    const stateUpdatedAt = validIso(row.last_event_at);
    if (row.status === "past_due") {
      items.push({
        kind: "subscription_local_past_due",
        key: `subscription-local-past-due:${row.id}`,
        severity: "critical",
        title: "Assinatura com estado local past_due",
        detail:
          "Este estado local não comprova obrigação aberta, valor vencido ou nova tentativa agendada.",
        source: "subscriptions",
        subject: { type: "subscription", id: row.id },
        action: userAction(row.user_id),
        ...(stateUpdatedAt ? { stateUpdatedAt } : {}),
      });
      continue;
    }
    if (row.cancel_at_period_end) {
      const end = validIso(row.current_period_end);
      items.push({
        kind: "subscription_scheduled_exit",
        key: `subscription-scheduled-exit:${row.id}`,
        severity: "attention",
        title: "Saída agendada no estado local",
        detail: end
          ? `O acesso local está marcado para terminar em ${new Date(end).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
          : "O acesso local está marcado para terminar, sem data válida registrada.",
        source: "subscriptions",
        subject: { type: "subscription", id: row.id },
        action: userAction(row.user_id),
        ...(stateUpdatedAt ? { stateUpdatedAt } : {}),
        ...(row.provider_subscription_id &&
        reasons.has(row.provider_subscription_id)
          ? { declaredReason: reasons.get(row.provider_subscription_id) }
          : {}),
      });
    }
    if (
      assinaturaVencendoSemRenovacao({
        status: row.status,
        renewalType: row.renewal_type,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        pendingCreatedAt:
          row.user_id && pendingByUser.has(row.user_id)
            ? new Date(pendingByUser.get(row.user_id)!).toISOString()
            : null,
        nowMs: cutoff.getTime(),
      })
    ) {
      const end = validIso(row.current_period_end);
      const method =
        row.payment_method === "pix"
          ? "Pix"
          : row.payment_method === "boleto"
            ? "boleto"
            : "não identificado";
      items.push({
        kind: "manual_subscription_ending",
        key: `manual-subscription-ending:${row.id}`,
        severity: "attention",
        title: "Assinatura manual próxima do fim",
        detail: `${end ? `Fim local em ${new Date(end).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Data final inválida"}. Meio registrado: ${method}.`,
        source: "subscriptions",
        subject: { type: "subscription", id: row.id },
        action: userAction(row.user_id),
        ...(end ? { occurredAt: end } : {}),
      });
    }
  }

  try {
    const orphans = await coletarTudoProvandoTotal<{
      id: string;
      amount_total_cents: number | null;
      currency: string | null;
      detected_at: string;
      last_seen_at: string | null;
      stripe_charge_id: string | null;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("billing_orphan_payments")
          .select(
            "id, amount_total_cents, currency, detected_at, last_seen_at, stripe_charge_id",
            { count: "exact" },
          )
          .is("resolved_at", null)
          .order("id", { ascending: true })
          .range(from, to) as never,
      { op: "attention orphan payments", rowKey: (row) => row.id },
    );
    for (const row of orphans) {
      const amount = row.amount_total_cents;
      items.push({
        kind: "orphan_payment_open",
        key: `orphan-payment-open:${row.id}`,
        severity: "critical",
        title: "Caso órfão detectado e aberto localmente",
        detail: row.stripe_charge_id
          ? "Caso detectado a partir de uma cobrança registrada, sem vínculo local concluído."
          : "Caso detectado a partir de uma sessão registrada, sem vínculo local concluído.",
        source: "billing_orphan_payments",
        subject: { type: "orphan", id: row.id },
        action: { type: "open_orphan", orphanId: row.id },
        ...(validIso(row.detected_at)
          ? { occurredAt: validIso(row.detected_at)! }
          : {}),
        ...(validIso(row.last_seen_at)
          ? { stateUpdatedAt: validIso(row.last_seen_at)! }
          : {}),
        ...(Number.isSafeInteger(amount) &&
        amount !== null &&
        amount >= 0 &&
        row.currency?.toUpperCase() === "BRL"
          ? {
              value: {
                semantics: "detector_recorded_amount" as const,
                currency: "BRL" as const,
                minorUnits: amount,
              },
            }
          : {}),
      });
    }
    setSource(
      sources,
      "billing_orphan_payments",
      "available",
      "Todos os casos localmente abertos foram lidos sem consultar o provedor.",
    );
  } catch {
    setSource(
      sources,
      "billing_orphan_payments",
      "unavailable",
      "A leitura local dos casos órfãos falhou.",
    );
  }

  const today = diaBrasilia(cutoff.toISOString()) ?? "1970-01-01";
  const firstAiDay = somarDiaCivil(today, -SPIKE_DIAS_DE_BASE);
  try {
    const logs = await coletarTudoProvandoTotal<{
      id: string;
      created_at: string;
      status: string | null;
      cost_estimate: string | null;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("ai_usage_logs")
          .select("id, created_at, status, cost_estimate", { count: "exact" })
          .gte("created_at", inicioDoDiaBrasilia(firstAiDay))
          .lte("created_at", cutoff.toISOString())
          .order("id", { ascending: true })
          .range(from, to) as never,
      { op: "attention ai usage", rowKey: (row) => row.id },
    );
    const costs = new Map<string, number>();
    let successfulWithoutMeasuredCost = 0;
    for (let day = firstAiDay; day <= today; day = somarDiaCivil(day))
      costs.set(day, 0);
    for (const row of logs) {
      const instant = Date.parse(row.created_at);
      if (!Number.isFinite(instant) || instant > cutoff.getTime()) continue;
      const day = diaBrasilia(row.created_at);
      const cost = classificarCustoDeIa(row.status, row.cost_estimate);
      if (cost.semCustoMedido) successfulWithoutMeasuredCost += 1;
      if (day && costs.has(day))
        costs.set(day, (costs.get(day) ?? 0) + cost.custoMedido);
    }
    const current = costs.get(today) ?? 0;
    const baseline = median(
      Array.from(costs)
        .filter(([day]) => day !== today)
        .map(([, cost]) => cost),
    );
    if (
      successfulWithoutMeasuredCost === 0 &&
      current >= SPIKE_PISO_USD &&
      current > SPIKE_MULTIPLICADOR * baseline
    ) {
      items.push({
        kind: "ai_cost_spike",
        key: `ai-cost-spike:${today}`,
        severity: "attention",
        title: "Custo estimado de IA acima do padrão",
        detail: `US$ ${current.toFixed(2)} no dia parcial até o corte, contra mediana estimada de US$ ${baseline.toFixed(2)} nos ${SPIKE_DIAS_DE_BASE} dias anteriores.`,
        source: "ai_usage_logs",
        subject: { type: "area", id: "ia" },
        action: { type: "open_section", section: "ia" },
        occurredAt: cutoff.toISOString(),
        value: {
          semantics: "estimated_ai_cost",
          currency: "USD",
          minorUnits: Math.round(current * 100),
        },
      });
    }
    setSource(
      sources,
      "ai_usage_logs",
      successfulWithoutMeasuredCost > 0 ? "partial" : "available",
      successfulWithoutMeasuredCost > 0
        ? `${successfulWithoutMeasuredCost} execuções success não têm custo medido na janela; a comparação foi omitida.`
        : "Custos estimados locais lidos até o corte; o dia atual é parcial.",
    );
  } catch {
    setSource(
      sources,
      "ai_usage_logs",
      "unavailable",
      "A leitura local do custo estimado de IA falhou.",
    );
  }

  const month = fronteirasDoMesAnterior(cutoff);
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("id")
      .gte("incurred_on", month.inicio)
      .lt("incurred_on", month.fim)
      .limit(1);
    if (error) throw error;
    if (!(data ?? []).length)
      items.push({
        kind: "previous_month_without_expense",
        key: `previous-month-without-expense:${month.rotulo}`,
        severity: "attention",
        title: `Nenhuma despesa local registrada em ${month.rotulo}`,
        detail:
          "A plataforma não encontrou lançamentos locais no mês anterior. Isso não prova ausência de despesas fora dela.",
        source: "expenses",
        subject: { type: "area", id: "financeiro" },
        action: { type: "open_section", section: "financeiro" },
      });
    setSource(
      sources,
      "expenses",
      "available",
      "Foi verificada a existência de despesa local no mês civil anterior de Brasília.",
    );
  } catch {
    setSource(
      sources,
      "expenses",
      "unavailable",
      "A leitura local de despesas falhou.",
    );
  }

  try {
    const grants = await coletarTudoProvandoTotal<{
      id: string;
      user_id: string;
      kind: string;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("creators")
          .select("id, user_id, kind", { count: "exact" })
          .is("revoked_at", null)
          .order("id", { ascending: true })
          .range(from, to) as never,
      { op: "attention creators", rowKey: (row) => row.id },
    );
    const granted = new Map(
      grants.map((row) => [row.user_id, creatorKindOf(row.kind)]),
    );
    const seen = new Set<string>();
    for (const row of subscriptions) {
      const token = `${row.user_id}:${row.status}`;
      const creatorKind = row.user_id ? granted.get(row.user_id) : undefined;
      if (
        !row.user_id ||
        !creatorKind ||
        !["active", "trialing"].includes(row.status) ||
        seen.has(token)
      )
        continue;
      const end = row.current_period_end
        ? Date.parse(row.current_period_end)
        : Infinity;
      if (Number.isFinite(end) && end <= cutoff.getTime()) continue;
      seen.add(token);
      const trial = row.status === "trialing";
      const creatorLabel =
        creatorKind === "afiliado" ? "Afiliado" : "Influencer";
      const grantLabel = creatorKind === "afiliado" ? "afiliado" : "influencer";
      items.push({
        kind: trial ? "influencer_trial_access" : "influencer_active_access",
        key: `influencer-${trial ? "trial" : "active"}-access:${row.user_id}`,
        severity: "attention",
        title: trial
          ? `${creatorLabel} com trial local`
          : `${creatorLabel} com outro acesso local ativo`,
        detail: trial
          ? `A concessão de ${grantLabel} e um trial local estão ativos; isso não prova pagamento.`
          : `A concessão de ${grantLabel} e outro acesso local estão ativos; isso não prova pagamento.`,
        source: "influencers+subscriptions",
        subject: { type: "user", id: row.user_id },
        action: userAction(row.user_id),
        ...(validIso(row.last_event_at)
          ? { stateUpdatedAt: validIso(row.last_event_at)! }
          : {}),
      });
    }
    setSource(
      sources,
      "influencers",
      sources.find((source) => source.source === "subscriptions")?.status ===
        "available"
        ? "available"
        : "partial",
      "Concessões de creator foram cruzadas com os estados locais de acesso disponíveis.",
    );
  } catch {
    setSource(
      sources,
      "influencers",
      "unavailable",
      "A leitura local de concessões de creator falhou.",
    );
  }

  sortItems(items);
  const queryCompletedAt = new Date().toISOString();
  return {
    contractVersion: ADMIN_ATTENTION_CONTRACT_VERSION,
    items,
    queryStartedAt,
    queryCompletedAt,
    computedAt: queryCompletedAt,
    consistency: "multi_query_no_snapshot",
    sources,
    coverage: {
      completeHistoryVerified: false,
      transactionalSnapshot: false,
      limitations: [
        "As consultas locais não compartilham uma fotografia transacional única.",
        "A cobertura histórica entre provedores não foi reconciliada.",
        "Estado de assinatura, webhook e movimento de caixa são fatos distintos.",
      ],
    },
  };
}

export { VENCENDO_JANELA_DIAS };
