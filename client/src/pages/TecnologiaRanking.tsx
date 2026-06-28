import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ExternalLink,
  Trophy,
  RefreshCw,
  Sparkles,
  Map,
  ArrowRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import BackToTechnologies from "@/components/shared/BackToTechnologies";
import TechnologyLogo from "@/components/TechnologyLogo";
import CountUp from "@/components/reactbits/CountUp";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  technologyCategories,
  technologyCategoryLabels,
  technologyRanking,
} from "@/lib/technologyData";
import { STACK_OVERFLOW_SURVEY, GITHUB_OCTOVERSE } from "@/lib/surveyData2025";
import { getTechnologyRanking } from "@/services/contentService";
import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuthGate } from "@/hooks/useAuthGate";

const ac = getPageAccentUi("amber");

const SCOPE_LABELS: Record<string, string> = {
  ...technologyCategoryLabels,
  Linguagens: "Linguagens e marcação",
};

interface TipoTag {
  label: string;
  cls: string;
}

const TIPO_POR_CATEGORIA: Record<string, TipoTag> = {
  Linguagens: { label: "linguagem", cls: "bg-violet-100 text-violet-800" },
  Frameworks: { label: "framework", cls: "bg-blue-100 text-blue-800" },
  "Banco de Dados": { label: "banco", cls: "bg-emerald-100 text-emerald-800" },
  Ferramentas: { label: "ferramenta", cls: "bg-slate-200 text-slate-800" },
  Cloud: { label: "cloud", cls: "bg-sky-100 text-sky-800" },
  DevOps: { label: "devops", cls: "bg-orange-100 text-orange-900" },
  "Dados e IA": { label: "dados e IA", cls: "bg-fuchsia-100 text-fuchsia-800" },
  Segurança: { label: "segurança", cls: "bg-rose-100 text-rose-800" },
  Testes: { label: "testes", cls: "bg-teal-100 text-teal-800" },
  Design: { label: "design", cls: "bg-pink-100 text-pink-800" },
  Gestão: { label: "gestão", cls: "bg-amber-100 text-amber-900" },
};

const TIPO_FALLBACK: TipoTag = {
  label: "tecnologia",
  cls: "bg-slate-100 text-slate-700",
};

function tipoTag(technology: { slug: string; category: string }): TipoTag {
  if (technology.slug === "html")
    return { label: "markup", cls: "bg-orange-100 text-orange-900" };
  if (technology.slug === "css")
    return { label: "estilo", cls: "bg-cyan-100 text-cyan-900" };
  return TIPO_POR_CATEGORIA[technology.category] ?? TIPO_FALLBACK;
}

function podiumEmoji(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

function UsageBar({ percent }: { percent?: number }) {
  const reduce = useReducedMotion();
  const width = percent == null ? null : Math.max(0, Math.min(100, percent));
  const [shown, setShown] = useState(reduce ? (width ?? 0) : 0);

  useEffect(() => {
    if (width == null) return;
    if (reduce) {
      setShown(width);
      return;
    }
    const id = setTimeout(() => setShown(width), 80);
    return () => clearTimeout(id);
  }, [width, reduce]);

  if (width == null) return null;
  return (
    <div
      className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-100 transition-[height] duration-200 ease-out motion-safe:group-hover:h-3.5"
      role="img"
      aria-label={`Uso aproximado de ${Math.round(width)}%`}
    >
      <div
        className="h-full rounded-full bg-amber-500 transition-[width] duration-700 ease-out"
        style={{ width: `${shown}%` }}
      />
    </div>
  );
}

const RANKING_DOODLES = [
  { Icon: Trophy, cls: "left-[4%] top-[18%] text-amber-500", size: "h-12 w-12" },
  { Icon: Sparkles, cls: "right-[8%] top-[14%] text-amber-400", size: "h-10 w-10" },
  { Icon: Trophy, cls: "right-[22%] top-[64%] text-orange-400", size: "h-9 w-9" },
  { Icon: Sparkles, cls: "left-[16%] top-[70%] text-yellow-500", size: "h-8 w-8" },
];

function RankingDoodles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {RANKING_DOODLES.map((doodle, index) => {
        const Icon = doodle.Icon;
        return (
          <span
            key={index}
            className={`animate-gentle-float absolute opacity-[0.18] ${doodle.cls}`}
            style={{ animationDelay: `${index * 0.6}s` }}
          >
            <Icon className={doodle.size} aria-hidden />
          </span>
        );
      })}
    </div>
  );
}

