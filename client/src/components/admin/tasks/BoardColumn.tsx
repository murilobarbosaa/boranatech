import { memo, useMemo } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { ColumnHeader } from "./ColumnHeader";
import { NewTaskComposer } from "./NewTaskComposer";
import { TaskCard } from "./TaskCard";
import {
  COLUMN_COLOR_FALLBACK,
  emptyBlockClass,
  safeHexColor,
} from "./taskBoardStyles";
import type {
  TaskAssignee,
  TaskCard as TaskCardData,
  TaskColumn,
  TaskLabel,
} from "./types";

type BoardColumnProps = {
  column: TaskColumn;
  tasks: TaskCardData[];
  boardKey: string;
  labelsById: Map<string, TaskLabel>;
  assigneesById: Map<string, TaskAssignee>;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  selectedTaskId: string | null;
  pendingTaskIds: ReadonlySet<string>;
  /** Alvo do arrasto em curso: destaca a coluna que vai receber o card. */
  isDropTarget: boolean;
  onOpenTask: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
  onCreateTask: (
    columnId: string,
    title: string,
    placement: "top" | "bottom",
  ) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onRecolorColumn: (columnId: string, color: string) => void;
  onRequestWipLimit: (columnId: string) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onRequestDeleteColumn: (columnId: string) => void;
};

function BoardColumnBase({
  column,
  tasks,
  boardKey,
  labelsById,
  assigneesById,
  canMoveLeft,
  canMoveRight,
  selectedTaskId,
  pendingTaskIds,
  isDropTarget,
  onOpenTask,
  onQuickMove,
  onCreateTask,
  onRenameColumn,
  onRecolorColumn,
  onRequestWipLimit,
  onMoveColumn,
  onRequestDeleteColumn,
}: BoardColumnProps) {
  const accent = safeHexColor(column.color, COLUMN_COLOR_FALLBACK);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
    attributes: { roleDescription: "etapa arrastável" },
  });

  // Array de ids ESTAVEL enquanto a lista nao muda: o SortableContext compara
  // por identidade e uma referencia nova a cada render faria todos os itens
  // reavaliarem posicao a cada pixel do arrasto.
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  const overWip = column.wip_limit !== null && tasks.length > column.wip_limit;

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderTopColor: accent,
        borderTopWidth: 6,
      }}
      // Largura fixa + snap: no mobile a coluna encaixa na viewport ao arrastar
      // o scroll horizontal, em vez de parar no meio de duas.
      className={`flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border-2 border-slate-900 p-3 shadow-[3px_3px_0_#0f172a] transition-colors sm:w-[19rem] ${
        isDragging ? "opacity-40" : ""
      } ${
        // WIP estourado SINALIZA no hover de arrasto, nao bloqueia: o server
        // aceita a movimentacao de qualquer jeito, e uma coluna que recusa card
        // em silencio seria pior do que uma que avisa.
        isDropTarget
          ? overWip
            ? "bg-rose-100 ring-4 ring-rose-400"
            : "bg-violet-50 ring-4 ring-violet-300"
          : "bg-slate-50"
      }`}
      aria-label={`Etapa ${column.name}`}
    >
      <div className="flex items-start gap-1">
        {/* Alca dedicada para arrastar a COLUNA. Se a coluna inteira fosse a
            alca, comecar um arrasto de card ou clicar no menu tambem arrastaria
            a coluna. */}
        <button
          type="button"
          aria-label={`Reordenar a etapa ${column.name}`}
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded text-slate-400 hover:text-slate-900 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <ColumnHeader
            column={column}
            taskCount={tasks.length}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onRename={onRenameColumn}
            onRecolor={onRecolorColumn}
            onRequestWipLimit={onRequestWipLimit}
            onMoveColumn={onMoveColumn}
            onRequestDelete={onRequestDeleteColumn}
          />
        </div>
      </div>

      <div className="mb-2">
        <NewTaskComposer
          columnId={column.id}
          placement="top"
          onCreate={onCreateTask}
        />
      </div>

      {/* Scroll vertical proprio, com teto relativo a viewport: a coluna cresce
          ate ali e depois rola por dentro, em vez de esticar a pagina. */}
      <div className="flex max-h-[calc(100vh-22rem)] min-h-[4rem] flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className={emptyBlockClass}>
              Nenhuma tarefa nesta etapa.
              <br />
              <span className="font-semibold text-slate-400">
                Arraste um card para cá ou use “Nova tarefa”.
              </span>
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                boardKey={boardKey}
                labelsById={labelsById}
                assigneesById={assigneesById}
                canMoveLeft={canMoveLeft}
                canMoveRight={canMoveRight}
                isSelected={selectedTaskId === task.id}
                isPending={pendingTaskIds.has(task.id)}
                onOpen={onOpenTask}
                onQuickMove={onQuickMove}
              />
            ))
          )}
        </SortableContext>
      </div>

      <div className="mt-2">
        <NewTaskComposer
          columnId={column.id}
          placement="bottom"
          onCreate={onCreateTask}
        />
      </div>
    </section>
  );
}

export const BoardColumn = memo(BoardColumnBase);
