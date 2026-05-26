import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  FileText,
  Github,
  Linkedin,
  type LucideIcon,
  Map,
  Mic,
  Send,
  TrendingUp,
} from "lucide-react";

import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

type ConstellationStar = {
  id: string;
  name: string;
  icon: LucideIcon;
  position: { x: number; y: number };
};

const STARS: ConstellationStar[] = [
  { id: "roadmaps", name: "Roadmaps", icon: Map, position: { x: 8, y: 15 } },
  { id: "estudos", name: "Plano de estudos", icon: CalendarCheck, position: { x: 18, y: 45 } },
  { id: "curriculo", name: "Currículo", icon: FileText, position: { x: 70, y: 12 } },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, position: { x: 88, y: 38 } },
  { id: "portfolio", name: "Portfólio", icon: Github, position: { x: 50, y: 58 } },
  { id: "entrevistas", name: "Entrevistas", icon: Mic, position: { x: 22, y: 85 } },
  { id: "empregabilidade", name: "Empregabilidade", icon: TrendingUp, position: { x: 58, y: 82 } },
  { id: "networking", name: "Networking", icon: Send, position: { x: 92, y: 92 } },
];

const CONNECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["roadmaps", "estudos"],
  ["roadmaps", "empregabilidade"],
  ["estudos", "portfolio"],
  ["curriculo", "linkedin"],
  ["curriculo", "portfolio"],
  ["portfolio", "entrevistas"],
  ["portfolio", "empregabilidade"],
  ["entrevistas", "empregabilidade"],
  ["linkedin", "networking"],
  ["empregabilidade", "networking"],
];

const VIEWBOX_W = 1400;
const VIEWBOX_H = 600;

const PRO_SHORTCUTS: Array<{ icon: LucideIcon; name: string; href: string }> = [
  { icon: FileText, name: "Currículo", href: "/curriculo/analisar" },
  { icon: Linkedin, name: "LinkedIn", href: "/curriculo/linkedin" },
  { icon: Github, name: "Portfólio", href: "/portfolio/analisar" },
  { icon: Mic, name: "Simulador", href: "/entrevistas/simulador" },
];

export default function Pro() {
  const { user } = useAuth();
  const { isPro, loading } = useSubscription();

  if (loading) return null;

  const showThankYou = !!user && isPro;
  return showThankYou ? <ProThankYouVariant /> : <ProPitchVariant />;
}

