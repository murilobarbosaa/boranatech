import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import {
  AiGenerationProgressCard,
  useAiGeneration,
} from "@/components/roadmapV2/AiGenerationProgress";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  getAiRoadmapContext,
  listAiRoadmaps,
  streamGeneration,
  streamResume,
  type AiRoadmapContext,
  type AiRoadmapListItem,
} from "@/services/aiRoadmapService";
import { RoadmapIntakeSchema, type RoadmapIntake } from "@shared/aiRoadmap";

// Pagina do Roadmap com IA (Pro): entendimento (intake), geracao ao vivo por
// SSE e lista dos roadmaps ja gerados. A visualizacao vive em /roadmaps/ia/:slug.

const EXTRA_CONTEXT_MAX = 500;
// Janela em que um status generating e considerado geracao ATIVA (espelha a
// janela anti-abuso do server). Mais velho que isso, a geracao morreu no meio.
const GENERATING_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

type IntakeChoiceKey = "hoursPerWeek" | "goal" | "deadline" | "format";

interface IntakeQuestion {
  key: IntakeChoiceKey;
  question: string;
  options: Array<{ value: string; label: string }>;
}

// TODO(Ana): revisar TODOS os textos deste bloco (perguntas, opcoes, copy da
// pagina, badges de status e mensagens de erro do formulario).
const COPY = {
  seoTitle: "Roadmap com IA, sua trilha sob medida",
  seoDescription:
    "Responda quatro perguntas e receba um roadmap de estudos gerado sob medida para o seu momento, seu tempo e seu objetivo em tecnologia.",
  eyebrow: "exclusivo do pro",
  title: "Roadmap com IA",
  subtitle:
    "Um plano de estudos feito pra voce: a IA cruza suas respostas com o que voce ja fez na plataforma e monta a trilha sob medida.",
  proGateDescription:
    "Responda quatro perguntas rapidas e receba um roadmap de estudos unico, gerado sob medida pro seu tempo, seu objetivo e o que voce ja sabe.",
  stackFocusLabel: "Quer focar em alguma stack? (opcional)",
  stackFocusPlaceholder: "ex: react, python, aws",
  extraContextLabel: "Algo mais que a IA deva saber? (opcional)",
  extraContextPlaceholder:
    "ex: ja trabalho com suporte tecnico e quero migrar por dentro da empresa",
  submit: "Gerar meu roadmap",
  formError: "Responda as quatro perguntas antes de gerar.",
  listTitle: "Seus roadmaps gerados",
  listEmpty: "Voce ainda nao gerou nenhum roadmap.",
  listLoadError: "Nao foi possivel carregar seus roadmaps agora.",
  open: "Abrir",
  continueGeneration: "Continuar",
  generateNew: "Gerar novo",
  statusReady: "Pronto",
  statusDone: "Concluido",
  statusPartial: "Incompleto",
  statusFailed: "Falhou",
  statusGenerating: "Em andamento",
  statusStalled: "Interrompido",
  // TODO(Ana): revisar copy do painel de contexto do intake.
  contextTitle: "O que ja vamos usar de voce",
  contextHint: "Algo desatualizado?",
  contextUpdateProfile: "atualizar no perfil",
  contextUpdateQuiz: "refazer o quiz",
} as const;

