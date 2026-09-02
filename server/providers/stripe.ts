import * as Sentry from "@sentry/node";
import Stripe from "stripe";

import { findValidCoupon } from "../lib/coupons";
import { env } from "../lib/env";
import { registerFiscalInvoice } from "../lib/fiscalQueue";
import { applyRefundToFiscalInvoice } from "../lib/fiscalRefund";
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { enqueueEmail } from "../lib/queue";
import { getStripe } from "../lib/stripeClient";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { erroEncadeavel } from "../lib/supabaseError";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import { patchDeMeioDePagamento } from "../lib/paymentMethod";
import {
  applyActivationEffects,
  type MotivoDaAtivacao,
  getUserContact,
  isFirstPurchase,
  recordNonRenewalIntent,
  revertNonRenewalIntent,
} from "./shared";
import { oneOffAccessDays } from "../../shared/paymentMethods";
import { getPlanChargeValue, PLAN_PRICING } from "../../shared/planPricing";
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

/** Exportada so para o teste conseguir compor `becameActive` com a funcao real. */
export function isProStatus(status: string | null): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Por que esta ativacao esta acontecendo.
 *
 * Funcao propria, e nao duas linhas soltas dentro de `handleTransition`, pelo
 * mesmo motivo de `deveReportarAoSentry` (sentry.ts) e `deveSubirWorkers`
 * (env.ts): a decisao fica testavel diretamente, com uma linha por caso, em vez
 * de exigir que o teste monte um evento inteiro da Stripe e todo o banco em
 * volta so para observar um booleano.
 *
 * `past_due -> Pro` e o unico caso de `recuperacao`. Ver o comentario de
 * `handleTransition` para o evento de 01/09 que motivou a distincao.
 */
export function motivoDaAtivacao(
  prevStatus: string | null,
  nextStatus: string,
): MotivoDaAtivacao {
  return prevStatus === "past_due" && isProStatus(nextStatus)
    ? "recuperacao"
    : "primeira_ativacao";
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
    // Procedencia do evento que originou a transicao. NAO participa de nenhuma
    // decisao: existe so para o Sentry conseguir identificar a conversao que
    // ficou sem valor pago e permitir o replay manual dela.
    sourceEvent?: { id: string; type: string; subscriptionId: string | null };
  },
): Promise<void> {
  const becameActive = !isProStatus(prevStatus) && isProStatus(nextStatus);
  const becameCanceled = prevStatus !== "canceled" && nextStatus === "canceled";
  const becamePastDue = prevStatus !== "past_due" && nextStatus === "past_due";

  // ATE 2026-09-02 ISTO ERA FALSO: `becameActive` era tratado como sinonimo de
  // "venda nova". Nao e. `isProStatus` so aceita `active` e `trialing`, entao
  // `past_due` nao e Pro, e uma renovacao que falhou e depois foi paga entra
  // aqui como se fosse a primeira compra.
  //
  // O caso medido: assinatura `sub_1TwMUgQ6lxIhx7Vyha0Ffmgx` (pro_monthly,
  // afiliado BORANATECHOFF), renovacao falha em 23, 25, 28 e 30/08 e paga em
  // 01/09. A Stripe mandou `customer.subscription.updated` (past_due -> active)
  // e `invoice.paid` no MESMO segundo; o primeiro chegou 125ms antes e disparou
  // conversao de afiliado, resgate de cupom e e-mail de boas-vindas ao Pro.
  //
  // O defeito nao e o warning `stripe_conversao_sem_valor_pago` que apareceu no
  // Sentry, e sim a incoerencia que ele revelou: uma renovacao que passa de
  // primeira NUNCA contava comissao (prev=active, logo nao e `becameActive`), e
  // uma que falhou quatro vezes contava, ou nao, conforme qual dos dois eventos
  // simultaneos ganhasse a corrida. O mesmo fato do mundo produzia efeitos
  // diferentes dependendo de latencia de rede.
  //
  // `past_due -> Pro` e o UNICO caso reclassificado. Qualquer outro prev que
  // ative (hoje `null` e `pending`) segue como primeira ativacao.
  const motivo = motivoDaAtivacao(prevStatus, nextStatus);

  // Ativacao: TODOS os efeitos vao pelo caminho compartilhado
  // (server/providers/shared.ts), o mesmo que o Pix usa. Cache, afiliado, cupom
  // e e-mail viviam aqui dentro e eram invisiveis para qualquer outro provedor.
  // A ordem interna e a mesma de antes; a invalidacao de cache mudou de lugar,
  // nao de momento, porque `becameActive` implica `prevStatus !== nextStatus`.
  if (becameActive) {
    await applyActivationEffects({
      userId,
      logPrefix: "webhook/stripe",
      motivo,
      planName: opts.planName,
      affiliateCode: opts.affiliateCode,
      couponCode: opts.couponCode,
      revenueCents: opts.revenueCents,
      sourceEvent: opts.sourceEvent,
      prevStatus,
    });
  } else if (prevStatus !== nextStatus) {
    void invalidateProStatusCache(userId);
  }

  if (!becameCanceled && !becamePastDue) return;

  try {
    const { email, name, gender } = await getUserContact(userId);
    if (!email) return;
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

/**
 * Valor EFETIVAMENTE PAGO declarado pelo evento, em centavos, ou null quando o
 * evento nao declara cobranca.
 *
 * Existe porque a comissao de afiliado precisa da MESMA base nos dois meios de
 * pagamento. O boleto sempre usou `session.amount_total` (valor pago); o cartao
 * usava `price.unit_amount`, que e PRECO DE TABELA e ignora cupom e desconto de
 * afiliado. A mesma venda com 30 por cento de desconto gerava comissao sobre
 * 2990 pelo cartao e sobre 2093 pelo boleto: duas bases alimentando uma conta so.
 *
 * A classificacao e a mesma de `eventConfirmsPayment`, de proposito: os eventos
 * que confirmam cobranca sao exatamente os que carregam valor.
 *
 * null NAO e zero. Zero e uma cobranca de valor zero (mode:subscription 100 por
 * cento descontado, que a Stripe reporta como 'no_payment_required'); null e
 * ausencia de cobranca no evento, e `customer.subscription.*` e evento de ESTADO,
 * nao de cobranca. Colapsar os dois faria uma venda sem valor declarado parecer
 * uma venda gratuita.
 *
 * EXPORTADA para teste, no mesmo criterio de `expirarBoletosVencidos` em
 * server/routes/cron.ts: o que importa provar aqui e QUAL numero sai daqui para a
 * comissao, e isso so se prova rodando a funcao contra eventos reais.
 */
export function paidAmountCentsFromEvent(event: Stripe.Event): number | null {
  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      return invoice.amount_paid ?? null;
    }
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isPaidSessionStatus(session.payment_status)) return null;
      return session.amount_total ?? null;
    }
    default:
      return null;
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

