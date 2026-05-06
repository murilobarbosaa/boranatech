import { useState } from "react";
import { BookOpen, ExternalLink, PlayCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { AiCtaLink } from "@/components/shared/AiCta";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import FilterPills from "@/components/shared/FilterPills";
import PageHero from "@/components/shared/PageHero";
import { interviewQuestions, interviewStudySites, interviewVideoResources } from "@/lib/careerToolsData";

export default function EntrevistaPerguntas() {
  const [type, setType] = useState("Todas");
  const filtered = interviewQuestions.filter((item) => type === "Todas" || item.type === type);

  return (
    <Layout>
      <PageHero title="Banco de Perguntas de Entrevista" subtitle="Perguntas técnicas, comportamentais e de lógica para praticar." />
      <section className="container space-y-10 py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <FilterPills options={["Todas", "Técnica", "Comportamental", "Lógica"]} value={type} onChange={setType} />
          <AiCtaLink href="/entrevistas/simulador" description="Simule a entrevista e receba feedback">
            Praticar com IA
          </AiCtaLink>
        </div>
        <div className="space-y-4">
          {filtered.map((item) => (
            <DetailsChevronOnly
              key={item.question}
              className="card-brutal rounded-2xl bg-white p-5"
              title={(
                <span>
                  <span className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-black text-violet-700">{item.area}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">{item.level}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{item.type}</span>
                  </span>
                  <span className="font-display text-lg font-black">{item.question}</span>
                </span>
              )}
            >
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4 text-sm"><strong>Boa resposta:</strong><p>{item.good}</p></div>
                <div className="rounded-xl bg-red-50 p-4 text-sm"><strong>Resposta fraca:</strong><p>{item.bad}</p></div>
              </div>
            </DetailsChevronOnly>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-xl border-2 border-slate-900 bg-violet-100 p-3 text-violet-700 shadow-[3px_3px_0_#0f172a]">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black">Sites para estudar entrevistas</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">Use estes materiais para treinar respostas técnicas, comportamentais e simulações.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {interviewStudySites.map((site) => (
                <a
                  key={site.title}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-[4px_4px_0_#0f172a]"
                >
                  <span className="mb-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-violet-700">{site.type}</span>
                  <h3 className="flex items-center gap-2 font-display text-lg font-black text-slate-950">
                    {site.title}
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-600">{site.desc}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="card-brutal rounded-2xl bg-violet-700 p-6 text-white">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-xl border-2 border-slate-950 bg-amber-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                <PlayCircle className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black">Vídeos para praticar</h2>
                <p className="mt-1 text-sm font-medium text-violet-100">Pesquisas prontas para assistir simulações, dicas e explicações.</p>
              </div>
            </div>
            <div className="space-y-3">
              {interviewVideoResources.map((video) => (
                <a
                  key={video.title}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white p-3 text-sm font-black text-violet-800 transition-all hover:bg-amber-300 hover:text-slate-950"
                >
                  <PlayCircle className="h-5 w-5 shrink-0" />
                  {video.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
