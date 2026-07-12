import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  ClipboardCheck,
  Languages,
  Lightbulb,
  MessagesSquare,
  Mic,
} from "lucide-react";

// Cenario vivo da arena de entrevistas, molde do AnalyzerBackdrop do
// PortfolioAnalisar: overlay de gradiente de marca na regiao superior com
// fade pro fundo + doodles tematicos flutuantes. Paleta BLUE da pagina.
// Nenhuma interacao, nenhum texto; sob reduced-motion nada anima.

const ENTRY_DOODLES = [
  { Icon: Mic, cls: "left-[4%] top-[6%] text-blue-500 opacity-[0.16]", size: "h-12 w-12", rot: 6, dur: 7, delay: 0 },
  { Icon: MessagesSquare, cls: "right-[6%] top-[8%] text-sky-500 opacity-[0.15]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.5 },
  { Icon: Briefcase, cls: "left-[14%] top-[30%] text-cyan-600 opacity-[0.13]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: ClipboardCheck, cls: "right-[12%] top-[34%] text-blue-600 opacity-[0.14]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: Lightbulb, cls: "left-[6%] top-[58%] text-blue-400 opacity-[0.13]", size: "h-10 w-10", rot: 7, dur: 7, delay: 0.8 },
  { Icon: Award, cls: "right-[5%] top-[62%] text-sky-600 opacity-[0.14]", size: "h-11 w-11", rot: -5, dur: 8, delay: 1.4 },
  { Icon: Languages, cls: "left-[10%] top-[84%] text-blue-500 opacity-[0.12]", size: "h-8 w-8", rot: 9, dur: 6, delay: 0.6 },
  { Icon: Mic, cls: "right-[15%] top-[86%] text-cyan-500 opacity-[0.12]", size: "h-9 w-9", rot: -8, dur: 6.5, delay: 1 },
];

export default function InterviewBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-[540px] bg-gradient-to-br from-blue-300/45 via-sky-200/35 to-cyan-200/45 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      {ENTRY_DOODLES.map((doodle, i) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${doodle.cls}`}
            animate={
              reduce
                ? undefined
                : { y: [0, -10, 0], rotate: [0, doodle.rot, 0] }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: doodle.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: doodle.delay,
                  }
            }
          >
            <Icon className={doodle.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}
