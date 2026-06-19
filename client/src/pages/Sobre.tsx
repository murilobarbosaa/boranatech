import { Link } from "wouter";
import { Icon } from "@iconify/react";
import {
  Bot,
  Compass,
  HeartHandshake,
  Map,
  Newspaper,
  Sparkles,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

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

export default function Sobre() {
  const { user } = useAuth();
  return (
    <Layout>
      <main className="bg-[#faf8f4] text-[#1a1a1a]">
        <section className="border-b-2 border-[#1a1a1a] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>SOBRE O PROJETO</Eyebrow>
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                  A TI é enorme. A gente organiza para você.
                </h1>
                <p className="mt-6 max-w-3xl text-lg font-bold leading-relaxed text-slate-700 sm:text-xl">
                  O Bora na Tech? nasceu para ser a bússola de quem está
                  começando na tecnologia, sem jargão, sem enrolação, com
                  direção.
                </p>
              </div>
              <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
                <Compass
                  className="mb-5 h-12 w-12 text-[#FFB800]"
                  strokeWidth={2.5}
                />
                <p className="text-lg font-black leading-snug">
                  Direção clara para escolher uma área, estudar com foco e dar
                  os primeiros passos na carreira.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={user ? "/perfil" : "/cadastro"}
                className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5"
              >
                {user ? "Ir para o painel" : "Começar agora"}
              </Link>
              <Link
                href="/planos"
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
                A dificuldade de entender por onde começar na tecnologia é real.
                São dezenas de áreas, centenas de cursos, mil opiniões
                diferentes, e nenhuma bússola. O Bora na Tech? é a plataforma
                que gostaríamos de ter encontrado quando começamos.
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
                    className="rounded-3xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-6 shadow-[4px_4px_0_#0f172a]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-[#FFB800]">
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-display text-2xl font-black">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-bold leading-relaxed text-slate-700">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>QUEM FAZ</Eyebrow>
            <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
              Feito com propósito.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                {
                  initials: "AJ",
                  name: "Ana Julia Moura",
                  role: "Co-fundadora e CEO",
                  linkedin: "https://www.linkedin.com/in/anajulia-moura/",
                  instagram: "https://www.instagram.com/ana.natech/",
                },
                {
                  initials: "MC",
                  name: "Murilo Cardoso",
                  role: "Co-fundador e CTO",
                  linkedin: "https://www.linkedin.com/in/murilocardoso-dev/",
                  instagram: "https://www.instagram.com/omurilo.tech/",
                },
              ].map((person) => (
                <div
                  key={person.name}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display text-2xl font-black">
                      {person.initials}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-black">
                        {person.name}
                      </h3>
                      <p className="mt-1 font-bold text-slate-600">
                        {person.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LinkedIn da ${person.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0_#0f172a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0A66C2] hover:text-white"
                    >
                      <Icon
                        icon="ph:linkedin-logo-bold"
                        style={{ fontSize: "20px" }}
                        aria-hidden="true"
                      />
                    </a>
                    <a
                      href={person.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram da ${person.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 hover:bg-[image:linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] hover:text-white"
                    >
                      <Icon
                        icon="ph:instagram-logo-bold"
                        style={{ fontSize: "20px" }}
                        aria-hidden="true"
                      />
                    </a>
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
                <div
                  key={item.title}
                  className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <HeartHandshake className="mb-5 h-8 w-8" strokeWidth={2.5} />
                  <h3 className="font-display text-xl font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-bold leading-relaxed text-slate-700">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-3xl rounded-3xl border-2 border-[#1a1a1a] bg-[image:linear-gradient(160deg,#6b1fc9,#3f1185)] p-8 text-center text-white shadow-[6px_6px_0_#FFB800] sm:p-12">
            <span
              className="pointer-events-none absolute -left-4 -top-4 hidden h-12 w-12 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] shadow-[3px_3px_0_#1a1a1a] sm:block"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -bottom-4 -right-4 hidden h-12 w-12 rotate-12 rounded-lg border-2 border-[#1a1a1a] bg-[#FFB800] shadow-[3px_3px_0_#1a1a1a] sm:block"
              aria-hidden="true"
            />
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <Icon
                icon="ph:rocket-launch-bold"
                className="mb-5 text-[#FFB800]"
                style={{ fontSize: "56px" }}
                aria-hidden="true"
              />
              <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
                {user ? "Pronto para continuar?" : "Pronto para começar?"}
              </h2>
              <p className="mt-4 text-lg font-bold leading-relaxed text-slate-200">
                {user
                  ? "Explore as áreas e siga de onde você parou."
                  : "Crie sua conta gratuitamente e descubra por onde começar."}
              </p>
              <Link
                href={user ? "/areas" : "/cadastro"}
                className="mt-8 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] transition-transform hover:-translate-y-0.5"
              >
                {user ? "Explorar áreas" : "Criar conta grátis"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
