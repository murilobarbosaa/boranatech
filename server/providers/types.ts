// Interface do provider de pagamento (Stripe). Abstrai os fluxos de saida
// (checkout, cancel, reactivate) e o webhook atras de um contrato unico.

import type { PlanId } from "../../shared/planPricing";

export interface CheckoutUser {
  id: string;
  email: string;
}

// Boleto: pagamento unico (mode: payment), renovacao manual, so nos planos
// semestral/anual. 'card' (default) mantem o fluxo recorrente (mode: subscription).
export type CheckoutPaymentMethod = "card" | "boleto";

export interface CreateCheckoutInput {
  user: CheckoutUser;
  planId: PlanId;
  // Codigo de afiliado ja normalizado (uppercase/trim); "" quando ausente.
  affiliateCode: string;
  paymentMethod: CheckoutPaymentMethod;
}

export interface CreateCheckoutResult {
  // URL para onde o frontend redireciona o usuario. Pode ser undefined se o
  // provedor nao retornar link (tratado como erro pela rota).
  checkoutUrl: string | undefined;
  subscriptionId: string;
}

export interface CancelInput {
  userId: string;
  // Ja validados na rota (whitelist); "" quando ausentes.
  reasonCode: string;
  reasonText: string;
}

export interface CancelResult {
  cancel_at_period_end: boolean;
  effective_at: string | null;
  status?: string;
  message: string;
}

export interface ReactivateInput {
  userId: string;
}

export interface ReactivateResult {
  cancel_at_period_end?: boolean;
  redirect_to_checkout?: boolean;
  checkout_path?: string;
  message: string;
}

export interface WebhookInput {
  // Bytes crus do corpo (Buffer), preservados pelo parser dedicado em app.ts
  // ANTES do express.json global. Necessarios para validacao de assinatura.
  rawBody: Buffer | undefined;
  headers: Record<string, string | string[] | undefined>;
}

export type WebhookResult = Record<string, unknown>;

export interface PaymentProvider {
  readonly name: "stripe";
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
  reactivate(input: ReactivateInput): Promise<ReactivateResult>;
  handleWebhook(input: WebhookInput): Promise<WebhookResult>;
}
