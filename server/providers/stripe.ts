import Stripe from "stripe";

import { findValidCoupon } from "../lib/coupons";
import { env } from "../lib/env";
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { enqueueEmail } from "../lib/queue";
import { getStripe } from "../lib/stripeClient";
import { resolveStripeCustomerId } from "../lib/stripeCustomer";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import { isFirstPurchase } from "./shared";
import { getPlanChargeValue, PLAN_PRICING } from "../../shared/planPricing";
import type { Gender } from "../../shared/gender";
import type { PlanId } from "../../shared/planPricing";
import type {
  CancelInput,
  CancelResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  ReactivateInput,
  ReactivateResult,
  WebhookInput,
  WebhookResult,
} from "./types";

// Nota de shape (apiVersion fixada em lib/stripeClient): o periodo da assinatura
// vive em items.data[].current_period_end e invoice.subscription virou
// invoice.parent.subscription_details.subscription.

// Allowlist reversa price_id -> PlanId, para resolver o plano a partir do price
// quando o metadata nao trouxer plan_id. Montada uma vez das envs.
const PLAN_BY_PRICE: Record<string, PlanId> = {};
for (const [plan, price] of Object.entries(env.stripePriceIds) as [
  PlanId,
  string,
][]) {
  if (price) PLAN_BY_PRICE[price] = plan;
}

function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number"
    ? new Date(unixSeconds * 1000).toISOString()
    : null;
}

function customerIdOf(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

// CRITICO: periodo SEMPRE do objeto da Stripe (items.data[0]), nunca calculado
// por billing-cycle/addMonths (isso e do Asaas e divergiria).
function subItemPeriod(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = sub.items?.data?.[0];
  return {
    start: toIso(item?.current_period_start),
    end: toIso(item?.current_period_end),
  };
}

function resolvePlanCode(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.plan_id;
  if (fromMeta) return fromMeta;
  const priceId = sub.items?.data?.[0]?.price?.id;
  return priceId ? (PLAN_BY_PRICE[priceId] ?? null) : null;
}

// Traduz o status da Stripe para o vocabulario ja usado no banco (mesmo que o
// Asaas alimenta). is_user_pro considera Pro apenas active/trialing com periodo
// vigente.
function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "incomplete";
  }
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details;
  const sub = details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function extractSubscriptionId(event: Stripe.Event): string | null {
  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return (event.data.object as Stripe.Subscription).id;
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sub = session.subscription;
      if (!sub) return null;
      return typeof sub === "string" ? sub : sub.id;
    }
    case "invoice.paid":
    case "invoice.payment_failed":
      return subscriptionIdFromInvoice(event.data.object as Stripe.Invoice);
    default:
      return null;
  }
}

function isProStatus(status: string | null): boolean {
  return status === "active" || status === "trialing";
}

