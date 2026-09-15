import type { ReactNode } from "react";

// Card de numero do painel de creator, na FORMA do MetricCardView do admin
// (client/src/pages/Admin.tsx): card-brutal branco, quadrado de icone colorido,
// rotulo, valor e detalhe. Copia da forma, e nao extracao: o MetricCardView vive
// privado dentro do Admin.tsx, e a unificacao dos tiles e divida registrada.
//
// A cor do quadrado e uma das quatro que o admin ja usa, como uniao de strings
// literais: o Tailwind so emite classe escrita, e uma cor montada em runtime
// sairia sem estilo e sem erro.

export type CorDoCard =
  | "bg-violet-800 text-white"
  | "bg-sky-600 text-white"
  | "bg-[var(--bnt-accent-solid)] text-ink-on-accent"
  | "bg-emerald-600 text-white";

export function CreatorMetricCard({
  testId,
  icone,
  cor,
  rotulo,
  valor,
  detalhe,
}: {
  testId: string;
  icone: ReactNode;
  cor: CorDoCard;
  rotulo: string;
  valor: ReactNode;
  detalhe: ReactNode;
}) {
  return (
    <article
      data-testid={testId}
      className="card-brutal flex h-full flex-col rounded-3xl bg-white p-5"
    >
      <span
        aria-hidden="true"
        className={`flex h-13 w-13 items-center justify-center rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0_var(--bnt-shadow)] ${cor}`}
      >
        {icone}
      </span>
      <p className="mt-5 text-sm font-black uppercase tracking-wide text-slate-500">
        {rotulo}
      </p>
      <p
        data-testid={`${testId}-valor`}
        className="font-display mt-1 text-3xl font-black tabular-nums text-slate-950 sm:text-4xl"
      >
        {valor}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{detalhe}</p>
    </article>
  );
}
