import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { AI_ROADMAP_SLUG_RE } from "../../../../shared/aiRoadmap";
import { requiredLeaves } from "../../../../shared/roadmapV2/progress";
import type { RoadmapV2 } from "../../../../shared/roadmapV2/types";

/**
 * A fixture existe para as Fases 3 e 4 nao dependerem de dado de producao. Este
 * teste e o que impede ela de apodrecer virando "um JSON qualquer": afirma a
 * FORMA medida em producao (ver o README ao lado), nao so que o arquivo carrega.
 */

const roadmap = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "roadmap-ready-ia.json",
    ),
    "utf8",
  ),
) as RoadmapV2;

describe("fixture de roadmap gerado por IA", () => {
  it("tem slug no formato que o servidor gera", () => {
    expect(AI_ROADMAP_SLUG_RE.test(roadmap.slug)).toBe(true);
  });

  it("tem entre 7 e 10 secoes, como o schema do esqueleto exige", () => {
    expect(roadmap.sections.length).toBeGreaterThanOrEqual(7);
    expect(roadmap.sections.length).toBeLessThanOrEqual(10);
  });

  it("afirma os totais do README (folhas e obrigatorias)", () => {
    const folhas = roadmap.sections.flatMap((s) => s.children);
    const obrigatorias = roadmap.sections.flatMap((s) => requiredLeaves(s));
    expect(folhas).toHaveLength(28);
    expect(obrigatorias).toHaveLength(27);
  });

  it("todo passo tem content e estimatedTime, como os 869 medidos", () => {
    const passos = roadmap.sections.flatMap((s) => s.children);
    expect(passos.every((p) => (p.content ?? "").trim().length > 0)).toBe(true);
    expect(passos.every((p) => (p.estimatedTime ?? "").trim().length > 0)).toBe(
      true,
    );
  });

  it("nao tem sub-passos, resources nem byLanguage (a v1 nao gera)", () => {
    const passos = roadmap.sections.flatMap((s) => s.children);
    expect(passos.some((p) => p.children)).toBe(false);
    expect(passos.some((p) => p.resources)).toBe(false);
    expect(passos.some((p) => p.byLanguage)).toBe(false);
  });

  it("o projeto do catalogo vive SO no ultimo passo da ultima secao", () => {
    const comProjeto = roadmap.sections.flatMap((s, i) =>
      s.children
        .map((c, j) => ({ c, i, j, total: s.children.length }))
        .filter((x) => x.c.project),
    );
    expect(comProjeto).toHaveLength(1);
    expect(comProjeto[0].i).toBe(roadmap.sections.length - 1);
    expect(comProjeto[0].j).toBe(comProjeto[0].total - 1);
  });
});
