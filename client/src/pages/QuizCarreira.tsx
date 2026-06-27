import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Compass,
  ListChecks,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ResetQuizConfirmModal } from "@/components/profile/ResetQuizConfirmModal";
import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuthGate } from "@/hooks/useAuthGate";
import { consumePendingGate, peekPendingGate } from "@/lib/authGate";
import { areasTI } from "@/lib/data";
import {
  triageQuestions,
  quizByLevel,
  techQuiz,
  classifyTriageLevel,
  getAreaAccent,
  getObjectiveTrack,
  getTechRecommendation,
  objectiveTracks,
  AREA_ACCENT,
  type QuizLevel,
  type QuizObjective,
  type ObjectiveTrack,
  LEVEL_META,
  LEVEL_QUESTION_COUNT,
  TECH_QUESTION_COUNT,
  QUIZ_ESTIMATED_MINUTES,
} from "@/lib/platformData";
import { persistQuizResult } from "@/services/careerQuizService";

type QuizPhase =
  | "objective"
  | "intro"
  | "triage"
  | "level-reveal"
  | "questions"
  | "completing";

const RESULT_SESSION_KEY = "quiz-carreira.last-result";

// Acentos rotativos para colorir as opções (letra A/B/C/D).
const OPTION_ACCENTS = ["#7c3aed", "#db2777", "#0e7490", "#d97706"];

interface StoredResultArea {
  area: string;
  score: number;
  percentage: number;
  slug?: string;
}

interface StoredResult {
  kind: "area" | "tech";
  resultArea: string;
  resultAreaSlug: string;
  confidence: number;
  topAreas: StoredResultArea[];
  reasons: string[];
  completedAt: string;
  techKey?: string;
  objective?: QuizObjective;
}

// Tipo minimo aceito pela tela de pergunta. Tanto QuizQuestion quanto
// TriageQuestion satisfazem este shape, entao o mesmo componente serve as fases.
interface ScreenQuestion {
  category: string;
  question: string;
  options: { label: string }[];
}

const STORAGE_KEY = "boranatech.quiz-carreira.progress.v3";
const STORAGE_TTL_DAYS = 30;

interface StoredProgress {
  objective: QuizObjective | null;
  phase: "triage" | "level-reveal" | "questions";
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

function isQuizGatePayload(
  p: unknown,
): p is { objective?: string; resume?: boolean } {
  return typeof p === "object" && p !== null;
}

// A triagem agora é só o nivelamento (3 perguntas). Objetivo virou a tela de
// entrada; motivo deixou de ser uma etapa separada.
const triageSteps = triageQuestions;

export default function QuizCarreira() {
  const [, setLocation] = useLocation();
  const { gateAction, modalProps, status } = useAuthGate();
  const hasConsumedGateRef = useRef(false);
  const [phase, setPhase] = useState<QuizPhase>("objective");
  const [objective, setObjective] = useState<QuizObjective | null>(null);
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [triageAnswers, setTriageAnswers] = useState<Record<string, number>>(
    {},
  );
  const [triageIndex, setTriageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const track = getObjectiveTrack(objective);
  const isTech = track.kind === "tech";
  const activeQuestions = isTech ? techQuiz : level ? quizByLevel[level] : [];
  const questionCount = isTech ? TECH_QUESTION_COUNT : LEVEL_QUESTION_COUNT;

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
    if (phase !== "triage" && phase !== "level-reveal" && phase !== "questions")
      return;
    const hasProgress =
      Object.keys(triageAnswers).length > 0 || Object.keys(answers).length > 0;
    if (hasProgress) {
      saveProgress({
        objective,
        phase,
        level,
        triageAnswers,
        triageIndex,
        answers,
        currentIndex,
      });
    }
  }, [
    phase,
    objective,
    level,
    triageAnswers,
    triageIndex,
    answers,
    currentIndex,
  ]);

