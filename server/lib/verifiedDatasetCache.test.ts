import { describe, expect, it } from "vitest";
import { createVerifiedDatasetCache } from "./verifiedDatasetCache";

describe("cache de conjuntos financeiros verificados", () => {
  it("compartilha leitura simultânea e reutiliza páginas, subtab e período enquanto válido", async () => {
    let clock = 0;
    let calls = 0;
    const cache = createVerifiedDatasetCache(45_000, 2, () => clock);
    const compute = async () => {
      calls++;
      return { total: 30 };
    };
    const [a, b] = await Promise.all([
      cache.get("period-a", compute),
      cache.get("period-a", compute),
    ]);
    expect(a).toEqual(b);
    await cache.get("period-a", compute);
    await cache.get("period-b", compute);
    await cache.get("period-a", compute);
    expect(calls).toBe(2);
    clock = 45_001;
    await cache.get("period-a", compute);
    expect(calls).toBe(3);
  });

  it("não cacheia falha e impede resposta antiga de sobrescrever refresh mais novo", async () => {
    const cache = createVerifiedDatasetCache<number>(45_000, 2);
    let resolveOld!: (value: number) => void;
    const old = cache.get(
      "p",
      () =>
        new Promise<number>((resolve) => {
          resolveOld = resolve;
        }),
    );
    const fresh = cache.get("p", async () => 2, true);
    await expect(fresh).resolves.toBe(2);
    resolveOld(1);
    await expect(old).resolves.toBe(1);
    await expect(cache.get("p", async () => 3)).resolves.toBe(2);
    await expect(
      cache.get("failed", async () => {
        throw new Error("failure");
      }),
    ).rejects.toThrow();
    await expect(cache.get("failed", async () => 4)).resolves.toBe(4);
  });
  it("confere contagem antes do hit e invalida conjunto quando as fontes mudam", async () => {
    const cache = createVerifiedDatasetCache<{ count: number }>(45_000, 2);
    let reads = 0;
    let observed = 19_999;
    const compute = async () => ({ count: ++reads === 1 ? 19_999 : observed });
    await cache.get("period", compute);
    await cache.get(
      "period",
      compute,
      false,
      async (value) => value.count === observed,
    );
    expect(reads).toBe(1);
    observed = 20_000;
    await cache.get(
      "period",
      compute,
      false,
      async (value) => value.count === observed,
    );
    expect(reads).toBe(2);
    observed = 20_001;
    await expect(
      cache.get("period", compute, false, async () => {
        throw new Error("finance_method_scan_limit");
      }),
    ).rejects.toThrow("finance_method_scan_limit");
    expect(reads).toBe(2);
  });
});
