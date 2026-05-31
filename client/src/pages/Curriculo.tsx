import Layout from "@/components/Layout";
import { AiCtaLink } from "@/components/shared/AiCta";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { linkedinGuide, resumeTemplates } from "@/lib/careerToolsData";

const ac = getPageAccentUi("blue");

export default function Curriculo() {
  return (
    <Layout>
      <PageHero
        accent="blue"
        eyebrow="candidatura e visibilidade"
        title="Currículo e LinkedIn para Tech"
        subtitle="Apareça para os recrutadores certos."
        actions={
          <>
            <AiCtaLink
              href="/curriculo/analisar"
              description="Nota, lacunas e palavras-chave"
              accent="blue"
              className="w-full"
            >
              Analisar currículo com IA
            </AiCtaLink>
            <AiCtaLink
              href="/curriculo/linkedin"
              description="Headline, Sobre e visibilidade"
              accent="blue"
              className="w-full"
            >
              Otimizar LinkedIn com IA
            </AiCtaLink>
          </>
        }
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {resumeTemplates.map((template) => (
              <article
                key={template.area}
                className="card-brutal rounded-2xl bg-white p-5"
              >
                <h2 className="font-display text-xl font-black">
                  {template.area}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Template estruturado para área de {template.area}.
                </p>
                <DetailsChevronOnly
                  className="mt-4"
                  title={
                    <span className="btn-brutal-primary inline-flex rounded-full bg-white px-4 py-2 text-sm font-black">
                      Usar template
                    </span>
                  }
                >
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-white">
                    {template.body}
                  </pre>
                  <CopyButton className="mt-3" text={template.body} />
                </DetailsChevronOnly>
              </article>
            ))}
          </div>
          <div className="card-brutal rounded-2xl bg-white p-6">
            <h2 className="font-display text-2xl font-black">
              Guia de LinkedIn para tech
            </h2>
            <div className="mt-4 space-y-3">
              {linkedinGuide.map((item) => (
                <DetailsChevronOnly
                  key={item}
                  className="rounded-xl border-2 border-slate-900 p-4"
                  title={<span className="font-black">{item}</span>}
                >
                  <p className="mt-2 text-sm text-slate-600">
                    Escreva com palavras-chave da área, exemplos reais e links
                    para projetos. Seja específico sobre o que você busca.
                  </p>
                </DetailsChevronOnly>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
