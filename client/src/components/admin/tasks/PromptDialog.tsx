import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "./taskBoardStyles";
import { LAYER_DIALOG } from "./taskLayers";

// Substitui os window.prompt do board (nome da etapa, limite de WIP). Um unico
// dialogo parametrizado em vez de dois componentes quase iguais: os dois casos
// sao "peca um texto curto e valide antes de aceitar".
//
// A validacao mora no proprio dialogo (prop `validate`), nao no chamador: assim
// a mensagem de erro aparece no lugar onde a pessoa esta digitando, e nao existe
// caminho que aceite valor invalido por esquecimento de quem abriu.

export type PromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  /** Devolve a mensagem de erro, ou null quando o valor serve. */
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function PromptDialog({
  open,
  title,
  description,
  label,
  placeholder,
  initialValue = "",
  confirmLabel = "Salvar",
  validate,
  onConfirm,
  onOpenChange,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Ressemeia a cada abertura: reaproveitar o dialogo para outra etapa nao pode
  // trazer o texto digitado na anterior.
  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
    }
  }, [open, initialValue]);

  function confirm() {
    const trimmed = value.trim();
    const message = validate ? validate(trimmed) : null;
    if (message) {
      setError(message);
      return;
    }
    onConfirm(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={LAYER_DIALOG} className={`${LAYER_DIALOG} rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-sm`}>
        <DialogTitle className="font-display text-2xl font-black text-slate-950">
          {title}
        </DialogTitle>
        {description ? (
          <DialogDescription className="text-sm font-semibold text-slate-600">
            {description}
          </DialogDescription>
        ) : null}

        <div className="mt-2">
          <label htmlFor="tasks-prompt-input" className={labelClass}>
            {label}
          </label>
          <input
            id="tasks-prompt-input"
            autoFocus
            value={value}
            placeholder={placeholder}
            aria-invalid={error !== null}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                confirm();
              }
            }}
            className={inputClass}
          />
          {error ? (
            <p className="mt-1.5 text-xs font-black text-rose-700">{error}</p>
          ) : null}
        </div>

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={secondaryButtonClass}
          >
            Cancelar
          </button>
          <button type="button" onClick={confirm} className={primaryButtonClass}>
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
