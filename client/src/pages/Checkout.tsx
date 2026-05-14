import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Brain,
  Calendar,
  Check,
  CircleDollarSign,
  FileText,
  Github,
  Linkedin,
  Map,
  Mic,
  Newspaper,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliate } from "@/hooks/useAffiliate";
import { createCheckout } from "@/services/subscriptionService";

const plans = [
  {
    id: "monthly",
    label: "Mensal",
    price: 24.9,
    priceLabel: "R$ 24,90",
    period: "por mês",
    highlight: false,
    badge: null,
    savings: null,
  },
  {
    id: "semiannual",
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
    id: "annual",
    label: "Anual",
    price: 179.9,
    priceLabel: "R$ 179,90",
    period: "por ano",
    monthlyEquivalent: "R$ 14,99/mês",
    highlight: false,
    badge: null,
    savings: "40% off",
  },
];

const benefitIcons = {
  brain: Brain,
  map: Map,
  calendar: Calendar,
  "brand-github": Github,
  "file-cv": FileText,
  "brand-linkedin": Linkedin,
  "currency-dollar": CircleDollarSign,
  "trending-up": TrendingUp,
  microphone: Mic,
  users: Users,
  news: Newspaper,
  scale: Scale,
};

const proBenefits = [
  { icon: "brain", label: "Quiz de área com IA" },
  { icon: "map", label: "Roadmaps completos" },
  { icon: "calendar", label: "Plano de estudos personalizado" },
  { icon: "brand-github", label: "Analisador de GitHub" },
  { icon: "file-cv", label: "Analisador de currículo com IA" },
  { icon: "brand-linkedin", label: "Otimizador de LinkedIn com IA" },
  { icon: "currency-dollar", label: "Comparativo de salários" },
  { icon: "trending-up", label: "Análise de empregabilidade" },
  { icon: "microphone", label: "Preparação para entrevistas" },
  { icon: "users", label: "Networking e comunidade" },
  { icon: "news", label: "Notícias tech filtradas" },
  { icon: "scale", label: "Comparador de áreas" },
] as const;

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { affiliateCode, discountPercent } = useAffiliate();
  const [selectedPlan, setSelectedPlan] = useState("semiannual");
  const [loading, setLoading] = useState(false);

  function discountedPrice(price: number) {
    if (!discountPercent) return price;
    return Number((price * (1 - discountPercent / 100)).toFixed(2));
  }

  async function handleSubscribe() {
    if (!session) {
      const query = affiliateCode ? `?ref=${encodeURIComponent(affiliateCode)}&cupom=${encodeURIComponent(affiliateCode)}&desconto=${discountPercent}` : "";
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

  return (
    <Layout>
      <SEO
        title="Plano Pro — Bora na Tech?"
        description="Desbloqueie ferramentas de IA, plano de estudos personalizado, analisador de currículo e LinkedIn, comparativo de salários e mais. A partir de R$ 14,99/mês."
        keywords={["plano pro bora na tech", "ia carreira ti", "analisador currículo ia", "otimizador linkedin"]}
        url="/pro"
        schemaType="FAQPage"
        schemaData={{
          mainEntity: [
            {
              "@type": "Question",
              name: "O que está incluído no Bora na Tech? Pro?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Ferramentas de IA, roadmaps completos, plano de estudos, analisadores de currículo, LinkedIn e GitHub, além de recursos de carreira.",
              },
            },
            {
              "@type": "Question",
              name: "Qual é o menor preço mensal equivalente?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "O plano anual tem equivalente mensal a partir de R$ 14,99.",
              },
            },
          ],
        }}
      />
      <section className="bg-[#faf8f4] py-12">
        <div className="container">
          {discountPercent > 0 && affiliateCode ? (
            <div className="mb-6 rounded-3xl border-2 border-slate-900 bg-[#FFB800] p-4 text-center font-black text-slate-950 shadow-[4px_4px_0_#0f172a]">
              Cupom {affiliateCode} aplicado — {discountPercent}% de desconto em qualquer plano
            </div>
          ) : null}

          <div className="mx-auto max-w-4xl text-center">
            <p className="social-badge inline-flex px-4 py-2 text-xs font-black uppercase">
              Bora na Tech? Pro
            </p>
            <h1 className="font-display mt-5 text-4xl font-black text-slate-950 md:text-6xl">
              Desbloqueie sua bússola completa.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed text-slate-700">
              Tenha IA, roadmaps completos, plano de estudos, preparação para carreira e ferramentas práticas para sair da dúvida e avançar com direção.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlan === plan.id;
              const finalPrice = discountedPrice(plan.price);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative flex min-h-[300px] flex-col rounded-3xl border-2 border-slate-900 p-6 text-left shadow-[6px_6px_0_#0f172a] transition-transform hover:-translate-y-1 ${
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
                      <h2 className="font-display text-3xl font-black text-slate-950">{plan.label}</h2>
                      {plan.savings ? <p className="mt-1 text-sm font-black text-violet-800">{plan.savings}</p> : null}
                    </div>
                    {selected ? <Check className="h-7 w-7 text-slate-950" /> : null}
                  </div>
                  <div className="mt-6">
                    {discountPercent > 0 ? <p className="text-sm font-black text-slate-500 line-through">{plan.priceLabel}</p> : null}
                    <p className="font-display text-4xl font-black text-slate-950">{formatPrice(finalPrice)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{plan.period}</p>
                    {"monthlyEquivalent" in plan && plan.monthlyEquivalent ? (
                      <p className="mt-2 rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-sm font-black text-slate-950">
                        equivalente a {plan.monthlyEquivalent}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-auto pt-6 text-sm font-bold text-slate-700">Todos os benefícios Pro incluídos.</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSubscribe()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-[#FFB800] px-8 py-4 font-black text-slate-950 shadow-[5px_5px_0_#0f172a] disabled:opacity-60"
            >
              <Sparkles className="h-5 w-5" />
              {loading ? "Abrindo checkout..." : "Assinar agora"}
            </button>
            <p className="text-center text-sm font-black text-slate-700">Cancele quando quiser • Sem taxa de cancelamento • Suporte por e-mail</p>
          </div>

          <div className="mt-12 rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_#0f172a]">
            <h2 className="font-display text-3xl font-black text-slate-950">O que entra no Pro</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {proBenefits.map((benefit) => {
                const Icon = benefitIcons[benefit.icon];
                return (
                  <div key={benefit.label} className="flex items-center gap-3 rounded-2xl border-2 border-slate-900 bg-[#faf8f4] p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-[#FFB800]">
                      <Icon className="h-5 w-5 text-slate-950" />
                    </span>
                    <span className="font-black text-slate-950">{benefit.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {[
              ["Posso cancelar?", "Sim. Você cancela quando quiser, sem taxa de cancelamento."],
              ["O cupom vale para qual plano?", "Quando ativo, o cupom é aplicado automaticamente ao plano escolhido."],
              ["Preciso ter experiência?", "Não. O Pro foi desenhado para iniciantes e pessoas em transição."],
              ["Como recebo acesso?", "Depois do pagamento aprovado, sua conta passa a liberar os recursos Pro."],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
                <h3 className="font-display text-xl font-black text-slate-950">{question}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
