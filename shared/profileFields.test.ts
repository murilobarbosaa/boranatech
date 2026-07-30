import { describe, expect, it } from "vitest";

import {
  ADMIN_EDITABLE_PROFILE_FIELDS,
  ADMIN_EXCLUDED_PROFILE_FIELDS,
  PROFILE_TEXT_LIMITS,
  PROFILE_URL_FIELDS,
  EDITABLE_FIELDS,
  isProfileUrlField,
  validateProfileTextValue,
  validateProfileUrlValue,
} from "./profileFields";

/**
 * As duas rotas que escrevem em public.profiles precisam sair da MESMA fonte.
 *
 * O teste central e o do conjunto DIFERENCA: ele afirma o TOTAL, nao so a
 * pertinencia. Um teste que dissesse "os campos que eu conheco estao la" passa
 * calado quando alguem adiciona um campo novo em me.ts; este cai, e obriga a
 * decidir de que lado o campo fica.
 */

describe("allowlist do admin sai da mesma fonte que a de me.ts", () => {
  it("todo campo editavel pelo admin tambem e editavel pelo dono da conta", () => {
    // O admin nao escreve em coluna que o proprio usuario nao escreve.
    const foraDeMe = ADMIN_EDITABLE_PROFILE_FIELDS.filter(
      (campo) => !(EDITABLE_FIELDS as readonly string[]).includes(campo),
    );
    expect(foraDeMe).toEqual([]);
  });

  it("a DIFERENCA entre as duas listas e exatamente a exclusao documentada", () => {
    // Este e o teste que cai quando me.ts ganha um campo novo. Nao arrume
    // adicionando o campo aqui no reflexo: decida se o admin deve poder editar
    // e, se nao, registre o motivo em ADMIN_EXCLUDED_PROFILE_FIELDS.
    const soEmMe = EDITABLE_FIELDS.filter(
      (campo) =>
        !(ADMIN_EDITABLE_PROFILE_FIELDS as readonly string[]).includes(campo),
    ).sort();

    expect(soEmMe).toEqual(Object.keys(ADMIN_EXCLUDED_PROFILE_FIELDS).sort());
  });

  it("toda exclusao tem motivo escrito, nao string vazia", () => {
    for (const [campo, motivo] of Object.entries(
      ADMIN_EXCLUDED_PROFILE_FIELDS,
    )) {
      expect(motivo.trim().length, `${campo} sem motivo`).toBeGreaterThan(0);
    }
  });

  it("cpf, handle e email NAO estao na allowlist do admin", () => {
    // Os tres tem fatia propria ou proibicao propria. Trava explicita, porque
    // sao os tres que alguem adicionaria "so pra facilitar".
    for (const proibido of ["cpf", "handle", "email"]) {
      expect(
        (ADMIN_EDITABLE_PROFILE_FIELDS as readonly string[]).includes(proibido),
      ).toBe(false);
    }
  });
});

describe("validateProfileTextValue", () => {
  it("aceita texto dentro do limite", () => {
    expect(validateProfileTextValue("headline", "Dev")).toBeNull();
    expect(validateProfileTextValue("headline", "x".repeat(140))).toBeNull();
  });

  it("recusa texto acima do limite", () => {
    const erro = validateProfileTextValue("headline", "x".repeat(141));
    expect(erro?.code).toBe("invalid_request");
  });

  it("null limpa o campo e e valido", () => {
    expect(validateProfileTextValue("headline", null)).toBeNull();
  });

  it("nao-string e recusado", () => {
    expect(validateProfileTextValue("headline", 42)?.code).toBe(
      "invalid_request",
    );
    expect(validateProfileTextValue("headline", { a: 1 })?.code).toBe(
      "invalid_request",
    );
  });

  it("os cinco campos que nao tinham limite agora tem", () => {
    // Ate 2026-07-30 estes cinco passavam em qualquer tamanho, nas DUAS rotas.
    for (const campo of [
      "name",
      "bio",
      "area_interesse",
      "nivel_atual",
      "objetivo",
    ]) {
      expect(PROFILE_TEXT_LIMITS[campo], campo).toBeGreaterThan(0);
      const acima = "x".repeat(PROFILE_TEXT_LIMITS[campo] + 1);
      expect(validateProfileTextValue(campo, acima)?.code, campo).toBe(
        "invalid_request",
      );
    }
  });

  it("os tetos novos nao invalidam o maior dado que existe hoje", () => {
    // Medido em producao: maior `name` = 43 caracteres, os outros quatro 100%
    // nulos. Um teto abaixo disso quebraria o save de quem ja esta cadastrado.
    expect(validateProfileTextValue("name", "x".repeat(43))).toBeNull();
  });
});

describe("validateProfileUrlValue", () => {
  it("aceita http e https", () => {
    expect(
      validateProfileUrlValue("github_url", "https://github.com/a"),
    ).toBeNull();
    expect(validateProfileUrlValue("website_url", "http://x.com")).toBeNull();
  });

  it("aceita vazio: e como se limpa o campo", () => {
    expect(validateProfileUrlValue("github_url", "")).toBeNull();
    expect(validateProfileUrlValue("github_url", null)).toBeNull();
  });

  it("recusa sem esquema", () => {
    expect(validateProfileUrlValue("github_url", "github.com/a")?.code).toBe(
      "invalid_request",
    );
  });

  it("recusa esquema perigoso", () => {
    expect(
      validateProfileUrlValue("website_url", "javascript:alert(1)")?.code,
    ).toBe("invalid_request");
  });

  it("recusa acima de 300 caracteres", () => {
    const longa = "https://x.com/" + "a".repeat(300);
    expect(validateProfileUrlValue("website_url", longa)?.code).toBe(
      "invalid_request",
    );
  });
});

describe("isProfileUrlField", () => {
  it("reconhece os tres campos de URL e mais nenhum", () => {
    expect(PROFILE_URL_FIELDS).toHaveLength(3);
    for (const campo of PROFILE_URL_FIELDS) {
      expect(isProfileUrlField(campo)).toBe(true);
    }
    expect(isProfileUrlField("headline")).toBe(false);
    expect(isProfileUrlField("bio")).toBe(false);
  });
});
