/*
  BORA NA TECH? — Notícias Tech Page
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, TrendingUp } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import { getNews } from "@/services/contentService";
import { noticias as fallbackNoticias } from "@/lib/data";

const impactoColor: Record<string, string> = {
  "Alto para iniciantes": "bg-red-100 text-red-700",
  "Médio para iniciantes": "bg-violet-100 text-violet-700",
  "Baixo para iniciantes": "bg-slate-100 text-slate-600",
};

export default function Noticias() {
  const [categoria, setCategoria] = useState("Todas");
  const [news, setNews] = useState(fallbackNoticias);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getNews({ limit: 20 })
      .then((items) => {
        setNews(items.length > 0 ? items : fallbackNoticias);
        setError("");
      })
      .catch(() => {
        setNews(fallbackNoticias);
        setError("Não foi possível carregar notícias externas agora. Mostrando curadoria local.");
      })
      .finally(() => setLoading(false));
  }, []);

  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(news.map((n) => n.categoria)))], [news]);
  const filtered = news.filter((n) => categoria === "Todas" || n.categoria === categoria);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-sky-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#0284c7_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-sky-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">radar tech</p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Notícias Tech</h1>
            <p className="text-slate-950 text-lg">
              Fique por dentro do que está acontecendo na tecnologia — com foco no que importa para quem está começando.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sky-50 border-b-2 border-sky-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                  categoria === c
                    ? "bg-sky-600 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                    : "bg-white text-slate-700 border-sky-200 hover:border-sky-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f0f9ff] py-12">
        <div className="container">
          {(loading || error) && (
            <div className="mb-5 rounded-xl border-2 border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              {loading ? "Carregando notícias..." : error}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((noticia) => (
              <div key={noticia.id} className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#7dd3fc]">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{noticia.categoria}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${impactoColor[noticia.impacto] || "bg-slate-100 text-slate-600"}`}>
                      {noticia.impacto}
                    </span>
                    <FavoriteButton compact item={{ id: noticia.id, type: "noticia", title: noticia.titulo, subtitle: noticia.categoria, url: noticia.link }} />
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-slate-900 mb-2 leading-snug">{noticia.titulo}</h3>
                <p className="text-sm text-slate-600 mb-4 flex-1">{noticia.resumo}</p>

                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-violet-800"><strong>Por que isso importa para você:</strong> {noticia.porQueImporta}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{noticia.fonte}</p>
                    <p className="text-xs text-slate-400">{noticia.data}</p>
                  </div>
                  <a
                    href={noticia.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    Ler <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📰</p>
              <p className="text-slate-600 font-medium">Nenhuma notícia encontrada.</p>
              <button onClick={() => setCategoria("Todas")} className="mt-4 text-slate-700 text-sm font-medium hover:underline">Ver todas</button>
            </div>
          )}

          <div className="mt-10 p-5 bg-slate-50 border-2 border-slate-200 rounded-xl">
            <h3 className="font-display font-semibold text-slate-900 mb-2">Onde acompanhar notícias de tecnologia</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {[
                { nome: "TechCrunch", link: "https://techcrunch.com", desc: "Startups e inovação" },
                { nome: "MIT Tech Review", link: "https://technologyreview.com", desc: "Ciência e tecnologia" },
                { nome: "Dev.to", link: "https://dev.to", desc: "Comunidade de devs" },
                { nome: "InfoQ Brasil", link: "https://www.infoq.com/br/", desc: "Desenvolvimento de software" },
              ].map((item) => (
                <a key={item.nome} href={item.link} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-400 transition-colors">
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
