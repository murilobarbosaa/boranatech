import {
  ehRedeDeCreator,
  REDES_DE_CREATOR,
  ROTULO_DA_REDE,
  rotuloDaRede,
  type RedeDeCreator,
} from "./creatorProfile";

// REGRAS DO LINK DE PUBLICACAO (lote 09; tipo e status no 10b; rede escolhida
// e LinkedIn no 10d): o creator ESCOLHE a rede, depois o tipo (quando a rede
// tem mais de um), cola a URL, e isto devolve a rede, o tipo, o identificador
// na rede e a URL CANONICA, ou o motivo da recusa.
//
// Fonte UNICA para o server, que grava, e para o client, que mostra o mesmo
// erro antes de enviar. Mesmo motivo de shared/creatorProfile.ts: duas copias
// da regra divergem na primeira mudanca.
//
// A REDE E O TIPO ENTRAM NA VALIDACAO: o link precisa ser da rede escolhida
// (`post_network_mismatch`, com a rede que o link parece ser) e, dentro dela,
// do tipo escolhido (`post_type_mismatch`, com o tipo detectado). Duas recusas
// separadas porque sao dois erros de escolha diferentes, e a tela diz cada um
// com o nome do que foi detectado. A escolha existe porque o status inicial
// depende do tipo (story nasce confirmado, ver `statusInicialDaPublicacao`), e
// deixar o tipo ser deduzido do link tornaria a excecao do story algo que a
// pessoa nunca declarou.
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
// SSRF por conveniencia. Os do TikTok o SERVIDOR resolve (lote 10c,
// server/lib/tiktokShortLink.ts) com host de lista fechada e HEAD; os do
// Instagram e do LinkedIn (`lnkd.in`, que responde com uma pagina
// intermediaria e nao com redirecionamento, e resolver isso seria ler corpo)
// continuam recusados.
//
// NADA AQUI VERIFICA CONTEUDO: se a publicacao fala da Bora na Tech e decisao
// do admin, que confere a lista de pendentes e confirma ou remove. Isto so
// entende URL.

/**
 * As redes de publicacao SAO as redes de creator (lote 10d): reexport, e nao
 * segunda lista, porque duas listas da mesma coisa divergem na primeira rede
 * nova, e o LinkedIn foi a primeira.
 */
export const REDES_DE_PUBLICACAO = REDES_DE_CREATOR;
export type RedeDePublicacao = RedeDeCreator;

export const TIPOS_DE_PUBLICACAO = ["post", "reel", "story", "video"] as const;
export type TipoDePublicacao = (typeof TIPOS_DE_PUBLICACAO)[number];

/**
 * Os tipos que cada rede admite. Instagram tem tres; TikTok e LinkedIn tem um
 * so, e nesses a tela escolhe o tipo sozinha. O post do LinkedIn grava
 * `kind = post` como o do Instagram: a rede e outra coluna, e e ela que os
 * separa.
 */
export const TIPOS_POR_REDE: Record<
  RedeDeCreator,
  readonly TipoDePublicacao[]
> = {
  instagram: ["post", "reel", "story"],
  tiktok: ["video"],
  linkedin: ["post"],
};

// TODO(Ana)
export const ROTULO_DO_TIPO: Record<TipoDePublicacao, string> = {
  post: "Post",
  reel: "Reel",
  story: "Story",
  video: "Vídeo",
};

export function ehTipoDePublicacao(valor: unknown): valor is TipoDePublicacao {
  return (
    typeof valor === "string" &&
    (TIPOS_DE_PUBLICACAO as readonly string[]).includes(valor)
  );
}

/** O tipo existe e a rede o admite. */
export function tipoValidoParaRede(
  rede: RedeDeCreator,
  tipo: unknown,
): tipo is TipoDePublicacao {
  return ehTipoDePublicacao(tipo) && TIPOS_POR_REDE[rede].includes(tipo);
}

export { ehRedeDeCreator, ROTULO_DA_REDE };

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

/**
 * Recusas que NAO carregam nada alem do codigo (lote 11k): cada uma tem a sua
 * frase em `MENSAGEM_DO_LINK`. `profile_link`, `share_link_unsupported` e
 * `tiktok_photo_unsupported` existem porque "Link inválido" mandava a pessoa
 * conferir um link que ela copiou certo, e a frase precisa dizer o que colar.
 * `highlight_link` (lote 11l) e o link do DESTAQUE inteiro, que nao e um story
 * so: a frase ensina a abrir o story dentro dele e copiar o link desse.
 */
