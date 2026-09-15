import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import financeFixture from "../../../../docs/investigacoes/2026-09-14-adm-004-p1-1-exemplo-sintetico.json";
import type { AdminFinanceContract } from "@shared/adminFinance";
import { MAX_FINANCE_HISTORY_DAYS } from "@shared/adminFinance";
import { inicioDoDiaBrasilia } from "@shared/brasiliaDay";
import { financeFixtureForRequest } from "./financeFixtureForRequest.testUtils";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import {
  clearHonestFinanceClientCacheForTests,
  honestFinanceParams,
  useHonestFinance,
} from "./useHonestFinance";

function fixtureFor(from = "2026-08-15", to = "2026-09-13") {
  return financeFixtureForRequest(
    financeFixture as AdminFinanceContract,
    `/finance/summary?contract=honest-v1&preset=custom&fromDay=${from}&toDay=${to}`,
  );
}

function Probe({
  name,
  from = "2026-08-15",
  to = "2026-09-13",
}: {
  name: string;
  from?: string;
  to?: string;
}) {
  const result = useHonestFinance({
    preset: "custom",
    customFrom: from,
    customTo: to,
  });
  return (
    <output aria-label={name} data-computed-at={result.data?.computedAt}>
      {result.data
        ? result.data.contractVersion
        : result.loading
          ? "loading"
          : "error"}
    </output>
  );
}

function RefreshProbe({ refreshKey }: { refreshKey: number }) {
  const result = useHonestFinance(
    {
      preset: "custom",
      customFrom: "2026-08-15",
      customTo: "2026-09-13",
    },
    { refreshKey },
  );
  return (
    <output aria-label="refresh">
      {result.data?.contractVersion ?? "sem dado"} · {result.error ?? "ok"}
    </output>
  );
}

function AllProbe({ asOfDay }: { asOfDay: string }) {
  const result = useHonestFinance({ preset: "all", asOfDay });
  return (
    <output aria-label="histórico">
      {result.data?.cash.currencies[0]?.calculableNet.valueCents ??
        (result.error ? "erro" : "carregando")}
    </output>
  );
}

beforeEach(() => {
  clearHonestFinanceClientCacheForTests();
  fetchMock.mockReset();
  fetchMock.mockImplementation((path: string) =>
    Promise.resolve({
      data: financeFixtureForRequest(
        financeFixture as AdminFinanceContract,
        path,
      ),
    }),
  );
});

afterEach(cleanup);

