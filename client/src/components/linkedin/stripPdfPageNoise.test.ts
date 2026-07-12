import { describe, expect, it } from "vitest";

import { stripPdfPageNoise } from "./stripPdfPageNoise";

describe("stripPdfPageNoise", () => {
  it("remove o artefato em ingles no meio do texto", () => {
    expect(
      stripPdfPageNoise(
        "Desenvolvo APIs em Node.js. Page 1 of 3 Atualmente estudo AWS.",
      ),
    ).toBe("Desenvolvo APIs em Node.js. Atualmente estudo AWS.");
  });

  it("remove o artefato em portugues, com e sem acento", () => {
    expect(stripPdfPageNoise("Página 2 de 2 Sou dev front-end.")).toBe(
      "Sou dev front-end.",
    );
    expect(stripPdfPageNoise("Sou dev front-end. pagina 1 de 4")).toBe(
      "Sou dev front-end.",
    );
  });

  it("nao toca frases legitimas com page ou numeros", () => {
    const texto =
      "Criei uma landing page com React e cobri 2 de 3 fluxos com testes.";
    expect(stripPdfPageNoise(texto)).toBe(texto);
  });
});
