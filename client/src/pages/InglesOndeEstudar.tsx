import {
  BookOpen,
  Bot,
  ExternalLink,
  GraduationCap,
  Headphones,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import InglesSubNav from "@/components/shared/InglesSubNav";
import PageHero from "@/components/shared/PageHero";
import VideoEmbedDialog from "@/components/shared/VideoEmbedDialog";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  ENGLISH_LEVELS,
  englishPodcasts,
  learnEnglishPlatforms,
  type EnglishLevel,
  type PlatformCost,
} from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

const costBadge: Record<PlatformCost, string> = {
  Grátis: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Freemium: "border-sky-300 bg-sky-50 text-sky-800",
  Pago: "border-slate-300 bg-slate-100 text-slate-700",
};

const cursorTips = [
  {
    title: "Peça explicações em inglês simples",
    prompt:
      "Explain this code in simple English, using short sentences and a glossary at the end.",
    desc: "Ajuda a praticar leitura técnica sem travar em frases longas.",
  },
  {
    title: "Transforme erro em aula",
    prompt:
      "Explain this error like I am learning English for tech. Highlight the key technical words.",
    desc: "Cole mensagens de erro e peça vocabulário, causa provável e próximos passos.",
  },
  {
    title: "Treine README bilíngue",
    prompt:
      "Rewrite this README section in clear beginner-friendly English, keeping the technical meaning.",
    desc: "Ótimo para portfólio, GitHub e candidaturas internacionais.",
  },
  {
    title: "Simule entrevista técnica",
    prompt:
      "Interview me in English for a junior front-end role. Ask one question at a time and correct my answer kindly.",
    desc: "Use para praticar respostas curtas sem decorar texto pronto.",
  },
  {
    title: "Crie flashcards do projeto",
    prompt:
      "Create 10 English flashcards from this codebase: term, meaning, example sentence.",
    desc: "Transforma o projeto atual em material de revisão.",
  },
  {
    title: "Corrija sem perder sua voz",
    prompt:
      "Correct my English, but keep my tone natural and explain the top 3 corrections.",
    desc: "Bom para posts, mensagens no LinkedIn, issues e pull requests.",
  },
];

const videoResources: {
  title: string;
  desc: string;
  url: string;
  level: EnglishLevel;
  sampleId?: string;
}[] = [
  {
    title: "BBC Learning English",
    desc: "Aulas curtas de vocabulário, pronúncia e listening.",
    sampleId: "WHCsOQvDkeQ",
    url: "https://www.youtube.com/@bbclearningenglish",
    level: "Básico",
  },
  {
    title: "English with Lucy",
    desc: "Pronúncia, frases úteis e inglês cotidiano com boa didática.",
    sampleId: "jrwglP9EQOU",
    url: "https://www.youtube.com/@EnglishwithLucy",
    level: "Básico",
  },
  {
    title: "mmmEnglish",
    desc: "Gramática e pronúncia explicadas com calma, ótimo para começar.",
    url: "https://www.youtube.com/@mmmEnglish",
    level: "Básico",
  },
  {
    title: "Rachel's English",
    desc: "Foco em pronúncia e sotaque americano, som por som.",
    url: "https://www.youtube.com/@rachelsenglish",
    level: "Básico",
  },
  {
    title: "freeCodeCamp Talks",
    desc: "Vídeos longos de tecnologia para treinar listening técnico com legenda.",
    sampleId: "nLRL_NcnK-4",
    url: "https://www.youtube.com/@freecodecamp",
    level: "Intermediário",
  },
  {
    title: "Fireship",
    desc: "Vídeos rápidos sobre tecnologias modernas, ótimo para vocabulário tech.",
    sampleId: "DHjqpvDnNGE",
    url: "https://www.youtube.com/@Fireship",
    level: "Intermediário",
  },
  {
    title: "Speak English With Vanessa",
    desc: "Inglês real do dia a dia com transcrição para acompanhar.",
    url: "https://www.youtube.com/@SpeakEnglishWithVanessa",
    level: "Intermediário",
  },
  {
    title: "Web Dev Simplified",
    desc: "Tutoriais de web claros e diretos para treinar inglês técnico.",
    url: "https://www.youtube.com/@WebDevSimplified",
    level: "Intermediário",
  },
  {
    title: "Traversy Media",
    desc: "Cursos práticos de desenvolvimento com explicação passo a passo.",
    url: "https://www.youtube.com/@TraversyMedia",
    level: "Intermediário",
  },
  {
    title: "Google Cloud Tech",
    desc: "Tech talks e demos para cloud, dados, IA e infraestrutura.",
    sampleId: "kzKFuHk8ovk",
    url: "https://www.youtube.com/@googlecloudtech",
    level: "Avançado",
  },
  {
    title: "ThePrimeagen",
    desc: "Conteúdo dev em inglês natural, bom para quem já tem base.",
    sampleId: "3q67v12M31M",
    url: "https://www.youtube.com/@ThePrimeTimeagen",
    level: "Avançado",
  },
  {
    title: "NetworkChuck",
    desc: "IT, redes, cloud e devops com energia e ritmo rápido.",
    url: "https://www.youtube.com/@NetworkChuck",
    level: "Avançado",
  },
];

