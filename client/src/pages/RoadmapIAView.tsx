import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  AiGenerationProgressCard,
  useAiGeneration,
} from "@/components/roadmapV2/AiGenerationProgress";
import RoadmapTrail from "@/components/roadmapV2/RoadmapTrail";
import TrailDrawer from "@/components/roadmapV2/TrailDrawer";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { nodeProgress } from "@/lib/roadmapV2/progress";
import {
  getAiRoadmap,
  streamResume,
  type AiRoadmapDetail,
} from "@/services/aiRoadmapService";

// Visualizacao de um roadmap gerado por IA (/roadmaps/ia/:slug). Renderiza o
// objeto RoadmapV2 do jsonb com os MESMOS componentes das trilhas v2 e marca
// progresso via useRoadmapProgress (item_key slug:nodeId, como as estaticas).
// Sem gate Pro: dado do dono; retomar continua gated pelo server.

// TODO(Ana): revisar todos os textos desta pagina.
const COPY = {
  back: "Meus roadmaps com IA",
  areaBadge: "Roadmap com IA",
  partialBanner:
    "Este roadmap ficou pela metade. As etapas prontas ja estao ai embaixo; retome pra gerar o resto.",
  resume: "Retomar geracao",
  generatingTitle: "Seu roadmap esta sendo gerado",
  generatingBody:
    "Isso leva um ou dois minutos. Esta pagina atualiza sozinha quando ficar pronto.",
  failedTitle: "A geracao deste roadmap falhou",
  failedBody: "Nao se preocupe, nada foi cobrado. Gere um novo quando quiser.",
  failedCta: "Gerar um novo roadmap",
} as const;

// Refetch periodico leve enquanto o server ainda esta gerando.
const GENERATING_POLL_MS = 5000;

export default function RoadmapIAView() {
  const params = useParams();
  const slug = params.slug ?? "";

  // undefined = carregando; null = nao encontrado (redireciona).
  const [detail, setDetail] = useState<AiRoadmapDetail | null | undefined>(
    undefined,
  );

  const refetch = useCallback(() => {
    getAiRoadmap(slug)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Retomada na propria pagina: ao concluir, recarrega o detalhe (ja estamos
  // na rota certa, nao ha navegacao).
  const onResumeDone = useCallback(() => refetch(), [refetch]);
  const { state: resumeState, start, reset } = useAiGeneration(onResumeDone);

  useEffect(() => {
    if (detail?.status !== "generating") return;
    const timer = setInterval(refetch, GENERATING_POLL_MS);
    return () => clearInterval(timer);
  }, [detail?.status, refetch]);

  const { done, toggle: onToggle, ready } = useRoadmapProgress(slug);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const roadmap = detail && detail.status !== "failed" ? detail.roadmap : null;

  // No partial, so as secoes ja geradas entram na trilha.
  const visibleSections = useMemo(() => {
    if (!roadmap || !Array.isArray(roadmap.sections)) return [];
    return roadmap.sections.filter(
      (section) => section.children && section.children.length > 0,
    );
  }, [roadmap]);

  const overall = useMemo(() => {
    return visibleSections.reduce(
      (acc, section) => {
        const progress = nodeProgress(section, done);
        return {
          done: acc.done + progress.done,
          total: acc.total + progress.total,
        };
      },
      { done: 0, total: 0 },
    );
  }, [visibleSections, done]);

  const overallPct =
    overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0;

  const openSection = openSectionId
    ? (visibleSections.find((section) => section.id === openSectionId) ?? null)
    : null;

  if (detail === null) {
    return <Redirect to="/roadmaps/ia" />;
  }

  const resuming =
    resumeState.phase === "running" ||
    resumeState.phase === "error" ||
    resumeState.phase === "blocked";

  return (
    <Layout>
      {detail && roadmap ? (
        <SEO
          title={detail.title}
          description={roadmap.description ?? ""}
          url={`/roadmaps/ia/${slug}`}
        />
      ) : null}

      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[760px] px-5 pb-20 pt-8">
          <Link
            href="/roadmaps/ia"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {COPY.back}
          </Link>

          {detail === undefined ? (
            <div className="mt-10 flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : detail.status === "failed" ? (
            <div className="mt-8 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#f43f5e]">
              <h1 className="font-display text-2xl font-black text-slate-950">
                {COPY.failedTitle}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {COPY.failedBody}
              </p>
              <Link
                href="/roadmaps/ia"
                className="mt-4 inline-flex items-center rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
              >
                {COPY.failedCta}
              </Link>
            </div>
          ) : detail.status === "generating" ? (
            <div className="mt-8 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 text-center shadow-[4px_4px_0_#FCC700]">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
              <h1 className="mt-4 font-display text-2xl font-black text-slate-950">
                {COPY.generatingTitle}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {COPY.generatingBody}
              </p>
            </div>
          ) : roadmap ? (
            <>
              <div className="mt-5">
                <span className="mb-3.5 inline-block rounded-full border-[2.5px] border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[3px_3px_0_#0f172a]">
                  {COPY.areaBadge}
                </span>
                <h1 className="font-display text-[clamp(2rem,6vw,2.7rem)] font-black leading-[1.03] tracking-tight text-slate-950">
                  {roadmap.title}
                </h1>
                <p className="mt-2 text-base font-medium text-slate-600">
                  {roadmap.description}
                </p>
                <span className="mt-4 inline-block rounded-[10px] border-[2.5px] border-slate-900 bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800 shadow-[3px_3px_0_#0f172a]">
                  {overall.done} de {overall.total} tópicos · {overallPct}%
                </span>
              </div>

              {detail.status === "partial" ? (
                <div className="mt-6">
                  {resuming ? (
                    <AiGenerationProgressCard
                      state={resumeState}
                      onResume={(resumeSlug) =>
                        void start((handlers) =>
                          streamResume(resumeSlug, handlers),
                        )
                      }
                      onReset={reset}
                    />
                  ) : (
                    <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-amber-50 p-5 shadow-[3px_3px_0_#0f172a]">
                      <p className="text-sm font-bold text-slate-800">
                        {COPY.partialBanner}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void start((handlers) => streamResume(slug, handlers))
                        }
                        className="mt-3 inline-flex items-center rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
                      >
                        {COPY.resume}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {ready ? (
                <RoadmapTrail
                  sections={visibleSections}
                  done={done}
                  onOpenSection={setOpenSectionId}
                />
              ) : (
                <div className="mt-10 flex justify-center py-16">
                  <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <TrailDrawer
        section={openSection}
        done={done}
        onToggle={onToggle}
        onClose={() => setOpenSectionId(null)}
      />
    </Layout>
  );
}
