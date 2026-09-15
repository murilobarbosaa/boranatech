import type { ReactNode } from "react";

import type { TagPalette } from "@/lib/tagPalette";

// Tile de numero do painel de creator.
//
// Componente PROPRIO, e nao o MetricTile/MetricCardView do admin: aqueles vivem
// privados dentro de client/src/pages/Admin.tsx, e extrai-los arrastaria a
// zona de colisao do admin para este lote. A unificacao dos tiles fica anotada
// para depois.
//
// `icone` e opcional: o painel do creator passa um por tile; o resumo da aba
// Creators do admin nao passa, e continua como era.
//
// `tom` tambem e opcional: com ele o tile vira `card-brutal` no fundo pastel de
// um par de tagPalette.ts, com o icone na tinta escura do par (o painel do
// creator, nos dois temas pelo "contexto pastel" do index.css). Sem ele, o tile
// e exatamente o de antes, que e o que o resumo do admin usa.

export function CreatorMetricTile({
  rotulo,
  valor,
  detalhe,
  icone,
  tom,
  testId,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  icone?: ReactNode;
  tom?: TagPalette;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={
        tom
          ? `card-brutal rounded-2xl p-4 ${tom.bg}`
          : "rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
      }
    >
      <div className="flex items-center gap-1.5">
        {icone ? (
          <span
            aria-hidden="true"
            className={`shrink-0 ${tom ? tom.text : "text-violet-700"}`}
          >
            {icone}
          </span>
        ) : null}
        <p
          className={`text-[11px] font-black uppercase tracking-wide ${tom ? "text-slate-700" : "text-slate-500"}`}
        >
          {rotulo}
        </p>
      </div>
      <p
        data-testid={testId ? `${testId}-valor` : undefined}
        className="mt-1.5 font-display text-2xl font-black text-slate-950 sm:text-3xl"
      >
        {valor}
      </p>
      {detalhe ? (
        <p
          className={`mt-1 text-xs font-bold ${tom ? "text-slate-700" : "text-slate-500"}`}
        >
          {detalhe}
        </p>
      ) : null}
    </div>
  );
}
