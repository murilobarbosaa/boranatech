import { describe, expect, it, vi } from "vitest";

import { montarDbError } from "./dbError";

/**
 * A CADEIA do `db_error` ate o Sentry.
 *
 * O que se afirma aqui e o contrato inteiro que faltava em 85 sitios medidos em
 * 02/09/2026: `cause` que o `linkedErrorsIntegration` consegue percorrer (ou
 * seja, um `Error` de verdade, nao o objeto plano do postgrest-js), com o codigo
 * do Postgres DENTRO da mensagem, mais `op` e `pgCode` no contexto.
 *
 * `name` e `SupabaseError` porque e o que `erroEncadeavel` produz
 * (server/lib/supabaseError.ts, funcao `montar`), lido la, nao chutado: ele fixa
 * o `name` de proposito, sem o codigo dentro, para o agrupamento do Sentry nao
 * criar uma issue por codigo de Postgres.
 */
describe("montarDbError: a causa real chega encadeada", () => {
  const PLANO = { code: "23505", message: "dup", details: "x" };

  it("erro plano do postgrest vira Error encadeavel, com contexto", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = montarDbError(
      "me",
      "me update profile",
      PLANO,
      "Erro ao atualizar perfil.",
    );

    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("db_error");
    expect(err.message).toBe("Erro ao atualizar perfil.");

    // O ponto: `cause` PRECISA ser um Error, senao o Sentry ignora a cadeia.
    const cause = err.cause as Error;
    expect(cause).toBeInstanceOf(Error);
    expect(cause.name).toBe("SupabaseError");
    expect(cause.message).toContain("23505");
    expect(cause.message).toContain("dup");
    expect(cause.message).toContain("details: x");

    expect(err.context).toEqual({ op: "me update profile", pgCode: "23505" });
  });

  it("extra entra no contexto, e NAO sobrescreve op nem pgCode", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = montarDbError(
      "webhook/asaas",
      "asaas activate subscription",
      PLANO,
      "Ativação de assinatura sem result.",
      { rowId: "r1" },
    );

    expect(err.context).toEqual({
      op: "asaas activate subscription",
      pgCode: "23505",
      rowId: "r1",
    });
  });

  it("extra que tenta sobrescrever op ou pgCode perde", () => {
    // `op` e `pgCode` sao aplicados depois do spread do `extra`, de proposito:
    // sao eles que agrupam no Sentry, e um chamador nao pode troca-los por
    // engano passando uma chave de mesmo nome.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = montarDbError("me", "me update profile", PLANO, "Erro.", {
      op: "outra coisa",
      pgCode: "00000",
      userId: "u1",
    });

    expect(err.context).toEqual({
      op: "me update profile",
      pgCode: "23505",
      userId: "u1",
    });
  });

  it("o prefixo vai para o log, nao para o contexto", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    montarDbError(
      "bookmarks",
      "bookmarks create",
      PLANO,
      "Erro ao salvar favorito.",
    );

    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toBe(
      "[bookmarks] bookmarks create falhou:",
    );
    // `prefix` nao entra no contexto: quem agrupa no Sentry e o `op`.
    expect(Object.keys({ op: "", pgCode: "" }).sort()).toEqual([
      "op",
      "pgCode",
    ]);
  });

  it("erro de catch (Error puro) NAO ganha pgCode inventado", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const original = new TypeError("x is not a function");

    const err = montarDbError(
      "career-plan",
      "career-plan save plan threw",
      original,
      "Erro ao salvar o plano de carreira.",
    );

    // `erroEncadeavel` devolve o Error INTACTO quando ja e Error: o `name` real
    // e o que identifica a falha, e envelopar de novo o apagaria.
    expect(err.cause).toBe(original);
    expect((err.cause as Error).name).toBe("TypeError");
    // Sem `code`, o contexto NAO ganha um pgCode vazio.
    expect(err.context).toEqual({ op: "career-plan save plan threw" });
    expect(err.context).not.toHaveProperty("pgCode");
  });

  it("code que nao e string tambem fica de fora", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = montarDbError(
      "quiz",
      "quiz create attempt",
      { code: 23505, message: "dup" },
      "Erro ao criar tentativa.",
    );
    expect(err.context).toEqual({ op: "quiz create attempt" });
  });

  it("null e undefined nao explodem nem inventam cadeia", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const bruto of [null, undefined]) {
      const err = montarDbError(
        "study",
        "study list entries",
        bruto,
        "Erro ao buscar entradas.",
      );
      expect(err.statusCode).toBe(500);
      expect(err.cause ?? null).toBe(null);
      expect(err.context).toEqual({ op: "study list entries" });
    }
  });
});
