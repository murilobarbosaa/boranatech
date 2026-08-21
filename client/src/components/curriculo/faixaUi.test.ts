import { describe, expect, it } from "vitest";

import {
  RESUME_FAIXA_UI,
  resumeFaixaLabelOf,
  resumeFaixaUiOf,
} from "./faixaUi";
import {
  RESUME_FAIXAS,
  RESUME_FAIXA_LABELS,
} from "@shared/resumeAnalysis/schema";

/**
 * A faixa chega do servidor e do `result` persistido. O `ResumeScoreCard` lia
 * o mapa direto (`const ui = FAIXA_UI[faixa]` + `ui.chipBg`), que e a forma que
 * derruba a arvore inteira.
 */
describe("resumeFaixaUiOf / resumeFaixaLabelOf", () => {
  it("resolve todas as faixas do catalogo", () => {
    for (const faixa of RESUME_FAIXAS) {
      expect(resumeFaixaUiOf(faixa)).toBe(RESUME_FAIXA_UI[faixa]);
      expect(resumeFaixaLabelOf(faixa)).toBe(RESUME_FAIXA_LABELS[faixa]);
    }
  });

  it("devolve fallback neutro para faixa desconhecida, sem lancar", () => {
    expect(resumeFaixaUiOf("nao-existe").chipBg).toBe("bg-slate-300");
    expect(resumeFaixaLabelOf("nao-existe")).toBe("");
  });
});

describe("por que o resolver existe", () => {
  it("o mapa cru DEVOLVE undefined: trava a premissa", () => {
    const mapa = RESUME_FAIXA_UI as Record<string, unknown>;
    expect(mapa["nao-existe"]).toBeUndefined();
  });

  it("acesso direto seguido de .chipBg LANCA (a forma do incidente)", () => {
    const mapa = RESUME_FAIXA_UI as Record<string, { chipBg: string }>;
    expect(() => mapa["nao-existe"].chipBg).toThrow();
    expect(() => resumeFaixaUiOf("nao-existe").chipBg).not.toThrow();
  });
});
