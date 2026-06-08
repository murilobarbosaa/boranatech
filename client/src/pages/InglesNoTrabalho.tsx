import { MessageSquareText } from "lucide-react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import InglesSubNav from "@/components/shared/InglesSubNav";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { englishWorkPhrases, type EnglishLevel } from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

const englishByArea: {
  area: string;
  level: string;
  levelTag: EnglishLevel;
  focus: string;
}[] = [
  {
    area: "Front-end",
    level: "Básico para documentação",
    levelTag: "Básico",
    focus:
      "HTML, CSS, JavaScript, mensagens de erro, acessibilidade e documentação de bibliotecas.",
  },
  {
    area: "Back-end",
    level: "Intermediário recomendado",
    levelTag: "Intermediário",
    focus:
      "APIs, banco de dados, autenticação, logs, documentação técnica e troubleshooting.",
  },
  {
    area: "Dados / IA",
    level: "Intermediário recomendado",
    levelTag: "Intermediário",
    focus:
      "Artigos, notebooks, datasets, estatística, documentação de bibliotecas e papers simples.",
  },
  {
    area: "DevOps / Cloud",
    level: "Intermediário forte",
    levelTag: "Intermediário",
    focus:
      "Documentação oficial, mensagens de terminal, incidentes, logs, cloud e segurança.",
  },
  {
    area: "UX/UI e Produto",
    level: "Básico a intermediário",
    levelTag: "Básico",
    focus:
      "Research, usability, product discovery, métricas, benchmarks e apresentações.",
  },
  {
    area: "QA / Testes",
    level: "Básico a intermediário",
    levelTag: "Básico",
    focus:
      "Bug reports, test cases, acceptance criteria, API testing e documentação de ferramentas.",
  },
];

const practicePlan = [
  { day: "Segunda", task: "Ler 1 página de documentação e grifar 10 termos." },
  { day: "Terça", task: "Assistir 1 vídeo curto com legenda em inglês." },
  {
    day: "Quarta",
    task: "Pedir à IA para explicar um erro ou trecho de código em inglês simples.",
  },
  {
    day: "Quinta",
    task: "Escrever 5 frases sobre seu projeto usando vocabulário técnico.",
  },
  { day: "Sexta", task: "Atualizar uma parte do README em inglês." },
  {
    day: "Sábado",
    task: "Simular 3 perguntas de entrevista técnica em inglês.",
  },
  { day: "Domingo", task: "Revisar flashcards e separar dúvidas da semana." },
];

export default function InglesNoTrabalho() {
  return (
    <Layout>
      <PageHero
        accent="sky"
        eyebrow="inglês no trabalho"
        title="Inglês no trabalho de verdade"
        subtitle="O que estudar por área e as frases reais que aparecem em PR, daily, Slack e conversa com o time."
      />
      <InglesSubNav />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="card-brutal overflow-hidden rounded-2xl bg-white">
            <div
              className={cn("border-b-2 border-slate-900 p-5", ac.tableBanner)}
            >
              <h2 className="font-display text-2xl font-black">
                Inglês mínimo por área
              </h2>
              <p className={cn("mt-1 text-sm", ac.tableBannerMuted)}>
                Use isso para priorizar o que estudar primeiro.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className={cn(ac.theadLight)}>
                  <tr>
                    <th className="p-3 text-left">Área</th>
                    <th className="p-3 text-left">Nível recomendado</th>
                    <th className="p-3 text-left">Onde focar</th>
                  </tr>
                </thead>
                <tbody>
                  {englishByArea.map((item) => (
                    <tr key={item.area} className="border-t border-slate-200">
                      <td className="p-3 font-black">{item.area}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                            ac.panelSoft,
                            ac.tbodyAccent,
                          )}
                        >
                          {item.levelTag}
                        </span>
                        <span
                          className={cn(
                            "mt-1 block text-xs",
                            ac.tbodyAccentBold,
                          )}
                        >
                          {item.level}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquareText className={cn("h-6 w-6", ac.iconMuted)} />
              <h2 className="font-display text-3xl font-black text-slate-950">
                Inglês para o trabalho de verdade
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Frases curtas e reais por situação. Abra o grupo que você precisa
              hoje.
            </p>
            {englishWorkPhrases.map((group) => (
              <DetailsChevronOnly
                key={group.situation}
                className="card-brutal rounded-2xl bg-white p-5"
                title={
                  <span className="font-display text-xl font-black">
                    {group.situation}
                  </span>
                }
              >
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {group.phrases.map((phrase) => (
                    <div
                      key={phrase.en}
                      className={cn(
                        "rounded-xl border-2 p-3",
                        ac.panelBorderInner,
                        ac.panelSoft,
                      )}
                    >
                      <p className="text-sm font-black text-slate-950">
                        {phrase.en}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{phrase.pt}</p>
                    </div>
                  ))}
                </div>
              </DetailsChevronOnly>
            ))}
          </div>

          <div className="card-brutal rounded-2xl bg-white p-6">
            <h2 className="font-display text-2xl font-black text-slate-950">
              Plano semanal de prática
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {practicePlan.map((item) => (
                <div
                  key={item.day}
                  className="flex gap-3 rounded-xl border-2 border-slate-100 bg-slate-50 p-3"
                >
                  <span
                    className={cn(
                      "w-20 shrink-0 font-display text-sm font-black",
                      ac.link,
                    )}
                  >
                    {item.day}
                  </span>
                  <p className="text-sm text-slate-700">{item.task}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
