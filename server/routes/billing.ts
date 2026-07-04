import { Router } from "express";
import crypto from "crypto";

import {
  createAsaasCheckout,
  getAsaasSubscriptionPayments,
  getOrCreateAsaasCustomer,
  updateAsaasPaymentValue,
} from "../lib/asaas";
import {
  cancelSubscriptionAtAsaas,
  cancelSubscriptionImmediatelyAtAsaas,
  reactivateSubscriptionAtAsaas,
} from "../lib/billing-asaas";
import { PLAN_CYCLE_MONTHS, addMonths } from "../lib/billing-cycle";
import { env } from "../lib/env";
import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import type { Gender } from "../../shared/gender";

const router = Router();
const PLAN_VALUES: Record<string, number> = {
  pro_monthly: 24.9,
  pro_semiannual: 119.4,
  pro_annual: 179.9,
};

const PLAN_CYCLES: Record<string, "MONTHLY" | "SEMIANNUALLY" | "YEARLY"> = {
  pro_monthly: "MONTHLY",
  pro_semiannual: "SEMIANNUALLY",
  pro_annual: "YEARLY",
};

const CANCELING_EVENTS = new Set([
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
  "SUBSCRIPTION_EXPIRED",
]);

function extractSubscriptionId(event: Record<string, unknown>): string | null {
  const payment = event?.payment as Record<string, unknown> | undefined;
  const sub = payment?.subscription ?? event?.subscription;
  if (!sub) return null;
  if (typeof sub === "string") return sub;
  if (typeof sub === "object" && sub !== null) {
    return String((sub as Record<string, unknown>).id || "") || null;
  }
  return null;
}

router.get("/subscription", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const [{ data: subscription, error }, { data: isProRpc, error: rpcError }] =
      await Promise.all([
        supabaseAdmin
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("user_id", userId)
          .in("status", ["active", "trialing", "past_due"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin.rpc("is_user_pro", { p_user_id: userId }),
      ]);

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar assinatura."));
    }

    if (rpcError) {
      console.error("[billing/subscription] is_user_pro RPC failed:", rpcError);
    }

    const isPro = !rpcError && isProRpc === true;

    if (!subscription) {
      const { data: freePlan } = await supabaseAdmin
        .from("plans")
        .select("*")
        .eq("code", "free")
        .single();

      return res.json({
        data: {
          plan: freePlan,
          status: "free",
          isPro,
        },
      });
    }

    res.json({
      data: {
        ...subscription,
        isPro,
      },
    });
  } catch (err) {
    next(err);
  }
});

const VALID_CANCEL_REASONS = new Set([
  "expensive",
  "unused",
  "missing_feature",
  "paused",
  "other",
]);

