import { cn } from "@/lib/utils";

interface DifficultyDotsProps {
  level: number;
  fillClass: string;
  className?: string;
}

const LABELS = [
  "",
  "Muito fácil",
  "Fácil",
  "Médio",
  "Difícil",
  "Muito difícil",
] as const;

export function DifficultyDots({
  level,
  fillClass,
  className,
}: DifficultyDotsProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full border border-slate-300",
              i <= level ? fillClass : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700">{LABELS[level]}</span>
    </div>
  );
}
