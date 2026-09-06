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

  it("meio fora do mapa de um plano e recusado sem precisar ser citado", () => {
    // `boleto` nao aparece em ONE_OFF_ACCESS_DAYS.boleto para `pro_monthly`. A
    // recusa NAO vem de uma linha que o nomeia: vem da ausencia dele no mapa.
    expect(isPaymentMethodAllowed("pro_monthly", "boleto")).toBe(false);
    expect(oneOffAccessDays("pro_monthly", "boleto")).toBeUndefined();
  });
});

describe("permissao e duracao saem do MESMO mapa, POR METODO", () => {
  // DECISAO DO LOTE 2b (2026-09-06): Pix e permitido no mensal, boleto nao. O
  // Pix cai na hora e renova por QR; um boleto por mes seria pior para quem
  // compra e para quem opera. Por isso o mapa deixou de ser so por plano.
  it("mensal aceita cartao e Pix, e NAO boleto", () => {
    expect(allowedPaymentMethods("pro_monthly")).toEqual(["card", "pix"]);
  });

  it("semestral e anual aceitam cartao, boleto e Pix", () => {
    expect(allowedPaymentMethods("pro_semiannual")).toEqual([
      "card",
      "boleto",
      "pix",
    ]);
    expect(allowedPaymentMethods("pro_annual")).toEqual([
      "card",
      "boleto",
      "pix",
    ]);
  });

  it("dias de acesso por metodo e plano: a tabela literal", () => {
    expect(oneOffAccessDays("pro_monthly", "pix")).toBe(30);
    expect(oneOffAccessDays("pro_semiannual", "pix")).toBe(182);
    expect(oneOffAccessDays("pro_annual", "pix")).toBe(365);
    expect(oneOffAccessDays("pro_semiannual", "boleto")).toBe(182);
    expect(oneOffAccessDays("pro_annual", "boleto")).toBe(365);
  });

  it("a implicacao vale nos dois sentidos, para cada metodo avulso", () => {
    for (const planId of PLAN_ORDER) {
      for (const metodo of ["boleto", "pix"] as const) {
        const temPrazo = oneOffAccessDays(planId, metodo) !== undefined;
        expect(isPaymentMethodAllowed(planId, metodo)).toBe(temPrazo);
      }
    }
  });

  it("cartao vale em TODO plano: e o unico recorrente", () => {
    for (const planId of PLAN_ORDER) {
      expect(isPaymentMethodAllowed(planId, "card")).toBe(true);
    }
  });

  it("onde os dois meios existem, concedem o MESMO acesso", () => {
    for (const planId of ["pro_semiannual", "pro_annual"] as PlanId[]) {
      expect(oneOffAccessDays(planId, "boleto")).toBe(
        oneOffAccessDays(planId, "pix"),
      );
    }
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
