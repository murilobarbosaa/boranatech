import * as Sentry from "@sentry/node";

import { erroEncadeavel } from "./supabaseError";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * EVENTOS DE CREATOR: um registro por clique, checkout e venda em
 * `public.creator_events` (migration 20260913120000), escrito AO LADO dos
 * contadores de `affiliates`, que continuam sendo a fonte do total. Estes
 * eventos existem para a serie por dia do painel, que os contadores nao dao.
 *
 * NUNCA LANCA. O evento e telemetria e roda dentro do webhook de pagamento e da
 * rota publica de clique: um erro aqui nao pode derrubar a ativacao de uma
 * assinatura nem a resposta generica do clique. Falha vai para o Sentry e a
 * funcao devolve `{ ok: false }`.
 *
 * Quem chama decide QUANDO gravar (so depois de o contador correspondente ter
 * sido incrementado com sucesso), para a serie bater com o total. Esta funcao so
 * resolve o que o chamador pode nao ter em maos (o id do afiliado a partir do
 * codigo, o uuid do plano a partir do codigo do plano) e grava.
 */
export type CreatorEventType = "click" | "checkout" | "sale";

export type CreatorEventInput = {
  eventType: CreatorEventType;
  /** Id do afiliado. Quando so o codigo e conhecido, passe `affiliateCode`. */
  affiliateId?: string | null;
  affiliateCode?: string | null;
  userId?: string | null;
  subscriptionId?: string | null;
  /** uuid de public.plans. Quando so o codigo e conhecido, passe `planCode`. */
  planId?: string | null;
  planCode?: string | null;
  paymentMethod?: string | null;
  revenueCents?: number | null;
  commissionCents?: number | null;
  metadata?: Record<string, unknown>;
};

export async function recordCreatorEvent(
  input: CreatorEventInput,
): Promise<{ ok: boolean }> {
  try {
    let affiliateId = input.affiliateId ?? null;
    if (!affiliateId && input.affiliateCode) {
      const { data, error } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("code", input.affiliateCode)
        .maybeSingle();
      if (error) throw error;
      affiliateId = (data as { id: string } | null)?.id ?? null;
    }
    if (!affiliateId) {
      // Codigo que nao existe mais (afiliado removido entre o checkout e o
      // evento). Nao e falha de infraestrutura, entao nao vai para o Sentry;
      // fica no log para quem for conferir a serie contra o contador.
      console.warn(
        `[creator_events] evento ${input.eventType} sem afiliado (codigo ${input.affiliateCode ?? "?"}); nao gravado.`,
      );
      return { ok: false };
    }

    // O PLANO NUNCA DESCARTA O EVENTO. Codigo que nao resolve para uuid (plano
    // inexistente ou falha na consulta) grava o evento mesmo assim, com
    // `plan_id: null` e o codigo recebido em `metadata.plan_code`: perder o
    // clique ou a venda por causa de um rotulo faria a serie divergir do
    // contador, e o codigo guardado permite corrigir depois.
    let planId = input.planId ?? null;
    let planCodeNaoResolvido: string | null = null;
    if (!planId && input.planCode) {
      try {
        const { data, error } = await supabaseAdmin
          .from("plans")
          .select("id")
          .eq("code", input.planCode)
          .maybeSingle();
        if (error) throw error;
        planId = (data as { id: string } | null)?.id ?? null;
      } catch (planError) {
        Sentry.captureException(erroEncadeavel(planError), {
          tags: { origem: "creator_events", event_type: input.eventType },
          extra: { plan_code: input.planCode, etapa: "resolver plano" },
        });
      }
      if (!planId) planCodeNaoResolvido = input.planCode;
    }

    const { error } = await supabaseAdmin.from("creator_events").insert({
      affiliate_id: affiliateId,
      event_type: input.eventType,
      user_id: input.userId ?? null,
      subscription_id: input.subscriptionId ?? null,
      plan_id: planId,
      payment_method: input.paymentMethod ?? null,
      revenue_cents: input.revenueCents ?? null,
      commission_cents: input.commissionCents ?? null,
      metadata: planCodeNaoResolvido
        ? { ...(input.metadata ?? {}), plan_code: planCodeNaoResolvido }
        : (input.metadata ?? {}),
    });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    // O erro do Supabase chega como objeto plano; sem virar `Error` o Sentry
    // perde a mensagem (ver server/lib/supabaseError.ts).
    Sentry.captureException(erroEncadeavel(err), {
      tags: { origem: "creator_events", event_type: input.eventType },
      extra: {
        affiliate_id: input.affiliateId ?? null,
        affiliate_code: input.affiliateCode ?? null,
        user_id: input.userId ?? null,
        subscription_id: input.subscriptionId ?? null,
      },
    });
    console.error(
      `[creator_events] falha ao gravar evento ${input.eventType}:`,
      err,
    );
    return { ok: false };
  }
}
