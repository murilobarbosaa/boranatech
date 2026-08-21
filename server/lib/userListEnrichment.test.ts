import { describe, expect, it, vi } from "vitest";

import {
  buildEnrichmentIndex,
  fetchUserListEnrichment,
  pickSubscription,
  subscriptionGrantsPro,
  tallyProSources,
  type SubscriptionRow,
} from "./userListEnrichment";

/**
 * Enriquecimento da lista de usuarios do admin (is_pro, pro_source, plan_code,
 * subscription_status).
 *
 * Duas coisas em jogo, e as duas ja mordem nesta base:
 *
 *  1. FIDELIDADE AO GATE. is_pro aqui precisa dizer o MESMO que a RPC
 *     is_user_pro, que tem dois ramos (assinatura E influencer) e tres
 *     condicoes na assinatura que sao faceis de esquecer: plano != 'free',
 *     status in (active, trialing) e periodo nao vencido. Uma lista que
 *     discorda do gate e pior que uma lista sem a coluna.
 *  2. AUSENCIA DE N+1. A pagina tem 50 linhas; o enriquecimento tem que custar
 *     um numero FIXO de consultas, nao uma por linha.
 */

const AGORA = new Date("2026-07-29T12:00:00Z");

function sub(over: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    user_id: "u1",
    status: "active",
    current_period_end: "2026-12-31T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    plans: { code: "pro_monthly" },
    ...over,
  };
}

describe("subscriptionGrantsPro: espelha as condicoes da RPC is_user_pro", () => {
  it("assinatura ativa de plano pago com periodo em aberto da Pro", () => {
    expect(subscriptionGrantsPro(sub(), AGORA)).toBe(true);
  });

  it("trialing tambem da Pro", () => {
    expect(subscriptionGrantsPro(sub({ status: "trialing" }), AGORA)).toBe(
      true,
    );
  });

  it("current_period_end nulo e vitalicio, nao vencido", () => {
    expect(
      subscriptionGrantsPro(sub({ current_period_end: null }), AGORA),
    ).toBe(true);
  });

  it("plano free NAO da Pro, mesmo com status active", () => {
    // A RPC filtra p.code <> 'free'. Existe plano 'free' no banco, entao esta
    // condicao nao e hipotetica.
    expect(subscriptionGrantsPro(sub({ plans: { code: "free" } }), AGORA)).toBe(
      false,
    );
  });

  it("assinatura sem plano NAO da Pro", () => {
    // A RPC usa INNER JOIN em plans: plan_id nulo nao produz linha.
    expect(subscriptionGrantsPro(sub({ plans: null }), AGORA)).toBe(false);
  });

  it("periodo ja vencido NAO da Pro, mesmo com status active", () => {
    expect(
      subscriptionGrantsPro(
        sub({ current_period_end: "2026-07-01T00:00:00Z" }),
        AGORA,
      ),
    ).toBe(false);
  });

  it("status fora da lista (canceled, past_due, pending) NAO da Pro", () => {
    for (const status of ["canceled", "past_due", "pending", "incomplete"]) {
      expect(subscriptionGrantsPro(sub({ status }), AGORA)).toBe(false);
    }
  });

  it("status desconhecido do provedor NAO da Pro (fail-closed)", () => {
    expect(subscriptionGrantsPro(sub({ status: "quantum_limbo" }), AGORA)).toBe(
      false,
    );
  });

  it("plans como array (shape do PostgREST) e lido igual", () => {
    expect(
      subscriptionGrantsPro(sub({ plans: [{ code: "pro_annual" }] }), AGORA),
    ).toBe(true);
  });
});

