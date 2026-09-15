import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({
  adminFetch: api.fetch,
  AdminApiError: class AdminApiError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string | null,
    ) {
      super(message);
    }
  },
}));

import type { AdminFinanceContract } from "@shared/adminFinance";
import { AdminApiError } from "@/lib/adminApi";

import { FinanceDashboard } from "./FinanceDashboard";
import { financeFixtureForRequest } from "./financeFixtureForRequest.testUtils";
import { clearHonestFinanceClientCacheForTests } from "./useHonestFinance";

function money(valueCents: number, currency: string) {
  return {
    status: "partial" as const,
    valueCents,
    currency,
    sources: ["finance_transactions"],
    coverage: "fixture sintética parcial",
    freshness: "2026-09-02T12:00:00.000Z",
    limitations: ["fixture sintética"],
  };
}

function count(value: number) {
  return {
    status: "partial" as const,
    value,
    sources: ["finance_transactions"],
    coverage: "fixture sintética parcial",
    freshness: "2026-09-02T12:00:00.000Z",
    limitations: [],
  };
}

function bucket(currency: string, value: number) {
  return {
    currency,
    positiveEntries: money(value, currency),
    refunds: money(100, currency),
    fees: money(50, currency),
    calculableNet: money(value - 150, currency),
    payments: count(2),
    identifiedPeople: count(1),
    transactionsWithoutPerson: count(1),
    series: [
      {
        day: "2026-09-01",
        positiveEntriesCents: value,
        refundsCents: 100,
        feesCents: 50,
        calculableNetCents: value - 150,
      },
    ],
  };
}

function fixture(): AdminFinanceContract {
  return {
    contractVersion: 1,
    status: "partial",
    computedAt: "2026-09-14T12:00:00.000Z",
    period: {
      preset: "custom",
      startDay: "2026-09-01",
      endDayInclusive: "2026-09-01",
      from: "2026-09-01T03:00:00.000Z",
      toExclusive: "2026-09-02T03:00:00.000Z",
      timezone: "America/Sao_Paulo",
      basis: "complete_calendar_days",
    },
    cash: {
      status: "partial",
      source: "finance_transactions",
      coverage: {
        localRowsRead: 4,
        canonicalTransactions: 4,
        duplicateRowsIgnored: 0,
        paymentIdentitiesFromAdm001: 4,
        reconciledWithProviders: false,
        transactionalSnapshot: false,
        externalCoverage: "not_collected",
      },
      freshness: "2026-09-02T12:00:00.000Z",
      currencies: [bucket("BRL", 10_000), bucket("USD", 2_000)],
      registeredPayments: count(4),
      registeredPaymentPeople: count(3),
      registeredPaymentsWithoutPerson: count(1),
      excludedTransactions: count(1),
      conflictingIdentities: count(1),
      exclusionsByReason: {
        unsupportedType: 0,
        unsupportedProvider: 0,
        missingIdentity: 0,
        invalidAmount: 0,
        invalidCurrency: 0,
        invalidInstant: 0,
        outsidePeriod: 0,
        economicConflict: 1,
      },
      limitations: ["fixture sintética"],
    },
    accesses: {
      status: "partial",
      source: "subscriptions",
      coverage: {
        localRowsRead: 9,
        transactionalSnapshot: false,
        historicalContractCoverage: "unavailable",
        peopleWithConflictingAccesses: 0,
      },
      freshness: "2026-09-02T12:00:00.000Z",
      automaticActive: count(4),
      manualPrepaidActive: count(3),
      trialing: count(2),
      unclassified: count(0),
      conflictingPeople: count(0),
      scheduledCancellation: count(1),
      catalogMonthlyValues: [
        {
          currency: "BRL",
          automaticActive: money(11_960, "BRL"),
          manualPrepaidActive: money(8_970, "BRL"),
        },
      ],
      catalogValueExclusions: count(0),
      limitations: ["preço vigente de catálogo"],
    },
    unavailableIndicators: [
      {
        names: [
          "MRR contratual",
          "ARR",
          "New MRR",
          "Expansion MRR",
          "Contraction MRR",
          "Reactivation MRR",
          "Churned MRR",
          "NRR",
          "churn de receita",
          "logo churn",
          "LTV",
        ],
        status: "unavailable",
        value: null,
        sources: ["subscriptions", "finance_transactions"],
        coverage: "sem fatos contratuais",
        freshness: "2026-09-02T12:00:00.000Z",
        limitations: ["não mensurável"],
        requiredFacts: ["obrigação imutável"],
      },
    ],
  };
}

