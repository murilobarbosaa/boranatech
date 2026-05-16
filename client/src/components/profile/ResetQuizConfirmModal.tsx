import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X } from "lucide-react";

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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-quiz-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 md:p-8 shadow-[4px_4px_0_#0f172a]"
            onClick={(e) => e.stopPropagation()}
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

            <h2
              id="reset-quiz-title"
              className="text-center font-display text-2xl font-black text-slate-950 mb-2"
            >
              Reiniciar o quiz?
            </h2>

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
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-rose-500 px-5 py-3 font-display font-black uppercase tracking-wider text-sm text-white shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
