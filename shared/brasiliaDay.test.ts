import { describe, expect, it } from "vitest";

import {
  diaBrasilia,
  formatarDiaCivil,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "./brasiliaDay";

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

describe("inicioDoDiaBrasilia", () => {
  it("devolve a MEIA-NOITE de Brasília, não a de UTC", () => {
    // É a diferença que separava 4.788 de 4.606 na aba Visão.
    expect(inicioDoDiaBrasilia("2026-07-16")).toBe("2026-07-16T03:00:00.000Z");
    expect(inicioDoDiaBrasilia("2026-07-16")).not.toBe(
      "2026-07-16T00:00:00.000Z",
    );
  });

  it("o instante devolvido pertence ao dia pedido, e o anterior NÃO", () => {
    // Propriedade que fecha o intervalo pelos dois lados, em vez de afirmar um
    // offset. Se o Brasil voltar a ter horário de verão, o offset muda e este
    // teste continua válido — um teste que só afirmasse "-03:00" viraria a
    // documentação de uma circunstância.
    for (const dia of ["2026-01-15", "2026-07-16", "2026-12-31"]) {
      const inicio = inicioDoDiaBrasilia(dia);
      expect(diaBrasilia(inicio)).toBe(dia);
      const umMsAntes = new Date(Date.parse(inicio) - 1).toISOString();
      expect(diaBrasilia(umMsAntes)).not.toBe(dia);
    }
  });

  it("dia inválido LANÇA em vez de devolver um limite plausível", () => {
    // Um corte de janela silenciosamente errado produz um número que ninguém
    // desconfia.
    expect(() => inicioDoDiaBrasilia("14/08/2026")).toThrow();
    expect(() => inicioDoDiaBrasilia("")).toThrow();
    expect(() => inicioDoDiaBrasilia("2026-13-45")).toThrow();
  });
});

describe("somarDiaCivil", () => {
  it("anda para frente e para trás sobre o dia civil", () => {
    expect(somarDiaCivil("2026-08-14")).toBe("2026-08-15");
    expect(somarDiaCivil("2026-08-14", -1)).toBe("2026-08-13");
    expect(somarDiaCivil("2026-08-14", 0)).toBe("2026-08-14");
  });

  it("atravessa fim de mês e ano bissexto", () => {
    expect(somarDiaCivil("2026-08-31")).toBe("2026-09-01");
    expect(somarDiaCivil("2026-01-01", -1)).toBe("2025-12-31");
    expect(somarDiaCivil("2028-02-28")).toBe("2028-02-29");
  });

  it("NÃO desliza por fuso: somar 1 a um dia é o dia seguinte, sempre", () => {
    // Controle negativo da armadilha clássica: se a implementação passasse por
    // fuso local, N somas seguidas poderiam pular ou repetir um dia.
    let d = "2026-10-15";
    for (let i = 0; i < 40; i += 1) d = somarDiaCivil(d);
    expect(d).toBe("2026-11-24");
  });

  it("dia inválido LANÇA", () => {
    expect(() => somarDiaCivil("ontem")).toThrow();
  });
});
