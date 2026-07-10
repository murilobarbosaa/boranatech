import { motion } from "framer-motion";
import {
  Compass,
  Flag,
  Footprints,
  Map,
  MapPin,
  Milestone,
  Route,
  Signpost,
} from "lucide-react";

// Cenarios vivos do Plano de Carreira no padrao atual do PortfolioAnalisar
// (RD2.10): overlay de gradiente com fade + doodles em loop lento de y/rotate,
// reduce desliga tudo. Doodles na linguagem do MAPA (trilha, bandeira,
// marcos), acento amber. Ambos pointer-events-none, aria-hidden, z-0.

type Doodle = {
  Icon: typeof Map;
  cls: string;
  size: string;
  rot: number;
  dur: number;
  delay: number;
};

const ENTRY_DOODLES: Doodle[] = [
  { Icon: Map, cls: "left-[4%] top-[6%] text-amber-600 opacity-[0.16]", size: "h-12 w-12", rot: 6, dur: 7, delay: 0 },
  { Icon: Flag, cls: "right-[6%] top-[8%] text-orange-500 opacity-[0.15]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.5 },
  { Icon: Compass, cls: "left-[14%] top-[30%] text-amber-500 opacity-[0.13]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: Milestone, cls: "right-[12%] top-[34%] text-amber-700 opacity-[0.14]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: Route, cls: "left-[6%] top-[58%] text-orange-400 opacity-[0.13]", size: "h-10 w-10", rot: 7, dur: 7, delay: 0.8 },
  { Icon: Signpost, cls: "right-[5%] top-[62%] text-amber-600 opacity-[0.14]", size: "h-11 w-11", rot: -5, dur: 8, delay: 1.4 },
  { Icon: Footprints, cls: "left-[10%] top-[84%] text-amber-500 opacity-[0.12]", size: "h-8 w-8", rot: 9, dur: 6, delay: 0.6 },
  { Icon: MapPin, cls: "right-[15%] top-[86%] text-orange-500 opacity-[0.12]", size: "h-9 w-9", rot: -8, dur: 6.5, delay: 1 },
];

const RESULT_DOODLES: Doodle[] = [
  { Icon: Map, cls: "left-[3%] top-[6%] text-amber-600 opacity-[0.14]", size: "h-11 w-11", rot: 6, dur: 7, delay: 0 },
  { Icon: Flag, cls: "right-[2%] top-[10%] text-orange-500 opacity-[0.12]", size: "h-10 w-10", rot: -6, dur: 8, delay: 0.6 },
  { Icon: Compass, cls: "left-[2%] top-[30%] text-amber-500 opacity-[0.10]", size: "h-9 w-9", rot: 8, dur: 7.5, delay: 0.3 },
  { Icon: Milestone, cls: "right-[3%] top-[38%] text-amber-700 opacity-[0.11]", size: "h-10 w-10", rot: -7, dur: 6.5, delay: 1.1 },
  { Icon: Route, cls: "left-[2%] top-[58%] text-orange-400 opacity-[0.09]", size: "h-10 w-10", rot: 7, dur: 7, delay: 1 },
  { Icon: Signpost, cls: "right-[2%] top-[66%] text-amber-600 opacity-[0.10]", size: "h-10 w-10", rot: -5, dur: 6.5, delay: 0.3 },
  { Icon: Footprints, cls: "left-[3%] top-[86%] text-amber-500 opacity-[0.08]", size: "h-9 w-9", rot: 9, dur: 6, delay: 0.8 },
];

function DoodleLayer({
  doodles,
  reduce,
  marginOnly,
}: {
  doodles: Doodle[];
  reduce: boolean;
  marginOnly?: boolean;
}) {
  return (
    <>
      {doodles.map((doodle, i) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${marginOnly ? "hidden lg:block " : ""}${doodle.cls}`}
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
    </>
  );
}

// Cenario do estado de ENTRADA (vitrine, intake, ProGate): gradiente de marca
// em tons amber na regiao superior com fade pro fundo + doodles flutuantes.
export function CareerPlanEntryBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-[540px] bg-gradient-to-br from-amber-300/45 via-yellow-200/35 to-orange-200/45 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />
      <DoodleLayer doodles={ENTRY_DOODLES} reduce={reduce} />
    </div>
  );
}

// Cenario do estado de RESULTADO (PlanView): wash amber em dois focos com
// fade antes da leitura densa; doodles so nas margens externas e escondidos
// abaixo de lg pra nunca atrapalhar o corpo.
export function CareerPlanResultBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-amber-300/40 via-transparent to-transparent [mask-image:linear-gradient(to_bottom,black_40%,transparent)]" />
      <div className="absolute right-[-12%] top-[42%] h-96 w-[65%] rounded-full bg-gradient-to-tl from-amber-200/40 via-transparent to-transparent blur-3xl" />
      <DoodleLayer doodles={RESULT_DOODLES} reduce={reduce} marginOnly />
    </div>
  );
}
