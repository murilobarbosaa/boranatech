import { describe, expect, it } from "vitest";

import { diaAsaas, instanteAsaas } from "./asaasDatetime";

/**
 * TODA expectativa aqui e STRING LITERAL escrita a mao. Derivar a expectativa
 * da implementacao (montando o ISO com a mesma aritmetica que se quer provar)
 * ja escondeu bug nesta base em `dCompet` e `dhEmi`: o teste passa a afirmar
 * que a funcao concorda consigo mesma, e um erro de fuso sobrevive verde.
 */

describe("instanteAsaas: a forma com hora, sem offset", () => {
  it("o evento REAL de producao vira o instante certo em UTC", () => {
    // Medido em 2026-09-01: `raw.dateCreated` do unico PAYMENT_RECEIVED pago.
    // 10:11:33 em Brasilia e 13:11:33 em UTC.
    expect(instanteAsaas("2026-09-01 10:11:33")).toBe(
      "2026-09-01T13:11:33.000Z",
    );
  });

  it("a virada de dia acontece, e nao e truncada", () => {
    // 23:59:59 em -03:00 e 02:59:59 do dia SEGUINTE em UTC.
    expect(instanteAsaas("2027-09-03 23:59:59")).toBe(
      "2027-09-04T02:59:59.000Z",
    );
  });

  it("NAO le a string como UTC", () => {
    // Se alguem trocar o offset explicito por `new Date(texto)` ou por um
    // sufixo "Z", este teste quebra. E o defeito que existiu em producao.
    expect(instanteAsaas("2026-09-01 10:11:33")).not.toBe(
      "2026-09-01T10:11:33.000Z",
    );
  });

  it("aceita T no lugar do espaco, a mesma forma do parser do client", () => {
    expect(instanteAsaas("2027-09-03T23:59:59")).toBe(
      "2027-09-04T02:59:59.000Z",
    );
  });

  it("meia-noite de Brasilia cai no dia anterior em UTC", () => {
    expect(instanteAsaas("2026-01-01 00:00:00")).toBe(
      "2026-01-01T03:00:00.000Z",
    );
  });

  it("nao aplica horario de verao em data que teria sido de verao antes de 2019", () => {
    // Janeiro era -02:00 no antigo horario de verao. O Brasil o aboliu, e o
    // offset e fixo: 12:00 de Brasilia e 15:00Z, nunca 14:00Z.
    expect(instanteAsaas("2026-01-15 12:00:00")).toBe(
      "2026-01-15T15:00:00.000Z",
    );
  });
});

describe("instanteAsaas: o que NAO e instante devolve null", () => {
  it.each([
    ["so a data, a forma do paymentDate", "2026-09-01"],
    ["string vazia", ""],
    ["so espacos", "   "],
    ["undefined", undefined],
    ["null", null],
    ["numero", 1756728693000],
    ["objeto", { dateCreated: "2026-09-01 10:11:33" }],
    ["texto qualquer", "ontem"],
    ["ja com sufixo Z", "2026-09-01T10:11:33Z"],
    ["ja com offset explicito", "2026-09-01T10:11:33-03:00"],
    ["sem os segundos", "2026-09-01 10:11"],
    ["com milissegundos", "2026-09-01 10:11:33.123"],
    ["mes impossivel", "2026-13-01 10:00:00"],
    ["hora impossivel", "2026-09-01 24:00:00"],
    ["minuto impossivel", "2026-09-01 10:60:00"],
    ["segundo bissexto", "2026-09-01 23:59:60"],
  ])("%s", (_rotulo, entrada) => {
    expect(instanteAsaas(entrada)).toBeNull();
  });

  it("dia que NAO existe no mes vira null, nao rola para o mes seguinte", () => {
    // `new Date("2026-02-30T10:00:00-03:00")` devolve 2 de MARCO, sem erro.
    // Um carimbo impossivel viraria um instante plausivel dois dias adiante.
    expect(instanteAsaas("2026-02-30 10:00:00")).toBeNull();
    expect(instanteAsaas("2026-09-31 10:00:00")).toBeNull();
    expect(instanteAsaas("2026-04-31 10:00:00")).toBeNull();
  });

  it("29 de fevereiro passa em ano bissexto e cai em ano comum", () => {
    expect(instanteAsaas("2028-02-29 10:00:00")).toBe(
      "2028-02-29T13:00:00.000Z",
    );
    expect(instanteAsaas("2026-02-29 10:00:00")).toBeNull();
  });

  it("nunca devolve a string de um Invalid Date", () => {
    for (const lixo of ["2026-13-01 10:00:00", "2026-02-30 10:00:00"]) {
      const r = instanteAsaas(lixo);
      expect(r).toBeNull();
      expect(String(r)).not.toContain("Invalid");
    }
  });
});

describe("diaAsaas", () => {
  it("devolve o MESMO texto quando o dia existe", () => {
    expect(diaAsaas("2026-09-01")).toBe("2026-09-01");
  });

  it("recusa a forma COM hora: isso e instante, nao dia", () => {
    expect(diaAsaas("2026-09-01 10:11:33")).toBeNull();
    expect(diaAsaas("2026-09-01T10:11:33")).toBeNull();
  });

  it.each([
    ["string vazia", ""],
    ["undefined", undefined],
    ["null", null],
    ["numero", 20260901],
    ["mes impossivel", "2026-13-01"],
    ["dia inexistente no mes", "2026-02-30"],
    ["dia 31 em mes de 30", "2026-09-31"],
    ["sem zero a esquerda", "2026-9-1"],
    ["formato brasileiro", "01/09/2026"],
  ])("%s vira null", (_rotulo, entrada) => {
    expect(diaAsaas(entrada)).toBeNull();
  });

  it("29 de fevereiro segue a regra do ano bissexto", () => {
    expect(diaAsaas("2028-02-29")).toBe("2028-02-29");
    expect(diaAsaas("2026-02-29")).toBeNull();
  });
});
