import { describe, expect, it } from "vitest";

import { detalheDeRisco } from "./riskCopy";

/**
 * A linha de baixo do card "Receita em risco" (D21).
 *
 * O que estes testes protegem não é a frase, é a DEGRADAÇÃO: os campos do
 * breakdown nasceram nesta rodada, e o caminho em que eles não vêm só acontece
 * na janela de deploy, que é justamente quando ninguém está olhando.
 */

describe("detalheDeRisco", () => {
  it("junta as duas famílias, na ordem em que se age", () => {
    expect(
      detalheDeRisco({
        count: 21,
        mrrCents: 59670,
        saindo: { count: 20, mrrCents: 56680 },
        emAtraso: { count: 1, mrrCents: 2990 },
      }),
    ).toBe("20 saindo + 1 em atraso");
  });

  it("família vazia SOME da frase, em vez de virar '0 em atraso'", () => {
    expect(
      detalheDeRisco({
        count: 20,
        mrrCents: 56680,
        saindo: { count: 20, mrrCents: 56680 },
        emAtraso: { count: 0, mrrCents: 0 },
      }),
    ).toBe("20 saindo");
  });

  it("só atraso também funciona", () => {
    expect(
      detalheDeRisco({
        count: 3,
        mrrCents: 8970,
        saindo: { count: 0, mrrCents: 0 },
        emAtraso: { count: 3, mrrCents: 8970 },
      }),
    ).toBe("3 em atraso");
  });

  it("JANELA DE DEPLOY: sem os campos novos, cai na frase genérica e VERDADEIRA", () => {
    // Backend antigo respondendo a uma aba com o bundle novo. O card não pode
    // imprimir "undefined saindo", e também não pode afirmar um breakdown que
    // não recebeu.
    const texto = detalheDeRisco({ count: 10, mrrCents: 26780 });
    expect(texto).toBe("10 assinaturas em risco");
    expect(texto).not.toContain("undefined");
    expect(texto).not.toContain("NaN");
  });

  it("singular no caminho genérico", () => {
    expect(detalheDeRisco({ count: 1, mrrCents: 2990 })).toBe(
      "1 assinatura em risco",
    );
  });

  it("nada em risco é um estado NOMEADO, não string vazia", () => {
    expect(
      detalheDeRisco({
        count: 0,
        mrrCents: 0,
        saindo: { count: 0, mrrCents: 0 },
        emAtraso: { count: 0, mrrCents: 0 },
      }),
    ).toBe("Nenhuma assinatura em risco");
  });

  it("CONTROLE NEGATIVO: payload ausente ou de outra forma não lança", () => {
    expect(detalheDeRisco(null)).toBe("Sem dados de risco.");
    expect(detalheDeRisco(undefined)).toBe("Sem dados de risco.");
    expect(detalheDeRisco({} as never)).toBe("Sem dados de risco.");
  });
});
