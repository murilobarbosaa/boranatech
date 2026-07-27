import type Stripe from "stripe";

import { getStripe } from "./stripeClient";
import { supabaseAdmin } from "./supabaseAdmin";

// Deteccao de PAGAMENTO ORFAO: Checkout Session paga na Stripe sem linha
// correspondente em public.subscriptions.
//
// Por que este job existe: o reconcile-subscriptions parte das linhas que JA
// existem em subscriptions e pergunta a Stripe qual o estado delas. Ele nunca
// pergunta o contrario. Entao um checkout.session.completed que morra num dos
// returns mudos de providers/stripe.ts (sem supabase_user_id no metadata, sem
// plano resolvivel, session sem subscription) responde 200, nao cria linha, e
// fica invisivel para sempre: nao ha linha para reconciliar. Este e o unico
// caminho que vai da Stripe para o banco.
//
// O job SO DETECTA. Nao promove ninguem, nao escreve em subscriptions, nao manda
// e-mail. Auto-cura e decisao separada.

const DAY_MS = 24 * 60 * 60 * 1000;

// Janela de varredura padrao. 7 dias cobre com folga o pior caso de retry da
// Stripe (~3 dias) e ainda e barato: uma listagem paginada por execucao.
export const DEFAULT_WINDOW_DAYS = 7;
const MIN_WINDOW_DAYS = 1;
const MAX_WINDOW_DAYS = 90;

// Carencia antes de considerar orfa. O webhook e assincrono: uma session paga ha
// 30 segundos pode nao ter linha ainda, e isso e normal, nao incidente. 15
// minutos e muito acima da latencia real (os eventos observados chegam em
// segundos) e muito abaixo da janela, entao nao esconde nada de verdade.
const GRACE_MS = 15 * 60 * 1000;

// PostgREST tem limite pratico de tamanho de URL; o filtro .in() vira query
// string. 100 chaves por lote e o mesmo tamanho de pagina que usamos na Stripe.
const LOOKUP_CHUNK = 100;

// Pagamento efetivo. 'no_payment_required' entra de proposito: e o que a Stripe
// devolve num mode:subscription 100% descontado, onde nao houve cobranca mas a
// assinatura DEVE existir. 'unpaid' fica de fora (boleto emitido e nao pago).
const PAID_STATUSES = new Set(["paid", "no_payment_required"]);

// Só os modos que o produto cria. 'setup' tambem devolve 'no_payment_required' e
// nao representa assinatura nenhuma; se um dia aparecer, nao vira falso positivo.
const PRODUCT_MODES = new Set(["subscription", "payment"]);

export interface OrphanPaymentFinding {
  sessionId: string;
  /** Chave que deveria estar em subscriptions.provider_subscription_id. */
  expectedProviderSubscriptionId: string;
  supabaseUserId: string | null;
  customerEmail: string | null;
  planId: string | null;
  amountTotalCents: number | null;
  currency: string | null;
  paymentStatus: string | null;
  mode: string | null;
  sessionCreatedAt: string;
}

export interface OrphanPaymentScan {
  windowDays: number;
  /** Sessions pagas encontradas na janela (antes da carencia). */
  paidSessions: number;
  /** Pagas mas recentes demais para julgar. */
  skippedRecent: number;
  orphans: number;
  /** Orfas que ainda nao estavam registradas. */
  newOrphans: number;
  /** false quando a tabela de registro nao respondeu (ver migration). */
  persisted: boolean;
  findings: OrphanPaymentFinding[];
}

export function clampWindowDays(raw: unknown): number {
  const parsed =
    typeof raw === "string"
      ? Number.parseInt(raw, 10)
      : typeof raw === "number"
        ? raw
        : Number.NaN;
  if (!Number.isFinite(parsed)) return DEFAULT_WINDOW_DAYS;
  return Math.min(MAX_WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, parsed));
}

// Boleto nao gera subscription na Stripe: a linha e chaveada pelo id da Checkout
// Session (cs_...). Cartao usa o id da subscription (sub_...). Mesma regra de
// providers/stripe.ts, senao a busca no banco erra o alvo e tudo vira orfao.
function expectedKeyOf(session: Stripe.Checkout.Session): string {
  const sub = session.subscription;
  if (typeof sub === "string") return sub;
  if (sub?.id) return sub.id;
  return session.id;
}

function toFinding(session: Stripe.Checkout.Session): OrphanPaymentFinding {
  const metadata = session.metadata ?? {};
  return {
    sessionId: session.id,
    expectedProviderSubscriptionId: expectedKeyOf(session),
    supabaseUserId:
      metadata.supabase_user_id || session.client_reference_id || null,
    customerEmail: session.customer_email ?? null,
    planId: metadata.plan_id || null,
    amountTotalCents: session.amount_total ?? null,
    currency: session.currency ?? null,
    paymentStatus: session.payment_status ?? null,
    mode: session.mode ?? null,
    sessionCreatedAt: new Date(session.created * 1000).toISOString(),
  };
}

