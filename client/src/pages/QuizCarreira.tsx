import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BrainCircuit } from "lucide-react";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { areasTI } from "@/lib/data";
import { quizQuestions } from "@/lib/platformData";
import { persistQuizResult } from "@/services/careerQuizService";

export default function QuizCarreira() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const persistedSignature = useRef("");
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / quizQuestions.length) * 100);

  const quizResult = useMemo(() => {
    const scores: Record<string, number> = {};
    const reasons: Record<string, string[]> = {};

    quizQuestions.forEach((question) => {
      const optionIndex = answers[question.id];
      if (optionIndex === undefined) return;

      const option = question.options[optionIndex];
      if (!option) return;

      Object.entries(option.scores).forEach(([area, score]) => {
        scores[area] = (scores[area] || 0) + score;
        if (score >= 3) {
          reasons[area] = [...(reasons[area] || []), option.label];
        }
      });
    });

    const topMatches = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topScore = topMatches[0]?.[1] || 0;
    const confidence = answeredCount
      ? Math.min(100, Math.round((topScore / (answeredCount * 5)) * 100))
      : 0;

    return { topMatches, confidence, reasons };
  }, [answers]);

  const topMatches = quizResult.topMatches;
  const result = topMatches[0]?.[0];
  const resultArea = areasTI.find((area) => area.nome === result);
  const resultReasons = result
    ? (quizResult.reasons[result] || []).slice(0, 3)
    : [];

  const completed = answeredCount === quizQuestions.length;

  useEffect(() => {
    if (!completed) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [completed]);

  useEffect(() => {
    if (!completed || !result) return;

    const signature = JSON.stringify(answers);
    if (persistedSignature.current === signature) return;
    persistedSignature.current = signature;

    const quizAnswers = quizQuestions.flatMap((question) => {
      const optionIndex = answers[question.id];
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
      result_area: result,
      result_area_slug: resultArea?.slug,
      confidence: quizResult.confidence,
      result_json: {
        scores: Object.fromEntries(topMatches),
        topAreas: topMatches.map(([area, score]) => ({ area, score })),
      },
    });

    posthog.capture("quiz_completed", {
      result_area: result,
      confidence: quizResult.confidence,
      questions_answered: answeredCount,
    });
  }, [
    answers,
    answeredCount,
    completed,
    quizResult.confidence,
    result,
    resultArea?.slug,
    topMatches,
  ]);

  return (
    <Layout>
      <SEO
        title="Quiz de Carreira em TI — Descubra qual área combina com você"
        description="Responda perguntas rápidas e descubra qual área da tecnologia combina mais com seu perfil. Quiz gratuito feito para iniciantes."
        keywords={["quiz carreira ti", "qual área da ti escolher", "teste vocacional tecnologia", "qual carreira em ti seguir"]}
        url="/quiz-carreira"
        schemaType="WebPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-violet-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
            <BrainCircuit className="h-4 w-4" />
            quiz de descoberta com IA
          </p>
          <h1 className="font-display text-4xl font-black text-slate-950">
            Descubra uma área para começar.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-950">
            Responda perguntas sobre rotina, raciocínio, comunicação,
            ferramentas, tolerância a abstração e tipo de problema para receber
            um direcionamento mais preciso.
          </p>
        </div>
      </section>

      <section className="bg-violet-50 py-12">
        <div className="container grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="card-brutal rounded-2xl bg-white p-5">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase text-violet-700">
                <span>Progresso do diagnóstico</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border-2 border-slate-900 bg-violet-100">
                <div
                  className="h-full bg-amber-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                O cálculo considera pesos por área. Uma resposta pode indicar
                afinidade com mais de um caminho, deixando o resultado menos
                raso.
              </p>
            </div>

            {quizQuestions.map((question, index) => (
              <div
                key={question.id}
                className="card-brutal rounded-2xl bg-white p-6 shadow-[5px_5px_0_#c4b5fd]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase text-violet-700">
                    Pergunta {index + 1} de {quizQuestions.length}
                  </p>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700">
                    {question.category}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-black text-slate-950">
                  {question.question}
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={option.label}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: optionIndex,
                        }))
                      }
                      className={`rounded-2xl border-2 p-4 text-left text-sm font-bold transition-all ${
                        answers[question.id] === optionIndex
                          ? "border-slate-900 bg-amber-300 shadow-[3px_3px_0_#0f172a]"
                          : "border-slate-200 bg-white hover:border-slate-900"
                      }`}
                    >
                      <span className="block">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="card-brutal h-fit rounded-2xl bg-violet-700 p-6 text-white">
            <h2 className="font-display text-2xl font-black">Resultado</h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-amber-100">
              {answeredCount}/{quizQuestions.length} respostas
            </p>
            {completed && result ? (
              <>
                <p className="mt-3 text-amber-100">
                  Sua direção inicial mais forte é:
                </p>
                <p className="font-display mt-2 text-3xl font-black">
                  {result}
                </p>
                <div className="mt-3 rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-900">
                  <p className="text-xs font-black uppercase text-violet-700">
                    Confiança do diagnóstico
                  </p>
                  <p className="font-display mt-1 text-2xl font-black">
                    {quizResult.confidence}%
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Baseada na força das respostas para a área principal, não em
                    uma verdade absoluta.
                  </p>
                </div>
                {resultReasons.length ? (
                  <div className="mt-4 rounded-2xl border-2 border-violet-300 bg-violet-900/40 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-100">
                      Por que esse resultado apareceu
                    </p>
                    <ul className="mt-3 space-y-2">
                      {resultReasons.map((reason) => (
                        <li
                          key={reason}
                          className="text-sm font-medium text-violet-50"
                        >
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {topMatches.length > 1 ? (
                  <div className="mt-4 rounded-2xl border-2 border-violet-300 bg-violet-900/40 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-100">
                      Outras afinidades
                    </p>
                    <div className="mt-3 space-y-2">
                      {topMatches.slice(1).map(([area, score]) => (
                        <div
                          key={area}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="font-bold text-white">{area}</span>
                          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-black text-slate-950">
                            {Math.min(
                              100,
                              Math.round(
                                (score / (quizQuestions.length * 5)) * 100,
                              ),
                            )}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="mt-3 text-sm text-slate-300">
                  Use isso como bússola, não como sentença. O ideal é testar um
                  projeto pequeno antes de decidir.
                </p>
                <Link
                  href={resultArea ? `/areas/${resultArea.slug}` : "/roadmaps"}
                  className="btn-brutal-accent mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 font-black"
                >
                  Ver caminho recomendado
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-300">
                Responda todas as perguntas para receber uma sugestão de
                carreira.
              </p>
            )}
          </aside>
        </div>
      </section>
    </Layout>
  );
}
