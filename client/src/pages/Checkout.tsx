import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  Code2,
  Compass,
  Cpu,
  FileText,
  Github,
  GraduationCap,
  Layers,
  Linkedin,
  type LucideIcon,
  Map,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CeuEstrelado from "@/components/shared/CeuEstrelado";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliate } from "@/hooks/useAffiliate";
import { createCheckout } from "@/services/subscriptionService";
import { PRO_FEATURES, type ProFeature } from "@shared/proFeatures";
import { areasCount, dictionaryTermsCount } from "@/lib/counts";

const plans = [
  {
    id: "pro_monthly",
    label: "Mensal",
    price: 24.9,
    priceLabel: "R$ 24,90",
    period: "por mês",
    highlight: false,
    badge: null,
    savings: null,
  },
  {
    id: "pro_semiannual",
    label: "Semestral",
    price: 119.4,
    priceLabel: "R$ 119,40",
    period: "a cada 6 meses",
    monthlyEquivalent: "R$ 19,90/mês",
    highlight: true,
    badge: "MAIS POPULAR",
    savings: "20% off",
  },
  {
    id: "pro_annual",
    label: "Anual",
    price: 179.9,
    priceLabel: "R$ 179,90",
    period: "por ano",
    monthlyEquivalent: "R$ 14,99/mês",
    highlight: false,
    badge: "MELHOR CUSTO",
    savings: "40% off",
  },
];

const PRO_FEATURE_ICONS: Record<string, LucideIcon> = {
  FileText,
  Map,
  Mic,
  CalendarCheck,
  Linkedin,
  Github,
  TrendingUp,
  Send,
  Users,
};

const FEATURE_ICON_COLOR: Record<ProFeature["color"], string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  orange: "bg-orange-100 text-orange-700",
  amber: "bg-amber-100 text-amber-700",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
  pink: "bg-pink-100 text-pink-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

