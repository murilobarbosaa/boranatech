import { describe, expect, it } from "vitest";

/**
 * Regras do link de publicacao (lote 09, tipo e status no lote 10b).
 *
 * Os valores sao LITERAIS de propósito: um shortcode de Instagram real tem
 * maiuscula e minuscula, e um id de TikTok tem dezenove digitos. Escrever
 * "abc" nos dois lugares faria o teste passar com regras que nao servem para o
 * dado de verdade.
 *
 * A asserção que se repete e a CANONICA: a mesma publicacao colada de cinco
 * jeitos diferentes precisa sair com a mesma URL e o mesmo `external_id`, que e
 * o que faz o unique da tabela reconhecer a repeticao.
 *
 * O TIPO e sempre passado (lote 10b): a funcao nao deduz mais o tipo em
 * silencio, e o mismatch e afirmado por par (link de X, tipo Y).
 */

import {
  ehTipoDePublicacao,
  LIMITE_DE_REGISTROS_POR_DIA,
  normalizarLinkDePublicacao,
  statusInicialDaPublicacao,
  TIPO_DE_PUBLICACAO_META,
  TIPOS_DE_PUBLICACAO,
} from "./creatorPost";

const CODIGO_IG = "Cx1AbCdEf_-";
const ID_TIKTOK = "7311122233344455566";
const ID_STORY = "3456789012345678901";

describe("normalizarLinkDePublicacao: Instagram", () => {
  it("post em todas as formas de colar cai na mesma canonica", () => {
    const esperado = {
      network: "instagram",
      kind: "post",
      external_id: CODIGO_IG,
      url: `https://www.instagram.com/p/${CODIGO_IG}/`,
    };
    for (const entrada of [
      `https://www.instagram.com/p/${CODIGO_IG}/`,
      `https://instagram.com/p/${CODIGO_IG}/`,
      `http://www.instagram.com/p/${CODIGO_IG}`,
      `instagram.com/p/${CODIGO_IG}`,
      `www.instagram.com/p/${CODIGO_IG}//`,
      `https://www.instagram.com/p/${CODIGO_IG}/?igshid=MzRlODBiNWFlZA==`,
      `  https://www.instagram.com/p/${CODIGO_IG}/#comentarios  `,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "post")).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("reel e reels sao o mesmo tipo, e a canonica usa reel", () => {
    const esperado = {
      network: "instagram",
      kind: "reel",
      external_id: CODIGO_IG,
      url: `https://www.instagram.com/reel/${CODIGO_IG}/`,
    };
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/reel/${CODIGO_IG}/`,
        "reel",
      ),
    ).toEqual({ ok: true, valor: esperado });
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/reels/${CODIGO_IG}/`,
        "reel",
      ),
    ).toEqual({ ok: true, valor: esperado });
  });

  it("com o usuario na frente, o resultado e o mesmo", () => {
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/ana.cria/p/${CODIGO_IG}/`,
        "post",
      ),
    ).toEqual({
      ok: true,
      valor: {
        network: "instagram",
        kind: "post",
        external_id: CODIGO_IG,
        url: `https://www.instagram.com/p/${CODIGO_IG}/`,
      },
    });
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/ana.cria/reel/${CODIGO_IG}/`,
        "reel",
      ),
    ).toEqual({
      ok: true,
      valor: {
        network: "instagram",
        kind: "reel",
        external_id: CODIGO_IG,
        url: `https://www.instagram.com/reel/${CODIGO_IG}/`,
      },
    });
  });

  it("o shortcode mantem maiuscula e minuscula", () => {
    const r = normalizarLinkDePublicacao(
      "https://www.instagram.com/p/AbCdEfGhIjK/",
      "post",
    );
    expect(r.ok && r.valor.external_id).toBe("AbCdEfGhIjK");
    expect(r.ok && r.valor.url).toBe(
      "https://www.instagram.com/p/AbCdEfGhIjK/",
    );
  });

  it("story: exige o usuario, o id sao os digitos, e a canonica poe o usuario em minuscula", () => {
    const esperado = {
      network: "instagram",
      kind: "story",
      external_id: ID_STORY,
      url: `https://www.instagram.com/stories/ana.cria/${ID_STORY}/`,
    };
    for (const entrada of [
      `https://www.instagram.com/stories/ana.cria/${ID_STORY}/`,
      `https://instagram.com/stories/ana.cria/${ID_STORY}`,
      `instagram.com/stories/Ana.Cria/${ID_STORY}/?utm_source=ig_story_item_share`,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "story")).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("story sem usuario, destaque e id truncado nao sao story", () => {
    for (const entrada of [
      `https://www.instagram.com/stories/${ID_STORY}/`,
      "https://www.instagram.com/stories/ana.cria/",
      "https://www.instagram.com/stories/ana.cria/12/",
      "https://www.instagram.com/stories/highlights/17900000000000000/",
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "story")).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });

  it("perfil nao e publicacao, e codigo curto demais tambem nao", () => {
    for (const entrada of [
      "https://www.instagram.com/ana.cria/",
      "https://www.instagram.com/",
      "https://www.instagram.com/p/abc/",
      "https://www.instagram.com/p/",
      "https://www.instagram.com/explore/tags/tech/",
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "post")).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });
});

