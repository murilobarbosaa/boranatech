import { describe, expect, it } from "vitest";

import {
  canonicalPaymentKey,
  classifyRegisteredPayments,
  instantIsInWindow,
  paymentDay,
  paymentIsInWindow,
  type FinancePaymentRow,
} from "./registeredPayments";

const cutoff = "2026-09-11T15:00:00.000Z";
let seq = 0;
const row = (over: Partial<FinancePaymentRow> = {}): FinancePaymentRow => {
  seq += 1;
  return {
    id: `row-${String(seq).padStart(4, "0")}`,
    provider: "stripe",
    provider_transaction_id: `txn-${seq}`,
    stripe_charge_id: `ch-${seq}`,
    type: "charge",
    gross_cents: 1000,
    occurred_at: "2026-09-10T13:00:00.000Z",
    created_at: "2026-09-10T13:05:00.000Z",
    user_id: "u1",
    plan_code: "pro_monthly",
    ...over,
  };
};

describe("pagamentos registrados", () => {
  it("usa charge.id na Stripe e payment.id no Asaas", () => {
    const stripe = row({
      stripe_charge_id: "ch_canonic",
      provider_transaction_id: "bt_movimento",
    });
    const asaas = row({
      provider: "asaas",
      stripe_charge_id: null,
      provider_transaction_id: "pay_canonic",
    });
    expect(canonicalPaymentKey(stripe)).toBe("stripe:charge:ch_canonic");
    expect(canonicalPaymentKey(asaas)).toBe("asaas:payment:pay_canonic");
  });

  it("deduplica reentrega/múltiplos movimentos e preserva pagamentos distintos", () => {
    const a = row({ id: "a", stripe_charge_id: "ch_same" });
    const duplicate = row({
      id: "b",
      stripe_charge_id: "ch_same",
      provider_transaction_id: "bt_other",
    });
    const other = row({ id: "c", stripe_charge_id: "ch_other" });
    const result = classifyRegisteredPayments({
      rows: [duplicate, other, a],
      cutoff,
    });
    expect(result.payments).toHaveLength(2);
    expect(result.coverage.registrosDuplicados).toBe(1);
    expect(result.payments.map((p) => p.classification)).toEqual([
      "first_observed",
      "subsequent_observed",
    ]);
  });

  it("procura o primeiro antes da janela, independentemente de UUID e provedor", () => {
    const old = row({
      id: "z-uuid",
      occurred_at: "2026-08-01T12:00:00Z",
      stripe_charge_id: "ch_old",
    });
    const current = row({
      id: "a-uuid",
      provider: "asaas",
      provider_transaction_id: "pay_new",
      stripe_charge_id: null,
    });
    const result = classifyRegisteredPayments({ rows: [current, old], cutoff });
    expect(
      result.payments.map((p) => [p.paymentKey, p.classification]),
    ).toEqual([
      ["stripe:charge:ch_old", "first_observed"],
      ["asaas:payment:pay_new", "subsequent_observed"],
    ]);
  });

  it("não inventa aquisição, renovação ou reativação em troca de provedor/retorno", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          user_id: "u-old",
          occurred_at: "2026-06-01T12:00:00Z",
          stripe_charge_id: "ch_first",
        }),
        row({
          user_id: "u-old",
          provider: "asaas",
          provider_transaction_id: "pay_return",
          stripe_charge_id: null,
        }),
      ],
      cutoff,
    });
    expect(result.payments[1].classification).toBe("subsequent_observed");
    expect(JSON.stringify(result)).not.toMatch(/renew|renova|reativa|aquisi/i);
  });

  it("exclui zero, negativos, inválidos, provider desconhecido, identidade ausente e futuro", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({ gross_cents: 0 }),
        row({ gross_cents: -1 }),
        row({ gross_cents: "NaN" }),
        row({ provider: "outro" }),
        row({ stripe_charge_id: null }),
        row({ occurred_at: "inválido" }),
        row({ occurred_at: "2026-09-11T15:00:00.001Z" }),
        row({ type: "refund" }),
      ],
      cutoff,
    });
    expect(result.payments).toHaveLength(0);
    expect(result.coverage.excluidos).toEqual({
      tipoNaoElegivel: 1,
      valorNaoPositivoOuInvalido: 3,
      identidadeAusente: 1,
      dataInvalida: 1,
      futuro: 1,
      providerNaoSuportado: 1,
    });
  });

  it("mantém pagamento sem usuário em grupo reconciliável, sem transformá-lo em pessoa", () => {
    const result = classifyRegisteredPayments({
      rows: [row({ user_id: null })],
      cutoff,
    });
    expect(result.payments[0].classification).toBe("unclassified");
    expect(result.coverage.pagamentosSemUsuario).toBe(1);
  });

  it("usa meio apenas por vínculo persistido exato do Asaas", () => {
    const asaas = row({
      provider: "asaas",
      provider_transaction_id: "pay_pix",
      stripe_charge_id: null,
    });
    const stripe = row({ stripe_charge_id: "ch_card" });
    const result = classifyRegisteredPayments({
      rows: [asaas, stripe],
      methodEvidence: [
        {
          provider: "asaas",
          provider_subscription_id: "pay_pix",
          payment_method: "pix",
        },
        {
          provider: "stripe",
          provider_subscription_id: "ch_card",
          payment_method: "card",
        },
      ],
      cutoff,
    });
    expect(
      Object.fromEntries(result.payments.map((p) => [p.provider, p.method])),
    ).toEqual({
      asaas: "Pix",
      stripe: "Não identificado",
    });
    expect(result.coverage.pagamentosSemMeio).toBe(1);
  });

  it("meio persistido conflitante permanece não identificado", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          provider: "asaas",
          provider_transaction_id: "pay-conflict",
          stripe_charge_id: null,
        }),
      ],
      methodEvidence: [
        {
          provider: "asaas",
          provider_subscription_id: "pay-conflict",
          payment_method: "pix",
        },
        {
          provider: "asaas",
          provider_subscription_id: "pay-conflict",
          payment_method: "boleto",
        },
      ],
      cutoff,
    });
    expect(result.payments[0].method).toBe("Não identificado");
    expect(result.coverage.meiosPersistidosConflitantes).toBe(1);
  });

  it("duplicata com um único usuário conhecido preserva o vínculo; conflito não escolhe um", () => {
    const known = classifyRegisteredPayments({
      rows: [
        row({ id: "a", stripe_charge_id: "ch-owner", user_id: null }),
        row({ id: "b", stripe_charge_id: "ch-owner", user_id: "u-known" }),
      ],
      cutoff,
    });
    expect(known.payments[0].userId).toBe("u-known");
    expect(known.payments[0].userEvidence).toBe("enriched_from_duplicate");

    const conflict = classifyRegisteredPayments({
      rows: [
        row({ id: "c", stripe_charge_id: "ch-conflict", user_id: "u1" }),
        row({ id: "d", stripe_charge_id: "ch-conflict", user_id: "u2" }),
      ],
      cutoff,
    });
    expect(conflict.payments[0].classification).toBe("unclassified");
    expect(conflict.coverage.identidadesComUsuarioConflitante).toBe(1);
  });

  it("conflito somente de usuário torna posteriores de ambos os candidatos incertos", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          id: "r1",
          stripe_charge_id: "ch-old",
          occurred_at: "2026-09-01T10:00:00Z",
          gross_cents: 1000,
          user_id: "uA",
        }),
        row({
          id: "r2",
          stripe_charge_id: "ch-old",
          occurred_at: "2026-09-01T10:00:00Z",
          gross_cents: 1000,
          user_id: "uB",
        }),
        row({
          id: "r3",
          stripe_charge_id: "ch-later-a",
          occurred_at: "2026-09-10T10:00:00Z",
          user_id: "uA",
        }),
        row({
          id: "r4",
          stripe_charge_id: "ch-later-b",
          occurred_at: "2026-09-10T11:00:00Z",
          user_id: "uB",
        }),
      ],
      cutoff,
    });

    expect(result.conflicts).toEqual([]);
    expect(result.payments).toHaveLength(3);
    expect(result.payments[0]).toMatchObject({
      paymentKey: "stripe:charge:ch-old",
      userId: null,
      userEvidence: "conflict",
      classification: "unclassified",
    });
    expect(result.payments.slice(1)).toEqual([
      expect.objectContaining({
        userId: "uA",
        classification: "order_uncertain",
      }),
      expect.objectContaining({
        userId: "uB",
        classification: "order_uncertain",
      }),
    ]);
    expect(result.coverage).toMatchObject({
      identidadesUtilizaveis: 3,
      identidadesComConflitoFinanceiroTemporal: 0,
      identidadesComUsuarioConflitante: 1,
      pagamentosComOrdemHistoricaIncerta: 2,
      registrosDuplicados: 1,
    });
  });

  it("conflito de dono posterior não torna primeiro conhecido retroativamente incerto", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          id: "known-first",
          stripe_charge_id: "ch-known-first",
          occurred_at: "2026-09-01T09:00:00Z",
          user_id: "uA",
        }),
        row({
          id: "conflict-a",
          stripe_charge_id: "ch-owner-later",
          occurred_at: "2026-09-10T10:00:00Z",
          user_id: "uA",
        }),
        row({
          id: "conflict-b",
          stripe_charge_id: "ch-owner-later",
          occurred_at: "2026-09-10T10:00:00Z",
          user_id: "uB",
        }),
      ],
      cutoff,
    });

    expect(result.payments[0]).toMatchObject({
      paymentKey: "stripe:charge:ch-known-first",
      classification: "first_observed",
    });
    expect(result.coverage.identidadesComConflitoFinanceiroTemporal).toBe(0);
  });

  it("pagamento inequívoco anterior mantém o pagamento seguinte como posterior", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          id: "known-first",
          stripe_charge_id: "ch-known-first",
          occurred_at: "2026-09-01T09:00:00Z",
          user_id: "uA",
        }),
        row({
          id: "conflict-a",
          stripe_charge_id: "ch-owner-middle",
          occurred_at: "2026-09-05T10:00:00Z",
          user_id: "uA",
        }),
        row({
          id: "conflict-b",
          stripe_charge_id: "ch-owner-middle",
          occurred_at: "2026-09-05T10:00:00Z",
          user_id: "uB",
        }),
        row({
          id: "known-later",
          stripe_charge_id: "ch-known-later",
          occurred_at: "2026-09-10T10:00:00Z",
          user_id: "uA",
        }),
      ],
      cutoff,
    });

    expect(
      result.payments.find((payment) => payment.rowId === "known-later"),
    ).toMatchObject({ classification: "subsequent_observed" });
  });

  it("retém a duplicata válida mesmo quando outra linha da identidade é inválida", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({ id: "a", stripe_charge_id: "ch-valid", gross_cents: 0 }),
        row({ id: "b", stripe_charge_id: "ch-valid", gross_cents: 1300 }),
      ],
      cutoff,
    });
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]).toMatchObject({ rowId: "b", grossCents: 1300 });
    expect(result.coverage.excluidos.valorNaoPositivoOuInvalido).toBe(1);
  });

  it("não escolhe data/valor em identidade conflitante nem promove posterior a primeiro", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({
          id: "a",
          stripe_charge_id: "ch-conflicting",
          occurred_at: "2026-09-09T10:00:00Z",
          gross_cents: 1000,
          user_id: null,
          plan_code: "pro_monthly",
        }),
        row({
          id: "b",
          stripe_charge_id: "ch-conflicting",
          occurred_at: "2026-09-09T11:00:00Z",
          gross_cents: 2200,
          user_id: "u1",
          plan_code: "pro_annual",
        }),
        row({
          id: "c",
          stripe_charge_id: "ch-later-valid",
          occurred_at: "2026-09-10T12:00:00Z",
          user_id: "u1",
        }),
      ],
      cutoff,
    });
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        paymentKey: "stripe:charge:ch-conflicting",
        reasons: ["gross_cents", "occurred_at"],
        implicatedUserIds: ["u1"],
      }),
    ]);
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].classification).toBe("order_uncertain");
    expect(result.coverage).toMatchObject({
      identidadesUtilizaveis: 1,
      identidadesComConflitoFinanceiroTemporal: 1,
      identidadesComConflitoDeValor: 1,
      identidadesComConflitoDeInstante: 1,
      pagamentosComOrdemHistoricaIncerta: 1,
      registrosDuplicados: 1,
    });
  });

  it("plano conflitante vira desconhecido sem invalidar identidade/data/valor", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({ id: "a", stripe_charge_id: "ch-plan", plan_code: "monthly" }),
        row({ id: "b", stripe_charge_id: "ch-plan", plan_code: "annual" }),
      ],
      cutoff,
    });
    expect(result.conflicts).toEqual([]);
    expect(result.payments[0]).toMatchObject({
      planCode: null,
      planEvidence: "conflict",
    });
    expect(result.coverage.identidadesComPlanoConflitante).toBe(1);
  });

  it("reembolso parcial/total e disputa não apagam o primeiro charge", () => {
    const charge = row({ stripe_charge_id: "ch_paid" });
    const result = classifyRegisteredPayments({
      rows: [
        charge,
        row({ type: "refund", gross_cents: -500, stripe_charge_id: "ch_paid" }),
        row({
          type: "refund",
          gross_cents: -1000,
          stripe_charge_id: "ch_paid",
        }),
        row({
          type: "dispute",
          gross_cents: -1000,
          stripe_charge_id: "ch_paid",
        }),
      ],
      cutoff,
    });
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].classification).toBe("first_observed");
  });

  it("agrupa na virada de Brasília e inclui o limite inferior", () => {
    const first = row({
      occurred_at: "2026-09-10T02:59:59.999Z",
      stripe_charge_id: "ch_before",
    });
    const boundary = row({
      occurred_at: "2026-09-10T03:00:00.000Z",
      stripe_charge_id: "ch_boundary",
    });
    const result = classifyRegisteredPayments({
      rows: [first, boundary],
      cutoff,
    });
    expect(result.payments.map(paymentDay)).toEqual([
      "2026-09-09",
      "2026-09-10",
    ]);
    expect(
      paymentIsInWindow(result.payments[1], "2026-09-10T03:00:00.000Z", cutoff),
    ).toBe(true);
  });

  it("desempata instante de forma estável e declara ambiguidade", () => {
    const result = classifyRegisteredPayments({
      rows: [
        row({ id: "z", stripe_charge_id: "ch_z" }),
        row({ id: "a", stripe_charge_id: "ch_a" }),
      ],
      cutoff,
    });
    expect(result.payments.map((p) => p.paymentKey)).toEqual([
      "stripe:charge:ch_a",
      "stripe:charge:ch_z",
    ]);
    expect(result.coverage.empatesDeInstante).toBe(1);
  });

  it("zero observado não vira histórico completo ou sincronização", () => {
    const result = classifyRegisteredPayments({ rows: [], cutoff });
    expect(result.coverage.historicoIntegral).toBe("nao_verificavel");
    expect(result.coverage.primeiraOcorrenciaObservada).toBeNull();
    expect(result.coverage.ultimaLinhaLocalCriadaEm).toBeNull();
  });

  it.each([
    ["início Z", "2026-09-05T03:00:00.000Z", true],
    ["início +00", "2026-09-05T03:00:00+00:00", true],
    ["início Brasília", "2026-09-05T00:00:00-03:00", true],
    ["fim sem milissegundos", "2026-09-11T15:00:00Z", true],
    ["antes por 1 ms", "2026-09-05T02:59:59.999Z", false],
    ["depois por 1 ms", "2026-09-11T15:00:00.001Z", false],
    ["inválida", "não-é-data", false],
  ])("compara instante no limite: %s", (_label, value, expected) => {
    expect(
      instantIsInWindow(
        value,
        "2026-09-05T03:00:00.000Z",
        "2026-09-11T15:00:00.000Z",
      ),
    ).toBe(expected);
  });
});
