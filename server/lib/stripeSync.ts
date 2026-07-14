import type Stripe from "stripe";

import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// Sincroniza a RECEITA da Stripe (balance transactions, regime de CAIXA) para
// finance_transactions. Idempotente pelo stripe_balance_transaction_id. Erro de
// API ou de banco PROPAGA: nunca retorna parcial fingindo sucesso.

type FinanceType = "charge" | "refund" | "adjustment" | "dispute" | "payout";

// Tipos da Stripe que representam movimento de dinheiro que nos importa. Tipos
// fora do mapa (stripe_fee, application_fee, payout_failure, etc.) sao pulados
// DE PROPOSITO (contados em `skipped`).
const TYPE_MAP: Record<string, FinanceType> = {
  charge: "charge",
  payment: "charge",
  refund: "refund",
  payment_refund: "refund",
  adjustment: "adjustment",
  dispute: "dispute",
  payout: "payout",
};

export type SyncResult = {
  processed: number;
  upserted: number;
  skipped: number;
};

type Refs = {
  chargeId: string | null;
  invoiceId: string | null;
  customerId: string | null;
};

// Le um campo que pode ser um id (string) ou um objeto expandido ({ id }). Usa
// unknown (nao any) para tolerar variacoes de shape entre versoes do SDK.
function readIdOrString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

// Extrai charge/invoice/customer da source expandida. Refund/dispute/payout nao
// resolvem customer aqui de forma confiavel: retornam null (estado legitimo).
function extractRefs(source: Stripe.BalanceTransaction["source"]): Refs {
  if (!source) return { chargeId: null, invoiceId: null, customerId: null };
  if (typeof source === "string") {
    return { chargeId: source, invoiceId: null, customerId: null };
  }
  if (source.object === "charge") {
    return {
      chargeId: source.id,
      invoiceId: readIdOrString((source as { invoice?: unknown }).invoice),
      customerId: readIdOrString((source as { customer?: unknown }).customer),
    };
  }
  if (source.object === "refund") {
    return {
      chargeId: readIdOrString((source as { charge?: unknown }).charge),
      invoiceId: null,
      customerId: null,
    };
  }
  return { chargeId: null, invoiceId: null, customerId: null };
}

type SubscriptionLookup = {
  user_id: string | null;
  plans: { code?: string | null } | { code?: string | null }[] | null;
};

// Resolve user_id/plan_code pelo provider_customer_id que ja guardamos em
// subscriptions. Nunca inventa: sem match, null. Erro de banco propaga.
async function resolveByCustomer(
  customerId: string,
): Promise<{ userId: string | null; planCode: string | null }> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, plans(code)")
    .eq("provider_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`lookup de subscription por customer falhou: ${error.message}`);
  }
  const row = data as SubscriptionLookup | null;
  if (!row) return { userId: null, planCode: null };
  const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans;
  return { userId: row.user_id ?? null, planCode: plan?.code ?? null };
}

export async function syncBalanceTransactions(
  params: { since?: Date } = {},
): Promise<SyncResult> {
  const stripe = getStripe();

  const listParams: Stripe.BalanceTransactionListParams = {
    limit: 100,
    expand: ["data.source"],
  };
  if (params.since) {
    listParams.created = { gte: Math.floor(params.since.getTime() / 1000) };
  }

  const customerCache = new Map<
    string,
    { userId: string | null; planCode: string | null }
  >();

  let processed = 0;
  let upserted = 0;
  let skipped = 0;

  // Auto-paginacao percorre TODAS as paginas. Erro de API propaga (sem catch).
  for await (const bt of stripe.balanceTransactions.list(listParams)) {
    processed += 1;
    const mappedType = TYPE_MAP[bt.type];
    if (!mappedType) {
      skipped += 1;
      continue;
    }

    const refs = extractRefs(bt.source);
    let userId: string | null = null;
    let planCode: string | null = null;
    if (refs.customerId) {
      let resolved = customerCache.get(refs.customerId);
      if (!resolved) {
        resolved = await resolveByCustomer(refs.customerId);
        customerCache.set(refs.customerId, resolved);
      }
      userId = resolved.userId;
      planCode = resolved.planCode;
    }

    const { error } = await supabaseAdmin.from("finance_transactions").upsert(
      {
        stripe_balance_transaction_id: bt.id,
        stripe_charge_id: refs.chargeId,
        stripe_invoice_id: refs.invoiceId,
        type: mappedType,
        gross_cents: bt.amount,
        fee_cents: bt.fee,
        net_cents: bt.net,
        currency: bt.currency.toUpperCase(),
        occurred_at: new Date(bt.created * 1000).toISOString(),
        user_id: userId,
        plan_code: planCode,
        raw_payload: bt,
      },
      { onConflict: "stripe_balance_transaction_id" },
    );
    if (error) {
      throw new Error(
        `upsert finance_transaction ${bt.id} falhou: ${error.message}`,
      );
    }
    upserted += 1;
  }

  return { processed, upserted, skipped };
}
