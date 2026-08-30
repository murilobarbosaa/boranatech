import type { PlanId } from "./planPricing";

/**
 * PONTO UNICO DE VERDADE: qual plano aceita qual meio de pagamento.
 *
 * Antes deste arquivo a regra vivia em TRES lugares, e dois deles negavam POR
 * NOME:
 *
 *   1. `BOLETO_ACCESS_DAYS` / `PIX_ACCESS_DAYS`, nos providers, por inclusao;
 *   2. `server/routes/billing.ts`, `if (paymentMethod === "boleto" && planId === "pro_monthly")`;
 *   3. `client/src/pages/Checkout.tsx`, `if (selectedPlan === "pro_monthly")`.
 *
 * As camadas 2 e 3 negam UM plano nominalmente, entao um plano novo (ou um meio
 * novo) passa por elas por OMISSAO: elas so sabem recusar o que ja foi escrito.
 * Foi assim que o Pix precisou ser proibido em tres lugares diferentes no Lote
 * 2a em vez de nascer proibido.
 *
 * Aqui a direcao se inverte: o mapa lista o que PODE. O que nao esta escrito e
 * negado, e um `PlanId` novo nasce sem meio nenhum ate alguem declarar.
 */

/** Meios de pagamento que o produto conhece. Uniao fechada. */
export const PAYMENT_METHODS = ["card", "boleto", "pix"] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

/**
 * Dias de acesso que uma compra AVULSA concede, por plano.
 *
 * Este mapa e a fonte das duas coisas ao mesmo tempo, e nao por acaso: um plano
 * so pode ser vendido de forma avulsa se existir uma resposta para "acesso por
 * quanto tempo?". Estar aqui E a permissao; o numero E a duracao.
 *
 * O mensal fica de fora de proposito: vender um mes avulso significaria uma
 * cobranca manual por mes, que e pior para quem compra e para quem opera.
 */
export const ONE_OFF_ACCESS_DAYS: Partial<Record<PlanId, number>> = {
  pro_semiannual: 182,
  pro_annual: 365,
};

/** Meios avulsos: uma cobranca, um periodo de acesso, renovacao manual. */
const ONE_OFF_METHODS: readonly PaymentMethodId[] = ["boleto", "pix"];

/**
 * Meios aceitos por um plano.
 *
 * `card` vale para todo plano porque e o unico recorrente: a Stripe renova
 * sozinha e nao ha prazo de acesso a conceder. Os avulsos dependem de o plano
 * ter uma duracao declarada em `ONE_OFF_ACCESS_DAYS`.
 */
export function allowedPaymentMethods(
  planId: PlanId,
): readonly PaymentMethodId[] {
  return ONE_OFF_ACCESS_DAYS[planId]
    ? (["card", ...ONE_OFF_METHODS] as const)
    : (["card"] as const);
}

/** O plano aceita este meio? Unica pergunta que as camadas devem fazer. */
export function isPaymentMethodAllowed(
  planId: PlanId,
  method: PaymentMethodId,
): boolean {
  return allowedPaymentMethods(planId).includes(method);
}

/**
 * Estreita um valor VINDO DE FORA (corpo HTTP) para a uniao fechada.
 *
 * Necessario porque `payment_method` chega do cliente: sem esta guarda, um
 * literal desconhecido atravessaria a tipagem e so seria pego (ou nao) mais
 * adiante, no mapa de dias de acesso.
 */
export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

/**
 * Dias de acesso de uma compra avulsa, ou `undefined` quando o plano nao aceita
 * a modalidade. Os providers usam isto no lugar dos mapas locais que mantinham.
 */
export function oneOffAccessDays(planId: PlanId): number | undefined {
  return ONE_OFF_ACCESS_DAYS[planId];
}