describe("useHonestFinance", () => {
  it("distingue o dia real de referência do histórico completo na chave", () => {
    const before = honestFinanceParams({
      preset: "all",
      asOfDay: "2026-09-14",
    })?.toString();
    const after = honestFinanceParams({
      preset: "all",
      asOfDay: "2026-09-15",
    })?.toString();
    expect(before).toContain("asOfDay=2026-09-14");
    expect(after).toContain("asOfDay=2026-09-15");
    expect(before).not.toBe(after);
  });

  it("aceita agregado histórico acima do limite sem série diária e muda de dia sem cache antigo", async () => {
    fetchMock.mockImplementation((path: string) => {
      const fixture = financeFixtureForRequest(
        financeFixture as AdminFinanceContract,
        path,
      );
      fixture.period.startDay = "2010-01-01";
      fixture.period.from = inicioDoDiaBrasilia("2010-01-01");
      fixture.cash.seriesDetail = {
        status: "unavailable",
        reason: "daily_limit_exceeded",
        maxDailyPoints: MAX_FINANCE_HISTORY_DAYS,
      };
      for (const bucket of fixture.cash.currencies) bucket.series = [];
      return Promise.resolve({ data: fixture });
    });
    const firstDay = "2026-09-14";
    const rendered = render(<AllProbe asOfDay={firstDay} />);
    await waitFor(() =>
      expect(screen.getByLabelText("histórico").textContent).toBe("8500"),
    );
    rendered.rerender(<AllProbe asOfDay="2026-09-15" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toContain(`asOfDay=${firstDay}`);
    expect(fetchMock.mock.calls[1][0]).toContain("asOfDay=2026-09-15");
  });

  it("rejeita resposta válida para um período diferente, sem exibir valor antigo", async () => {
    fetchMock.mockResolvedValueOnce({
      data: fixtureFor("2026-08-16", "2026-09-13"),
    });
    render(<Probe name="janela" />);
    expect(
      await screen.findByText("error", { selector: "output" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("janela").dataset.computedAt).toBeUndefined();
  });

  it("compartilha a requisição em andamento para a mesma janela", async () => {
    render(
      <>
        <Probe name="visão" />
        <Probe name="financeiro" />
      </>,
    );

    expect(
      await screen.findAllByText("1", { selector: "output" }),
    ).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("faz refresh write-through e preserva o dado anterior se ele falhar", async () => {
    fetchMock
      .mockResolvedValueOnce({ data: fixtureFor() })
      .mockRejectedValueOnce(new Error("refresh indisponível"));
    const rendered = render(<RefreshProbe refreshKey={0} />);
    expect(await screen.findByText("1 · ok")).toBeTruthy();

    rendered.rerender(<RefreshProbe refreshKey={1} />);
    await waitFor(() =>
      expect(screen.getByLabelText("refresh").textContent).toContain(
        "refresh indisponível",
      ),
    );
    expect(screen.getByLabelText("refresh").textContent).toContain("1 ·");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("inclui a janela integral na chave e nunca reutiliza períodos diferentes", async () => {
    const rendered = render(<Probe name="janela" />);
    await screen.findByText("1", { selector: "output" });
    rendered.rerender(
      <Probe name="janela" from="2026-07-01" to="2026-07-31" />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toContain("fromDay=2026-08-15");
    expect(fetchMock.mock.calls[0][0]).toContain("toDay=2026-09-13");
    expect(fetchMock.mock.calls[1][0]).toContain("fromDay=2026-07-01");
    expect(fetchMock.mock.calls[1][0]).toContain("toDay=2026-07-31");
  });

  it("não deixa uma resposta antiga sobrescrever o período atual", async () => {
    let resolveOld!: (value: unknown) => void;
    const oldRequest = new Promise((resolve) => {
      resolveOld = resolve;
    });
    const newer = fixtureFor("2026-07-01", "2026-07-31");
    newer.computedAt = "2026-09-14T13:00:00.000Z";
    fetchMock
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce({ data: newer });

    const rendered = render(<Probe name="janela" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rendered.rerender(
      <Probe name="janela" from="2026-07-01" to="2026-07-31" />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("janela").dataset.computedAt).toBe(
        "2026-09-14T13:00:00.000Z",
      ),
    );
    resolveOld({ data: fixtureFor() });
    await waitFor(() =>
      expect(screen.getByLabelText("janela").dataset.computedAt).toBe(
        "2026-09-14T13:00:00.000Z",
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("permite nova leitura depois de falha sem contaminar o cache", async () => {
    fetchMock.mockRejectedValueOnce(new Error("falha transitória"));
    const first = render(<Probe name="primeira" />);
    expect(
      await screen.findByText("error", { selector: "output" }),
    ).toBeTruthy();
    first.unmount();
    fetchMock.mockResolvedValueOnce({ data: fixtureFor() });
    render(<Probe name="segunda" />);
    expect(await screen.findByText("1", { selector: "output" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não deixa promessa anterior repopular um cache invalidado", async () => {
    let resolveOld!: (value: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    const old = render(<Probe name="antiga" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    old.unmount();
    clearHonestFinanceClientCacheForTests();
    resolveOld({ data: fixtureFor() });
    await Promise.resolve();

    render(<Probe name="nova" />);
    expect(await screen.findByText("1", { selector: "output" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
