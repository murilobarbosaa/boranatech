import { describe, expect, it } from "vitest";

import {
  emailAlreadyTakenError,
  mergedUserMetadata,
  normalizeEmail,
  validateNewEmail,
} from "./emailChange";

/**
 * Troca de e-mail pelo admin: as pecas puras.
 *
 * A identidade de login e auth.users.email (UNIQUE); profiles.email e espelho e
 * NAO tem UNIQUE. Todo cuidado aqui e sobre nao deixar os dois divergirem em
 * silencio e sobre nao vazar mensagem crua do Auth para a tela.
 */

describe("normalizeEmail", () => {
  it("apara espaco e baixa a caixa", () => {
    expect(normalizeEmail("  Ana@Exemplo.COM  ")).toBe("ana@exemplo.com");
  });

  it("null e undefined viram string vazia, nao 'null'", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("validateNewEmail", () => {
  it("aceita e-mail comum", () => {
    expect(validateNewEmail("ana@exemplo.com")).toBeNull();
  });

  it("recusa sintaxe invalida", () => {
    expect(validateNewEmail("ana@")?.code).toBe("invalid_email");
    expect(validateNewEmail("sem-arroba")?.code).toBe("invalid_email");
    expect(validateNewEmail("")?.code).toBe("invalid_email");
  });

  it("recusa dominio reservado", () => {
    // Reusa shared/emailValidation.ts, que ja bloqueia dominios e TLDs
    // reservados da IANA. Trocar o login de alguem para example.com faria a
    // conta virar inacessivel de vez.
    expect(validateNewEmail("ana@example.com")?.code).toBe("invalid_email");
  });

  it("recusa acima de 254 caracteres", () => {
    const longo = "a".repeat(250) + "@x.com";
    expect(validateNewEmail(longo)?.code).toBe("invalid_email");
  });
});

describe("emailAlreadyTakenError: traduz o erro do Auth", () => {
  it("reconhece a colisao de e-mail pelas mensagens do GoTrue", () => {
    for (const msg of [
      "A user with this email address has already been registered",
      "Email address already registered by another user",
      'duplicate key value violates unique constraint "users_email_partial_key"',
    ]) {
      expect(emailAlreadyTakenError({ message: msg }), msg).toBe(true);
    }
  });

  it("reconhece pelo codigo, quando ele vem", () => {
    expect(emailAlreadyTakenError({ code: "email_exists", message: "x" })).toBe(
      true,
    );
  });

  it("erro que NAO e colisao nao vira 409", () => {
    // Um 500 do Auth virando "e-mail já usado" mandaria o admin procurar o
    // problema no lugar errado.
    expect(
      emailAlreadyTakenError({ message: "service temporarily unavailable" }),
    ).toBe(false);
    expect(emailAlreadyTakenError(null)).toBe(false);
  });
});

describe("mergedUserMetadata", () => {
  it("troca o email e PRESERVA o resto do metadata", () => {
    // Passar o objeto inteiro, e nao so { email }, e deliberado: as semanticas
    // de merge do GoTrue nao estao verificadas aqui, e apagar name/avatar_url de
    // 3200 contas por causa disso seria irreversivel na pratica.
    const saida = mergedUserMetadata(
      { name: "Ana", avatar_url: "https://x/a.png", email: "velho@x.com" },
      "novo@x.com",
    );
    expect(saida).toEqual({
      name: "Ana",
      avatar_url: "https://x/a.png",
      email: "novo@x.com",
    });
  });

  it("metadata ausente vira objeto so com o email", () => {
    expect(mergedUserMetadata(undefined, "novo@x.com")).toEqual({
      email: "novo@x.com",
    });
    expect(mergedUserMetadata(null, "novo@x.com")).toEqual({
      email: "novo@x.com",
    });
  });

  it("nao inventa chave quando o metadata nao tinha email", () => {
    // Se a conta nunca teve email no metadata, passamos a ter: e o valor certo,
    // e o campo existe em 3212 das 3218 contas.
    expect(mergedUserMetadata({ name: "Ana" }, "novo@x.com")).toEqual({
      name: "Ana",
      email: "novo@x.com",
    });
  });
});