router.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = (req.body || {}) as {
      reason_code?: unknown;
      reason_text?: unknown;
    };

    const reasonCode =
      typeof body.reason_code === "string" ? body.reason_code.trim() : "";
    const reasonText =
      typeof body.reason_text === "string"
        ? body.reason_text.trim().slice(0, 500)
        : "";

    if (reasonCode && !VALID_CANCEL_REASONS.has(reasonCode)) {
      return next(
        createError(
          400,
          "invalid_reason_code",
          "Motivo de cancelamento inválido.",
        ),
      );
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, provider_subscription_id, current_period_end, status, cancel_at_period_end",
      )
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return next(createError(500, "db_error", "Erro ao buscar assinatura."));
    }

    if (!subscription) {
      return next(
        createError(404, "not_found", "Nenhuma assinatura ativa encontrada."),
      );
    }

    if (subscription.cancel_at_period_end) {
      return next(
        createError(409, "already_scheduled", "Cancelamento já está agendado."),
      );
    }

    // c. endDate = current_period_end em YYYY-MM-DD (mesma conversao validada no sandbox).
    const endDate = subscription.current_period_end
      ? new Date(subscription.current_period_end).toISOString().split("T")[0]
      : null;

    // Guard: sem periodo valido => assinatura nunca foi paga. Cancela na hora.
    if (!endDate) {
      if (subscription.provider_subscription_id) {
        try {
          await cancelSubscriptionImmediatelyAtAsaas(
            subscription.provider_subscription_id,
          );
        } catch (asaasErr) {
          console.error(
            `[billing/cancel] Asaas falhou ao encerrar sub sem periodo ${subscription.provider_subscription_id}; banco nao alterado:`,
            asaasErr,
          );
          return next(
            createError(
              502,
              "asaas_error",
              "Não foi possível cancelar no provedor. Tente novamente.", // TODO(Ana)
            ),
          );
        }
      }

      const nowIso = new Date().toISOString();
      const { error: cancelError } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: nowIso })
        .eq("id", subscription.id);

      if (cancelError) {
        console.error(
          `[billing/cancel] update DB falhou no cancelamento imediato (sub ${subscription.id}):`,
          cancelError,
        );
        return next(
          createError(
            500,
            "db_error",
            "Erro ao registrar cancelamento. Tente novamente.", // TODO(Ana)
          ),
        );
      }

      const { error: auditError } = await supabaseAdmin
        .from("subscription_cancellations")
        .insert({
          user_id: userId,
          provider_subscription_id:
            subscription.provider_subscription_id || null,
          reason_code: reasonCode || null,
          reason_text: reasonText || null,
          effective_at: nowIso,
          // status do cancelamento como processo: imediato ja concluiu, entao
          // "completed". A tabela subscription_cancellations so aceita
          // scheduled/completed/reverted (CHECK constraint); "canceled" e valido na
          // tabela subscriptions, nao aqui.
          status: "completed",
        });
      // Best-effort logado, nao gate: o cancelamento ja aconteceu no Asaas e
      // na tabela subscriptions; falha de auditoria nao derruba a rota.
      if (auditError) {
        console.error(
          "[billing/cancel] Falha ao registrar auditoria do cancelamento imediato:",
          auditError,
        );
      }

      try {
        const { data: authData } =
          await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmail = authData?.user?.email || "";
        const userName = String(
          authData?.user?.user_metadata?.name ||
            authData?.user?.email?.split("@")[0] ||
            "usuário",
        );
        const { data: profileData } = await supabaseAdmin
          .from("profiles")
          .select("gender")
          .eq("user_id", userId)
          .maybeSingle();
        const userGender =
          (profileData?.gender as Gender | null | undefined) ?? null;
        if (userEmail) {
          await enqueueEmail({
            type: "cancellation",
            to: userEmail,
            name: userName,
            gender: userGender,
          });
        }
      } catch (emailError) {
        console.error(
          "[billing/cancel] Erro ao enfileirar e-mail de cancelamento imediato:",
          emailError,
        );
      }

      return res.json({
        data: {
          cancel_at_period_end: false,
          effective_at: nowIso,
          status: "canceled",
          message: "Sua assinatura foi cancelada.", // TODO(Ana)
        },
      });
    }

    // d + e. Asaas PRIMEIRO; banco depois. Se o Asaas falhar, o banco NAO reflete o
    // cancelamento (estado consistente). Esta etapa e idempotente e segura para retry:
    // endDate pode ser reenviado e o DELETE trata 404 (cobranca ja removida) como sucesso.
    // Logo, se o passo (f) falhar, basta repetir POST /cancel, sem efeito colateral.
    if (subscription.provider_subscription_id && endDate) {
      try {
        await cancelSubscriptionAtAsaas(
          subscription.provider_subscription_id,
          endDate,
        );
      } catch (asaasErr) {
        // Falha em (d) ou na listagem: banco intacto, estado consistente. Pode repetir.
        console.error(
          `[billing/cancel] Asaas falhou para sub ${subscription.provider_subscription_id}; banco nao alterado:`,
          asaasErr,
        );
        return next(
          createError(
            502,
            "asaas_error",
            "Não foi possível agendar o cancelamento no provedor. Tente novamente.",
          ),
        );
      }
    } else {
      console.warn(
        `[billing/cancel] sub ${subscription.id} sem provider_subscription_id/current_period_end; pulando Asaas (apenas flag no banco).`,
      );
    }

    // f. SO ENTAO o banco.
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("id", subscription.id);

    if (updateError) {
      // INCONSISTENCIA CONHECIDA: Asaas ja recebeu endDate + DELETE das pendentes, mas o
      // banco nao registrou cancel_at_period_end. NAO revertemos no Asaas: re-habilitar o
      // billing contraria a intencao do usuario e nao da pra "des-deletar" uma cobranca.
      // Como o fluxo Asaas e idempotente e o 404 do DELETE conta como sucesso, a correcao
      // segura e o usuario/operador repetir POST /cancel. Logamos para o operador; nao ha
      // rollback magico aqui.
      console.error(
        `[billing/cancel] INCONSISTENCIA: Asaas ok mas update DB falhou (sub ${subscription.id}, provider ${subscription.provider_subscription_id}, endDate ${endDate}). Retry seguro: POST /cancel.`,
        updateError,
      );
      return next(
        createError(
          500,
          "db_error",
          "Cancelamento agendado no provedor, mas houve erro ao registrar. Tente novamente.",
        ),
      );
    }

    const { error: logError } = await supabaseAdmin
      .from("subscription_cancellations")
      .insert({
        user_id: userId,
        provider_subscription_id: subscription.provider_subscription_id || null,
        reason_code: reasonCode || null,
        reason_text: reasonText || null,
        effective_at: subscription.current_period_end,
        status: "scheduled",
      });

    if (logError) {
      console.error(
        "[billing/cancel] Erro ao registrar motivo de cancelamento:",
        logError,
      );
    }

    try {
      const { data: authData } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authData?.user?.email || "";
      const userName = String(
        authData?.user?.user_metadata?.name ||
          authData?.user?.email?.split("@")[0] ||
          "usuário",
      );
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("gender")
        .eq("user_id", userId)
        .maybeSingle();
      const userGender =
        (profileData?.gender as Gender | null | undefined) ?? null;

      if (userEmail && subscription.current_period_end) {
        await enqueueEmail({
          type: "cancellation_scheduled",
          to: userEmail,
          name: userName,
          gender: userGender,
          effectiveAt: subscription.current_period_end,
        });
      }
    } catch (emailError) {
      console.error(
        "[billing/cancel] Erro ao enfileirar e-mail de confirmação:",
        emailError,
      );
    }

    const effectiveAt = subscription.current_period_end;
    const formattedDate = effectiveAt
      ? new Date(effectiveAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "o fim do período pago";

    res.json({
      data: {
        cancel_at_period_end: true,
        effective_at: effectiveAt,
        message: `Sua assinatura foi cancelada. Você mantém acesso Pro até ${formattedDate}.`,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/reactivate", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Busca a sub mais recente do usuario, SEM filtrar por status (precisamos ver
    // canceladas para distinguir Caso A vs Caso B).
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, provider_subscription_id, current_period_end, status, cancel_at_period_end",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return next(createError(500, "db_error", "Erro ao buscar assinatura."));
    }

    const nowIso = new Date().toISOString();
    const outOfWindow =
      !subscription ||
      subscription.status === "canceled" ||
      !subscription.current_period_end ||
      subscription.current_period_end <= nowIso;

    // Caso B (fora da janela): nada a desfazer no Asaas; sinaliza ao front para
    // mandar ao /planos (novo checkout). 200, nao 4xx, e um branch esperado.
    if (outOfWindow) {
      return res.json({
        data: {
          redirect_to_checkout: true,
          checkout_path: "/planos",
          message: "Sua janela de reativação venceu. Vamos para um novo plano.",
        },
      });
    }

    // Idempotencia: ja esta ativa, nada a desfazer. 409 simetrico ao /cancel
    // ("already_scheduled" la, "already_active" aqui).
    if (!subscription.cancel_at_period_end) {
      return next(
        createError(409, "already_active", "Assinatura já está ativa."),
      );
    }

    // Boundary ampliado (decisao da etapa 5b): aceita status in
    // ('active', 'trialing', 'past_due'), simetrico ao /cancel que aceita os 3
    // para agendar cancelamento. Status fora dessa lista (canceled ja capturado
    // em outOfWindow; outros raros) cai em Caso B.
    if (!["active", "trialing", "past_due"].includes(subscription.status)) {
      return res.json({
        data: {
          redirect_to_checkout: true,
          checkout_path: "/planos",
          message:
            "Reativação não disponível para este plano. Vamos para um novo plano.",
        },
      });
    }

    // Caso A. Asaas PRIMEIRO, banco depois. Mesmas propriedades de retry-safe
    // do /cancel: reactivateSubscriptionAtAsaas e idempotente (PUT endDate=null
    // reenviado tem o mesmo efeito, validado empiricamente na etapa 5a), entao
    // se o passo do banco falhar, repetir POST /reactivate e seguro.
    if (subscription.provider_subscription_id) {
      try {
        await reactivateSubscriptionAtAsaas(
          subscription.provider_subscription_id,
        );
      } catch (asaasErr) {
        console.error(
          `[billing/reactivate] Asaas falhou para sub ${subscription.provider_subscription_id}; banco nao alterado:`,
          asaasErr,
        );
        return next(
          createError(
            502,
            "asaas_error",
            "Não foi possível reativar a assinatura no provedor. Tente novamente.",
          ),
        );
      }
    } else {
      console.warn(
        `[billing/reactivate] sub ${subscription.id} sem provider_subscription_id; pulando Asaas (apenas flag no banco).`,
      );
    }

    // Banco: desfaz o flag.
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("id", subscription.id);

    if (updateError) {
      // INCONSISTENCIA CONHECIDA (simetrica ao /cancel): Asaas ja recebeu
      // endDate=null, mas o banco nao limpou o flag. NAO revertemos no Asaas
      // (re-setar endDate exigiria recalcular o current_period_end e contraria
      // a intencao do usuario). Como o fluxo Asaas e idempotente, o retry de
      // POST /reactivate corrige sem efeito colateral.
      console.error(
        `[billing/reactivate] INCONSISTENCIA: Asaas ok mas update DB falhou (sub ${subscription.id}, provider ${subscription.provider_subscription_id}). Retry seguro: POST /reactivate.`,
        updateError,
      );
      return next(
        createError(
          500,
          "db_error",
          "Reativação confirmada no provedor, mas houve erro ao registrar. Tente novamente.",
        ),
      );
    }

    // Auditoria: marca registros 'scheduled' como 'reverted'. Constraint ja
    // aceita esse valor (migration 20260517231011:747). Nao-fatal, se falhar so loga.
    const { error: revertError } = await supabaseAdmin
      .from("subscription_cancellations")
      .update({ status: "reverted" })
      .eq("user_id", userId)
      .eq("status", "scheduled");

    if (revertError) {
      console.error(
        "[billing/reactivate] Erro ao marcar cancelamento como reverted:",
        revertError,
      );
    }

    // PENDENCIA: nao ha email "reactivation confirmed" em server/lib/email.ts.
    // Criar quando voltarmos pra comunicacao transacional do billing.

    res.json({
      data: {
        cancel_at_period_end: false,
        message: "Sua assinatura foi reativada. A renovação volta ao normal.",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const affiliateCode =
      typeof req.body?.affiliateCode === "string"
        ? req.body.affiliateCode.trim().toUpperCase()
        : "";
    const planId =
      typeof req.body?.planId === "string" && PLAN_VALUES[req.body.planId]
        ? req.body.planId
        : "pro_monthly";

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return next(createError(404, "not_found", "Perfil não encontrado."));
    }

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existing) {
      return next(
        createError(409, "conflict", "Usuário já possui assinatura ativa."),
      );
    }

    const { data: priorActivated } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .not("current_period_start", "is", null)
      .limit(1)
      .maybeSingle();
    const isFirstPurchase = !priorActivated;

    const customer = await getOrCreateAsaasCustomer({
      userId,
      name: profile.name || profile.email || req.user!.email,
      email: profile.email || req.user!.email,
    });

    const fullValue = PLAN_VALUES[planId];
    let validAffiliateCode = "";
    let firstPaymentValue: number | null = null;

    if (affiliateCode) {
      const { data: affiliate, error: affiliateError } = await supabaseAdmin
        .from("affiliates")
        .select("id, code, discount_percent, trials")
        .eq("code", affiliateCode)
        .eq("status", "active")
        .maybeSingle();

      if (!affiliateError && affiliate) {
        validAffiliateCode = affiliate.code; // atribuicao/comissao inalterada
        if (isFirstPurchase) {
          firstPaymentValue = Number(
            (
              fullValue *
              (1 - Number(affiliate.discount_percent || 0) / 100)
            ).toFixed(2),
          );
          await supabaseAdmin
            .from("affiliates")
            .update({ trials: Number(affiliate.trials || 0) + 1 })
            .eq("id", affiliate.id);
        }
      }
    }

    const asaasSubscription = await createAsaasCheckout({
      customerId: customer.id,
      userId,
      planCode: planId,
      value: fullValue,
      cycle: PLAN_CYCLES[planId],
      affiliateCode: validAffiliateCode || undefined,
      successUrl: `${env.appPublicUrl}/planos/sucesso`,
    });
    const payments = await getAsaasSubscriptionPayments(asaasSubscription.id);
    const all = Array.isArray(payments?.data) ? payments.data : [];
    const pending = all.filter(
      (p: { status?: string }) => p?.status === "PENDING",
    );
    let firstPayment = (pending.length ? pending : all)
      .slice()
      .sort((a: { dueDate?: string }, b: { dueDate?: string }) =>
        String(a?.dueDate || "").localeCompare(String(b?.dueDate || "")),
      )[0];
    if (firstPaymentValue !== null && firstPayment?.id) {
      firstPayment = await updateAsaasPaymentValue(
        firstPayment.id,
        firstPaymentValue,
      );
    }
    const checkoutUrl =
      firstPayment?.invoiceUrl ||
      firstPayment?.paymentLink ||
      asaasSubscription.invoiceUrl ||
      asaasSubscription.paymentLink;

    res.json({
      data: {
        checkoutUrl,
        subscriptionId: asaasSubscription.id,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/webhook", async (req, res, next) => {
  try {
    // Autenticacao do webhook do Asaas: token literal pre-compartilhado no header
    // "asaas-access-token". NAO e HMAC nem assinatura derivada; o Asaas envia o
    // token tal qual foi configurado no painel. Comparacao via hash SHA-256 +
    // timingSafeEqual (buffer de tamanho fixo, constant-time).
    //
    // Fail-closed: se a env nao estiver configurada (so possivel em dev/staging,
    // pois requireEnv mata o boot em prod), rejeita 401 em vez de aceitar.
    if (!env.asaasWebhookToken) {
      console.error(
        "[webhook] ASAAS_WEBHOOK_TOKEN nao configurado, rejeitando (fail-closed).",
      );
      return next(createError(401, "unauthorized", "Webhook desabilitado."));
    }

    const received = req.headers["asaas-access-token"];
    if (typeof received !== "string" || !received) {
      return next(
        createError(401, "unauthorized", "Header asaas-access-token ausente."),
      );
    }

    const receivedHash = crypto.createHash("sha256").update(received).digest();
    const expectedHash = crypto
      .createHash("sha256")
      .update(env.asaasWebhookToken)
      .digest();
    if (!crypto.timingSafeEqual(receivedHash, expectedHash)) {
      return next(
        createError(401, "unauthorized", "Token do webhook inválido."),
      );
    }

    const event = req.body as Record<string, unknown>;
    const eventType = String(event?.event || "");
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    const eventId = String(
      event.id ||
        crypto
          .createHash("sha256")
          .update(rawBody || JSON.stringify(event))
          .digest("hex"),
    );
    const eventCreatedAt =
      typeof event.dateCreated === "string"
        ? new Date(event.dateCreated.replace(" ", "T"))
        : null;

    const payment = event.payment as Record<string, unknown> | undefined;
    const subscription = event.subscription as
      | Record<string, unknown>
      | undefined;
    const subscriptionId = extractSubscriptionId(event);
    const paymentId = payment?.id ? String(payment.id) : null;

    console.log(`[webhook] Asaas event: ${eventType} (${eventId})`);

    // (3) Dedupe: registra o evento; se ja existia, ignora (idempotencia).
    const { data: recorded, error: dedupeError } = await supabaseAdmin
      .from("billing_events")
      .upsert(
        {
          id: eventId,
          event_type: eventType,
          provider_subscription_id: subscriptionId,
          payment_id: paymentId,
          event_created_at: eventCreatedAt
            ? eventCreatedAt.toISOString()
            : null,
          raw: event,
        },
        { onConflict: "id", ignoreDuplicates: true },
      )
      .select("id");

    if (dedupeError) {
      console.error("[webhook] Erro ao registrar billing_event:", dedupeError);
      return next(createError(500, "db_error", "Erro ao registrar evento."));
    }
    if (!recorded || recorded.length === 0) {
      return res.json({ received: true, deduped: true });
    }

    // A partir daqui, se algo falhar, removemos o billing_event para o retry do Asaas reprocessar.
    try {
      if (!subscriptionId) return res.json({ received: true });

      const externalRef = String(
        subscription?.externalReference || payment?.externalReference || "",
      );
      const [userId, planCode = "pro_monthly", affiliateCode] =
        externalRef.split(":");
      if (!userId) {
        console.warn("[webhook] externalReference não encontrado:", eventId);
        return res.json({ received: true });
      }

      const { data: proPlan } = await supabaseAdmin
        .from("plans")
        .select("id, name")
        .eq("code", planCode)
        .maybeSingle();
      if (!proPlan)
        throw createError(500, "db_error", "Plano Pro não encontrado.");

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, status, cancel_at_period_end, current_period_end, canceled_at, last_event_at",
        )
        .eq("provider_subscription_id", subscriptionId)
        .maybeSingle();

      // (3) Ordenacao: ignora MUTACAO se o evento e mais antigo que o ultimo processado.
      if (
        existing?.last_event_at &&
        eventCreatedAt &&
        eventCreatedAt < new Date(existing.last_event_at)
      ) {
        console.warn(`[webhook] evento fora de ordem ignorado (${eventId})`);
        return res.json({ received: true, out_of_order: true });
      }

      const now = new Date();
      const lastEventIso = (eventCreatedAt ?? now).toISOString();
      const isPaymentConfirm =
        eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED";

      // Decide a transicao.
      let action:
        | "skip"
        | "activate"
        | "past_due"
        | "cancel"
        | "create_incomplete" = "skip";
      if (isPaymentConfirm) {
        action = existing?.cancel_at_period_end ? "skip" : "activate"; // (s2) nao reanima marcada p/ cancelar
      } else if (eventType === "PAYMENT_OVERDUE") {
        action = "past_due";
      } else if (eventType === "SUBSCRIPTION_CREATED") {
        action =
          existing && ["active", "past_due"].includes(existing.status)
            ? "skip"
            : "create_incomplete"; // (5)
      } else if (CANCELING_EVENTS.has(eventType)) {
        action = "cancel";
      } else if (eventType === "SUBSCRIPTION_UPDATED") {
        const subStatus = String(subscription?.status || "").toUpperCase();
        action =
          subStatus === "INACTIVE" || subStatus === "EXPIRED"
            ? "cancel"
            : "skip"; // (s2) nao forca active
      }
      // PAYMENT_DELETED e demais: skip (10).

      const baseRequired = {
        user_id: userId,
        plan_id: proPlan.id,
        provider: "asaas",
        provider_subscription_id: subscriptionId,
        provider_customer_id: String(
          subscription?.customer || payment?.customer || "",
        ),
        affiliate_code: affiliateCode || null,
      };

      let transitionedTo: string | null = null;

      if (action === "activate") {
        const cycleMonths = PLAN_CYCLE_MONTHS[planCode] ?? 1; // (4) cycle-aware
        const periodStart = payment?.dueDate
          ? new Date(String(payment.dueDate))
          : now;
        const periodEnd = addMonths(periodStart, cycleMonths);
        const patch = {
          status: "active",
          plan_id: proPlan.id,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          canceled_at: null,
          last_event_at: lastEventIso,
          raw_provider_payload: event,
        };
        const result = existing
          ? await supabaseAdmin
              .from("subscriptions")
              .update(patch)
              .eq("provider_subscription_id", subscriptionId)
          : await supabaseAdmin
              .from("subscriptions")
              .insert({ ...baseRequired, ...patch });
        if (result.error) {
          console.error("[webhook] subscriptions write failed:", result.error);
          throw createError(500, "db_error", "Erro ao ativar assinatura.");
        }
        transitionedTo = "active";
      } else if (action === "past_due") {
        if (existing) {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              last_event_at: lastEventIso,
              raw_provider_payload: event,
            }) // (10) nao mexe no periodo
            .eq("provider_subscription_id", subscriptionId);
          if (error) {
            console.error("[webhook] subscriptions write failed:", error);
            throw createError(500, "db_error", "Erro ao marcar past_due.");
          }
          transitionedTo = "past_due";
        }
      } else if (action === "cancel") {
        if (existing && existing.status !== "canceled") {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: existing.canceled_at || now.toISOString(), // (8) nao sobrescreve
              last_event_at: lastEventIso,
              raw_provider_payload: event,
            })
            .eq("provider_subscription_id", subscriptionId);
          if (error) {
            console.error("[webhook] subscriptions write failed:", error);
            throw createError(500, "db_error", "Erro ao cancelar assinatura.");
          }
          transitionedTo = "canceled";
        }
      } else if (action === "create_incomplete") {
        const patch = {
          status: "incomplete",
          plan_id: proPlan.id,
          last_event_at: lastEventIso,
          raw_provider_payload: event,
        };
        const result = existing
          ? await supabaseAdmin
              .from("subscriptions")
              .update(patch)
              .eq("provider_subscription_id", subscriptionId)
          : await supabaseAdmin
              .from("subscriptions")
              .insert({ ...baseRequired, ...patch });
        if (result.error) {
          console.error("[webhook] subscriptions write failed:", result.error);
          throw createError(500, "db_error", "Erro ao registrar assinatura.");
        }
        transitionedTo = "incomplete";
      }
      // action === "skip": estado da subscription inalterado.

      // Afiliado: so quando ativou de fato (dedupe ja protege reentrega).
      if (affiliateCode && action === "activate") {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select(
            "id, sales, revenue_cents, commission_due_cents, commission_percent",
          )
          .eq("code", affiliateCode)
          .maybeSingle();

        if (affiliate) {
          const revenueCents = Math.round(
            Number(payment?.value || subscription?.value || 0) * 100,
          );
          const commissionCents = Math.round(
            revenueCents * (Number(affiliate.commission_percent || 0) / 100),
          );
          await supabaseAdmin
            .from("affiliates")
            .update({
              sales: Number(affiliate.sales || 0) + 1,
              revenue_cents:
                Number(affiliate.revenue_cents || 0) + revenueCents,
              commission_due_cents:
                Number(affiliate.commission_due_cents || 0) + commissionCents,
            })
            .eq("id", affiliate.id);
        }
      }

      // Emails: so em transicao real.
      try {
        const { data: authData } =
          await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmail = authData?.user?.email || "";
        const userName = String(
          authData?.user?.user_metadata?.name ||
            authData?.user?.email?.split("@")[0] ||
            "usuário",
        );
        const { data: profileData } = await supabaseAdmin
          .from("profiles")
          .select("gender")
          .eq("user_id", userId)
          .maybeSingle();
        const userGender =
          (profileData?.gender as Gender | null | undefined) ?? null;

        if (userEmail && transitionedTo === "active") {
          await enqueueEmail({
            type: "pro_upgrade",
            to: userEmail,
            name: userName,
            gender: userGender,
            planName: proPlan.name || planCode,
          });
        }
        if (userEmail && transitionedTo === "canceled") {
          await enqueueEmail({
            type: "cancellation",
            to: userEmail,
            name: userName,
            gender: userGender,
          });
        }
        if (userEmail && transitionedTo === "past_due") {
          await enqueueEmail({
            type: "payment_failed",
            to: userEmail,
            name: userName,
            gender: userGender,
          });
        }
      } catch (emailError) {
        console.error(
          "[email] Erro ao processar e-mail transacional",
          emailError,
        );
      }

      console.log(
        `[webhook] ${subscriptionId} action=${action} -> ${transitionedTo ?? "no-op"} (user ${userId})`,
      );
      return res.json({ received: true });
    } catch (procErr) {
      try {
        await supabaseAdmin.from("billing_events").delete().eq("id", eventId);
      } catch {
        // ignora falha de cleanup
      }
      return next(procErr);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
