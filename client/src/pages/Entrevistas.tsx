import { Link } from "wouter";
import Layout from "@/components/Layout";
import { AiCtaLink } from "@/components/shared/AiCta";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { interviewSteps } from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

export default function Entrevistas() {
  return (
    <Layout>
      <PageHero
        accent="blue"
        eyebrow="do currículo à proposta"
        title="Processo Seletivo em Tech"
        subtitle="Tudo que você precisa saber para passar nas entrevistas."
        actions={
          <AiCtaLink href="/entrevistas/simulador" description="Treine respostas com feedback" accent="blue" className="w-full">
            Simulador com IA
          </AiCtaLink>
        }
      />
      <section className={cn("sticky top-16 z-40 border-b-2 py-4", ac.stickyBar)}>
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
      </section>
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-5 md:grid-cols-2">
            {interviewSteps.map((step, index) => (
              <DetailsChevronOnly
                key={step.title}
                className="card-brutal rounded-2xl bg-white p-5"
                title={<span className="font-display text-xl font-black">{index + 1}. {step.title}</span>}
              >
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p><strong>O que avaliam:</strong> {step.evaluate}</p>
                  <p><strong>Como se preparar:</strong> {step.prepare}</p>
                  <p><strong>Erro comum:</strong> {step.mistakes}</p>
                  <p><strong>Dica prática:</strong> {step.tip}</p>
                </div>
              </DetailsChevronOnly>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
