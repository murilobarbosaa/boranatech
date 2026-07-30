import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  criarLimitadorDeReembolso,
  idempotencyKeyForRefund,
  stripeReasonFor,
  validateRefundRequest,
} from "./refund";

/**
 * Peças puras da emissão de reembolso.
 *
 * É a única ação da demanda sem desfazer. Cada guarda aqui é obrigatória, e o
 * ponto mais delicado é a chave de idempotência: ela precisa deduplicar o duplo
 * clique SEM bloquear dois reembolsos parciais legítimos do mesmo valor.
 */

describe("idempotencyKeyForRefund", () => {
  it("duplo clique da MESMA operação gera a mesma chave", () => {
    const a = idempotencyKeyForRefund("ch_1", 5000, 0);
    const b = idempotencyKeyForRefund("ch_1", 5000, 0);
    expect(a).toBe(b);
  });

  it("dois parciais LEGÍTIMOS de mesmo valor geram chaves DIFERENTES", () => {
    // R$50 numa cobrança de R$200, duas vezes, é operação válida. Uma chave
    // baseada só em charge+valor bloquearia a segunda, e a Stripe devolveria o
    // PRIMEIRO reembolso como se fosse o segundo: o admin veria sucesso e o
    // dinheiro não teria saído. O já-reembolsado entra na chave justamente
    // para separar os dois casos.
    const primeiro = idempotencyKeyForRefund("ch_1", 5000, 0);
    const segundo = idempotencyKeyForRefund("ch_1", 5000, 5000);
    expect(primeiro).not.toBe(segundo);
  });

  it("charges diferentes nunca colidem", () => {
    expect(idempotencyKeyForRefund("ch_1", 5000, 0)).not.toBe(
      idempotencyKeyForRefund("ch_2", 5000, 0),
    );
  });

  it("valores diferentes na mesma situação não colidem", () => {
    expect(idempotencyKeyForRefund("ch_1", 5000, 0)).not.toBe(
      idempotencyKeyForRefund("ch_1", 6000, 0),
    );
  });

  it("a chave cabe no limite de 255 caracteres da Stripe", () => {
    expect(
      idempotencyKeyForRefund("ch_" + "x".repeat(200), 1, 0).length,
    ).toBeLessThanOrEqual(255);
  });
});

describe("stripeReasonFor: texto livre do admin -> enum da Stripe", () => {
  it("o padrão é requested_by_customer", () => {
    expect(stripeReasonFor("cliente pediu por e-mail")).toBe(
      "requested_by_customer",
    );
  });

  it("NUNCA infere 'fraudulent' do texto livre", () => {
    // Marcar fraudulent tem efeito colateral fora do nosso sistema: a Stripe
    // adiciona o cartão e o e-mail às block lists do Radar. Isso é decisão
    // deliberada de antifraude, não algo a deduzir de uma palavra digitada
    // num campo de motivo.
    expect(stripeReasonFor("suspeita de fraude no cartão")).toBe(
      "requested_by_customer",
    );
    expect(stripeReasonFor("fraudulent")).toBe("requested_by_customer");
  });

  it("cobrança duplicada é o único desvio, e só com marcação explícita", () => {
    expect(stripeReasonFor("cobrança duplicada", "duplicate")).toBe(
      "duplicate",
    );
  });

  it("marcação inválida cai no padrão em vez de vazar para a Stripe", () => {
    expect(stripeReasonFor("x", "xpto" as never)).toBe("requested_by_customer");
  });
});

