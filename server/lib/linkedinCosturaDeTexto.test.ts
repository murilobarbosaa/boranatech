import { describe, expect, it } from "vitest";

import {
  normalizarPontuacao,
  removerTermoComCostura,
} from "./linkedinCosturaDeTexto";

/**
 * O lastro acertava o veredito e entregava o texto sujo.
 *
 * Os tres primeiros casos deste arquivo sao literais da investigacao da Fase 2,
 * com a saida medida na epoca ao lado do alvo. Nao sao exemplos inventados: e o
 * que o usuario via na tela quando o modelo citava uma tecnologia sem lastro.
 */

describe("os tres casos medidos, byte a byte", () => {
  it("caso 1: conectivo orfao no bullet", () => {
    // Antes: "Desenvolvi telas em React com no pipeline de deploy."
    expect(
      removerTermoComCostura(
        "Desenvolvi telas em React com Kubernetes no pipeline de deploy.",
        "Kubernetes",
      ),
    ).toBe("Desenvolvi telas em React no pipeline de deploy.");
  });

  it("caso 2: separador colado em pontuacao na headline", () => {
    // Antes: "Front-end |, React | foco em produto"
    expect(
      removerTermoComCostura(
        "Front-end | Kubernetes, React | foco em produto",
        "Kubernetes",
      ),
    ).toBe("Front-end | React | foco em produto");
  });

  it("caso 3: separador engolido sem espaco", () => {
    // Antes: "Dev| foco"
    expect(removerTermoComCostura("Dev | Angular | foco", "Angular")).toBe(
      "Dev | foco",
    );
  });
});

describe("lista e conectivo", () => {
  it("a virgula DEPOIS vence o pipe da esquerda, para nao juntar secoes", () => {
    // Comer o pipe aqui daria "Front-end, React | foco", que funde a seccao do
    // cargo com a das tecnologias e muda o sentido da headline.
    expect(removerTermoComCostura("A | B, Kubernetes | C", "Kubernetes")).toBe(
      "A | B | C",
    );
  });

  it("termo no COMECO da lista leva a virgula seguinte", () => {
    expect(
      removerTermoComCostura("Kubernetes, React | foco", "Kubernetes"),
    ).toBe("React | foco");
  });

  it("termo no FIM da frase leva o conectivo orfao", () => {
    expect(
      removerTermoComCostura("Entreguei com Kubernetes.", "Kubernetes"),
    ).toBe("Entreguei.");
  });

  it("o 'e' de ligacao some quando o termo e o objeto dele", () => {
    expect(
      removerTermoComCostura("React e Kubernetes, Docker", "Kubernetes"),
    ).toBe("React, Docker");
  });

  it("mas o 'e' que liga DOIS que ficam continua no lugar", () => {
    expect(
      removerTermoComCostura(
        "React, Kubernetes e Docker no time",
        "Kubernetes",
      ),
    ).toBe("React e Docker no time");
  });

  it("todas as ocorrencias saem: o veredito do lastro nao muda", () => {
    const saida = removerTermoComCostura(
      "Kubernetes no inicio, com Kubernetes no meio e Kubernetes no fim",
      "Kubernetes",
    );
    expect(saida).not.toContain("Kubernetes");
  });

  it("termo ausente devolve o texto igual", () => {
    const texto = "Front-end | React | foco em produto";
    expect(removerTermoComCostura(texto, "Kubernetes")).toBe(texto);
  });
});

describe("normalizarPontuacao, propriedades", () => {
  it("texto limpo e identidade", () => {
    const limpo = "Front-end | React | foco em produto.";
    expect(normalizarPontuacao(limpo)).toBe(limpo);
  });

  it("dois separadores seguidos viram um, e o pipe manda na virgula", () => {
    expect(normalizarPontuacao("A,, B")).toBe("A, B");
    expect(normalizarPontuacao("A | | B")).toBe("A | B");
    expect(normalizarPontuacao("A |, B")).toBe("A | B");
    expect(normalizarPontuacao("A , | B")).toBe("A | B");
  });

  it("separador no comeco e no fim some", () => {
    expect(normalizarPontuacao("| A | B")).toBe("A | B");
    expect(normalizarPontuacao("A | B |")).toBe("A | B");
    expect(normalizarPontuacao(", A")).toBe("A");
  });

  it("espaco antes de pontuacao some", () => {
    expect(normalizarPontuacao("frase .")).toBe("frase.");
    expect(normalizarPontuacao("um , dois")).toBe("um, dois");
  });

  it("espaco duplo vira simples", () => {
    expect(normalizarPontuacao("um  dois   tres")).toBe("um dois tres");
  });

  it("CRLF e preservado: a quebra de linha nao e espaco a colapsar", () => {
    const texto = "linha um\r\nlinha dois\nlinha tres";
    expect(normalizarPontuacao(texto)).toBe(texto);
  });

  it("nao inventa nada em texto vazio", () => {
    expect(normalizarPontuacao("")).toBe("");
  });
});
