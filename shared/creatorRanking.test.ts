import { describe, expect, it } from "vitest";

/**
 * Regra de pontos do ranking mensal (lote 11).
 *
 * Os numeros abaixo sao os da tabela publica, escritos a mao de proposito: se
 * alguem trocar um peso na constante, este teste tem que quebrar, porque a
 * tabela que os creators leem na tela e a mesma constante.
 */

import { TIPOS_POR_REDE } from "./creatorPost";
import { REDES_DE_CREATOR } from "./creatorProfile";
import {
  calcularPontos,
  compararCandidatos,
  CONTAGENS_ZERADAS,
  mesDoDia,
  mesTemRanking,
  mesVizinho,
  PONTOS_POR_CADASTRO,
  PONTOS_POR_CLIQUE,
  PONTOS_POR_PUBLICACAO,
  PONTOS_POR_VENDA,
  PRIMEIRO_MES_DO_RANKING,
  tabelaDePontos,
  TETO_DE_CLIQUES_POR_DIA,
  totalDePublicacoes,
  type CandidatoDoRanking,
} from "./creatorRanking";

describe("PONTOS_POR_PUBLICACAO", () => {
  it("cobre EXATAMENTE os pares (rede, tipo) de TIPOS_POR_REDE", () => {
    // Afirmar o total, nao a pertinencia: um tipo novo em TIPOS_POR_REDE sem
    // peso aqui valeria zero em silencio; um peso aqui sem tipo la seria
    // regra morta.
    const pares = REDES_DE_CREATOR.flatMap((rede) =>
      TIPOS_POR_REDE[rede].map((tipo) => `${rede}:${tipo}`),
    ).sort();
    const comPeso = REDES_DE_CREATOR.flatMap((rede) =>
      Object.keys(PONTOS_POR_PUBLICACAO[rede]).map((tipo) => `${rede}:${tipo}`),
    ).sort();
    expect(comPeso).toEqual(pares);
    expect(pares).toEqual([
      "instagram:post",
      "instagram:reel",
      "instagram:story",
      "linkedin:post",
      "tiktok:video",
    ]);
  });

  it("os pesos sao os da tabela publica (valores da Ana, set/2026)", () => {
    expect(PONTOS_POR_PUBLICACAO).toEqual({
      instagram: { post: 3, reel: 10, story: 1 },
      tiktok: { video: 10 },
      linkedin: { post: 3 },
    });
    expect(PONTOS_POR_VENDA).toBe(25);
    // Clique deixou de pontuar: peso zero (segue contado como metrica bruta).
    expect(PONTOS_POR_CLIQUE).toBe(0);
    expect(TETO_DE_CLIQUES_POR_DIA).toBe(30);
  });
});

describe("calcularPontos", () => {
  it("zero contagens, zero pontos", () => {
    expect(calcularPontos(CONTAGENS_ZERADAS)).toBe(0);
  });

  it("cada coluna pesa o que a tabela diz, e o total e a soma", () => {
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, ig_posts: 2 })).toBe(6);
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, reels: 2 })).toBe(20);
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, stories: 2 })).toBe(2);
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, videos: 2 })).toBe(20);
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, li_posts: 2 })).toBe(6);
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, vendas: 2 })).toBe(50);
    // Clique nao pontua mais: qualquer quantidade soma zero.
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, cliques: 2 })).toBe(0);
    expect(
      calcularPontos({
        ig_posts: 1,
        reels: 1,
        stories: 1,
        videos: 1,
        li_posts: 1,
        vendas: 1,
        cliques: 7,
        cadastros: 1,
      }),
    ).toBe(3 + 10 + 1 + 10 + 3 + 25 + 0 + 8);
    // Cadastro pelo link (lote 11i): 8 cada (valor da Ana).
    expect(calcularPontos({ ...CONTAGENS_ZERADAS, cadastros: 3 })).toBe(24);
    expect(PONTOS_POR_CADASTRO).toBe(8);
  });

  it("totalDePublicacoes soma os cinco tipos sem peso", () => {
    expect(
      totalDePublicacoes({
        ...CONTAGENS_ZERADAS,
        ig_posts: 1,
        reels: 2,
        stories: 3,
        videos: 4,
        li_posts: 5,
      }),
    ).toBe(15);
  });
});