describe("validateRefundRequest", () => {
  const CHARGE = {
    id: "ft1",
    type: "charge",
    stripe_charge_id: "ch_1",
    gross_cents: 20000,
    refunded_cents: 0,
    disputed_cents: 0,
    refundable_cents: 20000,
    refund_state: "none",
  };

  it("reembolso total sem amount usa o teto", () => {
    const r = validateRefundRequest(CHARGE, { reason: "x" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.amountCents).toBe(20000);
  });

  it("parcial dentro do teto passa", () => {
    const r = validateRefundRequest(CHARGE, { amountCents: 5000, reason: "x" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.amountCents).toBe(5000);
  });

  it("acima do teto é recusado", () => {
    const r = validateRefundRequest(CHARGE, {
      amountCents: 20001,
      reason: "x",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("amount_above_refundable");
  });

  it("teto REDUZIDO por reembolso anterior é respeitado", () => {
    const parcial = {
      ...CHARGE,
      refunded_cents: 15000,
      refundable_cents: 5000,
      refund_state: "partial",
    };
    expect(
      validateRefundRequest(parcial, { amountCents: 6000, reason: "x" }).ok,
    ).toBe(false);
    expect(
      validateRefundRequest(parcial, { amountCents: 5000, reason: "x" }).ok,
    ).toBe(true);
  });

  it("teto REDUZIDO por disputa é respeitado", () => {
    // O dinheiro da disputa já saiu; tentar reembolsar por cima é pedir à
    // Stripe algo que ela recusa.
    const disputado = { ...CHARGE, disputed_cents: 20000, refundable_cents: 0 };
    const r = validateRefundRequest(disputado, { amountCents: 1, reason: "x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("nothing_refundable");
  });

  it("cobrança já totalmente reembolsada não aceita mais nada", () => {
    const total = {
      ...CHARGE,
      refunded_cents: 20000,
      refundable_cents: 0,
      refund_state: "full",
    };
    expect(validateRefundRequest(total, { reason: "x" }).ok).toBe(false);
  });

  it("valor zero ou negativo é recusado", () => {
    expect(
      validateRefundRequest(CHARGE, { amountCents: 0, reason: "x" }).ok,
    ).toBe(false);
    expect(
      validateRefundRequest(CHARGE, { amountCents: -100, reason: "x" }).ok,
    ).toBe(false);
  });

  it("valor não inteiro é recusado: centavo fracionado não existe", () => {
    expect(
      validateRefundRequest(CHARGE, { amountCents: 10.5, reason: "x" }).ok,
    ).toBe(false);
  });

  it("motivo ausente é recusado", () => {
    const r = validateRefundRequest(CHARGE, { amountCents: 100, reason: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("reason_required");
  });

  it("linha que NÃO é charge é recusada", () => {
    const refund = { ...CHARGE, type: "refund" };
    const r = validateRefundRequest(refund, { reason: "x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("not_a_charge");
  });

  it("charge de BOLETO é recusada com código próprio", () => {
    // Boleto não tem reembolso nativo na Stripe: o destino seria
    // br_bank_transfer, que exige dados bancários do cliente.
    const boleto = { ...CHARGE, stripe_charge_id: "py_1", is_boleto: true };
    const r = validateRefundRequest(boleto, { reason: "x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("boleto_not_refundable");
  });
});

describe("criarLimitadorDeReembolso", () => {
  it("deixa passar até o teto e barra depois", () => {
    const excedeu = criarLimitadorDeReembolso({ max: 3, janelaMs: 60_000 });
    expect(excedeu("admin", 0)).toBe(false);
    expect(excedeu("admin", 1)).toBe(false);
    expect(excedeu("admin", 2)).toBe(false);
    expect(excedeu("admin", 3)).toBe(true);
  });

  it("conta por ATOR: um admin não gasta a cota do outro", () => {
    const excedeu = criarLimitadorDeReembolso({ max: 1, janelaMs: 60_000 });
    expect(excedeu("a", 0)).toBe(false);
    expect(excedeu("b", 0)).toBe(false);
    expect(excedeu("a", 1)).toBe(true);
  });

  it("a janela reabre depois do tempo", () => {
    const excedeu = criarLimitadorDeReembolso({ max: 1, janelaMs: 1000 });
    expect(excedeu("a", 0)).toBe(false);
    expect(excedeu("a", 500)).toBe(true);
    expect(excedeu("a", 2000)).toBe(false);
  });
});

describe("reembolso NÃO depende do kill-switch de vendas", () => {
  it("getStripe() só exige STRIPE_SECRET_KEY, nunca BILLING_ENABLED", () => {
    // Decisão registrada: o kill-switch existe para parar de VENDER. Travar a
    // devolução durante um incidente é o oposto do que se quer.
    //
    // A prova é estrutural e vale mais que um mock: o CÓDIGO-FONTE de
    // getStripe() não menciona billingEnabled em lugar nenhum. Se alguém
    // acrescentar essa checagem, este teste cai.
    const fonte = readFileSync(
      resolve(process.cwd(), "server/lib/stripeClient.ts"),
      "utf8",
    );
    expect(fonte).toContain("stripeSecretKey");
    expect(fonte).not.toContain("billingEnabled");
  });

  it("a rota de reembolso também não consulta o kill-switch", () => {
    // As rotas de checkout e de renovação consultam env.billingEnabled e
    // respondem 503; a de reembolso não pode fazer isso.
    const fonte = readFileSync(
      resolve(process.cwd(), "server/routes/admin.ts"),
      "utf8",
    );
    const inicio = fonte.indexOf('router.post("/users/:id/refunds"');
    const fim = fonte.indexOf('router.post("/users/:id/subscription/cancel"');
    expect(inicio).toBeGreaterThan(-1);
    expect(fim).toBeGreaterThan(inicio);
    expect(fonte.slice(inicio, fim)).not.toContain("billingEnabled");
  });
});
