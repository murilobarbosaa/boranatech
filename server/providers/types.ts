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
  // INTERNO, NUNCA vem do corpo HTTP: so o handler de renovacao (que ja validou o
  // token assinado) seta true, para pular o guard de "assinatura ativa" (na
  // renovacao a assinatura esta active de proposito). O guard de boleto pendente
  // continua valendo. Nenhuma rota faz spread de req.body neste input.
  internalRenewal?: boolean;
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
  // true no caminho de boleto (renewal_type='manual'): a acao registrou a
  // intencao de NAO renovar, sem cancelar recorrencia (nao existe) e sem tocar a
  // Stripe. Ausente/false no caminho de cartao.
  non_renewal?: boolean;
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
