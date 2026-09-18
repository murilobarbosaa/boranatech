import { describe, expect, it } from "vitest";
import type { RoadmapMeta } from "./meta";
import { roadmapsMeta } from "./meta.generated";
import { trailGroups } from "./vitrineGroups";

function meta(parcial: Partial<RoadmapMeta> & { slug: string }): RoadmapMeta {
  return {
    area: "linguagem",
    kind: "linguagem",
    title: parcial.slug,
    level: "Iniciante",
    description: `descricao de ${parcial.slug}`,
    sectionCount: 5,
    stepCount: 20,
    hasProject: false,
    hasQuiz: false,
    ...parcial,
  };
}

describe("trailGroups: grupos de trilha da vitrine derivados do meta", () => {
  it("com o registro atual: linguagens (JavaScript, Python, HTML, CSS) e depois ferramentas (Git)", () => {
    const grupos = trailGroups(roadmapsMeta);
    expect(grupos.map((g) => g.key)).toEqual(["linguagem", "ferramenta"]);
    // Lote 08: HTML entrou depois de Python. Lote 09: CSS entrou depois de
    // HTML, que e a ordem em que se aprende as duas.
    expect(grupos[0].entries.map((e) => e.slug)).toEqual([
      "javascript",
      "python",
      "html",
      "css",
      "typescript",
    ]);
    expect(grupos[1].entries.map((e) => e.slug)).toEqual(["git"]);
  });

  it("cada entrada traz slug, titulo, resumo, contagens do meta e prova", () => {
    const git = trailGroups(roadmapsMeta)[1].entries[0];
    expect(git).toEqual({
      slug: "git",
      title: "Git do Zero",
      summary: "Versionamento do init ao pull request, direto no terminal.",
      sectionCount: 10,
      stepCount: 44,
      hasQuiz: true,
    });
  });

  it("sem summary, o resumo do card cai na description", () => {
    const [grupo] = trailGroups([meta({ slug: "rust" })]);
    expect(grupo.entries[0].summary).toBe("descricao de rust");
  });

  it("kind sem trilha nao rende grupo vazio", () => {
    const semFerramenta = roadmapsMeta.filter((r) => r.kind !== "ferramenta");
    expect(trailGroups(semFerramenta).map((g) => g.key)).toEqual(["linguagem"]);
    expect(trailGroups([])).toEqual([]);
  });

  it("framework entra no grupo de linguagens, na ordem do registro", () => {
    const grupos = trailGroups([
      meta({ slug: "react", kind: "framework", area: "framework" }),
      meta({ slug: "rust" }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].entries.map((e) => e.slug)).toEqual(["react", "rust"]);
  });

  it("trilha de area e de carreira ficam fora dos grupos de trilha", () => {
    const slugs = trailGroups(roadmapsMeta).flatMap((g) =>
      g.entries.map((e) => e.slug),
    );
    for (const r of roadmapsMeta) {
      if (!r.kind || r.kind === "carreira") {
        expect(slugs).not.toContain(r.slug);
      }
    }
  });
});
