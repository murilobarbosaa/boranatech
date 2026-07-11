import { CompletionCtaLinks } from "@/components/roadmapV2/RoadmapCompletionModal";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import type { RoadmapCompletion } from "@/services/roadmapCompletionService";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Card persistente de conclusao no topo da trilha estatica. Molde visual do
// card equivalente em RoadmapIAView (emerald, borda grossa, sombra flat).
// Variante discreta: completion registrada mas allComplete false, ou seja, a
// trilha ganhou conteudo novo depois da conclusao (cenario da Fase 3).
type RoadmapCompletionCardProps = {
  roadmap: RoadmapV2;
  completion: RoadmapCompletion | null;
  allComplete: boolean;
  ctas: CompletionCta[];
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export default function RoadmapCompletionCard({
  roadmap,
  completion,
  allComplete,
  ctas,
}: RoadmapCompletionCardProps) {
  if (!completion && !allComplete) return null;

  const completedDate = completion ? formatDate(completion.completedAt) : "";

  if (completion && !allComplete) {
    return (
      <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
        <p className="text-sm font-bold text-slate-900">
          {/* TODO(Ana): copy do estado "concluida antes, tem conteudo novo" */}
          Você concluiu esta trilha
          {completedDate ? ` em ${completedDate}` : ""}. Ela ganhou conteúdo
          novo desde então: revisite os passos pendentes quando quiser.
        </p>
        <div className="mt-4">
          <CompletionCtaLinks
            ctas={ctas.filter((cta) => cta.variant === "primary")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-emerald-50 p-5 shadow-[4px_4px_0_#10b981]">
      <h2 className="font-display text-xl font-black text-slate-950">
        {/* TODO(Ana): titulo do card de trilha concluida */}
        Você concluiu a trilha {roadmap.title}!
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {/* TODO(Ana): corpo do card de trilha concluida */}
        {completedDate
          ? `Conclusão registrada em ${completedDate}. Continue o movimento com os próximos passos abaixo.`
          : "Todos os passos obrigatórios estão concluídos. Continue o movimento com os próximos passos abaixo."}
      </p>
      <div className="mt-4">
        <CompletionCtaLinks ctas={ctas} />
      </div>
    </div>
  );
}