  const handleSelectObjective = (id: QuizObjective) => {
    setObjective(id);
    setLevel(null);
    setTriageAnswers({});
    setTriageIndex(0);
    setAnswers({});
    setCurrentIndex(0);
    setPhase("intro");
  };

  const beginQuestions = (chosen: ObjectiveTrack) => {
    clearProgress();
    setTriageAnswers({});
    setTriageIndex(0);
    setAnswers({});
    setCurrentIndex(0);

    if (chosen.kind === "tech") {
      setLevel(null);
      setPhase("questions");
      return;
    }
    // Objetivos com nível sugerido (ex: começar do zero) pulam o nivelamento.
    if (chosen.suggestedLevel) {
      setLevel(chosen.suggestedLevel);
      setPhase("questions");
      return;
    }
    setLevel(null);
    setPhase("triage");
  };

  const handleResume = () => {
    const saved = loadProgress();
    if (!saved) return;
    setObjective(saved.objective);
    setLevel(saved.level);
    setTriageAnswers(saved.triageAnswers);
    setTriageIndex(saved.triageIndex);
    setAnswers(saved.answers);
    setCurrentIndex(saved.currentIndex);
    setPhase(saved.phase);
  };

  const handleSelectObjectiveGated = (id: QuizObjective) => {
    gateAction({
      intent: { kind: "domain", domain: "quiz", payload: { objective: id } },
      run: () => handleSelectObjective(id),
      destination: "/quiz-carreira",
    });
  };

  const handleResumeGated = () => {
    gateAction({
      intent: { kind: "domain", domain: "quiz", payload: { resume: true } },
      run: () => handleResume(),
      destination: "/quiz-carreira",
    });
  };

  useEffect(() => {
    // Replay de intent de quiz pos-login. Roda UMA vez por mount, so autenticado.
    // Territorio do BUG 2: consome (remove) em vez de peek-e-deixa, e o ref guard
    // impede re-disparo (StrictMode monta/desmonta/remonta em dev).
    if (status !== "authenticated") return;
    if (hasConsumedGateRef.current) return;

    const gate = peekPendingGate();
    const intent = gate?.intent;
    // Ownership: so processa intent de quiz; deixa os outros (ex.: favorito) intactos.
    if (!intent || intent.kind !== "domain" || intent.domain !== "quiz") return;

    hasConsumedGateRef.current = true;
    consumePendingGate();

    const payload = intent.payload;
    if (!isQuizGatePayload(payload)) {
      console.warn("[quiz] pending_gate payload malformado", payload);
      return;
    }
    if (
      typeof payload.objective === "string" &&
      objectiveTracks.some((track) => track.id === payload.objective)
    ) {
      handleSelectObjective(payload.objective as QuizObjective);
    } else if (payload.resume === true) {
      handleResume();
    } else {
      console.warn(
        "[quiz] pending_gate de quiz sem objective valido nem resume",
        payload,
      );
    }
  }, [status]);

  const handleTriageAnswer = (optionIndex: number) => {
    const step = triageSteps[triageIndex];
    const newTriage = { ...triageAnswers, [step.id]: optionIndex };
    setTriageAnswers(newTriage);

    window.setTimeout(() => {
      if (triageIndex < triageSteps.length - 1) {
        setTriageIndex(triageIndex + 1);
        return;
      }
      const levels = triageQuestions.map(
        (q) => q.options[newTriage[q.id]].level,
      );
      const computed = classifyTriageLevel(levels);
      if (computed !== level) {
        setAnswers({});
        setCurrentIndex(0);
      }
      setLevel(computed);
      setPhase("level-reveal");
    }, 380);
  };

  const handleLevelRevealContinue = () => setPhase("questions");

  const handleLevelRevealBack = () => {
    setTriageIndex(triageSteps.length - 1);
    setPhase("triage");
  };

