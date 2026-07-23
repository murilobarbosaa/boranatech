import { adminFetch } from "@/lib/adminApi";

// Service da seção admin de Bugs & Erros. Usa o adminFetch (Bearer + prefixo
// /api/admin + parse de erro do padrão { error: { code, message } }); a UI
// distingue sentry_not_configured / rate limit via AdminApiError.code.

export type BugStatus = "open" | "in_progress" | "done";
export type BugSeverity = "low" | "medium" | "high" | "critical";

export type BugSentrySync = "resolved" | "unresolved";

export type AdminBug = {
  id: string;
  title: string;
  description: string | null;
  status: BugStatus;
  severity: BugSeverity;
  sentry_issue_id: string | null;
  sentry_issue_url: string | null;
  // Estado da sincronizacao com o Sentry (preenchido para cards vinculados).
  sentry_numeric_id: string | null;
  sentry_sync_pending: BugSentrySync | null;
  sentry_reopen_event_at: string | null;
  sentry_last_checked_at: string | null;
  sentry_orphaned_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type BugCounts = Record<BugStatus, number>;

export type AdminBugInput = {
  title: string;
  description?: string | null;
  severity?: BugSeverity;
  sentry_issue_id?: string | null;
  sentry_issue_url?: string | null;
  sentry_numeric_id?: string | null;
};

export type SentryIssue = {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

export type SentryIssuesPage = {
  issues: SentryIssue[];
  nextCursor: string | null;
  prevCursor: string | null;
};

export async function listSentryIssues(options?: {
  query?: string;
  statsPeriod?: string;
  cursor?: string;
}): Promise<SentryIssuesPage> {
  const params = new URLSearchParams();
  if (options?.query) params.set("query", options.query);
  if (options?.statsPeriod) params.set("statsPeriod", options.statsPeriod);
  if (options?.cursor) params.set("cursor", options.cursor);
  const query = params.toString();
  return adminFetch(`/bugs/sentry-issues${query ? `?${query}` : ""}`);
}

export async function listBugs(options?: {
  status?: BugStatus;
}): Promise<{ bugs: AdminBug[]; counts: BugCounts }> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  const query = params.toString();
  return adminFetch(`/bugs${query ? `?${query}` : ""}`);
}

export async function createBug(input: AdminBugInput): Promise<AdminBug> {
  return adminFetch("/bugs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function patchBug(
  id: string,
  patch: Partial<AdminBugInput> & { status?: BugStatus },
): Promise<AdminBug> {
  return adminFetch(`/bugs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteBug(id: string): Promise<{ ok: true }> {
  return adminFetch(`/bugs/${id}`, { method: "DELETE" });
}
