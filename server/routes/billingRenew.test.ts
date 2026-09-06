import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RENOVACAO MANUAL DESPACHADA POR PROVEDOR E METODO (lote 2b, commit 3).
 *
 * Ate 2026-09-06 `POST /api/billing/renew` tinha Stripe e boleto fixos em
 * duro: um assinante Pix receberia um boleto, e o mensal (que so aceita Pix)
 * morreria em `boleto_not_allowed_on_monthly`. Agora o metodo vem da
 * assinatura quando o plano o aceita, senao Pix, e o provedor vem do metodo.
 */
const estado = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null,
  plano: { code: "pro_semiannual" } as Record<string, unknown> | null,
  token: { status: "valid", subscriptionId: "sub-1", periodEndMs: 0 } as Record<
    string,
    unknown
  >,
  stripeCheckout: [] as Array<Record<string, unknown>>,
  asaasCheckout: [] as Array<Record<string, unknown>>,
  qr: { encodedImage: "img", payload: "copia-e-cola", expirationDate: null } as
    | Record<string, unknown>
    | Error,
  asaasEnabled: true,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    billingEnabled: true,
    get asaasEnabled() {
      return estado.asaasEnabled;
    },
    isProd: false,
    devProUserIds: [],
  },
}));
vi.mock("../lib/renewalToken", () => ({
  verifyRenewalToken: () => estado.token,
  issueRenewalToken: () => "t",
}));
vi.mock("../lib/fiscalStorage", () => ({ signedFiscalUrl: async () => null }));
vi.mock("../providers", () => ({
  stripeProvider: {
    createCheckout: async (input: Record<string, unknown>) => {
      estado.stripeCheckout.push(input);
      return { checkoutUrl: "https://stripe.test/cs", subscriptionId: "cs_1" };
    },
  },
  asaasProvider: {
    createCheckout: async (input: Record<string, unknown>) => {
      estado.asaasCheckout.push(input);
      return {
        checkoutUrl: "https://asaas.test/i/1",
        subscriptionId: "pay_novo",
        flow: "native_pix",
        amountCents: 2990,
        dueDate: "2026-09-08",
      };
    },
  },
}));
vi.mock("../providers/asaas", () => ({
  fetchPixQrCode: async () => {
    if (estado.qr instanceof Error) throw estado.qr;
    return estado.qr;
  },
  fetchChargeAmountCents: async () => null,
}));
vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const q: Record<string, unknown> = {};
    for (const m of [
      "select",
      "eq",
      "in",
      "neq",
      "order",
      "limit",
      "is",
      "gt",
    ]) {
      q[m] = () => q;
    }
    q.maybeSingle = async () => {
      if (tabela === "subscriptions")
        return { data: estado.subscription, error: null };
      if (tabela === "plans") return { data: estado.plano, error: null };
      return { data: null, error: null };
    };
    return q;
  }
  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      auth: {
        admin: {
          getUserById: async () => ({
            data: { user: { email: "pessoa@exemplo.com" } },
            error: null,
          }),
        },
      },
    },
  };
});

import { handleRenew, handleRenewPreview, metodoDaRenovacao } from "./billing";

const FIM = "2026-09-21T00:00:00.000Z";
const FUTURO = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
const PASSADO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

function assinatura(over: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    user_id: "user-1",
    status: "active",
    current_period_end: FUTURO,
    plan_id: "plan-1",
    renewal_type: "manual",
    payment_method: "boleto",
    ...over,
  };
}

function chamar(handler: typeof handleRenew, body: Record<string, unknown>) {
  const gravado: { json?: Record<string, unknown>; erro?: unknown } = {};
  const objeto = {
    json(carga: Record<string, unknown>) {
      gravado.json = carga;
      return objeto;
    },
    status() {
      return objeto;
    },
  };
  const next = ((err?: unknown) => {
    gravado.erro = err;
  }) as unknown as NextFunction;
  return handler(
    { body, query: body, headers: {} } as unknown as Request,
    objeto as unknown as Response,
    next,
  ).then(() => gravado);
}

