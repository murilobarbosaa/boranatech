import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  History,
  Loader2,
  type LucideIcon,
  MonitorPlay,
  Palette,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CeuEstrelado from "@/components/shared/CeuEstrelado";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliate } from "@/hooks/useAffiliate";
import {
  useCoupon,
  type CouponStatus,
  type StoredCoupon,
} from "@/hooks/useCoupon";
import {
  captureCheckoutAbandoned,
  captureCheckoutStarted,
  planPriceCents,
} from "@/lib/analytics";
import {
  CheckoutError,
  createCheckout,
  type CheckoutPaymentMethod,
} from "@/services/subscriptionService";
import PaymentMethodDialog from "@/components/pro/PaymentMethodDialog";
import { apiUrl } from "@/lib/api";
import {
  discountedPriceCents,
  FROM_MONTHLY_LABEL,
  getPlanPriceCents,
  isPlanId,
  MONTHLY_BASE_LABEL,
  PLAN_ORDER,
  PLAN_PRICING,
  savingsPercentFloor,
  type PlanId,
} from "@shared/planPricing";
import { areasCount, dictionaryTermsCount } from "@/lib/countsGenerated";
import { PRO_TOOL_ICONS } from "@/lib/proToolIcons";
import { PRO_TOOL_DETAILS, type ProToolId } from "@/lib/proToolDetails";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FREE_COURSES_SAMPLE_SIZE,
  FREE_PLATFORMS_SAMPLE_SIZE,
} from "@/lib/freeTierLimits";
import { validateEmailForSending } from "@shared/emailValidation";

// UI-only (destaque/selo) por plano; os precos vem da fonte unica planPricing.
const PLAN_UI: Record<PlanId, { highlight: boolean; badge: string | null }> = {
  pro_monthly: { highlight: false, badge: null },
  pro_semiannual: { highlight: true, badge: "MAIS POPULAR" },
  pro_annual: { highlight: false, badge: "MELHOR CUSTO" },
};

// Meses por ciclo, para recalcular equivalente mensal e desconto total quando o
// cupom muda o valor do ciclo (o monthlyEquivalent/savingsPercent estaticos do
// planPricing assumem preco cheio).
const PLAN_MONTHS: Record<PlanId, number> = {
  pro_monthly: 1,
  pro_semiannual: 6,
  pro_annual: 12,
};

// Base do desconto exibido: preco cheio do mensal em centavos.
const MONTHLY_BASE_CENTS =
  getPlanPriceCents("pro_monthly") ??
  Math.round(PLAN_PRICING.pro_monthly.total * 100);

const plans = PLAN_ORDER.map((id) => {
  const p = PLAN_PRICING[id];
  return {
    id: p.id,
    label: p.label,
    priceCents: getPlanPriceCents(id) ?? Math.round(p.total * 100),
    priceLabel: p.totalLabel,
    period: p.period,
    monthlyEquivalent: p.monthlyEquivalent,
    savingsPercent: p.savingsPercent,
    savings: p.savingsPercent > 0 ? `${p.savingsPercent}% off` : null,
    ...PLAN_UI[id],
  };
});

// Categorias reais do comparador (Comparador.tsx + TecnologiaComparador.tsx),
// agora 100% Pro. Alimentam o destaque do card Pro e a tabela.
const COMPARADOR_CATEGORIES = [
  "Graduações e faculdades",
  "Cursos",
  "Plataformas de estudo",
  "Áreas de TI",
  "Tecnologias",
];

// TODO(Ana): revisar nomes das ferramentas exibidos na comparação.
// label = linha da comparacao; chip = versao curta do hero. Icones da fonte
// unica compartilhada com /bem-vindo (proToolIcons).
const PRO_AI_TOOLS: Array<{
  id: ProToolId;
  label: string;
  chip: string;
  icon: LucideIcon;
}> = [
  {
    id: "roadmapIA" as const,
    label: "Roadmap personalizado por IA",
    chip: "Roadmap por IA",
    icon: PRO_TOOL_ICONS.roadmapIA,
  },
  {
    id: "planoCarreira" as const,
    label: "Plano de carreira inteligente",
    chip: "Plano de carreira",
    icon: PRO_TOOL_ICONS.planoCarreira,
  },
  {
    id: "projetosPortfolio" as const,
    label: "Sugestão de projetos pra portfólio",
    chip: "Projetos pra portfólio",
    icon: PRO_TOOL_ICONS.projetosPortfolio,
  },
  {
    id: "simuladorEntrevistas" as const,
    label: "Simulador de entrevistas",
    chip: "Simulador de entrevista",
    icon: PRO_TOOL_ICONS.simuladorEntrevistas,
  },
  {
    id: "geradorCurriculo" as const,
    label: "Gerador de currículo",
    chip: "Gerador de currículo",
    icon: PRO_TOOL_ICONS.geradorCurriculo,
  },
  {
    id: "avaliadorCurriculo" as const,
    label: "Avaliador de currículo",
    chip: "Avaliador de currículo",
    icon: PRO_TOOL_ICONS.avaliadorCurriculo,
  },
  {
    id: "avaliadorLinkedin" as const,
    label: "Avaliador de LinkedIn",
    chip: "Avaliador de LinkedIn",
    icon: PRO_TOOL_ICONS.avaliadorLinkedin,
  },
  {
    id: "avaliadorGithub" as const,
    label: "Avaliador de GitHub",
    chip: "Avaliador de GitHub",
    icon: PRO_TOOL_ICONS.avaliadorGithub,
  },
];

