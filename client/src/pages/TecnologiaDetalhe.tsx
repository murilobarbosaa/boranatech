import { Link, useParams, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, ExternalLink, Quote } from "lucide-react";
import Layout from "@/components/Layout";
import DifficultyMeter from "@/components/shared/DifficultyMeter";
import PageHero from "@/components/shared/PageHero";
import TechnologyLogo from "@/components/TechnologyLogo";
import { areasTI } from "@/lib/data";
import { accentForTechnology } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { technologies } from "@/lib/technologyData";
import { cn } from "@/lib/utils";
import { getTechnology } from "@/services/contentService";

export default function TecnologiaDetalhe() {
  const params = useParams<{ slug: string }>();
  const search = useSearch();
  const fromSlug = new URLSearchParams(search).get("from");
  const fromArea = fromSlug ? areasTI.find((area) => area.slug === fromSlug) : undefined;
  const [technology, setTechnology] = useState(() => technologies.find((item) => item.slug === params.slug) || null);

  useEffect(() => {
    if (!params.slug) return;
    getTechnology(params.slug).then(setTechnology).catch(() => setTechnology(technologies.find((item) => item.slug === params.slug) || null));
  }, [params.slug]);

  if (!technology) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl font-black text-slate-950">Tecnologia não encontrada</h1>
          <Link href="/tecnologias" className="mt-4 inline-flex items-center gap-2 font-bold text-violet-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </Layout>
    );
  }

  const accent = accentForTechnology(technology);
  const ac = getPageAccentUi(accent);

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow={technology.category}
        title={technology.name}
        subtitle={technology.description}
        topSlot={
          fromArea ? (
            <Link href={`/tecnologias/por-area?area=${fromArea.slug}`} className={cn("inline-flex items-center gap-2 text-sm font-bold", ac.link, ac.linkHover)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar para {fromArea.nome}
            </Link>
          ) : (
            <Link href="/tecnologias" className={cn("inline-flex items-center gap-2 text-sm font-bold", ac.link, ac.linkHover)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Todas as tecnologias
            </Link>
          )
        }
        titlePrefix={
          <TechnologyLogo
            name={technology.name}
            icon={technology.icon}
            logoUrl={technology.logoUrl}
            className={cn("h-16 w-16 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0_#0f172a]", ac.logoTint, "bg-white")}
            imageClassName="h-10 w-10"
          />
        }
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            <main className="space-y-8 lg:col-span-2">
              <section className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h2 className="font-display text-xl font-black text-slate-950">O que é {technology.name}?</h2>
                <p className="mt-3 text-slate-700">
                  {technology.description} Na prática, ela vira uma peça do repertório profissional para construir produtos, automatizar processos e resolver
                  demandas reais.
                </p>
              </section>
              <section className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h2 className="font-display text-xl font-black text-slate-950">Pra que serve na prática?</h2>
                <ul className="mt-4 space-y-2">
                  {technology.useCases.map((item) => (
                    <li key={item} className={cn("flex gap-2 text-sm text-slate-700")}>
                      <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)} aria-hidden /> {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h2 className="font-display text-xl font-black text-slate-950">Quais áreas usam essa tecnologia?</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {technology.areas.map((slug) => {
                    const area = areasTI.find((item) => item.slug === slug);
                    return (
                      <Link
                        key={slug}
                        href={`/areas/${slug}`}
                        className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-black shadow-sm hover:opacity-95", ac.tag)}
                      >
                        {area?.nome || slug}
                      </Link>
                    );
                  })}
                </div>
              </section>
              <section className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h2 className="font-display text-xl font-black text-slate-950">Como aprender do zero</h2>
                <div className="mt-4 space-y-3">
                  {technology.learningPath.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black",
                          ac.tableBanner,
                        )}
                      >
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm font-medium text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className={cn("card-brutal rounded-xl border-2 bg-amber-50 p-6 border-amber-300")}>
                <Quote className="mb-3 h-6 w-6 text-amber-600" aria-hidden />
                <h2 className="font-display text-xl font-black text-slate-950">Dica de quem usa no dia a dia</h2>
                <p className="mt-2 text-slate-700">{technology.dailyTip}</p>
              </section>
            </main>

            <aside className="space-y-5">
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder, ac.panelSoft)}>
                <h3 className={cn("font-display mb-4 text-lg font-black", ac.tbodyAccentBold)}>Resumo rápido</h3>
                <DifficultyMeter value={technology.difficultyScore} label="Dificuldade para iniciantes" />
                <div className="mt-5">
                  <p className={cn("text-xs font-black uppercase", ac.progressLabel)}>Faixa salarial</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{technology.salaryRange}</p>
                </div>
              </div>
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
                <h3 className="font-display font-black text-slate-950">Tecnologias que combinam</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {technology.combinesWith.map((slug) => {
                    const item = technologies.find((candidate) => candidate.slug === slug);
                    return item ? (
                      <Link key={slug} href={`/tecnologias/${slug}`} className={cn("rounded-full px-2 py-1 text-xs font-bold", ac.tag)}>
                        {item.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
                <h3 className="font-display font-black text-slate-950">Ferramentas que usam essa tecnologia</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {technology.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
              <div className="card-brutal rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
                <h3 className="font-display font-black text-slate-950">Cursos gratuitos recomendados</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {technology.courses.map((course) => (
                    <li key={course}>{course}</li>
                  ))}
                </ul>
                <Link href="/cursos" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline">
                  Ver cursos <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </div>
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
                <h3 className="font-display font-black text-slate-950">Empresas, produtos e jogos que usam</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {technology.companies.map((company) => (
                    <span key={company} className={cn("rounded-full px-2 py-1 text-xs font-bold", ac.tag)}>
                      {company}
                    </span>
                  ))}
                  {technology.games?.map((game) => (
                    <span key={game} className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
                      {game}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
