import { FAIXA_UI } from "@/components/linkedin/faixaUi";
import { cn } from "@/lib/utils";
import { FAIXA_LABELS, type LinkedinFaixa } from "@shared/linkedin/schema";

interface LinkedinScoreCardProps {
  score: number;
  faixa: LinkedinFaixa;
  variant?: "card" | "panel";
}

function ScoreContent({
  score,
  faixa,
}: {
  score: number;
  faixa: LinkedinFaixa;
}) {
  const ui = FAIXA_UI[faixa];
  return (
    <>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
        Nota do perfil
      </p>
      <p className="mt-2 font-display text-6xl font-black leading-none text-slate-950">
        {score}
        <span className="text-2xl font-black text-slate-500">/100</span>
      </p>
      <span
        className={cn(
          "mt-4 inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]",
          ui.chipBg,
        )}
      >
        {FAIXA_LABELS[faixa]}
      </span>
    </>
  );
}

export default function LinkedinScoreCard({
  score,
  faixa,
  variant = "card",
}: LinkedinScoreCardProps) {
  const ui = FAIXA_UI[faixa];

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center",
          ui.cardBg,
        )}
      >
        <ScoreContent score={score} faixa={faixa} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card-brutal rounded-2xl border-slate-950 p-6 text-center",
        ui.cardBg,
      )}
    >
      <ScoreContent score={score} faixa={faixa} />
    </div>
  );
}
