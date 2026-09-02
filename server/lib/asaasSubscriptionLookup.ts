/**
 * QUAL LINHA DE `subscriptions` um event do Asaas nomeia.
 *
 * A DECISAO mora aqui, separada da leitura, e a separacao tem dois motivos, um
 * de teste e um de execucao:
 *
 *   teste     a ordem das tentativas e a coisa que pode ficar errada (perguntar
 *             pelo id local primeiro acharia a row certa por sorte e a errada
 *             quando o `externalReference` fosse de outra compra), e ela merece
 *             ser exercitada sem Postgres.
 *
 *   execucao  o backfill (scripts/asaasLedgerBackfill.mts) precisa da MESMA
 *             resolucao de dono que o webhook usa, e ele nao pode importar
 *             `supabaseAdmin`, porque `@supabase/supabase-js` nao expoe
 *             `createClient` como named export em ESM e o import morre. Com a
 *             decisao aqui e a leitura injetada, os dois compartilham a regra
 *             sem compartilhar o SDK.
 *
 * Uma segunda montagem desta busca atribuiria dinheiro a pessoa errada no
 * primeiro caso em que as duas divergissem, e divergir e o que duas copias
 * fazem.
 */

/** O que o ledger e a ativacao precisam da row. */
export type AssinaturaDoAsaas = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  affiliate_code: string | null;
  coupon_code: string | null;
};

export type LeituraDeAssinatura = {
  /** Por `provider_subscription_id`, o id da cobranca no Asaas. */
  porCobranca: (chargeId: string) => Promise<AssinaturaDoAsaas | null>;
  /** Por `id` da propria row, o `externalReference` que mandamos ao Asaas. */
  porId: (rowId: string) => Promise<AssinaturaDoAsaas | null>;
};

/**
 * A COBRANCA PRIMEIRO, o id local como RESERVA, e a ordem e o ponto.
 *
 * `provider_subscription_id` e a ligacao que o PROVEDOR confirma: ela so existe
 * depois de a cobranca ter sido criada e gravada por nos. O `externalReference`
 * e a ligacao que NOS afirmamos, e ela cobre exatamente uma janela: a cobranca
 * foi criada no Asaas e o UPDATE que grava o id dela na row nao concluiu.
 *
 * Inverter a ordem nao e "quase igual": o id local viria do payload de um event
 * que, num reprocessamento fora de ordem, pode nomear uma compra anterior da
 * mesma pessoa.
 */
export async function resolverAssinaturaDoAsaas(
  chargeId: string | null,
  rowId: string | null,
  leitura: LeituraDeAssinatura,
): Promise<AssinaturaDoAsaas | null> {
  if (chargeId) {
    const porCobranca = await leitura.porCobranca(chargeId);
    if (porCobranca) return porCobranca;
  }
  if (rowId) {
    const porId = await leitura.porId(rowId);
    if (porId) return porId;
  }
  return null;
}
