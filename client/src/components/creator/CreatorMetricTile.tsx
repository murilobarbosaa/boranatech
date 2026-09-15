import type { ReactNode } from "react";

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
// PELE: fundo, borda e sombra leem as variaveis `--creator-*` do wrapper do
// /creator (index.css, .bnt-creator-pele). O admin nao as define, e cada
// fallback e a classe de antes (bg-white, border-2 border-slate-900 e a sombra
// de 3px).

export function CreatorMetricTile({
  rotulo,
  valor,
  detalhe,
  icone,
  testId,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  icone?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="bnt-creator-cartao bnt-creator-anel rounded-2xl border-[length:var(--creator-card-border-width,2px)] border-[color:var(--creator-card-border,var(--color-slate-900))] p-4 [box-shadow:var(--creator-card-shadow,3px_3px_0_var(--bnt-shadow))]"
    >
      <div className="flex items-center gap-1.5">
        {icone ? (
          <span aria-hidden="true" className="shrink-0 text-violet-700">
            {icone}
          </span>
        ) : null}
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
