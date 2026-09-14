import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AttentionContractV3 } from "@shared/adminAttention";
import { ATTENTION_SOURCE_IDS } from "@shared/adminAttention";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { ATTENTION_REFRESH_MS, useAttentionData } from "./useAttentionData";

const valid: AttentionContractV3 = {
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
    detail: "fonte declarada",
  })),
  coverage: {
    completeHistoryVerified: false,
    transactionalSnapshot: false,
    limitations: ["Sem snapshot."],
  },
};

beforeEach(() => fetchMock.mockReset());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useAttentionData", () => {
  it("polls only while the overview is active and refetches when returning", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({ data: valid });
    const { rerender, unmount } = renderHook(
      ({ active }) => useAttentionData(active),
      { initialProps: { active: false } },
    );
    expect(fetchMock).not.toHaveBeenCalled();
    rerender({ active: true });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/attention?contract=3");
    await act(async () => vi.advanceTimersByTime(ATTENTION_REFRESH_MS));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/attention?contract=3&refresh=1",
    );
    rerender({ active: false });
    await act(async () => vi.advanceTimersByTime(ATTENTION_REFRESH_MS * 2));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    rerender({ active: true });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/attention?contract=3&refresh=1",
    );
    unmount();
    await act(async () => vi.advanceTimersByTime(ATTENTION_REFRESH_MS));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("prevents concurrent refreshes and rejects incompatible payloads", async () => {
    fetchMock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { data: { contractVersion: 3 } };
    });
    const { result } = renderHook(() => useAttentionData(true));
    act(() => {
      void result.current.refresh();
      void result.current.refresh();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(result.current.error).toContain("Resposta incompatível"),
    );
    expect(result.current.data).toBeNull();
  });

  it("uses a real refresh for the manual button after the initial load", async () => {
    fetchMock.mockResolvedValue({ data: valid });
    const { result } = renderHook(() => useAttentionData(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => void (await result.current.refresh()));
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/attention?contract=3");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/attention?contract=3&refresh=1",
    );
  });

  it("rejects a missing source inventory instead of rendering a green empty state", async () => {
    fetchMock.mockResolvedValue({ data: { ...valid, sources: [] } });
    const { result } = renderHook(() => useAttentionData(true));
    await waitFor(() =>
      expect(result.current.error).toContain("Resposta incompatível"),
    );
    expect(result.current.data).toBeNull();
  });
});
