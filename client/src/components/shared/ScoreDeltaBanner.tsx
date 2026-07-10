import { cn } from "@/lib/utils";

// Banner de delta de nota entre analises do mesmo alvo, extraido do bloco
// duplicado byte a byte em PortfolioAnalisar e LinkedinAnalisar. Sombra
// semantica de conclusao (#10b981).

interface ScoreDeltaBannerProps {
  from: number;
  to: number;
  className?: string;
}

export default function ScoreDeltaBanner({
  from,
  to,
  className,
}: ScoreDeltaBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-slate-950 bg-emerald-50 p-4 text-sm font-bold text-slate-900 shadow-[3px_3px_0_#10b981]",
        className,
      )}
    >
      {/* TODO(Ana): revisar a copy do delta de nota. */}
      Sua nota foi de {from} para {to}
      {to > from
        ? ". Continua assim!"
        : to === from
          ? "."
          : ". Veja abaixo o que priorizar."}
    </div>
  );
}
