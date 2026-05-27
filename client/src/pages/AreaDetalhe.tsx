/*
  BORA NA TECH? — Area Detail Page
  Style: Neo-Brutalism Suavizado
  Estrutura em 4 zonas: Hero+Stats, Entendimento, Como começar, Aprofundamento + sidebar sticky.
*/

import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import TechnologyLogo from "@/components/TechnologyLogo";
import { AreaIconBox } from "@/components/areas/AreaIconBox";
import PageHero from "@/components/shared/PageHero";
import { areasTI, cursosGratuitos, faculdades, type AreaTI } from "@/lib/data";
import { companies } from "@/lib/companyData";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { technologies } from "@/lib/technologyData";
import { cn } from "@/lib/utils";
import { getArea } from "@/services/contentService";

function DifficultyDots({ level, fillClass }: { level: number; fillClass: string }) {
  const labels = ["", "Muito fácil", "Fácil", "Médio", "Difícil", "Muito difícil"];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full border border-slate-300",
              i <= level ? fillClass : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700">{labels[level]}</span>
    </div>
  );
}

function GraduationChip({ value }: { value: NonNullable<AreaTI["requiresGraduation"]> }) {
  const map: Record<NonNullable<AreaTI["requiresGraduation"]>, { bg: string; text: string; label: string }> = {
    obrigatorio: { bg: "bg-rose-100 border-rose-300", text: "text-rose-800", label: "Costuma exigir graduação" },
    recomendado: { bg: "bg-amber-100 border-amber-300", text: "text-amber-800", label: "Graduação ajuda bastante" },
    opcional: { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-800", label: "Graduação opcional" },
  };
  const s = map[value];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold",
        s.bg,
        s.text,
      )}
    >
      <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> {s.label}
    </span>
  );
}

function CrescimentoBadge({ value }: { value: NonNullable<AreaTI["crescimentoMercado"]> }) {
  const map: Record<
    NonNullable<AreaTI["crescimentoMercado"]>,
    { bg: string; text: string; label: string }
  > = {
    alto: { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-800", label: "Em alta 📈" },
    medio: { bg: "bg-amber-100 border-amber-300", text: "text-amber-800", label: "Estável ➡️" },
    estavel: { bg: "bg-slate-100 border-slate-300", text: "text-slate-700", label: "Maduro" },
    baixo: { bg: "bg-rose-100 border-rose-300", text: "text-rose-800", label: "Mercado em transição" },
  };
  const s = map[value];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold",
        s.bg,
        s.text,
      )}
    >
      <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> {s.label}
    </span>
  );
}

