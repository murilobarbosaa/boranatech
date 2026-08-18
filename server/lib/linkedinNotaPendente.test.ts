import { describe, expect, it } from "vitest";

import {
  notaLinkedinParaContexto,
  textoDaNotaLinkedin,
} from "./linkedinNotaPendente";

describe("nota pendente nos consumidores do agente", () => {
  it("propaga score e faixa junto ao estado provisório", () => {
    expect(notaLinkedinParaContexto(67, "em-construcao", true)).toEqual({
      score: 67,
      faixa: "em-construcao",
      deterministicVersion: null,
      notaIncompleta: true,
      statusNota: "provisoria_a_confirmar",
    });
  });

  it("snapshot nunca escreve nota pendente como definitiva", () => {
    const texto = textoDaNotaLinkedin(67, "em-construcao", true);
    expect(texto).toContain("nota provisoria 67");
    expect(texto).toContain("a confirmar");
    expect(texto).not.toMatch(/^nota 67/);
  });

  it("mantém a apresentação definitiva quando a leitura está completa", () => {
    expect(textoDaNotaLinkedin(82, "forte", false)).toBe(
      "nota 82 (faixa forte)",
    );
  });

  it("não expõe par score/faixa inconsistente", () => {
    expect(notaLinkedinParaContexto(10, "magnetico", false, 8)).toEqual({
      score: null,
      faixa: null,
      deterministicVersion: 8,
      notaIncompleta: false,
      statusNota: "indisponivel",
    });
    expect(textoDaNotaLinkedin(10, "magnetico", false, 8)).toContain(
      "indisponivel",
    );
  });
});
