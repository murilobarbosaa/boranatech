import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import TrophyCard from "./TrophyCard";
import type { StationCertVM } from "./types";

// framer-motion (useReducedMotion) le matchMedia; jsdom nao o implementa por
// padrao. Stub inofensivo (nunca reduz), sem any.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

afterEach(cleanup);

function cert(catalogId: string): StationCertVM {
  return {
    itemId: `cert:${catalogId}`,
    catalogId,
    whenLabel: "depois do degrau fundamentos",
    optional: false,
    rationale: "motivo",
    done: null,
  };
}

describe("TrophyCard: nota do catalogo visivel", () => {
  it("mostra item.notes no detalhe expandido de um item do catalogo", () => {
    render(<TrophyCard cert={cert("comptia-a-plus")} />);

    // Colapsado: a nota ainda nao aparece.
    expect(screen.queryByText(/duas provas/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Detalhes de/i }));

    // Expandido: a nota material (duas provas Core 1 e Core 2) aparece.
    expect(
      screen.getByText(/duas provas \(Core 1 e Core 2\)/i),
    ).toBeTruthy();
  });

  it("item fora do catalogo atual nao tem nota (nao ha item para ler)", () => {
    render(<TrophyCard cert={cert("curso-fantasma-xyz")} />);

    fireEvent.click(screen.getByRole("button", { name: /Detalhes de/i }));

    expect(screen.getByText(/saiu do nosso catálogo atual/i)).toBeTruthy();
    expect(screen.queryByText(/duas provas/i)).toBeNull();
  });
});
