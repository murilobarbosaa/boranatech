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
  Bot,
  Building2,
  Calendar,
  CalendarX,
  Camera,
  Check,
  Code2,
  Compass,
  Cpu,
  GraduationCap,
  Layers,
  type LucideIcon,
  Mail,
  MessageSquare,
  Palette,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CeuEstrelado from "@/components/shared/CeuEstrelado";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
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

const HERO_PILLS: Array<{ icon: LucideIcon; text: string; color: string }> = [
  { icon: Bot, text: "IA pessoal", color: "bg-violet-100 text-violet-700" },
  {
    icon: Sparkles,
    text: "8+ ferramentas com IA",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Palette,
    text: "Personalização",
    color: "bg-pink-100 text-pink-700",
  },
];

// TODO(Ana): revisar nomes das ferramentas exibidos na comparação.
const PRO_AI_TOOLS = [
  "Roadmap personalizado por IA",
  "Plano de carreira inteligente",
  "Sugestão de projetos pra portfólio",
  "Simulador de entrevistas",
  "Gerador de currículo",
  "Avaliador de currículo",
  "Avaliador de LinkedIn",
  "Avaliador de GitHub",
];

const PRO_PERSONALIZATION: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Camera, text: "Foto de perfil na conta" },
  { icon: Palette, text: "Bordas de perfil personalizadas" },
  { icon: Trophy, text: "Conquistas especiais exclusivas" },
];

// TODO(Ana): revisar copy do FAQ da página de planos.
const CHECKOUT_FAQ: Array<{ pergunta: string; resposta: string }> = [
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta:
      "Sim. O cancelamento é feito na área de assinatura do seu perfil, sem taxa e sem burocracia. O acesso Pro continua até o fim do período já pago.",
  },
  {
    pergunta: "Quais formas de pagamento vocês aceitam?",
    resposta:
      "Cartão de crédito em todos os planos. Nos planos semestral e anual também dá pra pagar com boleto.",
  },
  {
    pergunta: "O que acontece com meus dados se eu cancelar?",
    resposta:
      "Nada se perde: sua conta, seu progresso e seu histórico continuam guardados. Você volta pro plano grátis e, se assinar de novo, retoma de onde parou.",
  },
];

