import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Footprints,
  Loader2,
  Map as MapIcon,
  MapPin,
  RefreshCw,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BntSelect } from "@/components/shared/BntSelect";
import ProGate from "@/components/pro/ProGate";
import { Spinner } from "@/components/ui/spinner";
import CareerTrail from "@/components/careerPlan/CareerTrail";
import GeneralShelf from "@/components/careerPlan/GeneralShelf";
import InvestmentSummary from "@/components/careerPlan/InvestmentSummary";
import {
  CareerPlanEntryBackdrop,
  CareerPlanResultBackdrop,
} from "@/components/careerPlan/CareerPlanBackdrop";
import {
  HowItWorksSteps,
  TrailShowcase,
} from "@/components/careerPlan/CareerPlanIntro";
import { buildTrailVM } from "@/components/careerPlan/types";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { AREA_LABELS, AREA_SLUGS } from "@shared/areas";
import { useCareerPlanChecklist } from "@/hooks/useCareerPlanChecklist";
import {
  CareerPlanApiError,
  generatePlan,
  getContext,
  getFxRate,
  getPlan,
  listPlans,
  type CareerPlanBudget,
  type CareerPlanContext,
  type CareerPlanDetail,
  type CareerPlanIntake,
  type CareerPlanSummary,
  type FxRate,
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
      setLocalError(
        "Conta seu objetivo com um pouco mais de detalhe (pelo menos uma frase).",
      );
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
            <BntSelect
              label="Área"
              value={area}
              onValueChange={setArea}
              options={AREA_SLUGS.map((slug) => ({
                value: slug,
                label: AREA_LABELS[slug],
              }))}
            />
          </label>
          <label className="block font-black">
            Nível atual
            <BntSelect
              label="Nível atual"
              value={level}
              onValueChange={setLevel}
              options={LEVEL_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
            />
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
            <BntSelect
              label="Horizonte do plano"
              value={String(horizonMonths)}
              onValueChange={(v) => setHorizonMonths(Number(v))}
              options={HORIZON_OPTIONS.map((months) => ({
                value: String(months),
                label: `${months} meses`,
              }))}
            />
          </label>
          <label className="block font-black sm:col-span-2">
            Orçamento para certificações
            <BntSelect
              label="Orçamento para certificações"
              value={budget}
              onValueChange={(v) => setBudget(v as CareerPlanBudget)}
              options={BUDGET_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
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

const PLAN_STORAGE_KEY = "bnt:career-plan:v1";
// Versao da forma do payload persistido, no padrao do PortfolioAnalisar.
// Bump sempre que CareerPlanDetail/CareerPlanSummary ou a forma do estado
// salvo mudarem; no restore, versao diferente e descartada. NUNCA persiste
// progresso do checklist: ele e re-buscado do backend, fonte de verdade.
const PLAN_STORAGE_SHAPE_VERSION = 1;

interface StoredPlanState {
  activePlan: CareerPlanDetail | null;
  archived: CareerPlanSummary[];
  viewingId: string | null;
}

// Cache de sessao valido apenas para a MESMA versao de shape e o MESMO
// usuario (logout/troca de conta invalida). Qualquer coisa fora disso volta
// null e o fluxo segue o load normal com spinner.
function loadStoredPlanState(userId: string): StoredPlanState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      version?: unknown;
      userId?: unknown;
      activePlan?: unknown;
      archived?: unknown;
      viewingId?: unknown;
    };
    if (parsed.version !== PLAN_STORAGE_SHAPE_VERSION) return null;
    if (parsed.userId !== userId) return null;
    if (!Array.isArray(parsed.archived)) return null;
    return {
      activePlan:
        parsed.activePlan && typeof parsed.activePlan === "object"
          ? (parsed.activePlan as CareerPlanDetail)
          : null,
      archived: parsed.archived as CareerPlanSummary[],
      viewingId: typeof parsed.viewingId === "string" ? parsed.viewingId : null,
    };
  } catch {
    return null;
  }
}

