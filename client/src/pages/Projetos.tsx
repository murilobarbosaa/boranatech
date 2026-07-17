/*
  BORA NA TECH? (Projetos Page)
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
  Lock,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AiCtaLink } from "@/components/shared/AiCta";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import LockedCatalogTeaser from "@/components/pro/LockedCatalogTeaser";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProjectCompletion } from "@/hooks/useProjectCompletion";
import ProjectValidationBlock from "@/components/projects/ProjectValidationBlock";
import { listProjectValidations } from "@/services/projectValidationService";
import { areasTI, projetos } from "@/lib/data";
import { getAreaAccent, projectHelpVideos } from "@/lib/platformData";

type Projeto = (typeof projetos)[number];

const niveis = ["Todos", "Iniciante", "Intermediário", "Avançado"];
const nivelGuides = [
  {
    label: "Iniciante",
    desc: "Para quem não sabe absolutamente nada e precisa de entregas sem pressão.",
    className: "bg-emerald-100 text-emerald-800 shadow-[4px_4px_0_#34d399]",
  },
  {
    label: "Intermediário",
    desc: "Para quem já estudou um pouco e quer integrar dados, APIs ou documentação.",
    className: "bg-blue-100 text-blue-800 shadow-[4px_4px_0_#60a5fa]",
  },
  {
    label: "Avançado",
    desc: "Para quem já está a fundo em TI e quer projetos completos, deploy, testes ou IA.",
    className: "bg-violet-100 text-violet-800 shadow-[4px_4px_0_#a78bfa]",
  },
];

const AREA_ALL = "Todas";
const TECH_ALL = "Todas";
const SPECIAL_LABELS: Record<string, string> = {
  carreira: "Carreira",
  fullstack: "Full Stack",
};

function labelForAreaSlug(slug: string | null | undefined): string {
  if (!slug) return "Geral";
  return (
    areasTI.find((a) => a.slug === slug)?.nome ?? SPECIAL_LABELS[slug] ?? slug
  );
}

// Material de video do projeto: usa o curado se existir; senao monta uma busca
// do YouTube ESPECIFICA do projeto (titulo + tecnologia principal). Nao inventa
// URL de video especifico, so uma query de busca boa e relevante.
function projectHelpVideo(projeto: Projeto): { title: string; url: string } {
  const curado = projectHelpVideos[projeto.id];
  if (curado) return curado;
  const tech = projeto.ferramentas[0] ?? "";
  const query = `como fazer ${projeto.nome} ${tech} tutorial`
    .replace(/\s+/g, " ")
    .trim();
  return {
    title: `Como fazer ${projeto.nome}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  };
}

const nivelColors: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-700",
  Intermediário: "bg-blue-100 text-blue-700",
  Avançado: "bg-violet-100 text-violet-700",
};

export default function Projetos() {
  const { isPro, loading } = useSubscription();
  const {
    done: projectsDone,
    ready: completionReady,
    toggle: toggleCompletion,
  } = useProjectCompletion();
  const search = useSearch();
  const params = useParams<{ id?: string }>();
  const initialAreaFromUrl = new URLSearchParams(search).get("area");
  // Fonte canonica: o catalogo estatico versionado (client/src/lib/data.ts).
  // A tabela projects do Supabase segue existindo pra outras superficies, mas
  // esta pagina nao a consome mais.
  // Free (inclui anonimo) nao recebe os projetos premium: filtramos pelo flag
  // `pro` ANTES de qualquer derivacao/render, entao o card travado nunca entra
  // no DOM. Pro ve tudo.
  const projectItems = useMemo(
    () => (isPro ? projetos : projetos.filter((p) => p.pro !== true)),
    [isPro],
  );
  const lockedCount = isPro ? 0 : projetos.filter((p) => p.pro === true).length;
  // Deep-link /projetos/:id: abre o card expandido e rola ate ele. Id que nao
  // existe no catalogo mostra um banner discreto e a listagem normal.
  const deepLinkId = params.id ?? null;
  const deepLinkProject = deepLinkId
    ? projectItems.find((p) => p.id === deepLinkId)
    : undefined;
  const deepLinkMissing = Boolean(deepLinkId && !deepLinkProject);
  const [area, setArea] = useState(initialAreaFromUrl ?? AREA_ALL);
  const [nivel, setNivel] = useState("Todos");
  const [expanded, setExpanded] = useState<string | null>(
    deepLinkProject?.id ?? null,
  );

  useEffect(() => {
    if (!deepLinkProject) return;
    // Espera o primeiro paint pro card existir com layout estavel antes de
    // rolar (o smooth scroll em elemento recem-montado engasga em mobile).
    const raf = requestAnimationFrame(() => {
      document
        .getElementById(`projeto-${deepLinkProject.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [deepLinkProject]);
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState(TECH_ALL);
  const areaSlugOptions = useMemo<(string | null)[]>(
    () => [
      AREA_ALL,
      ...Array.from(new Set(projectItems.map((p) => p.areaSlug))),
    ],
    [projectItems],
  );
  const techOptions = useMemo(
    () =>
      Array.from(new Set(projectItems.flatMap((p) => p.ferramentas))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [projectItems],
  );
  // Modelo de acesso: projeto sem `pro` e gratuito pra todo mundo (inclusive
  // anonimo); projeto `pro` so abre pra assinante. A amostra de 6 morreu.

  // Aprovacoes de validacao (camada validada, 5c): UMA chamada de lista pro
  // selo do header; o detalhe requisito a requisito hidrata por card, ao
  // expandir (dentro do ProjectValidationBlock).
  const [validatedIds, setValidatedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isPro) {
      setValidatedIds(new Set());
      return;
    }
    let cancelled = false;
    void listProjectValidations().then((rows) => {
      if (cancelled) return;
      setValidatedIds(
        new Set(
          rows.filter((r) => r.status === "aprovado").map((r) => r.projectId),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [isPro]);

  const q = query.trim().toLowerCase();
  const baseFiltered = projectItems.filter((p) => {
    const matchArea =
      area === AREA_ALL ||
      (area === "" ? p.areaSlug === null : p.areaSlug === area);
    const matchTech = tech === TECH_ALL || p.ferramentas.includes(tech);
    const matchQuery =
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.objetivo.toLowerCase().includes(q) ||
      p.ferramentas.some((f) => f.toLowerCase().includes(q));
    return matchArea && matchTech && matchQuery;
  });
  const filtered = baseFiltered.filter(
    (p) => nivel === "Todos" || p.nivel === nivel,
  );
  const nivelCounts = niveis.reduce<Record<string, number>>((acc, n) => {
    acc[n] =
      n === "Todos"
        ? baseFiltered.length
        : baseFiltered.filter((p) => p.nivel === n).length;
    return acc;
  }, {});

  function limparFiltros() {
    setArea(AREA_ALL);
    setNivel("Todos");
    setTech(TECH_ALL);
    setQuery("");
  }

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (area !== AREA_ALL)
    activeFilters.push({
      key: "area",
      label: `Área: ${labelForAreaSlug(area)}`,
      clear: () => setArea(AREA_ALL),
    });
  if (nivel !== "Todos")
    activeFilters.push({
      key: "nivel",
      label: `Nível: ${nivel}`,
      clear: () => setNivel("Todos"),
    });
  if (tech !== TECH_ALL)
    activeFilters.push({
      key: "tech",
      label: `Tecnologia: ${tech}`,
      clear: () => setTech(TECH_ALL),
    });
  if (q)
    activeFilters.push({
      key: "query",
      label: `Busca: "${query.trim()}"`,
      clear: () => setQuery(""),
    });

  const grupos = filtered.reduce<{ slug: string | null; itens: Projeto[] }[]>(
    (acc, p) => {
      const key = p.areaSlug ?? null;
      const grupo = acc.find((g) => g.slug === key);
      if (grupo) grupo.itens.push(p);
      else acc.push({ slug: key, itens: [p] });
      return acc;
    },
    [],
  );

  return (
    <Layout>
      <SEO
        title="Projetos para Portfólio · Ideias práticas para iniciantes em TI"
        description="Ideias de projetos por nível e área para montar portfólio, praticar tecnologia e mostrar evolução em processos seletivos."
        keywords={[
          "projetos para portfólio",
          "projetos programação iniciante",
          "ideias de projetos ti",
          "portfolio dev iniciante",
        ]}
        url="/projetos"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-orange-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#fb923c_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-orange-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              portfólio por nível
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
              Projetos para cada fase da sua jornada.
            </h1>
            <p className="text-slate-950 text-lg">
              Ideias práticas para quem está do zero absoluto até quem já quer
              projetos completos e profundos em TI.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {nivelGuides.map((guide) => (
              <button
                key={guide.label}
                onClick={() => setNivel(guide.label)}
                className={`rounded-2xl border-2 border-slate-900 p-4 text-left transition hover:-translate-y-1 ${guide.className}`}
                type="button"
              >
                <h2 className="font-display text-xl font-black">
                  {guide.label}
                </h2>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-700">
                  {guide.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-50 border-b-2 border-orange-200 py-4">
        <div className="container">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Buscar projeto por nome, objetivo ou tecnologia"
                  placeholder="Buscar por nome, objetivo ou tecnologia..."
                  className="w-full pl-9 pr-4 py-2 border-2 border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                aria-label="Filtrar por área"
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
              >
                {areaSlugOptions.map((slug) => {
                  const value = slug === AREA_ALL ? AREA_ALL : (slug ?? "");
                  const key = slug ?? "__null__";
                  const label =
                    slug === AREA_ALL
                      ? "Todas as áreas"
                      : labelForAreaSlug(slug);
                  return (
                    <option key={key} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                aria-label="Filtrar por nível"
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
              >
                {niveis.map((n) => (
                  <option key={n} value={n}>
                    {n === "Todos" ? "Todos os níveis" : n} ({nivelCounts[n]})
                  </option>
                ))}
              </select>
              <select
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                aria-label="Filtrar por tecnologia"
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
              >
                <option value={TECH_ALL}>Todas as tecnologias</option>
                {techOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={f.clear}
                    aria-label={`Remover filtro ${f.label}`}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-orange-300 bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 transition-colors hover:bg-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    {f.label}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded text-xs font-bold text-orange-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#fff7ed] py-12">
        <div className="container">
          <p
            className="mb-6 text-sm font-bold text-slate-600"
            aria-live="polite"
          >
            {filtered.length} projeto{filtered.length !== 1 ? "s" : ""}
            {completionReady &&
              filtered.some((p) => projectsDone.has(p.id)) && (
                <span className="text-emerald-700">
                  {" "}
                  · {filtered.filter((p) => projectsDone.has(p.id)).length}{" "}
                  {/* TODO(Ana): label do contador de concluidos */}
                  concluído
                  {filtered.filter((p) => projectsDone.has(p.id)).length !== 1
                    ? "s"
                    : ""}
                </span>
              )}
          </p>
          {deepLinkMissing && (
            <p className="mb-6 rounded-xl border-2 border-slate-900 bg-amber-50 px-4 py-3 text-sm font-bold text-slate-700 shadow-[3px_3px_0_#0f172a]">
              {/* TODO(Ana): copy do aviso de projeto nao encontrado no deep-link */}
              Não encontramos esse projeto. Ele pode ter mudado de nome; aqui
              está a lista completa.
            </p>
          )}
          {!isPro && !loading && lockedCount > 0 ? (
            <Link
              href="/planos"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-violet-950 px-5 py-4 text-white shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2 text-sm font-black">
                <Lock className="h-4 w-4 text-amber-300" aria-hidden />
                {/* TODO(Ana): copy do banner do tier Pro de projetos */}
                Todos os projetos das trilhas são gratuitos. Os com selo Pro são
                desafios premium pra quem quer ir além.
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-400 px-4 py-2 text-xs font-black uppercase text-slate-950">
                Assinar o Pro <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          ) : null}
          <div className="space-y-10">
            {grupos.map((grupo) => (
              <section
                key={grupo.slug ?? "geral"}
                aria-label={`Projetos de ${labelForAreaSlug(grupo.slug)}`}
              >
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-black text-slate-950">
                  <span
                    className="h-6 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getAreaAccent(
                        labelForAreaSlug(grupo.slug),
                      ),
                    }}
                    aria-hidden
                  />
                  {labelForAreaSlug(grupo.slug)}
                  <span className="text-sm font-bold text-slate-400">
                    ({grupo.itens.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {grupo.itens.map((projeto) => {
                    return (
                      <div
                        key={projeto.id}
                        id={`projeto-${projeto.id}`}
                        className="relative scroll-mt-24"
                      >
                        <div
                          style={{
                            boxShadow: `5px 5px 0 ${getAreaAccent(labelForAreaSlug(projeto.areaSlug))}`,
                          }}
                          className="card-brutal overflow-hidden rounded-xl border-2 border-slate-950 bg-white transition-transform duration-200 motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5"
                        >
                          <div
                            className="flex w-full cursor-pointer items-start justify-between rounded-xl p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                            role="button"
                            tabIndex={0}
                            aria-expanded={expanded === projeto.id}
                            aria-controls={`projeto-detalhe-${projeto.id}`}
                            onClick={() => {
                              setExpanded(
                                expanded === projeto.id ? null : projeto.id,
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setExpanded(
                                  expanded === projeto.id ? null : projeto.id,
                                );
                              }
                            }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold"
                                  style={{
                                    backgroundColor: `${getAreaAccent(labelForAreaSlug(projeto.areaSlug))}1a`,
                                    color: getAreaAccent(
                                      labelForAreaSlug(projeto.areaSlug),
                                    ),
                                    borderColor: `${getAreaAccent(labelForAreaSlug(projeto.areaSlug))}55`,
                                  }}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                      backgroundColor: getAreaAccent(
                                        labelForAreaSlug(projeto.areaSlug),
                                      ),
                                    }}
                                    aria-hidden
                                  />
                                  {labelForAreaSlug(projeto.areaSlug)}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${nivelColors[projeto.nivel] || "bg-slate-100 text-slate-600"}`}
                                >
                                  {projeto.nivel}
                                </span>
                                {projeto.pro === true && (
                                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-2 py-0.5 text-xs font-black text-slate-950">
                                    <ProStarIcon className="h-3 w-3" />
                                    Pro
                                  </span>
                                )}
                                {/* Validado e o selo mais forte: quando existe,
                                    substitui o chip de concluido no header. */}
                                {validatedIds.has(projeto.id) ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-emerald-400 px-2 py-0.5 text-xs font-black text-slate-950">
                                    <Check
                                      className="h-3 w-3"
                                      strokeWidth={3.5}
                                    />
                                    {/* TODO(Ana): label do selo validado no header */}
                                    Validado
                                  </span>
                                ) : (
                                  completionReady &&
                                  projectsDone.has(projeto.id) && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                      <Check
                                        className="h-3 w-3"
                                        strokeWidth={3.5}
                                      />
                                      {/* TODO(Ana): label do badge de projeto concluido */}
                                      Concluído
                                    </span>
                                  )
                                )}
                              </div>
                              <h3 className="font-display font-bold text-xl text-slate-900">
                                {projeto.nome}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {projeto.objetivo}
                              </p>
                            </div>
                            <div className="ml-4 flex shrink-0 items-center gap-3">
                              <span
                                className="inline-flex"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <FavoriteButton
                                  compact
                                  item={{
                                    id: projeto.id,
                                    type: "projeto",
                                    title: projeto.nome,
                                    subtitle: labelForAreaSlug(
                                      projeto.areaSlug,
                                    ),
                                  }}
                                />
                              </span>
                              <span className="text-slate-400" aria-hidden>
                                {expanded === projeto.id ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Projeto pro so entra na lista renderizada pra
                              assinante: o card travado nunca chega ao DOM. */}
                          {expanded === projeto.id && (
                            <div
                              id={`projeto-detalhe-${projeto.id}`}
                              role="region"
                              aria-label={`Detalhes de ${projeto.nome}`}
                              className="px-6 pb-6 border-t border-slate-100 pt-4"
                            >
                              <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  {/* Ferramentas */}
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                      Ferramentas
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {projeto.ferramentas.map((f) => (
                                        <span
                                          key={f}
                                          className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono"
                                        >
                                          {f}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Passo a passo */}
                                  <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                      Passo a passo
                                    </p>
                                    <ol className="space-y-2">
                                      {projeto.passosSimplificados.map(
                                        (passo, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm text-slate-700"
                                          >
                                            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                              {i + 1}
                                            </span>
                                            {passo}
                                          </li>
                                        ),
                                      )}
                                    </ol>
                                  </div>
                                </div>

                                <div>
                                  <a
                                    href={projectHelpVideo(projeto).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="card-brutal mb-4 flex items-start gap-3 rounded-lg border-amber-300 bg-amber-50 p-4"
                                  >
                                    <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" />
                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        Vídeo de ajuda
                                      </p>
                                      <p className="text-sm font-bold text-slate-900">
                                        {projectHelpVideo(projeto).title}
                                      </p>
                                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-950">
                                        Assistir referência{" "}
                                        <ExternalLink className="h-3 w-3" />
                                      </span>
                                    </div>
                                  </a>
                                  {/* Entregável */}
                                  <div className="card-brutal bg-orange-50 rounded-lg p-4 mb-4 border-orange-200">
                                    <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">
                                      Entregável final
                                    </p>
                                    <p className="text-sm text-slate-700">
                                      {projeto.entregavel}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      📤 Publicar em: {projeto.comoPublicar}
                                    </p>
                                  </div>

                                  {/* LinkedIn */}
                                  <div className="card-brutal bg-orange-50 rounded-lg p-4 border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Lightbulb className="w-4 h-4 text-orange-700" />
                                      <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                                        Sugestão de post no LinkedIn
                                      </p>
                                    </div>
                                    <p className="text-xs text-slate-700 italic">
                                      "{projeto.sugestaoLinkedIn}"
                                    </p>
                                  </div>

                                  {/* Sugestão editorial pra praticar depois (não-clicável) */}
                                  <div className="mt-4 text-sm text-slate-700">
                                    <span className="font-medium">
                                      Sugestão pra praticar depois:
                                    </span>{" "}
                                    <span>{projeto.proximoProjeto}</span>
                                  </div>
                                </div>
                              </div>
                              {projeto.pro === true && (
                                <ProjectValidationBlock
                                  projeto={projeto}
                                  onApproved={(id) =>
                                    setValidatedIds((prev) =>
                                      new Set(prev).add(id),
                                    )
                                  }
                                />
                              )}
                              {completionReady && (
                                <div className="mt-5 border-t border-slate-100 pt-4">
                                  <button
                                    type="button"
                                    aria-pressed={projectsDone.has(projeto.id)}
                                    onClick={() => toggleCompletion(projeto.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-[9px] border-[2.5px] border-slate-900 px-3.5 py-2 text-sm font-extrabold shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] ${
                                      projectsDone.has(projeto.id)
                                        ? "bg-emerald-500 text-white shadow-[2px_2px_0_#047857]"
                                        : "bg-white text-slate-900"
                                    }`}
                                  >
                                    {projectsDone.has(projeto.id) && (
                                      <Check
                                        className="h-4 w-4"
                                        strokeWidth={4}
                                      />
                                    )}
                                    {/* TODO(Ana): labels do toggle de conclusao de projeto */}
                                    {projectsDone.has(projeto.id)
                                      ? "Projeto concluído"
                                      : "Marcar como concluído"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {!isPro && !loading && lockedCount > 0 ? (
            <LockedCatalogTeaser
              count={lockedCount}
              noun="projetos"
              accentShadow={getAreaAccent("Carreira")}
              className="mt-10"
            />
          ) : null}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🛠️</p>
              <p className="text-slate-600 font-medium">
                Nenhum projeto encontrado.
              </p>
              <button
                onClick={() => {
                  setArea("Todas");
                  setNivel("Todos");
                }}
                className="mt-4 text-orange-700 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {!isPro && !loading ? (
            <div className="mt-10">
              {/* TODO(Ana): copy da CTA de analise de portfolio */}
              <AiCtaLink
                href="/portfolio/analisar"
                description="A IA aponta o que falta no seu GitHub"
                accent="orange"
                className="w-full"
              >
                Construiu seus projetos? Veja como deixar seu GitHub mais forte
              </AiCtaLink>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}
