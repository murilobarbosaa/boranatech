/*
  BORA NA TECH? (Projetos Page)
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, Lock, Search, X } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AiCtaLink } from "@/components/shared/AiCta";
import { BntSelect } from "@/components/shared/BntSelect";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProjectCompletion } from "@/hooks/useProjectCompletion";
import { listProjectValidations } from "@/services/projectValidationService";
import { listSubmissions } from "@/services/projectSubmissionService";
import { projetos } from "@/lib/data";
import { getAreaAccent } from "@/lib/platformData";
import { areaGridPaletteOf } from "@/lib/areaGridPalette";
import {
  labelForProjectArea,
  labelForProjectSubarea,
  normalizeProjectAreaParam,
} from "@/lib/projectAreaGroup";
import { PROJETOS_V2_IDS, isProjetoV2 } from "@shared/projects/v2";
import ProjetoEstadoChip, {
  type EstadoChip,
} from "@/components/projects/ProjetoEstadoChip";
import { filtrarPorEstado } from "@/lib/projectState";
import type { ProjectStateFilter } from "@/lib/projectState";

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
// Sentinela de borda p/ o BntSelect: o Radix Select proibe value="" em SelectItem,
// e projetos com areaSlug null caem em value="" (slug ?? ""). Mapeamos "" <->
// sentinela SO na borda; o state `area` continua "" internamente. Mesmo padrao do
// Cursos; quirk de null preservado.
const AREA_EMPTY_SENTINEL = "__empty__";

// Ordem da caixa de selecao, e tambem a chave dos chips de filtro ativo. Sao
// os quatro valores de ProjectStateFilter, um por um: o Record fechado faz o
// tsc reprovar se um valor novo for acrescentado ao tipo sem rotulo aqui.
// TODO(Ana): rotulos do filtro de estado do projeto
const ESTADO_LABELS: Record<ProjectStateFilter, string> = {
  todos: "Todos os estados",
  em_andamento: "Em andamento",
  concluidos: "Concluídos",
  pro: "Pro",
};

const nivelColors: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-700",
  Intermediário: "bg-blue-100 text-blue-700",
  Avançado: "bg-violet-100 text-violet-700",
};

export default function Projetos() {
  const { isPro, loading } = useSubscription();
  const { user } = useAuth();
  const {
    done: projectsDone,
    stages: projectStages,
    ready: completionReady,
  } = useProjectCompletion();
  const search = useSearch();
  // ?area= normalizado: link antigo apontando pra slug de subarea (que era um
  // areaSlug valido ate este lote) vira a area-mae, em vez de filtrar por um
  // valor que nenhum projeto tem mais e devolver lista vazia.
  const areaParam = new URLSearchParams(search).get("area");
  const initialAreaFromUrl =
    areaParam === null ? null : normalizeProjectAreaParam(areaParam);
  // Fonte canonica: o catalogo estatico versionado (client/src/lib/data.ts).
  // A tabela projects do Supabase segue existindo pra outras superficies, mas
  // esta pagina nao a consome mais.
  // DESCOBERTA (lote 03): o catalogo inteiro entra na lista para todo mundo.
  // Antes o projeto `pro` era filtrado ANTES do render, entao quem nao assina
  // nao sabia que ele existia: nem pelo filtro, nem pela busca, nem pelo deep
  // link, que caia no banner de "nao encontramos esse projeto". Agora o card
  // aparece BLOQUEADO, com o cabecalho completo e sem expandir. O conteudo do
  // painel continua fora do DOM para quem nao assina.
  const projectItems = projetos;
  const lockedCount = isPro ? 0 : projetos.filter((p) => p.pro === true).length;
  // Um projeto esta TRAVADO quando e premium e quem olha nao assina. Enquanto
  // o status Pro nao resolveu (`loading`), trava: fecha por padrao. Isso nao
  // esconde nada de quem assina, porque ate este lote o projeto pro nem
  // aparecia na lista antes do status carregar, e garante que o conteudo pago
  // nunca chegue ao DOM de quem nao assina, nem por um frame.
  const travado = (projeto: Projeto) => projeto.pro === true && !isPro;
  const [area, setArea] = useState(initialAreaFromUrl ?? AREA_ALL);
  const [nivel, setNivel] = useState("Todos");
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState(TECH_ALL);
  const [estado, setEstado] = useState<ProjectStateFilter>("todos");
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

  // UMA chamada por carga de pagina, so para quem esta logado: o anonimo nao
  // tem entrega, e pedir a lista para ele seria uma requisicao garantidamente
  // vazia. Erro degrada para "sem entrega": o chip perde informacao, a pagina
  // nao cai.
  const [entregas, setEntregas] = useState<
    Map<string, "entregue" | "verificado">
  >(new Map());
  useEffect(() => {
    if (!user) {
      setEntregas(new Map());
      return;
    }
    let cancelado = false;
    void listSubmissions()
      .then((linhas) => {
        if (cancelado) return;
        setEntregas(
          new Map(linhas.map((l) => [l.projectId, l.status] as const)),
        );
      })
      .catch(() => {
        if (!cancelado) setEntregas(new Map());
      });
    return () => {
      cancelado = true;
    };
  }, [user]);

  const q = query.trim().toLowerCase();
  // O estado entra no MESMO estagio que area, tecnologia e busca, antes da
  // contagem por nivel: senao "3 Iniciante" contaria projeto que o filtro de
  // estado ja tirou da lista.
  const estadoCtx = {
    done: (id: string) => projectsDone.has(id),
    etapas: (id: string) => projectStages.get(id) ?? {},
    validado: (id: string) => validatedIds.has(id),
    entrega: (id: string) => entregas.get(id) ?? null,
  };
  const baseFiltered = filtrarPorEstado(
    projectItems.filter((p) => {
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
    }),
    estado,
    estadoCtx,
  );
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
    setEstado("todos");
  }

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (area !== AREA_ALL)
    activeFilters.push({
      key: "area",
      label: `Área: ${labelForProjectArea(area)}`,
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
  if (estado !== "todos")
    activeFilters.push({
      key: "estado",
      label: `Estado: ${ESTADO_LABELS[estado]}`,
      clear: () => setEstado("todos"),
    });
  if (q)
    activeFilters.push({
      key: "query",
      label: `Busca: "${query.trim()}"`,
      clear: () => setQuery(""),
    });

  // Contadores do cabecalho. "Em andamento" sai do MESMO filtrarPorEstado que
  // a caixa de selecao usa, em vez de uma segunda regra escrita aqui, senao o
  // contador e o filtro poderiam discordar sobre quem esta em andamento.
  const concluidosNaLista = completionReady
    ? filtered.filter((p) => projectsDone.has(p.id)).length
    : 0;
  const emAndamentoNaLista = completionReady
    ? filtrarPorEstado(filtered, "em_andamento", estadoCtx).length
    : 0;

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
      <section className="hero-pattern border-b-2 border-violet-200 py-12">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="mb-3 font-display text-4xl font-bold text-slate-950">
                Projetos
              </h1>
              <p className="text-lg text-slate-950">
                {projetos.length} projetos para construir portfólio. Cada um diz
                o que entregar, o caminho até lá e como saber que terminou.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]">
              {PROJETOS_V2_IDS.length} com guia completo
            </span>
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

      <section className="border-b-2 border-violet-200 bg-violet-50 py-4">
        <div className="container">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <BntSelect
                accent="orange"
                label="Filtrar por área"
                value={area === "" ? AREA_EMPTY_SENTINEL : area}
                onValueChange={(v) =>
                  setArea(v === AREA_EMPTY_SENTINEL ? "" : v)
                }
                options={areaSlugOptions.map((slug) => ({
                  value:
                    slug === AREA_ALL
                      ? AREA_ALL
                      : slug == null
                        ? AREA_EMPTY_SENTINEL
                        : slug,
                  label:
                    slug === AREA_ALL
                      ? "Todas as áreas"
                      : labelForProjectArea(slug),
                }))}
              />
              <BntSelect
                accent="orange"
                label="Filtrar por nível"
                value={nivel}
                onValueChange={setNivel}
                options={niveis.map((n) => ({
                  value: n,
                  label: `${n === "Todos" ? "Todos os níveis" : n} (${nivelCounts[n]})`,
                }))}
              />
              <BntSelect
                accent="orange"
                label="Filtrar por estado"
                value={estado}
                onValueChange={(v) => setEstado(v as ProjectStateFilter)}
                options={(
                  Object.keys(ESTADO_LABELS) as ProjectStateFilter[]
                ).map((v) => ({ value: v, label: ESTADO_LABELS[v] }))}
              />
              <BntSelect
                accent="orange"
                label="Filtrar por tecnologia"
                value={tech}
                onValueChange={setTech}
                options={[
                  { value: TECH_ALL, label: "Todas as tecnologias" },
                  ...techOptions.map((t) => ({ value: t, label: t })),
                ]}
              />
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

      <section className="bg-[var(--bnt-surface)] py-12">
        <div className="container">
          <p
            className="mb-6 text-sm font-bold text-slate-600"
            aria-live="polite"
          >
            {filtered.length} projeto{filtered.length !== 1 ? "s" : ""}
            {concluidosNaLista > 0 && (
              <span className="text-emerald-700">
                {" "}
                · {concluidosNaLista}{" "}
                {/* TODO(Ana): label do contador de concluidos */}
                concluído{concluidosNaLista !== 1 ? "s" : ""}
              </span>
            )}
            {emAndamentoNaLista > 0 && (
              <span className="text-orange-700">
                {" "}
                {/* TODO(Ana): label do contador de projetos em andamento */}·{" "}
                {emAndamentoNaLista} em andamento
              </span>
            )}
          </p>
          {!isPro && !loading && lockedCount > 0 ? (
            <Link
              href="/planos"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-violet-950 px-5 py-4 text-white shadow-[4px_4px_0_var(--bnt-shadow)] transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2 text-sm font-black">
                <Lock className="h-4 w-4 text-amber-300" aria-hidden />
                {/* TODO(Ana): copy do banner do tier Pro de projetos */}
                Todos os projetos das trilhas são gratuitos. Os com selo Pro são
                desafios premium pra quem quer ir além.
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-400 px-4 py-2 text-xs font-black uppercase text-ink-on-accent">
                Assinar o Pro <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          ) : null}
          <div className="space-y-10">
            {grupos.map((grupo) => (
              <section
                key={grupo.slug ?? "geral"}
                aria-label={`Projetos de ${labelForProjectArea(grupo.slug)}`}
              >
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-black text-slate-950">
                  <span
                    className="h-6 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getAreaAccent(
                        labelForProjectArea(grupo.slug),
                      ),
                    }}
                    aria-hidden
                  />
                  {labelForProjectArea(grupo.slug)}
                  <span className="text-sm font-bold text-slate-400">
                    ({grupo.itens.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.itens.map((projeto) => {
                    const areaLabel = labelForProjectArea(projeto.areaSlug);
                    const areaBadge = areaGridPaletteOf(areaLabel);
                    const subareaLabel = labelForProjectSubarea(
                      projeto.areaSlug,
                      projeto.subareaSlug,
                    );
                    const cardTravado = travado(projeto);
                    const marcadasDoCard = projectStages.get(projeto.id) ?? {};
                    const entregaDoCard = entregas.get(projeto.id) ?? null;
                    const estado: EstadoChip = cardTravado
                      ? { tipo: "pro_travado" }
                      : validatedIds.has(projeto.id) ||
                          entregaDoCard === "verificado"
                        ? { tipo: "verificado" }
                        : entregaDoCard === "entregue"
                          ? { tipo: "entregue" }
                          : projectsDone.has(projeto.id)
                            ? { tipo: "concluido" }
                            : Object.keys(marcadasDoCard).length > 0
                              ? { tipo: "em_andamento" }
                              : { tipo: "nao_iniciado" };
                    // Fatos do card saem SO do catalogo: tempo estimado e
                    // tipo de entrega moram no modulo v2, e carrega-lo aqui
                    // colocaria 12 chunks no catalogo (e o conteudo pago no
                    // navegador de quem nao assina). O chip "Guia" e o que
                    // sinaliza que a pagina tem mais.
                    const fatos = projeto.ferramentas.slice(0, 3);
                    return (
                      <Link
                        key={projeto.id}
                        href={`/projetos/${projeto.id}`}
                        className="card-brutal relative flex flex-col gap-2.5 overflow-hidden rounded-xl bg-card p-4 pl-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      >
                        <span
                          className="absolute bottom-0 left-0 top-0 w-1.5"
                          style={{
                            backgroundColor: cardTravado
                              ? "var(--brand-yellow)"
                              : getAreaAccent(areaLabel),
                          }}
                          aria-hidden
                        />
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${areaBadge.bg} ${areaBadge.text} ${areaBadge.border}`}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-current"
                                aria-hidden
                              />
                              {areaLabel}
                            </span>
                            {subareaLabel !== null && (
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${areaBadge.bg} ${areaBadge.text} ${areaBadge.border}`}
                              >
                                {subareaLabel}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${nivelColors[projeto.nivel] || "bg-slate-100 text-slate-600"}`}
                            >
                              {projeto.nivel}
                            </span>
                            {isProjetoV2(projeto.id) && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                                Guia
                              </span>
                            )}
                            {projeto.pro === true && (
                              <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-2 py-0.5 text-xs font-black text-ink-on-accent">
                                <ProStarIcon className="h-3 w-3" />
                                Pro
                              </span>
                            )}
                          </div>
                          <span
                            className="inline-flex shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton
                              compact
                              item={{
                                id: projeto.id,
                                type: "projeto",
                                title: projeto.nome,
                                subtitle: areaLabel,
                              }}
                            />
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground">
                          {projeto.nome}
                        </h3>
                        <p
                          className={`line-clamp-2 text-sm text-muted-foreground ${
                            cardTravado ? "blur-sm opacity-70" : ""
                          }`}
                        >
                          {projeto.objetivo}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
                          <span className="flex flex-wrap gap-x-3 text-xs font-semibold text-muted-foreground">
                            {fatos.map((f) => (
                              <span key={f}>{f}</span>
                            ))}
                          </span>
                          <ProjetoEstadoChip estado={estado} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

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
