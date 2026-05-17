/*
  BORA NA TECH? — Area Detail Page
  Style: Neo-Brutalism Suavizado
  - Full area info: description, tasks, skills, tools, roadmap, projects
*/

import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Clock, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import { areasTI } from "@/lib/data";
import { companies } from "@/lib/companyData";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { influencerTips } from "@/lib/platformData";
import { technologies } from "@/lib/technologyData";
import { cn } from "@/lib/utils";
import { getArea } from "@/services/contentService";

function DifficultyBar({ level, fillClass }: { level: number; fillClass: string }) {
  const labels = ["", "Muito fácil", "Fácil", "Médio", "Difícil", "Muito difícil"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn("h-2 w-6 rounded-full", i <= level ? fillClass : "bg-slate-200")} />
        ))}
      </div>
      <span className="text-sm text-slate-600">{labels[level]}</span>
    </div>
  );
}

export default function AreaDetalhe() {
  const params = useParams<{ slug: string }>();
  const [area, setArea] = useState(() => areasTI.find((a) => a.slug === params.slug) || null);

  useEffect(() => {
    if (!params.slug) return;
    const localRoadmapStatus = areasTI.find((a) => a.slug === params.slug)?.roadmapStatus;
    getArea(params.slug)
      .then((fetched) => setArea(fetched ? { ...fetched, roadmapStatus: localRoadmapStatus } : null))
      .catch(() => setArea(areasTI.find((a) => a.slug === params.slug) || null));
  }, [params.slug]);

  if (!area) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Área não encontrada</h1>
          <p className="text-slate-950 mb-6">Essa área não existe ou foi removida.</p>
          <Link href="/areas" className="inline-flex items-center gap-2 font-medium text-violet-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para áreas
          </Link>
        </div>
      </Layout>
    );
  }

  const accent = accentForAreaSlug(area.slug);
  const ac = getPageAccentUi(accent);
  const influencer = influencerTips[area.id] || influencerTips.default;

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow="Área de TI"
        title={area.nome}
        subtitle={area.descricaoCurta}
        topSlot={
          <Link href="/areas" className={cn("inline-flex items-center gap-2 text-sm font-bold", ac.link, ac.linkHover)}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todas as áreas
          </Link>
        }
        titlePrefix={
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white text-5xl shadow-[4px_4px_0_#0f172a]" aria-hidden>
            {area.emoji}
          </span>
        }
        actions={<FavoriteButton item={{ id: area.id, type: "area", title: area.nome, subtitle: area.descricaoCurta }} />}
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* O que é */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">O que é {area.nome}?</h2>
              <p className="text-slate-700 leading-relaxed">{area.descricaoCompleta}</p>
            </div>

            {/* O que faz */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">O que a pessoa faz na prática?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">{area.oQueFaz}</p>
              <h3 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">Tarefas do dia a dia:</h3>
              <ul className="space-y-2">
                {area.tarefasDiarias.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)} aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Perfil */}
            <div className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">Quem combina com essa área?</h2>
              <p className="text-slate-700">{area.perfilIndicado}</p>
            </div>

            <div className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
              <h2 className="font-display mb-4 text-xl font-bold text-slate-900">Dica de influenciador da área</h2>
              <div className="flex items-center gap-4">
                <img src={influencer.photo} alt={influencer.name} className="h-16 w-16 rounded-full border-2 border-slate-900 object-cover shadow-[3px_3px_0_#0f172a]" />
                <div>
                  <p className="font-display font-black text-slate-950">{influencer.name}</p>
                  <p className={cn("text-sm font-bold", ac.tbodyAccentBold)}>{influencer.handle}</p>
                  <p className="mt-2 text-sm text-slate-700">{influencer.tip}</p>
                </div>
              </div>
            </div>

            {/* Roadmap */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Roadmap inicial</h2>
              <div className="space-y-3">
                {area.roadmapInicial.map((etapa, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-white", ac.tableBanner)}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-700 pt-1">{etapa}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link href={`/roadmaps?area=${area.slug}`} className={cn("flex items-center gap-1 text-sm font-medium", ac.link, ac.linkHover)}>
                  Ver roadmaps completos <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Projetos */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Projetos simples para praticar</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {area.projetos.map((p, i) => (
                  <div key={i} className={cn("rounded-lg border-2 p-3 text-sm font-medium text-slate-800", ac.panelBorder, ac.panelSoft)}>
                    {p}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link href="/projetos" className={cn("flex items-center gap-1 text-sm font-medium", ac.link, ac.linkHover)}>
                  Ver todos os projetos <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Dicas */}
            <div className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
              <div className="flex items-start gap-3">
                <Lightbulb className={cn("mt-0.5 h-5 w-5 shrink-0", ac.iconMuted)} aria-hidden />
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Dica para começar</h2>
                  <p className="text-slate-700 text-sm">{area.dicasIniciais}</p>
                </div>
              </div>
            </div>

            {/* Termos */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Termos essenciais</h2>
              <div className="flex flex-wrap gap-2">
                {area.termosEssenciais.map((t) => (
                  <div key={t} className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    <span className="font-mono">{t}</span>
                    <FavoriteButton compact item={{ id: t.toLowerCase().replace(/\s+/g, "-"), type: "conceito", title: t, subtitle: area.nome }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-bold text-slate-900">Tecnologias desta área</h2>
              <div className="flex flex-wrap gap-2">
                {technologies
                  .filter((technology) => technology.areas.includes(area.slug))
                  .slice(0, 12)
                  .map((technology) => (
                    <Link key={technology.slug} href={`/tecnologias/${technology.slug}`} className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-black", ac.panelBorder, ac.panelSoft, ac.tbodyAccentBold)}>
                      {technology.name}
                    </Link>
                  ))}
              </div>
            </div>

            <div className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-bold text-slate-900">Empresas que contratam para esta área</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {companies
                  .filter((company) => company.areas.includes(area.slug))
                  .slice(0, 4)
                  .map((company) => (
                    <Link key={company.slug} href={`/empresas/${company.slug}`} className={cn("rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-colors", ac.cardHover)}>
                      <span className="font-display block font-black text-slate-950">{company.name}</span>
                      <span className="text-sm font-medium text-slate-600">{company.segment} • {company.city}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Info */}
            <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder, ac.panelSoft)}>
              <h3 className={cn("font-display mb-4 text-lg font-bold", ac.tbodyAccentBold)}>Resumo rápido</h3>
              <div className="space-y-3 text-sm text-slate-900">
                <div>
                  <p className={cn("mb-1 text-xs uppercase tracking-wide", ac.iconMuted)}>Dificuldade para iniciantes</p>
                  <DifficultyBar level={area.dificuldade} fillClass={ac.progressFill} />
                </div>
                <div>
                  <p className={cn("mb-1 text-xs uppercase tracking-wide", ac.iconMuted)}>Faixa salarial (estágio/trainee/júnior)</p>
                  <p className="text-sm font-medium">{area.faixaSalarial}</p>
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display font-semibold text-slate-900 mb-3">Habilidades importantes</h3>
              <div className="flex flex-wrap gap-2">
                {area.habilidades.map((h) => (
                  <span key={h} className={cn("rounded-full px-2 py-1 text-xs", ac.tag)}>
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Ferramentas */}
            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display font-semibold text-slate-900 mb-3">Ferramentas comuns</h3>
              <div className="flex flex-wrap gap-2">
                {area.ferramentas.map((f) => (
                  <span key={f} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200 font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Cargos */}
            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display font-semibold text-slate-900 mb-3">Possíveis cargos</h3>
              <ul className="space-y-1.5">
                {area.cargos.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ac.progressFill)} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cursos */}
            <div className={cn("card-brutal rounded-xl border-2 p-5", ac.panelBorder, ac.panelSoft)}>
              <h3 className="font-display font-semibold text-slate-900 mb-3">Cursos recomendados</h3>
              <ul className="space-y-2">
                {area.cursosGratuitos.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)} aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
              <Link href="/cursos" className={cn("mt-3 inline-flex items-center gap-1 text-xs font-medium", ac.link, ac.linkHover)}>
                Ver todos os cursos <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* CTA */}
            {area.roadmapStatus === "coming-soon" ? (
              <div className="card-brutal rounded-xl border-2 border-slate-300 bg-white p-5 opacity-80">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-100 shadow-[2px_2px_0_#cbd5e1]">
                    <Clock className="h-5 w-5 text-slate-500" strokeWidth={2.5} aria-hidden />
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">Roadmap em construção</p>
                </div>
                <p className="mb-3 text-xs font-medium text-slate-600">
                  Estamos preparando uma trilha caprichada para essa área. Volte em breve.
                </p>
                <span className="block rounded-lg border-2 border-dashed border-slate-400 bg-slate-50 py-2.5 text-center text-sm font-black uppercase tracking-wider text-slate-500">
                  Em breve
                </span>
              </div>
            ) : (
              <div className={cn("card-brutal rounded-xl border-2 p-5", ac.panelBorder, ac.panelSoft)}>
                <div className="mb-3 flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]", ac.tableBanner)}>
                    <Sparkles className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">Pronta para começar?</p>
                </div>
                <Link
                  href={`/roadmaps?area=${area.slug}`}
                  className="btn-brutal-accent block rounded-lg py-2.5 text-center text-sm font-black"
                >
                  Ver roadmap completo
                </Link>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>
    </Layout>
  );
}
