import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { BntSelect } from "@/components/shared/BntSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminApiError } from "@/lib/adminApi";
import {
  createBug,
  deleteBug,
  listBugs,
  listSentryIssues,
  patchBug,
  type AdminBug,
  type BugCounts,
  type BugSeverity,
  type BugStatus,
  type SentryIssue,
} from "@/services/adminBugsService";

// Aba Bugs & Erros: leitura das issues do Sentry (read-only, paginada por
// cursor) e bug tracker manual em board de 3 colunas. "Criar bug" numa issue
// pula pro tracker com o formulário pré-preenchido e vinculado (sentry_issue_*
// gravados na criação, nunca editáveis depois).

const inputClass =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const labelClass =
  "mb-1 block text-xs font-black uppercase tracking-wide text-slate-600";
const primaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:shadow-none";
const secondaryButtonClass =
  "rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50 disabled:shadow-none";
const rowActionClass =
  "rounded-full border-2 border-slate-900 bg-white px-2.5 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] disabled:opacity-50";
const badgeClass =
  "inline-flex items-center rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-black uppercase";

const SEVERITY_META: Record<BugSeverity, { label: string; badge: string }> = {
  low: { label: "Baixa", badge: "bg-slate-100 text-slate-700" },
  medium: { label: "Média", badge: "bg-amber-100 text-amber-800" },
  high: { label: "Alta", badge: "bg-orange-200 text-orange-900" },
  critical: { label: "Crítica", badge: "bg-rose-600 text-white" },
};

const BOARD_SEVERITY_OPTIONS = (
  Object.keys(SEVERITY_META) as BugSeverity[]
).map((value) => ({ value, label: SEVERITY_META[value].label }));

const LEVEL_BADGES: Record<string, string> = {
  fatal: "bg-rose-600 text-white",
  error: "bg-rose-100 text-rose-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-800",
  debug: "bg-slate-100 text-slate-600",
};

// Fundos tintados por estado (leitura rápida do board) e highlight de drop
// como intensificação da cor da própria coluna. Admin é light-only, sem
// variantes dark. Cards brancos com borda escura mantêm o contraste em cima.
const BOARD_COLUMNS: Array<{
  status: BugStatus;
  label: string;
  bg: string;
  dropHighlight: string;
}> = [
  {
    status: "open",
    label: "Abertos",
    bg: "bg-slate-100",
    dropHighlight: "bg-slate-200 ring-4 ring-slate-400",
  },
  {
    status: "in_progress",
    label: "Em correção",
    bg: "bg-sky-50",
    dropHighlight: "bg-sky-100 ring-4 ring-sky-400",
  },
  {
    status: "done",
    label: "Corrigidos",
    bg: "bg-emerald-50",
    dropHighlight: "bg-emerald-100 ring-4 ring-emerald-400",
  },
];

const STATS_PERIODS = [
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

// O backend exige query não-vazia (min 1) e o default dele já é is:unresolved.
// "Todos" usa timesSeen:>0, termo documentado da busca do Sentry que casa com
// qualquer issue, porque query vazia é rejeitada pelo endpoint.
const QUERY_UNRESOLVED = "is:unresolved";
const QUERY_ALL = "timesSeen:>0";

const BugFormSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(200, "Título muito longo (máx. 200)."),
  description: z.string().trim().max(5000, "Descrição muito longa (máx. 5000)."),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

type FormState = {
  title: string;
  description: string;
  severity: BugSeverity;
  sentry_issue_id: string | null;
  sentry_issue_url: string | null;
  sentry_numeric_id: string | null;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  severity: "medium",
  sentry_issue_id: null,
  sentry_issue_url: null,
  sentry_numeric_id: null,
};

const STATUS_LABEL: Record<BugStatus, string> = {
  open: "Abertos",
  in_progress: "Em correção",
  done: "Corrigidos",
};

function daysSince(iso: string): number {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
}

function severityFromLevel(level: string): BugSeverity {
  if (level === "fatal" || level === "error") return "high";
  if (level === "warning") return "medium";
  return "low";
}

function timeAgo(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });
  const diffMinutes = Math.round((ms - Date.now()) / 60_000);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(Math.round(diffHours / 24), "day");
}

function formatDate(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`${badgeClass} ${LEVEL_BADGES[level] ?? "bg-slate-100 text-slate-600"}`}
    >
      {level || "sem nível"}
    </span>
  );
}

