import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

/**
 * ProfileBackground: a variante `intensidade="alta"` do /creator e o padrao
 * intocado do /perfil.
 *
 * Os orbes sao afirmados pelo mapa exportado, e nao pelo `style` renderizado:
 * o jsdom descarta `radial-gradient` e `color-mix` do style inline, entao ler o
 * valor pintado devolveria string vazia nos dois casos e o teste passaria sem
 * medir nada.
 */

import { ORBES_DO_FUNDO, ProfileBackground } from "./ProfileBackground";

afterEach(() => {
  cleanup();
});

describe("ProfileBackground", () => {
  it("o padrao continua com os orbes de antes, literais", () => {
    expect(ORBES_DO_FUNDO.padrao).toEqual({
      violeta:
        "radial-gradient(ellipse, rgba(139, 92, 246, 0.45) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)",
      ambar:
        "radial-gradient(ellipse, rgba(251, 191, 36, 0.40) 0%, rgba(251, 191, 36, 0.15) 50%, transparent 75%)",
      esmeralda:
        "radial-gradient(ellipse, rgba(52, 211, 153, 0.35) 0%, rgba(52, 211, 153, 0.12) 50%, transparent 75%)",
    });
  });

  it("a alta usa os tokens da marca, e nao cor cravada", () => {
    const alta = ORBES_DO_FUNDO.alta;
    expect(alta.violeta).toContain("var(--brand-violet)");
    expect(alta.ambar).toContain("var(--brand-yellow)");
    expect(alta.esmeralda).toContain("var(--chart-3)");
    for (const orbe of Object.values(alta)) {
      expect(orbe).not.toContain("rgba(");
    }
  });

  it("sem prop renderiza o padrao; com intensidade alta, a alta", () => {
    const { container } = render(<ProfileBackground />);
    expect(
      container.firstElementChild?.getAttribute("data-intensidade"),
    ).toBe("padrao");
    cleanup();
    const alta = render(<ProfileBackground intensidade="alta" />);
    expect(
      alta.container.firstElementChild?.getAttribute("data-intensidade"),
    ).toBe("alta");
  });
});
