import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Cloud,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Instagram,
  Linkedin,
  MessageCircle,
  Newspaper,
  PanelsTopLeft,
  Palette,
  Route as RouteIcon,
  Server,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
  Users,
  Zap,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import AnimatedAreaMarquee from "@/components/AnimatedAreaMarquee";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { ProInlineBadge } from "@/components/pro/ProStarIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { areasTI, eventos, noticias } from "@/lib/data";

const heroAreas = [
  { label: "Front-end", emoji: "🖥️", href: "/areas/frontend", color: "bg-violet-100", shadow: "shadow-[4px_4px_0_#a78bfa]" },
  { label: "Back-end", emoji: "⚙️", href: "/areas/backend", color: "bg-emerald-100", shadow: "shadow-[4px_4px_0_#86efac]" },
  { label: "Mobile", emoji: "📱", href: "/areas/mobile", color: "bg-orange-100", shadow: "shadow-[4px_4px_0_#fdba74]" },
  { label: "Dados", emoji: "📊", href: "/areas/dados", color: "bg-amber-100", shadow: "shadow-[4px_4px_0_#fcd34d]" },
  { label: "UX/UI", emoji: "🎨", href: "/areas/uxui", color: "bg-pink-100", shadow: "shadow-[4px_4px_0_#f9a8d4]" },
  { label: "Cloud", emoji: "☁️", href: "/areas/cloud", color: "bg-sky-100", shadow: "shadow-[4px_4px_0_#7dd3fc]" },
];

const trailSteps = [
  { num: "01", emoji: "🧭", title: "Descubra sua área", desc: "Responda 10 perguntas e encontre o caminho certo pra você.", href: "/quiz-carreira" },
  { num: "02", emoji: "🗺️", title: "Siga o roadmap certo", desc: "Planos de estudo completos, do zero ao emprego.", href: "/roadmaps" },
  { num: "03", emoji: "💼", title: "Construa seu perfil", desc: "Portfólio, currículo e LinkedIn que chamam atenção.", href: "/portfolio" },
  { num: "04", emoji: "🚀", title: "Conquiste a vaga", desc: "Vagas, simulador de entrevistas e checklist de estágio.", href: "/estagio" },
];

const aiToolsFree = [
  { emoji: "🧭", title: "Quiz de Carreira", href: "/quiz-carreira", desc: "Gera relatório com 3 áreas compatíveis e próximos passos" },
  { emoji: "🔨", title: "Gerador de Projetos", href: "/projetos", desc: "5 ideias de projeto personalizadas pro seu nível e área" },
  { emoji: "❓", title: "Banco de Perguntas", href: "/entrevistas/perguntas", desc: "Perguntas de entrevista por área com resposta modelo" },
];

const aiToolsPro = [
  { emoji: "📄", title: "Analisador de Currículo", href: "/curriculo/analisar", desc: "Score, pontos fracos e versão otimizada para ATS" },
  { emoji: "🎤", title: "Simulador de Entrevistas", href: "/entrevistas/simulador", desc: "IA faz perguntas adaptativas e avalia suas respostas" },
  { emoji: "💼", title: "Otimizador de LinkedIn", href: "/curriculo/linkedin", desc: "Reescreve headline e experiências com palavras-chave" },
  { emoji: "💻", title: "Análise de Portfolio", href: "/portfolio/analisar", desc: "Análise de qualidade do seu GitHub e READMEs" },
];

const socialStats = [
  { value: "+4.800", label: "pessoas no caminho" },
  { value: "500+",   label: "cursos curados" },
  { value: "80+",    label: "roadmaps completos" },
  { value: "12",     label: "áreas de TI mapeadas" },
];

const areaVisuals: Record<string, { icon: LucideIcon; tint: string; badge: string }> = {
  frontend: { icon: PanelsTopLeft, tint: "bg-violet-100 text-violet-800", badge: "interfaces" },
  backend: { icon: Server, tint: "bg-emerald-100 text-emerald-800", badge: "sistemas" },
  mobile: { icon: Smartphone, tint: "bg-orange-100 text-orange-800", badge: "apps" },
  dados: { icon: Database, tint: "bg-amber-100 text-amber-800", badge: "análise" },
  uxui: { icon: Palette, tint: "bg-pink-100 text-pink-800", badge: "produto" },
  cloud: { icon: Cloud, tint: "bg-sky-100 text-sky-800", badge: "infra" },
  seguranca: { icon: ShieldCheck, tint: "bg-emerald-100 text-emerald-900", badge: "proteção" },
  ia: { icon: Cpu, tint: "bg-violet-100 text-violet-900", badge: "automação" },
};

