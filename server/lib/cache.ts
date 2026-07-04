import { cacheConnection } from "./redis";

// Cache de conteudo PUBLICO sobre a cacheConnection (fail-fast, Fase 1).
// Contrato:
//  - Fail-open integral: Redis fora ou qualquer erro de cache = comportamento
//    identico ao de hoje (compute roda e bate no banco). Falha de cache NUNCA
//    vira erro de rota.
//  - So cacheia sucesso: excecao do compute propaga sem cachear, e retorno
//    null/undefined (ex.: not found) tambem NAO e cacheado. Cachear erro
//    seria state collapse: um erro viraria "conteudo" por ate 1 TTL.
//  - Sem lock anti-stampede DE PROPOSITO: no nosso volume, TTL curto +
//    fail-open bastam; um estouro de misses simultaneos apenas repete a query
//    do banco, que e exatamente o comportamento atual sem cache.

const MAX_VALUE_BYTES = 512 * 1024;

// Chave: "pubcache:" + nome da rota + params normalizados (ordenados por
// nome; vazios/ausentes ficam fora pra "sem filtro" e "filtro vazio" baterem
// na mesma chave).
export function cacheKey(
  route: string,
  params: Record<string, unknown> = {},
): string {
  const parts = Object.keys(params)
    .sort()
    .filter((k) => {
      const v = params[k];
      return v !== undefined && v !== null && v !== "";
    })
    .map((k) => `${k}=${String(params[k])}`);
  return `pubcache:${route}${parts.length > 0 ? `:${parts.join("&")}` : ""}`;
}

export async function getOrCompute<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  opts?: { bypass?: boolean },
): Promise<T> {
  const usable = !opts?.bypass && cacheConnection !== null;

  if (usable) {
    try {
      const hit = await cacheConnection!.get(key);
      if (hit !== null) {
        return JSON.parse(hit) as T;
      }
    } catch {
      // fail-open: segue pro compute
    }
  }

  const value = await compute();

  if (usable && value !== null && value !== undefined) {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_VALUE_BYTES) {
      console.debug(`[pubcache] ${key}: valor acima de 512KB, nao cacheado`);
    } else {
      // fire-and-forget: falha de SET nao propaga nem atrasa a resposta
      cacheConnection!.set(key, serialized, "EX", ttlSeconds).catch((err) => {
        console.debug(`[pubcache] ${key}: SET falhou`, err?.message ?? err);
      });
    }
  }

  return value;
}
