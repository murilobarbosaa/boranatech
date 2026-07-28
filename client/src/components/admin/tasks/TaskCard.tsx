import { memo } from "react";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

import {
  badgeClass,
  priorityMetaOf,
  safeHexColor,
  typeMetaOf,
  LABEL_COLOR_FALLBACK,
} from "./taskBoardStyles";
import { shortIdOf } from "./taskDeepLink";
import type { TaskAssignee, TaskCard as TaskCardData, TaskLabel } from "./types";

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
  canMoveLeft: boolean;
  canMoveRight: boolean;
  isSelected: boolean;
  isPending: boolean;
  onOpen: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
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

function TaskCardBase({
  task,
  boardKey,
  labelsById,
  assigneesById,
  canMoveLeft,
  canMoveRight,
  isSelected,
  isPending,
  onOpen,
  onQuickMove,
}: TaskCardProps) {
  const priority = priorityMetaOf(task.priority);
  const type = typeMetaOf(task.type);
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
    <article
      role="button"
      tabIndex={0}
      aria-label={`${shortIdOf(boardKey, task.number)}: ${task.title}`}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task.id);
        }
      }}
      className={`group relative cursor-pointer rounded-2xl border-2 border-slate-900 bg-white p-3 text-left shadow-[3px_3px_0_#0f172a] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
        isSelected ? "ring-4 ring-violet-300" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-slate-500">
          {shortIdOf(boardKey, task.number)}
        </span>
        {/* Setas sempre no DOM: em touch nao existe hover, entao o avanco rapido
            seria inalcancavel se dependesse dele. No ponteiro fino elas ficam
            discretas e ganham opacidade no hover/foco do card.
            NAO desabilitam durante `isPending`: avancar duas etapas e dois
            cliques seguidos, e travar o segundo ate a rede responder faz o board
            parecer quebrado. Quem cuida da corrida e o contador de sequencia por
            tarefa no TasksDashboard; `isPending` aqui e so o sinal visual. */}
        <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <button
            type="button"
            aria-label="Mover para a etapa anterior"
            disabled={!canMoveLeft}
            onClick={(event) => {
              event.stopPropagation();
              onQuickMove(task.id, -1);
            }}
            className="rounded-full border-2 border-slate-900 bg-white p-0.5 text-slate-900 shadow-[1px_1px_0_#0f172a] disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Mover para a próxima etapa"
            disabled={!canMoveRight}
            onClick={(event) => {
              event.stopPropagation();
              onQuickMove(task.id, 1);
            }}
            className="rounded-full border-2 border-slate-900 bg-white p-0.5 text-slate-900 shadow-[1px_1px_0_#0f172a] disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-sm font-black leading-snug text-slate-950">
        {task.title}
      </p>

      {labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full border border-slate-900 px-1.5 py-0.5 text-[10px] font-black text-slate-900"
              style={{
                backgroundColor: safeHexColor(label.color, LABEL_COLOR_FALLBACK),
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`${badgeClass} ${priority.badge}`}>{priority.label}</span>
        <span className={`${badgeClass} ${type.badge}`}>{type.label}</span>
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
          {task.comment_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comment_count}
            </span>
          ) : null}
          {assignee ? (
            <span
              title={assignee.name ?? assignee.email ?? ""}
              className="ml-auto inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-[#FFB800] text-[10px] font-black text-slate-950"
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
    </article>
  );
}

// memo: mover UM card nao pode re-renderizar o board inteiro. As props sao
// primitivas ou referencias estaveis (os handlers vem de useCallback no
// TasksDashboard, e `labels` de um useMemo por task).
export const TaskCard = memo(TaskCardBase);
