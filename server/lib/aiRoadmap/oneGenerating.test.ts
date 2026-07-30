import { describe, expect, it } from "vitest";
import { isOneGeneratingCollision } from "./oneGenerating";

/**
 * Classificacao do 23505 em ai_roadmaps.
 *
 * Por que isto merece teste proprio: a tabela tem TRES restricoes unicas
 * (`ai_roadmaps_slug_key`, `ai_roadmaps_user_id_slug_key` e, depois da
 * 20260730180000, `ai_roadmaps_one_generating_per_user`), e as tres devolvem o
 * mesmo `code: "23505"`. Confundi-las inverte o tratamento: uma colisao de slug
 * tratada como corrida devolveria 429 a quem so precisava de outro slug, e uma
 * corrida tratada como colisao de slug faria o servidor INSISTIR ate criar a
 * geracao duplicada que o indice existe para impedir.
 *
 * O sinal e o nome do indice dentro da mensagem do Postgres, entao este teste
 * usa as strings como o PostgREST as entrega, nao uma versao idealizada.
 */

// Forma real de um erro do PostgREST para violacao de unique.
function erro(constraint: string) {
  return {
    code: "23505",
    message: `duplicate key value violates unique constraint "${constraint}"`,
    details: `Key (user_id)=(0e37c4a2-1111-2222-3333-444455556666) already exists.`,
  };
}

describe("isOneGeneratingCollision", () => {
  it("reconhece a corrida de geracao pelo nome do indice", () => {
    expect(
      isOneGeneratingCollision(erro("ai_roadmaps_one_generating_per_user")),
    ).toBe(true);
  });

  it("NAO confunde com a colisao de slug global", () => {
    expect(isOneGeneratingCollision(erro("ai_roadmaps_slug_key"))).toBe(false);
  });

  it("NAO confunde com a colisao de (user_id, slug)", () => {
    expect(isOneGeneratingCollision(erro("ai_roadmaps_user_id_slug_key"))).toBe(
      false,
    );
  });

  it("acha o nome quando ele vem so em details", () => {
    expect(
      isOneGeneratingCollision({
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: "conflito em ai_roadmaps_one_generating_per_user",
      }),
    ).toBe(true);
  });

  it("outro codigo de erro nao e corrida, mesmo citando o indice", () => {
    expect(
      isOneGeneratingCollision({
        code: "42P01",
        message:
          'relation "ai_roadmaps_one_generating_per_user" does not exist',
        details: null,
      }),
    ).toBe(false);
  });

  it("erro nulo, sem code, ou com campos nulos nao explode", () => {
    expect(isOneGeneratingCollision(null)).toBe(false);
    expect(isOneGeneratingCollision({})).toBe(false);
    expect(
      isOneGeneratingCollision({ code: "23505", message: null, details: null }),
    ).toBe(false);
  });

  it("ANTES da migration ser aplicada, nenhum 23505 vira corrida", () => {
    // Enquanto o indice nao existe em producao, o unico 23505 possivel e de
    // slug. A classificacao devolve false e o retry de slug segue mandando,
    // que e exatamente o comportamento de hoje: aplicar o indice depois nao
    // muda o caminho antigo, so acrescenta o novo.
    expect(isOneGeneratingCollision(erro("ai_roadmaps_slug_key"))).toBe(false);
    expect(isOneGeneratingCollision(erro("ai_roadmaps_user_id_slug_key"))).toBe(
      false,
    );
  });
});
