import { cn } from "@/lib/utils";

// Mini-anel estatico de nota, a peca visual do mini nota-hero da vitrine,
// reusada no historico. Tamanho e corpo do numero vem do className do wrapper
// (ex.: "h-[72px] w-[72px] text-xl" na vitrine, "h-12 w-12 text-sm" no
// historico). Estatico de proposito: nenhuma animacao aqui. O stroke opcional
// tinge trilho e progresso (default o slate-950 de sempre).

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MiniScoreRing({
  score,
  className,
  stroke = "#0f172a",
}: {
  score: number;
  className?: string;
  stroke?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeOpacity="0.15"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-black text-slate-950">
        {score}
      </span>
    </span>
  );
}
