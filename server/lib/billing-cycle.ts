// Regra de ciclo de cobranca compartilhada entre o webhook (billing.ts) e o
// cron reconciliador (cron.ts). Fonte unica para evitar divergencia.

export const PLAN_CYCLE_MONTHS: Record<string, number> = {
  pro_monthly: 1,
  pro_semiannual: 6,
  pro_annual: 12,
};

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
