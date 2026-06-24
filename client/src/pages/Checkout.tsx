import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
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

const mainFeatures = PRO_FEATURES.filter((f) => f.group === "main");
const extraFeatures = PRO_FEATURES.filter((f) => f.group === "extra");

const FREE_ITEMS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Layers, text: "Catálogo de 12 áreas de TI" },
  { icon: Cpu, text: "+60 tecnologias com comparação" },
  { icon: Building2, text: "+20 empresas brasileiras de tech" },
  { icon: GraduationCap, text: "+20 faculdades e cursos" },
  { icon: Calendar, text: "+42 eventos tech" },
  { icon: Code2, text: "+48 projetos pra praticar" },
  { icon: BookOpen, text: "Dicionário com +250 termos" },
  { icon: Compass, text: "Quiz de carreira completo" },
  { icon: MessageSquare, text: "Banco de perguntas e desafios de entrevista" },
];

const COLOR_TOKENS: Record<
  ProFeature["color"],
  { bgMockup: string; bgIcon: string; textIcon: string; number: string }
> = {
  emerald: {
    bgMockup: "bg-emerald-50",
    bgIcon: "bg-emerald-100",
    textIcon: "text-emerald-700",
    number: "text-emerald-500/40",
  },
  blue: {
    bgMockup: "bg-blue-50",
    bgIcon: "bg-blue-100",
    textIcon: "text-blue-700",
    number: "text-blue-500/40",
  },
  violet: {
    bgMockup: "bg-violet-50",
    bgIcon: "bg-violet-100",
    textIcon: "text-violet-700",
    number: "text-violet-500/40",
  },
  sky: {
    bgMockup: "bg-sky-50",
    bgIcon: "bg-sky-100",
    textIcon: "text-sky-700",
    number: "text-sky-500/40",
  },
  orange: {
    bgMockup: "bg-orange-50",
    bgIcon: "bg-orange-100",
    textIcon: "text-orange-700",
    number: "text-orange-500/40",
  },
  amber: {
    bgMockup: "bg-amber-50",
    bgIcon: "bg-amber-100",
    textIcon: "text-amber-700",
    number: "text-amber-500/40",
  },
  fuchsia: {
    bgMockup: "bg-fuchsia-50",
    bgIcon: "bg-fuchsia-100",
    textIcon: "text-fuchsia-700",
    number: "text-fuchsia-500/40",
  },
  pink: {
    bgMockup: "bg-pink-50",
    bgIcon: "bg-pink-100",
    textIcon: "text-pink-700",
    number: "text-pink-500/40",
  },
  cyan: {
    bgMockup: "bg-cyan-50",
    bgIcon: "bg-cyan-100",
    textIcon: "text-cyan-700",
    number: "text-cyan-500/40",
  },
};

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
              Cupom {affiliateCode} aplicado, {discountPercent}% de desconto em
              qualquer plano
            </p>
          </div>
        </div>
      ) : null}

      <HeroSection />
      <WhyProSummary />
      <MockupHeroSlot />
      <FeaturesZigZagSection />
      <ExtraFeaturesSection />
      <FreeVsProSection />
      <PlansSection
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        discountPercent={discountPercent}
        affiliateCode={affiliateCode}
        loading={loading}
        onSubscribe={handleSubscribe}
        discountedPrice={discountedPrice}
        hasCoupon={hasCoupon}
      />
      <FinalCTASection loading={loading} onSubscribe={handleSubscribe} />
    </Layout>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-pro-title"
      className="relative overflow-hidden bg-slate-950 py-20 md:py-28"
    >
      <CeuEstrelado />

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-400"
          >
            Bora na Tech? Pro
          </motion.p>

          <motion.h1
            id="hero-pro-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-display font-black leading-[1.05] text-white"
            style={{ fontSize: "clamp(2.75rem, 5.5vw, 5rem)" }}
          >
            Tudo que você precisa pra{" "}
            <span className="relative inline-block">
              <span className="relative">entrar em TI</span>
              <span
                className="absolute -bottom-2 left-0 right-0 h-3 -z-10 rounded-md bg-amber-400"
                aria-hidden="true"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-base md:text-lg font-medium leading-relaxed text-slate-300"
          >
            8 ferramentas com IA pra sair da dúvida, construir seu portfólio e
            conseguir o primeiro emprego. Em uma assinatura única.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 text-sm font-medium text-slate-400"
          >
            Sobre uma base sólida: +250 termos, +100 roadmaps, +60 tecnologias,
            +90 perguntas técnicas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex flex-col items-center gap-4"
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
              A partir de R$ 14,99/mês no plano anual
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WhyProSummary() {
  return (
    <section aria-labelledby="why-pro-title" className="bg-[#faf8f4] pt-12 md:pt-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl rounded-3xl border-2 border-slate-950 bg-white p-6 text-center shadow-[6px_6px_0_#0f172a] md:p-8"
        >
          <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-700">
            Por que assinar o Pro?
          </p>
          <h2
            id="why-pro-title"
            className="mx-auto mt-3 max-w-2xl font-display text-xl md:text-2xl font-black leading-snug text-slate-950"
          >
            O Pro desbloqueia 8 ferramentas com IA pra acelerar sua entrada em
            TI.
          </h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
            {mainFeatures.map((feature) => {
              const Icon = PRO_FEATURE_ICONS[feature.iconName];
              return (
                <li
                  key={feature.number}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-amber-50 px-3.5 py-1.5 text-sm font-black text-slate-900"
                >
                  <Icon
                    size={16}
                    className="text-amber-700"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {feature.title}
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function MockupHeroSlot() {
  return (
    <section id="mockup-hero-slot" className="container py-12 md:py-16">
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-16 text-center">
        <p className="font-display text-2xl font-black text-slate-500">
          [Mockup animado do Analisador de Currículo]
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Será implementado no Passe 2
        </p>
      </div>
    </section>
  );
}

function FeaturesZigZagSection() {
  return (
    <section
      aria-labelledby="zigzag-title"
      className="relative bg-[#faf8f4] py-20 md:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-700">
            8 ferramentas com IA
          </p>
          <h2
            id="zigzag-title"
            className="mt-4 font-display font-black leading-[1.05] text-slate-950"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Cada uma resolve um{" "}
            <span className="text-amber-600">problema real</span>.
          </h2>
        </div>

        <div className="mt-16 space-y-16 lg:space-y-20">
          {mainFeatures.map((feature, idx) => (
            <ZigZagBlock
              key={feature.number}
              feature={feature}
              reverse={idx % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ZigZagBlock({
  feature,
  reverse,
}: {
  feature: ProFeature;
  reverse: boolean;
}) {
  const tokens = COLOR_TOKENS[feature.color];
  const Icon = PRO_FEATURE_ICONS[feature.iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col items-center gap-10 lg:gap-12 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}
    >
      <div className="w-full lg:w-1/2">
        <FeatureMockup feature={feature} />
      </div>

      <div
        className={`flex w-full flex-col lg:w-1/2 ${
          reverse ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
        }`}
      >
        <p
          className={`font-display text-6xl md:text-7xl font-black leading-none ${tokens.number}`}
        >
          {feature.number}
        </p>
        <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]">
          <Icon
            size={20}
            className={tokens.textIcon}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </div>
        <h3
          className="mt-4 font-display font-black text-slate-950"
          style={{ fontSize: "clamp(24px, 3vw, 32px)" }}
        >
          {feature.title}
        </h3>
        <p className="mt-3 max-w-md text-base md:text-lg font-medium leading-relaxed text-slate-700">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

function FeatureMockup({ feature }: { feature: ProFeature }) {
  const tokens = COLOR_TOKENS[feature.color];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border-2 border-slate-950 shadow-[6px_6px_0_#0f172a] ${tokens.bgMockup} min-h-[280px] md:min-h-[320px]`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 p-5 md:p-7">
        <MockupContent feature={feature} />
      </div>
    </div>
  );
}

function MockupContent({ feature }: { feature: ProFeature }) {
  switch (feature.number) {
    case "01":
      return <MockupCurriculo />;
    case "02":
      return <MockupRoadmap />;
    case "03":
      return <MockupEntrevistas />;
    default:
      return null;
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const CURRICULO_DEPOIS =
  "“Desenvolvi 5 sites responsivos em React, reduzindo bounce rate em 30%”";

function MockupCurriculo() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      setStage(3);
      setTyped(CURRICULO_DEPOIS);
      return;
    }
    let cancelled = false;
    const run = async () => {
      await wait(150);
      if (cancelled) return;
      setStage(1);
      await wait(900);
      if (cancelled) return;
      setStage(2);
      await wait(1100);
      if (cancelled) return;
      setStage(3);
      await wait(350);
      for (let i = 1; i <= CURRICULO_DEPOIS.length; i++) {
        if (cancelled) return;
        setTyped(CURRICULO_DEPOIS.slice(0, i));
        await wait(28);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isInView, reduce]);

  const typing =
    stage === 3 && typed.length < CURRICULO_DEPOIS.length && !reduce;

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-2.5">
      {stage >= 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 rounded-2xl border-2 border-slate-950 bg-violet-100 p-3 shadow-[2px_2px_0_#0f172a]"
        >
          <Sparkles
            size={16}
            className="mt-0.5 shrink-0 text-violet-700"
            strokeWidth={2.5}
          />
          <p className="text-xs md:text-sm font-bold leading-snug text-slate-900">
            Reescrevi seu currículo. Olha a diferença:
          </p>
        </motion.div>
      ) : null}

      {stage >= 2 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border-2 border-slate-950 bg-amber-50 p-3 shadow-[2px_2px_0_#0f172a]"
        >
          <span className="font-display text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
            Antes
          </span>
          <p className="mt-1 text-xs md:text-sm font-medium leading-snug text-slate-700">
            &ldquo;Trabalhei como dev fazendo sites&rdquo;
          </p>
        </motion.div>
      ) : null}

      {stage >= 3 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border-2 border-slate-950 bg-violet-100 p-3 shadow-[2px_2px_0_#0f172a]"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-violet-700" strokeWidth={2.5} />
            <span className="font-display text-[10px] font-black uppercase tracking-[0.15em] text-violet-700">
              Depois
            </span>
          </div>
          <p className="mt-1 min-h-[2.5em] text-xs md:text-sm font-medium leading-snug text-slate-900">
            {typed}
            {typing ? (
              <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-violet-700 align-middle" />
            ) : null}
          </p>
        </motion.div>
      ) : null}
    </div>
  );
}

const ROADMAP_NODES = [
  { x: 55, label: "1" },
  { x: 150, label: "2" },
  { x: 250, label: "3" },
  { x: 345, label: "4" },
];

function MockupRoadmap() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      setStep(7);
      return;
    }
    let cancelled = false;
    const run = async () => {
      await wait(200);
      if (cancelled) return;
      setStep(1);
      await wait(350);
      if (cancelled) return;
      setStep(2);
      await wait(300);
      if (cancelled) return;
      setStep(3);
      await wait(350);
      if (cancelled) return;
      setStep(4);
      await wait(300);
      if (cancelled) return;
      setStep(5);
      await wait(350);
      if (cancelled) return;
      setStep(6);
      await wait(300);
      if (cancelled) return;
      setStep(7);
      await wait(280);
      if (cancelled || confettiFiredRef.current || !ref.current) return;
      confettiFiredRef.current = true;
      const rect = ref.current.getBoundingClientRect();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#FFB800"],
        scalar: 0.8,
        ticks: 100,
        gravity: 0.8,
      });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isInView, reduce]);

  const nodeDone = [step >= 1, step >= 3, step >= 5, step >= 7];
  const lineFilled = [step >= 2, step >= 4, step >= 6];

  return (
    <svg ref={ref} viewBox="0 0 400 300" className="h-full w-full">
      <line
        x1={ROADMAP_NODES[0].x}
        y1={150}
        x2={ROADMAP_NODES[3].x}
        y2={150}
        stroke="#0f172a"
        strokeWidth={2}
        strokeDasharray="6 6"
        opacity={0.4}
      />
      {[0, 1, 2].map((i) => (
        <motion.line
          key={`fill-${i}`}
          y1={150}
          y2={150}
          x1={ROADMAP_NODES[i].x}
          initial={{ x2: ROADMAP_NODES[i].x }}
          animate={{
            x2: lineFilled[i] ? ROADMAP_NODES[i + 1].x : ROADMAP_NODES[i].x,
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          stroke="#10b981"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}
      {ROADMAP_NODES.map((node, i) => {
        const done = nodeDone[i];
        return (
          <g key={node.label}>
            <circle
              cx={node.x}
              cy={150}
              r={36}
              fill={done ? "#10b981" : "#fff"}
              stroke="#0f172a"
              strokeWidth={2.5}
            />
            {done ? (
              <motion.path
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                d={`M ${node.x - 13} 150 L ${node.x - 4} 162 L ${node.x + 15} 140`}
                stroke="#fff"
                strokeWidth={4.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <text
                x={node.x}
                y={159}
                textAnchor="middle"
                fontWeight="900"
                fontSize="26"
                fill="#0f172a"
                fontFamily="Space Grotesk, sans-serif"
              >
                {node.label}
              </text>
            )}
            <rect
              x={node.x - 40}
              y={210}
              width={80}
              height={11}
              rx={3}
              fill="#0f172a"
              opacity={done ? 0.4 : 0.15}
            />
          </g>
        );
      })}
    </svg>
  );
}

type ChatPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function MockupEntrevistas() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<ChatPhase>(0);

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      setPhase(6);
      return;
    }
    let cancelled = false;
    const run = async () => {
      await wait(200);
      if (cancelled) return;
      setPhase(1);
      await wait(800);
      if (cancelled) return;
      setPhase(2);
      await wait(700);
      if (cancelled) return;
      setPhase(3);
      await wait(700);
      if (cancelled) return;
      setPhase(4);
      await wait(800);
      if (cancelled) return;
      setPhase(5);
      await wait(600);
      if (cancelled) return;
      setPhase(6);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isInView, reduce]);

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-2">
      {phase >= 1 ? (
        <div className="flex w-[88%] self-start">
          {phase === 1 ? (
            <TypingBubble side="left" />
          ) : (
            <ChatBubble side="left" text="Me conta um projeto seu." />
          )}
        </div>
      ) : null}

      {phase >= 3 ? (
        <div className="flex w-[80%] self-end justify-end">
          {phase === 3 ? (
            <TypingBubble side="right" />
          ) : (
            <ChatBubble
              side="right"
              text="Fiz um TODO list em React seguindo tutorial..."
            />
          )}
        </div>
      ) : null}

      {phase >= 5 ? (
        <div className="flex w-[92%] self-start">
          {phase === 5 ? (
            <TypingBubble side="left" />
          ) : (
            <ChatBubble
              side="left"
              text="Tenta: &ldquo;Construí app em React aplicando hooks na prática.&rdquo;"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChatBubble({ side, text }: { side: "left" | "right"; text: string }) {
  const isAI = side === "left";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl border-2 border-slate-950 px-3 py-2 shadow-[2px_2px_0_#0f172a] ${
        isAI ? "bg-white" : "bg-amber-100"
      }`}
    >
      <p className="text-xs md:text-sm font-bold leading-snug text-slate-900">
        {text}
      </p>
    </motion.div>
  );
}

function TypingBubble({ side }: { side: "left" | "right" }) {
  const isAI = side === "left";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1 rounded-2xl border-2 border-slate-950 px-3 py-2.5 shadow-[2px_2px_0_#0f172a] ${
        isAI ? "bg-white" : "bg-amber-100"
      }`}
    >
      <span className="ai-chat-typing-dot h-1.5 w-1.5 rounded-full bg-slate-700" />
      <span className="ai-chat-typing-dot h-1.5 w-1.5 rounded-full bg-slate-700" />
      <span className="ai-chat-typing-dot h-1.5 w-1.5 rounded-full bg-slate-700" />
    </motion.div>
  );
}

function ExtraFeaturesSection() {
  return (
    <section
      aria-labelledby="extras-title"
      className="relative bg-[#faf8f4] pb-20 md:pb-28"
    >
      <div className="container">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
          <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
          <p
            id="extras-title"
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-500"
          >
            E tem mais...
          </p>
          <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {extraFeatures.map((feature, idx) => (
            <ExtraFeatureCard
              key={feature.number}
              feature={feature}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExtraFeatureCard({
  feature,
  index,
}: {
  feature: ProFeature;
  index: number;
}) {
  const tokens = COLOR_TOKENS[feature.color];
  const Icon = PRO_FEATURE_ICONS[feature.iconName];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="relative flex flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
    >
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 ${tokens.bgIcon}`}
        >
          <Icon
            size={20}
            className={tokens.textIcon}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </div>
        {feature.badge ? (
          <span className="inline-flex items-center rounded-full border-2 border-slate-950 bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950">
            {feature.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-base font-black text-slate-950">
        {feature.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-700">
        {feature.description}
      </p>
    </motion.article>
  );
}

function FreeVsProSection() {
  return (
    <section
      aria-labelledby="free-vs-pro-title"
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        backgroundColor: "#f5f3ff",
        backgroundImage:
          "radial-gradient(rgba(124, 58, 237, 0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-violet-700"
          >
            Antes de decidir
          </motion.p>
          <motion.h2
            id="free-vs-pro-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black leading-[1.05] text-slate-950"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            Você já tem muito <span className="text-violet-700">de graça</span>{" "}
            aqui.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base md:text-lg font-medium text-slate-700"
          >
            O Pro acelera. Mas a base é sólida, e gratuita.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <h3 className="font-display text-xl md:text-2xl font-black text-slate-950">
            O que você já tem sem pagar nada:
          </h3>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_ITEMS.map((item, idx) => (
              <FreeItemRow key={item.text} item={item} index={idx} />
            ))}
          </ul>
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-base font-bold text-slate-700">
          Grátis: a base acima. Pro: as 8 ferramentas com IA pra acelerar.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            href="/"
            className="bnt-pressable inline-flex items-center justify-center rounded-full border-2 border-slate-950 bg-white px-7 py-3.5 font-display text-base font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
          >
            Continuar com o básico
          </Link>
        </div>
      </div>
    </section>
  );
}

function FreeItemRow({
  item,
  index,
}: {
  item: { icon: LucideIcon; text: string };
  index: number;
}) {
  const Icon = item.icon;
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 shadow-[3px_3px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a]"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-emerald-100">
        <Icon
          size={16}
          className="text-emerald-700"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </span>
      <span className="text-sm font-bold text-slate-900">{item.text}</span>
    </motion.li>
  );
}

interface PlansSectionProps {
  plans: typeof plans;
  selectedPlan: string;
  onSelectPlan: (id: string) => void;
  discountPercent: number;
  affiliateCode: string | null;
  loading: boolean;
  onSubscribe: () => void;
  discountedPrice: (price: number) => number;
  hasCoupon: boolean;
}

function PlansSection({
  plans,
  selectedPlan,
  onSelectPlan,
  discountPercent,
  loading,
  onSubscribe,
  discountedPrice,
  hasCoupon,
  affiliateCode,
}: PlansSectionProps) {
  return (
    <section
      id="planos-section"
      aria-labelledby="planos-title"
      className="relative bg-white py-20 md:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-700">
            Escolha seu plano
          </p>
          <h2
            id="planos-title"
            className="mt-4 font-display font-black leading-[1.05] text-slate-950"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            3 opções.{" "}
            <span className="text-amber-600">Mesmas ferramentas.</span>
          </h2>
        </div>

        {hasCoupon ? (
          <div className="mx-auto mt-8 inline-flex w-full max-w-xl items-center justify-center gap-2 rounded-full border-2 border-emerald-700 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">
            <Check size={16} strokeWidth={3} aria-hidden="true" />
            <span>
              Desconto de {discountPercent}% já aplicado nos preços abaixo ·
              Cupom {affiliateCode}
            </span>
          </div>
        ) : null}

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const selected = selectedPlan === plan.id;
            const finalPrice = discountedPrice(plan.price);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
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
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onSubscribe}
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
            href="/"
            className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-800 hover:decoration-slate-800"
          >
            Continuar com o básico (grátis)
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({
  loading,
  onSubscribe,
}: {
  loading: boolean;
  onSubscribe: () => void;
}) {
  const stars = [
    { top: "20%", left: "12%", size: 6, delay: 0, duration: 3 },
    { top: "15%", left: "85%", size: 5, delay: 0.6, duration: 2.8 },
    { top: "70%", left: "8%", size: 7, delay: 1.4, duration: 3.2 },
    { top: "75%", left: "90%", size: 6, delay: 0.3, duration: 2.6 },
    { top: "40%", left: "50%", size: 4, delay: 2, duration: 3.4 },
    { top: "60%", left: "70%", size: 5, delay: 1.1, duration: 3 },
  ];

  return (
    <section
      aria-labelledby="final-cta-title"
      className="relative overflow-hidden bg-slate-950 py-32 md:py-40"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,184,0,0.18), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {stars.map((s, idx) => (
          <span
            key={idx}
            className="animate-twinkle absolute rounded-full bg-amber-300"
            style={
              {
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                boxShadow: `0 0 ${s.size * 3}px ${s.size * 1.2}px rgba(255, 184, 0, 0.7)`,
                ["--twinkle-delay" as string]: `${s.delay}s`,
                ["--twinkle-duration" as string]: `${s.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            id="final-cta-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display font-black leading-[1.05] text-white"
            style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
          >
            Pronto pra parar de{" "}
            <span className="text-amber-400">pesquisar</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-xl text-base md:text-lg font-medium text-slate-300"
          >
            Assine o Pro e comece a usar as 8 ferramentas hoje.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <button
              type="button"
              onClick={onSubscribe}
              disabled={loading}
              className="pro-glare bnt-pressable group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-display text-base md:text-lg font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#0f172a] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[5px_5px_0_#0f172a]"
            >
              <ProStarIcon />
              <span>{loading ? "Abrindo checkout..." : "Quero o Pro"}</span>
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <p className="text-xs md:text-sm font-medium text-slate-400">
              Cancele quando quiser · Sem taxa · Suporte por e-mail
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
