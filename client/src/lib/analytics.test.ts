import { describe, expect, it, vi } from "vitest";

// analytics.ts importa posthog-js no topo; mock evita qualquer efeito colateral
// de import ao testar a funcao pura de classificacao.
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import { classifyContentSource } from "./analytics";

describe("classifyContentSource", () => {
  it("mapeia /areas/:slug para area_detail", () => {
    expect(classifyContentSource("/areas/dados")).toBe("area_detail");
  });

  it("mapeia /areas/:parent/:subarea para subarea_detail", () => {
    expect(classifyContentSource("/areas/dados/engenheiro-dados")).toBe(
      "subarea_detail",
    );
  });

  it("mapeia a listagem /areas para other", () => {
    expect(classifyContentSource("/areas")).toBe("other");
  });

  it("mapeia outro path conhecido para other", () => {
    expect(classifyContentSource("/cursos")).toBe("other");
  });

  it("trata ausencia de path (null/undefined/vazio) como unknown", () => {
    expect(classifyContentSource(null)).toBe("unknown");
    expect(classifyContentSource(undefined)).toBe("unknown");
    expect(classifyContentSource("")).toBe("unknown");
  });

  it("ignora query string", () => {
    expect(classifyContentSource("/areas/dados?tab=cargos")).toBe(
      "area_detail",
    );
    expect(
      classifyContentSource("/areas/dados/engenheiro-dados?ref=home"),
    ).toBe("subarea_detail");
  });

  it("ignora hash", () => {
    expect(classifyContentSource("/areas/dados#salario")).toBe("area_detail");
  });

  it("aceita URL absoluta", () => {
    expect(
      classifyContentSource(
        "https://boranatech.com.br/areas/dados/engenheiro-dados",
      ),
    ).toBe("subarea_detail");
    expect(
      classifyContentSource("https://boranatech.com.br/areas/dados"),
    ).toBe("area_detail");
  });

  it("normaliza barra final", () => {
    expect(classifyContentSource("/areas/dados/")).toBe("area_detail");
  });
});
