import { deleteAsaasPayment, getAsaasSubscriptionPayments, updateAsaasSubscription } from "./asaas";

const REMOVABLE_STATUSES = ["PENDING", "AWAITING_RISK_ANALYSIS", "OVERDUE"];

// Avisa o Asaas que a assinatura termina em endDate (abordagem C) e neutraliza
// cobrancas futuras ja pre-geradas (salvaguarda s1). Idempotente e seguro para
// retry: endDate pode ser reenviado; DELETE de cobranca ausente (404) conta como
// sucesso. Pagamentos confirmados (CONFIRMED/RECEIVED) nunca sao tocados — o filtro
// e uma allow-list dos status removiveis. NAO toca no banco: quem chama controla a
// ordem (Asaas antes, banco depois).
export async function cancelSubscriptionAtAsaas(providerSubscriptionId: string, endDate: string) {
  // d. impede o Asaas de gerar novas cobrancas a partir de endDate.
  await updateAsaasSubscription(providerSubscriptionId, { endDate });

  // e. salvaguarda s1: endDate NAO remove cobranca ja pre-gerada com vencimento
  // posterior (comprovado no sandbox); o DELETE remove. So mexemos em pendentes
  // futuras (dueDate > endDate); pagamentos confirmados (CONFIRMED/RECEIVED) nunca.
  const payments = await getAsaasSubscriptionPayments(providerSubscriptionId);
  const list = Array.isArray(payments?.data) ? payments.data : [];
  const toDelete = list.filter(
    (p: { id?: string; status?: string; dueDate?: string }) =>
      typeof p?.dueDate === "string" && p.dueDate > endDate && REMOVABLE_STATUSES.includes(p?.status ?? ""),
  );
  for (const p of toDelete) {
    try {
      await deleteAsaasPayment(p.id as string);
    } catch (delErr) {
      // 404 = cobranca ja sumiu => sucesso. Outros erros: nao fatais; o cron
      // reconciliador pode reprocessar. Nao abortamos o cancelamento por isso.
      if (!(delErr instanceof Error && /error 404/i.test(delErr.message))) {
        console.error(`[billing/cancel] DELETE pendente ${p.id} falhou (sub ${providerSubscriptionId}):`, delErr);
      }
    }
  }
}
