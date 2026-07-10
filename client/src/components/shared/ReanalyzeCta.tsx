import { Sparkles } from "lucide-react";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import { cn } from "@/lib/utils";

// CTA de reanalise com confirmacao em 2 passos e custo explicito na copy,
// extraido do par duplicado em PortfolioAnalisar e LinkedinAnalisar. O estado
// confirming vive no caller (que ja o possuia); aqui e so a casca.
//
// spotlight (opt-in do GitHub): faixa de destaque com anatomia de card brutal,
// titulo proprio e o botao inicial promovido a BrutalActionButton primary; a
// confirmacao em 2 passos e o custo explicito PERMANECEM identicos. celebrate
// troca o wash pra emerald e o titulo pra versao de conclusao. Sem as props
// novas, o render e byte a byte o de antes (consumo do LinkedIn inalterado).

// TODO(Ana): revisar toda a copy da reanalise (inclusive titulos da faixa).
const DEFAULT_COPY = {
  start: "Apliquei as melhorias, analisar de novo",
  helper:
    "Roda uma NOVA análise do mesmo alvo. Abrir uma análise salva no histórico é grátis.",
  confirm: "Confirmar (usa 1 análise do dia)",
  cancel: "Cancelar",
  spotlightTitle: "Aplicou as melhorias? Veja sua nota subir",
  spotlightTitleCelebrate: "Tudo aplicado! Hora de medir",
} as const;

interface ReanalyzeCtaProps {
  confirming: boolean;
  onStart: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  startLabel?: string;
  helper?: string;
  confirmLabel?: string;
  /** Faixa de destaque (card brutal com titulo). Default: inline, como antes. */
  spotlight?: boolean;
  spotlightTitle?: string;
  /** Placar completo (N de N): wash emerald + titulo de celebracao. */
  celebrate?: boolean;
}

export default function ReanalyzeCta({
  confirming,
  onStart,
  onConfirm,
  onCancel,
  startLabel = DEFAULT_COPY.start,
  helper = DEFAULT_COPY.helper,
  confirmLabel = DEFAULT_COPY.confirm,
  spotlight = false,
  spotlightTitle,
  celebrate = false,
}: ReanalyzeCtaProps) {
  const controls = (
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
          {spotlight ? (
            <BrutalActionButton
              variant="primary"
              onClick={onStart}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
            >
              {startLabel}
            </BrutalActionButton>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {startLabel}
            </button>
          )}
          <span className="text-xs font-medium text-slate-500">{helper}</span>
        </>
      )}
    </div>
  );

  if (!spotlight) return controls;

  const title =
    spotlightTitle ??
    (celebrate
      ? DEFAULT_COPY.spotlightTitleCelebrate
      : DEFAULT_COPY.spotlightTitle);

  return (
    <div
      className={cn(
        "card-brutal rounded-2xl border-slate-950 p-6",
        celebrate ? "bg-emerald-50" : "bg-white",
      )}
    >
      <h3 className="font-display text-xl font-black text-slate-950">
        {title}
      </h3>
      <div className="mt-4">{controls}</div>
    </div>
  );
}
