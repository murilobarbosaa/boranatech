import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle,
  ExternalLink,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  iaAvisos,
  iaChooseByGoal,
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

export default function GuiaIa() {
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
        eyebrow="apoio com inteligência artificial"
        title="Guia de IA para começar"
        subtitle="Quais IAs existem, pra que serve cada uma, como usar bem e como escrever prompts melhores para estudar e trabalhar em tech."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2">
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
            </div>
            <div className="card-brutal rounded-2xl bg-violet-100 p-6">
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
            <div className="space-y-8">
              {iaTools.map((grupo) => (
                <div key={grupo.grupo} className="space-y-4">
                  <div>
                    <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                      {grupo.grupo}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {grupo.descricao}
                    </p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {grupo.ferramentas.map((tool) => (
                      <div
                        key={tool.nome}
                        className="card-brutal flex flex-col rounded-2xl bg-white p-5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                              costBadge[tool.custo],
                            )}
                          >
                            {tool.custo}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {tool.empresa}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-xl font-black text-slate-950">
                          {tool.nome}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
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
                      </div>
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
                  dicas de prompt
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Pequenas mudanças, respostas bem melhores
                </h2>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {iaPromptTips.map((tip) => (
                <div
                  key={tip.tecnica}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn("h-5 w-5", ac.iconMuted)} />
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {tip.tecnica}
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2">
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
                </div>
              ))}
            </div>
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
        </div>
      </section>
    </Layout>
  );
}