const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    key: "hoursPerWeek",
    question: "Quanto tempo por semana voce tem pra estudar?",
    options: [
      { value: "ate-5", label: "Ate 5 horas" },
      { value: "5-10", label: "5 a 10 horas" },
      { value: "10-20", label: "10 a 20 horas" },
      { value: "20-mais", label: "Mais de 20 horas" },
    ],
  },
  {
    key: "goal",
    question: "Qual e o seu objetivo principal?",
    options: [
      { value: "primeira-vaga", label: "Conquistar a primeira vaga" },
      { value: "transicao", label: "Mudar de carreira pra tech" },
      { value: "freela", label: "Trabalhar como freelancer" },
      { value: "aprofundar", label: "Me aprofundar na minha area" },
    ],
  },
  {
    key: "deadline",
    question: "Em quanto tempo voce quer chegar la?",
    options: [
      { value: "3m", label: "3 meses" },
      { value: "6m", label: "6 meses" },
      { value: "12m", label: "12 meses" },
      { value: "sem-prazo", label: "Sem prazo definido" },
    ],
  },
  {
    key: "format",
    question: "Como voce prefere aprender?",
    options: [
      { value: "video", label: "Video" },
      { value: "texto", label: "Texto" },
      { value: "projetos", label: "Projetos praticos" },
      { value: "misto", label: "Um pouco de tudo" },
    ],
  },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function StatusBadge({ item }: { item: AiRoadmapListItem }) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-100 text-emerald-800",
    done: "bg-violet-100 text-violet-800",
    partial: "bg-amber-100 text-amber-800",
    failed: "bg-rose-100 text-rose-800",
    generating: "bg-sky-100 text-sky-800",
    stalled: "bg-slate-100 text-slate-600",
  };
  let kind: string = item.status;
  let label: string;
  if (item.status === "ready") {
    const total = item.totalSteps ?? null;
    const completed = item.completedSteps ?? null;
    if (total !== null && completed !== null && total > 0 && completed >= total) {
      kind = "done";
      label = COPY.statusDone;
    } else {
      label = COPY.statusReady;
    }
  }
  else if (item.status === "partial") label = COPY.statusPartial;
  else if (item.status === "failed") label = COPY.statusFailed;
  else if (
    Date.now() - new Date(item.updated_at).getTime() <
    GENERATING_ACTIVE_WINDOW_MS
  ) {
    label = COPY.statusGenerating;
  } else {
    kind = "stalled";
    label = COPY.statusStalled;
  }
  return (
    <span
      className={`rounded-full border-[1.5px] border-slate-900 px-2 py-0.5 text-[11px] font-black ${styles[kind] ?? styles.stalled}`}
    >
      {label}
    </span>
  );
}

