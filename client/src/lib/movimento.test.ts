import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __reiniciarModoEntradaEstaticaParaTeste,
  entrada,
  iniciarModoEntradaEstatica,
} from "./entradaEstatica";
import { movimentoContinuo } from "./movimentoContinuo";

/**
 * REDUCED MOTION (lote Home 03, item C).
 *
 * Sob `prefers-reduced-motion: reduce` nada se move: entrada no estado final e
 * loop parado no primeiro quadro, para o elemento continuar com a cara que tem e
 * nao pular para a opacidade padrao.
 */

function preferencia(reduzir: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduzir && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  }));
}

beforeEach(() => {
  __reiniciarModoEntradaEstaticaParaTeste();
  iniciarModoEntradaEstatica(document.createElement("div"));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("entrada() sob reduced motion", () => {
  it("devolve o estado final mesmo fora do modo estatico", () => {
    preferencia(true);
    expect(entrada({ opacity: 0, y: 20 })).toBe(false);
  });

  it("sem a preferencia, fora do modo estatico, a entrada continua", () => {
    preferencia(false);
    const inicial = { opacity: 0, y: 20 };
    expect(entrada(inicial)).toBe(inicial);
  });
});

describe("movimentoContinuo()", () => {
  const loop = { scale: [1, 2, 1], opacity: [0.7, 0.2, 0.7], x: 4 };

  it("sob reduced motion fica no primeiro quadro de cada chave", () => {
    expect(movimentoContinuo(loop, true)).toEqual({
      scale: 1,
      opacity: 0.7,
      x: 4,
    });
  });

  it("sem a preferencia devolve o loop intacto", () => {
    expect(movimentoContinuo(loop, false)).toBe(loop);
  });

  it("preferencia ainda desconhecida (null) conta como sem preferencia", () => {
    expect(movimentoContinuo(loop, null)).toBe(loop);
  });
});
