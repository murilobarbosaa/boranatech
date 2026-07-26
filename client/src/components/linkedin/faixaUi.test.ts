import { describe, expect, it } from "vitest";

import {
  FAIXA_UI,
  FAIXA_WASH,
  faixaUiOf,
  faixaWashOf,
} from "./faixaUi";
import { LINKEDIN_FAIXAS } from "@shared/linkedin/schema";

// A faixa chega do servidor e do result jsonb persistido. Acesso direto ao mapa
// derruba a pagina inteira quando um valor novo aparece antes do deploy do
// front (regra "Lookups por valor do servidor" do CLAUDE.md).
describe("faixaUiOf / faixaWashOf", () => {
  it("resolve todas as faixas do catalogo para o valor do mapa", () => {
    for (const faixa of LINKEDIN_FAIXAS) {
      expect(faixaUiOf(faixa)).toBe(FAIXA_UI[faixa]);
      expect(faixaWashOf(faixa)).toBe(FAIXA_WASH[faixa]);
    }
  });

  it("devolve fallback neutro para faixa desconhecida, sem lancar", () => {
    const ui = faixaUiOf("faixa-que-ainda-nao-existe");
    expect(ui.cardBg).toBe("bg-slate-100");
    expect(ui.chipBg).toBe("bg-slate-300");
    expect(faixaWashOf("faixa-que-ainda-nao-existe")).toBe("from-slate-200/40");
  });

  it("nunca devolve undefined, nem para string vazia", () => {
    expect(faixaUiOf("").cardBg).toBeTruthy();
    expect(faixaWashOf("")).toBeTruthy();
  });
});
