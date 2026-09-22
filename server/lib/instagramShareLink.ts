import {
  normalizarLinkDePublicacao,
  type ResultadoDoLink,
  type TipoDePublicacao,
} from "../../shared/creatorPost";

// LINK DE COMPARTILHAMENTO DO INSTAGRAM (lote 11k): o botao Compartilhar do
// app escreve `instagram.com/share/reel/<token>` ou `share/p/<token>`, e e
// esse o link que o creator cola. O token e um redirecionamento, nao o
// shortcode, entao o shared o recusa (`share_link_unsupported`) e o servidor
// tenta chegar na publicacao, no MESMO desenho do resolvedor de link curto do
// TikTok (server/lib/tiktokShortLink.ts), com as mesmas quatro protecoes:
//   1. host de SAIDA fixo (`instagram.com`, `www.instagram.com`) e caminho
//      `share/`: o usuario escolhe o token, nunca o destino;
//   2. `redirect: "manual"`: a `location` e lida, conferida contra a lista de
//      hosts do Instagram e so entao, no maximo UMA vez mais, aberta;
//   3. `HEAD`, e nada da resposta alem do status e da `location` e usado;
//   4. 4 s de limite, e a `location` final so serve se o shared a aceitar
//      como publicacao do Instagram do TIPO escolhido.
//
// O Instagram pode responder 200 com a pagina de login em vez de 30x (e o
// provavel para um robo sem cookie): ai e `share_link_unresolved`, e a pessoa
// cola o link da barra de endereco. Recusar e barato; adivinhar nao e.

const HOSTS_DO_INSTAGRAM = ["instagram.com", "www.instagram.com"];

const CAMINHO_DE_COMPARTILHAMENTO_RE = /^\/share(\/|$)/i;

const STATUS_DE_REDIRECIONAMENTO = [301, 302, 307, 308];

const TEMPO_LIMITE_MS = 4000;

// O mesmo UA de desktop do resolvedor do TikTok: generico, sem plataforma.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0";

const NAO_RESOLVIDO = {
  ok: false,
  code: "share_link_unresolved",
} as const;

/** Resolvido, publicacao de outro tipo, ou nao resolvido. */
export type ResultadoDoCompartilhamento =
  | Extract<ResultadoDoLink, { ok: true }>
  | Extract<ResultadoDoLink, { code: "post_type_mismatch" }>
  | typeof NAO_RESOLVIDO;

/** URL absoluta a partir do que foi colado (com ou sem protocolo), ou null. */
function urlColada(valor: unknown): URL | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (texto === "") return null;
  try {
    return new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }
}

/** So `instagram.com/share/...`. `instagr.am` e afins: nao. */
export function ehLinkDeCompartilhamentoDoInstagram(valor: unknown): boolean {
  const url = urlColada(valor);
  if (!url) return false;
  if (!HOSTS_DO_INSTAGRAM.includes(url.hostname.toLowerCase())) return false;
  return CAMINHO_DE_COMPARTILHAMENTO_RE.test(url.pathname);
}

/**
 * Resolve o link de compartilhamento ate a publicacao do TIPO escolhido, ou
 * `share_link_unresolved`. Quando o destino e uma publicacao do Instagram de
 * OUTRO tipo, devolve o `post_type_mismatch` do shared, que e mais util que
 * "nao resolvido": o link e bom e so a escolha esta errada. No maximo DOIS
 * saltos, ambos para hosts do Instagram; qualquer outra coisa (host de fora,
 * status que nao e redirecionamento, `location` ausente ou que nao e
 * publicacao, timeout, erro de rede) e recusa, sem tentar de novo.
 */
export async function resolverLinkDeCompartilhamentoDoInstagram(
  valor: unknown,
  tipo: TipoDePublicacao,
): Promise<ResultadoDoCompartilhamento> {
  if (!ehLinkDeCompartilhamentoDoInstagram(valor)) return NAO_RESOLVIDO;
  let atual = urlColada(valor);
  if (!atual) return NAO_RESOLVIDO;

  for (let salto = 0; salto < 2; salto += 1) {
    let resposta: Response;
    try {
      resposta = await fetch(atual, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        headers: { "user-agent": USER_AGENT },
      });
    } catch {
      return NAO_RESOLVIDO;
    }
    if (!STATUS_DE_REDIRECIONAMENTO.includes(resposta.status)) {
      return NAO_RESOLVIDO;
    }
    const location = resposta.headers.get("location");
    if (!location) return NAO_RESOLVIDO;

    let destino: URL;
    try {
      destino = new URL(location, atual);
    } catch {
      return NAO_RESOLVIDO;
    }
    if (!HOSTS_DO_INSTAGRAM.includes(destino.hostname.toLowerCase())) {
      return NAO_RESOLVIDO;
    }

    const lido = normalizarLinkDePublicacao(
      destino.toString(),
      "instagram",
      tipo,
    );
    if (lido.ok) return lido;
    if (lido.code === "post_type_mismatch") return lido;
    // Ainda nao e a publicacao (um intermediario do proprio Instagram): mais
    // um salto, e so mais um.
    atual = destino;
  }
  return NAO_RESOLVIDO;
}
