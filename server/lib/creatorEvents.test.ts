import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `recordCreatorEvent` e telemetria que roda dentro do webhook de pagamento e
 * da rota publica de clique. O contrato que estes testes travam:
 *
 *  1. NUNCA LANCA: erro de insert vira `{ ok: false }` e captura no Sentry.
 *  2. O PLANO NUNCA DESCARTA O EVENTO: codigo de plano que nao resolve (ou cuja
 *     consulta falha) grava o evento com `plan_id: null` e o codigo em
 *     `metadata.plan_code`.
 *  3. Sem afiliado nao ha evento (`affiliate_id` e NOT NULL na tabela), e isso
 *     nao e falha de infraestrutura, entao nao vai para o Sentry.
 */

const estado = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  insertError: null as { message: string; code?: string } | null,
  afiliadoPorCodigo: {} as Record<string, { id: string } | undefined>,
  planoPorCodigo: {} as Record<string, { id: string } | undefined>,
  planoError: null as { message: string } | null,
  capturas: [] as Array<{ erro: unknown; opcoes: Record<string, unknown> }>,
}));

vi.mock("@sentry/node", () => ({
  captureException: (erro: unknown, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ erro, opcoes });
  },
  captureMessage: () => {},
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela === "creator_events") {
        return {
          insert: async (carga: Record<string, unknown>) => {
            estado.inserts.push(carga);
            return { data: null, error: estado.insertError };
          },
        };
      }
      let procurado = "";
      const consulta = {
        select: () => consulta,
        eq: (_coluna: string, valor: string) => {
          procurado = valor;
          return consulta;
        },
        maybeSingle: async () => {
          if (tabela === "affiliates") {
            return {
              data: estado.afiliadoPorCodigo[procurado] ?? null,
              error: null,
            };
          }
          if (tabela === "plans") {
            return estado.planoError
              ? { data: null, error: estado.planoError }
              : { data: estado.planoPorCodigo[procurado] ?? null, error: null };
          }
          throw new Error(`tabela inesperada neste arquivo: ${tabela}`);
        },
      };
      return consulta;
    },
  },
}));

import { recordCreatorEvent } from "./creatorEvents";

beforeEach(() => {
  estado.inserts = [];
  estado.insertError = null;
  estado.afiliadoPorCodigo = { BORA10: { id: "aff-1" } };
  estado.planoPorCodigo = { pro_monthly: { id: "plan-uuid-mensal" } };
  estado.planoError = null;
  estado.capturas = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("recordCreatorEvent: gravacao", () => {
  it("insert com sucesso devolve { ok: true } e grava os campos recebidos", async () => {
    const r = await recordCreatorEvent({
      eventType: "sale",
      affiliateId: "aff-1",
      userId: "user-1",
      subscriptionId: "sub-1",
      planId: "plan-uuid-anual",
      paymentMethod: "card",
      revenueCents: 2093,
      commissionCents: 628,
    });

    expect(r).toEqual({ ok: true });
    expect(estado.inserts).toEqual([
      {
        affiliate_id: "aff-1",
        event_type: "sale",
        user_id: "user-1",
        subscription_id: "sub-1",
        plan_id: "plan-uuid-anual",
        payment_method: "card",
        revenue_cents: 2093,
        commission_cents: 628,
        metadata: {},
      },
    ]);
    expect(estado.capturas).toEqual([]);
  });

  it("insert com erro devolve { ok: false }, captura com a tag e NAO lanca", async () => {
    estado.insertError = { message: "permission denied", code: "42501" };

    const r = await recordCreatorEvent({
      eventType: "click",
      affiliateId: "aff-1",
    });

    expect(r).toEqual({ ok: false });
    expect(estado.capturas).toHaveLength(1);
    expect(estado.capturas[0].opcoes).toMatchObject({
      tags: { origem: "creator_events", event_type: "click" },
    });
  });

  it("codigo do afiliado e resolvido para o id", async () => {
    await recordCreatorEvent({
      eventType: "checkout",
      affiliateCode: "BORA10",
      userId: "user-1",
    });

    expect(estado.inserts[0].affiliate_id).toBe("aff-1");
  });

  it("afiliado que nao existe nao grava e nao vai para o Sentry", async () => {
    const r = await recordCreatorEvent({
      eventType: "checkout",
      affiliateCode: "SUMIU",
    });

    expect(r).toEqual({ ok: false });
    expect(estado.inserts).toEqual([]);
    expect(estado.capturas).toEqual([]);
  });
});

describe("recordCreatorEvent: o plano nunca descarta o evento", () => {
  it("codigo que resolve vira o uuid do plano, sem plan_code no metadata", async () => {
    await recordCreatorEvent({
      eventType: "checkout",
      affiliateId: "aff-1",
      planCode: "pro_monthly",
    });

    expect(estado.inserts[0]).toMatchObject({
      plan_id: "plan-uuid-mensal",
      metadata: {},
    });
  });

  it("codigo que NAO resolve grava com plan_id null e metadata.plan_code", async () => {
    const r = await recordCreatorEvent({
      eventType: "checkout",
      affiliateId: "aff-1",
      planCode: "pro_que_nao_existe",
      metadata: { origem_teste: "x" },
    });

    expect(r).toEqual({ ok: true });
    expect(estado.inserts).toHaveLength(1);
    expect(estado.inserts[0]).toMatchObject({
      plan_id: null,
      metadata: { origem_teste: "x", plan_code: "pro_que_nao_existe" },
    });
  });

  it("FALHA na consulta do plano tambem grava, e a falha vai para o Sentry", async () => {
    estado.planoError = { message: "statement timeout" };

    const r = await recordCreatorEvent({
      eventType: "checkout",
      affiliateId: "aff-1",
      planCode: "pro_monthly",
    });

    expect(r).toEqual({ ok: true });
    expect(estado.inserts).toHaveLength(1);
    expect(estado.inserts[0]).toMatchObject({
      plan_id: null,
      metadata: { plan_code: "pro_monthly" },
    });
    expect(estado.capturas).toHaveLength(1);
    expect(estado.capturas[0].opcoes).toMatchObject({
      tags: { origem: "creator_events", event_type: "checkout" },
    });
  });
});