export type CodigoSimplesDoLink =
  | "invalid_post_url"
  | "short_link_unsupported"
  | "share_link_unsupported"
  | "tiktok_photo_unsupported"
  | "profile_link"
  | "highlight_link";

export type CodigoDeLinkDePublicacao =
  | CodigoSimplesDoLink
  | "post_network_mismatch"
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
 * Resultado da normalizacao. Os dois mismatch carregam o que o link parece
 * ser: sao as recusas em que a pessoa colou um link bom e so errou a escolha,
 * e a tela precisa dizer isso com o nome da rede ou do tipo.
 */
export type ResultadoDoLink =
  | { ok: true; valor: PublicacaoNormalizada }
  | { ok: false; code: CodigoSimplesDoLink }
  | { ok: false; code: "post_network_mismatch"; rede_detectada: RedeDeCreator }
  | { ok: false; code: "post_type_mismatch"; tipo_detectado: TipoDePublicacao };

export type LinkRecusado = Exclude<ResultadoDoLink, { ok: true }>;

// MENSAGENS DA RECUSA, numa fonte so (lote 11k). O servidor as devolve no
// `message` e o client as mostra antes de enviar; ate aqui cada lado tinha a
// sua copia, e a primeira frase nova ja teria de ser escrita duas vezes. As
// duas que levam o nome detectado sao funcoes pelo mesmo motivo.
// TODO(Ana)
export const MENSAGEM_DO_LINK: Record<CodigoSimplesDoLink, string> = {
  invalid_post_url:
    "Link inválido. Cole o link de um post, reel ou story do Instagram, de um vídeo do TikTok, ou de um post do LinkedIn.",
  short_link_unsupported:
    "Esse é um link curto. Abra a publicação no navegador e cole o link da barra de endereço.",
  share_link_unsupported:
    "Esse é um link de compartilhamento. Abra a publicação no navegador e copie o link da barra de endereço.",
  tiktok_photo_unsupported:
    "Por enquanto só vídeos do TikTok contam. Carrossel de fotos fica para depois.",
  profile_link: "Esse é o link do perfil. Cole o link de uma publicação.",
  // TODO(Ana)
  highlight_link:
    "Esse é o link do destaque inteiro. Abra o story dentro do destaque e copie o link dele.",
};

/** Mensagem da rede que nao casa com o link, com o nome da rede detectada. */
export function mensagemDeRedeErrada(redeDetectada: RedeDeCreator): string {
  // TODO(Ana)
  return `Esse link é do ${rotuloDaRede(redeDetectada)}. Troque a rede ou o link.`;
}

/** Mensagem do tipo que nao casa com o link, com o nome do tipo detectado. */
export function mensagemDeTipoErrado(tipoDetectado: TipoDePublicacao): string {
  const rotulo = ROTULO_DO_TIPO[tipoDetectado].toLowerCase();
  // TODO(Ana)
  return `Esse link é de um ${rotulo}. Troque o tipo ou o link.`;
}

/** A frase de qualquer recusa do link, para a tela e para a rota. */
export function mensagemDoLinkRecusado(recusa: LinkRecusado): string {
  if (recusa.code === "post_network_mismatch") {
    return mensagemDeRedeErrada(recusa.rede_detectada);
  }
  if (recusa.code === "post_type_mismatch") {
    return mensagemDeTipoErrado(recusa.tipo_detectado);
  }
  return MENSAGEM_DO_LINK[recusa.code];
}

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
const HOSTS_CURTOS = [
  "vm.tiktok.com",
  "vt.tiktok.com",
  "instagr.am",
  "lnkd.in",
];

// `tiktok.com/t/<codigo>` e a terceira forma de link curto do app do TikTok,
// no host principal: e reconhecida pelo CAMINHO, nao pelo host.
const CAMINHO_CURTO_DO_TIKTOK_RE = /^t\/[A-Za-z0-9]{4,32}$/;

// Shortcode do Instagram. Ele e SENSIVEL A MAIUSCULA, entao o caminho nunca e
// passado por toLowerCase: so o host e os nomes de usuario sao normalizados
// assim.
const CODIGO_DO_INSTAGRAM = "[A-Za-z0-9_-]{5,32}";

