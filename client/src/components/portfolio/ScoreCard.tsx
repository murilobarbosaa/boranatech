import { cn } from "@/lib/utils";
import type { ScoreBand } from "@shared/github/schema";

const BAND: Record<ScoreBand, { label: string; cardBg: string; chipBg: string }> = {
  comecando: { label: "Começando", cardBg: "bg-red-100", chipBg: "bg-red-300" },
  evoluindo: { label: "Evoluindo", cardBg: "bg-amber-100", chipBg: "bg-amber-300" },
  bom: { label: "Bom", cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  destaque: { label: "Destaque", cardBg: "bg-emerald-100", chipBg: "bg-emerald-300" },
};

interface ScoreCardProps {
  score: number;
  band: ScoreBand;
  /** "card" = card-brutal independente. "panel" = painel interno (sem moldura própria). */
  variant?: "card" | "panel";
}

function ScoreContent({ score, band }: { score: number; band: ScoreBand }) {
  const b = BAND[band];
  return (
    <>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Nota do portfólio</p>
      <p className="mt-2 font-display text-6xl font-black leading-none text-slate-950">
        {score}
        <span className="text-2xl font-black text-slate-500">/100</span>
      </p>
      <span
        className={cn(
          "mt-4 inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]",
          b.chipBg,
        )}
      >
        {b.label}
      </span>
    </>
  );
}

export default function ScoreCard({ score, band, variant = "card" }: ScoreCardProps) {
  const b = BAND[band];

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center",
          b.cardBg,
        )}
      >
        <ScoreContent score={score} band={band} />
      </div>
    );
  }

  return (
    <div className={cn("card-brutal rounded-2xl border-slate-950 p-6 text-center", b.cardBg)}>
      <ScoreContent score={score} band={band} />
    </div>
  );
}
