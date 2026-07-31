// REVOGACAO DE ACESSO PRO acoplada ao reembolso.
//
// Reverte a decisao da Fatia 7 ("o reembolso nao cancela a assinatura"), mas com
// a regra CONDICIONAL: so revoga quando a devolucao zera o saldo. Quem pagou por
// parte e devolveu parte continua tendo pago por parte.
//
// O caso que motivou: um reembolso total de R$ 148,74 saiu, o extrato foi a
// R$ 0,00, e a pessoa seguiu Pro ate 28/07/2027. Dinheiro devolvido e um ano de
// acesso dado.

/** Por que a revogacao nao aconteceu, ou como ela terminou. */
export type RevocationReason =
  | "partial_refund"
  | "no_active_subscription"
  | "revoked"
  | "revoke_failed";

export type RevocationOutcome = {
  /** A decisao do SERVIDOR, calculada sobre o estado real. Nunca vem do cliente. */
  should_revoke: boolean;
  /** O que de fato aconteceu. `should_revoke && !revoked` e o estado meio-feito. */
  revoked: boolean;
  reason: RevocationReason;
  /** Frase curta para a tela, quando ha algo a explicar. */
  detail: string | null;
  /**
   * Continua Pro por concessao de influencer, que e ORTOGONAL a assinatura.
   * Revogar assinatura NAO remove Pro de quem tem concessao, e a tela precisa
   * dizer isso ou o admin acha que a acao falhou.
   */
  still_pro_via_influencer: boolean;
};

/**
 * A REGRA. Devolucao que zera o saldo reembolsavel revoga; parcial nao.
 *
 * POR QUE ARITMETICA E NAO RELEITURA DO BANCO. A tentacao e reconsultar
 * finance_transactions depois do syncBalanceTransactions e ver o estado "de
 * verdade". Isso e pior: o sync pode falhar (a rota ja trata isso como nao-erro,
 * porque o reembolso aconteceu de qualquer jeito), e uma releitura sobre dado
 * ainda nao sincronizado devolveria o saldo ANTIGO, concluindo "parcial" para um
 * reembolso total. O desfecho seria exatamente o bug que esta fatia existe para
 * fechar: dinheiro devolvido e acesso mantido, agora em silencio.
 *
 * Os dois numeros abaixo sao do servidor e do MESMO request: `refundableAntes`
 * foi agregado do banco por buildTransactionList e `valorReembolsado` foi
 * validado contra ele antes de ir para a Stripe, que aceitou exatamente esse
 * valor. A subtracao e o estado real, sem depender de nada ter sincronizado.
 *
 * POR QUE `refundable == 0` E NAO `refund_state === 'full'`. Os dois coincidem
 * sempre que nao ha chargeback, que e todo caso real hoje. Divergem quando parte
 * do dinheiro saiu por disputa: ai refundable chega a zero com refund_state
 * ainda 'partial'. Revogar e o certo nesse caso, porque a pergunta que importa e
 * "sobrou dinheiro desta pessoa conosco?", e a resposta e nao, independente de o
 * caminho de volta ter sido reembolso ou contestacao.
 */
export function devolucaoZeraOSaldo(
  refundableAntes: number,
  valorReembolsado: number,
): boolean {
  return refundableAntes - valorReembolsado <= 0;
}

/** Assinatura candidata a revogacao, como a rota a le. */
export type AssinaturaParaRevogar = {
  id: string;
  status: string;
  renewal_type: string | null;
  provider_subscription_id: string | null;
};

/**
 * Precisa chamar a Stripe para revogar?
 *
 * BOLETO (`renewal_type='manual'`) NAO tem assinatura recorrente na Stripe:
 * `provider_subscription_id` guarda um id de SESSAO (`cs_...`), e
 * subscriptions.cancel com ele falha sempre. Nao ha o que cancelar la, porque
 * nao ha renovacao automatica: o acesso e so `status='active'` com
 * `current_period_end` no futuro, e mudar o status no nosso banco basta. Nenhum
 * webhook vai chegar depois para desfazer, justamente porque nao existe
 * subscription do lado da Stripe.
 */
export function precisaCancelarNaStripe(
  sub: AssinaturaParaRevogar,
): sub is AssinaturaParaRevogar & { provider_subscription_id: string } {
  return sub.renewal_type !== "manual" && Boolean(sub.provider_subscription_id);
}