  const handleTriageBack = () => {
    if (triageIndex > 0) {
      setTriageIndex(triageIndex - 1);
    } else {
      setPhase("intro");
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const question = activeQuestions[currentIndex];
    const newAnswers = { ...answers, [question.id]: optionIndex };
    setAnswers(newAnswers);

    window.setTimeout(() => {
      if (currentIndex < activeQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        handleComplete(newAnswers);
      }
    }, 380);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (isTech || track.suggestedLevel) {
      setPhase("intro");
    } else {
      setPhase("level-reveal");
    }
  };

  const handleReset = () => setResetModalOpen(true);

  const handleResetConfirmed = () => {
    setObjective(null);
    setLevel(null);
    setTriageAnswers({});
    setTriageIndex(0);
    setAnswers({});
    setCurrentIndex(0);
    clearProgress();
    setResumeAvailable(false);
    setPhase("objective");
  };

  const computeScores = (
    questions: typeof activeQuestions,
    finalAnswers: Record<string, number>,
  ) => {
    const scores: Record<string, number> = {};
    const reasonsByKey: Record<string, string[]> = {};
    const principalCounts: Record<string, number> = {};

    questions.forEach((question) => {
      const optionIndex = finalAnswers[question.id];
      if (optionIndex === undefined) return;
      const option = question.options[optionIndex];
      if (!option) return;

      principalCounts[option.area] = (principalCounts[option.area] || 0) + 1;
      Object.entries(option.scores).forEach(([key, score]) => {
        scores[key] = (scores[key] || 0) + score;
        if (score >= 3) {
          reasonsByKey[key] = [...(reasonsByKey[key] || []), option.label];
        }
      });
    });

    const top = Object.entries(scores)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        const aP = principalCounts[a[0]] || 0;
        const bP = principalCounts[b[0]] || 0;
        if (bP !== aP) return bP - aP;
        return a[0].localeCompare(b[0], "pt-BR");
      })
      .slice(0, 5);

    const answered = Object.keys(finalAnswers).length;
    const maxPerQuestion = 5;
    const topScore = top[0]?.[1] || 0;
    const confidence = answered
      ? Math.min(
          100,
          Math.round((topScore / (answered * maxPerQuestion)) * 100),
        )
      : 0;

