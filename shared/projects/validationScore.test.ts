import { describe, expect, it } from "vitest";

import { VALIDATION_CUTOFF, calcularNota } from "./validationScore";
import type { RequisitoAvaliacao } from "../github/schema";

const atende = (id: string): RequisitoAvaliacao => ({
  id,
  veredito: "atende",
  evidencia: "ok",
});
const parcial = (id: string): RequisitoAvaliacao => ({
  id,
  veredito: "parcial",
  evidencia: "quase",
});
const naoAtende = (id: string): RequisitoAvaliacao => ({
  id,
  veredito: "nao_atende",
  evidencia: "faltou",
});

const ids = (n: number) => Array.from({ length: n }, (_, i) => `r${i + 1}`);

describe("calcularNota", () => {
  it("10 de 10 valida e e perfeito", () => {
    const n = calcularNota(ids(10), ids(10).map(atende));
    expect(n).toEqual({
      atendidos: 10,
      total: 10,
      percentual: 100,
      pendentes: [],
      validado: true,
      perfeito: true,
    });
  });

  it("8 de 10 valida no limite exato e nao e perfeito", () => {
    const avaliacao = [
      ...ids(8).map(atende),
      naoAtende("r9"),
      naoAtende("r10"),
    ];
    const n = calcularNota(ids(10), avaliacao);
    expect(n.atendidos).toBe(8);
    expect(n.percentual).toBe(80);
    expect(n.validado).toBe(true);
    expect(n.perfeito).toBe(false);
    expect(n.pendentes).toEqual(["r9", "r10"]);
  });

  it("7 de 9 NAO valida, embora arredonde para 77", () => {
    // 0.777 < 0.8. O corte compara a fracao, nao o inteiro exibido.
    const avaliacao = [...ids(7).map(atende), naoAtende("r8"), naoAtende("r9")];
    const n = calcularNota(ids(9), avaliacao);
    expect(n.percentual).toBe(77);
    expect(n.validado).toBe(false);
  });

  it("4 de 5 valida", () => {
    const n = calcularNota(ids(5), [...ids(4).map(atende), naoAtende("r5")]);
    expect(n.percentual).toBe(80);
    expect(n.validado).toBe(true);
  });

  it("projeto sem requisitos nao valida", () => {
    const n = calcularNota([], []);
    expect(n).toEqual({
      atendidos: 0,
      total: 0,
      percentual: 0,
      pendentes: [],
      validado: false,
      perfeito: false,
    });
  });

  it("requisito omitido pela IA conta como pendente", () => {
    // A IA devolveu 9 itens num projeto de 10.
    const n = calcularNota(ids(10), ids(9).map(atende));
    expect(n.atendidos).toBe(9);
    expect(n.pendentes).toEqual(["r10"]);
    expect(n.validado).toBe(true);
  });

  it("parcial NAO conta como atendido", () => {
    const n = calcularNota(ids(4), [
      atende("r1"),
      atende("r2"),
      parcial("r3"),
      parcial("r4"),
    ]);
    expect(n.atendidos).toBe(2);
    expect(n.percentual).toBe(50);
    expect(n.validado).toBe(false);
  });

  it("id repetido na avaliacao nao conta duas vezes", () => {
    // Se o segundo item vencesse, um "atende" repetido apagaria o pendente.
    const n = calcularNota(ids(2), [
      naoAtende("r1"),
      atende("r1"),
      atende("r2"),
    ]);
    expect(n.atendidos).toBe(1);
    expect(n.pendentes).toEqual(["r1"]);
  });

  it("avaliacao com id que nao existe nos requisitos e ignorada", () => {
    const n = calcularNota(ids(2), [
      atende("r1"),
      atende("r2"),
      atende("inventado"),
    ]);
    expect(n.atendidos).toBe(2);
    expect(n.total).toBe(2);
  });

  it("o corte esta em 0.8", () => {
    expect(VALIDATION_CUTOFF).toBe(0.8);
  });
});
