import { describe, expect, it } from "vitest";

import { normalizeProfileLines } from "./normalizeProfileText";

const n = (texto: string) => normalizeProfileLines(texto);

describe("normalizeProfileLines: junta o que o PDF quebrou", () => {
  it("headline partida por separador orfao volta inteira", () => {
    expect(
      n("Software Developer | Full-Stack Engineer | React |\nNode"),
    ).toEqual(["Software Developer | Full-Stack Engineer | React | Node"]);
  });

  it("parentese solto continua a linha anterior", () => {
    expect(n("Retrieval-Augmented Generation\n(RAG)")).toEqual([
      "Retrieval-Augmented Generation (RAG)",
    ]);
  });

  it("hifenacao de quebra junta sem espaco no meio", () => {
    expect(n("answers natural-\nlanguage HR questions")).toEqual([
      "answers natural-language HR questions",
    ]);
  });

  it("frase quebrada em minuscula continua", () => {
    expect(n("Sou desenvolvedora full-stack com\nfoco em produto")).toEqual([
      "Sou desenvolvedora full-stack com foco em produto",
    ]);
  });

  it("separador orfao sem nada para juntar e limpo", () => {
    expect(n("Full Stack Developer | React |")).toEqual([
      "Full Stack Developer | React",
    ]);
  });
});

describe("normalizeProfileLines: NAO junta (falsos positivos)", () => {
  // Este bloco e o que impede a normalizacao de estragar o parse. Cada caso
  // aqui e algo que, se fosse unido, produziria dado inventado ou destruiria
  // uma fronteira estrutural.

  it("duas competencias curtas e legitimas em linhas separadas", () => {
    // Juntar criaria a competencia inexistente "React Vue".
    expect(n("React\nVue\nAngular")).toEqual(["React", "Vue", "Angular"]);
  });

  it("titulo de experiencia seguido da linha de data", () => {
    // Juntar colaria o cargo na data e parseExperiencias perderia a
    // delimitacao entre experiencias, que e pior que a quebra original.
    expect(n("Desenvolvedor Back-end\njaneiro de 2022 - Present")).toEqual([
      "Desenvolvedor Back-end",
      "janeiro de 2022 - Present",
    ]);
    expect(n("Backend Engineer\nJanuary 2021 - Present   (4 years)")).toEqual([
      "Backend Engineer",
      "January 2021 - Present   (4 years)",
    ]);
  });

  it("dois bullets curtos consecutivos", () => {
    expect(n("• Criei testes\n• Subi o deploy")).toEqual([
      "• Criei testes",
      "• Subi o deploy",
    ]);
    expect(n("- Criei testes\n- Subi o deploy")).toEqual([
      "- Criei testes",
      "- Subi o deploy",
    ]);
  });

  it("cabecalho de secao nunca e absorvido nem absorve", () => {
    // "Languages" fecha a secao de competencias: uni-lo apagaria a fronteira e
    // o nome da pessoa voltaria a ser lido como competencia.
    expect(n("Retrieval-Augmented Generation\nLanguages\nPortuguese")).toEqual([
      "Retrieval-Augmented Generation",
      "Languages",
      "Portuguese",
    ]);
    expect(n("Experience\nEmpresa X")).toEqual(["Experience", "Empresa X"]);
  });

  it("linha anterior que fechou pontuacao nao continua", () => {
    expect(n("Entreguei o projeto.\nnovo paragrafo aqui")).toEqual([
      "Entreguei o projeto.",
      "novo paragrafo aqui",
    ]);
  });

  it("linha longa e conteudo proprio, nao continuacao", () => {
    const longa = "esta linha comeca em minuscula mas tem mais de quarenta caracteres";
    expect(n(`Alguma coisa\n${longa}`)).toEqual(["Alguma coisa", longa]);
  });
});

describe("normalizeProfileLines: rodape de paginacao", () => {
  it("remove Page N of M e Pagina N de M, com espacamento multiplo", () => {
    expect(
      n("Cargo\nPage   1   of   5\njaneiro de 2022 - Present"),
    ).toEqual(["Cargo", "janeiro de 2022 - Present"]);
    expect(n("Cargo\nPágina 2 de 3\nTexto")).toEqual(["Cargo", "Texto"]);
    expect(n("Cargo\nPagina 10 de 20\nTexto")).toEqual(["Cargo", "Texto"]);
  });

  it("nao remove frase legitima que contem a palavra page", () => {
    expect(n("Built a landing page of the product")).toEqual([
      "Built a landing page of the product",
    ]);
  });
});
