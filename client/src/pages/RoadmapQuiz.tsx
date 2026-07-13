import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { fireProCelebration } from "@/lib/proConfetti";
import { roadmapsMeta } from "@/lib/roadmapV2/meta";
import {
  getHistory,
  QuizServiceError,
  saveAnswers,
  startOrResume,
  submitAttempt,
  type QuizAnswerMap,
  type QuizReviewItem,
  type QuizSubmitResult,
} from "@/services/roadmapQuizService";
import {
  QUESTIONS_PER_ATTEMPT,
  type PublicQuizQuestion,
  type QuizAlternativaId,
} from "@shared/roadmapQuiz/types";

// Pagina da prova final de roadmap (fase 4.3), tela cheia focada, sem o
// Layout global. Uma pergunta por vez, autosave silencioso das respostas
// parciais e correcao 100% no server (o client nunca ve gabarito fora da
// revisao pos-aprovacao).
//
// MEDIDAS ANTI-COPIA, EXPECTATIVA HONESTA: aqui bloqueamos so a copia casual
// (selecao de texto, clipboard, menu de contexto, impressao, atalhos de
// copia/impressao no container e conteudo oculto quando a janela perde o
// foco). Screenshot de sistema NAO tem bloqueio real na web; a protecao de
// verdade e o pool grande com sorteio por tentativa e a revelacao restrita
// do gabarito, ambos no server (fases 4.1/4.2). NAO "melhorar" isto com
// hostilidade inutil (bloquear teclas de acessibilidade, detectar devtools,
// punir perda de foco etc.): dissuasao proporcional, acessibilidade
// preservada.
//
// A marca d'agua com o e-mail do usuario foi REMOVIDA por decisao de produto
// (Ana e Murilo): visual mais limpo, e ela nunca foi a protecao real do
// exame. NAO reintroduzir achando que e melhoria de seguranca; a protecao
// real e a do server, acima.

const AUTOSAVE_DEBOUNCE_MS = 2000;

type Phase =
  | { kind: "loading" }
  | { kind: "gate"; code: "completion_required" | "quiz_unavailable" }
  | { kind: "load_error" }
  | { kind: "exam" }
  | { kind: "result"; result: QuizSubmitResult }
  | { kind: "approved"; score: number | null; review: QuizReviewItem[] };

function frameClass(extra = ""): string {
  return `rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a] ${extra}`;
}

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:pointer-events-none disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:pointer-events-none disabled:opacity-50";

