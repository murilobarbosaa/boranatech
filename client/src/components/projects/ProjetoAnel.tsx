const RAIO = 15.5;
const VOLTA = 2 * Math.PI * RAIO;

export default function ProjetoAnel({
  feitas,
  total,
  desde,
}: {
  feitas: number;
  total: number;
  desde?: string;
}) {
  const fracao = total > 0 ? feitas / total : 0;
  const legenda =
    feitas === 0
      ? "Não iniciado"
      : feitas === total
        ? "Concluído"
        : desde
          ? `Em andamento desde ${desde}`
          : "Em andamento";

  return (
    <div className="card-brutal flex items-center gap-4 rounded-xl bg-card p-4">
      <svg viewBox="0 0 36 36" className="h-16 w-16 shrink-0" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r={RAIO}
          fill="none"
          className="stroke-border"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r={RAIO}
          fill="none"
          className="stroke-violet-500"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(VOLTA * fracao).toFixed(2)} ${VOLTA.toFixed(2)}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div className="min-w-0">
        <span className="block font-display text-lg font-bold text-foreground">
          {feitas} de {total} etapas
        </span>
        <span className="block text-xs text-muted-foreground">{legenda}</span>
      </div>
    </div>
  );
}
