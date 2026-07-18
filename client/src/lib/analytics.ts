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

// Origem normalizada de um signup ou gate-hit. Valor de baixa cardinalidade
// derivado do path: o path cru (ex: /areas/dados/engenheiro-dados) explodiria o
// numero de valores distintos no PostHog e inviabilizaria o funil. "unknown"
// (sem dado de origem) e distinto de "other" (origem conhecida, fora de areas):
// no baseline sao coisas diferentes ("nao consegui atribuir" vs "veio de outro
// lugar").
export type ContentSource =
  | "area_detail"
  | "subarea_detail"
  | "other"
  | "unknown";

const SIGNUP_SOURCE_STORAGE_KEY = "bnt_signup_source";
// Janela de validade da origem persistida pro OAuth. Cobre o round-trip pro
// provedor com folga (segundos a poucos minutos) e expira logo depois pra um
// cadastro-OAuth abandonado nao contaminar um signup posterior nao relacionado.
const SIGNUP_SOURCE_TTL_MS = 15 * 60_000;

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// Classifica um path (tipicamente o returnTo que o RequireAuth injeta) na origem
// de conteudo. Ausencia de path -> unknown; /areas/:slug -> area_detail;
// /areas/:parent/:subarea -> subarea_detail; qualquer outro path conhecido
// (incluindo a listagem /areas) -> other.
export function classifyContentSource(
  path: string | null | undefined,
): ContentSource {
  if (!path) return "unknown";
  const clean = (path.startsWith("http") ? safePathname(path) : path).split(
    /[?#]/,
  )[0];
  const seg = clean.split("/").filter(Boolean);
  if (seg[0] !== "areas") return "other";
  if (seg.length >= 3) return "subarea_detail";
  if (seg.length === 2) return "area_detail";
  return "other";
}

// Origem do signup a partir do returnTo na URL atual. Usado no fluxo de e-mail,
// que dispara ainda na pagina /cadastro?returnTo=..., com a URL intacta. Sem
// returnTo -> unknown.
export function signupSourceFromUrl(): ContentSource {
  if (typeof window === "undefined") return "unknown";
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return classifyContentSource(returnTo);
}

// OAuth perde o returnTo no round-trip pro provedor (o redirectTo volta pra
// /perfil). A origem e persistida no clique do botao social (ainda em /cadastro)
// e consumida no SIGNED_IN de criacao de conta. Guarda um timestamp pra expirar
// (SIGNUP_SOURCE_TTL_MS) e nao mis-atribuir um cadastro abandonado.
export function rememberSignupSource(source: ContentSource): void {
  try {
    localStorage.setItem(
      SIGNUP_SOURCE_STORAGE_KEY,
      JSON.stringify({ source, ts: Date.now() }),
    );
  } catch {
    // localStorage indisponivel: signup OAuth cai em source=unknown.
  }
}

function consumeSignupSource(): ContentSource {
  try {
    const raw = localStorage.getItem(SIGNUP_SOURCE_STORAGE_KEY);
    if (!raw) return "unknown";
    localStorage.removeItem(SIGNUP_SOURCE_STORAGE_KEY);
    const { source, ts } = JSON.parse(raw) as {
      source?: unknown;
      ts?: unknown;
    };
    if (typeof ts !== "number" || Date.now() - ts > SIGNUP_SOURCE_TTL_MS) {
      return "unknown";
    }
    return source === "area_detail" ||
      source === "subarea_detail" ||
      source === "other"
      ? source
      : "unknown";
  } catch {
    return "unknown";
  }
}

// Anon bate no muro de conteudo (area/subarea) e e redirecionado pro cadastro.
// Espelha captureProGateHit: mede quantos visitantes o gate empurra hoje.
export function captureContentGateHit(props: {
  feature: "area_detail" | "subarea_detail";
  path: string;
}): void {
  posthog.capture("content_gate_hit", props);
}

// Clique no CTA de suporte pelo WhatsApp (canal exclusivo Pro). source distingue
// de onde partiu: a tela de sucesso do checkout ou o card persistente no perfil.
export function captureWhatsappSupportClicked(props: {
  source: "checkout_success" | "perfil";
}): void {
  posthog.capture("whatsapp_support_clicked", props);
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

// Cadastro por email/senha. Ja disparava no signUp; agora carrega method e a
// origem (returnTo classificado), pra atribuir signups a paginas de conteudo.
export function captureUserSignedUpForEmail(
  source: ContentSource = "unknown",
): void {
  posthog.capture("user_signed_up", { method: "email", source });
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
  posthog.capture("user_signed_up", {
    method: provider,
    source: consumeSignupSource(),
  });
}
