// REGRAS DO LINK DE PUBLICACAO (lote 09, tipo e status no lote 10b): o creator
// ESCOLHE o tipo (post, reel, story ou video) e cola a URL, e isto devolve a
// rede, o tipo, o identificador na rede e a URL CANONICA, ou o motivo da recusa.
//
// Fonte UNICA para o server, que grava, e para o client, que mostra o mesmo
// erro antes de enviar. Mesmo motivo de shared/creatorProfile.ts: duas copias
// da regra divergem na primeira mudanca.
//
// O TIPO ENTRA NA VALIDACAO (lote 10b): o link precisa ser do tipo escolhido.
// Link de reel com "post" escolhido e `post_type_mismatch`, e o resultado diz
// qual tipo o link parece ser (`tipo_detectado`), para a tela poder dizer
// "esse link e de um reel; troque o tipo ou o link" em vez de "link invalido".
// A escolha existe porque o status inicial depende do tipo (story nasce
// confirmado, ver `statusInicialDaPublicacao`), e deixar o tipo ser deduzido
// do link tornaria a excecao do story algo que a pessoa nunca declarou.
//
// O `external_id` e o que torna a unicidade estavel. A mesma publicacao colada
// com e sem `www`, com e sem query string, com e sem barra final, com o usuario
// na frente ou nao, cai no MESMO id, e o unique da tabela
// (`creator_posts_unico_por_creator`) faz o resto.
//
// LINK CURTO E RECUSADO, com codigo proprio. Resolver `vm.tiktok.com` exigiria
// o servidor abrir uma URL de fora para seguir o redirecionamento, que e uma
// requisicao de saida para um endereco que o usuario escolheu. O custo de
// recusar e a pessoa colar o link completo; o custo de aceitar e um caminho de
// SSRF por conveniencia.
//
// NADA AQUI VERIFICA CONTEUDO: se a publicacao fala da Bora na Tech e decisao
// do admin, que confere a lista de pendentes e confirma ou remove. Isto so
// entende URL.

export const REDES_DE_PUBLICACAO = ["instagram", "tiktok"] as const;
export type RedeDePublicacao = (typeof REDES_DE_PUBLICACAO)[number];

export const TIPOS_DE_PUBLICACAO = ["post", "reel", "story", "video"] as const;
export type TipoDePublicacao = (typeof TIPOS_DE_PUBLICACAO)[number];

/**
 * Rotulo de cada tipo e a rede que ele admite. Post, reel e story sao coisas
 * do Instagram; video e a unica forma do TikTok. A rede fica AQUI, e nao
 * deduzida do link, para a tela saber o que oferecer e para o mismatch ter
 * nome: "video" com link do Instagram e tipo errado, nao link invalido.
 */
// TODO(Ana)
export const TIPO_DE_PUBLICACAO_META: Record<
  TipoDePublicacao,
  { rotulo: string; rede: RedeDePublicacao }
> = {
  post: { rotulo: "Post", rede: "instagram" },
  reel: { rotulo: "Reel", rede: "instagram" },
  story: { rotulo: "Story", rede: "instagram" },
  video: { rotulo: "Vídeo do TikTok", rede: "tiktok" },
};

export function ehTipoDePublicacao(valor: unknown): valor is TipoDePublicacao {
  return (
    typeof valor === "string" &&
    (TIPOS_DE_PUBLICACAO as readonly string[]).includes(valor)
  );
}

export const STATUS_DE_PUBLICACAO = ["pendente", "confirmado"] as const;
export type StatusDePublicacao = (typeof STATUS_DE_PUBLICACAO)[number];

/**
 * Status com que a publicacao NASCE (lote 10b).
 *
 * Tudo nasce `pendente` e so vale ponto depois que o admin confere, EXCETO
 * story: o time confere os stories todo dia fora da plataforma, entao ele
 * nasce `confirmado`, sem passar pela lista do admin (que continua podendo
 * remover). Uma funcao, um lugar: o servidor grava o que sai daqui, e o teste
 * que fixa a excecao esta ao lado.
 */
export function statusInicialDaPublicacao(
  tipo: TipoDePublicacao,
): StatusDePublicacao {
  return tipo === "story" ? "confirmado" : "pendente";
}

