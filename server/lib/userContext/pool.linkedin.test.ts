import { describe, expect, it } from "vitest";

import { linkedinAnalysisContextFromRow } from "./pool";

const BASE = {
  area: "frontend",
  level: "pleno",
  created_at: "2026-08-15T12:00:00Z",
  notaIncompleta: false,
};

describe("reader LinkedIn do pool de contexto", () => {
  it("preserva par coerente e versão explícita", () => {
    expect(
      linkedinAnalysisContextFromRow({
        ...BASE,
        score: 80,
        faixa: "forte",
        deterministicVersion: 8,
      }),
    ).toMatchObject({
      score: 80,
      faixa: "forte",
      deterministicVersion: 8,
    });
  });

  it("degrada par incoerente sem inventar nota/faixa", () => {
    expect(
      linkedinAnalysisContextFromRow({
        ...BASE,
        score: 10,
        faixa: "magnetico",
        deterministicVersion: 8,
      }),
    ).toMatchObject({ score: null, faixa: null, deterministicVersion: 8 });
  });

  it("mantém versão legada ausente", () => {
    expect(
      linkedinAnalysisContextFromRow({
        ...BASE,
        score: 55,
        faixa: "em-construcao",
      }).deterministicVersion,
    ).toBeNull();
  });
});