// Nome de usuario, UMA CONSTANTE POR REDE (lote 11l). Ate o 11k era uma so,
// `[A-Za-z0-9._]{2,24}`, com o argumento de que as formas eram a mesma. Os
// caracteres sao; o TAMANHO nao: o Instagram aceita de 1 a 30, o TikTok de 2 a
// 24. A constante unica tinha o limite do TikTok e recusava como
// `invalid_post_url` o story de quem tem usuario de 25 a 30 caracteres. Com
// uma so, apertar ou soltar a regra de uma rede muda a outra sem ninguem
// perceber, que foi exatamente o que aconteceu.
//
// Instagram: o trecho opcional antes de `/p/` e `/reel/`, o dono do story em
// `/stories/` e o perfil. TikTok: o `@`.
const USUARIO_DO_INSTAGRAM = "[A-Za-z0-9._]{1,30}";
const USUARIO_DO_TIKTOK = "[A-Za-z0-9._]{2,24}";

// Id numerico do video no TikTok e do story no Instagram. O piso de 5 digitos e
// deliberado: `video/1` nao e id, e um link truncado, e aceitar isso gravaria
// lixo com unique proprio.
const ID_NUMERICO = "[0-9]{5,32}";

const INSTAGRAM_RE = new RegExp(
  `^(?:${USUARIO_DO_INSTAGRAM}/)?(p|reel|reels)/(${CODIGO_DO_INSTAGRAM})$`,
);

// PERFIL (lote 11k): `instagram.com/<usuario>/`, `tiktok.com/@usuario` e
// `linkedin.com/in/<slug>` sao o que a pessoa copia da propria pagina, e a
// recusa diz isso em vez de "link invalido". Um segmento so, e no Instagram
// nao pode ser um dos caminhos que a rede reserva (`p`, `reel`, `s`,
// `stories`, `share`, `explore`, `accounts`), que nunca sao perfil. O `s`
// entrou no 11l: com o usuario de 1 caractere, `instagram.com/s` passaria a
// ser lido como perfil.
const PERFIL_DO_INSTAGRAM_RE = new RegExp(`^${USUARIO_DO_INSTAGRAM}$`);
const COMPARTILHAMENTO_DO_INSTAGRAM_RE = /^share(\/|$)/i;
const CAMINHOS_RESERVADOS_DO_INSTAGRAM = [
  "p",
  "reel",
  "reels",
  "s",
  "stories",
  "share",
  "explore",
  "accounts",
];
const PERFIL_DO_TIKTOK_RE = new RegExp(`^@${USUARIO_DO_TIKTOK}$`);
const PERFIL_DO_LINKEDIN_RE = /^in\/[^/]+$/;

// Story: `instagram.com/stories/<usuario>/<digitos>/`. O usuario e obrigatorio
// (e assim que o Instagram escreve o link), e o id do story sao os digitos.
const STORY_RE = new RegExp(
  `^stories/(${USUARIO_DO_INSTAGRAM})/(${ID_NUMERICO})$`,
);

// STORY ABERTO DE DENTRO DE UM DESTAQUE (lote 11l): o Copiar link do app
// escreve `instagram.com/s/<token>?story_media_id=<mediaId>_<ownerId>&igsh=...`.
// O `<token>` identifica o DESTAQUE; quem identifica o story e o
// `story_media_id`, e o `<mediaId>` dele e o MESMO id do link
// `stories/<usuario>/<id>`. Entao o `external_id` e o `<mediaId>`, e o mesmo
// story colado pelos dois caminhos cai no mesmo unique. O `<ownerId>` (id
// numerico da conta) fica so na canonica, que e o link que abre o story.
//
// `/s/<token>` SEM `story_media_id` e o link do destaque inteiro, e
// `stories/highlights/<id>` tambem: os dois sao `highlight_link`. Destaque e
// uma colecao fixa do perfil, sem data, e registra-lo contaria o mesmo
// destaque todo mes.
const DESTAQUE_DO_INSTAGRAM_RE = /^s\/([A-Za-z0-9_-]+={0,2})$/;
const STORY_MEDIA_ID_RE = new RegExp(`^(${ID_NUMERICO})_([0-9]{1,32})$`);
const STORIES_HIGHLIGHTS_RE = /^stories\/highlights(\/|$)/i;

