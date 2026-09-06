import { describe, expect, it } from "vitest";

import { periodoDaRenovacao } from "./renewalAnchor";

/**
 * A REGRA DA ANCORA, compartilhada por Stripe (boleto) e Asaas (Pix): o novo
 * periodo comeca no MAIOR entre o instante do pagamento e o fim ainda vigente
 * do usuario. Renovar cedo nao perde os dias que faltavam; renovar atrasado
 * nao ganha retroativo dos dias sem acesso.
 */
const DIA_MS = 24 * 60 * 60 * 1000;
const FIM_VIGENTE = Date.parse("2026-09-21T00:00:00.000Z");

describe("periodoDaRenovacao", () => {
  it("paga ANTES do fim vigente: comeca no fim vigente, 30 dias depois termina", () => {
    const r = periodoDaRenovacao({
      paidAtMs: Date.parse("2026-09-18T15:00:00.000Z"),
      fimVigenteMs: FIM_VIGENTE,
      accessDays: 30,
    });
    expect(r.periodStart).toBe("2026-09-21T00:00:00.000Z");
    expect(r.periodEnd).toBe("2026-10-21T00:00:00.000Z");
  });

  it("paga DEPOIS do fim vigente (ja vencido): comeca no pagamento", () => {
    const r = periodoDaRenovacao({
      paidAtMs: Date.parse("2026-09-25T10:00:00.000Z"),
      fimVigenteMs: FIM_VIGENTE,
      accessDays: 30,
    });
    expect(r.periodStart).toBe("2026-09-25T10:00:00.000Z");
    expect(r.periodEnd).toBe("2026-10-25T10:00:00.000Z");
  });

  it("sem fim vigente (primeira compra): comeca no pagamento", () => {
    const pago = Date.parse("2026-09-06T12:00:00.000Z");
    const r = periodoDaRenovacao({
      paidAtMs: pago,
      fimVigenteMs: null,
      accessDays: 182,
    });
    expect(r.periodStart).toBe(new Date(pago).toISOString());
    expect(r.periodEnd).toBe(new Date(pago + 182 * DIA_MS).toISOString());
  });

  it("paga EXATAMENTE no fim vigente: os dois candidatos empatam e nada se perde", () => {
    const r = periodoDaRenovacao({
      paidAtMs: FIM_VIGENTE,
      fimVigenteMs: FIM_VIGENTE,
      accessDays: 30,
    });
    expect(r.periodStart).toBe("2026-09-21T00:00:00.000Z");
  });
});