/**
 * Nome do indice unico PARCIAL criado pela migration 20260829120000:
 * `UNIQUE (user_id) WHERE status IN ('active','trialing')`.
 *
 * Literal, e nao ha alternativa melhor: o `details` do Postgres nomeia so a
 * CHAVE violada (`Key (user_id)=(...) already exists.`) e nunca o indice, entao
 * a unica coisa que separa este 23505 de qualquer outro conflito de unicidade
 * da tabela e o nome dentro da `message`. Se a migration renomear o indice,
 * este literal muda junto, e `webhookCorridaAssinatura.test.ts` quebra.
 */
const INDICE_ATIVO_POR_USUARIO = "subscriptions_one_active_per_user";

/**
 * Status que o indice parcial cobre. Espelha o `WHERE` da migration, e precisa
 * continuar espelhando: lista maior traria linha que o indice ignora, lista
 * menor deixaria de achar o ocupante e transformaria corrida benigna em "nao
 * achei ocupante", que lanca. `past_due` esta fora dos dois, de proposito.
 */
const STATUS_DO_INDICE_ATIVO = ["active", "trialing"];

/** Conflito de unicidade NO indice parcial de ativo por usuario, e nao em outro. */
function ehConflitoDeAtivoPorUsuario(erro: unknown): boolean {
  const e = erro as { code?: unknown; message?: unknown } | null | undefined;
  if (!e || e.code !== "23505") return false;
  return (
    typeof e.message === "string" &&
    e.message.includes(INDICE_ATIVO_POR_USUARIO)
  );
}

