import { Link, Redirect, useSearch } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { roadmapsV2 } from "@/lib/roadmapV2/content";
import type { RoadmapNode } from "@/lib/roadmapV2/types";
import { areasTI, roadmaps } from "@/lib/data";
import { PRESERVED_TRAILS } from "@/pages/RoadmapCarreira";

function hasProjectNode(nodes: RoadmapNode[]): boolean {
  return nodes.some(
    (node) =>
      Boolean(node.project) ||
      (node.children ? hasProjectNode(node.children) : false),
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
        title="Roadmaps · Escolha sua trilha"
        description="Um passo a passo por área, do primeiro conceito ao nível avançado. Tudo de graça."
        url="/roadmaps"
        schemaType="CollectionPage"
      />

      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-8">
          <span className="inline-block rounded-full border-[2px] border-slate-900 bg-[#FFB800] px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[2px_2px_0_#0f172a]">
            Roadmaps
          </span>
          <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
            Escolha sua trilha
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Um passo a passo por área, do primeiro conceito ao nível avançado.
            Tudo de graça.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roadmapsV2.map((r) => {
              const area = areasTI.find((x) => x.slug === r.slug);
              if (!area) return null;
              const Icon = area.icon;
              const hasProject = r.sections.some((section) =>
                hasProjectNode(section.children),
              );
              const isMultiStack = Boolean(r.languages && r.languages.length > 0);

              return (
                <Link
                  key={r.slug}
                  href={`/roadmaps/${r.slug}`}
                  className="bnt-pressable flex flex-col rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]"
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

                  {(hasProject || isMultiStack) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasProject && (
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                          projeto
                        </span>
                      )}
                      {isMultiStack && (
                        <span className="rounded-full border-[1.5px] border-slate-900 bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700">
                          multi-stack
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-3 line-clamp-2 text-[13px] text-slate-600">
                    {area.descricaoCurta}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
                    <span className="text-[11px] text-slate-400">
                      iniciante → avançado
                    </span>
                    <span className="text-[12px] font-bold text-slate-600">
                      {r.sections.length} etapas
                    </span>
                  </div>
                </Link>
              );
            })}

            {PRESERVED_TRAILS.map((t) => {
              const rm = roadmaps.find((r) => r.id === t.roadmapId);
              if (!rm) return null;
              const Icon = t.icon;
              return (
                <Link
                  key={t.slug}
                  href={`/roadmaps/${t.slug}`}
                  className="bnt-pressable flex flex-col rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[3px_3px_0_#0f172a]"
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border-[1.5px] border-slate-900 bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                      carreira
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[13px] text-slate-600">
                    {rm.descricao}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
                    <span className="text-[11px] text-slate-400">
                      trilha de carreira
                    </span>
                    <span className="text-[12px] font-bold text-slate-600">
                      {rm.etapas.length} etapas
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
