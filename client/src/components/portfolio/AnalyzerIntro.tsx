import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Gauge,
  ListChecks,
  Sparkles,
} from "lucide-react";
import MiniScoreRing from "@/components/portfolio/MiniScoreRing";

// Estado de entrada do Analisador de GitHub (RD2.1): linha do tempo compacta
// de 3 passos + VITRINE ilustrativa do resultado + pills de beneficios.
// A vitrine e 100% ILUSTRATIVA: numeros e frases sao constantes EXAMPLE_*,
// nunca dado real do usuario, e o selo "exemplo ilustrativo" declara isso.

// TODO(Ana): revisar titulos e frases da linha do tempo (frases reaproveitadas
// dos cards antigos de Como funciona).
const TIMELINE_STEPS: { title: string; text: string }[] = [
  {
    title: "Cole o alvo",
    text: "Escolha perfil ou repositório e cole seu usuário ou a URL.",
  },
  {
    title: "A gente varre",
    text: "A gente lê os dados públicos do GitHub e roda checagens automáticas.",
  },
  {
    title: "Você recebe o raio-X",
    text: "Você recebe uma nota, um checklist do que falta e uma análise da IA com melhorias priorizadas.",
  },
];

// Constantes ILUSTRATIVAS da vitrine (nunca dado real do usuario).
// TODO(Ana): revisar os textos de exemplo da vitrine.
const EXAMPLE_SCORE = 78;
const EXAMPLE_BAND_LABEL = "Bom";
const EXAMPLE_CHECKS: { ok: boolean; label: string }[] = [
  { ok: true, label: "README com conteúdo real" },
  { ok: true, label: "Licença definida" },
  { ok: false, label: "Topics do repositório" },
];
const EXAMPLE_NEXT_STEP =
  "Escreva um README que explique o que o projeto faz e como rodar.";
// TODO(Ana): revisar o selo da vitrine.
const SHOWCASE_BADGE = "exemplo ilustrativo";

// TODO(Ana): revisar os rotulos das pills de beneficios (titulos dos cards
// antigos de O que voce recebe).
const BENEFIT_PILLS: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { icon: Gauge, label: "Nota de 0 a 100" },
  { icon: ListChecks, label: "Checklist do que falta" },
  { icon: Sparkles, label: "Análise da IA" },
  { icon: FileCode2, label: "Sugestão de README" },
];

export function HowItWorksTimeline() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div>
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
              <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
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

// Um mini-card da composicao: entrada whileInView + float sutilissimo em loop
// (2 a 3px; reduce desliga os dois).
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

export function ResultShowcase() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <span className="absolute -top-3 right-2 z-20 rotate-2 rounded-full border-2 border-slate-950 bg-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-[2px_2px_0_#0f172a]">
        {SHOWCASE_BADGE}
      </span>

      {/* (a) mini nota-hero */}
      <ShowcaseCard index={0} reduce={reduce} className="w-[88%] -rotate-2">
        <div className="flex items-center gap-4 rounded-xl bg-sky-100 p-4">
          <MiniScoreRing
            score={EXAMPLE_SCORE}
            className="h-[72px] w-[72px] text-xl"
          />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
              Nota do portfólio
            </p>
            <span className="mt-1.5 inline-flex rounded-full border-2 border-slate-950 bg-sky-300 px-3 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
              {EXAMPLE_BAND_LABEL}
            </span>
          </div>
        </div>
      </ShowcaseCard>

      {/* (b) mini checklist */}
      <ShowcaseCard
        index={1}
        reduce={reduce}
        className="relative z-10 -mt-5 ml-auto w-[85%] rotate-[1.5deg]"
      >
        <div className="space-y-2 rounded-xl bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Checklist
          </p>
          {EXAMPLE_CHECKS.map((check) => (
            <p
              key={check.label}
              className="flex items-center gap-2 text-xs font-bold text-slate-800"
            >
              {check.ok ? (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden
                />
              ) : (
                <AlertTriangle
                  className="h-4 w-4 shrink-0 text-amber-500"
                  aria-hidden
                />
              )}
              {check.label}
            </p>
          ))}
        </div>
      </ShowcaseCard>

      {/* (c) mini UMA coisa hoje */}
      <ShowcaseCard
        index={2}
        reduce={reduce}
        className="relative z-20 -mt-4 w-[92%] -rotate-1"
      >
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Se você fizer UMA coisa hoje
          </p>
          <p className="mt-1.5 text-sm font-bold text-slate-900">
            {EXAMPLE_NEXT_STEP}
          </p>
        </div>
      </ShowcaseCard>
    </div>
  );
}

export function BenefitPills() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {BENEFIT_PILLS.map((pill, i) => (
        <motion.span
          key={pill.label}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-violet-50 px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
        >
          <pill.icon className="h-4 w-4 text-violet-700" aria-hidden />
          {pill.label}
        </motion.span>
      ))}
    </div>
  );
}
