/*
  BORA NA TECH? — Faculdades Page
  Style: Neo-Brutalism Suavizado
*/

import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, ChevronDown, X, Star, MapPin } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { faculdades } from "@/lib/data";
import { CursoVoiceNote } from "@/components/faculdades/CursoVoiceNote";
import { brazilianStates, collegeSuggestions } from "@/lib/platformData";

const tipos = ["Todos", "Tecnólogo", "Bacharelado"];
const matNiveis = ["Todos", "Médio", "Alto", "Médio-Alto"];

const matematicaColor: Record<string, string> = {
  "Médio": "bg-sky-100 text-sky-800",
  "Alto": "bg-red-100 text-red-700",
  "Médio-Alto": "bg-orange-100 text-orange-700",
};

const progColor: Record<string, string> = {
  "Médio": "bg-sky-100 text-sky-800",
  "Alto": "bg-blue-100 text-blue-700",
  "Médio-Alto": "bg-blue-100 text-blue-700",
};

function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Faculdades() {
  const [tipo, setTipo] = useState("Todos");
  const [mat, setMat] = useState("Todos");
  const [selectedUf, setSelectedUf] = useState("");

  const filtered = faculdades.cursos.filter((c) => {
    const matchTipo = tipo === "Todos" || c.tipo === tipo;
    const matchMat = mat === "Todos" || c.matematica === mat;
    return matchTipo && matchMat;
  });

  const nearby = collegeSuggestions.filter((item) => {
    if (!selectedUf) return true;
    if (item.nacional) return true;
    return item.uf === selectedUf;
  });

  return (
    <Layout>
      <SEO
        title="Faculdades de TI — Cursos superiores em tecnologia no Brasil"
        description="Conheça cursos superiores em tecnologia no Brasil, diferenças entre formações e caminhos para iniciar uma carreira em TI."
        keywords={["faculdade de ti", "graduação tecnologia", "engenharia de software", "ciência da computação", "análise de sistemas"]}
        url="/faculdades"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-violet-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">faculdade sem confusão</p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Cursos Superiores de TI</h1>
            <p className="text-slate-950 text-lg">
              Compare os principais cursos de graduação em tecnologia e descubra qual faz mais sentido para você.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-violet-50 border-b-2 border-violet-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {tipos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    tipo === t
                      ? "bg-violet-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-violet-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <select value={mat} onChange={(e) => setMat(e.target.value)} className="px-3 py-2 border-2 border-violet-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 bg-white">
              {matNiveis.map((m) => <option key={m}>{m === "Todos" ? "Nível de Matemática" : `Matemática: ${m}`}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-violet-50 py-12">
        <div className="container">
          <div className="card-brutal mb-8 rounded-2xl bg-white p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">Encontre faculdades perto de você</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Escolha o estado onde você está para ver sugestões iniciais com vantagens e nota MEC aproximada. Ofertas nacionais (EAD) aparecem em qualquer UF.
                </p>
                <label htmlFor="faculdades-estado" className="mt-4 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Estado
                </label>
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <select
                    id="faculdades-estado"
                    value={selectedUf}
                    onChange={(event) => setSelectedUf(event.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border-2 border-slate-900 bg-white py-3 pl-10 pr-10 text-sm font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] focus:outline-none focus:ring-4 focus:ring-violet-200"
                  >
                    <option value="">Todos os estados</option>
                    {brazilianStates.map(({ uf, name }) => (
                      <option key={uf} value={uf}>
                        {name} ({uf})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {nearby.map((item) => (
                  <div key={`${item.city}-${item.name}`} className="rounded-xl border-2 border-violet-100 bg-violet-50/80 p-4">
                    <p className="text-xs font-bold uppercase text-violet-700">
                      {item.nacional ? `${item.city} · nacional (EAD)` : `${item.city} · ${item.uf}`}
                    </p>
                    <h3 className="font-display font-black text-slate-950">{item.name}</h3>
                    <p className="text-sm font-bold text-slate-700">Nota MEC: {item.mec}</p>
                    <p className="mt-2 text-xs text-slate-600">{item.advantages.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((curso, i) => (
              <div key={i} className="card-brutal relative flex flex-col rounded-xl bg-white p-6 transition-colors hover:bg-violet-50/60">
                <Link
                  href={`/faculdades/${slugifyCourse(curso.nome)}`}
                  className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                  aria-label={`Ver detalhes de ${curso.nome}`}
                />
                <div className="mb-3 flex items-start justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      curso.tipo === "Tecnólogo" ? "bg-violet-100 text-violet-800 border-violet-200" : "bg-violet-200 text-violet-900 border-violet-400"
                    }`}
                  >
                    {curso.tipo} · {curso.duracao}
                  </span>
                  <div className="relative z-20">
                    <FavoriteButton compact item={{ id: slugifyCourse(curso.nome), type: "faculdade", title: curso.nome, subtitle: curso.tipo }} />
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{curso.nome}</h3>
                <p className="text-sm text-slate-600 mb-4">{curso.oQueEstuda}</p>

                <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/90 p-3">
                  <p className="text-xs text-slate-700"><strong className="text-slate-900">Para quem é:</strong> {curso.perfilIndicado}</p>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${matematicaColor[curso.matematica] || "bg-slate-100 text-slate-600"}`}>
                    Matemática: {curso.matematica}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${progColor[curso.programacao] || "bg-slate-100 text-slate-600"}`}>
                    Programação: {curso.programacao}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Áreas de atuação</p>
                  <div className="flex flex-wrap gap-1">
                    {curso.areasAtuacao.map((a) => (
                      <span key={a} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1.5">Pontos positivos</p>
                    <ul className="space-y-1">
                      {curso.pontoPositivos.map((p) => (
                        <li key={p} className="flex items-start gap-1 text-xs text-slate-600">
                          <Check className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1.5">Pontos de atenção</p>
                    <ul className="space-y-1">
                      {curso.pontosAtencao.map((p) => (
                        <li key={p} className="flex items-start gap-1 text-xs text-slate-600">
                          <X className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 mt-auto">
                  <p className="text-xs text-slate-600"><strong>Diferença dos outros cursos:</strong> {curso.diferencas}</p>
                </div>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-violet-700">
                  Ver carreira, salários e conteúdos <ArrowRight className="h-4 w-4" />
                </span>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Uma voz sobre o curso</p>
                  <CursoVoiceNote depoimento={curso.depoimento} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🎓</p>
              <p className="text-slate-600 font-medium">Nenhum curso encontrado.</p>
              <button onClick={() => { setTipo("Todos"); setMat("Todos"); }} className="mt-4 text-violet-700 text-sm font-medium hover:underline">Limpar filtros</button>
            </div>
          )}

          {/* Dica importante */}
          <div className="mt-10 p-5 bg-violet-50 border-2 border-violet-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-slate-900 mb-2">Faculdade é obrigatória?</h3>
                <p className="text-sm text-slate-600">
                  Não! A faculdade não é obrigatória para entrar em TI, mas pode abrir portas em algumas empresas. Se quiser entrar rápido no mercado, cursos técnicos e bootcamps podem ser mais eficientes. Se quiser uma base sólida e crescimento de longo prazo, considere a graduação.
                </p>
              </div>
            </div>
          </div>

          {/* Onde buscar */}
          <div className="mt-6 p-5 bg-slate-50 border-2 border-slate-200 rounded-xl">
            <h3 className="font-display font-semibold text-slate-900 mb-3">Onde buscar faculdades gratuitas e com bolsa</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { nome: "ProUni", desc: "Bolsas em faculdades privadas via ENEM", link: "https://prouni.mec.gov.br" },
                { nome: "FIES", desc: "Financiamento estudantil para faculdades privadas", link: "https://fies.mec.gov.br" },
                { nome: "SISU", desc: "Acesso a universidades federais via ENEM", link: "https://sisu.mec.gov.br" },
                { nome: "EAD Gratuito", desc: "UAB — Universidade Aberta do Brasil", link: "https://uab.capes.gov.br" },
              ].map((item) => (
                <a key={item.nome} href={item.link} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white border-2 border-slate-200 rounded-lg hover:border-violet-400 transition-colors">
                  <p className="font-semibold text-sm text-slate-900 mb-1">{item.nome}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
