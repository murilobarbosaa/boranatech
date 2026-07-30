import type Stripe from "stripe";

import { env } from "./env";
import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// Sincroniza a RECEITA da Stripe (balance transactions, regime de CAIXA) para
// finance_transactions. Idempotente pelo stripe_balance_transaction_id. Erro de
// API ou de banco PROPAGA: nunca retorna parcial fingindo sucesso.

// Hosts que identificam um Supabase LOCAL (supabase start / CLI). Qualquer
// outro host e tratado como producao: fail-closed, na duvida nao grava.
const LOCAL_SUPABASE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

// Mesmo fallback do supabaseAdmin: a guarda precisa julgar exatamente a URL em
// que o client escreve.
function resolvedSupabaseUrl(): string {
  return env.supabaseUrl || "http://localhost:54321";
}

export function isLocalSupabaseUrl(url: string): boolean {
  try {
    return LOCAL_SUPABASE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function supabaseHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export type StripeKeyMode = "test" | "live" | "unknown";

export function stripeKeyMode(key: string): StripeKeyMode {
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return "test";
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) return "live";
  return "unknown";
}

// Guarda de ambiente (incidente de 2026-07: o sync rodou com sk_test_ apontando
// o Supabase de producao e gravou receita de sandbox em finance_transactions).
// Banco NAO local exige chave live confirmada pelo prefixo; qualquer outra
// combinacao (test ou prefixo desconhecido) aborta ANTES da primeira escrita.
// Chave de teste com banco local segue permitida: e o desenvolvimento normal.
function assertKeyMatchesDatabase(): void {
  const supabaseUrl = resolvedSupabaseUrl();
  if (isLocalSupabaseUrl(supabaseUrl)) return;
  const mode = stripeKeyMode(env.stripeSecretKey);
  if (mode === "live") return;
  const message =
    `[stripeSync] SYNC ABORTADO: STRIPE_SECRET_KEY ${mode === "test" ? "de TESTE (sk_test_)" : "com prefixo desconhecido"} ` +
    `com Supabase de producao (${supabaseHost(supabaseUrl)}). ` +
    `Nada foi gravado em finance_transactions.`;
  console.error(message);
  throw new Error(message);
}

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
  // Id da cobranca-MAE, preenchido SO quando sabemos por ESTRUTURA que o
  // chargeId veio de um objeto refund/dispute expandido (source.charge), e nao
  // do proprio objeto cobranca. E a diferenca entre "este id E a cobranca" e
  // "este id APONTA para a cobranca", e e o que autoriza o retrieve na Stripe:
  // uma `source` que chegou como string crua pode ser um `re_...`, e pedir
  // charges.retrieve com id de refund seria erro garantido. Distincao
  // estrutural de proposito, nunca por prefixo do id.
  parentChargeId: string | null;
};

export type FinanceOwner = { userId: string | null; planCode: string | null };

