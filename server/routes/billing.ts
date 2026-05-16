import { Router } from "express";
import crypto from "crypto";

import { createAsaasCheckout, getAsaasSubscriptionPayments, getOrCreateAsaasCustomer } from "../lib/asaas";
import { env } from "../lib/env";
import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();
const PLAN_VALUES: Record<string, number> = {
  monthly: 24.9,
  semiannual: 119.4,
  annual: 179.9,
};

const PLAN_CYCLES: Record<string, "MONTHLY" | "SEMIANNUALLY" | "YEARLY"> = {
  monthly: "MONTHLY",
  semiannual: "SEMIANNUALLY",
  annual: "YEARLY",
};

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
    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", req.user!.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar assinatura."));
    }

    if (!subscription) {
      const { data: freePlan } = await supabaseAdmin.from("plans").select("*").eq("code", "free").single();

      return res.json({
        data: {
          plan: freePlan,
          status: "free",
          isPro: false,
        },
      });
    }

    res.json({
      data: {
        ...subscription,
        isPro: subscription.status === "active" || subscription.status === "trialing",
      },
    });
  } catch (err) {
    next(err);
  }
});

const VALID_CANCEL_REASONS = new Set(["expensive", "unused", "missing_feature", "paused", "other"]);

router.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = (req.body || {}) as { reason_code?: unknown; reason_text?: unknown };

    const reasonCode = typeof body.reason_code === "string" ? body.reason_code.trim() : "";
    const reasonText = typeof body.reason_text === "string" ? body.reason_text.trim().slice(0, 500) : "";

    if (reasonCode && !VALID_CANCEL_REASONS.has(reasonCode)) {
      return next(createError(400, "invalid_reason_code", "Motivo de cancelamento inválido."));
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, provider_subscription_id, current_period_end, status, cancel_at_period_end")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return next(createError(500, "db_error", "Erro ao buscar assinatura."));
    }

    if (!subscription) {
      return next(createError(404, "not_found", "Nenhuma assinatura ativa encontrada."));
    }

    if (subscription.cancel_at_period_end) {
      return next(createError(409, "already_scheduled", "Cancelamento já está agendado."));
    }

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[billing/cancel] Erro ao atualizar subscription:", updateError);
      return next(createError(500, "db_error", "Erro ao registrar cancelamento."));
    }

    const { error: logError } = await supabaseAdmin.from("subscription_cancellations").insert({
      user_id: userId,
      provider_subscription_id: subscription.provider_subscription_id || null,
      reason_code: reasonCode || null,
      reason_text: reasonText || null,
      effective_at: subscription.current_period_end,
      status: "scheduled",
    });

    if (logError) {
      console.error("[billing/cancel] Erro ao registrar motivo de cancelamento:", logError);
    }

    try {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authData?.user?.email || "";
      const userName = String(
        authData?.user?.user_metadata?.name || authData?.user?.email?.split("@")[0] || "usuário",
      );

      if (userEmail && subscription.current_period_end) {
        await enqueueEmail({
          type: "cancellation_scheduled",
          to: userEmail,
          name: userName,
          effectiveAt: subscription.current_period_end,
        });
      }
    } catch (emailError) {
      console.error("[billing/cancel] Erro ao enfileirar e-mail de confirmação:", emailError);
    }

    const effectiveAt = subscription.current_period_end;
    const formattedDate = effectiveAt
      ? new Date(effectiveAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
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

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const affiliateCode = typeof req.body?.affiliateCode === "string" ? req.body.affiliateCode.trim().toUpperCase() : "";
    const planId = typeof req.body?.planId === "string" && PLAN_VALUES[req.body.planId] ? req.body.planId : "monthly";

    const { data: profile } = await supabaseAdmin.from("profiles").select("name, email").eq("user_id", userId).single();

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
      return next(createError(409, "conflict", "Usuário já possui assinatura ativa."));
    }

    const customer = await getOrCreateAsaasCustomer({
      userId,
      name: profile.name || profile.email || req.user!.email,
      email: profile.email || req.user!.email,
    });

    let checkoutValue = PLAN_VALUES[planId];
    let validAffiliateCode = "";

    if (affiliateCode) {
      const { data: affiliate, error: affiliateError } = await supabaseAdmin
        .from("affiliates")
        .select("id, code, discount_percent, trials")
        .eq("code", affiliateCode)
        .eq("status", "active")
        .maybeSingle();

      if (!affiliateError && affiliate) {
        validAffiliateCode = affiliate.code;
        checkoutValue = Number((checkoutValue * (1 - Number(affiliate.discount_percent || 0) / 100)).toFixed(2));
        await supabaseAdmin
          .from("affiliates")
          .update({ trials: Number(affiliate.trials || 0) + 1 })
          .eq("id", affiliate.id);
      }
    }

    const asaasSubscription = await createAsaasCheckout({
      customerId: customer.id,
      userId,
      planCode: planId,
      value: checkoutValue,
      cycle: PLAN_CYCLES[planId],
      affiliateCode: validAffiliateCode || undefined,
      successUrl: `${env.appPublicUrl}/planos/sucesso`,
    });
    const payments = await getAsaasSubscriptionPayments(asaasSubscription.id);
    const firstPayment = Array.isArray(payments?.data) ? payments.data[0] : undefined;
    const checkoutUrl = firstPayment?.invoiceUrl || firstPayment?.paymentLink || asaasSubscription.invoiceUrl || asaasSubscription.paymentLink;

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
    const signature = req.headers["asaas-signature"] as string;
    if (env.asaasWebhookSecret) {
      if (!signature) {
        return next(createError(401, "unauthorized", "Assinatura do webhook ausente."));
      }

      const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", env.asaasWebhookSecret)
        .update(rawBody || JSON.stringify(req.body))
        .digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return next(createError(401, "unauthorized", "Assinatura do webhook inválida."));
      }
    }

    const event = req.body as Record<string, unknown>;
    const eventType = event?.event as string;
    const subscriptionId = extractSubscriptionId(event);
    const payment = event.payment as Record<string, unknown> | undefined;
    const subscription = event.subscription as Record<string, unknown> | undefined;

    console.log(`[webhook] Asaas event: ${eventType}`);

    const statusMap: Record<string, string> = {
      PAYMENT_RECEIVED: "active",
      PAYMENT_CONFIRMED: "active",
      PAYMENT_OVERDUE: "past_due",
      PAYMENT_DELETED: "canceled",
      SUBSCRIPTION_CREATED: "active",
      SUBSCRIPTION_UPDATED: "active",
      SUBSCRIPTION_DELETED: "canceled",
      SUBSCRIPTION_INACTIVATED: "canceled",
    };

    const newStatus = statusMap[eventType];
    if (!newStatus || !subscriptionId) {
      return res.json({ received: true });
    }

    const externalRef = String(subscription?.externalReference || payment?.externalReference || "");
    const [userId, planCode = "monthly", affiliateCode] = externalRef?.split(":") || [];

    if (!userId) {
      console.warn("[webhook] externalReference não encontrado:", event);
      return res.json({ received: true });
    }

    const { data: proPlan } = await supabaseAdmin.from("plans").select("id, name").eq("code", planCode).maybeSingle();

    if (!proPlan) {
      return next(createError(500, "db_error", "Plano Pro não encontrado."));
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: proPlan.id,
        provider: "asaas",
        provider_subscription_id: subscriptionId,
        provider_customer_id: String(subscription?.customer || payment?.customer || ""),
        status: newStatus,
        current_period_start: now.toISOString(),
        current_period_end: newStatus === "active" ? periodEnd.toISOString() : now.toISOString(),
        canceled_at: newStatus === "canceled" ? now.toISOString() : null,
        affiliate_code: affiliateCode || null,
        raw_provider_payload: event,
      },
      {
        onConflict: "provider_subscription_id",
      },
    );

    if (error) {
      console.error("[webhook] Erro ao atualizar subscription:", error);
      return next(createError(500, "db_error", "Erro ao processar webhook."));
    }

    if (affiliateCode && ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(eventType)) {
      const { data: affiliate } = await supabaseAdmin
        .from("affiliates")
        .select("id, sales, revenue_cents, commission_due_cents, commission_percent")
        .eq("code", affiliateCode)
        .maybeSingle();

      if (affiliate) {
        const revenueCents = Math.round(Number(payment?.value || subscription?.value || 0) * 100);
        const commissionCents = Math.round(revenueCents * (Number(affiliate.commission_percent || 0) / 100));
        await supabaseAdmin
          .from("affiliates")
          .update({
            sales: Number(affiliate.sales || 0) + 1,
            revenue_cents: Number(affiliate.revenue_cents || 0) + revenueCents,
            commission_due_cents: Number(affiliate.commission_due_cents || 0) + commissionCents,
          })
          .eq("id", affiliate.id);
      }
    }

    try {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authData?.user?.email || "";
      const userName = String(authData?.user?.user_metadata?.name || authData?.user?.email?.split("@")[0] || "usuário");

      if (userEmail && ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(eventType) && newStatus === "active") {
        await enqueueEmail({ type: "pro_upgrade", to: userEmail, name: userName, planName: proPlan.name || planCode });
      }

      if (userEmail && newStatus === "canceled") {
        await enqueueEmail({ type: "cancellation", to: userEmail, name: userName });
      }

      if (userEmail && eventType === "PAYMENT_OVERDUE") {
        await enqueueEmail({ type: "payment_failed", to: userEmail, name: userName });
      }
    } catch (emailError) {
      console.error("[email] Erro ao processar e-mail transacional", emailError);
    }

    console.log(`[webhook] Subscription ${subscriptionId} -> ${newStatus} para user ${userId}`);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
