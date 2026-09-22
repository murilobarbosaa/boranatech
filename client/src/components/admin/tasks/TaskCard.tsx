import { memo } from "react";
import {
  ArchiveRestore,
  CalendarDays,
  CheckSquare,
  Clock,
  MessageSquare,
} from "lucide-react";

import { arquivamentoMetaOf, origemMetaOf } from "./sentryMeta";
import {
  badgeClass,
  LABEL_COLOR_FALLBACK,
  priorityMetaOf,
  safeHexColor,
  typeMetaOf,
} from "./taskBoardStyles";
import { shortIdOf } from "./taskDeepLink";
import { taskMoveDestinations } from "./taskMoveDestinations";
import type {
  TaskAssignee,
  TaskCard as TaskCardData,
  TaskLabel,
} from "./types";

// Card do board. Tudo aqui e OPCIONAL menos o ID curto e o titulo: campo vazio
// simplesmente nao renderiza, em vez de deixar slot vazio ocupando altura. Um
// card so com titulo tem que parecer inteiro, nao quebrado.

type TaskCardProps = {
  task: TaskCardData;
  boardKey: string;
  // Mapas e nao arrays derivados: um `labels={task.label_ids.map(...)}` montado
  // no pai criaria referencia nova a cada render e o memo abaixo nunca casaria,
  // ou seja, todo card da coluna re-renderizaria a cada movimento. Os dois mapas
  // vem de useMemo no TasksDashboard e so mudam quando o snapshot muda.
  labelsById: Map<string, TaskLabel>;
  assigneesById: Map<string, TaskAssignee>;
  columns: { id: string; name: string; is_pinned: boolean }[];
  isSelected: boolean;
  isPending: boolean;
  onOpen: (taskId: string) => void;
  onMove: (taskId: string, columnId: string) => void;
  onUnarchive: (taskId: string) => void;
};

/** Vencimento em AAAA-MM-DD comparado com HOJE no fuso local, sem virar Date. */
function dueState(dueDate: string | null): "none" | "late" | "today" | "ahead" {
  if (!dueDate) return "none";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dueDate < today) return "late";
  if (dueDate === today) return "today";
  return "ahead";
}