export default function TecnologiaRanking() {
  const { gateNavigate, modalProps } = useAuthGate();
  const search = useSearch();
  const fromTech = new URLSearchParams(search).get("from") === "tecnologias";
  const [ranking, setRanking] = useState(technologyRanking);
  const [scope, setScope] = useState("Geral");
  const reduce = useReducedMotion();

  useEffect(() => {
    getTechnologyRanking()
      .then(setRanking)
      .catch(() => setRanking(technologyRanking));
  }, []);

  const availableScopes = useMemo(() => {
    const present = new Set<string>(
      ranking.map((technology) => technology.category),
    );
    return [
      "Geral",
      ...technologyCategories.filter(
        (category) => category !== "Todas" && present.has(category),
      ),
    ];
  }, [ranking]);

  useEffect(() => {
    if (!availableScopes.includes(scope)) setScope("Geral");
  }, [availableScopes, scope]);

  const scoped =
    scope === "Geral"
      ? ranking
      : ranking.filter((technology) => technology.category === scope);

  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="dados públicos 📊"
        title="🏆 Tecnologias mais usadas"
        subtitle="A lista mistura linguagem, marcação (HTML), estilo (CSS), frameworks, bancos e ferramentas. Por isso falamos em tecnologias, não só linguagens. Mostra popularidade com contexto, com percentuais do Stack Overflow quando existem e curadoria honesta quando o dado não é comparável."
        topSlot={fromTech ? <BackToTechnologies accent="amber" /> : undefined}
        backgroundSlot={<RankingDoodles />}
      />

      <section className="border-b-2 border-slate-900 bg-amber-100 py-4">
        <div className="container flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
            <RefreshCw className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            Dados 2025 a 2026, sempre atualizado
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tecnologias/comparar?from=tecnologias"
              onClick={(event) => {
                event.preventDefault();
                gateNavigate("/tecnologias/comparar?from=tecnologias");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
            >
              Comparar
            </Link>
            <Link
              href="/tecnologias/por-area?from=tecnologias"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
            >
              Por área
            </Link>
            <Link
              href="/roadmaps"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-violet-600 px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
            >
              <Map className="h-3.5 w-3.5" aria-hidden />
              Ver roadmaps
            </Link>
            <Link
              href="/quiz-carreira"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
            >
              Fazer o quiz
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div
            className={cn(
              "mb-8 rounded-2xl border-2 border-slate-900 p-5 shadow-[4px_4px_0_#0f172a]",
              ac.panelSoft,
            )}
          >
            <h2 className="font-display text-lg font-black text-slate-950">
              Fonte das informações
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              O ranking ordena primeiro por uso declarado quando há percentuais
              do{" "}
              <a
                href={STACK_OVERFLOW_SURVEY.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className={cn("font-black underline", ac.link)}
              >
                {STACK_OVERFLOW_SURVEY.sourceName}
              </a>
              , combinando quando útil com o{" "}
              <a
                href={GITHUB_OCTOVERSE.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className={cn("font-black underline", ac.link)}
              >
                {GITHUB_OCTOVERSE.sourceName}
              </a>
              .
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Importante: indicadores públicos não medem vagas no Brasil. São
              contexto para explorar tecnologias.
            </p>
          </div>

          <div className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2">
              {availableScopes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={cn(
                    "shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all",
                    scope === option ? ac.filterActive : ac.filterInactive,
                  )}
                >
                  {SCOPE_LABELS[option] ?? option}
                </button>
              ))}
            </div>
          </div>

          {scoped.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="font-display text-lg font-black text-slate-950">
                Nada por aqui ainda
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Ainda não há tecnologias desta categoria no ranking.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {scoped.slice(0, 3).map((technology, index) => {
                  const position = index + 1;
                  const isFirst = position === 1;
                  const tipo = tipoTag(technology);
                  return (
                    <AnimatedContent
                      key={technology.slug}
                      distance={18}
                      duration={0.45}
                      delay={index * 0.12}
                    >
                      <motion.div
                        animate={
                          !reduce && isFirst
                            ? {
                                boxShadow: [
                                  "0 0 0 0 rgba(251, 191, 36, 0.55)",
                                  "0 0 0 10px rgba(251, 191, 36, 0)",
                                ],
                              }
                            : undefined
                        }
                        transition={
                          !reduce && isFirst
                            ? { duration: 2.2, repeat: Infinity, ease: "easeOut" }
                            : undefined
                        }
                        className={cn(
                          "group flex h-full flex-col items-center gap-2 rounded-2xl border-2 border-slate-900 bg-white p-5 text-center shadow-[4px_4px_0_#0f172a] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1",
                          isFirst && "ring-4 ring-amber-300",
                        )}
                      >
                        <span className="text-4xl" aria-hidden>
                          {podiumEmoji(position)}
                        </span>
                        <TechnologyLogo
                          name={technology.name}
                          icon={technology.icon}
                          logoUrl={technology.logoUrl}
                          className="h-12 w-12"
                          imageClassName="h-8 w-8"
                        />
                        <Link
                          href={`/tecnologias/${technology.slug}`}
                          onClick={(event) => {
                            event.preventDefault();
                            gateNavigate(`/tecnologias/${technology.slug}`);
                          }}
                          className="font-display text-lg font-black text-violet-900 underline-offset-4 hover:underline"
                        >
                          {technology.name}
                        </Link>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                            tipo.cls,
                          )}
                        >
                          {tipo.label}
                        </span>
                        {technology.usagePercent != null ? (
                          <span className="font-display text-2xl font-black text-amber-700">
                            <CountUp to={Math.round(technology.usagePercent)} />%
                          </span>
                        ) : null}
                        <span className="text-sm font-bold text-slate-700">
                          {technology.usageLabel || "Curadoria Bora na Tech"}
                        </span>
                        <div className="w-full">
                          <UsageBar percent={technology.usagePercent} />
                        </div>
                      </motion.div>
                    </AnimatedContent>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border-2 border-slate-900 bg-white md:block md:shadow-[4px_4px_0_#0f172a]">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className={cn(ac.tableBanner)}>
                    <tr>
                      <th className="p-4 text-left">Podium</th>
                      <th className="p-4 text-left">Tecnologia</th>
                      <th className="p-4 text-left">Indicador público</th>
                      <th className="p-4 text-left">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoped.map((technology, index) => {
                      const position = index + 1;
                      const podium = podiumEmoji(position);
                      const tipo = tipoTag(technology);
                      return (
                        <tr
                          key={technology.slug}
                          style={{
                            animationDelay: `${Math.min(index * 22, 640)}ms`,
                          }}
                          className={cn(
                            "tech-ranking-row group border-t-2 border-slate-100 transition-colors hover:bg-amber-100/70",
                          )}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2 font-display">
                              <span className="text-lg" aria-hidden>
                                {podium ?? "·"}
                              </span>
                              <span className="font-black tabular-nums">
                                #{position}
                              </span>
                              {position <= 3 ? (
                                <Trophy
                                  className="hidden h-4 w-4 text-amber-800 opacity-70 group-hover:opacity-100 lg:inline"
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <TechnologyLogo
                                name={technology.name}
                                icon={technology.icon}
                                logoUrl={technology.logoUrl}
                                className="h-11 w-11 shrink-0"
                                imageClassName="h-7 w-7 p-1"
                              />
                              <div className="min-w-0">
                                <Link
                                  href={`/tecnologias/${technology.slug}`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    gateNavigate(`/tecnologias/${technology.slug}`);
                                  }}
                                  className="font-bold text-violet-900 underline-offset-4 hover:underline"
                                >
                                  {technology.name}
                                </Link>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                                      tipo.cls,
                                    )}
                                  >
                                    {tipo.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {technology.usagePercent != null ? (
                              <span className="flex items-baseline gap-2">
                                <span className="font-display text-lg font-black text-amber-700">
                                  <CountUp
                                    to={Math.round(technology.usagePercent)}
                                  />
                                  %
                                </span>
                                {technology.usageLabel ? (
                                  <span className="text-xs font-medium text-slate-500">
                                    {technology.usageLabel}
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="font-black text-slate-950">
                                {technology.usageLabel ||
                                  "Sem percentual comparável"}
                              </span>
                            )}
                            <UsageBar percent={technology.usagePercent} />
                            {technology.sourceNote ? (
                              <span className="mt-1 block text-xs text-slate-500">
                                {technology.sourceNote}
                              </span>
                            ) : null}
                          </td>
                          <td className="p-4 align-top">
                            {technology.sourceUrl ? (
                              <a
                                href={technology.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-1 font-black underline decoration-2 underline-offset-2",
                                  ac.link,
                                )}
                              >
                                {technology.sourceName}
                                <ExternalLink
                                  className="h-3.5 w-3.5 shrink-0"
                                  aria-hidden
                                />
                              </a>
                            ) : (
                              <span className="font-medium">
                                {technology.sourceName || "Fonte não informada"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 md:hidden">
                {scoped.map((technology, index) => {
                  const position = index + 1;
                  const podium = podiumEmoji(position);
                  const tipo = tipoTag(technology);
                  return (
                    <article
                      key={technology.slug}
                      style={{
                        animationDelay: `${Math.min(index * 42, 600)}ms`,
                      }}
                      className="tech-ranking-card tech-ranking-card--mobile group rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <TechnologyLogo
                            name={technology.name}
                            icon={technology.icon}
                            logoUrl={technology.logoUrl}
                            className="h-12 w-12"
                            imageClassName="h-8 w-8"
                          />
                          <span className="text-xl" aria-hidden>
                            {podium ?? "🏅"}
                          </span>
                          <span className="font-display font-black tabular-nums text-sm">
                            #{position}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/tecnologias/${technology.slug}`}
                            onClick={(event) => {
                              event.preventDefault();
                              gateNavigate(`/tecnologias/${technology.slug}`);
                            }}
                            className="font-display text-base font-black text-violet-900 underline-offset-4 hover:underline"
                          >
                            {technology.name}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide">
                            <span
                              className={cn(
                                "rounded-full px-2 py-1",
                                tipo.cls,
                              )}
                            >
                              {tipo.label}
                            </span>
                          </div>
                          {technology.usagePercent != null ? (
                            <p className="mt-3 flex items-baseline gap-2">
                              <span className="font-display text-xl font-black text-amber-700">
                                <CountUp
                                  to={Math.round(technology.usagePercent)}
                                />
                                %
                              </span>
                              {technology.usageLabel ? (
                                <span className="text-xs font-medium text-slate-500">
                                  {technology.usageLabel}
                                </span>
                              ) : null}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm font-bold text-slate-900">
                              {technology.usageLabel ||
                                "Sem percentual comparável"}
                            </p>
                          )}
                          <UsageBar percent={technology.usagePercent} />
                          {technology.sourceNote ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {technology.sourceNote}
                            </p>
                          ) : null}
                          <div className="mt-3">
                            {technology.sourceUrl ? (
                              <a
                                href={technology.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-1 text-sm font-black underline",
                                  ac.link,
                                )}
                              >
                                {technology.sourceName}
                                <ExternalLink
                                  className="h-3.5 w-3.5"
                                  aria-hidden
                                />
                              </a>
                            ) : (
                              <span className="text-sm font-medium text-slate-700">
                                {technology.sourceName || "Fonte não informada"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <AuthGateModal {...modalProps} />
    </Layout>
  );
}
