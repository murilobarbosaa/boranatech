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

import { REDES_DE_CREATOR, type RedeDeCreator } from "./creatorProfile";
import {
  ehTipoDePublicacao,
  REDES_DE_PUBLICACAO,
  ROTULO_DO_TIPO,
  TIPOS_POR_REDE,
  tipoValidoParaRede,
  type TipoDePublicacao,
  LIMITE_DE_REGISTROS_POR_DIA,
  MENSAGEM_DO_LINK,
  mensagemDeRedeErrada,
  mensagemDeTipoErrado,
  mensagemDoLinkRecusado,
  normalizarLinkDePublicacao,
  statusInicialDaPublicacao,
  TIPOS_DE_PUBLICACAO,
  type CodigoSimplesDoLink,
} from "./creatorPost";

const CODIGO_IG = "Cx1AbCdEf_-";
const ID_TIKTOK = "7311122233344455566";
const ID_STORY = "3456789012345678901";
const ID_LINKEDIN = "7371234567890123456";

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
      expect(normalizarLinkDePublicacao(entrada, "instagram", "post")).toEqual({
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
        "instagram",
        "reel",
      ),
    ).toEqual({ ok: true, valor: esperado });
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/reels/${CODIGO_IG}/`,
        "instagram",
        "reel",
      ),
    ).toEqual({ ok: true, valor: esperado });
  });

  it("com o usuario na frente, o resultado e o mesmo", () => {
    expect(
      normalizarLinkDePublicacao(
        `https://www.instagram.com/ana.cria/p/${CODIGO_IG}/`,
        "instagram",
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
        "instagram",
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
      "instagram",
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
      expect(normalizarLinkDePublicacao(entrada, "instagram", "story")).toEqual(
        {
          ok: true,
          valor: esperado,
        },
      );
    }
  });

  it("story sem usuario, destaque e id truncado nao sao story", () => {
    for (const entrada of [
      `https://www.instagram.com/stories/${ID_STORY}/`,
      "https://www.instagram.com/stories/ana.cria/",
      "https://www.instagram.com/stories/ana.cria/12/",
      "https://www.instagram.com/stories/highlights/17900000000000000/",
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "instagram", "story")).toEqual(
        {
          ok: false,
          code: "invalid_post_url",
        },
      );
    }
  });

  it("perfil e profile_link (lote 11k); raiz, codigo curto demais e caminhos reservados sao invalidos", () => {
    for (const entrada of [
      "https://www.instagram.com/ana.cria/",
      "instagram.com/Ana.Cria",
      "https://www.instagram.com/ana.cria/?igsh=abc",
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "instagram", "post"),
        entrada,
      ).toEqual({ ok: false, code: "profile_link" });
    }
    for (const entrada of [
      "https://www.instagram.com/",
      "https://www.instagram.com/p/abc/",
      "https://www.instagram.com/p/",
      "https://www.instagram.com/explore/tags/tech/",
      // Um segmento so, mas reservado pela rede: nunca e perfil.
      "https://www.instagram.com/explore/",
      "https://www.instagram.com/reels/",
      "https://www.instagram.com/stories/",
      "https://www.instagram.com/accounts/",
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "instagram", "post"),
        entrada,
      ).toEqual({ ok: false, code: "invalid_post_url" });
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
      expect(normalizarLinkDePublicacao(entrada, "tiktok", "video")).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("o @ do usuario vai para minuscula na canonica", () => {
    const r = normalizarLinkDePublicacao(
      `https://www.tiktok.com/@Ana.Cria/video/${ID_TIKTOK}`,
      "tiktok",
      "video",
    );
    expect(r.ok && r.valor.url).toBe(
      `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
    );
  });

  it("perfil e profile_link (lote 11k); id truncado e video sem @ sao invalidos", () => {
    for (const entrada of [
      "https://www.tiktok.com/@ana.cria",
      "https://www.tiktok.com/@ana.cria/",
      "tiktok.com/@ana.cria?lang=pt",
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "tiktok", "video"),
        entrada,
      ).toEqual({ ok: false, code: "profile_link" });
    }
    for (const entrada of [
      "https://www.tiktok.com/@ana.cria/video/1",
      "https://www.tiktok.com/video/7311122233344455566",
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "tiktok", "video"),
        entrada,
      ).toEqual({ ok: false, code: "invalid_post_url" });
    }
  });
});

describe("normalizarLinkDePublicacao: rede e tipo escolhidos (lotes 10b e 10d)", () => {
  const REDE_DO_TIPO: Record<TipoDePublicacao, RedeDeCreator> = {
    post: "instagram",
    reel: "instagram",
    story: "instagram",
    video: "tiktok",
  };
  const LINK_DE: Record<TipoDePublicacao, string> = {
    post: `https://www.instagram.com/p/${CODIGO_IG}/`,
    reel: `https://www.instagram.com/reel/${CODIGO_IG}/`,
    story: `https://www.instagram.com/stories/ana.cria/${ID_STORY}/`,
    video: `https://www.tiktok.com/@ana.cria/video/${ID_TIKTOK}`,
  };
  const LINK_LINKEDIN = `https://www.linkedin.com/feed/update/urn:li:activity:${ID_LINKEDIN}/`;

  it("cada tipo aceita o proprio link, na rede que TIPOS_POR_REDE diz", () => {
    for (const tipo of TIPOS_DE_PUBLICACAO) {
      const rede = REDE_DO_TIPO[tipo];
      expect(TIPOS_POR_REDE[rede]).toContain(tipo);
      const r = normalizarLinkDePublicacao(LINK_DE[tipo], rede, tipo);
      expect(r.ok && r.valor.kind, tipo).toBe(tipo);
      expect(r.ok && r.valor.network, tipo).toBe(rede);
    }
    expect(
      normalizarLinkDePublicacao(LINK_LINKEDIN, "linkedin", "post").ok,
    ).toBe(true);
  });

  it("TIPOS_POR_REDE cobre as tres redes e todos os tipos, sem tipo fora da propria rede", () => {
    expect(Object.keys(TIPOS_POR_REDE).sort()).toEqual(
      [...REDES_DE_CREATOR].sort(),
    );
    expect(TIPOS_POR_REDE.instagram).toEqual(["post", "reel", "story"]);
    expect(TIPOS_POR_REDE.tiktok).toEqual(["video"]);
    expect(TIPOS_POR_REDE.linkedin).toEqual(["post"]);
    expect(tipoValidoParaRede("tiktok", "post")).toBe(false);
    expect(tipoValidoParaRede("linkedin", "post")).toBe(true);
    expect(tipoValidoParaRede("instagram", "video")).toBe(false);
    expect(tipoValidoParaRede("instagram", "carrossel")).toBe(false);
  });

  it("link de um tipo com outro escolhido NA MESMA rede: post_type_mismatch, com o tipo detectado", () => {
    // Todos os pares do Instagram (link de X, tipo Y) com X diferente de Y:
    // seis casos, e nenhum deles e "link invalido", porque o link e bom.
    for (const doLink of ["post", "reel", "story"] as const) {
      for (const escolhido of ["post", "reel", "story"] as const) {
        if (doLink === escolhido) continue;
        expect(
          normalizarLinkDePublicacao(LINK_DE[doLink], "instagram", escolhido),
          `link de ${doLink}, tipo ${escolhido}`,
        ).toEqual({
          ok: false,
          code: "post_type_mismatch",
          tipo_detectado: doLink,
        });
      }
    }
  });

  it("link de OUTRA rede: post_network_mismatch, com a rede detectada, antes de olhar o tipo", () => {
    expect(
      normalizarLinkDePublicacao(LINK_DE.video, "instagram", "reel"),
    ).toEqual({
      ok: false,
      code: "post_network_mismatch",
      rede_detectada: "tiktok",
    });
    expect(normalizarLinkDePublicacao(LINK_DE.post, "tiktok", "video")).toEqual(
      {
        ok: false,
        code: "post_network_mismatch",
        rede_detectada: "instagram",
      },
    );
    expect(
      normalizarLinkDePublicacao(LINK_LINKEDIN, "instagram", "post"),
    ).toEqual({
      ok: false,
      code: "post_network_mismatch",
      rede_detectada: "linkedin",
    });
    expect(
      normalizarLinkDePublicacao(LINK_DE.story, "linkedin", "post"),
    ).toEqual({
      ok: false,
      code: "post_network_mismatch",
      rede_detectada: "instagram",
    });
  });

  it("link curto e link invalido vem ANTES da rede e do tipo: nao ha o que comparar", () => {
    expect(
      normalizarLinkDePublicacao(
        "https://vm.tiktok.com/ZMabc1234/",
        "instagram",
        "post",
      ),
    ).toEqual({ ok: false, code: "short_link_unsupported" });
    // Perfil do Instagram com TikTok escolhido: a recusa e a do perfil, e nao
    // a da rede, porque um perfil nao e publicacao de rede nenhuma.
    expect(
      normalizarLinkDePublicacao(
        "https://www.instagram.com/ana.cria/",
        "tiktok",
        "video",
      ),
    ).toEqual({ ok: false, code: "profile_link" });
    expect(
      normalizarLinkDePublicacao(
        "https://www.instagram.com/explore/",
        "tiktok",
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

  it("ROTULO_DO_TIPO tem rotulo para cada tipo", () => {
    expect(Object.keys(ROTULO_DO_TIPO).sort()).toEqual(
      [...TIPOS_DE_PUBLICACAO].sort(),
    );
  });
});

describe("normalizarLinkDePublicacao: LinkedIn (lote 10d)", () => {
  it("as formas do botao Copiar link caem na mesma canonica, com o tipo do urn no external_id", () => {
    const esperado = {
      network: "linkedin",
      kind: "post",
      external_id: `activity:${ID_LINKEDIN}`,
      url: `https://www.linkedin.com/feed/update/urn:li:activity:${ID_LINKEDIN}/`,
    };
    for (const entrada of [
      `https://www.linkedin.com/posts/ana-cria_bora-na-tech-activity-${ID_LINKEDIN}-Ab3C?utm_source=share&utm_medium=member_desktop`,
      `https://www.linkedin.com/feed/update/urn:li:activity:${ID_LINKEDIN}/`,
      `linkedin.com/feed/update/urn:li:activity:${ID_LINKEDIN}`,
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "linkedin", "post"),
        entrada,
      ).toEqual({
        ok: true,
        valor: esperado,
      });
    }
  });

  it("share e ugcPost sao espacos de id DISTINTOS de activity", () => {
    const share = normalizarLinkDePublicacao(
      `https://www.linkedin.com/feed/update/urn:li:share:${ID_LINKEDIN}/`,
      "linkedin",
      "post",
    );
    expect(share.ok && share.valor.external_id).toBe(`share:${ID_LINKEDIN}`);
    expect(share.ok && share.valor.url).toBe(
      `https://www.linkedin.com/feed/update/urn:li:share:${ID_LINKEDIN}/`,
    );
    const ugc = normalizarLinkDePublicacao(
      `https://www.linkedin.com/feed/update/urn:li:ugcPost:${ID_LINKEDIN}/`,
      "linkedin",
      "post",
    );
    expect(ugc.ok && ugc.valor.external_id).toBe(`ugcPost:${ID_LINKEDIN}`);
  });

  it("posts/ com ugcPost, share e o post sem texto (`_activity-`) caem na canonica do proprio tipo (lote 11k)", () => {
    for (const [entrada, tipoDoUrn] of [
      [
        `https://www.linkedin.com/posts/ana-cria_bora-na-tech-ugcPost-${ID_LINKEDIN}-Ab3C?utm_source=share`,
        "ugcPost",
      ],
      [
        `https://www.linkedin.com/posts/ana-cria_bora-na-tech-share-${ID_LINKEDIN}-Ab3C`,
        "share",
      ],
      // Post sem texto: o slug encosta no tipo com `_`, nao com `-`.
      [
        `https://www.linkedin.com/posts/ana-cria_activity-${ID_LINKEDIN}-Ab3C`,
        "activity",
      ],
      [`linkedin.com/posts/ana-cria_ugcPost-${ID_LINKEDIN}-Ab3C/`, "ugcPost"],
    ] as const) {
      expect(
        normalizarLinkDePublicacao(entrada, "linkedin", "post"),
        entrada,
      ).toEqual({
        ok: true,
        valor: {
          network: "linkedin",
          kind: "post",
          external_id: `${tipoDoUrn}:${ID_LINKEDIN}`,
          url: `https://www.linkedin.com/feed/update/urn:li:${tipoDoUrn}:${ID_LINKEDIN}/`,
        },
      });
    }
    // O mesmo post colado pelo `posts/` e pelo `feed/update` e UM registro.
    const a = normalizarLinkDePublicacao(
      `https://www.linkedin.com/posts/ana-cria_x-ugcPost-${ID_LINKEDIN}-Ab3C`,
      "linkedin",
      "post",
    );
    const b = normalizarLinkDePublicacao(
      `https://www.linkedin.com/feed/update/urn:li:ugcPost:${ID_LINKEDIN}/`,
      "linkedin",
      "post",
    );
    expect(a).toEqual(b);
  });

  it("lnkd.in e link curto SEM resolvedor; perfil e profile_link; artigo, empresa e id curto sao invalidos", () => {
    expect(
      normalizarLinkDePublicacao(
        "https://lnkd.in/dAbC123x",
        "linkedin",
        "post",
      ),
    ).toEqual({ ok: false, code: "short_link_unsupported" });
    expect(
      normalizarLinkDePublicacao(
        "https://www.linkedin.com/in/ana-cria/",
        "linkedin",
        "post",
      ),
    ).toEqual({ ok: false, code: "profile_link" });
    for (const entrada of [
      "https://www.linkedin.com/pulse/como-entrar-em-ti-ana-cria-abc1/",
      "https://www.linkedin.com/company/boranatech/",
      "https://www.linkedin.com/feed/update/urn:li:activity:123/",
      "https://www.linkedin.com/feed/update/urn:li:comment:7123456789012345678/",
      "https://www.linkedin.com/posts/ana-cria_activity-abc-xyz",
    ]) {
      expect(
        normalizarLinkDePublicacao(entrada, "linkedin", "post"),
        entrada,
      ).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });

  it("post do LinkedIn nasce pendente, como o do Instagram", () => {
    expect(statusInicialDaPublicacao("post")).toBe("pendente");
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
      // A terceira forma do app do TikTok, no host principal (lote 10c).
      "https://www.tiktok.com/t/ZTabc123/",
      "tiktok.com/t/ZTabc123",
      `https://instagr.am/p/${CODIGO_IG}/`,
    ]) {
      expect(normalizarLinkDePublicacao(entrada, "tiktok", "video")).toEqual({
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
      expect(normalizarLinkDePublicacao(entrada, "instagram", "post")).toEqual({
        ok: false,
        code: "invalid_post_url",
      });
    }
  });
});

describe("mensagens da recusa (lote 11k): uma fonte para a rota e para a tela", () => {
  it("todo codigo simples tem frase, e nenhuma e a generica de outro", () => {
    const codigos: CodigoSimplesDoLink[] = [
      "invalid_post_url",
      "short_link_unsupported",
      "share_link_unsupported",
      "tiktok_photo_unsupported",
      "profile_link",
    ];
    expect(Object.keys(MENSAGEM_DO_LINK).sort()).toEqual([...codigos].sort());
    const frases = codigos.map((c) => MENSAGEM_DO_LINK[c]);
    expect(new Set(frases).size).toBe(frases.length);
    for (const frase of frases) expect(frase.trim().length).toBeGreaterThan(0);
  });

  it("mensagemDoLinkRecusado despacha para a frase certa, com o nome detectado nos mismatch", () => {
    expect(mensagemDoLinkRecusado({ ok: false, code: "profile_link" })).toBe(
      MENSAGEM_DO_LINK.profile_link,
    );
    expect(
      mensagemDoLinkRecusado({
        ok: false,
        code: "post_network_mismatch",
        rede_detectada: "tiktok",
      }),
    ).toBe(mensagemDeRedeErrada("tiktok"));
    expect(mensagemDeRedeErrada("tiktok")).toBe(
      "Esse link é do TikTok. Troque a rede ou o link.",
    );
    expect(
      mensagemDoLinkRecusado({
        ok: false,
        code: "post_type_mismatch",
        tipo_detectado: "reel",
      }),
    ).toBe(mensagemDeTipoErrado("reel"));
    expect(mensagemDeTipoErrado("reel")).toBe(
      "Esse link é de um reel. Troque o tipo ou o link.",
    );
  });
});

describe("LIMITE_DE_REGISTROS_POR_DIA", () => {
  it("e dez, e e o teto por creator por dia civil de Brasilia", () => {
    expect(LIMITE_DE_REGISTROS_POR_DIA).toBe(10);
  });
});

describe("REDES_DE_PUBLICACAO (lote 10d)", () => {
  it("e a MESMA lista de REDES_DE_CREATOR, nao uma copia", () => {
    expect(REDES_DE_PUBLICACAO).toBe(REDES_DE_CREATOR);
  });
});
