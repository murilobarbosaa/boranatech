import { Link } from "wouter";
import { Bot, Compass, Filter, HeartHandshake, Map, Newspaper, Sparkles, Target } from "lucide-react";

import Layout from "@/components/Layout";

const offerings = [
  {
    icon: Map,
    title: "Curadoria completa",
    description: "Áreas, roadmaps, cursos e plataformas organizados por nível.",
  },
  {
    icon: Bot,
    title: "IA para sua carreira",
    description: "Análise de currículo, LinkedIn, plano de estudos e mais.",
  },
  {
    icon: Newspaper,
    title: "Conteúdo filtrado",
    description: "Notícias, eventos e vagas relevantes para iniciantes.",
  },
  {
    icon: Target,
    title: "Do gratuito ao Pro",
    description: "Comece de graça, vá mais fundo quando estiver pronto.",
  },
];

const values = [
  {
    title: "Clareza acima de tudo",
    description: "Sem jargão, sem enrolação.",
  },
  {
    title: "Feito para quem está começando",
    description: "Não assumimos conhecimento prévio.",
  },
  {
    title: "Curadoria, não volume",
    description: "Menos e melhor.",
  },
  {
    title: "Tecnologia como ferramenta",
    description: "O objetivo é a sua carreira, não a tech em si.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-1 text-xs font-black uppercase tracking-wide text-[#1a1a1a] shadow-[3px_3px_0_#0f172a]">
      {children}
    </p>
  );
}

export default function SobreRedesign() {
  return (
    <Layout>
      <main className="bg-[#f5f0e8] text-[#1a1a1a]">
        <section className="border-b-2 border-[#1a1a1a] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>SOBRE O PROJETO</Eyebrow>
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <h1 className="font-display text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
                  A TI é enorme. A gente organiza para você.
                </h1>
                <p className="mt-6 max-w-3xl text-lg font-bold leading-relaxed text-slate-700 sm:text-xl">
                  O Bora na Tech? nasceu para ser a bússola de quem está começando na tecnologia — sem jargão,
                  sem enrolação, com direção.
                </p>
              </div>
              <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
                <Compass className="mb-5 h-12 w-12 text-[#FFB800]" strokeWidth={2.5} />
                <p className="text-lg font-black leading-snug">
                  Direção clara para escolher uma área, estudar com foco e dar os primeiros passos na carreira.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/"
                className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5"
              >
                Começar agora
              </Link>
              <Link
                href="/pro"
                className="rounded-full border-2 border-[#1a1a1a] bg-white px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" id="missao">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-[#FFB800] p-8 shadow-[4px_4px_0_#0f172a]">
              <Sparkles className="mb-5 h-10 w-10" strokeWidth={2.5} />
              <p className="font-display text-3xl font-black leading-tight">
                “Feito por quem já esteve no seu lugar.”
              </p>
            </div>
            <div>
              <Eyebrow>COMO SURGIU</Eyebrow>
              <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
                Começamos porque sentimos na pele.
              </h2>
              <p className="mt-5 text-lg font-bold leading-relaxed text-slate-700">
                A dificuldade de entender por onde começar na tecnologia é real. São dezenas de áreas, centenas de
                cursos, mil opiniões diferentes — e nenhuma bússola. O Bora na Tech? é a plataforma que gostaríamos de
                ter encontrado quando começamos.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-[#1a1a1a] bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>O QUE OFERECEMOS</Eyebrow>
            <h2 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl">
              Tudo que você precisa para começar com direção.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {offerings.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border-2 border-[#1a1a1a] bg-[#f5f0e8] p-6 shadow-[4px_4px_0_#0f172a]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-[#FFB800]">
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-display text-2xl font-black">{item.title}</h3>
                    <p className="mt-3 font-bold leading-relaxed text-slate-700">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>QUEM FAZ</Eyebrow>
            <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">Feito com propósito.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                { initials: "MC", name: "Murilo Cardoso", role: "Co-fundador • Engenheiro de Software e IA" },
                { initials: "AJ", name: "Ana Julia Moura", role: "Co-fundadora" },
              ].map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-5 rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display text-2xl font-black">
                    {person.initials}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-black">{person.name}</h3>
                    <p className="mt-1 font-bold text-slate-600">{person.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>NOSSOS PRINCÍPIOS</Eyebrow>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {values.map((item) => (
                <div key={item.title} className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
                  <HeartHandshake className="mb-5 h-8 w-8" strokeWidth={2.5} />
                  <h3 className="font-display text-xl font-black leading-tight">{item.title}</h3>
                  <p className="mt-3 font-bold leading-relaxed text-slate-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl border-2 border-[#1a1a1a] bg-[#1a1a1a] p-8 text-white shadow-[4px_4px_0_#FFB800] sm:p-10">
            <Filter className="mb-5 h-10 w-10 text-[#FFB800]" strokeWidth={2.5} />
            <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">Pronto para começar?</h2>
            <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-slate-200">
              Crie sua conta gratuitamente e descubra por onde começar.
            </p>
            <Link
              href="/cadastro"
              className="mt-8 inline-flex rounded-full border-2 border-[#FFB800] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#ffffff] transition-transform hover:-translate-y-0.5"
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
