import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Lightbulb, Shuffle } from "lucide-react";

type Dica = (typeof import("@/lib/dicasData"))["dicas"][number];

// Card na home com uma dica aleatoria da lista REAL de dicas, com botao pra
// gerar outra (padrao "me surpreenda"). Nao inventa dicas.
// A lista carrega sob demanda no mount (dynamic import) para nao entrar no
// grafo do boot; enquanto carrega, um skeleton reserva o espaco do card.
export default function DicaDoDia() {
  const [dicas, setDicas] = useState<Dica[] | null>(null);
  const [indice, setIndice] = useState(0);
  const dica = dicas?.[indice];

  useEffect(() => {
    let ativo = true;
    import("@/lib/dicasData")
      .then((mod) => {
        if (ativo) setDicas(mod.dicas);
      })
      .catch(() => {
        if (ativo) setDicas([]);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function outra() {
    if (!dicas || dicas.length < 2) return;
    let proximo = indice;
    while (proximo === indice) {
      proximo = Math.floor(Math.random() * dicas.length);
    }
    setIndice(proximo);
  }

  if (dicas === null) {
    return (
      <section className="bg-[#faf8f4] py-16 sm:py-20">
        <div className="container">
          <div
            className="mx-auto h-64 max-w-2xl animate-pulse rounded-2xl border-2 border-slate-200 bg-white sm:h-56"
            aria-hidden="true"
          />
        </div>
      </section>
    );
  }

  if (!dica) return null;

  return (
    <section className="bg-[#faf8f4] py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[5px_5px_0_#fbbf24] sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-700">
              <Lightbulb className="h-4 w-4" aria-hidden />
              Dica rápida
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-black uppercase text-slate-600">
              {dica.categoria}
            </span>
          </div>
          <p className="font-display text-lg font-bold leading-snug text-slate-950 sm:text-xl">
            {dica.texto}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={outra}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
            >
              <Shuffle className="h-4 w-4" aria-hidden />
              Outra dica
            </button>
            <Link
              href="/dicas"
              className="inline-flex items-center gap-1 text-sm font-black text-violet-800 hover:underline"
            >
              Ver todas as dicas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
