import { useState } from "react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiChatPanel from "@/components/shared/AiChatPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { studyTechniques } from "@/lib/careerToolsData";
import { technologies } from "@/lib/technologyData";

const ac = getPageAccentUi("amber");

export default function Estudos() {
  const { isPro } = useSubscription();
  const [tech, setTech] = useState("React");
  const [hours, setHours] = useState(2);
  const difficulty = technologies.find((item) => item.name === tech)?.difficultyScore ?? 3;
  const estimate = Math.max(3, Math.round((difficulty * 8) / hours));

  return (
    <Layout>
      <PageHero accent="amber" eyebrow="estudar melhor" title="Planos de Estudo" subtitle="Estudar com plano rende mais do que estudar muito." />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base font-semibold leading-relaxed text-slate-700">
              Monte seu plano de estudos com a mentora de IA. Você conta sua área, nível, tempo disponível e objetivo, e ela devolve um cronograma semanal com marcos e recursos, ajustável quando precisar.
            </p>
          </div>
          {!isPro ? (
            <ProGate description="Converse com a mentora e receba um plano de estudos sob medida: cronograma por semana, marcos e recursos para o seu nível, tempo e objetivo." />
          ) : (
            <AiChatPanel
              endpoint="study-plan"
              title="Plano de estudos com a mentora"
              description="Me conta sua área, nível, tempo e objetivo, e eu monto seu cronograma semanal."
              initialAssistantMessage={`Oi! Fico feliz que você veio até aqui.

              Me conta com calma: qual área da tech está te puxando mais agora (tipo front, back, dados, mobile…) e, em poucas palavras, o que você quer conquistar com esse estudo? Pode mandar do seu jeito, sem pressa.`}
            />
          )}
          <div className="card-brutal rounded-2xl bg-white p-6">
            <h2 className="font-display text-2xl font-black">Calculadora de tempo para aprender</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="font-black">
                Quero aprender
                <select className={cn("mt-1 w-full rounded-xl border-2 p-3", ac.input)} value={tech} onChange={(event) => setTech(event.target.value)}>
                  {technologies.map((item) => (
                    <option key={item.slug}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="font-black">
                Vou estudar {hours}h por dia
                <input type="range" min="1" max="8" value={hours} onChange={(event) => setHours(Number(event.target.value))} className="mt-4 w-full" />
              </label>
            </div>
            <p className={cn("mt-5 rounded-2xl p-5 font-display text-xl font-black", ac.panelSoft, ac.tbodyAccent)}>
              Com cerca de {hours}h por dia, uma base inicial em {tech} leva em torno de {estimate} semanas. É uma estimativa pra te dar um norte, não uma régua.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {studyTechniques.map((item) => (
              <article key={item.title} className="card-brutal rounded-2xl bg-white p-5">
                <h3 className="font-display text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
