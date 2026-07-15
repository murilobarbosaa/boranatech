import posthog from "posthog-js";

import { getPlanPriceCents } from "@shared/planPricing";

// Funil de conversao instrumentado no client (PostHog). Nomes de evento e
// propriedades centralizados aqui para nao divergirem entre CTAs e gates.
// A identidade da jornada (posthog.identify/reset) ja vive em AuthContext.

export function planPriceCents(planCode: string): number {
  return getPlanPriceCents(planCode) ?? 0;
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

// --- Cadastro (user_signed_up) -------------------------------------------------
// user_signed_up e a base do funil de conversao do admin. Precisa disparar UMA
// vez por conta criada, em QUALQUER metodo (email/senha e OAuth). O bug de
// producao: o cadastro via Google (76% da base) nunca disparava, porque o retorno
// do OAuth so emite SIGNED_IN, sem um evento dedicado de "conta criada".

type SupabaseUserLike = {
  id: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  app_metadata?: { provider?: string };
};

// Janela para tratar um sign-in como CRIACAO de conta. No signup o Supabase seta
// created_at e last_sign_in_at praticamente no mesmo instante (mesma transacao);
// em logins seguintes last_sign_in_at avanca horas/dias. Gap pequeno => primeiro
// sign-in (criacao). 60s cobre latencia de escrita/relogio com folga, e e muito
// menor que qualquer intervalo real ate um novo login.
const SIGNUP_WINDOW_MS = 60_000;

// Cadastro por email/senha. Ja disparava no signUp; agora carrega method.
export function captureUserSignedUpForEmail(): void {
  posthog.capture("user_signed_up", { method: "email" });
}

// Cadastro via OAuth (Google). Chamado em TODO SIGNED_IN, mas so dispara quando a
// conta acabou de ser criada, nunca em login de usuario existente. Dois sinais
// combinados para NAO inflar:
//  1) created_at ~ last_sign_in_at (< janela): independe de storage e bloqueia
//     contas antigas mesmo apos limpar cookies (created_at fica no passado);
//  2) dedup por uid em localStorage: evita disparo duplo pelos multiplos eventos
//     de auth do callback OAuth ou por reload dentro da janela.
// O fluxo email/senha ja dispara no signUp; aqui so provedores OAuth (provider
// diferente de "email"), que e exatamente o buraco.
export function captureUserSignedUpForOAuth(user: SupabaseUserLike): void {
  const provider = user.app_metadata?.provider ?? "";
  if (!provider || provider === "email") return;

  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  if (!Number.isFinite(created)) return;
  const lastSignIn = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : NaN;
  // Prefere last_sign_in_at (mesmo relogio do server que created_at, sem skew);
  // so cai em now() se ausente (raro). Conta antiga => gap enorme => nao dispara.
  const reference = Number.isFinite(lastSignIn) ? lastSignIn : Date.now();
  if (Math.abs(reference - created) > SIGNUP_WINDOW_MS) return;

  const dedupKey = `bnt_signup_captured:${user.id}`;
  try {
    if (localStorage.getItem(dedupKey)) return;
    localStorage.setItem(dedupKey, "1");
  } catch {
    // localStorage indisponivel: segue sem dedup persistente. O sinal de
    // created_at ja evita reincidencia fora da janela.
  }
  posthog.capture("user_signed_up", { method: provider });
}
