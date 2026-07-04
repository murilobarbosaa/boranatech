import { Target } from "lucide-react";

// Card de destaque com a UNICA acao de maior impacto (proximoPasso), usado
// pelos analisadores (GitHub e LinkedIn). Retrocompat: analises antigas do
// historico nao tem o campo; o card so renderiza quando ele existe e nao
// esta vazio.
export function NextStepCard({ proximoPasso }: { proximoPasso?: string }) {
  if (!proximoPasso || proximoPasso.trim() === "") return null;
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-amber-100 p-6">
      {/* TODO(Ana): revisar a copy do card de proximo passo. */}
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]">
        <Target className="h-3.5 w-3.5" />
        se você fizer UMA coisa hoje
      </span>
      <p className="mt-4 text-lg font-bold leading-relaxed text-slate-900">
        {proximoPasso}
      </p>
    </div>
  );
}
