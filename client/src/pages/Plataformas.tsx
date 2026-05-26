/*
  BORA NA TECH? — Plataformas Page
  Style: Neo-Brutalism Suavizado
  - Compare study platforms
*/

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Check, X, Star, Award, RotateCcw, SlidersHorizontal } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { plataformas } from "@/lib/data";
import { getPlatforms } from "@/services/contentService";

export default function Plataformas() {
  const [platformItems, setPlatformItems] = useState(plataformas);
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [iniciante, setIniciante] = useState(false);
  const [certificadoFilter, setCertificadoFilter] = useState("Todos");

  const tipos = ["Todos", "Gratuita", "Híbrida", "Paga"];
  const certificadoOptions = ["Todos", "Com certificado", "Sem certificado"];
  const areas = useMemo(
    () => ["Todas", ...Array.from(new Set(platformItems.flatMap((p) => p.areasFortes).filter((area) => area !== "Todas as áreas de TI")))],
    [platformItems],
  );
  const hasActiveFilters = tipoFilter !== "Todos" || areaFilter !== "Todas" || iniciante || certificadoFilter !== "Todos";

  useEffect(() => {
    getPlatforms().then(setPlatformItems).catch(() => setPlatformItems(plataformas));
  }, []);

  const filtered = platformItems.filter((p) => {
    const matchTipo = tipoFilter === "Todos" || p.tipo === tipoFilter;
    const matchArea = areaFilter === "Todas" || p.areasFortes.includes(areaFilter) || p.areasFortes.includes("Todas as áreas de TI");
    const matchIniciante = !iniciante || p.boaParaIniciantes;
    const matchCert =
      certificadoFilter === "Todos" ||
      (certificadoFilter === "Com certificado" && p.certificado) ||
      (certificadoFilter === "Sem certificado" && !p.certificado);

    return matchTipo && matchArea && matchIniciante && matchCert;
  });

  function clearFilters() {
    setTipoFilter("Todos");
    setAreaFilter("Todas");
    setIniciante(false);
    setCertificadoFilter("Todos");
  }

  return (
    <Layout>
      <SEO
        title="Plataformas de Estudo — Onde aprender tecnologia online"
        description="Compare plataformas de cursos online para aprender programação, dados, design, IA e tecnologia com mais clareza."
        keywords={["plataformas de cursos online", "onde estudar programação", "rocketseat alura udemy", "plataformas tecnologia"]}
        url="/plataformas"
        schemaType="CollectionPage"
      />
      {/* Header */}
      <section className="relative overflow-hidden bg-emerald-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#059669_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-emerald-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">onde estudar</p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Plataformas de Estudo</h1>
            <p className="text-slate-950 text-lg">
              Compare marketplaces grandes, documentação oficial, playgrounds na nuvem e jogos de código (tipo Flexbox Froggy ou CodinGame) para montar sua rota com clareza.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-emerald-50 border-b-2 border-emerald-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#6ee7b7]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-display text-sm font-black text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
                Filtros
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                <span>{filtered.length} plataforma{filtered.length === 1 ? "" : "s"} encontrada{filtered.length === 1 ? "" : "s"}</span>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                    <RotateCcw className="h-3 w-3" />
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
              {tipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    tipoFilter === t
                      ? "bg-emerald-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                className="rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                aria-label="Filtrar por área"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area === "Todas" ? "Todas as áreas" : area}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                {certificadoOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCertificadoFilter(option)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                      certificadoFilter === option
                        ? "bg-emerald-600 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                        : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 rounded-full border-2 border-slate-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={iniciante} onChange={(e) => setIniciante(e.target.checked)} className="w-4 h-4 accent-emerald-700" />
              Boa para iniciantes
            </label>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[#ecfdf5] py-12">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((plat) => (
              <div key={plat.id} className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#6ee7b7]">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-[3px_3px_0_#0f172a]">
                      <img src={plat.logoUrl} alt={`Logo ${plat.nome}`} className="h-9 w-9 object-contain" loading="lazy" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-xl text-slate-900">{plat.nome}</h3>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[11px] font-black ${
                        plat.certificado
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : "border-slate-300 bg-slate-100 text-slate-600"
                      }`}>
                        {plat.certificado ? <Award className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {plat.certificado ? "Oferece certificado" : "Sem certificado oficial"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border-2 ${
                      plat.tipo === "Gratuita" ? "bg-amber-100 text-amber-700 border-amber-300" :
                      plat.tipo === "Híbrida" ? "bg-amber-100 text-amber-700 border-amber-300" :
                      "bg-red-100 text-red-700 border-red-300"
                    }`}>
                      {plat.tipo}
                    </span>
                    <FavoriteButton compact item={{ id: plat.id, type: "plataforma", title: plat.nome, subtitle: plat.tipo, url: plat.link }} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 flex-1">{plat.descricao}</p>

                {/* Areas */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Áreas fortes</p>
                  <div className="flex flex-wrap gap-1">
                    {plat.areasFortes.slice(0, 4).map((a) => (
                      <span key={a} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>

                {/* Pros / Cons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1.5">Pontos fortes</p>
                    <ul className="space-y-1">
                      {plat.pontosFortes.slice(0, 3).map((p) => (
                        <li key={p} className="flex items-start gap-1 text-xs text-slate-600">
                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1.5">Limitações</p>
                    <ul className="space-y-1">
                      {plat.limitacoes.slice(0, 3).map((l) => (
                        <li key={l} className="flex items-start gap-1 text-xs text-slate-600">
                          <X className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {plat.boaParaIniciantes && (
                    <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> Para iniciantes
                    </span>
                  )}
                  {plat.trilhasOrganizadas && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Trilhas organizadas
                    </span>
                  )}
                </div>

                {/* Best for */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-600"><strong>Melhor para:</strong> {plat.melhorPerfil}</p>
                </div>

                {/* Price + Link */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">{plat.preco}</span>
                  <a
                    href={plat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    Visitar <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="card-brutal rounded-xl border-dashed bg-white p-10 text-center">
              <h2 className="font-display text-2xl font-black text-slate-950">Nenhuma plataforma encontrada</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">Tente limpar os filtros ou escolher uma combinação mais ampla.</p>
              <button type="button" onClick={clearFilters} className="btn-brutal-primary mt-5 rounded-full bg-white px-5 py-2 text-sm font-black">
                Limpar filtros
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-10 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">
              As informações são baseadas em curadoria e podem mudar. Verifique os preços e condições diretamente nas plataformas. O BORA NA TECH? não garante resultados profissionais.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
