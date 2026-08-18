import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { readLinkedinAnalysisResponse } from "./readAnalysis";

const LEGADO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "server",
      "lib",
      "__fixtures__",
      "linkedin",
      "result-legado-v1.json",
    ),
    "utf8",
  ),
);

const MINIMO = {
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  deterministic: { score: 42, faixa: "em-construcao", checks: [] },
  qualitative: {},
};

describe("readLinkedinAnalysisResponse", () => {
  it("lê uma análise histórica real sem exigir campos novos", () => {
    const result = readLinkedinAnalysisResponse(LEGADO);
    expect(result?.deterministic.score).toBe(LEGADO.deterministic.score);
    expect(result?.deterministic.keywordsCampos).toEqual([]);
  });

  it("descarta envelope ou núcleo determinístico incompatível", () => {
    expect(readLinkedinAnalysisResponse(null)).toBeNull();
    expect(
      readLinkedinAnalysisResponse({ ...MINIMO, area: "inexistente" }),
    ).toBeNull();
    expect(
      readLinkedinAnalysisResponse({
        ...MINIMO,
        deterministic: { score: 42, faixa: "em-construcao" },
      }),
    ).toBeNull();
    expect(
      readLinkedinAnalysisResponse({
        ...MINIMO,
        deterministic: { score: 10, faixa: "magnetico", checks: [] },
      }),
    ).toBeNull();
  });

  it("degrada um campo opcional corrompido sem perder o resultado inteiro", () => {
    const result = readLinkedinAnalysisResponse({
      ...MINIMO,
      deterministic: {
        ...MINIMO.deterministic,
        keywordsEncontradas: 7,
      },
    });
    expect(result).not.toBeNull();
    expect(result?.deterministic.keywordsEncontradas).toEqual([]);
  });

  it("continua lendo v7 e lê v8 sem migration histórica", () => {
    for (const deterministicVersion of [7, 8]) {
      const result = readLinkedinAnalysisResponse({
        ...MINIMO,
        deterministicVersion,
        qualitativeVersion: 3,
      });
      expect(result?.deterministicVersion).toBe(deterministicVersion);
      expect(result?.deterministic.score).toBe(42);
    }
  });

  it("não promove resultado legado sem versão para a versão atual", () => {
    const result = readLinkedinAnalysisResponse(MINIMO);
    expect(result?.deterministicVersion).toBeUndefined();
  });
});
