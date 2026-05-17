/*
  BORA NA TECH? — Áreas da TI Page
  Style: Neo-Brutalism Suavizado
  - Grid of area cards with filters
  - Search by name
  - Filter by profile
*/

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, ArrowRight } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AreaIconBox } from "@/components/areas/AreaIconBox";
import { areasTI } from "@/lib/data";
import { influencerTips } from "@/lib/platformData";
import { getAreas } from "@/services/contentService";
import PageHero from "@/components/shared/PageHero";

const perfilFiltros = [
  { id: "todos", label: "Todas as áreas" },
  { id: "criatividade", label: "🎨 Criatividade" },
  { id: "logica", label: "🧠 Lógica" },
  { id: "pessoas", label: "👥 Pessoas" },
  { id: "organizacao", label: "📋 Organização" },
  { id: "seguranca", label: "🔒 Segurança" },
  { id: "dados", label: "📊 Dados" },
];

const perfilMap: Record<string, string[]> = {
  criatividade: ["uxui", "frontend", "mobile"],
  logica: ["backend", "devops", "cloud", "ciberseguranca", "ia"],
  pessoas: ["gestao", "produto"],
  organizacao: ["gestao", "qa", "produto"],
  seguranca: ["ciberseguranca", "cloud", "devops"],
  dados: ["dados", "ia", "backend"],
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i <= level ? "bg-violet-600" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function Areas() {
  const [areas, setAreas] = useState(areasTI);
  const [search, setSearch] = useState("");
  const [perfil, setPerfil] = useState("todos");

  useEffect(() => {
    getAreas().then(setAreas).catch(() => setAreas(areasTI));
  }, []);

  const filtered = areas.filter((a) => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.descricaoCurta.toLowerCase().includes(search.toLowerCase());
    const matchPerfil = perfil === "todos" || (perfilMap[perfil] || []).includes(a.id);
    return matchSearch && matchPerfil;
  });

  return (
    <Layout>
      <SEO
        title="Áreas da TI — Conheça todas as especializações em tecnologia"
        description="Explore as principais áreas da tecnologia: desenvolvimento, dados, segurança, design, infraestrutura, IA e mais. Descubra qual área combina com você."
        keywords={["áreas da ti", "especializações tecnologia", "tipos de programador", "carreiras em tecnologia", "qual área da ti escolher"]}
        url="/areas"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="violet"
        pattern="dots"
        eyebrow="mapa de possibilidades"
        title="Áreas da TI"
        subtitle="Explore as principais áreas de tecnologia e descubra qual combina com o seu perfil."
      />

      {/* Filters */}
      <section className="bg-violet-50 border-b-2 border-violet-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar área..."
                className="w-full pl-9 pr-4 py-2 border-2 border-violet-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            {/* Profile filters */}
            <div className="flex flex-wrap gap-2">
              {perfilFiltros.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPerfil(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    perfil === f.id
                      ? "bg-violet-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-violet-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-violet-50 py-12">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-slate-600 font-medium">Nenhuma área encontrada.</p>
              <p className="text-slate-400 text-sm mt-1">Tente outro termo ou remova os filtros.</p>
              <button onClick={() => { setSearch(""); setPerfil("todos"); }} className="mt-4 text-violet-700 text-sm font-medium hover:underline">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((area) => (
                <div key={area.id} className="relative">
                  <FavoriteButton
                    compact
                    className="absolute right-4 top-4 z-10"
                    item={{ id: area.id, type: "area", title: area.nome, subtitle: area.descricaoCurta }}
                  />
                  <Link
                    href={`/areas/${area.slug}`}
                    className="card-brutal bg-white rounded-xl p-6 flex flex-col group"
                  >
                  <div className="flex items-start justify-between mb-4 pr-12">
                    <AreaIconBox icon={area.icon} areaSlug={area.slug} size="md" />
                    <DifficultyDots level={area.dificuldade} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2 group-hover:text-violet-700 transition-colors">
                    {area.nome}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 flex-1">{area.descricaoCurta}</p>
                  <div className="mb-4 rounded-xl border-2 border-violet-200 bg-violet-50 p-3">
                    <p className="text-xs font-black uppercase text-slate-500">Personalidade da área</p>
                    <p className="mt-1 text-xs text-slate-700">{area.perfilIndicado}</p>
                  </div>
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <img
                      src={(influencerTips[area.id] || influencerTips.default).photo}
                      alt={(influencerTips[area.id] || influencerTips.default).name}
                      className="h-10 w-10 rounded-full border-2 border-slate-900 object-cover"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-950">{(influencerTips[area.id] || influencerTips.default).handle}</p>
                      <p className="text-xs text-slate-600">{(influencerTips[area.id] || influencerTips.default).tip}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {area.habilidades.slice(0, 3).map((h) => (
                      <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{area.cargos[0]}</span>
                    <span className="flex items-center gap-1 text-violet-700 text-sm font-medium group-hover:gap-2 transition-all">
                      Explorar <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
