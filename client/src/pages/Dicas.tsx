import { useEffect, useRef, useState, type RefObject } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  BookOpen,
  Braces,
  Bug,
  ChevronDown,
  Clapperboard,
  Cloud,
  Coffee,
  Cpu,
  ExternalLink,
  Film,
  GitBranch,
  GraduationCap,
  Laptop,
  Lightbulb,
  MessageCircle,
  Rocket,
  Search,
  Shuffle,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Tv,
  X,
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
  curiosidades,
  curiosidadesCategorias,
  dicas,
  dicasCategorias,
  type Curiosidade,
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
  const [tab, setTab] = useState<
    "aprender" | "curiosidades" | "livros" | "notebooks"
  >("aprender");
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
            dicas, recursos e curiosidades
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Dicas, recursos e curiosidades pra sua jornada em tech
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Conselhos práticos, filmes e documentários, séries, canais no
            YouTube, podcasts, livros (vários gratuitos), referências rápidas,
            notebooks pra praticar e curiosidades do mundo da programação. Tudo
            selecionado a dedo e de graça.
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
              { key: "curiosidades", label: "Curiosidades" },
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

      {tab === "curiosidades" && <CuriosidadesSection />}

      {tab === "livros" && (
        <section className="bg-[#faf8f4] py-12">
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
        <section className="bg-[#faf8f4] py-12">
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

function dicaFiltroBg(f: string) {
  switch (f) {
    case "Primeiro emprego":
      return "bg-emerald-300";
    case "Código no dia a dia":
      return "bg-violet-300";
    case "Mentalidade e comunidade":
      return "bg-rose-300";
    default:
      return "bg-amber-300";
  }
}

const dicasDoodles = [
  { Icon: Lightbulb, cls: "left-[4%] top-[14%] text-amber-500 opacity-[0.16]", size: "h-12 w-12", dur: 6, rot: 6, delay: 0 },
  { Icon: Rocket, cls: "right-[6%] top-[10%] text-violet-500 opacity-[0.15]", size: "h-14 w-14", dur: 7, rot: -8, delay: 0.6 },
  { Icon: Braces, cls: "left-[15%] top-[62%] text-emerald-500 opacity-[0.16]", size: "h-10 w-10", dur: 5.5, rot: 5, delay: 1.1 },
  { Icon: BookOpen, cls: "right-[11%] top-[60%] text-rose-500 opacity-[0.15]", size: "h-12 w-12", dur: 6.5, rot: -6, delay: 0.3 },
  { Icon: GraduationCap, cls: "left-[43%] top-[8%] text-sky-500 opacity-[0.14]", size: "h-12 w-12", dur: 7.5, rot: 7, delay: 1.4 },
  { Icon: Target, cls: "right-[28%] top-[80%] text-amber-600 opacity-[0.15]", size: "h-11 w-11", dur: 6, rot: -5, delay: 0.9 },
  { Icon: Star, cls: "left-[31%] top-[40%] text-violet-400 opacity-[0.16]", size: "h-9 w-9", dur: 5, rot: 10, delay: 0.2 },
  { Icon: GitBranch, cls: "right-[3%] top-[44%] text-emerald-600 opacity-[0.15]", size: "h-12 w-12", dur: 7, rot: -7, delay: 1.7 },
  { Icon: Bug, cls: "left-[7%] top-[84%] text-rose-600 opacity-[0.15]", size: "h-10 w-10", dur: 5.5, rot: 6, delay: 0.5 },
  { Icon: Coffee, cls: "right-[20%] top-[22%] text-amber-700 opacity-[0.14]", size: "h-10 w-10", dur: 6.5, rot: -6, delay: 1.2 },
  { Icon: MessageCircle, cls: "left-[58%] top-[72%] text-sky-600 opacity-[0.15]", size: "h-11 w-11", dur: 6, rot: 8, delay: 0.8 },
  { Icon: Sparkles, cls: "right-[44%] top-[6%] text-amber-400 opacity-[0.16]", size: "h-9 w-9", dur: 5, rot: -10, delay: 1.5 },
];

function DicasDoodles({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {dicasDoodles.map((d, i) => {
        const Icon = d.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${d.cls}`}
            animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, d.rot, 0] }}
            transition={
              reduce
                ? undefined
                : {
                    duration: d.dur,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                    delay: d.delay,
                  }
            }
          >
            <Icon className={d.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}

const sparkleSpots = [
  { cls: "left-3 top-3", size: 18, delay: 0 },
  { cls: "right-4 top-2", size: 14, delay: 0.05 },
  { cls: "right-8 bottom-4", size: 22, delay: 0.1 },
  { cls: "left-6 bottom-3", size: 13, delay: 0.08 },
  { cls: "left-1/2 -top-2", size: 16, delay: 0.13 },
  { cls: "right-1/3 -bottom-2", size: 15, delay: 0.16 },
];

function SparkleBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {sparkleSpots.map((s, i) => (
        <motion.svg
          key={i}
          className={`absolute ${s.cls} text-amber-400`}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          fill="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
          transition={{ duration: 0.7, delay: s.delay, ease: "easeOut" as const }}
        >
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
        </motion.svg>
      ))}
    </div>
  );
}

function DicasDestaque() {
  const reduce = useReducedMotion() ?? false;
  const [categoria, setCategoria] = useState<string>("Todas");
  const [gold, setGold] = useState<{ dica: Dica; nonce: number } | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [sparkle, setSparkle] = useState(0);
  const [verTodas, setVerTodas] = useState(false);
  const goldRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);

  const filtros = ["Todas", ...dicasCategorias];
  const visiveis =
    categoria === "Todas"
      ? dicas
      : dicas.filter((d) => d.categoria === categoria);

  const pick = () => dicas[Math.floor(Math.random() * dicas.length)];

  const sortear = () => {
    const escolhida = pick();
    if (reduce) {
      setShuffling(false);
      setSparkle(0);
      setGold((cur) => ({ dica: escolhida, nonce: (cur?.nonce ?? 0) + 1 }));
      return;
    }
    const runId = ++runRef.current;
    setShuffling(true);
    setGold((cur) => ({ dica: pick(), nonce: (cur?.nonce ?? 0) + 1 }));
    let i = 0;
    const step = () => {
      if (runRef.current !== runId) return;
      if (i < 3) {
        setGold((cur) => (cur ? { ...cur, dica: pick() } : cur));
        i += 1;
        setTimeout(step, 110);
      } else {
        setGold((cur) => (cur ? { ...cur, dica: escolhida } : cur));
        setShuffling(false);
        setSparkle((s) => s + 1);
      }
    };
    setTimeout(step, 120);
  };

  useEffect(() => {
    if (gold && goldRef.current) goldRef.current.focus();
  }, [gold]);

  return (
    <section className="relative overflow-hidden border-b-2 border-slate-900 bg-[#f6f6fb] py-12">
      <DicasDoodles reduce={reduce} />
      <div className="container relative z-10 space-y-6">
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
          {gold ? (
              <motion.div
                key={gold.nonce}
                ref={goldRef}
                tabIndex={-1}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.15 } }
                    : { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
                }
                transition={
                  reduce
                    ? { duration: 0.2 }
                    : { type: "spring", stiffness: 460, damping: 15 }
                }
                className="relative rounded-[1.2rem] border-2 border-slate-900 bg-amber-100 p-6 shadow-[8px_8px_0_#FFB800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                {sparkle > 0 && !reduce ? <SparkleBurst key={sparkle} /> : null}
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-slate-950">
                  <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  dica de ouro
                </p>
                <p
                  className={`font-display text-xl font-black leading-snug text-slate-950 transition-opacity duration-100 sm:text-2xl ${
                    shuffling ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {gold.dica.texto}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-800">
                  {gold.dica.categoria}
                </p>
              </motion.div>
            ) : null}
        </div>

        <div className="border-t-2 border-dashed border-slate-300 pt-6">
          <button
            type="button"
            onClick={() => setVerTodas((v) => !v)}
            aria-expanded={verTodas}
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {verTodas ? "Esconder a lista" : `Ver todas as ${dicas.length} dicas`}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${verTodas ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {verTodas ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {filtros.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCategoria(f)}
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition-transform hover:-translate-y-0.5 ${
                      categoria === f
                        ? `border-slate-900 ${dicaFiltroBg(f)} shadow-[2px_2px_0_#0f172a]`
                        : "border-slate-300 bg-white hover:bg-slate-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <motion.ul
                layout
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
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
          ) : null}
        </div>
      </div>
    </section>
  );
}

function embaralhar<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const curiosidadeCores: Record<
  string,
  { bg: string; chip: string; shadow: string; shadowSm: string }
> = {
  Jogos: {
    bg: "bg-violet-100",
    chip: "bg-violet-300",
    shadow: "shadow-[8px_8px_0_#7c3aed]",
    shadowSm: "shadow-[3px_3px_0_#7c3aed]",
  },
  "História e pessoas": {
    bg: "bg-amber-100",
    chip: "bg-amber-300",
    shadow: "shadow-[8px_8px_0_#FFB800]",
    shadowSm: "shadow-[3px_3px_0_#FFB800]",
  },
  Linguagens: {
    bg: "bg-emerald-100",
    chip: "bg-emerald-300",
    shadow: "shadow-[8px_8px_0_#10b981]",
    shadowSm: "shadow-[3px_3px_0_#10b981]",
  },
  "Internet e web": {
    bg: "bg-sky-100",
    chip: "bg-sky-300",
    shadow: "shadow-[8px_8px_0_#0284c7]",
    shadowSm: "shadow-[3px_3px_0_#0284c7]",
  },
  "Hardware e cultura": {
    bg: "bg-rose-100",
    chip: "bg-rose-300",
    shadow: "shadow-[8px_8px_0_#f43f5e]",
    shadowSm: "shadow-[3px_3px_0_#f43f5e]",
  },
};

function curiosidadeCor(categoria: string) {
  return curiosidadeCores[categoria] ?? curiosidadeCores.Jogos;
}

function CuriosidadesSection() {
  const reduce = useReducedMotion() ?? false;
  const [atual, setAtual] = useState<{ c: Curiosidade; nonce: number } | null>(
    null,
  );
  const [verTodas, setVerTodas] = useState(false);
  const deckRef = useRef<Curiosidade[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const proxima = () => {
    if (deckRef.current.length === 0) deckRef.current = embaralhar(curiosidades);
    const c = deckRef.current.shift();
    if (!c) return;
    setAtual((cur) => ({ c, nonce: (cur?.nonce ?? 0) + 1 }));
  };

  useEffect(() => {
    if (atual && cardRef.current) cardRef.current.focus();
  }, [atual]);

  return (
    <section className="relative overflow-hidden border-b-2 border-slate-900 bg-[#f6f6fb] py-12">
      <DicasDoodles reduce={reduce} />
      <div className="container relative z-10 space-y-8">
        <div className="max-w-2xl">
          <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
            curiosidades de tech
          </p>
          <h2 className="font-display text-3xl font-black text-slate-950">
            Curiosidades do mundo da programação
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Fatos sobre jogos, linguagens, internet e a história da computação.
            Uma de cada vez, pra você descobrir aos poucos.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div role="status" aria-live="polite" className="w-full max-w-2xl">
            {atual ? (
                <motion.div
                  key={atual.nonce}
                  ref={cardRef}
                  tabIndex={-1}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0.15 } }
                    : { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
                }
                  transition={
                    reduce
                      ? { duration: 0.2 }
                      : { type: "spring", stiffness: 460, damping: 16 }
                  }
                  className={`rounded-[1.2rem] border-2 border-slate-900 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${curiosidadeCor(atual.c.categoria).bg} ${curiosidadeCor(atual.c.categoria).shadow}`}
                >
                  <span
                    className={`mb-3 inline-flex w-fit rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 ${curiosidadeCor(atual.c.categoria).chip}`}
                  >
                    {atual.c.categoria}
                  </span>
                  <p className="font-display text-lg font-black leading-snug text-slate-950 sm:text-xl">
                    {atual.c.texto}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="vazio"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[1.2rem] border-2 border-dashed border-slate-400 bg-white/70 p-8 text-center text-sm font-bold text-slate-500"
                >
                  Clique no botão e descubra uma curiosidade aleatória.
                </motion.div>
              )}
          </div>
          <button
            type="button"
            onClick={proxima}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-6 py-3 text-sm font-black uppercase text-slate-950 shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {atual ? "Outra curiosidade" : "Me dê uma curiosidade"}
          </button>
        </div>

        <div className="border-t-2 border-dashed border-slate-300 pt-6">
          <button
            type="button"
            onClick={() => setVerTodas((v) => !v)}
            aria-expanded={verTodas}
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {verTodas
              ? "Esconder a lista"
              : `Ver todas as ${curiosidades.length} curiosidades`}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${verTodas ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <AnimatePresence initial={false}>
            {verTodas ? (
              <motion.ul
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
                className="mt-4 grid gap-3 overflow-hidden sm:grid-cols-2 lg:grid-cols-3"
              >
                {curiosidades.map((c, i) => {
                  const cor = curiosidadeCor(c.categoria);
                  return (
                    <li
                      key={i}
                      className={`rounded-2xl border-2 border-slate-900 bg-white p-3 ${cor.shadowSm}`}
                    >
                      <span
                        className={`inline-flex w-fit rounded-full border border-slate-900 px-2 py-0.5 text-[0.6rem] font-black uppercase text-slate-950 ${cor.chip}`}
                      >
                        {c.categoria}
                      </span>
                      <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-700">
                        {c.texto}
                      </p>
                    </li>
                  );
                })}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const telaDoodles = [
  { Icon: Clapperboard, cls: "left-[2%] top-[12%] text-violet-500 opacity-[0.16]", size: "h-12 w-12", dur: 6.5, rot: -7, delay: 0 },
  { Icon: Lightbulb, cls: "left-[7%] top-[55%] text-amber-500 opacity-[0.15]", size: "h-10 w-10", dur: 6, rot: 6, delay: 0.7 },
  { Icon: Star, cls: "left-[3%] top-[82%] text-emerald-500 opacity-[0.13]", size: "h-8 w-8", dur: 5, rot: 10, delay: 1.2 },
  { Icon: MessageCircle, cls: "left-[12%] top-[28%] text-sky-500 opacity-[0.12]", size: "h-9 w-9", dur: 7, rot: -6, delay: 0.4 },
  { Icon: Braces, cls: "left-[1%] top-[44%] text-rose-500 opacity-[0.14]", size: "h-10 w-10", dur: 5.5, rot: 5, delay: 1.5 },
  { Icon: Rocket, cls: "right-[2%] top-[14%] text-amber-600 opacity-[0.16]", size: "h-12 w-12", dur: 7, rot: 8, delay: 0.2 },
  { Icon: Sparkles, cls: "right-[8%] top-[58%] text-violet-400 opacity-[0.15]", size: "h-9 w-9", dur: 5, rot: -10, delay: 0.9 },
  { Icon: GraduationCap, cls: "right-[3%] top-[82%] text-sky-600 opacity-[0.13]", size: "h-11 w-11", dur: 7.5, rot: 7, delay: 1.3 },
  { Icon: Star, cls: "right-[12%] top-[32%] text-emerald-600 opacity-[0.12]", size: "h-8 w-8", dur: 5.5, rot: 9, delay: 0.6 },
  { Icon: Braces, cls: "right-[1%] top-[46%] text-rose-400 opacity-[0.14]", size: "h-10 w-10", dur: 6, rot: -5, delay: 1.6 },
];

function TelaDoodles({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {telaDoodles.map((d, i) => {
        const Icon = d.Icon;
        return (
          <motion.span
            key={i}
            className={`absolute ${d.cls}`}
            animate={reduce ? undefined : { y: [0, -10, 0], rotate: [0, d.rot, 0] }}
            transition={
              reduce
                ? undefined
                : {
                    duration: d.dur,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                    delay: d.delay,
                  }
            }
          >
            <Icon className={d.size} strokeWidth={2.5} />
          </motion.span>
        );
      })}
    </div>
  );
}

function TelaRevealCard({
  f,
  kind,
  reduce,
  cardRef,
  onOutro,
  onLimpar,
  rechamada,
}: {
  f: Filme;
  kind: ScreenKind;
  reduce: boolean;
  cardRef: RefObject<HTMLDivElement | null>;
  onOutro: () => void;
  onLimpar: () => void;
  rechamada: string;
}) {
  const cat = screenCategoria(f, kind);
  const Icon = cat.Icon;
  return (
    <motion.div
      ref={cardRef}
      tabIndex={-1}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduce
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 460, damping: 16 }
      }
      className="relative overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      <Icon
        className="pointer-events-none absolute -bottom-3 -right-2 h-24 w-24 text-slate-950 opacity-[0.06]"
        aria-hidden
      />
      <div className="relative z-10 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-slate-900 ${cat.bg}`}
        >
          <Icon className="h-4 w-4 text-slate-950" aria-hidden />
        </span>
        <span className="text-[0.65rem] font-black uppercase tracking-wide text-slate-950">
          {cat.label}
        </span>
      </div>
      <h3 className="relative z-10 mt-3 font-display text-lg font-black leading-snug text-slate-950">
        {f.titulo} <span className="text-slate-500">({f.ano})</span>
      </h3>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-slate-600">
        {f.porque}
      </p>
      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2">
        <a
          href={justWatchUrl(f.titulo)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Onde assistir ${f.titulo}`}
          className="inline-flex w-fit items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
        >
          Onde encontrar <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        <button
          type="button"
          onClick={onOutro}
          className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          <Shuffle className="h-3.5 w-3.5" aria-hidden />
          {rechamada}
        </button>
        <button
          type="button"
          onClick={onLimpar}
          aria-label="Limpar indicação"
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 text-slate-400 transition-colors hover:border-slate-900 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}

function TelasTab({
  itens,
  kind,
  query,
  expandedKey,
  onToggle,
  reduce,
}: {
  itens: Filme[];
  kind: ScreenKind;
  query: string;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  reduce: boolean;
}) {
  const [pick, setPick] = useState<{ f: Filme; nonce: number } | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const deckRef = useRef<Filme[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const proxima = () => {
    if (deckRef.current.length === 0) deckRef.current = embaralhar(itens);
    const f = deckRef.current.shift();
    if (!f) return;
    setPick((cur) => ({ f, nonce: (cur?.nonce ?? 0) + 1 }));
  };

  useEffect(() => {
    if (pick && cardRef.current) cardRef.current.focus();
  }, [pick]);

  const chamada = kind === "serie" ? "Me indica uma série" : "Me indica um filme";
  const rechamada = kind === "serie" ? "Outra série" : "Outro filme";
  const verLabel =
    kind === "serie"
      ? `Ver todas as ${itens.length} séries`
      : `Ver todos os ${itens.length} filmes`;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden px-2 py-6">
        <TelaDoodles reduce={reduce} />
        <div
          role="status"
          aria-live="polite"
          className="relative z-10 mx-auto max-w-2xl rounded-[1.2rem] border-2 border-slate-900 bg-white p-5 shadow-[5px_5px_0_#0f172a]"
        >
        {pick ? (
          <TelaRevealCard
            key={pick.nonce}
            f={pick.f}
            kind={kind}
            reduce={reduce}
            cardRef={cardRef}
            onOutro={proxima}
            onLimpar={() => setPick(null)}
            rechamada={rechamada}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm font-bold text-slate-500">
              Toque no botão e receba uma indicação pra assistir.
            </p>
            <button
              type="button"
              onClick={proxima}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-emerald-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              <Shuffle className="h-4 w-4" aria-hidden />
              {chamada}
            </button>
          </div>
        )}
        </div>
      </div>
      <div className="border-t-2 border-dashed border-slate-300 pt-6">
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          aria-expanded={verTodos}
          className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {verTodos ? "Esconder a lista" : verLabel}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${verTodos ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {verTodos ? (
          <div className="mt-4">
            <FilmesGrid
              itens={itens}
              kind={kind}
              query={query}
              expandedKey={expandedKey}
              onToggle={onToggle}
              reduce={reduce}
            />
          </div>
        ) : null}
      </div>
    </div>
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

function screenMatches(f: Filme, q: string) {
  return q === "" || `${f.titulo} ${f.porque}`.toLowerCase().includes(q);
}

function linkMatches(d: DicaArtigo, q: string) {
  return q === "" || `${d.title} ${d.desc ?? ""}`.toLowerCase().includes(q);
}

function livroMatches(livro: { titulo: string; autor: string }, q: string) {
  return q === "" || `${livro.titulo} ${livro.autor}`.toLowerCase().includes(q);
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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const onToggle = (key: string) =>
    setExpandedKey((cur) => (cur === key ? null : key));

  const stats = [
    { value: bibliotecaFilmes.length, label: "filmes e docs" },
    { value: bibliotecaSeries.length, label: "séries" },
    { value: bibliotecaVideos.length, label: "vídeos e canais" },
    { value: bibliotecaLivros.length, label: "livros" },
    { value: bibliotecaPodcasts.length, label: "podcasts" },
    { value: bibliotecaReferencia.length, label: "referências" },
  ];

  return (
    <section className="bg-[#faf8f4] py-12">
      <div className="container space-y-6">
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
            <TelasTab
              itens={bibliotecaFilmes}
              query={q}
              expandedKey={expandedKey}
              onToggle={onToggle}
              reduce={reduce}
              kind="filme"
            />
          </TabsContent>
          <TabsContent value="series">
            <TelasTab
              itens={bibliotecaSeries}
              query={q}
              expandedKey={expandedKey}
              onToggle={onToggle}
              reduce={reduce}
              kind="serie"
            />
          </TabsContent>
          <TabsContent value="videos">
            <LinksGrid
              itens={bibliotecaVideos}
              query={q}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="livros">
            <LivrosGrid query={q} reduce={reduce} />
          </TabsContent>
          <TabsContent value="podcasts">
            <LinksGrid
              itens={bibliotecaPodcasts}
              query={q}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="referencia">
            <LinksGrid
              itens={bibliotecaReferencia}
              query={q}
              reduce={reduce}
            />
          </TabsContent>
          <TabsContent value="artigos">
            <LinksGrid
              itens={carreiraArtigos}
              query={q}
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
  reduce,
}: {
  itens: DicaArtigo[];
  query: string;
  reduce: boolean;
}) {
  const filtered = itens.filter((it) => linkMatches(it, query));

  return (
    <>
      <motion.ul layout className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((it, index) => {
            return (
              <motion.li
                layout
                key={it.url}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
              >
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

type ScreenKind = "filme" | "serie";

function screenCategoria(filme: Filme, kind: ScreenKind) {
  if (kind === "serie") {
    return { label: "Série", bg: "bg-violet-300", Icon: Tv };
  }
  if (/document[aá]rio/i.test(filme.porque)) {
    return { label: "Documentário", bg: "bg-emerald-300", Icon: Clapperboard };
  }
  return { label: "Filme", bg: "bg-amber-300", Icon: Film };
}

function FilmesGrid({
  itens,
  query,
  expandedKey,
  onToggle,
  reduce,
  kind,
}: {
  itens: Filme[];
  query: string;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  reduce: boolean;
  kind: ScreenKind;
}) {
  const filtered = itens.filter((f) => screenMatches(f, query));

  return (
    <>
      <motion.ul
        layout
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((filme, index) => {
            const poster = filme.posterPath ?? generatedPosters[filme.titulo];
            const expanded = expandedKey === filme.titulo;
            const cat = screenCategoria(filme, kind);
            const Icon = cat.Icon;
            return (
              <motion.li
                layout
                key={filme.titulo}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                whileHover={
                  reduce
                    ? undefined
                    : { y: -3, rotate: -0.5, transition: { duration: 0.15 } }
                }
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a] transition-shadow duration-200 hover:shadow-[7px_7px_0_#0f172a]"
              >
                {poster ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden border-b-2 border-slate-900">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${poster}`}
                      alt={`Pôster de ${filme.titulo}`}
                      loading="lazy"
                      onError={hideBrokenImage}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative flex items-center gap-1.5 overflow-hidden border-b-2 border-slate-900 px-3 py-1.5 ${cat.bg}`}
                  >
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-white/30 transition-transform duration-700 ease-out group-hover:translate-x-[260%] motion-reduce:hidden"
                      aria-hidden
                    />
                    <motion.span
                      className="relative z-10 flex"
                      animate={reduce ? undefined : { y: [0, -2, 0] }}
                      transition={
                        reduce
                          ? undefined
                          : {
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeInOut" as const,
                            }
                      }
                    >
                      <Icon className="h-4 w-4 text-slate-950" aria-hidden />
                    </motion.span>
                    <span className="relative z-10 text-[0.65rem] font-black uppercase tracking-wide text-slate-950">
                      {cat.label}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-display text-sm font-black leading-snug text-slate-950">
                    {filme.titulo}{" "}
                    <span className="text-slate-500">({filme.ano})</span>
                  </h3>
                  {expanded ? (
                    <motion.div
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2"
                    >
                      <p className="text-xs leading-relaxed text-slate-600">
                        {filme.porque}
                      </p>
                      <a
                        href={justWatchUrl(filme.titulo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Onde assistir ${filme.titulo}`}
                        className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                      >
                        Onde encontrar <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </motion.div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onToggle(filme.titulo)}
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Recolher ${filme.titulo}`
                        : `Ver mais sobre ${filme.titulo}`
                    }
                    className="mt-3 inline-flex w-fit items-center gap-1 self-start rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-800 transition-transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
                  >
                    {expanded ? "Menos" : "Detalhes"}
                  </button>
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
  reduce,
}: {
  query: string;
  reduce: boolean;
}) {
  const filtered = bibliotecaLivros.filter((l) => livroMatches(l, query));

  return (
    <>
      <motion.ul
        layout
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((livro, index) => {
            const onde = livro.url
              ? livro.url
              : livro.isbn
                ? `https://openlibrary.org/isbn/${livro.isbn}`
                : `https://openlibrary.org/search?q=${encodeURIComponent(livro.titulo)}`;
            return (
              <motion.li
                layout
                key={livro.titulo}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{
                  duration: reduce ? 0 : 0.25,
                  delay: reduce ? 0 : Math.min(index * 0.03, 0.3),
                }}
                className="group card-invite relative flex flex-col overflow-hidden rounded-2xl border-amber-200 bg-white shadow-[5px_5px_0_#fbbf24]"
              >
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
