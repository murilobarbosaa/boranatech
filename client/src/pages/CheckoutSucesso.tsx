import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Clock, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { fireProCelebration } from "@/lib/proConfetti";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { clearStoredAffiliate } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { greet } from "@shared/greeting";

export default function CheckoutSucesso() {
  const { isPro, loading, refreshSubscription, subscription } =
    useSubscription();
  const { profile } = useAuth();
  const [checking, setChecking] = useState(true);
  const [processed, setProcessed] = useState(false);

  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);
  const affiliateConsumedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    async function checkSubscription() {
      setChecking(true);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await refreshSubscription();
        if (cancelled) return;

        if (attempt < 2) {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 3000);
            timers.push(timer);
          });
        }
      }

      if (!cancelled) {
        setChecking(false);
        setProcessed(true);
      }
    }

    void checkSubscription();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [refreshSubscription]);

  const planName =
    typeof subscription === "object" && subscription && "plans" in subscription
      ? ((subscription as { plans?: { name?: string | null } | null }).plans
          ?.name ?? "Plano Pro")
      : "Plano Pro";

  const isLoadingScreen = checking || loading;
  const showSuccess = isPro;
  const showProcessing = processed && !isPro;

  // Confetti: dispara uma unica vez quando a tela de sucesso aparece.
  // Sequencia de bursts ao longo de ~2s (estilo festao), centrada no topo do card.
  // Mantem as guardas: so dispara 1x, respeita reduced-motion, e para no cleanup.
  useEffect(() => {
    if (isLoadingScreen || !showSuccess || reduce || confettiFiredRef.current)
      return;
    confettiFiredRef.current = true;

    const rect = cardRef.current?.getBoundingClientRect();
    const centerX = rect
      ? (rect.left + rect.width / 2) / window.innerWidth
      : 0.5;
    const baseY = rect ? (rect.top + 96) / window.innerHeight : 0.3;

    return fireProCelebration({ x: centerX, y: baseY });
  }, [isLoadingScreen, showSuccess, reduce]);

  // Consome o cupom de afiliado uma unica vez quando a conversao confirma (isPro).
  // Guarda via ref para nao remover de novo em re-render. Nao mexe no carimbo
  // subscriptions.affiliate_code, que e o registro de comissao no servidor.
  useEffect(() => {
    if (!isPro || affiliateConsumedRef.current) return;
    affiliateConsumedRef.current = true;
    clearStoredAffiliate();
  }, [isPro]);

  const fadeSlideUp = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  return (
    <Layout>
      <SEO
        title="Pagamento confirmado · Bora na Tech? Pro"
        url="/planos/sucesso"
        noindex
      />
      <section className="relative overflow-hidden bg-[radial-gradient(125%_125%_at_50%_10%,#fdfbf7_0%,#faf8f4_55%,#f6f2ea_100%)] py-16">
        {/* Camada decorativa: glow + blobs atras do card. Nao captura cliques,
            fica atras do conteudo (z-0), e flutua reusando .animate-gentle-float
            (que ja respeita prefers-reduced-motion no index.css). */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          {/* Glow amarelo central, atras do card. Intensidade sutilmente maior no sucesso. */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) scale(${showSuccess ? 1.15 : 1})`,
              transition: "transform 600ms ease",
            }}
          >
            <div
              className="animate-gentle-float h-[28rem] w-[28rem] rounded-full bg-[#FFB800] blur-[120px]"
              style={{
                opacity: showSuccess ? 0.26 : 0.18,
                transition: "opacity 600ms ease",
              }}
            />
          </div>

          {/* Blobs de profundidade, saindo das bordas, bem desfocados e discretos. */}
          <div
            className="animate-gentle-float absolute -left-16 top-12 h-64 w-64 rounded-full bg-[#10b981] opacity-[0.12] blur-[90px]"
            style={{ animationDelay: "-1.5s", animationDuration: "5s" }}
          />
          <div
            className="animate-gentle-float absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#FFB800] opacity-[0.12] blur-[100px]"
            style={{ animationDelay: "-3s", animationDuration: "6s" }}
          />
          <div
            className="animate-gentle-float absolute right-1/4 -top-10 h-40 w-40 rounded-full bg-[#0f172a] opacity-[0.06] blur-[80px]"
            style={{ animationDelay: "-0.8s", animationDuration: "5.5s" }}
          />
        </div>

        <div className="container relative z-10">
          <motion.div
            ref={cardRef}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#1a1a1a] bg-white p-8 text-center shadow-[6px_6px_0_#0f172a]"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] shadow-[4px_4px_0_#0f172a]">
              {isLoadingScreen ? (
                <Loader2
                  className={`h-12 w-12 text-[#1a1a1a] ${reduce ? "" : "animate-spin"}`}
                />
              ) : showProcessing ? (
                <motion.span
                  animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-flex"
                >
                  <Clock className="h-12 w-12 text-[#1a1a1a]" />
                </motion.span>
              ) : (
                <motion.span
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 16,
                    delay: 0.1,
                  }}
                  className="inline-flex"
                >
                  <Check className="h-12 w-12 text-[#1a1a1a]" strokeWidth={3} />
                </motion.span>
              )}
            </div>

            {isLoadingScreen ? (
              <motion.div key="loading" {...fadeSlideUp}>
                <h1 className="font-display mt-8 text-4xl font-black text-[#1a1a1a]">
                  Quase lá...
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-relaxed text-slate-600">
                  Estamos confirmando seu pagamento. Leva só alguns segundos.
                </p>
                <div className="mx-auto mt-6 h-3 max-w-sm overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-[#faf8f4]">
                  {reduce ? (
                    <div className="h-full w-2/3 rounded-full bg-[#FFB800]" />
                  ) : (
                    <div className="animate-progress-indeterminate h-full w-1/3 rounded-full bg-[#FFB800]" />
                  )}
                </div>
              </motion.div>
            ) : showSuccess ? (
              <motion.div key="success" {...fadeSlideUp}>
                <h1 className="font-display mt-8 inline-flex items-center justify-center gap-2 text-4xl font-black text-[#1a1a1a]">
                  {greet(profile?.gender)}, Pro!
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -35 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 14,
                      delay: 0.35,
                    }}
                    className="inline-flex"
                  >
                    <ProStarIcon className="h-7 w-7 [&>svg]:h-5 [&>svg]:w-5" />
                  </motion.span>
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-semibold leading-relaxed text-slate-600">
                  Sua assinatura {planName} está ativa. Bora explorar tudo que o
                  Pro libera na sua jornada tech.
                </p>
                <Link
                  href="/perfil"
                  className="mt-8 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
                >
                  Começar agora
                </Link>
              </motion.div>
            ) : (
              <motion.div key="processing" {...fadeSlideUp}>
                <h1 className="font-display mt-8 text-4xl font-black text-[#1a1a1a]">
                  Tá quase!
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-semibold leading-relaxed text-slate-600">
                  Seu pagamento está sendo processado. Assim que confirmar, o
                  Pro libera automaticamente. Você também recebe um e-mail.
                </p>
                <Link
                  href="/perfil"
                  className="mt-8 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
                >
                  Ir para o perfil
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
