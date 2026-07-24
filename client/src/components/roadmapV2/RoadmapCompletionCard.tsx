import CertificateBlock from "@/components/certificates/CertificateBlock";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import { requiredLeaves } from "@/lib/roadmapV2/progress";
import type { RoadmapCompletion } from "@/services/roadmapCompletionService";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Bloco persistente de conclusao no topo da trilha estatica. Antes mostrava 4
// CTAs fixas; agora e UMA maquina de estados dirigida pela elegibilidade de
// certificado (CertificateBlock), que busca o GET /api/certificates/eligibility
// por conta propria. Este componente so decide SE o bloco aparece (concluiu a
// trilha), emite o aviso de conteudo novo e passa a data e as CTAs secundarias.
type RoadmapCompletionCardProps = {
  roadmap: RoadmapV2;
  completion: RoadmapCompletion | null;
  allComplete: boolean;
  ctas: CompletionCta[];
  // Contagem agregada de topicos, repassada ao CertificateBlock (reforco de
  // conquista no estado already_issued). Opcional.
  overall?: { done: number; total: number };
  // Persistencia da celebracao: chamado pelo card apos disparar o confete pra
  // marcar celebrated_at (dispara so na primeira vez, cross-device).
  onCelebrate?: () => void;
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
  overall,
  onCelebrate,
}: RoadmapCompletionCardProps) {
  if (!completion && !allComplete) return null;

  const completedDate = completion ? formatDate(completion.completedAt) : "";
  const secondaryCtas = ctas.filter(
    (cta) => cta.kind === "next-trail" || cta.kind === "projects",
  );

  // Aviso ortogonal a certificado: a trilha ganhou passos obrigatorios DEPOIS
  // da conclusao (required_count congelado < count atual do catalogo). Nao
  // invalida certificado ja emitido (o snapshot e congelado por design), so
  // informa. Fica ACIMA da maquina de estados, em qualquer estado dela.
  const currentRequiredCount = roadmap.sections.reduce(
    (sum, section) => sum + requiredLeaves(section).length,
    0,
  );
  const hasNewContent =
    completion != null && completion.requiredCount < currentRequiredCount;

  return (
    <>
      {hasNewContent && (
        <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-amber-50 p-4 shadow-[4px_4px_0_#FFB800]">
          <p className="text-sm font-bold text-slate-900">
            {/* TODO(Ana): aviso de conteudo novo desde a conclusao */}
            Esta trilha ganhou passos novos desde a sua conclusão.
          </p>
        </div>
      )}
      <CertificateBlock
        roadmap={roadmap}
        completedDate={completedDate}
        secondaryCtas={secondaryCtas}
        overall={overall}
        celebratedAt={completion ? completion.celebratedAt : undefined}
        onCelebrate={onCelebrate}
      />
    </>
  );
}
