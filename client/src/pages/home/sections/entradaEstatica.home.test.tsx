import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import {
  __reiniciarModoEntradaEstaticaParaTeste,
  iniciarModoEntradaEstatica,
} from "@/lib/entradaEstatica";

import Hero from "./Hero";
import PorOndeComecar from "./PorOndeComecar";

/**
 * ESTADO FINAL NO HTML PRE-RENDERIZADO (lote Home 03).
 *
 * O prerender e um Chrome headless com `navigator.webdriver === true`. Ali, cada
 * animacao de entrada precisa sair no estado final: o que ficava com
 * `opacity: 0` inline nao entrava na tela, e sem JS a pessoa via buracos. Estes
 * casos usam o framer-motion REAL, porque o que se afirma e o estilo que ele
 * escreve no DOM.
 *
 * A troca da frase em si (o texto mudando) nao e afirmada aqui: com
 * AnimatePresence mode="wait" a frase nova so monta quando a saida da anterior
 * termina, e essa animacao anda em quadros que o jsdom nao avanca de forma
 * confiavel. O que este lote mudou e SE o interval liga, e isso e afirmado
 * direto. O texto da frase e escrito a mao aqui, e nao importado do Hero.
 */

const INTERVALO_DA_FRASE_MS = 3000;

class ObservadorInerte {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function definirWebdriver(valor: boolean) {
  Object.defineProperty(window.navigator, "webdriver", {
    value: valor,
    configurable: true,
  });
}

function invisiveis(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[style]")).filter(
    (el) => el.style.opacity === "0",
  );
}

function intervalsDaFrase(espiao: { mock: { calls: unknown[][] } }): number {
  return espiao.mock.calls.filter(
    (chamada) => chamada[1] === INTERVALO_DA_FRASE_MS,
  ).length;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", ObservadorInerte);
  vi.stubGlobal("ResizeObserver", ObservadorInerte);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 503 })),
  );
});

afterEach(() => {
  cleanup();
  definirWebdriver(false);
  __reiniciarModoEntradaEstaticaParaTeste();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("secao com whileInView no prerender", () => {
  it("controle: fora do prerender a entrada comeca invisivel", () => {
    definirWebdriver(false);
    const { container } = render(<PorOndeComecar />);
    expect(invisiveis(container).length).toBeGreaterThan(0);
  });

  it("no prerender nenhum elemento sai com opacity 0", () => {
    definirWebdriver(true);
    const { container } = render(<PorOndeComecar />);
    expect(invisiveis(container)).toHaveLength(0);
  });
});

describe("frase principal no prerender", () => {
  it("renderiza a primeira frase visivel e nao liga o interval", () => {
    definirWebdriver(true);
    const espiao = vi.spyOn(window, "setInterval");
    const { container } = render(<Hero />);
    const titulo = container.querySelector("#hero-headline") as HTMLElement;

    expect(titulo.textContent).toContain("entrar na TI de verdade");
    expect(invisiveis(titulo)).toHaveLength(0);
    expect(intervalsDaFrase(espiao)).toBe(0);
  });
});

describe("frase principal na chegada sobre HTML pre-renderizado", () => {
  it("comeca na primeira frase sem animacao e liga a alternancia", () => {
    definirWebdriver(false);
    const root = document.createElement("div");
    root.appendChild(document.createElement("p"));
    iniciarModoEntradaEstatica(root);

    const espiao = vi.spyOn(window, "setInterval");
    const { container } = render(<Hero />);
    const titulo = container.querySelector("#hero-headline") as HTMLElement;

    expect(titulo.textContent).toContain("entrar na TI de verdade");
    expect(invisiveis(titulo)).toHaveLength(0);
    expect(intervalsDaFrase(espiao)).toBe(1);
  });
});
