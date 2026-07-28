import { memo } from "react";
import { ArchiveRestore, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  LABEL_COLOR_FALLBACK,
  badgeClass,
  emptyBlockClass,
  priorityMetaOf,
  safeHexColor,
  typeMetaOf,
} from "./taskBoardStyles";
import { shortIdOf } from "./taskDeepLink";
import type { TaskGroup } from "./taskFilters";
import type { TaskAssignee, TaskLabel } from "./types";

// Visao em lista. Respeita o MESMO agrupamento, filtro e busca do board, abre o
// MESMO modal e reaproveita as MESMAS funcoes de acao. Nao ha estado proprio
// aqui: e outra apresentacao dos mesmos grupos que o board recebe.
//
// Nao ha arrasto na lista, de propósito: a lista serve para varrer volume, e
// arrastar linha de tabela e pior do que os botoes de avanco em qualquer
// dispositivo.

type TaskListViewProps = {
  groups: TaskGroup[];
  boardKey: string;
  labelsById: Map<string, TaskLabel>;
  assigneesById: Map<string, TaskAssignee>;
  columnCount: number;
  columnIndexOf: (columnId: string) => number;
  selectedTaskId: string | null;
  filtersActive: boolean;
  onOpenTask: (taskId: string) => void;
  onQuickMove: (taskId: string, direction: -1 | 1) => void;
  onUnarchive: (taskId: string) => void;
  onClearFilters: () => void;
};

function TaskListViewBase({
  groups,
  boardKey,
  labelsById,
  assigneesById,
  columnCount,
  columnIndexOf,
  selectedTaskId,
  filtersActive,
  onOpenTask,
  onQuickMove,
  onUnarchive,
  onClearFilters,
}: TaskListViewProps) {
  const total = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  if (total === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-black text-slate-600">
          {filtersActive
            ? "Nenhuma tarefa bate com os filtros."
            : "Nenhuma tarefa neste quadro."}
        </p>
        {filtersActive ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) =>
        group.tasks.length === 0 ? null : (
          <section key={group.id}>
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-600">
              {group.color ? (
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full border border-slate-900"
                  style={{ backgroundColor: group.color }}
                />
              ) : null}
              {group.label}
              <span className="text-slate-400">
                {group.tasks.length < group.totalBeforeFilter
                  ? `${group.tasks.length} de ${group.totalBeforeFilter}`
                  : group.tasks.length}
              </span>
            </h3>

            <ul className="card-brutal divide-y-2 divide-slate-200 overflow-hidden rounded-2xl bg-white">
              {group.tasks.map((task) => {
                const priority = priorityMetaOf(task.priority);
                const type = typeMetaOf(task.type);
                const assignee = task.assignee_id
                  ? assigneesById.get(task.assignee_id)
                  : null;
                const index = columnIndexOf(task.column_id);
                const archived = Boolean(task.archived_at);

                return (
                  <li
                    key={task.id}
                    className={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-slate-50 ${
                      selectedTaskId === task.id ? "bg-violet-50" : ""
                    } ${archived ? "opacity-60" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">
                        {shortIdOf(boardKey, task.number)}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm font-black text-slate-950 ${
                          archived ? "line-through" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.label_ids.slice(0, 3).map((id) => {
                        const label = labelsById.get(id);
                        return label ? (
                          <span
                            key={id}
                            className="hidden shrink-0 rounded-full border border-slate-900 px-1.5 py-0.5 text-[10px] font-black text-slate-900 sm:inline"
                            style={{
                              backgroundColor: safeHexColor(
                                label.color,
                                LABEL_COLOR_FALLBACK,
                              ),
                            }}
                          >
                            {label.name}
                          </span>
                        ) : null;
                      })}
                      <span className={`hidden shrink-0 sm:inline ${badgeClass} ${priority.badge}`}>
                        {priority.label}
                      </span>
                      <span className={`hidden shrink-0 lg:inline ${badgeClass} ${type.badge}`}>
                        {type.label}
                      </span>
                      {task.due_date ? (
                        <span className="hidden shrink-0 items-center gap-1 text-[11px] font-bold text-slate-500 sm:inline-flex">
                          <CalendarDays className="h-3 w-3" />
                          {task.due_date.slice(8, 10)}/{task.due_date.slice(5, 7)}
                        </span>
                      ) : null}
                      {task.estimate !== null ? (
                        <span className="hidden shrink-0 text-[11px] font-bold text-slate-500 lg:inline">
                          {task.estimate}h
                        </span>
                      ) : null}
                      {assignee ? (
                        <span className="hidden shrink-0 text-[11px] font-bold text-slate-500 lg:inline">
                          {assignee.name ?? assignee.email}
                        </span>
                      ) : null}
                    </button>

                    <div className="flex shrink-0 gap-1">
                      {archived ? (
                        <button
                          type="button"
                          aria-label={`Desarquivar ${shortIdOf(boardKey, task.number)}`}
                          onClick={() => onUnarchive(task.id)}
                          className="rounded-full border-2 border-slate-900 bg-white p-1 text-slate-900 shadow-[1px_1px_0_#0f172a]"
                        >
                          <ArchiveRestore className="h-3 w-3" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label="Mover para a etapa anterior"
                            disabled={index <= 0}
                            onClick={() => onQuickMove(task.id, -1)}
                            className="rounded-full border-2 border-slate-900 bg-white p-1 text-slate-900 shadow-[1px_1px_0_#0f172a] disabled:opacity-30 disabled:shadow-none"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Mover para a próxima etapa"
                            disabled={index < 0 || index >= columnCount - 1}
                            onClick={() => onQuickMove(task.id, 1)}
                            className="rounded-full border-2 border-slate-900 bg-white p-1 text-slate-900 shadow-[1px_1px_0_#0f172a] disabled:opacity-30 disabled:shadow-none"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}

      {groups.every((group) => group.tasks.length === 0) ? (
        <p className={emptyBlockClass}>Nada aqui.</p>
      ) : null}
    </div>
  );
}

export const TaskListView = memo(TaskListViewBase);
