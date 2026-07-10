import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CareerTrail from "./CareerTrail";
import { buildTrailVM, type TrailSourceResult } from "./types";

// Estado de entrada do Plano de Carreira: linha de 3 passos (conta, intake,
// mapa) no espirito do HowItWorksTimeline do portfolio + VITRINE ilustrativa
// da trilha, renderizada com os componentes REAIS da Fase 2 em modo readonly.
// Teatro honesto: os dados sao constantes EXAMPLE_*, nunca resultado do
// usuario, e o selo "exemplo ilustrativo" declara isso. A unica certificacao
// citada e um item REAL do catalogo (por id), sem preco.

// TODO(Ana): revisar titulos e frases dos passos.
const INTRO_STEPS: { title: string; text: string }[] = [
  {
    title: "Entre na sua conta",
    text: "O plano fica salvo na sua conta e a geração faz parte do Plano Pro.",
  },
  {
    title: "Conte seu objetivo",
    text: "Um intake curto: objetivo, área, nível, horas por semana, horizonte e orçamento.",
  },
  {
    title: "Receba o mapa",
    text: "A rota em degraus, com certificações no momento certo, cronograma realista e checklist de progresso.",
  },
];

// TODO(Ana): revisar o selo da vitrine.
const SHOWCASE_BADGE = "exemplo ilustrativo";

// Dados ILUSTRATIVOS da mini-trilha. Labels genericos de pratica; a
// certificacao entra por id real do catalogo (aws-cloud-practitioner), nunca
// nome inventado. TODO(Ana): revisar os textos do exemplo.
const EXAMPLE_RESULT: TrailSourceResult = {
  steps: [
    {
      id: "base",
      title: "Base da área",
      rationale:
        "Primeiro a fundação: lógica, ferramentas do dia a dia e o vocabulário da área, pra tudo que vem depois assentar.",
      items: [
        { label: "Estudar os fundamentos da área", catalogId: null },
        { label: "Montar o ambiente e as ferramentas", catalogId: null },
      ],
      estimatedWeeks: 6,
    },
    {
      id: "pratica",
      title: "Prática de verdade",
      rationale:
        "Projetos próprios publicados valem mais que certificado sem prática: aprender primeiro, certificar depois.",
      items: [
        { label: "Publicar dois projetos próprios", catalogId: null },
        { label: "Caprichar no README de cada projeto", catalogId: null },
      ],
      estimatedWeeks: 8,
    },
    {
      id: "prova",
      title: "Prova e vaga",
      rationale:
        "Com base e prática no lugar, a certificação de entrada vira diferencial e a busca por vaga vira rotina.",
      items: [{ label: "Rotina semanal de candidaturas", catalogId: null }],
      estimatedWeeks: 6,
    },
  ],
  certifications: [
    {
      catalogId: "aws-cloud-practitioner",
      stepId: "prova",
      whenLabel: "depois do degrau de prática",
      optional: false,
      rationale:
        "Certificação de porta de entrada, reconhecida no mercado e sem pré-requisito.",
    },
  ],
  schedule: [
    { monthsLabel: "Meses 1 a 2", focus: "base", stepIds: ["base"] },
    { monthsLabel: "Meses 3 a 4", focus: "prática", stepIds: ["pratica"] },
    { monthsLabel: "Meses 5 a 6", focus: "prova e vaga", stepIds: ["prova"] },
  ],
};

// Progresso parcial ficticio: primeira estacao completa, segunda no meio.
const EXAMPLE_DONE = new Set([
  "step:base:0",
  "step:base:1",
  "step:pratica:0",
]);

export function HowItWorksSteps() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-black text-slate-950">
        {/* TODO(Ana): titulo da secao de passos */}
        Como funciona
      </h2>
      <ol className="space-y-0">
        {INTRO_STEPS.map((step, i) => {
          const last = i === INTRO_STEPS.length - 1;
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

// Vitrine: a PRIMEIRA renderizacao dos componentes da Fase 2, em modo
// readonly. Expansao das estacoes funciona (preview real); marcar itens nao.
export function TrailShowcase() {
  const reduce = useReducedMotion() ?? false;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const vm = useMemo(() => buildTrailVM(EXAMPLE_RESULT, EXAMPLE_DONE), []);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <span className="absolute -top-3 right-2 z-20 rotate-2 rounded-full border-2 border-slate-950 bg-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-[2px_2px_0_#0f172a]">
        {SHOWCASE_BADGE}
      </span>
      <CareerTrail
        stations={vm.stations}
        currentStationIndex={vm.currentStationIndex}
        expandedStationId={expandedId}
        onExpand={setExpandedId}
        onToggleItem={() => undefined}
        readonly
      />
    </motion.div>
  );
}
