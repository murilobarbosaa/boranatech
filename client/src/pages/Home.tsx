/*
  BORA NA TECH? — Home Page
  Style: Neo-Brutalism Suavizado / "Mapa de Exploração"
  Sections:
  - Hero principal
  - Eventos tech + Notícias tech
  - Por onde você quer começar?
  - Primeiro estágio tech
  - Portfólio iniciante
  - Eventos e comunidades
  - Plano de 30 dias
  - Áreas populares
  - Cursos recomendados
  - Plataformas recomendadas
  - Chamada final
*/

import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Map,
  Code2,
  Laptop,
  Briefcase,
  Users,
  Star,
  ExternalLink,
  ChevronRight,
  Compass,
  Sparkles,
  Instagram,
  FileText,
  CircleCheck,
  Lightbulb,
  Send,
} from "lucide-react";
import AnimatedAreaMarquee from "@/components/AnimatedAreaMarquee";
import DiscoveryModal from "@/components/DiscoveryModal";
import Layout from "@/components/Layout";
import OnboardingTour from "@/components/OnboardingTour";
import SEO from "@/components/SEO";
import { areasTI, cursosGratuitos, plataformas, eventos, noticias } from "@/lib/data";

const heroImage = "/compass.png";

const quickAccessCards = [
  {
    icon: <Code2 className="w-6 h-6" />,
    label: "Áreas da TI",
    desc: "Descubra qual área combina com você",
    path: "/areas",
    card: "bg-[#e9e4ff]",
    iconWrap: "bg-violet-700 text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    label: "Cursos",
    desc: "Compare opções grátis e pagas",
    path: "/cursos",
    card: "bg-[#fff1b8]",
    iconWrap: "bg-[#ffb800] text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
  {
    icon: <Map className="w-6 h-6" />,
    label: "Roadmaps",
    desc: "Saiba exatamente por onde começar",
    path: "/roadmaps",
    card: "bg-[#c9f5df]",
    iconWrap: "bg-[#009f75] text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
  {
    icon: <Laptop className="w-6 h-6" />,
    label: "Plataformas",
    desc: "Compare onde estudar",
    path: "/plataformas",
    card: "bg-[#d4e6fb]",
    iconWrap: "bg-blue-600 text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
  {
    icon: <Star className="w-6 h-6" />,
    label: "Projetos",
    desc: "Ideias para seu portfólio",
    path: "/projetos",
    card: "bg-[#f8dceb]",
    iconWrap: "bg-pink-600 text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    label: "Vagas, Estágio e Trainee",
    desc: "Onde e como buscar sua primeira vaga",
    path: "/estagio",
    card: "bg-[#ffe3bd]",
    iconWrap: "bg-[#ff6b00] text-white",
    titleClass: "text-slate-950",
    descClass: "text-slate-600",
  },
];

const beginnerSteps = [
  { step: "01", title: "Entenda as áreas", desc: "Veja que tecnologia não é só programação e escolha duas áreas para observar.", link: "/areas" },
  { step: "02", title: "Faça um curso curto", desc: "Priorize fundamentos, linguagem simples e exercícios pequenos.", link: "/cursos" },
  { step: "03", title: "Crie um projeto mínimo", desc: "Algo publicável em uma semana vale mais do que uma ideia perfeita parada.", link: "/projetos" },
  { step: "04", title: "Arrume seu perfil", desc: "LinkedIn, currículo e portfólio precisam contar seu começo com clareza.", link: "/perfil" },
  { step: "05", title: "Entre em comunidades", desc: "Eventos e grupos reduzem isolamento e aceleram repertório.", link: "/comunidades" },
];

const projectShowcaseLinks = [
  { label: "README guiado", icon: <FileText className="h-4 w-4" /> },
  { label: "Post de aprendizado", icon: <Send className="h-4 w-4" /> },
  { label: "Checklist de entrega", icon: <CircleCheck className="h-4 w-4" /> },
  { label: "Ideias por área", icon: <Lightbulb className="h-4 w-4" /> },
];

const careerShowcaseLinks = [
  { label: "Checklist de LinkedIn sem experiência", href: "/estagio" },
  { label: "Modelo de currículo para estágio ou trainee", href: "/estagio" },
  { label: "Guia para primeira publicação", href: "/dicas" },
  { label: "Mensagens para pedir ajuda sem vergonha", href: "/comunidades" },
];

const communityShowcaseLinks = [
  { label: "Meetups de programação e produto", href: "/eventos" },
  { label: "Comunidades de mulheres em tecnologia", href: "/mulheres" },
  { label: "Eventos universitários e hackathons", href: "/eventos" },
  { label: "Lives de carreira, LinkedIn e portfólio", href: "/comunidades" },
];

export default function Home() {
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const featuredAreas = areasTI.slice(0, 8);
  const featuredCourses = cursosGratuitos.slice(0, 4);
  const featuredPlatforms = plataformas.slice(0, 4);
  const featuredEvents = eventos.slice(0, 3);
  const featuredNews = noticias.slice(0, 3);

  return (
    <Layout>
      <SEO
        title="Bora na Tech? — Sua bússola para começar na tecnologia"
        description="Descubra sua área ideal em TI, siga roadmaps completos, faça cursos curados e use ferramentas de IA para acelerar sua carreira tech. Plataforma para iniciantes."
        keywords={["carreira em ti", "como começar em programação", "guia ti para iniciantes", "roadmap programação", "área da tecnologia", "carreira tech", "quiz carreira ti", "primeiro emprego em ti"]}
        url="/"
        schemaType="WebPage"
        schemaData={{
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://boranatech.com.br/" }],
          },
        }}
      />
      {/* ===== HERO ===== */}
      <DiscoveryModal open={discoveryOpen} onClose={() => setDiscoveryOpen(false)} />
      <OnboardingTour open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      <section className="hero-pattern relative overflow-hidden border-b-2 border-slate-900">
        <div className="container py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="mb-10 flex flex-row flex-wrap items-stretch justify-center gap-x-4 gap-y-3 sm:gap-x-6 md:gap-x-10 lg:justify-start">
                <a
                  href="https://www.instagram.com/ana.natech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border-2 border-slate-950 bg-violet-700 px-4 py-2.5 text-sm font-black text-white shadow-[4px_4px_0_#0f172a]"
                >
                  <Instagram
                    aria-hidden
                    className="relative top-px block h-[1.1em] w-[1.1em] shrink-0 text-white"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <span className="leading-none">@ana.natech</span>
                </a>
                <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border-2 border-slate-950 bg-[#ffb800] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-slate-950 shadow-[4px_4px_0_#0f172a]">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-900" />
                  Sua porta de entrada para a tecnologia
                </div>
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-6xl text-slate-900 leading-tight mb-6">
                Eu finalmente entendi por onde{" "}
                <span className="relative text-slate-950">
                  começar.
                  <span className="absolute -bottom-1 left-0 right-0 h-2.5 -z-0 rounded bg-yellow-400" />
                </span>
              </h1>
              <p className="text-slate-950 text-lg leading-relaxed mb-8">
                O BORA NA TECH? organiza áreas, cursos, roadmaps, projetos, eventos, comunidades e passos de carreira em uma experiência simples, acolhedora e prática para iniciantes em tecnologia.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="btn-brutal-accent inline-flex items-center gap-2 rounded-full px-6 py-3 font-black"
                >
                  Começar agora
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDiscoveryOpen(true)}
                  className="btn-brutal-primary inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-black text-slate-950"
                >
                  Descobrir minha área
                  <Compass className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative hidden lg:block">
              <div className="animate-gentle-float relative overflow-hidden rounded-[2rem] border-2 border-slate-900 bg-white p-4 shadow-[10px_10px_0_#0f172a]">
                <img
                  src={heroImage}
                  alt="Ilustração de bússola para orientar iniciantes em tecnologia"
                  className="w-full h-auto rounded-2xl saturate-125"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 rounded-xl border-2 border-slate-950 bg-yellow-400 px-4 py-2 font-display text-sm font-black text-slate-950 shadow-[4px_4px_0_#0f172a]">
                100% Gratuito
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border-2 border-slate-950 bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0_#0f172a]">
                12+ áreas de TI
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatedAreaMarquee />

      {/* ===== EVENTOS + NOTÍCIAS ===== */}
      <section className="py-16 border-b-2 border-slate-200">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Eventos */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-slate-900">Eventos tech</h2>
                <Link href="/eventos" className="flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {featuredEvents.map((ev) => (
                  <div key={ev.id} className="card-brutal bg-white rounded-xl p-4 flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-yellow-400">
                      <Users className="h-5 w-5 text-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{ev.nome}</h3>
                      <p className="text-xs text-slate-500">{ev.cidade} · {ev.data}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ev.valor.includes("Gratuito") ? "bg-yellow-400 text-slate-900" : "bg-slate-200 text-slate-800"}`}>
                          {ev.valor.includes("Gratuito") ? "Gratuito" : "Pago"}
                        </span>
                        <span className="text-xs text-slate-400">{ev.formato}</span>
                      </div>
                    </div>
                    <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-800 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Notícias */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-slate-900">Notícias tech</h2>
                <Link href="/noticias" className="flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {featuredNews.map((news) => (
                  <div key={news.id} className="card-brutal bg-white rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">{news.titulo}</h3>
                      <span className="shrink-0 rounded-full bg-violet-700 px-2 py-0.5 text-xs font-bold text-white">{news.impacto}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{news.resumo}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{news.fonte} · {news.data}</span>
                      <a href={news.link} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-700 font-medium hover:underline flex items-center gap-1">
                        Ler <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POR ONDE COMEÇAR ===== */}
      <section className="section-alt py-16 border-b-2 border-slate-200">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">
              Por onde você quer começar?
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Escolha um caminho e comece sua jornada na tecnologia agora mesmo.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickAccessCards.map((card) => (
              <Link
                key={card.path}
                href={card.path}
                className={`card-brutal group flex min-h-[138px] flex-col items-center justify-center rounded-xl p-4 text-center ${card.card}`}
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md shadow-[2px_2px_0_#0f172a] transition-transform group-hover:scale-110 ${card.iconWrap}`}
                >
                  {card.icon}
                </div>
                <h3 className={`font-display mb-1 text-sm font-black ${card.titleClass}`}>{card.label}</h3>
                <p className={`max-w-[9rem] text-xs leading-snug ${card.descClass}`}>{card.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CARREIRA NO COMEÇO ===== */}
      <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[#fffaf0] py-14 lg:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="container relative">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
                <Briefcase className="h-3.5 w-3.5 text-violet-800" />
                Primeiro estágio tech
              </div>
              <h2 className="font-display mb-6 text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
                Carreira também
                <br />
                entra no começo
                <br />
                da trilha.
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
                O BORA NA TECH? conecta estudo com portfólio, LinkedIn, currículo, comunidades e vagas de estágio, sem vender resultado garantido.
              </p>
            </div>

            <div className="grid gap-5">
              {careerShowcaseLinks.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-950 bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-[6px_6px_0_#0f172a] transition hover:-translate-y-1 hover:bg-[#ffb800] hover:shadow-[8px_8px_0_#0f172a]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-700 text-[0.65rem] font-black text-white transition group-hover:bg-slate-950">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-violet-800 transition group-hover:translate-x-1 group-hover:text-slate-950" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROJETOS PUBLICÁVEIS ===== */}
      <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[var(--brand-cream)] py-14 lg:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#6d28d9_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="container relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.12fr]">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
                <FileText className="h-3.5 w-3.5 text-violet-800" />
                Portfólio iniciante
              </div>
              <h2 className="font-display mb-5 text-4xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                Projetos pequenos,
                <br />
                explicáveis e
                <br />
                publicáveis.
              </h2>
              <p className="mb-8 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
                A plataforma orienta o iniciante a criar projetos que conectem estudo, GitHub, LinkedIn e conversa de estágio.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {projectShowcaseLinks.map((item) => (
                  <Link
                    key={item.label}
                    href="/projetos"
                    className="group inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1 hover:bg-[#ffb800] hover:shadow-[7px_7px_0_#0f172a]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-700 text-white transition group-hover:bg-slate-950">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-950 bg-white p-6 shadow-[10px_10px_0_#0f172a]">
                <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="relative grid min-h-[320px] grid-cols-2 gap-4 rounded-[1.35rem] border-2 border-slate-950 bg-[#fff7d6] p-5 sm:grid-cols-3">
                  <div className="col-span-1 row-span-2 flex flex-col justify-between rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
                    <div className="h-20 rounded-xl border-2 border-slate-950 bg-violet-100" />
                    <div>
                      <p className="mb-2 h-2 w-16 rounded-full bg-slate-950" />
                      <p className="h-2 w-24 rounded-full bg-violet-700" />
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-950 bg-slate-950 p-4 text-white shadow-[4px_4px_0_#7c3aed]">
                    <Code2 className="mb-4 h-5 w-5 text-[#ffb800]" />
                    <div className="space-y-2">
                      <p className="h-2 w-20 rounded-full bg-white/80" />
                      <p className="h-2 w-14 rounded-full bg-violet-300" />
                      <p className="h-2 w-24 rounded-full bg-white/60" />
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-950 bg-[#ffb800] p-4 shadow-[4px_4px_0_#0f172a]">
                    <CircleCheck className="mb-4 h-6 w-6 text-slate-950" />
                    <div className="space-y-2">
                      <p className="h-2 w-20 rounded-full bg-slate-950" />
                      <p className="h-2 w-14 rounded-full bg-slate-950/70" />
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-950 bg-violet-700 p-4 text-white shadow-[4px_4px_0_#0f172a]">
                    <p className="text-xs font-black uppercase">Placeholder</p>
                    <p className="mt-2 text-[0.65rem] font-bold text-violet-100">Imagem do projeto aqui</p>
                  </div>
                  <div className="col-span-1 rounded-2xl border-2 border-slate-950 bg-white p-4 shadow-[4px_4px_0_#0f172a] sm:col-span-2">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-violet-700" />
                      <span className="h-4 w-4 rounded-full bg-[#ffb800]" />
                      <span className="h-4 w-4 rounded-full bg-slate-950" />
                    </div>
                    <div className="grid grid-cols-4 items-end gap-2">
                      <span className="h-8 rounded-t bg-violet-300" />
                      <span className="h-14 rounded-t bg-violet-700" />
                      <span className="h-10 rounded-t bg-[#ffb800]" />
                      <span className="h-16 rounded-t bg-slate-950" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="absolute -right-4 top-6 hidden h-7 w-7 rounded-full border-2 border-slate-950 bg-violet-700 shadow-[3px_3px_0_#0f172a] lg:block" />
              <span className="absolute -bottom-4 left-12 hidden rounded-xl border-2 border-slate-950 bg-[#ffb800] px-4 py-2 text-xs font-black uppercase text-slate-950 shadow-[4px_4px_0_#0f172a] lg:block">
                pronto para postar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EVENTOS E COMUNIDADES ===== */}
      <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[var(--brand-cream)] py-14 lg:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="rounded-[2rem] border-2 border-slate-950 bg-[#fff7d6] p-5 shadow-[10px_10px_0_#0f172a] sm:p-7 lg:p-8">
            <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1fr]">
              <div className="relative overflow-hidden rounded-[1.35rem] border-2 border-slate-950 bg-white p-5 shadow-[5px_5px_0_#0f172a]">
                <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:13px_13px]" />
                <div className="relative min-h-[290px] rounded-2xl border-2 border-slate-950 bg-[#faf8f4] p-5">
                  <div className="absolute left-8 top-9 h-16 w-16 rounded-2xl border-2 border-slate-950 bg-violet-700 shadow-[4px_4px_0_#0f172a]">
                    <div className="grid h-full grid-cols-3 grid-rows-3 gap-1 p-3">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <span key={index} className="rounded-full bg-white/85" />
                      ))}
                    </div>
                  </div>
                  <div className="absolute right-8 top-7 rounded-xl border-2 border-slate-950 bg-[#ffb800] px-4 py-3 text-xs font-black text-slate-950 shadow-[4px_4px_0_#0f172a]">
                    online + presencial
                  </div>
                  <div className="absolute bottom-8 right-10 rounded-xl border-2 border-slate-950 bg-white px-4 py-3 shadow-[4px_4px_0_#0f172a]">
                    <div className="mb-2 h-2 w-20 rounded-full bg-slate-950" />
                    <div className="h-2 w-12 rounded-full bg-violet-700" />
                  </div>
                  <div className="absolute bottom-10 left-10 rounded-xl border-2 border-slate-950 bg-violet-100 p-3 shadow-[4px_4px_0_#0f172a]">
                    <Users className="h-8 w-8 text-violet-800" />
                  </div>
                  <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 420 290" fill="none">
                    <path
                      d="M76 205C120 132 157 176 194 120C232 63 276 92 339 58"
                      stroke="#7c3aed"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="10 12"
                    />
                    <path
                      d="M91 111C139 119 165 70 212 95C254 117 286 185 352 156"
                      stroke="#ffb800"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {[{ left: "22%", top: "59%" }, { left: "48%", top: "39%" }, { left: "70%", top: "55%" }].map((pin) => (
                    <span
                      key={`${pin.left}-${pin.top}`}
                      className="absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]"
                      style={pin}
                    >
                      <span className="h-3 w-3 rounded-full bg-violet-700" />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
                  <Users className="h-3.5 w-3.5 text-violet-800" />
                  Eventos e comunidades
                </div>
                <h2 className="font-display mb-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Conhecer pessoas da
                  <br />
                  área também é parte
                  <br />
                  do plano.
                </h2>
                <p className="mb-7 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  A plataforma prevê filtros por cidade, tipo de evento, comunidade e nível para que iniciantes encontrem espaços seguros de pertencimento.
                </p>
                <div className="grid gap-4">
                  {communityShowcaseLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1 hover:bg-[#ffb800] hover:shadow-[7px_7px_0_#0f172a]"
                    >
                      <span className="flex items-center gap-3">
                        <Users className="h-4 w-4 shrink-0 text-violet-800" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-violet-800 transition group-hover:translate-x-1 group-hover:text-slate-950" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROADMAP REALISTA ===== */}
      <section className="relative overflow-hidden border-b-2 border-slate-950 bg-slate-950 py-16 text-white lg:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#ffb800_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container">
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-[#ffb800] bg-[#ffb800] px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#7c3aed]">
              <CircleCheck className="h-3.5 w-3.5" />
              Plano de 30 dias
            </div>
            <h2 className="font-display mb-10 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Um roadmap realista,
              <br />
              sem prometer milagre.
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {beginnerSteps.map((step) => (
                <Link
                  key={step.step}
                  href={step.link}
                  className="group flex min-h-[190px] flex-col rounded-2xl border-2 border-white/80 bg-white/[0.06] p-5 text-left shadow-[5px_5px_0_#7c3aed] transition hover:-translate-y-1 hover:border-[#ffb800] hover:bg-violet-700 hover:shadow-[7px_7px_0_#ffb800]"
                >
                  <span className="font-display mb-8 text-4xl font-black leading-none text-[#ffb800] transition group-hover:text-white">
                    {step.step}
                  </span>
                  <h3 className="font-display mb-3 text-base font-black leading-tight text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs font-medium leading-relaxed text-slate-300 transition group-hover:text-violet-50">{step.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ÁREAS POPULARES ===== */}
      <section className="py-16 border-b-2 border-slate-200">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">
                Áreas populares
              </h2>
              <p className="text-slate-600">As áreas mais buscadas por quem está começando.</p>
            </div>
            <Link href="/areas" className="hidden md:flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredAreas.map((area) => (
              <Link
                key={area.id}
                href={`/areas/${area.slug}`}
                className="card-brutal bg-white rounded-xl p-5 group"
              >
                <div className="text-3xl mb-3">{area.emoji}</div>
                <h3 className="font-display font-semibold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">
                  {area.nome}
                </h3>
                <p className="text-xs text-slate-500 leading-snug">{area.descricaoCurta}</p>
                <div className="mt-3 flex items-center gap-1 text-violet-600 text-xs font-medium">
                  Explorar <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link href="/areas" className="inline-flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
              Ver todas as áreas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CURSOS RECOMENDADOS ===== */}
      <section className="py-16 border-b-2 border-slate-200">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">
                Cursos em destaque
              </h2>
              <p className="text-slate-600">Selecionados para quem está começando do zero.</p>
            </div>
            <Link href="/cursos" className="hidden md:flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCourses.map((curso) => (
              <div key={curso.id} className="card-brutal bg-white rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    curso.area === "Front-end" ? "tag-frontend" :
                    curso.area === "Back-end / Dados" ? "tag-dados" :
                    curso.area === "UX/UI Design" ? "tag-uxui" :
                    curso.area === "Cloud" ? "tag-cloud" :
                    curso.area === "Cibersegurança" ? "tag-seguranca" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {curso.area}
                  </span>
                  <span className="text-xs text-slate-400">{curso.plataforma}</span>
                </div>
                <h3 className="font-display font-semibold text-slate-900 mb-1 text-sm">{curso.titulo}</h3>
                <p className="text-xs text-slate-500 mb-1">{curso.canal}</p>
                <p className="text-xs text-slate-600 flex-1 mb-4">{curso.descricao}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                    {curso.idioma}
                  </span>
                  <a
                    href={curso.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-700 font-medium hover:underline"
                  >
                    Acessar <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATAFORMAS ===== */}
      <section className="section-alt py-16 border-b-2 border-slate-200">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">
                Plataformas de estudo
              </h2>
              <p className="text-slate-600">Compare e escolha onde estudar.</p>
            </div>
            <Link href="/plataformas" className="hidden md:flex items-center gap-1 text-violet-700 font-medium text-sm hover:underline">
              Comparar todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredPlatforms.map((plat) => (
              <div key={plat.id} className="card-brutal bg-white rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-semibold text-slate-900">{plat.nome}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    plat.tipo === "Gratuita" ? "bg-yellow-400 text-slate-900" :
                    plat.tipo === "Híbrida" ? "bg-violet-600 text-white" :
                    "bg-slate-200 text-slate-800"
                  }`}>
                    {plat.tipo}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{plat.descricao}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {plat.areasFortes.slice(0, 3).map((area) => (
                    <span key={area} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">{area}</span>
                  ))}
                </div>
                <a
                  href={plat.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-700 font-medium hover:underline"
                >
                  Visitar <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CHAMADA FINAL ===== */}
      <section className="border-b-2 border-slate-950 bg-violet-800 py-16">
        <div className="container text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 font-display text-3xl font-bold text-white lg:text-4xl">
              Você tem um próximo passo.
            </h2>
            <p className="mb-8 text-lg text-violet-100">
              Não precisa saber tudo de uma vez. Escolha uma área, siga um roadmap e dê o primeiro passo hoje.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/roadmaps"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-950 bg-yellow-400 px-8 py-3 font-bold text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
              >
                Explorar roadmaps
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/areas"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-950 bg-white px-8 py-3 font-bold text-violet-800 shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a]"
              >
                Descobrir minha área
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