describe("pickSubscription: qual linha vence quando ha mais de uma", () => {
  it("a que da Pro vence a que nao da, mesmo sendo mais antiga", () => {
    const antigaValida = sub({
      created_at: "2025-01-01T00:00:00Z",
      current_period_end: "2027-01-01T00:00:00Z",
    });
    const novaCancelada = sub({
      status: "canceled",
      created_at: "2026-07-01T00:00:00Z",
    });
    expect(pickSubscription([novaCancelada, antigaValida], AGORA)).toBe(
      antigaValida,
    );
  });

  it("entre duas que dao Pro, vence a de periodo mais distante", () => {
    const perto = sub({ current_period_end: "2026-08-01T00:00:00Z" });
    const longe = sub({ current_period_end: "2027-08-01T00:00:00Z" });
    expect(pickSubscription([perto, longe], AGORA)).toBe(longe);
  });

  it("periodo nulo (vitalicio) vence periodo com data", () => {
    const comData = sub({ current_period_end: "2030-01-01T00:00:00Z" });
    const vitalicia = sub({ current_period_end: null });
    expect(pickSubscription([comData, vitalicia], AGORA)).toBe(vitalicia);
  });

  it("nenhuma da Pro: mostra a mais recente, para a lista nao mentir com vazio", () => {
    const velha = sub({
      status: "canceled",
      created_at: "2025-01-01T00:00:00Z",
    });
    const recente = sub({
      status: "past_due",
      created_at: "2026-06-01T00:00:00Z",
    });
    expect(pickSubscription([velha, recente], AGORA)).toBe(recente);
  });

  it("lista vazia devolve null", () => {
    expect(pickSubscription([], AGORA)).toBeNull();
  });
});

describe("buildEnrichmentIndex", () => {
  it("Pro por assinatura: pro_source subscription, com plano e status", () => {
    const index = buildEnrichmentIndex([sub()], new Set(), AGORA);
    expect(index.get("u1")).toEqual({
      is_pro: true,
      pro_source: "subscription",
      plan_code: "pro_monthly",
      subscription_status: "active",
    });
  });

  it("Pro por influencer SEM assinatura: is_pro true e plano nulo", () => {
    // Este e o caso que uma lista ingenua marca como "nao Pro". Sao 24 pessoas
    // em producao hoje.
    const index = buildEnrichmentIndex([], new Set(["u9"]), AGORA);
    expect(index.get("u9")).toEqual({
      is_pro: true,
      pro_source: "influencer",
      plan_code: null,
      subscription_status: null,
    });
  });

  it("influencer E assinante ao mesmo tempo vira pro_source both", () => {
    // Ortogonais por design: cancelar a assinatura NAO tira o Pro de quem tem
    // concessao de influencer. Se a lista dissesse so "subscription", a Fatia 6
    // cancelaria e ninguem entenderia por que a pessoa continua Pro.
    const index = buildEnrichmentIndex([sub()], new Set(["u1"]), AGORA);
    expect(index.get("u1")?.pro_source).toBe("both");
    expect(index.get("u1")?.is_pro).toBe(true);
  });

  it("assinatura cancelada e sem influencer: nao Pro, mas mostra o status", () => {
    const index = buildEnrichmentIndex(
      [sub({ status: "canceled" })],
      new Set(),
      AGORA,
    );
    expect(index.get("u1")).toEqual({
      is_pro: false,
      pro_source: null,
      plan_code: "pro_monthly",
      subscription_status: "canceled",
    });
  });

  it("usuario sem nada nao entra no indice", () => {
    const index = buildEnrichmentIndex([], new Set(), AGORA);
    expect(index.has("u1")).toBe(false);
  });

  it("agrupa varias assinaturas do MESMO usuario numa entrada so", () => {
    const index = buildEnrichmentIndex(
      [
        sub({ status: "canceled", created_at: "2025-01-01T00:00:00Z" }),
        sub({ current_period_end: "2027-01-01T00:00:00Z" }),
      ],
      new Set(),
      AGORA,
    );
    expect(index.size).toBe(1);
    expect(index.get("u1")?.is_pro).toBe(true);
  });
});

