import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Gauge, Search, Sparkles, Type } from "lucide-react";
import { FAIXA_UI } from "@/components/linkedin/faixaUi";
import { FAIXA_LABELS, faixaFromScore } from "@shared/linkedin/schema";
import MiniScoreRing from "@/components/portfolio/MiniScoreRing";
import { cn } from "@/lib/utils";

// Estado de entrada do Analisador de LinkedIn (L3): linha do tempo compacta
// de 3 passos + VITRINE ilustrativa do resultado + pills de beneficios, no
// molde exato do AnalyzerIntro do Analisador de GitHub.
// A vitrine e 100% ILUSTRATIVA: numeros e frases sao constantes EXAMPLE_*,
// nunca dado real do usuario, e o selo "exemplo ilustrativo" declara isso.

const TIMELINE_STEPS: string[] = [
  // TODO(Ana): revisar o texto da etapa 1.
  "Cole o PDF do seu perfil aqui",
  // TODO(Ana): revisar o texto da etapa 2.
  "Confira o que detectamos e edite o que quiser",
  // TODO(Ana): revisar o texto da etapa 3.
  "Confirme as coisas que o PDF não traz",
];

// Constantes ILUSTRATIVAS da vitrine (nunca dado real do usuario).
// Nota RUIM de proposito (decisao de produto): o exemplo provoca "quanto
// sera a minha?" em vez de exibir um ideal.
const EXAMPLE_SCORE = 25;
// Faixa REAL da nota de exemplo: cores e rotulo da fonte unica compartilhada.
const EXAMPLE_FAIXA = faixaFromScore(EXAMPLE_SCORE);
const EXAMPLE_FAIXA_UI = FAIXA_UI[EXAMPLE_FAIXA];
const EXAMPLE_FAIXA_LABEL = FAIXA_LABELS[EXAMPLE_FAIXA];
// red-600: o vermelho legivel da familia da faixa inicio para o anel.
const EXAMPLE_RING_STROKE = "#dc2626";
// TODO(Ana): revisar as headlines de exemplo (antes fraca, depois forte).
const EXAMPLE_HEADLINE_ANTES =
  "Estudante de tecnologia em busca de oportunidades";
const EXAMPLE_HEADLINE_DEPOIS =
  "Desenvolvedora Front-end | React, TypeScript | construindo projetos open source";
// TODO(Ana): revisar o trecho de Sobre da vitrine.
const EXAMPLE_SOBRE_TRECHO =
  "Desenvolvedora front-end em formação, construindo projetos reais com React e TypeScript. No último ano publiquei três projetos completos, do design ao deploy, e hoje busco minha primeira oportunidade para crescer junto a um time.";
// TODO(Ana): revisar o selo da vitrine.
const SHOWCASE_BADGE = "exemplo ilustrativo";

// TODO(Ana): revisar os rotulos das pills de beneficios do LinkedIn.
const BENEFIT_PILLS: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { icon: Type, label: "Headline em 3 versões" },
  { icon: FileText, label: "Sobre reescrito" },
  { icon: Search, label: "Visão de recrutador" },
  { icon: Gauge, label: "Nota + plano de ação" },
];

export function HowItWorksTimeline() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-black text-slate-950">
        Como funciona
      </h2>
      {/* Faixa horizontal: 3 passos lado a lado em md+, empilhados no mobile.
          A trilha pontilhada liga o centro de cada badge ao proximo, so em md+
          (no mobile os passos empilham sem trilha). */}
      <ol className="grid gap-6 md:grid-cols-3">
        {TIMELINE_STEPS.map((step, i) => {
          const last = i === TIMELINE_STEPS.length - 1;
          return (
            <motion.li
              key={step}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.08, 0.3) }}
              className="relative flex items-start gap-4 md:flex-col md:items-center md:gap-3 md:text-center"
            >
              {!last ? (
                <span
                  className="absolute left-1/2 top-5 hidden h-0 w-[calc(100%+1.5rem)] border-t-2 border-dashed border-slate-400 md:block"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-lg font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
                {i + 1}
              </span>
              <p className="min-w-0 pt-1.5 text-sm font-medium text-slate-700 md:pt-1">
                {step}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

// Um mini-card da composicao: entrada whileInView + float sutilissimo em loop
// (2 a 3px; reduce desliga os dois). Mesma mecanica do ShowcaseCard do GitHub.
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
        {/* Fundo neutro de proposito: a faixa se expressa so no anel e no
            chip, sem tingir o card e destoar do cenario sky/cream. */}
        <div className="flex items-center gap-4 rounded-xl bg-white p-4">
          <MiniScoreRing
            score={EXAMPLE_SCORE}
            stroke={EXAMPLE_RING_STROKE}
            className="h-[72px] w-[72px] text-xl"
          />
          <div>
            {/* TODO(Ana): revisar o rotulo do mini nota-hero. */}
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
              Nota do perfil
            </p>
            <span
              className={cn(
                "mt-1.5 inline-flex rounded-full border-2 border-slate-950 px-3 py-0.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]",
                EXAMPLE_FAIXA_UI.chipBg,
              )}
            >
              {EXAMPLE_FAIXA_LABEL}
            </span>
          </div>
        </div>
      </ShowcaseCard>

      {/* (b) mini headline reescrita (antes e depois) */}
      <ShowcaseCard
        index={1}
        reduce={reduce}
        className="relative z-10 -mt-5 ml-auto w-[85%] rotate-[1.5deg]"
      >
        <div className="space-y-2 rounded-xl bg-white p-4">
          {/* TODO(Ana): revisar o rotulo do mini card de headline. */}
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Headline reescrita
          </p>
          <div>
            {/* TODO(Ana): revisar os rotulos antes/depois da vitrine. */}
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              antes
            </p>
            <p className="text-xs font-medium text-slate-500">
              {EXAMPLE_HEADLINE_ANTES}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-sky-700">
              depois
            </p>
            <p className="text-xs font-bold text-slate-900">
              {EXAMPLE_HEADLINE_DEPOIS}
            </p>
          </div>
        </div>
      </ShowcaseCard>

      {/* (c) mini Sobre reescrito com fade no final */}
      <ShowcaseCard
        index={2}
        reduce={reduce}
        className="relative z-20 -mt-4 w-[92%] -rotate-1"
      >
        <div className="rounded-xl bg-sky-50 p-4">
          {/* TODO(Ana): revisar o rotulo do mini card de Sobre. */}
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-sky-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Sobre reescrito
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-relaxed text-slate-800 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]">
            {EXAMPLE_SOBRE_TRECHO}
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
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-sky-50 px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
        >
          <pill.icon className="h-4 w-4 text-sky-700" aria-hidden />
          {pill.label}
        </motion.span>
      ))}
    </div>
  );
}
