import { useEffect } from "react";
import { Link } from "wouter";
import { PartyPopper } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fireProCelebration } from "@/lib/proConfetti";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import { requiredLeaves } from "@/lib/roadmapV2/progress";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Janela curta do confete do modal: so o burst inicial e um ou dois ticks do
// ciclo, porque a coreografia da ultima secao ja rodou o festao completo
// segundos antes.
const MODAL_CONFETTI_MS = 700;

type RoadmapCompletionModalProps = {
  roadmap: RoadmapV2;
  open: boolean;
  onClose: () => void;
  ctas: CompletionCta[];
};

function ctaClass(variant: CompletionCta["variant"]): string {
  return variant === "primary"
    ? "inline-flex w-full items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] sm:w-auto"
    : "inline-flex w-full items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] sm:w-auto";
}

// Fragment (sem wrapper): quem chama fornece o container flex, pra o primario e
// os secundarios ficarem IRMAOS numa unica pilha. No mobile os botoes empilham
// em largura total (w-full); a partir de sm viram largura intrinseca em linha.
// Isso corrige o desalinhamento no card e no modal de uma vez.
export function CompletionCtaLinks({ ctas }: { ctas: CompletionCta[] }) {
  return (
    <>
      {ctas.map((cta) =>
        cta.href.startsWith("/") ? (
          <Link key={cta.id} href={cta.href} className={ctaClass(cta.variant)}>
            {cta.label}
          </Link>
        ) : (
          <a
            key={cta.id}
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaClass(cta.variant)}
          >
            {cta.label}
          </a>
        ),
      )}
    </>
  );
}

export default function RoadmapCompletionModal({
  roadmap,
  open,
  onClose,
  ctas,
}: RoadmapCompletionModalProps) {
  const reduce = useReducedMotion();

  const totalSteps = roadmap.sections.reduce(
    (sum, section) => sum + requiredLeaves(section).length,
    0,
  );

  useEffect(() => {
    if (!open || reduce) return;
    const stop = fireProCelebration({ x: 0.5, y: 0.35 });
    const timer = setTimeout(stop, MODAL_CONFETTI_MS);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [open, reduce]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-[2.5px] border-slate-900 bg-[#faf8f4] shadow-[6px_6px_0_#10b981]">
        <DialogHeader>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-slate-900 bg-emerald-300 shadow-[3px_3px_0_#0f172a]">
            <PartyPopper className="h-5 w-5 text-slate-950" />
          </span>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de conclusao de trilha */}
            Você concluiu a trilha {roadmap.title}!
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-600">
            {/* TODO(Ana): corpo do modal de conclusao de trilha */}
            Foram {totalSteps} passos em {roadmap.sections.length} etapas,
            do nível iniciante ao avançado. Agora escolha o próximo movimento.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CompletionCtaLinks ctas={ctas} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