function formatEffectiveDate(effectiveAt: string | null): string {
  return effectiveAt
    ? new Date(effectiveAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "o fim do período pago";
}

async function getUserContact(userId: string): Promise<{
  email: string;
  name: string;
  gender: Gender | null;
}> {
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authData?.user?.email || "";
  const name = String(
    authData?.user?.user_metadata?.name ||
      authData?.user?.email?.split("@")[0] ||
      "usuário",
  );
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("gender")
    .eq("user_id", userId)
    .maybeSingle();
  const gender = (profileData?.gender as Gender | null | undefined) ?? null;
  return { email, name, gender };
}

// Efeitos colaterais de uma transicao de status (paridade com o webhook Asaas):
// invalida o cache Pro do dono, dispara e-mail transacional e conta a conversao
// do afiliado na PRIMEIRA ativacao (nao em renovacoes).
async function handleTransition(
  userId: string,
  prevStatus: string | null,
  nextStatus: string,
  opts: {
    affiliateCode?: string | null;
    couponCode?: string | null;
    revenueCents?: number;
    planName?: string;
  },
): Promise<void> {
  const becameActive = !isProStatus(prevStatus) && isProStatus(nextStatus);
  const becameCanceled = prevStatus !== "canceled" && nextStatus === "canceled";
  const becamePastDue = prevStatus !== "past_due" && nextStatus === "past_due";

  if (prevStatus !== nextStatus) {
    void invalidateProStatusCache(userId);
  }

  if (becameActive && opts.affiliateCode) {
    try {
      const { data: affiliate } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("code", opts.affiliateCode)
        .maybeSingle();
      if (affiliate) {
        await supabaseAdmin.rpc("increment_affiliate_conversion", {
          p_affiliate_id: affiliate.id,
          p_revenue_cents: opts.revenueCents ?? 0,
        });
      }
    } catch (affiliateError) {
      console.error(
        "[webhook/stripe] Falha ao contar conversao de afiliado:",
        affiliateError,
      );
    }
  }

  // Resgate do cupom de marketing: conta SO na ativacao (nunca na criacao da
  // sessao), no mesmo ponto da conversao de afiliado. coupon_code no metadata
  // ja significa "desconto aplicado na sessao" (createCheckout so grava quando
  // aplica). Best-effort: falha loga e nao derruba o webhook.
  if (becameActive && opts.couponCode) {
    try {
      await supabaseAdmin.rpc("increment_coupon_redemption", {
        p_code: opts.couponCode,
      });
    } catch (couponError) {
      console.error(
        "[webhook/stripe] Falha ao contar resgate de cupom:",
        couponError,
      );
    }
  }

  if (!becameActive && !becameCanceled && !becamePastDue) return;

  try {
    const { email, name, gender } = await getUserContact(userId);
    if (!email) return;
    if (becameActive) {
      await enqueueEmail({
        type: "pro_upgrade",
        to: email,
        name,
        gender,
        planName: opts.planName || "Pro",
      });
    }
    if (becameCanceled) {
      await enqueueEmail({ type: "cancellation", to: email, name, gender });
    }
    if (becamePastDue) {
      await enqueueEmail({ type: "payment_failed", to: email, name, gender });
    }
  } catch (emailError) {
    console.error(
      "[webhook/stripe] Erro ao processar e-mail transacional",
      emailError,
    );
  }
}

// ---------------------------------------------------------------------------
// Silencios do caminho de dinheiro.
//
// Varios handlers abaixo desistem com um `return` mudo e respondem 200 para a
// Stripe. Isso e correto quando nao houve cobranca (assinatura mexida a mao no
// painel, boleto so emitido, evento de estado); e um buraco quando o dinheiro JA
// ENTROU, porque o pagamento some sem log, sem retry e sem linha, e o
// reconcile-subscriptions nao alcanca o que nunca virou linha.
//
// Os dois predicados abaixo separam os dois casos. Regra unica aplicada em todos
// os pontos: so vira erro (e portanto retry da Stripe) quando o evento CONFIRMA
// pagamento E ninguem foi atendido, isto e, nao existe linha em subscriptions
// para aquela chave. Com linha existente o usuario tem acesso, entao o problema
// e de estado, nao de dinheiro perdido: loga em nivel de erro e devolve 200, sem
// arriscar um retry perpetuo (a Stripe desabilita endpoint que falha por dias).
// ---------------------------------------------------------------------------

function isPaidSessionStatus(status: string | null | undefined): boolean {
  // 'no_payment_required' entra: e o que a Stripe devolve num mode:subscription
  // 100% descontado. Nao houve cobranca, mas a assinatura DEVE existir.
  return status === "paid" || status === "no_payment_required";
}

function eventConfirmsPayment(event: Stripe.Event): boolean {
  switch (event.type) {
    // invoice.paid so existe com a fatura liquidada (inclui a de valor zero).
    case "invoice.paid":
      return true;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return isPaidSessionStatus(
        (event.data.object as Stripe.Checkout.Session).payment_status,
      );
    // customer.subscription.* e evento de ESTADO, nao de cobranca. Assinatura
    // criada a mao no painel, sem o nosso metadata, cai aqui o tempo todo e
    // precisa continuar sendo ignorada em silencio.
    default:
      return false;
  }
}

async function subscriptionRowExists(
  providerSubscriptionId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", providerSubscriptionId)
    .limit(1);
  // Na duvida (erro de query), assume que NAO existe: prefere gritar e forcar
  // retry a engolir um pagamento por causa de uma falha de leitura.
  if (error) {
    console.error("[webhook/stripe] falha ao checar linha existente:", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// Upsert de uma assinatura Stripe na tabela subscriptions, com guard de
// out-of-order por last_event_at (mesma protecao do Asaas).
async function applySubscription(
  sub: Stripe.Subscription,
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) {
    if (eventConfirmsPayment(event)) {
      const atendido = await subscriptionRowExists(sub.id);
      console.error(
        `[webhook/stripe] PAGAMENTO SEM DONO: subscription ${sub.id} sem supabase_user_id no metadata ` +
          `(evento ${event.type} ${event.id}, customer ${customerIdOf(sub)}, linha existente: ${atendido}).`,
      );
      if (!atendido) {
        throw createError(
          500,
          "subscription_user_missing",
          "Assinatura paga sem usuário no metadata.",
        );
      }
      return;
    }
    console.warn(
      `[webhook/stripe] subscription ${sub.id} sem supabase_user_id no metadata; ignorando.`,
    );
    return;
  }

  const planCode = resolvePlanCode(sub);
  if (!planCode) {
    if (eventConfirmsPayment(event)) {
      const atendido = await subscriptionRowExists(sub.id);
      console.error(
        `[webhook/stripe] PAGAMENTO SEM PLANO: subscription ${sub.id} sem plano resolvivel ` +
          `(evento ${event.type} ${event.id}, user ${userId}, price ` +
          `${sub.items?.data?.[0]?.price?.id ?? "?"}, linha existente: ${atendido}).`,
      );
      if (!atendido) {
        throw createError(
          500,
          "subscription_plan_unresolved",
          "Assinatura paga sem plano resolvível.",
        );
      }
      return;
    }
    console.warn(
      `[webhook/stripe] subscription ${sub.id} sem plano resolvivel (metadata/price); ignorando.`,
    );
    return;
  }

  const { data: proPlan } = await supabaseAdmin
    .from("plans")
    .select("id, name")
    .eq("code", planCode)
    .maybeSingle();
  if (!proPlan) throw createError(500, "db_error", "Plano Pro não encontrado.");

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, canceled_at, last_event_at")
    .eq("provider_subscription_id", sub.id)
    .maybeSingle();

  // Ordenacao: ignora mutacao se o evento e mais antigo que o ultimo processado.
  if (
    existing?.last_event_at &&
    eventCreatedAt < new Date(existing.last_event_at)
  ) {
    console.warn(
      `[webhook/stripe] evento fora de ordem ignorado (${event.id})`,
    );
    return;
  }

  const status = mapStatus(sub.status);
  const period = subItemPeriod(sub);
  const affiliateCode = sub.metadata?.affiliate_code || null;
  const couponCode = sub.metadata?.coupon_code || null;
  const lastEventIso = eventCreatedAt.toISOString();

  const patch = {
    status,
    plan_id: proPlan.id,
    current_period_start: period.start,
    current_period_end: period.end,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at:
      status === "canceled"
        ? existing?.canceled_at ||
          toIso(sub.canceled_at) ||
          new Date().toISOString()
        : null,
    last_event_at: lastEventIso,
    raw_provider_payload: event,
  };

  const baseRequired = {
    user_id: userId,
    plan_id: proPlan.id,
    provider: "stripe",
    provider_subscription_id: sub.id,
    provider_customer_id: customerIdOf(sub),
    affiliate_code: affiliateCode,
    coupon_code: couponCode,
  };

  // raceLost: so o ramo de INSERT concorrente pode perder a corrida. No UPDATE
  // (linha ja existia) os efeitos de transicao seguem normais.
  let raceLost = false;
  let result;
  if (existing) {
    result = await supabaseAdmin
      .from("subscriptions")
      .update(patch)
      .eq("provider_subscription_id", sub.id);
  } else {
    // Webhooks concorrentes (completed/created/invoice.paid no mesmo segundo)
    // leem existing=null juntos. ignoreDuplicates faz o conflito virar DO
    // NOTHING: so o INSERT real volta linha; o perdedor volta vazio. Assim a
    // unique constraint nao estoura E handleTransition (email + conversao de
    // afiliado) dispara uma unica vez, no handler que de fato criou a linha.
    result = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        { ...baseRequired, ...patch },
        { onConflict: "provider_subscription_id", ignoreDuplicates: true },
      )
      .select("id");
    raceLost = !result.error && (result.data?.length ?? 0) === 0;
  }

  if (result.error) {
    console.error("[webhook/stripe] subscriptions write failed:", result.error);
    throw createError(500, "db_error", "Erro ao gravar assinatura.");
  }

  // Perdedor da corrida: a linha ja foi criada por outro handler, que dispara os
  // efeitos. Nao redisparar email nem conversao de afiliado.
  if (raceLost) return;

  const revenueCents = sub.items?.data?.[0]?.price?.unit_amount ?? 0;
  await handleTransition(userId, existing?.status ?? null, status, {
    affiliateCode,
    couponCode,
    revenueCents,
    planName: proPlan.name || planCode,
  });
}

async function onCheckoutCompleted(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  // Boleto: sessao mode:payment sem subscription na Stripe. Grava a linha pendente
  // (sem acesso Pro) para a UI mostrar "boleto em analise". O pagamento assincrono
  // (async_payment_succeeded) e tratado na proxima task.
  if (session.metadata?.payment_method === "boleto") {
    await applyBoletoPending(session, event, eventCreatedAt);
    return;
  }

  const subRef = session.subscription;
  const subId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  if (!subId) {
    // Nao pago (boleto de fora do nosso fluxo, sessao sem cobranca): silencio
    // legitimo, e o async_payment_succeeded ja grita se aquele dinheiro entrar.
    if (!isPaidSessionStatus(session.payment_status)) {
      console.warn(
        `[webhook/stripe] checkout ${session.id} sem subscription e nao pago (${session.payment_status}); ignorando.`,
      );
      return;
    }
    // Pago e sem subscription: nao ha objeto para virar assinatura. A linha do
    // boleto e chaveada pelo id da SESSAO, entao e por ela que se checa se
    // alguem ja foi atendido.
    const atendido = await subscriptionRowExists(session.id);
    console.error(
      `[webhook/stripe] PAGAMENTO SEM ASSINATURA: checkout ${session.id} pago (${session.payment_status}) ` +
        `sem subscription (mode ${session.mode}, user ` +
        `${session.metadata?.supabase_user_id || session.client_reference_id || "DESCONHECIDO"}, ` +
        `total ${session.amount_total}, linha existente: ${atendido}).`,
    );
    if (!atendido) {
      throw createError(
        500,
        "checkout_without_subscription",
        "Checkout pago sem assinatura para ativar.",
      );
    }
    return;
  }

  const sub = await getStripe().subscriptions.retrieve(subId);
  // Fallback: se o metadata da subscription nao veio, reidrata a partir do
  // client_reference_id / metadata da sessao (que setamos no createCheckout).
  if (!sub.metadata?.supabase_user_id && session.client_reference_id) {
    sub.metadata = {
      ...sub.metadata,
      supabase_user_id: session.client_reference_id,
      plan_id: session.metadata?.plan_id || "",
      affiliate_code: session.metadata?.affiliate_code || "",
      coupon_code: session.metadata?.coupon_code || "",
    };
  }
  await applySubscription(sub, event, eventCreatedAt);
}

// Linha pendente de boleto: gravada no checkout.session.completed, quando o boleto
// foi gerado mas ainda nao pago (payment_status != 'paid'). NAO concede acesso Pro
// (status 'pending' + current_period_end null; is_user_pro so aceita active/
// trialing). A confirmacao do pagamento e a duracao do acesso ficam na proxima
// task (async_payment_succeeded), que reencontra a linha pelo session id.
async function applyBoletoPending(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  // Se por algum motivo ja veio pago, quem sincroniza e a proxima task; nao grava
  // pendente aqui para nao mascarar o acesso.
  if (session.payment_status === "paid") {
    // Caso normal deste ramo: REDELIVERY do completed depois que o boleto ja
    // compensou. A linha existe (pending ou active) e quem ativa e o
    // async_payment_succeeded. No-op idempotente, como sempre foi.
    if (await subscriptionRowExists(session.id)) return;
    // Sem linha e ja pago: nada no sistema concede acesso a esse boleto, e o
    // async_payment_succeeded que viesse depois falharia em "Linha do boleto nao
    // encontrada". Grita aqui, onde ainda da para reprocessar.
    console.error(
      `[webhook/stripe] BOLETO PAGO SEM LINHA: checkout ${session.id} veio paid no completed ` +
        `(user ${session.metadata?.supabase_user_id || session.client_reference_id || "DESCONHECIDO"}, ` +
        `plano ${session.metadata?.plan_id ?? "?"}, total ${session.amount_total}); nenhum acesso concedido.`,
    );
    throw createError(
      500,
      "boleto_paid_without_row",
      "Boleto pago sem linha pendente para ativar.",
    );
  }

  const userId =
    session.metadata?.supabase_user_id || session.client_reference_id;
  if (!userId) {
    console.warn(
      `[webhook/stripe] boleto session ${session.id} sem supabase_user_id; ignorando.`,
    );
    return;
  }

  const planCode = session.metadata?.plan_id;
  if (!planCode) {
    console.warn(
      `[webhook/stripe] boleto session ${session.id} sem plan_id; ignorando.`,
    );
    return;
  }

  const { data: proPlan } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("code", planCode)
    .maybeSingle();
  if (!proPlan) throw createError(500, "db_error", "Plano Pro não encontrado.");

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  const row = {
    user_id: userId,
    plan_id: proPlan.id,
    provider: "stripe",
    // Boleto nao tem subscription: chaveia pelo Checkout Session id (cs_...), que
    // existe desde a criacao e volta em todos os eventos da sessao.
    provider_subscription_id: session.id,
    provider_customer_id: customerId,
    affiliate_code: session.metadata?.affiliate_code || null,
    coupon_code: session.metadata?.coupon_code || null,
    status: "pending",
    payment_method: "boleto",
    renewal_type: "manual",
    current_period_start: null,
    current_period_end: null,
    last_event_at: eventCreatedAt.toISOString(),
    raw_provider_payload: event,
  };

  // Idempotente: session id e unico e ignoreDuplicates evita erro se o evento
  // reentrar (retry da Stripe). Sem handleTransition: pendente nao vira Pro.
  const { error } = await supabaseAdmin.from("subscriptions").upsert(row, {
    onConflict: "provider_subscription_id",
    ignoreDuplicates: true,
  });
  if (error) {
    console.error("[webhook/stripe] boleto pending write failed:", error);
    throw createError(500, "db_error", "Erro ao gravar assinatura.");
  }
}

// Boleto compensou: ativa a assinatura. Boleto e mode:payment, entao NAO ha
// invoice.paid; este e o unico caminho de ativacao. O periodo de acesso e
// calculado aqui (now + access_days do metadata: 365 anual, 182 semestral),
// porque nao existe subscription na Stripe de onde puxar o periodo.
async function onBoletoAsyncPaymentSucceeded(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  // async_payment_succeeded so existe para pagamento assincrono; no nosso sistema
  // isso e sempre boleto (cartao compensa sincrono, sem este evento). Se o metadata
  // nao confirma boleto, e um pagamento CONFIRMADO que nao conseguimos rotear:
  // grita e forca retry da Stripe, nunca dropa em silencio (dinheiro entrou).
  if (session.metadata?.payment_method !== "boleto") {
    console.error(
      `[webhook/stripe] async_payment_succeeded sem metadata boleto (session ${session.id}); pagamento confirmado nao roteado.`,
    );
    throw createError(
      500,
      "boleto_metadata_missing",
      "Pagamento de boleto sem metadata para ativar.",
    );
  }

  const accessDays = Number.parseInt(session.metadata?.access_days ?? "", 10);
  if (!Number.isFinite(accessDays) || accessDays <= 0) {
    // Sem access_days nao da para calcular o periodo. Falha (billing_event e
    // removido) para a Stripe reenviar e o problema aparecer, nunca ativar torto.
    console.error(
      `[webhook/stripe] boleto session ${session.id} sem access_days valido; nao ativa.`,
    );
    throw createError(500, "config_error", "access_days ausente no boleto.");
  }

  // Le a linha antes de calcular o periodo: precisamos do user_id para achar a
  // ancora, e este e o ponto de "grita"/idempotencia. Reprocesso com a linha JA
  // active = no-op silencioso; ausente ou estado inesperado = boleto pago sem
  // acesso = grita e forca retry.
  const paidAtIso = eventCreatedAt.toISOString();
  const { data: pendingRow } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, status")
    .eq("provider_subscription_id", session.id)
    .maybeSingle();
  if (!pendingRow) {
    console.error(
      `[webhook/stripe] boleto pago sem linha (session ${session.id}); investigar.`,
    );
    throw createError(500, "db_error", "Linha do boleto não encontrada.");
  }
  if (pendingRow.status !== "pending") {
    if (pendingRow.status === "active") return; // reprocesso idempotente
    console.error(
      `[webhook/stripe] boleto pago nao ativou (session ${session.id}, status atual: ${pendingRow.status}); investigar.`,
    );
    throw createError(500, "db_error", "Boleto pago não ativou a assinatura.");
  }

  // Renovacao SOMA ao periodo, nao substitui. Ancora = maior current_period_end
  // ainda vigente (> pagamento) entre as subs active/trialing do usuario, EXCETO
  // esta linha. 1a compra: sem vigente -> ancora = agora. Renovacao cedo: ancora =
  // fim atual (nao perde os dias que faltavam). Renovacao atrasada: o periodo
  // antigo ja venceu, o filtro > pagamento o exclui -> ancora = agora (sem
  // retroativo dos dias sem acesso).
  const { data: vigente } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", pendingRow.user_id)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", paidAtIso)
    .neq("id", pendingRow.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const anchorMs = vigente?.current_period_end
    ? new Date(vigente.current_period_end).getTime()
    : eventCreatedAt.getTime();
  // current_period_start = ancora: na renovacao vigente o novo periodo comeca
  // exatamente onde o anterior termina (contiguo, sem overlap de receita); na 1a
  // compra e na renovacao atrasada a ancora e o proprio pagamento.
  const periodStart = new Date(anchorMs).toISOString();
  const periodEnd = new Date(
    anchorMs + accessDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Flip atomico: so com status='pending'. Idempotente mesmo se a linha for
  // ativada entre a leitura acima e este UPDATE (0 linhas -> nao soma de novo).
  const { data: activated, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      last_event_at: paidAtIso,
      raw_provider_payload: event,
    })
    .eq("provider_subscription_id", session.id)
    .eq("status", "pending")
    .select("user_id, affiliate_code, coupon_code, plan_id");

  if (error) {
    console.error("[webhook/stripe] boleto activation write failed:", error);
    throw createError(500, "db_error", "Erro ao ativar assinatura.");
  }
  if (!activated || activated.length === 0) {
    // Corrida: alguem flipou entre a leitura e o UPDATE. Ja tratado por quem
    // flipou; nao redispara efeitos nem re-aposenta.
    return;
  }

  const row = activated[0];

  // Aposenta as assinaturas antigas do usuario (a que ancorou + qualquer residuo
  // active/trialing), para nao ficarem duas linhas ativas inflando admin/MRR,
  // quebrando o guard 409 e disparando lembrete espurio na regua. status
  // 'superseded' (NAO 'canceled': foi renovacao, nao cancelamento; sem
  // canceled_at, updated_at carimba via trigger). Best-effort: a ativacao ja
  // ocorreu, entao erro aqui loga alto e segue (o reprocesso curto-circuita em
  // 'active' e nao repetiria isto; a proxima renovacao tambem limpa residuo).
  const { data: retired, error: retireError } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "superseded" })
    .eq("user_id", row.user_id)
    .in("status", ["active", "trialing"])
    .neq("id", pendingRow.id)
    .select("id");
  if (retireError) {
    console.error(
      `[webhook/stripe] falha ao aposentar assinatura antiga (session ${session.id}, user ${row.user_id}); orfa pode persistir:`,
      retireError,
    );
  } else if (retired && retired.length > 0) {
    console.log(
      `[webhook/stripe] ${retired.length} assinatura(s) superseded na renovacao (user ${row.user_id}).`,
    );
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code, name")
    .eq("id", row.plan_id)
    .maybeSingle();

  // Reaproveita os efeitos do caminho de cartao. prev='pending' (nao-Pro) ->
  // 'active' (Pro): becameActive dispara email/cache/conversao, igual ao cartao.
  await handleTransition(row.user_id, "pending", "active", {
    affiliateCode: row.affiliate_code,
    couponCode: row.coupon_code,
    revenueCents: session.amount_total ?? 0,
    planName: plan?.name || plan?.code || "Pro",
  });
}

// Boleto nao pago / expirado: cancela a linha pendente. Apenas o flip
// pending->canceled, condicional (idempotente) e SEM handleTransition: o usuario
// nunca teve acesso, entao um e-mail de cancelamento seria errado. Efeito colateral
// desejado: 'canceled' sai do filtro do guard 409 (payment_method='boleto' AND
// status='pending'), liberando o usuario para gerar novo checkout.
async function onBoletoAsyncPaymentFailed(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.payment_method !== "boleto") return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: eventCreatedAt.toISOString(),
      last_event_at: eventCreatedAt.toISOString(),
      raw_provider_payload: event,
    })
    .eq("provider_subscription_id", session.id)
    .eq("status", "pending");

  if (error) {
    console.error("[webhook/stripe] boleto failure write failed:", error);
    throw createError(500, "db_error", "Erro ao cancelar assinatura.");
  }
}

