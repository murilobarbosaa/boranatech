import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Bot,
  BookOpen,
  Check,
  CheckCircle,
  Compass,
  Copy,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Map,
  Newspaper,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import EmbaixadoraBadge from "@/components/shared/EmbaixadoraBadge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn, getFaviconUrl, hideBrokenImage } from "@/lib/utils";
import {
  iaAvisos,
  iaChooseByGoal,
  iaCriadores,
  iaCursos,
  iaGlossario,
  iaPromptTips,
  iaQuizOpcoes,
  iaQuizPergunta,
  iaTools,
  iaUsageTips,
  type IaCusto,
  type IaQuizOpcao,
  type IaTool,
} from "@/lib/iaGuideData";

const ac = getPageAccentUi("violet");

const costBadge: Record<IaCusto, string> = {
  Grátis: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Freemium: "border-violet-300 bg-violet-50 text-violet-800",
  Pago: "border-slate-300 bg-slate-100 text-slate-700",
};

const custoInfo: Record<IaCusto, string> = {
  Grátis: "Dá pra usar sem pagar.",
  Freemium: "Tem versão grátis com limites; recursos extras são pagos.",
  Pago: "Precisa de assinatura ou compra pra usar.",
};

const custoOptions: (IaCusto | "Todos")[] = [
  "Todos",
  "Grátis",
  "Freemium",
  "Pago",
];

type ToolWithCat = IaTool & { categoria: string };

const allTools: ToolWithCat[] = iaTools.flatMap((grupo) =>
  grupo.ferramentas.map((tool) => ({ ...tool, categoria: grupo.grupo })),
);
const totalTools = allTools.length;
const categorias = ["Todas", ...iaTools.map((grupo) => grupo.grupo)];
const niveisCurso = [
  "Todos",
  ...Array.from(new Set(iaCursos.map((curso) => curso.nivel))),
];

const TABS = [
  { id: "Ferramentas", slug: "ferramentas", icon: Wrench },
  { id: "Descubra sua IA", slug: "descubra", icon: Compass },
  { id: "Como usar", slug: "como-usar", icon: Lightbulb },
  { id: "Aprender", slug: "aprender", icon: GraduationCap },
  { id: "Criadores", slug: "criadores", icon: Youtube },
  { id: "Notícias e mercado", slug: "noticias-mercado", icon: Newspaper },
];

const tabCounts: Record<string, number | undefined> = {
  Ferramentas: totalTools,
  "Descubra sua IA": iaQuizOpcoes.length,
  "Como usar": iaPromptTips.length + iaUsageTips.length,
  Aprender: iaCursos.length + iaGlossario.length,
  Criadores: iaCriadores.length,
  "Notícias e mercado": undefined,
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.3 },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Uma ferramenta e "usavel de graca" se e Gratis OU Freemium (tem versao free).
// Normaliza pra tolerar variacoes ("Grátis"/"gratis"/"free"/"Freemium").
function custoEhGratis(custo: string): boolean {
  const c = normalize(custo).trim();
  return c === "gratis" || c === "free" || c === "freemium";
}

function findTool(nome: string) {
  return allTools.find((tool) => tool.nome === nome);
}

function pillClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-black transition-all",
    active
      ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
      : "border-slate-300 bg-white text-slate-700 hover:border-violet-400",
  );
}

function filterClass(active: boolean) {
  return cn(
    "rounded-full border-2 px-3 py-1.5 text-xs font-black transition-all",
    active
      ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
      : "border-slate-300 bg-white text-slate-700 hover:border-violet-400",
  );
}

