import { memo } from "react";

import { BntSelect } from "@/components/shared/BntSelect";

import type { TaskBoard } from "./types";

// Barra superior do board. Nesta fase e SO o seletor de quadro e o contador; a
// busca, os filtros, o agrupamento e o alternador de visao entram na Fase 6, e
// esta barra e o lugar deles.

type BoardToolbarProps = {
  boards: TaskBoard[];
  activeBoardId: string | null;
  taskCount: number;
  onSelectBoard: (boardId: string) => void;
};

function BoardToolbarBase({
  boards,
  activeBoardId,
  taskCount,
  onSelectBoard,
}: BoardToolbarProps) {
  if (boards.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-[14rem]">
        <label
          htmlFor="tasks-board-select"
          className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-600"
        >
          Quadro
        </label>
        <BntSelect
          id="tasks-board-select"
          size="sm"
          accent="gold"
          value={activeBoardId ?? ""}
          onValueChange={onSelectBoard}
          options={boards.map((board) => ({
            value: board.id,
            label: `${board.key} · ${board.name}`,
          }))}
        />
      </div>
      <p className="pb-1 text-xs font-black uppercase tracking-wide text-slate-500">
        {taskCount} tarefa{taskCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export const BoardToolbar = memo(BoardToolbarBase);
