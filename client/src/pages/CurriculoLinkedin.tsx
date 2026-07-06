import { CheckCircle, Search, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("blue");

const linkedinTargets = [
  {
    title: "Headline",
    desc: "Troca títulos genéricos por uma frase buscável, com área, stack e objetivo.",
  },
  {
    title: "Sobre",
    desc: "Organiza sua história em poucos parágrafos, com contexto, aprendizado e foco profissional.",
  },
  {
    title: "Projetos em destaque",
    desc: "Ajuda a escolher quais links colocar e como descrever o que você construiu.",
  },
  {
    title: "Palavras-chave",
    desc: "Sugere termos que recrutadores usam para encontrar perfis de estágio, trainee e júnior.",
  },
];

const profileChecklist = [
  "Título atual do perfil",
  "Texto da seção Sobre",
  "Área que você quer seguir",
  "Tecnologias que está estudando",
  "Projetos ou links principais",
  "Tipo de oportunidade buscada",
];

export default function CurriculoLinkedin() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Otimizador de LinkedIn com IA"
        description="Otimize seu LinkedIn com IA: melhore headline, seção Sobre, palavras-chave e visibilidade para ser encontrado pelos recrutadores de tecnologia."
        url="/curriculo/linkedin"
      />
      <PageHero
        accent="blue"
        eyebrow="recurso com IA"
        title="Otimizador de LinkedIn com IA"
        subtitle="Melhore headline, seção Sobre, palavras-chave e visibilidade para recrutadores."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2">
              <div className="mb-5 flex items-start gap-3">
                <span className="rounded-xl border-2 border-slate-900 bg-blue-100 p-3 text-blue-700 shadow-[3px_3px_0_#0f172a]">
                  <Search className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-950">
                    O que será otimizado
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    A ideia é fazer seu perfil ser encontrado e entendido
                    rapidamente por recrutadores.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {linkedinTargets.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-4"
                  >
                    <CheckCircle className="mb-2 h-5 w-5 text-blue-700" />
                    <h3 className="font-display text-lg font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-brutal rounded-2xl bg-amber-50 p-6">
              <Sparkles className="mb-3 h-7 w-7 text-violet-700" />
              <h2 className="font-display text-2xl font-black text-slate-950">
                O que colar
              </h2>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
                {profileChecklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!isPro ? (
            <ProGate description="A IA revisa seu perfil em texto e cria sugestões para headline, Sobre e visibilidade para recrutadores." />
          ) : (
            <AiToolPanel
              endpoint="linkedin-optimizer"
              accent="blue"
              title="Otimizar LinkedIn"
              description="Cole seu perfil em texto e informe área, nível e objetivo. A IA sugere versões melhores e palavras-chave."
              buttonLabel="Otimizar meu LinkedIn"
              fields={[
                {
                  name: "profile",
                  label: "Perfil LinkedIn em texto",
                  type: "textarea",
                  placeholder:
                    "Cole headline, Sobre, experiências, projetos, cursos e habilidades atuais.",
                },
                {
                  name: "area",
                  label: "Área de interesse",
                  type: "select",
                  options: [
                    "Front-end",
                    "Back-end",
                    "Dados",
                    "UX/UI",
                    "QA",
                    "DevOps",
                    "Produto",
                    "Mobile",
                  ],
                },
                {
                  name: "level",
                  label: "Nível",
                  type: "select",
                  options: [
                    "Estágio",
                    "Trainee",
                    "Júnior",
                    "Transição de carreira",
                    "Freelancer",
                  ],
                },
                {
                  name: "goal",
                  label: "Objetivo",
                  placeholder:
                    "Ex: conseguir estágio remoto em front-end, entrar em QA, migrar para dados.",
                },
                {
                  name: "keywords",
                  label: "Tecnologias ou termos que quer destacar",
                  placeholder:
                    "Ex: React, JavaScript, SQL, Figma, Cypress, Python.",
                },
              ]}
            />
          )}
        </div>
      </section>
    </Layout>
  );
}
