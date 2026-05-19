/*
  BORA NA TECH? — Notícias Tech Page
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Search, TrendingUp } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import NewsImagePlaceholder from "@/components/NewsImagePlaceholder";
import SEO from "@/components/SEO";
import { getNews, type NewsItem, type NewsLevel, type NewsResponse } from "@/services/contentService";

const PAGE_SIZE = 21;

const LEVEL_OPTIONS: Array<{ value: NewsLevel | ""; label: string }> = [
  { value: "", label: "Todos os níveis" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const LEVEL_BADGE: Record<NewsLevel, string> = {
  iniciante: "bg-violet-100 text-violet-800 border-violet-300",
  intermediario: "bg-blue-100 text-blue-700 border-blue-300",
  avancado: "bg-blue-900 text-blue-50 border-blue-950",
};

const LEVEL_LABEL: Record<NewsLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="card-brutal bg-white rounded-xl p-6 flex flex-col shadow-[5px_5px_0_#7dd3fc]">
      <div className="mb-4 -mt-2 -mx-2 overflow-hidden rounded-lg border-2 border-slate-100">
        {item.imagem ? (
          <img src={item.imagem} alt="" className="w-full h-40 object-cover" loading="lazy" />
        ) : (
          <NewsImagePlaceholder keyword={item.sourceKeyword} />
        )}
      </div>

      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.categoria}</span>
        <div className="flex items-center gap-2">
          {item.nivel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${LEVEL_BADGE[item.nivel]}`}>
              {LEVEL_LABEL[item.nivel]}
            </span>
          )}
          <FavoriteButton
            compact
            item={{ id: item.id, type: "noticia", title: item.titulo, subtitle: item.categoria, url: item.link }}
          />
        </div>
      </div>

      <h3 className="font-display font-bold text-lg text-slate-900 mb-2 leading-snug">{item.titulo}</h3>
      <p className="text-sm text-slate-600 mb-4 flex-1">{item.resumo}</p>

      {item.porQueImporta && (
        <div className="bg-violet-50 border-l-4 border-violet-500 rounded-r-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-violet-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-700 mb-1">
                Por que isso importa pra você?
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">{item.porQueImporta}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs font-medium text-slate-700">{item.fonte}</p>
          <p className="text-xs text-slate-400">{item.data}</p>
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-700 text-white text-xs font-semibold rounded-lg border-2 border-slate-950 shadow-[2px_2px_0_#0f172a] hover:shadow-[3px_3px_0_#0f172a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
        >
          Ler <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="card-brutal bg-white rounded-xl p-6 shadow-[5px_5px_0_#bae6fd] animate-pulse">
      <div className="h-40 bg-slate-100 rounded-lg mb-4" />
      <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-5 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-3 bg-slate-100 rounded mb-1.5" />
      <div className="h-3 bg-slate-100 rounded w-5/6 mb-4" />
      <div className="h-16 bg-violet-50 rounded mb-4" />
      <div className="h-8 bg-slate-100 rounded" />
    </div>
  );
}

function getPageNumbers(current: number, total: number): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const numbers = getPageNumbers(page, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap" aria-label="Paginação">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-[2px_2px_0_#0f172a] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Anterior
      </button>
      {numbers.map((n, idx) =>
        n === "..." ? (
          <span key={`gap-${idx}`} className="px-1 text-slate-400 text-xs">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`min-w-[36px] rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all ${
              n === page
                ? "bg-sky-700 text-white border-slate-950 shadow-[2px_2px_0_#0f172a]"
                : "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
            }`}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-[2px_2px_0_#0f172a] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
      >
        Próxima <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  );
}

export default function Noticias() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<NewsLevel | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [response, setResponse] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstFetchRef = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (firstFetchRef.current) {
      firstFetchRef.current = false;
    } else {
      setPage(1);
    }
  }, [level, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNews({
      page,
      limit: PAGE_SIZE,
      level: level || undefined,
      q: debouncedSearch || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setError("Não foi possível carregar notícias agora. Tente novamente em alguns instantes.");
          setResponse(null);
        } else {
          setError("");
          setResponse(res);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, level, debouncedSearch]);

  const items = response?.items ?? [];
  const pagination = response?.pagination;
  const totalLabel = useMemo(() => {
    if (!pagination) return "";
    const { total } = pagination;
    if (total === 0) return "Nenhum resultado";
    if (total === 1) return "1 notícia";
    return `${total} notícias`;
  }, [pagination]);

  return (
    <Layout>
      <SEO
        title="Notícias Tech — Últimas novidades do mundo da tecnologia"
        description="Acompanhe notícias de tecnologia, inteligência artificial, mercado de TI e tendências importantes para quem está começando."
        keywords={["notícias tecnologia", "novidades tech", "ia notícias", "mercado de ti", "tendências tecnologia"]}
        url="/noticias"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-sky-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#0284c7_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-sky-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              radar tech
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Notícias Tech</h1>
            <p className="text-slate-950 text-lg">
              Fique por dentro do que está acontecendo na tecnologia — com foco no que importa para quem está começando.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sky-50 border-b-2 border-sky-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar notícia..."
                className="w-full rounded-lg border-2 border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    level === opt.value
                      ? "bg-sky-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-sky-200 hover:border-sky-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {pagination && !loading && (
              <span className="text-xs font-semibold text-slate-500 md:ml-auto">{totalLabel}</span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#f0f9ff] py-12">
        <div className="container">
          {error && (
            <div className="mb-5 rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📰</p>
              <p className="text-slate-600 font-medium">Nenhuma notícia encontrada com esses filtros.</p>
              <button
                type="button"
                onClick={() => {
                  setLevel("");
                  setSearchInput("");
                }}
                className="mt-4 text-slate-700 text-sm font-semibold hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
              {pagination && (
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
              )}
            </>
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
                <a
                  key={item.nome}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-400 transition-colors"
                >
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
