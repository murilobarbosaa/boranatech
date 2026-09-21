import { describe, expect, it } from "vitest";

/**
 * As abas por kind (lote 11b): afirmar o TOTAL de cada lista, e nao so que o
 * Ranking esta ou nao esta, para uma aba nova nao entrar valendo para um
 * kind so por esquecimento.
 */

import {
  ABAS_POR_KIND,
  abasDoKind,
  CREATOR_ABAS,
  normalizarAba,
} from "./creatorAbas";

describe("ABAS_POR_KIND", () => {
  it("afiliado ve todas, na ordem de CREATOR_ABAS; influencer ve tudo menos o Ranking", () => {
    expect(ABAS_POR_KIND.afiliado).toEqual([...CREATOR_ABAS]);
    expect(ABAS_POR_KIND.influencer).toEqual([
      "numeros",
      "calendario",
      "perfil",
    ]);
    // As duas listas sao subsequencias de CREATOR_ABAS: a ordem e uma so.
    for (const lista of Object.values(ABAS_POR_KIND)) {
      const posicoes = lista.map((a) => CREATOR_ABAS.indexOf(a));
      expect([...posicoes].sort((x, y) => x - y)).toEqual(posicoes);
    }
  });

  it("abasDoKind sem kind (carregando, erro, nao creator) e o conjunto menor", () => {
    expect(abasDoKind(null)).toEqual(ABAS_POR_KIND.influencer);
    expect(abasDoKind("afiliado")).toEqual(ABAS_POR_KIND.afiliado);
    expect(abasDoKind("influencer")).toEqual(ABAS_POR_KIND.influencer);
  });

  it("normalizarAba continua aceitando o apelido antigo", () => {
    expect(normalizarAba("comunidade")).toBe("calendario");
    expect(normalizarAba("ranking")).toBe("ranking");
    expect(normalizarAba("x")).toBeNull();
  });
});