// Upsert de uma assinatura Stripe na tabela subscriptions, com guard de
// out-of-order por last_event_at (mesma protecao do Asaas).
//
// EXPORTADA para teste, no mesmo criterio de `onBoletoAsyncPaymentSucceeded`
// abaixo: o que importa provar e o ramo de classificacao do 23505, e ele so se
// prova rodando a funcao com o erro no formato real do postgrest.
export async function applySubscription(
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
      // Daqui para baixo o fluxo devolve 200, e o 200 esta CERTO: `atendido`
      // significa que a linha ja existe, entao ninguem ficou sem acesso e a
      // Stripe nao deve reentregar. O problema nao e a resposta, e o rastro: o
      // `console.error` acima morre no log do Railway, porque `server/lib/sentry.ts`
      // nao declara `integrations` e o `captureConsoleIntegration` nao e padrao
      // no @sentry/node (docs/erro-engolido.md). E este e justamente o caminho
      // que o RETRY DA STRIPE NUNCA VAI REENTREGAR: com 200, se ninguem olhar
      // hoje, ninguem olha nunca.
      //
      // `warning` e nao `error`, e a diferenca e deliberada: o fluxo TRATOU o
      // caso, ninguem esta sem o que pagou neste instante, e o que se quer aqui
      // e um humano conferir o metadata da subscription, nao urgencia de
      // plantao. `error` igualaria isto ao ramo de cima, que e o caso em que o
      // dinheiro entrou e ninguem foi atendido, e ai a distincao entre os dois
      // se perderia justamente no painel que existe para separa-los.
      Sentry.captureMessage("stripe_pagamento_sem_dono", {
        level: "warning",
        // Fingerprint fixo por TIPO, nao pelo id: o interesse e a serie no
        // tempo. Sem ele o id da subscription entra no agrupamento, cada
        // ocorrencia vira uma issue nova, e uma issue por ocorrencia carrega a
        // mesma informacao que nenhuma.
        fingerprint: ["stripe-pagamento-sem-dono"],
        tags: { origem: "stripe-webhook", event_type: event.type },
        extra: {
          subscription_id: sub.id,
          event_id: event.id,
          customer_id: customerIdOf(sub),
        },
      });
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
      // Terceiro caminho de 200 mudo desta funcao, irmao do
      // `stripe_pagamento_sem_dono`: `atendido` significa que a linha ja existe,
      // ninguem ficou sem acesso e a Stripe nao deve reentregar, entao o 200
      // esta certo. O que falta e rastro, porque o `console.error` acima morre
      // no log do Railway (`server/lib/sentry.ts` nao declara `integrations` e o
      // `captureConsoleIntegration` nao e padrao no @sentry/node, ver
      // docs/erro-engolido.md), e com 200 o RETRY DA STRIPE NUNCA REENTREGA
      // este evento: se ninguem olhar hoje, ninguem olha nunca.
      //
      // `warning` e nao `error` pelo mesmo motivo escrito acima: o fluxo TRATOU
      // o caso, ninguem esta sem o que pagou neste instante, e o que se quer e
      // um humano conferir de onde veio um price sem plano mapeado, nao
      // urgencia de plantao. `error` igualaria isto ao ramo de cima, onde o
      // dinheiro entrou e ninguem foi atendido.
      Sentry.captureMessage("stripe_pagamento_sem_plano", {
        level: "warning",
        // Fingerprint fixo por TIPO, nao pelo id, pela razao de sempre: o
        // interesse e a serie no tempo, e uma issue por ocorrencia carrega a
        // mesma informacao que nenhuma. Issue separada das outras duas porque o
        // defeito e outro: aqui o dono existe, o que nao existe e o mapeamento
        // do price para um plano nosso.
        fingerprint: ["stripe-pagamento-sem-plano"],
        tags: { origem: "stripe-webhook", event_type: event.type },
        extra: {
          subscription_id: sub.id,
          event_id: event.id,
          user_id: userId,
          price_id: sub.items?.data?.[0]?.price?.id ?? null,
        },
      });
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
  // A Subscription declara o meio em payment_settings.payment_method_types.
  // Nao e adivinhacao: createCheckout fixa payment_method_types: ["card"] no
  // ramo de assinatura (opt-out do dynamic payment methods), entao a lista
  // chega com um elemento so e o valor e conclusivo.
  const meioDePagamento = patchDeMeioDePagamento(
    sub as unknown as Parameters<typeof patchDeMeioDePagamento>[0],
  );
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
    // Meio de pagamento LIDO, nunca deduzido. Ver server/lib/paymentMethod.ts
    // para a decisao de canonicidade e para o porque de nao gravar 'card' por
    // eliminacao.
    //
    // A chave so entra no patch quando o meio foi resolvido: sem isto, um
    // evento cuja carga nao declara o meio (invoice.paid e
    // customer.subscription.updated as vezes nao declaram) sobrescreveria com
    // NULL um valor que um evento anterior tinha resolvido. Atualizacao nao
    // pode apagar informacao que a criacao tinha.
    ...meioDePagamento,
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

    if (ehConflitoDeAtivoPorUsuario(result.error)) {
      // CORRIDA PERDIDA NUM INDICE QUE O `ON CONFLICT` NAO ARBITRA.
      //
      // O `upsert` acima arbitra `provider_subscription_id` com
      // `ignoreDuplicates`, e `ON CONFLICT` so absorve conflito no indice
      // ARBITRADO: conflito em qualquer OUTRO indice unico da mesma tabela
      // levanta erro. A migration 20260829120000 acrescentou um SEGUNDO indice
      // unico (`subscriptions_one_active_per_user`, parcial por status) a um
      // caminho de escrita desenhado quando havia um indice so, e foi isso que
      // abriu o buraco. A protecao contra concorrencia que existia aqui nunca
      // foi generica: ela cobre exatamente um indice, o que ela nomeia.
      //
      // O CASO MEDIDO, 30/08 13:50:27. Evento `checkout.session.completed`
      // (evt_1UA97tQ6lxIhx7VyI5ypzLNe), assinatura
      // `sub_1UA97sQ6lxIhx7VyF77F9STc`, usuario 81129623-79a8-415c-be5c-30ae9f86d3af:
      // a leitura de `existing` voltou vazia as 13:50:26.997 e o `upsert` bateu
      // 409 as 13:50:27.183, porque outro handler da MESMA assinatura commitou a
      // linha 374ms antes. Consulta ao banco confirmou UMA linha ativa para o
      // usuario, com o `provider_subscription_id` do proprio evento: estado
      // final correto, ninguem perdeu o Pro, e o 500 so gerou retry e alarme.
      //
      // POR QUE PRECISA DE CONSULTA. O erro nao dispensa a leitura: o `details`
      // diz `Key (user_id)=(...) already exists.` e NAO nomeia qual assinatura
      // ocupa o slot ativo. Sem ler o ocupante, "corrida benigna" e "usuario com
      // duas assinaturas ativas" sao indistinguiveis, e sao opostos em gravidade.
      const { data: ocupante, error: erroDeClassificacao } = await supabaseAdmin
        .from("subscriptions")
        .select("id, provider_subscription_id, status")
        .eq("user_id", userId)
        .in("status", STATUS_DO_INDICE_ATIVO)
        .maybeSingle();

      if (erroDeClassificacao) {
        // A consulta de classificacao falhou: nao da para classificar nada,
        // entao vale o criterio do ramo de baixo. Cai para o `throw` original,
        // com o erro ORIGINAL da escrita e nao o da classificacao: o 23505 e o
        // fato do incidente, e trocar um pelo outro apagaria a unica pista.
        console.error(
          `[webhook/stripe] classificacao da corrida falhou (user ${userId}, ${sub.id}); ` +
            `lancando o erro ORIGINAL da escrita:`,
          erroDeClassificacao,
        );
      } else if (!ocupante) {
        // NAO ACHOU OCUPANTE: lanca. Este ramo NAO pode virar sucesso. A
        // consulta de classificacao corre a MESMA corrida do upsert e pode rodar
        // antes do commit do vencedor, voltando vazia. O que temos aqui e "nao
        // sei", e colapsar "nao sei" em "esta tudo bem" e exatamente o defeito
        // que este projeto persegue: instrumento que falha PASSANDO. Lancar
        // custa um retry da Stripe, que reprocessa e ai encontra a linha; calar
        // custaria uma assinatura que ninguem sabe se ficou gravada.
        console.error(
          `[webhook/stripe] 23505 em ${INDICE_ATIVO_POR_USUARIO} (user ${userId}, ${sub.id}) ` +
            `sem linha ativa correspondente na leitura seguinte; corrida NAO confirmada.`,
        );
      } else if (ocupante.provider_subscription_id === sub.id) {
        // Corrida benigna: o ocupante do slot E a assinatura deste evento. O
        // estado final ja esta correto, entao o desfecho e o mesmo do `raceLost`
        // do outro indice: retorna sem lancar e sem disparar `handleTransition`,
        // porque a transicao (email e conversao de afiliado) e do handler que de
        // fato criou a linha, nao deste.
        //
        // `info`, nao `warning`: isto nao pede acao. O evento existe para MEDIR
        // a frequencia, que hoje e de uma ocorrencia desde 29/08. Fingerprint
        // fixo para a serie nao se espalhar por usuario.
        Sentry.captureMessage("stripe_corrida_assinatura_ativa", {
          level: "info",
          fingerprint: ["stripe-corrida-assinatura-ativa"],
          tags: { origem: "stripe-webhook", event_type: event.type },
          extra: {
            user_id: userId,
            subscription_id: sub.id,
            event_id: event.id,
          },
        });
        return;
      } else {
        // Problema real: o usuario tem uma assinatura ativa que NAO e a deste
        // evento, ou seja, duas assinaturas ativas ao mesmo tempo. O indice
        // bloqueou certo, e isto precisa de gente.
        //
        // Os DOIS ids entram no TEXTO da mensagem, nao em propriedade solta: o
        // `exceptionFromError` do Sentry monta a exceção de `name`, `message` e
        // `stack`, e nada mais (o motivo esta escrito por extenso em
        // server/lib/supabaseError.ts). Sem os dois ids aqui, a investigacao
        // recomeca do zero, que foi o custo do BUG-77.
        const duplicada = new Error(
          `Usuario ${userId} ja tem a assinatura ativa ${ocupante.provider_subscription_id} ` +
            `(status ${ocupante.status}); o evento ${event.type} ${event.id} tentou ativar ${sub.id}.`,
          { cause: erroEncadeavel(result.error) },
        );
        duplicada.name = "AssinaturaAtivaDuplicada";
        throw createError(500, "db_error", "Erro ao gravar assinatura.", {
          cause: duplicada,
          context: {
            userId,
            subscriptionDoEvento: sub.id,
            subscriptionAtiva: ocupante.provider_subscription_id,
            statusDoOcupante: ocupante.status,
            eventType: event.type,
          },
        });
      }
    }

    // `cause` em TODO `db_error` deste arquivo que tenha o erro do Supabase em
    // maos, e o motivo vale para os outros: sem ele o Sentry recebe a mensagem
    // generica e um stack que aponta para a nossa propria linha, e a causa real
    // (timeout de statement, permissao, coluna ausente) some. O `LinkedErrors`
    // percorre `err.cause` e anexa o erro do Supabase, DESDE QUE ele seja um
    // `Error`, e e para isso que o `erroEncadeavel` existe. Nenhum texto exibido
    // ao usuario muda: `cause` nunca sai na resposta.
    //
    // O QUE ESTE COMENTARIO AFIRMAVA E ERA FALSO, ate 2026-08-30. Ele dizia que
    // o `LinkedErrors` percorria o `cause` e pronto, sem a condicao. A cadeia
    // NUNCA se formou: o `postgrest-js`, no modo `{ data, error }`, devolve
    // `JSON.parse(body)` puro, um objeto plano sem prototipo de `Error`, e o
    // `aggregate-errors.js:28` do @sentry/core so segue o `cause` quando ele
    // passa em `isInstanceOf(..., Error)`. Ficou assim do `89bf03ba` ate esta
    // correcao, com o comentario ensinando um mecanismo que nao operava.
    //
    // Foi por falta do `cause` que o BUG-74 (`Erro ao gravar assinatura.`,
    // evento de 22/08) chegou ao Sentry sem cadeia: o `89bf03ba` cobriu
    // `routes/billing.ts` e `routes/content.ts` e deixou o webhook de fora. Mas
    // o BUG-77, de 30/08, chegou sem cadeia TAMBEM COM o `cause` no lugar, e foi
    // ele que expos o defeito acima. O que salvou aquele diagnostico (o `23505`
    // em `subscriptions_one_active_per_user`) foi o breadcrumb do `console.error`
    // logo acima, por acidente de desenho, nao pelo mecanismo prometido aqui.
    throw createError(500, "db_error", "Erro ao gravar assinatura.", {
      cause: erroEncadeavel(result.error),
    });
  }

  // Perdedor da corrida: a linha ja foi criada por outro handler, que dispara os
  // efeitos. Nao redisparar email nem conversao de afiliado.
  if (raceLost) return;

  // Comissao de afiliado SEMPRE sobre VALOR PAGO, nunca sobre preco de tabela.
  // O que estava aqui era `price.unit_amount`, que ignora cupom e desconto de
  // afiliado: a venda descontada pagava comissao cheia, e a MESMA venda por
  // boleto pagava sobre o valor real. `undefined` quando o evento nao declara
  // cobranca; ver paidAmountCentsFromEvent.
  const revenueCents = paidAmountCentsFromEvent(event) ?? undefined;
  await handleTransition(userId, existing?.status ?? null, status, {
    affiliateCode,
    couponCode,
    revenueCents,
    planName: proPlan.name || planCode,
    sourceEvent: { id: event.id, type: event.type, subscriptionId: sub.id },
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
    // Mesmo caso do `stripe_pagamento_sem_dono`, e o motivo de warning, de
    // fingerprint fixo e de manter o 200 esta escrito la, em `applySubscription`.
    // Issue separada de proposito: sao dois defeitos diferentes (metadata da
    // subscription contra sessao paga sem subscription nenhuma) e esconder um
    // atras do volume do outro e o que o fingerprint por tipo existe para
    // evitar.
    Sentry.captureMessage("stripe_pagamento_sem_assinatura", {
      level: "warning",
      fingerprint: ["stripe-pagamento-sem-assinatura"],
      tags: { origem: "stripe-webhook", event_type: event.type },
      extra: {
        session_id: session.id,
        event_id: event.id,
        payment_status: session.payment_status,
        mode: session.mode,
        amount_total: session.amount_total,
      },
    });
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
    throw createError(500, "db_error", "Erro ao gravar assinatura.", {
      cause: erroEncadeavel(error),
    });
  }
}

