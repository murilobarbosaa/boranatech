import { describe, expect, it } from "vitest";

import {
  MIN_POSITION_GAP,
  POSITION_STEP,
  positionBetween,
  rebalancePositions,
} from "./adminTaskPosition";

function expectOk(result: ReturnType<typeof positionBetween>): number {
  if (result.kind !== "ok") {
    throw new Error(`esperava ok, veio ${result.kind}`);
  }
  return result.position;
}

describe("positionBetween", () => {
  it("coluna vazia comeca no passo padrao", () => {
    expect(expectOk(positionBetween(null, null))).toBe(POSITION_STEP);
  });

  it("no topo fica ANTES do primeiro vizinho", () => {
    expect(expectOk(positionBetween(null, 1000))).toBeLessThan(1000);
  });

  it("no fim fica DEPOIS do ultimo vizinho", () => {
    expect(expectOk(positionBetween(5000, null))).toBeGreaterThan(5000);
  });

  it("entre dois vizinhos cai no meio, estritamente entre eles", () => {
    const position = expectOk(positionBetween(1000, 2000));
    expect(position).toBe(1500);
    expect(position).toBeGreaterThan(1000);
    expect(position).toBeLessThan(2000);
  });

  it("topo negativo continua ordenando antes (posicao pode ser negativa)", () => {
    // Arrastar sempre para o topo empurra a posicao para baixo indefinidamente.
    // Nao ha piso: o que importa e a ORDEM, e negativo ordena antes.
    let first = 1000;
    for (let i = 0; i < 5; i += 1) {
      first = expectOk(positionBetween(null, first));
    }
    expect(first).toBeLessThan(0);
  });

  it("pede rebalanceamento quando o intervalo fica menor que o minimo", () => {
    const before = 1000;
    const after = before + MIN_POSITION_GAP / 2;
    expect(positionBetween(before, after)).toEqual({ kind: "rebalance" });
  });

  it("pede rebalanceamento com vizinhos empatados", () => {
    expect(positionBetween(1000, 1000)).toEqual({ kind: "rebalance" });
  });

  it("pede rebalanceamento com vizinhos fora de ordem", () => {
    expect(positionBetween(2000, 1000)).toEqual({ kind: "rebalance" });
  });

  it("pede rebalanceamento em valor nao finito", () => {
    expect(positionBetween(Number.NaN, 1000)).toEqual({ kind: "rebalance" });
    expect(positionBetween(1000, Number.POSITIVE_INFINITY)).toEqual({
      kind: "rebalance",
    });
  });

  // Este e o teste que justifica o tipo de retorno. Sem ele, a regressao
  // aparece como "a ordem do board embaralhou sozinha", meses depois, sem erro
  // nenhum no log.
  it("insercao repetida no MESMO intervalo termina em rebalance, nunca em empate", () => {
    let before = 1000;
    const after = 2000;
    for (let i = 0; i < 200; i += 1) {
      const result = positionBetween(before, after);
      if (result.kind === "rebalance") {
        expect(i).toBeGreaterThan(0);
        return;
      }
      // Enquanto devolve "ok", a posicao tem que ser ESTRITAMENTE interna:
      // e exatamente isso que impede dois cards de empatarem.
      expect(result.position).toBeGreaterThan(before);
      expect(result.position).toBeLessThan(after);
      before = result.position;
    }
    throw new Error("nunca pediu rebalanceamento em 200 insercoes seguidas");
  });
});

describe("rebalancePositions", () => {
  it("distribui em espacamento inteiro a partir do passo", () => {
    expect(rebalancePositions(3)).toEqual([1000, 2000, 3000]);
  });

  it("lista vazia devolve vazio", () => {
    expect(rebalancePositions(0)).toEqual([]);
  });

  it("resultado e estritamente crescente e com folga de sobra", () => {
    const positions = rebalancePositions(50);
    expect(positions).toHaveLength(50);
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i] - positions[i - 1]).toBe(POSITION_STEP);
    }
  });
});
