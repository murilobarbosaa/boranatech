import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Newspaper,
  Sparkles,
  Target,
  TrendingUp,
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
  iaCursos,
  iaGlossario,
  iaPromptTips,
  iaTools,
  iaUsageTips,
  type IaCusto,
} from "@/lib/iaGuideData";

const ac = getPageAccentUi("violet");

const costBadge: Record<IaCusto, string> = {
  Grátis: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Freemium: "border-violet-300 bg-violet-50 text-violet-800",
  Pago: "border-slate-300 bg-slate-100 text-slate-700",
};

const totalTools = iaTools.reduce(
  (sum, grupo) => sum + grupo.ferramentas.length,
  0,
);

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.3 },
};

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

export default function GuiaIa() {
  const { isPro } = useSubscription();

  return (
    <Layout>
      <SEO
        title="Guia de IA para iniciantes — Quais IAs usar e como"
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
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-12">
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

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-violet-700 bg-violet-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  quais IAs e pra que serve
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Escolha pela tarefa
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  As principais IAs agrupadas por uso. Para a lista completa de
                  ferramentas, veja a categoria IA em Ferramentas.
                </p>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_#0f172a]">
                {totalTools} ferramentas
              </span>
              {iaTools.map((grupo) => (
                <a
                  key={grupo.grupo}
                  href={`#grupo-${grupo.grupo}`}
                  className={cn(
                    "rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors",
                    ac.panelBorder,
                    ac.panelSoft,
                    ac.linkHover,
                  )}
                >
                  {grupo.grupo}
                </a>
              ))}
            </div>
            <div className="space-y-8">
              {iaTools.map((grupo) => (
                <div
                  key={grupo.grupo}
                  id={`grupo-${grupo.grupo}`}
                  className="scroll-mt-24 space-y-4"
                >
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
                      <motion.div
                        key={tool.nome}
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
                        <p className="mt-3 text-sm text-slate-600">
                          {tool.paraQueServe}
                        </p>
                        <p className="mt-2 flex-1 text-sm text-slate-700">
                          <span className="font-black">Quando usar:</span>{" "}
                          {tool.quandoUsar}
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

          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className={cn("h-6 w-6", ac.iconMuted)} />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Qual IA escolher por objetivo
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

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-violet-700 bg-violet-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  laboratório de prompt
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Pequenas mudanças, respostas bem melhores
                </h2>
              </div>
            </div>
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
                      <p className="mt-1 text-sm text-slate-700">{tip.antes}</p>
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
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-violet-700 bg-violet-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  fala a língua da IA
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Glossário de IA
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Os termos que mais aparecem, explicados sem complicar.
                </p>
              </div>
            </div>
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

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-violet-700 bg-violet-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  pra ir além
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Cursos pra aprender IA
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Materiais gratuitos pra entender e usar IA, do zero ao
                  intermediário.
                </p>
              </div>
            </div>
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
                  <CheckCircle className={cn("mb-2 h-5 w-5", ac.iconMuted)} />
                  <h3 className="font-display text-lg font-black text-slate-950">
                    {tip.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{tip.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