// Lookups de dono injetados (funcao pura): o teste exercita a DECISAO de
// atribuicao sem Postgres nem rede.
export type OwnerLookups = {
  /** Dono da linha de charge JA gravada em finance_transactions. */
  byCharge: (chargeId: string) => Promise<FinanceOwner | null>;
  /** Customer da cobranca lido na API da Stripe. */
  customerOfCharge: (chargeId: string) => Promise<string | null>;
  /** Dono a partir do provider_customer_id em subscriptions. */
  byCustomer: (customerId: string) => Promise<FinanceOwner>;
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

// Le o livemode da source expandida (defesa em profundidade da guarda de
// ambiente). O proprio balance transaction NAO expoe livemode; charge, payout
// e dispute expandidos expoem, refund nao. null = sinal indisponivel nesta
// linha (a guarda de chave em assertKeyMatchesDatabase segue cobrindo).
function readSourceLivemode(
  source: Stripe.BalanceTransaction["source"],
): boolean | null {
  if (!source || typeof source === "string") return null;
  const livemode = (source as { livemode?: unknown }).livemode;
  return typeof livemode === "boolean" ? livemode : null;
}

// Extrai charge/invoice/customer da source expandida. Refund e dispute nao
// expoem customer, mas expoem `charge`: por ele o dono e alcancavel
// (resolveOwnerFromParentCharge). Payout nao resolve nada aqui.
export function extractRefs(source: Stripe.BalanceTransaction["source"]): Refs {
  const vazio: Refs = {
    chargeId: null,
    invoiceId: null,
    customerId: null,
    parentChargeId: null,
  };
  if (!source) return vazio;
  if (typeof source === "string") {
    // Sem expansao nao da para saber se este id e de charge ou de refund, entao
    // ele NAO vira parentChargeId (ver comentario do campo).
    return { ...vazio, chargeId: source };
  }
  if (source.object === "charge") {
    return {
      chargeId: source.id,
      invoiceId: readIdOrString((source as { invoice?: unknown }).invoice),
      customerId: readIdOrString((source as { customer?: unknown }).customer),
      parentChargeId: null,
    };
  }
  if (source.object === "refund" || source.object === "dispute") {
    const chargeId = readIdOrString((source as { charge?: unknown }).charge);
    return { ...vazio, chargeId, parentChargeId: chargeId };
  }
  return vazio;
}

// Dono de um refund/dispute, a partir da cobranca-mae. Duas camadas:
//
//   1. a linha de charge JA gravada em finance_transactions (gratis);
//   2. a API da Stripe, quando (1) nao respondeu.
//
// A camada 2 existe porque a lista de balance transactions vem da MAIS NOVA
// para a mais antiga: o refund e processado ANTES da propria cobranca no mesmo
// run, e a cobranca pode ainda nem estar no banco (refund de uma venda anterior
// a janela do sync). ESCOLHA DELIBERADA: resolver via Stripe em vez de deixar
// NULL para "um proximo sync resolver". Deixar NULL nao converge, porque os
// syncs rodam em janela deslizante (2 dias no webhook, janela do cron diario):
// se a cobranca-mae for mais velha que a janela, nenhum sync futuro a
// reencontra e a linha fica errada PARA SEMPRE. O custo e uma chamada por
// refund nao resolvido, cacheada por run.
//
// Falha da Stripe NAO derruba o sync: devolve null e a linha entra sem dono,
// que e recuperavel (o proximo sync tenta de novo) ao contrario de abortar o
// run inteiro por causa de um refund antigo.
export async function resolveOwnerFromParentCharge(
  parentChargeId: string,
  lookups: OwnerLookups,
): Promise<FinanceOwner> {
  const doBanco = await lookups.byCharge(parentChargeId);
  // Linha de charge presente mas ORFA (user_id null) nao e resposta: e a mesma
  // lacuna que estamos fechando, entao segue para a Stripe.
  if (doBanco?.userId) return doBanco;

  try {
    const customerId = await lookups.customerOfCharge(parentChargeId);
    if (!customerId) return { userId: null, planCode: null };
    return await lookups.byCustomer(customerId);
  } catch (err) {
    console.warn(
      `[stripeSync] nao foi possivel resolver o dono da cobranca ${parentChargeId} na Stripe; ` +
        `a linha entra sem user_id e o proximo sync tenta de novo:`,
      err,
    );
    return { userId: null, planCode: null };
  }
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

// Dono da linha de CHARGE ja gravada, pelo stripe_charge_id. Sem match, null
// (nao e erro: a cobranca pode ainda nao ter sido ingerida). Erro de banco
// propaga, igual ao resolveByCustomer.
async function ownerOfChargeRow(
  chargeId: string,
): Promise<FinanceOwner | null> {
  const { data, error } = await supabaseAdmin
    .from("finance_transactions")
    .select("user_id, plan_code")
    .eq("stripe_charge_id", chargeId)
    .eq("type", "charge")
    .limit(1);
  if (error) {
    throw new Error(
      `lookup de finance_transaction por charge falhou: ${error.message}`,
    );
  }
  const row = data?.[0];
  if (!row) return null;
  return { userId: row.user_id ?? null, planCode: row.plan_code ?? null };
}

// Customer da cobranca lido na API da Stripe. Erro PROPAGA para quem chama
// decidir (resolveOwnerFromParentCharge trata como "sem dono", nao como falha
// do sync).
async function customerOfChargeFromStripe(
  chargeId: string,
): Promise<string | null> {
  const charge = await getStripe().charges.retrieve(chargeId);
  return readIdOrString((charge as { customer?: unknown }).customer);
}

export async function syncBalanceTransactions(
  params: { since?: Date } = {},
): Promise<SyncResult> {
  assertKeyMatchesDatabase();
  const databaseIsLocal = isLocalSupabaseUrl(resolvedSupabaseUrl());

  const stripe = getStripe();

  const listParams: Stripe.BalanceTransactionListParams = {
    limit: 100,
    expand: ["data.source"],
  };
  if (params.since) {
    listParams.created = { gte: Math.floor(params.since.getTime() / 1000) };
  }

  const customerCache = new Map<string, FinanceOwner>();
  // Cache do dono por cobranca-mae: uma mesma cobranca pode gerar varias linhas
  // (reembolso parcial em parcelas, disputa depois do reembolso), e sem isto
  // cada uma repetiria o charges.retrieve.
  const parentChargeCache = new Map<string, FinanceOwner>();

  const ownerLookups: OwnerLookups = {
    byCharge: ownerOfChargeRow,
    customerOfCharge: customerOfChargeFromStripe,
    byCustomer: async (customerId) => {
      let resolved = customerCache.get(customerId);
      if (!resolved) {
        resolved = await resolveByCustomer(customerId);
        customerCache.set(customerId, resolved);
      }
      return resolved;
    },
  };

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

    // Guarda POR LINHA: dado de sandbox NUNCA entra num banco de producao,
    // independente da chave que listou. Aborta na primeira linha suspeita (o
    // upsert e idempotente: as linhas ja gravadas passaram nas duas guardas).
    if (!databaseIsLocal && readSourceLivemode(bt.source) === false) {
      const message =
        `[stripeSync] SYNC ABORTADO: balance transaction ${bt.id} tem ` +
        `livemode:false (dado de TESTE) e o Supabase e de producao. ` +
        `Esta linha NAO foi gravada em finance_transactions.`;
      console.error(message);
      throw new Error(message);
    }

    const refs = extractRefs(bt.source);
    let userId: string | null = null;
    let planCode: string | null = null;
    if (refs.customerId) {
      const resolved = await ownerLookups.byCustomer(refs.customerId);
      userId = resolved.userId;
      planCode = resolved.planCode;
    } else if (refs.parentChargeId) {
      // Refund e dispute: o dono vem da cobranca-mae. Sem isto a linha entrava
      // com user_id NULL e o "Valor pago (total)" por usuario nunca descontava
      // devolucao nem chargeback.
      let resolved = parentChargeCache.get(refs.parentChargeId);
      if (!resolved) {
        resolved = await resolveOwnerFromParentCharge(
          refs.parentChargeId,
          ownerLookups,
        );
        parentChargeCache.set(refs.parentChargeId, resolved);
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
