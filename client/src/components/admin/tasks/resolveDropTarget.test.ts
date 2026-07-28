import { describe, expect, it } from "vitest";

import {
  resolveColumnOrder,
  resolveDropTarget,
  type BoardOrder,
} from "./resolveDropTarget";

// Board de referencia dos testes:
//   A: [a1, a2, a3]
//   B: [b1, b2]
//   C: []
const BOARD: BoardOrder = {
  columns: [
    { id: "A", taskIds: ["a1", "a2", "a3"] },
    { id: "B", taskIds: ["b1", "b2"] },
    { id: "C", taskIds: [] },
  ],
};

/**
 * Reconstroi a lista final a partir do alvo devolvido. Serve para os testes
 * afirmarem a ORDEM RESULTANTE, que e o que a pessoa ve, em vez de decorar qual
 * id deveria estar em before/after. Um before/after invertido passaria num teste
 * que so compara ids; nao passa neste.
 */
function applyDrop(
  board: BoardOrder,
  activeId: string,
  target: { columnId: string; beforeTaskId: string | null; afterTaskId: string | null },
): string[] {
  const column = board.columns.find((c) => c.id === target.columnId)!;
  const without = column.taskIds.filter((id) => id !== activeId);
  if (target.beforeTaskId === null) return [activeId, ...without];
  const index = without.indexOf(target.beforeTaskId);
  return [...without.slice(0, index + 1), activeId, ...without.slice(index + 1)];
}

describe("resolveDropTarget: mesma coluna", () => {
  it("arrastar para baixo sobre outro card", () => {
    const target = resolveDropTarget(BOARD, "a1", "a3")!;
    expect(target.columnId).toBe("A");
    expect(applyDrop(BOARD, "a1", target)).toEqual(["a2", "a3", "a1"]);
  });

  it("arrastar para cima sobre outro card", () => {
    const target = resolveDropTarget(BOARD, "a3", "a1")!;
    expect(applyDrop(BOARD, "a3", target)).toEqual(["a3", "a1", "a2"]);
  });

  it("arrastar para o meio", () => {
    const target = resolveDropTarget(BOARD, "a1", "a2")!;
    expect(applyDrop(BOARD, "a1", target)).toEqual(["a2", "a1", "a3"]);
    expect(target.beforeTaskId).toBe("a2");
    expect(target.afterTaskId).toBe("a3");
  });

  it("topo tem beforeTaskId null", () => {
    const target = resolveDropTarget(BOARD, "a3", "a1")!;
    expect(target.beforeTaskId).toBeNull();
    expect(target.afterTaskId).toBe("a1");
  });

  it("fim tem afterTaskId null", () => {
    const target = resolveDropTarget(BOARD, "a1", "a3")!;
    expect(target.beforeTaskId).toBe("a3");
    expect(target.afterTaskId).toBeNull();
  });

  it("soltar na area vazia da propria coluna manda para o fim", () => {
    const target = resolveDropTarget(BOARD, "a1", "A")!;
    expect(applyDrop(BOARD, "a1", target)).toEqual(["a2", "a3", "a1"]);
  });
});

describe("resolveDropTarget: entre colunas", () => {
  it("sobre um card entra no lugar dele, empurrando-o para baixo", () => {
    const target = resolveDropTarget(BOARD, "a1", "b2")!;
    expect(target.columnId).toBe("B");
    expect(applyDrop(BOARD, "a1", target)).toEqual(["b1", "a1", "b2"]);
    expect(target.beforeTaskId).toBe("b1");
    expect(target.afterTaskId).toBe("b2");
  });

  it("sobre o primeiro card da coluna destino vai para o topo", () => {
    const target = resolveDropTarget(BOARD, "a1", "b1")!;
    expect(target.beforeTaskId).toBeNull();
    expect(target.afterTaskId).toBe("b1");
    expect(applyDrop(BOARD, "a1", target)).toEqual(["a1", "b1", "b2"]);
  });

  it("na area vazia de uma coluna com cards entra no fim", () => {
    const target = resolveDropTarget(BOARD, "a1", "B")!;
    expect(applyDrop(BOARD, "a1", target)).toEqual(["b1", "b2", "a1"]);
    expect(target.afterTaskId).toBeNull();
  });

  it("coluna VAZIA: os dois vizinhos sao null", () => {
    const target = resolveDropTarget(BOARD, "a1", "C")!;
    expect(target).toEqual({
      columnId: "C",
      beforeTaskId: null,
      afterTaskId: null,
    });
  });
});

describe("resolveDropTarget: casos que NAO viram requisicao", () => {
  it("soltar sobre si mesmo", () => {
    expect(resolveDropTarget(BOARD, "a1", "a1")).toBeNull();
  });

  it("soltar fora de qualquer alvo", () => {
    expect(resolveDropTarget(BOARD, "a1", null)).toBeNull();
  });

  it("card unico solto na area vazia da propria coluna", () => {
    const single: BoardOrder = { columns: [{ id: "A", taskIds: ["a1"] }] };
    expect(resolveDropTarget(single, "a1", "A")).toBeNull();
  });

  it("id ativo desconhecido", () => {
    expect(resolveDropTarget(BOARD, "fantasma", "a2")).toBeNull();
  });

  it("id de destino desconhecido", () => {
    expect(resolveDropTarget(BOARD, "a1", "fantasma")).toBeNull();
  });
});

describe("resolveDropTarget: ida e volta", () => {
  it("mover e desfazer devolve a ordem original", () => {
    const down = resolveDropTarget(BOARD, "a1", "a3")!;
    const moved = applyDrop(BOARD, "a1", down);
    expect(moved).toEqual(["a2", "a3", "a1"]);

    const movedBoard: BoardOrder = {
      columns: [{ id: "A", taskIds: moved }, ...BOARD.columns.slice(1)],
    };
    const up = resolveDropTarget(movedBoard, "a1", "a2")!;
    expect(applyDrop(movedBoard, "a1", up)).toEqual(["a1", "a2", "a3"]);
  });
});

describe("resolveColumnOrder", () => {
  it("devolve a lista COMPLETA, nunca um recorte", () => {
    const ids = resolveColumnOrder(BOARD, "A", "C")!;
    expect(ids).toHaveLength(BOARD.columns.length);
    expect([...ids].sort()).toEqual(["A", "B", "C"]);
  });

  it("mover para a direita", () => {
    expect(resolveColumnOrder(BOARD, "A", "B")).toEqual(["B", "A", "C"]);
  });

  it("mover para a esquerda", () => {
    expect(resolveColumnOrder(BOARD, "C", "A")).toEqual(["C", "A", "B"]);
  });

  it("sobre si mesma ou sem alvo devolve null", () => {
    expect(resolveColumnOrder(BOARD, "A", "A")).toBeNull();
    expect(resolveColumnOrder(BOARD, "A", null)).toBeNull();
  });

  it("coluna desconhecida devolve null", () => {
    expect(resolveColumnOrder(BOARD, "Z", "A")).toBeNull();
  });
});
