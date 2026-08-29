import { memo, useMemo } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Zap } from "lucide-react";

import { ColumnHeader } from "./ColumnHeader";
import { NewTaskComposer } from "./NewTaskComposer";
import { TaskCard } from "./TaskCard";
import {
  COLUMN_COLOR_FALLBACK,
  columnShellClass,
  emptyBlockClass,
  safeHexColor,
} from "./taskBoardStyles";
import type { TaskGroup } from "./taskFilters";
import type { TaskAssignee, TaskColumn, TaskLabel } from "./types";

// Container de um grupo do board. Com agrupamento por ETAPA ele e a coluna, com
// cabecalho editavel, menu e alca de arrasto; com agrupamento por responsavel ou
// prioridade e so uma caixa com titulo, porque nao existe "renomear a prioridade
// alta".
//
// `column` nulo e exatamente esse segundo caso, e e o que decide o que aparece.

type BoardColumnProps = {
  group: TaskGroup;
  /** Nao-nulo apenas quando o agrupamento e por etapa. */
  column: TaskColumn | null;
  boardKey: string;
  labelsById: Map<string, TaskLabel>;
  assigneesById: Map<string, TaskAssignee>;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  selectedTaskId: string | null;
  pendingTaskIds: ReadonlySet<string>;
  isDropTarget: boolean;
  /** Falso com filtro ativo ou agrupamento fora de etapa. */
  canReorder: boolean;
  /** Ha filtro ligado: muda o texto do estado vazio. */
  filtersActive: boolean;
  onOpenTask: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
  onUnarchive: (taskId: string) => void;
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
  onClearFilters: () => void;
};

function BoardColumnBase({
  group,
  column,
  boardKey,
  labelsById,
  assigneesById,
  canMoveLeft,
  canMoveRight,
  selectedTaskId,
  pendingTaskIds,
  isDropTarget,
  canReorder,
  filtersActive,
  onOpenTask,
  onQuickMove,
  onUnarchive,
  onCreateTask,
  onRenameColumn,
  onRecolorColumn,
  onRequestWipLimit,
  onMoveColumn,
  onRequestDeleteColumn,
  onClearFilters,
}: BoardColumnProps) {
  const accent = safeHexColor(group.color, COLUMN_COLOR_FALLBACK);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group.id,
    // So a coluna de verdade e arrastavel. Um grupo de prioridade nao tem ordem
    // propria para reordenar.
    disabled: column === null,
    data: { type: "column" },
    attributes: { roleDescription: "etapa arrastável" },
  });

  const taskIds = useMemo(() => group.tasks.map((task) => task.id), [group.tasks]);

  const overWip =
    column?.is_pinned !== true &&
    column?.wip_limit != null &&
    group.totalBeforeFilter > column.wip_limit;
  const filtered = group.tasks.length < group.totalBeforeFilter;

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderTopColor: accent,
        borderTopWidth: 6,
      }}
      className={`${columnShellClass} ${isDragging ? "opacity-40" : ""} ${
        isDropTarget
          ? overWip
            ? "bg-rose-100 ring-4 ring-rose-400"
            : "bg-violet-50 ring-4 ring-violet-300"
          : "bg-slate-50"
      }`}
      aria-label={`Etapa ${group.label}`}
    >
      {column ? (
        <div className="flex items-start gap-1">
          {/* Alca dedicada: se a coluna inteira fosse a alca, comecar um arrasto
              de card ou clicar no menu tambem arrastaria a coluna. */}
          <button
            type="button"
            aria-label={
              column.is_pinned
                ? `A etapa ${column.name} é fixa e não pode ser reordenada`
                : `Reordenar a etapa ${column.name}`
            }
            disabled={column.is_pinned}
            className={`mt-0.5 shrink-0 touch-none rounded ${
              column.is_pinned
                ? "cursor-default text-slate-300"
                : "cursor-grab text-slate-400 hover:text-slate-900 active:cursor-grabbing"
            }`}
            {...(column.is_pinned ? {} : attributes)}
            {...(column.is_pinned ? {} : listeners)}
          >
            {column.is_pinned ? (
              <Zap className="h-4 w-4" />
            ) : (
              <GripVertical className="h-4 w-4" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <ColumnHeader
              column={column}
              taskCount={group.tasks.length}
              totalBeforeFilter={group.totalBeforeFilter}
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
      ) : (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-black uppercase tracking-wide text-slate-950">
            {group.label}
          </h3>
          <span className="inline-flex items-center rounded-full border-2 border-slate-900 bg-white px-2 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)]">
            {filtered
              ? `${group.tasks.length} de ${group.totalBeforeFilter}`
              : group.tasks.length}
          </span>
        </header>
      )}

      {/* Etapa fixada NAO oferece entrada manual. O servidor recusa (409
          column_pinned_intake), e a interface nao pode convidar para o erro: um
          botao que sempre falha e pior que a ausencia dele. A semantica "aqui so
          entra o que o Sentry trouxe, e ninguem triou" e o que autoriza o job a
          arquivar e ressuscitar sozinho. */}
      {column && !column.is_pinned ? (
        <div className="mb-2">
          <NewTaskComposer
            columnId={column.id}
            placement="top"
            onCreate={onCreateTask}
          />
        </div>
      ) : null}

      {/* `overflow-x-hidden` EXPLICITO ao lado do `overflow-y-auto`. Pela spec
          de overflow, um eixo `visible` ao lado de um eixo que nao e `visible`
          computa para `auto`: so o `overflow-y-auto` ja criava um
          `overflow-x: auto` silencioso aqui, e era ele a barra horizontal que
          aparecia na coluna quando um card estourava a largura. */}
      <div className="flex max-h-[calc(100vh-22rem)] min-h-[4rem] flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-0.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {group.tasks.length === 0 ? (
            // Coluna vazia e coluna FILTRADA a zero sao coisas diferentes, e
            // confundir as duas faz a pessoa achar que perdeu tarefas.
            filtersActive ? (
              <div className={emptyBlockClass}>
                Nada bate com os filtros.
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="mt-1.5 block w-full text-[11px] font-black text-violet-700 hover:text-violet-900"
                >
                  limpar filtros
                </button>
              </div>
            ) : (
              <p className={emptyBlockClass}>
                Nenhuma tarefa nesta etapa.
                <br />
                <span className="font-semibold text-slate-400">
                  {column?.is_pinned
                    ? "O Sentry ainda não trouxe nada. Esta etapa é alimentada automaticamente."
                    : column
                      ? "Arraste um card para cá ou use “Nova tarefa”."
                      : "Arraste um card para cá."}
                </span>
              </p>
            )
          ) : (
            group.tasks.map((task) => (
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
                canReorder={canReorder}
                onOpen={onOpenTask}
                onQuickMove={onQuickMove}
                onUnarchive={onUnarchive}
              />
            ))
          )}
        </SortableContext>
      </div>

      {column ? (
        <div className="mt-2">
          <NewTaskComposer
            columnId={column.id}
            placement="bottom"
            onCreate={onCreateTask}
          />
        </div>
      ) : null}
    </section>
  );
}

export const BoardColumn = memo(BoardColumnBase);
