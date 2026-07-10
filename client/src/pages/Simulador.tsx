import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  GraduationCap,
  Info,
  ListChecks,
  Map,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "@/components/Layout";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { areasTI } from "@/lib/data";
import { roadmapsV2 } from "@/lib/roadmapV2/content";

interface PriorityAction {
  text: string;
  href: string;
  cta: string;
}

const ac = getPageAccentUi("fuchsia");

const knowledgeOptions = [
  "Git",
  "Lógica",
  "HTML/CSS",
  "JavaScript",
  "SQL",
  "Inglês técnico",
  "LinkedIn",
  "GitHub",
  "APIs",
  "Testes",
  "Deploy",
  "Banco de dados",
  "Documentação",
  "Debug",
  "UX básica",
  "Metodologias ágeis",
];

const goalMultipliers: Record<string, number> = {
  Estágio: 0.85,
  Trainee: 1,
  "Júnior CLT": 1.15,
  "Júnior PJ": 1.05,
  Freela: 0.95,
};

const experienceDiscounts: Record<string, number> = {
  "Nunca estudei programação": 0,
  "Já fiz cursos soltos": 1,
  "Tenho 1 projeto publicado": 2,
  "Tenho 2+ projetos publicados": 3,
};

const portfolioDiscounts: Record<string, number> = {
  "Ainda não tenho portfólio": 0,
  "Tenho GitHub, mas sem README bom": 1,
  "Tenho projetos com README e prints": 2,
  "Tenho portfólio publicado e projetos explicados": 3,
};

const applicationDiscounts: Record<string, number> = {
  "Ainda não aplico": 0,
  "1 a 3 vagas por semana": 1,
  "4 a 10 vagas por semana": 2,
  "10+ vagas por semana com currículo adaptado": 3,
};

const projectCadenceDiscounts: Record<string, number> = {
  "Ainda estudo sem criar projetos": 0,
  "Faço exercícios e mini desafios": 1,
  "Crio projetos guiados com frequência": 2,
  "Crio projetos próprios resolvendo problemas reais": 4,
};

const jobMaterialsDiscounts: Record<string, number> = {
  "Ainda não tenho currículo nem LinkedIn prontos": 0,
  "Tenho currículo básico": 1,
  "Tenho currículo e LinkedIn atualizados": 2,
  "Adapto currículo, LinkedIn e apresentação para cada vaga": 4,
};

const interviewDiscounts: Record<string, number> = {
  "Nunca treinei entrevista": 0,
  "Já respondi perguntas comuns": 1,
  "Treino técnica e comportamento todo mês": 2,
  "Faço simulações, reviso feedbacks e estudo cases": 3,
};

const consistencyDiscounts: Record<string, number> = {
  "Tenho dificuldade de manter rotina": 0,
  "Estudo quando sobra tempo": 1,
  "Tenho agenda semanal definida": 2,
  "Tenho metas semanais, revisão e acompanhamento": 4,
};

const supportDiscounts: Record<string, number> = {
  "Estou fazendo tudo sozinha": 0,
  "Participo de comunidades ou grupos": 1,
  "Tenho pares para revisar projetos": 2,
  "Tenho mentoria, feedback recorrente ou rede ativa": 3,
};

const areaComplexity: Record<string, number> = {
  "Front-end": 10,
  "Back-end": 12,
  "Ciência de Dados": 14,
  "UX/UI Design": 10,
  "Inteligência Artificial": 18,
  "Produto Digital": 11,
  Cibersegurança: 15,
  "Cloud Computing": 15,
  "Gestão de Projetos Tech": 10,
  "QA / Testes de Software": 9,
  "Desenvolvimento Mobile": 13,
  DevOps: 16,
  Mainframe: 14,
};

