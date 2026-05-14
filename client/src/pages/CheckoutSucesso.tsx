import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Clock } from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ProStarIcon } from "@/components/pro/ProStarIcon";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function CheckoutSucesso() {
  const { isPro, loading, refreshSubscription, subscription } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [processed, setProcessed] = useState(false);

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
      ? ((subscription as { plans?: { name?: string | null } | null }).plans?.name ?? "Plano Pro")
      : "Plano Pro";

  const showSuccess = isPro;
  const showProcessing = processed && !isPro;

  return (
    <Layout>
      <SEO title="Pagamento confirmado — Bora na Tech? Pro" url="/pro/sucesso" noindex />
      <section className="bg-[#faf8f4] py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#1a1a1a] bg-white p-8 text-center shadow-[6px_6px_0_#0f172a]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] shadow-[4px_4px_0_#0f172a]">
              {showProcessing ? <Clock className="h-12 w-12 text-[#1a1a1a]" /> : <Check className="h-12 w-12 text-[#1a1a1a]" />}
            </div>

            {checking || loading ? (
              <>
                <h1 className="font-display mt-8 text-4xl font-black text-[#1a1a1a]">Confirmando seu pagamento...</h1>
                <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-relaxed text-slate-600">
                  Estamos atualizando sua assinatura. Isso pode levar alguns segundos.
                </p>
                <div className="mx-auto mt-6 h-3 max-w-sm overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-[#faf8f4]">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#FFB800]" />
                </div>
              </>
            ) : showSuccess ? (
              <>
                <h1 className="font-display mt-8 inline-flex items-center justify-center gap-2 text-4xl font-black text-[#1a1a1a]">
                  Bem-vindo ao Pro!
                  <ProStarIcon className="h-7 w-7 [&>svg]:h-5 [&>svg]:w-5" />
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-semibold leading-relaxed text-slate-600">
                  Sua assinatura {planName} está ativa. Agora você pode acessar todos os recursos Pro da Bora na Tech?.
                </p>
                <Link href="/perfil" className="mt-8 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a]">
                  Acessar minha conta
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display mt-8 text-4xl font-black text-[#1a1a1a]">Pagamento em processamento</h1>
                <p className="mx-auto mt-3 max-w-lg text-base font-semibold leading-relaxed text-slate-600">
                  Seu pagamento está sendo processado. Você receberá um e-mail de confirmação em breve.
                </p>
                <Link href="/perfil" className="mt-8 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a]">
                  Ir para o perfil
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