export default function RoadmapIA() {
  const { isPro } = useSubscription();
  const [, setLocation] = useLocation();

  const [answers, setAnswers] = useState<
    Partial<Record<IntakeChoiceKey, string>>
  >({});
  const [stackFocus, setStackFocus] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const onDone = useCallback(
    (slug: string) => setLocation(`/roadmaps/ia/${slug}`),
    [setLocation],
  );
  const { state, start, reset } = useAiGeneration(onDone);

  const [list, setList] = useState<AiRoadmapListItem[] | null | undefined>(
    undefined,
  );
  const loadList = useCallback(() => {
    listAiRoadmaps()
      .then(setList)
      .catch(() => setList(null));
  }, []);
  useEffect(() => {
    loadList();
  }, [loadList]);

  // Painel "o que ja vamos usar de voce": best-effort, falha esconde o painel.
  const [context, setContext] = useState<AiRoadmapContext | null>(null);
  useEffect(() => {
    if (!isPro) return;
    getAiRoadmapContext()
      .then(setContext)
      .catch(() => setContext(null));
  }, [isPro]);

  const contextChips: string[] = [];
  if (context) {
    if (context.quiz?.area) {
      contextChips.push(
        context.quiz.level
          ? `Quiz: ${context.quiz.area}, nivel ${context.quiz.level}`
          : `Quiz: ${context.quiz.area}`,
      );
    }
    for (const skill of context.skills) contextChips.push(skill);
    for (const trail of context.trails) {
      contextChips.push(
        trail.pct !== null ? `${trail.title} (${trail.pct}%)` : trail.title,
      );
    }
    if (context.careerGoal) contextChips.push(`Objetivo: ${context.careerGoal}`);
    if (context.studyMinutes30d !== null) {
      const hours = Math.round(context.studyMinutes30d / 60);
      contextChips.push(
        hours >= 1
          ? `${hours}h de estudo nos ultimos 30 dias`
          : `${context.studyMinutes30d} min de estudo nos ultimos 30 dias`,
      );
    }
  }

  // Erro parcial ou bloqueio mudam o estado das linhas: atualiza a lista.
  useEffect(() => {
    if (state.phase === "error" || state.phase === "blocked") loadList();
  }, [state.phase, loadList]);

  const submit = async () => {
    const candidate = {
      ...answers,
      stackFocus: stackFocus.trim() === "" ? undefined : stackFocus.trim(),
      extraContext: extraContext.trim() === "" ? undefined : extraContext.trim(),
    };
    const parsed = RoadmapIntakeSchema.safeParse(candidate);
    if (!parsed.success) {
      setFormError(COPY.formError);
      return;
    }
    setFormError(null);
    const intake: RoadmapIntake = parsed.data;
    await start((handlers) => streamGeneration(intake, handlers));
  };

  const resume = async (slug: string) => {
    await start((handlers) => streamResume(slug, handlers));
  };

  const generationActive = state.phase === "running" || state.phase === "done";

  return (
    <Layout>
      <SEO
        title={COPY.seoTitle}
        description={COPY.seoDescription}
        url="/roadmaps/ia"
      />
      <section className="bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[760px] px-5 pb-20 pt-8">
          <Link
            href="/roadmaps"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Todos os roadmaps
          </Link>

          <div className="mt-5">
            <span className="inline-block rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-900 shadow-[2px_2px_0_#0f172a]">
              {COPY.eyebrow}
            </span>
            <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
              {COPY.title}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              {COPY.subtitle}
            </p>
          </div>

          <div className="mt-8">
            {!isPro ? (
              <ProGate description={COPY.proGateDescription} />
            ) : generationActive ||
              state.phase === "error" ||
              state.phase === "blocked" ? (
              <AiGenerationProgressCard
                state={state}
                onResume={(slug) => void resume(slug)}
                onReset={reset}
              />
            ) : (
              <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#FCC700]">
                <div className="space-y-7">
                  {contextChips.length > 0 ? (
                    <div className="rounded-[12px] border-[2px] border-slate-900 bg-violet-50 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-900">
                        {COPY.contextTitle}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {contextChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border-[1.5px] border-slate-900 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        {COPY.contextHint}{" "}
                        <Link
                          href="/perfil"
                          className="font-bold text-violet-800 underline underline-offset-2"
                        >
                          {COPY.contextUpdateProfile}
                        </Link>{" "}
                        ou{" "}
                        <Link
                          href="/quiz-carreira"
                          className="font-bold text-violet-800 underline underline-offset-2"
                        >
                          {COPY.contextUpdateQuiz}
                        </Link>
                        .
                      </p>
                    </div>
                  ) : null}
                  {INTAKE_QUESTIONS.map((q) => (
                    <fieldset key={q.key}>
                      <legend className="font-display text-lg font-black text-slate-950">
                        {q.question}
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {q.options.map((option) => {
                          const active = answers[q.key] === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.key]: option.value,
                                }))
                              }
                              className={`rounded-[11px] border-[2.5px] border-slate-900 px-4 py-2.5 text-sm font-extrabold shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] ${
                                active
                                  ? "bg-[#FFB800] text-slate-950"
                                  : "bg-white text-slate-600"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}

                  <label className="block">
                    <span className="font-display text-lg font-black text-slate-950">
                      {COPY.stackFocusLabel}
                    </span>
                    <input
                      type="text"
                      value={stackFocus}
                      onChange={(event) =>
                        setStackFocus(
                          event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                            .slice(0, 32),
                        )
                      }
                      placeholder={COPY.stackFocusPlaceholder}
                      className="mt-2 w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white p-3 text-sm font-semibold text-slate-900 shadow-[2px_2px_0_#0f172a] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                    />
                  </label>

                  <label className="block">
                    <span className="font-display text-lg font-black text-slate-950">
                      {COPY.extraContextLabel}
                    </span>
                    <textarea
                      value={extraContext}
                      onChange={(event) =>
                        setExtraContext(
                          event.target.value.slice(0, EXTRA_CONTEXT_MAX),
                        )
                      }
                      placeholder={COPY.extraContextPlaceholder}
                      rows={3}
                      className="mt-2 w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white p-3 text-sm font-semibold text-slate-900 shadow-[2px_2px_0_#0f172a] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                    />
                    <span className="mt-1 block text-right text-xs font-bold text-slate-400">
                      {extraContext.length}/{EXTRA_CONTEXT_MAX}
                    </span>
                  </label>

                  {formError ? (
                    <p className="rounded-[11px] border-[2px] border-slate-900 bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
                      {formError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void submit()}
                    className="bnt-pressable inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
                  >
                    <Sparkles className="h-4 w-4" />
                    {COPY.submit}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
              {COPY.listTitle}
            </h2>
            {list === undefined ? (
              <div className="mt-6 flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : list === null ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {COPY.listLoadError}
              </p>
            ) : list.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {COPY.listEmpty}
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge item={item} />
                      {item.status === "ready" ? (
                        <Link
                          href={`/roadmaps/ia/${item.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border-[2px] border-slate-900 bg-[#FFB800] px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px"
                        >
                          {COPY.open}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : item.status === "partial" && isPro ? (
                        <button
                          type="button"
                          onClick={() => void resume(item.slug)}
                          className="inline-flex items-center rounded-[10px] border-[2px] border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px"
                        >
                          {COPY.continueGeneration}
                        </button>
                      ) : item.status === "failed" ? (
                        <span className="text-xs font-bold text-slate-500">
                          {COPY.generateNew}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
