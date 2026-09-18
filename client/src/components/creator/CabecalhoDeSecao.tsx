import type { ReactNode } from "react";

// CABECALHO DE SECAO na forma do AdminSection do admin: selo, titulo e frase.
//
// Morava dentro do CreatorDashboardView ate o lote 08b. Saiu para ca porque
// passaram a ser tres os lugares que o desenham (a view, o cartao de redes e o
// de pagamento), e importar de dentro da view arrastava o painel inteiro, com
// o grafico, para quem so queria um titulo.

/** Cabecalho de secao na forma do AdminSection do admin: selo, titulo e frase. */
export function CabecalhoDeSecao({
  id,
  icone,
  selo,
  titulo,
  frase,
  aoLadoDoTitulo,
}: {
  id: string;
  icone: ReactNode;
  selo: string;
  titulo: string;
  frase: string;
  /** Algo pequeno ao lado do titulo (lote 10c: o marcador de cor do creator
   * no cartao Redes). Fora do h2, para o nome acessivel continuar so o titulo. */
  aoLadoDoTitulo?: ReactNode;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-violet-800 shadow-[2px_2px_0_var(--bnt-shadow)]">
        {icone}
        {selo}
      </p>
      {/* So embrulha quando ha algo ao lado: sem isso o h2 continua filho
          direto, logo abaixo do selo, como sempre foi. */}
      {aoLadoDoTitulo ? (
        <div className="mt-3 flex items-center gap-3">
          <h2
            id={id}
            className="font-display text-3xl font-black text-slate-950"
          >
            {titulo}
          </h2>
          {aoLadoDoTitulo}
        </div>
      ) : (
        <h2
          id={id}
          className="font-display mt-3 text-3xl font-black text-slate-950"
        >
          {titulo}
        </h2>
      )}
      <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
        {frase}
      </p>
    </div>
  );
}
