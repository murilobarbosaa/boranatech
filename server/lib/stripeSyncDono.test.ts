import { describe, expect, it, vi } from "vitest";

import { extractRefs, resolveOwnerFromParentCharge } from "./stripeSync";

/**
 * Atribuicao de DONO nas linhas de refund e dispute.
 *
 * O defeito que motivou estes testes: extractRefs so resolvia customer para
 * source.object === "charge", entao refund e dispute entravam em
 * finance_transactions com user_id NULL. O somatorio "Valor pago (total)" do
 * modal de usuario (server/routes/admin.ts) filtra por .eq("user_id", uid) e
 * portanto NUNCA via essas linhas: reembolso e chargeback nao eram descontados,
 * embora o comentario da rota afirmasse que eram.
 *
 * Os lookups entram por parametro (funcao pura): o teste exercita a DECISAO de
 * atribuicao, nao o Postgres nem a API da Stripe.
 */

type Owner = { userId: string | null; planCode: string | null };

function lookups(overrides: {
  byCharge?: (chargeId: string) => Promise<Owner | null>;
  customerOfCharge?: (chargeId: string) => Promise<string | null>;
  byCustomer?: (customerId: string) => Promise<Owner>;
}) {
  return {
    byCharge: overrides.byCharge ?? (async () => null),
    customerOfCharge: overrides.customerOfCharge ?? (async () => null),
    byCustomer:
      overrides.byCustomer ?? (async () => ({ userId: null, planCode: null })),
  };
}

describe("extractRefs: de onde vem o id da cobranca-mae", () => {
  it("refund expandido aponta para a cobranca-mae em parentChargeId", () => {
    const refs = extractRefs({
      object: "refund",
      id: "re_1",
      charge: "ch_1",
    } as never);

    expect(refs.chargeId).toBe("ch_1");
    expect(refs.parentChargeId).toBe("ch_1");
    expect(refs.customerId).toBeNull();
  });

  it("dispute expandido tambem aponta para a cobranca-mae", () => {
    // Antes desta mudanca, dispute caia no return final e perdia ate o
    // chargeId: chargeback nao tinha como ser atribuido a ninguem.
    const refs = extractRefs({
      object: "dispute",
      id: "dp_1",
      charge: "ch_9",
    } as never);

    expect(refs.chargeId).toBe("ch_9");
    expect(refs.parentChargeId).toBe("ch_9");
  });

  it("charge expandida NAO tem cobranca-mae: ela mesma e a cobranca", () => {
    const refs = extractRefs({
      object: "charge",
      id: "ch_1",
      invoice: "in_1",
      customer: "cus_1",
    } as never);

    expect(refs.chargeId).toBe("ch_1");
    expect(refs.parentChargeId).toBeNull();
    expect(refs.customerId).toBe("cus_1");
  });

  it("source como string crua NAO vira cobranca-mae (o id pode ser do proprio refund)", () => {
    // Sem expansao nao da para saber se "re_1" e charge ou refund. Marcar como
    // parentChargeId dispararia um retrieve de charge com id de refund.
    const refs = extractRefs("re_1" as never);

    expect(refs.parentChargeId).toBeNull();
  });

  it("source ausente nao quebra", () => {
    const refs = extractRefs(null as never);

    expect(refs.chargeId).toBeNull();
    expect(refs.parentChargeId).toBeNull();
  });
});

describe("resolveOwnerFromParentCharge", () => {
  it("cobranca JA ingerida: resolve pelo banco e nao toca a Stripe", async () => {
    const customerOfCharge = vi.fn(async () => "cus_nao_deveria_ser_usado");
    const owner = await resolveOwnerFromParentCharge(
      "ch_1",
      lookups({
        byCharge: async (id) =>
          id === "ch_1" ? { userId: "user-1", planCode: "pro_annual" } : null,
        customerOfCharge,
      }),
    );

    expect(owner).toEqual({ userId: "user-1", planCode: "pro_annual" });
    expect(customerOfCharge).not.toHaveBeenCalled();
  });

  it("cobranca AINDA NAO ingerida: cai para a Stripe e resolve pelo customer", async () => {
    // A lista de balance transactions vem da mais nova para a mais antiga,
    // entao o refund e processado ANTES da sua propria cobranca. Sem este
    // caminho a linha ficaria NULL ate um sync futuro que talvez nunca alcance
    // a cobranca (janela deslizante).
    const owner = await resolveOwnerFromParentCharge(
      "ch_2",
      lookups({
        byCharge: async () => null,
        customerOfCharge: async (id) => (id === "ch_2" ? "cus_2" : null),
        byCustomer: async (customerId) =>
          customerId === "cus_2"
            ? { userId: "user-2", planCode: "pro_monthly" }
            : { userId: null, planCode: null },
      }),
    );

    expect(owner).toEqual({ userId: "user-2", planCode: "pro_monthly" });
  });

  it("cobranca ingerida mas ORFA (user_id null) tambem cai para a Stripe", async () => {
    // Uma linha de charge com user_id null nao e resposta: e a mesma lacuna.
    const owner = await resolveOwnerFromParentCharge(
      "ch_3",
      lookups({
        byCharge: async () => ({ userId: null, planCode: null }),
        customerOfCharge: async () => "cus_3",
        byCustomer: async () => ({ userId: "user-3", planCode: "pro_annual" }),
      }),
    );

    expect(owner.userId).toBe("user-3");
  });

  it("cobranca sem customer na Stripe: devolve null sem quebrar", async () => {
    const owner = await resolveOwnerFromParentCharge(
      "ch_4",
      lookups({
        byCharge: async () => null,
        customerOfCharge: async () => null,
      }),
    );

    expect(owner).toEqual({ userId: null, planCode: null });
  });

  it("falha da Stripe nao derruba o sync: devolve null e segue", async () => {
    // O sync inteiro nao pode morrer porque UM refund antigo nao resolveu. A
    // linha entra sem dono e o proximo sync tenta de novo. O aviso e parte do
    // contrato: falhar em silencio esconderia a linha sem dono.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const owner = await resolveOwnerFromParentCharge(
        "ch_5",
        lookups({
          byCharge: async () => null,
          customerOfCharge: async () => {
            throw new Error("stripe fora do ar");
          },
        }),
      );

      expect(owner).toEqual({ userId: null, planCode: null });
      expect(warn).toHaveBeenCalledOnce();
    } finally {
      warn.mockRestore();
    }
  });
});
