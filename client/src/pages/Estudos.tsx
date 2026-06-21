import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import EstudosWorkspace from "@/components/estudos/EstudosWorkspace";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("amber");

export default function Estudos() {
  const { isPro } = useSubscription();

  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="estudar melhor"
        title="Planos de Estudo"
        subtitle="Pare de estudar no escuro. Um plano sob medida para a sua rotina, semana a semana, até a sua primeira vaga."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base font-semibold leading-relaxed text-slate-700">
              Monte seu plano de estudos com o Natechinho, o mentor de estudos
              do BoraNaTech. Você conta sua área, nível, tempo disponível e
              objetivo, e ele devolve um cronograma semanal com marcos e
              recursos, ajustável quando precisar.
            </p>
          </div>
          {!isPro ? (
            <ProGate description="Converse com o Natechinho e receba um plano de estudos sob medida: cronograma por semana, marcos e recursos para o seu nível, tempo e objetivo." />
          ) : (
            <EstudosWorkspace />
          )}
        </div>
      </section>
    </Layout>
  );
}
