import type { ReactNode } from "react";

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
  children,
}: {
  estado: EstadoChip;
  topo?: ReactNode;
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
    </aside>
  );
}
