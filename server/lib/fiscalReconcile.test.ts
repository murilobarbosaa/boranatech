import { describe, expect, it } from "vitest";

import {
  decidirCharge,
  descricaoPorCompetencia,
  type ChargeParaReconciliar,
} from "./fiscalReconcile";

/**
 * A reconciliacao e o unico ponto que CRIA nota sem um webhook ter pedido.
 *
 * As duas exclusoes testadas aqui erram caro nos dois sentidos:
 *   - corte frouxo emite nota retroativa de mes que o contador ja fechou;
 *   - corte apertado deixa de emitir para quem pagou e tem direito;
 *   - cobranca sem dono emitida "no escuro" sai com dados de ninguem.
 *
 * Nenhuma delas aparece como erro: aparecem como documento fiscal errado.
 */

const CUTOFF = "2026-08-01";
const TODOS_OS_MEIOS = ["cartao", "pix", "boleto"] as const;

function charge(
  over: Partial<ChargeParaReconciliar> = {},
): ChargeParaReconciliar {
  return {
    provider: "stripe",
    // Balance transaction: na Stripe NAO e a identidade da cobranca.
    provider_transaction_id: "txn_1",
    stripe_charge_id: "ch_1",
    stripe_invoice_id: "in_1",
    gross_cents: 2990,
    occurred_at: "2026-08-04T15:00:00Z",
    user_id: "user-1",
    plan_code: "pro_monthly",
    stripe_pm_type: "card",
    ...over,
  };
}

