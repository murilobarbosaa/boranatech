import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { RoadmapLanguage, RoadmapSection } from "@/lib/roadmapV2/types";
import { nodeProgress } from "@/lib/roadmapV2/progress";
import RoadmapNodeItem from "./RoadmapNodeItem";

const LEVEL_LABELS: Record<NonNullable<RoadmapSection["level"]>, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const LEVEL_ACCENT: Record<
  NonNullable<RoadmapSection["level"]>,
  { color: string; soft: string }
> = {
  iniciante: { color: "#0d9488", soft: "#ccfbf1" },
  intermediario: { color: "#7c3aed", soft: "#ede9fe" },
  avancado: { color: "#e11d48", soft: "#ffe4e6" },
};

const DEFAULT_ACCENT = { color: "#7c3aed", soft: "#ede9fe" };

const CONFETTI = [
  { x: -22, y: -12, c: "#0d9488", d: 0 },
  { x: 16, y: -20, c: "#7c3aed", d: 0.04 },
  { x: 26, y: 4, c: "#FFB800", d: 0.08 },
  { x: -14, y: 10, c: "#e11d48", d: 0.06 },
  { x: 4, y: -26, c: "#06b6d4", d: 0.1 },
  { x: -28, y: 2, c: "#f97316", d: 0.12 },
];

type TrailDrawerProps = {
  section: RoadmapSection | null;
  done: Set<string>;
  language?: RoadmapLanguage;
  onToggle: (id: string) => void;
  onClose: () => void;
};

export default function TrailDrawer({
  section,
  done,
  language,
  onToggle,
  onClose,
}: TrailDrawerProps) {
  const reduce = useReducedMotion();
  const progress = section
    ? nodeProgress(section, done)
    : { done: 0, total: 0 };
  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const complete = progress.total > 0 && progress.done === progress.total;
  const accent =
    section && section.level ? LEVEL_ACCENT[section.level] : DEFAULT_ACCENT;

  return (
    <AnimatePresence>
      {section && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[49] bg-slate-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85vh] max-w-[860px] flex-col rounded-t-[26px] border-[3px] border-b-0 border-slate-900 bg-white"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ duration: 0.42, ease: [0.34, 1.3, 0.64, 1] }}
          >
            <div className="relative border-b-[2.5px] border-dashed border-slate-200 px-7 pb-5 pt-5">
              <div className="mx-auto mb-5 h-[6px] w-[56px] rounded-full bg-slate-300" />
              <div className="flex items-center gap-3.5">
                <span className="text-[1.7rem] font-black leading-none tracking-tight text-slate-900">
                  {section.title}
                </span>
                {section.level && (
                  <span
                    className="rounded-md border-2 px-2.5 py-1 text-[0.72rem] font-black uppercase tracking-wide"
                    style={{
                      borderColor: accent.color,
                      backgroundColor: accent.soft,
                      color: accent.color,
                    }}
                  >
                    {LEVEL_LABELS[section.level]}
                  </span>
                )}
                <span className="rounded-lg border-2 border-slate-900 bg-slate-100 px-3 py-1.5 text-[0.82rem] font-extrabold text-slate-600">
                  {progress.done}/{progress.total}
                </span>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="ml-auto grid h-[40px] w-[40px] place-items-center rounded-[10px] border-[2.5px] border-slate-900 bg-white font-black shadow-[2px_2px_0_#0f172a]"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>
              {progress.total > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-slate-900 bg-slate-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: accent.color }}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.45, ease: "easeOut" }
                      }
                    />
                  </div>
                  {complete && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-black"
                      style={{ color: accent.color }}
                    >
                      <Sparkles
                        className="h-4 w-4"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      Etapa concluída!
                    </span>
                  )}
                </div>
              )}
              {complete && !reduce && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-9 top-7"
                >
                  {CONFETTI.map((cf, k) => (
                    <motion.span
                      key={k}
                      className="absolute block h-2 w-2 rounded-[2px]"
                      style={{ background: cf.c }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: cf.x,
                        y: cf.y,
                        scale: [0, 1.2, 1],
                        opacity: [1, 1, 0],
                      }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: cf.d }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-7 pb-9 pt-3">
              {section.children.map((node) => (
                <RoadmapNodeItem
                  key={node.id}
                  node={node}
                  done={done}
                  language={language}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
