/**
 * QUANDO A TELA RECONSULTA A ASSINATURA SOZINHA.
 *
 * O polling de 3 minutos do SubscriptionContext existia so para quem NAO era
 * Pro: serve ao Pix pendente, que pode confirmar a qualquer momento. Quem ja
 * era Pro nunca reconsultava, e no dia do vencimento de uma assinatura MANUAL a
 * aba continuava dizendo Pro depois de o servidor ja negar (o acesso cai no
 * instante do `current_period_end`; a tela so cairia no F5).
 *
 * A regra e pura para o teste afirmar a tabela; o contexto fica com o
 * `setInterval`, que e encanamento.
 */
const JANELA_MS = 24 * 60 * 60 * 1000;

export function deveReconsultarAssinatura(input: {
  isPro: boolean;
  /** Payload de /api/billing/subscription, sem tipo fechado no contexto. */
  subscription: unknown;
  nowMs: number;
}): boolean {
  if (!input.isPro) return true;
  const sub = input.subscription;
  if (!sub || typeof sub !== "object") return false;
  const { renewal_type, current_period_end } = sub as {
    renewal_type?: unknown;
    current_period_end?: unknown;
  };
  if (renewal_type !== "manual") return false;
  if (typeof current_period_end !== "string") return false;
  const fimMs = new Date(current_period_end).getTime();
  if (!Number.isFinite(fimMs)) return false;
  // Menos de 24h do fim, ou ja passou dele (a janela ate o cron de expiracao
  // trocar o status): nos dois casos a tela precisa acompanhar o servidor.
  return fimMs - input.nowMs < JANELA_MS;
}
