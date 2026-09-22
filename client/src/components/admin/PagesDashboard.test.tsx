import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({ adminFetch: api.fetch }));

import { PagesDashboard, computeRange } from "./PagesDashboard";

function periodOf(path: string) {
  const params = new URLSearchParams(path.split("?")[1]);
  return {
    from: params.get("from")!,
    to: params.get("to")!,
    timezone: "UTC" as const,
  };
}
function result(path: string, page = "/curso", views = 10) {
  return {
    data: {
      state: "ok",
      hasData: views > 0,
      stats: {
        totalPageviews: views,
        pages: views
          ? [
              {
                page,
                views,
                avgTimeSeconds: null,
                avgScrollPercent: null,
                exitRatePercent: null,
              },
            ]
          : [],
      },
      period: periodOf(path),
      computedAt: "2026-09-15T12:00:00.000Z",
      availability: {
        pages: { state: "available" },
        timeScroll: { state: "available" },
        exitRate: { state: "available" },
      },
      coverage: {
        pages: "top_10",
        timeAndScroll: "$pageleave",
        exitRate: "session_last_page",
        complete: true,
      },
    },
  };
}
function partial(path: string, group: "timeScroll" | "exitRate") {
  const response = result(path);
  response.data.availability[group] = {
    state: "unavailable",
    failures: [
      {
        query: group === "timeScroll" ? "pageleave" : "exit_sessions",
        code: "timeout",
      },
    ],
  } as never;
  response.data.coverage.complete = false;
  return response;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(() => api.fetch.mockReset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Páginas recuperadas", () => {
  it("períodos UTC incluem o último dia escolhido e excluem o seguinte", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-09-15T15:00:00.000Z"));
      expect(computeRange("current_month", "", "")).toMatchObject({
        from: "2026-09-01T00:00:00.000Z",
        to: "2026-09-16T00:00:00.000Z",
      });
      expect(computeRange("last_3", "", "")).toMatchObject({
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-09-16T00:00:00.000Z",
      });
      expect(computeRange("last_12", "", "")).toMatchObject({
        from: "2025-10-01T00:00:00.000Z",
        to: "2026-09-16T00:00:00.000Z",
      });
      expect(computeRange("custom", "2026-09-15", "2026-09-15")).toMatchObject({
        from: "2026-09-15T00:00:00.000Z",
        to: "2026-09-16T00:00:00.000Z",
      });
      expect(computeRange("custom", "2026-09-15", "2026-09-16")).toMatchObject({
        to: "2026-09-17T00:00:00.000Z",
      });
    } finally {
      vi.useRealTimers();
    }
  });
  it("mostra uma indicação por grupo e mantém páginas e pageviews", async () => {
    api.fetch.mockImplementationOnce(async (path: string) =>
      partial(path, "timeScroll"),
    );
    api.fetch.mockImplementationOnce(async (path: string) =>
      partial(path, "exitRate"),
    );
    render(<PagesDashboard />);
    await screen.findByText("/curso");
    expect(screen.getByText(/Tempo e scroll indisponíveis/)).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByText(/Taxa de saída indisponível/);
    expect(screen.getByText("/curso")).toBeTruthy();
    expect(screen.queryByText(/Tempo e scroll indisponíveis/)).toBeNull();
  });

  it("consulta principal indisponível preserva dados anteriores do mesmo período", async () => {
    api.fetch.mockImplementationOnce(async (path: string) => result(path));
    api.fetch.mockImplementationOnce(async (path: string) => ({
      data: {
        state: "error",
        reason: "Falha ao consultar páginas e visualizações.",
        code: "posthog_pages_core_unavailable",
        failures: [{ query: "pages", code: "timeout" }],
        period: periodOf(path),
      },
    }));
    render(<PagesDashboard />);
    await screen.findByText("/curso");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await screen.findByText(/Dados anteriores/);
    expect(screen.getByText("/curso")).toBeTruthy();
    expect(screen.getByText(/Falha ao consultar o PostHog/)).toBeTruthy();
  });
  it("exibe resultado válido, null comportamental e período UTC, sem inferir zero", async () => {
    api.fetch.mockImplementation(async (path: string) => result(path));
    render(<PagesDashboard />);
    expect(screen.getByText("Carregando dados...")).toBeTruthy();
    expect(await screen.findByText("/curso")).toBeTruthy();
    expect(screen.getAllByText("sem dado")).toHaveLength(3);
    expect(screen.getByText(/Período UTC:/)).toBeTruthy();
    expect(api.fetch.mock.calls[0][0]).toContain("/posthog-pages?");
  });

  it("refresh preserva apenas resultado do mesmo período, com horário e badge desatualizado", async () => {
    const refresh = deferred<ReturnType<typeof result>>();
    api.fetch.mockImplementationOnce(async (path: string) => result(path));
    api.fetch.mockImplementationOnce(() => refresh.promise);
    render(<PagesDashboard />);
    await screen.findByText("/curso");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(
      await screen.findByText(/Dados anteriores, calculados em/),
    ).toBeTruthy();
    expect(screen.getByText("/curso")).toBeTruthy();
    expect(api.fetch.mock.calls[1][0]).toContain("refresh=1");
    await act(async () =>
      refresh.resolve(result(api.fetch.mock.calls[1][0], "/novo")),
    );
    await screen.findByText("/novo");
    expect(screen.queryByText(/Dados anteriores/)).toBeNull();
  });

  it("timeout mostra erro e retry; falha de refresh preserva dados anteriores", async () => {
    api.fetch.mockImplementationOnce(async (path: string) => result(path));
    api.fetch.mockRejectedValueOnce(new Error("Consulta pages excedeu prazo."));
    api.fetch.mockImplementationOnce(async (path: string) =>
      result(path, "/recuperada"),
    );
    render(<PagesDashboard />);
    await screen.findByText("/curso");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
    expect(screen.getByText(/Dados anteriores/)).toBeTruthy();
    expect(screen.getByText("/curso")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByText("/recuperada");
    expect(screen.queryByText(/Dados anteriores/)).toBeNull();
  });

  it("backend antigo ou payload parcial é indisponível e nunca zero", async () => {
    api.fetch.mockRejectedValueOnce(
      Object.assign(new Error("404"), { status: 404 }),
    );
    api.fetch.mockResolvedValueOnce({
      data: {
        state: "ok",
        hasData: false,
        stats: { totalPageviews: 0, pages: [] },
      },
    });
    render(<PagesDashboard />);
    expect(
      await screen.findByText(/indisponível nesta versão do servidor/),
    ).toBeTruthy();
    expect(screen.queryByText(/Sem pageviews/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/incompatível/)).toBeTruthy();
    expect(screen.queryByText(/Sem pageviews/)).toBeNull();
  });

  it("payload com cobertura contraditória não inventa métricas", async () => {
    api.fetch.mockImplementationOnce(async (path: string) => {
      const response = result(path);
      response.data.availability.timeScroll = {
        state: "available",
        failures: [{ query: "pageleave", code: "timeout" }],
      } as never;
      return response;
    });
    render(<PagesDashboard />);
    expect(await screen.findByText(/incompatível/)).toBeTruthy();
    expect(screen.queryByText("/curso")).toBeNull();
  });

  it("resposta válida vazia é zero legítimo; not_configured segue separado", async () => {
    api.fetch.mockImplementationOnce(async (path: string) =>
      result(path, "/nada", 0),
    );
    api.fetch.mockImplementationOnce(async (path: string) => ({
      data: {
        state: "not_configured",
        missing: ["POSTHOG_API_KEY"],
        period: periodOf(path),
      },
    }));
    render(<PagesDashboard />);
    expect(await screen.findByText(/Sem pageviews neste período/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(await screen.findByText(/PostHog não configurado/)).toBeTruthy();
    expect(screen.queryByText(/Falha ao consultar/)).toBeNull();
  });

  it("troca rápida de período aborta o fetch anterior e ignora resposta obsoleta", async () => {
    const first = deferred<ReturnType<typeof result>>();
    api.fetch.mockImplementationOnce(() => first.promise);
    api.fetch.mockImplementationOnce(async (path: string) =>
      result(path, "/mes-atual"),
    );
    render(<PagesDashboard />);
    await waitFor(() => expect(api.fetch).toHaveBeenCalledTimes(1));
    const oldSignal = (api.fetch.mock.calls[0][1] as RequestInit).signal;
    fireEvent.click(screen.getByRole("button", { name: "Mês atual" }));
    await screen.findByText("/mes-atual");
    expect(oldSignal?.aborted).toBe(true);
    await act(async () =>
      first.resolve(result(api.fetch.mock.calls[0][0], "/obsoleta")),
    );
    expect(screen.queryByText("/obsoleta")).toBeNull();
  });

  it("desmontagem cancela o fetch em andamento", async () => {
    const pending = deferred<ReturnType<typeof result>>();
    api.fetch.mockImplementationOnce(() => pending.promise);
    const view = render(<PagesDashboard />);
    await waitFor(() => expect(api.fetch).toHaveBeenCalledTimes(1));
    const signal = (api.fetch.mock.calls[0][1] as RequestInit).signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.resolve(result(api.fetch.mock.calls[0][0])));
  });
});
