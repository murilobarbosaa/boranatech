import { describe, expect, it } from "vitest";

import {
  composeIdDps,
  ID_DPS_RE,
  TAMANHO_ID_DPS,
  valorElementoNumeroDps,
} from "./dpsId";

/**
 * O Id da DPS e a chave de idempotencia do Emissor Nacional.
 *
 * Um digito de padding errado NAO da erro visivel: produz um Id que nao casa
 * com o que ja foi emitido, entao `GET /dps/{id}` responde "nao existe" e o
 * sistema emite uma SEGUNDA nota para a mesma cobranca. Por isso cada campo tem
 * teste de tamanho, e nao so o formato final.
 *
 * Referencia: XSD oficial `tiposSimples_v1.01.xsd`, tipo TSIdDPS.
 */

const BASE = {
  codigoMunicipio: "5300108", // Brasilia/DF
  tipoInscricaoFederal: "1" as const,
  inscricaoFederal: "67688579000106",
  serie: "1",
  numero: 1,
};

describe("composeIdDps", () => {
  it("monta as 45 posicoes na ordem do schema", () => {
    const id = composeIdDps(BASE);
    expect(id).toBe(
      "DPS" + "5300108" + "1" + "67688579000106" + "00001" + "000000000000001",
    );
    expect(id).toHaveLength(TAMANHO_ID_DPS);
    expect(id).toHaveLength(45);
    expect(id).toMatch(ID_DPS_RE);
  });

  it("preenche serie e numero com zeros A ESQUERDA", () => {
    const id = composeIdDps({ ...BASE, serie: "7", numero: 1234 });
    expect(id.slice(-20)).toBe(
      "00007" + "000000001234000".slice(0, 0) + "000000000001234",
    );
  });

  it("aceita numero como bigint (a sequence devolve bigint)", () => {
    const id = composeIdDps({ ...BASE, numero: BigInt("987654321") });
    expect(id.endsWith("000000987654321")).toBe(true);
    expect(id).toMatch(ID_DPS_RE);
  });

  it("completa CPF com 000 a esquerda ate 14 posicoes", () => {
    // Regra citada no proprio schema: "CPF completar com 000 a esquerda".
    const id = composeIdDps({
      ...BASE,
      tipoInscricaoFederal: "2",
      inscricaoFederal: "52998224725",
    });
    expect(id.slice(11, 25)).toBe("00052998224725");
    expect(id).toMatch(ID_DPS_RE);
  });

  it("ignora mascara na entrada", () => {
    expect(
      composeIdDps({ ...BASE, inscricaoFederal: "67.688.579/0001-06" }),
    ).toBe(composeIdDps(BASE));
  });

  it("LANCA quando um campo excede o tamanho, em vez de truncar", () => {
    // Truncar produziria um Id sintaticamente valido apontando para outro
    // emitente, que e pior que falhar.
    expect(() =>
      composeIdDps({ ...BASE, inscricaoFederal: "676885790001061234" }),
    ).toThrow(/inscricaoFederal/);
    expect(() => composeIdDps({ ...BASE, serie: "123456" })).toThrow(/serie/);
    expect(() => composeIdDps({ ...BASE, numero: "1234567890123456" })).toThrow(
      /numero/,
    );
  });

  it("LANCA para campo sem digito nenhum, em vez de virar zeros", () => {
    // Este teste encontrou um defeito real: "abcdefg" perdia todos os
    // caracteres no filtro de digitos e o padStart o transformava em
    // "0000000". O Id saia casando com o pattern e apontando para o municipio
    // 0000000: sintaticamente valido, semanticamente falso.
    expect(() => composeIdDps({ ...BASE, codigoMunicipio: "abcdefg" })).toThrow(
      /sem digito/,
    );
    expect(() => composeIdDps({ ...BASE, inscricaoFederal: "" })).toThrow(
      /sem digito/,
    );
  });
});

describe("valorElementoNumeroDps", () => {
  it("remove o zero a esquerda que o Id exige", () => {
    // ARMADILHA DO LEIAUTE: no Id o numero vai com 15 posicoes zeradas a
    // esquerda; o elemento nDPS tem pattern [1-9][0-9]{0,14}, que PROIBE isso.
    expect(valorElementoNumeroDps("000000000000042")).toBe("42");
    expect(valorElementoNumeroDps(42)).toBe("42");
    expect(valorElementoNumeroDps(BigInt("987654321"))).toBe("987654321");
  });

  it("o valor do elemento casa com o pattern do schema", () => {
    expect(valorElementoNumeroDps("000000000000042")).toMatch(
      /^[1-9][0-9]{0,14}$/,
    );
  });

  it("LANCA para zero ou vazio", () => {
    expect(() => valorElementoNumeroDps("000000000000000")).toThrow();
    expect(() => valorElementoNumeroDps(0)).toThrow();
    expect(() => valorElementoNumeroDps("")).toThrow();
  });

  it("LANCA acima de 15 digitos", () => {
    expect(() => valorElementoNumeroDps("1234567890123456")).toThrow(/maximo/);
  });
});
