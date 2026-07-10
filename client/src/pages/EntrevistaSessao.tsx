import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import {
  AlertTriangle,
  Check,
  Flag,
  Loader2,
  Mic,
  Send,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import { Spinner } from "@/components/ui/spinner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
import {
  finishSession,
  getSession,
  InterviewApiError,
  sendAnswer,
  type InterviewEvaluation,
  type InterviewRating,
  type InterviewSessionDetail,
  type InterviewTurn,
} from "@/services/interviewService";

// Visual no padrao do CurriculoChatPanel (bolhas, TypingDots, autoscroll), mas
// o transporte aqui e POST JSON por turno: sem stream, sem typewriter, as
// respostas chegam inteiras.

const RATING_UI: Record<
  InterviewRating,
  { label: string; icon: typeof Check; box: string; badge: string }
> = {
  // TODO(Ana): labels dos ratings de resposta
  boa: {
    label: "Boa resposta",
    icon: Check,
    box: "border-emerald-500 bg-emerald-50",
    badge: "border-emerald-500 bg-emerald-100 text-emerald-900",
  },
  mediana: {
    label: "Resposta mediana",
    icon: AlertTriangle,
    box: "border-amber-500 bg-amber-50",
    badge: "border-amber-500 bg-amber-100 text-amber-900",
  },
  fraca: {
    label: "Resposta fraca",
    icon: X,
    box: "border-red-500 bg-red-50",
    badge: "border-red-500 bg-red-100 text-red-900",
  },
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="ai-chat-typing-dot h-2.5 w-2.5 rounded-full bg-blue-500"
        />
      ))}
    </div>
  );
}

function QuestionBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,86%)] rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-white px-3.5 py-3 font-body text-[15px] leading-relaxed text-slate-900 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5 sm:text-base">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}

function AnswerBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[min(100%,86%)] rounded-[14px] rounded-tr-sm border-2 border-slate-950 bg-amber-200 px-3.5 py-3 font-body text-[15px] leading-relaxed text-slate-900 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5 sm:text-base">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}

function FeedbackCard({ evaluation }: { evaluation: InterviewEvaluation }) {
  const ui = RATING_UI[evaluation.rating];
  const Icon = ui.icon;
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[min(100%,86%)] rounded-[14px] border-2 px-3.5 py-3 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4",
          ui.box,
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
            ui.badge,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {ui.label}
        </span>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
          {evaluation.feedback}
        </p>
      </div>
    </div>
  );
}

