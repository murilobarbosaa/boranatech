import { describe, expect, it } from "vitest";

import { LinkedinQualitativeSchema } from "./schema";

function qualitativeComPontosFortes(quantidade: number) {
  return {
    resumo: "Resumo.",
    pontosFortes: Array.from({ length: quantidade }, (_, i) => `Ponto ${i}`),
    pontosFracos: ["a", "b", "c"],
    melhorias: Array.from({ length: 4 }, (_, i) => ({
      prioridade: "alta",
      titulo: `Melhoria ${i}`,
      comoFazer: "Faça assim.",
    })),
    proximoPasso: "Próximo passo.",
    headlines: ["h1", "h2", "h3"],
    sobreReescrito: "Sobre.",
    bulletsReescritos: [],
    skillsParaEstudar: [],
    modeloMensagemRecrutador: "Mensagem.",
  };
}

describe("contrato de pontosFortes", () => {
  it.each([
    [0, true],
    [1, false],
    [2, false],
    [3, true],
    [5, true],
    [6, false],
  ])("%i itens tem validade %s", (quantidade, valido) => {
    expect(
      LinkedinQualitativeSchema.safeParse(
        qualitativeComPontosFortes(quantidade),
      ).success,
    ).toBe(valido);
  });
});
