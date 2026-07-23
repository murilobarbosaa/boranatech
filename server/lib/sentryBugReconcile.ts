import { sendBugReopenedEmail } from "./email";
import { env } from "./env";
import { getIssuesByNumericIds, resolveShortId } from "./sentryApi";
import { syncBugStatusToSentry } from "./sentryBugSync";
import { supabaseAdmin } from "./supabaseAdmin";
import { createTargetedNotification } from "./targetedNotifications";

// Reconciliacao periodica do bug tracker com o Sentry. Idempotente por
// construcao (updates condicionais em status/estado), respeita rate limit
// (para a fase ao ver 429) e nao faz acao destrutiva. Fases:
//   1. Backfill do sentry_numeric_id de cards legados (uma resolucao por card
//      legado, limitada por run); shortid deletado -> card orfao, sem falhar.
//   2. Retry das sincronizacoes de status pendentes (Passo 4).
//   3. Reconciliacao dos cards em done: busca EM LOTE o estado das issues e,
//      quando lastSeen > resolved_at (evento novo apos a resolucao), reabre o
//      card ("Em correcao") e notifica; senao marca verificado.

// Teto por run para as fases que fazem 1 chamada por card (backfill/retry): mantem
// o custo de rate limit previsivel; o resto drena nas proximas runs.
const PER_CARD_PHASE_LIMIT = 25;
// Teto de cards em done reconciliados por run. A busca de estado e em lote, entao
// o teto so limita quantos ids entram nos lotes.
const RECONCILE_LIMIT = 200;

const SEVERITY_LABELS: Record<string, string> = {
  low: "baixa",
  medium: "média",
  high: "alta",
  critical: "crítica",
};

export type SentryBugReconcileSummary = {
  backfilled: number;
  orphaned: number;
  backfillFailed: number;
  syncRetried: number;
  syncRetryFailed: number;
  reconciled: number;
  reopened: number;
  verified: number;
  reconcileSkipped: string | null;
};

type LinkedBug = {
  id: string;
  title: string;
  severity: string;
  status: string;
  sentry_issue_id: string | null;
  sentry_numeric_id: string | null;
  resolved_at: string | null;
};

const BUG_COLS =
  "id, title, severity, status, sentry_issue_id, sentry_numeric_id, resolved_at";

// Fase 1: preenche o numeric id de cards legados (tem shortId, sem numeric id,
// nao orfaos). Uma resolucao de shortid por card; teto por run.
async function backfillNumericIds(
  summary: SentryBugReconcileSummary,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .select("id, sentry_issue_id")
    .not("sentry_issue_id", "is", null)
    .is("sentry_numeric_id", null)
    .is("sentry_orphaned_at", null)
    .limit(PER_CARD_PHASE_LIMIT);
  if (error) throw new Error(`backfill select: ${error.message}`);

  for (const row of (data ?? []) as Array<{
    id: string;
    sentry_issue_id: string | null;
  }>) {
    if (!row.sentry_issue_id) continue;
    const resolved = await resolveShortId(row.sentry_issue_id);
    if (resolved.state === "rate_limited") return; // respeita o limite; proxima run continua
    if (resolved.state === "not_found") {
      await supabaseAdmin
        .from("admin_bugs")
        .update({ sentry_orphaned_at: new Date().toISOString() })
        .eq("id", row.id);
      summary.orphaned += 1;
      continue;
    }
    if (resolved.state !== "ok") {
      summary.backfillFailed += 1;
      continue;
    }
    const { error: updErr } = await supabaseAdmin
      .from("admin_bugs")
      .update({ sentry_numeric_id: resolved.groupId })
      .eq("id", row.id);
    if (updErr) summary.backfillFailed += 1;
    else summary.backfilled += 1;
  }
}

// Fase 2: retry das sincronizacoes de status que falharam na transicao do card.
async function retryPendingSyncs(
  summary: SentryBugReconcileSummary,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .select("id, sentry_issue_id, sentry_numeric_id, sentry_sync_pending")
    .not("sentry_sync_pending", "is", null)
    .not("sentry_numeric_id", "is", null)
    .is("sentry_orphaned_at", null)
    .limit(PER_CARD_PHASE_LIMIT);
  if (error) throw new Error(`retry select: ${error.message}`);

  for (const row of (data ?? []) as Array<{
    id: string;
    sentry_issue_id: string | null;
    sentry_numeric_id: string | null;
    sentry_sync_pending: "resolved" | "unresolved" | null;
  }>) {
    if (!row.sentry_sync_pending || !row.sentry_issue_id) continue;
    const result = await syncBugStatusToSentry({
      bugId: row.id,
      shortId: row.sentry_issue_id,
      numericId: row.sentry_numeric_id,
      target: row.sentry_sync_pending,
    });
    if (result.ok) summary.syncRetried += 1;
    else summary.syncRetryFailed += 1;
  }
}

