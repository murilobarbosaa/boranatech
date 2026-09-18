import {
  normalizarLinkDePublicacao,
  type PublicacaoNormalizada,
} from "../../shared/creatorPost";
import type { Resultado } from "../../shared/creatorProfile";

// LINK CURTO DO TIKTOK (lote 10c): o app do TikTok compartilha `vm.tiktok.com/
// <codigo>`, `vt.tiktok.com/<codigo>` ou `tiktok.com/t/<codigo>`, e e esse o
// link que o creator cola. O lote 09 recusava com `short_link_unsupported`;
// agora o servidor resolve o redirecionamento e registra a forma canonica.
//
// POR QUE ISTO NAO E O SSRF QUE O LOTE 09 EVITOU. O risco do lote 09 era "o
// servidor abre uma URL que o usuario escolheu": qualquer host, qualquer
// caminho, e o corpo da resposta voltando para o processo. Aqui:
//   1. o host de SAIDA vem de uma lista fixa (`HOSTS_CURTOS_DO_TIKTOK`);
//      qualquer outro host nem e tentado, e o usuario nao escolhe o destino,
//      so o codigo do link;
//   2. o redirecionamento NAO e seguido pelo fetch (`redirect: "manual"`): a
//      `location` e lida, conferida contra a mesma lista de hosts do TikTok, e
//      so entao, no maximo UMA vez mais, aberta;
//   3. nada da resposta alem do status e do header `location` e usado, e o
//      pedido e `HEAD`, entao nao ha corpo para ler;
//   4. o tempo e limitado (4 s) e a `location` final so serve se
//      `normalizarLinkDePublicacao` a aceitar como video do TikTok.
// O que sobra e uma requisicao HEAD para um host do TikTok, com um codigo que
// a pessoa colou, que e o que o navegador dela faria ao abrir o link.
//
// O USER-AGENT DE NAVEGADOR DESKTOP e deliberado: com UA de celular (ou sem
// UA) o TikTok redireciona para `m.tiktok.com/v/<id>.html`, sem o @ do
// usuario, e essa forma nao e a canonica nem a que o unique da tabela
// reconhece. Com UA desktop a `location` e `www.tiktok.com/@usuario/video/<id>`.

/** Hosts que o app do TikTok usa para o link compartilhado. */
const HOSTS_CURTOS_DO_TIKTOK = ["vm.tiktok.com", "vt.tiktok.com"];

/** Hosts para os quais um redirecionamento pode ser seguido. Lista FECHADA. */
const HOSTS_DO_TIKTOK = [
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  ...HOSTS_CURTOS_DO_TIKTOK,
];

const CODIGO_CURTO_RE = /^[A-Za-z0-9]{4,32}$/;

const STATUS_DE_REDIRECIONAMENTO = [301, 302, 307, 308];

const TEMPO_LIMITE_MS = 4000;

// Firefox de desktop, generico: nada aqui identifica a plataforma, e o TikTok
// so olha se e desktop ou celular.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0";

const NAO_RESOLVIDO = {
  ok: false,
  code: "short_link_unresolved",
} as const;

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

/** So `vm.`, `vt.` e `tiktok.com/t/<codigo>`. `instagr.am` e afins: nao. */
export function ehLinkCurtoDoTikTok(valor: unknown): boolean {
  const url = urlColada(valor);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  if (HOSTS_CURTOS_DO_TIKTOK.includes(host)) return true;
  if (host !== "tiktok.com" && host !== "www.tiktok.com") return false;
  const m = /^\/t\/([^/]+)\/?$/.exec(url.pathname);
  return m !== null && CODIGO_CURTO_RE.test(m[1]);
}

/**
 * Resolve o link curto ate a forma canonica do video, ou
 * `short_link_unresolved`. No maximo DOIS saltos, ambos para hosts da lista;
 * qualquer coisa fora disso (host de fora, status que nao e redirecionamento,
 * `location` ausente ou que nao e video, timeout, erro de rede) e recusa, sem
 * tentar de novo. Recusar e barato: a pessoa cola o link completo.
 */
export async function resolverLinkCurtoDoTikTok(
  valor: unknown,
): Promise<Resultado<PublicacaoNormalizada, "short_link_unresolved">> {
  if (!ehLinkCurtoDoTikTok(valor)) return NAO_RESOLVIDO;
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
    if (!HOSTS_DO_TIKTOK.includes(destino.hostname.toLowerCase())) {
      return NAO_RESOLVIDO;
    }

    const lido = normalizarLinkDePublicacao(destino.toString(), "video");
    if (lido.ok) return lido;
    // Ainda nao e a forma final (ex.: `tiktok.com/t/` mandando para `vm.`, ou
    // um intermediario do proprio TikTok): mais um salto, e so mais um.
    atual = destino;
  }
  return NAO_RESOLVIDO;
}
