import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Newspaper } from "lucide-react";
import { getNews, type NewsItem } from "@/services/contentApi";

// Card na home com a noticia MAIS RECENTE, lendo a mesma fonte real da pagina de
// Noticias (getNews do contentApi, sem arrastar os data files estaticos pro
// boot). Nao inventa noticia: se a fonte estiver vazia ou falhando, mostra um
// estado vazio elegante.
export default function UltimaNoticia() {
  const [item, setItem] = useState<NewsItem | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    getNews({ limit: 1 })
      .then((res) => {
        if (ativo) setItem(res?.items[0] ?? null);
      })
      .catch(() => {
        if (ativo) setItem(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="bg-[#faf8f4] py-16 sm:py-20">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-violet-800">
            <Newspaper className="h-4 w-4" aria-hidden />
            Última notícia
          </span>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {carregando ? (
          <div
            className="h-40 rounded-2xl border-2 border-slate-200 bg-white motion-safe:animate-pulse"
            aria-busy="true"
            aria-label="Carregando notícia"
          />
        ) : item ? (
          <article className="rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#c4b5fd] sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-black uppercase text-slate-600">
                {item.categoria}
              </span>
              {item.data ? <span>{item.data}</span> : null}
              <span>· {item.fonte}</span>
            </div>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
            >
              <h3 className="font-display text-xl font-black leading-snug text-slate-950 group-hover:underline sm:text-2xl">
                {item.titulo}
              </h3>
            </a>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {item.resumo}
            </p>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
            >
              Ler a notícia
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </article>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-display text-lg font-black text-slate-950">
              Sem novidades por enquanto
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Assim que sair notícia nova, ela aparece aqui.
            </p>
            <Link
              href="/noticias"
              className="mt-4 inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
            >
              Ir para as notícias
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