// Skeleton do checklist em carregamento: enquanto o progresso nao chegou,
// nunca mostrar "0 de N" nem estacoes todas desmarcadas.
function TrailSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-56 w-[min(82vw,340px)] shrink-0 animate-pulse rounded-2xl border-2 border-slate-200 bg-white/70 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

// Faixa full-bleed da trilha: breakout MEDIDO (clientWidth do documento +
// offset esquerdo do wrapper em fluxo), nunca 100vw, para a pagina jamais
// ganhar scrollbar horizontal. Mesmo espirito do full-bleed do RoadmapTrail.
// O wash amber e da familia do ResultBackdrop, mais concentrado na faixa;
// doodles aria-hidden com loop gated por reduce.
function TrailBand({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState(() => ({
    viewportW:
      typeof window !== "undefined"
        ? document.documentElement.clientWidth
        : 1280,
    wrapLeft: 0,
  }));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const viewportW = document.documentElement.clientWidth;
      const wrapLeft = el.getBoundingClientRect().left;
      setMetrics((prev) =>
        prev.viewportW === viewportW && prev.wrapLeft === wrapLeft
          ? prev
          : { viewportW, wrapLeft },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="relative overflow-hidden border-y-2 border-dashed border-amber-900/10 py-10 md:py-14"
        style={{ marginLeft: -metrics.wrapLeft, width: metrics.viewportW }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-200/35 via-amber-100/25 to-amber-200/15"
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-[4%] hidden text-amber-600 opacity-[0.16] md:block"
          animate={reduce ? undefined : { y: [0, -8, 0], rotate: [0, 8, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Footprints className="h-9 w-9" strokeWidth={2.5} />
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-[4%] top-5 hidden text-orange-500 opacity-[0.15] md:block"
          animate={reduce ? undefined : { y: [0, -9, 0], rotate: [0, -7, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
          }
        >
          <MapPin className="h-10 w-10" strokeWidth={2.5} />
        </motion.span>
        <div className="container relative">{children}</div>
      </div>
    </div>
  );
}

interface PlanResultProps {
  plan: CareerPlanDetail;
  readonly: boolean;
  // Checklist icado para a pagina: o header integrado mostra a regua de
  // status a partir do MESMO estado que alimenta a trilha.
  checklist: ReturnType<typeof useCareerPlanChecklist>;
}

// Estado de resultado: bilhete do Natechinho (logica da rota) + trilha
// horizontal (estacoes fundem degrau, trofeus ancorados e periodo do
// cronograma) + prateleira geral + investimento + cronograma nao-ancorado +
// o que ficou de fora. O status do plano vive no header integrado da pagina.
// Hierarquia de larguras: cards de texto numa coluna de leitura max-w-3xl;
// a TRILHA estoura a coluna como faixa full-bleed (TrailBand) e vira o
// evento visual da pagina.
function PlanResult({ plan, readonly, checklist }: PlanResultProps) {
  const { doneIds, isLoading, toggle } = checklist;
  const [expandedStationId, setExpandedStationId] = useState<string | null>(
    null,
  );
  const [toggleError, setToggleError] = useState("");
  const toggleErrorTimer = useRef<number | null>(null);
  // Cotacao PTAX para os "≈ R$": UMA busca ao montar a secao, sem poll. null
  // (indisponivel) e silencioso e NAO entra no sessionStorage da pagina.
  const [fx, setFx] = useState<FxRate | null>(null);

  useEffect(() => {
    let alive = true;
    void getFxRate().then((rate) => {
      if (alive) setFx(rate);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toggleErrorTimer.current !== null) {
        window.clearTimeout(toggleErrorTimer.current);
      }
    };
  }, []);

  const result = plan.result;
  // doneIds null (falha no load do progresso) propaga estado indeterminado
  // pelo VM: aneis e checkboxes mostram "indisponivel", nunca 0.
  const vm = useMemo(() => buildTrailVM(result, doneIds), [result, doneIds]);
  const allCerts = useMemo(
    () => [...vm.stations.flatMap((s) => s.anchoredCerts), ...vm.generalCerts],
    [vm],
  );

  async function handleToggle(itemId: string) {
    if (readonly) return;
    const res = await toggle(itemId);
    if (!res.ok) {
      // TODO(Ana): mensagem de falha ao salvar marcacao do checklist
      setToggleError("Não deu pra salvar essa marcação agora. Tenta de novo.");
      if (toggleErrorTimer.current !== null) {
        window.clearTimeout(toggleErrorTimer.current);
      }
      toggleErrorTimer.current = window.setTimeout(
        () => setToggleError(""),
        4000,
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {toggleError ? (
          <p
            aria-live="polite"
            className="rounded-xl border-2 border-red-400 bg-red-100 px-3 py-2 text-sm font-bold text-red-900"
          >
            {toggleError}
          </p>
        ) : null}

        {/* Bilhete do Natechinho: a logica da rota em tom de recado pessoal.
            Fundo papel um tom acima do #faf8f4 da pagina e rotacao sutil, na
            linguagem do palco do intake. Sem asset de imagem do mascote no
            repo: selo circular com o MapIcon da pagina no lugar. */}
        <div className="relative mx-auto w-full max-w-2xl -rotate-[0.4deg] rounded-2xl border-2 border-slate-950 bg-[#fffaf0] p-6 shadow-[5px_5px_0_#0f172a]">
          <span
            aria-hidden
            className="absolute -right-3 -top-4 flex h-11 w-11 rotate-6 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-300 shadow-[2px_2px_0_#0f172a]"
          >
            <MapIcon className="h-5 w-5 text-slate-950" />
          </span>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">
            {/* TODO(Ana): assinatura do bilhete */}
            bilhete do Natechinho
          </p>
          <h2 className="mt-1 font-display text-xl font-black text-slate-950">
            {/* TODO(Ana): titulo curto do bilhete */}
            Por que a rota é essa
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {result.objectiveLogic}
          </p>
        </div>
      </div>

      {isLoading ? (
        <TrailSkeleton />
      ) : (
        <>
          <TrailBand>
            <CareerTrail
              stations={vm.stations}
              currentStationIndex={vm.currentStationIndex}
              expandedStationId={expandedStationId}
              onExpand={setExpandedStationId}
              onToggleItem={(itemId) => void handleToggle(itemId)}
              readonly={readonly}
              catalogVersion={plan.catalog_version}
              autoScrollToCurrent
              decorated
              fx={fx}
            />
          </TrailBand>

          <div className="mx-auto w-full max-w-3xl space-y-8">
            <GeneralShelf
              certs={vm.generalCerts}
              unanchored={vm.unanchored}
              onToggleCert={
                readonly ? undefined : (itemId) => void handleToggle(itemId)
              }
              readonly={readonly}
              catalogVersion={plan.catalog_version}
              fx={fx}
            />

            <InvestmentSummary
              certs={allCerts}
              catalogVersion={plan.catalog_version}
              fx={fx}
            />

            {vm.looseScheduleBlocks.length > 0 ? (
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                  {/* TODO(Ana): titulo da faixa de cronograma nao-ancorado */}
                  Cronograma da rota
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {vm.looseScheduleBlocks.map((block) => (
                    <div
                      key={block.monthsLabel}
                      className={cn("rounded-xl border-2 p-4", ac.panelSoft)}
                    >
                      <p className="font-display text-sm font-black uppercase tracking-wide text-slate-900">
                        {block.monthsLabel}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {block.focus}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      <div className="mx-auto w-full max-w-3xl">
        <div className="card-brutal rounded-2xl bg-white p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black text-slate-950">
            <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden />
            {/* TODO(Ana): titulo da secao de honestidade */}O que ficou de fora
            e por quê
          </h2>
          <div className="mt-4 space-y-3">
            {result.outOfScope.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border-2 border-dashed border-slate-300 p-4"
              >
                <p className="font-bold text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>
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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) {
        setPhase("ready");
        return;
      }
      // Re-hidratacao (padrao do molde PortfolioAnalisar): cache de sessao
      // valido renderiza imediatamente, sem spinner de pagina, e a busca
      // abaixo vira revalidacao silenciosa em segundo plano.
      const cached = loadStoredPlanState(user.id);
      if (cached) {
        setArchived(cached.archived);
        setActivePlan(cached.activePlan);
        setPhase("ready");
      } else {
        setPhase("loading");
      }
      setLoadError(false);
      try {
        const plans = await listPlans();
        if (!alive) return;
        setArchived(plans.filter((p) => p.status === "archived"));
        const active = plans.find((p) => p.status === "active");
        let activeDetail: CareerPlanDetail | null = null;
        if (active) {
          activeDetail = await getPlan(active.id);
          if (!alive) return;
        }
        // Divergencia do cache: estado (e cache, via effect de persistencia)
        // atualizam silenciosamente com o dado fresco.
        setActivePlan(activeDetail);
        // So o ID do plano em visualizacao e persistido: o detail volta por
        // fetch. O prev ?? preserva uma escolha manual feita enquanto a
        // revalidacao estava em voo.
        if (cached?.viewingId && cached.viewingId !== activeDetail?.id) {
          try {
            const viewingDetail = await getPlan(cached.viewingId);
            if (alive) setViewing((prev) => prev ?? viewingDetail);
          } catch {
            // Silencioso: o plano em visualizacao pode nao existir mais.
          }
        }
      } catch (err) {
        // Falha de rede NUNCA colapsa em "sem plano" (o Pro cairia no intake
        // achando que perdeu o plano): sem cache vira estado de erro com
        // retry; com cache valido na tela, a revalidacao apenas loga.
        if (!alive) return;
        if (cached) {
          console.error(
            "[career-plan] revalidacao em segundo plano falhou",
            err,
          );
        } else {
          setLoadError(true);
        }
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
  }, [user, reloadKey]);

  // Persistencia best-effort do estado de UI no sessionStorage (nunca o
  // progresso do checklist, que e re-buscado do backend). Gate em phase ready
  // e sem loadError para nunca gravar um estado vazio de load falho por cima
  // de um cache bom.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user || phase !== "ready" || loadError) return;
    try {
      window.sessionStorage.setItem(
        PLAN_STORAGE_KEY,
        JSON.stringify({
          version: PLAN_STORAGE_SHAPE_VERSION,
          userId: user.id,
          activePlan,
          archived,
          viewingId: viewing?.id ?? null,
        }),
      );
    } catch {
      // storage cheio ou indisponivel: ignora, segue so em memoria.
    }
  }, [user, phase, loadError, activePlan, archived, viewing]);

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
    if (openingId) return;
    setOpeningId(planId);
    setOpenError("");
    try {
      const detail = await getPlan(planId);
      setViewing(detail);
      setWantNew(false);
    } catch {
      // TODO(Ana): mensagem de falha ao abrir plano anterior
      setOpenError("Não conseguimos abrir esse plano agora. Tenta de novo.");
    } finally {
      setOpeningId(null);
    }
  }

  const shown = viewing ?? activePlan;
  // Checklist icado do PlanResult: a regua de status do header e a trilha
  // leem o MESMO estado (planId null = sem plano, hook fica inerte).
  const checklist = useCareerPlanChecklist(shown?.id ?? null);
  const loading = phase === "loading" || subLoading;
  // Estado de resultado: um plano visivel (ativo ou arquivado), sem intake
  // aberto. Estado de entrada: nada pra mostrar (vitrine + ProGate/intake).
  // Erro de carregamento nao e entrada: mostra o card de retry, sem vitrine.
  const showingPlan = !loading && !!shown && !wantNew;
  const entryState = !loading && !shown && !loadError;

  // Numeros da regua de status do header (as tres vozes do antigo card:
  // skeleton, indisponivel, X de Y).
  const planTotal = shown ? shown.result.checklist.length : 0;
  const doneSet = checklist.doneIds;
  const planDone =
    shown && doneSet
      ? shown.result.checklist.filter((item) => doneSet.has(item.itemId)).length
      : null;
  const planPct =
    planDone !== null && planTotal > 0
      ? Math.round((planDone / planTotal) * 100)
      : 0;

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
  } else if (loadError && !shown) {
    mainBlock = (
      <div className="card-brutal mx-auto max-w-xl rounded-2xl bg-white p-6 text-center">
        <p className="font-display text-xl font-black text-slate-950">
          {/* TODO(Ana): titulo do erro de carregamento do plano */}
          Não conseguimos carregar seu plano
        </p>
        <p className="mt-2 text-sm font-medium text-slate-600">
          {/* TODO(Ana): texto do erro de carregamento do plano */}
          Pode ser uma instabilidade passageira. Seu plano e o progresso
          continuam salvos.
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="bnt-pressable mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {/* TODO(Ana): label do botao de tentar de novo */}
          Tentar de novo
        </button>
      </div>
    );
  } else if (wantNew && !isPro) {
    // A volta pro plano atual vive no slot do cabecalho.
    mainBlock = (
      <ProGate feature="career_plan_new" description="Gerar um plano de carreira novo faz parte do Plano Pro. Seu plano atual e o progresso continuam aqui." />
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
      <PlanResult
        plan={shown}
        readonly={shown.status === "archived"}
        checklist={checklist}
      />
    );
  } else {
    mainBlock = (
      <ProGate feature="career_plan" description="A IA monta a rota da sua carreira: degraus ordenados, certificações que valem o preço pro seu orçamento, cronograma realista e um checklist pra acompanhar até a vaga." />
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
          resultado acompanha o PlanResult. */}
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
                  "inline-flex items-center gap-2 rounded-md text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
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

            {/* Regua de status fundida no header (o antigo card de progresso
                do PlanResult): elementos soltos no cenario, sem card. So no
                estado de resultado; a entrada e animada (gated por reduce)
                porque o header renderiza antes do plano carregar e a regua
                nao pode empurrar o layout de forma grosseira. */}
            {showingPlan && shown ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3">
                  <div className="min-w-[220px] max-w-sm flex-1">
                    {checklist.isLoading ? (
                      <span
                        aria-hidden
                        className="block h-5 w-44 animate-pulse rounded bg-slate-200 motion-reduce:animate-none"
                      />
                    ) : planDone === null ? (
                      <p className="text-sm font-bold text-slate-500">
                        {/* TODO(Ana): progresso indisponivel */}
                        Progresso indisponível no momento
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-slate-700">
                        <span className="font-display text-base font-black text-slate-950">
                          {planDone} de {planTotal}
                        </span>{" "}
                        itens concluídos
                      </p>
                    )}
                    {!checklist.isLoading && planDone !== null ? (
                      <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-slate-950 bg-white/80">
                        <div
                          className="h-full bg-emerald-500 transition-[width] motion-reduce:transition-none"
                          style={{ width: `${planPct}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {shown.status === "archived" ? (
                    <span className="rounded-full border-2 border-slate-400 bg-slate-100 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-600">
                      Plano arquivado
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setWantNew(true)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Gerar novo plano
                  </button>
                </div>
              </motion.div>
            ) : null}
          </motion.div>

          <div className="space-y-10">
            {/* Vitrine do estado de entrada: como funciona + mini-trilha de
                exemplo (componentes reais da Fase 2, readonly), ANTES do
                ProGate/intake. */}
            {entryState ? (
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center">
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
                      disabled={openingId !== null}
                      onClick={() => void openArchived(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:opacity-60"
                    >
                      {openingId === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : null}
                      {p.area ?? "plano"} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </button>
                  ))}
                </div>
                {openError ? (
                  <p
                    aria-live="polite"
                    className="mt-2 text-sm font-bold text-red-700"
                  >
                    {openError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
}
