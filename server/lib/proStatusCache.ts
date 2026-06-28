import { redisConnection } from "./queue";

// Cache de status Pro/admin por usuario, TTL curto. Objetivo: evitar 2 RPCs ao
// Supabase (is_user_pro + is_user_admin) em todo request protegido. O valor e o
// booleano combinado (pro OU admin), que e exatamente o que vira req.isPro.
// Tres estados: "1" (Pro), "0" (nao Pro), ausencia/erro (nao sei).
// REGRA DE SEGURANCA: em ausencia, Redis nulo ou qualquer erro, NUNCA chutamos um
// valor. Retornamos null e o chamador recalcula via RPC (fonte de verdade). Isso
// preserva o comportamento atual quando o Redis cai e evita fail-open (liberar Pro
// indevidamente). O cache so guarda um true que a RPC ja produziu; nunca inventa.

const PRO_STATUS_TTL_SECONDS = 60;

function proStatusKey(userId: string) {
  return `pro_status:${userId}`;
}

// Retorna true/false se houver cache valido, ou null para "nao sei" (miss, Redis
// ausente ou erro). null = o chamador deve recalcular via RPC.
export async function getCachedProStatus(
  userId: string,
): Promise<boolean | null> {
  if (!redisConnection) {
    return null;
  }
  try {
    const cached = await redisConnection.get(proStatusKey(userId));
    if (cached === "1") {
      return true;
    }
    if (cached === "0") {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

// Grava o status combinado com TTL curto. Falha de Redis e ignorada: o valor ja
// foi calculado corretamente pelo chamador, o cache so nao e populado desta vez.
export async function setCachedProStatus(
  userId: string,
  isPro: boolean,
): Promise<void> {
  if (!redisConnection) {
    return;
  }
  try {
    await redisConnection.set(
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
  if (!redisConnection) {
    return;
  }
  try {
    await redisConnection.del(proStatusKey(userId));
  } catch {
    // ignora: na pior hipotese o valor antigo expira pelo TTL
  }
}
