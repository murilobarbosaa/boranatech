import { Router } from "express";
import crypto from "crypto";

import { createAsaasCheckout, getOrCreateAsaasCustomer } from "../lib/asaas";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

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

    const asaasSubscription = await createAsaasCheckout({
      customerId: customer.id,
      userId,
      planCode: "pro_monthly",
    });

    res.json({
      data: {
        checkoutUrl: asaasSubscription.paymentLink || asaasSubscription.invoiceUrl,
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
    const userId = externalRef?.split(":")[0];

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

    console.log(`[webhook] Subscription ${subscriptionData.id} -> ${newStatus} para user ${userId}`);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
