import { env } from "./env";
import { issueSignedToken } from "./signedToken";

// Descadastro da waitlist via token HMAC assinado (server/lib/signedToken.ts),
// mesmo padrao da newsletter: nenhuma coluna de token no banco. O secret e a
// base URL sao os mesmos da newsletter de proposito (decisao de nao criar env
// nova de URL); o purpose proprio impede tokens de um fluxo valerem no outro.
export const WAITLIST_UNSUBSCRIBE_PURPOSE = "waitlist-unsubscribe";

// TTL generoso: e-mail de campanha e aberto com atraso, o link nao pode
// expirar em horas.
export const WAITLIST_UNSUBSCRIBE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60d

export function waitlistUnsubscribeReady(): boolean {
  return env.newsletterTokenSecret !== "" && env.newsletterPublicBaseUrl !== "";
}

export function buildWaitlistUnsubscribeUrl(email: string): string {
  if (!waitlistUnsubscribeReady()) {
    throw new Error(
      "NEWSLETTER_TOKEN_SECRET ou NEWSLETTER_PUBLIC_BASE_URL ausente. Nao da pra montar link de descadastro.",
    );
  }
  const token = issueSignedToken({
    claims: { email, purpose: WAITLIST_UNSUBSCRIBE_PURPOSE },
    secret: env.newsletterTokenSecret,
    ttlMs: WAITLIST_UNSUBSCRIBE_TTL_MS,
  });
  const base = env.newsletterPublicBaseUrl.replace(/\/+$/, "");
  return `${base}/api/waitlist/unsubscribe?token=${encodeURIComponent(token)}`;
}
