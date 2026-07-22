// Teto de tempo para uma operacao na queueConnection do BullMQ (add, addBulk,
// remove, contadores). Motivo: essa conexao tem offline queue ligada (exigencia
// do worker bloqueante), entao com o Redis lento ou half-open um comando fica
// PENDENTE ate reconectar (~15s com o socketTimeout da Rodada 1) em vez de
// rejeitar. Numa ROTA isso penduraria a resposta; este teto propaga um erro em
// ~2s e o chamador trata pelos caminhos de erro que ja existem.
//
// Seguranca do timeout: o comando abandonado aqui pode COMPLETAR depois (sai da
// offline queue no reconnect). Nas filas de campanha isso NAO duplica e-mail
// porque os jobs tem jobId deterministico (BullMQ dedupa) e o processamento e
// idempotente (guarda de status + recipient inexistente vira no-op). Ver
// enqueueCampaignRecipients / scheduleBatchDispatchJob.
//
// Extraido de enqueueEmail (queue.ts): mesmo valor e mesma abordagem
// (Promise.race com sentinela Symbol + setTimeout(...).unref()).

const REDIS_OP_TIMEOUT_MS = 2_000;

const REDIS_OP_TIMEOUT = Symbol("redis-op-timeout");

// Erro tipado para o chamador distinguir "Redis pendurado" (timeout) de um erro
// real do comando: a rota de contadores mapeia SO o timeout para o estado
// nomeado "indisponivel", deixando outros erros seguirem o fluxo normal.
export class RedisOpTimeoutError extends Error {
  constructor(label: string) {
    super(`Timeout em operacao Redis (${label}) apos ${REDIS_OP_TIMEOUT_MS}ms.`);
    this.name = "RedisOpTimeoutError";
  }
}

export async function withRedisOpTimeout<T>(
  op: Promise<T>,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      op,
      new Promise<typeof REDIS_OP_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(REDIS_OP_TIMEOUT), REDIS_OP_TIMEOUT_MS);
        timer.unref();
      }),
    ]);
    if (result === REDIS_OP_TIMEOUT) {
      throw new RedisOpTimeoutError(label);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}