const MAX_READINESS =
  5 +
  5 +
  Math.max(...Object.values(experienceDiscounts)) +
  Math.max(...Object.values(portfolioDiscounts)) +
  Math.max(...Object.values(projectCadenceDiscounts)) +
  Math.max(...Object.values(jobMaterialsDiscounts)) +
  Math.max(...Object.values(interviewDiscounts)) +
  Math.max(...Object.values(applicationDiscounts)) +
  Math.max(...Object.values(consistencyDiscounts)) +
  Math.max(...Object.values(supportDiscounts)) +
  2 +
  2;

const MAX_READINESS_REDUCTION = 0.6;

export default function Simulador() {
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [area, setArea] = useState(areasTI[0]?.nome || "Front-end");
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState(5);
  const [goal, setGoal] = useState("Estágio");
  const [experience, setExperience] = useState("Nunca estudei programação");
  const [portfolio, setPortfolio] = useState("Ainda não tenho portfólio");
  const [applications, setApplications] = useState("Ainda não aplico");
  const [english, setEnglish] = useState("Básico");
  const [networking, setNetworking] = useState("Baixo");
  const [projectCadence, setProjectCadence] = useState(
    "Ainda estudo sem criar projetos",
  );
  const [jobMaterials, setJobMaterials] = useState(
    "Ainda não tenho currículo nem LinkedIn prontos",
  );
  const [interview, setInterview] = useState("Nunca treinei entrevista");
  const [consistency, setConsistency] = useState(
    "Tenho dificuldade de manter rotina",
  );
  const [support, setSupport] = useState("Estou fazendo tudo sozinha");
  const [knowledge, setKnowledge] = useState<string[]>([]);
  const totalSteps = 11;
  const reduce = useReducedMotion();

  const weeklyHours = hours * days;
  const baseMonths = areaComplexity[area] || 12;
  const effortDiscount = Math.min(5, Math.floor(weeklyHours / 4));
  const knowledgeDiscount = Math.min(5, Math.floor(knowledge.length / 3));
  const englishDiscount =
    english === "Avançado" ? 2 : english === "Intermediário" ? 1 : 0;
  const networkingDiscount =
    networking === "Alto" ? 2 : networking === "Médio" ? 1 : 0;
  const lowPacePenalty = weeklyHours < 5 ? 2 : weeklyHours < 8 ? 1 : 0;
  const readinessDiscount =
    effortDiscount +
    knowledgeDiscount +
    experienceDiscounts[experience] +
    portfolioDiscounts[portfolio] +
    projectCadenceDiscounts[projectCadence] +
    jobMaterialsDiscounts[jobMaterials] +
    interviewDiscounts[interview] +
    applicationDiscounts[applications] +
    consistencyDiscounts[consistency] +
    supportDiscounts[support] +
    englishDiscount +
    networkingDiscount;
  const adjustedBaseMonths = baseMonths + lowPacePenalty;
  const readinessRatio = Math.min(1, readinessDiscount / MAX_READINESS);
  const months = Math.max(
    2,
    Math.round(
      adjustedBaseMonths *
        (1 - readinessRatio * MAX_READINESS_REDUCTION) *
        (goalMultipliers[goal] || 1),
    ),
  );
  const readinessScore = Math.min(100, Math.round(readinessRatio * 100));
  const studyIntensity =
    weeklyHours >= 20 ? "alta" : weeklyHours >= 10 ? "moderada" : "leve";
  const priorityActions = [
    portfolioDiscounts[portfolio] < 2
      ? {
          text: "Transformar estudos em projetos publicáveis com README, prints e contexto do problema.",
          href: "/portfolio/analisar",
          cta: "Analisar portfólio",
        }
      : null,
    projectCadenceDiscounts[projectCadence] < 2
      ? {
          text: "Aumentar a prática com projetos próprios, não só aulas e exercícios isolados.",
          href: "/projetos",
          cta: "Ideias de projeto",
        }
      : null,
    jobMaterialsDiscounts[jobMaterials] < 2
      ? {
          text: "Organizar currículo, LinkedIn e apresentação curta antes de aplicar em volume.",
          href: "/curriculo/analisar",
          cta: "Arrumar currículo",
        }
      : null,
    interviewDiscounts[interview] < 2
      ? {
          text: "Treinar entrevistas técnicas e comportamentais com perguntas reais da área.",
          href: "/entrevistas",
          cta: "Treinar entrevistas",
        }
      : null,
    applicationDiscounts[applications] < 2
      ? {
          text: "Criar uma rotina semanal de aplicações com currículo adaptado para cada vaga.",
          href: "/estagio",
          cta: "Ver vagas e estágios",
        }
      : null,
    consistencyDiscounts[consistency] < 2
      ? {
          text: "Definir metas semanais e revisar o progresso para reduzir pausas longas.",
          href: "/evolucao",
          cta: "Acompanhar evolução",
        }
      : null,
    supportDiscounts[support] < 1
      ? {
          text: "Entrar em comunidades para ter feedback, repertório e indicações mais cedo.",
          href: "/comunidades",
          cta: "Entrar numa comunidade",
        }
      : null,
  ].filter(Boolean) as PriorityAction[];

  function toggleKnowledge(item: string) {
    setKnowledge((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }

  useEffect(() => {
    if (!showResults) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showResults]);

  const progressPercent = showResults
    ? 100
    : Math.round((step / totalSteps) * 100);

  const areaSlug = areasTI.find((entry) => entry.nome === area)?.slug;
  const areaPageHref = areaSlug ? `/areas/${areaSlug}` : "/areas";
  const roadmapHref =
    areaSlug && roadmapsV2.some((entry) => entry.slug === areaSlug)
      ? `/roadmaps/${areaSlug}`
      : "/roadmaps";
  const areaPath = [
    {
      href: roadmapHref,
      Icon: Map,
      label: "Roadmap da área",
      desc: "Trilha passo a passo, do básico ao avançado.",
    },
    {
      href: "/salarios",
      Icon: Wallet,
      label: "Salários",
      desc: "Panorama de faixas salariais em tech.",
    },
    {
      href: "/cursos",
      Icon: GraduationCap,
      label: "Cursos",
      desc: "Onde estudar, do gratuito ao avançado.",
    },
    {
      href: areaPageHref,
      Icon: Compass,
      label: `Página de ${area}`,
      desc: "Visão geral, skills e o que faz quem atua nela.",
    },
  ];

  const resultsBlock = (
    <div
      className={cn(
        "rounded-3xl border-2 border-slate-900 p-6 text-center shadow-[4px_4px_0_#0f172a] md:p-8",
        ac.panelSoft,
      )}
    >
      <p
        className={cn(
          "inline-flex items-center justify-center gap-2 text-sm font-black uppercase",
          ac.progressLabel,
        )}
      >
        <ListChecks className="h-4 w-4" />
        Prazo estimado (orientativo)
      </p>
      <p className={cn("font-display text-6xl font-black", ac.tbodyAccent)}>
        {months}
      </p>
      <p className="text-xl font-black">meses</p>
      <p className="mx-auto mt-4 max-w-2xl text-left text-sm font-medium leading-relaxed text-slate-700 md:text-center">
        O número combina a{" "}
        <strong className="font-black text-slate-950">
          complexidade típica da área
        </strong>
        , seu ritmo de estudo e o que você já tem (portfólio, aplicações,
        rotina). Não é promessa de vaga: é um{" "}
        <strong className="font-black text-slate-950">
          eixo para planejar
        </strong>{" "}
        e ver o que mais encurta o caminho.
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-600 md:text-center">
        Cenário:{" "}
        <strong className="font-black text-slate-900">{hours}h/dia</strong>,{" "}
        <strong className="font-black text-slate-900">
          {days} dias/semana
        </strong>
        , meta <strong className="font-black text-slate-900">{goal}</strong>,
        foco em <strong className="font-black text-slate-900">{area}</strong>.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <span
          className="rounded-xl bg-white p-3 text-left text-sm font-bold md:text-center"
          title="Quanto dos fatores que encurtam prazo você já preencheu"
        >
          Prontidão: {readinessScore}%
        </span>
        <span className="rounded-xl bg-white p-3 text-sm font-bold">
          {weeklyHours}h/semana
        </span>
        <span className="rounded-xl bg-white p-3 text-sm font-bold">
          {knowledge.length} bases marcadas
        </span>
        <span className="rounded-xl bg-white p-3 text-sm font-bold">
          Prática: {projectCadenceDiscounts[projectCadence]}/4
        </span>
        <span className="rounded-xl bg-white p-3 text-sm font-bold">
          Meta: {goal}
        </span>
      </div>
      <p className="mx-auto mt-3 max-w-xl text-xs font-medium text-slate-500">
        O indicador{" "}
        <strong className="font-bold text-slate-700">Prontidão</strong> resume
        quanto você já traz de rotina, portfólio, candidatura e rede. Não mede
        seu talento.
      </p>

      <div className="mt-8 grid gap-3 text-left md:grid-cols-3">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="font-display font-black text-slate-950">
            Primeiro terço
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Base técnica, rotina de estudo e GitHub organizado.
          </p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="font-display font-black text-slate-950">
            Meio do caminho
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Projetos publicáveis, README bom e prática com ferramentas da área.
          </p>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="font-display font-black text-slate-950">Reta final</p>
          <p className="mt-1 text-sm text-slate-600">
            Aplicações consistentes, LinkedIn, networking e preparação para
            entrevistas.
          </p>
        </div>
      </div>

      {priorityActions.length ? (
        <div className="mt-8 rounded-2xl border-2 border-slate-900 bg-white p-5 text-left shadow-[3px_3px_0_#0f172a]">
          <p className="font-display text-lg font-black text-slate-950">
            O que mais encurta o caminho no seu caso
          </p>
          <ul className="mt-4 space-y-3">
            {priorityActions.slice(0, 4).map((action) => (
              <li key={action.text}>
                <Link
                  href={action.href}
                  className="group flex flex-col gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-900 hover:bg-white hover:shadow-[3px_3px_0_#0f172a] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {action.text}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border-2 border-slate-900 bg-fuchsia-300 px-3 py-1.5 text-xs font-black text-slate-950 transition-transform group-hover:-translate-y-px sm:self-auto">
                    {action.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-slate-600">
            O prazo encurta conforme você cobre esses fatores. Foque nas ações
            acima pra acelerar.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-slate-900 bg-white p-5 text-left shadow-[3px_3px_0_#0f172a]">
          <p className="font-display text-lg font-black text-slate-950">
            Pelas suas respostas, você já cobre bastante do que acelera o
            processo
          </p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Mantenha o ritmo, aplique com estratégia e use feedbacks de
            entrevistas para ajustar o plano.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border-2 border-slate-900 bg-white p-5 text-left shadow-[3px_3px_0_#0f172a]">
        <p className="font-display text-lg font-black text-slate-950">
          Seu caminho em {area}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {areaPath.map(({ href, Icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-start gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-900 hover:bg-white hover:shadow-[3px_3px_0_#0f172a]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-fuchsia-300 shadow-[2px_2px_0_#0f172a]">
                <Icon className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-display font-black text-slate-950">
                  {label}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-sm font-medium text-slate-600">
                  {desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
        <Link
          href="/plano-carreira"
          className="btn-brutal-accent inline-flex cursor-pointer justify-center rounded-full px-6 py-3 font-black"
        >
          {/* TODO(Ana): label do link pro plano de carreira */}
          Ver plano de carreira
        </Link>
        <Link
          href={areaPageHref}
          className="btn-brutal-primary inline-flex cursor-pointer justify-center rounded-full bg-white px-6 py-3 font-black"
        >
          Página da área ({area})
        </Link>
        <button
          type="button"
          onClick={() => setShowResults(false)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-transparent px-6 py-3 font-black text-slate-900 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Ajustar respostas
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Simulador de carreira · Prazo até sua meta em TI"
        description="Responda um diagnóstico rápido sobre sua situação e hábitos e receba uma estimativa de prazo até sua meta em TI, com o que priorizar no caminho."
        url="/simulador"
      />
      <PageHero
        accent="fuchsia"
        eyebrow={
          showResults ? "resultado do diagnóstico" : "Simule sua evolução"
        }
        title={
          showResults
            ? "Seu cenário estimado"
            : "Em quanto tempo você chega na sua meta?"
        }
        subtitle={
          showResults
            ? "Um prazo orientativo e as alavancas que mais mexem no seu caso, para planejar sem achismo."
            : "Responde um diagnóstico rápido sobre sua situação e seus hábitos, e a gente estima um prazo até sua meta e o que priorizar pra chegar mais rápido."
        }
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          {!showResults ? (
            <div className="card-brutal rounded-2xl bg-white p-6">
              {step === 1 && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6"
                >
                  <p className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-700">
                    Como funciona
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        Icon: ListChecks,
                        texto:
                          "Você responde sobre onde está hoje e como estuda: área, horas, portfólio, prática.",
                      },
                      {
                        Icon: SlidersHorizontal,
                        texto: "Cada fator encurta ou estica o prazo estimado.",
                      },
                      {
                        Icon: Clock,
                        texto:
                          "No fim você vê uma estimativa de tempo e as ações que mais aceleram seu caminho.",
                      },
                    ].map((passo, idx) => {
                      const StepIcon = passo.Icon;
                      return (
                        <div
                          key={passo.texto}
                          className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-fuchsia-50/60 p-4"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-fuchsia-300 font-display text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                            {idx + 1}
                          </span>
                          <div>
                            <StepIcon
                              className="mb-1.5 h-5 w-5 text-fuchsia-700"
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
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <p className="text-sm font-bold text-amber-800">
                      É uma estimativa pra te orientar, não uma promessa.
                      Carreira depende de muita coisa que nenhum simulador prevê.
                    </p>
                  </div>
                </motion.div>
              )}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-black uppercase">
                  <span className={ac.progressLabel}>
                    Passo {step} de {totalSteps}
                  </span>
                  <span className={ac.progressLabel}>{progressPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border-2 border-slate-900 bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      ac.progressFill,
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Na última pergunta, use “Ver minha estimativa”: o resultado
                  aparece em uma tela só, separado das perguntas.
                </p>
              </div>

              {step === 1 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Qual área te interessa?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Áreas mais complexas tendem a exigir mais tempo de base e
                    projetos.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {areasTI.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => setArea(item.nome)}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-4 text-left font-black transition-all ${
                            area === item.nome
                              ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                              : "border-slate-200 bg-white hover:border-slate-900"
                          }`}
                        >
                          <Icon
                            className="h-5 w-5 shrink-0 text-slate-700"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          {item.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Quanto tempo você pode estudar com consistência?
                  </h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="block rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 font-black">
                      {hours}h por dia
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={hours}
                        onChange={(event) =>
                          setHours(Number(event.target.value))
                        }
                        className="mt-4 w-full cursor-pointer"
                      />
                    </label>
                    <label className="block rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 font-black">
                      {days} dias por semana
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={days}
                        onChange={(event) =>
                          setDays(Number(event.target.value))
                        }
                        className="mt-4 w-full cursor-pointer"
                      />
                    </label>
                  </div>
                  <p
                    className={cn(
                      "mt-4 rounded-xl border-2 p-3 text-sm font-bold",
                      ac.panelBorder,
                      ac.panelSoft,
                      ac.tbodyAccent,
                    )}
                  >
                    Ritmo atual: {weeklyHours}h/semana, intensidade{" "}
                    {studyIntensity}.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Qual é seu ponto de partida?
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.keys(experienceDiscounts).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setExperience(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          experience === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    O que você já sabe ou já usa?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Marque tudo que você já conhece minimamente.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {knowledgeOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleKnowledge(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          knowledge.includes(item)
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        <CheckCircle className="mb-2 h-4 w-4" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Como está seu portfólio?
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.keys(portfolioDiscounts).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPortfolio(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          portfolio === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Como você pratica?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Projetos próprios aceleram a transição porque mostram
                    autonomia e resolução de problemas.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.keys(projectCadenceDiscounts).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setProjectCadence(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          projectCadence === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 7 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Como estão seus materiais de candidatura?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Currículo, LinkedIn e apresentação precisam deixar claro o
                    que você sabe fazer.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.keys(jobMaterialsDiscounts).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setJobMaterials(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          jobMaterials === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 8 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Você já se prepara para entrevistas?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    A primeira vaga costuma depender tanto de comunicação quanto
                    de base técnica.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {Object.keys(interviewDiscounts).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setInterview(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 text-left font-black transition-all ${
                          interview === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 9 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Busca de vagas, inglês e networking
                  </h2>
                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    <div>
                      <p className="mb-2 text-sm font-black uppercase text-slate-500">
                        Aplicações
                      </p>
                      <div className="space-y-2">
                        {Object.keys(applicationDiscounts).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setApplications(item)}
                            className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left text-sm font-black transition-all ${
                              applications === item
                                ? "border-slate-900 bg-yellow-300"
                                : "border-slate-200 bg-white hover:border-slate-900"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-black uppercase text-slate-500">
                        Inglês técnico
                      </p>
                      <div className="space-y-2">
                        {["Básico", "Intermediário", "Avançado"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setEnglish(item)}
                            className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left text-sm font-black transition-all ${
                              english === item
                                ? "border-slate-900 bg-yellow-300"
                                : "border-slate-200 bg-white hover:border-slate-900"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-black uppercase text-slate-500">
                        Networking
                      </p>
                      <div className="space-y-2">
                        {["Baixo", "Médio", "Alto"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setNetworking(item)}
                            className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left text-sm font-black transition-all ${
                              networking === item
                                ? "border-slate-900 bg-yellow-300"
                                : "border-slate-200 bg-white hover:border-slate-900"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 10 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Consistência e apoio
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Rotina, feedback e comunidade reduzem retrabalho e ajudam a
                    manter velocidade.
                  </p>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-black uppercase text-slate-500">
                        Consistência
                      </p>
                      <div className="space-y-2">
                        {Object.keys(consistencyDiscounts).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setConsistency(item)}
                            className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left text-sm font-black transition-all ${
                              consistency === item
                                ? "border-slate-900 bg-yellow-300"
                                : "border-slate-200 bg-white hover:border-slate-900"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-black uppercase text-slate-500">
                        Apoio e feedback
                      </p>
                      <div className="space-y-2">
                        {Object.keys(supportDiscounts).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSupport(item)}
                            className={`w-full cursor-pointer rounded-xl border-2 p-3 text-left text-sm font-black transition-all ${
                              support === item
                                ? "border-slate-900 bg-yellow-300"
                                : "border-slate-200 bg-white hover:border-slate-900"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 11 && (
                <div>
                  <h2 className="font-display text-2xl font-black">
                    Qual seu objetivo?
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Escolha a meta mais próxima do que você busca primeiro. Ao
                    finalizar, o prazo aparece em uma tela só, separado das
                    perguntas.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {Object.keys(goalMultipliers).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setGoal(item)}
                        className={`cursor-pointer rounded-xl border-2 p-4 font-black transition-all ${
                          goal === item
                            ? "border-slate-900 bg-yellow-300 shadow-[3px_3px_0_#0f172a]"
                            : "border-slate-200 bg-white hover:border-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="btn-brutal-primary inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 font-black"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                ) : null}
                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="btn-brutal-accent inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-black"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResults(true)}
                    className="btn-brutal-accent inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-black"
                  >
                    Ver minha estimativa
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">{resultsBlock}</div>
          )}
        </div>
      </section>
    </Layout>
  );
}
