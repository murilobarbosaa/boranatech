import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BrainCircuit,
  ChevronLeft,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ResetQuizConfirmModal } from "@/components/profile/ResetQuizConfirmModal";
import { areasTI } from "@/lib/data";
import {
  triageQuestions,
  objetivoQuestion,
  motivoQuestion,
  quizByLevel,
  classifyTriageLevel,
  type QuizLevel,
  LEVEL_QUESTION_COUNT,
  QUIZ_ESTIMATED_MINUTES,
} from "@/lib/platformData";
import { persistQuizResult } from "@/services/careerQuizService";

type QuizPhase = "intro" | "triage" | "questions" | "completing";

const RESULT_SESSION_KEY = "quiz-carreira.last-result";

interface StoredResultArea {
  area: string;
  score: number;
  percentage: number;
  slug?: string;
}

interface StoredResult {
  resultArea: string;
  resultAreaSlug: string;
  confidence: number;
  topAreas: StoredResultArea[];
  reasons: string[];
  completedAt: string;
}

// Tipo minimo aceito pela tela de pergunta. Tanto QuizQuestion quanto
// TriageQuestion satisfazem este shape, entao o mesmo componente serve as duas fases.
interface ScreenQuestion {
  category: string;
  question: string;
  options: { label: string }[];
}

const STORAGE_KEY = "boranatech.quiz-carreira.progress.v2";
const STORAGE_TTL_DAYS = 30;

interface StoredProgress {
  phase: "triage" | "questions";
  level: QuizLevel | null;
  triageAnswers: Record<string, number>;
  triageIndex: number;
  answers: Record<string, number>;
  currentIndex: number;
  savedAt: number;
}

