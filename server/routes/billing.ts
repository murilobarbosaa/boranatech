import { Router } from "express";

import { env } from "../lib/env";
import { isPlanId, type PlanId } from "../../shared/planPricing";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { asaasProvider, getPaymentProvider } from "../providers";

const router = Router();

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

    const data = await getPaymentProvider().cancel({
      userId,
      reasonCode,
      reasonText,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/reactivate", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await getPaymentProvider().reactivate({ userId });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    // Kill-switch fail-closed: com billing desligado, corta ANTES de qualquer
    // chamada ao provider. Defesa de servidor obrigatoria, independente do client.
    if (!env.billingEnabled) {
      return next(
        createError(
          503,
          "billing_disabled",
          // TODO(Ana): copy da indisponibilidade temporaria do checkout.
          "Pagamentos temporariamente indisponíveis. Tente novamente em breve.",
        ),
      );
    }

    const userId = req.user!.id;
    const affiliateCode =
      typeof req.body?.affiliateCode === "string"
        ? req.body.affiliateCode.trim().toUpperCase()
        : "";
    const planId: PlanId =
      typeof req.body?.planId === "string" && isPlanId(req.body.planId)
        ? req.body.planId
        : "pro_monthly";

    const data = await getPaymentProvider().createCheckout({
      user: { id: userId, email: req.user!.email },
      planId,
      affiliateCode,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// Webhook do Asaas: rota FIXA no provider Asaas (nao passa pelo seletor).
// O parser dedicado em app.ts (express.raw com match por prefixo) preserva
// req.rawBody para a validacao do token.
router.post("/webhook", async (req, res, next) => {
  try {
    const result = await asaasProvider.handleWebhook({
      rawBody: (req as typeof req & { rawBody?: Buffer }).rawBody,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
