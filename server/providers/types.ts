// Interface do provider de pagamento (Stripe). Abstrai os fluxos de saida
// (checkout, cancel, reactivate) e o webhook atras de um contrato unico.

import type { PlanId } from "../../shared/planPricing";
import type { PaymentMethodId } from "../../shared/paymentMethods";

export interface CheckoutUser {
  id: string;
  email: string;
}

/**
 * Meio de pagamento pedido no checkout.
 *
 * ALIAS do ponto unico em shared/paymentMethods.ts, e nao uma segunda uniao: as
 * duas divergiriam no primeiro meio novo, e a que ficasse para tras liberaria ou
 * proibiria por conta propria. O nome fica porque as rotas e o frontend ja o
 * importam daqui.
 *
 * 'card' e recorrente (mode: subscription na Stripe). 'boleto' e 'pix' sao
 * avulsos, com renovacao manual, so nos planos que declaram dias de acesso.
 */
export type CheckoutPaymentMethod = PaymentMethodId;

export interface CreateCheckoutInput {
  user: CheckoutUser;
  planId: PlanId;
  // Codigo de afiliado ja normalizado (uppercase/trim); "" quando ausente.
  affiliateCode: string;
  // Cupom de marketing ja normalizado (uppercase/trim); "" quando ausente.
  // Se valido, o desconto dele tem precedencia sobre o de afiliado; o
  // affiliate_code continua sendo gravado para comissao.
  couponCode: string;
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
  //
  // No Pix ela deixou de ser o caminho PRINCIPAL (o QR passou a viver na nossa
  // tela), mas continua sendo emitida como fallback e NAO foi removida: e o
  // campo que todo bundle ja em execucao le, e bundle antigo nao recarrega
  // sozinho. Ver `flow` abaixo.
  checkoutUrl: string | undefined;
  subscriptionId: string;
  /**
   * Como o frontend deve prosseguir. ADITIVO (expand/contract, CLAUDE.md):
   * ausente significa "redirecione", que e exatamente o que o bundle antigo ja
   * faz com `checkoutUrl`.
   *
   *   "redirect" (ou ausente): mandar o usuario para `checkoutUrl`.
   *   "native_pix":            renderizar o QR na nossa tela; `checkoutUrl` vira
   *                            fallback discreto.
   */
  flow?: "redirect" | "native_pix";
}

export interface CancelInput {
  userId: string;
  /**
   * Quem esta executando. Igual a userId quando e o proprio usuario; o id do
   * admin quando vem de POST /api/admin/users/:id/subscription/cancel. Vai
   * para subscription_cancellations.canceled_by, e e o que torna
   * `canceled_by <> user_id` a leitura precisa de "um admin fez isso".
   */
  actorUserId: string;
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

/**
 * Nome do provedor, como gravado em `subscriptions.provider` e em
 * `billing_events.provider`. Uniao fechada de proposito: um provedor novo entra
 * aqui e o `tsc` aponta todo lugar que precisa saber dele, em vez de a string
 * circular solta.
 */
export type PaymentProviderName = "stripe" | "asaas";

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
  reactivate(input: ReactivateInput): Promise<ReactivateResult>;
  handleWebhook(input: WebhookInput): Promise<WebhookResult>;
}