function AreaHeroStats({
  area,
  fillClass,
  iconMutedClass,
}: {
  area: AreaTI;
  fillClass: string;
  iconMutedClass: string;
}) {
  const tempoLabel = area.tempoMedioFormacao ?? "Varia por perfil";
  return (
    <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <p className={cn("mb-2 text-xs font-black uppercase tracking-[0.18em]", iconMutedClass)}>
            Dificuldade
          </p>
          <DifficultyDots level={area.dificuldade} fillClass={fillClass} />
        </div>
        <div className="md:border-l-2 md:border-slate-100 md:pl-6">
          <p className={cn("mb-2 text-xs font-black uppercase tracking-[0.18em]", iconMutedClass)}>
            Faixa salarial
          </p>
          <p className="text-sm font-bold leading-snug text-slate-900">{area.faixaSalarial}</p>
        </div>
        <div className="md:border-l-2 md:border-slate-100 md:pl-6">
          <p className={cn("mb-2 text-xs font-black uppercase tracking-[0.18em]", iconMutedClass)}>
            Tempo até estar pronto
          </p>
          <p className="text-sm font-bold leading-snug text-slate-900">{tempoLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function AreaDetalhe() {
  const params = useParams<{ slug: string }>();
  const [area, setArea] = useState<AreaTI | null>(
    () => areasTI.find((a) => a.slug === params.slug) || null,
  );

  useEffect(() => {
    if (!params.slug) return;
    const local = areasTI.find((a) => a.slug === params.slug);
    const localRoadmapStatus = local?.roadmapStatus;
    getArea(params.slug)
      .then((fetched) =>
        setArea(
          fetched
            ? ({ ...(local ?? {}), ...fetched, roadmapStatus: localRoadmapStatus } as AreaTI)
            : null,
        ),
      )
      .catch(() => setArea(local ?? null));
  }, [params.slug]);

  if (!area) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="mb-4 text-5xl">😕</p>
          <h1 className="font-display mb-2 text-2xl font-bold text-slate-900">Área não encontrada</h1>
          <p className="mb-6 text-slate-950">Essa área não existe ou foi removida.</p>
          <Link
            href="/areas"
            className="inline-flex items-center gap-2 font-medium text-violet-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para áreas
          </Link>
        </div>
      </Layout>
    );
  }

  const accent = accentForAreaSlug(area.slug);
  const ac = getPageAccentUi(accent);
  const comingSoon = area.roadmapStatus === "coming-soon";

  const cursosDaArea = cursosGratuitos.filter((c) => c.areaSlug === area.slug).slice(0, 3);
  const faculdadesEntries = (area.faculdadesRelacionadas ?? [])
    .map((nome) => faculdades.cursos.find((c) => c.nome === nome))
    .filter((c): c is (typeof faculdades.cursos)[number] => Boolean(c));

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow="Área de TI"
        title={area.nome}
        subtitle={area.descricaoCurta}
        topSlot={
          <Link
            href="/areas"
            className={cn("inline-flex items-center gap-2 text-sm font-bold", ac.link, ac.linkHover)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todas as áreas
          </Link>
        }
        titlePrefix={<AreaIconBox icon={area.icon} areaSlug={area.slug} size="lg" emoji={area.emoji} />}
        actions={
          <FavoriteButton
            compact
            item={{ id: area.id, type: "area", title: area.nome, subtitle: area.descricaoCurta }}
          />
        }
      />

      <section className={cn(ac.contentBg, "py-10 md:py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            {/* ======================= MAIN ======================= */}
            <div className="space-y-10">
              {/* ============ ZONA 1 — Hero stats + CTAs ============ */}
              <div className="space-y-4">
                <AreaHeroStats area={area} fillClass={ac.progressFill} iconMutedClass={ac.iconMuted} />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {comingSoon ? (
                    <span
                      aria-disabled
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-500"
                    >
                      <Clock className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Em breve
                    </span>
                  ) : (
                    <Link
                      href={`/roadmaps?area=${area.slug}`}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-violet-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
                    >
                      Ver roadmap <ArrowRight className="h-4 w-4" strokeWidth={3} aria-hidden />
                    </Link>
                  )}

                  <Link
                    href={`/cursos?area=${area.slug}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[5px_5px_0_#0f172a]"
                  >
                    Cursos grátis <ArrowRight className="h-4 w-4" strokeWidth={3} aria-hidden />
                  </Link>
                </div>

                {area.requiresGraduation ? (
                  <div className="flex">
                    <GraduationChip value={area.requiresGraduation} />
                  </div>
                ) : null}
              </div>

              {/* ============ ZONA 2 — Entendimento ============ */}
              <div className="space-y-5">
                <p className={cn("text-xs font-black uppercase tracking-[0.22em]", ac.iconMuted)}>
                  Entendimento
                </p>

                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-3 text-xl font-bold text-slate-900">
                    O que é {area.nome}?
                  </h2>
                  <p className="leading-relaxed text-slate-700">{area.descricaoCompleta}</p>
                </div>

                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-3 text-xl font-bold text-slate-900">
                    O que faz na prática?
                  </h2>
                  <p className="mb-4 leading-relaxed text-slate-700">{area.oQueFaz}</p>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-800">
                    Tarefas do dia a dia:
                  </h3>
                  <ul className="space-y-2">
                    {area.tarefasDiarias.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle
                          className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)}
                          aria-hidden
                        />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
                  <h2 className="font-display mb-3 text-xl font-bold text-slate-900">
                    Quem combina com essa área?
                  </h2>
                  <p className="text-slate-700">{area.perfilIndicado}</p>
                </div>
              </div>

              {/* ============ ZONA 3 — Como começar ============ */}
              <div className="space-y-5">
                <p className={cn("text-xs font-black uppercase tracking-[0.22em]", ac.iconMuted)}>
                  Como começar
                </p>

                {/* 3.1 Roadmap preview */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Roadmap inicial
                  </h2>
                  <div className="space-y-3">
                    {area.roadmapInicial.slice(0, 5).map((etapa, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-white",
                            ac.tableBanner,
                          )}
                        >
                          {i + 1}
                        </div>
                        <p className="pt-1 text-sm text-slate-700">{etapa}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    {comingSoon ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
                        <Clock className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Roadmap em construção
                      </span>
                    ) : (
                      <Link
                        href={`/roadmaps?area=${area.slug}`}
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-bold",
                          ac.link,
                          ac.linkHover,
                        )}
                      >
                        Ver roadmap completo <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>

                {/* 3.2 Cursos preview */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">Cursos grátis</h2>
                  {cursosDaArea.length > 0 ? (
                    <div className="space-y-3">
                      {cursosDaArea.map((curso) => (
                        <a
                          key={curso.id}
                          href={curso.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "block rounded-lg border-2 p-3 transition-colors",
                            ac.panelBorder,
                            ac.cardHover,
                          )}
                        >
                          <p className="font-display text-sm font-black text-slate-950">
                            {curso.titulo}
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-600">{curso.canal}</p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Estamos selecionando cursos pra essa área. Confira a curadoria completa.
                    </p>
                  )}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Link
                      href={`/cursos?area=${area.slug}`}
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-bold",
                        ac.link,
                        ac.linkHover,
                      )}
                    >
                      Ver todos os cursos de {area.nome} <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </div>

                {/* 3.3 Faculdades (condicional) */}
                {faculdadesEntries.length > 0 ? (
                  <div className="card-brutal rounded-xl bg-white p-6">
                    <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                      Faculdades relacionadas
                    </h2>
                    <ul className="space-y-2">
                      {faculdadesEntries.map((f) => (
                        <li
                          key={f.nome}
                          className={cn(
                            "rounded-lg border-2 p-3 text-sm",
                            ac.panelBorder,
                            ac.panelSoft,
                          )}
                        >
                          <p className="font-display font-black text-slate-950">{f.nome}</p>
                          <p className="mt-0.5 text-xs font-bold text-slate-600">
                            {f.tipo} · {f.duracao}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <Link
                        href="/faculdades"
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-bold",
                          ac.link,
                          ac.linkHover,
                        )}
                      >
                        Ver todas as faculdades <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* 3.4 Projetos */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Projetos pra praticar
                  </h2>
                  <div className="grid gap-3 md:grid-cols-3">
                    {area.projetos.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg border-2 p-3 text-sm font-medium text-slate-800",
                          ac.panelBorder,
                          ac.panelSoft,
                        )}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Link
                      href={`/projetos?area=${area.slug}`}
                      className={cn(
                        "inline-flex items-center gap-1 text-sm font-bold",
                        ac.link,
                        ac.linkHover,
                      )}
                    >
                      Ver mais projetos <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ============ ZONA 4 — Aprofundamento ============ */}
              <div className="space-y-5">
                <p className={cn("text-xs font-black uppercase tracking-[0.22em]", ac.iconMuted)}>
                  Aprofundamento
                </p>

                {/* 4.1 Influencer — placeholder enquanto curadoria não está pronta */}
                <div className={cn("card-brutal rounded-xl border-2 border-dashed p-6 text-center", ac.panelBorder, ac.panelSoft)}>
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Influenciadores da área
                  </h2>
                  <div className={cn("mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-900 bg-white", ac.iconMuted)}>
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="font-display font-black text-slate-950">Curadoria em breve</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Estamos selecionando criadores relevantes para esta área. Em breve trazemos recomendações reais aqui.
                  </p>
                </div>

                {/* 4.2 Tecnologias */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Tecnologias desta área
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {technologies
                      .filter((technology) => technology.areas.includes(area.slug))
                      .slice(0, 12)
                      .map((technology) => (
                        <Link
                          key={technology.slug}
                          href={`/tecnologias/${technology.slug}`}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-sm font-black transition-transform hover:-translate-y-0.5",
                            ac.panelBorder,
                            ac.panelSoft,
                            ac.tbodyAccentBold,
                          )}
                        >
                          <TechnologyLogo
                            name={technology.name}
                            icon={technology.icon}
                            logoUrl={technology.logoUrl}
                            className="h-6 w-6 shrink-0 rounded-full border-slate-200 bg-white shadow-none"
                            imageClassName="h-4 w-4"
                          />
                          {technology.name}
                        </Link>
                      ))}
                  </div>
                </div>

                {/* 4.3 Empresas */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Empresas que contratam para esta área
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {companies
                      .filter((company) => company.areas.includes(area.slug))
                      .slice(0, 4)
                      .map((company) => (
                        <Link
                          key={company.slug}
                          href={`/empresas/${company.slug}`}
                          className={cn(
                            "rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-colors",
                            ac.cardHover,
                          )}
                        >
                          <span className="font-display block font-black text-slate-950">
                            {company.name}
                          </span>
                          <span className="text-sm font-medium text-slate-600">
                            {company.segment} • {company.city}
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>

                {/* 4.4 Termos */}
                <div className="card-brutal rounded-xl bg-white p-6">
                  <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                    Termos essenciais
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {area.termosEssenciais.map((t) => (
                      <div
                        key={t}
                        className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <span className="font-mono">{t}</span>
                        <FavoriteButton
                          compact
                          item={{
                            id: t.toLowerCase().replace(/\s+/g, "-"),
                            type: "conceito",
                            title: t,
                            subtitle: area.nome,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4.5 Subáreas (condicional) */}
                {area.subareas && area.subareas.length > 0 ? (
                  <div className="card-brutal rounded-xl bg-white p-6">
                    <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
                      Subáreas de {area.nome}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {area.subareas.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/areas/${area.slug}/${sub.slug}`}
                          className={cn(
                            "rounded-full border-2 px-3 py-1.5 text-sm font-black transition-colors",
                            ac.panelBorder,
                            ac.panelSoft,
                            ac.tbodyAccentBold,
                          )}
                        >
                          {sub.nome}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 4.6 Dica para começar */}
                <div className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
                  <div className="flex items-start gap-3">
                    <Lightbulb
                      className={cn("mt-0.5 h-5 w-5 shrink-0", ac.iconMuted)}
                      aria-hidden
                    />
                    <div>
                      <h2 className="font-display mb-2 text-lg font-bold text-slate-900">
                        Dica para começar
                      </h2>
                      <p className="text-sm text-slate-700">{area.dicasIniciais}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================= SIDEBAR ======================= */}
            <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
              {/* Resumo rápido — apenas desktop (stats já estão na Zona 1 no mobile) */}
              <div
                className={cn(
                  "card-brutal hidden rounded-xl border-2 bg-white p-6 lg:block",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <h3 className={cn("font-display mb-4 text-lg font-bold", ac.tbodyAccentBold)}>
                  Resumo rápido
                </h3>
                <div className="space-y-3 text-sm text-slate-900">
                  <div>
                    <p className={cn("mb-1 text-xs uppercase tracking-wide", ac.iconMuted)}>
                      Dificuldade para iniciantes
                    </p>
                    <DifficultyDots level={area.dificuldade} fillClass={ac.progressFill} />
                  </div>
                  <div>
                    <p className={cn("mb-1 text-xs uppercase tracking-wide", ac.iconMuted)}>
                      Faixa salarial (estágio/trainee/júnior)
                    </p>
                    <p className="text-sm font-medium">{area.faixaSalarial}</p>
                  </div>
                  {area.tempoMedioFormacao ? (
                    <div>
                      <p className={cn("mb-1 text-xs uppercase tracking-wide", ac.iconMuted)}>
                        Tempo médio até estar pronto
                      </p>
                      <p className="text-sm font-medium">{area.tempoMedioFormacao}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Habilidades */}
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h3 className="font-display mb-3 font-semibold text-slate-900">
                  Habilidades importantes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {area.habilidades.map((h) => (
                    <span key={h} className={cn("rounded-full px-2 py-1 text-xs", ac.tag)}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ferramentas */}
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h3 className="font-display mb-3 font-semibold text-slate-900">Ferramentas comuns</h3>
                <div className="flex flex-wrap gap-2">
                  {area.ferramentas.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cargos */}
              <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder)}>
                <h3 className="font-display mb-3 font-semibold text-slate-900">Possíveis cargos</h3>
                <ul className="space-y-1.5">
                  {area.cargos.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-slate-700">
                      <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ac.progressFill)} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Crescimento de mercado — apenas desktop, conforme regra mobile */}
              {area.crescimentoMercado ? (
                <div
                  className={cn(
                    "card-brutal hidden rounded-xl border-2 bg-white p-6 lg:block",
                    ac.panelBorder,
                  )}
                >
                  <h3 className="font-display mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-slate-500" strokeWidth={2.5} aria-hidden />
                    Crescimento de mercado
                  </h3>
                  <CrescimentoBadge value={area.crescimentoMercado} />
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
}
