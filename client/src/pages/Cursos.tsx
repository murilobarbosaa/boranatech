/*
  BORA NA TECH? — Cursos Page
  Style: Neo-Brutalism Suavizado
  - Grid of free and paid courses with filters
*/

import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Clock, Globe } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { areasTI, cursosGratuitos } from "@/lib/data";
import { getCourses } from "@/services/contentService";

const nivelOptions = ["Todos", "Iniciante", "Intermediário", "Avançado"];
const idiomaOptions = ["Todos", "Português", "Inglês"];
const tipoOptions = ["Todos", "Gratuito", "Pago"];

const AREA_ALL = "Todas";
const SPECIAL_LABELS: Record<string, string> = { carreira: "Carreira", fullstack: "Full Stack" };

function labelForAreaSlug(slug: string | null | undefined): string {
  if (!slug) return "Geral";
  return areasTI.find((a) => a.slug === slug)?.nome ?? SPECIAL_LABELS[slug] ?? slug;
}

const areaTagClass: Record<string, string> = {
  frontend: "tag-frontend",
  backend: "tag-backend",
  uxui: "tag-uxui",
  cloud: "tag-cloud",
  ciberseguranca: "tag-seguranca",
  dados: "tag-dados",
};

export default function Cursos() {
  const [courses, setCourses] = useState(cursosGratuitos);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState(AREA_ALL);
  const [nivel, setNivel] = useState("Todos");
  const [idioma, setIdioma] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const areaSlugOptions = useMemo<(string | null)[]>(
    () => [AREA_ALL, ...Array.from(new Set(courses.map((c) => c.areaSlug)))],
    [courses],
  );

  useEffect(() => {
    getCourses().then(setCourses).catch(() => setCourses(cursosGratuitos));
  }, []);

  const filtered = courses.filter((c) => {
    const slugLabel = labelForAreaSlug(c.areaSlug);
    const matchSearch = c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      c.canal.toLowerCase().includes(search.toLowerCase()) ||
      slugLabel.toLowerCase().includes(search.toLowerCase());
    const matchArea = area === AREA_ALL || c.areaSlug === area;
    const matchNivel = nivel === "Todos" || c.nivel === nivel;
    const matchIdioma = idioma === "Todos" || c.idioma.includes(idioma);
    const matchTipo = tipo === "Todos" || (c.tipo || "Gratuito") === tipo;
    return matchSearch && matchArea && matchNivel && matchIdioma && matchTipo;
  });

  return (
    <Layout>
      <SEO
        title="Cursos de TI — Curadoria de cursos online gratuitos e pagos"
        description="Mais de 200 cursos curados de programação, dados, design, IA e tecnologia. Conteúdo organizado por área e nível para iniciantes."
        keywords={["cursos de ti gratuitos", "cursos online programação", "cursos tecnologia iniciantes", "melhores cursos ti", "cursos para começar em programação"]}
        url="/cursos"
        schemaType="CollectionPage"
      />
      {/* Header */}
      <section className="relative overflow-hidden bg-amber-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">curadoria para estudar</p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Cursos</h1>
            <p className="text-slate-950 text-lg">
              Cursos gratuitos e pagos selecionados para iniciantes, organizados por área, nível e tipo.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white border-2 border-slate-900 rounded-full px-4 py-1.5 text-slate-900 text-sm font-bold shadow-[3px_3px_0_#f59e0b]">
              ✅ {courses.length} cursos curados
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-amber-50 border-b-2 border-amber-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar curso..."
                className="w-full pl-9 pr-4 py-2 border-2 border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            {/* Area */}
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="px-3 py-2 border-2 border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-white"
            >
              {areaSlugOptions.map((slug) => {
                const value = slug === AREA_ALL ? AREA_ALL : slug ?? "";
                const key = slug ?? "__null__";
                const label = slug === AREA_ALL ? AREA_ALL : labelForAreaSlug(slug);
                return <option key={key} value={value}>{label}</option>;
              })}
            </select>
            {/* Nivel */}
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="px-3 py-2 border-2 border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-white"
            >
              {nivelOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
            {/* Idioma */}
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="px-3 py-2 border-2 border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-white"
            >
              {idiomaOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
            {/* Tipo */}
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="px-3 py-2 border-2 border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-white"
            >
              {tipoOptions.map((o) => <option key={o}>{o === "Todos" ? "Todos os tipos" : o}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[#fff9e7] py-12">
        <div className="container">
          <p className="text-sm text-slate-500 mb-6">{filtered.length} curso{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📚</p>
              <p className="text-slate-600 font-medium">Nenhum curso encontrado.</p>
              <p className="text-slate-400 text-sm mt-1">Tente outros filtros.</p>
              <button onClick={() => { setSearch(""); setArea(AREA_ALL); setNivel("Todos"); setIdioma("Todos"); setTipo("Todos"); }} className="mt-4 text-slate-950 text-sm font-medium hover:underline">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((curso) => (
                <div key={curso.id} className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#fbbf24]">
                  {/* Tags */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${(curso.areaSlug && areaTagClass[curso.areaSlug]) || "bg-slate-100 text-slate-600"}`}>
                        {labelForAreaSlug(curso.areaSlug)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold border-2 ${
                        (curso.tipo || "Gratuito") === "Pago" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                      }`}>
                        {curso.tipo || "Gratuito"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        curso.nivel === "Iniciante" ? "bg-blue-100 text-blue-700" :
                        curso.nivel === "Intermediário" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {curso.nivel}
                      </span>
                      <FavoriteButton compact item={{ id: curso.id, type: "curso", title: curso.titulo, subtitle: curso.canal, url: curso.link }} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-slate-900 mb-1">{curso.titulo}</h3>
                  <p className="text-sm text-amber-700 font-medium mb-3">{curso.canal}</p>
                  {curso.preco && <p className="mb-3 text-xs font-bold text-slate-500">{curso.preco}</p>}
                  <p className="text-sm text-slate-600 flex-1 mb-4">{curso.descricao}</p>

                  {/* Why recommended */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-800"><strong>Por que indicamos:</strong> {curso.motivoIndicacao}</p>
                  </div>

                  {/* What you learn */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-700 mb-2">O que você aprende:</p>
                    <div className="flex flex-wrap gap-1">
                      {curso.oQueAprende.map((item) => (
                        <span key={item} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> {curso.duracao}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Globe className="w-3 h-3" /> {curso.idioma}
                      </span>
                    </div>
                    <a
                      href={curso.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:bg-amber-400 hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                    >
                      Acessar <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-10 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">
              Os cursos listados pertencem aos seus respectivos criadores e plataformas. O BORA NA TECH? é um projeto de curadoria e recomenda verificar preço, turma e condições no site oficial.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
