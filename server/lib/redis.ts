import IORedis from "ioredis";

import { env } from "./env";

// Duas conexoes com papeis distintos (auditoria scratch/audit-escalabilidade.txt):
//
// queueConnection: exclusiva do BullMQ. Queue e Worker EXIGEM
// maxRetriesPerRequest: null (comando bloqueante do worker nao pode desistir),
// o que implica offline queue segurando comandos com Redis fora. Aceitavel na
// fila; inaceitavel em caminho de request.
//
// cacheConnection: cache de status Pro, health check e rate limit. Fail-fast:
// sem offline queue, qualquer comando com Redis fora rejeita em ~1-2s em vez de
// pendurar a rota. A reconexao segue em background via retryStrategy (backoff
// exponencial com teto de 30s), entao o cache volta sozinho quando o Redis voltar.

export const queueConnection = env.redisUrl
  ? new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : null;

queueConnection?.on("error", (err) => {
  console.error("[redis] Erro na conexão de fila:", err.message);
});

export const cacheConnection = env.redisUrl
  ? new IORedis(env.redisUrl, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      commandTimeout: 1000,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(2 ** times * 100, 30_000),
    })
  : null;

// Sem handler de "error", um erro de conexao vira unhandled error event e
// derruba o processo. Logar e o suficiente: quem usa a conexao trata falha
// por comando.
cacheConnection?.on("error", (err) => {
  console.error("[redis] Erro na conexão de cache:", err.message);
});
