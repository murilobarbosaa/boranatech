import { memo, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArchiveRestore,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
} from "lucide-react";

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

/**
 * Distancia, em pixels, acima da qual um ponteiro que desceu e subiu no card
 * conta como ARRASTO e nao como clique.
 *
 * Tem que ser >= a `activationConstraint.distance` do PointerSensor: o dnd-kit
 * ainda emite o `click` no fim de um arrasto, e sem esta checagem todo drag
 * terminaria abrindo a tarefa. Manter os dois numeros iguais e proposital, e
 * mexer em um sem mexer no outro reabre exatamente esse bug.
 */
export const DRAG_ACTIVATION_DISTANCE = 5;

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
  /**
   * Reordenar DENTRO da coluna e ambíguo com filtro ligado ou agrupamento
   * diferente de etapa. Quando falso, o card ainda arrasta entre containers, mas
   * o drop na mesma coluna vira no-op. Ver o comentario em handleDragEnd.
   */
  canReorder: boolean;
  onOpen: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
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

/** Conteudo do card, reusado pelo DragOverlay (que nao e sortable). */
export function TaskCardBody({
  task,
  boardKey,
  labelsById,
  assigneesById,
}: Pick<TaskCardProps, "task" | "boardKey" | "labelsById" | "assigneesById">) {
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
    <>
      <p
        className={`mt-1.5 text-sm font-black leading-snug ${
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
    </>
  );
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
  canReorder,
  onOpen,
  onQuickMove,
  onUnarchive,
}: TaskCardProps) {
  const archived = Boolean(task.archived_at);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    // Tarefa otimista ainda sem id real nao pode ser arrastada: o move iria para
    // um id que o servidor nao conhece.
    disabled: task.id.startsWith("temp-"),
    data: { type: "task", columnId: task.column_id },
    // O padrao do dnd-kit e "sortable", em ingles, e vira aria-roledescription.
    attributes: { roleDescription: "tarefa arrastável" },
  });

  // Coordenadas do pointerdown, para separar clique de arrasto no pointerup.
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  function isDragGesture(clientX: number, clientY: number) {
    const start = pointerStart.current;
    if (!start) return false;
    return (
      Math.abs(clientX - start.x) > DRAG_ACTIVATION_DISTANCE ||
      Math.abs(clientY - start.y) > DRAG_ACTIVATION_DISTANCE
    );
  }

  return (
    <article
      ref={setNodeRef}
      // `attributes` do dnd-kit ja traz role, tabIndex e aria-roledescription;
      // declarar role/tabIndex aqui seria sobrescrito por ele. O aria-label vem
      // DEPOIS do spread justamente para nao ser engolido.
      {...attributes}
      {...listeners}
      aria-label={`${shortIdOf(boardKey, task.number)}: ${task.title}`}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
        listeners?.onPointerDown?.(event);
      }}
      onClick={(event) => {
        // O dnd-kit emite `click` tambem no fim de um arrasto. Abrir a tarefa
        // aqui faria todo drag terminar com o modal na cara.
        if (isDragGesture(event.clientX, event.clientY)) return;
        onOpen(task.id);
      }}
      onKeyDown={(event) => {
        // Espaco e Enter sao do KeyboardSensor durante o arrasto por teclado; so
        // abrimos a tarefa com Enter e quando nao ha arrasto em curso.
        if (event.key === "Enter" && !isDragging) {
          event.preventDefault();
          onOpen(task.id);
        }
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group relative touch-none rounded-2xl border-2 p-3 text-left shadow-[3px_3px_0_#0f172a] transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:cursor-grabbing ${
        archived
          ? "border-dashed border-slate-400 bg-slate-100"
          : "border-slate-900 bg-white"
      } ${canReorder ? "cursor-grab" : "cursor-pointer"} ${
        isSelected ? "ring-4 ring-violet-300" : ""
      } ${isPending ? "opacity-60" : ""} ${
        // O card original vira o PLACEHOLDER do destino enquanto o DragOverlay
        // carrega a copia levantada.
        isDragging ? "opacity-30" : ""
      }`}
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
          {archived ? (
            <button
              type="button"
              aria-label="Desarquivar tarefa"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onUnarchive(task.id);
              }}
              className="rounded-full border-2 border-slate-900 bg-white p-0.5 text-slate-900 shadow-[1px_1px_0_#0f172a]"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Mover para a etapa anterior"
            disabled={!canMoveLeft}
            // stopPropagation no pointerdown: sem isso o gesto comecaria a
            // arrastar o card a partir do botao.
            onPointerDown={(event) => event.stopPropagation()}
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
            onPointerDown={(event) => event.stopPropagation()}
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

      <TaskCardBody
        task={task}
        boardKey={boardKey}
        labelsById={labelsById}
        assigneesById={assigneesById}
      />
    </article>
  );
}

// memo: mover UM card nao pode re-renderizar o board inteiro. As props sao
// primitivas ou referencias estaveis (os handlers vem de useCallback no
// TasksDashboard, e os mapas de useMemo).
export const TaskCard = memo(TaskCardBase);
