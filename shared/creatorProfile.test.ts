import { describe, expect, it } from "vitest";

import {
  COR_PADRAO_DO_CALENDARIO,
  CORES_DO_CALENDARIO,
  ehCorDoCalendario,
  isTipoDeChavePix,
  ROTULO_DA_COR,
  mascararChavePix,
  normalizarChavePix,
  normalizarHandle,
  normalizarSeguidores,
  SEGUIDORES_MAX,
} from "./creatorProfile";

/**
 * Regras do perfil de creator: @ das redes, seguidores declarados e chave Pix.
 *
 * Todo valor esperado e LITERAL escrito a mao. O CPF e o CNPJ validos sao os
 * mesmos do teste de fiscalIdentity (52998224725 e 11222333000181), e cada um
 * tem um irmao de mesmo comprimento com o digito verificador errado: uma regra
 * que so conta digitos passaria nele, e e esse o caso que importa.
 */

describe("normalizarHandle", () => {
  it("tira espaco, arroba e maiuscula", () => {
    expect(normalizarHandle("instagram", "  @Ana.Creator ")).toEqual({
      ok: true,
      valor: "ana.creator",
    });
    expect(normalizarHandle("tiktok", "@ana_creator")).toEqual({
      ok: true,
      valor: "ana_creator",
    });
  });

  it("tira o prefixo de URL, com e sem www, com e sem barra final", () => {
    expect(
      normalizarHandle("instagram", "https://www.instagram.com/ana.creator/"),
    ).toEqual({ ok: true, valor: "ana.creator" });
    expect(normalizarHandle("instagram", "instagram.com/ana_creator")).toEqual({
      ok: true,
      valor: "ana_creator",
    });
    expect(
      normalizarHandle("tiktok", "https://www.tiktok.com/@ana.creator"),
    ).toEqual({ ok: true, valor: "ana.creator" });
    expect(
      normalizarHandle("tiktok", "http://tiktok.com/@AnaCreator/"),
    ).toEqual({ ok: true, valor: "anacreator" });
  });

  it("vazio, so espaco e ausente sao null, e nao erro", () => {
    expect(normalizarHandle("instagram", "")).toEqual({
      ok: true,
      valor: null,
    });
    expect(normalizarHandle("instagram", "   ")).toEqual({
      ok: true,
      valor: null,
    });
    expect(normalizarHandle("tiktok", null)).toEqual({ ok: true, valor: null });
    expect(normalizarHandle("tiktok", undefined)).toEqual({
      ok: true,
      valor: null,
    });
  });

  it("recusa caractere fora do conjunto, com o codigo da rede", () => {
    expect(normalizarHandle("instagram", "ana creator")).toEqual({
      ok: false,
      code: "invalid_instagram_handle",
    });
    expect(normalizarHandle("tiktok", "ana-creator")).toEqual({
      ok: false,
      code: "invalid_tiktok_handle",
    });
    expect(normalizarHandle("instagram", 42)).toEqual({
      ok: false,
      code: "invalid_instagram_handle",
    });
  });

  it("limites de tamanho de cada rede", () => {
    expect(normalizarHandle("instagram", "a")).toEqual({
      ok: true,
      valor: "a",
    });
    expect(normalizarHandle("instagram", "a".repeat(30))).toEqual({
      ok: true,
      valor: "a".repeat(30),
    });
    expect(normalizarHandle("instagram", "a".repeat(31))).toEqual({
      ok: false,
      code: "invalid_instagram_handle",
    });
    expect(normalizarHandle("tiktok", "a")).toEqual({
      ok: false,
      code: "invalid_tiktok_handle",
    });
    expect(normalizarHandle("tiktok", "ab")).toEqual({ ok: true, valor: "ab" });
    expect(normalizarHandle("tiktok", "a".repeat(24))).toEqual({
      ok: true,
      valor: "a".repeat(24),
    });
    expect(normalizarHandle("tiktok", "a".repeat(25))).toEqual({
      ok: false,
      code: "invalid_tiktok_handle",
    });
  });
});

describe("normalizarSeguidores", () => {
  it("aceita inteiro de 0 ao teto", () => {
    expect(SEGUIDORES_MAX).toBe(100000000);
    expect(normalizarSeguidores("instagram", 0)).toEqual({
      ok: true,
      valor: 0,
    });
    expect(normalizarSeguidores("tiktok", 12500)).toEqual({
      ok: true,
      valor: 12500,
    });
    expect(normalizarSeguidores("instagram", 100000000)).toEqual({
      ok: true,
      valor: 100000000,
    });
  });

  it("null e ausente sao null", () => {
    expect(normalizarSeguidores("instagram", null)).toEqual({
      ok: true,
      valor: null,
    });
    expect(normalizarSeguidores("tiktok", undefined)).toEqual({
      ok: true,
      valor: null,
    });
  });

  it("recusa negativo, fracao, acima do teto e texto, com o codigo da rede", () => {
    for (const valor of [-1, 1.5, 100000001, "1200", Number.NaN]) {
      expect(normalizarSeguidores("instagram", valor), String(valor)).toEqual({
        ok: false,
        code: "invalid_instagram_followers",
      });
    }
    expect(normalizarSeguidores("tiktok", -1)).toEqual({
      ok: false,
      code: "invalid_tiktok_followers",
    });
  });
});

