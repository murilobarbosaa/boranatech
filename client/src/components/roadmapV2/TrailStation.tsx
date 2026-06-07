import { forwardRef, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Check, Lock } from "lucide-react";
import type { RoadmapSection } from "@/lib/roadmapV2/types";

const LEVEL_LABELS: Record<NonNullable<RoadmapSection["level"]>, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

type TrailStationProps = {
  number: number;
  title: string;
  level?: RoadmapSection["level"];
  locked: boolean;
  complete: boolean;
  current: boolean;
  progressPct: number;
  onOpen: () => void;
};

const TrailStation = forwardRef<HTMLButtonElement, TrailStationProps>(function TrailStation(
  { number, title, level, locked, complete, current, progressPct, onOpen },
  ref,
) {
  const shake = useAnimationControls();
  const core = useAnimationControls();
  const wasComplete = useRef(complete);

  useEffect(() => {
    if (complete && !wasComplete.current) {
      // a) soft check: a gentle pop the moment the station turns green
      core.start({ scale: [1, 1.18, 1], transition: { duration: 0.5, ease: "easeOut" } });
    } else if (current) {
      core.start({ scale: [1, 1.09, 1], transition: { repeat: Infinity, duration: 1.7, ease: "easeInOut" } });
    } else {
      core.start({ scale: 1, transition: { duration: 0.2 } });
    }
    wasComplete.current = complete;
  }, [complete, current, core]);

  function handleClick() {
    if (locked) {
      shake.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    onOpen();
  }

  const ringBackground = locked
    ? "#e2e8f0"
    : complete
      ? "#10b981"
      : `conic-gradient(#10b981 ${progressPct}%, #e2e8f0 0)`;

  return (
    <motion.button
      ref={ref}
      type="button"
      animate={shake}
      onClick={handleClick}
      aria-label={locked ? `${title} (bloqueado)` : title}
      className={`relative h-16 w-16 border-none bg-transparent p-0 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="absolute inset-0 rounded-full transition-[background] duration-300" style={{ background: ringBackground }} />
      <motion.span
        animate={core}
        className={`absolute inset-[6px] grid place-items-center rounded-full border-[2.5px] transition-[background,box-shadow] duration-300 ${
          complete
            ? "border-slate-900 bg-emerald-500 shadow-[3px_3px_0_#047857]"
            : locked
              ? "border-slate-400 bg-slate-100 shadow-[3px_3px_0_#94a3b8]"
              : "border-slate-900 bg-white shadow-[3px_3px_0_#0f172a]"
        }`}
      >
        {complete ? (
          <Check className="h-6 w-6 text-white" strokeWidth={4} />
        ) : locked ? (
          <Lock className="h-5 w-5 text-slate-500" strokeWidth={2.6} />
        ) : (
          <span className="text-[1.15rem] font-black text-slate-900">{number}</span>
        )}
      </motion.span>
      <span
        className={`absolute left-1/2 top-full mt-2.5 -translate-x-1/2 whitespace-nowrap rounded-[9px] border-[2.5px] px-2.5 py-1 text-[0.76rem] font-extrabold shadow-[2px_2px_0_#0f172a] ${
          locked
            ? "border-slate-400 bg-slate-100 text-slate-400 shadow-[2px_2px_0_#94a3b8]"
            : complete
              ? "border-slate-900 bg-emerald-100 text-slate-900"
              : current
                ? "border-slate-900 bg-[#FFB800] text-slate-900"
                : "border-slate-900 bg-white text-slate-900"
        }`}
      >
        <span className="block">{title}</span>
        {level && (
          <span className={`mt-0.5 block text-[0.6rem] font-bold uppercase tracking-wide ${locked ? "text-slate-400" : "text-sky-700"}`}>
            {LEVEL_LABELS[level]}
          </span>
        )}
      </span>
    </motion.button>
  );
});

export default TrailStation;
