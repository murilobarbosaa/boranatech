import { useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Mic } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import InterviewBackdrop from "@/components/interview/InterviewBackdrop";
import InterviewIntake from "@/components/interview/InterviewIntake";
import InterviewIntro from "@/components/interview/InterviewIntro";
import SessionGallery from "@/components/interview/SessionGallery";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import SectionLabel from "@/components/shared/SectionLabel";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { interviewSteps } from "@/lib/careerToolsData";

// Pagina principal das Entrevistas no molde Pro (PortfolioAnalisar): arena
// primeiro (cenario vivo, header integrado, timeline + vitrine, palco de
// intake, galeria de sessoes) e a BIBLIOTECA (guia + bancos, conteudo
// intocado) abaixo, na mesma URL. Accent unico blue.
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
      {/* TODO(Ana): validar title e description da pagina unificada */}
      <SEO
        title="Entrevistas em tech · Guia e treino com IA"
        description="Guia do processo seletivo em tecnologia e treino de entrevista com IA: perguntas calibradas pela vaga ou pela sua área, com feedback a cada resposta."
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
                <ProGate description="Treine entrevistas com IA: perguntas calibradas pela vaga ou pela sua área, feedback honesto a cada resposta e um veredito final de preparo." />
              ) : isPro ? (
                <InterviewIntake onCreatingChange={setCreatingSession} />
              ) : null}
            </div>

            {user ? <SessionGallery onEmptyCta={scrollToIntake} /> : null}
          </div>
        </div>
      </section>

      {/* BIBLIOTECA: guia do processo e bancos, conteudo INTOCADO (copy da
          Ana), apenas movidos pra baixo da arena. */}
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <SectionLabel icon={BookOpen} ac={ac}>
            {/* TODO(Ana): rotulo de transicao da biblioteca. */}
            Biblioteca da entrevista
          </SectionLabel>
        </div>
        <div
          className={cn("sticky top-16 z-40 mt-4 border-b-2 py-4", ac.stickyBar)}
        >
          <div className="container flex flex-wrap items-center gap-3">
            <Link
              href="/entrevistas/perguntas"
              className={cn(
                "rounded-full border-2 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all",
                ac.panelBorder,
                "hover:border-blue-500",
              )}
            >
              Banco de perguntas
            </Link>
            <Link
              href="/entrevistas/desafios"
              className={cn(
                "rounded-full border-2 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[2px_2px_0_#0f172a] transition-all",
                ac.panelBorder,
                "hover:border-blue-500",
              )}
            >
              Desafios técnicos
            </Link>
          </div>
        </div>
        <div className="container mt-8">
          <div className="grid gap-5 md:grid-cols-2">
            {interviewSteps.map((step, index) => (
              <DetailsChevronOnly
                key={step.title}
                className="card-brutal rounded-2xl bg-white p-5"
                title={
                  <span className="font-display text-xl font-black">
                    {index + 1}. {step.title}
                  </span>
                }
              >
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <strong>O que avaliam:</strong> {step.evaluate}
                  </p>
                  <p>
                    <strong>Como se preparar:</strong> {step.prepare}
                  </p>
                  <p>
                    <strong>Erro comum:</strong> {step.mistakes}
                  </p>
                  <p>
                    <strong>Dica prática:</strong> {step.tip}
                  </p>
                </div>
              </DetailsChevronOnly>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