export default function RoadmapQuiz() {
  const params = useParams();
  const slug = params.slug ?? "";
  const meta = useMemo(
    () => roadmapsMeta.find((entry) => entry.slug === slug),
    [slug],
  );
  const trailTitle = meta?.title ?? slug;
  const trailHref = `/roadmaps/${slug}`;

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [confirmBlank, setConfirmBlank] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  // JSON das ultimas respostas persistidas com sucesso; falha de autosave
  // deixa o ref pra tras e a proxima mudanca re-tenta.
  const savedRef = useRef("{}");
  // Conteudo oculto enquanto a janela esta sem foco ou a aba invisivel:
  // dissuasao de screenshot-por-troca-de-janela. Sem timer, sem punicao.
  const [obscured, setObscured] = useState(false);

  useEffect(() => {
    if (phase.kind !== "exam") {
      setObscured(false);
      return;
    }
    const hide = () => setObscured(true);
    const show = () => setObscured(false);
    const onVisibility = () =>
      setObscured(document.visibilityState === "hidden");
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phase.kind]);

  const preventCopyEvent = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };
  // Bloqueio de teclado restrito a atalhos de copia/impressao DENTRO do
  // container da prova; nenhuma tecla de navegacao ou acessibilidade e
  // interceptada.
  const blockCopyShortcuts = (event: React.KeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      ["c", "x", "p"].includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
    }
  };

  const loadApproved = useCallback(async () => {
    try {
      const history = await getHistory(slug);
      const approved = history.attempts.find(
        (attempt) => attempt.status === "aprovada",
      );
      setPhase({
        kind: "approved",
        score: approved?.score ?? null,
        review: history.revisaoAprovada ?? [],
      });
    } catch {
      setPhase({ kind: "load_error" });
    }
  }, [slug]);

  const start = useCallback(async () => {
    setPhase({ kind: "loading" });
    setSubmitError(false);
    setConfirmBlank(false);
    setReviewing(false);
    setIndex(0);
    try {
      const attempt = await startOrResume(slug);
      setAttemptId(attempt.attemptId);
      setQuestions(attempt.questions);
      setAnswers(attempt.answers);
      savedRef.current = JSON.stringify(attempt.answers);
      setPhase({ kind: "exam" });
    } catch (err) {
      if (err instanceof QuizServiceError) {
        if (
          err.code === "completion_required" ||
          err.code === "quiz_unavailable"
        ) {
          setPhase({ kind: "gate", code: err.code });
          return;
        }
        if (err.code === "already_passed") {
          void loadApproved();
          return;
        }
      }
      setPhase({ kind: "load_error" });
    }
  }, [slug, loadApproved]);

  useEffect(() => {
    void start();
  }, [start]);

  // Autosave com debounce: persiste as respostas parciais ~2s depois da
  // ultima mudanca. Silencioso: falha so loga e fica pendente pro proximo
  // tick (o submit envia o estado completo de qualquer forma).
  useEffect(() => {
    if (phase.kind !== "exam" || !attemptId) return;
    const current = JSON.stringify(answers);
    if (current === savedRef.current) return;
    const timer = setTimeout(() => {
      saveAnswers(slug, attemptId, answers)
        .then(() => {
          savedRef.current = current;
        })
        .catch((err) => {
          console.error("[roadmapQuiz] autosave falhou:", err);
        });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [answers, attemptId, phase.kind, slug]);

  const answeredCount = questions.filter(
    (question) => answers[question.id],
  ).length;
  const unansweredCount = questions.length - answeredCount;

  const onAnswer = (questionId: string, alternativa: QuizAlternativaId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: alternativa }));
  };

  const doSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const result = await submitAttempt(slug, attemptId, answers);
      setPhase({ kind: "result", result });
    } catch (err) {
      if (
        err instanceof QuizServiceError &&
        (err.code === "not_active" || err.code === "already_passed")
      ) {
        // Corrida (submit duplo ou outra aba): recarrega o estado do server.
        void start();
        return;
      }
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, slug, answers, start]);

  const handleSubmitClick = () => {
    if (unansweredCount > 0 && !confirmBlank) {
      setConfirmBlank(true);
      return;
    }
    void doSubmit();
  };

  return (
    <div className="bg-[#faf8f4]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-6">
          <Link
            href={trailHref}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {/* TODO(Ana): label do link de volta a trilha */}
            Voltar à trilha
          </Link>
          <h1 className="mt-2 font-display text-2xl font-black text-slate-950">
            {/* TODO(Ana): titulo da pagina da prova */}
            Prova final: {trailTitle}
          </h1>
          {phase.kind === "exam" && !reviewing && questions.length > 0 && (
            <p className="mt-1 text-sm font-bold text-slate-600">
              {/* TODO(Ana): indicador de progresso da prova */}
              Pergunta {index + 1} de {questions.length} ({answeredCount}{" "}
              respondidas)
            </p>
          )}
        </header>

        <div className="hidden rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 print:block">
          <p className="text-sm font-black text-slate-950">
            {/* TODO(Ana): mensagem no lugar do conteudo em impressao */}O
            conteúdo da prova não é imprimível. Volte à tela para continuar.
          </p>
        </div>

        {phase.kind === "loading" && (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
          </div>
        )}

        {phase.kind === "gate" && phase.code === "completion_required" && (
          <div className={frameClass()}>
            <h2 className="font-display text-lg font-black text-slate-950">
              {/* TODO(Ana): titulo do gate de conclusao pendente */}A prova
              destrava ao concluir a trilha
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {/* TODO(Ana): corpo do gate de conclusao pendente */}
              Termine todos os passos obrigatórios da trilha {trailTitle} e
              volte aqui para fazer a prova final.
            </p>
            <div className="mt-4">
              <Link href={trailHref} className={primaryBtn}>
                {/* TODO(Ana): CTA do gate de conclusao pendente */}
                Continuar a trilha
              </Link>
            </div>
          </div>
        )}

        {phase.kind === "gate" && phase.code === "quiz_unavailable" && (
          <div className={frameClass()}>
            <h2 className="font-display text-lg font-black text-slate-950">
              {/* TODO(Ana): titulo do aviso de prova indisponivel */}
              Esta trilha ainda não tem prova final
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {/* TODO(Ana): corpo do aviso de prova indisponivel */}
              Estamos preparando a prova desta trilha. Enquanto isso, continue
              praticando.
            </p>
            <div className="mt-4">
              <Link href={trailHref} className={primaryBtn}>
                {/* TODO(Ana): CTA do aviso de prova indisponivel */}
                Voltar à trilha
              </Link>
            </div>
          </div>
        )}

        {phase.kind === "load_error" && (
          <div className={frameClass()}>
            <p className="text-sm font-semibold text-slate-700">
              {/* TODO(Ana): mensagem de erro de carregamento da prova */}
              Não conseguimos carregar a prova agora. Tente de novo.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void start()}
                className={primaryBtn}
              >
                {/* TODO(Ana): CTA de tentar de novo */}
                Tentar de novo
              </button>
              <Link href={trailHref} className={secondaryBtn}>
                {/* TODO(Ana): CTA de volta no erro de carregamento */}
                Voltar à trilha
              </Link>
            </div>
          </div>
        )}

        {phase.kind === "exam" && (
          <div
            className="relative select-none print:hidden"
            draggable={false}
            onCopy={preventCopyEvent}
            onCut={preventCopyEvent}
            onContextMenu={preventCopyEvent}
            onKeyDown={blockCopyShortcuts}
          >
            {!reviewing && questions[index] && (
              <ExamQuestion
                question={questions[index]}
                position={index + 1}
                total={questions.length}
                selected={answers[questions[index].id] ?? null}
                onAnswer={onAnswer}
                onPrev={() => setIndex((i) => Math.max(0, i - 1))}
                onNext={() => {
                  if (index < questions.length - 1) {
                    setIndex((i) => i + 1);
                  } else {
                    setReviewing(true);
                  }
                }}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
                answers={answers}
                questions={questions}
                onJump={(i) => setIndex(i)}
              />
            )}

            {reviewing && (
              <div className={frameClass()}>
                <h2 className="font-display text-lg font-black text-slate-950">
                  {/* TODO(Ana): titulo da revisao final antes de enviar */}
                  Revise antes de enviar
                </h2>
                <ul className="mt-4 space-y-2">
                  {questions.map((question, i) => {
                    const answered = Boolean(answers[question.id]);
                    return (
                      <li
                        key={question.id}
                        className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white px-3 py-2"
                      >
                        <span className="text-sm font-bold text-slate-900">
                          {/* TODO(Ana): rotulo do item da revisao final */}
                          Pergunta {i + 1}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className={`rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-xs font-black ${
                              answered
                                ? "bg-emerald-200 text-slate-950"
                                : "bg-amber-200 text-slate-950"
                            }`}
                          >
                            {/* TODO(Ana): pills respondida/pulada */}
                            {answered ? "Respondida" : "Pulada"}
                          </span>
                          <button
                            type="button"
                            className="text-xs font-black uppercase tracking-wider text-slate-500 underline hover:text-slate-900"
                            onClick={() => {
                              setReviewing(false);
                              setIndex(i);
                            }}
                          >
                            {/* TODO(Ana): CTA de ir para a pergunta */}
                            Ir para
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {submitError && (
                  <div className="mt-4 rounded-xl border-2 border-slate-900 bg-rose-100 p-3 text-sm font-bold text-slate-900">
                    {/* TODO(Ana): erro de envio da prova */}
                    Não conseguimos enviar sua prova. Verifique a conexão e
                    tente de novo.
                  </div>
                )}

                {confirmBlank && unansweredCount > 0 ? (
                  <div className="mt-4 rounded-xl border-2 border-slate-900 bg-amber-100 p-4">
                    <p className="text-sm font-bold text-slate-900">
                      {/* TODO(Ana): confirmacao de envio com perguntas em branco */}
                      Você tem {unansweredCount}{" "}
                      {unansweredCount === 1
                        ? "pergunta em branco. Ela conta"
                        : "perguntas em branco. Elas contam"}{" "}
                      como erradas. Enviar mesmo assim?
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void doSubmit()}
                        disabled={submitting}
                        className={primaryBtn}
                      >
                        {/* TODO(Ana): CTA de confirmar envio com brancos */}
                        {submitting ? "Enviando..." : "Enviar mesmo assim"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBlank(false)}
                        disabled={submitting}
                        className={secondaryBtn}
                      >
                        {/* TODO(Ana): CTA de continuar respondendo */}
                        Continuar respondendo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSubmitClick}
                      disabled={submitting}
                      className={primaryBtn}
                    >
                      <Send className="h-4 w-4" />
                      {/* TODO(Ana): CTA de enviar a prova */}
                      {submitting ? "Enviando..." : "Enviar prova"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewing(false)}
                      disabled={submitting}
                      className={secondaryBtn}
                    >
                      {/* TODO(Ana): CTA de voltar as perguntas */}
                      Voltar às perguntas
                    </button>
                  </div>
                )}
              </div>
            )}

            {obscured && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[14px] border-[2.5px] border-slate-900 bg-slate-950 p-6">
                <p className="text-center text-sm font-black text-white">
                  {/* TODO(Ana): mensagem da prova pausada sem foco */}
                  Prova pausada. Volte para esta janela para continuar.
                </p>
              </div>
            )}
          </div>
        )}

        {phase.kind === "result" && phase.result.status === "reprovada" && (
          <div className={frameClass()}>
            <h2 className="font-display text-lg font-black text-slate-950">
              {/* TODO(Ana): titulo do estado reprovado */}
              Ainda não foi dessa vez
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {/* TODO(Ana): corpo do estado reprovado */}
              Você acertou {phase.result.score} de{" "}
              {phase.result.porPergunta.length} (o mínimo é{" "}
              {phase.result.passScore}). Revise os passos da trilha e refaça a
              prova quando quiser: cada tentativa sorteia perguntas novas.
            </p>
            <ul className="mt-4 space-y-1.5">
              {phase.result.porPergunta.map((grade, i) => (
                <li
                  key={grade.id}
                  className="flex items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-3 py-2"
                >
                  <span className="text-sm font-bold text-slate-900">
                    {/* TODO(Ana): rotulo do item da lista de resultado */}
                    Pergunta {i + 1}
                  </span>
                  <span
                    className={`rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-xs font-black ${
                      grade.anulada
                        ? "bg-sky-200 text-slate-950"
                        : grade.acertou
                          ? "bg-emerald-200 text-slate-950"
                          : "bg-rose-200 text-slate-950"
                    }`}
                  >
                    {/* TODO(Ana): pills acertou/errou/anulada do resultado */}
                    {grade.anulada
                      ? "Anulada a seu favor"
                      : grade.acertou
                        ? "Acertou"
                        : "Errou"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void start()}
                className={primaryBtn}
              >
                {/* TODO(Ana): CTA de refazer a prova */}
                Refazer a prova
              </button>
              <Link href={trailHref} className={secondaryBtn}>
                {/* TODO(Ana): CTA de volta a trilha no reprovado */}
                Revisar a trilha
              </Link>
            </div>
          </div>
        )}

        {phase.kind === "result" && phase.result.status === "aprovada" && (
          <ApprovedResult
            score={phase.result.score}
            total={phase.result.porPergunta.length}
            review={phase.result.revisao ?? []}
            trailHref={trailHref}
          />
        )}

        {phase.kind === "approved" && (
          <ApprovedResult
            score={phase.score}
            total={QUESTIONS_PER_ATTEMPT}
            review={phase.review}
            trailHref={trailHref}
            persistent
          />
        )}
      </div>
    </div>
  );
}

// Mesma janela curta de confete do modal de conclusao da F2: burst inicial e
// um ou dois ticks, nada alem.
const APPROVAL_CONFETTI_MS = 700;

type ApprovedResultProps = {
  score: number | null;
  total: number;
  review: QuizReviewItem[];
  trailHref: string;
  // Visita posterior de quem ja foi aprovado: mostra o estado sem re-celebrar.
  persistent?: boolean;
};

function ApprovedResult({
  score,
  total,
  review,
  trailHref,
  persistent = false,
}: ApprovedResultProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (persistent || reduce) return;
    const stop = fireProCelebration({ x: 0.5, y: 0.35 });
    const timer = setTimeout(stop, APPROVAL_CONFETTI_MS);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [persistent, reduce]);

  return (
    <div
      className={frameClass(
        "border-emerald-600 bg-emerald-50 shadow-[4px_4px_0_#10b981]",
      )}
    >
      <h2 className="flex items-center gap-2 font-display text-xl font-black text-slate-950">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        {/* TODO(Ana): titulo do estado aprovado */}
        Prova aprovada{score != null ? ` com ${score} de ${total}` : ""}!
      </h2>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        {/* TODO(Ana): corpo do estado aprovado */}
        Aprovação registrada para sempre nesta trilha. Revise abaixo cada
        pergunta com a resposta correta e a explicação.
      </p>

      {review.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            {/* TODO(Ana): titulo da secao de revisao da prova */}
            Revisão da prova
          </h3>
          <div className="mt-3 space-y-2">
            {review.map((item, i) => (
              <details
                key={item.id}
                className="rounded-xl border-2 border-slate-900 bg-white"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-900">
                  {/* TODO(Ana): rotulo do item expansivel da revisao */}
                  Pergunta {i + 1}
                  {item.respostaDoUsuario === item.correta
                    ? " (acertou)"
                    : " (errou)"}
                </summary>
                <div className="border-t-2 border-slate-200 px-4 py-3">
                  <p className="text-sm font-bold text-slate-950">
                    {item.pergunta}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {item.alternativas.map((alternativa, j) => {
                      const isCorrect = alternativa.id === item.correta;
                      const isUser = alternativa.id === item.respostaDoUsuario;
                      return (
                        <li
                          key={alternativa.id}
                          className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold text-slate-800 ${
                            isCorrect
                              ? "border-emerald-600 bg-emerald-50"
                              : isUser
                                ? "border-rose-400 bg-rose-50"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="font-black">
                            {String.fromCharCode(65 + j)})
                          </span>{" "}
                          {alternativa.texto}
                          {isCorrect && (
                            <span className="ml-2 rounded-full border border-slate-900 bg-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase">
                              {/* TODO(Ana): marcador de alternativa correta */}
                              Correta
                            </span>
                          )}
                          {isUser && (
                            <span className="ml-2 rounded-full border border-slate-900 bg-white px-2 py-0.5 text-[10px] font-black uppercase">
                              {/* TODO(Ana): marcador da resposta do usuario */}
                              Sua resposta
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {item.explicacao}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <Link href={trailHref} className={primaryBtn}>
          {/* TODO(Ana): CTA de volta a trilha no aprovado */}
          Voltar à trilha
        </Link>
      </div>
    </div>
  );
}

type ExamQuestionProps = {
  question: PublicQuizQuestion;
  position: number;
  total: number;
  selected: QuizAlternativaId | null;
  onAnswer: (questionId: string, alternativa: QuizAlternativaId) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  answers: QuizAnswerMap;
  questions: PublicQuizQuestion[];
  onJump: (index: number) => void;
};

function ExamQuestion({
  question,
  position,
  total,
  selected,
  onAnswer,
  onPrev,
  onNext,
  isFirst,
  isLast,
  answers,
  questions,
  onJump,
}: ExamQuestionProps) {
  return (
    <div>
      <nav
        aria-label="Perguntas da prova"
        className="mb-4 flex flex-wrap gap-1.5"
      >
        {questions.map((entry, i) => {
          const isCurrent = i === position - 1;
          const answered = Boolean(answers[entry.id]);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Pergunta ${i + 1}${answered ? ", respondida" : ""}`}
              className={`h-8 w-8 rounded-lg border-2 text-xs font-black transition-colors ${
                isCurrent
                  ? "border-slate-900 bg-[#FFB800] text-slate-950 shadow-[2px_2px_0_#0f172a]"
                  : answered
                    ? "border-slate-900 bg-emerald-200 text-slate-950"
                    : "border-slate-300 bg-white text-slate-500 hover:border-slate-900"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <fieldset className={frameClass()}>
        <legend className="sr-only">
          Pergunta {position} de {total}
        </legend>
        <p className="text-base font-bold text-slate-950">
          {question.pergunta}
        </p>
        <div
          className="mt-4 space-y-2"
          role="radiogroup"
          aria-label="Alternativas"
        >
          {question.alternativas.map((alternativa, i) => {
            const isSelected = selected === alternativa.id;
            return (
              <label
                key={alternativa.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-900 has-[:focus-visible]:ring-offset-2 ${
                  isSelected
                    ? "border-slate-900 bg-amber-100 shadow-[3px_3px_0_#0f172a]"
                    : "border-slate-200 bg-white hover:border-slate-900"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={question.id}
                  value={alternativa.id}
                  checked={isSelected}
                  onChange={() => onAnswer(question.id, alternativa.id)}
                />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white font-display text-sm font-black text-slate-950">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="pt-1 text-sm font-semibold text-slate-800">
                  {alternativa.texto}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={secondaryBtn}
        >
          <ArrowLeft className="h-4 w-4" />
          {/* TODO(Ana): CTA pergunta anterior */}
          Anterior
        </button>
        <button type="button" onClick={onNext} className={primaryBtn}>
          {/* TODO(Ana): CTA proxima pergunta / revisao */}
          {isLast ? "Revisar respostas" : "Próxima"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
