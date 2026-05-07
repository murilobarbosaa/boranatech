import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import TermosDeUsoRedesign from "./TermosDeUsoRedesign";

const updatedAt = "2026-05-07";

export default function TermosDeUso() {
  return <TermosDeUsoRedesign />;

  return (
    <Layout>
      <SEO
        title="Termos de Uso — Bora na Tech?"
        description="Termos de uso da plataforma Bora na Tech?, incluindo regras de conta, conteúdo, plano Pro, ferramentas de IA e responsabilidades."
        keywords={["termos de uso bora na tech", "regras da plataforma", "plano pro bora na tech", "termos tecnologia"]}
        url="/termos-de-uso"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />

      <section className="hero-pattern border-b-2 border-slate-900 py-12">
        <div className="container">
          <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">termos</p>
          <h1 className="font-display text-4xl font-black text-slate-950 md:text-5xl">Termos de uso</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-slate-700">
            Estes termos explicam as regras para usar o Bora na Tech?, seus conteúdos educacionais, ferramentas de IA, áreas gratuitas e recursos pagos.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f0e8] py-12">
        <div className="container">
          <article className="card-brutal mx-auto max-w-4xl rounded-3xl bg-white p-6 md:p-8">
            <p className="text-sm font-bold text-slate-500">Última atualização: 7 de maio de 2026</p>

            <div className="mt-8 space-y-8 text-slate-700">
              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">1. Sobre a plataforma</h2>
                <p className="mt-3 leading-relaxed">
                  O Bora na Tech? é uma plataforma educacional e de curadoria para pessoas iniciantes em tecnologia. Oferecemos conteúdos sobre áreas de TI, roadmaps, cursos, plataformas, projetos, eventos, vagas, notícias, comunidade e ferramentas de apoio à carreira.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">2. Aceitação dos termos</h2>
                <p className="mt-3 leading-relaxed">
                  Ao acessar ou usar a plataforma, você concorda com estes Termos de Uso, com a Política de Privacidade e com a Licença de Conteúdo aplicável aos materiais originais do projeto. Se você não concordar, não deve usar a plataforma.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">3. Conta e segurança</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Você deve fornecer informações verdadeiras ao criar conta.</li>
                  <li>Você é responsável por manter a confidencialidade de suas credenciais.</li>
                  <li>Você deve avisar o projeto caso perceba uso indevido da sua conta.</li>
                  <li>Podemos suspender ou limitar contas em caso de fraude, abuso, tentativa de invasão, automação indevida ou violação destes termos.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">4. Conteúdos gratuitos e Pro</h2>
                <p className="mt-3 leading-relaxed">
                  Algumas áreas da plataforma são gratuitas e outras podem exigir assinatura Pro. Recursos pagos podem incluir ferramentas de IA, análises personalizadas, planos de estudo avançados, recursos de carreira e funcionalidades futuras. A disponibilidade dos recursos pode mudar conforme evolução do produto.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">5. Pagamentos e assinatura</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Pagamentos são processados por provedor externo de pagamento.</li>
                  <li>Preços, ciclos, descontos e condições aparecem antes da finalização da contratação.</li>
                  <li>O acesso Pro depende da confirmação do pagamento e da manutenção da assinatura ativa.</li>
                  <li>Eventuais reembolsos, cancelamentos e cobranças seguem as regras informadas no checkout e as normas aplicáveis ao consumidor.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">6. Ferramentas de IA</h2>
                <p className="mt-3 leading-relaxed">
                  As ferramentas de IA geram sugestões educacionais e de carreira com base nas informações fornecidas por você. As respostas podem conter erros, omissões ou recomendações inadequadas. Você deve revisar criticamente qualquer saída antes de usar em currículo, LinkedIn, candidatura, estudo, decisão profissional ou publicação.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">7. Curadoria, links e terceiros</h2>
                <p className="mt-3 leading-relaxed">
                  Indicamos cursos, plataformas, eventos, vagas, notícias, comunidades e links externos. Esses conteúdos pertencem aos respectivos responsáveis. Não controlamos disponibilidade, preços, qualidade, promessas, políticas, coleta de dados ou decisões de terceiros.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">8. Uso permitido</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Usar a plataforma para estudo, orientação de carreira, organização de aprendizado e exploração de áreas de tecnologia.</li>
                  <li>Compartilhar conteúdos originais respeitando a Licença de Conteúdo.</li>
                  <li>Salvar favoritos, preencher formulários e usar ferramentas de IA de forma legítima.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">9. Uso proibido</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Tentar invadir, copiar, extrair em massa, raspar dados ou prejudicar a plataforma.</li>
                  <li>Usar automações abusivas, engenharia reversa ou contornar controles de acesso.</li>
                  <li>Inserir dados de terceiros sem autorização.</li>
                  <li>Usar a plataforma para discriminação, assédio, fraude, spam, golpe, conteúdo ilegal ou violação de direitos.</li>
                  <li>Revender conteúdo original do Bora na Tech? sem autorização.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">10. Ausência de garantia de emprego</h2>
                <p className="mt-3 leading-relaxed">
                  O Bora na Tech? oferece orientação educacional, curadoria e ferramentas de apoio. Não garantimos vaga, estágio, contratação, aprovação em processo seletivo, renda, resultado profissional ou aceitação por empresas.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">11. Propriedade intelectual</h2>
                <p className="mt-3 leading-relaxed">
                  A marca, identidade visual, código, layout, componentes, banco de dados, recursos pagos e estrutura da plataforma pertencem ao Bora na Tech? ou a seus respectivos titulares. O conteúdo original educacional pode ser reutilizado apenas nos termos da Licença de Conteúdo.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">12. Alterações nos termos</h2>
                <p className="mt-3 leading-relaxed">
                  Podemos atualizar estes termos para refletir mudanças no produto, na lei ou em práticas operacionais. A versão mais recente ficará disponível nesta página, com data de atualização.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">13. Contato</h2>
                <p className="mt-3 leading-relaxed">
                  Para dúvidas sobre estes termos, use os perfis oficiais do Bora na Tech? nas redes sociais ou os canais de contato divulgados na plataforma.
                </p>
              </section>
            </div>
          </article>
        </div>
      </section>
    </Layout>
  );
}
