import { describe, expect, it } from "vitest";
import { verifiedMethodScan } from "./verifiedMethodScan";

function pages(
  total: number,
  opts?: { drift?: boolean; failAt?: number; truncate?: boolean },
) {
  let calls = 0;
  return async (from: number, to: number) => {
    calls++;
    const reported = opts?.drift && calls > 1 ? total + 1 : total;
    return {
      data:
        opts?.truncate && from >= 1000
          ? []
          : Array.from(
              { length: Math.max(0, Math.min(to + 1, total) - from) },
              (_, index) => ({ id: String(from + index) }),
            ),
      count: reported,
      error: opts?.failAt === calls ? { message: "synthetic failure" } : null,
    };
  };
}

describe.each(["rows", "evidence"] as const)(
  "limite verificado de %s",
  (kind) => {
    it.each([19_999, 20_000])("aceita %i linhas completas", async (count) => {
      expect(await verifiedMethodScan(pages(count), kind, 1000)).toHaveLength(
        count,
      );
    });
    it("recusa 20.001 sem retornar parcial ou zero, com motivo estável", async () => {
      await expect(
        verifiedMethodScan(pages(20_001), kind, 1000),
      ).rejects.toMatchObject({
        statusCode: 503,
        code:
          kind === "rows"
            ? "finance_method_scan_limit"
            : "finance_method_evidence_limit",
      });
    });
    it("recusa contagem divergente, truncamento e falha intermediária", async () => {
      await expect(
        verifiedMethodScan(pages(1500, { drift: true }), kind, 1000),
      ).rejects.toThrow();
      await expect(
        verifiedMethodScan(pages(1500, { truncate: true }), kind, 1000),
      ).rejects.toThrow();
      await expect(
        verifiedMethodScan(pages(1500, { failAt: 2 }), kind, 1000),
      ).rejects.toThrow();
    });
  },
);