const FREE_ITEMS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Layers, text: `Catálogo de ${areasCount} áreas de TI` },
  { icon: Cpu, text: "+60 tecnologias com comparação" },
  { icon: Building2, text: "+20 empresas brasileiras de tech" },
  { icon: GraduationCap, text: "+20 faculdades e cursos" },
  { icon: Calendar, text: "+42 eventos tech" },
  { icon: Code2, text: "+48 projetos pra praticar" },
  { icon: BookOpen, text: `Dicionário com +${dictionaryTermsCount} termos` },
  { icon: Compass, text: "Quiz de carreira completo" },
  { icon: MessageSquare, text: "Banco de perguntas e desafios de entrevista" },
];

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
        title="Planos · Ferramentas com IA pra entrar em TI"
        description={`Sua IA pessoal e 8 ferramentas com IA pra entrar em TI: roadmap, plano de carreira, currículo, entrevistas, LinkedIn e GitHub. A partir de ${FROM_MONTHLY_LABEL}/mês no plano anual.`}
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
        className="relative overflow-hidden bg-slate-950 py-20 md:py-24"
      >
        <CeuEstrelado />
        <div className="container relative z-10">
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
              className="mx-auto mt-5 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-slate-300"
            >
              {/* TODO(Ana): revisar copy do subtítulo do hero */}O Pro coloca
              análise personalizada com IA em cada etapa da sua entrada em TI.
            </motion.p>

            <motion.ul
              {...fade(0.15)}
              className="mt-8 flex flex-wrap justify-center gap-2.5"
            >
              {HERO_PILLS.map((pill) => {
                const Icon = pill.icon;
                return (
                  <li
                    key={pill.text}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-black text-white"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${pill.color}`}
                    >
                      <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    {pill.text}
                  </li>
                );
              })}
            </motion.ul>

            <motion.div
              {...fade(0.25)}
              className="mt-8 flex flex-col items-center gap-3"
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
        aria-labelledby="free-vs-pro-title"
        className="relative overflow-hidden py-16 md:py-20"
        style={{
          backgroundColor: "#f5f3ff",
          backgroundImage:
            "radial-gradient(rgba(124, 58, 237, 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="container">
          {usersCount !== null ? (
            <motion.p
              {...fade()}
              className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-[3px_3px_0_#0f172a]"
            >
              <Users size={16} className="text-violet-700" aria-hidden="true" />
              {/* TODO(Ana): revisar copy da prova social (mesmo padrão do badge
                  da home, que evita terminar a frase com a marca "Bora na Tech?") */}
              +{usersCount.toLocaleString("pt-BR")} pessoas já encontraram seu
              caminho
            </motion.p>
          ) : null}
          <motion.h2
            id="free-vs-pro-title"
            {...fade()}
            className="mx-auto max-w-2xl text-center font-display font-black leading-[1.1] text-slate-950"
            style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
          >
            A base é <span className="text-emerald-600">grátis</span>. O Pro{" "}
            <span className="text-violet-700">acelera</span>.
          </motion.h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2 md:items-start">
            <motion.div
              {...fade(0.05)}
              className="rounded-3xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#0f172a]"
            >
              <h3 className="font-display text-lg font-black text-slate-950">
                Grátis você já tem
              </h3>
              {/* TODO(Ana): revisar copy do destaque do comparador */}
              <div className="mt-4 rounded-2xl border-2 border-slate-950 bg-emerald-50 p-4">
                <p className="inline-flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-emerald-800">
                  <Scale size={16} strokeWidth={2.5} aria-hidden="true" />
                  Compare tudo antes de decidir
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                  O comparador coloca lado a lado graduações e faculdades,
                  cursos, plataformas de estudo, áreas de TI, tecnologias e
                  mais: custo, tempo, dificuldade, mercado, certificação,
                  pré-requisitos e indicações, tudo de graça.
                </p>
              </div>
              <ul className="mt-4 space-y-2.5">
                {FREE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.text}
                      className="flex items-center gap-2.5 text-sm font-bold text-slate-800"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-emerald-100">
                        <Icon
                          size={13}
                          className="text-emerald-700"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </span>
                      {item.text}
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              {...fade(0.1)}
              className="max-md:order-first rounded-3xl border-2 border-slate-950 bg-slate-950 p-6 shadow-[5px_5px_0_#7c3aed]"
            >
              <h3 className="inline-flex items-center gap-2 font-display text-lg font-black text-white">
                <Sparkles size={18} className="text-amber-400" />O Pro adiciona
              </h3>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Ferramentas com IA ({PRO_AI_TOOLS.length})
              </p>
              <ul className="mt-2.5 space-y-2">
                {PRO_AI_TOOLS.map((tool) => (
                  <li
                    key={tool}
                    className="flex items-center gap-2.5 text-sm font-bold text-slate-100"
                  >
                    <ProStarIcon />
                    {tool}
                  </li>
                ))}
              </ul>

              {/* TODO(Ana): revisar copy do destaque da IA pessoal */}
              <div className="mt-5 rounded-2xl border-2 border-violet-500 bg-violet-950/50 p-4">
                <p className="inline-flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-white">
                  <Zap
                    size={16}
                    className="text-amber-400"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  Sua própria IA pessoal
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">
                  Uma IA que conhece você, seu perfil e seus objetivos: te guia,
                  acompanha seu progresso e conversa sobre a sua jornada, não só
                  sobre a plataforma.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      IA no grátis
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-300">
                      Tira-dúvidas da plataforma.
                    </p>
                  </div>
                  <div className="rounded-xl border border-violet-400/40 bg-violet-500/15 p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                      IA no Pro
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-200">
                      Conhece seu perfil e objetivos, com guias, acompanhamento
                      e interação personalizada.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Personalização e status ({PRO_PERSONALIZATION.length})
              </p>
              <ul className="mt-2.5 space-y-2">
                {PRO_PERSONALIZATION.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.text}
                      className="flex items-center gap-2.5 text-sm font-bold text-slate-100"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                        <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      {item.text}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <UserAvatar
                  name="Bora na Tech"
                  border="pro-holo"
                  icon="rocket"
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">
                    Seu perfil com cara de Pro
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                      <Trophy size={10} aria-hidden="true" />
                      Conquista Pro
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-300">
                      <Sparkles size={10} aria-hidden="true" />
                      Borda exclusiva
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-slate-400">
                E ainda: comunidade exclusiva Pro (em breve).
              </p>
            </motion.div>
          </div>

          <motion.div
            {...fade(0.15)}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={scrollToPlans}
              aria-label="Ir para escolha de plano"
              className="pro-glare bnt-pressable group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
            >
              <Sparkles size={18} aria-hidden="true" />
              <span>Desbloquear as ferramentas com IA</span>
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

      <section
        id="planos-section"
        aria-labelledby="planos-title"
        className="relative bg-white py-16 md:py-24"
      >
        <div className="container">
          <motion.div {...fade()} className="mx-auto max-w-3xl text-center">
            <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-700">
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
            <p className="mx-auto mt-4 max-w-xl text-sm md:text-base font-bold text-slate-600">
              {/* TODO(Ana): revisar copy da âncora de valor */}8 ferramentas
              com IA + sua IA pessoal por menos de{" "}
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
            className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3"
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
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-3xl font-black text-slate-950">
                        {plan.label}
                      </h3>
                      {plan.savings ? (
                        <p className="mt-1 text-sm font-black text-violet-800">
                          {plan.savings}
                        </p>
                      ) : null}
                    </div>
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        selected
                          ? "border-slate-900 bg-slate-950"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected ? (
                        <Check
                          className="h-4 w-4 text-[#FFB800]"
                          strokeWidth={3}
                        />
                      ) : null}
                    </span>
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
                <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm font-bold text-slate-700">
                  <li className="inline-flex items-center gap-1.5">
                    <CalendarX
                      size={14}
                      className="shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Cancele quando quiser
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <ShieldCheck
                      size={14}
                      className="shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                    Sem taxa de cancelamento
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
        aria-labelledby="planos-faq-title"
        className="border-t-2 border-slate-950 bg-[#faf8f4] py-16 md:py-20"
      >
        <div className="container max-w-3xl">
          <motion.h2
            id="planos-faq-title"
            {...fade()}
            className="text-center font-display font-black leading-[1.1] text-slate-950"
            style={{ fontSize: "clamp(24px, 3.5vw, 36px)" }}
          >
            Perguntas rápidas
          </motion.h2>
          <motion.div {...fade(0.05)} className="mt-8 space-y-4">
            {CHECKOUT_FAQ.map((item) => (
              <DetailsChevronOnly
                key={item.pergunta}
                className="card-brutal rounded-2xl bg-white p-5"
                title={
                  <h3 className="font-display text-lg font-black text-slate-950">
                    {item.pergunta}
                  </h3>
                }
              >
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.resposta}
                </p>
              </DetailsChevronOnly>
            ))}
          </motion.div>
          <motion.p
            {...fade(0.1)}
            className="mt-6 text-center text-sm font-bold text-slate-600"
          >
            Mais dúvidas?{" "}
            <Link
              href="/perguntas-frequentes"
              className="text-violet-800 underline underline-offset-4 hover:text-violet-950"
            >
              Veja as perguntas frequentes
            </Link>
          </motion.p>
        </div>
      </section>

      <section
        aria-labelledby="planos-fechamento-title"
        className="relative overflow-hidden border-t-2 border-slate-950 bg-slate-950 py-14 md:py-16"
      >
        <CeuEstrelado />
        <div className="container relative z-10 flex flex-col items-center gap-6 text-center">
          <motion.h2
            id="planos-fechamento-title"
            {...fade()}
            className="max-w-2xl font-display font-black leading-[1.1] text-white"
            style={{ fontSize: "clamp(24px, 3.5vw, 36px)" }}
          >
            {/* TODO(Ana): revisar copy do fechamento */}
            Sem mais dúvidas? Bora acelerar sua entrada em{" "}
            <span className="relative inline-block">
              <span className="relative">TI</span>
              <span
                className="absolute -bottom-1 left-0 right-0 -z-10 h-2.5 rounded-md bg-amber-400"
                aria-hidden="true"
              />
            </span>
            .
          </motion.h2>
          <motion.div
            {...fade(0.05)}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={scrollToPlans}
              aria-label="Voltar para a escolha de plano"
              className="pro-glare bnt-pressable group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#7c3aed] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#7c3aed]"
            >
              <ProStarIcon />
              <span>Assinar {currentPlan.label}</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <Link
              href={FREE_HREF}
              className="bnt-pressable inline-flex items-center justify-center rounded-full border-2 border-slate-950 bg-white px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#7c3aed] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#7c3aed]"
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
