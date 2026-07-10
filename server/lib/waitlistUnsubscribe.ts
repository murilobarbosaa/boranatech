import { env } from "./env";
import { issueSignedToken } from "./signedToken";

// Descadastro de campanha via token HMAC assinado (server/lib/signedToken.ts),
// mesmo padrao da newsletter: nenhuma coluna de token no banco. O secret e a
// base URL sao os mesmos da newsletter de proposito (decisao de nao criar env
// nova de URL); o purpose proprio impede tokens de um fluxo valerem no outro.
//
// Purpose atual, generico por audiencia: o efeito do descadastro e SEMPRE
// gravar em email_suppressions (vale pra destinatario de lista avulsa que nao
// esta em tabela nenhuma) e, adicionalmente, marcar a origem quando existir
// (waitlist, newsletter).
export const EMAIL_UNSUBSCRIBE_PURPOSE = "email-unsubscribe";

// Purpose legado dos tokens ja emitidos nos e-mails da epoca waitlist-only
// (TTL de 60 dias): a verificacao precisa continuar aceitando ate expirarem.
export const WAITLIST_UNSUBSCRIBE_PURPOSE = "waitlist-unsubscribe";

// TTL generoso: e-mail de campanha e aberto com atraso, o link nao pode
// expirar em horas.
export const EMAIL_UNSUBSCRIBE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60d

export function waitlistUnsubscribeReady(): boolean {
  return env.newsletterTokenSecret !== "" && env.newsletterPublicBaseUrl !== "";
}

export function buildCampaignUnsubscribeUrl(email: string): string {
  if (!waitlistUnsubscribeReady()) {
    throw new Error(
      "NEWSLETTER_TOKEN_SECRET ou NEWSLETTER_PUBLIC_BASE_URL ausente. Nao da pra montar link de descadastro.",
    );
  }
  const token = issueSignedToken({
    claims: { email, purpose: EMAIL_UNSUBSCRIBE_PURPOSE },
    secret: env.newsletterTokenSecret,
    ttlMs: EMAIL_UNSUBSCRIBE_TTL_MS,
  });
  const base = env.newsletterPublicBaseUrl.replace(/\/+$/, "");
  return `${base}/api/waitlist/unsubscribe?token=${encodeURIComponent(token)}`;
}