const studyMaterials = [
  {
    title: "MDN Web Docs",
    type: "Documentação",
    desc: "Leia uma página curta por semana e anote termos repetidos.",
    url: "https://developer.mozilla.org/",
  },
  {
    title: "GitHub Docs",
    type: "Documentação",
    desc: "Aprenda palavras de issues, pull requests, branches e colaboração.",
    url: "https://docs.github.com/",
  },
  {
    title: "Microsoft Learn",
    type: "Curso",
    desc: "Módulos guiados com vocabulário de cloud, dados e carreira.",
    url: "https://learn.microsoft.com/training/",
  },
  {
    title: "Kaggle Learn",
    type: "Curso",
    desc: "Ótimo para treinar inglês em Python, dados e machine learning.",
    url: "https://www.kaggle.com/learn",
  },
  {
    title: "roadmap.sh",
    type: "Mapa",
    desc: "Use os mapas para aprender nomes de conceitos em inglês.",
    url: "https://roadmap.sh/",
  },
  {
    title: "Dev.to",
    type: "Artigos",
    desc: "Leia relatos e tutoriais curtos escritos por devs do mundo todo.",
    url: "https://dev.to/",
  },
  {
    title: "Stack Overflow",
    type: "Comunidade",
    desc: "Leia perguntas e respostas para entender erros reais em inglês.",
    url: "https://stackoverflow.com/",
  },
  {
    title: "Write the Docs",
    type: "Escrita",
    desc: "Referência para escrever documentação clara e profissional.",
    url: "https://www.writethedocs.org/",
  },
];

type ChannelItem = (typeof videoResources)[number];

function ChannelCard({ item }: { item: ChannelItem }) {
  const cardClass = cn(
    "card-brutal block w-full rounded-2xl bg-white p-5 text-left transition-all hover:-translate-y-0.5",
    ac.liftShadow,
  );
  const body = (
    <>
      <PlayCircle className="mb-3 h-7 w-7 text-red-600" />
      <h3 className="font-display text-xl font-black text-slate-950">
        {item.title}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
      {item.sampleId ? (
        <span
          className={cn(
            "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
            ac.link,
          )}
        >
          Assistir amostra <PlayCircle className="h-3 w-3" />
        </span>
      ) : (
        <span
          className={cn(
            "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
            ac.link,
          )}
        >
          Ver canal <ExternalLink className="h-3 w-3" />
        </span>
      )}
    </>
  );

  if (item.sampleId) {
    return (
      <VideoEmbedDialog
        source={item.sampleId}
        title={item.title}
        href={item.url}
      >
        <button type="button" className={cardClass}>
          {body}
        </button>
      </VideoEmbedDialog>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClass}
    >
      {body}
    </a>
  );
}

