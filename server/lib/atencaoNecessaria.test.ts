import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  subscriptions: [] as Record<string, unknown>[],
  subscription_cancellations: [] as Record<string, unknown>[],
  billing_orphan_payments: [] as Record<string, unknown>[],
  ai_usage_logs: [] as Record<string, unknown>[],
  expenses: [{ id: "expense" }] as Record<string, unknown>[],
  creators: [] as Record<string, unknown>[],
  failures: new Set<string>(),
  countOverrides: {} as Record<string, number[]>,
  maxRows: {} as Record<string, number>,
  calls: [] as string[],
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table: keyof typeof db) {
      db.calls.push(String(table));
      const query: Record<string, unknown> = {};
      for (const method of [
        "select",
        "in",
        "gte",
        "lte",
        "lt",
        "eq",
        "is",
        "order",
      ])
        query[method] = () => query;
      query.range = (from: number, to: number) => {
        const rows = (db[table] as Record<string, unknown>[]) ?? [];
        const cap = db.maxRows[String(table)] ?? to - from + 1;
        const count = db.countOverrides[String(table)]?.shift() ?? rows.length;
        return Promise.resolve(
          db.failures.has(String(table))
            ? { data: null, error: { message: "failed" }, count: null }
            : {
                data: rows.slice(from, Math.min(to + 1, from + cap)),
                error: null,
                count,
              },
        );
      };
      query.limit = () => {
        const rows = (db[table] as Record<string, unknown>[]) ?? [];
        return Promise.resolve(
          db.failures.has(String(table))
            ? { data: null, error: { message: "failed" } }
            : { data: rows.slice(0, 1), error: null },
        );
      };
      return query;
    },
  },
}));

import { montarPainelDeAtencao } from "./atencaoNecessaria";
import { isAttentionContractV3 } from "../../shared/adminAttention";

const NOW = new Date("2026-09-11T15:00:00Z");
const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function subscription(over: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    user_id: USER,
    status: "active",
    cancel_at_period_end: false,
    current_period_end: "2026-10-01T03:00:00Z",
    current_period_start: "2026-09-01T03:00:00Z",
    last_event_at: "2026-09-10T10:00:00Z",
    provider_subscription_id: "sub_local",
    renewal_type: "automatic",
    payment_method: "card",
    created_at: "2026-09-01T03:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  db.subscriptions = [];
  db.subscription_cancellations = [];
  db.billing_orphan_payments = [];
  db.ai_usage_logs = [];
  db.expenses = [{ id: "expense" }];
  db.creators = [];
  db.failures.clear();
  db.countOverrides = {};
  db.maxRows = {};
  db.calls = [];
});

