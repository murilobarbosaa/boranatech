import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  BookOpen,
  Cloud,
  Cpu,
  ExternalLink,
  Film,
  Laptop,
  Lightbulb,
  Search,
  Shuffle,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import Layout from "@/components/Layout";
import LivrosRecomendados from "@/components/shared/LivrosRecomendados";
import SEO from "@/components/SEO";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { areasTI, livrosFundamentos, livrosPorArea } from "@/lib/data";
import {
  bibliotecaFilmes,
  bibliotecaLivros,
  bibliotecaPodcasts,
  bibliotecaReferencia,
  bibliotecaSeries,
  bibliotecaVideos,
  carreiraArtigos,
  dicas,
  dicasCategorias,
  type Dica,
  type DicaArtigo,
  type Filme,
} from "@/lib/dicasData";
import { generatedPosters } from "@/lib/dicasPosters.generated";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { getFaviconUrl, hideBrokenImage } from "@/lib/utils";
import {
  notebookByGoal,
  notebookBuyingTips,
  notebookExtras,
  notebookFraming,
  notebookModels,
  notebookModelsAviso,
  notebookParts,
  notebookTiers,
} from "@/lib/notebookGuideData";

const ac = getPageAccentUi("amber");

const areasComLivros = areasTI.filter(
  (area) => (livrosPorArea[area.slug]?.length ?? 0) > 0,
);

const areaFiltros = [
  { key: "todas", label: "Todas" },
  { key: "fundamentos", label: "Fundamentos" },
  ...areasComLivros.map((area) => ({ key: area.slug, label: area.nome })),
];

