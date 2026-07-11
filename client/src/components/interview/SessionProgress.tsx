import { cn } from "@/lib/utils";

// Indicador de preparo AO VIVO da sessao: trilha de 3 marcos da sequencia de
// respostas boas + placar. Alimentado EXCLUSIVAMENTE por dado real do server
// (getSession na retomada e response.progress a cada turno): nada de
// porcentagem sintetica, nada de reimplementar o criterio, nada de contar
// turnos no client. O cap visual em 3 espelha o criterio de streak do server
// sem o recalcular.

const STREAK_TARGET = 3;

export default function SessionProgress({
  goodStreak,
  goodCount,
  questionCount,
  reduce,
}: {
  goodStreak: number;
  goodCount: number;
  questionCount: number;
  reduce: boolean;
}) {
  const filled = Math.min(goodStreak, STREAK_TARGET);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-800">
          {/* TODO(Ana): rotulo da trilha de sequencia de boas. */}
          Sequência
        </span>
        <div
          className="flex items-center gap-1"
          role="img"
          /* TODO(Ana): descricao acessivel da trilha. */
          aria-label={`Sequência de respostas boas: ${filled} de ${STREAK_TARGET}`}
        >
          {Array.from({ length: STREAK_TARGET }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 w-6 rounded-full border-2 border-slate-950",
                !reduce && "transition-colors duration-300",
                i < filled ? "bg-emerald-400" : "bg-white/70",
              )}
            />
          ))}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-800">
        {/* TODO(Ana): rotulo do placar ao vivo. */}
        {goodCount} boas de {questionCount}
      </p>
    </div>
  );
}
