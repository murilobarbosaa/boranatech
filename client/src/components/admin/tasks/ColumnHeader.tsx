import { memo, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Palette, Pencil, Trash2, Gauge } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  COLUMN_COLOR_CHOICES,
  COLUMN_COLOR_FALLBACK,
  safeHexColor,
} from "./taskBoardStyles";
import { LAYER_ON_PAGE } from "./taskLayers";
import type { TaskColumn } from "./types";

type ColumnHeaderProps = {
  column: TaskColumn;
  /** Quantidade VISIVEL (ja filtrada). */
  taskCount: number;
  /** Total antes do filtro, para o contador "3 de 12". */
  totalBeforeFilter: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: (columnId: string, name: string) => void;
  onRecolor: (columnId: string, color: string) => void;
  onRequestWipLimit: (columnId: string) => void;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onRequestDelete: (columnId: string) => void;
};

function ColumnHeaderBase({
  column,
  taskCount,
  totalBeforeFilter,
  canMoveLeft,
  canMoveRight,
  onRename,
  onRecolor,
  onRequestWipLimit,
  onMoveColumn,
  onRequestDelete,
}: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ressincroniza quando o nome muda por fora (rollback de um rename que falhou,
  // ou refresh trazendo o valor do server). Sem isso o campo mostraria o nome
  // otimista mesmo depois do rollback.
  useEffect(() => {
    if (!editing) setDraft(column.name);
  }, [column.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const name = draft.trim();
    setEditing(false);
    if (!name || name === column.name) {
      setDraft(column.name);
      return;
    }
    onRename(column.id, name);
  }

  // wip_limit e AVISO, nao bloqueio: o server nao recusa a movimentacao. O
  // destaque aqui e a unica manifestacao do estouro.
  // Etapa fixada NAO mostra limite de WIP: o limite e aviso visual, e um aviso
  // permanente numa etapa que o robo alimenta e ruido. Ruido e o que faz alguem
  // desligar o instrumento.
  const overWip =
    !column.is_pinned &&
    column.wip_limit !== null &&
    totalBeforeFilter > column.wip_limit;
  const filtered = taskCount < totalBeforeFilter;

  return (
    <header className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-900"
          style={{
            backgroundColor: safeHexColor(column.color, COLUMN_COLOR_FALLBACK),
          }}
        />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            autoFocus
            aria-label="Nome da etapa"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setDraft(column.name);
                setEditing(false);
              }
            }}
            className="w-full min-w-0 rounded-lg border-2 border-slate-900 bg-white px-2 py-0.5 text-sm font-black text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          />
        ) : (
          <h3
            onDoubleClick={() => setEditing(true)}
            title="Duplo clique para renomear"
            className="truncate text-sm font-black uppercase tracking-wide text-slate-950"
          >
            {column.name}
          </h3>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          title={
            filtered
              ? `${taskCount} visíveis de ${totalBeforeFilter} na etapa`
              : column.wip_limit === null
                ? `${totalBeforeFilter} tarefa(s)`
                : `${totalBeforeFilter} de no máximo ${column.wip_limit}`
          }
          className={`inline-flex items-center rounded-full border-2 border-slate-900 px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#0f172a] ${
            overWip ? "bg-rose-600 text-white" : "bg-white text-slate-950"
          }`}
        >
          {filtered
            ? `${taskCount} de ${totalBeforeFilter}`
            : column.wip_limit === null || column.is_pinned
              ? totalBeforeFilter
              : `${totalBeforeFilter}/${column.wip_limit}`}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Ações da etapa ${column.name}`}
            className="rounded-full border-2 border-slate-900 bg-white p-1 text-slate-900 shadow-[2px_2px_0_#0f172a]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={`${LAYER_ON_PAGE} rounded-xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]`}
          >
            <DropdownMenuItem
              onSelect={() => setEditing(true)}
              className="text-xs font-black"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" /> Renomear
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <Palette className="h-3 w-3" /> Cor
              </p>
              <div className="flex gap-1.5">
                {COLUMN_COLOR_CHOICES.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    aria-label={choice.label}
                    title={choice.label}
                    onClick={() => onRecolor(column.id, choice.value)}
                    className={`h-5 w-5 rounded-full border-2 border-slate-900 ${
                      safeHexColor(column.color, COLUMN_COLOR_FALLBACK) ===
                      choice.value
                        ? "ring-2 ring-violet-400 ring-offset-1"
                        : ""
                    }`}
                    style={{ backgroundColor: choice.value }}
                  />
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onRequestWipLimit(column.id)}
              className="text-xs font-black"
            >
              <Gauge className="mr-2 h-3.5 w-3.5" /> Definir limite (WIP)
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={column.is_pinned || !canMoveLeft}
              onSelect={() => onMoveColumn(column.id, -1)}
              className="text-xs font-black"
            >
              <ChevronLeft className="mr-2 h-3.5 w-3.5" /> Mover para a esquerda
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={column.is_pinned || !canMoveRight}
              onSelect={() => onMoveColumn(column.id, 1)}
              className="text-xs font-black"
            >
              <ChevronRight className="mr-2 h-3.5 w-3.5" /> Mover para a direita
            </DropdownMenuItem>

            {/* Etapa fixada nao e excluida nem reordenada. O servidor recusa
                as duas (409 column_pinned_intake); aqui a opcao nem aparece,
                porque oferecer uma acao que sempre falha e convidar para o
                erro. */}
            {column.is_pinned ? null : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onRequestDelete(column.id)}
                  className="text-xs font-black text-rose-700 focus:text-rose-700"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir etapa
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export const ColumnHeader = memo(ColumnHeaderBase);
