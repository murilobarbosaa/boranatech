import { describe, expect, it } from "vitest";

import { assinaturaVencendoSemRenovacao } from "./billingMetrics";

/**
 * A TERCEIRA FAMILIA DE "RECEITA EM RISCO": manual vencendo em 7 dias sem
 * renovacao iniciada. Pura, para o teste afirmar a tabela; o laco do MRR so a
 * chama por linha.
 */
const AGORA = Date.parse("2026-09-14T12:00:00.000Z");
const DIA = 24 * 60 * 60 * 1000;

function args(
  over: Partial<Parameters<typeof assinaturaVencendoSemRenovacao>[0]> = {},
) {
  return {
    status: "active",
    renewalType: "manual",
    currentPeriodStart: new Date(AGORA - 25 * DIA).toISOString(),
    currentPeriodEnd: new Date(AGORA + 5 * DIA).toISOString(),
    pendingCreatedAt: null,
    nowMs: AGORA,
    ...over,
  };
}

describe("assinaturaVencendoSemRenovacao", () => {
  it("manual active com fim em 5 dias e nenhuma pendente: vencendo", () => {
    expect(assinaturaVencendoSemRenovacao(args())).toBe(true);
  });

  it("fim em 8 dias: fora da janela de 7", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({ currentPeriodEnd: new Date(AGORA + 8 * DIA).toISOString() }),
      ),
    ).toBe(false);
  });

  it("fim exatamente em 7 dias: dentro", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({ currentPeriodEnd: new Date(AGORA + 7 * DIA).toISOString() }),
      ),
    ).toBe(true);
  });

  it("pendente criada DEPOIS do inicio do periodo: renovacao iniciada, nao conta", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({ pendingCreatedAt: new Date(AGORA - 1 * DIA).toISOString() }),
      ),
    ).toBe(false);
  });

  it("pendente ANTIGA, de antes do periodo atual: nao e renovacao deste ciclo, conta", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({ pendingCreatedAt: new Date(AGORA - 40 * DIA).toISOString() }),
      ),
    ).toBe(true);
  });

  it("cartao (auto) nunca conta, mesmo vencendo amanha", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({
          renewalType: "auto",
          currentPeriodEnd: new Date(AGORA + DIA).toISOString(),
        }),
      ),
    ).toBe(false);
  });

  it("ja vencida (fim no passado) nao e 'vencendo': e a expiracao que cuida", () => {
    expect(
      assinaturaVencendoSemRenovacao(
        args({ currentPeriodEnd: new Date(AGORA - DIA).toISOString() }),
      ),
    ).toBe(false);
  });

  it("past_due ou sem fim: nao conta", () => {
    expect(assinaturaVencendoSemRenovacao(args({ status: "past_due" }))).toBe(
      false,
    );
    expect(
      assinaturaVencendoSemRenovacao(args({ currentPeriodEnd: null })),
    ).toBe(false);
  });
});
