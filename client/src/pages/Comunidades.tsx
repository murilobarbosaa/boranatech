/*
  BORA NA TECH? (Comunidades Page)
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  ExternalLink,
  Globe,
  LayoutGrid,
  MapPin,
  RotateCcw,
  Search,
  Shuffle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import SobreNos from "@/components/shared/SobreNos";
import { comunidades } from "@/lib/data";
import { ESTADO_UF_OPTS } from "@/lib/eventFilters";
import { softSkills } from "@/lib/softSkillsData";

type Modalidade = "Todas" | "Online" | "Presencial" | "Híbrido";

const MODALIDADE_TABS: { id: Modalidade; label: string; Icon: LucideIcon }[] = [
  { id: "Todas", label: "Todas", Icon: LayoutGrid },
  { id: "Online", label: "Online", Icon: Globe },
  { id: "Presencial", label: "Presencial", Icon: MapPin },
  { id: "Híbrido", label: "Híbrido", Icon: Shuffle },
];

const TAB_ATIVA: Record<Modalidade, string> = {
  Todas: "bg-violet-600 text-white",
  Online: "bg-cyan-600 text-white",
  Presencial: "bg-amber-500 text-slate-950",
  Híbrido: "bg-fuchsia-600 text-white",
};

const MODALIDADE_BADGE: Record<string, string> = {
  Online: "border-cyan-300 bg-cyan-100 text-cyan-700",
  Presencial: "border-amber-300 bg-amber-100 text-amber-700",
  Híbrido: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700",
};

const tipoColor: Record<string, string> = {
  Comunidade: "bg-violet-100 text-violet-700",
  "Blog / Comunidade": "bg-blue-100 text-blue-700",
  "Comunidade / Escola": "bg-amber-100 text-amber-700",
  "Blog / Newsletter": "bg-amber-100 text-amber-700",
  "Comunidade / Blog": "bg-pink-100 text-pink-700",
};

const areas = ["Todas", ...Array.from(new Set(comunidades.map((c) => c.area)))];
const idiomas = ["Todos", "Português", "Inglês"];

export default function Comunidades() {
  const [modalidade, setModalidade] = useState<Modalidade>("Todas");
  const [estadoUF, setEstadoUF] = useState("");
  const [area, setArea] = useState("Todas");
  const [idioma, setIdioma] = useState("Todos");
  const [query, setQuery] = useState("");

  // Ancora #sobre: /sobre redireciona pra ca; rola ate a secao Sobre Nos apos
  // a renderizacao (respeitando prefers-reduced-motion).
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#sobre")
      return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const id = window.setTimeout(() => {
      document.getElementById("sobre")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }, 60);
    return () => window.clearTimeout(id);
  }, []);

  const modalidadeCounts = useMemo(
    () => ({
      Todas: comunidades.length,
      Online: comunidades.filter((c) => c.modalidade === "Online").length,
      Presencial: comunidades.filter((c) => c.modalidade === "Presencial")
        .length,
      Híbrido: comunidades.filter((c) => c.modalidade === "Híbrido").length,
    }),
    [],
  );

  const filtered = useMemo(
    () =>
      comunidades.filter((c) => {
        const matchModalidade =
          modalidade === "Todas" || c.modalidade === modalidade;
        const matchEstado = estadoUF === "" || c.estado === estadoUF;
        const matchArea = area === "Todas" || c.area === area;
        const matchIdioma = idioma === "Todos" || c.idioma === idioma;
        const matchQuery =
          query.trim() === "" ||
          c.nome.toLowerCase().includes(query.trim().toLowerCase());
        return (
          matchModalidade &&
          matchEstado &&
          matchArea &&
          matchIdioma &&
          matchQuery
        );
      }),
    [modalidade, estadoUF, area, idioma, query],
  );

  const modalidadeVazia = modalidadeCounts[modalidade] === 0;

  function clearFilters() {
    setEstadoUF("");
    setArea("Todas");
    setIdioma("Todos");
    setQuery("");
  }

  return (
    <Layout>
      <SEO
        title="Comunidades Tech · Grupos e redes para networking em TI"
        description="Conheça comunidades de tecnologia, grupos de programação e redes para aprender, trocar experiências e fazer networking em TI."
        keywords={[
          "comunidades tecnologia",
          "discord programação",
          "networking ti",
          "grupos tech brasil",
        ]}
        url="/comunidades"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-violet-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              aprendizado em rede
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
              Comunidades de tech
            </h1>
            <p className="text-slate-950 text-lg">
              Encontre grupos pra trocar, aprender e fazer networking. Online de
              qualquer lugar, e presenciais por estado em breve.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-violet-50 border-b-2 border-violet-200 py-4 sticky top-16 z-40">
        <div className="container space-y-3">
          <div
            role="tablist"
            aria-label="Modalidade"
            className="flex flex-wrap gap-2"
          >
            {MODALIDADE_TABS.map(({ id, label, Icon }) => {
              const active = modalidade === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setModalidade(id)}
                  className={`inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-4 py-2 text-sm font-black transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                    active
                      ? `${TAB_ATIVA[id]} shadow-[3px_3px_0_#0f172a]`
                      : "bg-white text-slate-900 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#0f172a]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-black ${
                      active ? "bg-white/25" : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {modalidadeCounts[id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="comunidade-busca" className="sr-only">
                Buscar comunidade
              </label>
              <input
                id="comunidade-busca"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar pelo nome"
                className="w-full rounded-lg border-2 border-violet-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label="Filtrar por área"
              className="rounded-lg border-2 border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              {areas.map((a) => (
                <option key={a}>{a === "Todas" ? "Todas as áreas" : a}</option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <label htmlFor="comunidade-estado" className="sr-only">
                Filtrar por estado
              </label>
              <select
                id="comunidade-estado"
                value={estadoUF}
                onChange={(e) => setEstadoUF(e.target.value)}
                className="rounded-lg border-2 border-slate-900 bg-amber-50 py-2 pl-9 pr-3 text-sm font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                <option value="">Todos os estados</option>
                {ESTADO_UF_OPTS.map(({ sigla, nome }) => (
                  <option key={sigla} value={sigla}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="flex gap-2"
              role="group"
              aria-label="Filtrar por idioma"
            >
              {idiomas.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIdioma(id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    idioma === id
                      ? "bg-violet-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-violet-400"
                  }`}
                >
                  {id === "Todos" ? "Todos os idiomas" : id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f3ff] py-12">
        <div className="container">
          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((com, index) => (
                <motion.div
                  key={com.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.04, 0.3),
                  }}
                  whileHover={{ y: -4 }}
                  className="card-brutal flex flex-col rounded-xl bg-white p-6 shadow-[5px_5px_0_#c4b5fd]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[11px] font-black ${MODALIDADE_BADGE[com.modalidade] ?? "border-slate-300 bg-slate-100 text-slate-600"}`}
                      >
                        {com.modalidade}
                      </span>
                      {com.estado ? (
                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700">
                          <MapPin className="h-3 w-3" />
                          {com.estado}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${com.idioma === "Português" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {com.idioma}
                      </span>
                      <FavoriteButton
                        compact
                        item={{
                          id: com.id,
                          type: "comunidade",
                          title: com.nome,
                          subtitle: com.area,
                          url: com.link,
                        }}
                      />
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-xl text-slate-900">
                    {com.nome}
                  </h3>
                  <p className="mt-1 mb-3 text-xs font-medium text-violet-700">
                    <span
                      className={`mr-1 rounded px-1.5 py-0.5 ${tipoColor[com.tipo] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {com.tipo}
                    </span>
                    {com.plataforma} · {com.area}
                  </p>
                  <p className="mb-4 flex-1 text-sm text-slate-600">
                    {com.porqueAcompanhar}
                  </p>

                  <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-violet-700" />
                      <p className="text-xs text-violet-800">
                        <strong>Para quem:</strong> {com.publicoIndicado}
                      </p>
                    </div>
                  </div>

                  <a
                    href={com.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border-2 border-slate-900 bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a]"
                  >
                    Participar <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              ))}
            </div>
          ) : modalidadeVazia ? (
            <div className="card-brutal rounded-2xl border-dashed bg-white p-10 text-center">
              <p className="text-3xl">📍</p>
              <p className="mx-auto mt-3 max-w-xl font-bold text-slate-700">
                {modalidade === "Presencial"
                  ? "Ainda não temos comunidades presenciais cadastradas, em breve por estado."
                  : "Ainda não temos comunidades híbridas cadastradas, em breve."}
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-slate-600 font-medium">
                Nenhuma comunidade encontrada com esses filtros.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-violet-700 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}

          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: "🤝",
                titulo: "Networking",
                desc: "Conecte-se com pessoas da área, faça amizades e encontre parceiros de estudo.",
              },
              {
                emoji: "🧠",
                titulo: "Aprendizado coletivo",
                desc: "Aprenda com as dúvidas e experiências de outras pessoas. Comunidades aceleram o aprendizado.",
              },
              {
                emoji: "💼",
                titulo: "Oportunidades",
                desc: "Muitas vagas são divulgadas primeiro em comunidades antes de aparecer em plataformas de emprego.",
              },
            ].map((item) => (
              <div
                key={item.titulo}
                className="card-brutal bg-violet-50 rounded-xl p-5 border-violet-200"
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <h3 className="font-display font-semibold text-slate-900 mb-2">
                  {item.titulo}
                </h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="mb-2 max-w-2xl">
              <p className="mb-3 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
                além do código
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Soft skills para se destacar
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                O que são, por que pesam em TI, como treinar de verdade e onde
                praticar. Para inglês a fundo, veja também o{" "}
                <Link
                  href="/ia"
                  className="font-bold text-violet-700 hover:underline"
                >
                  Guia de IA
                </Link>{" "}
                e o{" "}
                <Link
                  href="/ingles"
                  className="font-bold text-violet-700 hover:underline"
                >
                  Inglês para Tech
                </Link>
                .
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {softSkills.map((skill) => (
                <DetailsChevronOnly
                  key={skill.nome}
                  className="card-brutal rounded-2xl border-violet-200 bg-white p-5 shadow-[5px_5px_0_#c4b5fd]"
                  title={
                    <span>
                      <span className="font-display text-xl font-black text-slate-950">
                        {skill.nome}
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">
                        {skill.oQueE}
                      </span>
                    </span>
                  }
                >
                  <div className="mt-4 space-y-4">
                    <p className="rounded-xl bg-violet-50 p-3 text-sm text-slate-700">
                      <strong>Por que importa em TI:</strong>{" "}
                      {skill.porQueImportaEmTI}
                    </p>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                        Como desenvolver
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                        {skill.comoDesenvolver.map((acao) => (
                          <li key={acao} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            <span>{acao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                        Recursos para praticar
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {skill.recursos.map((recurso) => (
                          <a
                            key={recurso.nome}
                            href={recurso.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border-2 border-violet-200 bg-violet-50 p-3 transition-colors hover:border-violet-400"
                          >
                            <span className="inline-flex items-center gap-1 font-black text-violet-900">
                              {recurso.nome}
                              <ExternalLink className="h-3 w-3" aria-hidden />
                            </span>
                            <p className="mt-1 text-xs text-slate-600">
                              {recurso.oQueE}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </DetailsChevronOnly>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SobreNos />
    </Layout>
  );
}
