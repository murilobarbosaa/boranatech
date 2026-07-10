import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import { Spinner } from "@/components/ui/spinner";
import {
  CareerPlanEntryBackdrop,
  CareerPlanResultBackdrop,
} from "@/components/careerPlan/CareerPlanBackdrop";
import {
  HowItWorksSteps,
  TrailShowcase,
} from "@/components/careerPlan/CareerPlanIntro";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { AREA_LABELS, AREA_SLUGS } from "@shared/areas";
import { getCatalogItem } from "@shared/careerCatalog";
import { useCareerPlanChecklist } from "@/hooks/useCareerPlanChecklist";
import {
  CareerPlanApiError,
  generatePlan,
  getContext,
  getPlan,
  listPlans,
  type CareerPlanBudget,
  type CareerPlanContext,
  type CareerPlanDetail,
  type CareerPlanIntake,
  type CareerPlanSummary,
} from "@/services/careerPlanService";

const ac = getPageAccentUi("amber");

const LEVEL_OPTIONS = ["Estágio", "Trainee", "Júnior", "Pleno"];
const HORIZON_OPTIONS = [3, 6, 9, 12, 18, 24];

// TODO(Ana): labels do orcamento em BRL
const BUDGET_OPTIONS: Array<{ value: CareerPlanBudget; label: string }> = [
  { value: "zero", label: "Sem orçamento (só gratuitos)" },
  { value: "ate_500", label: "Até R$ 500" },
  { value: "ate_2000", label: "Até R$ 2.000" },
  { value: "acima_2000", label: "Acima de R$ 2.000" },
];

const fieldClass = cn(
  "mt-1 w-full rounded-xl border-2 p-3 text-sm font-bold text-slate-900",
  ac.input,
);

function formatPrice(catalogId: string): string {
  const item = getCatalogItem(catalogId);
  if (!item) return "";
  if ("free" in item.price) return "Gratuito";
  if (item.price.currency === "BRL") return `R$ ${item.price.amount}`;
  return `USD ${item.price.amount}`;
}

interface IntakeFormProps {
  prefill: CareerPlanContext | null;
  showArchiveWarning: boolean;
  onCancel?: () => void;
  generating: boolean;
  error: string;
  onSubmit: (intake: CareerPlanIntake) => void;
}

