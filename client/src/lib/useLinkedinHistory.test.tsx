import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LinkedinAnalysisSummary } from "@shared/linkedin/schema";
import { useLinkedinHistory } from "./useLinkedinHistory";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function analysis(id: string, score: number): LinkedinAnalysisSummary {
  return {
    id,
    area: "frontend",
    level: "junior",
    score,
    faixa: score >= 70 ? "forte" : "em-construcao",
    created_at: "2026-08-15T12:00:00Z",
  };
}

describe("histórico LinkedIn com generation compartilhada", () => {
  it("A inicia, B resolve e A tardia não sobrescreve state/ref de B", async () => {
    const a = deferred<LinkedinAnalysisSummary[]>();
    const b = deferred<LinkedinAnalysisSummary[]>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => a.promise)
      .mockImplementationOnce(() => b.promise);
    const { result } = renderHook(() =>
      useLinkedinHistory({ enabled: true, load }),
    );
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));

    act(() => {
      void result.current.refreshLinkedinHistory({ showLoading: false });
    });
    await act(async () => b.resolve([analysis("new", 80)]));
    await waitFor(() => expect(result.current.analyses[0]?.id).toBe("new"));
    await act(async () => a.resolve([analysis("old", 40)]));

    expect(result.current.analyses.map((item) => item.id)).toEqual(["new"]);
    expect(result.current.analysesRef.current).toBe(result.current.analyses);
  });

  it("sucesso de B não é substituído por erro tardio de A", async () => {
    const a = deferred<LinkedinAnalysisSummary[]>();
    const b = deferred<LinkedinAnalysisSummary[]>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => a.promise)
      .mockImplementationOnce(() => b.promise);
    const { result } = renderHook(() =>
      useLinkedinHistory({ enabled: true, load }),
    );
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    act(() => {
      void result.current.refreshLinkedinHistory({ showLoading: false });
    });
    await act(async () => b.resolve([analysis("new", 80)]));
    await act(async () => a.reject(new Error("falha tardia")));

    expect(result.current.historyStatus).toBe("success_with_data");
    expect(result.current.analyses[0]?.id).toBe("new");
  });

  it("erro de A seguido de sucesso de B termina em B", async () => {
    const a = deferred<LinkedinAnalysisSummary[]>();
    const b = deferred<LinkedinAnalysisSummary[]>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => a.promise)
      .mockImplementationOnce(() => b.promise);
    const { result } = renderHook(() =>
      useLinkedinHistory({ enabled: true, load }),
    );
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    act(() => {
      void result.current.refreshLinkedinHistory();
    });
    await act(async () => a.reject(new Error("falha A")));
    await act(async () => b.resolve([analysis("new", 80)]));

    expect(result.current.historyStatus).toBe("success_with_data");
    expect(result.current.analyses[0]?.id).toBe("new");
  });

  it("unmount aborta e resposta tardia não atualiza state/ref", async () => {
    const pending = deferred<LinkedinAnalysisSummary[]>();
    let signal: AbortSignal | undefined;
    const load = vi.fn((received?: AbortSignal) => {
      signal = received;
      return pending.promise;
    });
    const { result, unmount } = renderHook(() =>
      useLinkedinHistory({ enabled: true, load }),
    );
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    const analysesRef = result.current.analysesRef;

    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => pending.resolve([analysis("late", 90)]));
    expect(analysesRef.current).toEqual([]);
  });

  it("refresh pós-análise publica o mesmo valor em state e analysesRef", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce([analysis("old", 40)])
      .mockResolvedValueOnce([analysis("new", 80), analysis("old", 40)]);
    const { result } = renderHook(() =>
      useLinkedinHistory({ enabled: true, load }),
    );
    await waitFor(() => expect(result.current.analyses[0]?.id).toBe("old"));

    await act(async () => {
      await result.current.refreshLinkedinHistory({ showLoading: false });
    });

    expect(result.current.analyses.map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
    expect(result.current.analysesRef.current).toBe(result.current.analyses);
  });
});
