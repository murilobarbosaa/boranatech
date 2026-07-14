import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import IntakeChatPanel, {
  type IntakeChatMessage,
} from "@/components/ai/IntakeChatPanel";
import {
  AiGenerationProgressCard,
  useAiGeneration,
} from "@/components/roadmapV2/AiGenerationProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  getAiRoadmapContext,
  IntakeChatApiError,
  listAiRoadmaps,
  sendIntakeChatTurn,
  streamGeneration,
  streamResume,
  type AiRoadmapContext,
  type AiRoadmapListItem,
  type IntakeChatProposal,
} from "@/services/aiRoadmapService";
import { RoadmapIntakeSchema } from "@shared/aiRoadmap";

// Pagina do Roadmap com IA (Pro): entendimento (intake), geracao ao vivo por
// SSE e lista dos roadmaps ja gerados. A visualizacao vive em /roadmaps/ia/:slug.

// Janela em que um status generating e considerado geracao ATIVA (espelha a
// janela anti-abuso do server). Mais velho que isso, a geracao morreu no meio.
const GENERATING_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

// Rascunho do chat no localStorage: chave por usuario, no padrao bnt:<feature>:v1.
// TTL curto (24h): uma conversa de 7 etapas nao pode se perder num reload, mas
// tambem nao deve ressuscitar dias depois. Limpo ao concluir a geracao.
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
function draftKey(userId: string): string {
  return `bnt:roadmap-intake-chat:v1:${userId}`;
}

// Campos essenciais para gerar (os 3 enums que viram os rotulos do prompt de
// geracao; format e assumido "misto"). O progresso da conversa e quantos deles
// ja foram capturados, derivado do missing[] que o backend devolve.
const ESSENTIAL_FIELDS = ["goal", "hoursPerWeek", "deadline"] as const;

// TODO(Ana): revisar a mensagem de abertura enviada ao backend. Ela NAO aparece
// como bolha na tela: so dispara o primeiro turno, cuja primeira pergunta ja usa
// o contexto do pool. O backend exige historico nao-vazio, entao esta semente
// entra sempre na frente do historico enviado.
const CHAT_KICKOFF = "Quero montar meu roadmap de estudos. Pode comecar.";

// TODO(Ana): revisar TODOS os textos deste bloco (copy da pagina, badges de
// status, copy do chat e do resumo do intake).
const COPY = {
  seoTitle: "Roadmap com IA, sua trilha sob medida",
  seoDescription:
    "Converse com o Natechinho e receba um roadmap de estudos gerado sob medida para o seu momento, seu tempo e seu objetivo em tecnologia.",
  eyebrow: "exclusivo do pro",
  title: "Roadmap com IA",
  subtitle:
    "Um plano de estudos feito pra voce: o Natechinho conversa, cruza o que voce ja fez na plataforma e monta a trilha sob medida.",
  proGateDescription:
    "Converse rapido com o Natechinho e receba um roadmap de estudos unico, gerado sob medida pro seu tempo, seu objetivo e o que voce ja sabe.",
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
  // TODO(Ana): revisar copy do chat e do resumo do intake.
  chatTitle: "Papo com o Natechinho",
  chatSubtitle: "Uma pergunta por vez. No fim, seu roadmap.",
  chatPlaceholder: "Escreva sua resposta",
  chatOpeningError: "Nao consegui comecar a conversa agora. Tente de novo.",
  chatGenericError: "Nao consegui responder agora. Tente de novo.",
  // 429 do chat: cota SEPARADA da de gerar, a copy nao pode dizer que acabou a
  // cota de gerar.
  chatQuotaError:
    "Voce atingiu o limite diario de mensagens do chat. Isso e separado da cota de gerar roadmap; tente de novo amanha.",
  chatTurnLimit:
    "Chegamos ao limite desta conversa. Voce ja pode gerar o roadmap com o que montamos ate aqui.",
  summaryTitle: "Fechou. Isto e o que eu entendi:",
  summaryHint: "Se algo ficou torto, e so me dizer aqui embaixo antes de gerar.",
  summaryGoal: "Objetivo",
  summaryHours: "Tempo por semana",
  summaryDeadline: "Prazo",
  summaryStack: "Foco de stack",
  summaryStartingPoint: "Ponto de partida",
  summaryMotivation: "Motivacao",
  summaryConstraints: "Obstaculos",
  generate: "Gerar meu roadmap",
  finalError:
    "Faltou alguma informacao essencial pra gerar. Me conta mais um pouco no chat e a gente tenta de novo.",
} as const;

