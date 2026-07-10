import { cn } from "@/lib/utils";

// ScoreCard unificado das analises com IA (portfolio, LinkedIn, curriculo).
// O mapa faixa->cor vem RESOLVIDO por prop (cada pagina preserva o proprio
// mapa e labels); aqui vive so a anatomia: label uppercase, nota text-6xl
// sobre 100 e chip de faixa com sombra flat.

export interface ScoreBandUi {
  label: string;
  cardBg: string;
  chipBg: string;
}

interface ScoreCardProps {
  score: number;
  band: ScoreBandUi;
  // Ex.: "Nota do portfolio", "Nota do perfil", "Nota do curriculo".
  title: string;
  /** "card" = card-brutal independente. "panel" = painel interno (sem moldura propria). */
  variant?: "card" | "panel";
}

function ScoreContent({
  score,
  band,
  title,
}: {
  score: number;
  band: ScoreBandUi;
  title: string;
}) {
  return (
    <>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
        {title}
      </p>
      <p className="mt-2 font-display text-6xl font-black leading-none text-slate-950">
        {score}
        <span className="text-2xl font-black text-slate-500">/100</span>
      </p>
      <span
        className={cn(
          "mt-4 inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]",
          band.chipBg,
        )}
      >
        {band.label}
      </span>
    </>
  );
}

export default function ScoreCard({
  score,
  band,
  title,
  variant = "card",
}: ScoreCardProps) {
  if (variant === "panel") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-6 text-center",
          band.cardBg,
        )}
      >
        <ScoreContent score={score} band={band} title={title} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card-brutal rounded-2xl border-slate-950 p-6 text-center",
        band.cardBg,
      )}
    >
      <ScoreContent score={score} band={band} title={title} />
    </div>
  );
}
