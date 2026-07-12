import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Flag,
  Lightbulb,
  Loader2,
  Mic,
  Send,
  Square,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import { Spinner } from "@/components/ui/spinner";
import {
  AnswerBubble,
  AssistantRow,
  CHAT_PAPER_CLASS,
  FeedbackCard,
  HintCard,
  QuestionBubble,
  TypingDots,
  UserRow,
} from "@/components/interview/SessionChatSkin";
import InterviewBackdrop from "@/components/interview/InterviewBackdrop";
import SessionProgress from "@/components/interview/SessionProgress";
import SessionVerdict from "@/components/interview/SessionVerdict";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  MAX_RECORDING_SECONDS,
  useAudioRecorder,
} from "@/hooks/useAudioRecorder";
import { apiUrl } from "@/lib/api";
import { showErrorToast } from "@/lib/notify";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  finishSession,
  getSession,
  InterviewApiError,
  requestHint,
  sendAnswer,
  type InterviewProgress,
  type InterviewSessionDetail,
  type InterviewTurn,
} from "@/services/interviewService";

// Pele do chat no padrao do CurriculoChatPanel reformado, duplicada em BLUE
// (SessionChatSkin); o transporte segue POST JSON por turno: sem stream, sem
// typewriter, as respostas chegam inteiras.

const ac = getPageAccentUi("blue");

// Espelhos do server: cap de bytes do audio (audioTranscribe.ts) e teto de
// caracteres do answer (AnswerSchema). O client avisa ANTES do server rejeitar.
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const ANSWER_MAX_CHARS = 4_000;
const CHAR_COUNTER_THRESHOLD = 3_600;
// Teto do auto-grow do textarea do composer, equivalente ao max-h-32 (que
// permanece nas classes como cinto de seguranca): o campo cresce com o
// conteudo ate aqui e so entao passa a rolar.
const COMPOSER_MAX_HEIGHT_PX = 128;

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Mesmo padrao do AvatarPhotoPanel: o blob vira data URL base64 no navegador.
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("audio_read_failed"));
    reader.readAsDataURL(blob);
  });
}

// Chamada direta (com o mesmo Bearer do interviewService): transcricao e
// pre-envio, devolve texto para o composer e nao cria turno nenhum.
async function requestTranscription(
  sessionId: string,
  audioBase64: string,
): Promise<string> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    apiUrl(`/api/interview/sessions/${encodeURIComponent(sessionId)}/transcribe`),
    { method: "POST", headers, body: JSON.stringify({ audioBase64 }) },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      body.error?.message ||
        // TODO(Ana): erro generico de transcricao no client.
        "Nao foi possivel transcrever o audio agora. Tente de novo.",
    );
  }

  const body = (await response.json()) as { data?: { text?: unknown } };
  if (typeof body.data?.text !== "string") {
    // TODO(Ana): erro de resposta inesperada da transcricao.
    throw new Error("Resposta inesperada ao transcrever o audio.");
  }
  return body.data.text;
}