    return { top, reasonsByKey, answered, maxPerQuestion, confidence };
  };

  const handleComplete = (finalAnswers: Record<string, number>) => {
    setPhase("completing");
    if (isTech) {
      handleCompleteTech(finalAnswers);
    } else {
      handleCompleteArea(finalAnswers);
    }
  };

  const handleCompleteArea = (finalAnswers: Record<string, number>) => {
    const questions = level ? quizByLevel[level] : [];
    const { top, reasonsByKey, answered, maxPerQuestion, confidence } =
      computeScores(questions, finalAnswers);
    const resultArea = top[0]?.[0];
    if (!resultArea) {
      setPhase("intro");
      return;
    }

    const resultMeta = areasTI.find((a) => a.nome === resultArea);
    const topAreas: StoredResultArea[] = top.map(([area, score]) => ({
      area,
      score,
      percentage: Math.min(
        100,
        Math.round((score / (answered * maxPerQuestion)) * 100),
      ),
      slug: areasTI.find((a) => a.nome === area)?.slug,
    }));
    const reasons = (reasonsByKey[resultArea] || []).slice(0, 3);

    const payload: StoredResult = {
      kind: "area",
      resultArea,
      resultAreaSlug: resultMeta?.slug || "",
      confidence,
      topAreas,
      reasons,
      completedAt: new Date().toISOString(),
      objective: objective ?? undefined,
    };
    persistResult(payload, questions, finalAnswers, top);
  };

  const handleCompleteTech = (finalAnswers: Record<string, number>) => {
    const { top, reasonsByKey, answered, maxPerQuestion, confidence } =
      computeScores(techQuiz, finalAnswers);
    const resultKey = top[0]?.[0];
    if (!resultKey) {
      setPhase("intro");
      return;
    }

    const rec = getTechRecommendation(resultKey);
    const topAreas: StoredResultArea[] = top.map(([key, score]) => ({
      area: getTechRecommendation(key).label,
      score,
      percentage: Math.min(
        100,
        Math.round((score / (answered * maxPerQuestion)) * 100),
      ),
    }));
    const reasons = (reasonsByKey[resultKey] || []).slice(0, 3);

    const payload: StoredResult = {
      kind: "tech",
      resultArea: rec.label,
      resultAreaSlug: rec.areaSlug,
      confidence,
      topAreas,
      reasons,
      completedAt: new Date().toISOString(),
      techKey: resultKey,
      objective: objective ?? undefined,
    };
    persistResult(payload, techQuiz, finalAnswers, top);
  };

  const persistResult = (
    payload: StoredResult,
    questions: typeof activeQuestions,
    finalAnswers: Record<string, number>,
    top: [string, number][],
  ) => {
    try {
      sessionStorage.setItem(RESULT_SESSION_KEY, JSON.stringify(payload));
    } catch {
      // sessionStorage indisponível, fallback de /history cobre o caso
    }

    const quizAnswers = questions.flatMap((question) => {
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

    void persistQuizResult({
      answers: quizAnswers,
      result_area: payload.resultArea,
      result_area_slug: payload.resultAreaSlug || undefined,
      confidence: payload.confidence,
      level: payload.kind === "area" ? (level ?? undefined) : undefined,
      result_json: {
        kind: payload.kind,
        level: payload.kind === "area" ? level : null,
        objetivo: objective,
        techKey: payload.techKey,
        scores: Object.fromEntries(top),
        topAreas: payload.topAreas,
        reasons: payload.reasons,
      },
    });

    posthog.capture("quiz_completed", {
      kind: payload.kind,
      result_area: payload.resultArea,
      confidence: payload.confidence,
      questions_answered: Object.keys(finalAnswers).length,
      level: payload.kind === "area" ? level : null,
      objetivo: objective,
    });

    clearProgress();
    setResumeAvailable(false);
    setLocation("/quiz-carreira/resultado");
  };

  const inQuestionPhase = phase === "triage" || phase === "questions";

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
        {inQuestionPhase && (
          <ProgressBar
            current={(phase === "triage" ? triageIndex : currentIndex) + 1}
            total={phase === "triage" ? triageSteps.length : questionCount}
            answeredCount={
              Object.keys(phase === "triage" ? triageAnswers : answers).length
            }
            accent={track.accent}
            phaseLabel={
              phase === "triage"
                ? "Etapa 1 · Nivelamento"
                : isTech
                  ? "Escolha de tecnologia"
                  : `Etapa 2 · Nível ${level ? LEVEL_META[level].label : ""}`
            }
          />
        )}

        <AnimatePresence mode="wait">
          {phase === "objective" && (
            <ObjectiveScreen
              key="objective"
              onSelect={handleSelectObjectiveGated}
              onResume={resumeAvailable ? handleResumeGated : undefined}
            />
          )}

          {phase === "intro" && (
            <IntroScreen
              key="intro"
              track={track}
              onStart={() => beginQuestions(track)}
              onBack={() => setPhase("objective")}
            />
          )}

          {phase === "triage" && (
            <QuestionScreen
              key={`t-${triageIndex}`}
              question={triageSteps[triageIndex]}
              currentIndex={triageIndex}
              totalQuestions={triageSteps.length}
              selectedOption={
                triageAnswers[triageSteps[triageIndex].id] ?? null
              }
              accent={track.accent}
              onAnswer={handleTriageAnswer}
              onBack={handleTriageBack}
              onReset={handleReset}
            />
          )}

          {phase === "level-reveal" && level && (
            <LevelRevealScreen
              key="level-reveal"
              level={level}
              accent={track.accent}
              onContinue={handleLevelRevealContinue}
              onBack={handleLevelRevealBack}
            />
          )}

          {phase === "questions" && activeQuestions.length > 0 && (
            <QuestionScreen
              key={`q-${currentIndex}`}
              question={activeQuestions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={activeQuestions.length}
              selectedOption={answers[activeQuestions[currentIndex].id] ?? null}
              accent={track.accent}
              onAnswer={handleAnswer}
              onBack={handleBack}
              onReset={handleReset}
            />
          )}

          {phase === "completing" && (
            <CompletingScreen key="completing" accent={track.accent} />
          )}
        </AnimatePresence>
      </div>

      <ResetQuizConfirmModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetConfirmed}
      />

      <AuthGateModal {...modalProps} />
    </Layout>
  );
}

