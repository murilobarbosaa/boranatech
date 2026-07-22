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
      // Exigencias do BullMQ (Queue e Worker bloqueante). NAO alterar.
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // --- Deteccao de socket morto (half-open) ---
      // Contexto: um half-open (peer some sem FIN/RST, ou proxy/LB segura o TCP
      // com o Redis mudo atras) deixava o worker preso num bzpopmin por horas.
      // Sem keepalive util e sem timeout na camada de comando, o socket vira
      // zumbi e o ioredis so reconecta quando algo externo finalmente o fecha.
      //
      // NAO usar commandTimeout aqui: o BullMQ processa jobs com comandos
      // BLOQUEANTES (bzpopmin, que espera de proposito ate ~10s por job).
      // commandTimeout cortaria esse bloqueio legitimo e quebraria a fila.
      // Por isso usamos as opcoes abaixo, que sao cientes de bloqueio.
      //
      // blockingTimeout (ioredis 5.10+): habilita um deadline client-side POR
      // COMANDO bloqueante = (timeout do proprio bzpopmin) + blockingTimeoutGrace.
      // Ao expirar num socket zumbi, resolve o comando com null (mesma semantica
      // do Redis quando o bloqueio expira sem item) em vez de pendurar pra sempre;
      // o worker itera e sai do wedge. O valor 30000 e a rede de seguranca para
      // bloqueio infinito (o BullMQ nunca faz isso, sempre passa timeout finito)
      // e o gatilho que LIGA a feature; o deadline efetivo por bzpopmin do BullMQ
      // e 5.5s (bloqueio normal, drainDelay 5s) ou 10.5s (maximo, maximumBlockTimeout
      // 10s) + os 500ms de grace.
      blockingTimeout: 30000,
      blockingTimeoutGrace: 500,
      // socketTimeout (ioredis 5.10+): destroi o socket se um comando fica sem
      // NENHUM byte de resposta por N ms, disparando reconexao. Cobre os comandos
      // NAO bloqueantes da conexao principal (moveToActive/moveToCompleted/limiter),
      // que nao tem rede de protecao do BullMQ e eram o caminho do travamento longo.
      // DEVE ficar acima do maior bloqueio legitimo (maximumBlockTimeout do BullMQ
      // = 10s) e da rede propria do BullMQ (blockTimeout+1s <= 11s), senao corta um
      // bzpopmin saudavel de 10s. 15s da folga confortavel acima de ambos.
      socketTimeout: 15000,
      // keepAlive (defense-in-depth): TCP keepalive com primeiro probe aos 30s de
      // ocioso, em vez do default 0 (que herdava o idle do SO, ~2h no Linux).
      // Ajuda so o caso "kernel do peer sumiu"; o zumbi de nivel de aplicacao e
      // pego por blockingTimeout/socketTimeout acima.
      keepAlive: 30000,
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
