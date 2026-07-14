import { describe, expect, it } from "vitest";

import { roadmapsV2 } from "../roadmapV2/content";
import type { RoadmapV2 } from "../roadmapV2/types";
import { computeHours } from "./hours";

describe("computeHours", () => {
  it("distribui as horas de forma que a soma das secoes bate com totalHours", () => {
    for (const roadmap of roadmapsV2) {
      const { totalHours, sections } = computeHours(roadmap);
      const sum = sections.reduce((acc, section) => acc + section.hours, 0);
      expect(sum, `invariante quebrada em ${roadmap.slug}`).toBe(totalHours);
    }
  });

  it("mantem totalHours no intervalo [20, 120]", () => {
    for (const roadmap of roadmapsV2) {
      const { totalHours } = computeHours(roadmap);
      expect(totalHours).toBeGreaterThanOrEqual(20);
      expect(totalHours).toBeLessThanOrEqual(120);
      expect(totalHours % 5).toBe(0);
    }
  });

  it("preserva id e title de cada secao na ementa", () => {
    for (const roadmap of roadmapsV2) {
      const { sections } = computeHours(roadmap);
      expect(sections).toHaveLength(roadmap.sections.length);
      sections.forEach((section, index) => {
        expect(section.id).toBe(roadmap.sections[index].id);
        expect(section.title).toBe(roadmap.sections[index].title);
      });
    }
  });

  it("e deterministico", () => {
    for (const roadmap of roadmapsV2) {
      expect(computeHours(roadmap)).toEqual(computeHours(roadmap));
    }
  });

  it("aplica o piso de 20h numa trilha minima e fecha a soma", () => {
    const tiny: RoadmapV2 = {
      slug: "tiny",
      area: "tiny",
      title: "Tiny",
      level: "Iniciante",
      description: "",
      sections: [
        {
          id: "s1",
          title: "So um passo",
          children: [{ id: "s1-a", title: "Passo", content: "uma palavra" }],
        },
      ],
    };
    const { totalHours, sections } = computeHours(tiny);
    expect(totalHours).toBe(20);
    expect(sections.reduce((acc, s) => acc + s.hours, 0)).toBe(20);
  });

  it("aplica o teto de 120h numa trilha enorme", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: `n${i}`,
      title: `No ${i}`,
      content: "palavra ".repeat(50),
    }));
    const huge: RoadmapV2 = {
      slug: "huge",
      area: "huge",
      title: "Huge",
      level: "Avancado",
      description: "",
      sections: [{ id: "s1", title: "Gigante", children: many }],
    };
    const { totalHours, sections } = computeHours(huge);
    expect(totalHours).toBe(120);
    expect(sections.reduce((acc, s) => acc + s.hours, 0)).toBe(120);
  });
});