export type CodigoDeLinkDePublicacao =
  | "invalid_post_url"
  | "short_link_unsupported"
  | "post_type_mismatch";

/** O que o servidor grava, derivado do link. */
export type PublicacaoNormalizada = {
  network: RedeDePublicacao;
  kind: TipoDePublicacao;
  external_id: string;
  /** URL canonica: a mesma publicacao sempre escrita do mesmo jeito. */
  url: string;
};

/**
 * Resultado da normalizacao. O `post_type_mismatch` carrega o tipo que o link
 * parece ser: e a unica recusa em que a pessoa colou um link bom e so errou a
 * escolha, e a tela precisa dizer isso com o nome do tipo.
 */
export type ResultadoDoLink =
  | { ok: true; valor: PublicacaoNormalizada }
  | { ok: false; code: "invalid_post_url" | "short_link_unsupported" }
  | { ok: false; code: "post_type_mismatch"; tipo_detectado: TipoDePublicacao };

/**
 * Teto de registros por dia, por creator.
 *
 * Sem verificacao de conteudo, este teto e a unica coisa que impede o ranking
 * de ser inflado por link colado em serie. Nao e antifraude: e o limite que
 * torna a inflacao trabalhosa o bastante para o admin ver a lista e remover.
 */
export const LIMITE_DE_REGISTROS_POR_DIA = 10;

// Hospedeiros de link curto. Recusados com codigo proprio para a tela poder
// dizer "cole o link completo" em vez de "link invalido", que mandaria a
// pessoa conferir uma URL que ela copiou certo. Os do TikTok o SERVIDOR
// resolve (lote 10c, server/lib/tiktokShortLink.ts) quando o tipo escolhido e
// video; o do Instagram continua recusado.
const HOSTS_CURTOS = ["vm.tiktok.com", "vt.tiktok.com", "instagr.am"];

// `tiktok.com/t/<codigo>` e a terceira forma de link curto do app do TikTok,
// no host principal: e reconhecida pelo CAMINHO, nao pelo host.
const CAMINHO_CURTO_DO_TIKTOK_RE = /^t\/[A-Za-z0-9]{4,32}$/;

// Shortcode do Instagram. Ele e SENSIVEL A MAIUSCULA, entao o caminho nunca e
// passado por toLowerCase: so o host e os nomes de usuario sao normalizados
// assim.
const CODIGO_DO_INSTAGRAM = "[A-Za-z0-9_-]{5,32}";

// Nome de usuario, nas DUAS redes: o `@` do TikTok, o trecho opcional que o
// Instagram poe antes de `/p/` e `/reel/`, e o dono do story em `/stories/`.
// Uma constante so, com nome neutro, porque as formas sao a mesma; batizar de
// "do TikTok" faria quem apertasse a regra de la mudar o Instagram junto, sem
// perceber.
const USUARIO_DA_REDE = "[A-Za-z0-9._]{2,24}";

// Id numerico do video no TikTok e do story no Instagram. O piso de 5 digitos e
// deliberado: `video/1` nao e id, e um link truncado, e aceitar isso gravaria
// lixo com unique proprio.
const ID_NUMERICO = "[0-9]{5,32}";

const INSTAGRAM_RE = new RegExp(
  `^(?:${USUARIO_DA_REDE}/)?(p|reel|reels)/(${CODIGO_DO_INSTAGRAM})$`,
);

// Story: `instagram.com/stories/<usuario>/<digitos>/`. O usuario e obrigatorio
// (e assim que o Instagram escreve o link), e o id do story sao os digitos.
const STORY_RE = new RegExp(`^stories/(${USUARIO_DA_REDE})/(${ID_NUMERICO})$`);

const TIKTOK_RE = new RegExp(`^@(${USUARIO_DA_REDE})/video/(${ID_NUMERICO})$`);

