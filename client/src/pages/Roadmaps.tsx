/*
  BORA NA TECH? — Roadmaps Page
  Style: Neo-Brutalism Suavizado
  - List of roadmaps with detail view
*/

import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { AiCtaButton } from "@/components/shared/AiCta";
import AiToolPanel from "@/components/shared/AiToolPanel";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { areasTI, roadmaps } from "@/lib/data";
import { roadmapPlans } from "@/lib/platformData";
import { getRoadmaps } from "@/services/contentService";

const roadmapImage =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663616665753/DXr9t3ifzyjk6U8zXioqGk/roadmap-banner-BKcp4QThC94ci8swjT8tVt.webp";

const FILTER_ALL = "todos";
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

export default function Roadmaps() {
  const { isPro } = useSubscription();
  const search = useSearch();
  const initialAreaFromUrl = new URLSearchParams(search).get("area");
  const [roadmapItems, setRoadmapItems] = useState(roadmaps);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(
    initialAreaFromUrl ?? FILTER_ALL,
  );
  const [durationFilter, setDurationFilter] = useState("todos");
  const [showAiCreator, setShowAiCreator] = useState(false);

  useEffect(() => {
    getRoadmaps()
      .then(setRoadmapItems)
      .catch(() => setRoadmapItems(roadmaps));
  }, []);

  const areaSlugs: (string | null)[] = [
    FILTER_ALL,
    ...Array.from(new Set(roadmapItems.map((r) => r.areaSlug))),
  ];

  const filtered = roadmapItems.filter((r) => {
    const matchesArea = filter === FILTER_ALL || r.areaSlug === filter;
    const matchesDuration =
      durationFilter === "todos" || r.duracaoDias === durationFilter;

    return matchesArea && matchesDuration;
  });
  const visibleRoadmaps = isPro
    ? filtered
    : filtered.filter((r) => r.id === roadmapItems[0]?.id);

  const selectedRoadmap = roadmapItems.find((r) => r.id === selected);

  return (
    <Layout>
      <SEO
        title="Roadmaps de TI — Trilhas completas para sua carreira tech"
        description="Roadmaps passo a passo para frontend, backend, dados, mobile, DevOps e mais. Aprenda na ordem certa, sem perder tempo."
        keywords={[
          "roadmap programação",
          "trilha de estudos ti",
          "como aprender programação",
          "roadmap frontend",
          "roadmap backend",
          "roadmap dados",
        ]}
        url="/roadmaps"
        schemaType="CollectionPage"
      />
      {/* Header */}
      <section className="bg-emerald-100 py-12 border-b-2 border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img
            src={roadmapImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#10b981_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl min-w-0 flex-1">
              <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-emerald-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
                trilha com direção
              </p>
              <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
                Roadmaps de Estudo
              </h1>
              <p className="text-slate-950 text-lg">
                Trilhas visuais com ordem clara de aprendizado. Saiba exatamente
                qual é o próximo passo.
              </p>
            </div>
            <div className="flex w-full max-w-xs shrink-0 flex-col gap-3 md:w-80">
              <AiCtaButton
                onClick={() => setShowAiCreator((current) => !current)}
                pressed={showAiCreator}
                accent="emerald"
                className="w-full"
                description="Gere uma trilha personalizada"
              >
                Criar roadmap com IA
              </AiCtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-emerald-50 border-b-2 border-emerald-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {areaSlugs.map((slug) => {
              const key = slug ?? "__null__";
              const active =
                filter === slug ||
                (slug === FILTER_ALL && filter === FILTER_ALL);
              const label =
                slug === FILTER_ALL ? "Todas as áreas" : labelForAreaSlug(slug);
              return (
                <button
                  key={key}
                  onClick={() =>
                    setFilter(slug === FILTER_ALL ? FILTER_ALL : (slug ?? ""))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-emerald-200 bg-[#ecfdf5] py-8">
        <div className="container">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                filtros por duração
              </p>
              <h2 className="font-display text-2xl font-black text-slate-950">
                Escolha o ritmo antes de abrir a trilha.
              </h2>
            </div>
            <Link
              href="/quiz-carreira"
              className="hidden text-sm font-bold text-slate-950 hover:underline md:inline-flex"
            >
              Não sei qual plano escolher
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {roadmapPlans.map((plan) => (
              <button
                key={plan.days}
                type="button"
                onClick={() => {
                  setDurationFilter(
                    durationFilter === plan.days ? "todos" : plan.days,
                  );
                  setSelected(null);
                }}
                className={`card-invite rounded-2xl p-5 text-left transition-all ${
                  durationFilter === plan.days
                    ? "border-slate-900 bg-amber-300 shadow-[4px_4px_0_#0f172a]"
                    : "bg-white shadow-[4px_4px_0_#6ee7b7] hover:-translate-y-0.5"
                }`}
                aria-pressed={durationFilter === plan.days}
              >
                <p className="font-display text-3xl font-black text-emerald-700">
                  {plan.days}
                </p>
                <p className="mt-1 text-sm font-black text-slate-950">
                  {plan.depth}
                </p>
                <p className="mt-2 text-xs text-slate-600">{plan.focus}</p>
              </button>
            ))}
          </div>
          {durationFilter !== "todos" && (
            <button
              type="button"
              onClick={() => setDurationFilter("todos")}
              className="mt-4 text-xs font-black uppercase text-slate-950 hover:underline"
            >
              Limpar filtro de duração
            </button>
          )}
        </div>
      </section>

      {showAiCreator && (
        <section className="border-b-2 border-emerald-200 bg-emerald-50 py-8">
          <div className="container">
            {isPro ? (
              <AiToolPanel
                endpoint="roadmap-generator"
                accent="emerald"
                title="Criador de roadmap com IA"
                description="Clientes Pro podem gerar uma trilha personalizada por objetivo, área, rotina e prazo."
                buttonLabel="Criar meu roadmap"
                fields={[
                  {
                    name: "area",
                    label: "Área",
                    type: "select",
                    options: areaSlugs
                      .filter((slug) => slug !== FILTER_ALL)
                      .map((slug) => labelForAreaSlug(slug)),
                  },
                  {
                    name: "level",
                    label: "Nível atual",
                    type: "select",
                    options: [
                      "Começando do zero",
                      "Já sei o básico",
                      "Intermediário",
                    ],
                  },
                  {
                    name: "deadline",
                    label: "Prazo desejado",
                    type: "select",
                    options: roadmapPlans.map((plan) => plan.days),
                  },
                  {
                    name: "hours",
                    label: "Tempo disponível por dia",
                    placeholder: "Ex: 1 hora por dia, 5 dias por semana",
                  },
                  {
                    name: "goal",
                    label: "Objetivo principal",
                    placeholder:
                      "Ex: montar portfólio, conseguir estágio, migrar de área",
                  },
                  {
                    name: "context",
                    label: "Contexto extra",
                    type: "textarea",
                    placeholder:
                      "Conte sua rotina, dificuldades, ferramentas que já conhece ou preferência de aprendizado.",
                  },
                ]}
              />
            ) : (
              <ProGate description="O criador de roadmap com IA é exclusivo para clientes Pro. Assine para gerar trilhas personalizadas por área, rotina e prazo." />
            )}
          </div>
        </section>
      )}

      <div className="bg-[#f0fdf4]">
        <div className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-1 space-y-3">
              {visibleRoadmaps.length === 0 && (
                <div className="card-brutal rounded-xl border-dashed bg-white p-5 text-sm font-bold text-slate-600">
                  Nenhum roadmap encontrado com esses filtros. Tente limpar a
                  duração ou escolher outra área.
                </div>
              )}
              {visibleRoadmaps.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelected(selected === r.id ? null : r.id)}
                  className={`w-full text-left card-brutal rounded-xl p-5 transition-all ${
                    selected === r.id ? "bg-emerald-700 text-white" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${
                          selected === r.id
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {labelForAreaSlug(r.areaSlug)}
                      </span>
                      <h3
                        className={`font-display font-bold text-base ${selected === r.id ? "text-white" : "text-slate-900"}`}
                      >
                        {r.nome}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${selected === r.id ? "text-emerald-200" : "text-slate-500"}`}
                      >
                        {r.nivel}
                      </p>
                      <p
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${
                          selected === r.id
                            ? "bg-white/15 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.duracaoDias}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <FavoriteButton
                        compact
                        item={{
                          id: r.id,
                          type: "roadmap",
                          title: r.nome,
                          subtitle: labelForAreaSlug(r.areaSlug),
                        }}
                      />
                      {selected === r.id ? (
                        <ChevronUp className="w-4 h-4 shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0 mt-1 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Link
                href="/estudos"
                className="card-brutal block rounded-xl border-emerald-300 bg-emerald-50 p-5"
              >
                <span className="font-display block font-black text-slate-950">
                  Gerar plano de estudos personalizado
                </span>
                <span className="mt-1 block text-xs font-bold text-emerald-700">
                  Plano Pro • montar rotina personalizada
                </span>
              </Link>
              {!isPro && filtered.length > visibleRoadmaps.length && (
                <ProGate
                  className="p-5"
                  description="Roadmaps além do exemplo gratuito ficam disponíveis no Plano Pro."
                />
              )}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selectedRoadmap ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="card-brutal bg-emerald-700 rounded-xl p-6 text-white">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium inline-block">
                        {labelForAreaSlug(selectedRoadmap.areaSlug)}
                      </span>
                      <FavoriteButton
                        item={{
                          id: selectedRoadmap.id,
                          type: "roadmap",
                          title: selectedRoadmap.nome,
                          subtitle: labelForAreaSlug(selectedRoadmap.areaSlug),
                        }}
                      />
                    </div>
                    <h2 className="font-display font-bold text-2xl mb-2">
                      {selectedRoadmap.nome}
                    </h2>
                    <p className="text-emerald-200 mb-4">
                      {selectedRoadmap.descricao}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-1">
                          Para quem
                        </p>
                        <p className="text-sm">{selectedRoadmap.paraQuem}</p>
                      </div>
                      <div>
                        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-1">
                          Pré-requisitos
                        </p>
                        <p className="text-sm">
                          {selectedRoadmap.preRequisitos}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="card-brutal bg-white rounded-xl p-6">
                    <h3 className="font-display font-bold text-xl text-slate-900 mb-6">
                      Etapas da trilha
                    </h3>
                    <div className="space-y-4">
                      {(isPro
                        ? selectedRoadmap.etapas
                        : selectedRoadmap.etapas.slice(0, 3)
                      ).map((etapa, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-sm font-bold flex items-center justify-center border-2 border-slate-900 shrink-0">
                              {etapa.numero}
                            </div>
                            {i < selectedRoadmap.etapas.length - 1 && (
                              <div className="w-0.5 h-full bg-slate-200 mt-2" />
                            )}
                          </div>
                          <div className="pb-4 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-slate-900">
                                {etapa.titulo}
                              </h4>
                              {etapa.tempo && (
                                <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {etapa.tempo}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {etapa.descricao}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isPro && selectedRoadmap.etapas.length > 3 && (
                      <div className="mt-6">
                        <ProGate description="Os próximos passos deste roadmap e todos os demais roadmaps completos estão disponíveis no Plano Pro." />
                      </div>
                    )}
                  </div>

                  {/* Errors + Avoid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="card-brutal bg-red-50 rounded-xl p-5 border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h3 className="font-semibold text-slate-900 text-sm">
                          Erros comuns
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {selectedRoadmap.errosComuns.map((e, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 flex items-start gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card-brutal bg-emerald-50 rounded-xl p-5 border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <h3 className="font-semibold text-slate-900 text-sm">
                          Próximo passo
                        </h3>
                      </div>
                      <p className="text-xs text-slate-700">
                        {selectedRoadmap.proximoPasso}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="card-brutal bg-emerald-100 rounded-xl p-5 flex items-center justify-between border-2 border-emerald-700">
                    <div>
                      <p className="font-display font-bold text-slate-950">
                        Pronta para começar?
                      </p>
                      <p className="text-sm text-slate-700">
                        Encontre cursos gratuitos e pagos para essa trilha.
                      </p>
                    </div>
                    <Link
                      href="/cursos"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white font-semibold rounded-lg text-sm border-2 border-emerald-700 hover:bg-emerald-800 transition-colors"
                    >
                      Ver cursos <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="card-brutal bg-slate-50 rounded-xl p-12 text-center border-dashed">
                  <p className="text-4xl mb-4">🗺️</p>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                    Selecione um roadmap
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Clique em um roadmap à esquerda para ver a trilha completa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
