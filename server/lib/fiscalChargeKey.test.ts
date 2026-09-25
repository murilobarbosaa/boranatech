import { Job } from "bullmq";
import { describe, expect, it } from "vitest";

import { chargeKeyOf, fiscalJobId } from "./fiscalChargeKey";

/**
 * A chave e a identidade da nota: uma chave errada nao falha, ela casa com a
 * nota de outra cobranca ou com nenhuma. Por isso as expectativas sao literais
 * escritas a mao, e nao recomputadas pelo proprio helper.
 */

/**
 * A regra de jobId do BullMQ INSTALADO, chamada de verdade. `validateOptions` e
 * o metodo que o `Queue.add` roda antes de falar com o Redis; chama-lo com um
 * `this` minimo mede a regra real, e nao uma copia dela escrita aqui.
 */
function bullmqAceita(jobId: string): true | string {
  // `validateOptions` e `protected` na tipagem; o acesso pelo prototipo e o
  // preco de medir a regra real sem subir Redis.
  const prototipo = Job.prototype as unknown as {
    validateOptions: (this: unknown, jobData: { data: string }) => void;
  };
  try {
    prototipo.validateOptions.call(
      { opts: { jobId }, name: "fiscal" },
      { data: "{}" },
    );
    return true;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

describe("chargeKeyOf", () => {
  it("Stripe: provedor, dois-pontos e o id da charge", () => {
    expect(chargeKeyOf("stripe", "ch_3PabcXYZ")).toBe("stripe:ch_3PabcXYZ");
  });

  it("Asaas: provedor, dois-pontos e o id do pagamento", () => {
    expect(chargeKeyOf("asaas", "pay_8x2k1m9q")).toBe("asaas:pay_8x2k1m9q");
  });

  it("provedor desconhecido LANCA", () => {
    expect(() => chargeKeyOf("mercadopago", "123")).toThrow(
      /Provedor de pagamento desconhecido/,
    );
  });

  it("id vazio LANCA", () => {
    expect(() => chargeKeyOf("asaas", "")).toThrow(/vazio/);
  });

  it("id com o separador LANCA", () => {
    expect(() => chargeKeyOf("stripe", "ch:1")).toThrow(/nao cabe/);
  });
});

describe("fiscalJobId", () => {
  it("emissao e cancelamento da mesma cobranca tem jobIds diferentes", () => {
    expect(fiscalJobId("issue", "stripe:ch_1")).toBe("issue-stripe-ch_1");
    expect(fiscalJobId("cancel", "stripe:ch_1")).toBe("cancel-stripe-ch_1");
    expect(fiscalJobId("issue", "asaas:pay_1")).toBe("issue-asaas-pay_1");
    expect(fiscalJobId("cancel", "asaas:pay_1")).toBe("cancel-asaas-pay_1");
  });

  it("o BullMQ instalado aceita os jobIds derivados", () => {
    expect(bullmqAceita(fiscalJobId("issue", "stripe:ch_1"))).toBe(true);
    expect(bullmqAceita(fiscalJobId("cancel", "stripe:ch_1"))).toBe(true);
    expect(bullmqAceita(fiscalJobId("issue", "asaas:pay_1"))).toBe(true);
    expect(bullmqAceita(fiscalJobId("cancel", "asaas:pay_1"))).toBe(true);
  });

  it("o BullMQ instalado RECUSA a chave crua e o jobId de cancelamento antigo", () => {
    // Trava o motivo do helper existir: a chave nao pode ir crua para o jobId,
    // e o `cancel:${stripeChargeId}` de antes deste lote lancava em todo
    // cancelamento.
    expect(bullmqAceita("stripe:ch_1")).toBe("Custom Id cannot contain :");
    expect(bullmqAceita("cancel:ch_1")).toBe("Custom Id cannot contain :");
  });
});
