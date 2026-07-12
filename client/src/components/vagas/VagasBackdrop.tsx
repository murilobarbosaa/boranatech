import { motion } from "framer-motion";
import { Briefcase, Handshake, IdCard, Mail, Sparkles } from "lucide-react";

// Doodles tematicos de vagas do cenario de entrada, no padrao exato dos
// ENTRY_DOODLES do LinkedinBackdrop (loop lento de y/rotate; reduce para
// tudo), com a identidade cyan/sky/amber da pagina.
const ENTRY_DOODLES = [
  {
    Icon: Briefcase,
    cls: "left-[4%] top-[6%] text-cyan-600 opacity-[0.16]",
    size: "h-12 w-12",
    rot: 6,
    dur: 7,
    delay: 0,
  },
  {
    Icon: IdCard,
    cls: "right-[6%] top-[8%] text-amber-500 opacity-[0.15]",
    size: "h-10 w-10",
    rot: -6,
    dur: 8,
    delay: 0.5,
  },
  {
    Icon: Handshake,
    cls: "left-[14%] top-[30%] text-sky-500 opacity-[0.13]",
    size: "h-9 w-9",
    rot: 8,
    dur: 7.5,
    delay: 0.3,
  },
  {
    Icon: Mail,
    cls: "right-[12%] top-[34%] text-cyan-700 opacity-[0.14]",
    size: "h-10 w-10",
    rot: -7,
    dur: 6.5,
    delay: 1.1,
  },
  {
    Icon: Sparkles,
    cls: "left-[6%] top-[58%] text-cyan-500 opacity-[0.13]",
    size: "h-10 w-10",
    rot: 7,
    dur: 7,
    delay: 0.8,
  },
  {
    Icon: Briefcase,
    cls: "right-[5%] top-[62%] text-sky-600 opacity-[0.14]",
    size: "h-11 w-11",
    rot: -5,
    dur: 8,
    delay: 1.4,
  },
  {
    Icon: Mail,
    cls: "left-[10%] top-[84%] text-cyan-600 opacity-[0.12]",
    size: "h-8 w-8",
    rot: 9,
    dur: 6,
    delay: 0.6,
  },
  {
    Icon: Handshake,
    cls: "right-[15%] top-[86%] text-amber-600 opacity-[0.12]",
    size: "h-9 w-9",
    rot: -8,
    dur: 6.5,
    delay: 1,
  },
];

// Cenario vivo da pagina de vagas: espelho estrutural do LinkedinBackdrop
// (overlay de gradiente de marca na regiao superior com fade pro fundo +
// doodles flutuantes), em cyan.
export default function VagasBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-[540px] bg-gradient-to-br from-cyan-300/45 via-sky-200/35 to-amber-200/45 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
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
