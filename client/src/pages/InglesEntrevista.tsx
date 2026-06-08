import { HelpCircle, ListChecks, Presentation, UserRound } from "lucide-react";
import Layout from "@/components/Layout";
import InglesSubNav from "@/components/shared/InglesSubNav";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("sky");

const tellAboutYourself: { label: string; en: string }[] = [
  {
    label: "Presente (quem você é)",
    en: "I am a junior front-end developer focused on React.",
  },
  {
    label: "Passado (como chegou aqui)",
    en: "I started by building small projects and recently finished a bootcamp.",
  },
  {
    label: "Futuro (o que busca)",
    en: "Now I am looking for a role where I can grow and contribute to a real product.",
  },
];

const starMethod: { label: string; en: string }[] = [
  {
    label: "Situation",
    en: "On my last project, the build was failing often.",
  },
  {
    label: "Task",
    en: "I was responsible for making the pipeline stable.",
  },
  { label: "Action", en: "I added tests and fixed the flaky steps." },
  { label: "Result", en: "Deploys became reliable and we saved time." },
];

const projectNarrative = [
  "The goal of the project was to...",
  "My main responsibility was...",
  "The biggest challenge was... and I solved it by...",
  "If I had more time, I would improve...",
];

const questionsToAsk = [
  "What does a typical day look like for this role?",
  "How is the team structured?",
  "What would success look like in the first three months?",
  "How do you handle code reviews and feedback?",
];

export default function InglesEntrevista() {
  return (
    <Layout>
      <PageHero
        accent="sky"
        eyebrow="entrevista técnica"
        title="Inglês para entrevista técnica"
        subtitle="Estruturas prontas para se apresentar, responder perguntas comportamentais, narrar um projeto e fazer boas perguntas em inglês."
      />
      <InglesSubNav />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className={cn("h-6 w-6", ac.iconMuted)} />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Tell me about yourself
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Siga a ordem presente, passado e futuro para uma resposta curta e
              clara.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {tellAboutYourself.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-2xl border-2 p-4",
                    ac.panelBorderInner,
                    ac.panelSoft,
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-black uppercase",
                      ac.tbodyAccent,
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {item.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className={cn("h-6 w-6", ac.iconMuted)} />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Método STAR para perguntas comportamentais
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Situation, Task, Action e Result para contar uma história com
              começo, meio e fim.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {starMethod.map((item) => (
                <div
                  key={item.label}
                  className="flex gap-3 rounded-xl border-2 border-slate-100 bg-slate-50 p-3"
                >
                  <span
                    className={cn(
                      "w-24 shrink-0 font-display text-sm font-black",
                      ac.link,
                    )}
                  >
                    {item.label}
                  </span>
                  <p className="text-sm text-slate-700">{item.en}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-brutal rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Presentation className={cn("h-6 w-6", ac.iconMuted)} />
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Como narrar um projeto
                </h2>
              </div>
              <div className="space-y-2">
                {projectNarrative.map((line) => (
                  <p
                    key={line}
                    className={cn(
                      "rounded-xl p-3 text-sm font-bold text-slate-700",
                      ac.panelSoft,
                    )}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="card-brutal rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className={cn("h-6 w-6", ac.iconMuted)} />
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Perguntas para fazer ao entrevistador
                </h2>
              </div>
              <div className="space-y-2">
                {questionsToAsk.map((line) => (
                  <p
                    key={line}
                    className={cn(
                      "rounded-xl p-3 text-sm font-bold text-slate-700",
                      ac.panelSoft,
                    )}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
