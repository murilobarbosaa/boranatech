/*
  BORA NA TECH? (Estágio e Carreira Page)
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ExternalLink,
  Briefcase,
  Linkedin,
  FileText,
  Code2,
  Github,
  Lightbulb,
  Rocket,
  Sparkles,
  Star,
  CheckCircle2,
  Target,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AiCtaLink } from "@/components/shared/AiCta";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { areasTI, vagasInfo } from "@/lib/data";
import { careerInstitutes } from "@/lib/platformData";
import { getJobs } from "@/services/contentService";

const tabs = ["Vagas, Estágio e Trainee", "Institutos"];

const areaLabel = (slug: string) =>
  areasTI.find((a) => a.slug === slug)?.nome ?? "Diversas áreas";

const instituteGroups = careerInstitutes.reduce<
  { slug: string; items: (typeof careerInstitutes)[number][] }[]
>((groups, institute) => {
  const slug = institute.areas?.[0] ?? "geral";
  const existing = groups.find((g) => g.slug === slug);
  if (existing) existing.items.push(institute);
  else groups.push({ slug, items: [institute] });
  return groups;
}, []);

type EstagioProps = {
  initialTab?: number;
};

type ExternalJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  seniority: string;
  url: string;
  areaSlug: string;
  publishedAt: string | null;
};

export default function Estagio({ initialTab = 0 }: EstagioProps) {
  const { isPro, loading } = useSubscription();
  const [tab, setTab] = useState(
    Math.min(Math.max(initialTab, 0), tabs.length - 1),
  );
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    getJobs({ limit: 30 })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, []);

  return (
    <Layout>
      <SEO
        title="Estágio em TI · Vagas e oportunidades de início de carreira"
        description="Vagas, estágio, trainee e oportunidades para quem está começando em tecnologia, com orientação para o primeiro emprego em TI."
        keywords={[
          "estágio ti",
          "vagas estágio tecnologia",
          "primeiro emprego programação",
          "trainee tecnologia",
          "vagas júnior",
        ]}
        url="/estagio"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-amber-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#d97706_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              primeira oportunidade
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
              Estágio, Trainee e Carreira em TI
            </h1>
            <p className="text-slate-950 text-lg">
              Onde buscar sua primeira vaga, como montar um LinkedIn e dicas
              para se destacar no mercado.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-amber-50 border-b-2 border-amber-200 sticky top-16 z-40">
        <div className="container">
          <div className="flex">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === i
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffbeb] py-12">
        <div className="container">
          <div className="mb-10 grid gap-5 md:grid-cols-2">
            <Link
              href="/empregabilidade"
              className="card-brutal block rounded-2xl border-2 border-slate-950 bg-white p-5"
            >
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-2.5 py-1 text-xs font-black text-slate-950">
                <Star className="h-3 w-3 fill-[#FFB800] text-slate-950" />
                Plano Pro
              </span>
              <h2 className="font-display text-xl font-black text-slate-950">
                Analisador de Vaga
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cole uma vaga e descubra se vale aplicar agora e o que estudar
                nos próximos 7 dias.
              </p>
            </Link>
            <Link
              href="/empregabilidade"
              className="card-brutal block rounded-2xl border-2 border-slate-950 bg-white p-5"
            >
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-2.5 py-1 text-xs font-black text-slate-950">
                <Star className="h-3 w-3 fill-[#FFB800] text-slate-950" />
                Plano Pro
              </span>
              <h2 className="font-display text-xl font-black text-slate-950">
                Calculadora de Prontidão
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Veja o que você já tem, o que falta e um plano de ação para
                chegar à primeira vaga.
              </p>
            </Link>
          </div>

          {/* Tab 0: Vagas */}
          {tab === 0 && (
            <div>
              {!isPro && !loading ? (
                <div className="mb-10">
                  {/* TODO(Ana): copy da CTA de prontidao pra candidatura */}
                  <AiCtaLink
                    href="/empregabilidade"
                    description="Veja seu encaixe na vaga e o que falta"
                    accent="amber"
                    className="w-full"
                  >
                    Está pronto pra se candidatar? Cheque sua prontidão com IA
                  </AiCtaLink>
                </div>
              ) : null}
              {/* Tipos de vaga */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {vagasInfo.diferencas.map((d) => (
                  <div
                    key={d.tipo}
                    className="card-brutal bg-white rounded-xl p-5"
                  >
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border mb-3 inline-block ${
                        d.tipo === "Estágio"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : d.tipo === "Trainee"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : d.tipo === "Júnior"
                              ? "bg-violet-100 text-violet-700 border-violet-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      {d.tipo}
                    </span>
                    <p className="text-sm text-slate-700">{d.descricao}</p>
                  </div>
                ))}
              </div>

              {/* Plataformas de vagas */}
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">
                Onde buscar vagas
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {vagasInfo.plataformas.map((plat) => (
                  <a
                    key={plat.nome}
                    href={plat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-brutal bg-white rounded-xl p-5 flex flex-col group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {plat.nome}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <p className="text-sm text-slate-600 flex-1">
                      {plat.descricao}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-amber-600 font-medium">
                        Buscar vagas →
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mb-10">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-slate-900">
                      Vagas tech sincronizadas
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Lista alimentada pela API de vagas quando a integração
                      estiver configurada.
                    </p>
                  </div>
                  {jobsLoading && (
                    <span className="text-xs font-bold text-amber-700">
                      Carregando vagas...
                    </span>
                  )}
                </div>

                {jobs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.slice(0, 6).map((job) => (
                      <a
                        key={job.id}
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-brutal bg-white rounded-xl p-5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                            {job.seniority}
                          </span>
                          {job.remote && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                              remoto
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-slate-900">
                          {job.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {job.company} · {job.location}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-amber-700">
                          Ver vaga <ExternalLink className="h-3 w-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-amber-200 bg-white p-5 text-sm font-semibold text-slate-600">
                    Nenhuma vaga sincronizada no momento. Confira as plataformas
                    acima pra encontrar oportunidades.
                  </div>
                )}
              </div>

              {/* Palavras-chave */}
              <div className="card-brutal bg-white rounded-xl p-6 border-slate-200 mb-8">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-3">
                  Palavras-chave para buscar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vagasInfo.palavrasChave.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1.5 bg-amber-100 border-2 border-amber-300 rounded-lg text-sm font-medium text-amber-800 font-mono"
                    >
                      "{p}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Dicas currículo e portfólio */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-brutal bg-white rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <h3 className="font-display font-bold text-lg text-slate-900">
                      Dicas de currículo
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {vagasInfo.dicasCurriculo.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-brutal bg-white rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                    <h3 className="font-display font-bold text-lg text-slate-900">
                      Dicas de portfólio
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {vagasInfo.dicasPortfolio.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div>
              <div className="mb-8 max-w-2xl">
                <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
                  participar também abre portas
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Institutos e organizações para acompanhar
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Entrar em comunidades profissionais ajuda a conhecer eventos,
                  mentorias, certificações e oportunidades.
                </p>
              </div>
              <div className="space-y-10">
                {instituteGroups.map((group) => (
                  <div key={group.slug}>
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="h-6 w-1.5 shrink-0 rounded-full bg-amber-500"
                        aria-hidden
                      />
                      <h3 className="font-display text-2xl font-black text-slate-950">
                        {areaLabel(group.slug)}
                      </h3>
                      <span className="rounded-full border-2 border-slate-900 bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
                        {group.items.length}
                      </span>
                    </div>
                    {/* TODO(Ana): copy de contexto por grupo de institutos */}
                    <p className="mb-5 max-w-2xl text-sm text-slate-600">
                      Referências reconhecidas para quem quer crescer em{" "}
                      {areaLabel(group.slug).toLowerCase()}.
                    </p>
                    <div className="grid gap-5 md:grid-cols-3">
                      {group.items.map((institute) => (
                        <a
                          key={institute.name}
                          href={institute.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-invite rounded-2xl bg-white p-6"
                        >
                          <h3 className="font-display text-xl font-black text-slate-950">
                            {institute.name}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {institute.desc}
                          </p>
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                            Conhecer instituto{" "}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
