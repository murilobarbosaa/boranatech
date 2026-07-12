import type { RoadmapLanguage, RoadmapV2 } from "./types";

// Metadados leves de uma trilha v2, derivados do conteudo completo pelo
// scripts/generateRoadmapMeta.mts (saida em meta.generated.ts). A listagem
// consome isso no lugar do agregado pra nao arrastar o conteudo inteiro
// (markdown de todos os passos) pro bundle.
export type RoadmapMeta = {
  slug: string;
  area: string;
  kind?: RoadmapV2["kind"];
  title: string;
  level: string;
  description: string;
  languages?: RoadmapLanguage[];
  // sections.length da trilha.
  sectionCount: number;
  // Soma dos children diretos de cada section (a mesma contagem de "passos"
  // que o card da listagem sempre exibiu).
  stepCount: number;
  // Existe algum no com project em qualquer profundidade.
  hasProject: boolean;
  // Existe pool de quiz em server/data/roadmapQuizzes pra esta trilha. So o
  // boolean chega ao client; o pool em si (com gabarito) e server-only.
  hasQuiz: boolean;
};
