import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  indiceDeMelhoriaExiste,
  indicesDeMelhoriaValidos,
  quantidadeDeMelhorias,
} from "./linkedinImprovementProgress";

const ATUAL = {
  qualitativeVersion: 3,
  qualitative: {
    melhorias: Array.from({ length: 4 }, (_, index) => ({
      prioridade: "alta",
      titulo: `Melhoria ${index}`,
      comoFazer: "Faça desta forma.",
    })),
  },
};

const LEGADO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "__fixtures__",
      "linkedin",
      "result-legado-v1.json",
    ),
    "utf8",
  ),
);

describe("índice real de melhoria persistida", () => {
  it("aceita somente índices existentes na análise atual", () => {
    expect(quantidadeDeMelhorias(ATUAL)).toBe(4);
    expect(indiceDeMelhoriaExiste(ATUAL, 0)).toBe(true);
    expect(indiceDeMelhoriaExiste(ATUAL, 3)).toBe(true);
    expect(indiceDeMelhoriaExiste(ATUAL, 4)).toBe(false);
    expect(indiceDeMelhoriaExiste(ATUAL, 20)).toBe(false);
  });

  it("preserva análises legadas e recusa estrutura corrompida", () => {
    expect(quantidadeDeMelhorias(LEGADO)).toBeGreaterThan(0);
    expect(indiceDeMelhoriaExiste(LEGADO, 0)).toBe(true);
    expect(
      quantidadeDeMelhorias({ qualitative: { melhorias: "quatro" } }),
    ).toBe(0);
    expect(indiceDeMelhoriaExiste(null, 0)).toBe(false);
  });

  it("GET ignora negativo, decimal, NaN, duplicado e acima do total", () => {
    expect(
      indicesDeMelhoriaValidos([-1, 0, 1, 1, 1.5, Number.NaN, 3, 4], 4),
    ).toEqual([0, 1, 3]);
  });
});
