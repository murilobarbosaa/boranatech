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
} from "lucide-react";

import { FROM_MONTHLY_LABEL } from "@shared/planPricing";
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
  {
    id: "estudos",
    // TODO(Ana): validar nome da estrela do plano de carreira
    name: "Plano de Carreira",
    icon: CalendarCheck,
    position: { x: 18, y: 45 },
  },
  {
    id: "curriculo",
    name: "Currículo",
    icon: FileText,
    position: { x: 70, y: 12 },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    position: { x: 88, y: 46 },
  },
  {
    id: "portfolio",
    name: "Portfólio",
    icon: Github,
    position: { x: 62, y: 70 },
  },
  {
    id: "entrevistas",
    name: "Entrevistas",
    icon: Mic,
    position: { x: 22, y: 85 },
  },
];

const CONNECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["roadmaps", "estudos"],
  ["estudos", "portfolio"],
  ["curriculo", "linkedin"],
  ["curriculo", "portfolio"],
  ["portfolio", "entrevistas"],
];

const VIEWBOX_W = 1400;
const VIEWBOX_H = 600;

const PRO_SHORTCUTS: Array<{ icon: LucideIcon; name: string; href: string }> = [
  { icon: FileText, name: "Currículo", href: "/curriculo/analisar" },
  { icon: Linkedin, name: "LinkedIn", href: "/linkedin/analisar" },
  { icon: Github, name: "Portfólio", href: "/portfolio/analisar" },
  { icon: Mic, name: "Entrevistas", href: "/entrevistas" }, // TODO(Ana): validar nome do atalho
];

const SHORTCUT_COLORS: Array<{
  card: string;
  iconWrap: string;
  icon: string;
  arrow: string;
}> = [
  {
    card: "border-violet-400/40 hover:border-violet-300 hover:shadow-[0_0_28px_rgba(167,139,250,0.45)]",
    iconWrap: "border-violet-400/50 bg-violet-500/20",
    icon: "text-violet-200",
    arrow: "text-violet-300/70 group-hover:text-violet-200",
  },
  {
    card: "border-fuchsia-400/40 hover:border-fuchsia-300 hover:shadow-[0_0_28px_rgba(232,121,249,0.45)]",
    iconWrap: "border-fuchsia-400/50 bg-fuchsia-500/20",
    icon: "text-fuchsia-200",
    arrow: "text-fuchsia-300/70 group-hover:text-fuchsia-200",
  },
  {
    card: "border-sky-400/40 hover:border-sky-300 hover:shadow-[0_0_28px_rgba(56,189,248,0.45)]",
    iconWrap: "border-sky-400/50 bg-sky-500/20",
    icon: "text-sky-200",
    arrow: "text-sky-300/70 group-hover:text-sky-200",
  },
  {
    card: "border-pink-400/40 hover:border-pink-300 hover:shadow-[0_0_28px_rgba(244,114,182,0.45)]",
    iconWrap: "border-pink-400/50 bg-pink-500/20",
    icon: "text-pink-200",
    arrow: "text-pink-300/70 group-hover:text-pink-200",
  },
];