// Estado real do vinculo com o Sentry num card do tracker: reabertura automatica,
// selo de verificado, aguardando verificacao (done ainda nao reconciliado),
// sincronizacao pendente de retry e issue orfa (deletada no Sentry). Nada
// renderizado para bug manual (sem sentry_issue_id).
function BugSentryState({ bug }: { bug: AdminBug }) {
  if (!bug.sentry_issue_id) return null;
  // Reaberto = ha data de evento de reabertura mais nova que a resolucao (ou sem
  // resolucao atual). Resolucao/reabertura manual posterior zera o banner.
  const reopened =
    bug.sentry_reopen_event_at !== null &&
    (bug.resolved_at === null ||
      Date.parse(bug.sentry_reopen_event_at) > Date.parse(bug.resolved_at));
  const cleanSince = bug.resolved_at ?? bug.sentry_last_checked_at;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {bug.sentry_orphaned_at ? (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700">
          Issue removida no Sentry
        </span>
      ) : null}
      {bug.sentry_sync_pending ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
          Sincronização pendente
        </span>
      ) : null}
      {reopened ? (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-black text-orange-700">
          Reaberto automaticamente: evento novo em{" "}
          {formatDate(bug.sentry_reopen_event_at as string)}
        </span>
      ) : null}
      {bug.status === "done" && !reopened && !bug.sentry_last_checked_at ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
          Aguardando verificação
        </span>
      ) : null}
      {bug.status === "done" && !reopened && bug.sentry_last_checked_at ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
          Verificado · sem eventos há {daysSince(cleanSince as string)}d
        </span>
      ) : null}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: BugSeverity }) {
  const meta = SEVERITY_META[severity];
  return <span className={`${badgeClass} ${meta.badge}`}>{meta.label}</span>;
}

type SentryErrorState =
  | { kind: "not_configured"; message: string }
  | { kind: "retryable"; message: string };

