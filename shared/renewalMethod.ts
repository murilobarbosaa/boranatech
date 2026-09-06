import { isPaymentMethodAllowed, type OneOffMethodId } from "./paymentMethods";
import type { PlanId } from "./planPricing";

/**
 * Meio da RENOVACAO manual: o meio atual da assinatura quando o plano ainda o
 * aceita, senao Pix.
 *
 * O "senao Pix" cobre o caso legado medido em 2026-09-06: uma assinatura
 * mensal paga por boleto, criada antes de o mapa proibir boleto no mensal.
 * Renova-la por boleto seria recusado pela Stripe (`boleto_not_allowed_on_monthly`);
 * Pix e o unico avulso que o mensal aceita. Cartao nao e avulso e nunca chega
 * aqui por uma assinatura manual, mas se chegar cai em Pix pelo mesmo motivo.
 *
 * UMA funcao para a rota de renovacao (que cobra) e para o cron de lembrete
 * (que diz no e-mail por qual meio vai cobrar): se divergissem, o e-mail
 * prometeria um meio e o clique geraria outro.
 */
export function metodoDaRenovacao(
  metodoAtual: string | null | undefined,
  planId: PlanId,
): OneOffMethodId {
  if (
    (metodoAtual === "boleto" || metodoAtual === "pix") &&
    isPaymentMethodAllowed(planId, metodoAtual)
  ) {
    return metodoAtual;
  }
  return "pix";
}