// ---------------------------------------------------------------------------
// PAGAMENTO RECUSADO (charge.failed, payment_intent.payment_failed).
//
// NUNCA LANCA. Cartao recusado e evento NORMAL de operacao, nao incidente: a
// pessoa erra o numero, o limite estoura, o Radar bloqueia. Se este handler
// lancasse, tres coisas ruins aconteceriam de uma vez, todas por cima do
// desenho da rodada 3:
//   1. o catch de handleWebhook apagaria o billing_event como COMPENSACAO, que
//      existe para forcar retry de dinheiro perdido -- aqui nao ha dinheiro;
//   2. a Stripe reentregaria por ~3 dias, e cada reentrega falharia de novo,
//      virando retry perpetuo sobre um fato imutavel;
//   3. endpoint que falha por dias e DESABILITADO pela Stripe, e ai os eventos
//      que importam (invoice.paid, async_payment_succeeded) param de chegar.
// Ou seja: lancar aqui derrubaria o caminho do dinheiro para registrar um
// nao-pagamento. Por isso o corpo inteiro e best-effort com catch mudo em log.
//
// O predicado eventConfirmsPayment tambem nao alcanca estes eventos (ele so
// responde true para invoice.paid e sessao paga), entao nenhum dos "grita quando
// o dinheiro entrou" e afetado.
// ---------------------------------------------------------------------------
type RecusaLinha = {
  provider: string;
  provider_object_id: string;
  object_type: string;
  payment_intent_id: string | null;
  customer_id: string | null;
  supabase_user_id: string | null;
  email: string | null;
  amount_cents: number | null;
  currency: string | null;
  plan_id: string | null;
  failure_code: string | null;
  decline_code: string | null;
  advice_code: string | null;
  outcome_type: string | null;
  outcome_reason: string | null;
  risk_level: string | null;
  seller_message: string | null;
  failure_message: string | null;
  attempted_at: string;
  event_id: string;
};

