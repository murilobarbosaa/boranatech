import { describe, expect, it } from "vitest";

import {
  allowedPaymentMethods,
  isPaymentMethodAllowed,
  isPaymentMethodId,
  oneOffAccessDays,
  PAYMENT_METHODS,
} from "./paymentMethods";
import { PLAN_ORDER, type PlanId } from "./planPricing";

/**
 * PONTO UNICO DE GATING: plano x meio de pagamento.
 *
 * A propriedade que estes casos travam nao e a lista atual, e sim a DIRECAO da
 * regra. As tres camadas anteriores negavam POR NOME (`planId === "pro_monthly"`),
 * entao um plano ou um meio novo passava por OMISSAO: elas so sabiam recusar o
 * que ja estava escrito. Um mapa por inclusao inverte isso, e o teste tem de
 * provar a inversao, nao repetir a tabela.
 */

describe("negacao por OMISSAO, que e o ponto da inversao", () => {
  it("um meio ficticio nao e reconhecido como meio de pagamento", () => {
    expect(isPaymentMethodId("cripto")).toBe(false);
    expect(isPaymentMethodId("")).toBe(false);
    expect(isPaymentMethodId(undefined)).toBe(false);
    expect(isPaymentMethodId(null)).toBe(false);
    expect(isPaymentMethodId(123)).toBe(false);
  });

  it("um meio ficticio nao aparece em plano NENHUM", () => {
    for (const planId of PLAN_ORDER) {
      expect(allowedPaymentMethods(planId)).not.toContain("cripto");
    }
  });

  it("TODO meio permitido em qualquer plano esta na uniao fechada", () => {
    // O inverso do caso acima: nada escapa da uniao por um caminho lateral.
    for (const planId of PLAN_ORDER) {
      for (const metodo of allowedPaymentMethods(planId)) {
        expect(PAYMENT_METHODS).toContain(metodo);
      }
    }
  });

  it("plano fora do mapa de avulsos so aceita cartao, sem precisar ser citado", () => {
    // `pro_monthly` nao aparece em ONE_OFF_ACCESS_DAYS. A recusa de boleto e Pix
    // nele NAO vem de uma linha que o nomeia: vem da ausencia dele no mapa.
    expect(allowedPaymentMethods("pro_monthly")).toEqual(["card"]);
    expect(isPaymentMethodAllowed("pro_monthly", "boleto")).toBe(false);
    expect(isPaymentMethodAllowed("pro_monthly", "pix")).toBe(false);
  });
});

describe("permissao e duracao saem do MESMO mapa", () => {
  it("plano com dias de acesso aceita os avulsos", () => {
    for (const planId of ["pro_semiannual", "pro_annual"] as PlanId[]) {
      expect(oneOffAccessDays(planId)).toBeGreaterThan(0);
      expect(isPaymentMethodAllowed(planId, "boleto")).toBe(true);
      expect(isPaymentMethodAllowed(planId, "pix")).toBe(true);
    }
  });

  it("plano SEM dias de acesso nao aceita avulso: a implicacao vale nos dois sentidos", () => {
    for (const planId of PLAN_ORDER) {
      const temPrazo = oneOffAccessDays(planId) !== undefined;
      expect(isPaymentMethodAllowed(planId, "boleto")).toBe(temPrazo);
      expect(isPaymentMethodAllowed(planId, "pix")).toBe(temPrazo);
    }
  });

  it("cartao vale em TODO plano: e o unico recorrente", () => {
    for (const planId of PLAN_ORDER) {
      expect(isPaymentMethodAllowed(planId, "card")).toBe(true);
    }
  });

  it("boleto e Pix concedem o MESMO acesso: o prazo nao depende do meio", () => {
    // Se um dia divergirem, foi decisao de alguem e este caso quebra. Hoje os
    // dois leem o mesmo `oneOffAccessDays`, entao a igualdade e estrutural.
    expect(oneOffAccessDays("pro_semiannual")).toBe(182);
    expect(oneOffAccessDays("pro_annual")).toBe(365);
  });
});

describe("todo plano existente tem veredito", () => {
  it("nenhum PlanId fica sem meio de pagamento nenhum", () => {
    // Um plano novo que ninguem declarou nao pode ficar invendavel em silencio:
    // ele ao menos aceita cartao, e este caso e o que avisa se isso mudar.
    for (const planId of PLAN_ORDER) {
      expect(allowedPaymentMethods(planId).length).toBeGreaterThan(0);
    }
  });
});
