import { useEffect, useMemo, useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import FavoriteButton from "@/components/FavoriteButton";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import RoadmapTrail from "@/components/roadmapV2/RoadmapTrail";
import TrailDrawer from "@/components/roadmapV2/TrailDrawer";
import { frontend, roadmapsV2 } from "@/lib/roadmapV2/content";
import { nodeProgress } from "@/lib/roadmapV2/progress";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { useTrailCelebration } from "@/hooks/useTrailCelebration";
import { loadLanguage, saveLanguage } from "@/lib/roadmapV2/languageStorage";

export default function RoadmapsV2() {
  const params = useParams();
  const matched = roadmapsV2.find((r) => r.slug === params.slug);
  // Fallback keeps the hooks below on valid data; an unmatched slug never
  // renders a different trail, it redirects to /roadmaps (see the guard before
  // the return), so the principal route stays indexable without showing the
  // wrong content.
  const roadmap = matched ?? frontend;
  const slug = roadmap.slug;
  const areaLabel = roadmap.title.includes("Front")
    ? "Front-end"
    : roadmap.area;
  const { done, toggle: onToggle, ready } = useRoadmapProgress(slug);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const languages = roadmap.languages;
  const [languageId, setLanguageId] = useState<string | null>(() => {
    if (!languages || languages.length === 0) return null;
    const saved = loadLanguage(slug);
    if (saved && languages.some((lang) => lang.id === saved)) return saved;
    return languages[0].id;
  });
  const selectedLanguage = languages?.find((lang) => lang.id === languageId);

  useEffect(() => {
    if (languageId) saveLanguage(slug, languageId);
  }, [slug, languageId]);

  const trailRef = useTrailCelebration({
    sections: roadmap.sections,
    done,
    ready,
    openSectionId,
    onCloseDrawer: () => setOpenSectionId(null),
  });

  const overall = useMemo(() => {
    return roadmap.sections.reduce(
      (acc, section) => {
        const progress = nodeProgress(section, done);
        return {
          done: acc.done + progress.done,
          total: acc.total + progress.total,
        };
      },
      { done: 0, total: 0 },
    );
  }, [roadmap, done]);

  const overallPct =
    overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0;

  const openSection = openSectionId
    ? (roadmap.sections.find((section) => section.id === openSectionId) ?? null)
    : null;

  if (!matched) {
    return <Redirect to="/roadmaps" />;
  }

  return (
    <Layout>
      <SEO
        title={`Trilha de ${roadmap.title} · Roadmap interativo`}
        description={roadmap.description}
        url={`/roadmaps/${roadmap.slug}`}
        schemaType="CollectionPage"
      />

      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[760px] px-5 pb-20 pt-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/roadmaps"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Todos os roadmaps
            </Link>

            {/* roadmap-generator e Pro (requiresPro em server/lib/aiTools.ts),
                por isso o selo Pro; o gate em si vive na pagina /roadmaps/ia. */}
            <Link
              href="/roadmaps/ia"
              className="inline-flex items-center gap-2 rounded-full border-[2.5px] border-slate-900 bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
            >
              <Sparkles className="h-4 w-4" />
              Monte seu roadmap com IA
              <ProStarIcon className="ml-0.5" />
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="mb-3.5 inline-block rounded-full border-[2.5px] border-slate-900 bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[3px_3px_0_#0f172a]">
                {areaLabel}
              </span>
              <h1 className="font-display text-[clamp(2rem,6vw,2.7rem)] font-black leading-[1.03] tracking-tight text-slate-950">
                {roadmap.title}
              </h1>
              <p className="mt-2 text-base font-medium text-slate-600">
                {roadmap.description}
              </p>
              <span className="mt-4 inline-block rounded-[10px] border-[2.5px] border-slate-900 bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800 shadow-[3px_3px_0_#0f172a]">
                {overall.done} de {overall.total} tópicos · {overallPct}%
              </span>
              {languages && languages.length > 0 && (
                <div className="mt-5">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Linguagem
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {languages.map((lang) => {
                      const active = lang.id === languageId;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setLanguageId(lang.id)}
                          className={`min-w-[6rem] rounded-[11px] border-[2.5px] border-slate-900 px-4 py-2.5 text-center text-[0.9rem] font-extrabold shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] ${
                            active
                              ? "bg-[#FFB800] text-slate-950"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <FavoriteButton
              item={{
                id: roadmap.slug,
                type: "roadmap",
                title: roadmap.title,
                subtitle: areaLabel,
                url: `/roadmaps/${roadmap.slug}`,
              }}
            />
          </div>

          {ready ? (
            <RoadmapTrail
              ref={trailRef}
              sections={roadmap.sections}
              done={done}
              onOpenSection={setOpenSectionId}
            />
          ) : (
            <div className="mt-10 flex justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
            </div>
          )}
        </div>
      </section>

      <TrailDrawer
        section={openSection}
        done={done}
        language={selectedLanguage}
        onToggle={onToggle}
        onClose={() => setOpenSectionId(null)}
      />
    </Layout>
  );
}
