import { Link } from "wouter";
import { ProStarIcon } from "@/components/pro/ProStarIcon";

// Secao "o que voce encontra": lista escaneavel das principais coisas do site,
// com marcacao clara de Gratis vs Pro. So itens que existem de verdade (rotas
// reais em App.tsx). Pro = ferramentas de IA com requiresPro:true no server
// (server/lib/aiTools.ts). Descoberta e gratis.
// TODO(Ana): revisar a copy dos cards, do titulo e do subtitulo desta secao.

interface Item {
  nome: string;
  desc: string;
  href: string;
  pro?: boolean;
}

const ITENS: Item[] = [
  {
    nome: "Áreas da TI",
    desc: "Descubra as áreas e o que cada uma faz.",
    href: "/areas",
  },
  {
    nome: "Roadmaps",
    desc: "Trilhas passo a passo de por onde começar.",
    href: "/roadmaps",
  },
  {
    nome: "Cursos curados",
    desc: "Cursos grátis e pagos selecionados por área.",
    href: "/cursos",
  },
  {
    nome: "Comparador",
    desc: "Compare tecnologias lado a lado.",
    href: "/comparador",
  },
  {
    nome: "Dicionário tech",
    desc: "Termos da área explicados sem jargão.",
    href: "/dicionario",
  },
  {
    nome: "Inglês para devs",
    desc: "Vocabulário, frases e pronúncia do trabalho.",
    href: "/ingles",
  },
  {
    nome: "Notícias",
    desc: "O que está rolando na tech, filtrado por nível.",
    href: "/noticias",
  },
  {
    nome: "Ferramentas",
    desc: "Catálogo das ferramentas usadas na área.",
    href: "/ferramentas",
  },
  {
    nome: "Comunidade",
    desc: "Comunidades e creators pra acompanhar.",
    href: "/comunidades",
  },
  {
    // TODO(Ana): copy do item de treino de entrevista
    nome: "Treino de entrevista",
    desc: "Treine entrevista com IA e feedback por resposta.",
    href: "/entrevistas",
    pro: true,
  },
  {
    // TODO(Ana): copy do item de plano de carreira
    nome: "Plano de carreira",
    desc: "A IA monta a rota da sua carreira, com ordem e certificações.",
    href: "/plano-carreira",
    pro: true,
  },
  {
    nome: "Análise de portfólio",
    desc: "A IA aponta o que falta no seu GitHub.",
    href: "/portfolio/analisar",
    pro: true,
  },
  {
    nome: "Currículo com IA",
    desc: "Monte e revise seu currículo com a IA.",
    href: "/curriculo/gerar",
    pro: true,
  },
];

export default function OQueEncontra() {
  return (
    <section className="border-y-2 border-slate-950 bg-[#faf8f4] py-16 sm:py-20">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">
            O que você encontra
          </p>
          <h2 className="mt-2 font-display text-3xl font-black text-slate-950 sm:text-4xl">
            Tudo pra começar na tech, num lugar só
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Descoberta é grátis. As análises personalizadas por IA (
            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
              Pro
              <ProStarIcon />
            </span>
            ) são o plano pago.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITENS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-5 shadow-[4px_4px_0_#0f172a] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#0f172a]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-black text-slate-950">
                    {item.nome}
                  </h3>
                  {item.pro ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-950 bg-amber-300 px-2 py-0.5 text-[11px] font-black text-slate-950">
                      Pro
                      <ProStarIcon />
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                      Grátis
                    </span>
                  )}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-violet-800">
                  Abrir
                  <span
                    aria-hidden
                    className="transition-transform motion-safe:group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
