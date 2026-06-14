import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { Search, Quote, Sparkles } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { dictionaryTerms } from "@/lib/platformData";
import { getGlossaryTerm } from "@/lib/glossary";
import {
  dictionaryEnrichment,
  dictionaryLevelMeta,
  dictionaryLevelOrder,
  type DictionaryLevel,
} from "@/lib/dictionaryEnrichment";

const LEVEL_STYLE: Record<
  DictionaryLevel,
  { badge: string; section: string; shadow: string; button: string }
> = {
  Iniciante: {
    badge: "bg-emerald-200 text-emerald-900",
    section: "border-emerald-300 bg-emerald-100 text-emerald-900",
    shadow: "shadow-[4px_4px_0_#6ee7b7]",
    button: "border-slate-900 bg-emerald-300 shadow-[2px_2px_0_#0f172a]",
  },
  Basico: {
    badge: "bg-sky-200 text-sky-900",
    section: "border-sky-300 bg-sky-100 text-sky-900",
    shadow: "shadow-[4px_4px_0_#7dd3fc]",
    button: "border-slate-900 bg-sky-300 shadow-[2px_2px_0_#0f172a]",
  },
  Avancado: {
    badge: "bg-violet-200 text-violet-900",
    section: "border-violet-300 bg-violet-100 text-violet-900",
    shadow: "shadow-[4px_4px_0_#c4b5fd]",
    button: "border-slate-900 bg-violet-300 shadow-[2px_2px_0_#0f172a]",
  },
};

type EnrichedTerm = (typeof dictionaryTerms)[number] & {
  level: DictionaryLevel;
  example: string;
};

