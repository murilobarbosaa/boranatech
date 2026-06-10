import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { RoadmapLanguage, RoadmapSection } from "@/lib/roadmapV2/types";
import { nodeProgress } from "@/lib/roadmapV2/progress";
import RoadmapNodeItem from "./RoadmapNodeItem";

const LEVEL_LABELS: Record<NonNullable<RoadmapSection["level"]>, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

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
  const progress = section
    ? nodeProgress(section, done)
    : { done: 0, total: 0 };

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
            <div className="border-b-[2.5px] border-dashed border-slate-200 px-7 pb-5 pt-5">
              <div className="mx-auto mb-5 h-[6px] w-[56px] rounded-full bg-slate-300" />
              <div className="flex items-center gap-3.5">
                <span className="text-[1.7rem] font-black leading-none tracking-tight text-slate-900">
                  {section.title}
                </span>
                {section.level && (
                  <span className="rounded-md border-2 border-sky-700 bg-sky-100 px-2.5 py-1 text-[0.72rem] font-black uppercase tracking-wide text-sky-800">
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
            </div>
            <div className="flex-1 overflow-y-auto px-7 pb-9 pt-3">
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
