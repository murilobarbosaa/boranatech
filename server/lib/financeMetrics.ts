import { supabaseAdmin } from "./supabaseAdmin";

// Metricas financeiras em regime de CAIXA. Fonte de verdade da receita:
// finance_transactions (Stripe), NUNCA plans.price_cents. Tudo em centavos
// inteiros. REGRA DE OURO: erro propaga; ausencia e estado nomeado; margem com
// receita <= 0 e null, nunca 0.

// Tipos que compoem a receita (payout e movimento pro banco, nao receita).
const REVENUE_TYPES: readonly string[] = [
  "charge",
  "refund",
  "adjustment",
  "dispute",
];

type FinanceTxRow = {
  type: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  plan_code: string | null;
  occurred_at: string;
};

type ExpenseOccurrenceInput = {
  kind: string;
  incurred_on: string;
  recurrence_start: string | null;
  recurrence_end: string | null;
  recurrence_interval: string | null;
};

type ExpenseRow = ExpenseOccurrenceInput & {
  amount_brl_cents: number;
  category: string;
};

export type FinanceSummary = {
  from: string;
  to: string;
  receitaBrutaCents: number;
  reembolsosCents: number;
  taxasStripeCents: number;
  receitaLiquidaCents: number;
  despesasCents: number;
  lucroCents: number;
  margemPercent: number | null;
  despesasPorCategoria: Array<{ category: string; cents: number }>;
  receitaPorPlano: Array<{ planCode: string; cents: number }>;
};

export type TimeseriesPoint = {
  month: string; // "YYYY-MM"
  receitaLiquidaCents: number;
  despesasCents: number;
  lucroCents: number;
};

export type DeferredRevenue = {
  deferredCents: number;
  consideredCount: number;
  unmappedCount: number;
};

function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

// Expande as ocorrencias de uma despesa dentro de [from, to] (inclusive):
// - one_off: 1 ocorrencia em incurred_on;
// - recurring monthly: uma por mes a partir de recurrence_start ate recurrence_end
//   (ou fim do intervalo consultado se ainda ativa);
// - recurring yearly: uma por ano, no mes de aniversario de recurrence_start.
// Funcao PURA, exportada para teste.
export function expenseOccurrences(
  expense: ExpenseOccurrenceInput,
  from: Date,
  to: Date,
): Date[] {
  const occ: Date[] = [];

  if (expense.kind === "one_off") {
    const d = new Date(expense.incurred_on);
    if (d >= from && d <= to) occ.push(d);
    return occ;
  }

  const start = new Date(expense.recurrence_start ?? expense.incurred_on);
  const hardEnd = expense.recurrence_end ? new Date(expense.recurrence_end) : to;
  const limit = to < hardEnd ? to : hardEnd;
  const stepMonths = expense.recurrence_interval === "yearly" ? 12 : 1;

  // Cap de seguranca (100 anos em passos mensais); a condicao real e d > limit.
  for (let k = 0; k < 1200; k += 1) {
    const d = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + k * stepMonths,
        start.getUTCDate(),
      ),
    );
    if (d > limit) break;
    if (d >= from) occ.push(d);
  }
  return occ;
}

async function loadTransactions(from: Date, to: Date): Promise<FinanceTxRow[]> {
  const { data, error } = await supabaseAdmin
    .from("finance_transactions")
    .select("type, gross_cents, fee_cents, net_cents, plan_code, occurred_at")
    .gte("occurred_at", from.toISOString())
    .lte("occurred_at", to.toISOString());
  if (error) {
    throw new Error(`finance_transactions query falhou: ${error.message}`);
  }
  return (data ?? []) as FinanceTxRow[];
}

async function loadExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabaseAdmin
    .from("expenses")
    .select(
      "amount_brl_cents, category, kind, incurred_on, recurrence_start, recurrence_end, recurrence_interval",
    );
  if (error) throw new Error(`expenses query falhou: ${error.message}`);
  return (data ?? []) as ExpenseRow[];
}

