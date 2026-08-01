import { describe, expect, it } from "vitest";

import { diaBrasilia, formatarDiaCivil } from "./brasiliaDay";

/**
 * A distinção que este arquivo existe para manter: `date` é dia, `timestamptz` é
 * instante, e cada um quebra de um jeito diferente.
 *
 * Roda sob TZ=America/Sao_Paulo (ver o script de teste): sem fuso negativo
 * nenhum destes testes falharia, e o defeito só aparece em produção.
 */

describe("diaBrasilia: agrupar INSTANTES por dia", () => {
  it("22h de Brasília pertence ao dia local, não ao dia UTC seguinte", () => {
    // É o defeito exato que estava no gráfico de leituras de notificação:
    // 2026-07-31T01:00:00Z é 30/07 22:00 em Brasília, e `slice(0,10)` jogava
    // essa leitura na barra de 31/07.
    expect(diaBrasilia("2026-07-31T01:00:00Z")).toBe("2026-07-30");
    expect("2026-07-31T01:00:00Z".slice(0, 10)).toBe("2026-07-31");
  });

  it("meio-dia UTC cai no mesmo dia nos dois fusos", () => {
    expect(diaBrasilia("2026-07-31T12:00:00Z")).toBe("2026-07-31");
  });

  it("virada do mês é tratada como virada, não como aritmética", () => {
    // 01/08 02:00Z = 31/07 23:00 em Brasília: muda o dia, o mês e o ano quando
    // for 01/01.
    expect(diaBrasilia("2026-08-01T02:00:00Z")).toBe("2026-07-31");
    expect(diaBrasilia("2027-01-01T02:00:00Z")).toBe("2026-12-31");
  });

  it("a chave ordena por comparação de string", () => {
    // É o que os agrupamentos assumem ao montar a série.
    const dias = [
      diaBrasilia("2026-07-31T12:00:00Z")!,
      diaBrasilia("2026-07-09T12:00:00Z")!,
      diaBrasilia("2026-12-01T12:00:00Z")!,
    ];
    expect([...dias].sort()).toEqual([
      "2026-07-09",
      "2026-07-31",
      "2026-12-01",
    ]);
  });

  it("entrada inválida vira null, não uma barra fantasma", () => {
    expect(diaBrasilia(null)).toBeNull();
    expect(diaBrasilia(undefined)).toBeNull();
    expect(diaBrasilia("nao e data")).toBeNull();
  });
});

describe("formatarDiaCivil: coluna `date`, sem passar por Date", () => {
  it("não desloca o dia (é o defeito do incurred_on)", () => {
    // `new Date("2026-07-16")` é meia-noite UTC; em Brasília o
    // toLocaleDateString devolvia 15/07. O gasto lançado no dia 16 aparecia
    // como dia 15 no extrato de despesas.
    expect(formatarDiaCivil("2026-07-16")).toBe("16/07/2026");
    expect(new Date("2026-07-16").toLocaleDateString("pt-BR")).toBe(
      "15/07/2026",
    );
  });

  it("aceita a forma com hora que o PostgREST às vezes devolve", () => {
    expect(formatarDiaCivil("2026-01-05T00:00:00Z")).toBe("05/01/2026");
  });

  it("ausência vira string vazia, não 'Invalid Date'", () => {
    expect(formatarDiaCivil(null)).toBe("");
    expect(formatarDiaCivil(undefined)).toBe("");
    expect(formatarDiaCivil("qualquer coisa")).toBe("");
  });
});
