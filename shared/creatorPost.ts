import type { Resultado } from "./creatorProfile";

// REGRAS DO LINK DE PUBLICACAO (lote 09): o creator cola a URL de um post ou
// reel do Instagram, ou de um video do TikTok, e isto devolve a rede, o tipo, o
// identificador na rede e a URL CANONICA.
//
// Fonte UNICA para o server, que grava, e para o client, que mostra o mesmo
// erro antes de enviar. Mesmo motivo de shared/creatorProfile.ts: duas copias
// da regra divergem na primeira mudanca.
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
// do admin, que ve a lista e remove o que nao for. Isto so entende URL.

export const REDES_DE_PUBLICACAO = ["instagram", "tiktok"] as const;
export type RedeDePublicacao = (typeof REDES_DE_PUBLICACAO)[number];

export const TIPOS_DE_PUBLICACAO = ["post", "reel", "video"] as const;
export type TipoDePublicacao = (typeof TIPOS_DE_PUBLICACAO)[number];

export type CodigoDeLinkDePublicacao =
  | "invalid_post_url"
  | "short_link_unsupported";

/** O que o servidor grava, derivado do link. */
export type PublicacaoNormalizada = {
  network: RedeDePublicacao;
  kind: TipoDePublicacao;
  external_id: string;
  /** URL canonica: a mesma publicacao sempre escrita do mesmo jeito. */
  url: string;
};

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
// pessoa conferir uma URL que ela copiou certo.
const HOSTS_CURTOS = ["vm.tiktok.com", "vt.tiktok.com", "instagr.am"];

// Shortcode do Instagram. Ele e SENSIVEL A MAIUSCULA, entao o caminho nunca e
// passado por toLowerCase: so o host e o @ do TikTok sao normalizados assim.
const CODIGO_DO_INSTAGRAM = "[A-Za-z0-9_-]{5,32}";

// Nome de usuario, nas DUAS redes: o `@` do TikTok e o trecho opcional que o
// Instagram poe antes de `/p/` e `/reel/`. Uma constante so, com nome neutro,
// porque as duas formas sao a mesma; batizar de "do TikTok" faria quem
// apertasse a regra de la mudar o Instagram junto, sem perceber.
const USUARIO_DA_REDE = "[A-Za-z0-9._]{2,24}";

// Id numerico do video no TikTok. O piso de 5 digitos e deliberado: `video/1`
// nao e id, e um link truncado, e aceitar isso gravaria lixo com unique proprio.
const ID_DO_TIKTOK = "[0-9]{5,32}";

const INSTAGRAM_RE = new RegExp(
  `^(?:${USUARIO_DA_REDE}/)?(p|reel|reels)/(${CODIGO_DO_INSTAGRAM})$`,
);

const TIKTOK_RE = new RegExp(`^@(${USUARIO_DA_REDE})/video/(${ID_DO_TIKTOK})$`);

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
 * Link de publicacao normalizado, ou o codigo do erro.
 *
 * Aceita com e sem `https://`, com e sem `www.`, com query string e com barra
 * final. Perfil (`instagram.com/ana.cria/`) NAO e publicacao: e `invalid_post_url`,
 * porque registrar um perfil como publicacao encheria o ranking de nada.
 */
export function normalizarLinkDePublicacao(
  valor: unknown,
): Resultado<PublicacaoNormalizada, CodigoDeLinkDePublicacao> {
  if (typeof valor !== "string") return { ok: false, code: "invalid_post_url" };

  const partes = partesDaUrl(valor);
  if (!partes) return { ok: false, code: "invalid_post_url" };
  const { host, caminho } = partes;

  if (HOSTS_CURTOS.includes(host)) {
    return { ok: false, code: "short_link_unsupported" };
  }

  if (host === "instagram.com") {
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
