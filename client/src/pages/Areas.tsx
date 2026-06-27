import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ClipboardList,
  Compass,
  LayoutGrid,
  Lock,
  Paintbrush,
  Search,
  SearchX,
  Sparkles,
  Users,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import EmbaixadoraBadge from "@/components/shared/EmbaixadoraBadge";
import PageHero from "@/components/shared/PageHero";
import {
  areasComplementares,
  areasPoucoConhecidas,
  areasTI,
  type AreaTI,
} from "@/lib/data";
import { getAreaAccent } from "@/lib/platformData";
import { getAreas } from "@/services/contentService";

const areaSlugs = new Set(areasTI.map((area) => area.slug));

const AWS_EMBAIXADORA_URL: string | undefined = undefined;

type AreaTipo = "Principal" | "Complementar" | "Menos conhecida";

interface Embaixadora {
  program: string;
  href?: string;
}

interface AreaCard {
  key: string;
  tipo: AreaTipo;
  nome: string;
  descricao: string;
  habilidades: string[];
  icon: LucideIcon;
  href?: string;
  favoriteId?: string;
  semDestino?: AreaTipo;
  embaixadora?: Embaixadora;
}

const TIPO_SELO: Record<AreaTipo, string> = {
  Principal: "bg-violet-100 text-violet-800",
  Complementar: "bg-amber-100 text-amber-900",
  "Menos conhecida": "bg-emerald-100 text-emerald-800",
};

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

const tipoFiltros: { id: string; label: string }[] = [
  { id: "todas", label: "Todos os tipos" },
  { id: "Principal", label: "Principais" },
  { id: "Complementar", label: "Complementares" },
  { id: "Menos conhecida", label: "Menos conhecidas" },
];