function formatDue(dueDate: string) {
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

function initialsOf(assignee: TaskAssignee) {
  const source = assignee.name?.trim() || assignee.email?.trim() || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Conteúdo legível e selecionável do card. */
export function TaskCardBody({
  task,
  boardKey,
  labelsById,
  assigneesById,
}: Pick<TaskCardProps, "task" | "boardKey" | "labelsById" | "assigneesById">) {
  const priority = priorityMetaOf(task.priority);
  const type = typeMetaOf(task.type);
  const origem = origemMetaOf(task.source);
  // So desenha o selo de arquivamento quando o card ESTA arquivado: com o toggle
  // de arquivadas ligado, silenciado e podado precisam ser distinguiveis, porque
  // um nunca volta e o outro volta na proxima recorrencia.
  const arquivamento = task.archived_at
    ? arquivamentoMetaOf(task.archived_source)
    : null;
  const due = dueState(task.due_date);
  // Etiqueta que sumiu do quadro (excluida enquanto a tela estava aberta) some
  // do card em vez de virar `undefined.name`.
  const labels = task.label_ids
    .map((id) => labelsById.get(id))
    .filter((label): label is TaskLabel => label !== undefined);
  const assignee = task.assignee_id
    ? (assigneesById.get(task.assignee_id) ?? null)
    : null;

  return (
    <>
      {/* `anywhere` e NAO `break-words`: os dois quebram o token na hora de
          desenhar, mas so o `anywhere` entra no calculo do min-content. Como o
          card e item de flex, e o min-content dele que define ate onde ele pode
          encolher, entao com `break-words` o texto quebraria e o card
          continuaria largo do mesmo jeito. Titulo do Sentry e o caso real:
          `window.webkit.messageHandlers...` nao tem um espaco. */}
      <p
        className={`mt-1.5 text-sm font-black leading-snug [overflow-wrap:anywhere] ${
          task.archived_at ? "text-slate-500 line-through" : "text-slate-950"
        }`}
      >
        {task.title}
      </p>

      {labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full border border-slate-900 px-1.5 py-0.5 text-[10px] font-black text-slate-900 [overflow-wrap:anywhere]"
              style={{
                backgroundColor: safeHexColor(
                  label.color,
                  LABEL_COLOR_FALLBACK,
                ),
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`${badgeClass} ${priority.badge}`}>
          {priority.label}
        </span>
        <span className={`${badgeClass} ${type.badge}`}>{type.label}</span>
        {/* Selos do feed. DISCRETOS e SO QUANDO VALEM: um selo permanente em 22
            cards vira textura de fundo e para de ser sinal. */}
        {origem.selo ? (
          <span
            className={`${badgeClass} bg-slate-900 text-white`}
            title={
              task.sentry_issue_id
                ? `Criado pelo feed automático a partir de ${task.sentry_issue_id}`
                : "Criado automaticamente"
            }
          >
            {origem.selo}
          </span>
        ) : null}
        {task.sentry_reopen_event_at ? (
          <span
            className={`${badgeClass} bg-amber-100 text-amber-900`}
            title="O erro voltou a acontecer depois de resolvido ou arquivado"
          >
            Voltou
          </span>
        ) : null}
        {task.sentry_detalhe_incompleto ? (
          <span
            className={`${badgeClass} bg-slate-200 text-slate-700`}
            title="Não foi possível ler todo o detalhe no Sentry. A próxima manutenção completa."
          >
            Detalhe parcial
          </span>
        ) : null}
        {arquivamento ? (
          <span
            className={`${badgeClass} bg-slate-100 text-slate-600`}
            title={arquivamento.descricao}
          >
            {arquivamento.rotulo}
          </span>
        ) : null}
      </div>

      {task.due_date ||
      task.checklist_total > 0 ||
      task.comment_count > 0 ||
      assignee ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
          {task.due_date ? (
            <span
              className={`inline-flex items-center gap-1 ${
                due === "late"
                  ? "rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-800"
                  : due === "today"
                    ? "rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-900"
                    : ""
              }`}
            >
              <CalendarDays className="h-3 w-3" />
              {formatDue(task.due_date)}
            </span>
          ) : null}
          {task.checklist_total > 0 ? (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {task.checklist_done}/{task.checklist_total}
            </span>
          ) : null}
          {task.estimate !== null ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimate}h
            </span>
          ) : null}
          {task.comment_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comment_count}
            </span>
          ) : null}
          {assignee ? (
            <span
              title={assignee.name ?? assignee.email ?? ""}
              className="ml-auto inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-[var(--brand-yellow)] text-[10px] font-black text-ink-on-accent"
            >
              {assignee.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initialsOf(assignee)
              )}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function TaskCardBase({
  task,
  boardKey,
  labelsById,
  assigneesById,
  columns,
  isSelected,
  isPending,
  onOpen,
  onMove,
  onUnarchive,
}: TaskCardProps) {
  const archived = Boolean(task.archived_at);
  const destinations = taskMoveDestinations(columns, task.column_id);

  return (
    <article
      data-task-id={task.id}
      aria-label={`${shortIdOf(boardKey, task.number)}: ${task.title}`}
      className={`group relative min-w-0 max-w-full shrink-0 overflow-hidden rounded-2xl border-2 p-3 text-left shadow-[3px_3px_0_var(--bnt-shadow)] ${
        archived
          ? "border-dashed border-slate-400 bg-slate-100"
          : "border-slate-900 bg-white"
      } ${isSelected ? "ring-4 ring-violet-300" : ""} ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-slate-500">
          {shortIdOf(boardKey, task.number)}
        </span>
        {archived ? (
          <button
            type="button"
            aria-label="Desarquivar tarefa"
            onClick={() => onUnarchive(task.id)}
            className="min-h-10 rounded-xl border-2 border-slate-900 bg-white px-2 text-slate-900 focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ArchiveRestore className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <TaskCardBody
        task={task}
        boardKey={boardKey}
        labelsById={labelsById}
        assigneesById={assigneesById}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="min-h-10 rounded-xl border-2 border-slate-900 bg-white px-3 text-xs font-black text-slate-900 focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Abrir tarefa
        </button>
        {destinations.length > 0 ? (
          <label className="flex min-w-0 items-center gap-2 text-xs font-black text-slate-900">
            Mover para
            <select
              aria-label={`Mover ${shortIdOf(boardKey, task.number)} para`}
              value=""
              disabled={isPending || task.id.startsWith("temp-")}
              onChange={(event) => {
                if (event.target.value) onMove(task.id, event.target.value);
              }}
              className="min-h-10 max-w-[10rem] rounded-xl border-2 border-slate-900 bg-white px-2 text-xs focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <option value="">Escolha a etapa</option>
              {destinations.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {isPending ? (
          <span role="status" className="text-xs font-semibold">
            Movendo…
          </span>
        ) : null}
      </div>
    </article>
  );
}

// memo: mover UM card nao pode re-renderizar o board inteiro. As props sao
// primitivas ou referencias estaveis (os handlers vem de useCallback no
// TasksDashboard, e os mapas de useMemo).
export const TaskCard = memo(TaskCardBase);
