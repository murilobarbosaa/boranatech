/**
 * A ANCORA DO PERIODO DE UMA ATIVACAO AVULSA (boleto na Stripe, Pix no Asaas).
 *
 * Renovacao SOMA ao periodo, nao substitui. O novo periodo comeca no MAIOR
 * entre o instante do pagamento e o fim ainda vigente do usuario:
 *
 *   primeira compra      sem vigente        -> comeca no pagamento
 *   renovacao cedo       vigente > pagamento -> comeca no fim vigente, e a
 *                                              pessoa nao perde os dias que
 *                                              faltavam
 *   renovacao atrasada   vigente < pagamento -> comeca no pagamento, sem
 *                                              retroativo dos dias sem acesso
 *
 * UMA FUNCAO PARA OS DOIS PROVEDORES, de proposito. Ate 2026-09-06 a regra
 * estava escrita duas vezes, em server/providers/stripe.ts e em
 * server/providers/asaas.ts, com o mesmo texto e a mesma aritmetica; duas
 * copias divergem no primeiro dia em que alguem mexe em uma. Quem chama
 * continua responsavel por LER o fim vigente (a consulta e do provedor, porque
 * exclui a propria linha) e por decidir os dias de acesso.
 *
 * Pura: recebe milissegundos e devolve ISO. Sem `Date.now()` aqui dentro, para
 * o teste afirmar as datas literais.
 */
const DIA_MS = 24 * 60 * 60 * 1000;

export function periodoDaRenovacao(args: {
  /** Instante do pagamento, pelo carimbo do provedor. */
  paidAtMs: number;
  /** Maior `current_period_end` ainda vigente do usuario, ou `null`. */
  fimVigenteMs: number | null;
  /** Dias de acesso que este pagamento concede. */
  accessDays: number;
}): { periodStart: string; periodEnd: string } {
  const { paidAtMs, fimVigenteMs, accessDays } = args;
  const anchorMs =
    fimVigenteMs !== null && fimVigenteMs > paidAtMs ? fimVigenteMs : paidAtMs;
  return {
    periodStart: new Date(anchorMs).toISOString(),
    periodEnd: new Date(anchorMs + accessDays * DIA_MS).toISOString(),
  };
}