describe("decidirCharge, corte", () => {
  it("cria para cobranca depois do corte", () => {
    expect(decidirCharge(charge(), CUTOFF, TODOS_OS_MEIOS)).toEqual({
      acao: "criar",
      chargeKey: "stripe:ch_1",
      competencia: "2026-08-04",
      meio: "cartao",
    });
  });

  it("cria para cobranca NO dia do corte (o corte e inclusivo)", () => {
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-08-01T12:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({
      acao: "criar",
      chargeKey: "stripe:ch_1",
      competencia: "2026-08-01",
      meio: "cartao",
    });
  });

  it("pula cobranca anterior ao corte", () => {
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-07-31T12:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
  });

  it("usa o dia de BRASILIA na fronteira, nao o dia UTC", () => {
    // 01/08 as 02:00 UTC ainda e 31/07 em Brasilia: esta cobranca e do dia
    // ANTERIOR ao corte para quem pagou, e nao pode gerar nota.
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-08-01T02:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });

    // 01/09 as 02:00 UTC e 31/08 em Brasilia: depois do corte, entra.
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-09-01T02:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({
      acao: "criar",
      chargeKey: "stripe:ch_1",
      competencia: "2026-08-31",
      meio: "cartao",
    });
  });

  it("data invalida NAO vira nota", () => {
    expect(
      decidirCharge(charge({ occurred_at: "sei la" }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({
      acao: "pular",
      motivo: "before_cutoff",
    });
  });
});

describe("decidirCharge, dono", () => {
  it("pula cobranca sem user_id, com motivo proprio", () => {
    // Contador separado de propósito: sem dono e um caso ACIONAVEL que aparece
    // no admin, ao contrario do corte, que e passado fechado.
    expect(
      decidirCharge(charge({ user_id: null }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({
      acao: "pular",
      motivo: "no_user",
    });
  });

  it("o CORTE tem precedencia sobre o dono", () => {
    // Cobranca antiga sem dono nao e problema a resolver. Se o dono viesse
    // primeiro, skipped_no_user encheria de linhas historicas e esconderia os
    // casos recentes, que sao os unicos em que alguem pode agir.
    expect(
      decidirCharge(
        charge({ user_id: null, occurred_at: "2026-07-01T12:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
  });

  it("pula linha sem charge id", () => {
    expect(
      decidirCharge(charge({ stripe_charge_id: null }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({
      acao: "pular",
      motivo: "sem_charge_id",
    });
  });
});

describe("decidirCharge, cobranca Pix do Asaas", () => {
  // Linha do ledger como o webhook do Asaas grava: sem nenhum id da Stripe, e
  // com o id do PAGAMENTO em provider_transaction_id.
  function pix(
    over: Partial<ChargeParaReconciliar> = {},
  ): ChargeParaReconciliar {
    return charge({
      provider: "asaas",
      provider_transaction_id: "pay_8x2k1m9q",
      stripe_charge_id: null,
      stripe_invoice_id: null,
      ...over,
    });
  }

  it("cria com a chave do pagamento no Asaas", () => {
    expect(decidirCharge(pix(), CUTOFF, TODOS_OS_MEIOS)).toEqual({
      acao: "criar",
      chargeKey: "asaas:pay_8x2k1m9q",
      competencia: "2026-08-04",
      meio: "pix",
    });
  });

  it("pula sem_charge_id quando falta o id DO ASAAS", () => {
    expect(
      decidirCharge(
        pix({ provider_transaction_id: null }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "sem_charge_id" });
  });

  it("corte e dono valem igual para o Pix", () => {
    expect(
      decidirCharge(
        pix({ occurred_at: "2026-07-31T12:00:00Z" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
    expect(
      decidirCharge(pix({ user_id: null }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({
      acao: "pular",
      motivo: "no_user",
    });
  });

  it("Stripe sem charge id NAO usa a balance transaction como chave", () => {
    // provider_transaction_id da Stripe e `txn_...`, que nao identifica a
    // cobranca: emitir por ele criaria uma nota que nenhum reembolso acha.
    expect(
      decidirCharge(
        charge({ stripe_charge_id: null, provider_transaction_id: "txn_1" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "sem_charge_id" });
  });

  it("provedor desconhecido LANCA em vez de pular calado", () => {
    expect(() =>
      decidirCharge(
        charge({ provider: "mercadopago" }),
        CUTOFF,
        TODOS_OS_MEIOS,
      ),
    ).toThrow(/Provedor de pagamento desconhecido/);
  });
});

describe("decidirCharge, meio de pagamento (regra R1)", () => {
  it("meio fora da lista NAO vira nota, com motivo proprio", () => {
    expect(decidirCharge(charge(), CUTOFF, ["pix", "boleto"])).toEqual({
      acao: "pular",
      motivo: "meio_fora_da_emissao",
    });
  });

  it("boleto da Stripe e classificado pelo payment_method_details", () => {
    expect(
      decidirCharge(charge({ stripe_pm_type: "boleto" }), CUTOFF, ["boleto"]),
    ).toEqual({
      acao: "criar",
      chargeKey: "stripe:ch_1",
      competencia: "2026-08-04",
      meio: "boleto",
    });
  });

  it("Pix do Asaas fora da lista NAO vira nota", () => {
    expect(
      decidirCharge(
        charge({
          provider: "asaas",
          provider_transaction_id: "pay_1",
          stripe_charge_id: null,
          stripe_pm_type: null,
        }),
        CUTOFF,
        ["cartao", "boleto"],
      ),
    ).toEqual({ acao: "pular", motivo: "meio_fora_da_emissao" });
  });

  it("meio que nao se classifica e motivo SEPARADO de meio fora da lista", () => {
    expect(
      decidirCharge(charge({ stripe_pm_type: null }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({ acao: "pular", motivo: "meio_desconhecido" });
    expect(
      decidirCharge(charge({ stripe_pm_type: "pix" }), CUTOFF, TODOS_OS_MEIOS),
    ).toEqual({ acao: "pular", motivo: "meio_desconhecido" });
  });
});

describe("decidirCharge, corte de producao (regra R8)", () => {
  it("venda antes de 2026-10-01 nunca vira linha", () => {
    // 23:59 de 30/09 em Brasilia (02:59Z de 01/10): setembro, regularizado
    // pela nota agregada manual, nunca por nota individual.
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-10-01T02:59:00Z" }),
        "2026-10-01",
        TODOS_OS_MEIOS,
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
    expect(
      decidirCharge(
        charge({ occurred_at: "2026-10-01T03:00:00Z" }),
        "2026-10-01",
        TODOS_OS_MEIOS,
      ),
    ).toEqual({
      acao: "criar",
      chargeKey: "stripe:ch_1",
      competencia: "2026-10-01",
      meio: "cartao",
    });
  });
});

describe("descricaoPorCompetencia", () => {
  it("usa COMPETENCIA, nunca um periodo inventado", () => {
    // finance_transactions sabe quando o dinheiro entrou, e nao o intervalo
    // coberto. Inventar "periodo de X a Y" imprimiria um intervalo plausivel e
    // possivelmente errado num documento fiscal.
    expect(descricaoPorCompetencia("pro_annual", "2026-08-04T15:00:00Z")).toBe(
      "Assinatura Bora na Tech Pro, plano anual, competência 04/08/2026",
    );
  });

  it("competencia no dia de Brasilia", () => {
    expect(descricaoPorCompetencia("pro_monthly", "2026-08-01T02:00:00Z")).toBe(
      "Assinatura Bora na Tech Pro, plano mensal, competência 31/07/2026",
    );
  });

  it("degrada sem plano conhecido, sem imprimir o code cru", () => {
    expect(descricaoPorCompetencia("plano_zumbi", "2026-08-04T15:00:00Z")).toBe(
      "Assinatura Bora na Tech Pro, competência 04/08/2026",
    );
  });

  it("nunca usa travessao", () => {
    expect(
      descricaoPorCompetencia("pro_monthly", "2026-08-04T15:00:00Z"),
    ).not.toMatch(/[—–]/);
  });
});
