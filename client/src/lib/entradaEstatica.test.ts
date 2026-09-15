import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __reiniciarModoEntradaEstaticaParaTeste,
  entrada,
  entradaEstatica,
  iniciarModoEntradaEstatica,
} from "./entradaEstatica";

/**
 * MODO ENTRADA-ESTATICA (lote Home 03).
 *
 * Quando o React monta por cima de HTML pre-renderizado, a pessoa ja esta vendo
 * o conteudo, e re-animar a entrada e o flicker. O modo liga antes do
 * createRoot quando `#root` ja tem filhos (ou no proprio prerender) e desliga na
 * primeira troca de rota ou na primeira interacao: o que monta depois disso nunca
 * foi visto, e anima como sempre.
 */

function definirWebdriver(valor: boolean) {
  Object.defineProperty(window.navigator, "webdriver", {
    value: valor,
    configurable: true,
  });
}

function rootCom(filhos: number): HTMLElement {
  const root = document.createElement("div");
  for (let i = 0; i < filhos; i++)
    root.appendChild(document.createElement("p"));
  return root;
}

beforeEach(() => {
  __reiniciarModoEntradaEstaticaParaTeste();
  definirWebdriver(false);
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  definirWebdriver(false);
});

describe("deteccao sincrona antes do createRoot", () => {
  it("#root com filhos (HTML pre-renderizado) liga o modo", () => {
    expect(iniciarModoEntradaEstatica(rootCom(2))).toBe(true);
    expect(entradaEstatica()).toBe(true);
  });

  it("#root vazio (shell do app.html) nao liga", () => {
    expect(iniciarModoEntradaEstatica(rootCom(0))).toBe(false);
    expect(entradaEstatica()).toBe(false);
  });

  it("no proprio prerender (navigator.webdriver) liga mesmo com #root vazio", () => {
    definirWebdriver(true);
    expect(iniciarModoEntradaEstatica(rootCom(0))).toBe(true);
  });

  it("sem inicializacao explicita, cai no prerender", () => {
    definirWebdriver(true);
    expect(entradaEstatica()).toBe(true);
  });
});

describe("o modo so vale para a rota de chegada", () => {
  it("desliga na primeira troca de rota e nao religa ao voltar", () => {
    iniciarModoEntradaEstatica(rootCom(1));
    expect(entradaEstatica()).toBe(true);

    window.history.pushState(null, "", "/cursos");
    expect(entradaEstatica()).toBe(false);

    window.history.pushState(null, "", "/");
    expect(entradaEstatica()).toBe(false);
  });

  it("desliga na primeira interacao por ponteiro", () => {
    iniciarModoEntradaEstatica(rootCom(1));
    window.dispatchEvent(new Event("pointerdown"));
    expect(entradaEstatica()).toBe(false);
  });

  it("desliga na primeira interacao por teclado", () => {
    iniciarModoEntradaEstatica(rootCom(1));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(entradaEstatica()).toBe(false);
  });
});

describe("entrada()", () => {
  it("com o modo ligado devolve false, que no framer e o estado final", () => {
    iniciarModoEntradaEstatica(rootCom(1));
    expect(entrada({ opacity: 0, y: 20 })).toBe(false);
    expect(entrada("hidden")).toBe(false);
  });

  it("com o modo desligado devolve o estado inicial intacto", () => {
    iniciarModoEntradaEstatica(rootCom(0));
    const inicial = { opacity: 0, y: 20 };
    expect(entrada(inicial)).toBe(inicial);
    expect(entrada("hidden")).toBe("hidden");
  });

  it("false continua false", () => {
    iniciarModoEntradaEstatica(rootCom(0));
    expect(entrada(false)).toBe(false);
  });
});
