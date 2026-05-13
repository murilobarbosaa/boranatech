import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("violet");

export default function PortfolioAnalisar() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      <PageHero
        accent="blue"
        eyebrow="revisão com IA"
        title="Analisador de GitHub com IA"
        subtitle="Receba nota, análise dos READMEs, diversidade de tecnologias e melhorias prioritárias."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
        {!isPro ? <ProGate description="A IA analisa seu perfil GitHub público e indica se ele está pronto para vagas de estágio, trainee, júnior ou pleno." /> : (
          <AiToolPanel endpoint="github-review" accent="blue" title="Analisar GitHub" description="Cole a URL do seu perfil ou repositório público." fields={[{ name: "githubUrl", label: "URL do GitHub", placeholder: "https://github.com/seuusuario" }, { name: "target", label: "Vaga ou nível alvo", placeholder: "Front-end Trainee/Júnior" }]} />
        )}
        </div>
      </section>
    </Layout>
  );
}
