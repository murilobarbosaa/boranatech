import { useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useParams } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import FavoriteButton from "@/components/FavoriteButton";
import RoadmapTrail, {
  type TrailHandle,
} from "@/components/roadmapV2/RoadmapTrail";
import TrailDrawer from "@/components/roadmapV2/TrailDrawer";
import { frontend, roadmapsV2 } from "@/lib/roadmapV2/content";
import { isComplete, nodeProgress } from "@/lib/roadmapV2/progress";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { loadLanguage, saveLanguage } from "@/lib/roadmapV2/languageStorage";

// Beats of the section-complete sequence, with soft pauses between each step:
// a) station turns green (immediate, derived from `done`)
// b) hold on the green station, then the drawer closes itself
// c) after the drawer is fully gone, the confetti bursts
// d) after the confetti settles, the dots walk to the next station (slow, in the trail)
// e) the next station unlocks (gated on the walk inside the trail)
const GREEN_HOLD = 580;
const CLOSE_TO_BURST = 640;
const BURST_TO_WALK = 480;

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

  const trailRef = useRef<TrailHandle>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const completed = useMemo(
    () => roadmap.sections.map((section) => isComplete(section, done)),
    [roadmap, done],
  );

  // Seeded on the first settled (ready) render with the loaded completion, so a
  // reload never replays the confetti + line-walk for already-complete sections.
  // Starts null because the logged-in `done` arrives async: seeding eagerly with
  // the empty first render would make the celebration fire when the data lands.
  const prevCompleted = useRef<boolean[] | null>(null);

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

  useEffect(() => {
    // Wait until the progress is settled (anon: immediate; logged-in: after the
    // server load). The first settled render seeds prevCompleted with the loaded
    // completion and animates nothing, so only new in-session changes celebrate.
    // Resetting to null on every unsettled cycle (initial load, in-place login,
    // logout) forces a fresh re-seed when ready returns, so a server delta (e.g.
    // progress from another device) does not replay through this parent effect,
    // which (unlike the trail) is not remounted by the ready gate.
    if (!ready) {
      prevCompleted.current = null;
      return;
    }
    const prev = prevCompleted.current;
    if (prev === null) {
      prevCompleted.current = completed;
      return;
    }
    roadmap.sections.forEach((section, i) => {
      const wasComplete = prev[i] ?? false;
      const nowComplete = completed[i];
      if (nowComplete && !wasComplete) {
        const sequence = () => {
          // c) confetti, then d) the slow walk once it settles
          const burstTimer = setTimeout(
            () => trailRef.current?.burst(i),
            CLOSE_TO_BURST,
          );
          const walkTimer = setTimeout(
            () => trailRef.current?.walk(i),
            CLOSE_TO_BURST + BURST_TO_WALK,
          );
          timeouts.current.push(burstTimer, walkTimer);
        };
        if (openSectionId === section.id) {
          // b) hold on the green station, then close the drawer before celebrating
          const closeTimer = setTimeout(() => {
            setOpenSectionId(null);
            sequence();
          }, GREEN_HOLD);
          timeouts.current.push(closeTimer);
        } else {
          sequence();
        }
      } else if (!nowComplete && wasComplete) {
        trailRef.current?.unwalk(i);
      }
    });
    prevCompleted.current = completed;
  }, [completed, openSectionId, ready]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
    };
  }, []);

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
