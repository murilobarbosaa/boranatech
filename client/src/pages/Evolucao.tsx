import { Lightbulb, PlayCircle, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { careerEvolutionByArea, certifications, evolutionTracks } from "@/lib/careerToolsData";

const ac = getPageAccentUi("emerald");

export default function Evolucao() {
  return (
    <Layout>
      <PageHero
        accent="emerald"
        eyebrow="crescimento profissional"
        title="Evolução de Carreira em Tech"
        subtitle="O que você precisa para crescer em cada nível."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
        <div>
          <div className="mb-5">
            <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">trilha de crescimento</p>
            <h2 className="font-display text-3xl font-black text-slate-950">Do primeiro estágio ou trainee à liderança</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              Cada etapa pede evidências diferentes. Para sair de estudante para estágio ou trainee, o mais importante é provar aprendizado, clareza e potencial.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {evolutionTracks.map((track) => (
              <DetailsChevronOnly
                key={track.title}
                className="card-brutal rounded-2xl bg-white p-5"
                defaultOpen={track.title === "Estudante → Estagiário"}
                title={<span className="font-display text-xl font-black">{track.title}</span>}
              >
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p><strong>Técnicas:</strong> {track.technical.join(", ")}</p>
                  <p><strong>Soft skills:</strong> {track.soft.join(", ")}</p>
                  <p><strong>Tempo médio:</strong> {track.time}</p>
                  <p><strong>Sinal de prontidão:</strong> {track.ready}</p>
                  <p><strong>Como acelerar:</strong> {track.accelerate}</p>
                </div>
              </DetailsChevronOnly>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5">
            <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">por área escolhida</p>
            <h2 className="font-display text-3xl font-black text-slate-950">Dicas, vídeos e sugestões por caminho</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              Escolha a área que você quer seguir e use os projetos, dicas e vídeos como guia para evoluir com foco.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {careerEvolutionByArea.map((item) => (
              <article key={item.area} className="card-brutal rounded-2xl bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn("mb-2 inline-flex rounded-full px-2 py-1 text-xs font-black uppercase", ac.panelSoft, ac.tbodyAccent)}>área</p>
                    <h3 className="font-display text-2xl font-black text-slate-950">{item.area}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600">{item.focus}</p>
                  </div>
                  <Target className={cn("h-7 w-7 shrink-0", ac.iconMuted)} />
                </div>

                <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase text-amber-700">primeiro projeto recomendado</p>
                  <p className="mt-1 font-display text-lg font-black text-slate-950">{item.firstProject}</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 font-display text-lg font-black text-slate-950">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Dicas
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {item.tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", ac.progressFill)} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-display text-lg font-black text-slate-950">Próximos passos</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {item.nextSteps.map((step) => (
                        <li key={step} className={cn("rounded-xl px-3 py-2 font-bold", ac.panelSoft, ac.tbodyAccent)}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {item.videos.map((video) => (
                    <a
                      key={video.title}
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:border-red-400 hover:bg-red-100"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {video.title}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card-brutal overflow-x-auto rounded-2xl bg-white"><table className="w-full min-w-[760px] text-sm"><thead className={cn(ac.tableBanner)}><tr><th className="p-3 text-left">Certificação</th><th className="p-3 text-left">Área</th><th className="p-3 text-left">Dificuldade</th><th className="p-3 text-left">Custo</th><th className="p-3 text-left">Impacto</th><th className="p-3 text-left">Vale a pena?</th></tr></thead><tbody>{certifications.map((cert) => <tr key={cert.name} className="border-t"><td className="p-3 font-bold">{cert.name}</td><td className="p-3">{cert.area}</td><td className="p-3">{cert.difficulty}</td><td className="p-3">{cert.cost}</td><td className="p-3">{cert.impact}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${cert.worth ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{cert.worth ? "Sim" : "Depende"}</span></td></tr>)}</tbody></table></div>
        <div className="card-brutal rounded-2xl bg-white p-6">
          <h2 className="font-display text-2xl font-black">Guia de trabalho no exterior</h2>
          {["Plataformas que contratam devs brasileiros remotamente", "Nível de inglês necessário por área", "Como receber em dólar/euro no Brasil", "Como adaptar o currículo para o mercado internacional"].map((item) => (
            <DetailsChevronOnly key={item} className="mt-3 rounded-xl border-2 border-slate-900 p-4" title={<span className="font-black">{item}</span>}>
              <p className="mt-2 text-sm text-slate-600">Comece com inglês técnico, portfólio em inglês e plataformas como Toptal, Turing, Andela, Remote.com e Gun.io.</p>
            </DetailsChevronOnly>
          ))}
        </div>
        </div>
      </section>
    </Layout>
  );
}
