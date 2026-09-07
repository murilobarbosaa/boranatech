export type EstadoChip =
  | { tipo: "nao_iniciado" }
  | { tipo: "em_andamento"; feitas?: number; total?: number }
  | { tipo: "concluido" }
  | { tipo: "entregue" }
  | { tipo: "verificado" }
  | { tipo: "pro_travado" };

const BASE =
  "inline-flex items-center gap-2 rounded-[10px] border-2 px-3 py-1.5 font-display text-xs font-bold";

const CORES: Record<EstadoChip["tipo"], string> = {
  nao_iniciado: "border-border text-muted-foreground",
  em_andamento: "border-violet-500 text-violet-700 dark:text-violet-300",
  concluido: "border-emerald-500 text-emerald-700 dark:text-emerald-300",
  entregue: "border-violet-500 text-violet-700 dark:text-violet-300",
  verificado: "border-emerald-500 text-emerald-700 dark:text-emerald-300",
  pro_travado: "border-amber-500 text-amber-700 dark:text-amber-300",
};

const QUADRADO: Record<EstadoChip["tipo"], string> = {
  nao_iniciado: "bg-border",
  em_andamento: "bg-violet-500",
  concluido: "bg-emerald-500",
  entregue: "bg-violet-500",
  verificado: "bg-emerald-500",
  pro_travado: "bg-amber-500",
};

function rotulo(estado: EstadoChip): string {
  if (estado.tipo === "nao_iniciado") return "Não iniciado";
  if (estado.tipo === "concluido") return "Concluído";
  if (estado.tipo === "entregue") return "Entregue";
  if (estado.tipo === "verificado") return "Verificado";
  if (estado.tipo === "pro_travado") return "Assinar para abrir";
  if (estado.feitas === undefined || estado.total === undefined)
    // TODO(Ana): rotulo do card quando o total de etapas ainda nao carregou
    return "Em andamento";
  return `${estado.feitas} de ${estado.total} etapas`;
}

export default function ProjetoEstadoChip({
  estado,
  className = "",
}: {
  estado: EstadoChip;
  className?: string;
}) {
  return (
    <span className={`${BASE} ${CORES[estado.tipo]} ${className}`}>
      <span
        className={`h-2.5 w-2.5 rounded-[3px] ${QUADRADO[estado.tipo]}`}
        aria-hidden
      />
      {rotulo(estado)}
    </span>
  );
}
