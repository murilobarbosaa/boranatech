import { describe, expect, it } from "vitest";

import { estadoDaRenovacaoManual } from "./manualRenewalState";

/**
 * O QUE O PERFIL DIZ SOBRE UMA ASSINATURA MANUAL, hoje: vigente (com a data e
 * os dias que faltam), vencida (o cartao de "seu Pro terminou"), ou nada (nao e
 * manual). Pura, para o teste afirmar a tabela.
 */
const AGORA = Date.parse("2026-09-14T12:00:00.000Z");
const DIA = 24 * 60 * 60 * 1000;

describe("estadoDaRenovacaoManual", () => {
  it("manual active com fim em 7 dias: vigente, 7 dias", () => {
    expect(
      estadoDaRenovacaoManual(
        {
          status: "active",
          renewal_type: "manual",
          current_period_end: new Date(AGORA + 7 * DIA).toISOString(),
        },
        AGORA,
      ),
    ).toEqual({
      kind: "vigente",
      periodEnd: new Date(AGORA + 7 * DIA).toISOString(),
      days: 7,
    });
  });

  it("fracao de dia arredonda para cima: 6,2 dias ainda sao 7 dias", () => {
    const r = estadoDaRenovacaoManual(
      {
        status: "active",
        renewal_type: "manual",
        current_period_end: new Date(AGORA + 6.2 * DIA).toISOString(),
      },
      AGORA,
    );
    expect(r).toMatchObject({ kind: "vigente", days: 7 });
  });

  it("status expired (derivado pelo servidor): vencida, com a data", () => {
    expect(
      estadoDaRenovacaoManual(
        {
          status: "expired",
          renewal_type: "manual",
          current_period_end: "2026-09-13T12:00:00.000Z",
        },
        AGORA,
      ),
    ).toEqual({ kind: "expired", periodEnd: "2026-09-13T12:00:00.000Z" });
  });

  it("cartao (auto) nunca tem estado manual, mesmo perto do fim", () => {
    expect(
      estadoDaRenovacaoManual(
        {
          status: "active",
          renewal_type: "auto",
          current_period_end: new Date(AGORA + 2 * DIA).toISOString(),
        },
        AGORA,
      ),
    ).toBeNull();
  });

  it("sem assinatura, ou sem data de fim: nada", () => {
    expect(estadoDaRenovacaoManual(null, AGORA)).toBeNull();
    expect(
      estadoDaRenovacaoManual(
        { status: "active", renewal_type: "manual", current_period_end: null },
        AGORA,
      ),
    ).toBeNull();
  });
});
