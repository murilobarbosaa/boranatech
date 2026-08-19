import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import LinkedinHistory from "./LinkedinHistory";

afterEach(cleanup);

const props = {
  analyses: [],
  onOpen: () => undefined,
  loadingId: null,
};

describe("LinkedinHistory: estados de carregamento", () => {
  it("erro não parece lista vazia e preserva a análise atual", () => {
    render(<LinkedinHistory {...props} status="error" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Não conseguimos carregar seu histórico agora."),
    ).toBeTruthy();
    expect(
      screen.getByText(/Sua análise atual continua disponível/),
    ).toBeTruthy();
  });

  it("loading tem estado acessível e vazio bem-sucedido não inventa erro", () => {
    const { rerender } = render(
      <LinkedinHistory {...props} status="loading" />,
    );
    expect(screen.getByRole("status")).toBeTruthy();

    rerender(<LinkedinHistory {...props} status="success_empty" />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("falha ao abrir um item tem feedback próprio sem invalidar a lista", () => {
    render(
      <LinkedinHistory
        {...props}
        analyses={[
          {
            id: "analysis-1",
            area: "frontend",
            level: "junior",
            score: 42,
            faixa: "em-construcao",
            created_at: "2026-08-15T12:00:00Z",
          },
        ]}
        status="success_with_data"
        openError="Não conseguimos abrir esta análise agora. Tente novamente."
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "Não conseguimos abrir esta análise agora",
    );
    expect(screen.getByText("Minhas análises")).toBeTruthy();
  });
});
