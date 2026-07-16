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
  CalendarX,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  History,
  type LucideIcon,
  Mail,
  MonitorPlay,
  Palette,
  Scale,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CeuEstrelado from "@/components/shared/CeuEstrelado";
import UserAvatar from "@/components/UserAvatar";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliate } from "@/hooks/useAffiliate";
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
  FROM_MONTHLY_LABEL,
  MONTHLY_BASE_LABEL,
  PLAN_ORDER,
  PLAN_PRICING,
  type PlanId,
} from "@shared/planPricing";
import { areasCount, dictionaryTermsCount } from "@/lib/countsGenerated";
import { PRO_TOOL_ICONS } from "@/lib/proToolIcons";
import {
  FREE_COURSES_SAMPLE_SIZE,
  FREE_PLATFORMS_SAMPLE_SIZE,
} from "@/lib/freeTierLimits";

// UI-only (destaque/selo) por plano; os precos vem da fonte unica planPricing.
const PLAN_UI: Record<PlanId, { highlight: boolean; badge: string | null }> = {
  pro_monthly: { highlight: false, badge: null },
  pro_semiannual: { highlight: true, badge: "MAIS POPULAR" },
  pro_annual: { highlight: false, badge: "MELHOR CUSTO" },
};

const plans = PLAN_ORDER.map((id) => {
  const p = PLAN_PRICING[id];
  return {
    id: p.id,
    label: p.label,
    price: p.total,
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
const PRO_AI_TOOLS: Array<{ label: string; chip: string; icon: LucideIcon }> = [
  {
    label: "Roadmap personalizado por IA",
    chip: "Roadmap por IA",
    icon: PRO_TOOL_ICONS.roadmapIA,
  },
  {
    label: "Plano de carreira inteligente",
    chip: "Plano de carreira",
    icon: PRO_TOOL_ICONS.planoCarreira,
  },
  {
    label: "Sugestão de projetos pra portfólio",
    chip: "Projetos pra portfólio",
    icon: PRO_TOOL_ICONS.projetosPortfolio,
  },
  {
    label: "Simulador de entrevistas",
    chip: "Simulador de entrevistas",
    icon: PRO_TOOL_ICONS.simuladorEntrevistas,
  },
  {
    label: "Gerador de currículo",
    chip: "Gerador de currículo",
    icon: PRO_TOOL_ICONS.geradorCurriculo,
  },
  {
    label: "Avaliador de currículo",
    chip: "Avaliador de currículo",
    icon: PRO_TOOL_ICONS.avaliadorCurriculo,
  },
  {
    label: "Avaliador de LinkedIn",
    chip: "Avaliador de LinkedIn",
    icon: PRO_TOOL_ICONS.avaliadorLinkedin,
  },
  {
    label: "Avaliador de GitHub",
    chip: "Avaliador de GitHub",
    icon: PRO_TOOL_ICONS.avaliadorGithub,
  },
];

// Nuvem de chips do hero: comparador + IA pessoal + as 8 ferramentas + vagas
// + personalizacao, todos derivados dos arrays canonicos da pagina.
const HERO_TOOL_CHIPS: Array<{ text: string; icon: LucideIcon }> = [
  { text: "Comparador", icon: PRO_TOOL_ICONS.comparador },
  { text: "IA pessoal", icon: PRO_TOOL_ICONS.iaPessoal },
  ...PRO_AI_TOOLS.map((tool) => ({ text: tool.chip, icon: tool.icon })),
  { text: "Feed de vagas", icon: PRO_TOOL_ICONS.feedVagas },
  { text: "Personalização de perfil", icon: PRO_TOOL_ICONS.personalizacao },
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
];

// Estrelas twinkle da secao de precos (fundo claro): reusa o CeuEstrelado do
// hero (animate-twinkle: so opacity/transform, estatico em reduced-motion),
// sem pattern e com glow discreto pra funcionar sobre o cream.
const PRICING_STARS = [
  { top: "8%", left: "6%", size: 7, delay: 0.2, duration: 3 },
  { top: "14%", left: "90%", size: 6, delay: 1.4, duration: 2.6 },
  { top: "38%", left: "3%", size: 5, delay: 2.2, duration: 3.4 },
  { top: "42%", left: "96%", size: 7, delay: 0.8, duration: 2.8 },
  { top: "70%", left: "8%", size: 6, delay: 1.8, duration: 3.2 },
  { top: "78%", left: "92%", size: 5, delay: 0.5, duration: 2.7 },
  { top: "90%", left: "30%", size: 6, delay: 2.6, duration: 3 },
  { top: "88%", left: "68%", size: 7, delay: 1.1, duration: 3.5 },
];

// Total de exclusivos exibido no topo do card Pro. O +2 sao o Comparador e a
// IA pessoal, que tem blocos proprios no card em vez de itens de lista.
const PRO_EXCLUSIVE_COUNT =
  PRO_AI_TOOLS.length + PRO_UNLOCKS.length + PRO_PERSONALIZATION.length + 2;

// Tabela Gratis x Pro. free/pro: true = tem completo, false = nao tem,
// string = versao limitada ou rotulo. As linhas Pro-only derivam dos MESMOS
// arrays dos cards (PRO_AI_TOOLS, PRO_PERSONALIZATION) pra nunca desincronizar,
// e os totais derivam das linhas.
type CompareCell = boolean | string;
type CompareRow = { feature: string; free: CompareCell; pro: CompareCell };

const COMPARE_GROUPS: Array<{
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

const COMPARE_ROWS: CompareRow[] = COMPARE_GROUPS.flatMap((g) => g.rows);

const COMPARE_FREE_TOTAL = COMPARE_ROWS.filter((r) => r.free !== false).length;
const COMPARE_PRO_TOTAL = COMPARE_ROWS.length;

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

// Celula da checklist espelhada: cada lado "acende" quando tem o recurso.
// true = check na cor do lado, false = X apagado, string = rotulo de limite
// (chip no gratis, texto aceso no Pro).
function CompareCellContent({
  value,
  side,
}: {
  value: CompareCell;
  side: "free" | "pro";
}) {
  if (value === true) {
    return (
      <>
        <Check
          size={18}
          strokeWidth={3.5}
          className={`inline ${side === "pro" ? "text-violet-800" : "text-emerald-700"}`}
          aria-hidden="true"
        />
        <span className="sr-only">Incluído</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <X
          size={16}
          strokeWidth={3}
          className="inline text-slate-300"
          aria-hidden="true"
        />
        <span className="sr-only">Não incluído</span>
      </>
    );
  }
  if (side === "pro") {
    return (
      <span className="text-[11px] font-black leading-tight text-violet-900">
        {value}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full border-[1.5px] border-slate-900 bg-white px-1.5 py-0.5 text-[10px] font-black leading-tight text-slate-700 shadow-[1px_1px_0_#0f172a]">
      {value}
    </span>
  );
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

// Mesma validacao leve das outras capturas de e-mail (waitlist/newsletter): a
// confirmacao real fica no double opt-in do e-mail de confirmacao.
const WAITLIST_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        className="max-w-md text-center text-sm font-bold text-emerald-700"
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
    if (!trimmed || !WAITLIST_EMAIL_RE.test(trimmed)) {
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
      <p className="mb-3 text-center text-sm font-bold text-slate-700">
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
        className="mt-2 min-h-[1rem] text-center text-xs font-bold text-rose-600"
        aria-live="polite"
      >
        {submitStatus === "error" ? errorMessage : ""}
      </p>
    </form>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { session, user, profile } = useAuth();
  const { affiliateCode, discountPercent } = useAffiliate();
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
  // Grupos da tabela comparativa: os 2 primeiros abrem por padrao, os demais
  // ficam colapsados pra segurar a altura da pagina.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COMPARE_GROUPS.map((g, i) => [g.title, i < 2])),
  );
  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

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

  function discountedPrice(price: number) {
    if (!discountPercent) return price;
    return Number((price * (1 - discountPercent / 100)).toFixed(2));
  }

  // CTA "Assinar": deslogado -> cadastro (comportamento inalterado); mensal ->
  // cartao direto (boleto nao e permitido ali); anual/semestral -> dialog de metodo.
  function handleSubscribe() {
    if (!session) {
      const query = affiliateCode
        ? `?ref=${encodeURIComponent(affiliateCode)}&cupom=${encodeURIComponent(affiliateCode)}&desconto=${discountPercent}`
        : "";
      setLocation(`/cadastro${query}`);
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

  const hasCoupon = discountPercent > 0 && !!affiliateCode;
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

      {hasCoupon ? (
        <div className="border-b-2 border-slate-950 bg-[#FFB800]">
          <div className="container py-3 text-center">
            <p className="font-display text-sm font-black uppercase tracking-wider text-slate-950">
              {/* TODO(Ana): confirmar copy final */}
              Cupom {affiliateCode} aplicado, {discountPercent}% de desconto na
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
          <div className="mx-auto max-w-3xl text-center">
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

            <motion.ul
              {...fade(0.15)}
              className="mx-auto mt-9 flex max-w-3xl flex-wrap justify-center gap-2.5"
            >
              {HERO_TOOL_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <li
                    key={chip.text}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-3 py-1 text-xs font-bold text-white transition-colors hover:border-amber-300/80"
                  >
                    <Icon
                      size={13}
                      strokeWidth={2}
                      className="text-amber-400 transition-colors group-hover:text-amber-300"
                      aria-hidden="true"
                    />
                    {chip.text}
                  </li>
                );
              })}
            </motion.ul>

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
        className="relative overflow-hidden border-t-2 border-slate-950 py-14 md:py-20"
        style={{
          backgroundColor: "#faf8f4",
          backgroundImage:
            "radial-gradient(rgba(245, 158, 11, 0.45) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="animate-gentle-float absolute -left-10 top-16 h-48 w-48 rounded-full bg-amber-300 opacity-[0.35] blur-3xl" />
          <div className="animate-gentle-float absolute -right-12 top-[30%] h-64 w-64 rounded-full bg-violet-300 opacity-[0.25] blur-3xl" />
          <div className="animate-gentle-float absolute left-[15%] bottom-10 h-40 w-40 rounded-full bg-amber-400 opacity-[0.22] blur-3xl" />
        </div>
        <CeuEstrelado
          stars={PRICING_STARS}
          showPattern={false}
          glowColor="rgba(255,184,0,0.10)"
        />
        <div className="container relative">
          {usersCount !== null ? (
            <motion.p
              {...fade()}
              className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-[3px_3px_0_#0f172a]"
            >
              <Users size={16} className="text-violet-700" aria-hidden="true" />
              {/* TODO(Ana): revisar copy da prova social (mesmo padrão do badge
                  da home, que evita terminar a frase com a marca "Bora na Tech?") */}
              +{usersCount.toLocaleString("pt-BR")} pessoas já encontraram seu
              caminho
            </motion.p>
          ) : null}
          <motion.div {...fade()} className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 font-display text-xs font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
              Escolha seu plano
            </p>
            <h2
              id="planos-title"
              className="mt-4 font-display font-black leading-[1.05] text-slate-950"
              style={{ fontSize: "clamp(28px, 4.5vw, 48px)" }}
            >
              3 opções.{" "}
              <span className="text-amber-600">Mesmas ferramentas.</span>
            </h2>
            <p className="mx-auto mt-5 inline-flex max-w-xl flex-wrap items-center justify-center gap-1 rounded-2xl border-2 border-slate-900 bg-white px-4 py-2 text-sm md:text-base font-bold text-slate-700 shadow-[3px_3px_0_#0f172a]">
              {/* TODO(Ana): revisar copy da âncora de valor */}
              {PRO_EXCLUSIVE_COUNT} recursos exclusivos, incluindo sua IA
              pessoal, por menos de{" "}
              <span className="text-slate-950">
                {formatPrice(ANNUAL_PER_DAY)} por dia
              </span>{" "}
              no plano anual.
            </p>
          </motion.div>

          {hasCoupon ? (
            <div className="mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-2 rounded-full border-2 border-emerald-700 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              <span className="flex flex-col items-center text-center sm:flex-row sm:gap-1.5">
                <span>
                  {/* TODO(Ana): confirmar copy final */}
                  Desconto de {discountPercent}% na primeira cobrança, em
                  qualquer plano, já aplicado nos preços abaixo · Cupom{" "}
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
              const finalPrice = discountedPrice(plan.price);
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
                  className={`relative flex min-h-[320px] flex-col rounded-3xl p-6 text-left transition-all duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600 ${
                    plan.highlight
                      ? "border-[3px] border-violet-700 shadow-[6px_6px_0_#7c3aed] hover:shadow-[8px_8px_0_#7c3aed]"
                      : "border-2 border-slate-900 shadow-[6px_6px_0_#0f172a] hover:shadow-[8px_8px_0_#0f172a]"
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
                    {plan.savings ? (
                      <p className="mt-1 text-sm font-black text-violet-800">
                        {plan.savings}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-6">
                    {discountPercent > 0 ? (
                      <p className="text-sm font-black text-slate-500 line-through">
                        {plan.priceLabel}
                      </p>
                    ) : null}
                    <p className="font-display text-4xl font-black text-slate-950">
                      {formatPrice(finalPrice)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {plan.period}
                    </p>
                    {plan.monthlyEquivalent ? (
                      <p className="mt-2 inline-block rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-sm font-black text-slate-950">
                        equivalente a{" "}
                        {plan.savingsPercent > 0 ? (
                          <span className="mr-1 font-bold text-slate-400 line-through">
                            {MONTHLY_BASE_LABEL}
                          </span>
                        ) : null}
                        {plan.monthlyEquivalent}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-auto pt-6 text-sm font-bold text-slate-700">
                    Todos os benefícios Pro incluídos.
                  </p>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            {billingStatus === "on" ? (
              <>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="pro-glare bnt-pressable inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-900 bg-[#FFB800] px-8 py-4 font-display font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_#0f172a]"
                >
                  <Sparkles className="h-5 w-5" />
                  {loading
                    ? "Abrindo checkout..."
                    : `Assinar ${currentPlan.label} · ${formatPrice(discountedPrice(currentPlan.price))}`}
                </button>
                {/* TODO(Ana): revisar copy da linha de reducao de risco (absorveu
                    o essencial do antigo FAQ: acesso pos-cancelamento e boleto). */}
                <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-bold text-slate-700">
                  <li className="inline-flex items-center gap-1.5">
                    <CalendarX
                      size={14}
                      className="shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Cancele quando quiser, sem taxa e com acesso até o fim do
                    período pago
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <CreditCard
                      size={14}
                      className="shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Cartão em todos os planos, boleto no semestral e anual
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <Mail
                      size={14}
                      className="shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Suporte por e-mail
                  </li>
                </ul>
              </>
            ) : (
              <WaitlistCta defaultEmail={profile?.email ?? user?.email ?? ""} />
            )}
            <Link
              href={FREE_HREF}
              className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-800 hover:decoration-slate-800"
            >
              Continuar com o básico (grátis)
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="tabela-comparativa-title"
        className="relative overflow-hidden border-t-2 border-slate-950 py-14 md:py-20"
        style={{
          backgroundColor: "#f5f3ff",
          backgroundImage:
            "radial-gradient(rgba(124, 58, 237, 0.25) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="animate-gentle-float absolute -left-10 top-16 h-56 w-56 rounded-full bg-violet-300 opacity-[0.3] blur-3xl" />
          <div className="animate-gentle-float absolute -right-12 top-[35%] h-72 w-72 rounded-full bg-fuchsia-300 opacity-[0.22] blur-3xl" />
          <div className="animate-gentle-float absolute left-[20%] bottom-12 h-48 w-48 rounded-full bg-violet-400 opacity-[0.2] blur-3xl" />
        </div>
        <div className="container relative max-w-6xl">
          <motion.div {...fade()} className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 font-display text-xs font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
              Grátis x Pro
            </p>
            <h2
              id="tabela-comparativa-title"
              className="mt-4 font-display font-black leading-[1.1] text-slate-950"
              style={{ fontSize: "clamp(26px, 4vw, 40px)" }}
            >
              A base é <span className="text-emerald-600">grátis</span>. O Pro{" "}
              <span className="text-violet-700">desbloqueia tudo</span>.
            </h2>
            <p className="mx-auto mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <ProStarIcon />
              Tudo do grátis + {PRO_EXCLUSIVE_COUNT} recursos exclusivos
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* TODO(Ana): revisar copy do destaque do comparador (agora Pro) */}
            <motion.div
              {...fade(0.05)}
              className="rounded-3xl border-2 border-slate-900 bg-amber-100 p-6 shadow-[5px_5px_0_#0f172a] transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[7px_7px_0_#0f172a]"
            >
              <p className="inline-flex items-center gap-2 font-display text-base font-black uppercase tracking-wider text-slate-950">
                <Scale size={18} strokeWidth={2.5} aria-hidden="true" />
                Comparador completo
                <ProStarIcon />
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {COMPARADOR_CATEGORIES.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border-[1.5px] border-slate-900 bg-white px-2.5 py-0.5 text-[11px] font-black text-slate-900 shadow-[1px_1px_0_#0f172a]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">
                Compare custo, tempo, dificuldade, mercado, certificação,
                pré-requisitos e indicações lado a lado antes de decidir.
              </p>
            </motion.div>

            {/* TODO(Ana): revisar copy do destaque da IA pessoal */}
            <motion.div
              {...fade(0.1)}
              className="rounded-3xl border-2 border-slate-900 bg-violet-100 p-6 shadow-[5px_5px_0_#7c3aed] transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[7px_7px_0_#7c3aed]"
            >
              <p className="inline-flex items-center gap-2 font-display text-base font-black uppercase tracking-wider text-slate-950">
                <Zap
                  size={18}
                  className="text-amber-500"
                  fill="currentColor"
                  aria-hidden="true"
                />
                Sua própria IA pessoal
                <ProStarIcon />
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">
                Uma IA que conhece você, seu perfil e seus objetivos: te guia,
                acompanha seu progresso e conversa sobre a sua jornada.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-slate-900 bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    IA no grátis
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    Tira-dúvidas da plataforma.
                  </p>
                </div>
                <div className="rounded-xl border-2 border-slate-900 bg-violet-200 p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-violet-800">
                    IA no Pro
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
                    Conhece seu perfil e objetivos, com guias, acompanhamento e
                    interação personalizada.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...fade(0.1)}
            className="mt-8 overflow-hidden rounded-3xl border-2 border-slate-950 bg-white shadow-[5px_5px_0_#0f172a]"
          >
            <table className="w-full table-fixed border-collapse">
              <caption className="sr-only">
                Comparação de recursos entre o plano grátis e o plano Pro
              </caption>
              <thead>
                <tr className="border-b-2 border-slate-950">
                  <th
                    scope="col"
                    className="w-16 border-r-2 border-slate-950 bg-emerald-200 px-1 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-950 sm:w-32"
                  >
                    Grátis
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.15em] text-slate-500"
                  >
                    Recursos
                  </th>
                  <th
                    scope="col"
                    className="w-24 border-l-2 border-violet-700 bg-slate-950 px-1 py-2.5 text-center sm:w-44"
                  >
                    <span className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-white">
                        <ProStarIcon />
                        Pro
                      </span>
                      <span className="hidden text-[10px] font-bold text-violet-300 sm:block">
                        a partir de {FROM_MONTHLY_LABEL}/mês
                      </span>
                      <button
                        type="button"
                        onClick={scrollToPlans}
                        aria-label="Voltar para a escolha de plano"
                        className="rounded-full border-2 border-slate-900 bg-[#FFB800] px-3.5 py-1 text-[11px] font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5"
                      >
                        Assinar
                      </button>
                    </span>
                  </th>
                </tr>
              </thead>
              {COMPARE_GROUPS.map((group) => {
                const open = openGroups[group.title] === true;
                return (
                  <tbody key={group.title}>
                    <tr className="border-y border-slate-300 bg-[#faf8f4]">
                      <th colSpan={3} scope="colgroup" className="px-4 py-1.5">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => toggleGroup(group.title)}
                          className="mx-auto flex min-h-6 w-full max-w-md items-center justify-center gap-2 text-center text-[11px] font-black uppercase tracking-[0.15em] text-slate-600 transition-colors hover:text-slate-950"
                        >
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                            strokeWidth={3}
                            aria-hidden="true"
                          />
                          {group.title}
                          <span className="rounded-full border-[1.5px] border-slate-900 bg-white px-1.5 py-px text-[10px] font-black text-slate-700 shadow-[1px_1px_0_#0f172a]">
                            {group.rows.length}
                          </span>
                          {group.preview ? (
                            <UserAvatar
                              name="Bora na Tech"
                              border="pro-holo"
                              icon="rocket"
                              size="sm"
                              className="hidden sm:inline-flex"
                            />
                          ) : null}
                        </button>
                      </th>
                    </tr>
                    {open
                      ? group.rows.map((row) => (
                          <tr
                            key={row.feature}
                            className="border-b border-slate-200 last:border-b-0"
                          >
                            <td
                              className={`border-r-2 border-slate-950 px-1 py-1.5 text-center ${
                                row.free === false
                                  ? "bg-slate-50"
                                  : "bg-emerald-100"
                              }`}
                            >
                              <CompareCellContent
                                value={row.free}
                                side="free"
                              />
                            </td>
                            <th
                              scope="row"
                              className="px-4 py-1.5 text-center text-sm font-bold text-slate-800"
                            >
                              {row.feature}
                            </th>
                            <td className="border-l-2 border-violet-700 bg-violet-200 px-1 py-1.5 text-center shadow-[inset_0_0_14px_rgba(124,58,237,0.25)]">
                              <CompareCellContent value={row.pro} side="pro" />
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                );
              })}
              <tfoot>
                <tr className="border-t-2 border-slate-950">
                  <td className="border-r-2 border-slate-950 bg-emerald-400 px-1 py-2.5 text-center font-display text-2xl font-black text-slate-950">
                    {COMPARE_FREE_TOTAL}
                  </td>
                  <th
                    scope="row"
                    className="bg-slate-950 px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-white"
                  >
                    Total de recursos
                  </th>
                  <td className="border-l-2 border-violet-700 bg-violet-700 px-1 py-2.5 text-center font-display text-2xl font-black text-white">
                    {COMPARE_PRO_TOTAL}
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>

          <motion.div
            {...fade(0.15)}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={scrollToPlans}
              aria-label="Voltar para a escolha de plano"
              className="pro-glare bnt-pressable group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
            >
              <Sparkles size={18} aria-hidden="true" />
              <span>Escolher meu plano</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <Link
              href={FREE_HREF}
              className="bnt-pressable inline-flex items-center justify-center rounded-full border-2 border-slate-950 bg-white px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
            >
              Continuar com o básico
            </Link>
          </motion.div>
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
