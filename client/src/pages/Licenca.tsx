import { ExternalLink, Share2 } from "lucide-react";
import LegalPage, { LegalText } from "@/components/legal/LegalPage";
import SEO from "@/components/SEO";

const updatedAt = "2026-05-07";

export default function Licenca() {
  return (
    <>
      <SEO
        title="Licença de Conteúdo — Bora na Tech?"
        description="Conheça a licença Creative Commons aplicada aos conteúdos originais do Bora na Tech? e as regras para reutilização."
        keywords={[
          "licença creative commons",
          "bora na tech licença",
          "cc by nc sa",
          "conteúdo educacional tecnologia",
        ]}
        url="/licenca"
        schemaType="WebPage"
        modifiedTime={updatedAt}
      />
      <LegalPage
        eyebrow="creative commons"
        title="Compartilhe conhecimento sem apagar a autoria."
        subtitle="O conteúdo original do Bora na Tech? pode circular, virar aula, post, checklist e material de comunidade, desde que a fonte seja reconhecida e o uso continue educacional."
        updatedAt="7 de maio de 2026"
        icon={<Share2 className="h-7 w-7 text-slate-950" aria-hidden />}
        tone={{
          hero: "bg-[#faf8f4]",
          badge: "bg-[#FFB800]",
          shadow: "shadow-slate-200",
          soft: "bg-[#faf8f4]",
          accentText: "text-slate-950",
          marker: "bg-[#FFB800]",
        }}
        highlights={[
          { label: "Licença", value: "CC BY-NC-SA 4.0" },
          { label: "Pode", value: "Compartilhar e adaptar com atribuição" },
          { label: "Não pode", value: "Revender ou sugerir endosso oficial" },
        ]}
        relatedLinks={[
          {
            href: "/termos-de-uso",
            label: "Termos de Uso",
            description: "Regras gerais da plataforma.",
          },
          {
            href: "/privacidade",
            label: "Privacidade",
            description: "Como tratamos dados pessoais.",
          },
          {
            href: "/sobre",
            label: "Sobre",
            description: "Conheça a missão do projeto.",
          },
        ]}
        sections={[
          {
            id: "licenca-escolhida",
            title: "1. Licença escolhida",
            body: (
              <LegalText>
                Salvo indicação em contrário, textos, explicações, guias,
                listas, roadmaps editoriais, glossários e materiais educacionais
                originais do Bora na Tech? estão licenciados sob{" "}
                <a
                  className="font-black text-slate-950 underline"
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br"
                  rel="license noopener noreferrer"
                  target="_blank"
                >
                  CC BY-NC-SA 4.0
                  <ExternalLink
                    className="ml-1 inline h-3.5 w-3.5"
                    aria-hidden
                  />
                </a>
                .
              </LegalText>
            ),
          },
          {
            id: "pode-fazer",
            title: "2. O que você pode fazer",
            items: [
              "Compartilhar o material, copiando e redistribuindo em qualquer meio ou formato.",
              "Adaptar o material, remixando, transformando ou criando conteúdo derivado.",
              "Usar o material em estudos, aulas, mentorias gratuitas, projetos educacionais e comunidades.",
            ],
          },
          {
            id: "condicoes",
            title: "3. Condições de uso",
            items: [
              'Atribuição: cite "Bora na Tech?" e inclua link para https://boranatech.com.br.',
              "Não comercial: não use o conteúdo original do projeto como parte principal de produto pago, curso pago, apostila paga, assinatura, consultoria ou material vendido.",
              "Compartilha igual: se você adaptar o conteúdo, distribua sua adaptação sob a mesma licença ou licença compatível.",
              "Sem endosso: não sugira que o Bora na Tech? apoia oficialmente seu uso, projeto, marca, curso ou comunidade sem autorização expressa.",
            ],
          },
          {
            id: "fora-da-licenca",
            title: "4. O que não entra nesta licença",
            body: (
              <LegalText>
                A licença não cobre marcas, logotipos, identidade visual,
                código-fonte da plataforma, conteúdos de terceiros, imagens
                externas, cursos externos, notícias de fontes externas, vagas,
                eventos, links, APIs, depoimentos, dados de usuários ou
                materiais indicados por curadoria.
              </LegalText>
            ),
          },
          {
            id: "atribuicao",
            title: "5. Forma recomendada de atribuição",
            body: (
              <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-slate-50 p-4 font-mono text-sm font-semibold text-slate-800">
                Conteúdo adaptado de Bora na Tech? - https://boranatech.com.br -
                licenciado sob CC BY-NC-SA 4.0.
              </div>
            ),
          },
          {
            id: "uso-comercial",
            title: "6. Pedidos de uso comercial",
            body: (
              <LegalText>
                Para uso comercial, parcerias, reprodução institucional ou
                licenciamento especial, entre em contato pelo perfil oficial do
                Bora na Tech? nas redes sociais.
              </LegalText>
            ),
          },
        ]}
      />
    </>
  );
}