export default function Dicas() {
  const [tab, setTab] = useState<"aprender" | "livros" | "notebooks">(
    "aprender",
  );
  const [areaFiltro, setAreaFiltro] = useState("todas");

  const mostrarFundamentos =
    areaFiltro === "todas" || areaFiltro === "fundamentos";
  const areasVisiveis =
    areaFiltro === "fundamentos"
      ? []
      : areaFiltro === "todas"
        ? areasComLivros
        : areasComLivros.filter((area) => area.slug === areaFiltro);

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
            dicas e livros
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Dicas para sair do “não sei por onde começar”.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Conselhos práticos por tema para estágio, currículo, entrevistas,
            portfólio e mais, com um catálogo de livros por área e um guia de
            notebook.
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

      <Marquee />

      <DicasDestaque />

      <section className="sticky top-16 z-40 border-b-2 border-amber-200 bg-amber-50 py-4">
        <div className="container flex flex-wrap gap-2">
          {(
            [
              { key: "aprender", label: "Aprender e se inspirar" },
              { key: "livros", label: "Livros por área" },
              { key: "notebooks", label: "Notebooks" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full border-2 px-4 py-1.5 text-xs font-black uppercase ${
                tab === item.key
                  ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                  : "border-amber-200 bg-white hover:bg-amber-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "aprender" && <AprenderSection />}

      {tab === "livros" && (
        <section className="bg-[#fff9e7] py-12">
          <div className="container">
            <div className="mb-8 flex flex-wrap gap-2">
              {areaFiltros.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAreaFiltro(item.key)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold ${
                    areaFiltro === item.key
                      ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                      : "border-amber-200 bg-white hover:bg-amber-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="space-y-8">
              {mostrarFundamentos ? (
                <LivrosRecomendados
                  titulo="Fundamentos"
                  livros={livrosFundamentos}
                  ac={ac}
                />
              ) : null}
              {areasVisiveis.map((area) => (
                <LivrosRecomendados
                  key={area.slug}
                  titulo={area.nome}
                  livros={livrosPorArea[area.slug]}
                  ac={ac}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "notebooks" && (
        <section className="bg-[#fff9e7] py-12">
          <div className="container space-y-10">
            <div className="card-brutal rounded-2xl border-amber-200 bg-amber-100 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Você não precisa de máquina cara para começar
                </h2>
              </div>
              <ul className="space-y-2 text-sm font-bold text-slate-800">
                {notebookFraming.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <Cpu className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Como funciona, o que importa
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {notebookParts.map((part) => (
                  <div
                    key={part.peca}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {part.peca}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {part.oQueFaz}
                    </p>
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      {part.quantoBasta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5">
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  pelo seu objetivo
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Quanto de cada coisa por tipo de uso
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {notebookByGoal.map((item) => (
                  <div
                    key={item.objetivo}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {item.objetivo}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        RAM: {item.ram}
                      </span>
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        SSD: {item.ssd}
                      </span>
                      <span className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
                        GPU: {item.gpu}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5">
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  faixas de máquina
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Quando comprar cada tipo
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {notebookTiers.map((tier) => (
                  <div
                    key={tier.faixa}
                    className="card-brutal flex flex-col rounded-2xl bg-white p-5"
                  >
                    <span className="inline-flex w-fit rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                      {tier.faixa}
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-800">
                      {tier.entrega}
                    </p>
                    <p className="mt-2 flex-1 text-sm text-slate-600">
                      {tier.praQuem}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {notebookExtras.map((extra) => (
                  <div
                    key={extra.titulo}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-amber-700" />
                      <h3 className="font-display text-lg font-black text-slate-950">
                        {extra.titulo}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600">{extra.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <Laptop className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Modelos para começar a olhar
                </h2>
              </div>
              <p className="mb-5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                {notebookModelsAviso}
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {notebookModels.map((model) => (
                  <div
                    key={model.faixa}
                    className="card-brutal rounded-2xl bg-white p-5"
                  >
                    <span className="inline-flex w-fit rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                      {model.faixa}
                    </span>
                    <p className="mt-3 text-sm text-slate-600">
                      {model.paraQuem}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {model.linhas.map((linha) => (
                        <span
                          key={linha}
                          className="rounded-full border-2 border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800"
                        >
                          {linha}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                      O que procurar: {model.oQueProcurar}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5 flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-amber-700" />
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Dicas de compra
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notebookBuyingTips.map((tip) => (
                  <div
                    key={tip.titulo}
                    className="card-invite rounded-2xl border-amber-200 bg-white p-5 shadow-[5px_5px_0_#fbbf24]"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {tip.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}

function LinkExterno({
  title,
  url,
  desc,
  carreira,
}: {
  title: string;
  url: string;
  desc?: string;
  carreira?: boolean;
}) {
  const favicon = getFaviconUrl(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-invite flex items-center gap-3 rounded-2xl border-amber-200 bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
    >
      {favicon ? (
        <img
          src={favicon}
          alt=""
          onError={hideBrokenImage}
          className="h-5 w-5 shrink-0 rounded border border-slate-300"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{title}</span>
          {carreira ? (
            <span className="inline-flex rounded-full border border-violet-300 bg-violet-100 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-violet-800">
              carreira
            </span>
          ) : null}
        </span>
        {desc ? (
          <span className="mt-0.5 block text-xs font-medium text-slate-500">
            {desc}
          </span>
        ) : null}
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
    </a>
  );
}

const dicaCores: Record<string, { chip: string; shadow: string }> = {
  "Como estudar": {
    chip: "bg-amber-300 text-slate-950",
    shadow: "shadow-[5px_5px_0_#FFB800]",
  },
  "Primeiro emprego": {
    chip: "bg-emerald-300 text-slate-950",
    shadow: "shadow-[5px_5px_0_#10b981]",
  },
  "Código no dia a dia": {
    chip: "bg-violet-300 text-slate-950",
    shadow: "shadow-[5px_5px_0_#7c3aed]",
  },
  "Mentalidade e comunidade": {
    chip: "bg-rose-300 text-slate-950",
    shadow: "shadow-[5px_5px_0_#f43f5e]",
  },
};

function dicaCor(categoria: string) {
  return (
    dicaCores[categoria] ?? {
      chip: "bg-amber-300 text-slate-950",
      shadow: "shadow-[5px_5px_0_#FFB800]",
    }
  );
}

function DicasDestaque() {
  const reduce = useReducedMotion() ?? false;
  const [categoria, setCategoria] = useState<string>("Todas");
  const [gold, setGold] = useState<{ dica: Dica; nonce: number } | null>(null);
  const goldRef = useRef<HTMLDivElement>(null);

  const filtros = ["Todas", ...dicasCategorias];
  const visiveis =
    categoria === "Todas"
      ? dicas
      : dicas.filter((d) => d.categoria === categoria);

  const sortear = () => {
    const escolhida = dicas[Math.floor(Math.random() * dicas.length)];
    setGold((cur) => ({ dica: escolhida, nonce: (cur?.nonce ?? 0) + 1 }));
  };

  useEffect(() => {
    if (gold && goldRef.current) goldRef.current.focus();
  }, [gold]);

  return (
    <section className="border-b-2 border-slate-900 bg-[#fffdf5] py-12">
      <div className="container space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
              conselhos reais
            </p>
            <h2 className="font-display text-3xl font-black text-slate-950">
              Dicas que a gente queria ter ouvido no começo
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-700">
              Conselhos diretos pra estudar, conseguir o primeiro emprego e se
              manter firme. Sem enrolação.
            </p>
          </div>
          <button
            type="button"
            onClick={sortear}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-5 py-2.5 text-sm font-black uppercase text-slate-950 shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
          >
            <Star className="h-4 w-4" aria-hidden />
            Me dá uma dica de ouro
          </button>
        </div>

        <div role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            {gold ? (
              <motion.div
                key={gold.nonce}
                ref={goldRef}
                tabIndex={-1}
                initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: reduce ? 0 : 0.35 }}
                className="rounded-[1.2rem] border-2 border-slate-900 bg-amber-100 p-6 shadow-[8px_8px_0_#FFB800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-950">
                  <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  dica de ouro
                </p>
                <p className="font-display text-xl font-black leading-snug text-slate-950 sm:text-2xl">
                  {gold.dica.texto}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-800">
                  {gold.dica.categoria}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setCategoria(f)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-black ${
                categoria === f
                  ? "border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                  : "border-amber-200 bg-white hover:bg-amber-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visiveis.map((d, index) => {
              const cor = dicaCor(d.categoria);
              return (
                <motion.li
                  layout
                  key={d.texto}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: reduce ? 0 : 0.25,
                    delay: reduce ? 0 : Math.min(index * 0.02, 0.25),
                  }}
                  className={`flex flex-col gap-2 rounded-[1.2rem] border-2 border-slate-950 bg-white p-4 transition-transform hover:-translate-y-1 ${cor.shadow}`}
                >
                  <span
                    className={`inline-flex w-fit rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[0.65rem] font-black uppercase ${cor.chip}`}
                  >
                    {d.categoria}
                  </span>
                  <p className="text-sm font-semibold leading-relaxed text-slate-800">
                    {d.texto}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}

function justWatchUrl(titulo: string) {
  return `https://www.justwatch.com/br/busca?q=${encodeURIComponent(titulo)}`;
}

const temasMarquee = [
  "primeiro emprego",
  "currículo",
  "entrevista técnica",
  "portfólio",
  "GitHub",
  "soft skills",
  "transição de carreira",
  "estágio",
  "LinkedIn",
  "comunidade",
];

const aprenderSubs = [
  { value: "filmes", label: "Filmes e documentários" },
  { value: "series", label: "Séries" },
  { value: "videos", label: "Vídeos e canais" },
  { value: "livros", label: "Livros" },
  { value: "podcasts", label: "Podcasts" },
  { value: "referencia", label: "Referência rápida" },
  { value: "artigos", label: "Artigos" },
] as const;

type AprenderTab = (typeof aprenderSubs)[number]["value"];

function dicaCardId(key: string) {
  return "dica-" + key.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

function screenMatches(f: Filme, q: string) {
  return q === "" || `${f.titulo} ${f.porque}`.toLowerCase().includes(q);
}

function linkMatches(d: DicaArtigo, q: string) {
  return q === "" || `${d.title} ${d.desc ?? ""}`.toLowerCase().includes(q);
}

function livroMatches(livro: { titulo: string; autor: string }, q: string) {
  return q === "" || `${livro.titulo} ${livro.autor}`.toLowerCase().includes(q);
}

function activeKeys(tab: AprenderTab, q: string): string[] {
  switch (tab) {
    case "filmes":
      return bibliotecaFilmes
        .filter((f) => screenMatches(f, q))
        .map((f) => f.titulo);
    case "series":
      return bibliotecaSeries
        .filter((f) => screenMatches(f, q))
        .map((f) => f.titulo);
    case "videos":
      return bibliotecaVideos
        .filter((d) => linkMatches(d, q))
        .map((d) => d.url);
    case "livros":
      return bibliotecaLivros
        .filter((l) => livroMatches(l, q))
        .map((l) => l.titulo);
    case "podcasts":
      return bibliotecaPodcasts
        .filter((d) => linkMatches(d, q))
        .map((d) => d.url);
    case "referencia":
      return bibliotecaReferencia
        .filter((d) => linkMatches(d, q))
        .map((d) => d.url);
    case "artigos":
      return carreiraArtigos
        .filter((d) => linkMatches(d, q))
        .map((d) => d.url);
  }
}

function Marquee() {
  return (
    <div
      className="overflow-hidden border-b-2 border-slate-900 bg-[#FFB800] py-2"
      aria-hidden
    >
      <div className="flex w-max animate-marquee-left gap-8 whitespace-nowrap pr-8 hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...temasMarquee, ...temasMarquee].map((tema, index) => (
          <span
            key={`${tema}-${index}`}
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-950"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {tema}
          </span>
        ))}
      </div>
    </div>
  );
}

function CountUp({
  value,
  label,
  reduce,
}: {
  value: number;
  label: string;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut" as const,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <div
      ref={ref}
      className="rounded-2xl border-2 border-slate-900 bg-white px-3 py-3 text-center shadow-[3px_3px_0_#10b981]"
    >
      <span className="block font-display text-2xl font-black text-slate-950">
        {reduce ? value : n}
      </span>
      <span className="mt-0.5 block text-[0.7rem] font-black uppercase leading-tight tracking-wide text-slate-600">
        {label}
      </span>
    </div>
  );
}

function BuscaVazia() {
  return (
    <p className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
      Nada encontrado para essa busca. Tente outro termo.
    </p>
  );
}

function AprenderSection() {
  const reduce = useReducedMotion() ?? false;
  const [aprenderTab, setAprenderTab] = useState<AprenderTab>("filmes");
  const [query, setQuery] = useState("");
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (highlightKey === null) return;
    const t = setTimeout(() => setHighlightKey(null), 1300);
    return () => clearTimeout(t);
  }, [highlightKey]);

  const onToggle = (key: string) =>
    setExpandedKey((cur) => (cur === key ? null : key));

  const surpreenda = () => {
    const keys = activeKeys(aprenderTab, q);
    if (keys.length === 0) return;
    const key = keys[Math.floor(Math.random() * keys.length)];
    setHighlightKey(key);
    const el = document.getElementById(dicaCardId(key));
    if (el) {
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
    }
  };

  const stats = [
    { value: bibliotecaFilmes.length, label: "filmes e docs" },
    { value: bibliotecaSeries.length, label: "séries" },
    { value: bibliotecaVideos.length, label: "vídeos e canais" },
    { value: bibliotecaLivros.length, label: "livros" },
    { value: bibliotecaPodcasts.length, label: "podcasts" },
    { value: bibliotecaReferencia.length, label: "referências" },
  ];

  return (
    <section className="bg-[#fff9e7] py-12">
      <div className="container space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <label htmlFor="dicas-busca" className="sr-only">
              Buscar nas indicações
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600"
              aria-hidden
            />
            <input
              id="dicas-busca"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou tema..."
              className="w-full rounded-full border-2 border-slate-900 bg-white py-2 pl-9 pr-4 text-sm font-bold text-slate-900 shadow-[3px_3px_0_#0f172a] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            />
          </div>
          <button
            type="button"
            onClick={surpreenda}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <Shuffle className="h-4 w-4" aria-hidden />
            Surpreenda-me
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <CountUp
              key={s.label}
              value={s.value}
              label={s.label}
              reduce={reduce}
            />
          ))}
        </div>

        <Tabs
          value={aprenderTab}
          onValueChange={(v) => setAprenderTab(v as AprenderTab)}
          className="gap-6"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0">
            {aprenderSubs.map((sub) => (
              <TabsTrigger
                key={sub.value}
                value={sub.value}
                className="relative h-auto flex-none rounded-full border-2 border-amber-200 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-colors data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-slate-950"
              >
                {aprenderTab === sub.value ? (
                  <motion.span
                    layoutId="aprenderIndicator"
                    className="absolute inset-0 rounded-full border-2 border-slate-900 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
                    transition={{ duration: reduce ? 0 : 0.3 }}
                  />
                ) : null}
                <span className="relative z-10">{sub.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="filmes">
            <FilmesGrid
              itens={bibliotecaFilmes}
              query={q}
              highlightKey={highlightKey}
              expandedKey={expandedKey}
              onToggle={onToggle}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="series">
            <FilmesGrid
              itens={bibliotecaSeries}
              query={q}
              highlightKey={highlightKey}
              expandedKey={expandedKey}
              onToggle={onToggle}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="videos">
            <LinksGrid
              itens={bibliotecaVideos}
              query={q}
              highlightKey={highlightKey}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="livros">
            <LivrosGrid query={q} highlightKey={highlightKey} reduce={reduce} />
          </TabsContent>
          <TabsContent value="podcasts">
            <LinksGrid
              itens={bibliotecaPodcasts}
              query={q}
              highlightKey={highlightKey}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="referencia">
            <LinksGrid
              itens={bibliotecaReferencia}
              query={q}
              highlightKey={highlightKey}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="artigos">
            <LinksGrid
              itens={carreiraArtigos}
              query={q}
              highlightKey={highlightKey}
              reduce={reduce}
            />
          </TabsContent>
        </Tabs>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
          Capas de filmes e séries via TMDB. Este produto usa a API do TMDB, mas
          não é endossado nem certificado pelo TMDB. Capas de livros via Open
          Library.
        </p>
      </div>
    </section>
  );
}

function LinksGrid({
  itens,
  query,
  highlightKey,
  reduce,
}: {
  itens: DicaArtigo[];
  query: string;
  highlightKey: string | null;
  reduce: boolean;
}) {
  const filtered = itens.filter((it) => linkMatches(it, query));

  return (
    <>
      <motion.ul layout className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((it, index) => {
            const high = highlightKey === it.url;
            return (
              <motion.li
                layout
                key={it.url}
                id={dicaCardId(it.url)}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
                className="relative"
              >
                {high ? (
                  <span className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-4 ring-inset ring-amber-500 motion-safe:animate-pulse" />
                ) : null}
                <LinkExterno
                  title={it.title}
                  url={it.url}
                  desc={it.desc}
                  carreira={it.carreira}
                />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
      {filtered.length === 0 ? <BuscaVazia /> : null}
    </>
  );
}

function FilmesGrid({
  itens,
  query,
  highlightKey,
  expandedKey,
  onToggle,
  reduce,
}: {
  itens: Filme[];
  query: string;
  highlightKey: string | null;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  reduce: boolean;
}) {
  const filtered = itens.filter((f) => screenMatches(f, query));

  return (
    <>
      <motion.ul
        layout
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((filme, index) => {
            const poster = filme.posterPath ?? generatedPosters[filme.titulo];
            const high = highlightKey === filme.titulo;
            const expanded = expandedKey === filme.titulo;
            return (
              <motion.li
                layout
                key={filme.titulo}
                id={dicaCardId(filme.titulo)}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
                className="group card-invite relative flex flex-col overflow-hidden rounded-2xl border-amber-200 bg-white shadow-[5px_5px_0_#fbbf24]"
              >
                {high ? (
                  <span className="pointer-events-none absolute inset-0 z-20 rounded-2xl ring-4 ring-inset ring-amber-500 motion-safe:animate-pulse" />
                ) : null}
                <div className="relative aspect-[2/3] w-full overflow-hidden border-b-2 border-amber-200 bg-amber-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="h-12 w-12 text-amber-500" aria-hidden />
                  </div>
                  {poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${poster}`}
                      alt={`Pôster de ${filme.titulo}`}
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-display text-sm font-black leading-snug text-slate-950">
                    {filme.titulo}{" "}
                    <span className="text-amber-700">({filme.ano})</span>
                  </h3>
                  <p
                    className={`mt-2 flex-1 text-xs leading-relaxed text-slate-600 ${
                      expanded ? "" : "line-clamp-2"
                    }`}
                  >
                    {filme.porque}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={justWatchUrl(filme.titulo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Onde assistir ${filme.titulo}`}
                      className="inline-flex w-fit items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                    >
                      Onde encontrar <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                    <button
                      type="button"
                      onClick={() => onToggle(filme.titulo)}
                      aria-expanded={expanded}
                      aria-label={
                        expanded
                          ? `Recolher ${filme.titulo}`
                          : `Ver mais sobre ${filme.titulo}`
                      }
                      className="inline-flex items-center gap-1 rounded-full border-2 border-amber-300 bg-white px-3 py-1 text-xs font-black text-amber-800 transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                    >
                      {expanded ? "Recolher" : "Detalhes"}
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
      {filtered.length === 0 ? <BuscaVazia /> : null}
    </>
  );
}

function LivrosGrid({
  query,
  highlightKey,
  reduce,
}: {
  query: string;
  highlightKey: string | null;
  reduce: boolean;
}) {
  const filtered = bibliotecaLivros.filter((l) => livroMatches(l, query));

  return (
    <>
      <motion.ul
        layout
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((livro, index) => {
            const onde = livro.url
              ? livro.url
              : livro.isbn
                ? `https://openlibrary.org/isbn/${livro.isbn}`
                : `https://openlibrary.org/search?q=${encodeURIComponent(livro.titulo)}`;
            const high = highlightKey === livro.titulo;
            return (
              <motion.li
                layout
                key={livro.titulo}
                id={dicaCardId(livro.titulo)}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
                className="group card-invite relative flex flex-col overflow-hidden rounded-2xl border-amber-200 bg-white shadow-[5px_5px_0_#fbbf24]"
              >
                {high ? (
                  <span className="pointer-events-none absolute inset-0 z-20 rounded-2xl ring-4 ring-inset ring-amber-500 motion-safe:animate-pulse" />
                ) : null}
                <div className="relative aspect-[2/3] w-full overflow-hidden border-b-2 border-amber-200 bg-emerald-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-emerald-600" aria-hidden />
                  </div>
                  {livro.isbn ? (
                    <img
                      src={`https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg?default=false`}
                      alt={`Capa de ${livro.titulo}`}
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-display text-sm font-black leading-snug text-slate-950">
                    {livro.titulo}
                  </h3>
                  <p className="mt-1 flex-1 text-xs font-bold text-slate-600">
                    {livro.autor}
                  </p>
                  <a
                    href={onde}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Onde encontrar ${livro.titulo}`}
                    className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                  >
                    {livro.url ? "Ler grátis" : "Onde encontrar"}{" "}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
      {filtered.length === 0 ? <BuscaVazia /> : null}
    </>
  );
}