export default function EntrevistaSessao() {
  const params = useParams();
  const sessionId = params.id ?? "";
  const { isPro } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState("");
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setLoadError("");
    getSession(sessionId)
      .then((detail) => {
        if (!alive) return;
        setSession(detail);
        setTurns(detail.turns);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof InterviewApiError && err.code === "not_found") {
          setNotFound(true);
        } else if (
          err instanceof InterviewApiError &&
          err.code === "login_required"
        ) {
          // TODO(Ana): mensagem de login necessario na sessao
          setLoadError("Faça login pra ver esta entrevista.");
        } else {
          // TODO(Ana): mensagem de erro ao carregar a sessao
          setLoadError("Não foi possível carregar a entrevista. Tente de novo.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, sending]);

  async function reloadSession() {
    try {
      const detail = await getSession(sessionId);
      setSession(detail);
      setTurns(detail.turns);
    } catch {
      // Mantem o estado local; o banner do caller ja orienta.
    }
  }

  async function handleSend() {
    if (sending || !session || session.status !== "active") return;
    const trimmed = input.trim();
    if (!trimmed) return;

    setBanner("");
    setInput("");
    const now = new Date().toISOString();
    const optimistic: InterviewTurn = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      evaluation: null,
      created_at: now,
    };
    setTurns((prev) => [...prev, optimistic]);
    setSending(true);

    try {
      const result = await sendAnswer(session.id, trimmed);
      setTurns((prev) => {
        const next = [...prev];
        if (result.evaluation) {
          // Espelha a persistencia do server: fechando, o content do turno
          // avaliado e o proprio feedback; seguindo, e a proxima pergunta.
          next.push({
            id: `local-eval-${Date.now()}`,
            role: "assistant",
            content: result.done
              ? result.evaluation.feedback
              : (result.nextQuestion ?? ""),
            evaluation: result.evaluation,
            created_at: new Date().toISOString(),
          });
        }
        return next;
      });
      if (result.done && result.verdict) {
        const verdict = result.verdict;
        setSession((prev) =>
          prev ? { ...prev, status: "completed", verdict } : prev,
        );
      }
    } catch (err) {
      // Erro recuperavel: desfaz o turno otimista e devolve o texto digitado.
      setTurns((prev) => prev.filter((t) => t.id !== optimistic.id));
      setInput(trimmed);
      if (err instanceof InterviewApiError) {
        if (err.code === "session_completed") {
          // Fechada em outro lugar: recarrega pra mostrar o estado final.
          await reloadSession();
          // TODO(Ana): aviso de sessao encerrada em outro lugar
          setBanner("Esta entrevista já foi encerrada em outra aba.");
        } else {
          setBanner(err.message);
        }
      } else {
        // TODO(Ana): erro generico de envio
        setBanner("Não foi possível enviar agora. Tente de novo.");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleFinish() {
    if (!session || finishing) return;
    setFinishing(true);
    setBanner("");
    try {
      const verdict = await finishSession(session.id);
      setSession((prev) =>
        prev ? { ...prev, status: "completed", verdict } : prev,
      );
      setConfirmingFinish(false);
    } catch (err) {
      if (err instanceof InterviewApiError && err.code === "session_completed") {
        await reloadSession();
      } else {
        setBanner(
          err instanceof InterviewApiError
            ? err.message
            : "Não foi possível encerrar agora. Tente de novo.",
        );
      }
    } finally {
      setFinishing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (loading) {
    return (
      <Layout>
        <SEO title="Entrevista simulada" url="/entrevistas" />
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      </Layout>
    );
  }

  if (notFound || loadError || !session) {
    return (
      <Layout>
        <SEO title="Entrevista simulada" url="/entrevistas" />
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-black text-slate-950">
            {/* TODO(Ana): titulo da tela de sessao nao encontrada */}
            {notFound ? "Entrevista não encontrada" : "Algo deu errado"}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {notFound
              ? "Essa sessão não existe ou não é sua."
              : loadError || "Não foi possível carregar a entrevista."}
          </p>
          <Link
            href="/entrevistas"
            className="bnt-pressable mt-6 inline-flex rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            {/* TODO(Ana): label do link de volta */}
            Voltar pra Entrevistas
          </Link>
        </div>
      </Layout>
    );
  }

  const verdict = session.verdict;
  const completed = session.status === "completed";

  return (
    <Layout>
      <SEO title="Entrevista simulada" url="/entrevistas" />
      <div className="container py-8">
        <div className="card-brutal mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white">
          <div className="flex h-[min(88vh,720px)] min-h-[420px] flex-col">
            <header className="flex shrink-0 items-center gap-3 border-b-2 border-slate-950 bg-[#FFB800] px-4 py-3.5 text-slate-950 sm:px-5 sm:py-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white shadow-[2px_2px_0_#0f172a] sm:h-12 sm:w-12"
                aria-hidden
              >
                <Mic className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-lg font-black tracking-tight sm:text-xl">
                  {/* TODO(Ana): titulo do painel da sessao */}
                  {session.kind === "job"
                    ? "Entrevista pra vaga"
                    : "Treino de entrevista"}
                </h1>
                <p className="mt-0.5 truncate text-xs font-bold leading-snug text-slate-800 sm:text-sm">
                  {session.area ?? "Área não informada"} ·{" "}
                  {session.level ?? "nível não informado"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border-2 border-slate-950 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide",
                  completed ? "bg-emerald-200" : "bg-white",
                )}
              >
                {completed ? "Concluída" : "Em andamento"}
              </span>
            </header>

            <div
              className="wa-chat-wallpaper flex min-h-0 flex-1 flex-col border-b-2 border-slate-950"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4"
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
                  {turns.map((t) => {
                    if (t.role === "user") {
                      return <AnswerBubble key={t.id} content={t.content} />;
                    }
                    // Turno de closing persistido: o veredito abaixo ja o
                    // renderiza, entao nao duplica como bolha.
                    if (
                      completed &&
                      !t.evaluation &&
                      verdict?.closing === t.content
                    ) {
                      return null;
                    }
                    if (t.evaluation) {
                      // Turno avaliado: cartao de feedback sempre; a bolha de
                      // pergunta so quando a sessao seguiu (no fechamento o
                      // content JA E o feedback, nao ha proxima pergunta).
                      const terminal = t.content === t.evaluation.feedback;
                      return (
                        <Fragment key={t.id}>
                          <FeedbackCard evaluation={t.evaluation} />
                          {!terminal ? (
                            <QuestionBubble content={t.content} />
                          ) : null}
                        </Fragment>
                      );
                    }
                    return <QuestionBubble key={t.id} content={t.content} />;
                  })}

                  {sending ? (
                    <div className="flex justify-start">
                      <div className="flex max-w-[min(100%,86%)] items-center rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-white px-3 py-2.5 shadow-[2px_2px_0_#0f172a] sm:px-4">
                        <span className="sr-only">Avaliando sua resposta</span>
                        <TypingDots />
                      </div>
                    </div>
                  ) : null}

                  {completed && verdict ? (
                    <div className="mt-2 rounded-[14px] border-2 border-slate-950 bg-blue-50 px-4 py-4 shadow-[3px_3px_0_#0f172a]">
                      <p className="font-display text-sm font-black uppercase tracking-[0.15em] text-blue-900">
                        {/* TODO(Ana): titulo do veredito final */}
                        {verdict.result === "stopped_early"
                          ? "Entrevista encerrada"
                          : "Veredito final"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        {verdict.goodCount} respostas boas de{" "}
                        {verdict.questionCount} avaliadas
                      </p>
                      {verdict.closing ? (
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                          {verdict.closing}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {banner ? (
              <div className="shrink-0 border-b-2 border-slate-950 bg-red-100 px-4 py-2.5 sm:px-5">
                <p className="text-center text-sm font-bold text-red-900">
                  {banner}
                </p>
              </div>
            ) : null}

            <div className="shrink-0 bg-[#faf8f4] px-3 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-3">
              {completed ? (
                <div className="mx-auto flex w-full max-w-3xl justify-center py-1">
                  <Link
                    href="/entrevistas"
                    className="bnt-pressable inline-flex rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
                  >
                    {/* TODO(Ana): CTA de nova entrevista */}
                    Fazer outra entrevista
                  </Link>
                </div>
              ) : !isPro ? (
                <div className="mx-auto w-full max-w-3xl py-1">
                  <ProGate description="Retomar esta entrevista faz parte do Plano Pro. Seu histórico continua aqui." />
                </div>
              ) : (
                <>
                  <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:gap-3">
                    <label className="sr-only" htmlFor="entrevista-chat-input">
                      Resposta
                    </label>
                    <div className="flex min-h-[48px] flex-1 items-end rounded-2xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]">
                      <textarea
                        id="entrevista-chat-input"
                        rows={1}
                        className="max-h-32 min-h-[48px] w-full resize-y rounded-2xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 sm:py-3.5 sm:text-base"
                        placeholder="Manda tua resposta"
                        value={input}
                        disabled={sending}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                      />
                    </div>
                    <button
                      type="button"
                      className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-45 disabled:hover:translate-y-0 sm:h-[52px] sm:w-[52px]"
                      disabled={sending || !input.trim()}
                      aria-label="Enviar resposta"
                      onClick={() => void handleSend()}
                    >
                      {sending ? (
                        <Spinner className="h-5 w-5 text-slate-950 sm:h-6 sm:w-6" />
                      ) : (
                        <Send className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  <div className="mx-auto mt-2 flex w-full max-w-3xl items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-600">
                      Enter envia · Shift+Enter nova linha
                    </p>
                    {confirmingFinish ? (
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        {/* TODO(Ana): confirmacao de encerramento */}
                        Encerrar mesmo?
                        <button
                          type="button"
                          onClick={() => void handleFinish()}
                          disabled={finishing}
                          className="rounded-full border-2 border-slate-950 bg-red-200 px-3 py-1 font-black text-slate-950 disabled:opacity-60"
                        >
                          {finishing ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            "Sim, encerrar"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingFinish(false)}
                          className="rounded-full border-2 border-slate-950 bg-white px-3 py-1 font-black text-slate-950"
                        >
                          Continuar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingFinish(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden />
                        {/* TODO(Ana): label do botao de encerrar */}
                        Encerrar entrevista
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
