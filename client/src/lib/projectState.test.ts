import { describe, expect, it } from "vitest";

import { deriveProjectState, filtrarPorEstado } from "@/lib/projectState";

const vazio: Record<string, string> = {};
const umaEtapa = { html: "2026-09-05T07:00:00.000Z" };

describe("deriveProjectState", () => {
  it("sem nada e nao_iniciado", () => {
    expect(
      deriveProjectState({ done: false, etapas: vazio, validado: false }),
    ).toBe("nao_iniciado");
  });

  it("com etapa marcada e em_andamento", () => {
    expect(
      deriveProjectState({ done: false, etapas: umaEtapa, validado: false }),
    ).toBe("em_andamento");
  });

  it("done ganha de etapa marcada", () => {
    expect(
      deriveProjectState({ done: true, etapas: umaEtapa, validado: false }),
    ).toBe("concluido");
  });

  it("validado ganha de done", () => {
    expect(
      deriveProjectState({ done: true, etapas: umaEtapa, validado: true }),
    ).toBe("verificado");
    // e ganha mesmo sem done, que e o caso de quem validou pelo GitHub sem
    // ter clicado em "marcar como concluido"
    expect(
      deriveProjectState({ done: false, etapas: vazio, validado: true }),
    ).toBe("verificado");
  });
});

const ITEMS = [
  { id: "a", pro: undefined },
  { id: "b", pro: undefined },
  { id: "c", pro: true as const },
  { id: "d", pro: undefined },
];

const ctx = {
  // a: em andamento | b: concluido | c: pro e nao iniciado | d: verificado
  done: (id: string) => id === "b",
  etapas: (id: string) => (id === "a" ? umaEtapa : vazio),
  validado: (id: string) => id === "d",
};

describe("filtrarPorEstado", () => {
  it("todos devolve a lista intacta, na mesma ordem", () => {
    expect(filtrarPorEstado(ITEMS, "todos", ctx)).toEqual(ITEMS);
  });

  it("em_andamento pega so quem tem etapa marcada e nao terminou", () => {
    expect(
      filtrarPorEstado(ITEMS, "em_andamento", ctx).map((p) => p.id),
    ).toEqual(["a"]);
  });

  it("concluidos inclui o verificado", () => {
    expect(filtrarPorEstado(ITEMS, "concluidos", ctx).map((p) => p.id)).toEqual(
      ["b", "d"],
    );
  });

  it("pro e recorte de catalogo, nao de estado", () => {
    expect(filtrarPorEstado(ITEMS, "pro", ctx).map((p) => p.id)).toEqual(["c"]);
  });
});

describe("deriveProjectState com entrega", () => {
  it("entregue vence concluido", () => {
    expect(
      deriveProjectState({
        done: true,
        etapas: vazio,
        validado: false,
        entrega: "entregue",
      }),
    ).toBe("entregue");
  });

  it("verificado vence entregue", () => {
    expect(
      deriveProjectState({
        done: false,
        etapas: vazio,
        validado: false,
        entrega: "verificado",
      }),
    ).toBe("verificado");
  });

  it("validado por IA tambem da verificado, sem entrega", () => {
    expect(
      deriveProjectState({
        done: false,
        etapas: vazio,
        validado: true,
        entrega: null,
      }),
    ).toBe("verificado");
  });

  it("sem entrega o comportamento anterior nao muda", () => {
    expect(
      deriveProjectState({ done: true, etapas: vazio, validado: false }),
    ).toBe("concluido");
  });
});

describe("filtro Concluidos com entrega", () => {
  it("inclui entregue e verificado", () => {
    const items = [
      { id: "a", pro: undefined },
      { id: "b", pro: undefined },
      { id: "c", pro: undefined },
    ];
    const ctx = {
      done: () => false,
      etapas: () => vazio,
      validado: () => false,
      entrega: (id: string) =>
        id === "a"
          ? ("entregue" as const)
          : id === "b"
            ? ("verificado" as const)
            : null,
    };
    expect(filtrarPorEstado(items, "concluidos", ctx).map((p) => p.id)).toEqual(
      ["a", "b"],
    );
  });
});