const mainFeatures = PRO_FEATURES.filter((f) => f.group === "main");
const extraFeatures = PRO_FEATURES.filter((f) => f.group === "extra");
const extraNames = extraFeatures.map((f) => f.title).join(", ");

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

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { affiliateCode, discountPercent } = useAffiliate();
  const [selectedPlan, setSelectedPlan] = useState("pro_semiannual");
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  function discountedPrice(price: number) {
    if (!discountPercent) return price;
    return Number((price * (1 - discountPercent / 100)).toFixed(2));
  }

  async function handleSubscribe() {
    if (!session) {
      const query = affiliateCode
        ? `?ref=${encodeURIComponent(affiliateCode)}&cupom=${encodeURIComponent(affiliateCode)}&desconto=${discountPercent}`
        : "";
      setLocation(`/cadastro${query}`);
      return;
    }

    setLoading(true);
    try {
      const { checkoutUrl } = await createCheckout(selectedPlan);
      if (checkoutUrl) window.open(checkoutUrl, "_blank");
    } catch (error) {
      console.error("[Checkout] createCheckout failed", error);
      toast.error("Não foi possível iniciar o checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const hasCoupon = discountPercent > 0 && !!affiliateCode;

  const fade = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay },
  });

  return (
    <Layout>
      <SEO
        title="Plano Pro · Bora na Tech?"
        description="Desbloqueie 8 ferramentas com IA pra entrar em TI: roadmaps, plano de estudos, análise de currículo, LinkedIn, portfólio, entrevista, empregabilidade e networking. A partir de R$ 14,99/mês no plano anual."
        keywords={[
          "plano pro bora na tech",
          "ia carreira ti",
          "analisador currículo ia",
          "otimizador linkedin",
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
            lowPrice: "14.99",
            highPrice: "24.90",
            offerCount: 3,
            offers: [
              {
                "@type": "Offer",
                name: "Mensal",
                price: "24.90",
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Semestral",
                price: "119.40",
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Anual",
                price: "179.90",
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
              primeira cobrança.
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-950/70">
              {/* TODO(Ana): confirmar copy final */}
              Renovações no valor cheio.
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
              O Pro desbloqueia 8 ferramentas com IA pra acelerar sua entrada em
              TI.
            </motion.p>

            <motion.ul
              {...fade(0.15)}
              className="mt-8 flex flex-wrap justify-center gap-2.5"
            >
              {mainFeatures.map((feature) => {
                const Icon = PRO_FEATURE_ICONS[feature.iconName];
                return (
                  <li
                    key={feature.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-black text-white"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${FEATURE_ICON_COLOR[feature.color]}`}
                    >
                      <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    {feature.title}
                  </li>
                );
              })}
            </motion.ul>
            <motion.p
              {...fade(0.2)}
              className="mt-3 text-sm font-medium text-slate-400"
            >
              E mais: {extraNames}.
            </motion.p>

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
                A partir de R$ 14,99/mês no plano anual.
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
          <motion.h2
            id="free-vs-pro-title"
            {...fade()}
            className="mx-auto max-w-2xl text-center font-display font-black leading-[1.1] text-slate-950"
            style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
          >
            A base é <span className="text-emerald-600">grátis</span>. O Pro{" "}
            <span className="text-violet-700">acelera</span>.
          </motion.h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <motion.div
              {...fade(0.05)}
              className="rounded-3xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#0f172a]"
            >
              <h3 className="font-display text-lg font-black text-slate-950">
                Grátis você já tem
              </h3>
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
              className="rounded-3xl border-2 border-slate-950 bg-slate-950 p-6 shadow-[5px_5px_0_#7c3aed]"
            >
              <h3 className="inline-flex items-center gap-2 font-display text-lg font-black text-white">
                <Sparkles size={18} className="text-amber-400" />O Pro adiciona
              </h3>
              <ul className="mt-4 space-y-2.5">
                {mainFeatures.map((feature) => {
                  const Icon = PRO_FEATURE_ICONS[feature.iconName];
                  return (
                    <li
                      key={feature.id}
                      className="flex items-start gap-2.5 text-sm font-bold text-slate-100"
                    >
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${FEATURE_ICON_COLOR[feature.color]}`}
                      >
                        <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                      </span>
                      <span>
                        {feature.title}
                        <span className="font-medium text-slate-400">
                          {" "}
                          · {feature.label}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs font-medium text-slate-400">
                E mais: {extraNames}. Total de 8 ferramentas com IA.
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
              <span>Assinar Pro</span>
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
          </motion.div>

          {hasCoupon ? (
            <div className="mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-2 rounded-full border-2 border-emerald-700 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              <span className="flex flex-col items-center text-center sm:flex-row sm:gap-1.5">
                <span>
                  {/* TODO(Ana): confirmar copy final */}
                  Desconto de {discountPercent}% na primeira cobrança, já
                  aplicado nos preços abaixo · Cupom {affiliateCode}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {/* TODO(Ana): confirmar copy final */}
                  Renovações no valor cheio.
                </span>
              </span>
            </div>
          ) : null}

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {plans.map((plan, idx) => {
              const selected = selectedPlan === plan.id;
              const finalPrice = discountedPrice(plan.price);
              return (
                <motion.button
                  key={plan.id}
                  {...fade(0.05 * idx)}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  aria-pressed={selected}
                  className={`relative flex min-h-[320px] flex-col rounded-3xl border-2 border-slate-900 p-6 text-left shadow-[6px_6px_0_#0f172a] transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a] ${
                    plan.highlight ? "bg-[#FFB800]" : "bg-white"
                  } ${selected ? "ring-4 ring-violet-300" : ""}`}
                >
                  {plan.badge ? (
                    <span className="mb-4 w-fit rounded-full border-2 border-slate-900 bg-slate-950 px-3 py-1 text-xs font-black text-[#FFB800]">
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
                    {selected ? (
                      <Check className="h-7 w-7 text-slate-950" />
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
                    {"monthlyEquivalent" in plan && plan.monthlyEquivalent ? (
                      <p className="mt-2 inline-block rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-sm font-black text-slate-950">
                        equivalente a {plan.monthlyEquivalent}
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
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="pro-glare bnt-pressable inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-slate-900 bg-[#FFB800] px-8 py-4 font-display font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_#0f172a]"
            >
              <Sparkles className="h-5 w-5" />
              {loading ? "Abrindo checkout..." : "Assinar agora"}
            </button>
            <p className="text-center text-sm font-bold text-slate-700">
              Cancele quando quiser · Sem taxa de cancelamento · Suporte por
              e-mail
            </p>
            <Link
              href={FREE_HREF}
              className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-800 hover:decoration-slate-800"
            >
              Continuar com o básico (grátis)
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