// Nuvem de chips do hero: comparador + IA pessoal + as 8 ferramentas + vagas
// + personalizacao, todos derivados dos arrays canonicos da pagina.
const HERO_TOOL_CHIPS: Array<{
  id: ProToolId;
  text: string;
  icon: LucideIcon;
}> = [
  { id: "comparador", text: "Comparador", icon: PRO_TOOL_ICONS.comparador },
  { id: "iaPessoal", text: "IA pessoal", icon: PRO_TOOL_ICONS.iaPessoal },
  ...PRO_AI_TOOLS.map((tool) => ({
    id: tool.id,
    text: tool.chip,
    icon: tool.icon,
  })),
  { id: "feedVagas", text: "Feed de vagas", icon: PRO_TOOL_ICONS.feedVagas },
  {
    id: "personalizacao",
    text: "Personalização",
    icon: PRO_TOOL_ICONS.personalizacao,
  },
  {
    id: "suporteWhatsapp",
    text: "Suporte pelo WhatsApp",
    icon: PRO_TOOL_ICONS.suporteWhatsapp,
  },
];

// Nuvem do hero em exatamente 3 linhas no desktop (5/4/4); no mobile cada
// linha quebra por conta propria, mantendo o empilhamento.
const HERO_CHIP_ROWS = [
  HERO_TOOL_CHIPS.slice(0, 5),
  HERO_TOOL_CHIPS.slice(5, 9),
  HERO_TOOL_CHIPS.slice(9),
];

const PRO_PERSONALIZATION: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Camera, text: "Foto de perfil na conta" },
  { icon: Palette, text: "Bordas de perfil personalizadas" },
  { icon: Trophy, text: "Conquistas especiais exclusivas" },
];

// Desbloqueios do Pro em recursos que o gratis ve parcialmente ou nao ve.
// Inventario real dos gates: Vagas (ProGate vagas_feed), Cursos/Plataformas
// (amostra de N no gratis, catalogo inteiro no Pro), historico do agente
// (endpoints Pro-only em agentHistory).
const PRO_UNLOCKS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Briefcase, text: "Feed de vagas júnior, estágio e trainee" },
  {
    icon: BookOpen,
    text: `Catálogo completo de cursos (grátis vê ${FREE_COURSES_SAMPLE_SIZE})`,
  },
  {
    icon: MonitorPlay,
    text: `Todas as plataformas de estudo (grátis vê ${FREE_PLATFORMS_SAMPLE_SIZE})`,
  },
  { icon: History, text: "Histórico de conversas com a IA" },
  { icon: PRO_TOOL_ICONS.suporteWhatsapp, text: "Suporte pelo WhatsApp" },
];

// Total de exclusivos exibido no topo do card Pro. O +2 sao o Comparador e a
// IA pessoal, que tem blocos proprios no card em vez de itens de lista.
const PRO_EXCLUSIVE_COUNT =
  PRO_AI_TOOLS.length + PRO_UNLOCKS.length + PRO_PERSONALIZATION.length + 2;

// Dados Gratis x Pro. free/pro: true = tem completo, false = nao tem,
// string = versao limitada ou rotulo. As linhas Pro-only derivam dos MESMOS
// arrays dos cards (PRO_AI_TOOLS, PRO_PERSONALIZATION) pra nunca desincronizar,
// e os totais derivam das linhas.
// A secao de comparacao foi removida (sera reconstruida); os agrupamentos e
// totais ficam exportados pra futura secao de comparacao.
export type CompareCell = boolean | string;
export type CompareRow = {
  feature: string;
  free: CompareCell;
  pro: CompareCell;
};

export const COMPARE_GROUPS: Array<{
  title: string;
  // Mostra o preview do avatar Pro no sub-header do grupo (personalizacao).
  preview?: boolean;
  rows: CompareRow[];
}> = [
  {
    title: "Base grátis da plataforma",
    rows: [
      { feature: "Quiz de carreira", free: true, pro: true },
      {
        feature: `Catálogos: ${areasCount} áreas, +60 tecnologias, +20 empresas, +20 faculdades, +42 eventos e dicionário com +${dictionaryTermsCount} termos`,
        free: true,
        pro: true,
      },
      { feature: "Roadmaps de estudo por área", free: true, pro: true },
      { feature: "+48 projetos pra praticar", free: true, pro: true },
    ],
  },
  {
    title: "Plataforma e conteúdo",
    rows: [
      {
        feature: "Cursos",
        free: `amostra de ${FREE_COURSES_SAMPLE_SIZE}`,
        pro: "catálogo completo",
      },
      {
        feature: "Plataformas de estudo",
        free: `amostra de ${FREE_PLATFORMS_SAMPLE_SIZE}`,
        pro: "todas",
      },
      {
        feature: "Agente de IA",
        free: "tira-dúvidas",
        pro: "IA pessoal completa",
      },
      {
        feature: `Comparador: ${COMPARADOR_CATEGORIES.join(", ").toLowerCase()}`,
        free: false,
        pro: true,
      },
      {
        feature: "Feed de vagas júnior, estágio e trainee",
        free: false,
        pro: true,
      },
      { feature: "Histórico de conversas com a IA", free: false, pro: true },
      { feature: "Suporte pelo WhatsApp", free: false, pro: true },
    ],
  },
  {
    title: "Ferramentas com IA",
    rows: PRO_AI_TOOLS.map((tool) => ({
      feature: tool.label,
      free: false as const,
      pro: true as const,
    })),
  },
  {
    title: "Personalização e status",
    preview: true,
    rows: [
      ...PRO_PERSONALIZATION.map((item) => ({
        feature: item.text,
        free: false as const,
        pro: true as const,
      })),
      { feature: "Comunidade exclusiva Pro", free: false, pro: "em breve" },
    ],
  },
];

