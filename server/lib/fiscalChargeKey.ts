// Chave de cobranca do pipeline fiscal, agnostica de provedor de PAGAMENTO.
//
// UM LUGAR SO monta a chave e UM LUGAR SO deriva o jobId dela. A string
// `stripe:ch_...` montada a mao em dois pontos divergiria no primeiro ajuste de
// formato, e a divergencia apareceria como nota que a fila nao acha (loadRow por
// uma chave, registro por outra), que e silencio, nao erro.
//
// A chave vai para `fiscal_invoices.charge_key`, cujo check exige que ela comece
// com `payment_provider || ':'` (migration 20260925120000).

export const PAYMENT_PROVIDERS = ["stripe", "asaas"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

const SEPARADOR = ":";

function isPaymentProvider(valor: string): valor is PaymentProvider {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(valor);
}

/**
 * `<provedor>:<id no provedor>`. LANCA em provedor desconhecido, id vazio ou id
 * com `:`.
 *
 * Lanca, e nao degrada, porque a chave E a informacao: uma chave montada com
 * provedor errado ou com um id que embute o separador casaria com a nota de
 * outra cobranca, ou com nenhuma, e as duas coisas parecem corretas de fora.
 */
export function chargeKeyOf(provider: string, idNoProvedor: string): string {
  if (!isPaymentProvider(provider)) {
    throw new Error(
      `Provedor de pagamento desconhecido para a chave fiscal: "${provider}".`,
    );
  }
  if (!idNoProvedor) {
    throw new Error(`Id de cobranca vazio para a chave fiscal (${provider}).`);
  }
  if (idNoProvedor.includes(SEPARADOR)) {
    throw new Error(
      `Id de cobranca com "${SEPARADOR}" nao cabe na chave fiscal (${provider}).`,
    );
  }
  return `${provider}${SEPARADOR}${idNoProvedor}`;
}

/**
 * jobId da fila fiscal para uma chave.
 *
 * O `:` da chave NAO pode ir para o jobId. O BullMQ instalado (5.76.6,
 * `Job.validateOptions` em node_modules/bullmq/dist/cjs/classes/job.js) recusa
 * jobId customizado com `:` a menos que ele tenha EXATAMENTE dois, formato que
 * ele reserva para repeatable jobs antigos. `stripe:ch_1` lancaria
 * "Custom Id cannot contain :" no `add`, e o `cancel:${chargeId}` que existia
 * antes deste helper ja lancava em todo cancelamento. `cancel:stripe:ch_1`
 * passaria por acaso, por ter dois; depender disso seria depender de uma regra
 * de compatibilidade que o proprio BullMQ marca para remocao.
 *
 * O prefixo do tipo de trabalho separa emissao de cancelamento da MESMA
 * cobranca: com o mesmo jobId, o cancelamento seria descartado como duplicata do
 * job que emitiu a nota.
 */
export function fiscalJobId(
  kind: "issue" | "cancel",
  chargeKey: string,
): string {
  return `${kind}-${chargeKey.split(SEPARADOR).join("-")}`;
}
