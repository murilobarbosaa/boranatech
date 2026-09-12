import { LogOut } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  /**
   * Classes extras do conteudo e do overlay, para o call site que precisa subir
   * o empilhamento. Existe por causa do admin, cujo header e `z-[1000]` e cujas
   * outras modais usam `z-[2000]`. Sem elas, a modal fica exatamente como era.
   */
  contentClassName?: string;
  overlayClassName?: string;
}

export function SignOutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  contentClassName,
  overlayClassName,
}: SignOutConfirmModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName={cn(
          "bg-slate-950/60 backdrop-blur-sm",
          overlayClassName,
        )}
        className={cn(
          "block max-w-[min(28rem,calc(100%-2rem))] rounded-3xl border-2 border-[var(--bnt-ink)] bg-white p-6 shadow-[4px_4px_0_var(--bnt-shadow)] sm:max-w-md",
          contentClassName,
        )}
      >
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[var(--bnt-ink)] bg-slate-100">
          <LogOut className="h-5 w-5 text-slate-700" strokeWidth={2.5} />
        </div>

        <DialogTitle className="font-display text-2xl font-black text-slate-950">
          Sair da conta?
        </DialogTitle>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Você precisará entrar de novo da próxima vez.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-[var(--bnt-ink)] bg-white px-5 py-3 font-display font-black text-slate-700 shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className="flex-1 rounded-full border-2 border-[var(--bnt-ink)] bg-[var(--bnt-ink)] px-5 py-3 font-display font-black text-white shadow-[3px_3px_0_var(--bnt-shadow)] disabled:opacity-50"
          >
            {isLoading ? "Saindo..." : "Sim, sair"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
