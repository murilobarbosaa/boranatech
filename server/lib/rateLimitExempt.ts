// Rotas isentas do rate limiter geral (ver server/app.ts). Publicas, read-only e
// baratas, ou webhooks externos que nao podem levar 429. Extraido do app.ts para
// ser testavel isolado, sem subir o app inteiro (env, redis, supabase, routers).
export function isRateLimitExempt(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname === "/api/health/live" ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname.startsWith("/api/resend/webhook") ||
    // Webhook do Asaas. Isento pela MESMA razao dos dois acima, e a razao e
    // especifica de fila: reentrega em rajada e comportamento NORMAL de fila de
    // webhook, nao abuso. E o balde aqui seria por IP, porque o Asaas nao manda
    // Authorization (autentica por `asaas-access-token`), entao a frota inteira
    // dele dividiria um unico balde.
    //
    // O custo de um 429 aqui nao e uma entrega perdida: a fila do Asaas PAUSA a
    // conta depois de uma sequencia de falhas, e a partir dai nenhum pagamento
    // de ninguem e confirmado. Rate limit protegendo uma rota que so aceita
    // requisicao com token valido troca uma protecao que nao falta por um modo
    // de falha que custa dinheiro.
    //
    // Prefixo ESPECIFICO do provedor, nao `/api/webhooks/`: isencao e
    // privilegio, e uma rota de webhook nova nasce sujeita ao limiter ate
    // alguem decidir o contrario aqui.
    pathname.startsWith("/api/webhooks/asaas") ||
    // Contador publico da home (stats/users-count): GET read-only e barato
    // (last-known-good em memoria, sem escrita). Em IP compartilhado (NAT de
    // operadora movel, redes corporativas/escolares) o rate limit geral devolvia
    // 429 e o contador sumia pra todos daquele IP. Isento por ser publico e leve.
    pathname.startsWith("/api/stats/")
  );
}
