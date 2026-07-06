import { cn } from "@/lib/utils";
import {
  RESUME_FAIXA_LABELS,
  type ResumeFaixa,
  type ResumeScoreCriterion,
} from "@shared/resumeAnalysis/schema";

// Card de nota do Analisador de Curriculo, no molde do LinkedinScoreCard,
// com o breakdown deterministico por criterio (a nota nao vem da IA).

const FAIXA_UI: Record<ResumeFaixa, { cardBg: string; chipBg: string }> = {
  inicio: { cardBg: "bg-red-100", chipBg: "bg-red-300" },
  "em-construcao": { cardBg: "bg-amber-100", chipBg: "bg-amber-300" },
  forte: { cardBg: "bg-sky-100", chipBg: "bg-sky-300" },
  magnetico: { cardBg: "bg-emerald-100", chipBg: "bg-emerald-300" },
};

interface ResumeScoreCardProps {
  score: number;
  faixa: ResumeFaixa;
  criterios: ResumeScoreCriterion[];
}

export default function ResumeScoreCard({
  score,
  faixa,
  criterios,
}: ResumeScoreCardProps) {
  const ui = FAIXA_UI[faixa];
  return (
    <div
      className={cn(
        "card-brutal rounded-2xl border-slate-950 p-6",
        ui.cardBg,
      )}
    >
      <div className="text-center">
        {/* TODO(Ana): revisar os textos do card de nota do curriculo */}
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
          Nota do currículo
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
          {RESUME_FAIXA_LABELS[faixa]}
        </span>
      </div>
      <div className="mt-6 space-y-2.5">
        {criterios.map((criterio) => (
          <div
            key={criterio.id}
            className="rounded-xl border-2 border-slate-950 bg-white/80 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-900">
                {criterio.label}
              </p>
              <p className="shrink-0 text-sm font-black text-slate-700">
                {criterio.achieved}/{criterio.weight}
              </p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-slate-950 bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{
                  width: `${criterio.weight > 0 ? Math.round((criterio.achieved / criterio.weight) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-600">
              {criterio.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