const AREA_ICON_POSITIONS = [
  "left-[3%] top-[12%]",
  "left-[16%] top-[72%]",
  "left-[8%] top-[40%]",
  "left-[28%] top-[20%]",
  "left-[44%] top-[82%]",
  "left-[58%] top-[14%]",
  "left-[72%] top-[68%]",
  "left-[86%] top-[24%]",
  "left-[92%] top-[56%]",
  "left-[38%] top-[50%]",
  "left-[66%] top-[40%]",
  "left-[22%] top-[90%]",
  "left-[80%] top-[88%]",
];

const ROLE_BY_AREA: Record<string, string> = {
  "Front-end": "Dev Front-end",
  "Back-end": "Dev Back-end",
  "Full-stack": "Dev Full-stack",
  "Ciência de Dados": "Cientista de Dados",
  "UX/UI Design": "UX/UI Designer",
  "Inteligência Artificial": "Especialista em IA",
  "Produto Digital": "Product Manager",
  Cibersegurança: "Analista de Cibersegurança",
  "Cloud Computing": "Especialista em Cloud",
  "Gestão de Projetos Tech": "Gerente de Projetos",
  "QA / Testes de Software": "Analista de QA",
  "Desenvolvimento Mobile": "Dev Mobile",
  DevOps: "Especialista em DevOps",
};

