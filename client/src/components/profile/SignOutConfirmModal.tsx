import { useEffect } from "react";
import { LogOut } from "lucide-react";

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function SignOutConfirmModal({ isOpen, onClose, onConfirm, isLoading }: SignOutConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-slate-100">
          <LogOut className="h-5 w-5 text-slate-700" strokeWidth={2.5} />
        </div>

        <h2 id="signout-modal-title" className="font-display text-2xl font-black text-slate-950">
          Sair da conta?
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Você precisará entrar de novo da próxima vez.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-white px-5 py-3 font-display font-black text-slate-700 shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 font-display font-black text-white shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
          >
            {isLoading ? "Saindo..." : "Sim, sair"}
          </button>
        </div>
      </div>
    </div>
  );
}
