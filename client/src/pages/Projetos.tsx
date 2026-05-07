/*
  BORA NA TECH? — Projetos Page
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, ArrowRight, ExternalLink, PlayCircle } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { projetos } from "@/lib/data";
import { projectHelpVideos } from "@/lib/platformData";
import { getProjects } from "@/services/contentService";

const niveis = ["Todos", "Iniciante", "Básico", "Intermediário", "Avançado"];
const nivelGuides = [
  { label: "Iniciante", desc: "Para quem não sabe absolutamente nada e precisa de entregas sem pressão.", className: "bg-emerald-100 text-emerald-800 shadow-[4px_4px_0_#34d399]" },
  { label: "Básico", desc: "Para quem já entende fundamentos e quer praticar com pequenas interações.", className: "bg-amber-100 text-amber-800 shadow-[4px_4px_0_#fbbf24]" },
  { label: "Intermediário", desc: "Para quem já estudou um pouco e quer integrar dados, APIs ou documentação.", className: "bg-blue-100 text-blue-800 shadow-[4px_4px_0_#60a5fa]" },
  { label: "Avançado", desc: "Para quem já está a fundo em TI e quer projetos completos, deploy, testes ou IA.", className: "bg-violet-100 text-violet-800 shadow-[4px_4px_0_#a78bfa]" },
];

const areaColors: Record<string, string> = {
  "Front-end": "bg-blue-100 text-blue-700",
  "UX/UI Design": "bg-pink-100 text-pink-700",
  "Ciência de Dados": "bg-amber-100 text-amber-700",
  "QA": "bg-blue-100 text-blue-700",
  "Produto / Gestão": "bg-violet-100 text-violet-700",
  "Carreira": "bg-amber-100 text-amber-700",
  "Back-end": "bg-emerald-100 text-emerald-700",
  "Full Stack": "bg-violet-100 text-violet-700",
  "DevOps": "bg-slate-100 text-slate-700",
  "IA / Dados": "bg-fuchsia-100 text-fuchsia-700",
};

const nivelColors: Record<string, string> = {
  "Iniciante": "bg-emerald-100 text-emerald-700",
  "Básico": "bg-amber-100 text-amber-700",
  "Intermediário": "bg-blue-100 text-blue-700",
  "Avançado": "bg-violet-100 text-violet-700",
};

export default function Projetos() {
  const [projectItems, setProjectItems] = useState(projetos);
  const [area, setArea] = useState("Todas");
  const [nivel, setNivel] = useState("Todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const areas = useMemo(() => ["Todas", ...Array.from(new Set(projectItems.map((p) => p.area)))], [projectItems]);

  useEffect(() => {
    getProjects().then(setProjectItems).catch(() => setProjectItems(projetos));
  }, []);

  const filtered = projectItems.filter((p) => {
    const matchArea = area === "Todas" || p.area === area;
    const matchNivel = nivel === "Todos" || p.nivel === nivel;
    return matchArea && matchNivel;
  });

  return (
    <Layout>
      <SEO
        title="Projetos para Portfólio — Ideias práticas para iniciantes em TI"
        description="Ideias de projetos por nível e área para montar portfólio, praticar tecnologia e mostrar evolução em processos seletivos."
        keywords={["projetos para portfólio", "projetos programação iniciante", "ideias de projetos ti", "portfolio dev iniciante"]}
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
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Projetos para cada fase da sua jornada.</h1>
            <p className="text-slate-950 text-lg">
              Ideias práticas para quem está do zero absoluto até quem já quer projetos completos e profundos em TI.
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
                <h2 className="font-display text-xl font-black">{guide.label}</h2>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-700">{guide.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-50 border-b-2 border-orange-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap gap-3">
            <select value={area} onChange={(e) => setArea(e.target.value)} className="px-3 py-2 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white">
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="px-3 py-2 border-2 border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white">
              {niveis.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-[#fff7ed] py-12">
        <div className="container">
          <div className="space-y-4">
            {filtered.map((projeto) => (
              <div key={projeto.id} className="card-brutal bg-white rounded-xl overflow-hidden shadow-[5px_5px_0_#fdba74]">
                <div
                  onClick={() => setExpanded(expanded === projeto.id ? null : projeto.id)}
                  className="w-full flex items-start justify-between p-6 text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${areaColors[projeto.area] || "bg-slate-100 text-slate-600"}`}>
                        {projeto.area}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${nivelColors[projeto.nivel] || "bg-slate-100 text-slate-600"}`}>{projeto.nivel}</span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-slate-900">{projeto.nome}</h3>
                    <p className="text-sm text-slate-600 mt-1">{projeto.objetivo}</p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    <FavoriteButton compact item={{ id: projeto.id, type: "projeto", title: projeto.nome, subtitle: projeto.area }} />
                    {expanded === projeto.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {expanded === projeto.id && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        {/* Ferramentas */}
                        <div className="mb-4">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Ferramentas</p>
                          <div className="flex flex-wrap gap-1">
                            {projeto.ferramentas.map((f) => (
                              <span key={f} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">{f}</span>
                            ))}
                          </div>
                        </div>

                        {/* Passo a passo */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Passo a passo</p>
                          <ol className="space-y-2">
                            {projeto.passosSimplificados.map((passo, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                {passo}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div>
                        <a
                          href={(projectHelpVideos[projeto.id] || projectHelpVideos.default).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-brutal mb-4 flex items-start gap-3 rounded-lg border-amber-300 bg-amber-50 p-4"
                        >
                          <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" />
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vídeo de ajuda</p>
                            <p className="text-sm font-bold text-slate-900">
                              {(projectHelpVideos[projeto.id] || projectHelpVideos.default).title}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-violet-700">
                              Assistir referência <ExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        </a>
                        {/* Entregável */}
                        <div className="card-brutal bg-blue-50 rounded-lg p-4 mb-4 border-blue-200">
                          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Entregável final</p>
                          <p className="text-sm text-slate-700">{projeto.entregavel}</p>
                          <p className="text-xs text-slate-500 mt-1">📤 Publicar em: {projeto.comoPublicar}</p>
                        </div>

                        {/* LinkedIn */}
                        <div className="card-brutal bg-blue-50 rounded-lg p-4 border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Sugestão de post no LinkedIn</p>
                          </div>
                          <p className="text-xs text-slate-700 italic">"{projeto.sugestaoLinkedIn}"</p>
                        </div>

                        {/* Próximo projeto */}
                        <div className="mt-4 flex items-center gap-2 text-sm text-violet-700 font-medium">
                          <ArrowRight className="w-4 h-4" />
                          <span>Próximo: {projeto.proximoProjeto}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🛠️</p>
              <p className="text-slate-600 font-medium">Nenhum projeto encontrado.</p>
              <button onClick={() => { setArea("Todas"); setNivel("Todos"); }} className="mt-4 text-orange-700 text-sm font-medium hover:underline">Limpar filtros</button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
