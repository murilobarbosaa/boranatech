/*
  BORA NA TECH? — Comunidades Page
  Style: Neo-Brutalism Suavizado
*/

import { useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Users } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import { comunidades } from "@/lib/data";
import { softSkills } from "@/lib/softSkillsData";

const areas = ["Todas", ...Array.from(new Set(comunidades.map((c) => c.area)))];
const idiomas = ["Todos", "Português", "Inglês"];

const tipoColor: Record<string, string> = {
  Comunidade: "bg-violet-100 text-violet-700",
  "Blog / Comunidade": "bg-blue-100 text-blue-700",
  "Comunidade / Escola": "bg-amber-100 text-amber-700",
  "Blog / Newsletter": "bg-amber-100 text-amber-700",
  "Comunidade / Blog": "bg-pink-100 text-pink-700",
};

export default function Comunidades() {
  const [area, setArea] = useState("Todas");
  const [idioma, setIdioma] = useState("Todos");

  const filtered = comunidades.filter((c) => {
    const matchArea = area === "Todas" || c.area === area;
    const matchIdioma = idioma === "Todos" || c.idioma === idioma;
    return matchArea && matchIdioma;
  });

  return (
    <Layout>
      <SEO
        title="Comunidades Tech — Grupos e redes para networking em TI"
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
              Comunidades Tech
            </h1>
            <p className="text-slate-950 text-lg">
              Conecte-se com outras pessoas da área, participe de grupos de
              estudo e encontre mentores.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-violet-50 border-b-2 border-violet-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap gap-3">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label="Filtrar por área"
              className="px-3 py-2 border-2 border-violet-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 bg-white"
            >
              {areas.map((a) => (
                <option key={a}>{a === "Todas" ? "Todas as áreas" : a}</option>
              ))}
            </select>
            <div
              className="flex gap-2"
              role="group"
              aria-label="Filtrar por idioma"
            >
              {idiomas.map((id) => (
                <button
                  key={id}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((com) => (
              <div
                key={com.id}
                className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#c4b5fd]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor[com.tipo] || "bg-slate-100 text-slate-600"}`}
                  >
                    {com.tipo}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${com.idioma === "Português" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
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

                <h3 className="font-display font-bold text-xl text-slate-900 mb-1">
                  {com.nome}
                </h3>
                <p className="text-xs text-violet-700 font-medium mb-3">
                  {com.plataforma} · {com.area}
                </p>
                <p className="text-sm text-slate-600 mb-4 flex-1">
                  {com.porqueAcompanhar}
                </p>

                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-700 shrink-0" />
                    <p className="text-xs text-violet-800">
                      <strong>Para quem:</strong> {com.publicoIndicado}
                    </p>
                  </div>
                </div>

                <a
                  href={com.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-700 text-white font-semibold rounded-lg text-sm border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  Participar <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-slate-600 font-medium">
                Nenhuma comunidade encontrada.
              </p>
              <button
                onClick={() => {
                  setArea("Todas");
                  setIdioma("Todos");
                }}
                className="mt-4 text-violet-700 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Por que participar */}
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
    </Layout>
  );
}
