// Eventos do Webhook Endpoint da Stripe. Modulo de DADOS puro, sem efeito
// colateral: e importado pelo script de sincronia (stripe-webhook-events.mjs) e
// pelo teste que trava a sincronia com o switch de handleWebhook
// (server/providers/stripeWebhookEvents.test.ts).
//
// Duas listas, e a divisao e o ponto: um evento assinado precisa estar em UMA
// delas. Assinado e ausente das duas e divergencia, e o script para. Foi
// exatamente o que aconteceu com charge.failed e payment_intent.payment_failed:
// o endpoint os assinava, o script so sabia somar (desired = atual + tratados) e
// nunca reclamava do excedente, entao a "fonte de verdade" descrevia menos que a
// realidade sem ninguem notar.

/** Eventos com `case` proprio no switch de handleWebhook. */
export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.succeeded",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
];

/**
 * Eventos ASSINADOS de propósito e SEM handler. Caem no `default:`, que nao muta
 * nada e apaga o proprio billing_event para um resend futuro alcancar um handler
 * que venha a existir.
 *
 * Por que ficam assinados em vez de sairem do endpoint: tirar evento e mutacao
 * na configuracao de producao, e o custo de mante-los e zero (nenhuma escrita,
 * nenhuma linha de dedup acumulada). Ja o beneficio e real: os dois sao os
 * unicos sinais de falha de pagamento no NIVEL DA COBRANCA. Hoje o sistema so
 * enxerga falha no nivel da fatura (invoice.payment_failed), entao se um dia
 * for preciso distinguir "cartao recusado" de "fatura vencida", a assinatura ja
 * esta de pe e basta escrever o handler.
 *
 * O valor de cada chave e o motivo, e ele aparece na saida do script.
 */
export const UNHANDLED_ON_PURPOSE = {
  "charge.failed":
    "falha no nivel da cobranca; hoje o sistema so trata falha de fatura",
  "payment_intent.payment_failed":
    "falha no nivel da intencao de pagamento; idem",
};

/** Tudo que o endpoint DEVE assinar: nem a mais, nem a menos. */
export const EXPECTED_EVENTS = [
  ...HANDLED_EVENTS,
  ...Object.keys(UNHANDLED_ON_PURPOSE),
];