describe("tabelaDePontos", () => {
  it("uma linha por par (rede, tipo) na ordem das redes, depois venda e cadastro (clique nao pontua)", () => {
    const linhas = tabelaDePontos();
    expect(linhas.map((l) => l.chave)).toEqual([
      "instagram:post",
      "instagram:reel",
      "instagram:story",
      "tiktok:video",
      "linkedin:post",
      "venda",
      "cadastro",
    ]);
    expect(linhas.map((l) => l.pontos)).toEqual([3, 10, 1, 10, 3, 25, 8]);
  });

  it("os rotulos vem dos mapas compartilhados; clique saiu da tabela", () => {
    const linhas = tabelaDePontos();
    expect(linhas[0].acao).toBe("Post no Instagram confirmado");
    expect(linhas[3].acao).toBe("Vídeo no TikTok confirmado");
    expect(linhas[4].acao).toBe("Post no LinkedIn confirmado");
    expect(linhas[6].acao).toBe("Cadastro pelo seu link");
    expect(linhas.some((l) => l.chave === "clique")).toBe(false);
  });
});

describe("compararCandidatos", () => {
  const base: CandidatoDoRanking = {
    user_id: "b",
    pontos: 10,
    vendas: 0,
    publicacoes: 1,
    granted_at: "2026-08-01T00:00:00Z",
  };

  it("mais pontos primeiro", () => {
    const lista = [base, { ...base, user_id: "a", pontos: 20 }];
    expect(lista.sort(compararCandidatos).map((c) => c.user_id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("empate em pontos: mais vendas, depois mais publicacoes, depois quem entrou antes", () => {
    const maisVendas = { ...base, user_id: "v", vendas: 1 };
    const maisPubs = { ...base, user_id: "p", publicacoes: 3 };
    const maisAntigo = {
      ...base,
      user_id: "z",
      granted_at: "2026-07-16T20:21:27.962215Z",
    };
    const lista = [base, maisAntigo, maisPubs, maisVendas];
    expect(lista.sort(compararCandidatos).map((c) => c.user_id)).toEqual([
      "v",
      "p",
      "z",
      "b",
    ]);
  });

  it("tudo igual: o user_id decide, para a ordem nao mudar entre chamadas", () => {
    const outro = { ...base, user_id: "a" };
    expect(compararCandidatos(base, outro)).toBeGreaterThan(0);
    expect(compararCandidatos(outro, base)).toBeLessThan(0);
    expect(compararCandidatos(base, { ...base })).toBe(0);
  });
});

describe("meses", () => {
  it("mesDoDia recorta o AAAA-MM", () => {
    expect(mesDoDia("2026-09-20")).toBe("2026-09");
  });

  it("mesVizinho anda um mes, virando o ano nas pontas", () => {
    expect(mesVizinho("2026-09", -1)).toBe("2026-08");
    expect(mesVizinho("2026-09", 1)).toBe("2026-10");
    expect(mesVizinho("2026-01", -1)).toBe("2025-12");
    expect(mesVizinho("2026-12", 1)).toBe("2027-01");
    expect(() => mesVizinho("2026-13", 1)).toThrow();
    expect(() => mesVizinho("setembro", 1)).toThrow();
  });

  it("mesTemRanking: do primeiro mes do programa ate o mes atual, inclusive", () => {
    expect(PRIMEIRO_MES_DO_RANKING).toBe("2026-07");
    expect(mesTemRanking("2026-06", "2026-09")).toBe(false);
    expect(mesTemRanking("2026-07", "2026-09")).toBe(true);
    expect(mesTemRanking("2026-09", "2026-09")).toBe(true);
    expect(mesTemRanking("2026-10", "2026-09")).toBe(false);
  });
});