function idDe(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

function linhaDeCharge(ch: Stripe.Charge, event: Stripe.Event): RecusaLinha {
  const o = ch.outcome;
  return {
    provider: "stripe",
    provider_object_id: ch.id,
    object_type: "charge",
    payment_intent_id: idDe(ch.payment_intent),
    customer_id: idDe(ch.customer),
    supabase_user_id: ch.metadata?.supabase_user_id || null,
    email: ch.billing_details?.email || ch.receipt_email || null,
    amount_cents: ch.amount ?? null,
    currency: ch.currency ?? null,
    plan_id: ch.metadata?.plan_id || null,
    // ch.failure_code e sempre o generico ('card_declined'). O motivo que serve
    // para agir vive no outcome, medido na conta em 2026-07-28:
    //   outcome.reason               = insufficient_funds  <- o semantico
    //   outcome.advice_code          = try_again_later      <- retry vale a pena?
    //   outcome.network_decline_code = 51                   <- codigo do emissor
    // `payment_method_details.card.decline_code` NAO EXISTE nesta versao da API
    // (2026-06-24.dahlia): a primeira versao deste handler lia dali e o tsc
    // acusou. Ler campo inexistente daria null silencioso em toda linha.
    failure_code: ch.failure_code ?? null,
    decline_code: o?.network_decline_code ?? null,
    advice_code: o?.advice_code ?? null,
    outcome_type: o?.type ?? null,
    outcome_reason: o?.reason ?? null,
    risk_level: o?.risk_level ?? null,
    seller_message: o?.seller_message ?? null,
    failure_message: ch.failure_message ?? null,
    attempted_at: new Date(ch.created * 1000).toISOString(),
    event_id: event.id,
  };
}

function linhaDePaymentIntent(
  pi: Stripe.PaymentIntent,
  event: Stripe.Event,
): RecusaLinha {
  const err = pi.last_payment_error;
  return {
    provider: "stripe",
    provider_object_id: pi.id,
    object_type: "payment_intent",
    payment_intent_id: pi.id,
    customer_id: idDe(pi.customer),
    supabase_user_id: pi.metadata?.supabase_user_id || null,
    email:
      pi.receipt_email || err?.payment_method?.billing_details?.email || null,
    amount_cents: pi.amount ?? null,
    currency: pi.currency ?? null,
    plan_id: pi.metadata?.plan_id || null,
    failure_code: err?.code ?? null,
    decline_code: err?.decline_code ?? null,
    advice_code: err?.advice_code ?? null,
    outcome_type: null,
    outcome_reason: null,
    risk_level: null,
    seller_message: null,
    failure_message: err?.message ?? null,
    attempted_at: new Date(pi.created * 1000).toISOString(),
    event_id: event.id,
  };
}

async function onPaymentFailed(event: Stripe.Event): Promise<void> {
  try {
    const linha =
      event.type === "charge.failed"
        ? linhaDeCharge(event.data.object as Stripe.Charge, event)
        : linhaDePaymentIntent(
            event.data.object as Stripe.PaymentIntent,
            event,
          );

    // Log em nivel de INFO, nao de erro: e operacao normal. O log existe para o
    // caso de a gravacao falhar e o dado sobrar so aqui.
    console.log(
      `[webhook/stripe] recusa: ${linha.object_type} ${linha.provider_object_id} ` +
        `${linha.email ?? "(sem email)"} ${linha.amount_cents ?? "?"} ` +
        `${linha.outcome_type ?? "-"}/${linha.decline_code ?? linha.failure_code ?? "-"} ` +
        `risk=${linha.risk_level ?? "-"}`,
    );

    // ignoreDuplicates: reentrega do mesmo evento nao duplica a linha. Tentativa
    // NOVA da mesma pessoa tem outro id e vira outra linha, de proposito.
    const { error } = await supabaseAdmin
      .from("billing_failed_payments")
      .upsert(linha, {
        onConflict: "provider_object_id",
        ignoreDuplicates: true,
      });
    if (error) {
      // Inclui o caso "a migration ainda nao subiu". O handler TOLERA schema
      // antigo de proposito (codigo antes da migration): sem a tabela, a recusa
      // fica so no log e o webhook segue 200.
      console.error(
        `[webhook/stripe] falha ao gravar recusa ${linha.provider_object_id} (a linha fica so no log):`,
        error,
      );
    }
  } catch (err) {
    // Ultimo anel: nem um shape inesperado da Stripe pode virar 500 aqui.
    console.error(
      `[webhook/stripe] handler de recusa lancou para ${event.id}; ignorado de proposito:`,
      err,
    );
  }
}

async function onInvoicePaid(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) return;
  const sub = await getStripe().subscriptions.retrieve(subId);
  await applySubscription(sub, event, eventCreatedAt);
}

