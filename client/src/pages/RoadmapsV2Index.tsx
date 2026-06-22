import { Link, Redirect, useSearch } from "wouter";
import { ArrowRight, Compass, Flag, Map, Route } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { roadmapsV2 } from "@/lib/roadmapV2/content";
import type { RoadmapNode } from "@/lib/roadmapV2/types";
import { areasTI, roadmaps } from "@/lib/data";
import { PRESERVED_TRAILS } from "@/pages/RoadmapCarreira";

const HERO_DOODLES = [
  { Icon: Map, pos: "left-[3%] top-[22%]", size: "h-12 w-12", rot: 6, dur: 8 },
  { Icon: Route, pos: "right-[5%] top-[16%]", size: "h-11 w-11", rot: -5, dur: 9 },
  { Icon: Compass, pos: "right-[16%] bottom-[20%]", size: "h-10 w-10", rot: 7, dur: 10 },
  { Icon: Flag, pos: "left-[12%] bottom-[14%]", size: "h-9 w-9", rot: -6, dur: 8.5 },
];

function hasProjectNode(nodes: RoadmapNode[]): boolean {
  return nodes.some(
    (node) =>
      Boolean(node.project) ||
      (node.children ? hasProjectNode(node.children) : false),
  );
}

function HeroDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {HERO_DOODLES.map((doodle) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={doodle.pos}
            aria-hidden
            className={`absolute text-slate-900 ${doodle.pos}`}
            style={{ opacity: 0.08 }}
            animate={{ y: [0, -10, 0], rotate: [0, doodle.rot, 0] }}
            transition={{ duration: doodle.dur, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className={doodle.size} />
          </motion.span>
        );
      })}
    </div>
  );
}

export default function RoadmapsV2Index() {
  const search = useSearch();
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
        <HeroDoodles />
        <div className="relative z-10 mx-auto max-w-[1180px] px-5 pb-20 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span className="inline-block rounded-full border-2 border-slate-900 bg-emerald-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[2px_2px_0_#0f172a]">
              100% grátis
            </span>
            <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
              Roadmap grátis
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Escolha sua trilha: um passo a passo por área, do primeiro conceito
              ao nível avançado.
            </p>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roadmapsV2.map((r, index) => {
              const area = areasTI.find((x) => x.slug === r.slug);
              if (!area) return null;
              const Icon = area.icon;
              const hasProject = r.sections.some((section) =>
                hasProjectNode(section.children),
              );
              const isMultiStack = Boolean(r.languages && r.languages.length > 0);
              const stepCount = r.sections.reduce(
                (sum, section) => sum + section.children.length,
                0,
              );

              return (
                <motion.div
                  key={r.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index * 0.04, 0.4),
                  }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={`/roadmaps/${r.slug}`}
                    className="bnt-pressable group flex h-full flex-col rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a] transition-shadow hover:shadow-[5px_5px_0_#0f172a]"
                  >
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
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
              Trilhas de carreira
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
              Caminhos por objetivo de carreira, da base ao próximo passo.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PRESERVED_TRAILS.map((t, index) => {
                const rm = roadmaps.find((r) => r.id === t.roadmapId);
                if (!rm) return null;
                const Icon = t.icon;
                return (
                  <motion.div
                    key={t.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.04, 0.4),
                    }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/roadmaps/${t.slug}`}
                      className="bnt-pressable group flex h-full flex-col rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a] transition-shadow hover:shadow-[5px_5px_0_#0f172a]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border-[2px] border-slate-900 ${t.tagClass}`}
                        >
                          <Icon className="h-[19px] w-[19px] text-white" />
                        </span>
                        <h2 className="text-[15px] font-bold leading-tight text-slate-900">
                          {rm.nome}
                        </h2>
                      </div>

                      <p className="mt-3 line-clamp-2 text-[13px] text-slate-600">
                        {rm.descricao}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                          carreira
                        </span>
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">
                          {rm.etapas.length} etapas
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
