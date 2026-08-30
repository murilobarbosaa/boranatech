import * as Sentry from "@sentry/node";

import { invalidateProStatusCache } from "../lib/proStatusCache";
import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import type { Gender } from "../../shared/gender";

// Regra de "primeira compra" compartilhada entre os providers: o usuario nao tem
// nenhuma subscription que ja tenha sido ativada (current_period_start
// preenchido). Fonte unica para o desconto de afiliado nao divergir entre Asaas
// e Stripe (o desconto de cupom so vale na primeira compra).
export async function isFirstPurchase(userId: string): Promise<boolean> {
  const { data: priorActivated } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .not("current_period_start", "is", null)
    .limit(1)
    .maybeSingle();
  return !priorActivated;
}

/**
 * Conversao de afiliado: a UNICA escrita no ledger de comissao em todo o
 * sistema. `increment_affiliate_conversion` e uma escrita COMPOSTA e sem
 * desfazer pela aplicacao (soma 1 em `sales`, soma a receita e soma a comissao
 * no mesmo UPDATE), entao o que entra aqui e definitivo.
 *
 * REGRA: ausencia de valor pago NAO escreve.
 *
 * Chamar com zero quando o evento simplesmente nao declarou valor gravaria uma
 * venda de valor zero, indistinguivel de uma venda 100 por cento descontada
 * legitima. A partir dai o extrato do afiliado mente e ninguem consegue saber
 * quais linhas conferir, que e a classe de falha em silencio que este projeto ja
 * pagou caro. Zero DECLARADO e outra coisa e continua entrando.
 *
 * EXPORTADA para teste, no mesmo criterio de `expirarBoletosVencidos` em
 * server/routes/cron.ts: o que importa provar e SE a escrita acontece e com qual
 * numero, e isso so se prova rodando a funcao.
 */
export async function recordAffiliateConversion(params: {
  userId: string;
  affiliateCode: string;
  /** `undefined` = o evento nao declarou cobranca. Ver paidAmountCentsFromEvent. */
  revenueCents: number | undefined;
  prevStatus: string | null;
  nextStatus: string;
  sourceEvent?: { id: string; type: string; subscriptionId: string | null };
}): Promise<void> {
  const { userId, affiliateCode, revenueCents, sourceEvent } = params;

  if (revenueCents === undefined) {
    // Nao escreve nada e manda o caso para o Sentry com o que o replay manual
    // precisa. Lacuna VISIVEL vale mais que numero errado invisivel: e a mesma
    // escolha que o `contarLinhas` devolvendo -1 documentou pelo avesso.
    //
    // `warning` e nao `error`, e fingerprint fixo por tipo, pelos mesmos motivos
    // escritos em `stripe_pagamento_sem_dono`: interessa a serie no tempo, e
    // ninguem esta sem o que pagou neste instante (o comprador tem acesso; quem
    // fica sem numero e o afiliado).
    Sentry.captureMessage("stripe_conversao_sem_valor_pago", {
      level: "warning",
      fingerprint: ["stripe-conversao-sem-valor-pago"],
      tags: {
        origem: "stripe-webhook",
        event_type: sourceEvent?.type ?? "desconhecido",
      },
      extra: {
        event_id: sourceEvent?.id ?? null,
        event_type: sourceEvent?.type ?? null,
        subscription_id: sourceEvent?.subscriptionId ?? null,
        user_id: userId,
        affiliate_code: affiliateCode,
        prev_status: params.prevStatus,
        next_status: params.nextStatus,
      },
    });
    console.error(
      `[webhook/stripe] conversao do afiliado ${affiliateCode} (user ${userId}) ` +
        `sem valor pago declarado no evento ${sourceEvent?.type ?? "?"} ` +
        `(${sourceEvent?.id ?? "?"}); NAO incrementada, replay manual necessario.`,
    );
    return;
  }

  try {
    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("code", affiliateCode)
      .maybeSingle();
    if (affiliate) {
      await supabaseAdmin.rpc("increment_affiliate_conversion", {
        p_affiliate_id: affiliate.id,
        // Zero DECLARADO entra: venda integralmente descontada e uma venda, e
        // conta em `sales` com comissao zero.
        p_revenue_cents: revenueCents,
      });
    }
  } catch (affiliateError) {
    console.error(
      "[webhook/stripe] Falha ao contar conversao de afiliado:",
      affiliateError,
    );
  }
}

