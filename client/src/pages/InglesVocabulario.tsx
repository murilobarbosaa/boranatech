import { AlertTriangle, Repeat, Volume2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import InglesSubNav from "@/components/shared/InglesSubNav";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  englishFalseFriends,
  englishPhrasalVerbs,
  englishTechPronunciation,
  englishVocabulary,
} from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

export default function InglesVocabulario() {
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Vocabulário de inglês para tech"
        description="Os erros clássicos de quem fala português, como pronunciar termos técnicos e o vocabulário de inglês que mais aparece em vagas e projetos reais."
        url="/ingles/vocabulario"
      />
      <PageHero
        accent="sky"
        eyebrow="vocabulário"
        title="Vocabulário e armadilhas"
        subtitle="Os erros clássicos de quem fala português, como pronunciar termos técnicos e o vocabulário que mais aparece em vagas e projetos."
      />
      <InglesSubNav />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  pegadinhas
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Pegadinhas de quem fala português
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  False friends e erros clássicos no formato errado para certo.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {englishFalseFriends.map((item) => (
                <div
                  key={item.wrong}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <p className="text-sm font-black text-rose-700 line-through">
                    {item.wrong}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700">
                    {item.right}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  pronúncia
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Como pronunciar termos técnicos
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Re-grafia simples para os termos que dev brasileiro costuma
                  errar.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {englishTechPronunciation.map((item) => (
                <div
                  key={item.term}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {item.term}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 inline-flex rounded-full border px-3 py-1 font-mono text-sm font-black",
                      ac.panelSoft,
                      ac.tbodyAccent,
                    )}
                  >
                    {item.say}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                vocabulário essencial
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Termos que aparecem em vagas, docs e projetos
              </h2>
            </div>
            <div className="card-brutal rounded-2xl bg-white p-5">
              <div className="flex flex-wrap gap-2">
                {englishVocabulary.map((term) => (
                  <span
                    key={term}
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-bold",
                      ac.panelSoft,
                      ac.tbodyAccent,
                    )}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Repeat className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  phrasal verbs
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Phrasal verbs que aparecem no trabalho
                </h2>
                {/* TODO(Ana): revisar a copy do cabecalho desta secao nova */}
                <p className="mt-1 text-sm text-slate-600">
                  Verbos compostos comuns no dia a dia tech, com tradução e
                  exemplo de uso.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {englishPhrasalVerbs.map((item) => (
                <div
                  key={item.phrase}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {item.phrase}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {item.meaning_pt}
                  </p>
                  <p className="mt-2 text-xs italic text-slate-600">
                    "{item.example}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
