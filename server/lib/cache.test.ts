import { beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    connection: {
      get: vi.fn(async (key: string) => values.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        values.set(key, value);
        return "OK";
      }),
    },
  };
});

vi.mock("./redis", () => ({ cacheConnection: redis.connection }));

import { getOrCompute } from "./cache";

describe("cache write-through", () => {
  beforeEach(() => {
    redis.values.clear();
    vi.clearAllMocks();
  });

  it("preserva o valor anterior quando o refresh falha", async () => {
    redis.values.set("finance:v1", JSON.stringify({ contractVersion: 1 }));

    await expect(
      getOrCompute(
        "finance:v1",
        60,
        async () => {
          throw new Error("recomputação falhou");
        },
        { refresh: true },
      ),
    ).rejects.toThrow("recomputação falhou");

    expect(redis.values.get("finance:v1")).toBe(
      JSON.stringify({ contractVersion: 1 }),
    );
    expect(redis.connection.set).not.toHaveBeenCalled();
  });

  it("substitui o valor somente depois de recomputação bem-sucedida", async () => {
    redis.values.set("finance:v1", JSON.stringify({ old: true }));
    await getOrCompute("finance:v1", 60, async () => ({ fresh: true }), {
      refresh: true,
    });
    await vi.waitFor(() => expect(redis.connection.set).toHaveBeenCalledOnce());
    expect(JSON.parse(redis.values.get("finance:v1") ?? "null")).toEqual({
      fresh: true,
    });
  });
});