const TIKTOK_RE = new RegExp(
  `^@(${USUARIO_DO_TIKTOK})/video/(${ID_NUMERICO})$`,
);

// CARROSSEL DE FOTOS DO TIKTOK (lote 11k): `tiktok.com/@u/photo/<id>` tem a
// forma do video com `photo` no lugar. Recusado com codigo proprio, e nao
// aceito: aceitar exige uma contagem nova na funcao SQL do ranking e um peso
// decidido pela Ana, fora deste lote. A frase diz que so video conta hoje.
const FOTO_DO_TIKTOK_RE = new RegExp(
  `^@${USUARIO_DO_TIKTOK}/photo/${ID_NUMERICO}$`,
);

// LINKEDIN (lote 10d; ugcPost e post sem texto no 11k). O LinkedIn escreve o
// link de um post de duas formas: `linkedin.com/posts/<slug>_<texto>-<tipo>-
// <digitos>-<sufixo>` (o botao Copiar link do feed e do app) e
// `linkedin.com/feed/update/urn:li:<tipo>:<digitos>/`. O <tipo> e o espaco de
// id do urn: `ugcPost` e o post ORIGINAL com midia (o mais comum no Copiar
// link do app), `activity` e o texto puro ou o compartilhamento, `share` e a
// forma antiga. Os tres sao espacos DISTINTOS, entao o `external_id` leva o
// tipo junto com os digitos, e a canonica e a forma `feed/update`, que o
// LinkedIn resolve para os tres. No `posts/`, o separador antes do tipo e `-`
// quando ha texto e `_` quando o post nao tem texto (`<slug>_activity-...`).
// Artigo (`/pulse/`), perfil (`/in/`) e pagina de empresa nao sao publicacao.
const ID_DO_LINKEDIN = "[0-9]{10,25}";
const TIPOS_DE_URN_DO_LINKEDIN = ["activity", "share", "ugcPost"] as const;
const LINKEDIN_POSTS_RE = new RegExp(
  `^posts/[^/]+[_-](${TIPOS_DE_URN_DO_LINKEDIN.join("|")})-(${ID_DO_LINKEDIN})-[A-Za-z0-9_-]+$`,
);
const LINKEDIN_URN_RE = new RegExp(
  `^feed/update/urn:li:(${TIPOS_DE_URN_DO_LINKEDIN.join("|")}):(${ID_DO_LINKEDIN})$`,
);

/**
 * Host e caminho de uma URL colada, sem protocolo e sem hash, e a query a
 * parte. O caminho NUNCA leva a query: `?igshid=`, `?is_from_webapp=1`,
 * `?utm_source=share` e afins sao rastreamento da rede, nao identidade da
 * publicacao. A query so e lida onde ela E a identidade (o `story_media_id` do
 * story aberto de um destaque, lote 11l), e ali e lido um parametro, pelo nome.
 */
function partesDaUrl(
  valor: string,
): { host: string; caminho: string; query: string } | null {
  let resto = valor.trim();
  if (resto === "") return null;
  resto = resto.replace(/^https?:\/\//i, "");
  resto = resto.split("#")[0];
  const interrogacao = resto.indexOf("?");
  const query = interrogacao === -1 ? "" : resto.slice(interrogacao + 1);
  if (interrogacao !== -1) resto = resto.slice(0, interrogacao);
  const barra = resto.indexOf("/");
  const host = (barra === -1 ? resto : resto.slice(0, barra)).toLowerCase();
  const caminho = barra === -1 ? "" : resto.slice(barra + 1);
  if (host === "") return null;
  return {
    host: host.replace(/^www\./, ""),
    caminho: caminho.replace(/\/+$/, ""),
    query,
  };
}

// FORMA DO LINK RECUSADO (lote 11l): o que o servidor registra em log a cada
// recusa, para medir QUAIS formatos os creators colam e a regra nao aceita.
// Cada segmento do caminho vira o seu TIPO, e so as palavras que as redes
// reservam (`p`, `stories`, `video`...) ficam escritas: usuario, id, token e
// texto de slug nunca saem daqui, nem a query. Um segmento sai literal SO se
// estiver na lista; qualquer outro vira um marcador, entao o que nao foi
// previsto cai no generico e nao vaza.
const SEGMENTOS_LITERAIS = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "s",
  "stories",
  "highlights",
  "share",
  "explore",
  "accounts",
  "t",
  "video",
  "photo",
  "posts",
  "feed",
  "update",
  "in",
  "pulse",
  "company",
]);

