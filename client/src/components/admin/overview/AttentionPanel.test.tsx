import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  AttentionContractV3,
  AttentionItem,
} from "@shared/adminAttention";
import { ATTENTION_SOURCE_IDS } from "@shared/adminAttention";
import { AttentionPanel, groupAttentionItems } from "./AttentionPanel";

afterEach(cleanup);

const item: AttentionItem = {
  kind: "subscription_local_past_due",
  key: "past:1",
  severity: "critical",
  title: "Assinatura com estado local past_due",
  detail: "Não comprova obrigação aberta.",
  source: "subscriptions",
  subject: {
    type: "subscription",
    id: "33333333-3333-4333-8333-333333333333",
  },
  action: {
    type: "open_user",
    userId: "11111111-1111-4111-8111-111111111111",
  },
  stateUpdatedAt: "2026-09-11T10:00:00Z",
};

function payload(over: Partial<AttentionContractV3> = {}): AttentionContractV3 {
  return {
    contractVersion: 3,
    items: [],
    queryStartedAt: "2026-09-11T10:00:00Z",
    queryCompletedAt: "2026-09-11T10:00:01Z",
    computedAt: "2026-09-11T10:00:01Z",
    consistency: "multi_query_no_snapshot",
    sources: ATTENTION_SOURCE_IDS.map((source) => ({
      source,
      status: source.startsWith("failed_")
        ? ("not_collected" as const)
        : ("available" as const),
      detail: "Fonte declarada.",
    })),
    coverage: {
      completeHistoryVerified: false,
      transactionalSnapshot: false,
      limitations: ["Sem snapshot."],
    },
    ...over,
  };
}

describe("AttentionPanel v3", () => {
  it("renders factual copy, freshness, source and contextual user action", () => {
    render(<AttentionPanel data={payload({ items: [item] })} />);
    expect(screen.getByText(item.title)).toBeTruthy();
    expect(screen.getByText(/Calculado em/)).toBeTruthy();
    const action = screen.getByTestId("attention-action") as HTMLAnchorElement;
    expect(action.textContent).toContain("Abrir usuário");
    expect(action.href).toContain("section=usuarios&user=11111111");
    expect(document.body.textContent).not.toMatch(
      /Resolver no admin|Cartão recusado|tentando de novo|cancela sozinha|que não entraram|dinheiro retido|lembrete já saiu/,
    );
  });

  it("distinguishes not collected from unavailable without inventing zero", () => {
    render(
      <AttentionPanel
        data={payload({
          sources: payload().sources.map((source) =>
            source.source === "billing_orphan_payments"
              ? { ...source, status: "unavailable" as const }
              : source,
          ),
        })}
      />,
    );
    expect(
      screen.getByText(/Não coletada: failed_charges_reconciled/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Indisponível: billing_orphan_payments/),
    ).toBeTruthy();
    expect(screen.queryByTestId("attention-empty")).toBeNull();
  });

  it("uses the precise empty state only when monitored reads completed", () => {
    render(<AttentionPanel data={payload()} />);
    expect(screen.getByTestId("attention-empty").textContent).toContain(
      "Nenhuma pendência encontrada nas fontes locais monitoradas",
    );
    expect(document.body.textContent).not.toContain("Tudo em ordem");
  });

  it("refreshes manually and disables concurrent clicks while loading", () => {
    const refresh = vi.fn();
    const { rerender } = render(
      <AttentionPanel data={payload()} onRefresh={refresh} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }));
    expect(refresh).toHaveBeenCalledOnce();
    rerender(<AttentionPanel data={payload()} onRefresh={refresh} loading />);
    expect(
      (screen.getByRole("button", { name: /Atualizar/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("groups counts but only sums homogeneous complete values", () => {
    const valued: AttentionItem = {
      ...item,
      kind: "orphan_payment_open",
      key: "orphan:1",
      action: {
        type: "open_orphan",
        orphanId: "22222222-2222-4222-8222-222222222222",
      },
      value: {
        semantics: "detector_recorded_amount",
        currency: "BRL",
        minorUnits: 1000,
      },
    };
    const groups = groupAttentionItems([
      valued,
      { ...valued, key: "orphan:2", value: undefined },
    ]);
    expect(groups[0].items).toHaveLength(2);
    render(<AttentionPanel data={payload({ items: groups[0].items })} />);
    expect(document.body.textContent).not.toContain("R$ 10,00");
  });
});
