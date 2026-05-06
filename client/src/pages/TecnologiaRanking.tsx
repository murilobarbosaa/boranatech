import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BarChart3, ExternalLink, Sparkles, Trophy } from "lucide-react";
import Layout from "@/components/Layout";
import TechnologyLogo from "@/components/TechnologyLogo";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { technologyRanking } from "@/lib/technologyData";
import { getTechnologyRanking } from "@/services/contentService";

const ac = getPageAccentUi("amber");

function podiumEmoji(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

export default function TecnologiaRanking() {
  const [ranking, setRanking] = useState(technologyRanking);

  useEffect(() => {
    getTechnologyRanking().then(setRanking).catch(() => setRanking(technologyRanking));
  }, []);

  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="dados públicos 📊"
        title="🏆 Ranking de Tecnologias"
        subtitle="Visualize popularidade com contexto: percentuais do Stack Overflow quando existem, e curadoria honesta quando o dado não é comparável — tudo com logos e links."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className={cn("mb-8 rounded-2xl border-2 border-slate-900 p-5 shadow-[4px_4px_0_#0f172a]", ac.panelSoft)}>
            <div className="flex flex-wrap items-start gap-3">
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-[3px_3px_0_#0f172a] ring-2 ring-slate-900">
                <Sparkles className="h-4 w-4" aria-hidden /> Dica
              </span>
              <p className="min-w-[200px] flex-1 text-sm font-medium text-slate-700">
                Passe o mouse nas linhas (desktop) para ver o badge de demanda projetada e animações suaves.
                Nos cards mobile, cada tech abre a página detalhada com um toque no nome.
              </p>
              <BarChart3 className="hidden h-10 w-10 shrink-0 text-amber-800 opacity-90 sm:block" aria-hidden />
            </div>
            <h2 className="mt-5 font-display text-lg font-black text-slate-950">Fonte das informações</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              O ranking ordena primeiro por uso declarado quando há percentuais do{" "}
              <a href="https://survey.stackoverflow.co/2024/technology/" target="_blank" rel="noreferrer" className={cn("font-black underline", ac.link)}>
                Stack Overflow Developer Survey 2024
              </a>
              , combinando quando útil com o{" "}
              <a href="https://github.blog/news-insights/octoverse/octoverse-2024/" target="_blank" rel="noreferrer" className={cn("font-black underline", ac.link)}>
                GitHub Octoverse 2024
              </a>
              .
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Importante: indicadores públicos não medem vagas no Brasil — são contexto para explorar tecnologias.
            </p>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border-2 border-slate-900 bg-white md:block md:shadow-[4px_4px_0_#0f172a]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className={cn(ac.tableBanner)}>
                <tr>
                  <th className="p-4 text-left">Podium</th>
                  <th className="p-4 text-left">Tecnologia</th>
                  <th className="p-4 text-left">Indicador público</th>
                  <th className="p-4 text-left">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((technology, index) => {
                  const podium = podiumEmoji(technology.position);
                  return (
                    <tr
                      key={technology.slug}
                      style={{ animationDelay: `${Math.min(index * 22, 640)}ms` }}
                      title={`Demanda projetada na base BORA NA TECH?: ${technology.demand}`}
                      className={cn(
                        "tech-ranking-row group border-t-2 border-slate-100 transition-colors hover:bg-amber-50/60",
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-display">
                          <span className="text-lg" aria-hidden>
                            {podium ?? "·"}
                          </span>
                          <span className="font-black tabular-nums">
                            #{technology.position}
                          </span>
                          {technology.position <= 3 ? (
                            <Trophy className="hidden h-4 w-4 text-amber-800 opacity-70 group-hover:opacity-100 lg:inline" aria-hidden />
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <TechnologyLogo
                            name={technology.name}
                            icon={technology.icon}
                            logoUrl={technology.logoUrl}
                            className="h-11 w-11 shrink-0"
                            imageClassName="h-7 w-7 p-1"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/tecnologias/${technology.slug}`}
                              className="font-bold text-violet-900 underline-offset-4 hover:underline"
                            >
                              {technology.name}
                            </Link>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-800 ring-1 ring-slate-300">
                                {technology.category}
                              </span>
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-black ring-1",
                                technology.demand === "Alta" && "bg-emerald-100 text-emerald-950 ring-emerald-900/40",
                                technology.demand === "Média" && "bg-amber-100 text-amber-950 ring-amber-900/40",
                                technology.demand === "Baixa" && "bg-slate-100 text-slate-800 ring-slate-400",
                              )}>
                                ⚡ {technology.demand}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-950">{technology.usageLabel || "Sem percentual comparável"}</span>
                        {technology.sourceNote ? <span className="mt-1 block text-xs text-slate-500">{technology.sourceNote}</span> : null}
                      </td>
                      <td className="p-4 align-top">
                        {technology.sourceUrl ? (
                          <a
                            href={technology.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("inline-flex items-center gap-1 font-black underline decoration-2 underline-offset-2", ac.link)}
                          >
                            {technology.sourceName}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          </a>
                        ) : (
                          <span className="font-medium">{technology.sourceName || "Fonte não informada"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {ranking.map((technology, index) => {
              const podium = podiumEmoji(technology.position);
              return (
                <article
                  key={technology.slug}
                  style={{ animationDelay: `${Math.min(index * 42, 600)}ms` }}
                  className="tech-ranking-card tech-ranking-card--mobile rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <TechnologyLogo
                        name={technology.name}
                        icon={technology.icon}
                        logoUrl={technology.logoUrl}
                        className="h-12 w-12"
                        imageClassName="h-8 w-8"
                      />
                      <span className="text-xl" aria-hidden>{podium ?? "🏅"}</span>
                      <span className="font-display font-black tabular-nums text-sm">#{technology.position}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/tecnologias/${technology.slug}`} className="font-display text-base font-black text-violet-900 underline-offset-4 hover:underline">
                        {technology.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide">
                        <span className="rounded-full bg-slate-100 px-2 py-1 ring-1 ring-slate-300">{technology.category}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-950 ring-1 ring-amber-900/40">
                          ⚡ {technology.demand}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-900">{technology.usageLabel || "Sem percentual comparável"}</p>
                      {technology.sourceNote ? <p className="mt-1 text-xs text-slate-500">{technology.sourceNote}</p> : null}
                      <div className="mt-3">
                        {technology.sourceUrl ? (
                          <a
                            href={technology.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("inline-flex items-center gap-1 text-sm font-black underline", ac.link)}
                          >
                            {technology.sourceName}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-slate-700">{technology.sourceName || "Fonte não informada"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