async function notifyReopen(bug: LinkedBug, eventAtIso: string): Promise<void> {
  const eventDate = new Date(eventAtIso).toLocaleString("pt-BR");
  const severity = SEVERITY_LABELS[bug.severity] ?? bug.severity;
  void sendBugReopenedEmail({
    title: bug.title,
    eventAt: eventAtIso,
  }).catch((err) => {
    console.error("[sentry-bug-reconcile] email de reabertura falhou:", err);
  });
  void createTargetedNotification({
    email: env.bugNotifyDoneEmail,
    title: `🔁 Bug reaberto: ${bug.title}`,
    body: `O bug de severidade ${severity} voltou a acontecer no Sentry (evento novo em ${eventDate}) e foi movido para "Em correção".`,
    createdBy: null,
  }).catch((err) => {
    console.error(
      "[sentry-bug-reconcile] notificação de reabertura falhou:",
      err,
    );
  });
}

// Fase 3: cards em done com issue vinculada. Busca o estado EM LOTE e decide por
// card: lastSeen > resolved_at -> reabre; senao marca verificado.
async function reconcileDoneCards(
  summary: SentryBugReconcileSummary,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .select(BUG_COLS)
    .eq("status", "done")
    .not("sentry_numeric_id", "is", null)
    .is("sentry_orphaned_at", null)
    .limit(RECONCILE_LIMIT);
  if (error) throw new Error(`reconcile select: ${error.message}`);

  const bugs = (data ?? []) as LinkedBug[];
  if (bugs.length === 0) return;

  const numericIds = bugs
    .map((b) => b.sentry_numeric_id)
    .filter((id): id is string => Boolean(id));
  const issuesResult = await getIssuesByNumericIds(numericIds);
  if (issuesResult.state !== "ok") {
    // rate_limited / error / not_configured: nao toca nos cards nesta run
    // (fail-safe, nunca reabre por falha de leitura). Carrega o motivo real
    // (status HTTP + corpo do Sentry) pro payload do cron_run_logs; so o state
    // ("error") escondia a causa e obrigava a testar a API na mao.
    summary.reconcileSkipped =
      issuesResult.state === "error"
        ? `error: ${issuesResult.reason}`
        : issuesResult.state;
    return;
  }

  const lastSeenById = new Map<string, string>();
  for (const issue of issuesResult.issues) {
    lastSeenById.set(issue.id, issue.lastSeen);
  }

  const nowIso = new Date().toISOString();
  for (const bug of bugs) {
    summary.reconciled += 1;
    const lastSeen = bug.sentry_numeric_id
      ? lastSeenById.get(bug.sentry_numeric_id)
      : undefined;

    // Evento novo = lastSeen posterior ao resolved_at. resolved_at nulo (anomalia
    // ou reaberto manualmente) nao permite comparar: so marca verificado, nunca
    // reabre com base incerta. Ausencia no lote (issue fora da janela) = sem
    // evento novo (fail-safe).
    const hasNewEvent =
      Boolean(lastSeen) &&
      Boolean(bug.resolved_at) &&
      new Date(lastSeen as string).getTime() >
        new Date(bug.resolved_at as string).getTime();

    if (hasNewEvent) {
      // Guard de idempotencia: so reabre se ainda em done. Segunda run nao
      // reabre de novo (o card ja saiu de done) nem duplica notificacao.
      const { data: updated, error: updErr } = await supabaseAdmin
        .from("admin_bugs")
        .update({
          status: "in_progress",
          resolved_at: null,
          sentry_reopen_event_at: lastSeen,
          sentry_last_checked_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", bug.id)
        .eq("status", "done")
        .select("id");
      if (updErr) {
        console.error(
          `[sentry-bug-reconcile] falha ao reabrir card ${bug.id}:`,
          updErr,
        );
        continue;
      }
      if (updated && updated.length > 0) {
        summary.reopened += 1;
        await notifyReopen(bug, lastSeen as string);
      }
    } else {
      const { error: updErr } = await supabaseAdmin
        .from("admin_bugs")
        .update({ sentry_last_checked_at: nowIso })
        .eq("id", bug.id)
        .eq("status", "done");
      if (updErr) {
        console.error(
          `[sentry-bug-reconcile] falha ao marcar verificado ${bug.id}:`,
          updErr,
        );
      } else {
        summary.verified += 1;
      }
    }
  }
}

export async function reconcileSentryBugs(): Promise<SentryBugReconcileSummary> {
  const summary: SentryBugReconcileSummary = {
    backfilled: 0,
    orphaned: 0,
    backfillFailed: 0,
    syncRetried: 0,
    syncRetryFailed: 0,
    reconciled: 0,
    reopened: 0,
    verified: 0,
    reconcileSkipped: null,
  };

  await backfillNumericIds(summary);
  await retryPendingSyncs(summary);
  await reconcileDoneCards(summary);

  return summary;
}
