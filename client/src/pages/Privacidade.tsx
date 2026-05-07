import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const updatedAt = "2026-05-07";

export default function Privacidade() {
  return (
    <Layout>
      <SEO
        title="Política de Privacidade — Bora na Tech?"
        description="Política de privacidade do Bora na Tech?, com informações sobre dados pessoais, cookies, LGPD, compartilhamento e direitos dos titulares."
        keywords={["política de privacidade bora na tech", "lgpd", "dados pessoais", "cookies", "privacidade tecnologia"]}
        url="/privacidade"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />

      <section className="hero-pattern border-b-2 border-slate-900 py-12">
        <div className="container">
          <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">privacidade</p>
          <h1 className="font-display text-4xl font-black text-slate-950 md:text-5xl">Política de privacidade</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-slate-700">
            Esta política explica como o Bora na Tech? trata dados pessoais de visitantes, usuários cadastrados, assinantes e pessoas que usam ferramentas da plataforma.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f0e8] py-12">
        <div className="container">
          <article className="card-brutal mx-auto max-w-4xl rounded-3xl bg-white p-6 md:p-8">
            <p className="text-sm font-bold text-slate-500">Última atualização: 7 de maio de 2026</p>

            <div className="mt-8 space-y-8 text-slate-700">
              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">1. Quem somos</h2>
                <p className="mt-3 leading-relaxed">
                  O Bora na Tech? é uma plataforma educacional e de curadoria para pessoas iniciantes em tecnologia, disponível em https://boranatech.com.br.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">2. Quais dados podemos tratar</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Dados de cadastro: nome, e-mail, identificador de usuário e informações de autenticação.</li>
                  <li>Dados de uso: páginas acessadas, favoritos, histórico de quiz, entradas de estudo, preferências e interações na plataforma.</li>
                  <li>Dados técnicos: endereço IP, navegador, dispositivo, data e hora de acesso, cookies e identificadores similares.</li>
                  <li>Dados de pagamento: status de assinatura, plano contratado, identificadores de cobrança e informações necessárias para confirmação de pagamento. Dados completos de cartão ou boleto são tratados pelo provedor de pagamento.</li>
                  <li>Dados enviados às ferramentas: textos de currículo, LinkedIn, objetivos de carreira, mensagens, respostas de quiz e demais informações que você inserir voluntariamente.</li>
                  <li>Dados de comunicação: mensagens enviadas, solicitações de suporte, e-mails transacionais e registros de consentimento quando aplicável.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">3. Finalidades do tratamento</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Criar, autenticar e proteger sua conta.</li>
                  <li>Disponibilizar conteúdos, favoritos, histórico, trilhas e ferramentas da plataforma.</li>
                  <li>Processar assinaturas, liberar acesso Pro e registrar pagamentos.</li>
                  <li>Gerar respostas de IA e análises solicitadas por você.</li>
                  <li>Melhorar navegação, desempenho, segurança, conteúdo e experiência de uso.</li>
                  <li>Enviar comunicações transacionais, avisos de conta, confirmação de assinatura e mensagens relacionadas ao serviço.</li>
                  <li>Cumprir obrigações legais, prevenir fraude, responder solicitações e proteger direitos.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">4. Bases legais</h2>
                <p className="mt-3 leading-relaxed">
                  Tratamos dados pessoais com base na execução de contrato ou procedimentos preliminares, legítimo interesse, consentimento quando necessário, cumprimento de obrigação legal ou regulatória, exercício regular de direitos e prevenção à fraude, conforme a Lei Geral de Proteção de Dados Pessoais.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">5. Cookies e analytics</h2>
                <p className="mt-3 leading-relaxed">
                  Podemos usar cookies e tecnologias similares para autenticação, segurança, preferências, medição de audiência e análise de uso. A plataforma usa ferramentas de analytics, como PostHog, para entender navegação, páginas acessadas, conversões e estabilidade do produto.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">6. Compartilhamento com terceiros</h2>
                <p className="mt-3 leading-relaxed">
                  Podemos compartilhar dados estritamente necessários com provedores que ajudam a operar a plataforma, incluindo autenticação e banco de dados, processamento de pagamento, envio de e-mails, analytics, ferramentas de IA, hospedagem, segurança, suporte e cumprimento legal. Esses terceiros devem tratar os dados conforme suas próprias políticas e obrigações aplicáveis.
                </p>
                <p className="mt-3 leading-relaxed">
                  Serviços usados ou previstos no projeto incluem Supabase, Asaas, OpenAI, Resend, PostHog e provedores de hospedagem e infraestrutura.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">7. Ferramentas de IA</h2>
                <p className="mt-3 leading-relaxed">
                  Quando você usa recursos de IA, os dados inseridos podem ser enviados a provedores de IA para geração de resposta. Evite inserir senhas, documentos sensíveis, dados de saúde, dados financeiros completos, informações de terceiros sem autorização ou qualquer conteúdo que você não queira compartilhar com esse tipo de serviço.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">8. Armazenamento e segurança</h2>
                <p className="mt-3 leading-relaxed">
                  Mantemos dados pelo tempo necessário para cumprir as finalidades desta política, prestar o serviço, manter registros operacionais, cumprir obrigações legais e proteger direitos. Usamos medidas técnicas e organizacionais razoáveis para proteger dados contra acesso não autorizado, perda, alteração ou divulgação indevida.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">9. Transferência internacional</h2>
                <p className="mt-3 leading-relaxed">
                  Alguns provedores podem armazenar ou processar dados fora do Brasil. Nesses casos, buscamos utilizar fornecedores com práticas de segurança e proteção de dados compatíveis com a legislação aplicável.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">10. Direitos do titular</h2>
                <p className="mt-3 leading-relaxed">
                  Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento, revisão de decisões automatizadas quando aplicável e revogação de consentimento, nos termos da LGPD.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">11. Exclusão de conta</h2>
                <p className="mt-3 leading-relaxed">
                  Usuários autenticados podem solicitar exclusão de conta pelos recursos disponíveis na plataforma ou pelos canais oficiais. Alguns registros podem ser mantidos quando necessários para cumprimento legal, segurança, prevenção a fraude, auditoria ou exercício regular de direitos.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">12. Crianças e adolescentes</h2>
                <p className="mt-3 leading-relaxed">
                  A plataforma é voltada a orientação educacional e carreira em tecnologia. Pessoas menores de idade devem usar a plataforma com ciência e orientação de responsáveis legais, especialmente em cadastros, pagamentos e envio de dados pessoais.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">13. Alterações nesta política</h2>
                <p className="mt-3 leading-relaxed">
                  Podemos atualizar esta política para refletir mudanças legais, técnicas ou operacionais. A versão vigente estará sempre disponível nesta página.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">14. Contato</h2>
                <p className="mt-3 leading-relaxed">
                  Para exercer direitos de titular ou tirar dúvidas sobre privacidade, use os perfis oficiais do Bora na Tech? nas redes sociais ou os canais de contato divulgados na plataforma.
                </p>
              </section>
            </div>
          </article>
        </div>
      </section>
    </Layout>
  );
}