// O marcador de um segmento que nao e literal depende do literal que o
// antecede: `stories/<usuario>`, `p/<codigo>`, `s/<token>`, `posts/<slug>`.
const MARCADOR_DEPOIS_DE: Record<string, string> = {
  stories: "<usuario>",
  p: "<codigo>",
  reel: "<codigo>",
  reels: "<codigo>",
  tv: "<codigo>",
  s: "<token>",
  share: "<token>",
  t: "<token>",
  posts: "<slug>",
  in: "<slug>",
  pulse: "<slug>",
  company: "<slug>",
};

// Mais do que isso nao e link de publicacao de rede nenhuma, e a linha de log
// nao precisa crescer com o que a pessoa colou.
const TETO_DE_SEGMENTOS = 6;

const HOST_RE = /^[a-z0-9.-]{1,253}$/;

function tipoDoSegmento(segmento: string, anterior: string | null): string {
  const minusculo = segmento.toLowerCase();
  if (SEGMENTOS_LITERAIS.has(minusculo)) return minusculo;
  if (/^[0-9]+$/.test(segmento)) return "<num>";
  if (segmento.startsWith("@")) return "@<usuario>";
  if (minusculo.startsWith("urn:")) return "<urn>";
  return (anterior && MARCADOR_DEPOIS_DE[anterior]) ?? "<texto>";
}

/**
 * Host e forma do caminho de um link, sem nada que identifique a pessoa ou a
 * publicacao. Host que nao tem cara de host (texto solto colado no campo) vira
 * `<invalido>`, pelo mesmo motivo.
 */
export function formaDoLinkRecusado(valor: unknown): {
  host: string;
  forma: string;
} {
  if (typeof valor !== "string")
    return { host: "<nenhum>", forma: "<nenhuma>" };
  const partes = partesDaUrl(valor);
  if (!partes) return { host: "<nenhum>", forma: "<nenhuma>" };
  const segmentos = partes.caminho.split("/").filter((s) => s !== "");
  const tipos: string[] = [];
  let anterior: string | null = null;
  for (const segmento of segmentos.slice(0, TETO_DE_SEGMENTOS)) {
    const tipo = tipoDoSegmento(segmento, anterior);
    tipos.push(tipo);
    anterior = SEGMENTOS_LITERAIS.has(tipo) ? tipo : null;
  }
  if (segmentos.length > TETO_DE_SEGMENTOS) tipos.push("...");
  return {
    host: HOST_RE.test(partes.host) ? partes.host : "<invalido>",
    forma: tipos.length === 0 ? "<raiz>" : tipos.join("/"),
  };
}

function publicacaoDoLinkedin(
  tipoDoUrn: string,
  id: string,
): PublicacaoNormalizada {
  return {
    network: "linkedin",
    kind: "post",
    external_id: `${tipoDoUrn}:${id}`,
    url: `https://www.linkedin.com/feed/update/urn:li:${tipoDoUrn}:${id}/`,
  };
}

/**
 * O que o link parece ser, sem olhar a rede nem o tipo escolhidos. E a leitura
 * que vira `rede_detectada` e `tipo_detectado` nos mismatch; quem grava usa
 * `normalizarLinkDePublicacao`.
 */
