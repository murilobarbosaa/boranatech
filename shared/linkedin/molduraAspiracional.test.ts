import { describe, expect, it } from "vitest";

import { enquadramentoDeTermo, fraseComTermo } from "./molduraAspiracional";

/**
 * O risco desta mudança de régua é desligar o detector em vez de corrigi-lo.
 * O bloco "TESTE POSITIVO" existe para provar que não foi isso: afirmação
 * fabricada sem moldura continua sendo pega.
 */

describe("TESTE POSITIVO: afirmacao sem moldura continua sendo violacao", () => {
  it("domino Kubernetes e Terraform e afirmacao, nao moldura", () => {
    const sobre =
      "Sou desenvolvedora full-stack com foco em produto. Domino Kubernetes e Terraform em ambientes de produção.";
    expect(enquadramentoDeTermo(sobre, "Kubernetes")).toBe("afirmacao");
    expect(enquadramentoDeTermo(sobre, "Terraform")).toBe("afirmacao");
  });

  it("outras formas de afirmar experiencia", () => {
    const casos = [
      "Tenho cinco anos de experiência com Kubernetes.",
      "Trabalho com Terraform no dia a dia.",
      "Especialista em Kubernetes e observabilidade.",
      "Construí a infraestrutura inteira em Terraform.",
      "Kubernetes é minha principal ferramenta.",
    ];
    for (const frase of casos) {
      const termo = frase.includes("Kubernetes") ? "Kubernetes" : "Terraform";
      expect(enquadramentoDeTermo(frase, termo)).toBe("afirmacao");
    }
  });

  it("marcador DEPOIS do termo nao absolve o termo", () => {
    // "Domino Kubernetes e estou estudando Terraform": os dois na mesma frase,
    // e so o que vem depois do marcador esta dentro da moldura.
    const frase = "Domino Kubernetes e estou estudando Terraform.";
    expect(enquadramentoDeTermo(frase, "Kubernetes")).toBe("afirmacao");
    expect(enquadramentoDeTermo(frase, "Terraform")).toBe("moldura");
  });

  it("moldura numa frase nao absolve outra frase", () => {
    const sobre =
      "Estou estudando Python para análise de dados. Domino Kubernetes em produção.";
    expect(enquadramentoDeTermo(sobre, "Python")).toBe("moldura");
    expect(enquadramentoDeTermo(sobre, "Kubernetes")).toBe("afirmacao");
  });
});

describe("moldura de aprendizado e reconhecida", () => {
  it("as 5 ocorrencias reais das medicoes 1A-ter e 1B", () => {
    // Exatamente o texto que as duas medicoes produziram, e que a regua antiga
    // contava como mentira. Ver docs/tecnologia-aspiracional-sobre.md.
    expect(
      enquadramentoDeTermo(
        "Estou estudando Python e outras ferramentas de análise de dados para aprimorar minhas competências.",
        "Python",
      ),
    ).toBe("moldura");
    const doisTermos =
      "Tenho interesse em aprender sobre frameworks como React e TypeScript.";
    expect(enquadramentoDeTermo(doisTermos, "React")).toBe("moldura");
    expect(enquadramentoDeTermo(doisTermos, "TypeScript")).toBe("moldura");
    const outros =
      "Quero aplicar novas tecnologias e estou estudando Python e R para dados.";
    expect(enquadramentoDeTermo(outros, "Python")).toBe("moldura");
    expect(enquadramentoDeTermo(outros, "R")).toBe("moldura");
  });

  it("moldura em ingles", () => {
    expect(
      enquadramentoDeTermo("I am currently learning Kubernetes.", "Kubernetes"),
    ).toBe("moldura");
    expect(
      enquadramentoDeTermo("Interested in learning Terraform.", "Terraform"),
    ).toBe("moldura");
  });

  it("acento no marcador nao muda a classificacao", () => {
    expect(
      enquadramentoDeTermo("Estou começando a estudar Python.", "Python"),
    ).toBe("moldura");
  });
});

describe("termo ausente", () => {
  it("tecnologia que nao aparece no texto", () => {
    expect(enquadramentoDeTermo("Sou desenvolvedora.", "Kubernetes")).toBe(
      "ausente",
    );
  });

  it("nao casa dentro de outra palavra", () => {
    expect(fraseComTermo("Trabalho com Golang.", "Go")).toBe("");
    expect(enquadramentoDeTermo("Trabalho com Golang.", "Go")).toBe("ausente");
  });
});

describe("limites documentados: erram para MAIS violacao, nunca para menos", () => {
  it("moldura invertida conta como afirmacao (falso positivo assumido)", () => {
    expect(
      enquadramentoDeTermo("React, que estou estudando, me interessa.", "React"),
    ).toBe("afirmacao");
  });

  it("marcador na frase anterior conta como afirmacao (falso positivo assumido)", () => {
    expect(
      enquadramentoDeTermo(
        "Estou em fase de aprendizado. Kubernetes é o próximo.",
        "Kubernetes",
      ),
    ).toBe("afirmacao");
  });

  it("negacao lê como moldura (falso NEGATIVO conhecido, unico da lista)", () => {
    expect(
      enquadramentoDeTermo("Não estou estudando Python.", "Python"),
    ).toBe("moldura");
  });
});