export function BugsDashboard() {
  const [tab, setTab] = useState<"sentry" | "tracker">("sentry");

  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [sentryLoading, setSentryLoading] = useState(true);
  const [sentryError, setSentryError] = useState<SentryErrorState | null>(null);
  const [statsPeriod, setStatsPeriod] = useState("14d");
  const [onlyUnresolved, setOnlyUnresolved] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);

  const [bugs, setBugs] = useState<AdminBug[]>([]);
  const [counts, setCounts] = useState<BugCounts>({
    open: 0,
    in_progress: 0,
    done: 0,
  });
  const [bugsLoading, setBugsLoading] = useState(true);
  const [bugsError, setBugsError] = useState<string | null>(null);
  // Issues que ja tem card no tracker (por shortId) e em qual coluna, para marcar
  // na aba de erros e evitar duplicatas.
  const linkedByShortId = useMemo(() => {
    const map = new Map<string, BugStatus>();
    for (const b of bugs) {
      if (b.sentry_issue_id) map.set(b.sentry_issue_id, b.status);
    }
    return map;
  }, [bugs]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBug | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBug | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<BugStatus | null>(null);

  const refreshSentry = useCallback(async () => {
    setSentryLoading(true);
    setSentryError(null);
    try {
      const page = await listSentryIssues({
        query: onlyUnresolved ? QUERY_UNRESOLVED : QUERY_ALL,
        statsPeriod,
        cursor,
      });
      setIssues(page.issues);
      setNextCursor(page.nextCursor);
      setPrevCursor(page.prevCursor);
    } catch (error) {
      if (
        error instanceof AdminApiError &&
        error.code === "sentry_not_configured"
      ) {
        setSentryError({ kind: "not_configured", message: error.message });
      } else {
        setSentryError({
          kind: "retryable",
          message:
            error instanceof Error
              ? error.message
              : "Erro ao consultar o Sentry.",
        });
      }
    } finally {
      setSentryLoading(false);
    }
  }, [onlyUnresolved, statsPeriod, cursor]);

  useEffect(() => {
    void refreshSentry();
  }, [refreshSentry]);

  const refreshBugs = useCallback(async () => {
    try {
      const data = await listBugs();
      setBugs(data.bugs);
      setCounts(data.counts);
      setBugsError(null);
    } catch (error) {
      setBugsError(
        error instanceof Error ? error.message : "Erro ao listar bugs.",
      );
    } finally {
      setBugsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBugs();
  }, [refreshBugs]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openCreateFromIssue(issue: SentryIssue) {
    setEditing(null);
    setForm({
      title: issue.title,
      description: "",
      severity: severityFromLevel(issue.level),
      sentry_issue_id: issue.shortId,
      sentry_issue_url: issue.permalink,
      sentry_numeric_id: issue.id,
    });
    setFormError(null);
    setFormOpen(true);
    setTab("tracker");
  }

  function openEdit(bug: AdminBug) {
    setEditing(bug);
    setForm({
      title: bug.title,
      description: bug.description ?? "",
      severity: bug.severity,
      sentry_issue_id: bug.sentry_issue_id,
      sentry_issue_url: bug.sentry_issue_url,
      sentry_numeric_id: bug.sentry_numeric_id,
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    const parsed = BugFormSchema.safeParse({
      title: form.title,
      description: form.description,
      severity: form.severity,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Formulário inválido.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: parsed.data.title,
        description: parsed.data.description || null,
        severity: parsed.data.severity,
      };
      if (editing) {
        await patchBug(editing.id, payload);
        toast.success("Bug atualizado.");
      } else {
        await createBug({
          ...payload,
          sentry_issue_id: form.sentry_issue_id,
          sentry_issue_url: form.sentry_issue_url,
          sentry_numeric_id: form.sentry_numeric_id,
        });
        toast.success("Bug registrado.");
      }
      setFormOpen(false);
      await refreshBugs();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Erro ao salvar o bug.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Único caminho de mudança de status (botões e drag and drop): otimista,
  // com snapshot pra reverter em erro; no sucesso o refreshBugs continua sendo
  // a fonte de verdade (traz resolved_at e counts do server).
  async function moveBug(bug: AdminBug, status: BugStatus) {
    if (bug.status === status) return;
    setMovingId(bug.id);
    const previousBugs = bugs;
    const previousCounts = counts;
    setBugs((current) =>
      current.map((b) => (b.id === bug.id ? { ...b, status } : b)),
    );
    setCounts((current) => ({
      ...current,
      [bug.status]: Math.max(0, current[bug.status] - 1),
      [status]: current[status] + 1,
    }));
    try {
      await patchBug(bug.id, { status });
      toast.success(
        status === "done" ? "Bug marcado como corrigido." : "Status atualizado.",
      );
      await refreshBugs();
    } catch (error) {
      setBugs(previousBugs);
      setCounts(previousCounts);
      toast.error(
        error instanceof Error ? error.message : "Erro ao mover o bug.",
      );
    } finally {
      setMovingId(null);
    }
  }

  function handleDrop(bugId: string, status: BugStatus) {
    setDraggingId(null);
    setDragOverStatus(null);
    const bug = bugs.find((b) => b.id === bugId);
    if (!bug || bug.status === status) return;
    void moveBug(bug, status);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBug(deleteTarget.id);
      toast.success("Bug excluído.");
      setDeleteTarget(null);
      await refreshBugs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir o bug.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function statusActions(bug: AdminBug) {
    const busy = movingId === bug.id;
    if (bug.status === "open") {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => moveBug(bug, "in_progress")}
            className={rowActionClass}
          >
            Iniciar correção
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => moveBug(bug, "done")}
            className={rowActionClass}
          >
            Concluir
          </button>
        </>
      );
    }
    if (bug.status === "in_progress") {
      return (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => moveBug(bug, "done")}
            className={rowActionClass}
          >
            Concluir
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => moveBug(bug, "open")}
            className={rowActionClass}
          >
            Voltar pra aberto
          </button>
        </>
      );
    }
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => moveBug(bug, "open")}
        className={rowActionClass}
      >
        Reabrir
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "sentry" | "tracker")}
      >
        <TabsList className="h-auto gap-1 rounded-full border-2 border-slate-900 bg-white p-1 shadow-[2px_2px_0_#0f172a]">
          <TabsTrigger
            value="sentry"
            className="rounded-full px-4 py-1.5 text-xs font-black uppercase data-[state=active]:bg-slate-950 data-[state=active]:text-white"
          >
            Erros (Sentry)
          </TabsTrigger>
          <TabsTrigger
            value="tracker"
            className="rounded-full px-4 py-1.5 text-xs font-black uppercase data-[state=active]:bg-slate-950 data-[state=active]:text-white"
          >
            Bug tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sentry" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="bugs-stats-period" className={labelClass}>
                Período
              </label>
              <BntSelect
                id="bugs-stats-period"
                size="sm"
                accent="gold"
                value={statsPeriod}
                onValueChange={(value) => {
                  setStatsPeriod(value);
                  setCursor(undefined);
                }}
                options={STATS_PERIODS}
              />
            </div>
            <div>
              <label htmlFor="bugs-sentry-filter" className={labelClass}>
                Situação
              </label>
              <BntSelect
                id="bugs-sentry-filter"
                size="sm"
                accent="gold"
                value={onlyUnresolved ? "unresolved" : "all"}
                onValueChange={(value) => {
                  setOnlyUnresolved(value === "unresolved");
                  setCursor(undefined);
                }}
                options={[
                  { value: "unresolved", label: "Não resolvidos" },
                  { value: "all", label: "Todos" },
                ]}
              />
            </div>
          </div>

          {sentryLoading ? (
            <LoadingBlock label="Consultando o Sentry..." />
          ) : sentryError?.kind === "not_configured" ? (
            <div className="rounded-2xl border-2 border-amber-600 bg-amber-50 p-6">
              <p className="text-sm font-black text-amber-900">
                Integração com o Sentry não configurada
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-800">
                {sentryError.message}
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-700">
                O bug tracker manual funciona normalmente sem essa integração.
              </p>
            </div>
          ) : sentryError ? (
            <div className="space-y-3">
              <ErrorBlock message={sentryError.message} />
              <button
                type="button"
                onClick={() => void refreshSentry()}
                className={secondaryButtonClass}
              >
                Tentar de novo
              </button>
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm font-black text-slate-500">
              Nenhum erro no período 🎉
            </div>
          ) : (
            <>
              <article className="card-brutal overflow-hidden rounded-3xl bg-white">
                <ul className="divide-y-2 divide-slate-200">
                  {issues.map((issue) => (
                    <li
                      key={issue.id}
                      className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <LevelBadge level={issue.level} />
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {issue.shortId}
                          </span>
                          {linkedByShortId.has(issue.shortId) ? (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-black text-violet-800">
                              No tracker ·{" "}
                              {STATUS_LABEL[linkedByShortId.get(issue.shortId)!]}
                            </span>
                          ) : null}
                          <p className="text-sm font-black text-slate-950">
                            {issue.title}
                          </p>
                        </div>
                        {issue.culprit ? (
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {issue.culprit}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          {issue.count.toLocaleString("pt-BR")} eventos ·{" "}
                          {issue.userCount.toLocaleString("pt-BR")} usuários ·
                          visto {timeAgo(issue.lastSeen)} · primeiro em{" "}
                          {formatDate(issue.firstSeen)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <a
                          href={issue.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className={rowActionClass}
                        >
                          Abrir no Sentry
                        </a>
                        <button
                          type="button"
                          onClick={() => openCreateFromIssue(issue)}
                          disabled={linkedByShortId.has(issue.shortId)}
                          className={`${rowActionClass} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {linkedByShortId.has(issue.shortId)
                            ? "Já no tracker"
                            : "Criar bug"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!prevCursor}
                  onClick={() => setCursor(prevCursor ?? undefined)}
                  className={secondaryButtonClass}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!nextCursor}
                  onClick={() => setCursor(nextCursor ?? undefined)}
                  className={secondaryButtonClass}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="tracker" className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={openCreate}
              className={primaryButtonClass}
            >
              Novo bug
            </button>
          </div>

          {bugsLoading ? (
            <LoadingBlock label="Carregando bugs..." />
          ) : bugsError ? (
            <div className="space-y-3">
              <ErrorBlock message={bugsError} />
              <button
                type="button"
                onClick={() => void refreshBugs()}
                className={secondaryButtonClass}
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {BOARD_COLUMNS.map((column) => {
                const columnBugs = bugs.filter(
                  (bug) => bug.status === column.status,
                );
                const draggingBug = draggingId
                  ? bugs.find((bug) => bug.id === draggingId)
                  : undefined;
                const isValidDropTarget =
                  draggingBug !== undefined &&
                  draggingBug.status !== column.status;
                const highlighted =
                  isValidDropTarget && dragOverStatus === column.status;
                return (
                  <section
                    key={column.status}
                    onDragOver={(e) => {
                      if (!isValidDropTarget) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverStatus !== column.status) {
                        setDragOverStatus(column.status);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (
                        e.relatedTarget instanceof Node &&
                        e.currentTarget.contains(e.relatedTarget)
                      ) {
                        return;
                      }
                      setDragOverStatus((current) =>
                        current === column.status ? null : current,
                      );
                    }}
                    onDrop={(e) => {
                      if (!isValidDropTarget) return;
                      e.preventDefault();
                      const id =
                        e.dataTransfer.getData("text/plain") || draggingId;
                      if (id) handleDrop(id, column.status);
                    }}
                    className={`rounded-3xl border-2 border-slate-900 p-4 shadow-[3px_3px_0_#0f172a] transition-colors ${
                      highlighted ? column.dropHighlight : column.bg
                    }`}
                  >
                    <header className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-950">
                        {column.label}
                      </h3>
                      <span className="inline-flex items-center rounded-full border-2 border-slate-900 bg-white px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                        {counts[column.status]}
                      </span>
                    </header>
                    <div className="space-y-3">
                      {columnBugs.length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-xs font-black text-slate-400">
                          Nenhum bug aqui.
                        </p>
                      ) : (
                        columnBugs.map((bug) => (
                          <article
                            key={bug.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", bug.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggingId(bug.id);
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDragOverStatus(null);
                            }}
                            className={`cursor-grab rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a] active:cursor-grabbing ${
                              draggingId === bug.id ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <SeverityBadge severity={bug.severity} />
                              <span className="text-xs font-semibold text-slate-500">
                                {timeAgo(bug.created_at)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-black text-slate-950">
                              {bug.title}
                            </p>
                            {bug.description ? (
                              <p className="mt-1 line-clamp-3 text-xs font-semibold text-slate-600">
                                {bug.description}
                              </p>
                            ) : null}
                            {bug.sentry_issue_url ? (
                              <a
                                href={bug.sentry_issue_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block font-mono text-xs font-bold text-violet-800 underline"
                              >
                                Ver no Sentry · {bug.sentry_issue_id}
                              </a>
                            ) : null}
                            {bug.status === "done" && bug.resolved_at ? (
                              <p className="mt-1 text-xs font-semibold text-emerald-700">
                                Resolvido {timeAgo(bug.resolved_at)}
                              </p>
                            ) : null}
                            <BugSentryState bug={bug} />
                            <div className="mt-3 flex flex-wrap gap-2">
                              {statusActions(bug)}
                              <button
                                type="button"
                                onClick={() => openEdit(bug)}
                                className={rowActionClass}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(bug)}
                                className={`${rowActionClass} text-rose-700`}
                              >
                                Excluir
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) setFormOpen(false);
        }}
      >
        <DialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-md">
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {editing ? "Editar bug" : "Novo bug"}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-600">
            {editing
              ? "Título, descrição e severidade podem ser alterados."
              : "Registre um bug pra acompanhar no board."}
          </DialogDescription>

          {form.sentry_issue_id ? (
            <div className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
              <p className="text-xs font-black uppercase text-violet-700">
                Vinculado ao erro {form.sentry_issue_id}
              </p>
              {form.sentry_issue_url ? (
                <a
                  href={form.sentry_issue_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-bold text-violet-800 underline"
                >
                  Abrir no Sentry
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="bug-title" className={labelClass}>
                Título ({form.title.length}/200)
              </label>
              <input
                id="bug-title"
                type="text"
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="bug-description" className={labelClass}>
                Descrição (opcional)
              </label>
              <textarea
                id="bug-description"
                rows={4}
                maxLength={5000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="bug-severity" className={labelClass}>
                Severidade
              </label>
              <BntSelect
                id="bug-severity"
                size="sm"
                accent="gold"
                value={form.severity}
                onValueChange={(value) =>
                  setForm({ ...form, severity: value as BugSeverity })
                }
                options={BOARD_SEVERITY_OPTIONS}
              />
            </div>
          </div>

          {formError ? (
            <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className={primaryButtonClass}
            >
              {saving ? "Salvando..." : editing ? "Salvar" : "Registrar bug"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
          <AlertDialogTitle className="font-display text-2xl font-black text-slate-950">
            Excluir bug?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-semibold text-slate-600">
            {deleteTarget
              ? `"${deleteTarget.title}" será removido de vez, sem histórico.`
              : ""}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className={secondaryButtonClass}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="rounded-full border-2 border-slate-900 bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0_#0f172a] transition-all hover:bg-rose-700 disabled:opacity-50"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
