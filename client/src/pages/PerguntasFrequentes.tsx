import { Link } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PageHero from "@/components/shared/PageHero";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("violet");

type FaqItem = {
  pergunta: string;
  resposta: string;
  link?: { href: string; label: string };
};

// TODO(Ana): revisar copy de todas as perguntas e respostas antes de publicar.
// O texto de `resposta` alimenta o DOM e o JSON-LD FAQPage; manter os dois
// identicos editando SEMPRE por aqui.
const FAQ_ITEMS: FaqItem[] = [
  {
    pergunta: "O que é o Bora na Tech?",
    resposta:
      "O Bora na Tech? é uma plataforma brasileira de orientação de carreira para quem quer começar em tecnologia. Ela reúne quiz de carreira, roadmaps de estudo por área, curadoria de cursos, dicionário de termos e ferramentas de análise com IA, tudo em português. O foco é dar direção para quem está no zero ou no começo da primeira vaga.",
    link: { href: "/sobre", label: "Conhecer o projeto" },
  },
  {
    pergunta: "O Bora na Tech é gratuito?",
    resposta:
      "A base da plataforma é gratuita: com uma conta free você usa o quiz de carreira, os roadmaps, a curadoria de cursos, o dicionário e os guias. As análises personalizadas por IA, como currículo, LinkedIn e GitHub, fazem parte do plano Pro, por assinatura. A página de planos mostra a comparação completa entre o gratuito e o Pro.",
    link: { href: "/planos", label: "Ver os planos" },
  },
  {
    pergunta: "Preciso saber programar para começar em tecnologia?",
    resposta:
      "Não. A plataforma é feita para quem está começando do zero, e a descoberta de área não exige nenhum conhecimento prévio de programação. Além disso, nem toda área de TI é centrada em código: UX/UI Design e Product Design, por exemplo, fazem parte do catálogo de áreas.",
    link: { href: "/areas", label: "Explorar as áreas de TI" },
  },
  {
    pergunta: "Como descubro qual área de TI combina comigo?",
    resposta:
      "O caminho mais direto é o quiz de carreira: você responde perguntas rápidas sobre o seu perfil e recebe uma indicação de área. Ele é gratuito e feito para iniciantes. Depois dá para aprofundar no catálogo de áreas e no roadmap da área indicada.",
    link: { href: "/quiz-carreira", label: "Fazer o quiz de carreira" },
  },
  {
    pergunta: "Preciso de faculdade para trabalhar com tecnologia?",
    resposta:
      "Para boa parte das áreas, não é obrigatório: no mercado de tecnologia, portfólio e prática costumam pesar mais que diploma em muitas vagas. Faculdade pode ajudar com base teórica e networking, e algumas empresas e certificações valorizam a graduação. Se você considera esse caminho, a página de faculdades compara os principais cursos superiores de TI.",
    link: { href: "/faculdades", label: "Comparar faculdades de TI" },
  },
  {
    pergunta: "Por onde começo a estudar do zero?",
    resposta:
      "Pelos roadmaps: cada área tem um passo a passo gratuito, do primeiro conceito ao nível avançado, para você estudar na ordem certa. A curadoria de cursos complementa com cursos organizados por área e nível. Se ainda não escolheu área, faça o quiz de carreira antes.",
    link: { href: "/roadmaps", label: "Abrir os roadmaps" },
  },
  {
    pergunta: "Preciso de inglês fluente para começar?",
    resposta:
      "Não. Você não precisa ser fluente para começar em TI: o que faz diferença é criar contato diário com o idioma em documentação, vídeos, README e conversa técnica. O guia de inglês da plataforma organiza esse caminho por nível, do vocabulário de vagas ao inglês de entrevista.",
    link: { href: "/ingles", label: "Ver o guia de inglês" },
  },
  {
    pergunta: "Certificado de curso vale alguma coisa?",
    resposta:
      "Vale, no contexto certo. Certificado de curso comprova que você concluiu um treinamento e mostra dedicação, mas não passa por avaliação de um órgão externo; certificação é uma credencial de mercado emitida por entidade oficial, como AWS ou Microsoft, e em geral exige prova. No começo, certificados de bons cursos ajudam a montar base e portfólio; certificações pesam mais quando você foca numa área e a vaga pede.",
    link: { href: "/cursos", label: "Ver a curadoria de cursos" },
  },
  {
    pergunta: "Quanto ganha quem está começando em tecnologia?",
    resposta:
      "Depende muito de área, nível e cidade, então desconfie de qualquer número único. A página de salários mostra faixas por área, nível e cidade para você calibrar expectativas com contexto. Em geral, a remuneração evolui conforme você avança de nível.",
    link: { href: "/salarios", label: "Consultar as faixas salariais" },
  },
  {
    pergunta: "Quanto tempo leva até a primeira vaga?",
    resposta:
      "Não existe prazo único: depende do seu ponto de partida, das horas de estudo por semana e da área escolhida. O simulador de carreira faz um diagnóstico rápido da sua situação e estima um prazo orientativo até a sua meta, junto com o que priorizar para chegar mais rápido. Use a estimativa como referência de planejamento, não como promessa.",
    link: { href: "/simulador", label: "Usar o simulador de carreira" },
  },
  {
    pergunta: "O que o plano Pro inclui?",
    // TODO(Ana): revisar resposta do Pro apos remocao de ferramentas
    resposta:
      "O Pro adiciona as ferramentas de análise personalizada com IA sobre a base gratuita: análise de currículo, roadmaps com acompanhamento, simulador de entrevistas, plano de estudos, otimização de LinkedIn e análise de portfólio e GitHub, além da comunidade. A página de planos tem a comparação completa.",
    link: { href: "/planos", label: "Ver o que o Pro inclui" },
  },
  {
    pergunta: "Como funcionam as ferramentas de IA da plataforma?",
    resposta:
      "Você envia o seu material, como o texto do currículo ou do perfil do LinkedIn, e a IA devolve uma análise estruturada: nota, lacunas, palavras-chave e melhorias priorizadas. Cada ferramenta é focada em uma etapa da busca por vaga, do currículo à preparação de entrevista. Elas fazem parte do plano Pro.",
    link: { href: "/planos", label: "Conhecer as ferramentas" },
  },
  {
    pergunta: "Como cancelo o plano Pro?",
    resposta:
      "O cancelamento é feito na própria plataforma, na área de assinatura do seu perfil. Ao cancelar, o acesso Pro continua até o fim do período já pago. Reembolsos, cancelamentos e cobranças seguem as regras informadas no checkout e as normas aplicáveis ao consumidor, como descrito nos Termos de Uso.",
    link: { href: "/termos-de-uso", label: "Ler os Termos de Uso" },
  },
  {
    pergunta: "Como falo com o suporte?",
    resposta:
      "Pelo email oi@boranatech.com.br. Esse é o canal de contato da plataforma para dúvidas, problemas com conta ou assinatura e feedback.",
  },
];