export default function EntrevistaSessao() {
  const params = useParams();
  const sessionId = params.id ?? "";
  const { isPro } = useSubscription();
  const reduce = useReducedMotion() ?? false;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  // Preparo AO VIVO: inicializa do getSession e avanca SOMENTE com
  // response.progress do server (dado real; o rollback do turno otimista nao
  // toca aqui). Ausente na resposta = mantem o ultimo conhecido.
  const [progress, setProgress] = useState<InterviewProgress | null>(null);
  // true apenas quando o fechamento preparado aconteceu NESTA visita: e o que
  // libera o confetti da conquista (retomada mostra o cartao sem confetti).
  const [justPrepared, setJustPrepared] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [banner, setBanner] = useState("");
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Resposta por voz: o hook grava; a transcricao acontece aqui e o texto
  // SEMPRE cai no input editavel (nunca envio automatico).
  const recorder = useAudioRecorder({
    onRecorded: (blob) => void handleTranscribe(blob),
  });
  const recorderBusy =
    recorder.status === "recording" || recorder.status === "transcribing";

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
        setProgress({
          questionCount: detail.question_count,
          goodCount: detail.good_count,
          goodStreak: detail.good_streak,
        });
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
  }, [turns, sending, hintLoading]);

  // Auto-grow do textarea: dirigido pelo VALOR (cobre digitacao, o append da
  // transcricao de voz e o esvaziar pos-envio, sem tocar em handler nenhum).
  // Zera a altura pra medir o scrollHeight real e trava no teto; rolagem so
  // acima dele.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY =
      el.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [input]);

  async function reloadSession() {
    try {
      const detail = await getSession(sessionId);
      setSession(detail);
      setTurns(detail.turns);
    } catch {
      // Mantem o estado local; o banner do caller ja orienta.
    }
  }

  async function handleTranscribe(blob: Blob) {
    if (!session) {
      recorder.reset();
      return;
    }
    if (blob.size > MAX_AUDIO_BYTES) {
      // TODO(Ana): aviso de gravacao acima do limite de tamanho.
      showErrorToast(
        "A gravacao ficou grande demais (limite de 5MB). Descarte e grave um audio mais curto.",
      );
      recorder.markError();
      return;
    }
    try {
      const audioBase64 = await blobToBase64(blob);
      const text = (await requestTranscription(session.id, audioBase64)).trim();
      if (!text) {
        // TODO(Ana): aviso de audio sem fala reconhecivel.
        showErrorToast(
          "Nao consegui entender o audio. Tente de novo ou digite a resposta.",
        );
        recorder.markError();
        return;
      }
      // Appenda ao que ja existe (um espaco separa) e devolve o foco com o
      // cursor no final: o texto e da pessoa, ela revisa e envia quando quiser.
      setInput((prev) => {
        const base = prev.replace(/\s+$/, "");
        return base.length > 0 ? `${base} ${text}` : text;
      });
      recorder.reset();
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    } catch (err) {
      showErrorToast(
        err instanceof Error && err.message
          ? err.message
          : // TODO(Ana): erro generico de transcricao no client.
            "Nao foi possivel transcrever o audio agora. Tente de novo.",
      );
      recorder.markError();
    }
  }

  function handleRetryTranscribe() {
    const blob = recorder.pendingBlob;
    if (!blob || recorder.status !== "error") return;
    recorder.markTranscribing();
    void handleTranscribe(blob);
  }

  async function handleSend() {
    if (sending || hintLoading || recorderBusy) return;
    if (!session || session.status !== "active") return;
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > ANSWER_MAX_CHARS) return;

    setBanner("");
    setInput("");
    const now = new Date().toISOString();
    const optimistic: InterviewTurn = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      evaluation: null,
      kind: "answer",
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
            kind: "answer",
            created_at: new Date().toISOString(),
          });
        }
        return next;
      });
      if (result.progress) {
        setProgress(result.progress);
      }
      if (result.done && result.verdict) {
        const verdict = result.verdict;
        setSession((prev) =>
          prev ? { ...prev, status: "completed", verdict } : prev,
        );
        if (verdict.result === "prepared") {
          // Fechamento preparado AO VIVO: libera a celebracao (uma vez).
          setJustPrepared(true);
        }
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

  async function handleHint() {
    if (hintLoading || sending || recorderBusy) return;
    if (!session || session.status !== "active") {
      return;
    }
    setBanner("");
    setHintLoading(true);
    try {
      const hint = await requestHint(session.id);
      setTurns((prev) => [
        ...prev,
        {
          id: `local-hint-${Date.now()}`,
          role: "assistant",
          content: hint,
          evaluation: null,
          kind: "hint",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      if (err instanceof InterviewApiError && err.code === "session_completed") {
        await reloadSession();
        // TODO(Ana): aviso de sessao encerrada em outro lugar
        setBanner("Esta entrevista já foi encerrada em outra aba.");
      } else if (err instanceof InterviewApiError) {
        setBanner(err.message);
      } else {
        // TODO(Ana): erro generico ao pedir dica
        setBanner("Não foi possível pedir a dica agora. Tente de novo.");
      }
    } finally {
      setHintLoading(false);
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
        {/* Mesmo fundo da arena tambem no loading: sem piscar branco antes
            do card montar. O backdrop e aria-hidden e pointer-events-none
            por construcao. */}
        <section className="relative overflow-hidden bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
          <InterviewBackdrop reduce={reduce} />
          <div className="relative z-10 flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8" />
          </div>
        </section>
      </Layout>
    );
  }

  if (notFound || loadError || !session) {
    return (
      <Layout>
        <SEO title="Entrevista simulada" url="/entrevistas" />
        <section className="relative overflow-hidden bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
          <InterviewBackdrop reduce={reduce} />
          <div className="container relative z-10 py-20 text-center">
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
        </section>
      </Layout>
    );
  }

  const verdict = session.verdict;
  const completed = session.status === "completed";
  // Dica disponivel quando ha uma pergunta em aberto aguardando resposta (a
  // ultima fala e do entrevistador e nao e ela mesma uma dica): uma dica por
  // pergunta, a proxima libera apos a resposta real.
  const lastTurn = turns[turns.length - 1];
  const canAskHint =
    !completed && lastTurn?.role === "assistant" && lastTurn.kind === "answer";

  return (
    <Layout>
      <SEO title="Entrevista simulada" url="/entrevistas" />
      {/* Fundo da ARENA (mesma familia da pagina principal da E3): cream +
          micro-pontilhado + cenario vivo atras do card, fechando a identidade
          entre as duas telas. */}
      <section className="relative overflow-hidden bg-[#faf8f4] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <InterviewBackdrop reduce={reduce} />
        <div className="container relative z-10 py-8">
        {/* Slot superior esquerdo de voltar, planta do slot do Portfolio
            (ArrowLeft + rotulo em ac.link), alinhado a borda do card. */}
        <div className="mx-auto mb-4 w-full max-w-4xl">
          <Link
            href="/entrevistas"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-bold",
              ac.link,
              ac.linkHover,
            )}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {/* TODO(Ana): label do link de voltar da sessao */}
            Voltar pra Entrevistas
          </Link>
        </div>
        <div className="card-brutal mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white">
          <div className="flex h-[min(88vh,720px)] min-h-[420px] flex-col">
            {/* Header re-skin BLUE (o microfone saiu na E2: o controle real de
                gravacao vive no composer). O indicador de preparo ao vivo
                entra como segunda linha e some quando a sessao fecha (o
                veredito assume). */}
            <header className="shrink-0 border-b-2 border-slate-950 bg-blue-300 px-4 py-3 text-slate-950 sm:px-5 sm:py-3.5">
              <div className="flex items-center gap-3">
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
              </div>
              {!completed && progress ? (
                <div className="mt-2">
                  <SessionProgress
                    goodStreak={progress.goodStreak}
                    goodCount={progress.goodCount}
                    questionCount={progress.questionCount}
                    reduce={reduce}
                  />
                </div>
              ) : null}
            </header>

            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col border-b-2 border-slate-950",
                CHAT_PAPER_CLASS,
              )}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4"
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
                  {turns.map((t, i) => {
                    // Avatar so no inicio de sequencia do autor (padrao do
                    // molde); as demais pecas da sequencia levam spacer.
                    const groupStart = i === 0 || turns[i - 1].role !== t.role;
                    if (t.role === "user") {
                      return (
                        <UserRow key={t.id} groupStart={groupStart}>
                          <AnswerBubble content={t.content} />
                        </UserRow>
                      );
                    }
                    if (t.kind === "hint") {
                      return (
                        <AssistantRow key={t.id} groupStart={groupStart}>
                          <HintCard content={t.content} />
                        </AssistantRow>
                      );
                    }
                    // Turno de fechamento (kind closing, marcado pelo server):
                    // o veredito abaixo ja o renderiza, nao duplica como bolha.
                    if (t.kind === "closing") {
                      return null;
                    }
                    if (t.evaluation) {
                      // Turno avaliado: cartao de feedback sempre; a bolha de
                      // pergunta so quando a sessao seguiu. A decisao e pelo
                      // marcador ESTRUTURAL evaluation.terminal; a comparacao
                      // de strings abaixo e FALLBACK LEGADO para sessoes
                      // anteriores ao marcador (remover quando envelhecerem).
                      const terminal =
                        t.evaluation.terminal === true ||
                        t.content === t.evaluation.feedback;
                      return (
                        <Fragment key={t.id}>
                          <AssistantRow groupStart={groupStart}>
                            <FeedbackCard evaluation={t.evaluation} />
                          </AssistantRow>
                          {!terminal ? (
                            <AssistantRow groupStart={false}>
                              <QuestionBubble content={t.content} />
                            </AssistantRow>
                          ) : null}
                        </Fragment>
                      );
                    }
                    return (
                      <AssistantRow key={t.id} groupStart={groupStart}>
                        <QuestionBubble content={t.content} />
                      </AssistantRow>
                    );
                  })}

                  {sending || hintLoading ? (
                    <AssistantRow groupStart>
                      <div className="flex max-w-[min(100%,86%)] items-center rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-white px-3 py-2.5 shadow-[2px_2px_0_#0f172a] sm:px-4">
                        <span className="sr-only">
                          {sending ? "Avaliando sua resposta" : "Preparando a dica"}
                        </span>
                        <TypingDots reduce={reduce} />
                      </div>
                    </AssistantRow>
                  ) : null}

                  {completed && verdict ? (
                    <SessionVerdict
                      verdict={verdict}
                      celebrate={justPrepared}
                      reduce={reduce}
                    />
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
                  {recorder.status === "recording" ? (
                    <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-xl border-2 border-red-400 bg-red-50 px-3 py-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-600 motion-reduce:animate-none"
                        aria-hidden
                      />
                      <p className="text-xs font-bold text-red-900">
                        {/* TODO(Ana): estado de gravacao em andamento. */}
                        Gravando... {formatElapsed(recorder.elapsedSeconds)} /{" "}
                        {formatElapsed(MAX_RECORDING_SECONDS)}
                      </p>
                    </div>
                  ) : null}
                  {recorder.status === "transcribing" ? (
                    <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5">
                      <Spinner className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                      <p className="text-xs font-bold text-slate-700">
                        {/* TODO(Ana): estado de transcricao em andamento. */}
                        Transcrevendo o audio...
                      </p>
                    </div>
                  ) : null}
                  {recorder.status === "error" && recorder.pendingBlob ? (
                    <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-1.5">
                      <p className="text-xs font-bold text-amber-900">
                        {/* TODO(Ana): aviso de gravacao pendente apos falha. */}
                        A gravacao ficou guardada.
                      </p>
                      <button
                        type="button"
                        onClick={handleRetryTranscribe}
                        className="rounded-full border-2 border-slate-950 bg-white px-3 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                      >
                        {/* TODO(Ana): acao de tentar transcrever de novo. */}
                        Tentar de novo
                      </button>
                      <button
                        type="button"
                        onClick={() => recorder.discard()}
                        className="rounded-full border-2 border-slate-950 bg-white px-3 py-0.5 text-xs font-black text-slate-600 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-700"
                      >
                        {/* TODO(Ana): acao de descartar a gravacao. */}
                        Descartar
                      </button>
                    </div>
                  ) : null}
                  {/* flex-wrap: em 375px os controles de voz + enviar podem
                      quebrar em linha propria abaixo do textarea; nada some e
                      nada gera scroll horizontal. */}
                  <div className="mx-auto flex w-full max-w-3xl flex-wrap items-end gap-2 sm:gap-3">
                    <label className="sr-only" htmlFor="entrevista-chat-input">
                      Resposta
                    </label>
                    {/* Mesmos tokens do ac.input blue, em versao focus-within
                        (o foco visivel sobe do textarea pro container, padrao
                        do molde reformado). */}
                    <div className="flex min-h-[48px] min-w-[200px] flex-1 items-end rounded-2xl border-2 border-blue-200 bg-white shadow-[3px_3px_0_#0f172a] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                      <textarea
                        id="entrevista-chat-input"
                        ref={inputRef}
                        rows={1}
                        className="max-h-32 min-h-[48px] w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 sm:py-3.5 sm:text-base"
                        placeholder="Manda tua resposta"
                        value={input}
                        disabled={sending}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                      />
                    </div>
                    {recorder.supported ? (
                      recorder.status === "recording" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => recorder.stop()}
                            /* TODO(Ana): label do botao de parar gravacao. */
                            aria-label="Parar gravacao e transcrever"
                            className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-red-600 text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px sm:h-[52px] sm:w-[52px]"
                          >
                            <Square className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => recorder.discard()}
                            /* TODO(Ana): label do botao de descartar gravacao. */
                            aria-label="Descartar gravacao"
                            className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-slate-600 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-700 sm:h-[52px] sm:w-[52px]"
                          >
                            <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void recorder.start()}
                          disabled={
                            sending ||
                            hintLoading ||
                            recorder.status === "transcribing" ||
                            recorder.status === "error"
                          }
                          /* TODO(Ana): label do botao de gravar resposta. */
                          aria-label="Gravar resposta por voz"
                          className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-45 disabled:hover:translate-y-0 sm:h-[52px] sm:w-[52px]"
                        >
                          {recorder.status === "transcribing" ? (
                            <Spinner className="h-5 w-5 text-slate-950 sm:h-6 sm:w-6" />
                          ) : (
                            <Mic className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                          )}
                        </button>
                      )
                    ) : null}
                    <button
                      type="button"
                      className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-45 disabled:hover:translate-y-0 sm:h-[52px] sm:w-[52px]"
                      disabled={
                        sending ||
                        hintLoading ||
                        recorderBusy ||
                        !input.trim() ||
                        input.trim().length > ANSWER_MAX_CHARS
                      }
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
                  {/* Rodape com respiro: texto do Enter (e o contador, quando
                      aparece) a esquerda; dica e encerrar lado a lado num
                      grupo a direita com alturas iguais. Em 375px os itens
                      quebram em linhas sem scroll horizontal. */}
                  <div className="mx-auto mt-2 flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <p className="text-xs font-bold text-slate-600">
                        Enter envia · Shift+Enter nova linha
                      </p>
                      {input.length > CHAR_COUNTER_THRESHOLD ? (
                        <p
                          className={cn(
                            "text-xs font-bold",
                            input.length > ANSWER_MAX_CHARS
                              ? "text-red-700"
                              : "text-slate-500",
                          )}
                        >
                          {/* TODO(Ana): contador de caracteres do composer. */}
                          {input.length}/{ANSWER_MAX_CHARS}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canAskHint ? (
                        <button
                          type="button"
                          onClick={() => void handleHint()}
                          disabled={hintLoading || sending || recorderBusy}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 px-3 py-1.5 text-xs font-bold text-blue-900 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0",
                            ac.panelSoft,
                          )}
                        >
                          {hintLoading ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {/* TODO(Ana): label do botao de pedir dica. */}
                          Pedir uma dica
                        </button>
                      ) : null}
                      {confirmingFinish ? (
                        <span className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                          {/* TODO(Ana): confirmacao de encerramento */}
                          Encerrar mesmo?
                          <button
                            type="button"
                            onClick={() => void handleFinish()}
                            disabled={finishing}
                            className="rounded-full border-2 border-slate-950 bg-red-200 px-3 py-1.5 font-black text-slate-950 disabled:opacity-60"
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
                            className="rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 font-black text-slate-950"
                          >
                            Continuar
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingFinish(true)}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                        >
                          <Flag className="h-3.5 w-3.5" aria-hidden />
                          {/* TODO(Ana): label do botao de encerrar */}
                          Encerrar entrevista
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </section>
    </Layout>
  );
}
