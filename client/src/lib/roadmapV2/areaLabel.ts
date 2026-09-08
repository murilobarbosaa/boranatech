import type { RoadmapV2 } from "@/lib/roadmapV2/types";

// Rotulo de area exibido no cabecalho da pagina da trilha (RoadmapsV2.tsx).
// Extraido da pagina sem mudar o comportamento das trilhas existentes: titulo
// com "Front" vira "Front-end" e qualquer outra trilha devolve `area` cru
// (inclusive a sentinela "carreira"). Os kinds de linguagem, framework e
// ferramenta ganham rotulo proprio porque a `area` deles e a sentinela do
// kind, que nao serve de rotulo.
export function roadmapAreaLabel(
  roadmap: Pick<RoadmapV2, "title" | "area" | "kind">,
): string {
  // TODO(Ana): rotulo de area das trilhas de linguagem
  if (roadmap.kind === "linguagem") return "Linguagem";
  // TODO(Ana): rotulo de area das trilhas de framework
  if (roadmap.kind === "framework") return "Framework";
  // TODO(Ana): rotulo de area das trilhas de ferramenta
  if (roadmap.kind === "ferramenta") return "Ferramenta";
  return roadmap.title.includes("Front") ? "Front-end" : roadmap.area;
}
