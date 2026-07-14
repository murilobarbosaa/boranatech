import posthog from "posthog-js";

import { PLAN_PRICING, isPlanId } from "@shared/planPricing";

// Funil de conversao instrumentado no client (PostHog). Nomes de evento e
// propriedades centralizados aqui para nao divergirem entre CTAs e gates.
// A identidade da jornada (posthog.identify/reset) ja vive em AuthContext.

export function planPriceCents(planCode: string): number {
  return isPlanId(planCode) ? Math.round(PLAN_PRICING[planCode].total * 100) : 0;
}

// Clique para assinar, ANTES do redirect para a Stripe.
export function captureCheckoutStarted(props: {
  plan_code: string;
  price_cents: number;
  source_path: string;
  cta_id: string;
}): void {
  posthog.capture("checkout_started", props);
}

// Volta da Stripe sem completar (cancel_url).
export function captureCheckoutAbandoned(props: { plan_code: string }): void {
  posthog.capture("checkout_abandoned", props);
}

// Assinatura confirmada na pagina de sucesso.
export function captureSubscriptionCompleted(props: {
  plan_code: string;
  price_cents: number;
  provider: string;
}): void {
  posthog.capture("subscription_completed", props);
}

// Usuario free bate num gate/paywall de recurso Pro.
export function captureProGateHit(props: {
  feature: string;
  path: string;
}): void {
  posthog.capture("pro_gate_hit", props);
}
