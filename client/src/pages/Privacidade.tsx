import { LockKeyhole } from "lucide-react";
import LegalPage, { LegalText } from "@/components/legal/LegalPage";
import SEO from "@/components/SEO";

const updatedAt = "2026-05-07";

export default function Privacidade() {
  return (
    <>
      <SEO
        title="Política de Privacidade — Bora na Tech?"
        description="Política de privacidade do Bora na Tech?, com informações sobre dados pessoais, cookies, LGPD, compartilhamento e direitos dos titulares."
        keywords={["política de privacidade bora na tech", "lgpd", "dados pessoais", "cookies", "privacidade tecnologia"]}
        url="/privacidade"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />
      <LegalPage
        eyebrow="privacidade e lgpd"
        title="Seus dados explicados sem juridiquês desnecessário."
        subtitle="Esta política mostra quais dados podem ser tratados, por que eles existem na plataforma, com quem podem ser compartilhados e quais direitos você tem como titular."
        updatedAt="7 de maio de 2026"
        icon={<LockKeyhole className="h-7 w-7 text-slate-950" aria-hidden />}
        tone={{
          hero: "bg-[#faf8f4]",
          badge: "bg-[#FFB800]",
          shadow: "shadow-slate-200",
          soft: "bg-[#faf8f4]",
          accentText: "text-slate-950",
          marker: "bg-[#FFB800]",
        }}
        highlights={[
          { label: "Dados", value: "Conta, uso, pagamento, analytics e inputs de IA" },
          { label: "Finalidade", value: "Operar, proteger e melhorar a experiência" },
          { label: "Direitos", value: "Acesso, correção, exclusão e demais pedidos LGPD" },
        ]}
        relatedLinks={[
          { href: "/termos-de-uso", label: "Termos de Uso", description: "Regras para usar a plataforma." },
          { href: "/licenca", label: "Licença", description: "Reuso dos conteúdos originais." },
          { href: "/perfil", label: "Perfil", description: "Gerencie sua conta autenticada." },
        ]}
        sections={[
          { id: "quem-somos", title: "1. Quem somos", body: <LegalText>O Bora na Tech? é uma plataforma educacional e de curadoria para pessoas iniciantes em tecnologia, disponível em https://boranatech.com.br.</LegalText> },
          { id: "dados", title: "2. Quais dados podemos tratar", items: ["Dados de cadastro: nome, e-mail, identificador de usuário e informações de autenticação.", "Dados de uso: páginas acessadas, favoritos, histórico de quiz, entradas de estudo, preferências e interações na plataforma.", "Dados técnicos: endereço IP, navegador, dispositivo, data e hora de acesso, cookies e identificadores similares.", "Dados de pagamento: status de assinatura, plano contratado, identificadores de cobrança e informações necessárias para confirmação de pagamento. Dados completos de cartão ou boleto são tratados pelo provedor de pagamento.", "Dados enviados às ferramentas: textos de currículo, LinkedIn, objetivos de carreira, mensagens, respostas de quiz e demais informações que você inserir voluntariamente.", "Dados de comunicação: mensagens enviadas, solicitações de suporte, e-mails transacionais e registros de consentimento quando aplicável."] },
          { id: "finalidades", title: "3. Finalidades do tratamento", items: ["Criar, autenticar e proteger sua conta.", "Disponibilizar conteúdos, favoritos, histórico, trilhas e ferramentas da plataforma.", "Processar assinaturas, liberar acesso Pro e registrar pagamentos.", "Gerar respostas de IA e análises solicitadas por você.", "Melhorar navegação, desempenho, segurança, conteúdo e experiência de uso.", "Enviar comunicações transacionais, avisos de conta, confirmação de assinatura e mensagens relacionadas ao serviço.", "Cumprir obrigações legais, prevenir fraude, responder solicitações e proteger direitos."] },
          { id: "bases", title: "4. Bases legais", body: <LegalText>Tratamos dados pessoais com base na execução de contrato ou procedimentos preliminares, legítimo interesse, consentimento quando necessário, cumprimento de obrigação legal ou regulatória, exercício regular de direitos e prevenção à fraude, conforme a Lei Geral de Proteção de Dados Pessoais.</LegalText> },
          { id: "cookies", title: "5. Cookies e analytics", body: <LegalText>Podemos usar cookies e tecnologias similares para autenticação, segurança, preferências, medição de audiência e análise de uso. A plataforma usa ferramentas de analytics, como PostHog, para entender navegação, páginas acessadas, conversões e estabilidade do produto.</LegalText> },
          { id: "terceiros", title: "6. Compartilhamento com terceiros", body: <><LegalText>Podemos compartilhar dados estritamente necessários com provedores que ajudam a operar a plataforma, incluindo autenticação e banco de dados, processamento de pagamento, envio de e-mails, analytics, ferramentas de IA, hospedagem, segurança, suporte e cumprimento legal. Esses terceiros devem tratar os dados conforme suas próprias políticas e obrigações aplicáveis.</LegalText><LegalText>Serviços usados ou previstos no projeto incluem Supabase, Asaas, OpenAI, Resend, PostHog e provedores de hospedagem e infraestrutura.</LegalText></> },
          { id: "ia", title: "7. Ferramentas de IA", body: <LegalText>Quando você usa recursos de IA, os dados inseridos podem ser enviados a provedores de IA para geração de resposta. Evite inserir senhas, documentos sensíveis, dados de saúde, dados financeiros completos, informações de terceiros sem autorização ou qualquer conteúdo que você não queira compartilhar com esse tipo de serviço.</LegalText> },
          { id: "seguranca", title: "8. Armazenamento e segurança", body: <LegalText>Mantemos dados pelo tempo necessário para cumprir as finalidades desta política, prestar o serviço, manter registros operacionais, cumprir obrigações legais e proteger direitos. Usamos medidas técnicas e organizacionais razoáveis para proteger dados contra acesso não autorizado, perda, alteração ou divulgação indevida.</LegalText> },
          { id: "transferencia", title: "9. Transferência internacional", body: <LegalText>Alguns provedores podem armazenar ou processar dados fora do Brasil. Nesses casos, buscamos utilizar fornecedores com práticas de segurança e proteção de dados compatíveis com a legislação aplicável.</LegalText> },
          { id: "direitos", title: "10. Direitos do titular", body: <LegalText>Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento, revisão de decisões automatizadas quando aplicável e revogação de consentimento, nos termos da LGPD.</LegalText> },
          { id: "exclusao", title: "11. Exclusão de conta", body: <LegalText>Usuários autenticados podem solicitar exclusão de conta pelos recursos disponíveis na plataforma ou pelos canais oficiais. Alguns registros podem ser mantidos quando necessários para cumprimento legal, segurança, prevenção a fraude, auditoria ou exercício regular de direitos.</LegalText> },
          { id: "menores", title: "12. Crianças e adolescentes", body: <LegalText>A plataforma é voltada a orientação educacional e carreira em tecnologia. Pessoas menores de idade devem usar a plataforma com ciência e orientação de responsáveis legais, especialmente em cadastros, pagamentos e envio de dados pessoais.</LegalText> },
          { id: "alteracoes", title: "13. Alterações nesta política", body: <LegalText>Podemos atualizar esta política para refletir mudanças legais, técnicas ou operacionais. A versão vigente estará sempre disponível nesta página.</LegalText> },
          { id: "contato", title: "14. Contato", body: <LegalText>Para exercer direitos de titular ou tirar dúvidas sobre privacidade, use os perfis oficiais do Bora na Tech? nas redes sociais ou os canais de contato divulgados na plataforma.</LegalText> },
        ]}
      />
    </>
  );
}
