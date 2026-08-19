import { describe, expect, it } from "vitest";

import { detectarIdioma } from "./linkedinIdioma";

/**
 * O detector, isolado.
 *
 * O caso que manda no desenho e o terceiro: uma frase PORTUGUESA carregada de
 * termos tecnicos em ingles precisa classificar `pt`, porque e assim que o
 * publico da plataforma escreve. Se ela caisse como `en`, o gate reprovaria
 * texto certo, gastaria uma chamada paga e trocaria o texto do usuario por um
 * generico, tres vezes pior que o problema que o gate resolve.
 */

describe("detectarIdioma", () => {
  it("portugues corrido", () => {
    expect(
      detectarIdioma(
        "Atuo como desenvolvedora front-end e cuido da acessibilidade das entregas do time.",
      ),
    ).toBe("pt");
  });

  it("ingles corrido", () => {
    expect(
      detectarIdioma(
        "I work as a front-end developer and I care about the accessibility of the team deliveries.",
      ),
    ).toBe("en");
  });

  it("PORTUGUES com termos tecnicos em ingles continua pt", () => {
    expect(
      detectarIdioma(
        "Desenvolvedora front-end com foco em React, Node.js e TypeScript",
      ),
    ).toBe("pt");
  });

  it("texto curto e indeterminado, e nao um chute", () => {
    expect(detectarIdioma("Front-end | React | produto")).toBe("indeterminado");
    expect(detectarIdioma("Reduzi o tempo de carga.")).toBe("indeterminado");
  });

  it("texto misto equilibrado e indeterminado", () => {
    // A convencao do mercado "ambos" pede exatamente isto: portugues com um
    // fecho em ingles. Reprovar aqui seria reprovar o acerto.
    expect(
      detectarIdioma(
        "Sou desenvolvedora com foco em produto e em acessibilidade. I am currently open to opportunities and I would like to talk about it.",
      ),
    ).toBe("indeterminado");
  });

  it("vazio e indeterminado", () => {
    expect(detectarIdioma("")).toBe("indeterminado");
    expect(detectarIdioma("   ")).toBe("indeterminado");
  });

  it("acento conta, mas UMA vez: nao decide paragrafo sozinho", () => {
    // Uma palavra acentuada dentro de um texto ingles nao inverte o veredito.
    expect(
      detectarIdioma(
        "I work with the team and I am responsible for the acessibilidade of the product.",
      ),
    ).toBe("en");
  });
});