describe("fetchUserListEnrichment: custo fixo, sem N+1", () => {
  it("50 ids custam exatamente 2 consultas, uma por tabela", async () => {
    const bySubscription = vi.fn(
      async (_ids: string[]) => [] as SubscriptionRow[],
    );
    const byInfluencer = vi.fn(async (_ids: string[]) => [] as string[]);
    const ids = Array.from({ length: 50 }, (_, i) => `u${i}`);

    await fetchUserListEnrichment(ids, { bySubscription, byInfluencer }, AGORA);

    expect(bySubscription).toHaveBeenCalledTimes(1);
    expect(byInfluencer).toHaveBeenCalledTimes(1);
    // E cada uma recebeu a PAGINA inteira de uma vez, nao um id por chamada.
    expect(bySubscription.mock.calls[0][0]).toHaveLength(50);
    expect(byInfluencer.mock.calls[0][0]).toHaveLength(50);
  });

  it("lista vazia nao consulta nada", async () => {
    const bySubscription = vi.fn(
      async (_ids: string[]) => [] as SubscriptionRow[],
    );
    const byInfluencer = vi.fn(async (_ids: string[]) => [] as string[]);

    const index = await fetchUserListEnrichment(
      [],
      { bySubscription, byInfluencer },
      AGORA,
    );

    expect(bySubscription).not.toHaveBeenCalled();
    expect(byInfluencer).not.toHaveBeenCalled();
    expect(index.size).toBe(0);
  });

  it("junta os dois lados no indice final", async () => {
    const index = await fetchUserListEnrichment(
      ["u1", "u9"],
      {
        bySubscription: async () => [sub()],
        byInfluencer: async () => ["u9"],
      },
      AGORA,
    );

    expect(index.get("u1")?.pro_source).toBe("subscription");
    expect(index.get("u9")?.pro_source).toBe("influencer");
  });
});

describe("tallyProSources: os dois ramos de is_user_pro, sem soma errada", () => {
  const AGORA = new Date("2026-07-31T12:00:00Z");

  function assinatura(
    over: Partial<SubscriptionRow> & { user_id: string },
  ): SubscriptionRow {
    return {
      status: "active",
      created_at: "2026-07-01T00:00:00Z",
      current_period_end: "2027-01-01T00:00:00Z",
      plans: { code: "pro_annual" },
      ...over,
    } as SubscriptionRow;
  }

  it("conta os dois ramos separados, e o total é a UNIÃO", () => {
    // Foi exatamente isto que o card da Visão escondia: 62 por assinatura e 25
    // por concessão, e a tela mostrava só o primeiro.
    const index = buildEnrichmentIndex(
      [assinatura({ user_id: "a" }), assinatura({ user_id: "b" })],
      new Set(["c", "d", "e"]),
      AGORA,
    );

    expect(tallyProSources(index)).toEqual({
      bySubscription: 2,
      byInfluencer: 3,
      both: 0,
      total: 5,
    });
  });

  it("quem tem os DOIS entra nos dois ramos e UMA vez no total", () => {
    // A trava contra somar bySubscription + byInfluencer: aqui isso daria 3
    // para 2 pessoas.
    const index = buildEnrichmentIndex(
      [assinatura({ user_id: "a" }), assinatura({ user_id: "b" })],
      new Set(["b"]),
      AGORA,
    );

    const tally = tallyProSources(index);
    expect(tally).toEqual({
      bySubscription: 2,
      byInfluencer: 1,
      both: 1,
      total: 2,
    });
    expect(tally.bySubscription + tally.byInfluencer).not.toBe(tally.total);
  });

  it("assinatura que NÃO dá Pro não entra em ramo nenhum", () => {
    // Período vencido: is_user_pro nega, e o tally tem de negar junto. É a
    // mesma regra, pela mesma função.
    const index = buildEnrichmentIndex(
      [
        assinatura({
          user_id: "a",
          current_period_end: "2026-01-01T00:00:00Z",
        }),
      ],
      new Set(),
      AGORA,
    );

    expect(tallyProSources(index)).toEqual({
      bySubscription: 0,
      byInfluencer: 0,
      both: 0,
      total: 0,
    });
  });

  it("base vazia devolve zeros, não erro", () => {
    expect(tallyProSources(new Map())).toEqual({
      bySubscription: 0,
      byInfluencer: 0,
      both: 0,
      total: 0,
    });
  });
});
