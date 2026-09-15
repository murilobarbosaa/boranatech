import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

/**
 * CreatorMetricTile: o tile com `tom` (painel do creator) e o tile sem `tom`,
 * que e o do resumo da aba Creators do admin e nao pode mudar.
 */

import { CreatorMetricTile } from "./CreatorMetricTile";

afterEach(() => {
  cleanup();
});

describe("CreatorMetricTile", () => {
  it("sem tom, o tile e o de antes: branco, borda de 2px e sombra de 3px", () => {
    render(<CreatorMetricTile testId="tile" rotulo="Cliques" valor="140" />);
    expect(screen.getByTestId("tile").className).toBe(
      "rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]",
    );
    expect(screen.getByTestId("tile-valor").textContent).toBe("140");
  });

  it("com tom, vira card-brutal no fundo pastel e o icone na tinta do par", () => {
    render(
      <CreatorMetricTile
        testId="tile"
        rotulo="Cliques"
        valor="140"
        icone={<svg data-testid="icone" />}
        tom={{ bg: "bg-sky-200", text: "text-sky-900" }}
      />,
    );
    const tile = screen.getByTestId("tile");
    expect(tile.className).toContain("card-brutal");
    expect(tile.className).toContain("bg-sky-200");
    expect(tile.className).not.toContain("bg-white");
    expect(screen.getByTestId("icone").parentElement?.className).toContain(
      "text-sky-900",
    );
  });
});
