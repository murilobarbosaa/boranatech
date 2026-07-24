// Rotas isentas do rate limiter geral (ver server/app.ts). Publicas, read-only e
// baratas, ou webhooks externos que nao podem levar 429. Extraido do app.ts para
// ser testavel isolado, sem subir o app inteiro (env, redis, supabase, routers).
export function isRateLimitExempt(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname === "/api/health/live" ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname.startsWith("/api/resend/webhook") ||
    // Contador publico da home (stats/users-count): GET read-only e barato
    // (last-known-good em memoria, sem escrita). Em IP compartilhado (NAT de
    // operadora movel, redes corporativas/escolares) o rate limit geral devolvia
    // 429 e o contador sumia pra todos daquele IP. Isento por ser publico e leve.
    pathname.startsWith("/api/stats/")
  );
}