describe("normalizarLinkDePublicacao: TikTok", () => {
  it("video em todas as formas de colar cai na mesma canonica", () => {
    const esperado = {
      network: "tiktok",
      kind: "video",
      external_id: ID_TIKTOK,
      url: `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
    };
    for (const entrada of [
      `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
      `https://tiktok.com/@ana.cria/video/${ID_TIKTOK}/`,
      `tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
      `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}?is_from_webapp=1&sender_device=pc`,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "video")).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("o @ do usuario vai para minuscula na canonica", () => {
    const r = normalizarLinkDePublicacao(
      `https://www.tiktok.com/@Ana.Cria/video/${ID_TIKTOK}`,
      "video",
    );
    expect(r.ok && r.valor.url).toBe(
      `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
    );
  });

  it("perfil e id truncado nao sao publicacao", () => {
    for (const entrada of [
      "https://www.tiktok.com/@ana.cria",
      "https://www.tiktok.com/@ana.cria/",
      "https://www.tiktok.com/@ana.cria/video/1",
      "https://www.tiktok.com/video/7311122233344455566",
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "video")).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });
});

describe("normalizarLinkDePublicacao: tipo escolhido (lote 10b)", () => {
  const LINK_DE: Record<(typeof TIPOS_DE_PUBLICACAO)[number], string> = {
    post: `https://www.instagram.com/p/${CODIGO_IG}/`,
    reel: `https://www.instagram.com/reel/${CODIGO_IG}/`,
    story: `https://www.instagram.com/stories/ana.cria/${ID_STORY}/`,
    video: `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
  };

  it("cada tipo aceita o proprio link", () => {
    for (const tipo of TIPOS_DE_PUBLICACAO) {
      const r = normalizarLinkDePublicacao(LINK_DE[tipo], tipo);
      expect(r.ok && r.valor.kind, tipo).toBe(tipo);
      expect(r.ok && r.valor.network, tipo).toBe(
        TIPO_DE_PUBLICACAO_META[tipo].rede,
      );
    }
  });

  it("link de um tipo com outro escolhido: post_type_mismatch, com o tipo detectado", () => {
    // Todos os pares (link de X, tipo Y) com X diferente de Y: doze casos, e
    // nenhum deles e "link invalido", porque o link e bom.
    for (const doLink of TIPOS_DE_PUBLICACAO) {
      for (const escolhido of TIPOS_DE_PUBLICACAO) {
        if (doLink === escolhido) continue;
        expect(
          normalizarLinkDePublicacao(LINK_DE[doLink], escolhido),
          `link de ${doLink}, tipo ${escolhido}`,
        ).toEqual({
          ok: false,
          code: "post_type_mismatch",
          tipo_detectado: doLink,
        });
      }
    }
  });

  it("link curto e link invalido vem ANTES do tipo: nao ha tipo para comparar", () => {
    expect(
      normalizarLinkDePublicacao("https://vm.tiktok.com/ZMabc1234/", "post"),
    ).toEqual({ ok: false, code: "short_link_unsupported" });
    expect(
      normalizarLinkDePublicacao(
        "https://www.instagram.com/ana.cria/",
        "video",
      ),
    ).toEqual({ ok: false, code: "invalid_post_url" });
  });

  it("ehTipoDePublicacao aceita os quatro e recusa o resto", () => {
    for (const tipo of TIPOS_DE_PUBLICACAO) {
      expect(ehTipoDePublicacao(tipo)).toBe(true);
    }
    for (const outro of ["", "reels", "POST", "carrossel", null, 1]) {
      expect(ehTipoDePublicacao(outro)).toBe(false);
    }
  });

  it("a meta tem rotulo e rede para cada tipo, e so o video e do TikTok", () => {
    expect(Object.keys(TIPO_DE_PUBLICACAO_META).sort()).toEqual(
      [...TIPOS_DE_PUBLICACAO].sort(),
    );
    expect(
      TIPOS_DE_PUBLICACAO.filter(
        (t) => TIPO_DE_PUBLICACAO_META[t].rede === "tiktok",
      ),
    ).toEqual(["video"]);
  });
});

describe("statusInicialDaPublicacao (lote 10b)", () => {
  it("story nasce confirmado; post, reel e video nascem pendentes", () => {
    expect(statusInicialDaPublicacao("story")).toBe("confirmado");
    for (const tipo of ["post", "reel", "video"] as const) {
      expect(statusInicialDaPublicacao(tipo)).toBe("pendente");
    }
  });
});

describe("normalizarLinkDePublicacao: recusas", () => {
  it("link curto tem codigo proprio, e nao invalid_post_url", () => {
    for (const entrada of [
      "https://vm.tiktok.com/ZMabc1234/",
      "https://vt.tiktok.com/ZSabc12/",
      "vm.tiktok.com/ZMabc1234",
      `https://instagr.am/p/${CODIGO_IG}/`,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "video")).toEqual({
        ok: false,
        code: "short_link_unsupported",
      });
    }
  });

  it("outra rede, vazio e o que nem e texto sao invalid_post_url", () => {
    for (const entrada of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://x.com/anacria/status/7311122233344455566",
      "https://www.instagram.com.br/p/Cx1AbCdEf_-/",
      "nao e link nenhum",
      "",
      "   ",
      null,
      undefined,
      42,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "post")).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });
});

describe("LIMITE_DE_REGISTROS_POR_DIA", () => {
  it("e dez, e e o teto por creator por dia civil de Brasilia", () => {
    expect(LIMITE_DE_REGISTROS_POR_DIA).toBe(10);
  });
});
