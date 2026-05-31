import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";

export default function EntrevistaSimulador() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      <PageHero
        title="Simulador de Entrevista com IA"
        subtitle="Pratique uma entrevista e receba um relatório com pontos fortes e melhorias."
        accent="blue"
      />
      <section className="container py-12">
        {!isPro ? (
          <ProGate description="Simule entrevistas técnicas ou comportamentais com perguntas em sequência, feedback por resposta, nota geral e sugestões específicas." />
        ) : (
          <div className="rounded-3xl border-2 border-slate-900 bg-slate-950 p-4 shadow-[6px_6px_0_#7c3aed]">
            <AiToolPanel
              endpoint="interview"
              accent="blue"
              title="Configurar entrevista"
              description="Escolha área, nível e tipo. A IA retornará perguntas e feedback em formato de conversa."
              fields={[
                {
                  name: "area",
                  label: "Área",
                  type: "select",
                  options: [
                    "Front-end",
                    "Back-end",
                    "Dados",
                    "UX/UI",
                    "DevOps",
                  ],
                },
                {
                  name: "level",
                  label: "Nível",
                  type: "select",
                  options: ["Estágio", "Trainee", "Júnior", "Pleno"],
                },
                {
                  name: "kind",
                  label: "Tipo",
                  type: "select",
                  options: ["Técnica", "Comportamental"],
                },
                {
                  name: "job",
                  label: "Descrição da vaga (opcional)",
                  type: "textarea",
                  placeholder: "Cole a vaga aqui",
                },
              ]}
              buttonLabel="Iniciar simulação"
            />
          </div>
        )}
      </section>
    </Layout>
  );
}