// Rotulos de exibicao dos enums no resumo do intake (nao vao ao server; o server
// recebe o enum cru). TODO(Ana): revisar rotulos.
const GOAL_DISPLAY: Record<NonNullable<IntakeChatProposal["goal"]>, string> = {
  "primeira-vaga": "Conquistar a primeira vaga",
  transicao: "Mudar de carreira pra tech",
  freela: "Trabalhar como freelancer",
  aprofundar: "Aprofundar na area atual",
};
const HOURS_DISPLAY: Record<
  NonNullable<IntakeChatProposal["hoursPerWeek"]>,
  string
> = {
  "ate-5": "Ate 5 horas",
  "5-10": "5 a 10 horas",
  "10-20": "10 a 20 horas",
  "20-mais": "Mais de 20 horas",
};
const DEADLINE_DISPLAY: Record<
  NonNullable<IntakeChatProposal["deadline"]>,
  string
> = {
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  "sem-prazo": "Sem prazo definido",
};

interface ChatDraft {
  savedAt: number;
  messages: IntakeChatMessage[];
  intake: IntakeChatProposal | null;
  missing: string[];
  ready: boolean;
}

function loadDraft(userId: string): ChatDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatDraft;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !Array.isArray(parsed.messages) ||
      parsed.messages.length === 0
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(draftKey(userId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(userId: string, draft: Omit<ChatDraft, "savedAt">): void {
  try {
    window.localStorage.setItem(
      draftKey(userId),
      JSON.stringify({ savedAt: Date.now(), ...draft }),
    );
  } catch {
    // Storage cheio ou indisponivel: o rascunho e best-effort, ignora.
  }
}

function clearDraft(userId: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId));
  } catch {
    // Ignora: limpeza best-effort.
  }
}

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-black text-slate-500">{label}:</dt>
      <dd className="min-w-0 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function RoadmapIA() {
  const { isPro } = useSubscription();
  const [, setLocation] = useLocation();

  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Estado do chat de intake guiado. O historico e efemero (reenviado a cada
  // turno) e persistido so no localStorage; o intake parcial mais recente vem do
  // backend a cada turno.
  const [messages, setMessages] = useState<IntakeChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [turnLimitReached, setTurnLimitReached] = useState(false);
  const [intake, setIntake] = useState<IntakeChatProposal | null>(null);
  const [missing, setMissing] = useState<string[]>([...ESSENTIAL_FIELDS]);
  const [ready, setReady] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);
  // Guarda de uma execucao so do bootstrap (restore do rascunho ou abertura).
  const bootstrappedRef = useRef(false);

  const onDone = useCallback(
    (slug: string) => {
      if (userId) clearDraft(userId);
      setLocation(`/roadmaps/ia/${slug}`);
    },
    [setLocation, userId],
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

  // Um turno do chat: envia [semente, ...historico] e aplica o resultado. Erro
  // de turno vira mensagem amigavel; limite de turnos trava o input; 429 tem
  // copy propria (a cota do chat e separada da de gerar).
  const runTurn = useCallback(
    async (history: IntakeChatMessage[], isOpening: boolean) => {
      setSending(true);
      setChatError(null);
      setFinalError(null);
      try {
        const result = await sendIntakeChatTurn([
          { role: "user", content: CHAT_KICKOFF },
          ...history,
        ]);
        setMessages([...history, { role: "assistant", content: result.reply }]);
        setIntake(result.intake);
        setMissing(result.missing);
        setReady(result.ready);
      } catch (err) {
        if (err instanceof IntakeChatApiError && err.code === "turn_limit") {
          setTurnLimitReached(true);
          return;
        }
        if (err instanceof IntakeChatApiError && err.code === "rate_limited") {
          setChatError(COPY.chatQuotaError);
          return;
        }
        setChatError(isOpening ? COPY.chatOpeningError : COPY.chatGenericError);
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const handleSend = useCallback(
    (text: string) => {
      const next = [...messages, { role: "user" as const, content: text }];
      setMessages(next);
      void runTurn(next, false);
    },
    [messages, runTurn],
  );

  // Reenvia a ultima mensagem do usuario sem duplicar: o historico ja termina
  // nela (a resposta do assistente nao foi anexada por causa do erro).
  const handleRetry = useCallback(() => {
    if (sending) return;
    void runTurn(messages, false);
  }, [messages, runTurn, sending]);

  // Bootstrap (uma vez, so Pro, com sessao e no phase idle): restaura o rascunho
  // ou dispara o turno de abertura. O phase idle evita gerar um turno por engano
  // enquanto uma geracao roda.
  useEffect(() => {
    if (!isPro || !userId || state.phase !== "idle") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const draft = loadDraft(userId);
    if (draft) {
      setMessages(draft.messages);
      setIntake(draft.intake);
      setMissing(draft.missing);
      setReady(draft.ready);
      return;
    }
    void runTurn([], true);
  }, [isPro, userId, state.phase, runTurn]);

  // Persiste o rascunho a cada mudanca relevante (best-effort; TTL na leitura).
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    saveDraft(userId, { messages, intake, missing, ready });
  }, [userId, messages, intake, missing, ready]);

  // ready + confirmacao: monta o RoadmapIntake final (intake do chat + format
  // "misto"), valida no client e chama a geracao existente. Falha de validacao
  // (nao deveria acontecer) mostra erro claro em vez de mandar lixo ao server.
  const generate = useCallback(async () => {
    if (!intake) return;
    const candidate: Record<string, unknown> = {
      goal: intake.goal ?? undefined,
      hoursPerWeek: intake.hoursPerWeek ?? undefined,
      deadline: intake.deadline ?? undefined,
      format: "misto",
    };
    if (intake.stackFocus) candidate.stackFocus = intake.stackFocus;
    if (intake.startingPoint) candidate.startingPoint = intake.startingPoint;
    if (intake.motivation) candidate.motivation = intake.motivation;
    if (intake.constraints) candidate.constraints = intake.constraints;
    const parsed = RoadmapIntakeSchema.safeParse(candidate);
    if (!parsed.success) {
      setFinalError(COPY.finalError);
      return;
    }
    setFinalError(null);
    await start((handlers) => streamGeneration(parsed.data, handlers));
  }, [intake, start]);

  const resume = async (slug: string) => {
    await start((handlers) => streamResume(slug, handlers));
  };

  const generationActive = state.phase === "running" || state.phase === "done";

  // Progresso da conversa: quantos campos essenciais ja sairam do missing[].
  const essentialOpen = missing.filter((f) =>
    (ESSENTIAL_FIELDS as readonly string[]).includes(f),
  ).length;
  const essentialDone = ESSENTIAL_FIELDS.length - essentialOpen;

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
              <ProGate feature="roadmap_ia" description={COPY.proGateDescription} />
            ) : generationActive ||
              state.phase === "error" ||
              state.phase === "blocked" ? (
              <AiGenerationProgressCard
                state={state}
                onResume={(slug) => void resume(slug)}
                onReset={reset}
              />
            ) : (
              <div className="space-y-5">
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

                <IntakeChatPanel
                  messages={messages}
                  sending={sending}
                  onSend={handleSend}
                  title={COPY.chatTitle}
                  subtitle={COPY.chatSubtitle}
                  error={chatError}
                  onRetry={chatError ? handleRetry : undefined}
                  turnLimitReached={turnLimitReached}
                  turnLimitMessage={COPY.chatTurnLimit}
                  progress={{
                    done: essentialDone,
                    total: ESSENTIAL_FIELDS.length,
                  }}
                  placeholder={COPY.chatPlaceholder}
                />

                {ready && intake ? (
                  <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#FCC700]">
                    <p className="font-display text-lg font-black text-slate-950">
                      {COPY.summaryTitle}
                    </p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {intake.goal ? (
                        <SummaryRow
                          label={COPY.summaryGoal}
                          value={GOAL_DISPLAY[intake.goal]}
                        />
                      ) : null}
                      {intake.hoursPerWeek ? (
                        <SummaryRow
                          label={COPY.summaryHours}
                          value={HOURS_DISPLAY[intake.hoursPerWeek]}
                        />
                      ) : null}
                      {intake.deadline ? (
                        <SummaryRow
                          label={COPY.summaryDeadline}
                          value={DEADLINE_DISPLAY[intake.deadline]}
                        />
                      ) : null}
                      {intake.stackFocus ? (
                        <SummaryRow
                          label={COPY.summaryStack}
                          value={intake.stackFocus}
                        />
                      ) : null}
                      {intake.startingPoint ? (
                        <SummaryRow
                          label={COPY.summaryStartingPoint}
                          value={intake.startingPoint}
                        />
                      ) : null}
                      {intake.motivation ? (
                        <SummaryRow
                          label={COPY.summaryMotivation}
                          value={intake.motivation}
                        />
                      ) : null}
                      {intake.constraints ? (
                        <SummaryRow
                          label={COPY.summaryConstraints}
                          value={intake.constraints}
                        />
                      ) : null}
                    </dl>
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      {COPY.summaryHint}
                    </p>
                    {finalError ? (
                      <p className="mt-3 rounded-[11px] border-[2px] border-slate-900 bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
                        {finalError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void generate()}
                      className="bnt-pressable mt-4 inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
                    >
                      <Sparkles className="h-4 w-4" />
                      {COPY.generate}
                    </button>
                  </div>
                ) : null}
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
