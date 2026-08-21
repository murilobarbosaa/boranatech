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
  // Recusa de cobranca. Os dois, nao um: o Radar bloqueia alguns pagamentos
  // ANTES de existir charge (not_sent_to_network), e nesses casos so o
  // payment_intent.payment_failed chega. Inscrever apenas charge.failed perderia
  // exatamente a classe de recusa que mais gera "paguei e nao liberou".
  "charge.failed",
  "payment_intent.payment_failed",
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
  // VAZIO desde 2026-08-21 (merge da frente billing), e o vazio e o estado
  // correto, nao uma lista que esqueceram de preencher.
  //
  // charge.failed e payment_intent.payment_failed moraram aqui com o motivo
  // "hoje o sistema so trata falha de fatura" e com a previsao explicita de que
  // um dia bastaria escrever o handler. O commit 404b7f72 escreveu: os dois tem
  // `case` proprio no switch de handleWebhook e alimentam billing_failed_payments.
  // Deixa-los aqui declararia que caem no `default:`, que e o oposto do que o
  // codigo faz, e o script reportaria "assinado e nao tratado" sobre eventos
  // tratados.
  //
  // EXPECTED_EVENTS nao mudou de conteudo nesta migracao, so de composicao: os
  // mesmos 13 eventos, agora todos em HANDLED_EVENTS. A configuracao do endpoint
  // na Stripe NAO precisa mudar.
};

/** Tudo que o endpoint DEVE assinar: nem a mais, nem a menos. */
export const EXPECTED_EVENTS = [
  ...HANDLED_EVENTS,
  ...Object.keys(UNHANDLED_ON_PURPOSE),
];