describe("attention v3 local facts", () => {
  it("uses only local tables and declares failures and payouts not collected", async () => {
    const result = await montarPainelDeAtencao(NOW);
    expect(isAttentionContractV3(result)).toBe(true);
    expect(new Set(db.calls)).toEqual(
      new Set([
        "subscriptions",
        "subscription_cancellations",
        "billing_orphan_payments",
        "ai_usage_logs",
        "expenses",
        "creators",
      ]),
    );
    for (const table of [
      "subscriptions",
      "subscription_cancellations",
      "billing_orphan_payments",
      "ai_usage_logs",
      "creators",
    ])
      expect(db.calls.filter((called) => called === table)).toHaveLength(1);
    expect(result.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "failed_charges_reconciled",
          status: "not_collected",
        }),
        expect.objectContaining({
          source: "failed_payouts_reconciled",
          status: "not_collected",
        }),
      ]),
    );
    expect(JSON.stringify(result)).not.toMatch(
      /Cartão recusado|tentando de novo|cancela sozinha|que não entraram|dinheiro retido|lembrete por e-mail já saiu/,
    );
  });

  it("limits past_due to local state without debt or catalog value", async () => {
    db.subscriptions = [subscription({ status: "past_due" })];
    const item = (await montarPainelDeAtencao(NOW)).items[0];
    expect(item).toMatchObject({
      kind: "subscription_local_past_due",
      action: { type: "open_user", userId: USER },
      source: "subscriptions",
    });
    expect(item.value).toBeUndefined();
    expect(item.detail).toContain("não comprova obrigação aberta");
  });

  it("keeps scheduled exits and separates influencer active from trial", async () => {
    db.subscriptions = [
      subscription({ cancel_at_period_end: true }),
      subscription({
        id: crypto.randomUUID(),
        user_id: OTHER,
        status: "trialing",
      }),
    ];
    db.creators = [
      { id: crypto.randomUUID(), user_id: USER, kind: "influencer" },
      { id: crypto.randomUUID(), user_id: OTHER, kind: "afiliado" },
    ];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.items.map((item) => item.kind)).toEqual(
      expect.arrayContaining([
        "subscription_scheduled_exit",
        "influencer_active_access",
        "influencer_trial_access",
      ]),
    );
    expect(JSON.stringify(result.items)).not.toContain("assinatura paga");
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "influencer_active_access",
          title: "Influencer com outro acesso local ativo",
        }),
        expect.objectContaining({
          kind: "influencer_trial_access",
          title: "Afiliado com trial local",
        }),
      ]),
    );
  });

  it("includes session and charge-only open orphans without provider lookup", async () => {
    db.billing_orphan_payments = [
      {
        id: "33333333-3333-4333-8333-333333333333",
        amount_total_cents: 2990,
        currency: "brl",
        detected_at: "2026-09-01T10:00:00Z",
        last_seen_at: "2026-09-10T10:00:00Z",
        stripe_charge_id: null,
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        amount_total_cents: null,
        currency: null,
        detected_at: "2026-09-02T10:00:00Z",
        last_seen_at: null,
        stripe_charge_id: "ch_local",
      },
    ];
    const items = (await montarPainelDeAtencao(NOW)).items.filter(
      (item) => item.kind === "orphan_payment_open",
    );
    expect(items).toHaveLength(2);
    expect(items[0].value).toEqual(
      expect.objectContaining({
        semantics: "detector_recorded_amount",
        currency: "BRL",
      }),
    );
    expect(items[1].value).toBeUndefined();
  });

  it("does not infer boleto and does not mention reminder for manual ending", async () => {
    db.subscriptions = [
      subscription({
        renewal_type: "manual",
        payment_method: null,
        current_period_end: "2026-09-15T15:00:00Z",
      }),
    ];
    const item = (await montarPainelDeAtencao(NOW)).items.find(
      (candidate) => candidate.kind === "manual_subscription_ending",
    );
    expect(item?.detail).toContain("não identificado");
    expect(item?.detail).not.toMatch(/boleto|lembrete/i);
  });

  it("applies an upper cutoff to AI logs and labels the current day partial", async () => {
    db.ai_usage_logs = [
      {
        id: "old",
        created_at: "2026-09-11T14:00:00Z",
        status: "success",
        cost_estimate: "0.60",
      },
      {
        id: "future",
        created_at: "2026-09-11T16:00:00Z",
        status: "success",
        cost_estimate: null,
      },
    ];
    const item = (await montarPainelDeAtencao(NOW)).items.find(
      (candidate) => candidate.kind === "ai_cost_spike",
    );
    expect(item?.detail).toContain("dia parcial até o corte");
    expect(item?.value?.minorUnits).toBe(60);
    expect(
      (await montarPainelDeAtencao(NOW)).sources.find(
        (source) => source.source === "ai_usage_logs",
      )?.status,
    ).toBe("available");
  });

  it("marks successful executions without measured cost as partial and omits the spike", async () => {
    db.ai_usage_logs = [
      {
        id: "zero",
        created_at: "2026-09-11T10:00:00Z",
        status: "success",
        cost_estimate: "0",
      },
      {
        id: "null",
        created_at: "2026-09-11T11:00:00Z",
        status: "success",
        cost_estimate: null,
      },
      {
        id: "invalid",
        created_at: "2026-09-11T12:00:00Z",
        status: "success",
        cost_estimate: "inválido",
      },
      {
        id: "partial-parse",
        created_at: "2026-09-11T13:00:00Z",
        status: "success",
        cost_estimate: "0.60lixo",
      },
      {
        id: "measured",
        created_at: "2026-09-11T14:00:00Z",
        status: "success",
        cost_estimate: "0.60",
      },
    ];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.items.some((item) => item.kind === "ai_cost_spike")).toBe(
      false,
    );
    expect(result.sources).toContainEqual(
      expect.objectContaining({
        source: "ai_usage_logs",
        status: "partial",
        detail: expect.stringContaining("4 execuções success"),
      }),
    );
  });

  it("does not make non-success zero cost a measurement gap", async () => {
    db.ai_usage_logs = [
      {
        id: "error",
        created_at: "2026-09-11T10:00:00Z",
        status: "error",
        cost_estimate: "0",
      },
      {
        id: "rate-limited",
        created_at: "2026-09-11T11:00:00Z",
        status: "rate_limited",
        cost_estimate: null,
      },
    ];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.sources).toContainEqual(
      expect.objectContaining({
        source: "ai_usage_logs",
        status: "available",
      }),
    );
  });

  it("turns a repeated row id into an unavailable source, not an empty success", async () => {
    const duplicate = subscription({ id: "same" });
    db.subscriptions = [duplicate, duplicate];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.sources).toContainEqual(
      expect.objectContaining({
        source: "subscriptions",
        status: "unavailable",
      }),
    );
  });

  it("turns a changing exact count between pages into an unavailable source", async () => {
    db.subscriptions = [subscription(), subscription()];
    db.maxRows.subscriptions = 1;
    db.countOverrides.subscriptions = [2, 3];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.sources).toContainEqual(
      expect.objectContaining({
        source: "subscriptions",
        status: "unavailable",
      }),
    );
  });

  it("uses civil Brasilia boundaries for the previous month", async () => {
    const { fronteirasDoMesAnterior } = await import("./atencaoNecessaria");
    expect(
      fronteirasDoMesAnterior(new Date("2026-01-01T02:59:59.999Z")),
    ).toEqual({ inicio: "2025-11-01", fim: "2025-12-01", rotulo: "11/2025" });
    expect(
      fronteirasDoMesAnterior(new Date("2026-01-01T03:00:00.000Z")),
    ).toEqual({ inicio: "2025-12-01", fim: "2026-01-01", rotulo: "12/2025" });
  });

  it("keeps other items when one local source fails", async () => {
    db.failures.add("subscriptions");
    db.billing_orphan_payments = [
      {
        id: "33333333-3333-4333-8333-333333333333",
        amount_total_cents: null,
        currency: null,
        detected_at: "2026-09-01T10:00:00Z",
        last_seen_at: null,
        stripe_charge_id: "ch_local",
      },
    ];
    const result = await montarPainelDeAtencao(NOW);
    expect(result.items).toHaveLength(1);
    expect(result.sources).toContainEqual(
      expect.objectContaining({
        source: "subscriptions",
        status: "unavailable",
      }),
    );
  });
});
