import { cacheConnection } from "./redis";

// Cache de status Pro/admin por usuario, TTL curto. Objetivo: evitar 2 RPCs ao
// Supabase (is_user_pro + is_user_admin) em todo request protegido. O valor e o
// booleano combinado (pro OU admin), que e exatamente o que vira req.isPro.
// Tres estados: "1" (Pro), "0" (nao Pro), ausencia/erro (nao sei).
// REGRA DE SEGURANCA: em ausencia, Redis nulo ou qualquer erro, NUNCA chutamos um
// valor. Retornamos null e o chamador recalcula via RPC (fonte de verdade). Isso
// preserva o comportamento atual quando o Redis cai e evita fail-open (liberar Pro
// indevidamente). O cache so guarda um true que a RPC ja produziu; nunca inventa.

const PRO_STATUS_TTL_SECONDS = 60;

// Teto de latencia da LEITURA do cache. Com a cacheConnection (offline queue
// desligada, commandTimeout 1000) o GET ja falha rapido sozinho; o Promise.race
// abaixo fica como cinto de seguranca redundante.
const CACHE_READ_TIMEOUT_MS = 1000;

// Sentinel tipado pro ramo de timeout do Promise.race. Symbol pra nunca colidir
// com os valores possiveis do GET ("1" / "0" / null).
const CACHE_READ_TIMEOUT = Symbol("pro-status-cache-read-timeout");

function proStatusKey(userId: string) {
  return `pro_status:${userId}`;
}

// Retorna true/false se houver cache valido, ou null para "nao sei" (miss, Redis
// ausente ou erro). null = o chamador deve recalcular via RPC.
export async function getCachedProStatus(
  userId: string,
): Promise<boolean | null> {
  if (!cacheConnection) {
    return null;
  }
  // Se o GET rejeitar (fail-fast da cacheConnection) ou estourar o race,
  // retornamos null e o chamador cai pro RPC (fonte de verdade), nunca chuta Pro.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const cached = await Promise.race([
      cacheConnection.get(proStatusKey(userId)),
      new Promise<typeof CACHE_READ_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(CACHE_READ_TIMEOUT), CACHE_READ_TIMEOUT_MS);
      }),
    ]);
    if (cached === CACHE_READ_TIMEOUT) {
      return null;
    }
    if (cached === "1") {
      return true;
    }
    if (cached === "0") {
      return false;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Grava o status combinado com TTL curto. Falha de Redis e ignorada: o valor ja
// foi calculado corretamente pelo chamador, o cache so nao e populado desta vez.
export async function setCachedProStatus(
  userId: string,
  isPro: boolean,
): Promise<void> {
  if (!cacheConnection) {
    return;
  }
  try {
    await cacheConnection.set(
      proStatusKey(userId),
      isPro ? "1" : "0",
      "EX",
      PRO_STATUS_TTL_SECONDS,
    );
  } catch {
    // ignora: cache e otimizacao, nao autoridade
  }
}

// Invalida o cache de um usuario. Chamar sempre que o status Pro mudar. Seguro com
// Redis nulo. Definida agora; sera usada pelo card 3b em billing.ts e cron.ts.
export async function invalidateProStatusCache(userId: string): Promise<void> {
  if (!cacheConnection) {
    return;
  }
  try {
    await cacheConnection.del(proStatusKey(userId));
  } catch {
    // ignora: na pior hipotese o valor antigo expira pelo TTL
  }
}
