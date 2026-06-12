/*
  BORA NA TECH? — Áreas da TI Page
  Style: Neo-Brutalism Suavizado
  - Grid of area cards with filters
  - Search by name
  - Filter by profile
*/

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Braces,
  Brain,
  Bug,
  ClipboardList,
  Cloud,
  Code2,
  Compass,
  Cpu,
  Database,
  GitBranch,
  LayoutGrid,
  Lock,
  Paintbrush,
  Rocket,
  Search,
  SearchX,
  Settings,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import EmbaixadoraBadge from "@/components/shared/EmbaixadoraBadge";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import CircularText from "@/components/reactbits/CircularText";
import CountUp from "@/components/reactbits/CountUp";
import CurvedLoop from "@/components/reactbits/CurvedLoop";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import SplitText from "@/components/reactbits/SplitText";
import {
  areasComplementares,
  areasPoucoConhecidas,
  areasTI,
  type AreaTI,
} from "@/lib/data";
import { getAreas } from "@/services/contentService";
import PageHero from "@/components/shared/PageHero";

const areaSlugs = new Set(areasTI.map((area) => area.slug));

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
  logica: [
    "backend",
    "devops",
    "cloud",
    "ciberseguranca",
    "ia",
    "fullstack",
    "gamedev",
    "engenharia-dados",
    "sre",
    "infraestrutura",
    "blockchain",
    "iot",
  ],
  pessoas: ["gestao", "produto", "analise-sistemas"],
  organizacao: [
    "gestao",
    "qa",
    "produto",
    "analise-dados",
    "banco-de-dados",
    "infraestrutura",
    "analise-sistemas",
  ],
  seguranca: ["ciberseguranca", "cloud", "devops", "sre"],
  dados: [
    "dados",
    "ia",
    "backend",
    "analise-dados",
    "engenharia-dados",
    "banco-de-dados",
  ],
};

interface Grupo {
  label: string;
  band: string;
  bandIcon: string;
  badge: string;
  explore: string;
  exploreBorder: string;
  spotlight: string;
  tint: string;
}

const GRUPOS: Record<string, Grupo> = {
  dev: {
    label: "Desenvolvimento",
    band: "bg-violet-600",
    bandIcon: "text-white",
    badge: "text-violet-700",
    explore: "text-violet-700",
    exploreBorder: "border-violet-200",
    spotlight: "rgba(124, 58, 237, 0.16)",
    tint: "text-violet-500",
  },
  dados: {
    label: "Dados e IA",
    band: "bg-blue-600",
    bandIcon: "text-white",
    badge: "text-blue-700",
    explore: "text-blue-700",
    exploreBorder: "border-blue-200",
    spotlight: "rgba(37, 99, 235, 0.16)",
    tint: "text-blue-500",
  },
  infra: {
    label: "Infra e Cloud",
    band: "bg-teal-600",
    bandIcon: "text-white",
    badge: "text-teal-700",
    explore: "text-teal-700",
    exploreBorder: "border-teal-200",
    spotlight: "rgba(13, 148, 136, 0.15)",
    tint: "text-teal-500",
  },
  seguranca: {
    label: "Segurança",
    band: "bg-rose-600",
    bandIcon: "text-white",
    badge: "text-rose-700",
    explore: "text-rose-700",
    exploreBorder: "border-rose-200",
    spotlight: "rgba(225, 29, 72, 0.15)",
    tint: "text-rose-500",
  },
  design: {
    label: "Design",
    band: "bg-fuchsia-600",
    bandIcon: "text-white",
    badge: "text-fuchsia-700",
    explore: "text-fuchsia-700",
    exploreBorder: "border-fuchsia-200",
    spotlight: "rgba(192, 38, 211, 0.15)",
    tint: "text-fuchsia-500",
  },
  gestao: {
    label: "Gestão",
    band: "bg-amber-400",
    bandIcon: "text-slate-950",
    badge: "text-amber-800",
    explore: "text-amber-800",
    exploreBorder: "border-amber-300",
    spotlight: "rgba(255, 184, 0, 0.18)",
    tint: "text-amber-500",
  },
  qa: {
    label: "QA e Suporte",
    band: "bg-emerald-600",
    bandIcon: "text-white",
    badge: "text-emerald-700",
    explore: "text-emerald-700",
    exploreBorder: "border-emerald-200",
    spotlight: "rgba(16, 185, 129, 0.15)",
    tint: "text-emerald-500",
  },
};

