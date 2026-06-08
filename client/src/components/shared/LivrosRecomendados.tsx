import type { Livro } from "@/lib/data";
import type { PageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const NIVEL_ORDEM: Record<Livro["nivel"], number> = {
  Iniciante: 0,
  Intermediário: 1,
  Avançado: 2,
};

interface LivrosRecomendadosProps {
  titulo: string;
  livros: Livro[];
  ac: PageAccentUi;
}

export default function LivrosRecomendados({
  titulo,
  livros,
  ac,
}: LivrosRecomendadosProps) {
  const ordenados = [...livros].sort(
    (a, b) => NIVEL_ORDEM[a.nivel] - NIVEL_ORDEM[b.nivel],
  );

  return (
    <div className={cn("card-brutal rounded-xl bg-white p-6", ac.liftShadow)}>
      <h2 className="font-display mb-4 text-xl font-bold text-slate-900">
        {titulo}
      </h2>
      <div className="space-y-3">
        {ordenados.map((livro) => (
          <div
            key={`${livro.titulo}-${livro.autor}`}
            className={cn(
              "rounded-lg border-2 p-4",
              ac.panelBorder,
              ac.panelSoft,
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border bg-white px-2 py-0.5 text-[11px] font-black uppercase",
                  ac.panelBorder,
                  ac.tbodyAccent,
                )}
              >
                {livro.nivel}
              </span>
              {livro.gratuito ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase text-emerald-800">
                  Grátis
                </span>
              ) : null}
              {livro.ano ? (
                <span className="text-xs font-bold text-slate-400">
                  {livro.ano}
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 font-display text-lg font-black text-slate-900">
              {livro.link ? (
                <a
                  href={livro.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(ac.link, ac.linkHover)}
                >
                  {livro.titulo}
                </a>
              ) : (
                livro.titulo
              )}
            </h3>
            <p className="text-sm font-semibold text-slate-600">
              {livro.autor}
            </p>
            <p className="mt-1 text-sm text-slate-700">{livro.porque}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
