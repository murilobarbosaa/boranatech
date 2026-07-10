// jobIds deterministicos da fila email-campaign, centralizados aqui: o BullMQ
// REJEITA ":" em jobId customizado ("Custom Id cannot contain :", lancado em
// Job.validateOptions na criacao), entao o separador e hifen. Modulo puro, sem
// dependencias, pra criacao (dispatch, gatilho agendado, reconciliacao) e
// remocao (cancelamento de lote) montarem SEMPRE o mesmo id. Nenhum jobId deve
// ser montado inline fora deste modulo.

export function batchJobId(batchId: string): string {
  return `batch-${batchId}`;
}

export function recipientJobId(recipientId: string): string {
  return `recipient-${recipientId}`;
}