/**
 * Contato do dono da assinatura, para o e-mail transacional.
 *
 * Morava dentro de `server/providers/stripe.ts`, privado. Subiu para ca no Lote
 * 2b porque os efeitos de ativacao passaram a ser compartilhados, e o e-mail e
 * um deles.
 */
export async function getUserContact(userId: string): Promise<{
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

/**
 * EFEITOS DA ATIVACAO DE UMA ASSINATURA, em um lugar so.
 *
 * Ate o Lote 2a estes efeitos viviam dentro de `handleTransition`, no provedor
 * da Stripe, e o caminho do Pix reimplementava por fora os dois que conseguia
 * alcancar (cache e cupom) e simplesmente NAO tinha o terceiro: quem pagava por
 * Pix ganhava acesso e nao recebia e-mail nenhum. Regra duplicada em dois
 * provedores diverge no primeiro que alguem esquecer de atualizar; esta funcao
 * existe para que nao haja um segundo lugar.
 *
 * ASSINATURA AGNOSTICA DE PROVEDOR: recebe dados, nunca o objeto de evento da
 * Stripe. `sourceEvent` e so procedencia para o Sentry, ja normalizada pelo
 * chamador.
 *
 * SO DEVE SER CHAMADA QUANDO A ATIVACAO DE FATO ACONTECEU. Nos dois provedores
 * isso e `out_activated === true` da RPC (ou o `becameActive` do caminho de
 * cartao): uma reentrega que nao ativou nada nao pode reenviar e-mail nem
 * recontar comissao.
 *
 * ORDEM PRESERVADA da versao anterior: cache, afiliado, cupom, e-mail. O cache
 * primeiro e de proposito, e `void` de proposito: e o unico efeito que muda o
 * que a pessoa VE agora, e nao vale a pena esperar por ele.
 */
export async function applyActivationEffects(params: {
  userId: string;
  /** Rotulo do log, para distinguir a origem sem ramificar comportamento. */
  logPrefix: string;
  planName?: string;
  affiliateCode?: string | null;
  couponCode?: string | null;
  /** `undefined` = o evento nao declarou valor. Ver recordAffiliateConversion. */
  revenueCents?: number;
  sourceEvent?: { id: string; type: string; subscriptionId: string | null };
  prevStatus?: string | null;
}): Promise<void> {
  const { userId, logPrefix } = params;

  void invalidateProStatusCache(userId);

  if (params.affiliateCode) {
    await recordAffiliateConversion({
      userId,
      affiliateCode: params.affiliateCode,
      revenueCents: params.revenueCents,
      prevStatus: params.prevStatus ?? null,
      nextStatus: "active",
      sourceEvent: params.sourceEvent,
    });
  }

  // Resgate do cupom: conta SO na ativacao (nunca na criacao da sessao), no
  // mesmo ponto da conversao de afiliado. Best-effort: falha loga e nao derruba
  // o webhook, porque o acesso ja foi concedido e o contador nao vale um retry
  // do evento inteiro.
  if (params.couponCode) {
    try {
      await supabaseAdmin.rpc("increment_coupon_redemption", {
        p_code: params.couponCode,
      });
    } catch (couponError) {
      console.error(
        `[${logPrefix}] Falha ao contar resgate de cupom:`,
        couponError,
      );
    }
  }

  // E-mail de confirmacao. O template `pro_upgrade` e AGNOSTICO do meio de
  // pagamento (server/lib/email.ts, sendProUpgradeEmail: fala de plano e
  // beneficios, nunca de cartao, boleto ou Pix), entao serve aos tres sem
  // variante nova e sem texto novo.
  try {
    const { email, name, gender } = await getUserContact(userId);
    if (!email) return;
    await enqueueEmail({
      type: "pro_upgrade",
      to: email,
      name,
      gender,
      planName: params.planName || "Pro",
    });
  } catch (emailError) {
    // O e-mail segue BEST-EFFORT: a ativacao ja aconteceu e o acesso ja foi
    // concedido, entao derrubar o webhook aqui trocaria uma confirmacao
    // atrasada por um retry do evento inteiro. Mas deixa de ser INVISIVEL: um
    // `console.error` no meio do log nao faz ninguem agir, e este catch ja
    // engoliu em silencio um TypeError que impedia TODO e-mail de ativacao do
    // Pix de sair (achado na revisao do Lote 2b).
    Sentry.captureMessage("ativacao_email_falhou", {
      level: "warning",
      fingerprint: ["ativacao-email-falhou"],
      tags: { origem: logPrefix },
      extra: {
        user_id: userId,
        template: "pro_upgrade",
        provedor: logPrefix,
        erro:
          emailError instanceof Error ? emailError.message : String(emailError),
      },
    });
    console.error(
      `[${logPrefix}] Erro ao processar e-mail transacional`,
      emailError,
    );
  }
}

/**
 * INTENCAO DE NAO RENOVAR, para os meios de pagamento AVULSOS (boleto e Pix).
 *
 * Nao existe assinatura remota a cancelar nesses fluxos: "cancelar" e registrar
 * que a pessoa nao quer renovar, e o acesso termina sozinho em
 * `current_period_end`, que e o que `is_user_pro` ja avalia. NAO seta
 * `cancel_at_period_end` de proposito (isso acordaria o bug latente do cron
 * `process-cancellations`, que passaria um id de sessao para um retrieve de
 * assinatura) e NAO chama provedor nenhum.
 *
 * Idempotente por pre-checagem, e FAIL-LOUD: o INSERT E a acao inteira, entao um
 * erro aqui significa que nada aconteceu e precisa subir para a UI.
 *
 * Devolve `true` quando gravou agora, `false` quando ja existia.
 */
export async function recordNonRenewalIntent(params: {
  userId: string;
  actorUserId: string;
  providerSubscriptionId: string | null;
  reasonCode: string;
  reasonText: string;
  effectiveAt: string | null;
}): Promise<boolean> {
  const { data: existente, error: buscaError } = await supabaseAdmin
    .from("subscription_cancellations")
    .select("id")
    .eq("provider_subscription_id", params.providerSubscriptionId)
    .neq("status", "reverted")
    .order("canceled_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (buscaError) {
    throw createError(500, "db_error", "Erro ao verificar cancelamento.", {
      cause: buscaError,
    });
  }
  if (existente) return false;

  const { error: insertError } = await supabaseAdmin
    .from("subscription_cancellations")
    .insert({
      user_id: params.userId,
      canceled_by: params.actorUserId,
      provider_subscription_id: params.providerSubscriptionId,
      reason_code: params.reasonCode || null,
      reason_text: params.reasonText || null,
      effective_at: params.effectiveAt,
      status: "scheduled",
    });
  if (insertError) {
    throw createError(
      500,
      "db_error",
      "Não foi possível registrar. Tente novamente.",
      { cause: insertError },
    );
  }
  return true;
}

/**
 * Desfaz a intencao de nao renovar. Mesma semantica do boleto: marca como
 * 'reverted', sem tocar provedor nenhum. FAIL-LOUD (o update E a acao), e
 * idempotente: um segundo clique nao acha 'scheduled' e retorna sucesso.
 */
export async function revertNonRenewalIntent(
  providerSubscriptionId: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscription_cancellations")
    .update({ status: "reverted" })
    .eq("provider_subscription_id", providerSubscriptionId)
    .eq("status", "scheduled");
  if (error) {
    throw createError(
      500,
      "db_error",
      "Não foi possível desfazer. Tente novamente.",
      { cause: error },
    );
  }
}
