import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Sparkles } from "lucide-react";
import { FAIXA_UI } from "@/components/linkedin/faixaUi";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { AREA_LABELS } from "@shared/areas";
import {
  FAIXA_LABELS,
  LINKEDIN_LEVEL_LABELS,
  MERCADO_LABELS,
  type LinkedinAnalysisResponse,
} from "@shared/linkedin/schema";

const ac = getPageAccentUi("sky");

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Contador da nota: rAF de ~1s com ease-out cubico, de `from` ate `target`.
// reduce pula direto ao valor final. Copia fiel do useCountUp do GitHub.
function useCountUp(target: number, from: number, reduce: boolean): number {
  const [value, setValue] = useState(reduce ? target : from);
  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1000;
    const stepFrame = (ts: number) => {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(stepFrame);
    };
    raf = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(raf);
  }, [target, from, reduce]);
  return value;
}

// Paleta do confete da plataforma (proConfetti.ts), reusada no burst
// localizado do delta que subiu, como no GitHub.
const CONFETTI_COLORS = ["#FFB800", "#1a1a1a", "#ffffff", "#10b981"];

// Nota-hero do analisador de LinkedIn, no molde do ScoreHero do GitHub: a
// nota e o protagonista (contador + anel SVG preenchendo junto + carimbo da
// faixa via FAIXA_UI), com o contexto da analise (area, nivel, mercado)
// reorganizado ao lado. Delta de reanalise: contador anima DA nota antiga
// PARA a nova, a antiga aparece riscada, e subir dispara um burst de confete
// localizado (reduce desliga contador, carimbo e confete).
export default function LinkedinScoreHero({
  response,
  scoreDelta,
  reduce,
}: {
  response: LinkedinAnalysisResponse;
  scoreDelta: { from: number; to: number } | null;
  reduce: boolean;
}) {
  const { deterministic } = response;
  const faixaUi = FAIXA_UI[deterministic.faixa];
  // Delta valido para ESTE resultado: anima da nota antiga pra nova.
  const delta =
    scoreDelta && scoreDelta.to === deterministic.score ? scoreDelta : null;
  const value = useCountUp(deterministic.score, delta ? delta.from : 0, reduce);
  const ringOffset = RING_CIRCUMFERENCE * (1 - value / 100);

  const scoreRef = useRef<HTMLDivElement>(null);

  // Burst localizado quando a reanalise SUBIU a nota, sincronizado com a
  // chegada do contador. reduce nao dispara nada. Condicao identica ao GitHub.
  useEffect(() => {
    if (reduce || !delta || delta.to <= delta.from) return;
    const timer = window.setTimeout(() => {
      const rect = scoreRef.current?.getBoundingClientRect();
      const origin = rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.35 };
      confetti({
        particleCount: 90,
        spread: 100,
        origin,
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 140,
        gravity: 0.85,
      });
    }, 950);
    return () => window.clearTimeout(timer);
  }, [delta, reduce]);

  return (
    // Peca central da familia da vitrine: rotacao leve compensada + selo de
    // proposito no topo (o card interno mantem o overflow-hidden dos paineis).
    <div className="relative -rotate-[0.3deg]">
      {/* TODO(Ana): revisar o selo do resultado. */}
      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
        <Sparkles className="h-3 w-3" aria-hidden />
        Seu raio-X
      </span>
      <div
        className={cn(
          "card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white",
          ac.liftShadow,
        )}
      >
        <div className="flex flex-col md:flex-row">
          <div
            ref={scoreRef}
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-b-2 border-slate-950 p-8 text-center md:w-72 md:shrink-0 md:border-b-0 md:border-r-2",
              faixaUi.cardBg,
            )}
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">
              Nota do perfil
            </p>
            <div className="relative h-[132px] w-[132px]">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#0f172a"
                  strokeOpacity="0.15"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-black leading-none text-slate-950">
                  {value}
                </span>
                <span className="text-xs font-black text-slate-500">/100</span>
              </div>
            </div>
            {delta ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <span className="line-through opacity-60">{delta.from}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                <span>{delta.to}</span>
              </p>
            ) : null}
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { delay: 0.85, duration: 0.3, ease: "backOut" }
              }
              className={cn(
                "inline-flex rounded-full border-2 border-slate-950 px-4 py-1 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]",
                faixaUi.chipBg,
              )}
            >
              {FAIXA_LABELS[deterministic.faixa]}
            </motion.span>
            {/* L6: o placar "X de N melhorias aplicadas" (chip com pulso no
                N de N) entra AQUI, logo abaixo do carimbo da faixa, quando o
                checklist de melhorias aplicadas existir no LinkedIn. */}
          </div>

          {/* Coluna do contexto da analise (o antigo ResultHeader absorvido):
              centrada na vertical, com os chips logo apos o bloco do titulo.
              A altura do card e ditada so pelo painel da nota. */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-5 p-6">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-sky-600 text-white shadow-[3px_3px_0_#0f172a]"
                aria-hidden
              >
                <Linkedin className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Análise do perfil
                </p>
                <p className="truncate font-display text-2xl font-black text-slate-950">
                  {AREA_LABELS[response.area]}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
                {LINKEDIN_LEVEL_LABELS[response.level]}
              </span>
              <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
                {MERCADO_LABELS[response.mercado]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
