import { CheckCircle, ClipboardList, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("amber");

const resumePreparation = [
  "Cole o currículo em texto, mesmo que ele venha de um PDF.",
  "Inclua links de GitHub, LinkedIn, portfólio e projetos publicados.",
  "Se tiver uma vaga alvo, cole a descrição completa para comparar palavras-chave.",
  "Não coloque CPF, RG, endereço completo ou dados sensíveis.",
];

const resumeSections = [
  { title: "Resumo profissional", desc: "Mostra área, nível, tecnologias principais e objetivo com clareza." },
  { title: "Projetos", desc: "Explica problema, tecnologias, sua contribuição e link para código ou demo." },
  { title: "Experiências", desc: "Valoriza estágio, freelas, voluntariado, suporte, estudos e transição de carreira." },
  { title: "Palavras-chave", desc: "Ajusta termos que recrutadores e ATS procuram na vaga." },
];

export default function CurriculoAnalisar() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="recurso com IA"
        title="Analisador de currículo com IA"
        subtitle="Receba nota, lacunas, palavras-chave e melhorias por seção — no padrão de quem quer aparecer bem em processos seletivos."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl border-2 border-slate-900 bg-amber-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">O que a IA vai revisar</h2>
                <p className="mt-1 text-sm text-slate-600">A análise olha clareza, compatibilidade com vaga, palavras-chave, ordem das seções e força dos projetos.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {resumeSections.map((section) => (
                <div key={section.title} className="rounded-2xl border-2 border-violet-100 bg-violet-50 p-4">
                  <CheckCircle className="mb-2 h-5 w-5 text-violet-700" />
                  <h3 className="font-display text-lg font-black text-slate-950">{section.title}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-600">{section.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-brutal rounded-2xl bg-amber-50 p-6">
            <ClipboardList className="mb-3 h-7 w-7 text-violet-700" />
            <h2 className="font-display text-2xl font-black text-slate-950">Antes de analisar</h2>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
              {resumePreparation.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!isPro ? (
          <ProGate description="Cole seu currículo e uma vaga alvo para receber compatibilidade, melhorias priorizadas e sugestões por seção." />
        ) : (
          <AiToolPanel
            endpoint="resume-review"
            title="Analisar currículo"
            description="Cole seu currículo e, se quiser, uma vaga alvo. A IA devolve uma revisão prática para melhorar sua candidatura."
            buttonLabel="Analisar meu currículo"
            fields={[
              { name: "resume", label: "Texto do currículo", type: "textarea", placeholder: "Cole aqui o texto do seu currículo, incluindo projetos, experiências, formação, habilidades e links." },
              { name: "job", label: "Descrição da vaga alvo", type: "textarea", placeholder: "Opcional: cole a vaga para receber análise de compatibilidade e palavras-chave faltantes." },
              { name: "area", label: "Área desejada", type: "select", options: ["Front-end", "Back-end", "Dados", "UX/UI", "QA", "DevOps", "Produto", "Mobile"] },
              { name: "level", label: "Nível buscado", type: "select", options: ["Estágio", "Trainee", "Júnior", "Transição de carreira", "Freelancer"] },
            ]}
          />
        )}
        </div>
      </section>
    </Layout>
  );
}
