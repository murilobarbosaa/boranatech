import { describe, expect, it } from "vitest";

import { projectHelpVideos } from "@/lib/platformData";
import { PROJECT_ID_ALIASES } from "@shared/projects/aliases";
import { projetos } from "@shared/projects/catalog";

// projectHelpVideos e indexado por id de projeto, e o id vem do catalogo. Uma
// chave que deixou de existir nao quebra nada na tela (projectHelpVideo cai
// num fallback de busca gerada), e e exatamente esse o problema: ela apodrece
// em silencio. Depois da fusao de duplicatas do lote 01b, sobrariam 36 chaves
// de projeto que ninguem mais consegue abrir.
//
// `default` e a unica chave que NAO e id de projeto: e o fallback do mapa.

const VIVOS = new Set(projetos.map((p) => p.id));
const CHAVES = Object.keys(projectHelpVideos).filter((k) => k !== "default");

describe("projectHelpVideos", () => {
  it("toda chave, exceto default, e id vivo do catalogo", () => {
    const orfas = CHAVES.filter((k) => !VIVOS.has(k)).sort();
    expect(
      orfas,
      `chaves que nao sao id de projeto vivo (${orfas.length}): ${orfas.join(", ")}`,
    ).toEqual([]);
  });

  it("nenhuma chave e alias de id fundido", () => {
    const aliases = CHAVES.filter((k) => k in PROJECT_ID_ALIASES).sort();
    expect(
      aliases,
      `chaves que sao alias e deveriam ter sido migradas (${aliases.length}): ${aliases.join(", ")}`,
    ).toEqual([]);
  });

  it("a chave default continua existindo", () => {
    // Sem ela, projectHelpVideo perde o fallback curado. Uma limpeza por
    // parser que so entendesse chave entre aspas apagaria justo esta, que e
    // identificador nu no arquivo.
    expect(projectHelpVideos.default).toBeDefined();
    expect(projectHelpVideos.default.url).toMatch(/^https:\/\//);
  });
});