const SLUG_GRUPO: Record<string, string> = {
  frontend: "dev",
  backend: "dev",
  fullstack: "dev",
  mobile: "dev",
  gamedev: "dev",
  dados: "dados",
  ia: "dados",
  "analise-dados": "dados",
  "engenharia-dados": "dados",
  "banco-de-dados": "dados",
  devops: "infra",
  cloud: "infra",
  sre: "infra",
  infraestrutura: "infra",
  mainframe: "infra",
  iot: "infra",
  ciberseguranca: "seguranca",
  blockchain: "seguranca",
  uxui: "design",
  gestao: "gestao",
  produto: "gestao",
  "analise-sistemas": "gestao",
  qa: "qa",
};

function grupoDoSlug(slug: string) {
  return GRUPOS[SLUG_GRUPO[slug] ?? "dev"];
}

function grupoPorChave(chave: string) {
  return GRUPOS[chave] ?? GRUPOS.dev;
}

const areasDoodles = [
  { Icon: Code2, cls: "left-[3%] top-[7%] text-violet-500 opacity-[0.16]", size: "h-12 w-12", dur: 6.5, rot: -7, delay: 0 },
  { Icon: Database, cls: "right-[5%] top-[5%] text-blue-500 opacity-[0.16]", size: "h-12 w-12", dur: 7, rot: 8, delay: 0.5 },
  { Icon: Cloud, cls: "left-[8%] top-[40%] text-teal-500 opacity-[0.15]", size: "h-14 w-14", dur: 6, rot: 5, delay: 1.1 },
  { Icon: Lock, cls: "right-[3%] top-[36%] text-rose-500 opacity-[0.15]", size: "h-10 w-10", dur: 5.5, rot: -6, delay: 0.3 },
  { Icon: Smartphone, cls: "left-[2%] top-[72%] text-fuchsia-500 opacity-[0.15]", size: "h-10 w-10", dur: 7, rot: 7, delay: 1.4 },
  { Icon: BarChart3, cls: "right-[7%] top-[68%] text-blue-600 opacity-[0.15]", size: "h-12 w-12", dur: 6, rot: -5, delay: 0.8 },
  { Icon: Settings, cls: "left-[15%] top-[20%] text-amber-500 opacity-[0.14]", size: "h-9 w-9", dur: 8, rot: 12, delay: 0.2 },
  { Icon: Cpu, cls: "right-[14%] top-[18%] text-teal-600 opacity-[0.14]", size: "h-10 w-10", dur: 6.5, rot: -8, delay: 1.6 },
  { Icon: GitBranch, cls: "left-[11%] top-[88%] text-emerald-600 opacity-[0.14]", size: "h-9 w-9", dur: 5.5, rot: 6, delay: 0.6 },
  { Icon: Terminal, cls: "right-[12%] top-[88%] text-violet-500 opacity-[0.14]", size: "h-10 w-10", dur: 7, rot: -6, delay: 1.2 },
  { Icon: Braces, cls: "left-[46%] top-[3%] text-fuchsia-400 opacity-[0.13]", size: "h-9 w-9", dur: 6, rot: 9, delay: 0.9 },
  { Icon: Bug, cls: "right-[44%] top-[93%] text-rose-400 opacity-[0.13]", size: "h-8 w-8", dur: 5, rot: -10, delay: 1.5 },
];