function SkeletonAreaCard() {
  return (
    <div className="flex h-full animate-pulse flex-col rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="mb-4 h-10 w-10 rounded-lg bg-slate-200" />
      <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mb-2 h-4 w-full rounded bg-slate-100" />
      <div className="mb-4 h-4 w-5/6 rounded bg-slate-100" />
      <div className="mt-auto flex gap-1">
        <div className="h-5 w-16 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export default function Areas() {
  const reduce = useReducedMotion() ?? false;
  const [areas, setAreas] = useState<AreaTI[] | null>(null);
  const [search, setSearch] = useState("");
  const [perfil, setPerfil] = useState("todos");
  const [tipo, setTipo] = useState("todas");

  useEffect(() => {
    getAreas()
      .then(setAreas)
      .catch(() => setAreas(areasTI));
  }, []);

  const isLoading = areas === null;

  const todasAreas = useMemo<AreaCard[]>(() => {
    const principais: AreaCard[] = (areas ?? []).map((area) => ({
      key: `principal-${area.id}`,
      tipo: "Principal",
      nome: area.nome,
      descricao: area.descricaoCurta,
      habilidades: area.habilidades.slice(0, 3),
      icon: area.icon,
      href: `/areas/${area.slug}`,
      favoriteId: area.id,
      embaixadora:
        area.slug === "cloud"
          ? { program: "AWS", href: AWS_EMBAIXADORA_URL }
          : area.slug === "mainframe"
            ? { program: "IBM Z Xplore" }
            : undefined,
    }));

    const complementares: AreaCard[] = areasComplementares.map((area) => ({
      key: `complementar-${area.nome}`,
      tipo: "Complementar",
      nome: area.nome,
      descricao: area.descricao,
      habilidades: [],
      icon: area.icon,
      semDestino: "Complementar",
    }));

    const menosConhecidas: AreaCard[] = areasPoucoConhecidas.map((area) => {
      const related =
        area.relatedAreaSlug && areaSlugs.has(area.relatedAreaSlug)
          ? area.relatedAreaSlug
          : undefined;
      return {
        key: `menos-${area.nome}`,
        tipo: "Menos conhecida",
        nome: area.nome,
        descricao: area.oQueE,
        habilidades: [],
        icon: Compass,
        href: related ? `/areas/${related}` : undefined,
        semDestino: related ? undefined : "Menos conhecida",
      };
    });

    return [...principais, ...complementares, ...menosConhecidas];
  }, [areas]);

  const filtered = todasAreas.filter((area) => {
    const term = search.toLowerCase();
    const matchSearch =
      area.nome.toLowerCase().includes(term) ||
      area.descricao.toLowerCase().includes(term);
    const matchPerfil =
      perfil === "todos" ||
      (area.favoriteId
        ? (perfilMap[perfil] || []).includes(area.favoriteId)
        : false);
    const matchTipo = tipo === "todas" || area.tipo === tipo;
    return matchSearch && matchPerfil && matchTipo;
  });

  function limparFiltros() {
    setSearch("");
    setPerfil("todos");
    setTipo("todas");
  }

  return (
    <Layout>
      <SEO
        title="Áreas da TI · Conheça todas as especializações em tecnologia"
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
        title="Áreas da TI"
        subtitle="Cada área é um caminho dentro da tech. Filtra pelo que te interessa, clica numa e veja o que ela é, o que faz e por onde começar."
        actions={
          <Link
            href="/quiz-carreira"
            className="pro-glare inline-flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-amber-300 px-5 py-3 font-display text-sm font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Não sabe por onde começar? Faça o quiz
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      <div
        className="bnt-marquee overflow-hidden border-b-2 border-slate-900 bg-violet-700 py-3"
        aria-label="Áreas da TI passando"
      >
        <div
          className="bnt-marquee-track flex w-max items-center gap-3"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          }}
        >
          {[...areasTI, ...areasTI].map((area, i) => {
            const dup = i >= areasTI.length;
            return (
              <Link
                key={`${area.slug}-${i}`}
                href={`/areas/${area.slug}`}
                aria-hidden={dup}
                tabIndex={dup ? -1 : undefined}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-slate-900 bg-white px-3.5 py-1.5 font-display text-sm font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getAreaAccent(area.nome) }}
                  aria-hidden
                />
                {area.nome}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="bg-violet-50 py-12">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar área..."
                className="w-full rounded-lg border-2 border-violet-200 py-2 pl-9 pr-4 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {perfilFiltros.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setPerfil(f.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                      perfil === f.id
                        ? "border-slate-900 bg-violet-700 text-white shadow-[2px_2px_0_#0f172a]"
                        : "border-slate-300 bg-white text-slate-700 hover:border-violet-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tipoFiltros.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  tipo === t.id
                    ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!isLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-600">
              <Compass className="h-4 w-4 text-violet-700" aria-hidden />
              {filtered.length} de {todasAreas.length}{" "}
              {todasAreas.length === 1 ? "área" : "áreas"}
            </p>
          ) : null}

          {isLoading ? (
            <div
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-busy="true"
              aria-label="Carregando áreas"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonAreaCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <SearchX
                className="mx-auto mb-3 h-12 w-12 text-slate-400"
                aria-hidden
              />
              <p className="font-medium text-slate-600">
                Não achamos nenhuma área com esses filtros.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Tenta outro termo ou tira os filtros pra ver todos os caminhos.
              </p>
              <button
                onClick={limparFiltros}
                className="mt-4 text-sm font-medium text-violet-700 hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((area, index) => {
                const Icon = area.icon;
                const accent = getAreaAccent(area.nome);
                const accentTint = `${accent}1a`;
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2 pr-9">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2"
                        style={{
                          backgroundColor: accentTint,
                          borderColor: accent,
                          color: accent,
                        }}
                      >
                        <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
                      </span>
                      <span
                        className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${TIPO_SELO[area.tipo]}`}
                      >
                        {area.tipo}
                      </span>
                    </div>
                    {area.embaixadora ? (
                      <EmbaixadoraBadge
                        program={area.embaixadora.program}
                        href={area.embaixadora.href}
                        className="mt-3"
                      />
                    ) : null}
                    <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                      {area.nome}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {area.descricao}
                    </p>
                    {area.habilidades.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {area.habilidades.map((h) => (
                          <span
                            key={h}
                            className="rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{ backgroundColor: accentTint, color: accent }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex items-center pt-3 text-sm font-black">
                      {area.href ? (
                        <span
                          className="inline-flex items-center gap-1"
                          style={{ color: accent }}
                        >
                          Explorar
                          <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                            aria-hidden
                          />
                        </span>
                      ) : area.semDestino === "Complementar" ? (
                        <span className="text-[0.65rem] font-black uppercase tracking-wide text-slate-400">
                          trilha em breve
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border-2 border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-black uppercase text-emerald-700">
                          curiosidade
                        </span>
                      )}
                    </div>
                  </>
                );

                return (
                  <motion.div
                    key={area.key}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.03, 0.3),
                    }}
                    className="relative h-full"
                  >
                    {area.favoriteId ? (
                      <FavoriteButton
                        compact
                        className="absolute right-3 top-3 z-30"
                        item={{
                          id: area.favoriteId,
                          type: "area",
                          title: area.nome,
                          subtitle: area.descricao,
                        }}
                      />
                    ) : null}
                    {area.href ? (
                      <Link
                        href={area.href}
                        className="group flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#fbbf24] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#fbbf24] motion-safe:focus-visible:-translate-y-1 motion-safe:focus-visible:shadow-[6px_6px_0_#fbbf24]"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#fbbf24]">
                        {inner}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
