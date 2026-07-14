import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import InterviewBackdrop from "@/components/interview/InterviewBackdrop";
import InterviewIntake from "@/components/interview/InterviewIntake";
import InterviewIntro from "@/components/interview/InterviewIntro";
import SessionGallery from "@/components/interview/SessionGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

// Pagina principal das Entrevistas no molde Pro (PortfolioAnalisar): a arena
// e a pagina inteira (cenario vivo, header integrado, timeline + vitrine,
// palco de intake, galeria de sessoes). O guia e os bancos sairam daqui na
// E3.1 (rotas proprias seguem vivas). Accent unico blue.
const ac = getPageAccentUi("blue");

export default function Entrevistas() {
  const { isPro, loading } = useSubscription();
  const { user } = useAuth();
  const reduce = useReducedMotion() ?? false;
  const intakeRef = useRef<HTMLDivElement>(null);
  // A intro (timeline + vitrine) e o estado de ENTRADA: some enquanto uma
  // sessao esta sendo criada, como no molde.
  const [creatingSession, setCreatingSession] = useState(false);

  function scrollToIntake() {
    intakeRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
  }

  return (
    <Layout>
      {/* TODO(Ana): validar title e a nova description focada no treino
          (o guia e os bancos sairam desta pagina). */}
      <SEO
        title="Entrevistas em tech · Guia e treino com IA"
        description="Treine entrevistas com IA: perguntas calibradas pela vaga ou pela sua área, feedback a cada resposta e um veredito de preparo."
        url="/entrevistas"
      />

      {/* Arena: cenario do molde e a secao inteira (cream + micro-pontilhado),
          com o backdrop vivo por tras de tudo. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <InterviewBackdrop reduce={reduce} />
        <div className="container relative z-10">
          {/* Cabecalho integrado, sem PageHero. O slot universal superior
              esquerdo de "voltar" fica VAZIO no estado de entrada, replicando
              o precedente do Portfolio (la ele so aparece no resultado, como
              Nova analise); esta pagina so tem estado de entrada. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10"
          >
            <p>
              {/* TODO(Ana): revisar o selo da arena. */}
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-blue-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                Treino Pro
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
                <Mic className="h-8 w-8" />
              </span>
              {/* TODO(Ana): validar copy do hero da pagina unificada */}
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Entrevistas em Tech
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              Entenda o processo seletivo e treine com IA até chegar preparado
              na conversa de verdade.
            </p>
          </motion.div>

          <div className="space-y-10">
            {!creatingSession ? <InterviewIntro /> : null}

            <div
              ref={intakeRef}
              className={!creatingSession ? "mt-14 sm:mt-16" : undefined}
            >
              {!isPro && !loading ? (
                <ProGate feature="interview" description="Treine entrevistas com IA: perguntas calibradas pela vaga ou pela sua área, feedback honesto a cada resposta e um veredito final de preparo." />
              ) : isPro ? (
                <InterviewIntake onCreatingChange={setCreatingSession} />
              ) : null}
            </div>

            {user ? <SessionGallery onEmptyCta={scrollToIntake} /> : null}
          </div>
        </div>
      </section>

    </Layout>
  );
}