const faqSchema = {
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.pergunta,
    acceptedAnswer: { "@type": "Answer", text: item.resposta },
  })),
};

export default function PerguntasFrequentes() {
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Perguntas frequentes sobre começar em TI"
        description="Respostas diretas para quem quer começar em tecnologia: escolha de área, estudo do zero, inglês, certificados, salários, primeira vaga e o plano Pro."
        url="/perguntas-frequentes"
        schemaType="FAQPage"
        schemaData={faqSchema}
      />
      <PageHero
        accent="violet"
        eyebrow="perguntas frequentes"
        title="Perguntas frequentes"
        subtitle="Respostas diretas para as dúvidas mais comuns de quem está começando em tecnologia."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container max-w-3xl space-y-4">
          {FAQ_ITEMS.map((item) => (
            <DetailsChevronOnly
              key={item.pergunta}
              className="card-brutal rounded-2xl bg-white p-5"
              title={
                <h2 className="font-display text-lg font-black text-slate-950">
                  {item.pergunta}
                </h2>
              }
            >
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {item.resposta}
              </p>
              {item.link ? (
                <Link
                  href={item.link.href}
                  className="mt-3 inline-block text-sm font-bold text-violet-800 underline-offset-2 hover:underline"
                >
                  {item.link.label}
                </Link>
              ) : null}
            </DetailsChevronOnly>
          ))}
        </div>
      </section>
    </Layout>
  );
}
