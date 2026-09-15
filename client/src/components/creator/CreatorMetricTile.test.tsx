import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

/**
 * CreatorMetricTile: o tile do resumo da aba Creators do admin, que nao pode
 * mudar. O painel do creator usa o CreatorMetricCard.
 */

import { CreatorMetricTile } from "./CreatorMetricTile";

afterEach(() => {
  cleanup();
});

describe("CreatorMetricTile", () => {
  it("o tile e o do resumo do admin: branco, borda de 2px e sombra de 3px", () => {
    render(<CreatorMetricTile testId="tile" rotulo="Cliques" valor="140" />);
    expect(screen.getByTestId("tile").className).toBe(
      "rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]",
    );
    expect(screen.getByTestId("tile-valor").textContent).toBe("140");
  });
});