async function onInvoiceFailed(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) return;

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, user_id, last_event_at")
    .eq("provider_subscription_id", subId)
    .maybeSingle();
  if (!existing) return; // sem linha: nada a marcar (paridade com Asaas past_due)

  if (
    existing.last_event_at &&
    eventCreatedAt < new Date(existing.last_event_at)
  ) {
    console.warn(
      `[webhook/stripe] evento fora de ordem ignorado (${event.id})`,
    );
    return;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      last_event_at: eventCreatedAt.toISOString(),
      raw_provider_payload: event,
    })
    .eq("provider_subscription_id", subId);
  if (error) {
    console.error("[webhook/stripe] subscriptions write failed:", error);
    throw createError(500, "db_error", "Erro ao marcar past_due.");
  }

  await handleTransition(existing.user_id, existing.status, "past_due", {});
}

function isStripeError(err: unknown): err is Stripe.errors.StripeError {
  return err instanceof Stripe.errors.StripeError;
}

// Coupon DETERMINISTICO por percentual: bnt_aff_<percent>_once. Nao depende de
// afiliado (dois afiliados com 20% usam o mesmo objeto); a atribuicao vive no
// affiliate_code. duration "once" = desconto so na primeira cobranca (paridade
// com o Asaas, que so edita a primeira cobranca). Garante o coupon de forma
// idempotente: retrieve; se faltar, cria; corrida na criacao conta como sucesso.
async function ensureAffiliateCoupon(
  couponId: string,
  percentOff: number,
): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.coupons.retrieve(couponId);
    return;
  } catch (err) {
    if (
      !(
        isStripeError(err) &&
        (err.code === "resource_missing" || err.statusCode === 404)
      )
    ) {
      throw err;
    }
  }
  try {
    await stripe.coupons.create({
      id: couponId,
      percent_off: percentOff,
      duration: "once",
      metadata: {
        source: "bnt_affiliate",
        discount_percent: String(percentOff),
      },
    });
  } catch (err) {
    if (isStripeError(err) && err.code === "resource_already_exists") return;
    throw err;
  }
}

// Coupon Stripe do cupom de marketing, DETERMINISTICO por percentual:
// bnt_promo_<percent>_once. Espelha ensureAffiliateCoupon: dois cupons de
// marketing com o mesmo percentual compartilham o objeto na Stripe; qual cupom
// deu o desconto vive no coupon_code (metadata/subscriptions). duration "once"
// = desconto so na primeira cobranca, paridade com o desconto de afiliado.
// Idempotente: retrieve; se faltar, cria; corrida na criacao conta como sucesso.
async function ensureMarketingCoupon(
  couponId: string,
  percentOff: number,
): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.coupons.retrieve(couponId);
    return;
  } catch (err) {
    if (
      !(
        isStripeError(err) &&
        (err.code === "resource_missing" || err.statusCode === 404)
      )
    ) {
      throw err;
    }
  }
  try {
    await stripe.coupons.create({
      id: couponId,
      percent_off: percentOff,
      duration: "once",
      metadata: { source: "bnt_promo", discount_percent: String(percentOff) },
    });
  } catch (err) {
    if (isStripeError(err) && err.code === "resource_already_exists") return;
    throw err;
  }
}

// Boleto: dias de acesso Pro concedidos quando o pagamento compensa (proxima
// task). So os planos semestral/anual aceitam boleto; o mensal fica de fora.
const BOLETO_ACCESS_DAYS: Partial<Record<PlanId, number>> = {
  pro_semiannual: 182,
  pro_annual: 365,
};

