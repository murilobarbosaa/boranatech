// Token de renovacao de boleto (link one-click no e-mail de lembrete). Reusa o
// formato HMAC do projeto (signedToken.ts): nada de formato proprio. O token
// identifica a assinatura (sub) e carrega o current_period_end de EMISSAO (pend),
// para detectar "ja renovada" (o periodo avancou). Validade: ate 7 dias depois do
// current_period_end da assinatura.

import { env } from "./env";
import {
  issueSignedToken,
  verifySignedTokenDetailed,
} from "./signedToken";

const PURPOSE = "boleto_renewal";
const GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias apos o vencimento

// Gera o token. Retorna null (sem crashar) se o secret nao estiver configurado,
// se o vencimento for invalido, ou se a janela (vencimento + 7d) ja passou.
export function issueRenewalToken(opts: {
  subscriptionId: string;
  currentPeriodEnd: string; // ISO
}): string | null {
  if (!env.renewalTokenSecret) return null;
  const periodEndMs = new Date(opts.currentPeriodEnd).getTime();
  if (!Number.isFinite(periodEndMs)) return null;
  const ttlMs = periodEndMs + GRACE_MS - Date.now();
  if (ttlMs <= 0) return null;
  return issueSignedToken({
    claims: { purpose: PURPOSE, sub: opts.subscriptionId, pend: periodEndMs },
    secret: env.renewalTokenSecret,
    ttlMs,
  });
}

export type RenewalTokenResult =
  | { status: "valid"; subscriptionId: string; periodEndMs: number }
  | { status: "invalid" }
  | { status: "expired" };

// Valida assinatura e prazo, distinguindo adulterado (invalid) de expirado
// (expired). Sem secret configurado = deny (invalid). Fail-closed.
export function verifyRenewalToken(token: string): RenewalTokenResult {
  if (!env.renewalTokenSecret) return { status: "invalid" };
  const res = verifySignedTokenDetailed<{ sub: string; pend: number }>({
    token,
    secret: env.renewalTokenSecret,
    expectedPurpose: PURPOSE,
  });
  if (res.status !== "valid") return res;
  const { sub, pend } = res.claims;
  if (typeof sub !== "string" || typeof pend !== "number") {
    return { status: "invalid" };
  }
  return { status: "valid", subscriptionId: sub, periodEndMs: pend };
}
