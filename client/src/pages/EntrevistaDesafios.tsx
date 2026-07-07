import Layout from "@/components/Layout";
import { AiCtaLink } from "@/components/shared/AiCta";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { technicalChallenges } from "@/lib/careerToolsData";

export default function EntrevistaDesafios() {
  const { isPro, loading } = useSubscription();
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Banco de desafios técnicos para praticar"
        description="Pratique desafios técnicos parecidos com os de processos seletivos reais e chegue mais preparado para a etapa prática das entrevistas em tecnologia."
        url="/entrevistas/desafios"
        schemaType="CollectionPage"
      />
      <PageHero
        title="Banco de Desafios Técnicos"
        subtitle="Pratique desafios parecidos com processos seletivos reais."
        accent="blue"
      />
      <section className="container grid gap-5 py-12 md:grid-cols-2 lg:grid-cols-3">
        {technicalChallenges.map((challenge) => (
          <DetailsChevronOnly
            key={challenge.name}
            className="card-brutal rounded-2xl bg-white p-5"
            title={
              <span className="font-display text-xl font-black">
                {challenge.name}
              </span>
            }
          >
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <strong>Área:</strong> {challenge.area}
              </p>
              <p>
                <strong>Dificuldade:</strong> {challenge.difficulty}
              </p>
              <p>
                <strong>Tempo médio:</strong> {challenge.time}
              </p>
              <p>
                <strong>Usado por:</strong> {challenge.usedBy}
              </p>
              <p>{challenge.statement}</p>
              <a
                className="font-black text-violet-700 hover:underline"
                href={challenge.solutionUrl}
                target="_blank"
                rel="noreferrer"
              >
                Solução no GitHub
              </a>
            </div>
          </DetailsChevronOnly>
        ))}
      </section>
      {!isPro && !loading ? (
        <section className="container pb-16">
          {/* TODO(Ana): copy da CTA do simulador (momento de dor pos-desafios) */}
          <AiCtaLink
            href="/entrevistas"
            description="Treine a entrevista completa e receba feedback"
            accent="blue"
            className="w-full"
          >
            Treinou os desafios? Agora simule a entrevista com IA
          </AiCtaLink>
        </section>
      ) : null}
    </Layout>
  );
}
