import { memo } from "react";

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
  onOpenTask: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
  onCreateTask: (
    columnId: string,
    title: string,
    placement: "top" | "bottom",
  ) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onRecolorColumn: (columnId: string, color: string) => void;
  onSetWipLimit: (columnId: string, wipLimit: number | null) => void;
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
  onOpenTask,
  onQuickMove,
  onCreateTask,
  onRenameColumn,
  onRecolorColumn,
  onSetWipLimit,
  onMoveColumn,
  onRequestDeleteColumn,
}: BoardColumnProps) {
  const accent = safeHexColor(column.color, COLUMN_COLOR_FALLBACK);

  return (
    <section
      // Largura fixa + snap: no mobile a coluna encaixa na viewport ao arrastar
      // o scroll horizontal, em vez de parar no meio de duas.
      className="flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border-2 border-slate-900 bg-slate-50 p-3 shadow-[3px_3px_0_#0f172a] sm:w-[19rem]"
      style={{ borderTopColor: accent, borderTopWidth: 6 }}
      aria-label={`Etapa ${column.name}`}
    >
      <ColumnHeader
        column={column}
        taskCount={tasks.length}
        canMoveLeft={canMoveLeft}
        canMoveRight={canMoveRight}
        onRename={onRenameColumn}
        onRecolor={onRecolorColumn}
        onSetWipLimit={onSetWipLimit}
        onMoveColumn={onMoveColumn}
        onRequestDelete={onRequestDeleteColumn}
      />

      <div className="mb-2">
        <NewTaskComposer
          columnId={column.id}
          placement="top"
          onCreate={onCreateTask}
        />
      </div>

      {/* Scroll vertical proprio, com teto relativo a viewport: a coluna cresce
          ate ali e depois rola por dentro, em vez de esticar a pagina. */}
      <div className="flex max-h-[calc(100vh-22rem)] flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <p className={emptyBlockClass}>
            Nenhuma tarefa nesta etapa.
            <br />
            <span className="font-semibold text-slate-400">
              Use “Nova tarefa” acima.
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
