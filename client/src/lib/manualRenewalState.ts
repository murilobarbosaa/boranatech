/**
 * O ESTADO DE RENOVACAO MANUAL que o Perfil mostra.
 *
 *   vigente   manual e ativa: a data do fim e quantos dias faltam, com o botao
 *             de renovar sempre visivel (a ancora garante que pagar antes nao
 *             perde dias).
 *   expired   o servidor derivou `expired` (manual com periodo passado): o
 *             cartao de "seu Pro terminou", com o mesmo botao.
 *   null      nao e manual, ou nao ha o que dizer.
 *
 * Pura, para o teste afirmar a tabela; o Perfil fica com o fetch e o modal.
 */
const DIA_MS = 24 * 60 * 60 * 1000;

export type EstadoDaRenovacaoManual =
  | { kind: "vigente"; periodEnd: string; days: number }
  | { kind: "expired"; periodEnd: string | null };

export function estadoDaRenovacaoManual(
  sub: {
    status?: string | null;
    renewal_type?: string | null;
    current_period_end?: string | null;
  } | null,
  nowMs: number,
): EstadoDaRenovacaoManual | null {
  if (!sub || sub.renewal_type !== "manual") return null;
  if (sub.status === "expired") {
    return { kind: "expired", periodEnd: sub.current_period_end ?? null };
  }
  if (sub.status !== "active" || !sub.current_period_end) return null;
  const fimMs = new Date(sub.current_period_end).getTime();
  if (!Number.isFinite(fimMs)) return null;
  // Arredonda para CIMA: "vence em 7 dias" com 6,2 dias restantes e verdade
  // sobre o dia civil; "6 dias" faria a pessoa achar que tem um dia a menos.
  const days = Math.max(0, Math.ceil((fimMs - nowMs) / DIA_MS));
  return { kind: "vigente", periodEnd: sub.current_period_end, days };
}
