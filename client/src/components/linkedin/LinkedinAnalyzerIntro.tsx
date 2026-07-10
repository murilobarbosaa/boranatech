import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Gauge, Search, Sparkles, Type } from "lucide-react";
import { FAIXA_UI } from "@/components/linkedin/faixaUi";
import MiniScoreRing from "@/components/portfolio/MiniScoreRing";
import { cn } from "@/lib/utils";

// Estado de entrada do Analisador de LinkedIn (L3): linha do tempo compacta
// de 3 passos + VITRINE ilustrativa do resultado + pills de beneficios, no
// molde exato do AnalyzerIntro do Analisador de GitHub.
// A vitrine e 100% ILUSTRATIVA: numeros e frases sao constantes EXAMPLE_*,
// nunca dado real do usuario, e o selo "exemplo ilustrativo" declara isso.

// TODO(Ana): revisar titulos e frases da linha do tempo do LinkedIn.
const TIMELINE_STEPS: { title: string; text: string }[] = [
  {
    title: "Exporte o PDF",
    text: "No seu perfil do LinkedIn, toque em Mais (More) e escolha Salvar como PDF.",
  },
  {
    title: "Revise o que detectamos",
    text: "A gente lê o PDF aqui no navegador e preenche tudo. Você só revisa e completa o contexto.",
  },
  {
    title: "Receba o raio-X",
    text: "Você recebe uma nota, um checklist do que falta e os textos prontos para colar no perfil.",
  },
];

// Constantes ILUSTRATIVAS da vitrine (nunca dado real do usuario).
const EXAMPLE_SCORE = 76;
// Cores da faixa "forte" direto do FAIXA_UI compartilhado (fonte unica).
const EXAMPLE_FAIXA_UI = FAIXA_UI.forte;
// TODO(Ana): revisar o rotulo de faixa do exemplo.
const EXAMPLE_FAIXA_LABEL = "Forte";
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
        <div
          className={cn(
            "flex items-center gap-4 rounded-xl p-4",
            EXAMPLE_FAIXA_UI.cardBg,
          )}
        >
          <MiniScoreRing
            score={EXAMPLE_SCORE}
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