async function findExistingKeys(keys: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < keys.length; i += LOOKUP_CHUNK) {
    const chunk = keys.slice(i, i + LOOKUP_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_subscription_id")
      .in("provider_subscription_id", chunk);
    // Fail-loud: um erro aqui faria TODA session do lote parecer orfa. Melhor
    // derrubar o job (o cron registra o erro) do que gritar falso positivo.
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.provider_subscription_id) found.add(row.provider_subscription_id);
    }
  }
  return found;
}

// Persistencia fail-soft: se a tabela ainda nao existe (migration nao aplicada)
// ou o insert falha, o job NAO morre. O achado ja foi para o console em nivel de
// erro e vai inteiro para cron_run_logs.payload, que existe desde sempre. Perder
// o registro bonito e ruim; perder a deteccao e pior.
async function persistFindings(
  findings: OrphanPaymentFinding[],
): Promise<{ persisted: boolean; newOrphans: number }> {
  if (findings.length === 0) return { persisted: true, newOrphans: 0 };

  const nowIso = new Date().toISOString();
  const rows = findings.map((f) => ({
    stripe_session_id: f.sessionId,
    expected_provider_subscription_id: f.expectedProviderSubscriptionId,
    supabase_user_id: f.supabaseUserId,
    customer_email: f.customerEmail,
    plan_id: f.planId,
    amount_total_cents: f.amountTotalCents,
    currency: f.currency,
    payment_status: f.paymentStatus,
    session_mode: f.mode,
    session_created_at: f.sessionCreatedAt,
    detected_at: nowIso,
    last_seen_at: nowIso,
  }));

  // ignoreDuplicates: a janela e deslizante, entao o mesmo orfao reaparece a cada
  // execucao. So o INSERT real volta linha, e e isso que conta como "novo".
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("billing_orphan_payments")
    .upsert(rows, {
      onConflict: "stripe_session_id",
      ignoreDuplicates: true,
    })
    .select("stripe_session_id");

  if (insertError) {
    console.error(
      "[orphan-payments] falha ao registrar orfaos (a deteccao vale, o registro nao foi gravado):",
      insertError,
    );
    return { persisted: false, newOrphans: 0 };
  }

  // Carimba a re-observacao nas que ja existiam, para dar a leitura de "isso
  // continua em aberto" sem duplicar linha.
  const { error: touchError } = await supabaseAdmin
    .from("billing_orphan_payments")
    .update({ last_seen_at: nowIso })
    .in(
      "stripe_session_id",
      findings.map((f) => f.sessionId),
    )
    .is("resolved_at", null);
  if (touchError) {
    console.warn(
      "[orphan-payments] falha ao atualizar last_seen_at:",
      touchError,
    );
  }

  return { persisted: true, newOrphans: inserted?.length ?? 0 };
}

export async function detectOrphanPayments(
  options: { windowDays?: number } = {},
): Promise<OrphanPaymentScan> {
  const windowDays = clampWindowDays(options.windowDays);
  const now = Date.now();
  const since = Math.floor((now - windowDays * DAY_MS) / 1000);
  const graceCutoffMs = now - GRACE_MS;

  const stripe = getStripe();
  const candidates: Stripe.Checkout.Session[] = [];
  let paidSessions = 0;
  let skippedRecent = 0;

  // Auto-paginacao percorre todas as paginas. Erro de API propaga (sem catch):
  // uma listagem parcial produziria falso "sem orfaos".
  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    created: { gte: since },
  })) {
    if (!PAID_STATUSES.has(session.payment_status ?? "")) continue;
    if (!PRODUCT_MODES.has(session.mode ?? "")) continue;
    paidSessions += 1;
    if (session.created * 1000 > graceCutoffMs) {
      skippedRecent += 1;
      continue;
    }
    candidates.push(session);
  }

  const findings: OrphanPaymentFinding[] = [];
  if (candidates.length > 0) {
    const existing = await findExistingKeys(
      candidates.map((s) => expectedKeyOf(s)),
    );
    for (const session of candidates) {
      if (existing.has(expectedKeyOf(session))) continue;
      findings.push(toFinding(session));
    }
  }

  // Nivel de erro por orfao, com tudo que identifica o caso sem precisar do
  // painel: quem, quanto, quando e qual chave deveria existir no banco.
  for (const f of findings) {
    console.error(
      `[orphan-payments] PAGAMENTO SEM ASSINATURA: session=${f.sessionId} ` +
        `chave_esperada=${f.expectedProviderSubscriptionId} ` +
        `user=${f.supabaseUserId ?? "DESCONHECIDO"} plano=${f.planId ?? "?"} ` +
        `valor_cents=${f.amountTotalCents ?? "?"} ${f.currency ?? ""} ` +
        `payment_status=${f.paymentStatus} mode=${f.mode} pago_em=${f.sessionCreatedAt}`,
    );
  }

  const { persisted, newOrphans } = await persistFindings(findings);

  return {
    windowDays,
    paidSessions,
    skippedRecent,
    orphans: findings.length,
    newOrphans,
    persisted,
    findings,
  };
}
