import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import InterviewIntro from "./InterviewIntro";

/**
 * ESTADO FINAL NAS PAGINAS PRE-RENDERIZADAS FORA DA HOME (lote Home 03).
 *
 * O InterviewIntro e a vitrine de /entrevistas, e os `whileInView` dele saiam no
 * HTML pre-renderizado com `opacity: 0` inline. Ele representa os componentes
 * compartilhados que o lote passou pelo helper `entrada()`: framer-motion REAL,
 * sem mock, porque o que se afirma e o estilo escrito no DOM.
 */

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

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", ObservadorInerte);
});

afterEach(() => {
  cleanup();
  definirWebdriver(false);
  vi.unstubAllGlobals();
});

describe("InterviewIntro no prerender", () => {
  it("controle: fora do prerender a entrada comeca invisivel", () => {
    definirWebdriver(false);
    const { container } = render(<InterviewIntro />);
    expect(invisiveis(container).length).toBeGreaterThan(0);
  });

  it("no prerender nenhum elemento sai com opacity 0", () => {
    definirWebdriver(true);
    const { container } = render(<InterviewIntro />);
    expect(invisiveis(container)).toHaveLength(0);
  });
});
