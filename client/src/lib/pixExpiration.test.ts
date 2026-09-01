import { describe, expect, it } from "vitest";

import {
  earliestDeadline,
  formatPixRemaining,
  parseAsaasDate,
} from "./pixExpiration";

/**
 * O FUSO E O UNICO RISCO REAL AQUI, e ele nao aparece na tela: um prazo lido
 * com tres horas de erro parece um prazo normal. Por isso a maioria destes
 * testes fixa um instante conhecido e afirma o UTC resultante, em vez de
 * comparar strings formatadas, que dependeriam do fuso de quem roda a suite.
 */

describe("parseAsaasDate: string SEM offset", () => {
  it("a forma medida em producao vira o instante de Brasilia", () => {
    // Medido em 2026-09-01 no `GET /payments/{id}/pixQrCode` real.
    const d = parseAsaasDate("2027-09-03 23:59:59");
    // 23:59:59 em -03:00 e 02:59:59 do dia seguinte em UTC.
    expect(d?.toISOString()).toBe("2027-09-04T02:59:59.000Z");
  });

  it("NAO e interpretada como UTC", () => {
    // Se alguem trocar o parse manual por `new Date(texto + "Z")`, este quebra.
    expect(parseAsaasDate("2026-09-03 12:00:00")?.toISOString()).not.toBe(
      "2026-09-03T12:00:00.000Z",
    );
  });

  it("aceita a mesma forma com T no lugar do espaco", () => {
    expect(parseAsaasDate("2027-09-03T23:59:59")?.toISOString()).toBe(
      "2027-09-04T02:59:59.000Z",
    );
  });
});

describe("parseAsaasDate: SO a data, a forma do dueDate", () => {
  it("vira o FIM do dia em Brasilia, nao o comeco", () => {
    // 23:59:59 em -03:00 e 02:59:59Z do dia seguinte.
    expect(parseAsaasDate("2026-09-03")?.toISOString()).toBe(
      "2026-09-04T02:59:59.000Z",
    );
  });

  it("NAO vira meia-noite: assumir 00:00 tiraria um dia de prazo de quem pagou no dia certo", () => {
    expect(parseAsaasDate("2026-09-03")?.toISOString()).not.toBe(
      "2026-09-03T03:00:00.000Z",
    );
  });

  it("NAO e lido como UTC", () => {
    expect(parseAsaasDate("2026-09-03")?.toISOString()).not.toBe(
      "2026-09-03T00:00:00.000Z",
    );
  });
});

describe("parseAsaasDate: string COM offset passa direto", () => {
  it("sufixo Z", () => {
    expect(parseAsaasDate("2026-09-03T12:00:00Z")?.toISOString()).toBe(
      "2026-09-03T12:00:00.000Z",
    );
  });

  it("offset explicito de Brasilia", () => {
    expect(parseAsaasDate("2026-09-03T09:00:00-03:00")?.toISOString()).toBe(
      "2026-09-03T12:00:00.000Z",
    );
  });

  it("offset diferente de Brasilia e respeitado, nao sobrescrito", () => {
    expect(parseAsaasDate("2026-09-03T12:00:00+00:00")?.toISOString()).toBe(
      "2026-09-03T12:00:00.000Z",
    );
  });
});

describe("parseAsaasDate: ausencia e lixo viram null, nunca Invalid Date", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string vazia", ""],
    ["so espacos", "   "],
    ["texto qualquer", "amanha"],
    ["mes impossivel", "2026-13-03 10:00:00"],
  ])("%s", (_rotulo, entrada) => {
    expect(parseAsaasDate(entrada as string | null | undefined)).toBeNull();
  });

  it("nunca devolve um Date invalido", () => {
    // `Invalid Date` e um objeto Date: quem so checasse `!= null` passaria
    // adiante um NaN que vira "NaN:NaN" na tela.
    const d = parseAsaasDate("2026-13-03 10:00:00");
    expect(d === null || !Number.isNaN(d.getTime())).toBe(true);
  });
});

const AGORA = new Date("2026-09-01T12:00:00Z");

