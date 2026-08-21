import { describe, expect, it } from "vitest";

import {
  MEIOS_DE_PAGAMENTO_PERMITIDOS,
  patchDeMeioDePagamento,
  resolvePaymentMethod,
} from "./paymentMethod";

/**
 * O meio de pagamento NAO e deduzido ("nao e boleto, logo e cartao"). Ele e
 * LIDO de onde a Stripe declara qual meio a cobranca aceitava. Quando a
 * declaracao nao existe, ou nao e conclusiva, o campo fica NULO: nulo honesto
 * vale mais que valor inventado, porque um valor inventado nao tem como ser
 * distinguido depois de um medido.
 */

describe("resolvePaymentMethod", () => {
  it("lê o meio de payment_settings da assinatura", () => {
    expect(
      resolvePaymentMethod({
        payment_settings: { payment_method_types: ["card"] },
      }),
    ).toBe("card");
  });

  it("lê o meio de payment_method_types da sessão de checkout", () => {
    expect(resolvePaymentMethod({ payment_method_types: ["boleto"] })).toBe(
      "boleto",
    );
  });

  it("prefere a sessão quando as duas fontes existem", () => {
    // payment_method_types da SESSAO e o que a cobranca daquele checkout
    // aceitava; payment_settings e a configuracao da assinatura. A sessao e
    // mais especifica do evento que estamos gravando.
    expect(
      resolvePaymentMethod({
        payment_method_types: ["boleto"],
        payment_settings: { payment_method_types: ["card"] },
      }),
    ).toBe("boleto");
  });

  it("LISTA COM MAIS DE UM MEIO é ambígua e devolve null", () => {
    // O campo diz o que foi OFERECIDO, nao o que foi USADO. Com dois meios
    // oferecidos nao da para saber por qual a pessoa pagou, e chutar o primeiro
    // seria exatamente a deducao que este arquivo existe para evitar. Medido:
    // 1 linha de producao esta nesse caso (card+boleto).
    expect(
      resolvePaymentMethod({ payment_method_types: ["card", "boleto"] }),
    ).toBeNull();
  });

  it("lista vazia, ausente ou de tipo errado devolve null", () => {
    expect(resolvePaymentMethod({ payment_method_types: [] })).toBeNull();
    expect(resolvePaymentMethod({})).toBeNull();
    expect(resolvePaymentMethod(null)).toBeNull();
    expect(resolvePaymentMethod(undefined)).toBeNull();
    expect(
      resolvePaymentMethod({ payment_method_types: "card" as never }),
    ).toBeNull();
  });

  it("meio que o CHECK da coluna NAO aceita devolve null, em vez de estourar o insert", () => {
    // O CHECK e (card, pix, boleto). A Stripe tem dezenas de outros tipos
    // (link, customer_balance, us_bank_account...). Gravar um deles derrubaria
    // a escrita da assinatura INTEIRA por causa de um campo cosmetico, entao a
    // guarda mora aqui dentro, e nao em cada chamador.
    expect(
      resolvePaymentMethod({ payment_method_types: ["customer_balance"] }),
    ).toBeNull();
    expect(resolvePaymentMethod({ payment_method_types: ["link"] })).toBeNull();
  });

  it("os três meios do CHECK passam", () => {
    for (const meio of ["card", "pix", "boleto"]) {
      expect(resolvePaymentMethod({ payment_method_types: [meio] })).toBe(meio);
    }
    // O conjunto e afirmado, nao so a pertinencia: se o CHECK da migration
    // mudar, este teste cai e alguem decide de propósito.
    expect(Array.from(MEIOS_DE_PAGAMENTO_PERMITIDOS).sort()).toEqual([
      "boleto",
      "card",
      "pix",
    ]);
  });
});

describe("patchDeMeioDePagamento", () => {
  it("resolvido: a chave entra no patch", () => {
    expect(
      patchDeMeioDePagamento({
        payment_settings: { payment_method_types: ["card"] },
      }),
    ).toEqual({ payment_method: "card" });
  });

  it("NÃO resolvido: a chave NÃO entra, em vez de entrar nula", () => {
    // É a diferença entre "não sei" e "apague o que você sabia". invoice.paid e
    // customer.subscription.updated chegam DEPOIS do checkout.session.completed
    // e nem sempre declaram o meio; com a chave nula, o update apagaria o valor
    // que a criação resolveu.
    expect(patchDeMeioDePagamento({})).toEqual({});
    expect(patchDeMeioDePagamento(null)).toEqual({});
    expect(
      patchDeMeioDePagamento({ payment_method_types: ["card", "boleto"] }),
    ).toEqual({});
  });

  it("espalhar o patch vazio não altera o objeto de destino", () => {
    const base = { status: "active", payment_method: "boleto" };
    expect({ ...base, ...patchDeMeioDePagamento(null) }).toEqual(base);
  });
});
