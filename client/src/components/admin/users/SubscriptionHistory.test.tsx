import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SubscriptionHistory } from "./SubscriptionHistory";
import type { SubscriptionHistoryItem } from "./types";

afterEach(cleanup);

const ANTERIOR: SubscriptionHistoryItem = {
  plan_code: "pro_monthly",
  status: "superseded",
  payment_method: "boleto",
  created_at: "2025-01-01T00:00:00Z",
  current_period_end: "2026-01-01T00:00:00Z",
};

describe("SubscriptionHistory", () => {
  it("lista as anteriores com plano, status e meio traduzidos", () => {
    render(<SubscriptionHistory items={[ANTERIOR]} />);
    expect(screen.getByText("Pro Mensal")).toBeTruthy();
    expect(screen.getByText("Substituída")).toBeTruthy();
    expect(screen.getByText("Boleto")).toBeTruthy();
  });

  it("valores desconhecidos do servidor aparecem crus, sem derrubar a seção", () => {
    render(
      <SubscriptionHistory
        items={[
          {
            ...ANTERIOR,
            plan_code: "pro_bienal",
            status: "estado_novo",
            payment_method: "cripto",
          },
        ]}
      />,
    );
    expect(screen.getByText("pro_bienal")).toBeTruthy();
    expect(screen.getByText("estado_novo")).toBeTruthy();
    expect(screen.getByText("cripto")).toBeTruthy();
  });

  it("lista vazia não renderiza seção nenhuma", () => {
    const { container } = render(<SubscriptionHistory items={[]} />);
    expect(container.textContent).toBe("");
  });

  it("payload de shape inesperado não derruba o modal", () => {
    const { container } = render(
      <SubscriptionHistory
        items={undefined as unknown as SubscriptionHistoryItem[]}
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("sem meio de pagamento, não inventa nem mostra rótulo órfão", () => {
    render(
      <SubscriptionHistory items={[{ ...ANTERIOR, payment_method: null }]} />,
    );
    expect(screen.queryByText("Boleto")).toBeNull();
    expect(screen.getByText("Pro Mensal")).toBeTruthy();
  });
});
