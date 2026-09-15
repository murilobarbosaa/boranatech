import { describe, expect, it } from "vitest";
import { clearAttentionContext } from "./adminContext";

describe("clearAttentionContext", () => {
  it("removes section-specific attention keys and preserves page keys", () => {
    const result = clearAttentionContext(
      "?section=financeiro&window=30d&user=u&panel=orphans&orphan=o",
    );
    expect(result.get("window")).toBe("30d");
    expect(result.has("user")).toBe(false);
    expect(result.has("panel")).toBe(false);
    expect(result.has("orphan")).toBe(false);
  });
});