/** Host e caminho de uma URL colada, sem protocolo, sem query e sem hash. */
function partesDaUrl(valor: string): { host: string; caminho: string } | null {
  let resto = valor.trim();
  if (resto === "") return null;
  resto = resto.replace(/^https?:\/\//i, "");
  // Query e hash saem antes de tudo: `?igshid=`, `?is_from_webapp=1` e afins
  // sao rastreamento da rede, nao identidade da publicacao.
  resto = resto.split("?")[0].split("#")[0];
  const barra = resto.indexOf("/");
  const host = (barra === -1 ? resto : resto.slice(0, barra)).toLowerCase();
  const caminho = barra === -1 ? "" : resto.slice(barra + 1);
  if (host === "") return null;
  return {
    host: host.replace(/^www\./, ""),
    caminho: caminho.replace(/\/+$/, ""),
  };
}

/**
 * O que o link parece ser, sem olhar o tipo escolhido. E a leitura que vira
 * `tipo_detectado` no mismatch; quem grava usa `normalizarLinkDePublicacao`.
 */
function detectarPublicacao(
  valor: unknown,
):
  | { ok: true; valor: PublicacaoNormalizada }
  | { ok: false; code: "invalid_post_url" | "short_link_unsupported" } {
  if (typeof valor !== "string") return { ok: false, code: "invalid_post_url" };

  const partes = partesDaUrl(valor);
  if (!partes) return { ok: false, code: "invalid_post_url" };
  const { host, caminho } = partes;

  if (HOSTS_CURTOS.includes(host)) {
    return { ok: false, code: "short_link_unsupported" };
  }

  if (host === "instagram.com") {
    const story = STORY_RE.exec(caminho);
    // `stories/highlights/<id>/` tem a forma de story com usuario
    // "highlights", e nao e: destaque e uma colecao fixa do perfil, sem data,
    // e registra-lo como story do dia contaria o mesmo destaque todo mes.
    if (story && story[1].toLowerCase() !== "highlights") {
      // O dono vai para minuscula na canonica, como o @ do TikTok: e nome de
      // usuario, e o Instagram nao distingue maiuscula nele. O id (os digitos)
      // e o que identifica o story, entao a unicidade nao depende disso.
      const usuario = story[1].toLowerCase();
      const id = story[2];
      return {
        ok: true,
        valor: {
          network: "instagram",
          kind: "story",
          external_id: id,
          url: `https://www.instagram.com/stories/${usuario}/${id}/`,
        },
      };
    }
    const m = INSTAGRAM_RE.exec(caminho);
    if (!m) return { ok: false, code: "invalid_post_url" };
    const kind: TipoDePublicacao = m[1] === "p" ? "post" : "reel";
    const codigo = m[2];
    // `reels` e `reel` sao a mesma coisa para o Instagram; a canonica usa uma so.
    const trecho = kind === "post" ? "p" : "reel";
    return {
      ok: true,
      valor: {
        network: "instagram",
        kind,
        external_id: codigo,
        url: `https://www.instagram.com/${trecho}/${codigo}/`,
      },
    };
  }

  if (host === "tiktok.com") {
    if (CAMINHO_CURTO_DO_TIKTOK_RE.test(caminho)) {
      return { ok: false, code: "short_link_unsupported" };
    }
    const m = TIKTOK_RE.exec(caminho);
    if (!m) return { ok: false, code: "invalid_post_url" };
    const usuario = m[1].toLowerCase();
    const id = m[2];
    return {
      ok: true,
      valor: {
        network: "tiktok",
        kind: "video",
        external_id: id,
        url: `https://www.tiktok.com/@${usuario}/video/${id}`,
      },
    };
  }

  return { ok: false, code: "invalid_post_url" };
}

/**
 * Link de publicacao normalizado para o tipo ESCOLHIDO, ou o codigo do erro.
 *
 * Aceita com e sem `https://`, com e sem `www.`, com query string e com barra
 * final. Perfil (`instagram.com/ana.cria/`) NAO e publicacao: e `invalid_post_url`,
 * porque registrar um perfil como publicacao encheria o ranking de nada.
 *
 * A ordem das recusas e deliberada: link curto e link invalido vem ANTES do
 * tipo, porque nesses casos nao ha tipo detectavel para comparar, e dizer
 * "tipo errado" sobre um link que nem e publicacao mandaria a pessoa trocar a
 * coisa certa.
 */
export function normalizarLinkDePublicacao(
  valor: unknown,
  tipo: TipoDePublicacao,
): ResultadoDoLink {
  const lido = detectarPublicacao(valor);
  if (!lido.ok) return lido;
  if (lido.valor.kind !== tipo) {
    return {
      ok: false,
      code: "post_type_mismatch",
      tipo_detectado: lido.valor.kind,
    };
  }
  return lido;
}
