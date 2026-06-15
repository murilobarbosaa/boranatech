import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle,
  Compass,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Map,
  Newspaper,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
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

const allTools = iaTools.flatMap((grupo) => grupo.ferramentas);
const totalTools = allTools.length;
const categorias = ["Todas", ...iaTools.map((grupo) => grupo.grupo)];

const TABS = [
  { id: "Ferramentas", icon: Wrench },
  { id: "Descubra sua IA", icon: Compass },
  { id: "Como usar", icon: Lightbulb },
  { id: "Aprender", icon: GraduationCap },
  { id: "Criadores", icon: Youtube },
  { id: "Notícias e mercado", icon: Newspaper },
];

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.3 },
};

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

function ToolCard({ tool }: { tool: IaTool }) {
  return (
    <motion.div
      {...fadeUp}
      whileHover={{ y: -4 }}
      className="card-brutal flex flex-col rounded-2xl bg-white p-5"
    >
      <div className="flex items-center gap-3">
        <BrandLogo url={tool.url} nome={tool.nome} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-black text-slate-950">
            {tool.nome}
          </h3>
          <p className="truncate text-xs font-bold text-slate-400">
            {tool.empresa}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "mt-3 inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
          costBadge[tool.custo],
        )}
      >
        {tool.custo}
      </span>
      <p className="mt-3 text-sm text-slate-600">{tool.paraQueServe}</p>
      <p className="mt-2 flex-1 text-sm text-slate-700">
        <span className="font-black">Quando usar:</span> {tool.quandoUsar}
      </p>
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
          ac.link,
        )}
      >
        Site oficial <ExternalLink className="h-3 w-3" />
      </a>
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
  const [activeTab, setActiveTab] = useState("Ferramentas");
  const [categoria, setCategoria] = useState("Todas");
  const [quizPick, setQuizPick] = useState<IaQuizOpcao | null>(null);

  const visibleGroups =
    categoria === "Todas"
      ? iaTools
      : iaTools.filter((grupo) => grupo.grupo === categoria);

  const quizTools = quizPick
    ? quizPick.recomendaA
        .map((nome) => findTool(nome))
        .filter((tool): tool is IaTool => Boolean(tool))
    : [];

  return (
    <Layout>
      <SEO
        title="Guia de IA para iniciantes - Quais IAs usar e como"
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
              onClick={() => setActiveTab("Descubra sua IA")}
              className="btn-brutal-accent inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black"
            >
              <Compass className="h-4 w-4" />
              Descobrir minha IA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Ferramentas")}
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
            role="tablist"
            aria-label="Seções do guia de IA"
            className="flex flex-wrap gap-2"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={pillClass(active)}
                >
                  <Icon className="h-4 w-4" />
                  {tab.id}
                </button>
              );
            })}
          </div>

          {activeTab === "Ferramentas" ? (
            <div>
              <SectionTitle
                icon={Bot}
                eyebrow="quais IAs e pra que serve"
                title="Escolha pela tarefa"
                description="As principais IAs agrupadas por uso. Filtre por categoria pra achar rápido."
              />
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                <Sparkles className="h-4 w-4 text-violet-500" />
                {totalTools} ferramentas no guia
              </div>
              <div className="mb-6 flex flex-wrap gap-2">
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
              <div className="space-y-8">
                {visibleGroups.map((grupo) => (
                  <div key={grupo.grupo} className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                        {grupo.grupo}
                      </p>
                      <span className="text-xs font-bold text-slate-400">
                        {grupo.ferramentas.length}{" "}
                        {grupo.ferramentas.length === 1
                          ? "ferramenta"
                          : "ferramentas"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{grupo.descricao}</p>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {grupo.ferramentas.map((tool) => (
                        <ToolCard key={tool.nome} tool={tool} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
            <div className="space-y-8">
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
                        className={filterClass(
                          quizPick?.rotulo === opcao.rotulo,
                        )}
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
            <div className="space-y-10">
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
            <div className="space-y-10">
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
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {iaCursos.map((curso) => (
                    <motion.div
                      key={curso.nome}
                      {...fadeUp}
                      whileHover={{ y: -4 }}
                      className="card-brutal flex flex-col rounded-2xl bg-white p-5"
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
            <div>
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
                    className="card-brutal flex flex-col rounded-2xl bg-white p-5"
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
            <div className="grid gap-5 lg:grid-cols-2">
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
                  <ProGate description="Aqui ficam todas as notícias de IA num só lugar. Assine o Pro e acompanhe tudo em tempo real, sem limite." />
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
                  <ProGate description="No Pro você acompanha o mercado e as bolsas das empresas de IA: valores, variações e destaques. Chegando em breve." />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}
