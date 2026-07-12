import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

// Explicacao da arena no estado de ENTRADA, molde do AnalyzerIntro do
// analisador de GitHub: timeline de como funciona + vitrine com um exemplo
// ILUSTRATIVO de turno avaliado e mini placar. Nada aqui e dado real do
// usuario; a vitrine carrega selo explicito de exemplo.

// TODO(Ana): revisar titulos e descricoes dos passos da timeline.
const TIMELINE_STEPS = [
  {
    title: "Escolha a frente",
    text: "Preparação pra uma vaga específica (cole a vaga) ou treino geral da sua área e nível.",
  },
  {
    title: "Responda as perguntas",
    text: "O entrevistador faz uma pergunta por vez, em português ou inglês, calibrada pelo seu contexto.",
  },
  {
    title: "Feedback a cada resposta",
    text: "Cada resposta recebe um carimbo honesto (boa, mediana ou fraca) com o que melhorar.",
  },
  {
    title: "Veredito de preparo",
    text: "Quando você engata boas respostas, a sessão fecha com um veredito e próximos passos.",
  },
];

// Constantes ILUSTRATIVAS da vitrine (nunca dado real do usuario).
// TODO(Ana): revisar os textos de exemplo da vitrine.
const EXAMPLE_QUESTION =
  "O que acontece quando você digita uma URL no navegador?";
const EXAMPLE_ANSWER =
  "Expliquei DNS, requisição HTTP e renderização, com um exemplo prático.";
const EXAMPLE_RATING_LABEL = "Boa resposta";
const EXAMPLE_FEEDBACK =
  "Resposta estruturada e correta. Podia citar cache pra fechar redondo.";
const EXAMPLE_SCORE_GOOD = 4;
const EXAMPLE_SCORE_TOTAL = 6;
// TODO(Ana): revisar o selo da vitrine.
const SHOWCASE_BADGE = "exemplo ilustrativo";

export function InterviewTimeline() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div>
      {/* TODO(Ana): revisar o titulo da timeline. */}
      <h2 className="mb-5 font-display text-2xl font-black text-slate-950">
        Como funciona
      </h2>
      <ol className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const last = i === TIMELINE_STEPS.length - 1;
          return (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.08, 0.3) }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {!last ? (
                <span
                  className="absolute bottom-0 left-5 top-10 w-0 border-l-2 border-dashed border-slate-400"
                  aria-hidden
                />
              ) : null}
              <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-blue-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-display text-base font-black text-slate-950">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {step.text}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

// Mini-card da vitrine: entrada whileInView + float sutilissimo em loop
// (2 a 3px; reduce desliga os dois), mesmo padrao do ShowcaseCard do molde.
function ShowcaseCard({
  children,
  className,
  index,
  reduce,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.12, 0.36) }}
      className={className}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -3, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }
        }
        className="rounded-xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function InterviewShowcase() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative">
      <span className="absolute -top-3 left-4 z-10 inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
        <Sparkles className="h-3 w-3" aria-hidden />
        {SHOWCASE_BADGE}
      </span>
      <div className="space-y-4 rounded-2xl border-2 border-dashed border-slate-400 p-4 sm:p-5">
        <ShowcaseCard index={0} reduce={reduce}>
          <div className="p-4">
            {/* TODO(Ana): revisar os rotulos da vitrine. */}
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Pergunta
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {EXAMPLE_QUESTION}
            </p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-slate-500">
              Sua resposta
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {EXAMPLE_ANSWER}
            </p>
            <div className="mt-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-500 bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-emerald-900">
                <Check className="h-3 w-3" aria-hidden />
                {EXAMPLE_RATING_LABEL}
              </span>
              <p className="mt-1.5 text-xs font-medium text-slate-700">
                {EXAMPLE_FEEDBACK}
              </p>
            </div>
          </div>
        </ShowcaseCard>
        <ShowcaseCard index={1} reduce={reduce}>
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              {/* TODO(Ana): revisar o rotulo do mini placar. */}
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Placar da sessão
              </p>
              <p className="mt-1 font-display text-lg font-black text-slate-950">
                {EXAMPLE_SCORE_GOOD} boas de {EXAMPLE_SCORE_TOTAL} respostas
              </p>
            </div>
            <span className="rounded-full border-2 border-blue-500 bg-blue-100 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-blue-900">
              {/* TODO(Ana): revisar o badge do mini placar. */}
              Em andamento
            </span>
          </div>
        </ShowcaseCard>
      </div>
    </div>
  );
}

export default function InterviewIntro() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
        <InterviewTimeline />
        <InterviewShowcase />
      </div>
    </div>
  );
}
