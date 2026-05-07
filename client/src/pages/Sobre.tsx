/*
  BORA NA TECH? — Sobre Page
  Style: Neo-Brutalism Suavizado
*/

import SobreRedesign from "./SobreRedesign";
import { Link } from "wouter";
import { Rocket, Heart, Target, Users, BookOpen, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const valores = [
  { emoji: "🎯", titulo: "Clareza", desc: "Linguagem simples, sem jargão desnecessário. Se você não entendeu, a culpa é nossa." },
  { emoji: "🆓", titulo: "Gratuidade", desc: "Todo o conteúdo do BORA NA TECH? é gratuito. Sempre foi, sempre será." },
  { emoji: "🤝", titulo: "Inclusão", desc: "Feito especialmente para quem está de fora: mulheres, pessoas negras, pessoas de baixa renda." },
  { emoji: "🔍", titulo: "Curadoria", desc: "Não listamos tudo — listamos o que realmente vale a pena para iniciantes." },
  { emoji: "🌱", titulo: "Crescimento", desc: "Acreditamos que qualquer pessoa pode aprender tecnologia com o suporte certo." },
  { emoji: "💬", titulo: "Honestidade", desc: "Falamos sobre dificuldades, limitações e o que realmente esperar do mercado." },
];

const secoes = [
  { icon: <BookOpen className="w-5 h-5" />, titulo: "Áreas da TI", desc: "Descrições detalhadas de cada área, com tarefas, ferramentas e perfil indicado.", path: "/areas" },
  { icon: <Target className="w-5 h-5" />, titulo: "Roadmaps", desc: "Trilhas de estudo organizadas por área, com ordem clara de aprendizado.", path: "/roadmaps" },
  { icon: <BookOpen className="w-5 h-5" />, titulo: "Cursos", desc: "Curadoria de cursos gratuitos e pagos por área, nível e idioma.", path: "/cursos" },
  { icon: <Users className="w-5 h-5" />, titulo: "Comunidades", desc: "Grupos e comunidades para se conectar com outras pessoas da área.", path: "/comunidades" },
];

function OldSobre() {
  return (
    <Layout>
      <SEO
        title="Sobre o Projeto — Conheça o Bora na Tech?"
        description="Conheça a missão do Bora na Tech?, uma plataforma educacional para ajudar iniciantes a começarem na tecnologia com direção."
        keywords={["sobre bora na tech", "missão tecnologia", "projeto educacional ti"]}
        url="/sobre"
        schemaType="WebPage"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-violet-100 py-16 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[3px_3px_0_#0f172a]">
                <Rocket className="w-6 h-6 text-violet-700" />
              </div>
              <span className="font-display font-bold text-2xl text-slate-950">
                BORA NA TECH<span className="text-violet-700">?</span>
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-4">
              Sobre o projeto
            </h1>
            <p className="text-slate-950 text-lg leading-relaxed">
              O BORA NA TECH? nasceu de uma pergunta simples: por que é tão difícil encontrar informações claras sobre como entrar em tecnologia?
            </p>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* O problema */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">O problema que queremos resolver</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Quando alguém decide entrar na tecnologia, se depara com um mar de informações contraditórias, cursos caros, influenciadores vendendo sonhos e conteúdo em inglês que pressupõe conhecimento prévio.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Quem está começando do zero — especialmente mulheres, pessoas negras e pessoas de baixa renda — precisa de um ponto de partida claro, gratuito e honesto.
              </p>
              <p className="text-slate-700 leading-relaxed">
                O BORA NA TECH? é esse ponto de partida.
              </p>
            </div>

            {/* O que é */}
            <div className="card-brutal bg-violet-50 rounded-xl p-6 border-violet-200">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">O que é o BORA NA TECH?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                É uma plataforma de curadoria e orientação para iniciantes em tecnologia. Não criamos cursos — reunimos o melhor conteúdo gratuito já existente e organizamos de forma que faça sentido para quem está começando.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {secoes.map((s) => (
                  <Link key={s.path} href={s.path} className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-violet-200 hover:border-violet-300 transition-colors group">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 group-hover:text-violet-700 transition-colors">{s.titulo}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Missão */}
            <div id="missao" className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">Nossa missão</h2>
              <div className="bg-violet-700 rounded-xl p-5 text-white mb-4">
                <p className="font-display font-bold text-lg leading-relaxed">
                  "Tornar o acesso à tecnologia mais simples, claro e justo para quem está começando — especialmente para quem se sente de fora."
                </p>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Acreditamos que a falta de representatividade em tecnologia não é um problema de capacidade, mas de acesso à informação e ao suporte certo. O BORA NA TECH? quer ser esse suporte.
              </p>
            </div>

            {/* Valores */}
            <div className="card-brutal bg-white rounded-xl p-6">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">Nossos valores</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {valores.map((v) => (
                  <div key={v.titulo} className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{v.emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">{v.titulo}</p>
                      <p className="text-sm text-slate-600">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="card-brutal bg-slate-50 rounded-xl p-6 border-slate-200">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-3">Transparência</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  Os cursos, plataformas e links listados pertencem aos seus respectivos criadores. O BORA NA TECH? é um projeto de curadoria, não de criação de conteúdo.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  Não garantimos emprego, salário ou resultados específicos. Tecnologia exige dedicação e tempo.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  As informações sobre salários, mercado e plataformas são baseadas em pesquisas públicas e podem variar.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  Não temos afiliação comercial com nenhuma das plataformas ou cursos listados.
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card-brutal bg-violet-700 rounded-xl p-6 text-white">
              <Heart className="w-6 h-6 text-red-300 mb-3" />
              <h3 className="font-display font-bold text-lg mb-2">Feito com carinho</h3>
              <p className="text-violet-200 text-sm">
                O BORA NA TECH? é um projeto independente, feito por pessoas que passaram pela experiência de tentar entrar em tecnologia sem saber por onde começar.
              </p>
            </div>

            <div className="card-brutal bg-white rounded-xl p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-3">O que você encontra aqui</h3>
              <ul className="space-y-2">
                {[
                  "12+ áreas de TI explicadas",
                  "Roadmaps por área",
                  "Cursos gratuitos e pagos curados",
                  "Plataformas comparadas",
                  "Eventos tech",
                  "Projetos para portfólio",
                  "Dicas de estágio e carreira",
                  "Comunidades para se conectar",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-brutal bg-violet-300 rounded-xl p-5">
              <h3 className="font-display font-bold text-slate-900 mb-2">Pronta para começar?</h3>
              <p className="text-slate-700 text-sm mb-4">Explore as áreas de TI e descubra qual combina com você.</p>
              <Link
                href="/areas"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm border-2 border-slate-900 hover:bg-slate-800 transition-colors"
              >
                Explorar áreas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default SobreRedesign;
