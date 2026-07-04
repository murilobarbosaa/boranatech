import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle,
  Languages,
  Mic,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import InglesSubNav from "@/components/shared/InglesSubNav";
import InglesTrilhaQuiz from "@/components/ingles/InglesTrilhaQuiz";
import InglesNivelTeste from "@/components/ingles/InglesNivelTeste";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { ENGLISH_LEVELS, type EnglishLevel } from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

const levelProfiles: { level: EnglishLevel; desc: string }[] = [
  {
    level: "Básico",
    desc: "Você entende palavras soltas e frases curtas, traduz quase tudo, trava ao ouvir inglês falado e ainda prefere documentação em português.",
  },
  {
    level: "Intermediário",
    desc: "Você lê documentação em inglês sem traduzir tudo, entende vídeos com legenda, escreve mensagens curtas em PRs, mas perde partes de conversa rápida.",
  },
  {
    level: "Avançado",
    desc: "Você acompanha reuniões e podcasts sem legenda, escreve PRs longos com naturalidade e explica decisões técnicas falando em inglês.",
  },
];

const levelTrack: { level: EnglishLevel; actions: string[]; exit: string }[] = [
  {
    level: "Básico",
    actions: [
      "Troque celular, GitHub e editor para inglês.",
      "Faça 10 minutos de app de idioma por dia (Duolingo ou British Council).",
      "Leia 1 página curta de documentação por dia e anote 5 termos novos.",
      "Assista vídeos com legenda em inglês e repita frases em voz alta.",
    ],
    exit: "Você está pronto para o próximo quando lê um README simples sem traduzir tudo e entende mensagens de erro comuns.",
  },
  {
    level: "Intermediário",
    actions: [
      "Leia documentação oficial direto em inglês, sem tradução automática.",
      "Escreva commits, issues e PRs em inglês.",
      "Assista tech talks com legenda em inglês e depois reassista sem legenda.",
      "Faça 1 conversa por semana (tutor, grupo ou IA) sobre o seu projeto.",
    ],
    exit: "Você está pronto para o próximo quando explica um projeto falando em inglês e acompanha um vídeo técnico sem legenda.",
  },
  {
    level: "Avançado",
    actions: [
      "Participe de comunidades internacionais escrevendo em inglês.",
      "Pratique entrevistas técnicas em inglês em voz alta e cronometradas.",
      "Faça code reviews em inglês com frases claras e educadas.",
      "Consuma conteúdo sem legenda e resuma em inglês escrito.",
    ],
    exit: "Você está pronto para vagas internacionais quando conduz uma reunião e uma entrevista técnica em inglês com confiança.",
  },
];

const navCards = [
  {
    href: "/ingles/onde-estudar",
    title: "Onde estudar",
    desc: "Plataformas, canais, podcasts e materiais separados por nível.",
    icon: BookOpen,
  },
  {
    href: "/ingles/no-trabalho",
    title: "No trabalho",
    desc: "Inglês mínimo por área e frases reais para o dia a dia dev.",
    icon: Briefcase,
  },
  {
    href: "/ingles/entrevista",
    title: "Entrevista técnica",
    desc: "Estrutura de respostas, método STAR e perguntas para fazer.",
    icon: Mic,
  },
  {
    href: "/ingles/vocabulario",
    title: "Vocabulário",
    desc: "Pegadinhas de quem fala português, pronúncia e termos essenciais.",
    icon: Languages,
  },
];

const checklist = [
  "Deixe GitHub, Cursor e documentação em inglês.",
  "Pesquise erros em inglês antes de traduzir.",
  "Mantenha um glossário pessoal com exemplos do seu projeto.",
  "Escreva commits simples em inglês: fix, add, update, remove.",
  "Leia README de projetos open source parecidos com os seus.",
  "Grave áudio de 1 minuto explicando o que você construiu.",
  "Use legenda em inglês, não português, quando assistir tech talks.",
  "Revise toda semana os termos que mais se repetiram.",
];

