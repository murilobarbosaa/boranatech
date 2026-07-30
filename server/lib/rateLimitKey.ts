// Identidade usada para CONTAR cota de rate limit (ver server/app.ts). Extraido
// para ser testavel isolado, sem subir o app inteiro, no mesmo molde de
// rateLimitExempt.ts.
//
// O PROBLEMA QUE ISTO RESOLVE, medido em producao. O limiter contava por
// `req.ip`, e IP nao e identidade: em NAT de operadora movel, rede corporativa
// ou escola, dezenas de pessoas dividem o MESMO IP e portanto o MESMO balde de
// 180 requisicoes por minuto. Quando o balde estoura, todo mundo daquele IP leva
// 429 junto. O Sentry registrou 28 de 29 `profile_fetch_exhausted` como HTTP 429
// em `GET /api/me`, espalhados por 6 cidades distintas: gente navegando normal,
// sem perfil no fim de 3 tentativas (0s, 3s, 12s).
//
// A base ja conhecia o padrao: `rateLimitExempt.ts` isentou `/api/stats/` com o
// comentario "em IP compartilhado o rate limit geral devolvia 429 e o contador
// sumia pra todos daquele IP". Aquela rota deu para isentar porque e publica,
// read-only e servida de memoria. `/api/me` nao: e autenticada e le o banco a
// cada chamada, entao isentar trocaria um problema de disponibilidade por um de
// custo, sem teto nenhum.
//
// A CORRECAO e contar por QUEM CHAMA, e nao de onde. Requisicao autenticada
// carrega uma identidade melhor que o IP: o `sub` do proprio token.

/**
 * `sub` do JWT, lido SEM verificar assinatura.
 *
 * Isto e deliberado e seguro NESTE uso, porque o valor nao autoriza nada: ele so
 * escolhe em qual balde a requisicao conta. Quem decide se a sessao vale continua
 * sendo o `requireAuth`, depois, com verificacao de verdade. Um `sub` forjado nao
 * abre porta nenhuma; no maximo escolhe o proprio balde, que e onde ele ja
 * estaria se fosse legitimo.
 *
 * O que um `sub` forjado PODE fazer e escapar da cota gerando um balde novo a
 * cada requisicao, e e por isso que o teto por IP continua existindo em
 * `server/app.ts` para requisicao autenticada. Sem esse segundo teto, esta
 * funcao sozinha seria um buraco.
 *
 * Devolve null para qualquer coisa que nao seja um JWT com `sub` string
 * nao-vazia. Nunca lanca: header torto e caso esperado, nao excecao.
 */
export function subDoBearer(authorization: string | undefined | null): string | null {
  if (typeof authorization !== "string") return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  if (!match) return null;
  const partes = match[1].split(".");
  if (partes.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(partes[1], "base64url").toString("utf8"),
    ) as unknown;
    if (!payload || typeof payload !== "object") return null;
    const sub = (payload as { sub?: unknown }).sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    // Base64 invalido, JSON invalido, payload que nao e objeto: tudo cai aqui e
    // vira "sem identidade", que degrada para contagem por IP.
    return null;
  }
}

export interface IdentidadeDeCota {
  /** Chave do balde de cota justa. */
  chave: string;
  /**
   * A chave veio de um token (identidade propria) ou do IP (compartilhado)?
   *
   * `server/app.ts` usa isto para decidir se aplica TAMBEM o teto por IP: sem
   * token o IP ja e a chave principal e checar duas vezes seria contar o mesmo
   * balde duas vezes.
   */
  porUsuario: boolean;
}

/**
 * Em qual balde esta requisicao conta.
 *
 * Prefixos (`u:` e `ip:`) existem para que um `sub` nunca colida com um IP no
 * mesmo espaco de chaves do Redis. Sem eles, um `sub` que por acaso fosse igual
 * a um IP dividiria balde com ele.
 */
export function identidadeDeCota(
  authorization: string | undefined | null,
  ip: string | undefined | null,
): IdentidadeDeCota {
  const sub = subDoBearer(authorization);
  if (sub !== null) return { chave: `u:${sub}`, porUsuario: true };
  return { chave: `ip:${ip || "unknown"}`, porUsuario: false };
}

/** Chave do teto por IP, aplicada por cima da cota do usuario. */
export function chaveDeIp(ip: string | undefined | null): string {
  return `ip:${ip || "unknown"}`;
}

/**
 * Multiplicador do teto por IP para requisicao AUTENTICADA.
 *
 * O numero responde "quantas pessoas atras do mesmo NAT a gente aceita servir
 * em paralelo antes de considerar flood". Com 180/min por pessoa e fator 6, um
 * IP compartilhado sustenta 1080 requisicoes por minuto, ou seja, 6 pessoas
 * navegando no limite da cota individual, ou muito mais gente em uso normal (a
 * navegacao real fica MUITO abaixo de 180/min por pessoa: os 429 medidos vinham
 * da SOMA de varias pessoas, nao de alguem sozinho estourando).
 *
 * Nao e um numero medido, e um teto de seguranca escolhido para ser generoso o
 * bastante para NAT domestico e de operadora, e apertado o bastante para que
 * `sub` forjado em serie ainda esbarre em alguma coisa. Se aparecer 429 com
 * `escopo=ip` no log, e este numero que precisa subir, e ai sera com dado.
 */
export const FATOR_TETO_IP = 6;