const headerDoodles = [
  { Icon: Compass, cls: "left-[2%] top-[18%] text-violet-500 opacity-[0.16]", size: "h-12 w-12", dur: 7, rot: -8, delay: 0 },
  { Icon: Sparkles, cls: "left-[24%] top-[8%] text-amber-500 opacity-[0.15]", size: "h-9 w-9", dur: 6, rot: 10, delay: 0.6 },
  { Icon: Rocket, cls: "right-[28%] top-[12%] text-blue-500 opacity-[0.15]", size: "h-11 w-11", dur: 7.5, rot: 7, delay: 1.1 },
  { Icon: Code2, cls: "left-[10%] top-[68%] text-fuchsia-500 opacity-[0.14]", size: "h-10 w-10", dur: 6.5, rot: -6, delay: 0.3 },
  { Icon: Database, cls: "right-[6%] top-[64%] text-teal-500 opacity-[0.14]", size: "h-10 w-10", dur: 6, rot: 6, delay: 1.4 },
  { Icon: Cpu, cls: "right-[16%] top-[74%] text-emerald-500 opacity-[0.13]", size: "h-9 w-9", dur: 7, rot: -9, delay: 0.9 },
  { Icon: Braces, cls: "left-[40%] top-[80%] text-rose-400 opacity-[0.13]", size: "h-8 w-8", dur: 5.5, rot: 9, delay: 1.7 },
];

