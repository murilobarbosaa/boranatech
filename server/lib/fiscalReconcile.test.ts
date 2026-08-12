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

function charge(
  over: Partial<ChargeParaReconciliar> = {},
): ChargeParaReconciliar {
  return {
    stripe_charge_id: "ch_1",
    stripe_invoice_id: "in_1",
    gross_cents: 2990,
    occurred_at: "2026-08-04T15:00:00Z",
    user_id: "user-1",
    plan_code: "pro_monthly",
    ...over,
  };
}

describe("decidirCharge, corte", () => {
  it("cria para cobranca depois do corte", () => {
    expect(decidirCharge(charge(), CUTOFF)).toEqual({ acao: "criar" });
  });

  it("cria para cobranca NO dia do corte (o corte e inclusivo)", () => {
    expect(
      decidirCharge(charge({ occurred_at: "2026-08-01T12:00:00Z" }), CUTOFF),
    ).toEqual({ acao: "criar" });
  });

  it("pula cobranca anterior ao corte", () => {
    expect(
      decidirCharge(charge({ occurred_at: "2026-07-31T12:00:00Z" }), CUTOFF),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
  });

  it("usa o dia de BRASILIA na fronteira, nao o dia UTC", () => {
    // 01/08 as 02:00 UTC ainda e 31/07 em Brasilia: esta cobranca e do dia
    // ANTERIOR ao corte para quem pagou, e nao pode gerar nota.
    expect(
      decidirCharge(charge({ occurred_at: "2026-08-01T02:00:00Z" }), CUTOFF),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });

    // 01/09 as 02:00 UTC e 31/08 em Brasilia: depois do corte, entra.
    expect(
      decidirCharge(charge({ occurred_at: "2026-09-01T02:00:00Z" }), CUTOFF),
    ).toEqual({ acao: "criar" });
  });

  it("data invalida NAO vira nota", () => {
    expect(decidirCharge(charge({ occurred_at: "sei la" }), CUTOFF)).toEqual({
      acao: "pular",
      motivo: "before_cutoff",
    });
  });
});

describe("decidirCharge, dono", () => {
  it("pula cobranca sem user_id, com motivo proprio", () => {
    // Contador separado de propósito: sem dono e um caso ACIONAVEL que aparece
    // no admin, ao contrario do corte, que e passado fechado.
    expect(decidirCharge(charge({ user_id: null }), CUTOFF)).toEqual({
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
      ),
    ).toEqual({ acao: "pular", motivo: "before_cutoff" });
  });

  it("pula linha sem charge id", () => {
    expect(decidirCharge(charge({ stripe_charge_id: null }), CUTOFF)).toEqual({
      acao: "pular",
      motivo: "sem_charge_id",
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
