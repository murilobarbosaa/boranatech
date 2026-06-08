import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import AiToolPanel from "@/components/shared/AiToolPanel";
import PageHero from "@/components/shared/PageHero";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("violet");

export default function Empregabilidade() {
  const { isPro } = useSubscription();
  return (
    <Layout>
      <PageHero
        accent="amber"
        eyebrow="prontidão para vaga"
        title="Análise de Empregabilidade"
        subtitle="Combine a calculadora de prontidão (vaga × seu perfil) com o analisador de vaga (salário, requisitos e red flags)."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container grid gap-8 lg:grid-cols-2">
          {!isPro ? (
            <div className="lg:col-span-2">
              <ProGate description="Calculadora de prontidão: estimativa de chance nesta vaga e encaixe com seu currículo. Analisador: insights sobre salário, exigências e se a vaga parece razoável." />
            </div>
          ) : (
            <>
              <AiToolPanel
                endpoint="employability"
                accent="amber"
                title="Calculadora de prontidão para vaga"
                description="Cole a vaga e seu perfil. A IA estima probabilidade relativa neste processo, quão boa é a vaga para você, lacunas e plano de ação."
                buttonLabel="Calcular prontidão"
                fields={[
                  {
                    name: "jobTitle",
                    label: "Cargo ou título da vaga",
                    placeholder:
                      'Ex.: "Desenvolvedora Front-end Júnior" ou como aparece no anúncio',
                  },
                  {
                    name: "jobPosting",
                    label: "Texto completo da vaga",
                    type: "textarea",
                    placeholder:
                      "Cole aqui descrição, requisitos obrigatórios e desejáveis, stack, benefícios, modalidade… Quanto mais completo, melhor o cruzamento com seu perfil.",
                  },
                  {
                    name: "candidateProfile",
                    label: "Seu currículo ou resumo do perfil",
                    type: "textarea",
                    placeholder:
                      "Cole o currículo, trecho do LinkedIn ou liste: formação, experiências, projetos, GitHub/link do portfólio, tecnologias que domina e tempo de uso.",
                  },
                  {
                    name: "yearsExperience",
                    label: "Tempo na área (anos ou estágio iniciante)",
                    placeholder:
                      'Ex.: "0, em transição", "6 meses estágio", "2 anos"',
                  },
                  {
                    name: "interviewPrep",
                    label: "O que já fez neste tipo de processo",
                    type: "textarea",
                    placeholder:
                      "Ex.: já fez quantas entrevistas técnicas, tem portfólio no ar, inglês para leitura, etc. Opcional.",
                  },
                  {
                    name: "targetLevel",
                    label: "Nível declarado na vaga",
                    type: "select",
                    options: [
                      "Estágio",
                      "Trainee",
                      "Júnior",
                      "Pleno",
                      "Sênior",
                      "Especialista",
                      "Nível misto ou não claro",
                    ],
                  },
                  {
                    name: "workMode",
                    label: "Modalidade (como você entende pela vaga ou desejo)",
                    type: "select",
                    options: [
                      "Remoto",
                      "Híbrido",
                      "Presencial",
                      "Presencial não informado na vaga",
                      "Qualquer uma",
                    ],
                  },
                  {
                    name: "salaryExpectation",
                    label: "Pretensão ou faixa que a vaga mostra",
                    placeholder:
                      'Ex.: "R$ 4 a 5k", só CLT ou "salário não divulgado na vaga"',
                  },
                ]}
              />
              <AiToolPanel
                endpoint="job-analyzer"
                accent="amber"
                title="Analisador de vaga"
                description="Insight sobre o anúncio: faixa salarial, exigências fora do padrão, clareza, riscos e se costuma valer seguir neste tipo de posição."
                buttonLabel="Analisar anúncio"
                fields={[
                  {
                    name: "jobPosting",
                    label: "Texto completo do anúncio",
                    type: "textarea",
                    placeholder:
                      "Cole título, texto da empresa, requisitos, benefícios, salário se houver, local e modelo de trabalho.",
                  },
                  {
                    name: "roleDeclared",
                    label: "Cargo e senioridade como aparecem",
                    placeholder: 'Ex.: "Dev Full Stack Pleno"',
                  },
                  {
                    name: "salaryInPosting",
                    label: "Salário ou benefício financeiro mencionado",
                    placeholder:
                      'Cole só a parte salarial/remuneração, ou digite "não mencionado".',
                  },
                  {
                    name: "workModeDeclared",
                    label: "Modalidade e localização",
                    type: "textarea",
                    placeholder: "Remoto Brasil, SP capital, etc.",
                  },
                  {
                    name: "referenceMarket",
                    label:
                      "Contexto opcional para comparar (sua cidade, área habitual)",
                    type: "textarea",
                    placeholder:
                      'Opcional: ex. "Sou front júnior no Nordeste" ou números de referência que você conheça. A IA usará só como referência.',
                  },
                  {
                    name: "whatYouPrioritize",
                    label: "O que você prioriza na carreira neste momento",
                    type: "select",
                    options: [
                      "Primeiro estágio ou primeira contratação",
                      "Salário competitivo acima do resto",
                      "Aprendizado e time forte",
                      "Equilíbrio de vida",
                      "Crescimento rápido mesmo com jornada intensa",
                    ],
                  },
                ]}
              />
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