const STAR_COLORS = [
  "#C084FC",
  "#E879F9",
  "#A78BFA",
  "#F0ABFC",
  "#D8B4FE",
  "#F472B6",
  "#C4B5FD",
  "#F5D0FE",
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
      className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 py-20 md:py-24"
    >
      <BackgroundDecoration />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-6 bg-gradient-to-r from-fuchsia-300 via-violet-200 to-fuchsia-300 bg-clip-text font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-transparent"
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
            Tudo isso, em uma{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              assinatura
            </span>
            .
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base md:text-lg font-medium text-violet-100"
          >
            {/* TODO(Ana): revisar copy sem contagem de ferramentas */}
            Ferramentas com IA pra entrar em TI. Currículo, LinkedIn,
            portfólio, entrevista e mais.
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
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </Link>
          <p className="text-sm text-violet-200">
            A partir de {FROM_MONTHLY_LABEL}/mês no plano anual.
          </p>
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
      className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 py-16 md:py-20"
    >
      <BackgroundDecoration />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-4 bg-gradient-to-r from-fuchsia-300 via-violet-200 to-fuchsia-300 bg-clip-text font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-transparent"
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
            Olá,{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              {displayName}
            </span>
            ! 👋
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg font-medium text-violet-100"
          >
            Suas 4 ferramentas favoritas estão aqui:
          </motion.p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {PRO_SHORTCUTS.map((tool, idx) => {
            const color = SHORTCUT_COLORS[idx % SHORTCUT_COLORS.length];
            return (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
              >
                <Link href={tool.href}>
                  <article
                    className={`group flex items-center gap-4 rounded-2xl border-2 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 ${color.card}`}
                  >
                    <span
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color.iconWrap}`}
                    >
                      <tool.icon
                        size={20}
                        className={color.icon}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-base font-black text-white">
                        {tool.name}
                      </p>
                      <p className="text-xs font-medium text-violet-200/80">
                        Acessar agora
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className={`shrink-0 transition-all group-hover:translate-x-1 ${color.arrow}`}
                    />
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm font-medium text-violet-200">
          <Link
            href="/perfil"
            className="underline decoration-fuchsia-400/50 underline-offset-4 hover:decoration-fuchsia-300"
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

  const starsByPositionX = (s: ConstellationStar) =>
    (s.position.x / 100) * VIEWBOX_W;
  const starsByPositionY = (s: ConstellationStar) =>
    (s.position.y / 100) * VIEWBOX_H;

  return (
    <div className="relative mx-auto w-full max-w-[1400px]">
      {/* TODO(Ana): validar aria-label sem contagem de ferramentas */}
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-auto w-full max-h-[40vh]"
        role="img"
        aria-label="Constelação interativa das ferramentas Pro"
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
              stroke={
                isActive ? "rgba(240,171,252,0.95)" : "rgba(192,132,252,0.32)"
              }
              strokeWidth={isActive ? 3 : 1.5}
              strokeDasharray={isActive ? "0" : "4 4"}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={reduce ? undefined : { opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: 0.9 + idx * 0.05,
                ease: "easeOut",
              }}
              className="transition-[stroke,stroke-width] duration-300"
            />
          );
        })}

        {STARS.map((star, idx) => {
          const cx = starsByPositionX(star);
          const cy = starsByPositionY(star);
          const isHovered = hovered === star.id;
          const isConnected = connectedSet.has(star.id);
          const baseOpacity = !hovered
            ? 0.7
            : isHovered
              ? 1
              : isConnected
                ? 0.85
                : 0.5;
          const radius = isHovered ? 22 : 13;
          const labelAnchor: "start" | "end" | "middle" =
            star.position.x < 15
              ? "start"
              : star.position.x > 85
                ? "end"
                : "middle";

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
              onClick={() =>
                setHovered((prev) => (prev === star.id ? null : star.id))
              }
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: 0.2 + idx * 0.08,
                ease: "backOut",
              }}
              className="cursor-pointer outline-none focus-visible:[&_circle]:stroke-fuchsia-200"
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <motion.circle
                cx={cx}
                cy={cy}
                animate={{ r: radius, opacity: baseOpacity }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                fill={
                  isHovered
                    ? "#FAE8FF"
                    : STAR_COLORS[idx % STAR_COLORS.length]
                }
                filter="url(#star-glow)"
                stroke="transparent"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={star.position.y > 60 ? cy - 28 : cy + 42}
                textAnchor={labelAnchor}
                fill="#faf5ff"
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
            "radial-gradient(circle at center, rgba(192,132,252,0.18), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,121,249,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[5%] h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.24) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[18%] top-[8%] h-[360px] w-[360px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,70,239,0.18) 0%, transparent 70%)",
          filter: "blur(46px)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
