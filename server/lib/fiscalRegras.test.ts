import { describe, expect, it } from "vitest";

import {
  DOMINIO_ALIQUOTA_ISS,
  DOMINIO_PERCENTUAL_TRIBUTOS,
  decidirLoteAutomatico,
  parseFracaoTributaria,
  parseMeiosEmissao,
  ultimoDiaDoMes,
  validarLoteManual,
  valorLiquidoCents,
} from "./fiscalRegras";

/**
 * Regras do CONTADOR (lote FISCAL-REGRAS 01) como funcoes puras.
 *
 * Instantes escritos a mao em UTC, com o equivalente de Brasilia no nome do
 * teste. Nenhuma expectativa e derivada chamando a propria funcao.
 */

describe("decidirLoteAutomatico: ultimo dia civil do mes em Brasilia (R3)", () => {
  it("23:00 de 30/09 em Brasilia (02:00Z de 01/10) dispara SETEMBRO", () => {
    expect(decidirLoteAutomatico(new Date("2026-10-01T02:00:00Z"))).toEqual({
      disparar: true,
      mes: "2026-09",
      dia: "2026-09-30",
    });
  });

  it("23:00 de 31/10 em Brasilia (02:00Z de 01/11) dispara OUTUBRO", () => {
    expect(decidirLoteAutomatico(new Date("2026-11-01T02:00:00Z"))).toEqual({
      disparar: true,
      mes: "2026-10",
      dia: "2026-10-31",
    });
  });

  it("23:00 de 30/10 em Brasilia (02:00Z de 31/10) NAO dispara", () => {
    expect(decidirLoteAutomatico(new Date("2026-10-31T02:00:00Z"))).toEqual({
      disparar: false,
      dia: "2026-10-30",
    });
  });

  it("dia comum no meio do mes NAO dispara", () => {
    expect(decidirLoteAutomatico(new Date("2026-10-15T15:00:00Z"))).toEqual({
      disparar: false,
      dia: "2026-10-15",
    });
  });

  it("fevereiro: 28 em ano comum, 29 no bissexto", () => {
    expect(
      decidirLoteAutomatico(new Date("2027-03-01T02:00:00Z")).disparar,
    ).toBe(true);
    expect(
      decidirLoteAutomatico(new Date("2028-02-29T02:00:00Z")).disparar,
    ).toBe(false);
    expect(decidirLoteAutomatico(new Date("2028-03-01T02:00:00Z"))).toEqual({
      disparar: true,
      mes: "2028-02",
      dia: "2028-02-29",
    });
  });

  it("dezembro vira o ano sem errar o mes", () => {
    expect(decidirLoteAutomatico(new Date("2027-01-01T02:00:00Z"))).toEqual({
      disparar: true,
      mes: "2026-12",
      dia: "2026-12-31",
    });
  });
});

describe("ultimoDiaDoMes", () => {
  it("devolve o dia civil certo", () => {
    expect(ultimoDiaDoMes("2026-09")).toBe("2026-09-30");
    expect(ultimoDiaDoMes("2026-10")).toBe("2026-10-31");
    expect(ultimoDiaDoMes("2026-12")).toBe("2026-12-31");
    expect(ultimoDiaDoMes("2027-02")).toBe("2027-02-28");
  });

  it("mes invalido lanca", () => {
    expect(() => ultimoDiaDoMes("2026-13")).toThrow(/mes invalido/);
  });
});

describe("validarLoteManual: recuperacao de mes ja encerrado", () => {
  const AGORA = new Date("2026-11-05T15:00:00Z");

  it("aceita mes encerrado", () => {
    expect(validarLoteManual("2026-10", AGORA)).toEqual({
      ok: true,
      mes: "2026-10",
    });
  });

  it("recusa o mes corrente antes do ultimo dia", () => {
    expect(validarLoteManual("2026-11", AGORA)).toEqual({
      ok: false,
      motivo: "mes_ainda_aberto",
    });
  });

  it("aceita o mes corrente NO ultimo dia", () => {
    expect(
      validarLoteManual("2026-10", new Date("2026-10-31T20:00:00Z")),
    ).toEqual({ ok: true, mes: "2026-10" });
  });

  it("recusa mes futuro e formato invalido", () => {
    expect(validarLoteManual("2026-12", AGORA)).toEqual({
      ok: false,
      motivo: "mes_ainda_aberto",
    });
    expect(validarLoteManual("10/2026", AGORA)).toEqual({
      ok: false,
      motivo: "mes_invalido",
    });
  });
});

describe("valorLiquidoCents (R5)", () => {
  it("bruto menos estorno parcial", () => {
    expect(valorLiquidoCents(2990, 1000)).toBe(1990);
  });

  it("estorno integral zera", () => {
    expect(valorLiquidoCents(2990, 2990)).toBe(0);
  });

  it("estorno acima do bruto nao fica negativo", () => {
    expect(valorLiquidoCents(2990, 3500)).toBe(0);
  });

  it("sem estorno e o bruto", () => {
    expect(valorLiquidoCents(2990, 0)).toBe(2990);
  });
});

describe("parseMeiosEmissao (R1)", () => {
  it("le a lista, com espacos", () => {
    expect(parseMeiosEmissao("cartao, pix,boleto")).toEqual({
      ok: true,
      meios: ["cartao", "pix", "boleto"],
    });
  });

  it("ausente ou vazia NAO tem default", () => {
    expect(parseMeiosEmissao(undefined)).toEqual({ ok: false, erro: "vazia" });
    expect(parseMeiosEmissao("  ")).toEqual({ ok: false, erro: "vazia" });
  });

  it("token desconhecido derruba a lista inteira", () => {
    expect(parseMeiosEmissao("cartão,pix")).toEqual({
      ok: false,
      erro: 'valor desconhecido "cartão"',
    });
    expect(parseMeiosEmissao("card")).toEqual({
      ok: false,
      erro: 'valor desconhecido "card"',
    });
  });
});

describe("parseFracaoTributaria (R7)", () => {
  it("2% escrito como fracao passa na aliquota", () => {
    expect(parseFracaoTributaria("0.02", DOMINIO_ALIQUOTA_ISS)).toBe(0.02);
  });

  it('"2" (percentual) e recusado: sairia como 200%', () => {
    expect(parseFracaoTributaria("2", DOMINIO_ALIQUOTA_ISS)).toBeNull();
    expect(parseFracaoTributaria("2.00", DOMINIO_ALIQUOTA_ISS)).toBeNull();
  });

  it("aliquota fora do dominio legal e recusada", () => {
    expect(parseFracaoTributaria("0.06", DOMINIO_ALIQUOTA_ISS)).toBeNull();
    expect(parseFracaoTributaria("0.01", DOMINIO_ALIQUOTA_ISS)).toBeNull();
  });

  it("6% de tributos aproximados passa como fracao", () => {
    expect(parseFracaoTributaria("0.06", DOMINIO_PERCENTUAL_TRIBUTOS)).toBe(
      0.06,
    );
    expect(parseFracaoTributaria("6", DOMINIO_PERCENTUAL_TRIBUTOS)).toBeNull();
  });
});
