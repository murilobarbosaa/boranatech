import { describe, expect, it } from "vitest";

/**
 * Regras do link de publicacao (lote 09).
 *
 * Os valores sao LITERAIS de propósito: um shortcode de Instagram real tem
 * maiuscula e minuscula, e um id de TikTok tem dezenove digitos. Escrever
 * "abc" nos dois lugares faria o teste passar com regras que nao servem para o
 * dado de verdade.
 *
 * A asserção que se repete e a CANONICA: a mesma publicacao colada de cinco
 * jeitos diferentes precisa sair com a mesma URL e o mesmo `external_id`, que e
 * o que faz o unique da tabela reconhecer a repeticao.
 */

import {
  LIMITE_DE_REGISTROS_POR_DIA,
  normalizarLinkDePublicacao,
} from "./creatorPost";

const CODIGO_IG = "Cx1AbCdEf_-";
const ID_TIKTOK = "7311122233344455566";

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
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
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
      ),
    ).toEqual({ ok: true, valor: esperado });
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/reels/${CODIGO_IG}/`,
      ),
    ).toEqual({ ok: true, valor: esperado });
  });

  it("com o usuario na frente, o resultado e o mesmo", () => {
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/ana.cria/p/${CODIGO_IG}/`,
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
    );
    expect(r.ok && r.valor.external_id).toBe("AbCdEfGhIjK");
    expect(r.ok && r.valor.url).toBe(
      "https://www.instagram.com/p/AbCdEfGhIjK/",
    );
  });

  it("perfil nao e publicacao, e codigo curto demais tambem nao", () => {
    for (const entrada of [
      "https://www.instagram.com/ana.cria/",
      "https://www.instagram.com/",
      "https://www.instagram.com/p/abc/",
      "https://www.instagram.com/p/",
      "https://www.instagram.com/explore/tags/tech/",
    ]) {
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
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
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("o @ do usuario vai para minuscula na canonica", () => {
    const r = normalizarLinkDePublicacao(
      `https://www.tiktok.com/@Ana.Cria/video/${ID_TIKTOK}`,
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
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
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
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
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
      expect(normalizarLinkDePublicacao(entrada)).toEqual({
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
