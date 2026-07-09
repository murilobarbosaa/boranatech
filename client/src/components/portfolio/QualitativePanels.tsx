import {
  AlertTriangle,
  ChevronDown,
  FileCode2,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import CopyButton from "@/components/shared/CopyButton";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import type { GithubMelhoria, Prioridade } from "@shared/github/schema";

const ac = getPageAccentUi("violet");

const IA_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-violet-300 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]";

const PRIORITY: Record<Prioridade, { label: string; chipBg: string }> = {
  alta: { label: "prioridade alta", chipBg: "bg-red-300" },
  media: { label: "prioridade média", chipBg: "bg-amber-300" },
  baixa: { label: "prioridade baixa", chipBg: "bg-sky-300" },
};

export function AiSummary({ resumo }: { resumo: string }) {
  return (
    <div className={cn("card-brutal rounded-2xl border-slate-950 bg-violet-50 p-6", ac.liftShadow)}>
      <span className={IA_EYEBROW}>
        <Sparkles className="h-3.5 w-3.5" />
        análise da IA
      </span>
      <p className="mt-4 max-w-prose text-lg font-medium leading-relaxed text-slate-900">
        {resumo}
      </p>
    </div>
  );
}

// Re-export fino: o NextStepCard vive em components/shared (usado pelos
// analisadores de GitHub e LinkedIn). Mantido aqui para nao quebrar imports.
export { NextStepCard } from "@/components/shared/NextStepCard";

export function StrengthsWeaknesses({
  pontosFortes,
  pontosFracos,
}: {
  pontosFortes: string[];
  pontosFracos: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={cn("card-brutal rounded-2xl border-slate-950 bg-white p-5", ac.liftShadow)}>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-slate-950">
          <ThumbsUp className="h-5 w-5 text-emerald-600" />
          Pontos fortes
        </h3>
        {pontosFortes.length > 0 ? (
          <ul className="space-y-2">
            {pontosFortes.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            Nenhum ponto forte destacado.
          </p>
        )}
      </div>

      <div className={cn("card-brutal rounded-2xl border-slate-950 bg-white p-5", ac.liftShadow)}>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-slate-950">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Pontos a melhorar
        </h3>
        {pontosFracos.length > 0 ? (
          <ul className="space-y-2">
            {pontosFracos.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma lacuna apontada.</p>
        )}
      </div>
    </div>
  );
}

export function Improvements({ melhorias }: { melhorias: GithubMelhoria[] }) {
  if (melhorias.length === 0) return null;

  return (
    <div className="space-y-3">
      <span className={IA_EYEBROW}>
        <Sparkles className="h-3.5 w-3.5" />
        melhorias priorizadas
      </span>
      <div className="grid gap-3">
        {melhorias.map((item, index) => {
          const p = PRIORITY[item.prioridade];
          return (
            <div
              key={index}
              className={cn("card-brutal rounded-2xl border-slate-950 bg-white p-5", ac.liftShadow)}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex rounded-full border-2 border-slate-950 px-3 py-0.5 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]",
                    p.chipBg,
                  )}
                >
                  {p.label}
                </span>
                <h4 className="font-display text-base font-black text-slate-950">
                  {item.titulo}
                </h4>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {item.comoFazer}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReadmeSuggestion({ markdown }: { markdown: string | null }) {
  if (!markdown) return null;

  return (
    <details className={cn("card-brutal group rounded-2xl border-slate-950 bg-white p-5", ac.liftShadow)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-display text-lg font-black text-slate-950">
          <FileCode2 className="h-5 w-5 text-violet-700" />
          Sugestão de README
        </span>
        <ChevronDown className="h-5 w-5 text-slate-600 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Copie e cole no README, depois ajuste com seus dados reais.
          </p>
          <CopyButton text={markdown} />
        </div>
        <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border-2 border-slate-900 bg-slate-950 p-4 text-xs leading-relaxed text-white">
          {markdown}
        </pre>
      </div>
    </details>
  );
}