/**
 * Retorno de `activate_subscription_exclusive` (migration 20260829110000).
 *
 * O prefixo `out_` nao e estilo: `RETURNS TABLE` cria variaveis plpgsql com o
 * nome de cada coluna de saida, e `user_id`, `plan_id`, `affiliate_code` e
 * `coupon_code` sao TAMBEM nomes de coluna de public.subscriptions. Sem o
 * prefixo, a funcao quebraria com "column reference is ambiguous" em tempo de
 * execucao. Os nomes aqui espelham a assinatura no banco e nao podem divergir
 * dela.
 *
 * `supabaseAdmin` e criado sem generic de Database (server/lib/supabaseAdmin.ts),
 * entao o retorno de `rpc` nao vem tipado; este tipo e a declaracao do contrato
 * do lado do TypeScript.
 */
type ExclusiveActivationRow = {
  out_activated: boolean;
  out_superseded_count: number;
  out_user_id: string;
  out_plan_id: string | null;
  out_affiliate_code: string | null;
  out_coupon_code: string | null;
};

// Boleto compensou: ativa a assinatura. Boleto e mode:payment, entao NAO ha
// invoice.paid; este e o unico caminho de ativacao. O periodo de acesso e
// calculado aqui (now + access_days do metadata: 365 anual, 182 semestral),
// porque nao existe subscription na Stripe de onde puxar o periodo.
// EXPORTADA para teste, no mesmo criterio de `expirarBoletosVencidos` em
// server/routes/cron.ts e de `recordAffiliateConversion` (shared.ts): o que
// importa provar aqui e que a ativacao passa por UMA chamada de RPC e por
// nenhuma escrita direta de status, e isso so se prova rodando a funcao.
export async function onBoletoAsyncPaymentSucceeded(
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

  // ATIVACAO ATOMICA. O supersede das assinaturas antigas e o flip desta linha
  // acontecem DENTRO de uma transacao so, na funcao
  // `activate_subscription_exclusive` (migration 20260829110000), na ordem
  // supersede-primeiro.
  //
  // O que estava aqui eram DUAS escritas separadas: flip para 'active' e, so
  // depois, `UPDATE ... status='superseded'` best-effort (erro so logava). Duas
  // coisas erradas nisso. A primeira: entre as duas escritas o usuario tinha
  // duas linhas ativas por construcao, no caminho feliz, o que impedia o indice
  // unico parcial de 20260829120000. A segunda, independente do indice: o
  // supersede podia falhar em silencio e deixar linha ativa orfa, inflando MRR e
  // disparando lembrete espurio.
  //
  // NAO HA RETRY PROPRIO AQUI, de proposito: a reentrega da Stripe e o retry, e
  // a RPC e idempotente (segunda chamada com a linha ja 'active' devolve
  // out_activated=false, sem reescrever periodo). Erro persistente converge para
  // o mesmo estado em vez de duplicar efeito.
  const { data: ativacao, error } = await supabaseAdmin.rpc(
    "activate_subscription_exclusive",
    {
      p_subscription_id: pendingRow.id,
      p_user_id: pendingRow.user_id,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_last_event_at: paidAtIso,
      p_raw_payload: event,
    },
  );

  if (error) {
    // O contrato de erro do handler nao muda: lanca, a compensacao apaga o
    // billing_event e a Stripe reentrega. O que muda e a VISIBILIDADE: sem esta
    // captura, um erro persistente da RPC (inclusive o serialization_failure da
    // emenda 1) seria so mais um 500 no meio do log, com dinheiro ja recebido e
    // acesso nao concedido.
    Sentry.captureMessage("stripe_boleto_ativacao_falhou", {
      level: "error",
      fingerprint: ["stripe-boleto-ativacao-falhou"],
      tags: { origem: "stripe-webhook", event_type: event.type },
      extra: {
        user_id: pendingRow.user_id,
        subscription_row_id: pendingRow.id,
        event_id: event.id,
        session_id: session.id,
        db_code: error.code ?? null,
        db_message: error.message,
      },
    });
    console.error("[webhook/stripe] boleto activation rpc failed:", error);
    throw createError(500, "db_error", "Erro ao ativar assinatura.", {
      cause: erroEncadeavel(error),
    });
  }

  // A funcao devolve exatamente uma linha; `rpc` de RETURNS TABLE chega como
  // array. Vazio nao deveria acontecer, e por isso e tratado como falha em vez
  // de virar um `return` mudo que perderia um pagamento.
  const linhas = (ativacao ?? []) as ExclusiveActivationRow[];
  const resultado = linhas[0];
  if (!resultado) {
    console.error(
      `[webhook/stripe] activate_subscription_exclusive devolveu vazio (session ${session.id}, sub ${pendingRow.id}).`,
    );
    throw createError(500, "db_error", "Ativação de assinatura sem resultado.");
  }

  if (!resultado.out_activated) {
    // A linha ja estava 'active' quando a funcao rodou: alguem flipou entre a
    // leitura la em cima e esta chamada. Quem flipou disparou os efeitos; nao
    // redispara. O supersede rodou de qualquer forma, e e ele que limpa residuo.
    return;
  }

  if (resultado.out_superseded_count > 0) {
    console.log(
      `[webhook/stripe] ${resultado.out_superseded_count} assinatura(s) superseded na renovacao (user ${resultado.out_user_id}).`,
    );
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code, name")
    .eq("id", resultado.out_plan_id)
    .maybeSingle();

  // Reaproveita os efeitos do caminho de cartao. prev='pending' (nao-Pro) ->
  // 'active' (Pro): becameActive dispara email/cache/conversao, igual ao cartao.
  // Mesmo contrato do caminho de cartao: ausencia de valor pago NAO vira zero.
  // O que estava aqui era `session.amount_total ?? 0`, que colapsava "o evento
  // nao declarou valor" em "a venda foi de zero" e gravava no ledger de comissao
  // um numero indistinguivel de uma venda 100 por cento descontada. Passa a usar
  // o mesmo resolvedor do cartao, que devolve `null` para ausencia, e a levar o
  // `sourceEvent` que faltava neste caminho: sem ele a captura do Sentry sairia
  // sem o que o replay manual precisa.
  await handleTransition(resultado.out_user_id, "pending", "active", {
    affiliateCode: resultado.out_affiliate_code,
    couponCode: resultado.out_coupon_code,
    revenueCents: paidAmountCentsFromEvent(event) ?? undefined,
    planName: plan?.name || plan?.code || "Pro",
    sourceEvent: { id: event.id, type: event.type, subscriptionId: session.id },
  });

  // Gancho fiscal por ULTIMO: o acesso ja foi concedido e os efeitos ja
  // dispararam, entao nada do que acontecer aqui pode desfazer o que importa.
  await registrarNotaFiscalDeBoleto(session, {
    userId: resultado.out_user_id,
    subscriptionRowId: pendingRow.id,
    planCode: plan?.code ?? null,
    periodStart,
    periodEnd,
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
    throw createError(500, "db_error", "Erro ao cancelar assinatura.", {
      cause: erroEncadeavel(error),
    });
  }
}

// ---------------------------------------------------------------------------
// Gancho fiscal (NFS-e). Fase 1: registra a intencao e enfileira; quem emite e
// o worker (server/lib/fiscalQueue.ts).
//
// REGRA QUE MANDA EM TODO ESTE BLOCO: nada aqui pode lancar para fora. O
// contrato de erro dos handlers deste arquivo e "lanca -> apaga o billing_event
// -> a Stripe reprocessa o evento inteiro". Deixar uma falha fiscal escapar
// faria uma prefeitura fora do ar reprocessar ATIVACAO DE ACESSO, e a Stripe
// desabilita endpoint que falha por dias. Acesso pago tem prioridade sobre nota;
// o que escapar daqui e problema da reconciliacao da Fase 4, que varre
// finance_transactions contra fiscal_invoices.
// ---------------------------------------------------------------------------

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

async function chargeIdFromPaymentIntent(
  paymentIntentId: string,
): Promise<string | null> {
  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  return idOf(intent.latest_charge);
}

/**
 * Cobranca por tras de uma invoice paga.
 *
 * Nesta versao da API (2026-06-24.dahlia, fixada em lib/stripeClient) a Invoice
 * NAO tem mais `charge` nem `payment_intent`: o vinculo com o dinheiro mudou
 * para os objetos InvoicePayment. Por isso a resolucao passa por
 * `invoicePayments.list` e nao por um campo direto, que e o que a maioria dos
 * exemplos antigos ainda mostra.
 */
async function chargeRefsFromInvoice(invoice: Stripe.Invoice): Promise<{
  chargeId: string | null;
  paymentIntentId: string | null;
}> {
  const vazio = { chargeId: null, paymentIntentId: null };
  if (!invoice.id) return vazio;

  const pagamentos = await getStripe().invoicePayments.list({
    invoice: invoice.id,
    limit: 10,
  });
  // O pagamento LIQUIDADO e o que interessa. Uma invoice pode ter tentativa
  // cancelada e pagamento parcial; pegar o primeiro da lista traria o objeto
  // errado numa fatura com historico.
  const pago = pagamentos.data.find((p) => p.status === "paid");
  if (!pago) return vazio;

  if (pago.payment.type === "charge") {
    return { chargeId: idOf(pago.payment.charge), paymentIntentId: null };
  }
  if (pago.payment.type === "payment_intent") {
    const paymentIntentId = idOf(pago.payment.payment_intent);
    if (!paymentIntentId) return vazio;
    return {
      chargeId: await chargeIdFromPaymentIntent(paymentIntentId),
      paymentIntentId,
    };
  }
  // payment_record: forma de pagamento fora do fluxo de cartao/boleto que o
  // produto cria. Sem cobranca para vincular, entao nao vira nota aqui.
  return vazio;
}

/** Cartao: primeira cobranca e renovacoes. Nunca lanca. */
async function registrarNotaFiscalDeInvoice(
  invoice: Stripe.Invoice,
  sub: Stripe.Subscription,
): Promise<void> {
  if (!env.nfseEnabled) return;
  try {
    // Valor BRUTO efetivamente pago. Zero significa que nao houve servico
    // cobrado (trial, cupom de 100%), e nota de valor zero nao existe.
    const amountCents = invoice.amount_paid ?? 0;
    if (amountCents <= 0) return;

    const userId = sub.metadata?.supabase_user_id;
    if (!userId) return; // applySubscription ja gritou sobre isto.

    const refs = await chargeRefsFromInvoice(invoice);
    if (!refs.chargeId) {
      console.error(
        `[fiscal] invoice ${invoice.id} paga sem cobranca resolvivel; nota nao registrada.`,
      );
      return;
    }

    const { data: row } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("provider_subscription_id", sub.id)
      .maybeSingle();

    const period = subItemPeriod(sub);
    await registerFiscalInvoice({
      userId,
      subscriptionId: row?.id ?? null,
      stripeChargeId: refs.chargeId,
      stripeInvoiceId: invoice.id ?? null,
      stripePaymentIntentId: refs.paymentIntentId,
      amountCents,
      planCode: resolvePlanCode(sub),
      periodStart: period.start,
      periodEnd: period.end,
    });
  } catch (fiscalErr) {
    console.error(
      `[fiscal] falha ao registrar nota da invoice ${invoice.id}; ativacao NAO afetada:`,
      fiscalErr,
    );
    Sentry.captureException(fiscalErr);
  }
}

/** Boleto: e o unico evento de caixa dele (mode:payment nao gera invoice). */
async function registrarNotaFiscalDeBoleto(
  session: Stripe.Checkout.Session,
  dados: {
    userId: string;
    subscriptionRowId: string;
    planCode: string | null;
    periodStart: string;
    periodEnd: string;
  },
): Promise<void> {
  if (!env.nfseEnabled) return;
  try {
    const amountCents = session.amount_total ?? 0;
    if (amountCents <= 0) return;

    const paymentIntentId = idOf(session.payment_intent);
    if (!paymentIntentId) {
      console.error(
        `[fiscal] boleto ${session.id} sem payment intent; nota nao registrada.`,
      );
      return;
    }
    const chargeId = await chargeIdFromPaymentIntent(paymentIntentId);
    if (!chargeId) {
      console.error(
        `[fiscal] boleto ${session.id} sem cobranca no payment intent ${paymentIntentId}; nota nao registrada.`,
      );
      return;
    }

    await registerFiscalInvoice({
      userId: dados.userId,
      subscriptionId: dados.subscriptionRowId,
      stripeChargeId: chargeId,
      // Boleto nao tem invoice na Stripe.
      stripeInvoiceId: null,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      planCode: dados.planCode,
      periodStart: dados.periodStart,
      periodEnd: dados.periodEnd,
    });
  } catch (fiscalErr) {
    console.error(
      `[fiscal] falha ao registrar nota do boleto ${session.id}; ativacao NAO afetada:`,
      fiscalErr,
    );
    Sentry.captureException(fiscalErr);
  }
}

/**
 * Reembolso confirmado pela Stripe: repercute na nota fiscal. Nunca lanca.
 *
 * Fora do `try` que registra o billing_event nao: ele roda DENTRO do switch,
 * como os demais handlers. O que garante que ele nao derruba o webhook e o
 * proprio `applyRefundToFiscalInvoice`, que engole e reporta ao Sentry. Aqui so
 * fica o gate do kill-switch e a leitura dos valores.
 */
async function aplicarReembolsoNaNota(charge: Stripe.Charge): Promise<void> {
  if (!env.nfseEnabled) return;
  if (!charge.id) return;
  await applyRefundToFiscalInvoice({
    stripeChargeId: charge.id,
    grossCents: charge.amount ?? 0,
    refundedTotalCents: charge.amount_refunded ?? 0,
    origem: "webhook",
  });
}

/** Customer da invoice, sem assumir que o campo veio expandido. */
function customerIdOfInvoice(invoice: Stripe.Invoice): string | null {
  const c = invoice.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in c) return String(c.id);
  return null;
}

async function onInvoicePaid(
  event: Stripe.Event,
  eventCreatedAt: Date,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = subscriptionIdFromInvoice(invoice);
  if (!subId) {
    // QUARTO SILENCIO DO CAMINHO DE DINHEIRO, irmao dos tres de
    // `applySubscription`. `invoice.paid` significa que a Stripe RECEBEU o
    // dinheiro; sem assinatura vinculada nao ha o que ativar, e o `return` mudo
    // que estava aqui respondia 200 e apagava o pagamento do mapa.
    //
    // O CASO MEDIDO, 21/08 06:14:43Z. Invoice avulsa
    // `in_1U6fTVQ6lxIhx7VyyFnPu9ut` (352RB0DR-0001), criada no painel da Stripe,
    // R$ 29,90 em boleto, cliente `wssantosdfn24@gmail.com`. O evento chegou, foi
    // gravado em `billing_events`, passou por aqui e foi descartado. A pessoa
    // ficou DEZ DIAS sem o Pro que pagou e nenhum instrumento acusou: o
    // `console.error` nao existia, o detector de orfaos so enxerga Checkout
    // Session paga (`server/lib/orphanPayments.ts:586-589`) e uma invoice avulsa
    // nao tem sessao, e o `reconcile` so itera linhas que ja existem.
    //
    // O NIVEL E `warning`, E ISSO FOI MEDIDO, nao arbitrado. A duvida legitima
    // era se `invoice.paid` de assinatura normal tambem cai aqui, o que
    // transformaria o aviso em ruido. Nao cai: das 173 invoices do historico
    // inteiro da conta, as 172 de assinatura (142 `subscription_create`, 30
    // `subscription_cycle`) tem `parent.subscription_details.subscription`
    // preenchido, e a UNICA sem e a avulsa deste incidente. Este ramo teria
    // disparado exatamente uma vez em toda a vida da conta.
    //
    // `warning` e nao `error` pelo mesmo criterio ja escrito em
    // `stripe_pagamento_sem_dono`: o dinheiro entrou e alguem precisa agir, mas
    // nao e plantao. E o 200 continua CERTO: nao ha erro a retentar, porque a
    // proxima entrega leria a mesma invoice sem assinatura. O que muda aqui e
    // so o rastro.
    console.error(
      `[webhook/stripe] PAGAMENTO SEM ASSINATURA VINCULADA: invoice ${invoice.id} paga ` +
        `(${invoice.amount_paid} ${invoice.currency}, billing_reason ${invoice.billing_reason}) ` +
        `sem subscription no parent (evento ${event.type} ${event.id}, customer ` +
        `${customerIdOfInvoice(invoice) ?? "DESCONHECIDO"}).`,
    );
    // Fingerprint fixo por TIPO, nao pelo id da invoice, pela razao de sempre: o
    // interesse e a serie no tempo, e uma issue por ocorrencia carrega a mesma
    // informacao que nenhuma. Issue propria e nao reaproveitada de
    // `stripe_pagamento_sem_assinatura`: aquele e sobre Checkout Session paga sem
    // subscription, este e sobre INVOICE paga sem subscription, e sao origens
    // diferentes que pedem conserto diferente.
    Sentry.captureMessage("stripe_invoice_paga_sem_assinatura", {
      level: "warning",
      fingerprint: ["stripe-invoice-paga-sem-assinatura"],
      tags: { origem: "stripe-webhook", event_type: event.type },
      extra: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
        event_id: event.id,
        customer_id: customerIdOfInvoice(invoice),
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        billing_reason: invoice.billing_reason,
        collection_method: invoice.collection_method,
      },
    });
    return;
  }
  const sub = await getStripe().subscriptions.retrieve(subId);
  await applySubscription(sub, event, eventCreatedAt);
  // DEPOIS da logica existente, de proposito: a assinatura precisa estar
  // gravada para a nota poder apontar para ela.
  await registrarNotaFiscalDeInvoice(invoice, sub);
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
    throw createError(500, "db_error", "Erro ao marcar past_due.", {
      cause: erroEncadeavel(error),
    });
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

// DECISAO (Fase 2 da NFS-e): a sessao de Checkout NAO usa
// `billing_address_collection` nem `tax_id_collection`.
//
// As duas existem e resolveriam a coleta sem UI nova, mas criariam uma SEGUNDA
// fonte para o dado fiscal, ao lado de `profiles`. Duas fontes do mesmo dado
// divergem: a pessoa corrige o CPF no perfil, a Stripe continua com o antigo, e
// a nota sai com um dos dois sem que ninguem saiba qual. A fonte unica e
// `profiles`, coletada pela FiscalDataModal antes do checkout.
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
        { cause: erroEncadeavel(guardError) },
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
      { cause: erroEncadeavel(pendingError) },
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

  if (input.paymentMethod === "boleto") {
    // Boleto: pagamento unico (mode: payment). Nao pode usar price recurring, entao
    // o valor vem inline de planPricing.ts (fonte unica: e o que o site mostra e o
    // que a Stripe cobra). O acesso Pro so e concedido quando o boleto compensa
    // (async_payment_succeeded, proxima task); por isso metadata carrega
    // payment_method/renewal_type/access_days para a linha ser reidratada la.
    const accessDays = oneOffAccessDays(input.planId);
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
      customer_email: input.user.email || undefined,
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
    // TODOS os metodos habilitados na conta, inclusive Boleto, e um boleto pago por
    // aqui viraria uma sessao mode:subscription SEM metadata.payment_method='boleto'
    // nem access_days, tratado como cartao e fora da regua de renovacao manual.
    // 'card' ja exibe Apple Pay e Google Pay automaticamente (carteiras de cartao,
    // sem entry propria). Link NAO entra: a Stripe rejeita 'link' explicito em
    // mode:subscription com 400 (derrubou o checkout em prod, commit 61869dd). Boleto
    // fica de fora (o caminho de boleto e o outro branch, mode:payment).
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: input.user.id,
    customer_email: input.user.email || undefined,
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

  if (error)
    throw createError(500, "db_error", "Erro ao buscar assinatura.", {
      cause: erroEncadeavel(error),
    });
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
      throw createError(500, "db_error", "Erro ao verificar cancelamento.", {
        cause: erroEncadeavel(intentError),
      });
    }

    if (!existingIntent) {
      const { error: insertError } = await supabaseAdmin
        .from("subscription_cancellations")
        .insert({
          user_id: input.userId,
          canceled_by: input.actorUserId,
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
          { cause: erroEncadeavel(insertError) },
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
      { cause: erroEncadeavel(updateError) },
    );
  }

  const { error: logError } = await supabaseAdmin
    .from("subscription_cancellations")
    .insert({
      user_id: input.userId,
      canceled_by: input.actorUserId,
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

  if (error)
    throw createError(500, "db_error", "Erro ao buscar assinatura.", {
      cause: erroEncadeavel(error),
    });

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
        { cause: erroEncadeavel(revertError) },
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
      { cause: erroEncadeavel(updateError) },
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

  // EVENTO DE SANDBOX NO BANCO DE PRODUCAO: recusado aqui, antes de qualquer
  // escrita.
  //
  // Nao e hipotese. Em 2026-08-14 a varredura achou em `billing_events` de
  // PRODUCAO um `checkout.session.completed` de `cs_test_a1hjDcpNU...`
  // (murilo1234@gmail.com, R$ 24,90, 2026-07-15). Ele ficou la, contando como
  // uma das duas sessoes "sem linha em subscriptions", ou seja, virou um falso
  // positivo permanente na unica ferramenta que existe para achar pagamento
  // perdido. Alarme com ruido conhecido dentro e alarme que alguem desliga.
  //
  // Por que 2xx e nao erro: para a Stripe, 4xx/5xx significa "tente de novo", e
  // o evento voltaria em loop pelo prazo de retry inteiro. O evento chegou e foi
  // entendido; a decisao de nao guarda-lo e NOSSA, e um retry nao mudaria nada.
  //
  // So em producao: fora dela, o comportamento atual fica intacto, porque e
  // justamente ali que evento de teste E o fluxo normal.
  if (env.isProd && event.livemode === false) {
    console.warn(
      `[webhook/stripe] evento de MODO TESTE ignorado em producao: ${event.type} (${event.id}). ` +
        `Nao persistido, nao processado.`,
    );
    Sentry.addBreadcrumb({
      category: "webhook",
      level: "warning",
      message: "stripe test-mode event ignored in production",
      data: { eventId: event.id, eventType: event.type },
    });
    return { received: true, ignoredTestMode: true };
  }

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
    throw createError(500, "db_error", "Erro ao registrar evento.", {
      cause: erroEncadeavel(dedupeError),
    });
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
        // Efeito fiscal do reembolso. Le `amount` e `amount_refunded` do
        // proprio evento: a Charge ja traz o ACUMULADO devolvido, que e
        // exatamente o que distingue integral de parcial, sem consulta extra.
        if (event.type === "charge.refunded") {
          await aplicarReembolsoNaNota(event.data.object as Stripe.Charge);
        }
        break;
      default:
        // Evento NAO tratado: nao ha mutacao, entao o dedup nao protege nada aqui e
        // ainda deixaria o evento IRRECUPERAVEL por resend caso um handler seja
        // adicionado depois (ja aconteceu: um async_payment_succeeded caiu aqui na
        // janela de um deploy e ficou preso). Remove o proprio billing_event para
        // que um resend futuro chegue ao (novo) handler. O dedup dos eventos
        // TRATADOS fica intacto (eles nao passam por aqui). A Stripe nao reenvia
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

/**
 * ATENCAO: `subscriptionId` precisa ser um id de ASSINATURA (`sub_...`).
 *
 * Linha de BOLETO (`renewal_type='manual'`) guarda um id de SESSAO (`cs_...`)
 * em `provider_subscription_id`, e passa-lo aqui faz o retrieve falhar sempre.
 * Ver a nota no chamador em server/routes/cron.ts (process-cancellations).
 */
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