function loadProgress(): StoredProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProgress;
    const ageDays = (Date.now() - parsed.savedAt) / (1000 * 60 * 60 * 24);
    if (ageDays > STORAGE_TTL_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(data: Omit<StoredProgress, "savedAt">) {
  try {
    const payload: StoredProgress = { ...data, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage cheio ou indisponível, silencioso
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silencioso
  }
}

// Etapa inicial (triagem): objetivo, motivo e as 3 perguntas de nivel, nessa ordem.
// objetivo/motivo sao so capturados; o nivel e classificado pelas 3 ultimas.
interface TriageStep {
  id: string;
  kind: "objetivo" | "motivo" | "level";
  question: ScreenQuestion;
}

const triageSteps: TriageStep[] = [
  { id: objetivoQuestion.id, kind: "objetivo", question: objetivoQuestion },
  { id: motivoQuestion.id, kind: "motivo", question: motivoQuestion },
  ...triageQuestions.map(
    (q): TriageStep => ({ id: q.id, kind: "level", question: q }),
  ),
];

export default function QuizCarreira() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [triageAnswers, setTriageAnswers] = useState<Record<string, number>>({});
  const [triageIndex, setTriageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const levelQuestions = level ? quizByLevel[level] : [];

  useEffect(() => {
    const saved = loadProgress();
    if (
      saved &&
      (Object.keys(saved.triageAnswers).length > 0 ||
        Object.keys(saved.answers).length > 0)
    ) {
      setResumeAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (phase !== "triage" && phase !== "questions") return;
    const hasProgress =
      Object.keys(triageAnswers).length > 0 || Object.keys(answers).length > 0;
    if (hasProgress) {
      saveProgress({
        phase,
        level,
        triageAnswers,
        triageIndex,
        answers,
        currentIndex,
      });
    }
  }, [phase, level, triageAnswers, triageIndex, answers, currentIndex]);

  const handleStart = (resume: boolean) => {
    if (resume) {
      const saved = loadProgress();
      if (saved) {
        setLevel(saved.level);
        setTriageAnswers(saved.triageAnswers);
        setTriageIndex(saved.triageIndex);
        setAnswers(saved.answers);
        setCurrentIndex(saved.currentIndex);
        setPhase(saved.phase);
        return;
      }
    }
    // Comecar do zero: sempre inicia pela triagem de nivel.
    setLevel(null);
    setTriageAnswers({});
    setTriageIndex(0);
    setAnswers({});
    setCurrentIndex(0);
    clearProgress();
    setPhase("triage");
  };

  const handleTriageAnswer = (optionIndex: number) => {
    const step = triageSteps[triageIndex];
    const newTriage = { ...triageAnswers, [step.id]: optionIndex };
    setTriageAnswers(newTriage);

    window.setTimeout(() => {
      if (triageIndex < triageSteps.length - 1) {
        setTriageIndex(triageIndex + 1);
        return;
      }
      // Etapa inicial completa: classifica o nivel de forma deterministica
      // usando apenas as 3 perguntas de nivel (objetivo/motivo nao entram).
      const levels = triageQuestions.map(
        (q) => q.options[newTriage[q.id]].level,
      );
      const computed = classifyTriageLevel(levels);
      // Se o nivel mudou (ex: voltou e refez a triagem), zera o quiz do nivel.
      if (computed !== level) {
        setAnswers({});
        setCurrentIndex(0);
      }
      setLevel(computed);
      setPhase("questions");
    }, 400);
  };

  const handleTriageBack = () => {
    if (triageIndex > 0) {
      setTriageIndex(triageIndex - 1);
    } else {
      setPhase("intro");
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const question = levelQuestions[currentIndex];
    const newAnswers = { ...answers, [question.id]: optionIndex };
    setAnswers(newAnswers);

    window.setTimeout(() => {
      if (currentIndex < levelQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        handleComplete(newAnswers);
      }
    }, 400);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Voltar da 1a pergunta do nivel retorna a etapa inicial, permitindo revisar.
      setTriageIndex(triageSteps.length - 1);
      setPhase("triage");
    }
  };

  const handleReset = () => {
    setResetModalOpen(true);
  };

  const handleResetConfirmed = () => {
    setLevel(null);
    setTriageAnswers({});
    setTriageIndex(0);
    setAnswers({});
    setCurrentIndex(0);
    clearProgress();
    setResumeAvailable(false);
    setPhase("intro");
  };

  const handleComplete = (finalAnswers: Record<string, number>) => {
    setPhase("completing");

    const scores: Record<string, number> = {};
    const reasonsByArea: Record<string, string[]> = {};
    const principalCounts: Record<string, number> = {};

    levelQuestions.forEach((question) => {
      const optionIndex = finalAnswers[question.id];
      if (optionIndex === undefined) return;
      const option = question.options[optionIndex];
      if (!option) return;

      principalCounts[option.area] = (principalCounts[option.area] || 0) + 1;

      Object.entries(option.scores).forEach(([area, score]) => {
        scores[area] = (scores[area] || 0) + score;
        if (score >= 3) {
          reasonsByArea[area] = [
            ...(reasonsByArea[area] || []),
            option.label,
          ];
        }
      });
    });

    const finalTop = Object.entries(scores)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        const aPrincipal = principalCounts[a[0]] || 0;
        const bPrincipal = principalCounts[b[0]] || 0;
        if (bPrincipal !== aPrincipal) return bPrincipal - aPrincipal;
        return a[0].localeCompare(b[0], "pt-BR");
      })
      .slice(0, 5);
    const finalResultArea = finalTop[0]?.[0];

    if (!finalResultArea) {
      setPhase("intro");
      return;
    }

    const finalAnswered = Object.keys(finalAnswers).length;
    const finalTopScore = finalTop[0]?.[1] || 0;
    const maxPerQuestion = 5;
    const finalConfidence = finalAnswered
      ? Math.min(
          100,
          Math.round((finalTopScore / (finalAnswered * maxPerQuestion)) * 100),
        )
      : 0;

    const finalResultMeta = areasTI.find((a) => a.nome === finalResultArea);

    const topAreasWithPct: StoredResultArea[] = finalTop.map(
      ([area, score]) => {
        const meta = areasTI.find((a) => a.nome === area);
        return {
          area,
          score,
          percentage: Math.min(
            100,
            Math.round((score / (finalAnswered * maxPerQuestion)) * 100),
          ),
          slug: meta?.slug,
        };
      },
    );

    const reasons = (reasonsByArea[finalResultArea] || []).slice(0, 3);

    const payload: StoredResult = {
      resultArea: finalResultArea,
      resultAreaSlug: finalResultMeta?.slug || "",
      confidence: finalConfidence,
      topAreas: topAreasWithPct,
      reasons,
      completedAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(RESULT_SESSION_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage indisponível, fallback de /history cobre o caso
    }

    const quizAnswers = levelQuestions.flatMap((question) => {
      const optionIndex = finalAnswers[question.id];
      const option =
        optionIndex === undefined ? null : question.options[optionIndex];
      if (!option) return [];
      return [
        {
          question_id: question.id,
          answer_id: String(optionIndex),
          answer_text: option.label,
          area: option.area,
        },
      ];
    });

    // Objetivo e motivo vem da etapa inicial. So registrados (sem afetar scoring).
    const objetivo =
      objetivoQuestion.options[triageAnswers[objetivoQuestion.id]]?.value ?? null;
    const motivo =
      motivoQuestion.options[triageAnswers[motivoQuestion.id]]?.value ?? null;

    void persistQuizResult({
      answers: quizAnswers,
      result_area: finalResultArea,
      result_area_slug: finalResultMeta?.slug,
      confidence: finalConfidence,
      level: level ?? undefined,
      result_json: {
        level,
        objetivo,
        motivo,
        scores: Object.fromEntries(finalTop),
        topAreas: topAreasWithPct,
        reasons,
      },
    });

    posthog.capture("quiz_completed", {
      result_area: finalResultArea,
      confidence: finalConfidence,
      questions_answered: finalAnswered,
      level,
      objetivo,
      motivo,
    });

    clearProgress();
    setResumeAvailable(false);
    setLocation("/quiz-carreira/resultado");
  };

  return (
    <Layout>
      <SEO
        title="Quiz de Carreira em TI. Descubra qual área combina com você"
        description="Responda perguntas rápidas e descubra qual área da tecnologia combina mais com seu perfil. Quiz gratuito feito para iniciantes."
        keywords={[
          "quiz carreira ti",
          "qual área da ti escolher",
          "teste vocacional tecnologia",
          "qual carreira em ti seguir",
        ]}
        url="/quiz-carreira"
        schemaType="WebPage"
      />

      <div className="min-h-screen bg-[#faf8f4]">
        {(phase === "triage" || phase === "questions") && (
          <ProgressBar
            current={(phase === "triage" ? triageIndex : currentIndex) + 1}
            total={
              phase === "triage" ? triageSteps.length : LEVEL_QUESTION_COUNT
            }
            answeredCount={
              Object.keys(phase === "triage" ? triageAnswers : answers).length
            }
          />
        )}

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <IntroScreen
              key="intro"
              onStart={() => handleStart(false)}
              onResume={
                resumeAvailable ? () => handleStart(true) : undefined
              }
            />
          )}

          {phase === "triage" && (
            <QuestionScreen
              key={`t-${triageIndex}`}
              question={triageSteps[triageIndex].question}
              currentIndex={triageIndex}
              totalQuestions={triageSteps.length}
              selectedOption={
                triageAnswers[triageSteps[triageIndex].id] ?? null
              }
              onAnswer={handleTriageAnswer}
              onBack={handleTriageBack}
              onReset={handleReset}
            />
          )}

          {phase === "questions" && level && (
            <QuestionScreen
              key={`q-${currentIndex}`}
              question={levelQuestions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={levelQuestions.length}
              selectedOption={
                answers[levelQuestions[currentIndex].id] ?? null
              }
              onAnswer={handleAnswer}
              onBack={handleBack}
              onReset={handleReset}
            />
          )}

          {phase === "completing" && <CompletingScreen key="completing" />}
        </AnimatePresence>
      </div>

      <ResetQuizConfirmModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetConfirmed}
      />
    </Layout>
  );
}

