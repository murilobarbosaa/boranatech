import { describe, expect, it } from "vitest";

import {
  BAND_UI,
  BAND_WASH,
  BAND_WASH_SOFT,
  bandUiOf,
  bandWashOf,
  bandWashSoftOf,
} from "./bandUi";
import { SCORE_BANDS } from "@shared/github/schema";

/**
 * A band chega do servidor e do `result` jsonb persistido (`GithubHistory` le
 * `analysis.faixa` de linha gravada). Acesso direto ao mapa derruba a pagina
 * quando um valor novo aparece antes do deploy do front.
 */
describe("bandUiOf / bandWashOf / bandWashSoftOf", () => {
  it("resolve todas as bands do catalogo para o valor do mapa", () => {
    for (const band of SCORE_BANDS) {
      expect(bandUiOf(band)).toBe(BAND_UI[band]);
      expect(bandWashOf(band)).toBe(BAND_WASH[band]);
      expect(bandWashSoftOf(band)).toBe(BAND_WASH_SOFT[band]);
    }
  });

  it("devolve fallback neutro para band desconhecida, sem lancar", () => {
    const ui = bandUiOf("band-que-ainda-nao-existe");
    expect(ui.cardBg).toBe("bg-slate-100");
    expect(ui.chipBg).toBe("bg-slate-300");
    expect(ui.label).toBe("");
    expect(bandWashOf("band-que-ainda-nao-existe")).toBeTruthy();
    expect(bandWashSoftOf("band-que-ainda-nao-existe")).toBeTruthy();
  });
});

describe("por que o resolver existe", () => {
  it("o mapa cru DEVOLVE undefined: trava a premissa", () => {
    // Se `BAND_UI` um dia ganhar default (Proxy, Map com fallback), este teste
    // quebra e avisa que o resolver pode ter deixado de ser necessario. Sem
    // ele, "o resolver protege" e afirmacao sobre comportamento nao verificado.
    const mapa = BAND_UI as Record<string, unknown>;
    expect(mapa["band-que-ainda-nao-existe"]).toBeUndefined();
  });

  it("acesso direto seguido de .label LANCA (a forma do incidente)", () => {
    // `GithubHistory` fazia exatamente `BAND_UI[analysis.faixa].label`, com
    // `analysis.faixa` vindo de linha persistida. Reproduz o dano para o
    // comentario nao ser a unica coisa que o descreve.
    const mapa = BAND_UI as Record<string, { label: string }>;
    expect(() => mapa["band-que-ainda-nao-existe"].label).toThrow();
    expect(() => bandUiOf("band-que-ainda-nao-existe").label).not.toThrow();
  });
});
