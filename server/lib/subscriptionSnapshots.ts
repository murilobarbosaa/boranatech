import { getMrrSnapshot } from "./billingMetrics";
import { supabaseAdmin } from "./supabaseAdmin";

// Coleta do snapshot DIARIO de assinaturas (tabela subscription_snapshots).
// So leitura de subscriptions + upsert do snapshot; subscriptions NUNCA e escrita.
//
// REGRA: erro PROPAGA. Nunca grava snapshot parcial, zerado ou "melhor esforco".
// Se getMrrSnapshot ou o tally falharem, a excecao sobe e o cron marca error, sem
// deixar uma linha enganosa no historico.
//
// DIVERGENCIA INTENCIONAL (mesma nota da migration): active_count / trialing_count
// / mrr_cents / by_plan seguem a definicao do painel (getMrrSnapshot: active com
// current_period_end nulo ou > now; trialing fora do MRR). Ja by_status e um tally
// CRU da coluna status sobre TODAS as linhas, sem filtro de periodo. Por isso
// by_status['active'] pode ser >= active_count: "ativos que pagam MRR agora" vs
// "distribuicao crua do status". Nao unifique os dois sem entender essa diferenca.

export type SubscriptionSnapshot = {
  snapshotDate: string;
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  canceledCount: number;
  mrrCents: number;
  byPlan: Record<string, { count: number; mrr_cents: number }>;
  byStatus: Record<string, number>;
};

// Tally cru de status sobre TODAS as assinaturas, paginado. Erro propaga.
async function tallySubscriptionStatuses(): Promise<Record<string, number>> {
  const tally: Record<string, number> = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ status: string | null }>;
    for (const row of rows) {
      const key = row.status ?? "unknown";
      tally[key] = (tally[key] ?? 0) + 1;
    }
    if (rows.length < PAGE) break;
  }
  return tally;
}

// Le o estado atual, monta o snapshot e faz UPSERT por snapshot_date (hoje, UTC).
// Idempotente: rodar duas vezes no mesmo dia atualiza a MESMA linha (onConflict
// no unique snapshot_date), nunca duplica.
export async function collectSubscriptionSnapshot(): Promise<SubscriptionSnapshot> {
  const mrr = await getMrrSnapshot();
  const byStatus = await tallySubscriptionStatuses();

  const byPlan: Record<string, { count: number; mrr_cents: number }> = {};
  for (const plan of mrr.byPlan) {
    byPlan[plan.code] = { count: plan.count, mrr_cents: plan.mrrCents };
  }

  // Dia UTC (YYYY-MM-DD), a mesma base que o cron 05:10 UTC coleta.
  const snapshotDate = new Date().toISOString().slice(0, 10);

  const { error } = await supabaseAdmin.from("subscription_snapshots").upsert(
    {
      snapshot_date: snapshotDate,
      active_count: mrr.activeCount,
      trialing_count: mrr.trialingCount,
      past_due_count: byStatus.past_due ?? 0,
      canceled_count: byStatus.canceled ?? 0,
      mrr_cents: mrr.mrrCents,
      by_plan: byPlan,
      by_status: byStatus,
    },
    { onConflict: "snapshot_date" },
  );
  if (error) throw error;

  return {
    snapshotDate,
    activeCount: mrr.activeCount,
    trialingCount: mrr.trialingCount,
    pastDueCount: byStatus.past_due ?? 0,
    canceledCount: byStatus.canceled ?? 0,
    mrrCents: mrr.mrrCents,
    byPlan,
    byStatus,
  };
}
