import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

// =========================================
// DADOS DOS NÚMEROS
// =========================================

type StatColor = "amber" | "violet" | "white";

interface Stat {
  value: number;
  prefix: string;
  label: string;
  description: string;
  color: StatColor;
}

const STATS: Stat[] = [
  {
    value: 250,
    prefix: "+",
    label: "termos",
    description: "no dicionário de TI",
    color: "amber",
  },
  {
    value: 100,
    prefix: "+",
    label: "roadmaps",
    description: "prontos pra você seguir",
    color: "violet",
  },
  {
    value: 60,
    prefix: "+",
    label: "tecnologias",
    description: "mapeadas e explicadas",
    color: "white",
  },
  {
    value: 90,
    prefix: "+",
    label: "perguntas",
    description: "no quiz de carreira",
    color: "amber",
  },
];

// =========================================
// COMPONENTE AnimatedNumber
// =========================================

function AnimatedNumber({
  value,
  shouldAnimate,
  prefix = "",
}: {
  value: number;
  shouldAnimate: boolean;
  prefix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    // Conta de 0 até o valor final em 2s, easeOut pra desacelerar no fim
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });

    // Re-renderiza o display a cada step do motion value (já arredondado)
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [shouldAnimate, value, count, rounded]);

  return (
    <span>
      {prefix}
      {display}
    </span>
  );
}

// =========================================
// COMPONENTE StatBlock
// =========================================

function StatBlock({
  stat,
  index,
  shouldAnimate,
  isLast,
}: {
  stat: Stat;
  index: number;
  shouldAnimate: boolean;
  isLast: boolean;
}) {
  const colorClasses: Record<StatColor, string> = {
    amber: "text-amber-400",
    violet: "text-violet-400",
    white: "text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative flex-1 px-6 md:px-8 text-center"
    >
      <div
        className={`font-display font-black leading-none ${colorClasses[stat.color]}`}
        style={{ fontSize: "clamp(64px, 9vw, 120px)" }}
      >
        <AnimatedNumber value={stat.value} shouldAnimate={shouldAnimate} prefix={stat.prefix} />
      </div>

      <p className="mt-4 font-display text-lg md:text-xl font-black text-white uppercase tracking-wider">
        {stat.label}
      </p>

      <p className="mt-2 text-sm md:text-base font-medium text-slate-400">{stat.description}</p>

      {/* Divisor vertical desktop only — gradient amber transparente nas pontas */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-1/2 right-0 -translate-y-1/2 h-24 w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(251, 191, 36, 0.4) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}

// =========================================
// BACKGROUND DECORATION (blobs amber/violet sutis)
// =========================================

function BackgroundDecoration() {
  return (
    <>
      {/* Blob amber topo esquerdo */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, 40, -20, 0],
          opacity: [0.4, 0.6, 0.5, 0.4],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />

      {/* Blob violet meio direita */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          right: "-10%",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 50, -30, 0],
          opacity: [0.3, 0.5, 0.4, 0.3],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        aria-hidden="true"
      />

      {/* Blob amber inferior centro */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          left: "30%",
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 60%)",
          filter: "blur(70px)",
        }}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -30, 40, 0],
          opacity: [0.3, 0.5, 0.3, 0.3],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
        aria-hidden="true"
      />
    </>
  );
}

// =========================================
// SEÇÃO PRINCIPAL
// =========================================

export default function Numeros() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {
    once: true,
    margin: "-100px",
  });

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 md:py-32 bg-slate-950">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-400"
          >
            A plataforma em números
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-white leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5.5vw, 64px)" }}
          >
            Tudo que você encontra aqui,{" "}
            <span className="text-amber-400">em um lugar.</span>
          </motion.h2>
        </div>

        <div className="mt-20 flex flex-col md:flex-row gap-12 md:gap-0">
          {STATS.map((stat, index) => (
            <StatBlock
              key={stat.label}
              stat={stat}
              index={index}
              shouldAnimate={isInView}
              isLast={index === STATS.length - 1}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-20 text-center text-sm font-medium text-slate-500"
        >
          Todos os dados são reais e atualizados.
        </motion.p>
      </div>
    </section>
  );
}
