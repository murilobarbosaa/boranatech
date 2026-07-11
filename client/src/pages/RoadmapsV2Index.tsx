import { Link, Redirect, useSearch } from "wouter";
import {
  ArrowRight,
  Compass,
  Flag,
  Footprints,
  Linkedin,
  Map,
  MapPin,
  Milestone,
  Mountain,
  Navigation,
  Route,
  Signpost,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { roadmapsV2 } from "@/lib/roadmapV2/content";
import type { RoadmapNode } from "@/lib/roadmapV2/types";
import { areasTI } from "@/lib/data";

// Trilhas kind "carreira" nao tem entrada em areasTI, entao icone e cor dos
// cards ficam definidos aqui, com fallback neutro pra trilhas futuras.
const CAREER_CARD_STYLE: Record<
  string,
  { icon: LucideIcon; tagClass: string }
> = {
  "comecar-do-zero": { icon: Compass, tagClass: "bg-emerald-500" },
  linkedin: { icon: Linkedin, tagClass: "bg-sky-500" },
};
const CAREER_CARD_FALLBACK: { icon: LucideIcon; tagClass: string } = {
  icon: Map,
  tagClass: "bg-slate-600",
};

const HERO_DOODLES = [
  {
    Icon: Map,
    cls: "left-[3%] top-[6%] text-violet-500 opacity-[0.16]",
    size: "h-12 w-12",
    rot: 6,
    dur: 7,
    delay: 0,
  },
  {
    Icon: Route,
    cls: "right-[5%] top-[5%] text-purple-500 opacity-[0.16]",
    size: "h-11 w-11",
    rot: -5,
    dur: 8,
    delay: 0.5,
  },
  {
    Icon: Milestone,
    cls: "left-[16%] top-[19%] text-violet-400 opacity-[0.13]",
    size: "h-9 w-9",
    rot: 9,
    dur: 8,
    delay: 0.2,
  },
  {
    Icon: Compass,
    cls: "right-[14%] top-[28%] text-violet-600 opacity-[0.15]",
    size: "h-10 w-10",
    rot: 7,
    dur: 6.5,
    delay: 1.1,
  },
  {
    Icon: MapPin,
    cls: "left-[7%] top-[36%] text-purple-400 opacity-[0.15]",
    size: "h-10 w-10",
    rot: -6,
    dur: 7,
    delay: 0.3,
  },
  {
    Icon: Signpost,
    cls: "right-[7%] top-[56%] text-purple-600 opacity-[0.14]",
    size: "h-11 w-11",
    rot: -7,
    dur: 7.5,
    delay: 0.8,
  },
  {
    Icon: Flag,
    cls: "left-[10%] top-[62%] text-violet-500 opacity-[0.14]",
    size: "h-9 w-9",
    rot: 7,
    dur: 6,
    delay: 1.4,
  },
  {
    Icon: Navigation,
    cls: "right-[17%] top-[76%] text-purple-500 opacity-[0.13]",
    size: "h-9 w-9",
    rot: -8,
    dur: 6.5,
    delay: 1.6,
  },
  {
    Icon: Footprints,
    cls: "left-[6%] top-[86%] text-violet-600 opacity-[0.13]",
    size: "h-9 w-9",
    rot: 6,
    dur: 7,
    delay: 0.6,
  },
  {
    Icon: Mountain,
    cls: "right-[9%] top-[88%] text-violet-500 opacity-[0.13]",
    size: "h-10 w-10",
    rot: -6,
    dur: 6,
    delay: 1.2,
  },
];

function hasProjectNode(nodes: RoadmapNode[]): boolean {
  return nodes.some(
    (node) =>
      Boolean(node.project) ||
      (node.children ? hasProjectNode(node.children) : false),
  );
}

function HeroDoodles({ reduce }: { reduce: boolean | null }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {HERO_DOODLES.map((doodle, i) => {
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

function TrailMascot({
  className,
  body,
  reduce,
  delay,
}: {
  className: string;
  body: string;
  reduce: boolean | null;
  delay: number;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-0 ${className}`}
      aria-hidden
      animate={reduce ? undefined : { y: [0, -9, 0], rotate: [0, 4, 0] }}
      transition={
        reduce
          ? undefined
          : { duration: 4.6, repeat: Infinity, ease: "easeInOut", delay }
      }
    >
      <svg viewBox="0 0 64 74" className="h-full w-full" fill="none">
        <path
          d="M32 4 L40 15 L32 17 Z"
          fill="#ef4444"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="32" y1="6" x2="32" y2="24" stroke="#0f172a" strokeWidth="3" />
        <rect
          x="9"
          y="22"
          width="46"
          height="40"
          rx="15"
          fill={body}
          stroke="#0f172a"
          strokeWidth="3.5"
        />
        <circle
          cx="24"
          cy="39"
          r="5.5"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <circle
          cx="40"
          cy="39"
          r="5.5"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <circle cx="25" cy="40" r="2.2" fill="#0f172a" />
        <circle cx="41" cy="40" r="2.2" fill="#0f172a" />
        <path
          d="M23 49 Q32 56 41 49"
          fill="none"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect
          x="17"
          y="61"
          width="9"
          height="7"
          rx="2.5"
          fill={body}
          stroke="#0f172a"
          strokeWidth="3"
        />
        <rect
          x="38"
          y="61"
          width="9"
          height="7"
          rx="2.5"
          fill={body}
          stroke="#0f172a"
          strokeWidth="3"
        />
        <circle cx="15" cy="34" r="3" fill="#fda4af" opacity="0.85" />
        <circle cx="49" cy="34" r="3" fill="#fda4af" opacity="0.85" />
      </svg>
    </motion.div>
  );
}

export default function RoadmapsV2Index() {
  const search = useSearch();
  const reduce = useReducedMotion();
  const areaParam = new URLSearchParams(search).get("area");
  if (areaParam && roadmapsV2.some((r) => r.slug === areaParam)) {
    return <Redirect to={`/roadmaps/${areaParam}`} />;
  }

  return (
    <Layout>
      <SEO
        title="Roadmaps grátis · Escolha sua trilha"
        description="Um passo a passo gratuito por área, do primeiro conceito ao nível avançado."
        url="/roadmaps"
        schemaType="CollectionPage"
      />

      <section className="relative overflow-hidden bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-violet-300/45 via-fuchsia-200/35 to-amber-200/45"
          aria-hidden
        />
        <HeroDoodles reduce={reduce} />
        <TrailMascot
          className="right-[3%] top-4 hidden h-20 w-20 sm:block sm:h-28 sm:w-28"
          body="#8b5cf6"
          reduce={reduce}
          delay={0}
        />
        <TrailMascot
          className="right-[14%] top-28 hidden h-14 w-14 md:block"
          body="#f59e0b"
          reduce={reduce}
          delay={0.8}
        />
        <div className="relative z-10 mx-auto max-w-[1180px] px-5 pb-20 pt-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span className="inline-block rounded-full border-2 border-slate-900 bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[2px_2px_0_#0f172a]">
              100% grátis
            </span>
            {/* TODO(Ana): confirmar termo final (Básico vs Grátis vs outro) e revisar a frase do hero */}
            <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
              Roadmap Básico
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Escolha sua trilha: um passo a passo por área, do primeiro
              conceito ao nível avançado.
            </p>

            {/* roadmap-generator e Pro (requiresPro em server/lib/aiTools.ts),
                por isso o selo Pro; o gate em si vive na pagina /roadmaps/ia. */}
            <motion.div
              animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 1.9, repeat: Infinity, ease: "easeInOut" }
              }
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              className="mt-5 inline-flex"
            >
              <Link
                href="/roadmaps/ia"
                className="inline-flex items-center gap-2 rounded-full border-[2.5px] border-slate-900 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-[3px_3px_0_#0f172a,0_0_22px_rgba(168,85,247,0.65)] transition-shadow hover:shadow-[5px_5px_0_#0f172a,0_0_32px_rgba(168,85,247,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
              >
                <Sparkles
                  className="h-4 w-4 motion-safe:animate-pulse"
                  aria-hidden="true"
                />
                {/* TODO(Ana): copy do botao de roadmap com IA */}
                Criar roadmap com IA
                <ProStarIcon className="ml-0.5" />
              </Link>
            </motion.div>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roadmapsV2
              .filter((r) => r.kind !== "carreira")
              .map((r, index) => {
                const area = areasTI.find((x) => x.slug === r.slug);
                if (!area) return null;
                const Icon = area.icon;
                const hasProject = r.sections.some((section) =>
                  hasProjectNode(section.children),
                );
                const isMultiStack = Boolean(
                  r.languages && r.languages.length > 0,
                );
                const stepCount = r.sections.reduce(
                  (sum, section) => sum + section.children.length,
                  0,
                );

                return (
                  <motion.div
                    key={r.slug}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.04, 0.4),
                    }}
                  >
                    <Link
                      href={`/roadmaps/${r.slug}`}
                      className="bnt-pressable group flex h-full flex-col overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#FCC700] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#FCC700]"
                    >
                      <span
                        aria-hidden
                        className={`-mx-5 -mt-5 mb-4 h-2 ${area.tagClass}`}
                      />
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border-[2px] border-slate-900 ${area.tagClass}`}
                        >
                          <Icon className="h-[19px] w-[19px] text-white" />
                        </span>
                        <h2 className="text-[15px] font-bold leading-tight text-slate-900">
                          {area.nome}
                        </h2>
                      </div>

                      <p className="mt-3 line-clamp-2 text-[13px] text-slate-600">
                        {area.descricaoCurta}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">
                          {r.sections.length} etapas
                        </span>
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">
                          {stepCount} passos
                        </span>
                        {hasProject && (
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                            Projeto prático
                          </span>
                        )}
                        {isMultiStack && (
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-violet-100 px-2 py-0.5 text-[11px] font-black text-violet-800">
                            Multi-stack
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
                        <span className="text-[11px] text-slate-400">
                          iniciante → avançado
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </div>

          <div className="mt-14">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
                Trilhas de carreira
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                Caminhos por objetivo de carreira, da base ao próximo passo.
              </p>
            </motion.div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {roadmapsV2
                .filter((r) => r.kind === "carreira")
                .map((r, index) => {
                  const style =
                    CAREER_CARD_STYLE[r.slug] ?? CAREER_CARD_FALLBACK;
                  const Icon = style.icon;
                  const stepCount = r.sections.reduce(
                    (sum, section) => sum + section.children.length,
                    0,
                  );
                  return (
                    <motion.div
                      key={r.slug}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(index * 0.04, 0.4),
                      }}
                    >
                      <Link
                        href={`/roadmaps/${r.slug}`}
                        className="bnt-pressable group flex h-full flex-col overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#FCC700] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#FCC700]"
                      >
                        <span
                          aria-hidden
                          className={`-mx-5 -mt-5 mb-4 h-2 ${style.tagClass}`}
                        />
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border-[2px] border-slate-900 ${style.tagClass}`}
                          >
                            <Icon className="h-[19px] w-[19px] text-white" />
                          </span>
                          <h2 className="text-[15px] font-bold leading-tight text-slate-900">
                            {r.title}
                          </h2>
                        </div>

                        <p className="mt-3 line-clamp-2 text-[13px] text-slate-600">
                          {r.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                            carreira
                          </span>
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">
                            {r.sections.length} etapas
                          </span>
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">
                            {stepCount} passos
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
                          <span className="text-[11px] text-slate-400">
                            trilha de carreira
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
