/*
  BORA NA TECH? — Áreas da TI Page
  Style: Neo-Brutalism Suavizado
  - Grid of area cards with filters
  - Search by name
  - Filter by profile
*/

import { useEffect, useState } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ClipboardList,
  LayoutGrid,
  Lock,
  Paintbrush,
  Search,
  SearchX,
  Users,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AreaIconBox } from "@/components/areas/AreaIconBox";
import { areasTI, type AreaTI } from "@/lib/data";
import { getAreas } from "@/services/contentService";
import PageHero from "@/components/shared/PageHero";

const perfilFiltros: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "todos", label: "Todas as áreas", icon: LayoutGrid },
  { id: "criatividade", label: "Criatividade", icon: Paintbrush },
  { id: "logica", label: "Lógica", icon: Brain },
  { id: "pessoas", label: "Pessoas", icon: Users },
  { id: "organizacao", label: "Organização", icon: ClipboardList },
  { id: "seguranca", label: "Segurança", icon: Lock },
  { id: "dados", label: "Dados", icon: BarChart3 },
];

const perfilMap: Record<string, string[]> = {
  criatividade: ["uxui", "frontend", "mobile", "gamedev"],
  logica: ["backend", "devops", "cloud", "ciberseguranca", "ia", "fullstack", "gamedev"],
  pessoas: ["gestao", "produto"],
  organizacao: ["gestao", "qa", "produto"],
  seguranca: ["ciberseguranca", "cloud", "devops"],
  dados: ["dados", "ia", "backend"],
};

function SkeletonAreaCard() {
  return (
    <div className="card-brutal bg-white rounded-xl p-6 flex flex-col h-full animate-pulse">
      <div className="mb-4 h-12 w-12 rounded-lg bg-slate-200" />
      <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-full mb-2" />
      <div className="h-4 bg-slate-100 rounded w-5/6 mb-4" />
      <div className="h-16 rounded-xl border-2 border-violet-100 bg-violet-50 mb-4" />
      <div className="flex gap-1 mb-4 min-h-[1.75rem]">
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
        <div className="h-5 w-14 rounded-full bg-slate-100" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-4 w-16 bg-violet-100 rounded" />
      </div>
    </div>
  );
}

// null = loading (API ainda não respondeu). Evita o flash do fallback que
// rolava quando o state inicial era `areasTI`: a API tem 14 áreas, o fallback
// tinha 16, então o primeiro frame mostrava 16 e o segundo (após useEffect)
// trocava pra 14. Agora começamos vazio e só renderizamos quando a fonte certa
// chega; fallback fica reservado pro catch (erro de rede).
export default function Areas() {
  const [areas, setAreas] = useState<AreaTI[] | null>(null);
  const [search, setSearch] = useState("");
  const [perfil, setPerfil] = useState("todos");

  useEffect(() => {
    getAreas().then(setAreas).catch(() => setAreas(areasTI));
  }, []);

  const isLoading = areas === null;
  const filtered = (areas ?? []).filter((a) => {
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
              {perfilFiltros.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setPerfil(f.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                      perfil === f.id
                        ? "bg-violet-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                        : "bg-white text-slate-700 border-slate-300 hover:border-violet-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-violet-50 py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Carregando áreas">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonAreaCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <SearchX className="mx-auto mb-3 h-12 w-12 text-slate-400" aria-hidden />
              <p className="text-slate-600 font-medium">Nenhuma área encontrada.</p>
              <p className="text-slate-400 text-sm mt-1">Tente outro termo ou remova os filtros.</p>
              <button onClick={() => { setSearch(""); setPerfil("todos"); }} className="mt-4 text-violet-700 text-sm font-medium hover:underline">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((area) => (
                <div key={area.id} className="relative h-full">
                  <FavoriteButton
                    compact
                    className="absolute right-4 top-4 z-10"
                    item={{ id: area.id, type: "area", title: area.nome, subtitle: area.descricaoCurta }}
                  />
                  <Link
                    href={`/areas/${area.slug}`}
                    className="card-brutal bg-white rounded-xl p-6 flex flex-col group h-full"
                  >
                  <div className="mb-4 pr-12">
                    <AreaIconBox icon={area.icon} areaSlug={area.slug} size="md" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2 group-hover:text-violet-700 transition-colors">
                    {area.nome}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{area.descricaoCurta}</p>
                  <div className="mb-4 rounded-xl border-2 border-violet-200 bg-violet-50 p-3">
                    <p className="text-xs font-black uppercase text-slate-500">Personalidade da área</p>
                    <p className="mt-1 text-xs text-slate-700 line-clamp-3">{area.perfilIndicado}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4 min-h-[1.75rem]">
                    {area.habilidades.slice(0, 3).map((h) => (
                      <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
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