const trailVisuals = [
  { icon: Compass, accent: "bg-violet-100 text-violet-900", proof: "clareza antes de estudar" },
  { icon: RouteIcon, accent: "bg-[#FFB800] text-slate-950", proof: "ordem para não se perder" },
  { icon: FileText, accent: "bg-emerald-100 text-emerald-900", proof: "provas do seu progresso" },
  { icon: Trophy, accent: "bg-sky-100 text-sky-900", proof: "preparo para oportunidades" },
];

const areaCardSurfaces = [
  "bg-violet-50 shadow-[5px_5px_0_#c4b5fd]",
  "bg-emerald-50 shadow-[5px_5px_0_#86efac]",
  "bg-orange-50 shadow-[5px_5px_0_#fdba74]",
  "bg-amber-50 shadow-[5px_5px_0_#fcd34d]",
  "bg-pink-50 shadow-[5px_5px_0_#f9a8d4]",
  "bg-sky-50 shadow-[5px_5px_0_#7dd3fc]",
  "bg-lime-50 shadow-[5px_5px_0_#bef264]",
  "bg-fuchsia-50 shadow-[5px_5px_0_#f0abfc]",
];

const socialProofNotes = [
  "Comunidade crescendo com pessoas que estão começando agora",
  "Curadoria prática para reduzir excesso de abas e dúvidas",
  "Jornada pensada para estudo, portfólio e primeira oportunidade",
];

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useState<HTMLDivElement | null>(null);
  const [node, setNode] = ref;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.14 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      className={`transition-all duration-[650ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none motion-reduce:opacity-100 ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ label, title, description, dark = false, align = "center" }: { label: string; title: string; description?: string; dark?: boolean; align?: "center" | "left" }) {
  return (
    <div className={`mb-12 max-w-4xl ${align === "center" ? "mx-auto text-center" : "text-left"}`}>
      <p className={`text-sm font-black uppercase tracking-[0.2em] ${dark ? "text-[#FFB800]" : "text-violet-700"}`}>{label}</p>
      <h2 className={`font-display mt-3 text-4xl font-black leading-[0.95] md:text-6xl ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      {description ? (
        <p className={`mx-auto mt-4 max-w-2xl text-base font-semibold leading-relaxed md:text-lg ${dark ? "text-slate-300" : "text-slate-600"} ${align === "left" ? "mx-0" : ""}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function HomeLanding() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const [hasCompletedSignup, setHasCompletedSignup] = useState(() => (
    typeof window !== "undefined" && window.localStorage.getItem("bnt_signup_completed") === "true"
  ));
  const featuredAreas = areasTI.slice(0, 8);
  const featuredEvents = eventos.slice(0, 2);
  const featuredNews = noticias.slice(0, 2);
  const showHeroSocialProof = !authLoading && !user && !hasCompletedSignup;

  useEffect(() => {
    if (!user) return;
    setHasCompletedSignup(true);
    window.localStorage.setItem("bnt_signup_completed", "true");
  }, [user]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#faf8f4] text-slate-950">
      <SEO
        title="Bora na Tech? — Sua bússola para começar na tecnologia"
        description="Descubra sua área, siga roadmaps completos, use IA para se destacar e comece sua carreira em tecnologia com clareza."
        keywords={["carreira em ti", "roadmap programação", "cursos tecnologia", "primeiro emprego em ti", "quiz carreira ti"]}
        url="/"
        schemaType="WebPage"
      />
      <Header />

      <main>
        {/* S1 — Hero */}
        <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[#faf8f4]">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent" />

          <div className="container relative py-12 sm:py-14 lg:py-16">
            <Reveal className="mx-auto max-w-4xl text-center">
              {showHeroSocialProof && (
                <span className="bnt-hero-social inline-flex items-center gap-3 rounded-full border-2 border-slate-950 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[4px_4px_0_#c4b5fd] sm:text-base">
                  <span className="flex -space-x-2">
                    {["B", "T", "+"].map((item, index) => (
                      <span key={item} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-950 text-[0.65rem] font-black" style={{ backgroundColor: ["#FFB800", "#c4b5fd", "#86efac"][index] }}>
                        {item}
                      </span>
                    ))}
                  </span>
                  +4.800 pessoas começando com direção
                </span>
              )}

              <p className="mx-auto mt-6 max-w-2xl text-xs font-black uppercase tracking-[0.24em] text-violet-800">
                Sua bússola para começar em tecnologia
              </p>

              <h1 className="font-display relative isolate mx-auto mt-5 max-w-4xl text-4xl font-black leading-[0.95] text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">
                Cada ferramenta que você precisa pra entrar em{" "}
                <span className="relative inline-block text-violet-800">
                  TI de verdade
                  <span className="absolute inset-x-0 -bottom-1 -z-10 h-4 rounded-full bg-[#FFB800] sm:h-5" />
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-relaxed text-slate-700 sm:text-lg md:text-xl">
                Áreas, roadmaps, cursos, projetos, IA, eventos e carreira organizados em uma jornada clara, acessível e prática para quem está começando.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 sm:gap-4">
                {user ? (
                  <>
                    <Link href="/areas" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-black shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a]">
                      Ver minha jornada
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/estudos" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-7 py-3.5 font-black text-slate-800 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1 hover:bg-violet-100 hover:shadow-[5px_5px_0_#0f172a]">
                      Meus estudos
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/areas" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-7 py-3.5 font-black shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#0f172a] sm:px-8">
                      Explorar a plataforma
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/quiz-carreira" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-7 py-3.5 font-black text-slate-800 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1 hover:bg-violet-100 hover:shadow-[5px_5px_0_#0f172a]">
                      Ver áreas da TI
                    </Link>
                  </>
                )}
              </div>

              {!user && (
                <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-sm font-bold text-slate-600">
                  <div className="flex -space-x-2">
                    {["A", "B", "T", "?"].map((item, index) => (
                      <span key={item} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 font-black" style={{ backgroundColor: ["#FFB800", "#c4b5fd", "#86efac", "#f9a8d4"][index] }}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <span>Sem cartão de crédito · Grátis pra sempre no básico</span>
                </div>
              )}
            </Reveal>

            <Reveal delay={150} className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {heroAreas.map((area, index) => (
                <Link
                  key={area.href}
                  href={area.href}
                  className={`bnt-pressable animate-gentle-float inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 px-3 py-3 text-center font-display text-sm font-black transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] ${area.color} ${area.shadow}`}
                  style={{ animationDelay: `${index * 0.22}s` }}
                >
                  <span className="text-base leading-none">{area.emoji}</span>
                  <span>{area.label}</span>
                </Link>
              ))}
            </Reveal>
          </div>
        </section>

        {/* S2 — Marquee */}
        <AnimatedAreaMarquee />

        {/* S3 — Trilha Guiada */}
        <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[#eefdf6] py-20">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-emerald-200/55 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-10 h-56 w-56 rounded-full border-2 border-slate-950 bg-white/45 translate-x-24" />
          <div className="container relative">
            <Reveal>
              <SectionHeader
                label="por onde começar"
                title="Quatro passos. Uma direção."
                description="Uma trilha curta para sair da dúvida inicial e transformar estudo em repertório, projeto e conversa de carreira."
              />
            </Reveal>
            <div className="relative">
              <div className="absolute left-10 top-12 hidden h-1 w-[calc(100%-5rem)] rounded-full border-2 border-slate-950 bg-[#FFB800] shadow-[3px_3px_0_#0f172a] lg:block" />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {trailSteps.map((step, index) => (
                <Reveal key={step.href} delay={index * 80}>
                  <Link
                    href={step.href}
                    className="bnt-pressable group relative flex min-h-[260px] flex-col overflow-hidden rounded-3xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#86efac] transition hover:-translate-y-1 hover:bg-[#fff7d6] hover:shadow-[8px_8px_0_#0f172a]"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 z-0 h-24 w-24 rounded-full border-2 border-slate-950 bg-emerald-100/70 transition group-hover:scale-110" />
                    <div className="relative z-10 mb-5 flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]">
                        {step.num}
                      </span>
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0_#0f172a] ${trailVisuals[index].accent}`}>
                        {(() => {
                          const Icon = trailVisuals[index].icon;
                          return <Icon className="h-5 w-5" />;
                        })()}
                      </span>
                    </div>
                    <span className="relative z-10 mb-3 inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-600">
                      {trailVisuals[index].proof}
                    </span>
                    <h3 className="relative z-10 font-display text-2xl font-black leading-tight text-slate-950">{step.title}</h3>
                    <p className="relative z-10 mt-3 flex-1 text-sm font-semibold leading-relaxed text-slate-600">{step.desc}</p>
                    <span className="relative z-10 mt-6 inline-flex items-center justify-between rounded-2xl border-2 border-slate-950 bg-white px-4 py-2 text-xs font-black text-violet-800 shadow-[3px_3px_0_#0f172a] transition group-hover:bg-violet-100 group-hover:text-violet-950">
                      Abrir etapa <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* S4 — Explorador de Áreas */}
        <section className="relative overflow-hidden border-y-2 border-slate-950 bg-[#f8fbff] py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-100 to-transparent" />
          <div className="container relative">
            <div className="relative border-l-4 border-slate-950 bg-white p-5 shadow-[10px_10px_0_#bae6fd] md:p-8">
              <Reveal>
                <SectionHeader
                  label="áreas da TI"
                  title="Encontre onde você se encaixa"
                  description="Áreas da TI são caminhos de atuação: cada uma combina problemas, rotina, ferramentas e tipos de projeto diferentes. Explore antes de escolher curso."
                />
              </Reveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredAreas.map((area, index) => (
                <Reveal key={area.id} delay={index * 55}>
                  <Link
                    href={`/areas/${area.slug}`}
                    className={`bnt-pressable group relative flex min-h-[184px] flex-col overflow-hidden border-2 border-slate-950 p-5 transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#7c3aed] ${areaCardSurfaces[index % areaCardSurfaces.length]}`}
                  >
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-2 bg-white/70" />
                    <div className="mb-5 flex items-start justify-between gap-3">
                      {(() => {
                        const visual = areaVisuals[area.slug] ?? areaVisuals.frontend;
                        const Icon = visual.icon;
                        return (
                          <>
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-950 shadow-[3px_3px_0_#0f172a] ${visual.tint}`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="border border-slate-300 bg-white px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-600">
                              {visual.badge}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <h3 className="font-display flex items-center gap-2 text-xl font-black leading-tight text-slate-950 transition-colors group-hover:text-violet-800">
                      <span className="text-2xl leading-none">{area.emoji}</span>
                      {area.nome}
                    </h3>
                    <p className="mt-2 flex-1 text-sm font-semibold leading-relaxed text-slate-600">{area.descricaoCurta}</p>
                    <span className="mt-5 inline-flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-black text-violet-800 ring-1 ring-slate-200 transition group-hover:bg-violet-100 group-hover:text-violet-950">
                      Explorar caminho <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
              </div>
              <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/areas" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-6 py-3 font-black shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1">
                  Ver todas as áreas <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/quiz-carreira" className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-6 py-3 font-black shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1">
                  Fazer quiz de carreira <Compass className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* S5 — Ferramentas IA */}
        <section className="relative overflow-hidden border-y-2 border-slate-950 bg-[#f6f1ff] py-20 text-slate-950">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-violet-200/60 to-transparent" />
          <div className="pointer-events-none absolute right-10 top-12 hidden h-40 w-40 rotate-6 border-2 border-slate-950 bg-[#FFB800]/70 shadow-[8px_8px_0_#c4b5fd] lg:block" />
          <div className="container relative">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
              <Reveal>
                <SectionHeader
                  label="inteligência artificial"
                  title="IA que realmente acelera sua carreira"
                  description="Ferramentas para transformar dúvida em ação: escolher área, criar projeto, treinar entrevista e melhorar materiais de candidatura."
                  align="left"
                />
                <div className="relative overflow-hidden rounded-3xl border-2 border-slate-950 bg-white p-5 text-slate-950 shadow-[7px_7px_0_#c4b5fd]">
                  <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-violet-100" />
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-950 bg-[#FFB800] shadow-[3px_3px_0_#0f172a]">
                      <Zap className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-xl font-black">Kit inicial liberado</p>
                      <p className="text-sm font-bold text-slate-600">Ferramentas grátis para começar com menos tentativa e erro.</p>
                    </div>
                  </div>
                  <Link href="/quiz-carreira" className="bnt-pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-5 py-3 font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1">
                    Testar o quiz agora <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>

              <div className="grid gap-5">
                <Reveal>
                  <div className="overflow-hidden rounded-3xl border-2 border-slate-950 bg-emerald-50 shadow-[6px_6px_0_#86efac]">
                    <div className="flex items-center justify-between border-b-2 border-slate-950 bg-white px-4 py-3">
                      <p className="font-display text-2xl font-black">Ferramentas grátis</p>
                      <span className="rounded-full border-2 border-emerald-300 bg-emerald-300 px-3 py-1 text-xs font-black text-emerald-950">FREE</span>
                    </div>
                    <div className="grid gap-3 p-4 md:grid-cols-3">
                      {aiToolsFree.map((tool, index) => (
                        <Reveal key={tool.href} delay={index * 60}>
                          <Link href={tool.href} className="bnt-pressable group flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-4 text-slate-950 shadow-[4px_4px_0_#FFB800] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a]">
                            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-emerald-100 text-xl shadow-[2px_2px_0_#0f172a]">{tool.emoji}</span>
                            <h3 className="font-display text-lg font-black leading-tight">{tool.title}</h3>
                            <p className="mt-2 flex-1 text-xs font-bold leading-relaxed text-slate-600">{tool.desc}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-violet-800">Abrir <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" /></span>
                          </Link>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={120}>
                  <div className="rounded-3xl border-2 border-slate-950 bg-[#fff7d6] p-4 shadow-[6px_6px_0_#fcd34d]">
                    <div className="mb-4 flex items-center justify-between border-b-2 border-amber-200 pb-3">
                      <p className="font-display text-2xl font-black">Ferramentas Pro</p>
                      <span className="rounded-full border-2 border-violet-300 bg-violet-100 px-3 py-1 text-xs font-black text-violet-900">AVANÇADO</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {aiToolsPro.map((tool, index) => (
                        <Reveal key={tool.href} delay={index * 60}>
                          <Link href={tool.href} className="bnt-pressable group flex min-h-[150px] flex-col rounded-2xl border-2 border-white/80 bg-white p-4 text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-2xl">{tool.emoji}</span>
                              <ProInlineBadge label="Pro" />
                            </div>
                            <h3 className="font-display mt-3 text-lg font-black leading-tight">{tool.title}</h3>
                            <p className="mt-2 flex-1 text-xs font-bold leading-relaxed text-slate-600">{tool.desc}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-violet-800">Ver ferramenta <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" /></span>
                          </Link>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* S6 — Prova Social */}
        <section className="relative overflow-hidden bg-[#fbfdf6] py-20">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-lime-100/80 to-transparent" />
          <div className="container relative">
            <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <Reveal>
                <SectionHeader
                  label="números reais"
                  title="Uma plataforma que continua crescendo"
                  description="A prova social agora aparece como contexto de confiança: pessoas, curadoria, caminhos e áreas mapeadas."
                  align="left"
                />
                <div className="space-y-3">
                  {socialProofNotes.map((note) => (
                    <div key={note} className="flex items-start gap-3 rounded-2xl border-2 border-slate-950 bg-[#faf8f4] p-4 font-bold text-slate-700 shadow-[3px_3px_0_#0f172a]">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      {note}
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="rounded-[2rem] border-2 border-slate-950 bg-white p-4 shadow-[8px_8px_0_#bef264]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {socialStats.map((stat, index) => (
                      <div key={stat.label} className={`border-2 border-slate-950 p-6 text-center shadow-[4px_4px_0_#0f172a] ${index === 0 ? "bg-violet-100 text-slate-950 sm:col-span-2" : index === 1 ? "bg-emerald-50 text-slate-950" : index === 2 ? "bg-amber-50 text-slate-950" : "bg-sky-50 text-slate-950"}`}>
                        <span className="font-display text-5xl font-black text-violet-800 md:text-6xl">{stat.value}</span>
                        <span className="mt-2 block text-sm font-black uppercase tracking-[0.12em] text-slate-600">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* S7 — Planos */}
        {!isPro || subscriptionLoading ? (
          <section className="relative overflow-hidden border-y-2 border-slate-950 bg-gradient-to-br from-[#fff7d6] via-white to-violet-100 py-20">
            <div className="pointer-events-none absolute -left-16 top-12 h-44 w-44 rounded-full border-2 border-slate-950 bg-white/50" />
            <div className="pointer-events-none absolute -right-12 bottom-10 h-36 w-36 rotate-12 border-2 border-slate-950 bg-[#FFB800]/45" />
            <div className="container relative">
              <Reveal>
                <SectionHeader
                  label="escolha seu ritmo"
                  title="Avance no seu ritmo"
                  description="O plano gratuito mantém a jornada acessível. O Pro entra quando você quer revisar materiais, treinar entrevistas e acelerar candidatura."
                />
              </Reveal>
              <div className="grid items-stretch gap-6 lg:grid-cols-2">
                <Reveal>
                  <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-slate-950 bg-white p-6 shadow-[7px_7px_0_#86efac]">
                    <div className="absolute right-5 top-5 rounded-full border-2 border-emerald-800 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">Essencial</div>
                    <h3 className="font-display text-4xl font-black">Gratuito</h3>
                    <p className="mt-3 font-display text-6xl font-black">R$0<span className="text-base">/mês</span></p>
                    <p className="mt-3 max-w-md font-bold leading-relaxed text-slate-600">Pra sempre, sem cartão. Ideal para explorar áreas, estudar com direção e montar primeiros projetos.</p>
                    <ul className="mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-2">
                      {["Quiz de carreira com IA", "Todos os roadmaps", "Cursos curados", "Dicionário técnico", "Notícias e eventos", "Vagas e estágios", "Diário de estudos", "Gerador de projetos", "Banco de perguntas de entrevista"].map((item) => (
                        <li key={item} className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> {item}</li>
                      ))}
                    </ul>
                    {!user ? (
                      <Link href="/cadastro" className="bnt-pressable mt-8 inline-flex w-full justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] px-6 py-3 font-black shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1">
                        Começar minha jornada
                      </Link>
                    ) : (
                      <Link href="/areas" className="bnt-pressable mt-8 inline-flex w-full justify-center rounded-full border-2 border-slate-950 bg-white px-6 py-3 font-black shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1">
                        Explorar plataforma
                      </Link>
                    )}
                  </article>
                </Reveal>

                <Reveal delay={120}>
                  <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-slate-950 bg-violet-100 p-6 text-slate-950 shadow-[8px_8px_0_#c4b5fd]">
                    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#ffb800_1px,transparent_1px)] [background-size:16px_16px]" />
                    <span className="absolute right-5 top-5 rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-black text-violet-900">
                      <ProInlineBadge label="Mais popular" />
                    </span>
                    <h3 className="relative font-display text-4xl font-black">Pro</h3>
                    <p className="relative mt-3 font-display text-6xl font-black">R$24,90<span className="text-base">/mês</span></p>
                    <p className="relative mt-3 max-w-md font-bold leading-relaxed text-slate-700">Para revisar materiais, treinar com IA e chegar mais preparado nas oportunidades.</p>
                    <ul className="relative mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-2">
                      {["Tudo do gratuito", "Analisador de currículo PDF", "Simulador de entrevistas", "Otimizador LinkedIn com IA", "Análise de portfolio GitHub", "Plano de estudos personalizado", "Suporte prioritário"].map((item) => (
                        <li key={item} className="flex gap-2 rounded-xl bg-white px-3 py-2"><Check className="h-4 w-4 shrink-0 text-violet-700" /> {item}</li>
                      ))}
                    </ul>
                    <Link href="/pro" className="bnt-pressable relative mt-8 inline-flex w-full justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] px-6 py-3 font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1">
                      Quero acelerar com Pro
                    </Link>
                  </article>
                </Reveal>
              </div>
              <p className="mt-6 text-center text-sm font-bold text-slate-600">Cancela quando quiser · Pix, cartão ou boleto · Sem burocracia.</p>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden border-y-2 border-slate-950 bg-gradient-to-br from-violet-100 via-white to-[#fff7d6] py-14">
            <div className="pointer-events-none absolute left-8 top-6 h-20 w-20 rotate-12 border-2 border-slate-950 bg-[#FFB800]/60" />
            <div className="container relative">
              <Reveal>
                <div className="mx-auto max-w-lg rounded-3xl border-2 border-slate-950 bg-white p-8 text-center text-slate-950 shadow-[8px_8px_0_#c4b5fd]">
                  <p className="font-display text-4xl font-black">Você já é Pro 🎉</p>
                  <p className="mt-3 font-semibold text-slate-700">Todas as ferramentas avançadas estão liberadas pra você.</p>
                  <Link href="/perfil" className="bnt-pressable mt-6 inline-flex rounded-full border-2 border-slate-950 bg-[#FFB800] px-6 py-3 font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1">
                    Ver meu perfil
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* S8 — Carreira */}
        <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[#fffaf0] py-20">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="container relative">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <Reveal>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
                  <Briefcase className="h-3.5 w-3.5 text-violet-800" />
                  Primeiro estágio tech
                </div>
                <h2 className="font-display mb-6 text-4xl font-black leading-[0.96] text-slate-950 sm:text-5xl lg:text-6xl">
                  Carreira também entra no começo da trilha.
                </h2>
                <p className="max-w-lg text-base font-semibold leading-relaxed text-slate-600">
                  O Bora na Tech conecta estudo com portfólio, LinkedIn, currículo, comunidades e vagas de estágio, sem vender resultado garantido.
                </p>
                <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
                  {["Perfil", "Projeto", "Vaga"].map((item, index) => (
                    <div key={item} className="rounded-2xl border-2 border-slate-950 bg-white p-3 text-center shadow-[3px_3px_0_#0f172a]">
                      <p className="font-display text-2xl font-black text-violet-800">{index + 1}</p>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="rounded-[2rem] border-2 border-slate-950 bg-white p-5 shadow-[8px_8px_0_#0f172a]">
                  <div className="mb-5 flex items-center justify-between rounded-2xl border-2 border-slate-950 bg-violet-100 px-4 py-3 text-slate-950">
                    <div>
                      <p className="font-display text-xl font-black">Kit primeira oportunidade</p>
                      <p className="text-xs font-bold text-slate-600">Materiais práticos para sair do modo estudo infinito.</p>
                    </div>
                    <Briefcase className="h-6 w-6 text-violet-800" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Checklist de LinkedIn sem experiência", "/estagio", BadgeCheck],
                      ["Modelo de currículo para estágio ou trainee", "/estagio", FileText],
                      ["Guia para primeira publicação", "/dicas", MessageCircle],
                      ["Mensagens para pedir ajuda sem vergonha", "/comunidades", Users],
                    ].map(([label, href, Icon], index) => {
                      const CareerIcon = Icon as LucideIcon;
                      return (
                        <Link key={label as string} href={href as string} className="bnt-pressable group flex min-h-[132px] flex-col justify-between rounded-2xl border-2 border-slate-950 bg-[#faf8f4] p-4 text-sm font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-1 hover:bg-[#ffb800] hover:shadow-[7px_7px_0_#0f172a]">
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100 text-violet-900 shadow-[2px_2px_0_#0f172a]">
                              <CareerIcon className="h-4 w-4" />
                            </span>
                            <span className="text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                          </div>
                          <span className="mt-4 leading-snug">{label as string}</span>
                          <span className="mt-4 inline-flex items-center gap-1 text-xs text-violet-800 transition group-hover:text-slate-950">Abrir <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" /></span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* S9 — Comunidade Viva */}
        <section className="relative overflow-hidden border-b-2 border-slate-950 bg-[#f3fbff] py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute bottom-10 left-8 hidden h-28 w-28 rotate-6 border-2 border-slate-950 bg-violet-100 shadow-[6px_6px_0_#7dd3fc] lg:block" />
          <div className="container relative">
            <Reveal>
              <SectionHeader
                label="acontecendo agora"
                title="Notícias e eventos desta semana"
                description="Um painel vivo para acompanhar oportunidades, encontros e mudanças do mercado sem virar uma lista solta de links."
              />
            </Reveal>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Reveal>
                <div className="h-full rounded-[2rem] border-2 border-slate-950 bg-white p-5 shadow-[7px_7px_0_#FFB800]">
                  <div className="mb-5 flex items-center justify-between border-b-2 border-slate-950 bg-[#fff7d6] px-4 py-3">
                    <div>
                      <h3 className="font-display text-2xl font-black text-slate-950">Eventos tech</h3>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">networking e comunidade</p>
                    </div>
                    <CalendarDays className="h-6 w-6 text-violet-900" />
                  </div>
                  <div className="space-y-4">
                  {featuredEvents.map((ev) => (
                    <article key={ev.id} className="flex gap-4 border-2 border-slate-950 bg-[#fffaf0] p-4 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1 hover:bg-[#fff7d6]">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-slate-950 bg-violet-100 text-violet-900 shadow-[2px_2px_0_#0f172a]">
                        <CalendarDays className="h-5 w-5 text-violet-800" />
                        <span className="mt-1 text-[0.6rem] font-black uppercase">evento</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-slate-900">{ev.nome}</h4>
                        <p className="text-xs font-semibold text-slate-500">{ev.cidade} · {ev.data}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-black text-violet-800">{ev.formato}</span>
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">{ev.valor?.includes("Gratuito") ? "gratuito" : "pago"}</span>
                        </div>
                      </div>
                      <a href={ev.link} target="_blank" rel="noopener noreferrer" className="bnt-pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-violet-700 shadow-[2px_2px_0_#0f172a] hover:bg-violet-100 hover:text-violet-950" aria-label={`Abrir ${ev.nome}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </article>
                  ))}
                  </div>
                  <Link href="/eventos" className="bnt-pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black text-violet-800 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1">
                    Ver agenda completa <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="h-full rounded-[2rem] border-2 border-slate-950 bg-sky-50 p-5 text-slate-950 shadow-[7px_7px_0_#7dd3fc]">
                  <div className="mb-5 flex items-center justify-between border-b-2 border-slate-950 bg-white px-4 py-3 text-slate-950">
                    <div>
                      <h3 className="font-display text-2xl font-black">Notícias tech</h3>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">mercado em movimento</p>
                    </div>
                    <Newspaper className="h-6 w-6 text-violet-800" />
                  </div>
                  <div className="space-y-4">
                  {featuredNews.map((news) => (
                    <article key={news.id} className="border-2 border-slate-950 bg-white p-4 text-slate-950 shadow-[4px_4px_0_#bae6fd] transition hover:-translate-y-1 hover:bg-violet-50">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="text-sm font-black leading-snug text-slate-900">{news.titulo}</h4>
                        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-black text-violet-900">{news.impacto}</span>
                      </div>
                      <p className="mb-2 text-xs font-semibold text-slate-600">{news.resumo}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="bg-slate-100 px-2 py-0.5 text-[0.68rem] font-black text-slate-600">{news.fonte} · {news.data}</span>
                        <a href={news.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-violet-700 hover:underline">
                          Ler <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </article>
                  ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link href="/noticias" className="bnt-pressable inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-5 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition hover:-translate-y-1">
                      Ver notícias <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/comunidades" className="bnt-pressable inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-violet-100 px-5 py-3 text-sm font-black text-violet-900 shadow-[3px_3px_0_#c4b5fd] transition hover:-translate-y-1">
                      Comunidades <Users className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* S10 — CTA Final */}
        <section className="relative overflow-hidden border-y-2 border-slate-950 bg-gradient-to-br from-[#FFB800] via-[#ffe68a] to-violet-200 py-20">
          <div className="pointer-events-none absolute left-8 top-10 hidden h-16 w-16 rotate-12 border-2 border-slate-950 bg-white/65 shadow-[4px_4px_0_#0f172a] md:block" />
          <div className="pointer-events-none absolute bottom-8 right-12 hidden h-24 w-24 rounded-full border-2 border-slate-950 bg-white/50 md:block" />
          <div className="container relative">
            <Reveal>
              <div className="relative mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-[2rem] border-2 border-slate-950 bg-white p-6 text-left shadow-[12px_12px_0_#0f172a] md:p-9 lg:grid-cols-[1fr_0.75fr]">
                <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-violet-100/70" />
                <div>
                  {user ? (
                    <>
                      <p className="mb-4 inline-flex rounded-full border-2 border-slate-950 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-800">sua trilha continua</p>
                      <h2 className="font-display text-4xl font-black leading-[0.95] text-slate-950 md:text-6xl">Continue de onde parou.</h2>
                      <p className="mt-4 max-w-xl text-lg font-bold leading-relaxed text-slate-600">Sua jornada em TI está esperando por você, com áreas, estudos e próximos passos em um só lugar.</p>
                      <Link href="/areas" className="bnt-pressable mt-7 inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-7 py-4 font-display text-xl font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1">
                        <Compass className="h-6 w-6 text-violet-800" />
                        Ver minha jornada
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="mb-4 inline-flex rounded-full border-2 border-slate-950 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-800">comece com direção</p>
                      <h2 className="font-display text-4xl font-black leading-[0.95] text-slate-950 md:text-6xl">Escolha uma área. Siga uma trilha. Mostre progresso.</h2>
                      <p className="mt-4 max-w-xl text-lg font-bold leading-relaxed text-slate-600">Mais de 4.800 pessoas já usam o Bora na Tech para transformar curiosidade em plano de carreira.</p>
                      <Link href="/cadastro" className="bnt-pressable mt-7 inline-flex items-center gap-3 rounded-2xl border-2 border-slate-950 bg-[#FFB800] px-7 py-4 font-display text-xl font-black text-slate-950 shadow-[5px_5px_0_#0f172a] transition hover:-translate-y-1">
                        <Compass className="h-6 w-6 text-violet-800" />
                        Começar minha jornada
                      </Link>
                    </>
                  )}
                </div>
                <div className="relative rounded-3xl border-2 border-slate-950 bg-violet-50 p-5 text-slate-950 shadow-[5px_5px_0_#c4b5fd]">
                  {["Áreas mapeadas", "Roadmaps claros", "Projetos publicáveis", "Comunidade e vagas"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 border-b border-violet-200 py-3 last:border-b-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFB800] font-display text-sm font-black text-slate-950">{index + 1}</span>
                      <span className="font-bold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function LandingFooter() {
  const columns = [
    { title: "Plataforma", links: [["Áreas", "/areas"], ["Roadmaps", "/roadmaps"], ["Cursos", "/cursos"], ["Tecnologias", "/tecnologias"], ["Dicionário", "/dicionario"], ["Salários", "/salarios"], ["Quiz", "/quiz-carreira"]] },
    { title: "Recursos", links: [["Notícias", "/noticias"], ["Eventos", "/eventos"], ["Vagas", "/estagio"], ["Comunidades", "/comunidades"], ["Empresas", "/empresas"], ["Faculdades", "/faculdades"], ["Mentorias", "/mentorias"]] },
    { title: "Ferramentas IA", links: [["Analisar currículo", "/curriculo/analisar"], ["Otimizar LinkedIn", "/curriculo/linkedin"], ["Simulador", "/entrevistas/simulador"], ["Análise portfolio", "/portfolio/analisar"], ["Gerar projetos", "/projetos"], ["Pro", "/pro"]] },
    { title: "Empresa", links: [["Sobre", "/sobre"], ["Termos", "/termos-de-uso"], ["Privacidade", "/privacidade"]] },
  ];
  const socials = [
    [Instagram, "Instagram", "https://instagram.com/boranatech"],
    [Youtube, "YouTube", "https://youtube.com/@boranatech"],
    [Linkedin, "LinkedIn", "https://linkedin.com/company/boranatech"],
    [Star, "TikTok", "https://tiktok.com/@boranatech"],
    [X, "X", "https://x.com/boranatech"],
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t-2 border-slate-950 bg-[#101524] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FFB800]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-700/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-[#FFB800]/10 blur-3xl" />
      <div className="container relative py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#FFB800] bg-[#FFB800] text-slate-950 shadow-[4px_4px_0_#7c3aed]">
                <Compass className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-black">BORA NA TECH?</p>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB800]">Sua Bússola na TI</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-relaxed text-slate-300">
              Plataforma de carreira em TI para iniciantes. Roadmaps, cursos, IA, vagas e comunidade em uma jornada clara.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(([Icon, label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="bnt-pressable flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-slate-100 hover:-translate-y-0.5 hover:border-[#FFB800] hover:bg-[#FFB800] hover:text-slate-950">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="font-display text-sm font-black uppercase tracking-[0.14em] text-[#FFB800]">{column.title}</h3>
                <ul className="mt-4 space-y-2">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm font-semibold text-slate-300 transition hover:text-white hover:underline hover:decoration-violet-400 hover:underline-offset-4">{label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-slate-400">
          © 2026 Bora na Tech · Feito com 💛 pra quem quer entrar em TI de verdade.
          <span className="text-xs font-black uppercase tracking-[0.14em] text-violet-200">
            Comece pelo básico. Avance com clareza.
          </span>
        </div>
      </div>
    </footer>
  );
}
