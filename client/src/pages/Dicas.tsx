import { useState } from "react";
import { ExternalLink, Lightbulb, PlayCircle, Sparkles } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { tipCategories, tipsArticles } from "@/lib/platformData";

export default function Dicas() {
  const [category, setCategory] = useState("Todas");
  const articles =
    category === "Todas"
      ? tipsArticles
      : tipsArticles.filter((tip) => tip.category === category);

  return (
    <Layout>
      <SEO
        title="Dicas de Carreira em TI — Conselhos práticos para sua jornada"
        description="Dicas práticas para estudar tecnologia, evoluir em programação, montar portfólio e se preparar para oportunidades em TI."
        keywords={[
          "dicas carreira ti",
          "como evoluir em ti",
          "dicas programação iniciantes",
          "conselhos tech",
        ]}
        url="/dicas"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-amber-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Lightbulb className="h-3.5 w-3.5" />
            aba de dicas
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Dicas para sair do “não sei por onde começar”.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Artigos curados, créditos de autoria e vídeos para transformar
            dúvida em próximo clique.
          </p>
          <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              "Clareza para decidir",
              "Ideias para praticar",
              "Próximo passo visível",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_#f59e0b]"
              >
                <Sparkles className="mb-1 h-4 w-4 text-amber-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b-2 border-amber-200 bg-amber-50 py-4">
        <div className="container flex flex-wrap gap-2">
          {["Todas", ...tipCategories].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${
                category === item
                  ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                  : "border-amber-200 bg-white hover:bg-amber-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-[#fff9e7] py-12">
        <div className="container grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="card-invite flex flex-col rounded-2xl border-amber-200 bg-white p-6 shadow-[5px_5px_0_#fbbf24]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-slate-900">
                  <Lightbulb className="h-3 w-3" />
                  {article.category}
                </span>
                <FavoriteButton
                  compact
                  item={{
                    id: article.id,
                    type: "dica",
                    title: article.title,
                    subtitle: article.category,
                    url: article.url,
                  }}
                />
              </div>
              <h2 className="font-display text-xl font-black text-slate-950">
                {article.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                {article.summary}
              </p>
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-slate-600">
                Crédito: <strong>{article.author}</strong> · {article.credit}
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-700"
              >
                <PlayCircle className="h-4 w-4" />
                {article.youtube}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
