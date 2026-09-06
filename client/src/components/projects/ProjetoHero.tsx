import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

import ProjetoEstadoChip, {
  type EstadoChip,
} from "@/components/projects/ProjetoEstadoChip";
import { areaGridPaletteOf } from "@/lib/areaGridPalette";
import {
  labelForProjectArea,
  labelForProjectSubarea,
} from "@/lib/projectAreaGroup";
import type { ProjetoCatalogo } from "@shared/projects/catalog";

export type Fato = { valor: string; legenda: string };

const nivelColors: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-700",
  Intermediário: "bg-blue-100 text-blue-700",
  Avançado: "bg-violet-100 text-violet-700",
};

export default function ProjetoHero({
  projeto,
  estado,
  concluidoEm,
  fatos,
  acoes,
  faixaMobile,
}: {
  projeto: ProjetoCatalogo;
  estado: EstadoChip;
  concluidoEm?: string;
  fatos: Fato[];
  acoes?: ReactNode;
  faixaMobile?: ReactNode;
}) {
  const areaLabel = labelForProjectArea(projeto.areaSlug);
  const areaBadge = areaGridPaletteOf(areaLabel);
  const subareaLabel = labelForProjectSubarea(
    projeto.areaSlug,
    projeto.subareaSlug,
  );

  return (
    <header className="pb-7">
      <nav
        className="flex items-center gap-2 pt-6 text-sm text-muted-foreground"
        aria-label="Trilha de navegação"
      >
        <Link
          href="/projetos"
          className="inline-flex items-center gap-1 rounded hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Projetos
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/projetos?area=${projeto.areaSlug ?? ""}`}
          className="rounded hover:underline"
        >
          {areaLabel}
        </Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${areaBadge.bg} ${areaBadge.text} ${areaBadge.border}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {areaLabel}
        </span>
        {subareaLabel !== null && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${areaBadge.bg} ${areaBadge.text} ${areaBadge.border}`}
          >
            {subareaLabel}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${nivelColors[projeto.nivel] ?? "bg-slate-100 text-slate-600"}`}
        >
          {projeto.nivel}
        </span>
        <ProjetoEstadoChip estado={estado} />
        {concluidoEm && (
          <span className="text-xs font-semibold text-muted-foreground">
            Concluído em {concluidoEm}
          </span>
        )}
      </div>

      <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
        {projeto.nome}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-muted-foreground">
        {projeto.objetivo}
      </p>

      {fatos.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {fatos.map((fato) => (
            <div key={fato.legenda} className="flex flex-col">
              <dt className="sr-only">{fato.legenda}</dt>
              <dd className="font-display text-base font-bold text-foreground">
                {fato.valor}
              </dd>
              <span className="text-xs text-muted-foreground">
                {fato.legenda}
              </span>
            </div>
          ))}
        </dl>
      )}

      {acoes && (
        <div className="mt-6 flex flex-wrap items-center gap-3">{acoes}</div>
      )}
      {faixaMobile}
    </header>
  );
}
