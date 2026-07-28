import { describe, expect, it } from "vitest";

import { relativeTime } from "./relativeTime";

// Relogio FIXO e injetado. Nenhum teste aqui le Date.now(): um teste de data que
// depende do relogio real passa hoje e quebra as 23h59 de um dia qualquer, ou
// pior, passa sempre por acaso.
//
// Referencia: 2026-07-28 15:00:00 em Brasilia (UTC-3) = 18:00:00Z.
const NOW = Date.parse("2026-07-28T18:00:00.000Z");

function ago(ms: number) {
  return new Date(NOW - ms).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it("segundos viram “agora”", () => {
    expect(relativeTime(ago(0), NOW)).toBe("agora");
    expect(relativeTime(ago(30 * SECOND), NOW)).toBe("agora");
  });

  it("minutos", () => {
    expect(relativeTime(ago(5 * MINUTE), NOW)).toBe("há 5 min");
    expect(relativeTime(ago(59 * MINUTE), NOW)).toBe("há 59 min");
  });

  it("nunca devolve “há 0 min” na fronteira dos 45 segundos", () => {
    expect(relativeTime(ago(50 * SECOND), NOW)).toBe("há 1 min");
  });

  it("horas", () => {
    expect(relativeTime(ago(3 * HOUR), NOW)).toBe("há 3 h");
    expect(relativeTime(ago(23 * HOUR), NOW)).toBe("há 23 h");
  });

  it("ontem", () => {
    expect(relativeTime(ago(25 * HOUR), NOW)).toBe("ontem");
  });

  it("dias dentro da semana", () => {
    expect(relativeTime(ago(3 * DAY), NOW)).toBe("há 3 dias");
    expect(relativeTime(ago(6 * DAY), NOW)).toBe("há 6 dias");
  });

  it("acima de uma semana vira data absoluta, nao “há 431 dias”", () => {
    const result = relativeTime(ago(400 * DAY), NOW);
    expect(result).not.toContain("há");
    // dd/mm/aaaa, hh:mm no formato pt-BR.
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });

  // Passadas as 24h, a contagem e de DIA DE CALENDARIO em Brasilia, nao de
  // multiplos de 24h. Este par discrimina as duas implementacoes: os dois casos
  // tem quase a mesma diferenca em horas, e `Math.floor(diff / 24h)` daria "1"
  // nos dois, colando o rotulo "ontem" numa coisa que aconteceu anteontem.
  it("conta DIA DE CALENDARIO de Brasilia, nao multiplos de 24h", () => {
    // Agora: 2026-07-28 12:00 em Brasilia (= 15:00Z).
    const meioDiaDe28 = Date.parse("2026-07-28T15:00:00.000Z");

    // 2026-07-27 10:00 em Brasilia (= 13:00Z). 26h atras, um dia no calendario.
    expect(relativeTime("2026-07-27T13:00:00.000Z", meioDiaDe28)).toBe("ontem");

    // 2026-07-26 20:00 em Brasilia (= 23:00Z). 40h atras: `floor(40 / 24)` daria
    // 1 e o rotulo sairia "ontem", mas no calendario sao DOIS dias atras.
    expect(relativeTime("2026-07-26T23:00:00.000Z", meioDiaDe28)).toBe(
      "há 2 dias",
    );
  });

  // Dentro das primeiras 24h vale a contagem em horas, mesmo cruzando a
  // meia-noite: um comentario de 90 minutos atras rotulado "ontem" seria pior
  // que inutil, seria enganoso.
  it("abaixo de 24h usa horas, mesmo cruzando a meia-noite", () => {
    // Agora 00:30 em Brasilia; o evento foi as 23:00 do dia anterior.
    const madrugada = Date.parse("2026-07-28T03:30:00.000Z");
    expect(relativeTime("2026-07-28T02:00:00.000Z", madrugada)).toBe("há 1 h");
  });

  it("instante no futuro devolve o absoluto, nunca “há -3 min”", () => {
    const futuro = new Date(NOW + 10 * MINUTE).toISOString();
    const result = relativeTime(futuro, NOW);
    expect(result).not.toContain("-");
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });

  it("entrada invalida ou nula devolve string vazia", () => {
    expect(relativeTime(null, NOW)).toBe("");
    expect(relativeTime("nao e data", NOW)).toBe("");
    expect(relativeTime("", NOW)).toBe("");
  });
});