export async function getFinanceSummary(params: {
  from: Date;
  to: Date;
}): Promise<FinanceSummary> {
  const { from, to } = params;
  const txs = await loadTransactions(from, to);

  let receitaBrutaCents = 0;
  let reembolsosCents = 0;
  let taxasStripeCents = 0;
  let receitaLiquidaCents = 0;
  const porPlano = new Map<string, number>();

  for (const t of txs) {
    if (!REVENUE_TYPES.includes(t.type)) continue; // exclui payout
    taxasStripeCents += t.fee_cents;
    receitaLiquidaCents += t.net_cents;
    if (t.type === "charge") {
      receitaBrutaCents += t.gross_cents;
      const key = t.plan_code ?? "nao_atribuido";
      porPlano.set(key, (porPlano.get(key) ?? 0) + t.net_cents);
    }
    if (t.type === "refund") {
      reembolsosCents += Math.abs(t.gross_cents);
    }
  }

  const expenses = await loadExpenses();
  let despesasCents = 0;
  const porCategoria = new Map<string, number>();
  for (const e of expenses) {
    const count = expenseOccurrences(e, from, to).length;
    if (count === 0) continue;
    const cents = count * e.amount_brl_cents;
    despesasCents += cents;
    porCategoria.set(e.category, (porCategoria.get(e.category) ?? 0) + cents);
  }

  const lucroCents = receitaLiquidaCents - despesasCents;
  const margemPercent =
    receitaLiquidaCents > 0 ? (lucroCents / receitaLiquidaCents) * 100 : null;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    receitaBrutaCents,
    reembolsosCents,
    taxasStripeCents,
    receitaLiquidaCents,
    despesasCents,
    lucroCents,
    margemPercent,
    despesasPorCategoria: Array.from(porCategoria, ([category, cents]) => ({
      category,
      cents,
    })),
    receitaPorPlano: Array.from(porPlano, ([planCode, cents]) => ({
      planCode,
      cents,
    })),
  };
}

export async function getFinanceTimeseries(params: {
  from: Date;
  to: Date;
  granularity?: "month";
}): Promise<TimeseriesPoint[]> {
  const { from, to } = params;

  const buckets = new Map<string, { receita: number; despesa: number }>();
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  const endY = to.getUTCFullYear();
  const endM = to.getUTCMonth();
  while (y < endY || (y === endY && m <= endM)) {
    buckets.set(monthKey(y, m), { receita: 0, despesa: 0 });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }

  const txs = await loadTransactions(from, to);
  for (const t of txs) {
    if (!REVENUE_TYPES.includes(t.type)) continue;
    const d = new Date(t.occurred_at);
    const key = monthKey(d.getUTCFullYear(), d.getUTCMonth());
    const bucket = buckets.get(key);
    if (bucket) bucket.receita += t.net_cents;
  }

  const expenses = await loadExpenses();
  for (const e of expenses) {
    for (const occ of expenseOccurrences(e, from, to)) {
      const key = monthKey(occ.getUTCFullYear(), occ.getUTCMonth());
      const bucket = buckets.get(key);
      if (bucket) bucket.despesa += e.amount_brl_cents;
    }
  }

  return Array.from(buckets, ([month, v]) => ({
    month,
    receitaLiquidaCents: v.receita,
    despesasCents: v.despesa,
    lucroCents: v.receita - v.despesa,
  }));
}

type DeferredSubRow = {
  user_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  plans: { interval?: string | null } | { interval?: string | null }[] | null;
};

// Quanto da receita ja recebida se refere a periodos FUTUROS (planos semestral/
// anual ainda em vigencia). Usa o valor REAL cobrado (finance_transactions),
// nunca plans.price_cents. Assinatura que nao mapeia para uma cobranca real
// entra em unmappedCount (nao inventa).
export async function getDeferredRevenue(): Promise<DeferredRevenue> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, current_period_start, current_period_end, plans(interval)")
    .in("status", ["active", "trialing"])
    .gt("current_period_end", nowIso);
  if (error) throw new Error(`subscriptions query falhou: ${error.message}`);

  const subs = (data ?? []) as DeferredSubRow[];
  let deferredCents = 0;
  let consideredCount = 0;
  let unmappedCount = 0;

  for (const s of subs) {
    const plan = Array.isArray(s.plans) ? s.plans[0] : s.plans;
    const interval = plan?.interval ?? "";
    if (interval !== "semiannual" && interval !== "year") continue;
    if (!s.user_id || !s.current_period_start || !s.current_period_end) continue;

    const pStart = new Date(s.current_period_start).getTime();
    const pEnd = new Date(s.current_period_end).getTime();
    if (pEnd <= now || pEnd <= pStart) continue;
    consideredCount += 1;

    const { data: chargeData, error: chargeError } = await supabaseAdmin
      .from("finance_transactions")
      .select("gross_cents")
      .eq("type", "charge")
      .eq("user_id", s.user_id)
      .gte("occurred_at", new Date(pStart - 3 * 24 * 60 * 60 * 1000).toISOString())
      .lte("occurred_at", s.current_period_end)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (chargeError) {
      throw new Error(`finance_transactions charge lookup falhou: ${chargeError.message}`);
    }
    const charge = chargeData as { gross_cents: number } | null;
    if (!charge) {
      unmappedCount += 1;
      continue;
    }

    const remaining = pEnd - now;
    const total = pEnd - pStart;
    deferredCents += Math.round(charge.gross_cents * (remaining / total));
  }

  return { deferredCents, consideredCount, unmappedCount };
}
