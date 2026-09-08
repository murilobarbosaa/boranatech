import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import QuizCodeBlock from "./QuizCodeBlock";

// Literais escritos a mao. A lacuna e selecionada por data-lacuna, nunca por
// classe, para o teste nao depender do visual.
function linhas(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("[data-linha]"));
}

describe("QuizCodeBlock", () => {
  afterEach(() => {
    cleanup();
  });

  it("saida com 3 linhas: numeros, rotulo JS, texto de cada linha, sem lacuna", () => {
    const { container } = render(
      <QuizCodeBlock
        tipo="saida"
        codigo={{
          linguagem: "js",
          trecho: "const a = 1;\nconst b = 2;\nconsole.log(a + b);",
        }}
      />,
    );
    expect(screen.getByText("JS")).toBeTruthy();
    const gutters = Array.from(
      container.querySelectorAll("[data-numero-linha]"),
    ).map((el) => el.textContent);
    expect(gutters).toEqual(["1", "2", "3"]);
    const textos = linhas(container).map(
      (el) => el.querySelector("[data-conteudo]")?.textContent,
    );
    expect(textos).toEqual([
      "const a = 1;",
      "const b = 2;",
      "console.log(a + b);",
    ]);
    expect(container.querySelector('[data-lacuna="true"]')).toBeNull();
  });

  it("completar: exatamente uma lacuna, com o resto da linha fora dela", () => {
    const { container } = render(
      <QuizCodeBlock
        tipo="completar"
        codigo={{ linguagem: "js", trecho: "const ____ = 3;" }}
      />,
    );
    const lacunas = container.querySelectorAll('[data-lacuna="true"]');
    expect(lacunas).toHaveLength(1);
    expect(lacunas[0].textContent).toBe("____");
    const [linha] = linhas(container);
    const conteudo = linha.querySelector("[data-conteudo]");
    expect(conteudo?.textContent).toBe("const ____ = 3;");
    const foraDaLacuna = Array.from(conteudo?.childNodes ?? [])
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent);
    expect(foraDaLacuna).toEqual(["const ", " = 3;"]);
  });

  it("saida com ____ no trecho renderiza literal, sem lacuna", () => {
    const { container } = render(
      <QuizCodeBlock
        tipo="saida"
        codigo={{ linguagem: "python", trecho: "print(____)" }}
      />,
    );
    expect(container.querySelector('[data-lacuna="true"]')).toBeNull();
    expect(
      linhas(container)[0].querySelector("[data-conteudo]")?.textContent,
    ).toBe("print(____)");
  });

  it("preserva espacos iniciais da linha", () => {
    const { container } = render(
      <QuizCodeBlock
        tipo="erro"
        codigo={{ linguagem: "js", trecho: "function f() {\n  return 1;\n}" }}
      />,
    );
    expect(
      linhas(container)[1].querySelector("[data-conteudo]")?.textContent,
    ).toBe("  return 1;");
  });
});
