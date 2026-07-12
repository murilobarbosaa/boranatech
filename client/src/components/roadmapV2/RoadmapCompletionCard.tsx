import { CompletionCtaLinks } from "@/components/roadmapV2/RoadmapCompletionModal";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import { requiredLeaves } from "@/lib/roadmapV2/progress";
import type { RoadmapCompletion } from "@/services/roadmapCompletionService";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Card persistente de conclusao no topo da trilha estatica. Molde visual do
// card equivalente em RoadmapIAView (emerald, borda grossa, sombra flat).
// completion && !allComplete se divide em dois estados, distinguidos pelo
// required_count congelado no registro versus o count atual do catalogo:
// - count atual maior: a trilha ganhou conteudo novo depois da conclusao
//   (cenario da Fase 3) e o card diz isso;
// - count igual (ou menor): o usuario so desmarcou um passo ja concluido. A
//   conclusao e duravel (desmarcar checkbox nao a revoga), entao o card fica
//   neutro, sem falar em conteudo novo.
// Aprovacao na prova final da trilha (null = sem aprovacao ou trilha sem
// quiz). Com aprovacao, o card exibe o selo com o score e a CTA do slot quiz
// vira "rever a prova".
export type RoadmapQuizApproval = {
  score: number | null;
};

type RoadmapCompletionCardProps = {
  roadmap: RoadmapV2;
  completion: RoadmapCompletion | null;
  allComplete: boolean;
  ctas: CompletionCta[];
  quizApproval?: RoadmapQuizApproval | null;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function QuizApprovalBadge({ approval }: { approval: RoadmapQuizApproval }) {
  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[2px_2px_0_#0f172a]">
      {/* TODO(Ana): copy do selo de aprovacao na prova final */}
      Prova final aprovada
      {approval.score != null ? ` (${approval.score}/10)` : ""}
    </p>
  );
}

export default function RoadmapCompletionCard({
  roadmap,
  completion,
  allComplete,
  ctas,
  quizApproval = null,
}: RoadmapCompletionCardProps) {
  if (!completion && !allComplete) return null;

  const completedDate = completion ? formatDate(completion.completedAt) : "";

  // Aprovado na prova: a CTA do slot quiz muda de "fazer" pra "rever".
  const effectiveCtas = quizApproval
    ? ctas.map((cta) =>
        cta.kind === "quiz"
          ? // TODO(Ana): copy da CTA de rever a prova aprovada
            { ...cta, label: "Rever a prova" }
          : cta,
      )
    : ctas;

  if (completion && !allComplete) {
    const currentRequiredCount = roadmap.sections.reduce(
      (sum, section) => sum + requiredLeaves(section).length,
      0,
    );
    const hasNewContent = completion.requiredCount < currentRequiredCount;

    return (
      <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
        <p className="text-sm font-bold text-slate-900">
          {hasNewContent ? (
            <>
              {/* TODO(Ana): copy do estado "concluida antes, tem conteudo novo" */}
              Você concluiu esta trilha
              {completedDate ? ` em ${completedDate}` : ""}. Ela ganhou conteúdo
              novo desde então: revisite os passos pendentes quando quiser.
            </>
          ) : (
            <>
              {/* TODO(Ana): copy do estado "concluida, sem conteudo novo" */}
              Você concluiu esta trilha
              {completedDate ? ` em ${completedDate}` : ""}.
            </>
          )}
        </p>
        {quizApproval && <QuizApprovalBadge approval={quizApproval} />}
        <div className="mt-4">
          <CompletionCtaLinks
            ctas={effectiveCtas.filter((cta) => cta.variant === "primary")}
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
      {quizApproval && <QuizApprovalBadge approval={quizApproval} />}
      <div className="mt-4">
        <CompletionCtaLinks ctas={effectiveCtas} />
      </div>
    </div>
  );
}