beforeEach(() => {
  estado.subscription = assinatura();
  estado.plano = { code: "pro_semiannual" };
  estado.token = {
    status: "valid",
    subscriptionId: "sub-1",
    periodEndMs: Date.parse(FUTURO),
  };
  estado.stripeCheckout = [];
  estado.asaasCheckout = [];
  estado.qr = {
    encodedImage: "img",
    payload: "copia-e-cola",
    expirationDate: null,
  };
  estado.asaasEnabled = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("metodoDaRenovacao: o metodo atual quando o plano o aceita, senao Pix", () => {
  it("semestral pago por boleto renova por boleto", () => {
    expect(metodoDaRenovacao("boleto", "pro_semiannual")).toBe("boleto");
  });
  it("mensal pago por boleto (caso legado) renova por Pix: boleto nao e permitido no mensal", () => {
    expect(metodoDaRenovacao("boleto", "pro_monthly")).toBe("pix");
  });
  it("Pix renova por Pix em qualquer plano avulso", () => {
    expect(metodoDaRenovacao("pix", "pro_semiannual")).toBe("pix");
    expect(metodoDaRenovacao("pix", "pro_monthly")).toBe("pix");
  });
  it("metodo ausente ou desconhecido cai em Pix", () => {
    expect(metodoDaRenovacao(null, "pro_annual")).toBe("pix");
    expect(metodoDaRenovacao("card", "pro_annual")).toBe("pix");
  });
});

describe("POST /renew despacha por provedor", () => {
  it("semestral boleto: Stripe, boleto, internalRenewal", async () => {
    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toBeUndefined();
    expect(estado.stripeCheckout).toHaveLength(1);
    expect(estado.stripeCheckout[0]).toMatchObject({
      planId: "pro_semiannual",
      paymentMethod: "boleto",
      internalRenewal: true,
      couponCode: "",
    });
    expect(estado.asaasCheckout).toEqual([]);
    expect(r.json).toEqual({
      data: { checkoutUrl: "https://stripe.test/cs", subscriptionId: "cs_1" },
    });
  });

  it("mensal boleto (o boleto de 21/09): Asaas, Pix, internalRenewal", async () => {
    estado.plano = { code: "pro_monthly" };

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toBeUndefined();
    expect(estado.stripeCheckout).toEqual([]);
    expect(estado.asaasCheckout).toHaveLength(1);
    expect(estado.asaasCheckout[0]).toMatchObject({
      planId: "pro_monthly",
      paymentMethod: "pix",
      internalRenewal: true,
      user: { id: "user-1", email: "pessoa@exemplo.com" },
    });
  });

  it("semestral pix: Asaas, e a resposta traz o QR junto do payload do checkout", async () => {
    estado.subscription = assinatura({ payment_method: "pix" });

    const r = await chamar(handleRenew, { token: "t" });

    expect(estado.asaasCheckout[0]).toMatchObject({ paymentMethod: "pix" });
    expect(r.json).toEqual({
      data: {
        checkoutUrl: "https://asaas.test/i/1",
        subscriptionId: "pay_novo",
        flow: "native_pix",
        amountCents: 2990,
        dueDate: "2026-09-08",
        pixQrCode: {
          encodedImage: "img",
          payload: "copia-e-cola",
          expirationDate: null,
        },
      },
    });
  });

  it("QR indisponivel NAO derruba a renovacao: a cobranca existe e checkoutUrl e o fallback", async () => {
    estado.subscription = assinatura({ payment_method: "pix" });
    estado.qr = new Error("asaas fora");

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toBeUndefined();
    expect((r.json!.data as Record<string, unknown>).pixQrCode).toBeNull();
  });

  it("Pix com Asaas desligado: 503 nomeado, sem tocar provedor nenhum", async () => {
    estado.subscription = assinatura({ payment_method: "pix" });
    estado.asaasEnabled = false;

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toMatchObject({ statusCode: 503, code: "asaas_disabled" });
    expect(estado.asaasCheckout).toEqual([]);
    expect(estado.stripeCheckout).toEqual([]);
  });
});

describe("qual assinatura pode renovar", () => {
  it("recem-vencida (canceled pelo cron de expiracao, periodo no passado) RENOVA", async () => {
    estado.subscription = assinatura({
      status: "canceled",
      current_period_end: PASSADO,
    });
    estado.token = {
      status: "valid",
      subscriptionId: "sub-1",
      periodEndMs: Date.parse(PASSADO),
    };

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toBeUndefined();
    expect(estado.stripeCheckout).toHaveLength(1);
  });

  it("canceled com periodo AINDA vigente (cancelamento real) continua indisponivel", async () => {
    estado.subscription = assinatura({ status: "canceled" });

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toMatchObject({
      statusCode: 404,
      code: "subscription_unavailable",
    });
  });

  it("superseded (ja renovada por linha nova) e already_renewed, nao uma segunda cobranca", async () => {
    estado.subscription = assinatura({ status: "superseded" });

    const r = await chamar(handleRenew, { token: "t" });

    expect(r.erro).toMatchObject({ statusCode: 409, code: "already_renewed" });
    expect(estado.stripeCheckout).toEqual([]);
  });
});

describe("GET /renew declara o metodo que a renovacao vai usar", () => {
  it("mensal boleto: preview diz pix", async () => {
    estado.plano = { code: "pro_monthly" };

    const r = await chamar(handleRenewPreview, { token: "t" });

    expect(r.json!.data).toMatchObject({
      planId: "pro_monthly",
      paymentMethod: "pix",
    });
  });

  it("semestral boleto: preview diz boleto", async () => {
    const r = await chamar(handleRenewPreview, { token: "t" });
    expect(r.json!.data).toMatchObject({ paymentMethod: "boleto" });
  });
});