function ObjectiveScreen({
  onSelect,
  onResume,
}: {
  onSelect: (id: QuizObjective) => void;
  onResume?: () => void;
}) {
  const areaNames = Object.keys(AREA_ACCENT);
  const [areaIdx, setAreaIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setAreaIdx((i) => (i + 1) % areaNames.length);
    }, 2000);
    return () => clearInterval(id);
  }, [areaNames.length]);
  const areaAtual = areaNames[areaIdx];
  const areaAccent = getAreaAccent(areaAtual);
  const AreaIcon = areasTI.find((a) => a.nome === areaAtual)?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="container relative max-w-5xl overflow-hidden py-10 md:py-14"
    >
      {areaNames.map((nome, i) => {
        const meta = areasTI.find((a) => a.nome === nome);
        const Icon = meta?.icon;
        if (!Icon) return null;
        const accent = getAreaAccent(nome);
        return (
          <motion.span
            key={nome}
            aria-hidden
            className={`pointer-events-none absolute ${AREA_ICON_POSITIONS[i % AREA_ICON_POSITIONS.length]}`}
            style={{ color: accent, opacity: 0.1 }}
            animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
            transition={{
              duration: 7 + (i % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          >
            <Icon className="h-8 w-8" strokeWidth={2.5} />
          </motion.span>
        );
      })}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-28 left-6 text-slate-900"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <Star className="h-9 w-9 fill-amber-300" strokeWidth={2.5} />
      </motion.span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute bottom-16 right-10 text-pink-500"
        animate={{ scale: [1, 1.25, 1], rotate: [0, 18, -18, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-8 w-8" strokeWidth={2.5} />
      </motion.span>
      <motion.svg
        aria-hidden
        viewBox="0 0 100 20"
        className="pointer-events-none absolute right-8 top-1/2 h-7 w-24 text-emerald-500"
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M2 10 Q 14 0, 26 10 T 50 10 T 74 10 T 98 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </motion.svg>

      <div className="relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]"
            >
              <BrainCircuit className="h-4 w-4" />
              Quiz de carreira
              <motion.span
                animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-700" />
              </motion.span>
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="font-display font-black leading-[1.02] tracking-tight text-slate-950"
              style={{ fontSize: "clamp(2.25rem, 6vw, 3.5rem)" }}
            >
              Qual <span className="text-violet-600">área de tech</span> combina
              com você?
            </motion.h1>

            <p className="mt-4 max-w-xl text-base font-semibold text-slate-600 md:text-lg">
              Responde umas perguntas rápidas e a gente te mostra a área mais a
              ver com seu jeito, por que ela combina e por onde começar.
            </p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6 inline-flex items-center gap-2 font-mono text-sm font-black uppercase tracking-wider text-violet-700"
            >
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </motion.span>
              Escolhe um objetivo e a gente cuida do resto
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center gap-3 lg:items-start"
          >
            <span className="font-display text-2xl font-black uppercase tracking-[0.15em] text-slate-500">
              Eu sou
            </span>
            <div className="flex min-h-[5rem] items-center justify-center gap-3 lg:justify-start">
              <AnimatePresence mode="wait">
                <motion.span
                  key={areaAtual}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-2 font-display font-black leading-none"
                  style={{
                    color: areaAccent,
                    fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  }}
                >
                  {AreaIcon && (
                    <AreaIcon
                      className="h-8 w-8 shrink-0 md:h-10 md:w-10"
                      strokeWidth={2.5}
                    />
                  )}
                  {ROLE_BY_AREA[areaAtual] ?? areaAtual}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="mt-10 rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a] md:p-6"
        >
          <p className="mb-4 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">
            Como funciona
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                Icon: ListChecks,
                texto:
                  "Você responde perguntas sobre o que curte e como pensa. Não tem certo ou errado.",
              },
              {
                Icon: Target,
                texto: "Cada resposta pontua as áreas de tech.",
              },
              {
                Icon: Compass,
                texto:
                  "No fim você vê sua área, o porquê e um caminho pra começar.",
              },
            ].map((passo, idx) => {
              const StepIcon = passo.Icon;
              return (
                <div
                  key={passo.texto}
                  className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-violet-50/60 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-violet-300 font-display text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                    {idx + 1}
                  </span>
                  <div>
                    <StepIcon
                      className="mb-1.5 h-5 w-5 text-violet-700"
                      strokeWidth={2.4}
                    />
                    <p className="text-sm font-semibold text-slate-700">
                      {passo.texto}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <p className="mb-3 mt-8 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          Escolha seu objetivo pra começar:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {objectiveTracks.map((t, idx) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + idx * 0.07 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex flex-col items-start overflow-hidden rounded-3xl border-2 border-[#1a1a1a] p-5 text-left shadow-[4px_4px_0_#0f172a] transition-shadow duration-200 hover:shadow-[8px_8px_0_var(--accent)]"
                style={{
                  ["--accent" as string]: t.accent,
                  backgroundColor: `color-mix(in srgb, ${t.accent} 10%, white)`,
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-3 text-2xl opacity-20 transition-opacity duration-200 group-hover:opacity-40"
                >
                  {t.emoji}
                </span>
                <span
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
                  style={{ backgroundColor: t.accent }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
                <h2 className="font-display text-xl font-black text-slate-950">
                  {t.label}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {t.description}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 px-4 py-2 font-display text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_#0f172a] transition-all duration-200 group-hover:shadow-[3px_3px_0_#0f172a]"
                  style={{ backgroundColor: t.accent }}
                >
                  Começar
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    strokeWidth={3}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>

        {onResume && (
          <button
            type="button"
            onClick={onResume}
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-amber-300 px-5 py-2.5 font-display text-sm font-black uppercase tracking-wider text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            Continuar de onde parei
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AreaPreview() {
  const names = Object.keys(AREA_ACCENT);
  return (
    <div className="mt-6 rounded-3xl border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0_#0f172a]">
      <p className="mb-1 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-violet-700">
        O que são áreas de TI?
      </p>
      <p className="mb-4 text-sm font-semibold text-slate-600">
        Tecnologia não é uma coisa só. São várias áreas, cada uma resolvendo um
        tipo de problema e combinando com um perfil. Algumas delas:
      </p>
      <div className="flex flex-wrap gap-2">
        {names.map((nome, idx) => {
          const meta = areasTI.find((a) => a.nome === nome);
          const Icon = meta?.icon;
          const accent = getAreaAccent(nome);
          return (
            <motion.span
              key={nome}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.2 + idx * 0.03 }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold text-slate-950"
              style={{ borderColor: accent, backgroundColor: `${accent}14` }}
            >
              {Icon && (
                <Icon
                  className="h-3.5 w-3.5"
                  style={{ color: accent }}
                  strokeWidth={2.5}
                />
              )}
              {nome}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function IntroScreen({
  track,
  onStart,
  onBack,
}: {
  track: ObjectiveTrack;
  onStart: () => void;
  onBack: () => void;
}) {
  const Icon = track.icon;
  const questionCount =
    track.kind === "tech"
      ? TECH_QUESTION_COUNT
      : track.suggestedLevel
        ? LEVEL_QUESTION_COUNT
        : `${triageSteps.length} + ${LEVEL_QUESTION_COUNT}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="container max-w-2xl py-10 md:py-14"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex w-fit items-center gap-1.5 font-mono text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
        Trocar objetivo
      </button>

      <p
        className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase text-white shadow-[3px_3px_0_#0f172a]"
        style={{ backgroundColor: track.accent }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
        {track.label}
      </p>

      <h1
        className="font-display font-black leading-[1.05] text-slate-950"
        style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
      >
        {track.introHeadline}
      </h1>

      <p className="mt-4 max-w-xl text-base font-semibold text-slate-700 md:text-lg">
        {track.introSub}
      </p>

      {track.kind === "area" && <AreaPreview />}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a]">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-700">
            Duração
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            ~{track.kind === "tech" ? 3 : QUIZ_ESTIMATED_MINUTES} min
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a]">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700">
            Perguntas
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            {questionCount}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0_#0f172a] md:col-span-1">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
            Resultado
          </p>
          <p className="font-display text-2xl font-black text-slate-950">
            {track.kind === "tech" ? "Tecnologia" : "Áreas afins"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] px-7 py-3 font-display text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
          style={{ backgroundColor: track.accent }}
        >
          Começar agora
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <p className="mt-6 font-mono text-xs text-slate-500">
        Seu progresso é salvo automaticamente. Você pode voltar e continuar
        depois.
      </p>
    </motion.div>
  );
}

function LevelRevealScreen({
  level,
  accent,
  onContinue,
  onBack,
}: {
  level: QuizLevel;
  accent: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  const meta = LEVEL_META[level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="container max-w-2xl py-10 md:py-14"
    >
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-emerald-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
        <Check className="h-4 w-4" strokeWidth={3} />
        Nivelamento concluído
      </p>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#1a1a1a] bg-white p-7 shadow-[6px_6px_0_#0f172a] md:p-9"
      >
        <div
          className="absolute inset-0 -z-0 opacity-[0.07]"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="relative">
          <span
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-900 bg-amber-300 shadow-[3px_3px_0_#0f172a]"
            style={{ fontSize: "1.875rem" }}
            aria-hidden
          >
            {meta.emoji}
          </span>

          <p
            className="font-mono text-[11px] font-black uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            Seu nível
          </p>
          <h1 className="mt-1 font-display text-4xl font-black leading-none text-slate-950 md:text-5xl">
            {meta.label}
          </h1>
          <p className="mt-3 text-base font-semibold text-slate-700 md:text-lg">
            {meta.tagline}
          </p>
        </div>
      </motion.div>

      <div className="mt-8">
        <p className="mb-4 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          O que vamos fazer por você
        </p>
        <ul className="space-y-3">
          {meta.doing.map((item, idx) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.1 }}
              className="flex items-start gap-3 rounded-2xl border-2 border-slate-300 bg-white px-4 py-3"
            >
              <span
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: accent }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="text-sm font-bold text-slate-800 md:text-base">
                {item}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 font-mono text-sm font-bold text-slate-600 transition-colors hover:text-slate-950 sm:mr-auto"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
          Refazer nivelamento
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a] px-7 py-3 font-display text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
          style={{ backgroundColor: accent }}
        >
          Começar as {LEVEL_QUESTION_COUNT} perguntas
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}

function QuestionScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  accent,
  onAnswer,
  onBack,
  onReset,
}: {
  question: ScreenQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: number | null;
  accent: string;
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
      className="container max-w-2xl py-10 md:py-14"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span
          className="inline-flex items-center rounded-full border-2 border-slate-900 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[2px_2px_0_#0f172a]"
          style={{ backgroundColor: accent }}
        >
          {question.category}
        </span>
        <span className="font-mono text-sm text-slate-500">
          Pergunta {currentIndex + 1} de {totalQuestions}
        </span>
      </div>

      <h2
        className="mb-7 font-display font-black leading-tight text-slate-950"
        style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
      >
        {question.question}
      </h2>

      <div className="mb-8 space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = effectiveSelection === idx;
          const letter = String.fromCharCode(65 + idx);
          const optionAccent = OPTION_ACCENTS[idx % OPTION_ACCENTS.length];
          const dimmed =
            transitioning && effectiveSelection !== null && !isSelected;

          return (
            <motion.button
              key={option.label}
              type="button"
              onClick={() => handleClick(idx)}
              disabled={transitioning}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: dimmed ? 0.4 : 1, y: 0 }}
              transition={{
                y: {
                  duration: 0.3,
                  delay: 0.06 + idx * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: 0.2 },
              }}
              whileHover={transitioning ? undefined : { y: -2 }}
              whileTap={transitioning ? undefined : { scale: 0.985 }}
              className={`group flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-[box-shadow,background-color,border-color] duration-200 ${
                isSelected
                  ? "bg-amber-300"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              } disabled:cursor-not-allowed`}
              style={{
                borderColor: isSelected ? "#1a1a1a" : undefined,
                boxShadow: isSelected ? "4px 4px 0 #0f172a" : undefined,
              }}
            >
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-black text-white transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: isSelected ? "#0f172a" : optionAccent,
                  color: isSelected ? "#fde047" : "#ffffff",
                }}
              >
                {isSelected ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  letter
                )}
              </span>

              <span className="text-base font-bold text-slate-950">
                {option.label}
              </span>
            </motion.button>
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
  accent,
  phaseLabel,
}: {
  current: number;
  total: number;
  answeredCount: number;
  accent: string;
  phaseLabel?: string;
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
        {phaseLabel && (
          <p
            className="mb-2 font-mono text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {phaseLabel}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-mono text-xs uppercase tracking-[0.18em] text-slate-600">
            {current} / {total}
          </span>

          <div className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-slate-900 bg-white">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accent}, #FFB800)`,
              }}
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

function CompletingScreen({ accent }: { accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container max-w-2xl py-20 text-center"
    >
      <motion.div
        className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-900 shadow-[3px_3px_0_#0f172a]"
        style={{ backgroundColor: `${accent}1f` }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accent }} />
      </motion.div>

      <h2 className="mb-3 font-display text-3xl font-black text-slate-950">
        Analisando suas respostas...
      </h2>

      <p className="text-base font-semibold text-slate-600">
        Estamos cruzando seus dados pra encontrar o que mais combina com você.
      </p>

      <motion.div
        className="mx-auto mt-6"
        animate={{ rotate: [0, 12, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="mx-auto h-6 w-6" style={{ color: accent }} />
      </motion.div>
    </motion.div>
  );
}
