/*
  BORA NA TECH? — Footer Component
  Style: Neo-Brutalism Suavizado
  - Dark background with violet accent
  - Links organized in columns
*/

import { Link } from "wouter";
import { Compass, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white border-t-4 border-violet-700" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-600 rounded-md flex items-center justify-center border-2 border-white">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">
                BORA NA TECH<span className="text-amber-400">?</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sua porta de entrada para o universo da tecnologia. Simples, organizado e feito para quem está começando.
            </p>
          </div>

          {/* Explorar */}
          <nav aria-label="Explorar">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-violet-400 mb-4">Explorar</h3>
            <ul className="space-y-2">
              {[
                { path: "/areas", label: "Áreas da TI" },
                { path: "/roadmaps", label: "Roadmaps" },
                { path: "/cursos", label: "Cursos" },
                { path: "/plataformas", label: "Plataformas" },
                { path: "/faculdades", label: "Faculdades" },
                { path: "/dicionario", label: "Dicionário" },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Carreira */}
          <nav aria-label="Carreira">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-violet-400 mb-4">Carreira</h3>
            <ul className="space-y-2">
              {[
                { path: "/eventos", label: "Eventos Tech" },
                { path: "/projetos", label: "Projetos" },
                { path: "/estagio", label: "Estágio, Trainee e Carreira" },
                { path: "/noticias", label: "Notícias" },
                { path: "/comunidades", label: "Comunidades" },
                { path: "/mulheres", label: "Área de Mulheres" },
                { path: "/dicas", label: "Dicas" },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sobre */}
          <nav aria-label="Projeto">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-violet-400 mb-4">Projeto</h3>
            <ul className="space-y-2">
              {[
                { path: "/sobre", label: "Sobre o Projeto" },
                { path: "/comparador", label: "Comparador" },
                { path: "/quiz-carreira", label: "Quiz de Carreira" },
                { path: "/sobre#missao", label: "Missão e Valores" },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">
                Os conteúdos externos (cursos, plataformas, links) pertencem aos seus respectivos criadores. O BORA NA TECH? é um projeto de curadoria.
              </p>
            </div>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 BORA NA TECH? — Feito com <Heart className="inline w-3 h-3 text-red-400" /> para quem está começando.
          </p>
          <p className="text-slate-600 text-xs">
            Plataforma educativa e de curadoria. Não garantimos emprego ou resultados.
          </p>
        </div>
      </div>
    </footer>
  );
}
