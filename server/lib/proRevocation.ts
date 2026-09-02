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

/**
 * O QUE JA ACONTECEU quando a revogacao e tentada.
 *
 * Nao e enfeite de log: as duas situacoes tem gravidade diferente e postura de
 * erro OPOSTA, e confundi-las produziria mensagem falsa das duas direcoes.
 *
 *   refund      o dinheiro JA SAIU. Uma falha aqui deixa metade feita, e por
 *               isso a rota responde 200 dizendo que o reembolso aconteceu e
 *               que o acesso nao caiu. Toda falha e INCONSISTENCIA.
 *
 *   standalone  nada aconteceu ainda. Uma falha aqui nao deixa metade nenhuma:
 *               a rota responde ERRO e o estado do usuario e o mesmo de antes.
 *               Chamar isso de INCONSISTENCIA no log seria alarme falso, e
 *               alarme falso e o que faz alguem parar de ler o log.
 *
 * A excecao esta anotada no proprio sitio: falha do banco DEPOIS de a Stripe ter
 * cancelado e inconsistencia nos dois gatilhos, porque ai algo externo ja mudou.
 */
export type GatilhoDeRevogacao =
  | { tipo: "refund"; chargeId: string }
  | { tipo: "standalone" };

/**
 * ONDE falhou. Existe para o chamador escolher o status HTTP sem reinspecionar
 * a mensagem de erro, que e a forma fragil de fazer a mesma coisa.
 */
export type RevocationFailure = "read" | "audit" | "stripe" | "db";

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
  /** `stripe` | `asaas`. Ausencia cai em `stripe`, o default da coluna. */
  provider?: string | null;
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
 *
 * ASAAS SAI POR UMA CONDICAO PROPRIA, e nao pela de cima, apesar de a de cima ja
 * bastar hoje (toda linha do Asaas e `renewal_type='manual'`). A razao e que ela
 * basta por CORRELACAO, nao por definicao: quem revogasse a exigencia de Pix ser
 * sempre manual (Pix Automatico, por exemplo) faria esta funcao mandar um
 * `pay_...` do Asaas para `stripe.subscriptions.cancel`, que responderia erro e
 * abortaria a revogacao inteira, deixando o acesso de pe. Perguntar pelo
 * provedor responde a pergunta que a funcao faz; perguntar pelo tipo de
 * renovacao responde outra que hoje da o mesmo resultado.
 */
export function precisaCancelarNaStripe(
  sub: AssinaturaParaRevogar,
): sub is AssinaturaParaRevogar & { provider_subscription_id: string } {
  if ((sub.provider ?? "stripe") !== "stripe") return false;
  return sub.renewal_type !== "manual" && Boolean(sub.provider_subscription_id);
}

/**
 * Prefixo do log de falha, escolhido pelo gatilho.
 *
 * `INCONSISTENCIA` e uma palavra com significado nesta base: ela marca o estado
 * meio-feito, em que uma parte surtiu efeito e a outra nao. Usa-la quando nada
 * aconteceu diluiria o termo justamente nos logs em que ele precisa ser
 * procuravel.
 */
export function prefixoDeFalhaDeRevogacao(
  gatilho: GatilhoDeRevogacao,
  uid: string,
): string {
  return gatilho.tipo === "refund"
    ? `[admin/refund] INCONSISTENCIA: reembolso de ${gatilho.chargeId} emitido, mas`
    : `[admin/revoke] revogacao avulsa de ${uid} NAO aconteceu:`;
}
