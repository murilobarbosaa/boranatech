import * as Sentry from "@sentry/node";

import { supabaseAdmin } from "../lib/supabaseAdmin";

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
