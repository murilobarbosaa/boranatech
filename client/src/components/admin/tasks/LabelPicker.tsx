import { useMemo, useState } from "react";
import { Check, Plus, Tag, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  LABEL_COLOR_FALLBACK,
  COLUMN_COLOR_CHOICES,
  safeHexColor,
} from "./taskBoardStyles";
import { LAYER_IN_DIALOG } from "./taskLayers";
import type { TaskLabel } from "./types";

// Multi-select de etiquetas com criacao inline.
//
// A criacao inline chama POST /crm/labels, que devolve **200 com a etiqueta
// existente** quando o nome ja existe no quadro (case-insensitive). Isso NAO e
// erro: digitar um nome que ja existe e o caso comum de quem esta marcando
// varios cards com a mesma etiqueta. O chamador trata os dois desfechos igual, e
// nenhuma mensagem de erro aparece.

type LabelPickerProps = {
  allLabels: TaskLabel[];
  selectedIds: string[];
  onToggle: (labelId: string, selected: boolean) => void;
  /** Cria (ou reaproveita) a etiqueta e aplica na tarefa. */
  onCreate: (name: string, color: string) => void;
};

export function LabelPicker({
  allLabels,
  selectedIds,
  onToggle,
  onCreate,
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [color, setColor] = useState(LABEL_COLOR_FALLBACK);

  const selected = useMemo(
    () => allLabels.filter((label) => selectedIds.includes(label.id)),
    [allLabels, selectedIds],
  );

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      normalized
        ? allLabels.filter((label) => label.name.toLowerCase().includes(normalized))
        : allLabels,
    [allLabels, normalized],
  );

  // So oferece criar quando nao existe casamento EXATO (case-insensitive), que e
  // a mesma regra do indice unico no banco. Oferecer criar "Frontend" quando ela
  // ja existe seria oferecer uma acao que nao cria nada.
  const exactExists = allLabels.some(
    (label) => label.name.toLowerCase() === normalized,
  );
  const canCreate = normalized.length > 0 && !exactExists;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded-full border border-slate-900 px-1.5 py-0.5 text-[10px] font-black text-slate-900"
          style={{ backgroundColor: safeHexColor(label.color, LABEL_COLOR_FALLBACK) }}
        >
          {label.name}
          <button
            type="button"
            aria-label={`Remover etiqueta ${label.name}`}
            onClick={() => onToggle(label.id, false)}
            className="rounded-full hover:bg-white/40"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label="Adicionar etiqueta"
          className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-slate-400 px-2 py-0.5 text-[10px] font-black text-slate-600 hover:border-slate-900 hover:text-slate-900"
        >
          <Tag className="h-3 w-3" />
          {selected.length === 0 ? "Etiquetas" : ""}
          <Plus className="h-2.5 w-2.5" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={`${LAYER_IN_DIALOG} w-64 rounded-xl border-2 border-slate-900 bg-white p-2 shadow-[4px_4px_0_var(--bnt-shadow)]`}
        >
          <input
            autoFocus
            value={query}
            placeholder="Buscar ou criar etiqueta"
            aria-label="Buscar ou criar etiqueta"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate) {
                event.preventDefault();
                onCreate(query.trim(), color);
                setQuery("");
              }
            }}
            className="w-full rounded-lg border-2 border-slate-300 px-2 py-1 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
          />

          <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto">
            {filtered.map((label) => {
              const isSelected = selectedIds.includes(label.id);
              return (
                <li key={label.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(label.id, !isSelected)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs font-black text-slate-800 hover:bg-slate-100"
                  >
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-900"
                      style={{
                        backgroundColor: safeHexColor(
                          label.color,
                          LABEL_COLOR_FALLBACK,
                        ),
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate">{label.name}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && !canCreate ? (
              <li className="px-1.5 py-2 text-xs font-semibold text-slate-400">
                Nenhuma etiqueta.
              </li>
            ) : null}
          </ul>

          {canCreate ? (
            <div className="mt-2 border-t-2 border-slate-200 pt-2">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                Cor da nova etiqueta
              </p>
              <div className="mb-2 flex gap-1.5">
                {COLUMN_COLOR_CHOICES.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    aria-label={choice.label}
                    title={choice.label}
                    onClick={() => setColor(choice.value)}
                    className={`h-5 w-5 rounded-full border-2 border-slate-900 ${
                      color === choice.value
                        ? "ring-2 ring-violet-400 ring-offset-1"
                        : ""
                    }`}
                    style={{ backgroundColor: choice.value }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onCreate(query.trim(), color);
                  setQuery("");
                }}
                className="w-full rounded-full border-2 border-slate-900 bg-[var(--brand-yellow)] px-2 py-1 text-xs font-black text-ink-on-accent shadow-[2px_2px_0_var(--bnt-shadow)]"
              >
                Criar “{query.trim()}”
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
