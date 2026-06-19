import { Lock } from "lucide-react";
import { Link } from "wouter";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Reusavel: cada gatilho passa a sua copy. TODO(Ana): copy final por contexto.
  description?: string;
}

// Modal de upsell disparado por clique (nao existe outro no app; o padrao ate
// agora era so o ProGate inline). Reusa a primitiva Dialog de components/ui
// (igual ao AuthModal) e o visual/copy do ProGate (cadeado + CTA /planos).
export default function ProUpsellModal({
  open,
  onOpenChange,
  description = "Esse recurso faz parte do Plano Pro. Assine pra desbloquear.", // TODO(Ana): copy final
}: ProUpsellModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-slate-950 bg-white p-6 text-center shadow-[6px_6px_0_#0f172a] sm:max-w-md">
        <DialogHeader className="items-center gap-3 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]">
            <Lock className="h-7 w-7 text-violet-700" />
          </span>
          {/* TODO(Ana): titulo final */}
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            Disponível no Plano Pro
          </DialogTitle>
          <DialogDescription className="mx-auto max-w-sm text-sm font-medium text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex justify-center">
          <Link
            href="/planos"
            onClick={() => onOpenChange(false)}
            className="btn-brutal-accent inline-flex rounded-full px-6 py-3 text-sm font-black"
          >
            Ver planos Pro
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
