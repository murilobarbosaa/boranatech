import { useRoute, Link } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { areasTI } from "@/lib/data";
import { ArrowLeft, Clock } from "lucide-react";

export default function SubAreaDetalhe() {
  const [, params] = useRoute("/areas/:parent/:subarea");
  const parent = params?.parent;
  const subareaSlug = params?.subarea;

  const parentArea = areasTI.find((a) => a.slug === parent);
  const subarea = parentArea?.subareas?.find((s) => s.slug === subareaSlug);

  if (!parentArea) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="font-mono text-sm text-slate-600">Área não encontrada.</p>
          <Link
            href="/areas"
            className="mt-4 inline-flex items-center gap-2 text-violet-700 hover:underline"
          >
            Ver todas as áreas
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`${subarea?.nome ?? "Subárea"} — ${parentArea.nome} · Bora na Tech?`}
        description={`Subárea de ${parentArea.nome}. Conteúdo em construção.`}
        url={`/areas/${parent}/${subareaSlug}`}
      />
      <div className="container max-w-2xl py-16">
        <Link
          href={`/areas/${parent}`}
          className="mb-8 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3} />
          Voltar para {parentArea.nome}
        </Link>

        <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-8 shadow-[4px_4px_0_#0f172a] md:p-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-300 bg-slate-100">
            <Clock className="h-7 w-7 text-slate-500" strokeWidth={2.5} />
          </div>

          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-violet-700">
            {parentArea.nome} · Subárea
          </p>

          <h1 className="font-display mb-4 text-4xl font-black text-slate-950 md:text-5xl">
            {subarea?.nome ?? "Subárea em construção"}
          </h1>

          <p className="text-base font-semibold text-slate-600">
            Estamos preparando conteúdo detalhado para essa subárea. Por enquanto, confira a página
            completa de {parentArea.nome}.
          </p>
        </div>
      </div>
    </Layout>
  );
}
