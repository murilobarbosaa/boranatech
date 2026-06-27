import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntrar: () => void;
  onCriarConta: () => void;
}

// Modal "burro": so apresenta os dois caminhos e dispara callbacks. Sem
// formulario de auth, sem logica de navegacao. Consome o wrapper de Dialog de
// components/ui (que ja entrega o visual e o botao de fechar X/Esc/overlay).
export default function AuthGateModal({
  open,
  onOpenChange,
  onEntrar,
  onCriarConta,
}: AuthGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 rounded-xl border-2 border-slate-950 bg-white p-6 shadow-[6px_6px_0_#0f172a] sm:max-w-md">
        <DialogHeader className="gap-3">
          <DialogTitle className="font-display text-xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de gate de login */}
            Entre pra continuar
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            {/* TODO(Ana): linha de explicacao do modal */}
            Entre ou crie sua conta pra continuar de onde parou.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:flex-row sm:justify-stretch">
          <Button
            type="button"
            onClick={onEntrar}
            className="w-full rounded-full border-2 border-slate-950 bg-[#FFB800] font-black text-slate-950 shadow-[3px_3px_0_#0f172a] hover:bg-[#FFB800]"
          >
            {/* TODO(Ana): rotulo do botao de login */}
            Entrar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCriarConta}
            className="w-full rounded-full border-2 border-slate-950 bg-white font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            {/* TODO(Ana): rotulo do botao de cadastro */}
            Criar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
