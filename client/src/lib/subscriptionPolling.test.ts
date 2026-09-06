import { describe, expect, it } from "vitest";

import { deveReconsultarAssinatura } from "./subscriptionPolling";

/**
 * QUANDO A TELA PRECISA RECONSULTAR A ASSINATURA SOZINHA.
 *
 * O polling de 3 minutos existia so para quem NAO era Pro (Pix pendente). Quem
 * ja era Pro nunca reconsultava, e no dia do vencimento de uma assinatura
 * manual a aba continuava dizendo Pro depois de o servidor ja negar. A regra
 * e pura para o teste afirmar a tabela.
 */
const AGORA = Date.parse("2026-09-21T10:00:00.000Z");
const HORA = 60 * 60 * 1000;

describe("deveReconsultarAssinatura", () => {
  it("nao-Pro sempre reconsulta (Pix pendente pode confirmar)", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: false,
        subscription: null,
        nowMs: AGORA,
      }),
    ).toBe(true);
  });

  it("Pro com assinatura manual vencendo em menos de 24h reconsulta", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: {
          renewal_type: "manual",
          current_period_end: new Date(AGORA + 6 * HORA).toISOString(),
        },
        nowMs: AGORA,
      }),
    ).toBe(true);
  });

  it("Pro com assinatura manual JA vencida (janela ate o cron) tambem reconsulta", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: {
          renewal_type: "manual",
          current_period_end: new Date(AGORA - 2 * HORA).toISOString(),
        },
        nowMs: AGORA,
      }),
    ).toBe(true);
  });

  it("Pro com assinatura manual vencendo em 3 dias NAO reconsulta", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: {
          renewal_type: "manual",
          current_period_end: new Date(AGORA + 72 * HORA).toISOString(),
        },
        nowMs: AGORA,
      }),
    ).toBe(false);
  });

  it("Pro com cartao (auto) nunca reconsulta, mesmo perto do fim: a Stripe renova", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: {
          renewal_type: "auto",
          current_period_end: new Date(AGORA + 6 * HORA).toISOString(),
        },
        nowMs: AGORA,
      }),
    ).toBe(false);
  });

  it("Pro sem assinatura (admin, influencer) ou com payload estranho nao reconsulta", () => {
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: null,
        nowMs: AGORA,
      }),
    ).toBe(false);
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: "x",
        nowMs: AGORA,
      }),
    ).toBe(false);
    expect(
      deveReconsultarAssinatura({
        isPro: true,
        subscription: { renewal_type: "manual", current_period_end: "ontem" },
        nowMs: AGORA,
      }),
    ).toBe(false);
  });
});
