import { Sparkles } from "lucide-react";
import BrutalActionButton from "@/components/shared/BrutalActionButton";

// CTA de reanalise com confirmacao em 2 passos e custo explicito na copy,
// extraido do par duplicado em PortfolioAnalisar e LinkedinAnalisar. O estado
// confirming vive no caller (que ja o possuia); aqui e so a casca.

// TODO(Ana): revisar toda a copy da reanalise.
const DEFAULT_COPY = {
  start: "Apliquei as melhorias, analisar de novo",
  helper:
    "Roda uma NOVA análise do mesmo alvo. Abrir uma análise salva no histórico é grátis.",
  confirm: "Confirmar (usa 1 análise do dia)",
  cancel: "Cancelar",
} as const;

interface ReanalyzeCtaProps {
  confirming: boolean;
  onStart: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  startLabel?: string;
  helper?: string;
  confirmLabel?: string;
}

export default function ReanalyzeCta({
  confirming,
  onStart,
  onConfirm,
  onCancel,
  startLabel = DEFAULT_COPY.start,
  helper = DEFAULT_COPY.helper,
  confirmLabel = DEFAULT_COPY.confirm,
}: ReanalyzeCtaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {confirming ? (
        <>
          <BrutalActionButton
            variant="primary"
            onClick={onConfirm}
            icon={<Sparkles className="h-4 w-4" aria-hidden />}
          >
            {confirmLabel}
          </BrutalActionButton>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-slate-500 underline underline-offset-2 hover:text-slate-800"
          >
            {DEFAULT_COPY.cancel}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {startLabel}
          </button>
          <span className="text-xs font-medium text-slate-500">{helper}</span>
        </>
      )}
    </div>
  );
}
