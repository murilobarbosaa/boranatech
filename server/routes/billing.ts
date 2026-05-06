import { Router } from "express";
import crypto from "crypto";

import { createAsaasCheckout, getAsaasSubscriptionPayments, getOrCreateAsaasCustomer } from "../lib/asaas";
import { env } from "../lib/env";
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

    const event = req.body;
    const eventType = event?.event as string;
    const subscriptionData = event?.payment?.subscription || event?.subscription;

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
    if (!newStatus || !subscriptionData?.id) {
      return res.json({ received: true });
    }

    const externalRef = subscriptionData.externalReference || event?.payment?.externalReference;
    const [userId, , affiliateCode] = externalRef?.split(":") || [];

    if (!userId) {
      console.warn("[webhook] externalReference não encontrado:", event);
      return res.json({ received: true });
    }

    const { data: proPlan } = await supabaseAdmin.from("plans").select("id").eq("code", "pro_monthly").single();

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
        provider_subscription_id: subscriptionData.id,
        provider_customer_id: subscriptionData.customer,
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
        const revenueCents = Math.round(Number(event?.payment?.value || subscriptionData.value || 0) * 100);
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

    console.log(`[webhook] Subscription ${subscriptionData.id} -> ${newStatus} para user ${userId}`);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