function Doodles({
  reduce,
  items,
}: {
  reduce: boolean;
  items: typeof areasDoodles;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {items.map((d, i) => {
        const Icon = d.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${d.cls}`}
            animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, d.rot, 0] }}
            transition={
              reduce
                ? undefined
                : {
                    duration: d.dur,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                    delay: d.delay,
                  }
            }
          >
            <Icon className={d.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}


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
  const reduce = useReducedMotion() ?? false;
  const [areas, setAreas] = useState<AreaTI[] | null>(null);
  const [search, setSearch] = useState("");
  const [perfil, setPerfil] = useState("todos");

  useEffect(() => {
    getAreas()
      .then(setAreas)
      .catch(() => setAreas(areasTI));
  }, []);

  const isLoading = areas === null;
  const filtered = (areas ?? []).filter((a) => {
    const matchSearch =
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.descricaoCurta.toLowerCase().includes(search.toLowerCase());
    const matchPerfil =
      perfil === "todos" || (perfilMap[perfil] || []).includes(a.id);
    return matchSearch && matchPerfil;
  });

  return (
    <Layout>
      <SEO
        title="Áreas da TI — Conheça todas as especializações em tecnologia"
        description="Explore as principais áreas da tecnologia: desenvolvimento, dados, segurança, design, infraestrutura, IA e mais. Descubra qual área combina com você."
        keywords={[
          "áreas da ti",
          "especializações tecnologia",
          "tipos de programador",
          "carreiras em tecnologia",
          "qual área da ti escolher",
        ]}
        url="/areas"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="violet"
        pattern="dots"
        eyebrow="mapa de possibilidades"
        backgroundSlot={<Doodles reduce={reduce} items={headerDoodles} />}
        title={
          <SplitText
            text="Áreas da TI"
            className="font-display text-4xl font-bold leading-tight text-slate-950"
          />
        }
        subtitle="Cada área é um caminho dentro da TI, com funções e habilidades próprias. Descubra qual combina com você."
        actions={
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center text-violet-700">
            <CircularText
              text="BORA NA TECH • SUA BÚSSOLA NA TI • "
              className="absolute inset-0"
              duration={24}
              radius={46}
            />
            <Compass className="h-9 w-9" aria-hidden />
          </div>
        }
      />

      <section
        aria-hidden
        className="relative overflow-hidden border-y-2 border-slate-900 bg-violet-600"
      >
        <CurvedLoop
          items={areasTI.map((a) => a.nome)}
          className="fill-violet-100 font-display text-[30px] font-black uppercase"
          speed={0.5}
        />
      </section>

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

      <section className="relative overflow-hidden bg-violet-50 py-12">
        <Doodles reduce={reduce} items={areasDoodles} />
        <div className="container relative z-10">
          {!isLoading ? (
            <div className="mb-6">
              <p className="flex items-center gap-2 font-display text-xl font-black text-slate-900">
                <Compass className="h-6 w-6 text-violet-700" aria-hidden />
                <span>
                  {reduce ? (
                    areas?.length ?? 0
                  ) : (
                    <CountUp to={areas?.length ?? 0} duration={1.2} />
                  )}{" "}
                  <SplitText text="caminhos pra você explorar" delay={35} />
                </span>
              </p>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-600">
                Cada área é um jeito de trabalhar com tecnologia. Toca nas que te
                dão curiosidade e descobre no seu ritmo. Não tem ordem certa.
              </p>
            </div>
          ) : null}
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              aria-busy="true"
              aria-label="Carregando áreas"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonAreaCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <SearchX
                className="mx-auto mb-3 h-12 w-12 text-slate-400"
                aria-hidden
              />
              <p className="text-slate-600 font-medium">
                Não achamos essa área por aqui.
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Tenta outro termo ou tira os filtros pra ver todos os caminhos.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setPerfil("todos");
                }}
                className="mt-4 text-violet-700 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((area, index) => {
                const grupo = grupoDoSlug(area.slug);
                const Icon = area.icon;
                return (
                  <AnimatedContent
                    key={area.id}
                    distance={16}
                    duration={0.4}
                    delay={Math.min(index * 0.05, 0.5)}
                    className="h-full"
                  >
                    <SpotlightCard
                      spotlightColor={reduce ? "transparent" : grupo.spotlight}
                      className="h-full rounded-2xl"
                    >
                      <FavoriteButton
                        compact
                        className="absolute right-3 top-3 z-30"
                        item={{
                          id: area.id,
                          type: "area",
                          title: area.nome,
                          subtitle: area.descricaoCurta,
                        }}
                      />
                      <Link
                        href={`/areas/${area.slug}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#FFB800] transition-all duration-200 hover:shadow-[8px_8px_0_#FFB800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:-rotate-1"
                      >
                        <div
                          className={`flex flex-col items-center gap-2 px-4 pb-4 pt-6 ${grupo.band}`}
                        >
                          <Icon
                            className={`h-10 w-10 transition-transform duration-300 ${grupo.bandIcon} motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-6`}
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          <span
                            className={`inline-flex rounded-full bg-white/95 px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${grupo.badge}`}
                          >
                            {grupo.label}
                          </span>
                        </div>
                        <div className="relative flex flex-1 flex-col items-center px-5 py-4 text-center">
                          <Icon
                            className={`pointer-events-none absolute -bottom-1 -right-1 h-16 w-16 opacity-[0.08] ${grupo.tint}`}
                            aria-hidden
                          />
                          {area.slug === "mainframe" ? (
                            <EmbaixadoraBadge className="relative z-10 mb-2" />
                          ) : null}
                          <h3 className="relative z-10 font-display text-lg font-bold text-slate-900">
                            {area.nome}
                          </h3>
                          <p className="relative z-10 mt-1.5 text-sm leading-relaxed text-slate-600">
                            {area.descricaoCurta}
                          </p>
                          <div className="relative z-10 mt-3 flex flex-wrap justify-center gap-1">
                            {area.habilidades.slice(0, 3).map((h) => (
                              <span
                                key={h}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div
                          className={`flex items-center justify-center gap-1 border-t-2 px-4 py-3 text-sm font-black ${grupo.exploreBorder} ${grupo.explore}`}
                        >
                          Explorar{" "}
                          <ArrowRight
                            className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                            aria-hidden
                          />
                        </div>
                      </Link>
                    </SpotlightCard>
                  </AnimatedContent>
                );
              })}
            </div>
          )}

          <div className="mt-14">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-violet-700" aria-hidden />
              <h2 className="font-display text-3xl font-black text-slate-900">
                Mais áreas pra conhecer
              </h2>
            </div>
            <p className="mb-6 max-w-2xl text-sm text-slate-600">
              Caminhos que também fazem parte da TI. A trilha completa de cada
              uma chega em breve.
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {areasComplementares.map((area, index) => {
                const grupo = grupoPorChave(area.grupo);
                const Icon = area.icon;
                return (
                  <AnimatedContent
                    key={area.nome}
                    distance={16}
                    duration={0.4}
                    delay={Math.min(index * 0.05, 0.3)}
                    className="h-full"
                  >
                    <SpotlightCard
                      spotlightColor={reduce ? "transparent" : grupo.spotlight}
                      className="h-full rounded-2xl"
                    >
                      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#FFB800] transition-all duration-200 hover:shadow-[8px_8px_0_#FFB800] motion-safe:hover:-translate-y-1">
                        <div
                          className={`flex flex-col items-center gap-2 px-4 pb-4 pt-6 ${grupo.band}`}
                        >
                          <Icon
                            className={`h-10 w-10 transition-transform duration-300 ${grupo.bandIcon} motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-6`}
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          <span
                            className={`inline-flex rounded-full bg-white/95 px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${grupo.badge}`}
                          >
                            {grupo.label}
                          </span>
                        </div>
                        <div className="relative flex flex-1 flex-col items-center px-5 py-4 text-center">
                          <Icon
                            className={`pointer-events-none absolute -bottom-1 -right-1 h-16 w-16 opacity-[0.08] ${grupo.tint}`}
                            aria-hidden
                          />
                          <h3 className="relative z-10 font-display text-lg font-bold text-slate-900">
                            {area.nome}
                          </h3>
                          <p className="relative z-10 mt-1.5 text-sm leading-relaxed text-slate-600">
                            {area.descricao}
                          </p>
                        </div>
                        <div className="flex items-center justify-center border-t-2 border-slate-200 px-4 py-3 text-[0.65rem] font-black uppercase tracking-wide text-slate-400">
                          trilha em breve
                        </div>
                      </div>
                    </SpotlightCard>
                  </AnimatedContent>
                );
              })}
            </div>
          </div>

          <div className="mt-14">
            <div className="mb-2 flex items-center gap-2">
              <Compass className="h-6 w-6 text-violet-700" />
              <h2 className="font-display text-3xl font-black text-slate-900">
                Áreas menos conhecidas para explorar
              </h2>
            </div>
            <p className="mb-6 max-w-2xl text-sm text-slate-600">
              Carreiras de TI fora do óbvio. Algumas se conectam às áreas acima,
              outras ficam como curiosidade para você descobrir.
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {areasPoucoConhecidas.map((item) => {
                const related =
                  item.relatedAreaSlug && areaSlugs.has(item.relatedAreaSlug)
                    ? item.relatedAreaSlug
                    : undefined;
                const conteudo = (
                  <>
                    <h3 className="font-display text-xl font-black text-slate-900">
                      {item.nome}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{item.oQueE}</p>
                    <p className="mt-2 flex-1 text-sm font-semibold text-slate-700">
                      {item.porQue}
                    </p>
                    {related ? (
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-violet-700 group-hover:gap-2 transition-all">
                        Explorar área relacionada{" "}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="mt-4 inline-flex w-fit rounded-full border-2 border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-black uppercase text-violet-700">
                        curiosidade
                      </span>
                    )}
                  </>
                );
                return related ? (
                  <Link
                    key={item.nome}
                    href={`/areas/${related}`}
                    className="card-brutal flex h-full flex-col rounded-xl bg-white p-6 group transition-all hover:-translate-y-1"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div
                    key={item.nome}
                    className="card-brutal flex h-full flex-col rounded-xl bg-white p-6"
                  >
                    {conteudo}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
