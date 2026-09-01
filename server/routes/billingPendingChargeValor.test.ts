import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O VALOR DA COBRANCA PENDENTE.
 *
 * O card da pagina de assinatura anunciava `VALOR R$ 129,00` sobre uma cobranca
 * de R$ 12,90 criada com cupom de 90%. A cobranca estava certa (o Asaas
 * confirmou os R$ 12,90): quem errava era a tela, que precificava pelo plano.
 *
 * Nao ha copia local para consertar isso: a linha pendente de `subscriptions`
 * guarda `plan_id` e `coupon_code`, e nenhum dos dois e o valor cobrado. O valor
 * vem do provedor, e por isso os dois casos que importam sao "o provedor
 * respondeu" e "o provedor nao respondeu". O segundo NAO pode virar zero nem
 * derrubar a rota: vira `null`, e a tela cai no preco do plano.
 */

const estado = vi.hoisted(() => ({
  pendente: null as Record<string, unknown> | null,
  plano: { code: "pro_semiannual" } as Record<string, unknown> | null,
  /** O que `fetchChargeAmountCents` devolve, ou o erro que ela lanca. */
  valorDoProvedor: null as number | null,
  chamadasAoProvedor: [] as string[],
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    billingEnabled: true,
    asaasEnabled: true,
    isProd: false,
    devProUserIds: [],
  },
}));
vi.mock("../lib/renewalToken", () => ({
  verifyRenewalToken: () => ({ status: "invalid" }),
  issueRenewalToken: () => "t",
}));
vi.mock("../lib/fiscalStorage", () => ({ signedFiscalUrl: async () => null }));
vi.mock("../providers", () => ({ stripeProvider: {}, asaasProvider: {} }));

vi.mock("../providers/asaas", () => ({
  fetchPixQrCode: vi.fn(),
  // O dube ESPELHA o contrato real: a funcao de producao ja engole o erro e
  // devolve null. Um dube que lancasse provaria outra funcao.
  fetchChargeAmountCents: async (chargeId: string) => {
    estado.chamadasAoProvedor.push(chargeId);
    return estado.valorDoProvedor;
  },
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const iguais: Record<string, unknown> = {};
    const q: Record<string, unknown> = {};
    for (const m of ["select", "in", "order", "limit", "is", "gt", "neq"]) {
      q[m] = () => q;
    }
    q.eq = (coluna: string, valor: unknown) => {
      iguais[coluna] = valor;
      return q;
    };
    q.maybeSingle = async () => {
      if (tabela === "plans") return { data: estado.plano, error: null };
      if (tabela === "subscriptions") {
        // A rota consulta `subscriptions` duas vezes; so a segunda filtra por
        // status pendente. Separar pelo FILTRO, e nao pela ordem, porque ordem
        // de chamada e detalhe de implementacao e mudaria em qualquer refactor.
        if (iguais.status === "pending") {
          return { data: estado.pendente, error: null };
        }
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };
    q.single = async () => ({ data: estado.plano, error: null });
    return q;
  }
  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      rpc: async () => ({ data: false, error: null }),
    },
  };
});

import { handleGetSubscription } from "./billing";

function req() {
  return {
    user: { id: "user-1", email: "a@b.com" },
    isPro: false,
    headers: {},
  } as unknown as Request;
}

function res() {
  const gravado: { json?: Record<string, unknown> } = {};
  const objeto = {
    json(carga: Record<string, unknown>) {
      gravado.json = carga;
      return objeto;
    },
    status() {
      return objeto;
    },
  };
  return { objeto: objeto as unknown as Response, gravado };
}

const next = ((err?: unknown) => {
  if (err) throw err;
}) as unknown as NextFunction;

function linhaPendente(over: Record<string, unknown> = {}) {
  return {
    created_at: "2026-09-01T03:42:54.011Z",
    plan_id: "plan-1",
    payment_method: "pix",
    provider: "asaas",
    provider_subscription_id: "pay_abc123",
    status: "pending",
    ...over,
  };
}

async function pendingCharge() {
  const r = res();
  await handleGetSubscription(req(), r.objeto, next);
  const data = r.gravado.json?.data as Record<string, unknown>;
  return data.pendingCharge as Record<string, unknown> | null;
}

describe("valor da cobranca pendente no payload", () => {
  beforeEach(() => {
    estado.pendente = linhaPendente();
    estado.plano = { code: "pro_semiannual" };
    estado.valorDoProvedor = null;
    estado.chamadasAoProvedor = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("provedor devolve o valor: o campo carrega os centavos da COBRANCA", async () => {
    estado.valorDoProvedor = 1290;

    const pc = await pendingCharge();
    expect(pc).toMatchObject({
      planCode: "pro_semiannual",
      paymentMethod: "pix",
      amountCents: 1290,
    });
  });

  it("o valor NAO e o preco do plano: 1290 e nao 12900", async () => {
    // O defeito original em uma linha. O plano semestral custa R$ 129,00 e a
    // cobranca com cupom saiu R$ 12,90; se algum dia alguem "simplificar" isto
    // para o preco do plano, e aqui que quebra.
    estado.valorDoProvedor = 1290;

    expect((await pendingCharge())?.amountCents).toBe(1290);
  });

  it("provedor nao respondeu: o campo vira null, nunca zero", async () => {
    // Zero seria um preco plausivel e errado, indistinguivel de uma cobranca
    // gratuita. `null` e a tela cai no preco do plano, que e o comportamento
    // antigo e nao mente sobre a origem.
    estado.valorDoProvedor = null;

    const pc = await pendingCharge();
    expect(pc?.amountCents).toBeNull();
    expect(pc?.amountCents).not.toBe(0);
  });

  it("a rota NAO cai quando o provedor falha: o resto do payload continua la", async () => {
    estado.valorDoProvedor = null;

    const pc = await pendingCharge();
    expect(pc).toMatchObject({
      planCode: "pro_semiannual",
      paymentMethod: "pix",
    });
  });

  it("le a cobranca certa: passa o provider_subscription_id da linha", async () => {
    estado.valorDoProvedor = 1290;
    await pendingCharge();

    expect(estado.chamadasAoProvedor).toEqual(["pay_abc123"]);
  });
});

describe("quando NAO consultar o provedor", () => {
  beforeEach(() => {
    estado.plano = { code: "pro_semiannual" };
    estado.valorDoProvedor = 1290;
    estado.chamadasAoProvedor = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("boleto da Stripe nao consulta o Asaas, e fica sem valor", async () => {
    // O boleto nao passa por este caminho, e este lote nao muda o que ele faz.
    estado.pendente = linhaPendente({
      payment_method: "boleto",
      provider: "stripe",
      provider_subscription_id: "cs_test_1",
    });

    const pc = await pendingCharge();
    expect(estado.chamadasAoProvedor).toEqual([]);
    expect(pc?.amountCents).toBeNull();
  });

  it("linha asaas sem id de cobranca nao chama o provedor", async () => {
    // Estado real e transitorio: a linha nasce com `provider_subscription_id`
    // nulo e so e amarrada depois da criacao remota.
    estado.pendente = linhaPendente({ provider_subscription_id: null });

    const pc = await pendingCharge();
    expect(estado.chamadasAoProvedor).toEqual([]);
    expect(pc?.amountCents).toBeNull();
  });

  it("sem cobranca pendente nenhuma, pendingCharge e null", async () => {
    estado.pendente = null;

    expect(await pendingCharge()).toBeNull();
    expect(estado.chamadasAoProvedor).toEqual([]);
  });
});
