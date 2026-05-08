import { ShieldCheck } from "lucide-react";
import LegalPage, { LegalText } from "@/components/legal/LegalPage";
import SEO from "@/components/SEO";

const updatedAt = "2026-05-07";

export default function TermosDeUso() {
  return (
    <>
      <SEO
        title="Termos de Uso — Bora na Tech?"
        description="Termos de uso da plataforma Bora na Tech?, incluindo regras de conta, conteúdo, plano Pro, ferramentas de IA e responsabilidades."
        keywords={["termos de uso bora na tech", "regras da plataforma", "plano pro bora na tech", "termos tecnologia"]}
        url="/termos-de-uso"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />
      <LegalPage
        eyebrow="combinado de uso"
        title="Regras claras para usar a plataforma com segurança."
        subtitle="Os termos organizam o que o Bora na Tech? oferece, o que é esperado de cada conta, como funcionam recursos gratuitos e Pro, e onde estão os limites de responsabilidade."
        updatedAt="7 de maio de 2026"
        icon={<ShieldCheck className="h-7 w-7 text-slate-950" aria-hidden />}
        tone={{
          hero: "bg-amber-100",
          badge: "bg-[#FFB800]",
          shadow: "shadow-amber-300",
          soft: "bg-amber-100",
          accentText: "text-amber-700",
          marker: "bg-[#FFB800]",
        }}
        highlights={[
          { label: "Conta", value: "Use dados verdadeiros e proteja seu acesso" },
          { label: "Conteúdo", value: "Curadoria educacional, sem promessa de vaga" },
          { label: "Pro e IA", value: "Recursos pagos e respostas que precisam de revisão" },
        ]}
        relatedLinks={[
          { href: "/privacidade", label: "Privacidade", description: "Dados, cookies e direitos LGPD." },
          { href: "/licenca", label: "Licença", description: "Como reutilizar conteúdo original." },
          { href: "/pro", label: "Plano Pro", description: "Recursos pagos disponíveis." },
        ]}
        sections={[
          { id: "sobre", title: "1. Sobre a plataforma", body: <LegalText>O Bora na Tech? é uma plataforma educacional e de curadoria para pessoas iniciantes em tecnologia. Oferecemos conteúdos sobre áreas de TI, roadmaps, cursos, plataformas, projetos, eventos, vagas, notícias, comunidade e ferramentas de apoio à carreira.</LegalText> },
          { id: "aceitacao", title: "2. Aceitação dos termos", body: <LegalText>Ao acessar ou usar a plataforma, você concorda com estes Termos de Uso, com a Política de Privacidade e com a Licença de Conteúdo aplicável aos materiais originais do projeto. Se você não concordar, não deve usar a plataforma.</LegalText> },
          { id: "conta", title: "3. Conta e segurança", items: ["Você deve fornecer informações verdadeiras ao criar conta.", "Você é responsável por manter a confidencialidade de suas credenciais.", "Você deve avisar o projeto caso perceba uso indevido da sua conta.", "Podemos suspender ou limitar contas em caso de fraude, abuso, tentativa de invasão, automação indevida ou violação destes termos."] },
          { id: "conteudos", title: "4. Conteúdos gratuitos e Pro", body: <LegalText>Algumas áreas da plataforma são gratuitas e outras podem exigir assinatura Pro. Recursos pagos podem incluir ferramentas de IA, análises personalizadas, planos de estudo avançados, recursos de carreira e funcionalidades futuras. A disponibilidade dos recursos pode mudar conforme evolução do produto.</LegalText> },
          { id: "pagamentos", title: "5. Pagamentos e assinatura", items: ["Pagamentos são processados por provedor externo de pagamento.", "Preços, ciclos, descontos e condições aparecem antes da finalização da contratação.", "O acesso Pro depende da confirmação do pagamento e da manutenção da assinatura ativa.", "Eventuais reembolsos, cancelamentos e cobranças seguem as regras informadas no checkout e as normas aplicáveis ao consumidor."] },
          { id: "ia", title: "6. Ferramentas de IA", body: <LegalText>As ferramentas de IA geram sugestões educacionais e de carreira com base nas informações fornecidas por você. As respostas podem conter erros, omissões ou recomendações inadequadas. Você deve revisar criticamente qualquer saída antes de usar em currículo, LinkedIn, candidatura, estudo, decisão profissional ou publicação.</LegalText> },
          { id: "terceiros", title: "7. Curadoria, links e terceiros", body: <LegalText>Indicamos cursos, plataformas, eventos, vagas, notícias, comunidades e links externos. Esses conteúdos pertencem aos respectivos responsáveis. Não controlamos disponibilidade, preços, qualidade, promessas, políticas, coleta de dados ou decisões de terceiros.</LegalText> },
          { id: "permitido", title: "8. Uso permitido", items: ["Usar a plataforma para estudo, orientação de carreira, organização de aprendizado e exploração de áreas de tecnologia.", "Compartilhar conteúdos originais respeitando a Licença de Conteúdo.", "Salvar favoritos, preencher formulários e usar ferramentas de IA de forma legítima."] },
          { id: "proibido", title: "9. Uso proibido", items: ["Tentar invadir, copiar, extrair em massa, raspar dados ou prejudicar a plataforma.", "Usar automações abusivas, engenharia reversa ou contornar controles de acesso.", "Inserir dados de terceiros sem autorização.", "Usar a plataforma para discriminação, assédio, fraude, spam, golpe, conteúdo ilegal ou violação de direitos.", "Revender conteúdo original do Bora na Tech? sem autorização."] },
          { id: "garantia", title: "10. Ausência de garantia de emprego", body: <LegalText>O Bora na Tech? oferece orientação educacional, curadoria e ferramentas de apoio. Não garantimos vaga, estágio, contratação, aprovação em processo seletivo, renda, resultado profissional ou aceitação por empresas.</LegalText> },
          { id: "propriedade", title: "11. Propriedade intelectual", body: <LegalText>A marca, identidade visual, código, layout, componentes, banco de dados, recursos pagos e estrutura da plataforma pertencem ao Bora na Tech? ou a seus respectivos titulares. O conteúdo original educacional pode ser reutilizado apenas nos termos da Licença de Conteúdo.</LegalText> },
          { id: "alteracoes", title: "12. Alterações nos termos", body: <LegalText>Podemos atualizar estes termos para refletir mudanças no produto, na lei ou em práticas operacionais. A versão mais recente ficará disponível nesta página, com data de atualização.</LegalText> },
          { id: "contato", title: "13. Contato", body: <LegalText>Para dúvidas sobre estes termos, use os perfis oficiais do Bora na Tech? nas redes sociais ou os canais de contato divulgados na plataforma.</LegalText> },
        ]}
      />
    </>
  );
}