describe("formatPixRemaining", () => {
  it("sem data: unknown, e NAO expired", () => {
    // A distincao e o ponto: dizer "expirou" sobre cobranca viva e pior do que
    // nao dizer nada.
    expect(formatPixRemaining(null, AGORA)).toEqual({ kind: "unknown" });
  });

  it("prazo ja passado: expired", () => {
    const passado = new Date("2026-09-01T11:59:59Z");
    expect(formatPixRemaining(passado, AGORA)).toEqual({ kind: "expired" });
  });

  it("exatamente agora: expired (a fronteira e <= 0)", () => {
    expect(formatPixRemaining(new Date(AGORA), AGORA)).toEqual({
      kind: "expired",
    });
  });

  it("faltando mais de uma hora: far, com horas arredondadas para cima", () => {
    const em90min = new Date("2026-09-01T13:30:00Z");
    const r = formatPixRemaining(em90min, AGORA);
    expect(r.kind).toBe("far");
    if (r.kind === "far") {
      // 90 minutos viram "2 horas", nunca "1": arredondar para baixo faria o
      // texto vencer antes da cobranca.
      expect(r.hours).toBe(2);
      expect(r.absolute).toMatch(/\d{2}\/\d{2}/);
    }
  });

  it("o prazo absoluto sai em horario de Brasilia, nao no fuso de quem roda", () => {
    // 2026-09-03T02:59:59Z e 2026-09-02 23:59:59 em Brasilia.
    const r = formatPixRemaining(new Date("2026-09-03T02:59:59Z"), AGORA);
    expect(r.kind).toBe("far");
    if (r.kind === "far") expect(r.absolute).toContain("02/09");
  });

  it("faltando exatamente uma hora ainda e near (a fronteira e >)", () => {
    const r = formatPixRemaining(new Date("2026-09-01T13:00:00Z"), AGORA);
    expect(r).toEqual({ kind: "near", clock: "60:00" });
  });

  it("faltando menos de uma hora: relogio mm:ss", () => {
    const r = formatPixRemaining(new Date("2026-09-01T12:09:05Z"), AGORA);
    expect(r).toEqual({ kind: "near", clock: "09:05" });
  });

  it("segundos e minutos sempre com dois digitos", () => {
    const r = formatPixRemaining(new Date("2026-09-01T12:00:07Z"), AGORA);
    expect(r).toEqual({ kind: "near", clock: "00:07" });
  });

  it("o ultimo segundo ainda conta, nao vira expirado antes da hora", () => {
    const r = formatPixRemaining(new Date("2026-09-01T12:00:01Z"), AGORA);
    expect(r).toEqual({ kind: "near", clock: "00:01" });
  });
});

describe("as duas funcoes juntas, sobre o dado real do provedor", () => {
  it("a string medida em producao produz um prazo la na frente", () => {
    const d = parseAsaasDate("2027-09-03 23:59:59");
    const r = formatPixRemaining(d, new Date("2026-09-01T06:00:00Z"));
    expect(r.kind).toBe("far");
  });
});

describe("earliestDeadline: qual prazo governa", () => {
  const cedo = new Date("2026-09-03T02:59:59Z");
  const tarde = new Date("2027-09-04T02:59:59Z");

  it("com os dois prazos reais, vence o vencimento da cobranca", () => {
    // O par medido em producao: dueDate 2026-09-03, QR 2027-09-03.
    const d = earliestDeadline([
      parseAsaasDate("2026-09-03"),
      parseAsaasDate("2027-09-03 23:59:59"),
    ]);
    expect(d?.toISOString()).toBe("2026-09-04T02:59:59.000Z");
  });

  it("a ordem dos candidatos nao importa", () => {
    expect(earliestDeadline([tarde, cedo])).toBe(cedo);
    expect(earliestDeadline([cedo, tarde])).toBe(cedo);
  });

  it("nulo e IGNORADO, nao tratado como zero", () => {
    // Se nulo virasse zero, um campo ausente venceria todos os prazos reais e a
    // tela diria "expirado" sobre cobranca viva.
    expect(earliestDeadline([null, cedo])).toBe(cedo);
    expect(earliestDeadline([cedo, null])).toBe(cedo);
  });

  it("so um candidato valido: usa ele", () => {
    expect(earliestDeadline([null, tarde])).toBe(tarde);
  });

  it("nenhum candidato valido: null, e o timer some", () => {
    expect(earliestDeadline([null, null])).toBeNull();
    expect(earliestDeadline([])).toBeNull();
  });
});
