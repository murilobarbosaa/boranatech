import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileCode2,
  MessageCircle,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import CopyButton from "@/components/shared/CopyButton";
import { getPageAccentUi, type PageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import type { GithubMelhoria, Prioridade } from "@shared/github/schema";

// Default violet (o comportamento de sempre do analisador de GitHub). Os tres
// paineis aceitam um accent opt-in (ex.: sky no analisador de LinkedIn); sem
// a prop, o render e identico ao de antes.
const ac = getPageAccentUi("violet");

const IA_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]";

// O chip -300 do eyebrow de IA nao existe como token do PageAccentUi, entao e
// resolvido a partir do panelSoft do accent neste mapa minimo (so os accents
// que consomem os paineis); fora do mapa, fica o violet de sempre.
const EYEBROW_CHIP: Record<string, string> = {
  "bg-violet-50": "bg-violet-300",
  "bg-sky-50": "bg-sky-300",
};

function eyebrowChip(accent: PageAccentUi): string {
  return EYEBROW_CHIP[accent.panelSoft] ?? "bg-violet-300";
}

const PRIORITY: Record<Prioridade, { label: string; chipBg: string }> = {
  alta: { label: "prioridade alta", chipBg: "bg-red-300" },
  media: { label: "prioridade média", chipBg: "bg-amber-300" },
  baixa: { label: "prioridade baixa", chipBg: "bg-sky-300" },
};

export function AiSummary({
  resumo,
  onAskAgent,
  accent = ac,
}: {
  resumo: string;
  /** Ponte com o agente Pro (analisador de GitHub): abre o widget com o
   * input pre-preenchido, sem enviar. Ausente = card identico ao de antes. */
  onAskAgent?: () => void;
  /** Accent da pagina consumidora (opt-in). Ausente = violet, como antes. */
  accent?: PageAccentUi;
}) {
  return (
    <div
      className={cn(
        "card-brutal rounded-2xl border-slate-950 p-6",
        accent.panelSoft,
        accent.liftShadow,
      )}
    >
      <span className={cn(IA_EYEBROW, eyebrowChip(accent))}>
        <Sparkles className="h-3.5 w-3.5" />
        análise da IA
      </span>
      <p className="mt-4 max-w-prose text-lg font-medium leading-relaxed text-slate-900">
        {resumo}
      </p>
      {onAskAgent ? (
        <button
          type="button"
          onClick={onAskAgent}
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-violet-100"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          {/* TODO(Ana): revisar o rotulo da ponte com o agente. */}
          Tirar dúvida sobre esta análise
        </button>
      ) : null}
    </div>
  );
}

// Re-export fino: o NextStepCard vive em components/shared (usado pelos
// analisadores de GitHub e LinkedIn). Mantido aqui para nao quebrar imports.
export { NextStepCard } from "@/components/shared/NextStepCard";

export function StrengthsWeaknesses({
  pontosFortes,
  pontosFracos,
  accent = ac,
}: {
  pontosFortes: string[];
  pontosFracos: string[];
  /** Accent da pagina consumidora (opt-in). Ausente = violet, como antes. */
  accent?: PageAccentUi;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div
        className={cn(
          "card-brutal rounded-2xl border-slate-950 bg-white p-5",
          accent.liftShadow,
        )}
      >
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

      <div
        className={cn(
          "card-brutal rounded-2xl border-slate-950 bg-white p-5",
          accent.liftShadow,
        )}
      >
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

export function Improvements({
  melhorias,
  applied,
  onToggle,
  accent = ac,
}: {
  melhorias: GithubMelhoria[];
  /** Checklist vivo (analisador de GitHub): indices marcados como aplicados.
   * Ausentes = cards identicos aos de antes (consumo do LinkedIn intacto). */
  applied?: Set<number>;
  onToggle?: (index: number) => void;
  /** Accent da pagina consumidora (opt-in). Ausente = violet, como antes. */
  accent?: PageAccentUi;
}) {
  const reduce = useReducedMotion() ?? false;
  if (melhorias.length === 0) return null;

  const interactive = applied !== undefined && onToggle !== undefined;

  return (
    <div className="space-y-3">
      <span className={cn(IA_EYEBROW, eyebrowChip(accent))}>
        <Sparkles className="h-3.5 w-3.5" />
        melhorias priorizadas
      </span>
      <div className="grid gap-3">
        {melhorias.map((item, index) => {
          const p = PRIORITY[item.prioridade];
          const done = interactive && applied.has(index);
          return (
            <div
              key={index}
              className={cn(
                "card-brutal rounded-2xl border-slate-950 p-5",
                done ? "bg-emerald-50" : "bg-white",
                accent.liftShadow,
              )}
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
                <h4
                  className={cn(
                    "font-display text-base font-black text-slate-950",
                    done && "line-through decoration-2 decoration-slate-400",
                  )}
                >
                  {item.titulo}
                </h4>
                {done ? (
                  <motion.span
                    initial={reduce ? false : { scale: 1.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.25, ease: "backOut" }
                    }
                    className="inline-flex items-center gap-1 rounded-full border-2 border-slate-950 bg-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]"
                  >
                    <Check className="h-3 w-3" aria-hidden />
                    {/* TODO(Ana): revisar o carimbo de melhoria aplicada. */}
                    aplicada
                  </motion.span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {item.comoFazer}
              </p>
              {interactive ? (
                <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm font-black text-slate-900">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggle(index)}
                    className="h-5 w-5 rounded border-2 border-slate-950 accent-emerald-600"
                  />
                  {/* TODO(Ana): revisar o rotulo do checkbox de melhoria. */}
                  Apliquei esta
                </label>
              ) : null}
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
    <details
      className={cn(
        "card-brutal group rounded-2xl border-slate-950 bg-white p-5",
        ac.liftShadow,
      )}
    >
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