async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  const priceId = env.stripePriceIds[input.planId];
  if (!priceId) {
    throw createError(
      500,
      "config_error",
      "Preço Stripe não configurado para o plano.",
    );
  }

  // Guard de assinatura ativa (paridade com Asaas): evita assinatura duplicada.
  // Pulado SO na renovacao (internalRenewal), onde a assinatura esta active de
  // proposito. internalRenewal e interno e nunca chega pelo corpo HTTP.
  if (!input.internalRenewal) {
    // Fail-closed: nada de .maybeSingle() aqui (ele ERRA com multiplas linhas
    // ativas e, se o error for ignorado, libera o checkout). limit(1) + presenca;
    // e um erro de query BLOQUEIA, nunca libera.
    const { data: activeRows, error: guardError } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", input.user.id)
      .in("status", ["active", "trialing"])
      .limit(1);
    if (guardError) {
      console.error(
        "[billing/checkout] guard de assinatura ativa falhou; bloqueando:",
        guardError,
      );
      throw createError(
        500,
        "db_error",
        "Não foi possível verificar sua assinatura. Tente novamente.",
      );
    }
    if (activeRows && activeRows.length > 0) {
      throw createError(409, "conflict", "Usuário já possui assinatura ativa.");
    }
  }

  // Guard de boleto pendente: enquanto um boleto aguarda pagamento, nao gera outro
  // checkout (nem boleto nem cartao) para evitar pagamento em duplicidade. Code
  // slug distinto do 409 acima: a UI precisa diferenciar "ja e assinante" de
  // "boleto aguardando pagamento".
  // Fail-closed, igual ao guard de ativa: limit(1) + presenca (sem .maybeSingle(),
  // que erraria com multiplas linhas), e erro de query BLOQUEIA, nunca libera.
  // Decisao de cobranca nao pode sobreviver ignorando error.
  const { data: pendingBoleto, error: pendingError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.user.id)
    .eq("payment_method", "boleto")
    .eq("status", "pending")
    .limit(1);
  if (pendingError) {
    console.error(
      "[billing/checkout] guard de boleto pendente falhou; bloqueando:",
      pendingError,
    );
    throw createError(
      500,
      "db_error",
      "Não foi possível verificar seu boleto pendente. Tente novamente.",
    );
  }
  if (pendingBoleto && pendingBoleto.length > 0) {
    throw createError(
      409,
      "boleto_pending",
      "Você tem um boleto aguardando pagamento.",
    );
  }

  // Afiliado/cupom de marketing: desconto e contadores so entram na PRIMEIRA
  // compra (mesma regra dos dois). Precedencia: cupom de marketing valido ganha
  // do discount_percent do afiliado; o affiliate_code continua sendo gravado
  // para comissao (so a FONTE do desconto muda).
  let validAffiliateCode = "";
  let validCouponCode = "";
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;

  const firstPurchase =
    input.affiliateCode || input.couponCode
      ? await isFirstPurchase(input.user.id)
      : false;

  if (input.couponCode && firstPurchase) {
    // Revalida TUDO no server (nunca confia no client): ativo, janela de
    // validade, limite de usos e plano aplicavel. Cupom NUNCA impede a
    // assinatura: qualquer falha segue sem desconto e loga.
    const coupon = await findValidCoupon(input.couponCode, {
      planId: input.planId,
    });
    if (coupon) {
      try {
        const couponId = `bnt_promo_${coupon.discount_percent}_once`;
        await ensureMarketingCoupon(couponId, coupon.discount_percent);
        discounts = [{ coupon: couponId }];
        // So grava (e portanto so conta resgate na ativacao) quando o desconto
        // foi de fato aplicado na sessao.
        validCouponCode = coupon.code;
      } catch (couponErr) {
        console.error(
          "[billing/checkout] cupom de marketing falhou, seguindo sem desconto:",
          couponErr,
        );
      }
    }
  }

  if (input.affiliateCode) {
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from("affiliates")
      .select("id, code, discount_percent")
      .eq("code", input.affiliateCode)
      .eq("status", "active")
      .maybeSingle();

    // O error era DESCARTADO aqui, e sem else. As duas causas de "sem afiliado"
    // colapsavam num unico silencio: codigo que nao existe (ou foi
    // desativado/removido, caso ACACIAOFF) e falha de query. A primeira e
    // esperada e o desconto some por decisao; a segunda e defeito nosso e o
    // desconto some por acidente. Nos dois casos o cliente ja exibiu o preco com
    // desconto e a pessoa paga cheio sem aviso. Continua seguindo sem desconto
    // (cupom NUNCA impede a assinatura), mas agora com rastro distinguivel.
    if (affiliateError) {
      console.error(
        `[billing/checkout] ERRO DE QUERY no afiliado ${input.affiliateCode} ` +
          `(user ${input.user.id}, plano ${input.planId}); seguindo SEM desconto:`,
        affiliateError,
      );
    } else if (!affiliate) {
      console.warn(
        `[billing/checkout] afiliado ${input.affiliateCode} inexistente ou inativo ` +
          `(user ${input.user.id}, plano ${input.planId}); seguindo sem desconto.`,
      );
    }

    if (affiliate) {
      validAffiliateCode = affiliate.code;

      if (firstPurchase) {
        // Desconto do afiliado so quando o cupom de marketing nao aplicou.
        // Cupom NUNCA impede a assinatura: se qualquer passo falhar, segue sem
        // desconto e loga. So percentual (discount_percent e integer 1..100).
        if (!discounts) {
          try {
            const couponId = `bnt_aff_${affiliate.discount_percent}_once`;
            await ensureAffiliateCoupon(couponId, affiliate.discount_percent);
            discounts = [{ coupon: couponId }];
          } catch (couponErr) {
            console.error(
              "[billing/checkout] cupom Stripe falhou, seguindo sem desconto:",
              couponErr,
            );
          }
        }

        // trials: mesma condicao de antes (1a compra + afiliado ativo),
        // independente de o desconto aplicado ter vindo dele ou do cupom.
        await supabaseAdmin.rpc("increment_affiliate_trials", {
          p_affiliate_id: affiliate.id,
        });
      }
    }
  }

  // metadata replicado na sessao E na subscription: assim TODO evento
  // customer.subscription.* carrega supabase_user_id/plan_id/affiliate_code/
  // coupon_code, e os codigos (validados) sobrevivem ate a linha em
  // subscriptions (paridade com Asaas, que so propaga o codigo validado).
  const metadata = {
    supabase_user_id: input.user.id,
    plan_id: input.planId,
    affiliate_code: validAffiliateCode || "",
    coupon_code: validCouponCode || "",
  };

  // Customer REUSADO, nao criado por sessao. `customer` e `customer_email` NAO
  // podem coexistir numa Checkout Session (a Stripe recusa), entao os dois ramos
  // abaixo trocam um pelo outro em vez de somar. A resolucao, a assercao de dono e
  // o tratamento de corrida vivem em lib/stripeCustomer.ts, dentro da funcao, para
  // valer nos dois ramos por construcao.
  //
  // NAO passamos saved_payment_method_options nem ligamos
  // payment_method_save: com nenhum PaymentMethod salvo, um mapeamento errado nao
  // consegue cobrar o cartao de outra pessoa. Cartao salvo e fase 2, so depois do
  // mapeamento validado em producao.
  const customerId = await resolveStripeCustomerId(
    input.user.id,
    input.user.email,
  );

  if (input.paymentMethod === "boleto") {
    // Boleto: pagamento unico (mode: payment). Nao pode usar price recurring, entao
    // o valor vem inline de planPricing.ts (fonte unica: e o que o site mostra e o
    // que a Stripe cobra). O acesso Pro so e concedido quando o boleto compensa
    // (async_payment_succeeded, proxima task); por isso metadata carrega
    // payment_method/renewal_type/access_days para a linha ser reidratada la.
    const accessDays = BOLETO_ACCESS_DAYS[input.planId];
    if (!accessDays) {
      throw createError(
        400,
        "boleto_not_allowed_on_monthly",
        "Boleto não está disponível neste plano.",
      );
    }
    const boletoMetadata = {
      ...metadata,
      payment_method: "boleto",
      renewal_type: "manual",
      access_days: String(accessDays),
    };
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["boleto"],
      payment_method_options: { boleto: { expires_after_days: 3 } },
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(getPlanChargeValue(input.planId) * 100),
            product_data: {
              name: `Bora na Tech Pro ${PLAN_PRICING[input.planId].label}`,
            },
          },
          quantity: 1,
        },
      ],
      client_reference_id: input.user.id,
      customer: customerId,
      metadata: boletoMetadata,
      discounts,
      success_url: `${env.appPublicUrl}/planos/sucesso`,
      cancel_url: `${env.appPublicUrl}/planos`,
    });
    // Boleto nao gera subscription na Stripe; a linha e chaveada pelo session id.
    return { checkoutUrl: session.url ?? undefined, subscriptionId: "" };
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    // Explicito (opt-out do dynamic payment methods): sem isso a Stripe ofereceria
    // TODOS os metodos habilitados na conta, inclusive Boleto — e um boleto pago por
    // aqui viraria uma sessao mode:subscription SEM metadata.payment_method='boleto'
    // nem access_days, tratado como cartao e fora da regua de renovacao manual.
    // 'card' ja exibe Apple Pay e Google Pay automaticamente (carteiras de cartao,
    // sem entry propria). Link NAO entra: a Stripe rejeita 'link' explicito em
    // mode:subscription com 400 (derrubou o checkout em prod, commit 61869dd). Boleto
    // fica de fora (o caminho de boleto e o outro branch, mode:payment).
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: input.user.id,
    customer: customerId,
    metadata,
    subscription_data: { metadata },
    discounts,
    success_url: `${env.appPublicUrl}/planos/sucesso`,
    cancel_url: `${env.appPublicUrl}/planos`,
  });

  return {
    checkoutUrl: session.url ?? undefined,
    subscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription?.id ?? ""),
  };
}