export const COMPARE_ROWS: CompareRow[] = COMPARE_GROUPS.flatMap((g) => g.rows);

// usado pela futura secao de comparacao
export const COMPARE_FREE_TOTAL = COMPARE_ROWS.filter(
  (r) => r.free !== false,
).length;
export const COMPARE_PRO_TOTAL = COMPARE_ROWS.length;

const FREE_HREF = "/";

// Ancora de valor: preco por dia do plano anual, arredondado PRA CIMA no decimo
// de real, pra frase "menos de X por dia" ser sempre verdadeira com o preco vigente.
const ANNUAL_PER_DAY =
  Math.floor((PLAN_PRICING.pro_annual.total / 365) * 10) / 10 + 0.1;

// Prova social: mesma fonte e mesmo cache da home (GET /api/stats/users-count,
// contagem real de profiles, com localStorage compartilhado). null = sem numero
// confiavel (primeira visita sem cache E backend degradado); a faixa some em
// vez de exibir numero inventado.
const USERS_COUNT_LS_KEY = "bnt_users_count";

function readCachedUsersCount(): number | null {
  try {
    const raw = window.localStorage.getItem(USERS_COUNT_LS_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function scrollToPlans() {
  const target = document.getElementById("planos-section");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// CTA de lista de espera exibido quando o pagamento esta desligado (kill-switch).
// Espelha a ESTRUTURA da NewsletterCapture (idle/submitting/success/error,
// fail-closed, tratamento de erro por status), mas posta em POST /api/waitlist
// com source "planos_pro" (consentimento e segmentacao proprios do pagamento,
// distintos da newsletter). Reaproveita o endpoint, dedupe e e-mail de
// confirmacao ja existentes; nao cria fluxo novo.
function WaitlistCta({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (submitStatus === "success") {
    return (
      <p
        className="max-w-md text-center text-sm font-bold text-emerald-400"
        role="status"
        aria-live="polite"
      >
        {/* TODO(Ana): copy de sucesso da lista de espera (pedir confirmacao no inbox, double opt-in). */}
        Pronto! A gente te avisa por e-mail assim que a assinatura abrir. Dá uma
        olhada na sua caixa de entrada pra confirmar.
      </p>
    );
  }

  const submitting = submitStatus === "submitting";

  async function handleWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    // Mesma fonte de verdade do server (sintaxe + dominio reservado). UX apenas:
    // o servidor revalida em POST /api/waitlist.
    if (!validateEmailForSending(trimmed).ok) {
      // TODO(Ana): copy de e-mail invalido (validacao client).
      setErrorMessage("Informe um e-mail válido.");
      setSubmitStatus("error");
      return;
    }

    setSubmitStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch(apiUrl("/api/waitlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "planos_pro" }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { code?: string };
      } | null;

      if (res.ok && data?.ok) {
        setSubmitStatus("success");
        return;
      }

      const code = data?.error?.code;
      // TODO(Ana): copy de cada caso de erro abaixo.
      if (res.status === 400 && code === "invalid_email") {
        setErrorMessage("E-mail inválido.");
      } else if (res.status === 429 && code === "too_many_attempts") {
        setErrorMessage("Muitas tentativas. Tente novamente em instantes.");
      } else {
        setErrorMessage("Não foi possível concluir. Tente novamente.");
      }
      setSubmitStatus("error");
    } catch {
      // TODO(Ana): copy de erro de rede.
      setErrorMessage("Não foi possível concluir. Tente novamente.");
      setSubmitStatus("error");
    }
  }

  return (
    <form onSubmit={handleWaitlist} noValidate className="w-full max-w-md">
      <p className="mb-3 text-center text-sm font-bold text-slate-300">
        {/* TODO(Ana): copy do aviso de indisponibilidade temporaria do checkout. */}
        A assinatura abre em breve. Deixe seu e-mail que a gente te avisa.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
          aria-label="Email para a lista de espera"
          aria-describedby="waitlist-status"
          aria-invalid={submitStatus === "error"}
          className="min-w-0 flex-1 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder:text-slate-400 transition-colors focus:border-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="pro-glare bnt-pressable inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-900 bg-[#FFB800] px-6 py-3 font-display font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_#0f172a]"
        >
          <Sparkles className="h-5 w-5" />
          {/* TODO(Ana): rotulos do CTA da lista de espera (normal e carregando). */}
          {submitting ? "Enviando..." : "Me avisa quando abrir"}
        </button>
      </div>
      <p
        id="waitlist-status"
        className="mt-2 min-h-[1rem] text-center text-xs font-bold text-rose-400"
        aria-live="polite"
      >
        {submitStatus === "error" ? errorMessage : ""}
      </p>
    </form>
  );
}

// Labels dos planos cobertos por um cupom restrito ("Semestral e Anual"),
// ignorando ids desconhecidos. Vazio = nenhum plano da lista existe mais.
function coveredPlanLabels(applicablePlans: string[]): string {
  const labels = applicablePlans
    .filter(isPlanId)
    .map((id) => PLAN_PRICING[id].label);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

// Campo de cupom fechado por padrao (um disclosure discreto), pra nao mandar
// a pessoa embora do checkout cacando cupom. A mensagem de invalido e generica
// de proposito, igual ao 404 do server (anti-oraculo).
function CouponField({
  coupon,
  status,
  onApply,
  onRemove,
}: {
  coupon: StoredCoupon | null;
  status: CouponStatus;
  onApply: (code: string) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [shaking, setShaking] = useState(false);
  const validating = status === "validating";

  if (coupon) {
    return (
      <div
        role="status"
        className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-emerald-700 bg-emerald-50 py-1.5 pl-4 pr-1.5 text-sm font-bold text-emerald-800"
      >
        <Check
          size={16}
          strokeWidth={3}
          aria-hidden="true"
          className="shrink-0"
        />
        <span className="truncate">
          Cupom <span className="font-mono font-black">{coupon.code}</span>{" "}
          aplicado
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover cupom ${coupon.code}`}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-200 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <X size={14} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-bold text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-slate-200 hover:decoration-slate-400"
      >
        Tem um cupom de desconto?
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (validating || !code.trim()) return;
        void onApply(code).then((ok) => {
          if (!ok) setShaking(true);
        });
      }}
      className="flex w-full max-w-sm flex-col items-center gap-1.5"
    >
      <div className="flex w-full gap-2">
        <label htmlFor="coupon-code" className="sr-only">
          Código do cupom
        </label>
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onAnimationEnd={() => setShaking(false)}
          placeholder="SEUCUPOM"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          disabled={validating}
          aria-invalid={status === "invalid"}
          className={`h-10 min-w-0 flex-1 rounded-xl border-2 bg-white px-3 text-sm font-black uppercase tracking-wider text-slate-950 transition-colors duration-200 placeholder:font-bold placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-60 ${
            status === "invalid" ? "border-rose-500" : "border-slate-900"
          } ${shaking ? "animate-coupon-shake" : ""}`}
        />
        <button
          type="submit"
          disabled={validating || !code.trim()}
          className="bnt-pressable inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-[#FFB800] px-4 font-display text-sm font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {validating ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : null}
          {validating ? "Validando..." : "Aplicar"}
        </button>
      </div>
      <p
        aria-live="polite"
        className="min-h-[1rem] text-center text-xs font-bold text-rose-400"
      >
        {status === "invalid" ? "Cupom inválido ou expirado." : ""}
      </p>
    </form>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { session, user, profile } = useAuth();
  const { affiliateCode, discountPercent } = useAffiliate();
  const {
    coupon,
    status: couponStatus,
    applyCoupon,
    removeCoupon,
  } = useCoupon();
  const [selectedPlan, setSelectedPlan] = useState("pro_semiannual");
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const reduce = useReducedMotion();

  // Kill-switch do pagamento, lido do endpoint publico de flags. Fail-closed
  // igual ao LaunchGate: erro no fetch ou billingEnabled ausente => "off"
  // (mostra a lista de espera, nunca um checkout que falha).
  const [billingStatus, setBillingStatus] = useState<"loading" | "on" | "off">(
    "loading",
  );
  const [usersCount, setUsersCount] = useState<number | null>(() =>
    readCachedUsersCount(),
  );
  // CTA "Quero o Pro" dentro do modal de feature: fecha o dialog e ancora nos
  // precos; nesse caso NAO devolvemos o foco ao chip (senao o browser rola de
  // volta pro hero brigando com o scroll). ESC/backdrop seguem devolvendo.
  const skipChipFocusRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/stats/users-count"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.count !== "number") return;
        if (data.count <= 0) return;
        setUsersCount(data.count);
        try {
          window.localStorage.setItem(USERS_COUNT_LS_KEY, String(data.count));
        } catch {
          // localStorage indisponivel: segue sem cache, proximo load refaz o fetch.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function resolveBilling() {
      try {
        const res = await fetch(apiUrl("/api/launch-state"));
        if (!res.ok) throw new Error("launch-state indisponivel");
        const data = (await res.json()) as { billingEnabled?: boolean };
        if (cancelled) return;
        setBillingStatus(data.billingEnabled === true ? "on" : "off");
      } catch {
        if (!cancelled) setBillingStatus("off");
      }
    }
    void resolveBilling();
    return () => {
      cancelled = true;
    };
  }, []);

  // checkout_abandoned: se havia um checkout pendente (marcado antes do redirect
  // para a Stripe) e a pessoa voltou para ca (cancel_url), registra o abandono.
  useEffect(() => {
    const pending = sessionStorage.getItem("bnt_checkout_pending");
    if (pending) {
      sessionStorage.removeItem("bnt_checkout_pending");
      captureCheckoutAbandoned({ plan_code: pending });
    }
  }, []);

  // Desconto vigente por plano, espelhando a precedencia do server: cupom de
  // marketing que cobre o plano ganha; senao vale o desconto de afiliado (0 sem
  // afiliado). Com cupom restrito (applicable_plans) + afiliado, os planos fora
  // da lista caem no desconto do afiliado, igual ao backend, pro preco exibido
  // ser sempre o preco cobrado.
  function planDiscountPercent(planId: string): number {
    if (
      coupon &&
      (!coupon.applicable_plans || coupon.applicable_plans.includes(planId))
    ) {
      return coupon.discount_percent;
    }
    return discountPercent;
  }

  // Preco final por plano em CENTAVOS (shared/planPricing.ts faz a conta em
  // inteiros): card, badge, equivalente mensal e CTA derivam DESTE valor.
  function planFinalPriceCents(planId: string, priceCents: number): number {
    return discountedPriceCents(priceCents, planDiscountPercent(planId));
  }

  // CTA "Assinar": deslogado -> cadastro (comportamento inalterado); mensal ->
  // cartao direto (boleto nao e permitido ali); anual/semestral -> dialog de metodo.
  function handleSubscribe() {
    if (!session) {
      const params = new URLSearchParams();
      if (affiliateCode) {
        params.set("ref", affiliateCode);
        params.set("cupom", affiliateCode);
        params.set("desconto", String(discountPercent));
      }
      if (coupon) params.set("promo", coupon.code);
      const query = params.toString();
      setLocation(`/cadastro${query ? `?${query}` : ""}`);
      return;
    }

    if (selectedPlan === "pro_monthly") {
      void doCheckout("card");
      return;
    }
    setPaymentDialogOpen(true);
  }

  // Dispara o checkout com o metodo escolhido. captureCheckoutStarted vive AQUI (na
  // confirmacao), nao ao abrir o dialog: quem abre e fecha nao iniciou checkout.
  async function doCheckout(paymentMethod: CheckoutPaymentMethod) {
    setPaymentDialogOpen(false);
    setLoading(true);
    try {
      captureCheckoutStarted({
        plan_code: selectedPlan,
        price_cents: planPriceCents(selectedPlan),
        source_path: window.location.pathname,
        cta_id: "checkout_page_subscribe",
      });
      // Marca o checkout como pendente para detectar abandono no cancel_url (/planos).
      sessionStorage.setItem("bnt_checkout_pending", selectedPlan);
      const { checkoutUrl } = await createCheckout(selectedPlan, paymentMethod);
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (error) {
      console.error("[Checkout] createCheckout failed", error);
      const code = error instanceof CheckoutError ? error.code : "";
      if (code === "conflict") {
        toast.error("Você já tem uma assinatura ativa.");
      } else if (code === "boleto_pending") {
        toast.error(
          "Você tem um boleto aguardando pagamento. Confira seu e-mail.",
        );
      } else {
        toast.error("Não foi possível iniciar o checkout. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Banner de afiliado some quando ha cupom de marketing (o desconto vigente e
  // o do cupom); a atribuicao do afiliado segue viva no localStorage/checkout.
  const hasAffiliateBanner = discountPercent > 0 && !!affiliateCode && !coupon;
  const currentPlan = plans.find((p) => p.id === selectedPlan) ?? plans[0];

  // Radiogroup de planos (padrao WAI-ARIA): setas movem o foco E selecionam;
  // so o card selecionado fica no tab order (roving tabindex).
  const planRefs = useRef<Array<HTMLButtonElement | null>>([]);
  function handlePlanKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (idx + 1) % plans.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (idx - 1 + plans.length) % plans.length;
    } else {
      return;
    }
    event.preventDefault();
    setSelectedPlan(plans[next].id);
    planRefs.current[next]?.focus();
  }

  const fade = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay },
  });

  return (
    <Layout>
      {/* TODO(Ana): revisar title e meta description da pagina de planos */}
      <SEO
        title="Planos · Comparador e ferramentas com IA pra entrar em TI"
        description={`Comparador completo, sua IA pessoal e 8 ferramentas com IA pra entrar em TI: roadmap, currículo, entrevistas, LinkedIn e GitHub. A partir de ${FROM_MONTHLY_LABEL}/mês no plano anual.`}
        keywords={[
          "plano pro bora na tech",
          "ia carreira ti",
          "analisador currículo ia",
          "analisador linkedin",
        ]}
        url="/planos"
        schemaType="Product"
        schemaData={{
          "@type": "Product",
          name: "Bora na Tech? Pro",
          brand: { "@type": "Brand", name: "Bora na Tech?" },
          category: "Educação · Carreira em TI",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "BRL",
            lowPrice: PLAN_PRICING.pro_monthly.total.toFixed(2),
            highPrice: PLAN_PRICING.pro_annual.total.toFixed(2),
            offerCount: 3,
            offers: [
              {
                "@type": "Offer",
                name: "Mensal",
                price: PLAN_PRICING.pro_monthly.total.toFixed(2),
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Semestral",
                price: PLAN_PRICING.pro_semiannual.total.toFixed(2),
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Anual",
                price: PLAN_PRICING.pro_annual.total.toFixed(2),
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
            ],
          },
        }}
      />

      {hasAffiliateBanner ? (
        <div className="border-b-2 border-slate-950 bg-[#FFB800]">
          <div className="container py-3 text-center">
            <p className="font-display text-sm font-black uppercase tracking-wider text-slate-950">
              {/* TODO(Ana): confirmar copy final */}
              Código {affiliateCode} aplicado, {discountPercent}% de desconto na
              primeira cobrança, em qualquer plano.
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-950/70">
              {/* TODO(Ana): confirmar copy final */}
              Vale só na primeira compra. Renovações no valor cheio.
            </p>
          </div>
        </div>
      ) : null}

      <section
        aria-labelledby="pro-hero-title"
        className="relative flex min-h-[55vh] items-center overflow-hidden bg-slate-950 py-14 md:min-h-[78vh] md:py-16"
      >
        <CeuEstrelado />
        <div className="container relative z-10 w-full">
          <div className="mx-auto max-w-4xl text-center">
            <motion.p
              {...fade()}
              className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-400"
            >
              Plano Pro
            </motion.p>
            <motion.h1
              id="pro-hero-title"
              {...fade(0.05)}
              className="mt-5 font-display font-black leading-[1.05] text-white"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              Tudo pra entrar em{" "}
              <span className="relative inline-block">
                <span className="relative">TI</span>
                <span
                  className="absolute -bottom-1.5 left-0 right-0 -z-10 h-3 rounded-md bg-amber-400"
                  aria-hidden="true"
                />
              </span>
              .
            </motion.h1>
            <motion.p
              {...fade(0.1)}
              className="mx-auto mt-6 max-w-2xl text-lg md:text-xl font-bold leading-relaxed text-slate-200"
            >
              {/* TODO(Ana): revisar copy do subtítulo do hero */}
              Tudo isso desbloqueado no Pro:
            </motion.p>

            <motion.div
              {...fade(0.15)}
              className="mx-auto mt-9 flex max-w-4xl flex-col items-center gap-2.5"
            >
              {HERO_CHIP_ROWS.map((row, rowIdx) => (
                <ul
                  key={rowIdx}
                  className="flex flex-wrap justify-center gap-2.5"
                >
                  {row.map((chip) => {
                    const Icon = chip.icon;
                    const details = PRO_TOOL_DETAILS[chip.id];
                    return (
                      <li key={chip.text}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-400/40 px-4 py-1.5 text-sm font-bold text-white transition-all duration-150 hover:border-amber-300/90 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 motion-safe:hover:scale-[1.04]"
                            >
                              <Icon
                                size={15}
                                strokeWidth={2}
                                className="text-amber-400 transition-colors group-hover:text-amber-300"
                                aria-hidden="true"
                              />
                              {chip.text}
                            </button>
                          </DialogTrigger>
                          <DialogContent
                            onCloseAutoFocus={(event) => {
                              if (skipChipFocusRef.current) {
                                event.preventDefault();
                                skipChipFocusRef.current = false;
                              }
                            }}
                            className="max-w-md overflow-hidden rounded-3xl border border-amber-400/50 bg-slate-950 p-8 text-center text-slate-100 shadow-[0_0_60px_rgba(251,191,36,0.18)]"
                          >
                            <div className="relative flex flex-col items-center">
                              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/50">
                                <Icon
                                  size={30}
                                  strokeWidth={2}
                                  className="text-amber-400"
                                  aria-hidden="true"
                                />
                              </span>
                              <DialogTitle className="mt-4 font-display text-2xl font-black text-white">
                                {details.title}
                              </DialogTitle>
                              <DialogDescription className="mt-3 text-sm font-medium leading-relaxed text-slate-300">
                                {details.description}
                              </DialogDescription>
                              {details.bullets ? (
                                <ul className="mt-4 space-y-1.5 text-left">
                                  {details.bullets.map((bullet) => (
                                    <li
                                      key={bullet}
                                      className="flex items-start gap-2 text-sm font-medium text-slate-200"
                                    >
                                      <ProStarIcon className="mt-0.5" />
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <DialogClose asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    skipChipFocusRef.current = true;
                                    scrollToPlans();
                                  }}
                                  className="pro-glare bnt-pressable mt-7 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-8 py-3.5 font-display text-base font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a]"
                                >
                                  <ProStarIcon />
                                  Quero o Pro
                                  <ArrowRight size={16} aria-hidden="true" />
                                </button>
                              </DialogClose>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </motion.div>

            <motion.div
              {...fade(0.25)}
              className="mt-9 flex flex-col items-center gap-3"
            >
              <button
                type="button"
                onClick={scrollToPlans}
                aria-label="Ir para escolha de plano"
                className="pro-glare bnt-pressable group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-display text-base md:text-lg font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a]"
              >
                <ProStarIcon />
                <span>Quero o Pro</span>
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
              <p className="text-xs font-medium text-slate-400">
                A partir de {FROM_MONTHLY_LABEL}/mês no plano anual.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="planos-section"
        aria-labelledby="planos-title"
        className="relative overflow-hidden bg-slate-950 py-14 md:py-20"
      >
        <CeuEstrelado />
        {/* Continuacao sutil do glow do hero (mesma cor, opacidade menor)
            pra emenda entre as duas secoes nao marcar uma linha reta. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,184,0,0.03), transparent 70%)",
          }}
        />
        <div className="container relative z-10">
          {usersCount !== null ? (
            <motion.p
              {...fade()}
              className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-amber-400/40 px-4 py-2 text-sm font-bold text-white"
            >
              <Users size={16} className="text-amber-400" aria-hidden="true" />
              {/* TODO(Ana): revisar copy da prova social (mesmo padrão do badge
                  da home, que evita terminar a frase com a marca "Bora na Tech?") */}
              +{usersCount.toLocaleString("pt-BR")} pessoas já encontraram seu
              caminho
            </motion.p>
          ) : null}
          <motion.div {...fade()} className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-3 py-1 font-display text-xs font-black uppercase tracking-[0.2em] text-amber-300">
              Escolha seu plano
            </p>
            <h2
              id="planos-title"
              className="mt-4 font-display font-black leading-[1.05] text-white"
              style={{ fontSize: "clamp(28px, 4.5vw, 48px)" }}
            >
              3 opções.{" "}
              <span className="text-amber-400">Mesmas ferramentas.</span>
            </h2>
            <p className="mx-auto mt-5 inline-flex max-w-xl flex-wrap items-center justify-center gap-1 rounded-2xl border border-amber-400/40 bg-white/5 px-4 py-2 text-sm md:text-base font-bold text-slate-200">
              {/* TODO(Ana): revisar copy da âncora de valor */}
              {PRO_EXCLUSIVE_COUNT} recursos exclusivos, incluindo sua IA
              pessoal, por menos de{" "}
              <span className="text-amber-300">
                {formatPrice(ANNUAL_PER_DAY)} por dia
              </span>{" "}
              no plano anual.
            </p>
          </motion.div>

          {coupon ? (
            <div className="mx-auto mt-8 w-fit max-w-xl rounded-2xl border-2 border-emerald-700 bg-emerald-50 px-4 py-2 text-center">
              <p className="inline text-sm font-bold text-emerald-800">
                <Check
                  size={16}
                  strokeWidth={3}
                  aria-hidden="true"
                  className="mr-1.5 inline-block align-[-3px]"
                />
                Cupom{" "}
                <span className="font-mono font-black">{coupon.code}</span>:{" "}
                {coupon.discount_percent}% off na primeira cobrança
                {coupon.applicable_plans
                  ? ` nos planos ${coveredPlanLabels(coupon.applicable_plans)}`
                  : ""}
                , já aplicado nos preços.{" "}
                <span className="whitespace-nowrap text-xs font-semibold text-emerald-700">
                  Renovações no valor cheio.
                </span>
              </p>
            </div>
          ) : hasAffiliateBanner ? (
            <div className="mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-2 rounded-full border-2 border-emerald-700 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              <span className="flex flex-col items-center text-center sm:flex-row sm:gap-1.5">
                <span>
                  {/* TODO(Ana): confirmar copy final */}
                  Desconto de {discountPercent}% na primeira cobrança, em
                  qualquer plano, já aplicado nos preços abaixo · Código{" "}
                  {affiliateCode}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {/* TODO(Ana): confirmar copy final */}
                  Vale só na primeira compra. Renovações no valor cheio.
                </span>
              </span>
            </div>
          ) : null}

          <div
            role="radiogroup"
            aria-label="Escolha do plano de assinatura"
            className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3"
          >
            {plans.map((plan, idx) => {
              const selected = selectedPlan === plan.id;
              const planPercent = planDiscountPercent(plan.id);
              const finalPriceCents = planFinalPriceCents(
                plan.id,
                plan.priceCents,
              );
              const couponCoversPlan =
                !!coupon &&
                (!coupon.applicable_plans ||
                  coupon.applicable_plans.includes(plan.id));
              // Desconto TOTAL real vs mensal cheio (floor sobre inteiros:
              // nunca promete mais que o real) e equivalente mensal com o cupom
              // (ceil no centavo: nunca exibe mais barato que o real). Tudo em
              // centavos, derivado do MESMO finalPriceCents exibido no card.
              const cycleFullCents = PLAN_MONTHS[plan.id] * MONTHLY_BASE_CENTS;
              const couponSavingsPercent = couponCoversPlan
                ? savingsPercentFloor(cycleFullCents, finalPriceCents)
                : 0;
              const couponMonthlyEquivalentCents = couponCoversPlan
                ? Math.ceil(finalPriceCents / PLAN_MONTHS[plan.id])
                : null;
              return (
                <motion.button
                  key={plan.id}
                  {...fade(0.05 * idx)}
                  ref={(el: HTMLButtonElement | null) => {
                    planRefs.current[idx] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setSelectedPlan(plan.id)}
                  onKeyDown={(event) => handlePlanKeyDown(event, idx)}
                  className={`relative flex min-h-[320px] flex-col rounded-3xl p-6 text-left transition-all duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 ${
                    plan.highlight
                      ? "border-[3px] border-violet-700 shadow-[6px_6px_0_#7c3aed] hover:shadow-[8px_8px_0_#7c3aed]"
                      : "border-2 border-slate-900 shadow-[6px_6px_0_#FCC700] hover:shadow-[8px_8px_0_#FCC700]"
                  } ${
                    selected ? "bg-[#FFB800]" : "bg-white hover:bg-amber-50"
                  }`}
                >
                  {plan.badge ? (
                    <span
                      className={`mb-4 w-fit rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black ${
                        plan.highlight
                          ? "bg-violet-700 text-white"
                          : "bg-slate-950 text-[#FFB800]"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  ) : null}
                  {/* Circulo de selecao em coordenada FIXA (absolute) pra ficar
                      na mesma altura nos 3 cards, com ou sem badge. */}
                  <span
                    aria-hidden="true"
                    className={`absolute right-6 top-6 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      selected
                        ? "border-slate-900 bg-slate-950"
                        : "border-slate-900 bg-white"
                    }`}
                  >
                    {selected ? (
                      <Check
                        className="h-4 w-4 text-[#FFB800]"
                        strokeWidth={3}
                      />
                    ) : null}
                  </span>
                  <div className="pr-10">
                    <h3 className="font-display text-3xl font-black text-slate-950">
                      {plan.label}
                    </h3>
                    {couponCoversPlan ? (
                      <p className="mt-1.5 inline-flex w-fit items-center whitespace-nowrap rounded-full border border-emerald-800 bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-800">
                        {couponSavingsPercent}% off com cupom
                      </p>
                    ) : plan.savings ? (
                      <p className="mt-1 text-sm font-black text-violet-800">
                        {plan.savings}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-6">
                    {/* Sempre renderizado (invisivel sem desconto) pra reservar
                        a altura e o preco nao pular ao aplicar/remover cupom. */}
                    <p
                      aria-hidden={planPercent > 0 ? undefined : true}
                      className={`text-sm font-black text-slate-500 line-through transition-opacity duration-200 ${
                        planPercent > 0 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {plan.priceLabel}
                    </p>
                    <motion.p
                      key={finalPriceCents}
                      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="font-display text-4xl font-black text-slate-950"
                    >
                      {formatPrice(finalPriceCents / 100)}
                    </motion.p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {plan.period}
                    </p>
                    {coupon && coupon.applicable_plans ? (
                      <p
                        className={`mt-1 text-xs font-black ${
                          couponCoversPlan
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {couponCoversPlan
                          ? `Cupom ${coupon.code} aplicado`
                          : `Cupom ${coupon.code} não vale neste plano`}
                      </p>
                    ) : null}
                  </div>
                  {/* my-auto centraliza o box no vao entre a periodicidade e o
                      rodape; py-2 garante respiro minimo quando o card aperta. */}
                  {plan.monthlyEquivalent ? (
                    <div className="my-auto pt-2">
                      <motion.p
                        key={
                          couponMonthlyEquivalentCents ?? plan.monthlyEquivalent
                        }
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-950"
                      >
                        Equivale a{" "}
                        {plan.savingsPercent > 0 ? (
                          <span className="font-bold text-slate-400 line-through">
                            {MONTHLY_BASE_LABEL}
                          </span>
                        ) : null}
                        {couponMonthlyEquivalentCents !== null
                          ? `${formatPrice(couponMonthlyEquivalentCents / 100)}/mês`
                          : plan.monthlyEquivalent}
                      </motion.p>
                    </div>
                  ) : null}
                  <p className="mt-auto pt-2 text-sm font-bold text-slate-700">
                    Todos os benefícios Pro incluídos.
                  </p>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            {billingStatus === "on" ? (
              <>
                <CouponField
                  coupon={coupon}
                  status={couponStatus}
                  onApply={applyCoupon}
                  onRemove={removeCoupon}
                />
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="pro-glare bnt-pressable inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-900 bg-[#FFB800] px-8 py-4 font-display font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_#0f172a]"
                >
                  <Sparkles className="h-5 w-5" />
                  {loading
                    ? "Abrindo checkout..."
                    : `Assinar ${currentPlan.label} · ${formatPrice(planFinalPriceCents(currentPlan.id, currentPlan.priceCents) / 100)}`}
                </button>
              </>
            ) : (
              <WaitlistCta defaultEmail={profile?.email ?? user?.email ?? ""} />
            )}
            <Link
              href={FREE_HREF}
              className="text-sm font-bold text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-slate-200 hover:decoration-slate-400"
            >
              Continuar com o básico (grátis)
            </Link>
          </div>
        </div>
      </section>

      <PaymentMethodDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSelect={(method) => void doCheckout(method)}
      />
    </Layout>
  );
}
