import { useRef } from "react";
import { RotateCcw, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ResetQuizConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetQuizConfirmModal({
  open,
  onClose,
  onConfirm,
}: ResetQuizConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // O foco inicial vai para o botao de confirmar, como antes da migracao. Sem
  // isto o Radix focaria o primeiro elemento focavel, que e o X.
  function focarConfirmar(event: Event) {
    event.preventDefault();
    confirmButtonRef.current?.focus();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={focarConfirmar}
        overlayClassName="bg-slate-950/60 backdrop-blur-sm"
        className="block max-w-[min(28rem,calc(100%-2rem))] rounded-3xl border-2 border-[var(--bnt-ink)] bg-white p-6 shadow-[4px_4px_0_var(--bnt-shadow)] sm:max-w-md md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-rose-300 bg-rose-50 text-rose-700">
            <RotateCcw className="h-7 w-7" strokeWidth={2.5} />
          </div>
        </div>

        <DialogTitle className="text-center font-display text-2xl font-black text-slate-950 mb-2">
          Reiniciar o quiz?
        </DialogTitle>

        <p className="text-center text-sm font-semibold text-slate-600 mb-6">
          Você vai perder o progresso atual e começar do zero.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[var(--bnt-ink)] bg-rose-500 px-5 py-3 font-display font-black uppercase tracking-wider text-sm text-white shadow-[3px_3px_0_var(--bnt-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--bnt-shadow)]"
          >
            Sim, reiniciar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-slate-300 bg-white px-5 py-3 font-display font-black uppercase tracking-wider text-sm text-slate-700 transition-all duration-200 hover:border-slate-500"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