function ProPitchVariant() {
  return (
    <section
      aria-labelledby="pro-pitch-title"
      className="relative overflow-hidden bg-slate-950 py-20 md:py-24"
    >
      <BackgroundDecoration />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-6 font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-400"
          >
            Bora na Tech? Pro
          </motion.p>

          <motion.h2
            id="pro-pitch-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 font-display font-black leading-[1.05] text-white"
            style={{ fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)" }}
          >
            Tudo isso, em uma <span className="text-amber-400">assinatura</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base md:text-lg font-medium text-slate-300"
          >
            8 ferramentas com IA pra entrar em TI. Currículo, LinkedIn, portfólio, entrevista e mais.
          </motion.p>
        </div>

        <div className="mt-8 md:mt-10">
          <Constellation />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 md:mt-10 flex flex-col items-center gap-4"
        >
          <Link href="/planos">
            <button
              type="button"
              aria-label="Ver planos do Bora na Tech? Pro"
              className="pro-glare bnt-pressable group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-display text-base md:text-lg font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
            >
              <ProStarIcon />
              <span>Ver planos</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
          <p className="text-sm text-slate-400">A partir de R$ 14,99/mês no plano anual.</p>
        </motion.div>
      </div>
    </section>
  );
}

function ProThankYouVariant() {
  const { profile, user } = useAuth();
  const displayName =
    (profile?.name && profile.name.split(" ")[0]) ||
    user?.email?.split("@")[0] ||
    "você";

  return (
    <section
      aria-labelledby="pro-thanks-title"
      className="relative overflow-hidden bg-slate-950 py-16 md:py-20"
    >
      <BackgroundDecoration />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-400"
          >
            Obrigado pelo Pro
          </motion.p>

          <motion.h2
            id="pro-thanks-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-3 font-display font-black leading-[1.05] text-white"
            style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)" }}
          >
            Olá, <span className="text-amber-400">{displayName}</span>! 👋
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg font-medium text-slate-300"
          >
            Suas 4 ferramentas favoritas estão aqui:
          </motion.p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {PRO_SHORTCUTS.map((tool, idx) => (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
            >
              <Link href={tool.href}>
                <article className="group flex items-center gap-4 rounded-2xl border-2 border-amber-400/30 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-white/10">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10">
                    <tool.icon size={20} className="text-amber-400" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-base font-black text-white">{tool.name}</p>
                    <p className="text-xs font-medium text-slate-400">Acessar agora</p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 text-amber-400/60 transition-all group-hover:translate-x-1 group-hover:text-amber-400"
                  />
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm font-medium text-slate-400">
          <Link
            href="/perfil"
            className="underline decoration-amber-400/40 underline-offset-4 hover:decoration-amber-400"
          >
            Acesse seu perfil
          </Link>{" "}
          pra ver assinatura e cobranças.
        </p>
      </div>
    </section>
  );
}

function Constellation() {
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const connectedSet = useMemo(() => {
    if (!hovered) return new Set<string>();
    const set = new Set<string>();
    for (const [a, b] of CONNECTIONS) {
      if (a === hovered) set.add(b);
      if (b === hovered) set.add(a);
    }
    return set;
  }, [hovered]);

  const starsByPositionX = (s: ConstellationStar) => (s.position.x / 100) * VIEWBOX_W;
  const starsByPositionY = (s: ConstellationStar) => (s.position.y / 100) * VIEWBOX_H;

  return (
    <div className="relative mx-auto w-full max-w-[1400px]">
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-auto w-full max-h-[40vh]"
        role="img"
        aria-label="Constelação interativa das 8 ferramentas Pro"
      >
        <defs>
          <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {CONNECTIONS.map(([from, to], idx) => {
          const fromStar = STARS.find((s) => s.id === from);
          const toStar = STARS.find((s) => s.id === to);
          if (!fromStar || !toStar) return null;
          const isActive = hovered === from || hovered === to;

          return (
            <motion.line
              key={`${from}-${to}`}
              x1={starsByPositionX(fromStar)}
              y1={starsByPositionY(fromStar)}
              x2={starsByPositionX(toStar)}
              y2={starsByPositionY(toStar)}
              stroke={isActive ? "rgba(252,211,77,1)" : "rgba(255,184,0,0.22)"}
              strokeWidth={isActive ? 3 : 1.5}
              strokeDasharray={isActive ? "0" : "4 4"}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={reduce ? undefined : { opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.9 + idx * 0.05, ease: "easeOut" }}
              className="transition-[stroke,stroke-width] duration-300"
            />
          );
        })}

        {STARS.map((star, idx) => {
          const cx = starsByPositionX(star);
          const cy = starsByPositionY(star);
          const isHovered = hovered === star.id;
          const isConnected = connectedSet.has(star.id);
          const baseOpacity = !hovered ? 0.7 : isHovered ? 1 : isConnected ? 0.85 : 0.5;
          const radius = isHovered ? 22 : 13;
          const labelAnchor: "start" | "end" | "middle" =
            star.position.x < 15 ? "start" : star.position.x > 85 ? "end" : "middle";

          return (
            <motion.g
              key={star.id}
              tabIndex={0}
              role="button"
              aria-label={star.name}
              onMouseEnter={() => setHovered(star.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(star.id)}
              onBlur={() => setHovered(null)}
              onClick={() => setHovered((prev) => (prev === star.id ? null : star.id))}
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.08, ease: "backOut" }}
              className="cursor-pointer outline-none focus-visible:[&_circle]:stroke-amber-300"
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <motion.circle
                cx={cx}
                cy={cy}
                animate={{ r: radius, opacity: baseOpacity }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                fill={isHovered ? "#FCD34D" : "#FFB800"}
                filter="url(#star-glow)"
                stroke="transparent"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={star.position.y > 60 ? cy - 28 : cy + 42}
                textAnchor={labelAnchor}
                fill="#f1f5f9"
                fontSize="26"
                fontWeight="800"
                fontFamily="Space Grotesk, sans-serif"
                className={`pointer-events-none transition-opacity duration-200 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                {star.name}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

function BackgroundDecoration() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,184,0,0.12), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,184,0,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[5%] h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        aria-hidden="true"
      />
    </>
  );
}

