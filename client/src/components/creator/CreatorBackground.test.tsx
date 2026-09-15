import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorBackground: as camadas do fundo do /creator e a deriva da aurora.
 *
 * O `useReducedMotion` e dublado, e nao lido de um matchMedia falso: o
 * framer-motion guarda a preferencia num estado de modulo iniciado uma vez so,
 * entao dois testes no mesmo arquivo com matchMedia diferente veriam o valor
 * do primeiro. O dublê devolve o valor que cada teste escolhe.
 */

const movimento = vi.hoisted(() => ({ reduzir: false as boolean | null }));

vi.mock("framer-motion", async (importOriginal) => {
  const real = await importOriginal<typeof import("framer-motion")>();
  return { ...real, useReducedMotion: () => movimento.reduzir };
});

import { CreatorBackground } from "./CreatorBackground";

const MANCHAS = ["violeta", "dourado", "verde-agua"];

afterEach(() => {
  cleanup();
  movimento.reduzir = false;
});

describe("CreatorBackground", () => {
  it("renderiza base, tres manchas, textura, vinheta e foco, tudo fora da leitura", () => {
    render(<CreatorBackground />);

    const fundo = screen.getByTestId("creator-fundo");
    expect(fundo.getAttribute("aria-hidden")).toBe("true");
    expect(fundo.className).toContain("fixed");
    expect(fundo.className).toContain("inset-0");
    expect(fundo.className).toContain("-z-10");

    for (const camada of ["base", "textura", "vinheta"]) {
      expect(fundo.contains(screen.getByTestId(`creator-fundo-${camada}`))).toBe(
        true,
      );
    }
    for (const mancha of MANCHAS) {
      expect(
        fundo.contains(screen.getByTestId(`creator-fundo-mancha-${mancha}`)),
      ).toBe(true);
    }

    const foco = screen.getByTestId("creator-fundo-foco");
    expect(fundo.contains(foco)).toBe(false);
    expect(foco.parentElement?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sem reduced motion, as tres manchas derivam", () => {
    render(<CreatorBackground />);
    for (const mancha of MANCHAS) {
      expect(
        screen
          .getByTestId(`creator-fundo-mancha-${mancha}`)
          .getAttribute("data-deriva"),
      ).toBe("ligada");
    }
  });

  it("com reduced motion, a deriva some das tres manchas", () => {
    movimento.reduzir = true;
    render(<CreatorBackground />);
    for (const mancha of MANCHAS) {
      expect(
        screen
          .getByTestId(`creator-fundo-mancha-${mancha}`)
          .getAttribute("data-deriva"),
      ).toBe("desligada");
    }
  });

  it("preferencia ainda nao lida (null) conta como sem reduced motion", () => {
    movimento.reduzir = null;
    render(<CreatorBackground />);
    expect(
      screen
        .getByTestId("creator-fundo-mancha-violeta")
        .getAttribute("data-deriva"),
    ).toBe("ligada");
  });
});
