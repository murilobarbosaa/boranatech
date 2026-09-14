import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useCreator: os tres estados, o cache por sessao e a retentativa unica.
 *
 * O ponto que o teste existe para travar e o NEGATIVO: erro de infraestrutura
 * nunca vira `kind: null`. Os dois escondem o botao, mas `null` e uma
 * afirmacao do servidor ("nao e creator") e `error` e ausencia de resposta.
 */

const estado = vi.hoisted(() => ({
  user: null as null | { id: string },
  fetch: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: estado.user }),
}));
vi.mock("@/lib/adminApi", () => ({
  contentFetch: (...args: unknown[]) => estado.fetch(...args),
}));

import { resetCreatorStatus, useCreator } from "./useCreator";

async function drenar(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  estado.user = null;
  estado.fetch = vi.fn();
  resetCreatorStatus();
});

afterEach(() => {
  vi.useRealTimers();
  resetCreatorStatus();
});

describe("useCreator", () => {
  it("sem sessao: ready com kind null e nenhuma chamada", () => {
    const { result } = renderHook(() => useCreator());
    expect(result.current).toEqual({ status: "ready", kind: null });
    expect(estado.fetch).not.toHaveBeenCalled();
  });

  it("afiliado: uma chamada ao status e ready com kind afiliado", async () => {
    estado.user = { id: "u1" };
    estado.fetch = vi.fn(async () => ({ data: { kind: "afiliado" } }));
    const { result } = renderHook(() => useCreator());
    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", kind: "afiliado" }),
    );
    expect(estado.fetch).toHaveBeenCalledTimes(1);
    expect(estado.fetch).toHaveBeenCalledWith("/creator/status");
  });

  it("remontar na mesma sessao nao chama de novo", async () => {
    estado.user = { id: "u1" };
    estado.fetch = vi.fn(async () => ({ data: { kind: "influencer" } }));
    const primeiro = renderHook(() => useCreator());
    await waitFor(() =>
      expect(primeiro.result.current).toEqual({
        status: "ready",
        kind: "influencer",
      }),
    );
    primeiro.unmount();

    const segundo = renderHook(() => useCreator());
    expect(segundo.result.current).toEqual({
      status: "ready",
      kind: "influencer",
    });
    expect(estado.fetch).toHaveBeenCalledTimes(1);
  });

  it("503: error e nunca null, com UMA retentativa depois de 5s e so uma", async () => {
    vi.useFakeTimers();
    estado.user = { id: "u1" };
    estado.fetch = vi.fn(async () => {
      throw new Error("Erro 503");
    });
    const { result } = renderHook(() => useCreator());
    await drenar();
    expect(result.current).toEqual({ status: "error" });
    expect(estado.fetch).toHaveBeenCalledTimes(1);

    await drenar(4_999);
    expect(estado.fetch).toHaveBeenCalledTimes(1);

    await drenar(1);
    expect(estado.fetch).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ status: "error" });

    await drenar(60_000);
    expect(estado.fetch).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ status: "error" });
  });

  it("a retentativa que acerta vira ready", async () => {
    vi.useFakeTimers();
    estado.user = { id: "u1" };
    estado.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Erro 503"))
      .mockResolvedValueOnce({ data: { kind: "afiliado" } });
    const { result } = renderHook(() => useCreator());
    await drenar();
    expect(result.current).toEqual({ status: "error" });
    await drenar(5_000);
    expect(result.current).toEqual({ status: "ready", kind: "afiliado" });
    expect(estado.fetch).toHaveBeenCalledTimes(2);
  });

  it("kind que o bundle nao conhece vira error, nao null", async () => {
    vi.useFakeTimers();
    estado.user = { id: "u1" };
    estado.fetch = vi.fn(async () => ({ data: { kind: "embaixador" } }));
    const { result } = renderHook(() => useCreator());
    await drenar();
    expect(result.current).toEqual({ status: "error" });
  });

  it("logout volta a ready/null; outra conta faz a chamada de novo", async () => {
    estado.user = { id: "u1" };
    estado.fetch = vi.fn(async () => ({ data: { kind: "afiliado" } }));
    const { result, rerender } = renderHook(() => useCreator());
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", kind: "afiliado" }),
    );

    estado.user = null;
    rerender();
    expect(result.current).toEqual({ status: "ready", kind: null });

    estado.user = { id: "u2" };
    estado.fetch = vi.fn(async () => ({ data: { kind: null } }));
    rerender();
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", kind: null }),
    );
    expect(estado.fetch).toHaveBeenCalledTimes(1);
  });
});
