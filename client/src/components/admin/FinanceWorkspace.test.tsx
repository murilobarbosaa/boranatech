import { useEffect } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const panelRender = vi.hoisted(() => ({
  expenses: vi.fn(),
  fiscal: vi.fn(),
  orphans: vi.fn(),
  subscribers: vi.fn(),
}));

vi.mock("./FinanceDashboard", () => ({
  FinanceDashboard: ({
    view,
    periodFilter,
    onPeriodFilterChange,
  }: {
    view: string;
    periodFilter: { preset: string; customFrom: string; customTo: string };
    onPeriodFilterChange: (filter: {
      preset: "30d" | "90d" | "previous_month" | "custom";
      customFrom: string;
      customTo: string;
    }) => void;
  }) => (
    <div data-testid={`dashboard-${view}`}>
      {view} · {periodFilter.preset}
      <button
        type="button"
        onClick={() =>
          onPeriodFilterChange({
            preset: "custom",
            customFrom: "2026-08-01",
            customTo: "2026-08-31",
          })
        }
      >
        Usar período sintético
      </button>
    </div>
  ),
}));
vi.mock("./ExpensesManager", () => ({
  ExpensesManager: () => {
    useEffect(() => panelRender.expenses(), []);
    return <div data-testid="expenses">despesas</div>;
  },
}));
vi.mock("./FiscalInvoicesDashboard", () => ({
  FiscalInvoicesDashboard: () => {
    useEffect(() => panelRender.fiscal(), []);
    return <div data-testid="fiscal">fiscal</div>;
  },
}));
vi.mock("./OrphanPaymentsPanel", () => ({
  OrphanPaymentsPanel: () => {
    useEffect(() => panelRender.orphans(), []);
    return <div data-testid="orphans">órfãos</div>;
  },
}));
vi.mock("./SubscribersTable", () => ({
  SubscribersTable: () => {
    useEffect(() => panelRender.subscribers(), []);
    return <table data-testid="subscribers" />;
  },
}));

import {
  FinanceWorkspace,
  financePeriodFromSearch,
  financeViewFromSearch,
} from "./FinanceWorkspace";

beforeEach(() => {
  window.history.replaceState({}, "", "/admin?section=financeiro");
  Object.values(panelRender).forEach((spy) => spy.mockClear());
});

afterEach(cleanup);

describe("FinanceWorkspace", () => {
  it("mantém a subtab na URL e carrega apenas o painel selecionado", () => {
    render(<FinanceWorkspace />);
    expect(screen.getByTestId("dashboard-summary")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(panelRender.expenses).not.toHaveBeenCalled();
    expect(panelRender.fiscal).not.toHaveBeenCalled();
    expect(panelRender.orphans).not.toHaveBeenCalled();
    expect(panelRender.subscribers).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("tab", { name: "Transações" }));
    expect(window.location.search).toContain("financeView=transacoes");
    expect(screen.getByTestId("dashboard-transactions")).toBeTruthy();
    expect(
      screen.getByTestId("dashboard-summary").closest('[role="tabpanel"]'),
    ).toHaveProperty("hidden", true);
  });

  it("monta cada área operacional somente quando ela é selecionada", () => {
    render(<FinanceWorkspace />);
    fireEvent.click(screen.getByRole("tab", { name: "Assinaturas" }));
    expect(panelRender.orphans).toHaveBeenCalledTimes(1);
    expect(panelRender.subscribers).toHaveBeenCalledTimes(1);
    expect(panelRender.expenses).not.toHaveBeenCalled();
    expect(panelRender.fiscal).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("tab", { name: "Despesas" }));
    expect(panelRender.expenses).toHaveBeenCalledTimes(1);
    expect(panelRender.fiscal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "Fiscal" }));
    expect(panelRender.fiscal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "Assinaturas" }));
    expect(panelRender.orphans).toHaveBeenCalledTimes(1);
    expect(panelRender.subscribers).toHaveBeenCalledTimes(1);
  });

  it("restaura por URL e mantém filtros não pertencentes à subtab", () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=despesas&window=30",
    );
    render(<FinanceWorkspace />);
    expect(screen.getByTestId("expenses")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Fiscal" }));
    expect(window.location.search).toContain("financeView=fiscal");
    expect(window.location.search).toContain("window=30");
    expect(screen.getByTestId("fiscal")).toBeTruthy();
  });

  it("preserva o período financeiro na URL ao trocar de subtab", () => {
    render(<FinanceWorkspace />);
    fireEvent.click(
      screen.getByRole("button", { name: "Usar período sintético" }),
    );
    expect(window.location.search).toContain("financePeriod=custom");
    expect(window.location.search).toContain("financeFrom=2026-08-01");

    fireEvent.click(screen.getByRole("tab", { name: "Transações" }));
    expect(screen.getByTestId("dashboard-transactions").textContent).toContain(
      "custom",
    );
    expect(window.location.search).toContain("financeTo=2026-08-31");
  });

  it("aceita somente subtabs conhecidas em reload, voltar e avançar", () => {
    expect(financeViewFromSearch("?financeView=assinaturas")).toBe(
      "assinaturas",
    );
    expect(financeViewFromSearch("?financeView=desconhecida")).toBe("resumo");
    expect(financeViewFromSearch("")).toBe("resumo");
    expect(
      financePeriodFromSearch(
        "?financePeriod=custom&financeFrom=invalido&financeTo=2026-08-31",
      ),
    ).toEqual({ preset: "30d", customFrom: "", customTo: "" });
    expect(
      financePeriodFromSearch(
        "?financePeriod=custom&financeFrom=2026-09-01&financeTo=2026-08-01",
      ),
    ).toEqual({ preset: "30d", customFrom: "", customTo: "" });
  });

  it("permite navegar pelo tablist com teclado", () => {
    render(<FinanceWorkspace />);
    const summary = screen.getByRole("tab", { name: "Resumo" });
    summary.focus();
    fireEvent.keyDown(summary, { key: "ArrowRight" });

    expect(window.location.search).toContain("financeView=transacoes");
    expect(
      screen
        .getByRole("tab", { name: "Transações" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Transações" }), {
      key: "End",
    });
    expect(screen.getByRole("tab", { name: "Fiscal" }).tabIndex).toBe(0);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Fiscal" }), {
      key: "Home",
    });
    expect(screen.getByRole("tab", { name: "Resumo" }).tabIndex).toBe(0);
  });

  it("reage a voltar e avançar por popstate", () => {
    render(<FinanceWorkspace />);
    window.history.pushState(
      {},
      "",
      "/admin?section=financeiro&financeView=fiscal",
    );
    fireEvent.popState(window);

    expect(screen.getByTestId("fiscal")).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "Fiscal" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
});