function IntakeForm({
  prefill,
  showArchiveWarning,
  onCancel,
  generating,
  error,
  onSubmit,
}: IntakeFormProps) {
  const prefillArea =
    prefill?.area && (AREA_SLUGS as readonly string[]).includes(prefill.area)
      ? prefill.area
      : AREA_SLUGS[0];
  const prefillLevel =
    prefill?.level && LEVEL_OPTIONS.includes(prefill.level)
      ? prefill.level
      : LEVEL_OPTIONS[0];
  const prefillHours = prefill?.weeklyMinutes30d
    ? Math.min(40, Math.max(1, Math.round(prefill.weeklyMinutes30d / 60)))
    : 6;

  const [goal, setGoal] = useState(prefill?.careerGoal ?? "");
  const [area, setArea] = useState<string>(prefillArea);
  const [level, setLevel] = useState(prefillLevel);
  const [hoursPerWeek, setHoursPerWeek] = useState(prefillHours);
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [budget, setBudget] = useState<CareerPlanBudget>("ate_500");
  const [localError, setLocalError] = useState("");

  function handleSubmit() {
    if (generating) return;
    if (goal.trim().length < 10) {
      // TODO(Ana): validacao de objetivo curto
      setLocalError("Conta seu objetivo com um pouco mais de detalhe (pelo menos uma frase).");
      return;
    }
    setLocalError("");
    onSubmit({
      goal: goal.trim(),
      area,
      level,
      hoursPerWeek,
      horizonMonths,
      budget,
    });
  }

  return (
    <div className="card-brutal rounded-2xl bg-white p-6">
      <h2 className="font-display text-2xl font-black text-slate-950">
        {/* TODO(Ana): titulo do intake */}
        Montar meu plano de carreira
      </h2>
      {showArchiveWarning ? (
        <p className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
          {/* TODO(Ana): aviso de arquivamento do plano atual */}
          Gerar um plano novo arquiva o atual. Ele continua acessível na lista
          de planos anteriores, com o progresso guardado.
        </p>
      ) : null}
      <div className="mt-5 space-y-4">
        <label className="block font-black">
          Qual é o seu objetivo?
          <textarea
            rows={3}
            className={cn(fieldClass, "resize-y font-medium")}
            placeholder="Ex.: sair do suporte e conseguir minha primeira vaga como dev back-end"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block font-black">
            Área
            <select
              className={fieldClass}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              {AREA_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {AREA_LABELS[slug]}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-black">
            Nível atual
            <select
              className={fieldClass}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-black">
            Horas de estudo por semana
            <input
              type="number"
              min={1}
              max={40}
              className={fieldClass}
              value={hoursPerWeek}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (Number.isInteger(parsed)) {
                  setHoursPerWeek(Math.min(40, Math.max(1, parsed)));
                }
              }}
            />
          </label>
          <label className="block font-black">
            Horizonte do plano
            <select
              className={fieldClass}
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(Number(e.target.value))}
            >
              {HORIZON_OPTIONS.map((months) => (
                <option key={months} value={months}>
                  {months} meses
                </option>
              ))}
            </select>
          </label>
          <label className="block font-black sm:col-span-2">
            Orçamento para certificações
            <select
              className={fieldClass}
              value={budget}
              onChange={(e) => setBudget(e.target.value as CareerPlanBudget)}
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {localError || error ? (
        <p className="mt-4 rounded-xl border-2 border-red-400 bg-red-100 px-3 py-2 text-sm font-bold text-red-900">
          {localError || error}
        </p>
      ) : null}

      {generating ? (
        <p className="mt-4 rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">
          {/* TODO(Ana): aviso de demora da geracao */}
          Montando sua rota de carreira. Isso pode levar até um minuto e meio,
          não feche a página.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={generating}
          className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {/* TODO(Ana): label do botao de gerar */}
          {generating ? "Gerando seu plano" : "Gerar meu plano"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-[2px_2px_0_#0f172a]"
          >
            Voltar pro plano atual
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ChecklistBox({
  done,
  disabled,
  onToggle,
  label,
}: {
  done: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors",
        done
          ? "border-emerald-500 bg-emerald-50 text-slate-700"
          : "border-slate-300 bg-white text-slate-800 hover:border-slate-500",
        disabled && "cursor-default opacity-80",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
          done ? "border-emerald-600 bg-emerald-500" : "border-slate-400 bg-white",
        )}
        aria-hidden
      >
        {done ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
      </span>
      <span className={cn(done && "line-through decoration-slate-400")}>
        {label}
      </span>
    </button>
  );
}

interface PlanViewProps {
  plan: CareerPlanDetail;
  readonly: boolean;
  onWantNew: () => void;
}

function PlanView({ plan, readonly, onWantNew }: PlanViewProps) {
  const { doneIds, toggle } = useCareerPlanChecklist(plan.id);
  const result = plan.result;
  const total = result.checklist.length;
  const done = result.checklist.filter((item) =>
    doneIds.has(item.itemId),
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="card-brutal rounded-2xl bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
              {/* TODO(Ana): rotulo do progresso */}
              Progresso do plano
            </p>
            <p className="mt-1 font-display text-xl font-black text-slate-950">
              {done} de {total} itens concluídos
            </p>
          </div>
          <div className="flex items-center gap-3">
            {plan.status === "archived" ? (
              <span className="rounded-full border-2 border-slate-400 bg-slate-100 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-600">
                Plano arquivado
              </span>
            ) : null}
            <button
              type="button"
              onClick={onWantNew}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Gerar novo plano
            </button>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-slate-950 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="card-brutal rounded-2xl bg-white p-6">
        <h2 className="font-display text-2xl font-black text-slate-950">
          {/* TODO(Ana): titulo da secao de logica */}
          Objetivo e lógica da rota
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {result.objectiveLogic}
        </p>
      </div>

      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
          {/* TODO(Ana): rotulo da secao de degraus */}
          Degraus da rota
        </p>
        <div className="mt-4 space-y-5">
          {result.steps.map((step, stepIndex) => (
            <div key={step.id} className="card-brutal rounded-2xl bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-black text-slate-950">
                  {stepIndex + 1}. {step.title}
                </h3>
                <span className="rounded-full border-2 border-slate-950 bg-amber-100 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-900">
                  ~{step.estimatedWeeks}{" "}
                  {step.estimatedWeeks === 1 ? "semana" : "semanas"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{step.rationale}</p>
              <div className="mt-4 space-y-2">
                {step.items.map((item, itemIndex) => {
                  const itemId = `step:${step.id}:${itemIndex}`;
                  const catalogItem = item.catalogId
                    ? getCatalogItem(item.catalogId)
                    : null;
                  const label = catalogItem
                    ? `${item.label} (${catalogItem.name})`
                    : item.label;
                  return (
                    <ChecklistBox
                      key={itemId}
                      done={doneIds.has(itemId)}
                      disabled={readonly}
                      onToggle={() => void toggle(itemId)}
                      label={label}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.certifications.length > 0 ? (
        <div className="card-brutal overflow-hidden rounded-2xl bg-white">
          <div className="p-5 pb-0">
            <h2 className="font-display text-2xl font-black text-slate-950">
              {/* TODO(Ana): titulo da tabela de certificacoes */}
              Certificações da rota
            </h2>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-950 text-xs font-black uppercase tracking-wide text-slate-600">
                  <th className="py-2 pr-3">Feito</th>
                  <th className="py-2 pr-3">Certificação</th>
                  <th className="py-2 pr-3">Nível</th>
                  <th className="py-2 pr-3">Preço</th>
                  <th className="py-2">Quando</th>
                </tr>
              </thead>
              <tbody>
                {result.certifications.map((cert) => {
                  const item = getCatalogItem(cert.catalogId);
                  const itemId = `cert:${cert.catalogId}`;
                  return (
                    <tr key={cert.catalogId} className="border-b border-slate-200 align-top">
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          disabled={readonly}
                          onClick={() => void toggle(itemId)}
                          aria-label={`Marcar ${item?.name ?? cert.catalogId}`}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border-2",
                            doneIds.has(itemId)
                              ? "border-emerald-600 bg-emerald-500"
                              : "border-slate-400 bg-white",
                            readonly && "cursor-default opacity-80",
                          )}
                        >
                          {doneIds.has(itemId) ? (
                            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                          ) : null}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        {item ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-slate-900 underline underline-offset-2 hover:text-amber-800"
                          >
                            {item.name}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                            {cert.catalogId}
                            <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
                              {/* TODO(Ana): marcacao de item fora do catalogo atual */}
                              item desatualizado
                            </span>
                          </span>
                        )}
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {cert.rationale}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {item?.level ?? ""}
                      </td>
                      <td className="py-3 pr-3 font-bold text-slate-900">
                        {item ? formatPrice(cert.catalogId) : ""}
                      </td>
                      <td className="py-3 text-slate-700">
                        {cert.whenLabel}
                        {cert.optional ? (
                          <span className="ml-1.5 rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
                            opcional
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {/* TODO(Ana): disclaimer fixo de precos */}
              Preços de referência de {plan.catalog_version}, direto do nosso
              catálogo curado. Confirme o valor no site oficial antes de
              comprar; provedores mudam preço sem aviso.
            </p>
          </div>
        </div>
      ) : null}

      <div className="card-brutal rounded-2xl bg-white p-6">
        <h2 className="font-display text-2xl font-black text-slate-950">
          {/* TODO(Ana): titulo do cronograma */}
          Cronograma
        </h2>
        <div className="mt-4 space-y-3">
          {result.schedule.map((block) => (
            <div
              key={block.monthsLabel}
              className={cn("rounded-xl border-2 p-4", ac.panelSoft)}
            >
              <p className="font-display text-sm font-black uppercase tracking-wide text-slate-900">
                {block.monthsLabel}
              </p>
              <p className="mt-1 text-sm text-slate-700">{block.focus}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-brutal rounded-2xl bg-white p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-black text-slate-950">
          <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden />
          {/* TODO(Ana): titulo da secao de honestidade */}O que ficou de fora
          e por quê
        </h2>
        <div className="mt-4 space-y-3">
          {result.outOfScope.map((item) => (
            <div key={item.label} className="rounded-xl border-2 border-dashed border-slate-300 p-4">
              <p className="font-bold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlanoCarreira() {
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const reduce = useReducedMotion() ?? false;

  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [activePlan, setActivePlan] = useState<CareerPlanDetail | null>(null);
  const [viewing, setViewing] = useState<CareerPlanDetail | null>(null);
  const [archived, setArchived] = useState<CareerPlanSummary[]>([]);
  const [prefill, setPrefill] = useState<CareerPlanContext | null>(null);
  const [wantNew, setWantNew] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) {
        setPhase("ready");
        return;
      }
      try {
        const plans = await listPlans();
        if (!alive) return;
        setArchived(plans.filter((p) => p.status === "archived"));
        const active = plans.find((p) => p.status === "active");
        if (active) {
          const detail = await getPlan(active.id);
          if (!alive) return;
          setActivePlan(detail);
        }
      } catch {
        // Sem plano carregado; a pagina cai no intake/ProGate normalmente.
      }
      try {
        const ctx = await getContext();
        if (alive) setPrefill(ctx);
      } catch {
        // Prefill e conveniencia: sem contexto o form abre vazio.
      }
      if (alive) setPhase("ready");
    }

    void load();
    return () => {
      alive = false;
    };
  }, [user]);

  async function handleGenerate(intake: CareerPlanIntake) {
    if (generating) return;
    setGenerating(true);
    setGenError("");
    try {
      const planId = await generatePlan(intake);
      const detail = await getPlan(planId);
      if (activePlan) {
        setArchived((prev) => [
          {
            id: activePlan.id,
            status: "archived",
            created_at: activePlan.created_at,
            area: activePlan.intake.area,
            goal: activePlan.intake.goal,
            checklistTotal: activePlan.result.checklist.length,
          },
          ...prev,
        ]);
      }
      setActivePlan(detail);
      setViewing(null);
      setWantNew(false);
    } catch (err) {
      setGenError(
        err instanceof CareerPlanApiError
          ? err.message
          : "Não foi possível gerar o plano agora. Tente de novo.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function openArchived(planId: string) {
    try {
      const detail = await getPlan(planId);
      setViewing(detail);
      setWantNew(false);
    } catch {
      // Mantem a visao atual; sem banner dedicado para caso raro.
    }
  }

  const shown = viewing ?? activePlan;
  const loading = phase === "loading" || subLoading;
  // Estado de resultado: um plano visivel (ativo ou arquivado), sem intake
  // aberto. Estado de entrada: nada pra mostrar (vitrine + ProGate/intake).
  const showingPlan = !loading && !!shown && !wantNew;
  const entryState = !loading && !shown;

  // Slot de acao contextual do cabecalho (padrao do molde RD2: o topo
  // esquerdo e o lugar universal de "voltar").
  const backAction =
    !loading && wantNew && shown
      ? {
          // TODO(Ana): label de volta ao plano atual
          label: "Voltar pro plano atual",
          onClick: () => setWantNew(false),
        }
      : !loading &&
          !wantNew &&
          viewing &&
          activePlan &&
          viewing.id !== activePlan.id
        ? {
            // TODO(Ana): label de volta ao plano ativo
            label: "Voltar pro plano ativo",
            onClick: () => setViewing(null),
          }
        : null;

  let mainBlock: React.ReactNode;
  if (loading) {
    mainBlock = (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  } else if (wantNew && !isPro) {
    // A volta pro plano atual vive no slot do cabecalho.
    mainBlock = (
      <ProGate description="Gerar um plano de carreira novo faz parte do Plano Pro. Seu plano atual e o progresso continuam aqui." />
    );
  } else if (wantNew || (!shown && isPro)) {
    mainBlock = (
      <IntakeForm
        prefill={prefill}
        showArchiveWarning={wantNew && !!activePlan}
        generating={generating}
        error={genError}
        onSubmit={(intake) => void handleGenerate(intake)}
      />
    );
  } else if (shown) {
    mainBlock = (
      <PlanView
        plan={shown}
        readonly={shown.status === "archived"}
        onWantNew={() => setWantNew(true)}
      />
    );
  } else {
    mainBlock = (
      <ProGate description="A IA monta a rota da sua carreira: degraus ordenados, certificações que valem o preço pro seu orçamento, cronograma realista e um checklist pra acompanhar até a vaga." />
    );
  }

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Plano de carreira em tech com IA"
        description="A rota da sua carreira em tecnologia: degraus ordenados, certificações que valem a pena pro seu orçamento, cronograma realista e checklist de progresso."
        url="/plano-carreira"
      />
      {/* Cenario do Dialeto 2 (molde atual do PortfolioAnalisar): sem
          PageHero, o cabecalho vive DENTRO do cenario, que nasce no topo. O
          backdrop vivo de entrada cobre vitrine, intake e ProGate; o de
          resultado acompanha o PlanView. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        {!loading && !showingPlan ? (
          <CareerPlanEntryBackdrop reduce={reduce} />
        ) : null}
        {showingPlan ? <CareerPlanResultBackdrop reduce={reduce} /> : null}
        <div className="container relative z-10">
          {/* Cabecalho integrado, presente em todos os estados. */}
          {/* TODO(Ana): validar copy do hero (diferenciar do Roadmap com IA, que responde o que estudar) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10"
          >
            {backAction ? (
              <button
                type="button"
                onClick={backAction.onClick}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold",
                  ac.link,
                  ac.linkHover,
                )}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {backAction.label}
              </button>
            ) : null}
            <p className={cn(backAction ? "mt-5" : undefined)}>
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                a rota da carreira
              </span>
            </p>
            <div className="mt-3.5 flex items-center gap-4">
              <span
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-[3px_3px_0_currentColor]",
                  ac.panelBorder,
                  ac.panelSoft,
                  ac.iconMuted,
                )}
                aria-hidden
              >
                <MapIcon className="h-8 w-8" />
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Plano de Carreira
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              O Roadmap diz o que estudar. Aqui é a rota da carreira: em que
              ordem, o que certificar e quando, no seu ritmo e orçamento.
            </p>
          </motion.div>

          <div className="space-y-10">
            {/* Vitrine do estado de entrada: como funciona + mini-trilha de
                exemplo (componentes reais da Fase 2, readonly), ANTES do
                ProGate/intake. */}
            {entryState ? (
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center">
                  <HowItWorksSteps />
                  <TrailShowcase />
                </div>
              </div>
            ) : null}

            {mainBlock}

            {!loading && archived.length > 0 && !wantNew ? (
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                  {/* TODO(Ana): titulo da lista de planos anteriores */}
                  Planos anteriores
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {archived.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void openArchived(p.id)}
                      className="rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-slate-500"
                    >
                      {p.area ?? "plano"} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
}
