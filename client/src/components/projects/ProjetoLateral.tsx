import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

import ProjetoEstadoChip, {
  type EstadoChip,
} from "@/components/projects/ProjetoEstadoChip";

export type ProximoProjeto = {
  id: string;
  nome: string;
  area: string;
  nivel: string;
};

export default function ProjetoLateral({
  estado,
  topo,
  proximo,
  children,
}: {
  estado: EstadoChip;
  topo?: ReactNode;
  proximo?: ProximoProjeto | null;
  children?: ReactNode;
}) {
  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-border bg-muted/40 p-4 lg:sticky lg:top-16">
      {topo ?? (
        <div className="card-brutal rounded-xl bg-card p-4">
          <ProjetoEstadoChip estado={estado} />
        </div>
      )}
      {children}
      {proximo && (
        <Link
          href={`/projetos/${proximo.id}`}
          className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:border-ink"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold text-muted-foreground">
              Próximo projeto
            </span>
            <span className="block font-display text-base font-bold text-foreground">
              {proximo.nome}
            </span>
            <span className="block text-xs text-muted-foreground">
              {proximo.area} · {proximo.nivel}
            </span>
          </span>
          <ArrowRight
            className="ml-auto h-5 w-5 shrink-0 text-violet-600"
            aria-hidden
          />
        </Link>
      )}
    </aside>
  );
}
