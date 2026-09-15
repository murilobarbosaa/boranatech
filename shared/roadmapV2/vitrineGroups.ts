import type { RoadmapMeta } from "./meta";

// Grupos de trilha da vitrine (/roadmaps), derivados do meta, que por sua vez
// deriva do registro (shared/roadmapV2/content/index.ts): trilha nova
// registrada aparece aqui sem tocar na vitrine. Trilha de area (sem kind) e de
// carreira ficam fora: a vitrine as lista nos blocos proprios, como sempre.
// "framework" entra no grupo de linguagens, como registrado em types.ts.
// Ordem dos grupos fixa; dentro do grupo, a ordem do registro. Grupo sem
// trilha nao sai, para a vitrine nao desenhar titulo sem card.

export type TrailGroupKey = "linguagem" | "ferramenta";

export interface TrailEntry {
  slug: string;
  title: string;
  // summary da trilha, ou a description quando ela nao declara um.
  summary: string;
  sectionCount: number;
  stepCount: number;
  hasQuiz: boolean;
}

export interface TrailGroup {
  key: TrailGroupKey;
  entries: TrailEntry[];
}

const GROUPS: {
  key: TrailGroupKey;
  kinds: NonNullable<RoadmapMeta["kind"]>[];
}[] = [
  { key: "linguagem", kinds: ["linguagem", "framework"] },
  { key: "ferramenta", kinds: ["ferramenta"] },
];

export function trailGroups(meta: RoadmapMeta[]): TrailGroup[] {
  return GROUPS.map(({ key, kinds }) => ({
    key,
    entries: meta
      .filter((r) => r.kind !== undefined && kinds.includes(r.kind))
      .map((r) => ({
        slug: r.slug,
        title: r.title,
        summary: r.summary ?? r.description,
        sectionCount: r.sectionCount,
        stepCount: r.stepCount,
        hasQuiz: r.hasQuiz,
      })),
  })).filter((group) => group.entries.length > 0);
}