function IntroScreen({
  onStart,
  onResume,
}: {
  onStart: () => void;
  onResume?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="container max-w-2xl py-12 md:py-20"
    >
      <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
        <BrainCircuit className="h-4 w-4" />
        Quiz de Carreira em Tech
      </p>

      <h1
        className="font-display font-black leading-[0.95] text-slate-950"
        style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
      >
        Descubra qual área da tecnologia
        <br />
        combina com você
      </h1>

      <p className="mt-6 max-w-xl text-lg font-semibold text-slate-700 md:text-xl">
        Tecnologia não é uma coisa só. Tem várias áreas (front-end, back-end,
        dados, design, segurança, e mais), cada uma resolvendo um tipo de
        problema e combinando com um perfil diferente. Este quiz te ajuda a
        achar a que mais tem a ver com você.
      </p>

      <p className="mt-4 max-w-xl font-semibold text-slate-600 md:text-lg">
        Primeiro, algumas perguntas rápidas pra entender o seu momento e o seu
        objetivo. Depois, {LEVEL_QUESTION_COUNT} perguntas do seu nível. No fim,
        mostramos as áreas que mais combinam com você. Não tem certo nem errado.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a]">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
            Duração
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            ~{QUIZ_ESTIMATED_MINUTES} min
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a]">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
            Perguntas
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            {triageSteps.length} + {LEVEL_QUESTION_COUNT}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a] md:col-span-1">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
            Resultado
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            Áreas afins
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {onResume && (
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-amber-300 px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            Continuar de onde parei
          </button>
        )}

        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-violet-600 px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
        >
          {onResume ? "Começar do zero" : "Começar agora"}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <p className="mt-8 font-mono text-xs text-slate-500">
        Seu progresso é salvo automaticamente. Você pode voltar e continuar
        depois.
      </p>
    </motion.div>
  );
}

function QuestionScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  onAnswer,
  onBack,
  onReset,
}: {
  question: ScreenQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: number | null;
  onAnswer: (optionIndex: number) => void;
  onBack?: () => void;
  onReset?: () => void;
}) {
  const [transitioning, setTransitioning] = useState(false);
  const [localSelection, setLocalSelection] = useState<number | null>(
    selectedOption,
  );

  const effectiveSelection = transitioning ? localSelection : selectedOption;

  const handleClick = (idx: number) => {
    if (transitioning) return;
    setLocalSelection(idx);
    setTransitioning(true);
    onAnswer(idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="container max-w-2xl py-12 md:py-16"
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-violet-700">
          {question.category}
        </span>
        <span className="font-mono text-sm text-slate-500">
          Pergunta {currentIndex + 1} de {totalQuestions}
        </span>
      </div>

      <h2
        className="mb-8 font-display font-black leading-tight text-slate-950"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
      >
        {question.question}
      </h2>

      <div className="mb-8 space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = effectiveSelection === idx;
          const letter = String.fromCharCode(65 + idx);
          const dimmed =
            transitioning && effectiveSelection !== null && !isSelected;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handleClick(idx)}
              disabled={transitioning}
              className={`group flex w-full items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-[#1a1a1a] bg-amber-300 shadow-[3px_3px_0_#0f172a]"
                  : "border-slate-300 bg-white hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[3px_3px_0_#0f172a]"
              } ${dimmed ? "opacity-40" : ""} disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-base font-black transition-colors ${
                  isSelected
                    ? "bg-slate-950 text-amber-300"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white"
                }`}
              >
                {letter}
              </span>

              <span className="pt-1 text-base font-bold text-slate-950">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={transitioning}
              className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-600 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
              Voltar
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={transitioning}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-400 transition-colors hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2.5} />
              Reiniciar
            </button>
          )}
        </div>

        <span className="font-mono text-sm text-slate-400">
          Selecione uma opção
        </span>
      </div>
    </motion.div>
  );
}

function ProgressBar({
  current,
  total,
  answeredCount,
}: {
  current: number;
  total: number;
  answeredCount: number;
}) {
  const percentage = (answeredCount / total) * 100;

  return (
    <div
      role="progressbar"
      aria-label={`Progresso: ${answeredCount} de ${total} respondidas`}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answeredCount}
      className="sticky top-16 z-30 border-b border-slate-200 bg-[#faf8f4]/80 backdrop-blur-sm"
    >
      <div className="container max-w-2xl py-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
            {current} / {total}
          </span>

          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <span className="shrink-0 font-mono text-xs font-bold text-slate-700">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function CompletingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container max-w-2xl py-20 text-center"
    >
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>

      <h2 className="mb-3 font-display text-3xl font-black text-slate-950">
        Analisando suas respostas...
      </h2>

      <p className="text-base font-semibold text-slate-600">
        Estamos cruzando seus dados pra encontrar as áreas mais alinhadas com
        você.
      </p>
    </motion.div>
  );
}