beforeEach(() => {
  window.history.replaceState({}, "", "/admin?section=financeiro");
  clearHonestFinanceClientCacheForTests();
  api.fetch.mockImplementation((path: string) =>
    path.startsWith("/finance/summary")
      ? Promise.resolve({ data: financeFixtureForRequest(fixture(), path) })
      : Promise.resolve({
          data: { rows: [], total: 0, page: 1, pageSize: 25 },
        }),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FinanceDashboard", () => {
  it("mantém o Resumo útil se o backend antigo ainda não servir meios de pagamento", async () => {
    api.fetch.mockImplementation((path: string) => {
      if (path.startsWith("/finance/summary"))
        return Promise.resolve({
          data: financeFixtureForRequest(fixture(), path),
        });
      if (path.startsWith("/finance/payment-methods"))
        return Promise.reject(new Error("Erro 404"));
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    });
    render(<FinanceDashboard />);
    expect(
      await screen.findByText("Meios indisponíveis: Erro 404"),
    ).toBeTruthy();
    expect(screen.getByText("Movimentos em BRL")).toBeTruthy();
    expect(screen.queryByText("0 pagamentos")).toBeNull();
  });
  it("mantém só a última leitura válida do mesmo período como desatualizada em falha transitória", async () => {
    let attempts = 0;
    api.fetch.mockImplementation((path: string) => {
      if (path.startsWith("/finance/summary"))
        return Promise.resolve({
          data: financeFixtureForRequest(fixture(), path),
        });
      if (path.startsWith("/finance/payment-methods")) {
        attempts++;
        return attempts === 1
          ? Promise.resolve({
              data: {
                status: "partial",
                pix: [
                  {
                    currency: "BRL",
                    payments: 1,
                    people: 1,
                    grossCents: 10_000,
                    withoutPerson: 0,
                  },
                ],
                paymentsWithoutMethod: 0,
                methodConflicts: 0,
                excludedEconomicOrCurrency: 0,
                coverage: {
                  localRowsRead: 1,
                  observedPayments: 1,
                  duplicateRowsIgnored: 0,
                  historicalCompleteness: "not_verifiable",
                  transactionalSnapshot: false,
                },
              },
            })
          : Promise.reject(new Error("Falha sintética"));
      }
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    });
    const view = render(<FinanceDashboard refreshKey={0} />);
    expect(await screen.findByText("1 pagamentos")).toBeTruthy();
    view.rerender(<FinanceDashboard refreshKey={1} />);
    expect(
      await screen.findByText(
        /Última leitura válida deste período, desatualizada/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("1 pagamentos")).toBeTruthy();
  });
  it("limite excedido remove a leitura anterior e mostra indisponibilidade", async () => {
    let attempts = 0;
    api.fetch.mockImplementation((path: string) => {
      if (path.startsWith("/finance/summary"))
        return Promise.resolve({
          data: financeFixtureForRequest(fixture(), path),
        });
      if (path.startsWith("/finance/payment-methods")) {
        attempts++;
        return attempts === 1
          ? Promise.resolve({
              data: {
                status: "partial",
                pix: [
                  {
                    currency: "BRL",
                    payments: 1,
                    people: 1,
                    grossCents: 10_000,
                    withoutPerson: 0,
                  },
                ],
                paymentsWithoutMethod: 0,
                methodConflicts: 0,
                excludedEconomicOrCurrency: 0,
                coverage: {
                  localRowsRead: 1,
                  observedPayments: 1,
                  duplicateRowsIgnored: 0,
                  historicalCompleteness: "not_verifiable",
                  transactionalSnapshot: false,
                },
              },
            })
          : Promise.reject(
              new AdminApiError(
                "Limite sintético",
                503,
                "finance_method_scan_limit",
              ),
            );
      }
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    });
    const view = render(<FinanceDashboard refreshKey={0} />);
    expect(await screen.findByText("1 pagamentos")).toBeTruthy();
    view.rerender(<FinanceDashboard refreshKey={1} />);
    expect(
      await screen.findByText("Meios indisponíveis: Limite sintético"),
    ).toBeTruthy();
    expect(screen.queryByText("1 pagamentos")).toBeNull();
  });
  it("abre o extrato Pix com período e filtros na URL", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeMethod=card",
    );
    api.fetch.mockImplementation((path: string) => {
      if (path.startsWith("/finance/summary"))
        return Promise.resolve({
          data: financeFixtureForRequest(fixture(), path),
        });
      if (path.startsWith("/finance/payment-methods"))
        return Promise.resolve({
          data: {
            status: "partial",
            pix: [
              {
                currency: "BRL",
                payments: 3,
                people: 1,
                grossCents: 30_000,
                withoutPerson: 1,
              },
            ],
            paymentsWithoutMethod: 2,
            methodConflicts: 1,
            excludedEconomicOrCurrency: 0,
            coverage: {
              localRowsRead: 5,
              observedPayments: 4,
              duplicateRowsIgnored: 1,
              historicalCompleteness: "not_verifiable",
              transactionalSnapshot: false,
            },
          },
        });
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    });
    render(<FinanceDashboard />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Ver movimentos Pix" }),
    );
    expect(window.location.search).toContain("financeView=transacoes");
    expect(window.location.search).toContain("paymentMethod=pix");
    expect(window.location.search).not.toContain("financeMethod=card");
    expect(window.location.search).toContain("financeType=charge");
    expect(window.location.search).toContain("financeCurrency=BRL");
  });

  it("rotula payout como transferência sem tratá-lo como perda de pagamentos", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes",
    );
    api.fetch.mockImplementation((path: string) =>
      path.startsWith("/finance/summary")
        ? Promise.resolve({ data: financeFixtureForRequest(fixture(), path) })
        : Promise.resolve({
            data: {
              rows: [
                {
                  id: "po-1",
                  provider: "stripe",
                  type: "payout",
                  gross_cents: -9_500,
                  fee_cents: 0,
                  net_cents: -9_500,
                  currency: "BRL",
                  occurred_at: "2026-09-01T12:00:00Z",
                  plan_code: null,
                },
              ],
              total: 1,
              page: 1,
              pageSize: 25,
            },
          }),
    );
    render(<FinanceDashboard view="transactions" />);
    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/finance\/transactions\?/),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getAllByText("Repasse para conta bancária").length,
      ).toBeGreaterThan(1),
    );
    expect(
      screen.getByText(/Transferência entre contas próprias/),
    ).toBeTruthy();
    expect(screen.getByText(/Saída do saldo Stripe/)).toBeTruthy();
  });

  it("restaura Pix e a página da URL após F5 sintético", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes&financeMethod=pix&financePage=2",
    );
    render(<FinanceDashboard view="transactions" />);
    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/finance\/transactions\?.*page=2.*method=pix/),
      ),
    );
    expect(
      (
        screen.getByRole("combobox", {
          name: "Filtrar extrato por meio",
        }) as HTMLSelectElement
      ).value,
    ).toBe("pix");
  });
  it("recusa extrato sem confirmação de filtro durante deployment com backend antigo", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes&paymentMethod=pix",
    );
    render(<FinanceDashboard view="transactions" />);
    expect(
      await screen.findByText("Contrato do extrato financeiro incompatível."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Nenhum movimento local registrado neste filtro."),
    ).toBeNull();
  });
  it("recusa payload truncado mesmo quando o backend declara ter aplicado Pix", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes&paymentMethod=pix",
    );
    api.fetch.mockImplementation((path: string) =>
      path.startsWith("/finance/summary")
        ? Promise.resolve({ data: financeFixtureForRequest(fixture(), path) })
        : Promise.resolve({
            data: {
              rows: [],
              total: 26,
              page: 1,
              pageSize: 25,
              filterContractVersion: 1,
              appliedMethod: "pix",
            },
          }),
    );
    render(<FinanceDashboard view="transactions" />);
    expect(
      await screen.findByText("Contrato do extrato financeiro incompatível."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Nenhum movimento local registrado neste filtro."),
    ).toBeNull();
  });
  it("restaura o filtro de meio ao voltar e avançar no histórico", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes",
    );
    render(<FinanceDashboard view="transactions" />);
    const method = (await screen.findByRole("combobox", {
      name: "Filtrar extrato por meio",
    })) as HTMLSelectElement;
    fireEvent.change(method, { target: { value: "pix" } });
    await waitFor(() => expect(method.value).toBe("pix"));
    window.history.back();
    await waitFor(() => expect(method.value).toBe(""));
    window.history.forward();
    await waitFor(() => expect(method.value).toBe("pix"));
  });

  it("ignora uma resposta Pix obsoleta após troca rápida de período", async () => {
    const pending: Array<(value: unknown) => void> = [];
    api.fetch.mockImplementation((path: string) => {
      if (path.startsWith("/finance/summary"))
        return Promise.resolve({
          data: financeFixtureForRequest(fixture(), path),
        });
      if (path.startsWith("/finance/payment-methods"))
        return new Promise((resolve) => pending.push(resolve));
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    });
    const first = {
      preset: "custom" as const,
      customFrom: "2026-09-01",
      customTo: "2026-09-01",
    };
    const second = {
      preset: "custom" as const,
      customFrom: "2026-09-02",
      customTo: "2026-09-02",
    };
    const view = render(<FinanceDashboard periodFilter={first} />);
    await waitFor(() => expect(pending).toHaveLength(1));
    view.rerender(<FinanceDashboard periodFilter={second} />);
    await waitFor(() => expect(pending).toHaveLength(2));
    const response = (payments: number) => ({
      data: {
        status: "partial",
        pix: [
          {
            currency: "BRL",
            payments,
            people: 1,
            grossCents: payments * 10_000,
            withoutPerson: 0,
          },
        ],
        paymentsWithoutMethod: 0,
        methodConflicts: 0,
        excludedEconomicOrCurrency: 0,
        coverage: {
          localRowsRead: payments,
          observedPayments: payments,
          duplicateRowsIgnored: 0,
          historicalCompleteness: "not_verifiable",
          transactionalSnapshot: false,
        },
      },
    });
    pending[1](response(2));
    expect(await screen.findByText("2 pagamentos")).toBeTruthy();
    pending[0](response(9));
    await waitFor(() => expect(screen.queryByText("9 pagamentos")).toBeNull());
  });
  it("não mostra movimentos antigos durante troca rápida do filtro de meio", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin?section=financeiro&financeView=transacoes",
    );
    const pending: Array<(value: unknown) => void> = [];
    api.fetch.mockImplementation((path: string) =>
      path.startsWith("/finance/summary")
        ? Promise.resolve({ data: financeFixtureForRequest(fixture(), path) })
        : new Promise((resolve) => pending.push(resolve)),
    );
    render(<FinanceDashboard view="transactions" />);
    await waitFor(() => expect(pending).toHaveLength(1));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filtrar extrato por meio" }),
      { target: { value: "pix" } },
    );
    await waitFor(() => expect(pending).toHaveLength(2));
    pending[1]({
      data: {
        rows: [
          {
            id: "pix-1",
            provider: "asaas",
            type: "charge",
            gross_cents: 10_000,
            fee_cents: 0,
            net_cents: 10_000,
            currency: "BRL",
            occurred_at: "2026-09-01T12:00:00Z",
            plan_code: "pro",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 25,
        filterContractVersion: 1,
        appliedMethod: "pix",
      },
    });
    expect(await screen.findByText("Entrada")).toBeTruthy();
    pending[0]({
      data: {
        rows: [
          {
            id: "po-1",
            provider: "stripe",
            type: "payout",
            gross_cents: -9_500,
            fee_cents: 0,
            net_cents: -9_500,
            currency: "BRL",
            occurred_at: "2026-09-01T12:00:00Z",
            plan_code: null,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 25,
      },
    });
    await waitFor(() =>
      expect(
        screen.queryByText(/Transferência entre contas próprias/),
      ).toBeNull(),
    );
    expect(window.location.search).toContain("paymentMethod=pix");
  });
  it("mostra caixa por moeda e separa automático, manual e trial", async () => {
    render(<FinanceDashboard />);
    expect(
      await screen.findByRole("heading", { name: "Caixa registrado" }),
    ).toBeTruthy();
    expect(screen.getByText("Movimentos em BRL")).toBeTruthy();
    expect(screen.getByText("Movimentos em USD")).toBeTruthy();
    expect(screen.getByText("Automáticos ativos")).toBeTruthy();
    expect(screen.getByText("Manuais pré-pagos ativos")).toBeTruthy();
    expect(screen.getByText("Em trial")).toBeTruthy();
    expect(screen.getByText(/Trial não é cliente pagante/)).toBeTruthy();
    fireEvent.click(screen.getByText("Ver exclusões, conflitos e limitações"));
    expect(screen.getByText(/conflito econômico: 1/)).toBeTruthy();
    expect(screen.queryByText("R$ 120,00")).toBeNull();
  });

  it("destaca quatro valores por moeda e move contagens para qualidade dos dados", async () => {
    render(<FinanceDashboard />);
    const brl = await screen.findByText("Movimentos em BRL");
    const grid = brl.closest("div.space-y-3")?.querySelector("div.grid");
    expect(grid?.children).toHaveLength(4);
    expect(grid?.children[0].textContent).toContain(
      "Caixa líquido calculável registrado",
    );
    expect(grid?.textContent).not.toContain("Transações sem pessoa");
    expect(screen.getByText("Pagamentos e qualidade dos dados")).toBeTruthy();
    expect(screen.getByText("Transações excluídas")).toBeTruthy();
    fireEvent.click(screen.getByText("Ver exclusões, conflitos e limitações"));
    expect(
      screen.getByText(/BRL: .* transações aceitas sem pessoa/),
    ).toBeTruthy();
  });

  it("permite consultar Todo histórico local sem converter a janela para 30 dias", async () => {
    render(<FinanceDashboard />);
    fireEvent.click(
      screen.getByRole("button", { name: "Todo histórico local" }),
    );
    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/preset=all&asOfDay=/),
      ),
    );
    expect(
      screen
        .getByRole("button", { name: "Todo histórico local" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("rotula catálogo honestamente e agrupa métricas indisponíveis", async () => {
    render(<FinanceDashboard />);
    expect(
      await screen.findByText("Valores mensais de catálogo em BRL"),
    ).toBeTruthy();
    expect(
      screen.getByText(/não é dinheiro recebido nem obrigação contratual/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Métricas de recorrência ainda indisponíveis",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/MRR contratual · ARR · New MRR/)).toBeTruthy();
    expect(screen.queryByText(/^MRR$/)).toBeNull();
  });

  it("expõe títulos e filtros acessíveis e atualiza somente a leitura local", async () => {
    render(<FinanceDashboard />);
    await screen.findByRole("heading", { name: "Período do financeiro" });
    expect(screen.getByLabelText("Filtros de período")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar leitura local" }),
    );
    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(expect.stringMatching(/fresh=1/)),
    );
    expect(api.fetch.mock.calls.flat().join(" ")).not.toMatch(
      /sync|stripe|asaas/,
    );
  });

  it("falha explicitamente diante de contrato antigo", async () => {
    api.fetch.mockImplementation((path: string) =>
      path.startsWith("/finance/summary")
        ? Promise.resolve({ data: { mrr: 123 } })
        : Promise.resolve({
            data: { rows: [], total: 0, page: 1, pageSize: 25 },
          }),
    );
    render(<FinanceDashboard />);
    expect(
      await screen.findByText(/Contrato financeiro v1 incompatível/),
    ).toBeTruthy();
    expect(screen.queryByText("R$ 0,00")).toBeNull();
  });

  it("nomeia fonte não coletada sem desenhar zero financeiro", async () => {
    const empty = fixture();
    empty.cash = {
      ...empty.cash,
      status: "partial",
      coverage: {
        ...empty.cash.coverage,
        localRowsRead: 0,
        canonicalTransactions: 0,
        paymentIdentitiesFromAdm001: 0,
      },
      freshness: null,
      currencies: [],
      registeredPayments: count(0),
      registeredPaymentPeople: count(0),
      registeredPaymentsWithoutPerson: count(0),
      excludedTransactions: {
        ...empty.cash.excludedTransactions,
        status: "partial",
        value: 0,
        freshness: null,
      },
      conflictingIdentities: {
        ...empty.cash.conflictingIdentities,
        status: "partial",
        value: 0,
        freshness: null,
      },
    };
    api.fetch.mockImplementation((path: string) =>
      path.startsWith("/finance/summary")
        ? Promise.resolve({ data: financeFixtureForRequest(empty, path) })
        : Promise.resolve({
            data: { rows: [], total: 0, page: 1, pageSize: 25 },
          }),
    );
    render(<FinanceDashboard />);
    expect(
      await screen.findByText(
        "Consulta local concluída sem movimentos agregáveis",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/Nenhum card monetário é fabricado como zero/),
    ).toBeTruthy();
    expect(screen.queryByText("R$ 0,00")).toBeNull();
  });

  it("não oferece filtro de provedor limitado à página como se fosse global", async () => {
    render(<FinanceDashboard view="transactions" />);
    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/finance/transactions?"),
      ),
    );
    expect(screen.queryByRole("combobox", { name: /provedor/i })).toBeNull();
    expect(api.fetch.mock.calls.flat().join(" ")).not.toContain("provider=");
  });
});
