import type { CreatorKind } from "./creatorKind";
import { isCreatorKind } from "./creatorKind";
import { cacheConnection } from "./redis";

// Cache do status de Creator por usuario, TTL curto, no MESMO mecanismo do
// cache de Pro (server/lib/proStatusCache.ts): Redis, 60s, leitura com teto de
// latencia. Chave propria, `creator_status:<userId>`, guardando o kind ou
// "none" (nao e creator).
//
// A diferenca para o cache de Pro e que aqui a leitura distingue TRES estados
// e nao dois: "hit", "miss" e "indisponivel". O Pro trata miss e erro do mesmo
// jeito (recalcula e grava); aqui erro de Redis recalcula e NAO grava, porque
// um Redis que acabou de falhar na leitura nao e confiavel para a escrita, e o
// valor que ficaria la seria o de um instante em que o cache nao respondia.
// Nenhum dos tres estados vira "nao e creator": quem decide isso e o banco.

const CREATOR_STATUS_TTL_SECONDS = 60;

// Teto de latencia da LEITURA, igual ao do Pro. A cacheConnection ja falha
// rapido sozinha; o race e cinto de seguranca redundante.
const CACHE_READ_TIMEOUT_MS = 1000;

const CACHE_READ_TIMEOUT = Symbol("creator-status-cache-read-timeout");

/** O que o cache guarda: o kind da concessao ativa, ou "none". */
export type CreatorStatusCacheado = CreatorKind | "none";

export type LeituraCreatorStatus =
  | { estado: "hit"; valor: CreatorStatusCacheado }
  | { estado: "miss" }
  | { estado: "indisponivel" };

function creatorStatusKey(userId: string) {
  return `creator_status:${userId}`;
}

export async function getCachedCreatorStatus(
  userId: string,
): Promise<LeituraCreatorStatus> {
  if (!cacheConnection) {
    return { estado: "indisponivel" };
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const cached = await Promise.race([
      cacheConnection.get(creatorStatusKey(userId)),
      new Promise<typeof CACHE_READ_TIMEOUT>((resolve) => {
        timer = setTimeout(
          () => resolve(CACHE_READ_TIMEOUT),
          CACHE_READ_TIMEOUT_MS,
        );
      }),
    ]);
    if (cached === CACHE_READ_TIMEOUT) {
      return { estado: "indisponivel" };
    }
    if (cached === "none" || isCreatorKind(cached)) {
      return { estado: "hit", valor: cached };
    }
    // Ausente, ou um valor que este codigo nao conhece (um kind novo gravado
    // por um deploy mais recente): recalcula no banco e sobrescreve.
    return { estado: "miss" };
  } catch {
    return { estado: "indisponivel" };
  } finally {
    clearTimeout(timer);
  }
}

// Falha de Redis na escrita e ignorada: o valor ja foi calculado pelo banco, o
// cache so nao e populado desta vez.
export async function setCachedCreatorStatus(
  userId: string,
  valor: CreatorStatusCacheado,
): Promise<void> {
  if (!cacheConnection) {
    return;
  }
  try {
    await cacheConnection.set(
      creatorStatusKey(userId),
      valor,
      "EX",
      CREATOR_STATUS_TTL_SECONDS,
    );
  } catch {
    // ignora: cache e otimizacao, nao autoridade
  }
}

// Chamar sempre que a concessao mudar (conceder e revogar, em admin.ts). Seguro
// com Redis nulo; na pior hipotese o valor antigo expira pelo TTL.
export async function invalidateCreatorStatusCache(
  userId: string,
): Promise<void> {
  if (!cacheConnection) {
    return;
  }
  try {
    await cacheConnection.del(creatorStatusKey(userId));
  } catch {
    // ignora: na pior hipotese o valor antigo expira pelo TTL
  }
}
