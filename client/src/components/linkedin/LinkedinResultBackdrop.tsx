import { motion } from "framer-motion";
import { Linkedin, MessageCircle, Search, Sparkles } from "lucide-react";
import { FAIXA_WASH } from "@/components/linkedin/faixaUi";
import { cn } from "@/lib/utils";
import type { LinkedinFaixa } from "@shared/linkedin/schema";

// Doodles do cenario do RESULTADO: familia sky do LinkedinBackdrop da
// entrada, tintados pela pagina toda (nao so no topo), opacidade 0.08 a 0.14,
// SO nas margens externas, fora da coluna de leitura; escondidos abaixo de lg
// pra nunca atrapalhar o corpo denso. Espelho do RESULT_DOODLES do GitHub.
const RESULT_DOODLES = [
  {
    Icon: Linkedin,
    cls: "left-[3%] top-[6%] text-sky-500 opacity-[0.14]",
    size: "h-11 w-11",
    rot: 6,
    dur: 7,
    delay: 0,
  },
  {
    Icon: Search,
    cls: "right-[2%] top-[10%] text-amber-500 opacity-[0.12]",
    size: "h-10 w-10",
    rot: -6,
    dur: 8,
    delay: 0.6,
  },
  {
    Icon: MessageCircle,
    cls: "left-[2%] top-[30%] text-cyan-500 opacity-[0.10]",
    size: "h-9 w-9",
    rot: 8,
    dur: 7.5,
    delay: 0.3,
  },
  {
    Icon: Sparkles,
    cls: "right-[3%] top-[38%] text-sky-600 opacity-[0.11]",
    size: "h-10 w-10",
    rot: -7,
    dur: 6.5,
    delay: 1.1,
  },
  {
    Icon: Search,
    cls: "left-[2%] top-[58%] text-sky-400 opacity-[0.09]",
    size: "h-10 w-10",
    rot: 7,
    dur: 7,
    delay: 1,
  },
  {
    Icon: MessageCircle,
    cls: "right-[2%] top-[66%] text-cyan-600 opacity-[0.10]",
    size: "h-10 w-10",
    rot: -5,
    dur: 6.5,
    delay: 0.3,
  },
  {
    Icon: Sparkles,
    cls: "left-[3%] top-[86%] text-sky-500 opacity-[0.08]",
    size: "h-9 w-9",
    rot: 9,
    dur: 6,
    delay: 0.8,
  },
];

// Cenario do estado de resultado: o wash da FAIXA da nota (FAIXA_WASH) em
// DOIS focos (topo atras do hero + um segundo suave a meia pagina), sempre
// com fade antes das areas de leitura densa, e os doodles das margens ao
// longo de toda a altura. Espelho do ResultBackdrop do GitHub.
export default function LinkedinResultBackdrop({
  faixa,
  reduce,
}: {
  faixa: LinkedinFaixa;
  reduce: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-80 bg-gradient-to-b via-transparent to-transparent [mask-image:linear-gradient(to_bottom,black_40%,transparent)]",
          FAIXA_WASH[faixa],
        )}
      />
      <div
        className={cn(
          "absolute right-[-12%] top-[42%] h-96 w-[65%] rounded-full bg-gradient-to-tl via-transparent to-transparent blur-3xl",
          FAIXA_WASH[faixa],
        )}
      />
      {RESULT_DOODLES.map((doodle, i) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute hidden lg:block ${doodle.cls}`}
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
