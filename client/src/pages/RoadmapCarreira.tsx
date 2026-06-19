/*
  BORA NA TECH? (Roadmaps de carreira preservados)
  Serve as trilhas zero-ti ("Começar do Zero em TI") e linkedin
  ("LinkedIn para Estágio"), que não existem no formato v2.
  Tudo gratuito: sem gerador de IA, sem paywall, sem filtro de duração.
*/

import { Link, Redirect } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  Linkedin,
  type LucideIcon,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { roadmaps } from "@/lib/data";

type PreservedTrail = {
  slug: string;
  roadmapId: string;
  areaLabel: string;
  icon: LucideIcon;
  tagClass: string;
};

export const PRESERVED_TRAILS: PreservedTrail[] = [
  {
    slug: "comecar-do-zero",
    roadmapId: "zero-ti",
    areaLabel: "Começar do zero",
    icon: Compass,
    tagClass: "bg-emerald-500",
  },
  {
    slug: "linkedin",
    roadmapId: "linkedin",
    areaLabel: "Carreira",
    icon: Linkedin,
    tagClass: "bg-sky-500",
  },
];

export default function RoadmapCarreira({ roadmapId }: { roadmapId: string }) {
  const trail = PRESERVED_TRAILS.find((t) => t.roadmapId === roadmapId);
  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  if (!trail || !roadmap) {
    return <Redirect to="/roadmaps" />;
  }

  return (
    <Layout>
      <SEO
        title={`${roadmap.nome} · Roadmap de carreira`}
        description={roadmap.descricao}
        url={`/roadmaps/${trail.slug}`}
        schemaType="CollectionPage"
      />

      <section className="border-b-2 border-slate-900 bg-emerald-100 py-10">
        <div className="container">
          <Link
            href="/roadmaps"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-700 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para roadmaps
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="mb-3 inline-flex rounded-full border-2 border-slate-900 bg-emerald-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
                {trail.areaLabel}
              </span>
              <h1 className="font-display text-4xl font-black text-slate-950">
                {roadmap.nome}
              </h1>
              <p className="mt-2 text-lg text-slate-800">{roadmap.descricao}</p>
            </div>
            <FavoriteButton
              item={{
                id: roadmap.id,
                type: "roadmap",
                title: roadmap.nome,
                subtitle: trail.areaLabel,
                url: `/roadmaps/${trail.slug}`,
              }}
            />
          </div>
        </div>
      </section>

      <div className="bg-[#f0fdf4]">
        <div className="container space-y-6 py-12">
          <div className="card-brutal grid grid-cols-1 gap-4 rounded-xl bg-white p-6 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                Para quem
              </p>
              <p className="text-sm text-slate-700">{roadmap.paraQuem}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                Pré-requisitos
              </p>
              <p className="text-sm text-slate-700">{roadmap.preRequisitos}</p>
            </div>
          </div>

          <div className="card-brutal rounded-xl bg-white p-6">
            <h2 className="mb-6 font-display text-xl font-black text-slate-900">
              Etapas da trilha
            </h2>
            <div className="space-y-4">
              {roadmap.etapas.map((etapa, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-700 text-sm font-bold text-white">
                      {etapa.numero}
                    </div>
                    {i < roadmap.etapas.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {etapa.titulo}
                      </h3>
                      {etapa.tempo && (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {etapa.tempo}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {etapa.descricao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-brutal rounded-xl border-red-200 bg-red-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Erros comuns
                </h3>
              </div>
              <ul className="space-y-2">
                {roadmap.errosComuns.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-700"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-brutal rounded-xl border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Próximo passo
                </h3>
              </div>
              <p className="text-xs text-slate-700">{roadmap.proximoPasso}</p>
            </div>
          </div>

          <div className="card-brutal flex items-center justify-between rounded-xl border-2 border-emerald-700 bg-emerald-100 p-5">
            <div>
              <p className="font-display font-bold text-slate-950">
                Pronta para começar?
              </p>
              <p className="text-sm text-slate-700">
                Encontre cursos gratuitos e pagos para essa trilha.
              </p>
            </div>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Ver cursos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
