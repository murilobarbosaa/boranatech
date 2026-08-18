import { describe, expect, it } from "vitest";

import { readLinkedinScoreState } from "./readScore";

describe("readLinkedinScoreState", () => {
  it.each([
    [10, "inicio"],
    [55, "em-construcao"],
    [80, "forte"],
    [95, "magnetico"],
  ])("aceita o par coerente %s + %s", (score, faixa) => {
    expect(readLinkedinScoreState({ score, faixa })).toMatchObject({
      valid: true,
      score,
      faixa,
    });
  });

  it.each([
    [10, "magnetico"],
    [-1, "inicio"],
    [101, "magnetico"],
    [Number.NaN, "inicio"],
    [55, "desconhecida"],
    [55.5, "em-construcao"],
  ])("rejeita score/faixa inválidos: %s + %s", (score, faixa) => {
    expect(readLinkedinScoreState({ score, faixa })).toMatchObject({
      valid: false,
      score: null,
      faixa: null,
    });
  });

  it("preserva versão ausente como legado/ausente", () => {
    const state = readLinkedinScoreState({ score: 10, faixa: "inicio" });
    expect(state.valid).toBe(true);
    expect(state.deterministicVersion).toBeNull();
  });

  it("lê versão e pending sem coerção", () => {
    expect(
      readLinkedinScoreState({
        score: 80,
        faixa: "forte",
        deterministicVersion: 8,
        notaIncompleta: true,
      }),
    ).toMatchObject({
      deterministicVersion: 8,
      notaIncompleta: true,
    });
    expect(
      readLinkedinScoreState({
        score: 80,
        faixa: "forte",
        deterministicVersion: "8",
        notaIncompleta: "true",
      }),
    ).toMatchObject({
      deterministicVersion: null,
      notaIncompleta: false,
    });
  });
});