function detectarPublicacao(
  valor: unknown,
):
  | { ok: true; valor: PublicacaoNormalizada }
  | { ok: false; code: CodigoSimplesDoLink } {
  if (typeof valor !== "string") return { ok: false, code: "invalid_post_url" };

  const partes = partesDaUrl(valor);
  if (!partes) return { ok: false, code: "invalid_post_url" };
  const { host, caminho, query } = partes;

  if (HOSTS_CURTOS.includes(host)) {
    return { ok: false, code: "short_link_unsupported" };
  }

  if (host === "instagram.com") {
    // LINK DE COMPARTILHAMENTO (lote 11k): `instagram.com/share/reel/<token>`,
    // `share/p/<token>` e `share/<token>` sao o que o botao Compartilhar do
    // app escreve. O token NAO e o shortcode: e um redirecionamento, e sem
    // esta recusa `INSTAGRAM_RE` engolia `share` como usuario e gravava o
    // token como id de post, apontando para lugar nenhum. Recusado ANTES de
    // qualquer outra leitura; o servidor tenta resolver
    // (server/lib/instagramShareLink.ts).
    if (COMPARTILHAMENTO_DO_INSTAGRAM_RE.test(caminho)) {
      return { ok: false, code: "share_link_unsupported" };
    }
    // `stories/highlights/<id>/` tem a forma de story com usuario
    // "highlights", e nao e: e o destaque inteiro. Lido ANTES de `STORY_RE`,
    // que o engoliria.
    if (STORIES_HIGHLIGHTS_RE.test(caminho)) {
      return { ok: false, code: "highlight_link" };
    }
    const destaque = DESTAQUE_DO_INSTAGRAM_RE.exec(caminho);
    if (destaque) {
      const midia = STORY_MEDIA_ID_RE.exec(
        new URLSearchParams(query).get("story_media_id") ?? "",
      );
      if (!midia) return { ok: false, code: "highlight_link" };
      const token = destaque[1];
      const mediaId = midia[1];
      const ownerId = midia[2];
      return {
        ok: true,
        valor: {
          network: "instagram",
          kind: "story",
          external_id: mediaId,
          url: `https://www.instagram.com/s/${token}?story_media_id=${mediaId}_${ownerId}`,
        },
      };
    }
    const story = STORY_RE.exec(caminho);
    if (story) {
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
    if (!m) {
      return {
        ok: false,
        code:
          PERFIL_DO_INSTAGRAM_RE.test(caminho) &&
          !CAMINHOS_RESERVADOS_DO_INSTAGRAM.includes(caminho.toLowerCase())
            ? "profile_link"
            : "invalid_post_url",
      };
    }
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
    if (!m) {
      if (FOTO_DO_TIKTOK_RE.test(caminho)) {
        return { ok: false, code: "tiktok_photo_unsupported" };
      }
      return {
        ok: false,
        code: PERFIL_DO_TIKTOK_RE.test(caminho)
          ? "profile_link"
          : "invalid_post_url",
      };
    }
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

  if (host === "linkedin.com") {
    const doFeed = LINKEDIN_POSTS_RE.exec(caminho);
    if (doFeed)
      return { ok: true, valor: publicacaoDoLinkedin(doFeed[1], doFeed[2]) };
    const urn = LINKEDIN_URN_RE.exec(caminho);
    if (urn) return { ok: true, valor: publicacaoDoLinkedin(urn[1], urn[2]) };
    return {
      ok: false,
      code: PERFIL_DO_LINKEDIN_RE.test(caminho)
        ? "profile_link"
        : "invalid_post_url",
    };
  }

  return { ok: false, code: "invalid_post_url" };
}

/**
 * Link de publicacao normalizado para a REDE e o TIPO escolhidos, ou o codigo
 * do erro.
 *
 * Aceita com e sem `https://`, com e sem `www.`, com query string e com barra
 * final. Perfil (`instagram.com/ana.cria/`) NAO e publicacao: e `profile_link`
 * (lote 11k; antes era o `invalid_post_url` generico), porque registrar um
 * perfil como publicacao encheria o ranking de nada.
 *
 * A ordem das recusas e deliberada: link curto e link invalido vem ANTES da
 * rede e do tipo, porque nesses casos nao ha o que comparar; a rede vem antes
 * do tipo, porque com a rede errada o tipo nem faz sentido ("story" num link
 * do TikTok e erro de rede, nao de tipo).
 */
export function normalizarLinkDePublicacao(
  valor: unknown,
  rede: RedeDeCreator,
  tipo: TipoDePublicacao,
): ResultadoDoLink {
  const lido = detectarPublicacao(valor);
  if (!lido.ok) return lido;
  if (lido.valor.network !== rede) {
    return {
      ok: false,
      code: "post_network_mismatch",
      rede_detectada: lido.valor.network,
    };
  }
  if (lido.valor.kind !== tipo) {
    return {
      ok: false,
      code: "post_type_mismatch",
      tipo_detectado: lido.valor.kind,
    };
  }
  return lido;
}
