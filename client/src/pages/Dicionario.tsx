import { useState } from "react";
import { Search } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { dictionaryTerms } from "@/lib/platformData";

export default function Dicionario() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("Todas");
  const tags = ["Todas", ...Array.from(new Set(dictionaryTerms.flatMap((item) => item.tags)))];

  const filtered = dictionaryTerms.filter((item) => {
    const searchableText = `${item.term} ${item.category} ${item.tags.join(" ")} ${item.meaning}`.toLowerCase();
    const matchesSearch = searchableText.includes(query.toLowerCase());
    const matchesTag = tag === "Todas" || item.tags.includes(tag);
    return matchesSearch && matchesTag;
  });

  return (
    <Layout>
      <SEO
        title="Dicionário Tech — Termos e conceitos de tecnologia explicados"
        description="Glossário de tecnologia com termos de programação, carreira em TI e conceitos técnicos explicados em linguagem simples."
        keywords={["dicionário tecnologia", "termos de programação", "glossário ti", "conceitos de tech"]}
        url="/dicionario"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-cyan-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#0891b2_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">dicionário técnico</p>
          <h1 className="font-display text-4xl font-black text-slate-950">Termos de TI explicados sem enrolação.</h1>
          <p className="mt-3 max-w-2xl text-slate-950">Busque palavras que aparecem em cursos, vagas, roadmaps e conversas de tecnologia.</p>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b-2 border-cyan-200 bg-cyan-50 py-4">
        <div className="container">
          <div className="flex flex-col gap-4">
            <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar API, deploy, Git..."
              className="w-full rounded-2xl border-2 border-slate-900 bg-white py-3 pl-11 pr-4 text-sm shadow-[4px_4px_0_#0f172a] outline-none"
            />
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((item) => (
                <button
                  key={item}
                  onClick={() => setTag(item)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${
                    tag === item ? "border-slate-900 bg-cyan-300 shadow-[2px_2px_0_#0f172a]" : "border-cyan-200 bg-white hover:bg-cyan-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#ecfeff] py-12">
        <div className="container">
          <p className="mb-6 text-sm text-slate-500">
            {filtered.length} termo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div key={item.term} className="card-invite rounded-2xl bg-white p-5 shadow-[4px_4px_0_#67e8f9]">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-slate-900">{item.category}</span>
                  <FavoriteButton
                    compact
                    item={{ id: item.term.toLowerCase().replace(/\s+/g, "-"), type: "conceito", title: item.term, subtitle: item.category }}
                  />
                </div>
                <h2 className="font-display mt-4 text-2xl font-black text-slate-950">{item.term}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.meaning}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {item.tags.map((itemTag) => (
                    <span key={itemTag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {itemTag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-3xl">🔎</p>
              <p className="mt-3 font-bold text-slate-700">Nenhum termo encontrado.</p>
              <button onClick={() => { setQuery(""); setTag("Todas"); }} className="mt-3 text-sm font-bold text-violet-700 hover:underline">
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
