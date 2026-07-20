import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ChevronDown, ChevronUp, Filter, Map } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import BackToTechnologies from "@/components/shared/BackToTechnologies";
import PageHero from "@/components/shared/PageHero";
import { BntSelect } from "@/components/shared/BntSelect";
import TechCompactTile from "@/components/shared/TechCompactTile";
import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuthGate } from "@/hooks/useAuthGate";
import { AreaIconBox } from "@/components/areas/AreaIconBox";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { areasTI } from "@/lib/data";
import { technologies } from "@/lib/technologyData";

const ac = getPageAccentUi("teal");
const PREVIEW_LOGO_COUNT = 9;

const ROADMAP_AREA_SLUGS = new Set([
  "backend",
  "carreira",
  "ciberseguranca",
  "cloud",
  "dados",
  "devops",
  "frontend",
  "fullstack",
  "gestao",
  "ia",
  "mobile",
  "produto",
  "qa",
  "uxui",
]);

function roadmapTarget(slug: string): { href: string; gated: boolean } {
  return ROADMAP_AREA_SLUGS.has(slug)
    ? { href: `/roadmaps?area=${slug}`, gated: true }
    : { href: "/roadmaps", gated: false };
}

export default function TecnologiaMapa() {
  const { requireAuth, modalProps, status } = useAuthGate();
  const search = useSearch();
  const areaFromUrl = new URLSearchParams(search).get("area");
  const fromTech = new URLSearchParams(search).get("from") === "tecnologias";
  const [focusedSlug, setFocusedSlug] = useState<string | null>(
    areaFromUrl && areasTI.some((a) => a.slug === areaFromUrl)
      ? areaFromUrl
      : null,
  );
  /** Lista longa dentro do painel por área (Ver mais); chave sempre `area.slug`. */
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>(
    {},
  );
  /** Apenas um painel de tecnologias fica aberto por vez. */
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);

  const handleTileBeforeNavigate = (href: string) => {
    if (status === "authenticated") return true;
    if (status === "loading") return false;
    requireAuth({ destination: href });
    return false;
  };

  const sections = useMemo(
    () =>
      (focusedSlug
        ? areasTI.filter((a) => a.slug === focusedSlug)
        : areasTI
      ).map((area, areaIndex) => {
        const items = technologies.filter((t) => t.areas.includes(area.slug));
        return { area, items, areaIndex };
      }),
    [focusedSlug],
  );

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Tecnologias por área · O que se usa em cada carreira"
        description="Mapa de tecnologias por área de TI: veja quais linguagens, frameworks e ferramentas aparecem em cada caminho de carreira e o que estudar primeiro."
        url="/tecnologias/por-area"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="emerald"
        eyebrow="por área de TI"
        title="Tecnologias por Área"
        subtitle="Veja quais tecnologias aparecem em cada caminho de carreira."
        topSlot={fromTech ? <BackToTechnologies accent="emerald" /> : undefined}
        backgroundSlot={
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <span className="animate-gentle-float absolute -left-8 top-8 h-24 w-24 rounded-full bg-teal-300/40 blur-2xl" />
            <span
              className="animate-gentle-float absolute right-12 top-4 h-32 w-32 rounded-full bg-emerald-300/40 blur-3xl"
              style={{ animationDelay: "1.3s" }}
            />
            <span
              className="animate-gentle-float absolute -bottom-8 left-1/2 h-28 w-28 rounded-full bg-cyan-300/30 blur-3xl"
              style={{ animationDelay: "2.6s" }}
            />
          </div>
        }
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-8">
          <div
            className={cn(
              "rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]",
              ac.panelSoft,
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="tech-area-filter"
                className="inline-flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-600"
              >
                <Filter className="h-4 w-4 text-teal-700" aria-hidden />
                Filtrar por área
              </label>
              <BntSelect
                id="tech-area-filter"
                triggerClassName="sm:w-64"
                value={focusedSlug ?? "__all__"}
                onValueChange={(v) =>
                  setFocusedSlug(v === "__all__" ? null : v)
                }
                options={[
                  { value: "__all__", label: "Todas as áreas" },
                  ...areasTI.map((area) => ({
                    value: area.slug,
                    label: area.nome,
                  })),
                ]}
              />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-600">
              Clique em <span className="font-bold">Ver tecnologias</span> no
              card que quiser explorar. Ao abrir uma área, a anterior fecha
              automaticamente.
            </p>
          </div>

          <div
            key={focusedSlug ?? "all"}
            className={cn(
              "grid items-start gap-6",
              sections.length === 1
                ? "grid-cols-1 sm:max-w-xl"
                : "md:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {sections.map(({ area, items, areaIndex }) => {
              const slug = area.slug;
              const cardAccent = accentForAreaSlug(slug);
              const cardAc = getPageAccentUi(cardAccent);
              const roadmap = roadmapTarget(slug);
              const listExpanded = expandedAreas[slug] ?? false;
              const preview = items.slice(0, PREVIEW_LOGO_COUNT);
              const hasMore = items.length > PREVIEW_LOGO_COUNT;
              const displayed = listExpanded ? items : preview;
              const techPanelOpen = expandedAreaId === slug;

              return (
                <article
                  key={slug}
                  style={{
                    animationDelay: `${Math.min(areaIndex * 65, 520)}ms`,
                  }}
                  className={cn(
                    "tech-map-card card-brutal group flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]",
                    cardAc.liftShadow,
                  )}
                >
                  {/* Faixa superior compacta (~2 linhas de descrição); sem flex-1 no texto pra não criar vácuo até a linha */}
                  <div
                    className={cn(
                      "flex min-h-[7.25rem] shrink-0 flex-col border-b-2 border-slate-900 px-5 pb-3 pt-3.5 sm:min-h-[7.5rem]",
                      cardAc.theadLight,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <AreaIconBox
                          icon={area.icon}
                          areaSlug={slug}
                          size="sm"
                          className="bg-white transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110"
                        />
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                          <h2 className="line-clamp-2 min-h-[2lh] font-display text-lg font-black leading-snug text-slate-950 sm:text-xl">
                            {area.nome.replace(/-/g, "")}
                          </h2>
                          <p className="mt-2 line-clamp-2 min-h-[2lh] text-pretty text-sm leading-relaxed text-slate-700">
                            {area.descricaoCurta}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 self-start rounded-full px-3 py-1.5 text-xs font-bold shadow-sm",
                          cardAc.tag,
                        )}
                      >
                        {items.length} tecnologias
                      </span>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col gap-3 p-3 sm:p-4">
                    <button
                      type="button"
                      aria-expanded={techPanelOpen}
                      aria-controls={`tech-panel-${slug}`}
                      id={`tech-toggle-${slug}`}
                      onClick={() =>
                        setExpandedAreaId((current) => {
                          const next = current === slug ? null : slug;
                          if (next !== slug) {
                            setExpandedAreas((prev) => {
                              const copy = { ...prev };
                              delete copy[slug];
                              return copy;
                            });
                          }
                          return next;
                        })
                      }
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                        cardAc.cardHover,
                      )}
                    >
                      {techPanelOpen
                        ? "Ocultar tecnologias"
                        : "Ver tecnologias"}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          techPanelOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>

                    <Link
                      href={roadmap.href}
                      onClick={(event) => {
                        if (!roadmap.gated) return;
                        if (status === "authenticated") return;
                        event.preventDefault();
                        if (status === "loading") return;
                        requireAuth({ destination: roadmap.href });
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] transition-[transform,box-shadow] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
                    >
                      <Map className="h-4 w-4 shrink-0" aria-hidden />
                      Ver roadmap de {area.nome.replace(/-/g, "")}
                    </Link>

                    {techPanelOpen ? (
                      <div
                        id={`tech-panel-${slug}`}
                        role="region"
                        aria-labelledby={`tech-toggle-${slug}`}
                        className="flex flex-col gap-3"
                      >
                        <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-3">
                          {displayed.map((technology, itemIndex) => (
                            <TechCompactTile
                              key={technology.slug}
                              technology={technology}
                              fromArea={slug}
                              accent={cardAccent}
                              onBeforeNavigate={handleTileBeforeNavigate}
                              style={{
                                animationDelay: `${Math.min(itemIndex * 22, 400)}ms`,
                              }}
                            />
                          ))}
                        </div>

                        {hasMore ? (
                          <div className="border-t border-slate-100 pt-3">
                            {!listExpanded ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAreas((prev) => ({
                                    ...prev,
                                    [slug]: true,
                                  }))
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-teal-50 px-4 py-2.5 text-xs font-black text-teal-950 shadow-[2px_2px_0_#0f172a] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:bg-teal-100 hover:shadow-[3px_3px_0_#0f172a]"
                              >
                                Ver mais ({items.length - PREVIEW_LOGO_COUNT})
                                <ChevronDown
                                  className="h-4 w-4 shrink-0"
                                  aria-hidden
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAreas((prev) => {
                                    const next = { ...prev };
                                    delete next[slug];
                                    return next;
                                  })
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                              >
                                <ChevronUp
                                  className="h-4 w-4 shrink-0"
                                  aria-hidden
                                />
                                Ver menos (mostrar só as primeiras{" "}
                                {PREVIEW_LOGO_COUNT})
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <AuthGateModal {...modalProps} />
    </Layout>
  );
}
