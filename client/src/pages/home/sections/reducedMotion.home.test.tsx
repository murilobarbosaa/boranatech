import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import Hero from "./Hero";
import LogoLoop from "./LogoLoop";

/**
 * HOME SOB REDUCED MOTION (lote Home 03, item C).
 *
 * Decisao de produto: com `prefers-reduced-motion: reduce` no sistema, carrosseis
 * pausados, frase estatica e todo o conteudo visivel. Framer-motion REAL; o
 * `matchMedia` e dublado ANTES do primeiro uso, porque o framer guarda a
 * preferencia no primeiro `useReducedMotion`.
 *
 * A guarda de que todo loop infinito passa por `movimentoContinuo` le a fonte e
 * mora em loopsProtegidos.test.ts.
 */

vi.stubGlobal("matchMedia", (query: string) => ({
  matches: query.includes("prefers-reduced-motion"),
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

const INTERVALO_DA_FRASE_MS = 3000;

class ObservadorInerte {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function invisiveis(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[style]")).filter(
    (el) => el.style.opacity === "0",
  );
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
  vi.restoreAllMocks();
});

describe("frase principal sob reduced motion", () => {
  it("fica na primeira frase e nao liga o interval", () => {
    const espiao = vi.spyOn(window, "setInterval");
    const { container } = render(<Hero />);
    const titulo = container.querySelector("#hero-headline") as HTMLElement;

    expect(titulo.textContent).toContain("entrar na TI de verdade");
    expect(
      espiao.mock.calls.filter((c) => c[1] === INTERVALO_DA_FRASE_MS),
    ).toHaveLength(0);
  });
});

describe("faixa de logos sob reduced motion", () => {
  it("nao depende de animacao para ficar visivel", () => {
    const { container } = render(<LogoLoop />);
    expect(invisiveis(container)).toHaveLength(0);
  });
});
