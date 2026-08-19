import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLinkedinImprovementProgress } from "./useLinkedinImprovementProgress";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const EMPTY: {
  applied: number[];
  progressAvailable: boolean;
  revision: number;
} = {
  applied: [],
  progressAvailable: true,
  revision: 1,
};

describe("progresso LinkedIn por geração", () => {
  it("não envia PUT antes de o servidor estabelecer a revisão", async () => {
    const get = deferred<typeof EMPTY>();
    const load = vi.fn(() => get.promise);
    const save = vi.fn(
      async (
        _analysisId: string,
        _index: number,
        _done: boolean,
        _revision: number,
      ) => undefined,
    );
    const { result } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 2,
        sessionIdentity: "open-a",
        load,
        save,
      }),
    );

    expect(result.current.initialLoaded).toBe(false);
    act(() => result.current.toggle(0));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.applied.has(0)).toBe(false);

    await act(async () => get.resolve(EMPTY));
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));
    act(() => result.current.toggle(0));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(result.current.applied.has(0)).toBe(true);
    expect(result.current.confirmed.has(0)).toBe(true);
    expect(save.mock.calls[0]?.[3]).toBe(1);
  });

  it("resposta de analysis A não altera analysis B", async () => {
    const gets = new Map([
      ["analysis-a", deferred<typeof EMPTY>()],
      ["analysis-b", deferred<typeof EMPTY>()],
    ]);
    const load = vi.fn((id: string) => gets.get(id)!.promise);
    const save = vi.fn(async () => undefined);
    const { result, rerender } = renderHook(
      (props: { id: string; session: object }) =>
        useLinkedinImprovementProgress({
          analysisId: props.id,
          total: 2,
          sessionIdentity: props.session,
          load,
          save,
        }),
      { initialProps: { id: "analysis-a", session: {} } },
    );

    rerender({ id: "analysis-b", session: {} });
    await act(async () =>
      gets.get("analysis-b")!.resolve({
        applied: [1],
        progressAvailable: true,
        revision: 2,
      }),
    );
    await waitFor(() => expect(result.current.applied.has(1)).toBe(true));

    await act(async () =>
      gets.get("analysis-a")!.resolve({
        applied: [0],
        progressAvailable: true,
        revision: 1,
      }),
    );
    expect(Array.from(result.current.applied)).toEqual([1]);
  });

  it("reabrir a mesma analysisId invalida a geração anterior", async () => {
    const first = deferred<typeof EMPTY>();
    const second = deferred<typeof EMPTY>();
    const load = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const save = vi.fn(async () => undefined);
    const { result, rerender } = renderHook(
      (props: { session: object }) =>
        useLinkedinImprovementProgress({
          analysisId: "same-analysis",
          total: 2,
          sessionIdentity: props.session,
          load,
          save,
        }),
      { initialProps: { session: {} } },
    );

    rerender({ session: {} });
    await act(async () =>
      second.resolve({ applied: [1], progressAvailable: true, revision: 2 }),
    );
    await waitFor(() => expect(result.current.applied.has(1)).toBe(true));
    await act(async () =>
      first.resolve({ applied: [0], progressAvailable: true, revision: 1 }),
    );
    expect(Array.from(result.current.applied)).toEqual([1]);
  });

  it("unmount aborta a sessão e resolução tardia não atualiza estado", async () => {
    const get = deferred<typeof EMPTY>();
    let signal: AbortSignal | undefined;
    const load = vi.fn((_id: string, received?: AbortSignal) => {
      signal = received;
      return get.promise;
    });
    const { unmount } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 1,
        sessionIdentity: "open-a",
        load,
      }),
    );
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => get.resolve(EMPTY));
  });

  it("PUT lento seguido de outro PUT mantém a última intenção", async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const save = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const load = vi.fn(async () => EMPTY);
    const { result } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 1,
        sessionIdentity: "open-a",
        load,
        save,
      }),
    );
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));

    act(() => result.current.toggle(0));
    act(() => result.current.toggle(0));
    expect(result.current.applied.has(0)).toBe(false);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));

    await act(async () => first.resolve());
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    await act(async () => second.resolve());
    await waitFor(() => expect(result.current.confirmed.has(0)).toBe(false));
    expect(save.mock.calls.map((call) => call[2])).toEqual([true, false]);
    expect(result.current.applied.has(0)).toBe(false);
  });

  it("falha tardia de um índice não restaura intenção posterior de outro", async () => {
    const first = deferred<void>();
    const save = vi.fn((_: string, index: number) =>
      index === 0 ? first.promise : Promise.resolve(),
    );
    const load = vi.fn(async () => EMPTY);
    const { result } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 2,
        sessionIdentity: "open-a",
        load,
        save,
      }),
    );
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));
    act(() => result.current.toggle(0));
    act(() => result.current.toggle(1));
    await waitFor(() => expect(result.current.confirmed.has(1)).toBe(true));

    await act(async () => first.reject(new Error("falha A")));
    await waitFor(() => expect(result.current.progressError).not.toBe(""));
    expect(result.current.applied.has(0)).toBe(false);
    expect(result.current.applied.has(1)).toBe(true);
  });

  it("duas falhas consecutivas preservam o último estado confirmado", async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const save = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const load = vi.fn(async () => EMPTY);
    const { result } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 1,
        sessionIdentity: "open-a",
        load,
        save,
      }),
    );
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));
    act(() => result.current.toggle(0));
    act(() => result.current.toggle(0));

    await act(async () => first.reject(new Error("falha 1")));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    await act(async () => second.reject(new Error("falha 2")));
    await waitFor(() => expect(result.current.progressError).not.toBe(""));
    expect(result.current.confirmed.has(0)).toBe(false);
    expect(result.current.applied.has(0)).toBe(false);
  });

  it("409 stale busca uma revisão nova e informa o estado reconciliado", async () => {
    const saveResult = deferred<void>();
    const load = vi.fn().mockResolvedValueOnce(EMPTY).mockResolvedValueOnce({
      applied: [],
      progressAvailable: true,
      revision: 2,
    });
    const save = vi.fn(() => saveResult.promise);
    const { result } = renderHook(() =>
      useLinkedinImprovementProgress({
        analysisId: "analysis-a",
        total: 1,
        sessionIdentity: "open-a",
        load,
        save,
      }),
    );
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));

    act(() => result.current.toggle(0));
    expect(result.current.applied.has(0)).toBe(true);
    await act(async () =>
      saveResult.reject(new Error("STALE_PROGRESS_REVISION")),
    );

    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.applied.has(0)).toBe(false));
    expect(result.current.progressError).toContain("sessão mais recente");
  });
});