describe("normalizarChavePix", () => {
  it("tipo fora da lista e invalid_pix_type", () => {
    expect(isTipoDeChavePix("celular")).toBe(false);
    expect(normalizarChavePix("celular", "11912345678")).toEqual({
      ok: false,
      code: "invalid_pix_type",
    });
  });

  it("cpf: so digitos e digito verificador", () => {
    expect(normalizarChavePix("cpf", "529.982.247-25")).toEqual({
      ok: true,
      valor: { tipo: "cpf", valor: "52998224725" },
    });
    expect(normalizarChavePix("cpf", "529.982.247-26")).toEqual({
      ok: false,
      code: "invalid_pix_cpf",
    });
    expect(normalizarChavePix("cpf", "11111111111")).toEqual({
      ok: false,
      code: "invalid_pix_cpf",
    });
  });

  it("cnpj: so digitos e digito verificador", () => {
    expect(normalizarChavePix("cnpj", "11.222.333/0001-81")).toEqual({
      ok: true,
      valor: { tipo: "cnpj", valor: "11222333000181" },
    });
    expect(normalizarChavePix("cnpj", "11.222.333/0001-82")).toEqual({
      ok: false,
      code: "invalid_pix_cnpj",
    });
  });

  it("email: minusculas e entregavel", () => {
    expect(normalizarChavePix("email", "  Ana.Creator@Gmail.com ")).toEqual({
      ok: true,
      valor: { tipo: "email", valor: "ana.creator@gmail.com" },
    });
    expect(normalizarChavePix("email", "ana@")).toEqual({
      ok: false,
      code: "invalid_pix_email",
    });
    expect(normalizarChavePix("email", "ana@exemplo.test")).toEqual({
      ok: false,
      code: "invalid_pix_email",
    });
  });

  it("telefone: com e sem +55, gravado como +55 mais DDD e numero", () => {
    expect(normalizarChavePix("telefone", "+55 (11) 91234-5678")).toEqual({
      ok: true,
      valor: { tipo: "telefone", valor: "+5511912345678" },
    });
    expect(normalizarChavePix("telefone", "(11) 91234-5678")).toEqual({
      ok: true,
      valor: { tipo: "telefone", valor: "+5511912345678" },
    });
    expect(normalizarChavePix("telefone", "(11) 3456-7890")).toEqual({
      ok: true,
      valor: { tipo: "telefone", valor: "+551134567890" },
    });
  });

  it("telefone: DDD 55 sem codigo de pais nao e confundido com o +55", () => {
    expect(normalizarChavePix("telefone", "(55) 99123-4567")).toEqual({
      ok: true,
      valor: { tipo: "telefone", valor: "+5555991234567" },
    });
  });

  it("telefone: tamanho errado, DDD com zero e celular sem 9 sao recusados", () => {
    for (const valor of ["123", "(01) 91234-5678", "(11) 81234-5678", ""]) {
      expect(normalizarChavePix("telefone", valor), valor).toEqual({
        ok: false,
        code: "invalid_pix_telefone",
      });
    }
  });

  it("aleatoria: UUID, com maiusculas virando minusculas", () => {
    expect(
      normalizarChavePix("aleatoria", "123E4567-E89B-12D3-A456-426614174000"),
    ).toEqual({
      ok: true,
      valor: {
        tipo: "aleatoria",
        valor: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
    expect(normalizarChavePix("aleatoria", "nao-e-uuid")).toEqual({
      ok: false,
      code: "invalid_pix_aleatoria",
    });
  });

  it("valor que nao e texto e erro do proprio tipo", () => {
    expect(normalizarChavePix("cpf", 52998224725)).toEqual({
      ok: false,
      code: "invalid_pix_cpf",
    });
  });
});

describe("mascararChavePix", () => {
  it("cada tipo mostra so o que esta na regra", () => {
    expect(mascararChavePix("cpf", "52998224725")).toBe("***.***.247-**");
    expect(mascararChavePix("cnpj", "11222333000181")).toBe(
      "**.***.***/0001-**",
    );
    expect(mascararChavePix("email", "ana.creator@gmail.com")).toBe(
      "an***@gmail.com",
    );
    expect(mascararChavePix("telefone", "+5511912345678")).toBe(
      "+55 (11) *****-5678",
    );
    expect(mascararChavePix("telefone", "+551134567890")).toBe(
      "+55 (11) *****-7890",
    );
    expect(
      mascararChavePix("aleatoria", "123e4567-e89b-12d3-a456-426614174000"),
    ).toBe("123e4567-****-...");
  });

  it("nenhuma mascara contem a chave inteira", () => {
    const chaves: Array<[Parameters<typeof mascararChavePix>[0], string]> = [
      ["cpf", "52998224725"],
      ["cnpj", "11222333000181"],
      ["email", "ana.creator@gmail.com"],
      ["telefone", "+5511912345678"],
      ["aleatoria", "123e4567-e89b-12d3-a456-426614174000"],
    ];
    for (const [tipo, valor] of chaves) {
      expect(mascararChavePix(tipo, valor), tipo).not.toContain(valor);
    }
  });
});

describe("CORES_DO_CALENDARIO (lote 10c)", () => {
  it("sao 15, com rotulo para cada uma, e o padrao esta na lista", () => {
    expect(CORES_DO_CALENDARIO).toHaveLength(15);
    expect(new Set(CORES_DO_CALENDARIO).size).toBe(15);
    for (const cor of CORES_DO_CALENDARIO) {
      expect(ROTULO_DA_COR[cor].length, cor).toBeGreaterThan(0);
      expect(ehCorDoCalendario(cor)).toBe(true);
    }
    expect(ehCorDoCalendario(COR_PADRAO_DO_CALENDARIO)).toBe(true);
    expect(COR_PADRAO_DO_CALENDARIO).toBe("violet");
  });

  it("recusa o que nao esta na lista: red e teal (livres de proposito), maiuscula, vazio e nao-texto", () => {
    for (const valor of ["red", "teal", "Violet", "", null, undefined, 3]) {
      expect(ehCorDoCalendario(valor), String(valor)).toBe(false);
    }
  });
});
