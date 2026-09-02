import { describe, expect, it } from "vitest";

import {
  centavosAsaas,
  montarCobrancaAsaas,
  montarEstornoAsaas,
  type EntradaDeLedger,
} from "./asaasLedger";

/**
 * O EVENT REAL de producao, medido em 2026-09-02 sobre a unica linha
 * `PAYMENT_RECEIVED` de `billing_events`. So id, valores e datas: nenhum campo
 * de pessoa (`customer`, e-mail, CPF, nome) entra num teste versionado.
 *
 * Expectativas escritas A MAO, nunca derivadas da implementacao.
 */
const EVENT_REAL = {
  dateCreated: "2026-09-01 10:11:33",
  payment: {
    id: "pay_9k2m4x7q1w3e",
    value: "12.9",
    netValue: "10.91",
  },
};

const ENTRADA: EntradaDeLedger = {
  event: EVENT_REAL,
  eventId: "evt_5t8y2u6i9o0p",
  receivedAtIso: "2026-09-01T13:11:40.000Z",
  userId: "11111111-2222-3333-4444-555555555555",
  planCode: "pro_monthly",
};

describe("centavosAsaas", () => {
  it.each([
    ["string com um decimal", "12.9", 1290],
    ["string do liquido real", "10.91", 1091],
    ["number", 12.9, 1290],
    ["inteiro como string", "129", 12900],
    ["dois decimais", "127.01", 12701],
    ["zero e um valor, nao ausencia", 0, 0],
    ["float sujo do JSON", 129.99999, 13000],
    ["negativo preserva o sinal", -12.9, -1290],
  ])("%s -> %s", (_rotulo, entrada, esperado) => {
    expect(centavosAsaas(entrada)).toBe(esperado);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string vazia", ""],
    ["so espacos", "   "],
    ["texto", "abc"],
    ["objeto", {}],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("%s vira null, nunca zero", (_rotulo, entrada) => {
    expect(centavosAsaas(entrada)).toBeNull();
  });

  it("null e ZERO sao coisas diferentes", () => {
    // Colapsar os dois grava uma venda indistinguivel de uma cortesia.
    expect(centavosAsaas(null)).toBeNull();
    expect(centavosAsaas(0)).toBe(0);
  });
});

describe("montarCobrancaAsaas: o event real", () => {
  const linha = montarCobrancaAsaas(ENTRADA);

  it("os tres valores, em centavos inteiros", () => {
    expect(linha.gross_cents).toBe(1290);
    expect(linha.net_cents).toBe(1091);
    expect(linha.fee_cents).toBe(199);
  });

  it("a taxa fecha com o bruto e o liquido", () => {
    expect(linha.gross_cents - linha.fee_cents).toBe(linha.net_cents);
  });

  it("occurred_at e o dateCreated do event, lido como Brasilia", () => {
    // 10:11:33 em Brasilia e 13:11:33Z. Se alguem ler como UTC, da 10:11:33Z.
    expect(linha.occurred_at).toBe("2026-09-01T13:11:33.000Z");
  });

  it("NAO usa o received_at quando o dateCreated e legivel", () => {
    expect(linha.occurred_at).not.toBe(ENTRADA.receivedAtIso);
  });

  it("identidade e provedor", () => {
    expect(linha.provider).toBe("asaas");
    expect(linha.provider_transaction_id).toBe("pay_9k2m4x7q1w3e");
    expect(linha.type).toBe("charge");
    expect(linha.currency).toBe("BRL");
  });

  it("nenhuma coluna da Stripe e preenchida", () => {
    expect(linha.stripe_balance_transaction_id).toBeNull();
    expect(linha.stripe_charge_id).toBeNull();
    expect(linha.stripe_invoice_id).toBeNull();
  });

  it("dono e plano vem de quem chamou, nao do payload", () => {
    expect(linha.user_id).toBe("11111111-2222-3333-4444-555555555555");
    expect(linha.plan_code).toBe("pro_monthly");
  });

  it("raw_payload e o objeto payment, nao o event inteiro", () => {
    expect(linha.raw_payload).toEqual(EVENT_REAL.payment);
  });
});

describe("montarCobrancaAsaas: fallback e recusas", () => {
  it("dateCreated so com a data cai no received_at, sem chutar hora", () => {
    const linha = montarCobrancaAsaas({
      ...ENTRADA,
      event: { ...EVENT_REAL, dateCreated: "2026-09-01" },
    });
    expect(linha.occurred_at).toBe("2026-09-01T13:11:40.000Z");
  });

  it("dateCreated ausente cai no received_at", () => {
    const linha = montarCobrancaAsaas({
      ...ENTRADA,
      event: { payment: EVENT_REAL.payment },
    });
    expect(linha.occurred_at).toBe("2026-09-01T13:11:40.000Z");
  });

  it("value ausente LANCA, nao vira zero", () => {
    expect(() =>
      montarCobrancaAsaas({
        ...ENTRADA,
        event: {
          ...EVENT_REAL,
          payment: { id: "pay_x", netValue: "10.91" },
        },
      }),
    ).toThrow(/value ou netValue/i);
  });

  it("netValue ausente LANCA: sem ele a taxa seria inventada", () => {
    expect(() =>
      montarCobrancaAsaas({
        ...ENTRADA,
        event: { ...EVENT_REAL, payment: { id: "pay_x", value: "12.9" } },
      }),
    ).toThrow(/value ou netValue/i);
  });

  it("pagamento sem id LANCA: a linha nao teria identidade", () => {
    expect(() =>
      montarCobrancaAsaas({
        ...ENTRADA,
        event: { ...EVENT_REAL, payment: { value: "12.9", netValue: "10.91" } },
      }),
    ).toThrow(/sem id/i);
  });

  it("taxa zero e legitima quando bruto e liquido sao iguais", () => {
    const linha = montarCobrancaAsaas({
      ...ENTRADA,
      event: {
        ...EVENT_REAL,
        payment: { id: "pay_x", value: "12.9", netValue: "12.9" },
      },
    });
    expect(linha.fee_cents).toBe(0);
    expect(linha.gross_cents).toBe(1290);
  });
});

describe("montarEstornoAsaas", () => {
  const linha = montarEstornoAsaas(ENTRADA);

  it("os valores sao NEGATIVOS, a convencao da tabela", () => {
    expect(linha.gross_cents).toBe(-1290);
    expect(linha.net_cents).toBe(-1290);
  });

  it("a taxa e zero: o Asaas nao devolve a taxa no estorno", () => {
    expect(linha.fee_cents).toBe(0);
  });

  it("a identidade e o id do EVENT, nao o do pagamento", () => {
    // Reusar o id do pagamento faria o upsert colidir com a propria cobranca
    // e, com ignoreDuplicates, o estorno sumiria em silencio.
    expect(linha.provider_transaction_id).toBe("evt_5t8y2u6i9o0p");
    expect(linha.provider_transaction_id).not.toBe("pay_9k2m4x7q1w3e");
  });

  it("nao colide com a cobranca do mesmo pagamento", () => {
    const cobranca = montarCobrancaAsaas(ENTRADA);
    expect(linha.provider_transaction_id).not.toBe(
      cobranca.provider_transaction_id,
    );
  });

  it("type e refund, provider e asaas", () => {
    expect(linha.type).toBe("refund");
    expect(linha.provider).toBe("asaas");
  });

  it("occurred_at segue a mesma regra da cobranca", () => {
    expect(linha.occurred_at).toBe("2026-09-01T13:11:33.000Z");
  });

  it("NAO exige netValue: a taxa do estorno e zero por definicao", () => {
    const semLiquido = montarEstornoAsaas({
      ...ENTRADA,
      event: { ...EVENT_REAL, payment: { id: "pay_x", value: "12.9" } },
    });
    expect(semLiquido.gross_cents).toBe(-1290);
    expect(semLiquido.fee_cents).toBe(0);
  });

  it("value ausente LANCA", () => {
    expect(() =>
      montarEstornoAsaas({
        ...ENTRADA,
        event: { ...EVENT_REAL, payment: { id: "pay_x" } },
      }),
    ).toThrow(/value/i);
  });

  it("cobranca mais estorno do mesmo valor zeram o total pago", () => {
    const cobranca = montarCobrancaAsaas(ENTRADA);
    expect(cobranca.gross_cents + linha.gross_cents).toBe(0);
  });
});
