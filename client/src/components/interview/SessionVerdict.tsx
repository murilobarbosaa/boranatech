import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Award } from "lucide-react";

import { cn } from "@/lib/utils";
import type { InterviewVerdict } from "@/services/interviewService";

// Cartao de veredito do fechamento. prepared CELEBRA (conquista com Award,
// placar em destaque e confetti quando o fechamento acontece AO VIVO);
// question_cap e stopped_early mantem o tom sobrio. Teatro honesto: a
// celebracao so dispara no fechamento vivo (celebrate), UMA vez; retomada de
// sessao ja preparada mostra o cartao celebrativo SEM confetti; reduce nao
// dispara nada e a contagem salta ao valor final.

const CONFETTI_COLORS = ["#FFB800", "#2563eb", "#ffffff", "#10b981"];

// Contagem animada no padrao do useCountUp do molde (duplicado localmente,
// precedente E3): reduce pula direto ao valor final.
function useCountUp(target: number, reduce: boolean): number {
  const [value, setValue] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduce]);
  return value;
}

export default function SessionVerdict({
  verdict,
  celebrate,
  reduce,
}: {
  verdict: InterviewVerdict;
  // true SOMENTE quando o fechamento aconteceu nesta visita (done:true ao
  // vivo); na retomada a pagina passa false.
  celebrate: boolean;
  reduce: boolean;
}) {
  const prepared = verdict.result === "prepared";
  const cardRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const goodValue = useCountUp(verdict.goodCount, reduce);

  // Burst localizado no padrao do ScoreHero: so no fechamento vivo de sessao
  // preparada, UMA vez; reduce nao dispara nada.
  useEffect(() => {
    if (reduce || !celebrate || !prepared || firedRef.current) return;
    firedRef.current = true;
    const timer = window.setTimeout(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      const origin = rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.5 };
      confetti({
        particleCount: 90,
        spread: 100,
        origin,
        colors: CONFETTI_COLORS,
        scalar: 0.9,
        ticks: 140,
        gravity: 0.85,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [celebrate, prepared, reduce]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "mt-2 rounded-[14px] border-2 border-slate-950 px-4 py-4 shadow-[3px_3px_0_#0f172a]",
        prepared ? "bg-emerald-50" : "bg-blue-50",
      )}
    >
      {prepared ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
          <Award className="h-4 w-4" aria-hidden />
          {/* TODO(Ana): selo da conquista de preparo. */}
          Preparado!
        </span>
      ) : (
        <p className="font-display text-sm font-black uppercase tracking-[0.15em] text-blue-900">
          {/* TODO(Ana): titulo do veredito final. */}
          {verdict.result === "stopped_early"
            ? "Entrevista encerrada"
            : "Veredito final"}
        </p>
      )}

      {prepared ? (
        <p className="mt-3 font-display text-2xl font-black text-slate-950">
          {/* TODO(Ana): placar em destaque da conquista. */}
          {goodValue} boas de {verdict.questionCount} respostas
        </p>
      ) : (
        <p className="mt-1 text-xs font-bold text-slate-600">
          {verdict.goodCount} respostas boas de {verdict.questionCount}{" "}
          avaliadas
        </p>
      )}

      {typeof verdict.hintsUsed === "number" && verdict.hintsUsed > 0 ? (
        <p className="mt-0.5 text-xs font-bold text-slate-600">
          {/* TODO(Ana): frase do uso de dicas no resumo final. */}
          Você pediu dica em {verdict.hintsUsed} de {verdict.questionCount}{" "}
          perguntas
        </p>
      ) : null}

      {verdict.closing ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
          {verdict.closing}
        </p>
      ) : null}
    </div>
  );
}