async function cancel(input: CancelInput): Promise<CancelResult> {
  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, provider_subscription_id, current_period_end, status, cancel_at_period_end, payment_method, renewal_type",
    )
    .eq("user_id", input.userId)
    .eq("provider", "stripe")
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw createError(500, "db_error", "Erro ao buscar assinatura.");
  if (!sub) {
    throw createError(404, "not_found", "Nenhuma assinatura ativa encontrada.");
  }

  // BOLETO (renewal_type='manual'): NAO ha subscription recorrente na Stripe
  // (provider_subscription_id e um Checkout Session cs_...). "Cancelar" aqui e so
  // registrar a intencao de nao renovar; o acesso ja acaba naturalmente em
  // current_period_end (is_user_pro nega pelo periodo). NAO chama a Stripe, NAO
  // seta cancel_at_period_end (senao acordaria o bug latente do cron
  // process-cancellations). Idempotente por pre-checagem; INSERT fail-loud (e a
  // unica coisa que a acao faz).
  if (sub.renewal_type === "manual") {
    const { data: existingIntent, error: intentError } = await supabaseAdmin
      .from("subscription_cancellations")
      .select("id")
      .eq("provider_subscription_id", sub.provider_subscription_id)
      .neq("status", "reverted")
      .order("canceled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (intentError) {
      throw createError(500, "db_error", "Erro ao verificar cancelamento.");
    }

    if (!existingIntent) {
      const { error: insertError } = await supabaseAdmin
        .from("subscription_cancellations")
        .insert({
          user_id: input.userId,
          provider_subscription_id: sub.provider_subscription_id,
          reason_code: input.reasonCode || null,
          reason_text: input.reasonText || null,
          effective_at: sub.current_period_end,
          status: "scheduled",
        });
      // Fail-loud: sem o registro, a acao nao fez nada. Ao contrario do cartao
      // (best-effort), aqui o INSERT E a acao, entao o erro sobe para a UI.
      if (insertError) {
        throw createError(
          500,
          "db_error",
          "Não foi possível registrar. Tente novamente.",
        );
      }
    }

    return {
      cancel_at_period_end: false,
      effective_at: sub.current_period_end,
      non_renewal: true,
      // TODO(Ana): mensagem de sucesso do "nao renovar" do boleto.
      message: `Anotado: sua assinatura não vai renovar. Você mantém o acesso Pro até ${formatEffectiveDate(sub.current_period_end)}.`,
    };
  }

  if (sub.cancel_at_period_end) {
    throw createError(
      409,
      "already_scheduled",
      "Cancelamento já está agendado.",
    );
  }
  if (!sub.provider_subscription_id) {
    throw createError(500, "config_error", "Assinatura sem id do provedor.");
  }

  // Stripe PRIMEIRO, banco depois (mesma ordem retry-safe do Asaas). O webhook
  // customer.subscription.updated confirma o cancel_at_period_end depois.
  try {
    await getStripe().subscriptions.update(sub.provider_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (stripeErr) {
    console.error(
      `[billing/cancel] Stripe falhou para sub ${sub.provider_subscription_id}; banco nao alterado:`,
      stripeErr,
    );
    throw createError(
      502,
      "stripe_error",
      "Não foi possível agendar o cancelamento no provedor. Tente novamente.",
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("id", sub.id);

  if (updateError) {
    console.error(
      `[billing/cancel] INCONSISTENCIA: Stripe ok mas update DB falhou (sub ${sub.id}). Retry seguro: POST /cancel.`,
      updateError,
    );
    throw createError(
      500,
      "db_error",
      "Cancelamento agendado no provedor, mas houve erro ao registrar. Tente novamente.",
    );
  }

  const { error: logError } = await supabaseAdmin
    .from("subscription_cancellations")
    .insert({
      user_id: input.userId,
      provider_subscription_id: sub.provider_subscription_id,
      reason_code: input.reasonCode || null,
      reason_text: input.reasonText || null,
      effective_at: sub.current_period_end,
      status: "scheduled",
    });
  if (logError) {
    console.error(
      "[billing/cancel] Erro ao registrar motivo de cancelamento:",
      logError,
    );
  }

  return {
    cancel_at_period_end: true,
    effective_at: sub.current_period_end,
    message: `Sua assinatura foi cancelada. Você mantém acesso Pro até ${formatEffectiveDate(sub.current_period_end)}.`,
  };
}

async function reactivate(input: ReactivateInput): Promise<ReactivateResult> {
  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, provider_subscription_id, current_period_end, status, cancel_at_period_end, renewal_type",
    )
    .eq("user_id", input.userId)
    .eq("provider", "stripe")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw createError(500, "db_error", "Erro ao buscar assinatura.");

  const nowIso = new Date().toISOString();
  const outOfWindow =
    !sub ||
    sub.status === "canceled" ||
    !sub.current_period_end ||
    sub.current_period_end <= nowIso;

  if (outOfWindow) {
    return {
      redirect_to_checkout: true,
      checkout_path: "/planos",
      message: "Sua janela de reativação venceu. Vamos para um novo plano.",
    };
  }

  // BOLETO (renewal_type='manual'): desfazer o "nao renovar" e so marcar a
  // intencao como 'reverted'. Sem Stripe, sem cancel_at_period_end. Ramifica
  // ANTES da logica de cartao, que fica byte-identica. Fail-loud (o update E a
  // acao). Idempotente: segundo clique nao acha 'scheduled' e retorna sucesso.
  if (sub.renewal_type === "manual") {
    const { error: revertError } = await supabaseAdmin
      .from("subscription_cancellations")
      .update({ status: "reverted" })
      .eq("provider_subscription_id", sub.provider_subscription_id)
      .eq("status", "scheduled");
    if (revertError) {
      throw createError(
        500,
        "db_error",
        "Não foi possível desfazer. Tente novamente.",
      );
    }
    return {
      cancel_at_period_end: false,
      // TODO(Ana): mensagem de sucesso do "voltar atras" do boleto.
      message: `Pronto: o aviso de não renovação foi removido. Seu acesso Pro segue até ${formatEffectiveDate(sub.current_period_end)} e você pode renovar quando quiser.`,
    };
  }

  if (!sub.cancel_at_period_end) {
    throw createError(409, "already_active", "Assinatura já está ativa.");
  }

  if (!["active", "trialing", "past_due"].includes(sub.status)) {
    return {
      redirect_to_checkout: true,
      checkout_path: "/planos",
      message:
        "Reativação não disponível para este plano. Vamos para um novo plano.",
    };
  }

  if (!sub.provider_subscription_id) {
    throw createError(500, "config_error", "Assinatura sem id do provedor.");
  }

  try {
    await getStripe().subscriptions.update(sub.provider_subscription_id, {
      cancel_at_period_end: false,
    });
  } catch (stripeErr) {
    console.error(
      `[billing/reactivate] Stripe falhou para sub ${sub.provider_subscription_id}; banco nao alterado:`,
      stripeErr,
    );
    throw createError(
      502,
      "stripe_error",
      "Não foi possível reativar a assinatura no provedor. Tente novamente.",
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("id", sub.id);

  if (updateError) {
    console.error(
      `[billing/reactivate] INCONSISTENCIA: Stripe ok mas update DB falhou (sub ${sub.id}). Retry seguro: POST /reactivate.`,
      updateError,
    );
    throw createError(
      500,
      "db_error",
      "Reativação confirmada no provedor, mas houve erro ao registrar. Tente novamente.",
    );
  }

  const { error: revertError } = await supabaseAdmin
    .from("subscription_cancellations")
    .update({ status: "reverted" })
    .eq("user_id", input.userId)
    .eq("status", "scheduled");
  if (revertError) {
    console.error(
      "[billing/reactivate] Erro ao marcar cancelamento como reverted:",
      revertError,
    );
  }

  return {
    cancel_at_period_end: false,
    message: "Sua assinatura foi reativada. A renovação volta ao normal.",
  };
}

// Estado do processamento ANTERIOR de um event id que ja tem linha em
// billing_events. Ver a migration 20260727130000 para o porque.
type PriorProcessing = "processed" | "unfinished";

async function readPriorProcessing(eventId: string): Promise<PriorProcessing> {
  // select("*") de proposito, nao select("processed_at"): enquanto a migration
  // nao estiver aplicada, pedir a coluna pelo nome derrubaria a leitura e,
  // com ela, TODO evento duplicado. Com "*", a coluna ausente chega como
  // undefined e o comportamento antigo (presenca da linha = processado) e
  // preservado. Custo extra do raw jsonb so no caminho de duplicata, que e raro.
  const { data, error } = await supabaseAdmin
    .from("billing_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    // Nao da para AFIRMAR que ja foi processado. Falha para o lado de
    // reprocessar: repetir um efeito (que os guards de idempotencia ja cobrem:
    // raceLost, last_event_at, flips condicionais) e menos grave que descartar
    // um pagamento.
    console.error(
      `[webhook/stripe] falha ao ler processed_at de ${eventId}; tratando como nao concluido:`,
      error,
    );
    return "unfinished";
  }
  // Linha sumiu entre o upsert e esta leitura (compensacao concorrente).
  if (!data) return "unfinished";

  const stamp = (data as { processed_at?: string | null }).processed_at;
  // undefined = coluna ainda nao existe no banco: comportamento antigo.
  if (stamp === undefined) return "processed";
  return stamp ? "processed" : "unfinished";
}

async function markEventProcessed(eventId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) {
    // Nao derruba a resposta: o handler JA concluiu e o estado do usuario esta
    // correto. O custo de nao carimbar e um eventual reprocesso em resend
    // manual. Tambem e o que acontece enquanto a migration nao subiu.
    console.warn(
      `[webhook/stripe] falha ao carimbar processed_at de ${eventId}:`,
      error,
    );
  }
}

async function handleWebhook(input: WebhookInput): Promise<WebhookResult> {
  // Fail-closed: sem secret configurado, rejeita (mesma filosofia do Asaas).
  if (!env.stripeWebhookSecret) {
    console.error(
      "[webhook/stripe] STRIPE_WEBHOOK_SECRET nao configurado, rejeitando (fail-closed).",
    );
    throw createError(401, "unauthorized", "Webhook desabilitado.");
  }

  const sigHeader = input.headers["stripe-signature"];
  const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
  if (!signature) {
    throw createError(401, "unauthorized", "Header stripe-signature ausente.");
  }
  if (!input.rawBody) {
    throw createError(400, "bad_request", "Corpo do webhook ausente.");
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      input.rawBody,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (err) {
    console.error(
      "[webhook/stripe] Assinatura invalida:",
      err instanceof Error ? err.message : String(err),
    );
    throw createError(401, "unauthorized", "Assinatura do webhook inválida.");
  }

  const eventCreatedAt = new Date(event.created * 1000);
  const subscriptionId = extractSubscriptionId(event);

  console.log(`[webhook/stripe] event: ${event.type} (${event.id})`);

  // Dedupe/idempotencia: mesma tabela billing_events do Asaas, provider='stripe'.
  const { data: recorded, error: dedupeError } = await supabaseAdmin
    .from("billing_events")
    .upsert(
      {
        id: event.id,
        provider: "stripe",
        event_type: event.type,
        provider_subscription_id: subscriptionId,
        payment_id: null,
        event_created_at: eventCreatedAt.toISOString(),
        raw: event,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");

  if (dedupeError) {
    console.error(
      "[webhook/stripe] Erro ao registrar billing_event:",
      dedupeError,
    );
    throw createError(500, "db_error", "Erro ao registrar evento.");
  }
  if (!recorded || recorded.length === 0) {
    // Linha ja existia. Isso NAO e sinonimo de "ja processado": o DELETE de
    // compensacao la embaixo pode ter falhado, deixando o registro de um
    // processamento que morreu no meio. Sem esta checagem, o retry da Stripe
    // seria descartado aqui e o pagamento sumiria sem log.
    if ((await readPriorProcessing(event.id)) === "processed") {
      return { received: true, deduped: true };
    }
    console.warn(
      `[webhook/stripe] evento ${event.id} (${event.type}) tinha registro SEM processed_at; ` +
        `processamento anterior nao concluiu, reprocessando.`,
    );
  }

  // Se algo falhar, remove o billing_event para o retry da Stripe reprocessar.
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event, eventCreatedAt);
        break;
      case "checkout.session.async_payment_succeeded":
        await onBoletoAsyncPaymentSucceeded(event, eventCreatedAt);
        break;
      case "checkout.session.async_payment_failed":
        await onBoletoAsyncPaymentFailed(event, eventCreatedAt);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(
          event.data.object as Stripe.Subscription,
          event,
          eventCreatedAt,
        );
        break;
      case "invoice.paid":
        await onInvoicePaid(event, eventCreatedAt);
        break;
      case "invoice.payment_failed":
        await onInvoiceFailed(event, eventCreatedAt);
        break;
      // Recusa de cobranca. Antes caia no `default`, que apagava o proprio
      // billing_event e devolvia unhandled: a falha nao existia em lugar nenhum.
      // onPaymentFailed nunca lanca, entao a resposta e sempre 200.
      case "charge.failed":
      case "payment_intent.payment_failed":
        await onPaymentFailed(event);
        break;
      case "charge.succeeded":
      case "charge.refunded":
      case "charge.dispute.created":
      case "charge.dispute.closed":
        // Finance (caminho rapido): garante que as balance transactions recentes
        // (cobranca, reembolso, disputa) entrem em finance_transactions. Janela de
        // 2 dias por seguranca; idempotente pelo bt id. O cron diario e a rede de
        // seguranca para webhook perdido.
        await syncBalanceTransactions({
          since: new Date(eventCreatedAt.getTime() - 2 * 24 * 60 * 60 * 1000),
        });
        break;
      default:
        // Evento NAO tratado: nao ha mutacao, entao o dedup nao protege nada aqui e
        // ainda deixaria o evento IRRECUPERAVEL por resend caso um handler seja
        // adicionado depois (ja aconteceu: um async_payment_succeeded caiu aqui na
        // janela de um deploy e ficou preso). Remove o proprio billing_event para
        // que um resend futuro chegue ao (novo) handler. O dedup dos eventos
        // TRATADOS fica intacto — eles nao passam por aqui. A Stripe nao reenvia
        // sozinho apos 200, entao isso nao vira ruido; so o resend manual (o que
        // queremos) reprocessa.
        try {
          await supabaseAdmin
            .from("billing_events")
            .delete()
            .eq("id", event.id);
        } catch (cleanupErr) {
          console.warn(
            "[webhook/stripe] falha ao limpar dedup de evento nao tratado:",
            cleanupErr,
          );
        }
        return { received: true, unhandled: true };
    }
    // Carimba a conclusao. So a partir daqui uma reentrega conta como duplicata.
    await markEventProcessed(event.id);
    return { received: true };
  } catch (procErr) {
    // Compensacao: apagar a linha faz o retry da Stripe reprocessar. Ela deixou
    // de ser a UNICA defesa (processed_at cobre a falha dela), mas continua
    // sendo o caminho limpo. O erro agora e LIDO e logado: antes o { error } do
    // supabase-js era descartado e o catch so pegava falha de rede, entao uma
    // compensacao malsucedida era invisivel.
    try {
      const { error: cleanupError } = await supabaseAdmin
        .from("billing_events")
        .delete()
        .eq("id", event.id);
      if (cleanupError) {
        console.error(
          `[webhook/stripe] compensacao falhou para ${event.id}; o retry depende de processed_at NULL:`,
          cleanupError,
        );
      }
    } catch (cleanupErr) {
      console.error(
        `[webhook/stripe] compensacao lancou para ${event.id}; o retry depende de processed_at NULL:`,
        cleanupErr,
      );
    }
    throw procErr;
  }
}

// Estado vivo de uma assinatura na Stripe, ja traduzido para o vocabulario do
// banco. Usado pelo reconciliador (cron) como fonte de verdade quando o webhook
// pode ter sido perdido: a subscription retrieve() da Stripe E o estado atual,
// entao nao ha calculo de ciclo (isso e do Asaas).
export type StripeSubscriptionState = {
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
};

export async function getStripeSubscriptionState(
  subscriptionId: string,
): Promise<StripeSubscriptionState> {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const period = subItemPeriod(sub);
  return {
    status: mapStatus(sub.status),
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    canceledAt: toIso(sub.canceled_at),
  };
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",
  createCheckout,
  cancel,
  reactivate,
  handleWebhook,
};
