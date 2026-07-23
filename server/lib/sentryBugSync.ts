import { resolveShortId, updateIssueStatus } from "./sentryApi";
import { supabaseAdmin } from "./supabaseAdmin";

// Sincroniza o status de UM card com a issue do Sentry (card em done ->
// resolved; card saindo de done -> unresolved). Usado na transicao do card
// (PATCH, fire-and-forget) e no retry do job de reconciliacao. Best-effort com
// estado persistido, NUNCA lanca:
//  - sucesso: limpa sentry_sync_pending (e grava o numeric id se acabou de
//    resolver via shortid);
//  - falha transitoria (rede/HTTP/rate limit): grava sentry_sync_pending =
//    target, para o job repetir de forma idempotente;
//  - shortid deletado (not_found): marca o card como orfao e limpa a pendencia
//    (nao ha issue para sincronizar). Acao nao destrutiva: o card permanece.

export type BugSentrySyncTarget = "resolved" | "unresolved";

async function markPending(bugId: string, target: BugSentrySyncTarget) {
  await supabaseAdmin
    .from("admin_bugs")
    .update({ sentry_sync_pending: target })
    .eq("id", bugId);
}

export async function syncBugStatusToSentry(params: {
  bugId: string;
  shortId: string;
  numericId: string | null;
  target: BugSentrySyncTarget;
}): Promise<{ ok: boolean; reason?: string }> {
  const { bugId, shortId, target } = params;
  let numericId = params.numericId;

  try {
    if (!numericId) {
      const resolved = await resolveShortId(shortId);
      if (resolved.state === "not_found") {
        await supabaseAdmin
          .from("admin_bugs")
          .update({
            sentry_orphaned_at: new Date().toISOString(),
            sentry_sync_pending: null,
          })
          .eq("id", bugId);
        return { ok: false, reason: "orphaned" };
      }
      if (resolved.state !== "ok") {
        await markPending(bugId, target);
        return { ok: false, reason: resolved.state };
      }
      numericId = resolved.groupId;
      await supabaseAdmin
        .from("admin_bugs")
        .update({ sentry_numeric_id: numericId })
        .eq("id", bugId);
    }

    const write = await updateIssueStatus(numericId, target);
    if (write.state !== "ok") {
      await markPending(bugId, target);
      return { ok: false, reason: write.state };
    }

    await supabaseAdmin
      .from("admin_bugs")
      .update({ sentry_sync_pending: null })
      .eq("id", bugId);
    return { ok: true };
  } catch (err) {
    await markPending(bugId, target).catch(() => {});
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
