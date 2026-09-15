import type { ReactNode } from "react";

// Tile de numero do resumo da aba Creators do admin.
//
// Componente PROPRIO, e nao o MetricTile/MetricCardView do admin: aqueles vivem
// privados dentro de client/src/pages/Admin.tsx, e extrai-los arrastaria a
// zona de colisao do admin para este lote. A unificacao dos tiles fica anotada
// para depois.
//
// O painel do creator nao usa mais este tile: ele tem o CreatorMetricCard, na
// forma do MetricCardView.

export function CreatorMetricTile({
  rotulo,
  valor,
  detalhe,
  testId,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
    >
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
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
        <p className="mt-1 text-xs font-bold text-slate-500">{detalhe}</p>
      ) : null}
    </div>
  );
}