export default function InglesOndeEstudar() {
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Onde estudar inglês para tech"
        description="Plataformas, canais, podcasts e materiais reais para estudar inglês com foco em tecnologia, organizados por nível para criar contato diário."
        url="/ingles/onde-estudar"
        schemaType="CollectionPage"
      />
      <PageHero
        accent="sky"
        eyebrow="onde estudar"
        title="Onde estudar inglês"
        subtitle="Plataformas, canais, podcasts e materiais reais para criar contato diário com o idioma, organizados por nível."
      />
      <InglesSubNav />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  dicas de IA
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Use a IA como tutor de inglês técnico
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Aproveite seu próprio código, erros e README para estudar com
                  contexto real.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cursorTips.map((tip) => (
                <article
                  key={tip.title}
                  className={cn(
                    "rounded-2xl border-2 border-slate-200 p-4",
                    ac.panelSoft,
                  )}
                >
                  <Sparkles className={cn("mb-2 h-5 w-5", ac.iconMuted)} />
                  <h3 className="font-display text-lg font-black text-slate-950">
                    {tip.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600">{tip.desc}</p>
                  <p
                    className={cn(
                      "mt-3 rounded-xl border-2 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700",
                      ac.panelBorderInner,
                    )}
                  >
                    {tip.prompt}
                  </p>
                </article>
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
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  plataformas para aprender
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Onde aprender inglês de verdade
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Apps e cursos focados no idioma, separados por nível. Escolha
                  um e mantenha constância.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {ENGLISH_LEVELS.map((level) => {
                const items = learnEnglishPlatforms.filter(
                  (item) => item.level === level,
                );
                if (!items.length) return null;
                return (
                  <div key={level} className="space-y-4">
                    <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                      {level}
                    </p>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <a
                          key={item.name}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "card-brutal rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5",
                            ac.liftShadow,
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                                costBadge[item.cost],
                              )}
                            >
                              {item.cost}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                                ac.panelSoft,
                                ac.tbodyAccent,
                              )}
                            >
                              {item.level}
                            </span>
                          </div>
                          <h3 className="mt-3 font-display text-xl font-black text-slate-950">
                            {item.name}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.desc}
                          </p>
                          <span
                            className={cn(
                              "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
                              ac.link,
                            )}
                          >
                            Abrir site <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  vídeos para praticar
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Canais e vídeos úteis
                </h2>
              </div>
              <p className="hidden max-w-md text-sm text-slate-600 md:block">
                Comece com legenda em inglês. Depois reassista trechos curtos
                sem legenda.
              </p>
            </div>
            <div className="space-y-6">
              {ENGLISH_LEVELS.map((level) => {
                const items = videoResources.filter(
                  (item) => item.level === level,
                );
                if (!items.length) return null;
                return (
                  <div key={level} className="space-y-4">
                    <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                      {level}
                    </p>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <ChannelCard key={item.title} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
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
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  podcasts e talks
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Treine o ouvido por nível
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Ouça no trajeto e repita trechos em voz alta para fixar ritmo
                  e pronúncia.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {ENGLISH_LEVELS.map((level) => {
                const items = englishPodcasts.filter(
                  (item) => item.level === level,
                );
                if (!items.length) return null;
                return (
                  <div key={level} className="space-y-4">
                    <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                      {level}
                    </p>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <a
                          key={item.name}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "card-brutal rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5",
                            ac.liftShadow,
                          )}
                        >
                          <Headphones
                            className={cn("mb-3 h-6 w-6", ac.iconMuted)}
                          />
                          <h3 className="font-display text-xl font-black text-slate-950">
                            {item.name}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.desc}
                          </p>
                          <span
                            className={cn(
                              "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
                              ac.link,
                            )}
                          >
                            Ouvir <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                materiais e referências
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Onde estudar inglês com conteúdo tech
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {studyMaterials.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "card-brutal rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5",
                    ac.liftShadow,
                  )}
                >
                  <BookOpen className={cn("mb-3 h-6 w-6", ac.iconMuted)} />
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-black uppercase",
                      ac.panelSoft,
                      ac.tbodyAccent,
                    )}
                  >
                    {item.type}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-black text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
