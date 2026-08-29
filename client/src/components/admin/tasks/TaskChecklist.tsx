import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import type { TaskChecklistItem } from "./types";

// Checklist da tarefa, com barra de progresso.
//
// Reordenacao por SETAS e nao por dnd-kit, decidido assim por tres motivos:
//   1. o dnd-kit vive dentro do DndContext do board; um segundo contexto dentro
//      de um Dialog do Radix disputa foco e captura de ponteiro com o focus trap;
//   2. a configuracao de toque (delay 220 / tolerance 6) ainda NAO foi validada
//      em tela real, e apoiar mais um recurso nela antes disso seria empilhar
//      aposta sobre aposta;
//   3. seta e acessivel por construcao, sem sensor de teclado nem anuncio.
// Se um dia o checklist crescer a ponto de arrastar valer a pena, a troca e
// local a este arquivo.
//
// A rota de reordenacao exige o CONJUNTO COMPLETO de ids (mesma pegadinha das
// colunas), entao quem chama sempre manda a lista inteira: ver onReorder.

type TaskChecklistProps = {
  items: TaskChecklistItem[];
  onToggle: (itemId: string, isDone: boolean) => void;
  onAdd: (content: string) => void;
  onRemove: (itemId: string) => void;
  /** Recebe a lista COMPLETA de ids na ordem desejada. */
  onReorder: (orderedIds: string[]) => void;
};

export function TaskChecklist({
  items,
  onToggle,
  onAdd,
  onRemove,
  onReorder,
}: TaskChecklistProps) {
  const [draft, setDraft] = useState("");

  const done = items.filter((item) => item.is_done).length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  }

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onAdd(content);
    setDraft("");
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">
          Checklist
        </h3>
        {total > 0 ? (
          <span className="text-xs font-black text-slate-500">
            {done}/{total}
          </span>
        ) : null}
      </div>

      {total > 0 ? (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Checklist ${done} de ${total}`}
          className="mb-3 h-2.5 w-full overflow-hidden rounded-full border-2 border-slate-900 bg-white"
        >
          <div
            className="h-full bg-[var(--brand-yellow)] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}

      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="group flex items-start gap-2 rounded-xl border-2 border-slate-200 bg-white px-2 py-1.5 transition-colors hover:border-slate-400"
          >
            <input
              type="checkbox"
              checked={item.is_done}
              aria-label={item.content}
              onChange={(event) => onToggle(item.id, event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-slate-900 accent-[#FFB800]"
            />
            <span
              className={`min-w-0 flex-1 break-words text-sm font-semibold ${
                item.is_done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {item.content}
            </span>
            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                aria-label={`Mover "${item.content}" para cima`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="rounded p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Mover "${item.content}" para baixo`}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                className="rounded p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Remover "${item.content}"`}
                onClick={() => onRemove(item.id)}
                className="rounded p-0.5 text-slate-400 hover:text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          placeholder="Novo item. Enter adiciona."
          aria-label="Novo item do checklist"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 px-2.5 py-1.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Adicionar item"
          className="shrink-0 rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] disabled:opacity-40 disabled:shadow-none"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
