import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { communityMap, networkingGuide } from "@/lib/careerToolsData";

const ac = getPageAccentUi("teal");

export default function Networking() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      <PageHero
        accent="teal"
        eyebrow="relacionamentos úteis"
        title="Networking em Tech"
        subtitle="Construa conexões que abrem portas."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
        {!isPro ? <ProGate description="Gere mensagens personalizadas para recrutadores, devs sênior, pessoas que admira e pedidos de indicação." /> : (
          <AiToolPanel endpoint="networking-message" title="Gerador de mensagem de networking com IA" description="Receba três versões: direta, descontraída e formal." fields={[{ name: "contactType", label: "Tipo de contato" }, { name: "name", label: "Nome e cargo da pessoa" }, { name: "company", label: "Empresa da pessoa" }, { name: "goal", label: "Objetivo da mensagem" }, { name: "about", label: "Uma linha sobre você" }]} />
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {networkingGuide.map((item) => (
            <DetailsChevronOnly key={item} className="card-brutal rounded-2xl bg-white p-5" title={<span className="font-display text-xl font-black">{item}</span>}>
              <p className="mt-3 text-sm text-slate-600">Seja específico, respeitoso e deixe claro que você valoriza o tempo da outra pessoa.</p>
            </DetailsChevronOnly>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{communityMap.map((area) => <article key={area.area} className="card-brutal rounded-2xl bg-white p-5"><h3 className="font-display text-xl font-black">{area.area}</h3><ul className="mt-3 space-y-2 text-sm text-slate-700">{area.links.map((link) => <li key={link}>• {link}</li>)}</ul></article>)}</div>
        </div>
      </section>
    </Layout>
  );
}