function BrandLogo({ url, nome }: { url: string; nome: string }) {
  const favicon = getFaviconUrl(url);
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-900 bg-violet-50">
      <Sparkles className="absolute h-4 w-4 text-violet-200" />
      <span className="relative font-display text-sm font-black text-violet-700">
        {nome.charAt(0)}
      </span>
      {favicon ? (
        <img
          src={favicon}
          alt=""
          loading="lazy"
          onError={hideBrokenImage}
          className="absolute inset-0 h-full w-full bg-white object-contain p-1.5"
        />
      ) : null}
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolWithCat }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(tool.url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <motion.div
      {...fadeUp}
      whileHover={{ y: -4 }}
      className="card-brutal flex flex-col rounded-2xl border-t-4 border-t-violet-500 bg-white p-6 transition-shadow duration-200 hover:shadow-[10px_10px_0_#c4b5fd]"
    >
      <div className="flex items-center gap-3">
        <BrandLogo url={tool.url} nome={tool.nome} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-black text-slate-950">
            {tool.nome}
          </h3>
          <p className="truncate text-xs font-bold text-slate-400">
            {tool.empresa}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          title={custoInfo[tool.custo]}
          className={cn(
            "inline-flex cursor-help rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
            costBadge[tool.custo],
          )}
        >
          {tool.custo}
        </span>
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {tool.categoria}
        </span>
        {tool.temPortugues ? (
          <span className="inline-flex rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-black uppercase text-sky-800">
            PT
          </span>
        ) : null}
      </div>
      {tool.embaixadora ? (
        <div className="mt-2">
          <EmbaixadoraBadge program={tool.nome} href={tool.url} />
        </div>
      ) : null}
      <p className="mt-3 text-sm text-slate-600">{tool.paraQueServe}</p>
      <p className="mt-2 flex-1 text-sm text-slate-700">
        <span className="font-black">Quando usar:</span> {tool.quandoUsar}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tool.custo === "Pago" ? (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-black uppercase",
              ac.link,
            )}
          >
            Site oficial <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5"
          >
            Experimente agora <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {tool.docUrl ? (
          <a
            href={tool.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-black uppercase",
              ac.link,
            )}
          >
            <BookOpen className="h-3 w-3" /> Documentação
          </a>
        ) : null}
        {tool.videoUrl ? (
          <a
            href={tool.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-black uppercase",
              ac.link,
            )}
          >
            <Youtube className="h-3 w-3" /> Ver vídeo
          </a>
        ) : null}
        <button
          type="button"
          onClick={copyLink}
          aria-label={`Copiar link de ${tool.nome}`}
          className="ml-auto inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-white px-2 py-1 text-[11px] font-black text-slate-700 transition-all hover:border-violet-400"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copiado" : "Copiar link"}
        </button>
      </div>
    </motion.div>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Bot;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div
        className={cn(
          "rounded-xl border-2 border-violet-700 bg-violet-100 p-3 text-slate-950",
          ac.brutalShadow,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-black text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function GuiaIa() {
  const { isPro } = useSubscription();
  const search = useSearch();
  const [, navigate] = useLocation();
  const matchedTab =
    TABS.find((tab) => tab.slug === new URLSearchParams(search).get("aba"))
      ?.id ?? TABS[0].id;
  const [activeTab, setActiveTab] = useState(matchedTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [categoria, setCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [custoFiltro, setCustoFiltro] = useState<IaCusto | "Todos">("Todos");
  const [ordenar, setOrdenar] = useState<"Relevância" | "A-Z">("Relevância");
  const [surpresa, setSurpresa] = useState<ToolWithCat | null>(null);
  const [nivelCurso, setNivelCurso] = useState("Todos");
  const [quizPick, setQuizPick] = useState<IaQuizOpcao | null>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    setActiveTab(matchedTab);
  }, [matchedTab]);

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function selectTab(id: string) {
    const slug = TABS.find((tab) => tab.id === id)?.slug ?? TABS[0].slug;
    navigate(`/ia?aba=${slug}`, { replace: true });
    setActiveTab(id);
  }

  function onTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const dir = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + TABS.length) % TABS.length;
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  function sortear() {
    const index = Math.floor(Math.random() * allTools.length);
    setSurpresa(allTools[index]);
  }

  function limparFiltros() {
    setBusca("");
    setCategoria("Todas");
    setCustoFiltro("Todos");
    setOrdenar("Relevância");
  }

  const quizTools = quizPick
    ? quizPick.recomendaA
        .map((nome) => findTool(nome))
        .filter((tool): tool is ToolWithCat => Boolean(tool))
    : [];

  const buscaNorm = normalize(busca.trim());
  const toolsFiltrados = allTools.filter((tool) => {
    const matchCategoria = categoria === "Todas" || tool.categoria === categoria;
    const matchCusto =
      custoFiltro === "Todos" ||
      (custoFiltro === "Grátis"
        ? custoEhGratis(tool.custo)
        : tool.custo === custoFiltro);
    const matchBusca =
      !buscaNorm ||
      normalize(tool.nome).includes(buscaNorm) ||
      normalize(tool.empresa).includes(buscaNorm);
    return matchCategoria && matchCusto && matchBusca;
  });
  const toolsOrdenados =
    ordenar === "A-Z"
      ? [...toolsFiltrados].sort((a, b) => a.nome.localeCompare(b.nome))
      : toolsFiltrados;
  const isFiltering =
    Boolean(buscaNorm) ||
    categoria !== "Todas" ||
    custoFiltro !== "Todos" ||
    ordenar === "A-Z";

  const cursosFiltrados =
    nivelCurso === "Todos"
      ? iaCursos
      : iaCursos.filter((curso) => curso.nivel === nivelCurso);

  return (
    <Layout>
      <SEO
        title="Guia de IA para iniciantes: Quais IAs usar e como"
        description="Entenda quais inteligências artificiais existem, pra que serve cada uma, como usar bem e dicas de prompt para estudar e trabalhar em tecnologia."
        keywords={[
          "guia de ia",
          "quais ias usar",
          "chatgpt claude gemini",
          "dicas de prompt",
        ]}
        url="/ia"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="violet"
        eyebrow="seu mapa do mundo da inteligência artificial"
        title="Guia de IA para começar"
        subtitle="Quais IAs existem, pra que serve cada uma, como usar bem e como escrever prompts melhores para estudar e trabalhar em tech."
        actions={
          <>
            <button
              type="button"
              onClick={() => selectTab("Descubra sua IA")}
              className="btn-brutal-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black"
            >
              <Compass className="h-4 w-4" />
              Descobrir minha IA
            </button>
            <button
              type="button"
              onClick={() => {
                selectTab("Ferramentas");
                requestAnimationFrame(() => {
                  document.getElementById("guia-abas")?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  });
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a] transition-all hover:shadow-[4px_4px_0_#0f172a]"
            >
              <Wrench className="h-4 w-4" />
              Ver ferramentas
            </button>
            <Link
              href="/roadmaps?area=ia"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-violet-200 px-5 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:shadow-[4px_4px_0_#0f172a]"
            >
              <Map className="h-4 w-4" />
              Roadmap de IA grátis
            </Link>
          </>
        }
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <motion.div
              {...fadeUp}
              className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2"
            >
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                comece por aqui
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                O que são essas IAs
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                São assistentes treinados em muito texto e código que respondem
                em linguagem natural. Ajudam a estudar, explicar conceitos e
                erros, revisar, rascunhar texto ou código e pesquisar. Pense
                nelas como um apoio rápido, não como uma fonte final de verdade.
              </p>
              <p className="mt-4 text-sm font-bold text-violet-700">
                {isPro
                  ? "Boas-vindas de volta. Os recursos Pro do guia estão liberados."
                  : "Comece de graça e veja o que a IA faz por você."}
              </p>
            </motion.div>
            <motion.div
              {...fadeUp}
              className="card-brutal rounded-2xl bg-violet-100 p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className={cn("h-5 w-5", ac.iconMuted)} />
                <h3 className="font-display text-xl font-black text-slate-950">
                  Antes de confiar
                </h3>
              </div>
              <ul className="space-y-2 text-sm font-bold text-slate-800">
                {iaAvisos.map((aviso) => (
                  <li key={aviso} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        ac.progressFill,
                      )}
                    />
                    <span>{aviso}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div
            id="guia-abas"
            className={cn(
              "sticky top-16 z-30 border-b-2 border-slate-200 py-3",
              ac.contentBg,
            )}
          >
            <div
              role="tablist"
              aria-label="Seções do guia de IA"
              className="flex gap-2 overflow-x-auto snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map((tab, index) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                const count = tabCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${tab.slug}`}
                    aria-selected={active}
                    aria-controls={`panel-${tab.slug}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectTab(tab.id)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    className={cn(pillClass(active), "shrink-0 snap-start")}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.id}
                    {count != null ? (
                      <span className="text-xs font-bold opacity-60">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "Ferramentas" ? (
            <div
              role="tabpanel"
              id="panel-ferramentas"
              aria-labelledby="tab-ferramentas"
              tabIndex={0}
            >
              <SectionTitle
                icon={Bot}
                eyebrow="quais IAs e pra que serve"
                title="Escolha pela tarefa"
                description="As principais IAs por uso. Busque, filtre por custo e ordene."
              />

              <div
                className={cn(
                  "mb-6 rounded-2xl border-2 p-4",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <ul className="space-y-1 text-sm font-bold text-slate-700">
                  <li className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <span>
                      Lembrete: a IA pode errar. Sempre confira o que ela te der
                      antes de usar.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <span>
                      Nunca cole senhas, chaves ou dados de clientes nessas
                      ferramentas.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={sortear}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-200 px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                >
                  <Shuffle className="h-4 w-4" />
                  Me surpreenda
                </button>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {totalTools} ferramentas no guia
                </span>
              </div>

              {surpresa ? (
                <div className="mb-8 rounded-2xl border-2 border-violet-300 bg-violet-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-violet-700">
                      Sugestão da sorte
                    </p>
                    <button
                      type="button"
                      onClick={sortear}
                      className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                    >
                      <Shuffle className="h-3 w-3" />
                      Outra
                    </button>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <ToolCard tool={surpresa} />
                  </div>
                </div>
              ) : null}

              <div className="mb-4 flex flex-col gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar ferramenta por nome..."
                    aria-label="Buscar ferramenta"
                    className="w-full rounded-full border-2 border-slate-300 bg-white py-2 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={filterClass(categoria === cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {custoOptions.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setCustoFiltro(op)}
                      className={filterClass(custoFiltro === op)}
                    >
                      {op}
                    </button>
                  ))}
                  <span className="mx-1 h-5 w-px bg-slate-300" />
                  {(["Relevância", "A-Z"] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOrdenar(op)}
                      className={filterClass(ordenar === op)}
                    >
                      {op}
                    </button>
                  ))}
                  <span className="ml-auto text-xs font-bold text-slate-500">
                    {toolsFiltrados.length}{" "}
                    {toolsFiltrados.length === 1 ? "ferramenta" : "ferramentas"}
                  </span>
                </div>
              </div>

              {toolsFiltrados.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="font-display text-lg font-black text-slate-950">
                    Nada encontrado
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
                    Tente outro termo ou troque os filtros.
                  </p>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {[
                    {
                      titulo: "Tem plano gratuito",
                      descricao: "Dá pra começar sem pagar.",
                      lista: toolsOrdenados.filter(
                        (tool) => tool.custo !== "Pago",
                      ),
                    },
                    {
                      titulo: "Pagas",
                      descricao: "Precisam de assinatura ou compra pra usar.",
                      lista: toolsOrdenados.filter(
                        (tool) => tool.custo === "Pago",
                      ),
                    },
                  ].map((secao) =>
                    secao.lista.length === 0 ? null : (
                      <div key={secao.titulo} className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="h-7 w-1.5 shrink-0 rounded-full bg-violet-600"
                            aria-hidden
                          />
                          <h3 className="font-display text-2xl font-black text-slate-950">
                            {secao.titulo}
                          </h3>
                          <span className="inline-flex rounded-full border-2 border-slate-900 bg-violet-100 px-2.5 py-0.5 text-xs font-black text-violet-800">
                            {secao.lista.length}{" "}
                            {secao.lista.length === 1
                              ? "ferramenta"
                              : "ferramentas"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {secao.descricao}
                        </p>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                          {secao.lista.map((tool) => (
                            <ToolCard key={tool.nome} tool={tool} />
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              <Link
                href="/ferramentas?categoria=IA"
                className={cn(
                  "mt-6 inline-flex items-center gap-1 text-sm font-bold",
                  ac.link,
                  ac.linkHover,
                )}
              >
                Ver a lista completa de ferramentas de IA{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {activeTab === "Descubra sua IA" ? (
            <div
              role="tabpanel"
              id="panel-descubra"
              aria-labelledby="tab-descubra"
              tabIndex={0}
              className="space-y-8"
            >
              <div>
                <SectionTitle
                  icon={Compass}
                  eyebrow="quiz rápido"
                  title="Descubra sua IA"
                  description="Responda uma pergunta e veja qual IA encaixa no que você quer agora."
                />
                <div className="card-brutal rounded-2xl bg-white p-6">
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {iaQuizPergunta}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {iaQuizOpcoes.map((opcao) => (
                      <button
                        key={opcao.rotulo}
                        type="button"
                        onClick={() => setQuizPick(opcao)}
                        className={filterClass(quizPick?.rotulo === opcao.rotulo)}
                      >
                        {opcao.rotulo}
                      </button>
                    ))}
                  </div>
                  {quizPick ? (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-xl border-2 border-violet-200 bg-violet-50 p-4">
                        <p className="text-sm font-bold text-slate-800">
                          <span className="font-black">Dica:</span>{" "}
                          {quizPick.dica}
                        </p>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {quizTools.map((tool) => (
                          <ToolCard key={tool.nome} tool={tool} />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuizPick(null)}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refazer
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="card-brutal rounded-2xl bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Target className={cn("h-6 w-6", ac.iconMuted)} />
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    Escolha pelo objetivo
                  </h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {iaChooseByGoal.map((item) => (
                    <div
                      key={item.objetivo}
                      className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-100 bg-slate-50 p-3"
                    >
                      <span className="text-sm font-bold text-slate-700">
                        {item.objetivo}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-1 text-xs font-black",
                          ac.panelSoft,
                          ac.tbodyAccent,
                        )}
                      >
                        {item.recomendacao}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "Como usar" ? (
            <div
              role="tabpanel"
              id="panel-como-usar"
              aria-labelledby="tab-como-usar"
              tabIndex={0}
              className="space-y-10"
            >
              <div>
                <SectionTitle
                  icon={Lightbulb}
                  eyebrow="laboratório de prompt"
                  title="Pequenas mudanças, respostas bem melhores"
                />
                <div className="grid gap-5 md:grid-cols-2">
                  {iaPromptTips.map((tip) => (
                    <motion.div
                      key={tip.tecnica}
                      {...fadeUp}
                      className="card-brutal rounded-2xl bg-white p-5"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className={cn("h-5 w-5", ac.iconMuted)} />
                        <h3 className="font-display text-lg font-black text-slate-950">
                          {tip.tecnica}
                        </h3>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3">
                          <p className="text-[11px] font-black uppercase text-rose-700">
                            Antes
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {tip.antes}
                          </p>
                        </div>
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-[11px] font-black uppercase text-emerald-700">
                            Depois
                          </p>
                          <p className="mt-1 text-sm text-slate-800">
                            {tip.depois}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-5">
                  <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                    como usar bem
                  </p>
                  <h2 className="font-display text-3xl font-black text-slate-950">
                    Tire mais proveito sem cair em armadilha
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {iaUsageTips.map((tip) => (
                    <article
                      key={tip.titulo}
                      className={cn(
                        "rounded-2xl border-2 p-4",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      <CheckCircle
                        className={cn("mb-2 h-5 w-5", ac.iconMuted)}
                      />
                      <h3 className="font-display text-lg font-black text-slate-950">
                        {tip.titulo}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">{tip.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "Aprender" ? (
            <div
              role="tabpanel"
              id="panel-aprender"
              aria-labelledby="tab-aprender"
              tabIndex={0}
              className="space-y-10"
            >
              <div className="card-brutal flex flex-col gap-4 rounded-2xl bg-violet-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    Siga um caminho montado pra você
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    O roadmap de IA reúne o que estudar e em qual ordem, de
                    graça.
                  </p>
                </div>
                <Link
                  href="/roadmaps?area=ia"
                  className="btn-brutal-accent inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-black"
                >
                  <Map className="h-4 w-4" />
                  Ver roadmap de IA (grátis)
                </Link>
              </div>

              <div>
                <SectionTitle
                  icon={GraduationCap}
                  eyebrow="pra ir além"
                  title="Cursos pra aprender IA"
                  description="Materiais gratuitos pra entender e usar IA, do zero ao intermediário."
                />
                <div className="mb-5 flex flex-wrap gap-2">
                  {niveisCurso.map((nivel) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => setNivelCurso(nivel)}
                      className={filterClass(nivelCurso === nivel)}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {cursosFiltrados.map((curso) => (
                    <motion.div
                      key={curso.nome}
                      {...fadeUp}
                      whileHover={{ y: -4 }}
                      className="card-brutal flex flex-col rounded-2xl bg-white p-5 transition-shadow duration-200 hover:shadow-[8px_8px_0_#c4b5fd]"
                    >
                      <div className="flex items-center gap-3">
                        <BrandLogo url={curso.url} nome={curso.fonte} />
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-black text-slate-950">
                            {curso.nome}
                          </h3>
                          <p className="truncate text-xs font-bold text-slate-400">
                            {curso.fonte}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                            costBadge.Freemium,
                          )}
                        >
                          {curso.nivel}
                        </span>
                        {curso.gratuito ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                              costBadge.Grátis,
                            )}
                          >
                            Grátis
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 flex-1 text-sm text-slate-600">
                        {curso.resumo}
                      </p>
                      <a
                        href={curso.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
                          ac.link,
                        )}
                      >
                        Acessar curso <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle
                  icon={BookOpen}
                  eyebrow="fala a língua da IA"
                  title="Glossário de IA"
                  description="Os termos que mais aparecem, explicados sem complicar."
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {iaGlossario.map((item) => (
                    <div
                      key={item.termo}
                      className={cn(
                        "rounded-2xl border-2 p-4",
                        ac.panelBorder,
                        ac.panelSoft,
                      )}
                    >
                      <p className="font-display text-sm font-black text-slate-950">
                        {item.termo}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.definicao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "Criadores" ? (
            <div
              role="tabpanel"
              id="panel-criadores"
              aria-labelledby="tab-criadores"
              tabIndex={0}
            >
              <SectionTitle
                icon={Youtube}
                eyebrow="quem acompanhar"
                title="Criadores e vídeos sobre IA"
                description="Canais que ajudam a entender IA, das bases às novidades."
              />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {iaCriadores.map((criador) => (
                  <motion.div
                    key={criador.nome}
                    {...fadeUp}
                    whileHover={{ y: -4 }}
                    className="card-brutal flex flex-col rounded-2xl bg-white p-5 transition-shadow duration-200 hover:shadow-[8px_8px_0_#c4b5fd]"
                  >
                    <div className="flex items-center gap-3">
                      <BrandLogo url={criador.url} nome={criador.nome} />
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-lg font-black text-slate-950">
                          {criador.nome}
                        </h3>
                        <p className="truncate text-xs font-bold text-slate-400">
                          {criador.plataforma}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-slate-600">
                      {criador.foco}
                    </p>
                    <a
                      href={criador.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
                        ac.link,
                      )}
                    >
                      Ver canal <ExternalLink className="h-3 w-3" />
                    </a>
                  </motion.div>
                ))}
              </div>
              <div
                className={cn(
                  "mt-6 rounded-2xl border-2 p-5",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <p className="text-sm text-slate-600">
                  A curadoria de criadores brasileiros de IA é editorial e está
                  sendo montada com cuidado pela equipe. Em breve mais nomes
                  daqui aparecem nesta lista.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "Notícias e mercado" ? (
            <div
              role="tabpanel"
              id="panel-noticias-mercado"
              aria-labelledby="tab-noticias-mercado"
              tabIndex={0}
              className="grid gap-5 lg:grid-cols-2"
            >
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Newspaper className={cn("h-6 w-6", ac.iconMuted)} />
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    Notícias de IA em tempo real
                  </h2>
                </div>
                {isPro ? (
                  <div className="card-brutal flex h-full flex-col rounded-2xl bg-white p-6">
                    <p className="text-sm text-slate-600">
                      Todas as notícias de IA reunidas num só lugar, atualizadas
                      em tempo real.
                    </p>
                    <Link
                      href="/noticias"
                      className="btn-brutal-accent mt-5 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-black"
                    >
                      Ver notícias de IA em tempo real
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-sm font-bold text-violet-700">
                      No Pro: notícias de IA em tempo real, sem limite.
                    </p>
                    <ProGate description="Aqui ficam todas as notícias de IA num só lugar. Assine o Pro e acompanhe tudo em tempo real, sem limite." />
                  </div>
                )}
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className={cn("h-6 w-6", ac.iconMuted)} />
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    Mercado e bolsa de IA
                  </h2>
                </div>
                {isPro ? (
                  <div className="card-brutal flex h-full flex-col rounded-2xl bg-white p-6">
                    <p className="text-sm text-slate-600">
                      Painel de mercado de IA em tempo real: em breve.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-sm font-bold text-violet-700">
                      No Pro: mercado e bolsa de IA, com valores e variações.
                    </p>
                    <ProGate description="No Pro você acompanha o mercado e as bolsas das empresas de IA: valores, variações e destaques. Chegando em breve." />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {showTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-300 text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:shadow-[4px_4px_0_#0f172a]"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </Layout>
  );
}