export default function Ingles() {
  const [mostrarQuiz, setMostrarQuiz] = useState(false);
  return (
    <Layout>
      <PageHero
        accent="sky"
        eyebrow="inglês no trabalho"
        title="Inglês para Tech"
        subtitle="Você não precisa ser fluente para começar. Precisa criar contato diário com documentação, erro, vídeo, README e conversa técnica."
      />
      <InglesSubNav />
      <section className="border-b-2 border-slate-900 bg-gradient-to-b from-sky-100 to-[#faf8f4] py-12">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
              teste de nível
            </p>
            <h2 className="font-display text-3xl font-black text-slate-950 sm:text-4xl">
              Descubra seu nível de inglês
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              15 perguntas rápidas de inglês técnico. No final você recebe seu
              nível e o próximo passo para evoluir.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl">
            <InglesNivelTeste />
          </div>
        </div>
      </section>
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                comece pelo uso real
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                O inglês que mais aparece na tecnologia
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                O objetivo não é falar perfeito. É conseguir ler documentação,
                entender mensagens de erro, pesquisar dúvidas, explicar seu
                projeto e participar de processos seletivos com mais confiança.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  "Documentação",
                  "Erros e terminal",
                  "Portfólio e entrevista",
                ].map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "rounded-xl border-2 p-4",
                      ac.panelBorder,
                      ac.panelSoft,
                    )}
                  >
                    <CheckCircle className={cn("mb-2 h-5 w-5", ac.iconMuted)} />
                    <p className="font-display text-lg font-black text-slate-950">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-brutal rounded-2xl bg-sky-100 p-6">
              <h3 className="font-display text-2xl font-black text-slate-950">
                Meta simples
              </h3>
              <p className="mt-3 text-sm font-bold text-slate-800">
                20 minutos por dia: 10 lendo, 5 ouvindo, 5 escrevendo uma frase
                sobre o que você estudou.
              </p>
              <p
                className={cn(
                  "mt-4 rounded-xl border-2 border-slate-900 bg-white p-3 text-xs font-black",
                  ac.tbodyAccentBold,
                )}
              >
                Inglês técnico cresce por repetição, não por maratona.
              </p>
            </div>
          </div>

          <div id="montar-trilha" className="scroll-mt-24">
            <div className="mb-5">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                próximo passo
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Agora monte sua trilha
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Depois de saber seu nível, monte uma trilha sob medida por nível
                e objetivo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarQuiz((v) => !v)}
              aria-expanded={mostrarQuiz}
              className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
            >
              <Target className="h-4 w-4" aria-hidden />
              {mostrarQuiz ? "Ocultar montador de trilha" : "Montar minha trilha"}
            </button>
            {mostrarQuiz ? (
              <div className="mt-4">
                <InglesTrilhaQuiz />
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-5 flex items-start gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950",
                  ac.brutalShadow,
                )}
              >
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>
                  auto-diagnóstico
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Qual é o seu nível?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Leia os três perfis e veja onde você está hoje antes de seguir
                  a trilha.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {levelProfiles.map((item) => (
                <div
                  key={item.level}
                  className="card-brutal rounded-2xl bg-white p-5"
                >
                  <p className="social-badge inline-flex px-3 py-1 text-xs font-black uppercase">
                    {item.level}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                trilha por nível
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                O que fazer em cada nível
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Ações concretas e um critério claro para subir de nível sem
                pressa.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {ENGLISH_LEVELS.map((level) => {
                const track = levelTrack.find((item) => item.level === level);
                if (!track) return null;
                return (
                  <div
                    key={level}
                    className="card-brutal flex flex-col rounded-2xl bg-white p-5"
                  >
                    <p className="social-badge inline-flex self-start px-3 py-1 text-xs font-black uppercase">
                      {level}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {track.actions.map((action) => (
                        <li key={action} className="flex gap-2">
                          <CheckCircle
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              ac.iconMuted,
                            )}
                          />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                    <p
                      className={cn(
                        "mt-4 rounded-xl border-2 border-slate-900 bg-white p-3 text-xs font-black",
                        ac.tbodyAccentBold,
                      )}
                    >
                      {track.exit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                explore por tema
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Continue por onde faz sentido
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {navCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={cn(
                    "card-brutal flex flex-col rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5",
                    ac.liftShadow,
                  )}
                >
                  <card.icon className={cn("mb-3 h-7 w-7", ac.iconMuted)} />
                  <h3 className="font-display text-xl font-black text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-slate-600">
                    {card.desc}
                  </p>
                  <span
                    className={cn(
                      "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase",
                      ac.link,
                    )}
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className={cn("card-brutal rounded-2xl p-6", ac.panelSoft)}>
            <h2 className="font-display text-2xl font-black">
              Checklist para evoluir sem travar
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              {checklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
