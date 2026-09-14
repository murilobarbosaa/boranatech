import { describe, expect, it } from "vitest";
import {
  ATTENTION_SOURCE_IDS,
  attentionActionUrl,
  isAttentionContractV3,
  type AttentionContractV3,
} from "./adminAttention";

const valid: AttentionContractV3 = {
  contractVersion: 3,
  items: [],
  queryStartedAt: "2026-09-11T10:00:00Z",
  queryCompletedAt: "2026-09-11T10:00:01Z",
  computedAt: "2026-09-11T10:00:01Z",
  consistency: "multi_query_no_snapshot",
  sources: ATTENTION_SOURCE_IDS.map((source) => ({
    source,
    status: source.startsWith("failed_") ? "not_collected" : "available",
    detail: "fonte declarada",
  })),
  coverage: {
    completeHistoryVerified: false,
    transactionalSnapshot: false,
    limitations: ["Sem snapshot transacional."],
  },
};

describe("attention contract v3", () => {
  it("accepts the complete contract and rejects incompatible or partial payloads", () => {
    expect(isAttentionContractV3(valid)).toBe(true);
    expect(isAttentionContractV3({ ...valid, contractVersion: 2 })).toBe(false);
    const partial = structuredClone(valid) as Record<string, unknown>;
    delete partial.computedAt;
    expect(isAttentionContractV3(partial)).toBe(false);
  });

  it("requires the exact source inventory once each", () => {
    expect(isAttentionContractV3({ ...valid, sources: [] })).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        sources: valid.sources.slice(1),
      }),
    ).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        sources: [...valid.sources, valid.sources[0]],
      }),
    ).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        sources: [
          ...valid.sources.slice(0, -1),
          { source: "extra", status: "available", detail: "extra" },
        ],
      }),
    ).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        sources: [
          ...valid.sources.slice(0, -1),
          { source: "", status: "available", detail: "fonte vazia" },
        ],
      }),
    ).toBe(false);
  });

  it("rejects duplicate item keys and unsafe optional fields", () => {
    const item = {
      kind: "subscription_local_past_due",
      key: "past-due:1",
      severity: "critical",
      title: "Estado local",
      detail: "Fato local.",
      source: "subscriptions",
      subject: {
        type: "subscription",
        id: "11111111-1111-4111-8111-111111111111",
      },
      action: { type: "open_section", section: "usuarios" },
    };
    expect(isAttentionContractV3({ ...valid, items: [item] })).toBe(true);
    expect(isAttentionContractV3({ ...valid, items: [item, item] })).toBe(
      false,
    );
    expect(
      isAttentionContractV3({
        ...valid,
        items: [{ ...item, declaredReason: { code: "x" } }],
      }),
    ).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        items: [{ ...item, subject: { ...item.subject, id: "not-a-uuid" } }],
      }),
    ).toBe(false);
  });

  it("rejects actions incompatible with their family and contradictory chronology", () => {
    const orphan = {
      kind: "orphan_payment_open",
      key: "orphan:1",
      severity: "critical",
      title: "Órfão",
      detail: "Caso local.",
      source: "billing_orphan_payments",
      subject: {
        type: "orphan",
        id: "22222222-2222-4222-8222-222222222222",
      },
      action: {
        type: "open_user",
        userId: "11111111-1111-4111-8111-111111111111",
      },
    };
    expect(isAttentionContractV3({ ...valid, items: [orphan] })).toBe(false);
    expect(
      isAttentionContractV3({
        ...valid,
        computedAt: "2026-09-11T09:00:00Z",
      }),
    ).toBe(false);
  });

  it("builds only the closed internal action destinations", () => {
    expect(
      attentionActionUrl({
        type: "open_user",
        userId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe("/admin?section=usuarios&user=11111111-1111-4111-8111-111111111111");
    expect(
      attentionActionUrl({
        type: "open_orphan",
        orphanId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toContain("panel=orphans&orphan=");
  });
});
