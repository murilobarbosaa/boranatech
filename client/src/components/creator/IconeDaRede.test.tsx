import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { IconeDaRede } from "./IconeDaRede";

/**
 * IconeDaRede (lote 10b): o glifo oficial de cada rede, inline.
 *
 * O que se afirma e o CONTRATO do svg (viewBox 24, currentColor, aria-hidden,
 * um path por rede) e o fallback: rede desconhecida nao desenha nada, em vez
 * de derrubar quem a lista. O desenho em si nao e afirmado: o path e copiado
 * do simple-icons e conferido contra o pacote no commit que o trouxe.
 */

afterEach(() => {
  cleanup();
});

describe("IconeDaRede", () => {
  it("desenha um svg inline por rede, com o contrato do TrailLogo", () => {
    for (const rede of ["instagram", "tiktok"]) {
      const { container, unmount } = render(<IconeDaRede rede={rede} />);
      const svg = container.querySelector("svg");
      expect(svg, rede).not.toBeNull();
      expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg?.getAttribute("fill")).toBe("currentColor");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("data-testid")).toBe(`icone-da-rede-${rede}`);
      expect(svg?.className.baseVal).toBe("h-4 w-4 shrink-0");
      const paths = svg?.querySelectorAll("path") ?? [];
      expect(paths).toHaveLength(1);
      expect(paths[0].getAttribute("d")?.length ?? 0).toBeGreaterThan(100);
      unmount();
    }
  });

  it("os dois glifos sao diferentes entre si", () => {
    const ig = render(<IconeDaRede rede="instagram" />);
    const dIg = ig.container.querySelector("path")?.getAttribute("d");
    ig.unmount();
    const tt = render(<IconeDaRede rede="tiktok" />);
    const dTt = tt.container.querySelector("path")?.getAttribute("d");
    expect(dIg).not.toBe(dTt);
  });

  it("className substitui o tamanho padrao", () => {
    const { container } = render(
      <IconeDaRede rede="tiktok" className="h-5 w-5" />,
    );
    expect(container.querySelector("svg")?.className.baseVal).toBe("h-5 w-5");
  });

  it("linkedin (lote 10d) e o icone do lucide, decorativo, com o mesmo test id", () => {
    const { container } = render(<IconeDaRede rede="linkedin" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-testid")).toBe("icone-da-rede-linkedin");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    // Nao e um dos glifos inline do simple-icons: e o lucide.
    expect(svg?.getAttribute("class") ?? "").toContain("lucide");
  });

  it("rede desconhecida nao desenha nada, e nao lanca", () => {
    const { container } = render(<IconeDaRede rede="youtube" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.innerHTML).toBe("");
  });
});
