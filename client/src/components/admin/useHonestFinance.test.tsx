import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import financeFixture from "../../../../docs/investigacoes/2026-09-14-adm-004-p1-1-exemplo-sintetico.json";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import {
  clearHonestFinanceClientCacheForTests,
  useHonestFinance,
} from "./useHonestFinance";

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

beforeEach(() => {
  clearHonestFinanceClientCacheForTests();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ data: financeFixture });
});

afterEach(cleanup);

describe("useHonestFinance", () => {
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
      .mockResolvedValueOnce({ data: financeFixture })
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
    const newer = structuredClone(financeFixture);
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
    resolveOld({ data: financeFixture });
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
    fetchMock.mockResolvedValueOnce({ data: financeFixture });
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
    resolveOld({ data: financeFixture });
    await Promise.resolve();

    render(<Probe name="nova" />);
    expect(await screen.findByText("1", { selector: "output" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