export default function Dicionario() {
  const search = useSearch();
  const termoParam = new URLSearchParams(search).get("termo");
  const initialQuery = termoParam
    ? (getGlossaryTerm(termoParam)?.term ?? "")
    : "";
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState("Todas");
  const [level, setLevel] = useState<DictionaryLevel | "Todos">("Todos");

  const tags = [
    "Todas",
    ...Array.from(new Set(dictionaryTerms.flatMap((item) => item.tags))),
  ];

  const enriched = useMemo<EnrichedTerm[]>(
    () =>
      dictionaryTerms.map((item) => {
        const enr = dictionaryEnrichment[item.term];
        return {
          ...item,
          level: enr?.level ?? "Basico",
          example: enr?.example ?? "",
        };
      }),
    [],
  );

  const matchesFilters = useMemo(
    () =>
      enriched.filter((item) => {
        const searchableText =
          `${item.term} ${item.category} ${item.tags.join(" ")} ${item.meaning} ${item.example}`.toLowerCase();
        const matchesSearch = searchableText.includes(query.toLowerCase());
        const matchesTag = tag === "Todas" || item.tags.includes(tag);
        return matchesSearch && matchesTag;
      }),
    [enriched, query, tag],
  );

  const levelCounts = useMemo(() => {
    const counts: Record<DictionaryLevel, number> = {
      Iniciante: 0,
      Basico: 0,
      Avancado: 0,
    };
    for (const item of matchesFilters) counts[item.level] += 1;
    return counts;
  }, [matchesFilters]);

  const visibleLevels =
    level === "Todos" ? dictionaryLevelOrder : [level];
  const totalVisible =
    level === "Todos" ? matchesFilters.length : levelCounts[level];

  return (
    <Layout>
      <SEO
        title="Dicionário Tech — Termos e conceitos de tecnologia explicados"
        description="Glossário de tecnologia por nível (iniciante, básico e avançado), com termos de programação e carreira explicados com exemplos reais de uso."
        keywords={[
          "dicionário tecnologia",
          "termos de programação",
          "glossário ti",
          "conceitos de tech",
        ]}
        url="/dicionario"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-cyan-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#0891b2_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            dicionário técnico
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Termos de TI explicados sem enrolação.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Separados por nível e com exemplo real de uso, do jeito que aparecem
            em cursos, vagas, roadmaps e conversas de tecnologia.
          </p>
        </div>
      </section>

      <section className="relative z-40 border-b-2 border-cyan-200 bg-cyan-50 py-4 md:sticky md:top-16">
        <div className="container">
          <div className="flex flex-col gap-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar API, deploy, Git..."
                className="w-full rounded-2xl border-2 border-slate-900 bg-white py-3 pl-11 pr-4 text-sm shadow-[4px_4px_0_#0f172a] outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar por nível"
            >
              <button
                onClick={() => setLevel("Todos")}
                aria-pressed={level === "Todos"}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black ${
                  level === "Todos"
                    ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Todos os níveis ({matchesFilters.length})
              </button>
              {dictionaryLevelOrder.map((lvl) => {
                const meta = dictionaryLevelMeta[lvl];
                const active = level === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-black ${
                      active
                        ? `${LEVEL_STYLE[lvl].button} text-slate-950`
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label} ({levelCounts[lvl]})
                  </button>
                );
              })}
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar por tag"
            >
              {tags.map((item) => (
                <button
                  key={item}
                  onClick={() => setTag(item)}
                  aria-pressed={tag === item}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${
                    tag === item
                      ? "border-slate-900 bg-cyan-300 shadow-[2px_2px_0_#0f172a]"
                      : "border-cyan-200 bg-white hover:bg-cyan-100"
                  }`}
                >
                  {item === "Todas" ? "Todas as tags" : item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#ecfeff] py-12">
        <div className="container">
          <p className="mb-6 text-sm text-slate-500">
            {totalVisible} termo{totalVisible !== 1 ? "s" : ""} encontrado
            {totalVisible !== 1 ? "s" : ""}
          </p>

          {visibleLevels.map((lvl) => {
            const items = matchesFilters.filter((item) => item.level === lvl);
            if (items.length === 0) return null;
            const meta = dictionaryLevelMeta[lvl];
            const style = LEVEL_STYLE[lvl];
            return (
              <div key={lvl} className="mb-12">
                <div
                  className={`mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 px-4 py-3 ${style.section}`}
                >
                  <span className="text-2xl" aria-hidden>
                    {meta.emoji}
                  </span>
                  <h2 className="font-display text-2xl font-black">
                    {meta.label}
                  </h2>
                  <span className="text-sm font-bold opacity-80">
                    {meta.blurb}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, index) => (
                    <AnimatedContent
                      key={item.term}
                      distance={14}
                      duration={0.4}
                      delay={Math.min(index * 0.03, 0.3)}
                      className="h-full"
                    >
                      <div
                        className={`group flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 transition-all duration-200 ease-out ${style.shadow} motion-safe:hover:-translate-y-1`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-slate-900">
                              {item.category}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide ${style.badge}`}
                            >
                              <span aria-hidden>{meta.emoji}</span>
                              {meta.label}
                            </span>
                          </div>
                          <FavoriteButton
                            compact
                            item={{
                              id: item.term.toLowerCase().replace(/\s+/g, "-"),
                              type: "conceito",
                              title: item.term,
                              subtitle: item.category,
                            }}
                          />
                        </div>
                        <h3 className="font-display mt-4 text-2xl font-black text-slate-950">
                          {item.term}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {item.meaning}
                        </p>
                        {item.example ? (
                          <div className="mt-4 flex gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
                            <Quote
                              className="h-4 w-4 shrink-0 text-slate-400"
                              aria-hidden
                            />
                            <p className="text-sm italic text-slate-700">
                              {item.example}
                            </p>
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-1">
                          {item.tags.map((itemTag) => (
                            <span
                              key={itemTag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                            >
                              {itemTag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </AnimatedContent>
                  ))}
                </div>
              </div>
            );
          })}

          {totalVisible === 0 && (
            <div className="py-16 text-center">
              <p className="text-3xl">🔎</p>
              <p className="mt-3 font-bold text-slate-700">
                Nenhum termo encontrado.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setTag("Todas");
                  setLevel("Todos");
                }}
                className="mt-3 text-sm font-bold text-slate-950 hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
