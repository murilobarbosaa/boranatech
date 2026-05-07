import { ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const updatedAt = "2026-05-07";

export default function Licenca() {
  return (
    <Layout>
      <SEO
        title="Licença de Conteúdo — Bora na Tech?"
        description="Conheça a licença Creative Commons aplicada aos conteúdos originais do Bora na Tech? e as regras para reutilização."
        keywords={["licença creative commons", "bora na tech licença", "cc by nc sa", "conteúdo educacional tecnologia"]}
        url="/licenca"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />

      <section className="hero-pattern border-b-2 border-slate-900 py-12">
        <div className="container">
          <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">licença</p>
          <h1 className="font-display text-4xl font-black text-slate-950 md:text-5xl">Licença de conteúdo</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-slate-700">
            O conteúdo original publicado pelo Bora na Tech? é disponibilizado para fins educacionais sob a licença Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f0e8] py-12">
        <div className="container">
          <article className="card-brutal mx-auto max-w-4xl rounded-3xl bg-white p-6 md:p-8">
            <p className="text-sm font-bold text-slate-500">Última atualização: 7 de maio de 2026</p>

            <div className="mt-8 space-y-8 text-slate-700">
              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">1. Licença escolhida</h2>
                <p className="mt-3 leading-relaxed">
                  Salvo indicação em contrário, textos, explicações, guias, listas, roadmaps editoriais, glossários e materiais educacionais originais do Bora na Tech? estão licenciados sob
                  {" "}
                  <a
                    className="font-black text-violet-700 underline"
                    href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br"
                    rel="license noopener noreferrer"
                    target="_blank"
                  >
                    CC BY-NC-SA 4.0
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden />
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">2. O que você pode fazer</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Compartilhar o material, copiando e redistribuindo em qualquer meio ou formato.</li>
                  <li>Adaptar o material, remixando, transformando ou criando conteúdo derivado.</li>
                  <li>Usar o material em estudos, aulas, mentorias gratuitas, projetos educacionais e comunidades.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">3. Condições de uso</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Atribuição: cite "Bora na Tech?" e inclua link para https://boranatech.com.br.</li>
                  <li>Não comercial: não use o conteúdo original do projeto como parte principal de produto pago, curso pago, apostila paga, assinatura, consultoria ou material vendido.</li>
                  <li>Compartilha igual: se você adaptar o conteúdo, distribua sua adaptação sob a mesma licença ou licença compatível.</li>
                  <li>Sem endosso: não sugira que o Bora na Tech? apoia oficialmente seu uso, projeto, marca, curso ou comunidade sem autorização expressa.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">4. O que não entra nesta licença</h2>
                <p className="mt-3 leading-relaxed">
                  A licença não cobre marcas, logotipos, identidade visual, código-fonte da plataforma, conteúdos de terceiros, imagens externas, cursos externos, notícias de fontes externas, vagas, eventos, links, APIs, depoimentos, dados de usuários ou materiais indicados por curadoria.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">5. Forma recomendada de atribuição</h2>
                <div className="mt-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
                  Conteúdo adaptado de Bora na Tech? — https://boranatech.com.br — licenciado sob CC BY-NC-SA 4.0.
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl font-black text-slate-950">6. Pedidos de uso comercial</h2>
                <p className="mt-3 leading-relaxed">
                  Para uso comercial, parcerias, reprodução institucional ou licenciamento especial, entre em contato pelo perfil oficial do Bora na Tech? nas redes sociais.
                </p>
              </section>
            </div>
          </article>
        </div>
      </section>
    </Layout>
  );
}
