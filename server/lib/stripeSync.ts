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
  // Payment intent da COBRANCA. Existe para o unico caso em que o customer nao
  // vem: boleto em `mode: payment`, onde a Stripe nao anexa customer a charge.
  paymentIntentId: string | null;
};

export type FinanceOwner = { userId: string | null; planCode: string | null };

// Lookups de dono injetados (funcao pura): o teste exercita a DECISAO de
// atribuicao sem Postgres nem rede.
/** Dono resolvido pela sessao de checkout ligada ao payment intent. */
export type DonoPorPaymentIntent = {
  /** subscriptions.user_id: escrito por nos ao resolver a pessoa. */
  userId: string | null;
  planCode: string | null;
  /** metadata.supabase_user_id da sessao: corroboracao, nao fonte. */
  metadataUserId: string | null;
};

export type PaymentIntentLookups = {
  byPaymentIntent: (
    paymentIntentId: string,
  ) => Promise<DonoPorPaymentIntent | null>;
};

/**
 * Dono de uma cobranca de BOLETO, que nao tem customer.
 *
 * Boleto em `mode: payment` nao anexa customer a charge, entao
 * resolveByCustomer nunca resolve e a linha ficaria sem dono PARA SEMPRE: o
 * campo nao vai aparecer depois. O vinculo ja existe no BANCO, sem chamar a
 * Stripe: a subscription de boleto guarda o EVENTO inteiro em
 * raw_provider_payload, e a sessao dentro dele (data.object) carrega o
 * payment_intent da cobranca.
 *
 * FONTE DA VERDADE: subscriptions.user_id, coluna que o proprio webhook escreve
 * depois de resolver a pessoa. O metadata.supabase_user_id da sessao e apenas
 * CORROBORACAO: e uma string que nos mandamos a Stripe e lemos de volta, entao
 * vale como segunda opiniao, nao como fonte. Divergencia entre as duas NAO
 * resolve: atribuir dinheiro a pessoa errada e pior que deixar sem dono.
 *
 * Falha de lookup nao derruba o sync: null e aviso, e o proximo run tenta de
 * novo. Mesma postura de resolveOwnerFromParentCharge.
 */
export async function resolveOwnerFromPaymentIntent(
  paymentIntentId: string,
  lookups: PaymentIntentLookups,
): Promise<FinanceOwner> {
  try {
    const achado = await lookups.byPaymentIntent(paymentIntentId);
    if (!achado?.userId) return { userId: null, planCode: null };

    if (achado.metadataUserId && achado.metadataUserId !== achado.userId) {
      console.warn(
        `[stripeSync] payment intent ${paymentIntentId}: subscriptions.user_id (${achado.userId}) ` +
          `diverge do metadata.supabase_user_id (${achado.metadataUserId}); linha entra SEM dono.`,
      );
      return { userId: null, planCode: null };
    }

    return { userId: achado.userId, planCode: achado.planCode };
  } catch (err) {
    console.warn(
      `[stripeSync] nao foi possivel resolver o dono pelo payment intent ${paymentIntentId}; ` +
        `a linha entra sem user_id e o proximo sync tenta de novo:`,
      err,
    );
    return { userId: null, planCode: null };
  }
}

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
    paymentIntentId: null,
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
      paymentIntentId: readIdOrString(
        (source as { payment_intent?: unknown }).payment_intent,
      ),
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
    throw new Error(
      `lookup de subscription por customer falhou: ${error.message}`,
    );
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

/**
 * Dono pela sessao de checkout que carrega este payment intent.
 *
 * SEM chamar a Stripe: `subscriptions.raw_provider_payload` guarda o evento
 * `checkout.session.completed` inteiro, e a sessao (data.object) tem o
 * payment_intent. Filtro por caminho JSON do PostgREST, conferido contra o
 * banco real antes de escrever isto.
 */
async function ownerByPaymentIntent(
  paymentIntentId: string,
): Promise<DonoPorPaymentIntent | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, raw_provider_payload, plans(code)")
    .eq("raw_provider_payload->data->object->>payment_intent", paymentIntentId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `lookup de subscription por payment intent falhou: ${error.message}`,
    );
  }
  if (!data) return null;

  const row = data as SubscriptionLookup & { raw_provider_payload?: unknown };
  const plan = Array.isArray(row.plans) ? row.plans[0] : row.plans;

  // metadata.supabase_user_id da sessao, para corroborar (ver docstring de
  // resolveOwnerFromPaymentIntent).
  const evento = row.raw_provider_payload as
    | { data?: { object?: { metadata?: Record<string, unknown> } } }
    | null
    | undefined;
  const metadataUserId = evento?.data?.object?.metadata?.supabase_user_id;

  return {
    userId: row.user_id ?? null,
    planCode: plan?.code ?? null,
    metadataUserId: typeof metadataUserId === "string" ? metadataUserId : null,
  };
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
  // Cache por payment intent: um boleto pode gerar mais de uma linha e a
  // consulta e a mesma. Mesmo motivo do cache da cobranca-mae.
  const paymentIntentCache = new Map<string, FinanceOwner>();

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
    } else if (refs.paymentIntentId) {
      // FALLBACK, nao caminho principal: so chega aqui quem nao tem customer,
      // que na pratica e boleto em `mode: payment`. Cartao continua resolvendo
      // pelo ramo de cima, intocado.
      let resolved = paymentIntentCache.get(refs.paymentIntentId);
      if (!resolved) {
        resolved = await resolveOwnerFromPaymentIntent(refs.paymentIntentId, {
          byPaymentIntent: ownerByPaymentIntent,
        });
        paymentIntentCache.set(refs.paymentIntentId, resolved);
      }
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
