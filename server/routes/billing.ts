import { Router } from "express";

import { env } from "../lib/env";
import { verifyRenewalToken } from "../lib/renewalToken";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { stripeProvider } from "../providers";
import { isPlanId, PLAN_PRICING, type PlanId } from "../../shared/planPricing";

const router = Router();

// Resolve o token de renovacao -> assinatura + plano, com os casos de erro que a
// pagina /renovar renderiza (cada um com code slug distinto). Compartilhado pelo
// GET (preview) e pelo POST (gera o boleto). Nunca expoe PII.
type RenewalResolved = {
  subscriptionId: string;
  userId: string;
  planId: PlanId;
  currentPeriodEnd: string | null;
};

async function resolveRenewal(
  token: string,
): Promise<
  | { ok: false; status: number; code: string; message: string }
  | { ok: true; data: RenewalResolved }
> {
  const verified = verifyRenewalToken(token);
  if (verified.status === "invalid") {
    return {
      ok: false,
      status: 400,
      code: "invalid_token",
      message: "Link de renovação inválido.",
    };
  }
  if (verified.status === "expired") {
    return {
      ok: false,
      status: 400,
      code: "expired_token",
      message: "Este link de renovação expirou.",
    };
  }

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, status, current_period_end, plan_id, renewal_type")
    .eq("id", verified.subscriptionId)
    .maybeSingle();

  // Cancelada ou inexistente compartilham o slug (a task agrupa os dois casos).
  if (!sub || sub.status === "canceled") {
    return {
      ok: false,
      status: 404,
      code: "subscription_unavailable",
      message: "Assinatura não encontrada ou cancelada.",
    };
  }

  // Defesa em profundidade: renovacao manual e SO para boleto (renewal_type
  // 'manual'). Uma sub de cartao renova sozinha; gerar boleto para ela cobraria
  // em duplicidade. Nao confia so na promessa de que o cron nunca emite o token
  // para uma sub 'auto'.
  if (sub.renewal_type !== "manual") {
    return {
      ok: false,
      status: 409,
      code: "not_manual_renewal",
      message: "Esta assinatura não usa renovação manual.",
    };
  }

  // Ja renovada: o periodo avancou alem do que o token foi emitido (pend).
  const currentEndMs = sub.current_period_end
    ? new Date(sub.current_period_end).getTime()
    : 0;
  if (currentEndMs > verified.periodEndMs) {
    return {
      ok: false,
      status: 409,
      code: "already_renewed",
      message: "Esta assinatura já foi renovada.",
    };
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code")
    .eq("id", sub.plan_id)
    .maybeSingle();
  if (!plan || !isPlanId(plan.code)) {
    return {
      ok: false,
      status: 500,
      code: "plan_unavailable",
      message: "Plano não encontrado.",
    };
  }

  return {
    ok: true,
    data: {
      subscriptionId: sub.id,
      userId: sub.user_id,
      planId: plan.code,
      currentPeriodEnd: sub.current_period_end,
    },
  };
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

    // Boleto pendente (aguardando pagamento). Existe no cenario A (primeira compra
    // por boleto, sem sub ativa -> plano free) e no B (renovacao, junto de uma sub
    // ativa). ADITIVO: nao altera a query primaria nem is_user_pro. Cartao nunca
    // tem pending, entao para cartao isto sempre volta null. { planCode, createdAt },
    // sem PII; o card resolve plano/valor via planPricing.ts.
    const { data: pending } = await supabaseAdmin
      .from("subscriptions")
      .select("created_at, plan_id")
      .eq("user_id", userId)
      .eq("payment_method", "boleto")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let pendingBoleto: { planCode: string; createdAt: string | null } | null =
      null;
    if (pending?.plan_id) {
      const { data: pendingPlan } = await supabaseAdmin
        .from("plans")
        .select("code")
        .eq("id", pending.plan_id)
        .maybeSingle();
      if (pendingPlan?.code) {
        pendingBoleto = {
          planCode: pendingPlan.code,
          createdAt: pending.created_at,
        };
      }
    }

    // Intencao de "nao renovar" do boleto (renewal_type='manual'), lida de
    // subscription_cancellations. A UI do boleto usa ISTO, nao cancel_at_period_end
    // (que para boleto e sempre false). Cartao nao passa por aqui (renewal_type
    // 'auto'), entao a query nem roda: comportamento de cartao inalterado.
    const subRow = subscription as {
      renewal_type?: string | null;
      provider_subscription_id?: string | null;
      current_period_end?: string | null;
    } | null;
    let nonRenewal: { effectiveAt: string | null } | null = null;
    if (
      subRow?.renewal_type === "manual" &&
      subRow.provider_subscription_id
    ) {
      const { data: intent } = await supabaseAdmin
        .from("subscription_cancellations")
        .select("effective_at")
        .eq("provider_subscription_id", subRow.provider_subscription_id)
        .neq("status", "reverted")
        .order("canceled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intent) {
        nonRenewal = {
          effectiveAt: intent.effective_at ?? subRow.current_period_end ?? null,
        };
      }
    }

    // De onde vem o acesso: assinatura real, concessao de influencer ou admin.
    // ADITIVO: isPro e subscription seguem exatamente como estao; o client usa
    // isto so para rotular o acesso com honestidade (ex: influencer nao ve
    // botao de cancelar uma assinatura que nao existe). Fail-open para null:
    // erro aqui nao derruba o endpoint, so deixa a origem indeterminada.
    let accessSource: "subscription" | "influencer" | "admin" | null = null;
    if (subscription) {
      accessSource = "subscription";
    } else {
      const { data: influencerRow, error: influencerError } =
        await supabaseAdmin
          .from("influencers")
          .select("id")
          .eq("user_id", userId)
          .is("revoked_at", null)
          .maybeSingle();
      if (influencerError) {
        console.error(
          "[billing/subscription] influencer lookup failed:",
          influencerError,
        );
      }
      if (influencerRow) {
        accessSource = "influencer";
      } else {
        const { data: adminData, error: adminError } = await supabaseAdmin.rpc(
          "is_user_admin",
          { p_user_id: userId },
        );
        if (adminError) {
          console.error(
            "[billing/subscription] is_user_admin RPC failed:",
            adminError,
          );
        }
        if (!adminError && adminData === true) accessSource = "admin";
      }
    }

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
          pendingBoleto,
          nonRenewal: null,
          accessSource,
        },
      });
    }

    res.json({
      data: {
        ...subscription,
        isPro,
        pendingBoleto,
        nonRenewal,
        accessSource,
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

    const data = await stripeProvider.cancel({
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
    const data = await stripeProvider.reactivate({ userId });
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
    const couponCode =
      typeof req.body?.couponCode === "string"
        ? req.body.couponCode.trim().toUpperCase()
        : "";
    const planId: PlanId =
      typeof req.body?.planId === "string" && isPlanId(req.body.planId)
        ? req.body.planId
        : "pro_monthly";

    // payment_method opcional: ausente => 'card' (retrocompativel com o frontend
    // atual, que nao manda o campo). Valor invalido => 400.
    const rawPaymentMethod = req.body?.payment_method;
    if (
      rawPaymentMethod !== undefined &&
      rawPaymentMethod !== "card" &&
      rawPaymentMethod !== "boleto"
    ) {
      return next(
        createError(
          400,
          "invalid_payment_method",
          "Forma de pagamento inválida.",
        ),
      );
    }
    const paymentMethod: "card" | "boleto" =
      rawPaymentMethod === "boleto" ? "boleto" : "card";

    // Boleto so nos planos semestral/anual (pagamento unico). Mensal e cartao-only.
    if (paymentMethod === "boleto" && planId === "pro_monthly") {
      return next(
        createError(
          400,
          "boleto_not_allowed_on_monthly",
          "Boleto não está disponível no plano mensal.",
        ),
      );
    }

    const data = await stripeProvider.createCheckout({
      user: { id: userId, email: req.user!.email },
      planId,
      affiliateCode,
      couponCode,
      paymentMethod,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// Renovacao de boleto por token assinado (link one-click do e-mail). SEM
// requireAuth: o token e a autenticacao. GET so mostra plano/valor/vencimento para
// a pagina /renovar; POST gera o boleto de fato (intencao explicita, nao page load).

router.get("/renew", async (req, res, next) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      return next(
        createError(400, "invalid_token", "Link de renovação inválido."),
      );
    }
    const r = await resolveRenewal(token);
    if (!r.ok) return next(createError(r.status, r.code, r.message));

    // Preview sem PII: so plano, valor e vencimento.
    const pricing = PLAN_PRICING[r.data.planId];
    res.json({
      data: {
        planId: r.data.planId,
        planLabel: pricing.label,
        priceLabel: pricing.totalLabel,
        periodEnd: r.data.currentPeriodEnd,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/renew", async (req, res, next) => {
  try {
    // Kill-switch fail-closed: gerar boleto chama o provider; corta antes.
    if (!env.billingEnabled) {
      return next(
        createError(
          503,
          "billing_disabled",
          "Pagamentos temporariamente indisponíveis. Tente novamente em breve.",
        ),
      );
    }

    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (!token) {
      return next(
        createError(400, "invalid_token", "Link de renovação inválido."),
      );
    }
    const r = await resolveRenewal(token);
    if (!r.ok) return next(createError(r.status, r.code, r.message));

    // Token e a auth (nao ha req.user): busca o e-mail do dono para prefill.
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
      r.data.userId,
    );
    const email = authData?.user?.email || "";

    // internalRenewal: seta AQUI, no server, apos validar o token. Pula so o guard
    // de assinatura ativa; o guard de boleto pendente segue valendo e pode lancar
    // 409 boleto_pending. Nunca vem do corpo HTTP.
    const data = await stripeProvider.createCheckout({
      user: { id: r.data.userId, email },
      planId: r.data.planId,
      affiliateCode: "",
      couponCode: "",
      paymentMethod: "boleto",
      internalRenewal: true,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// Webhook da Stripe: rota FIXA. Cai no express.raw de app.ts (match por prefixo
// /api/billing/webhook), entao req.rawBody chega intacto para
// stripe.webhooks.constructEvent.
router.post("/webhook/stripe", async (req, res, next) => {
  try {
    const result = await stripeProvider.handleWebhook({
      rawBody: (req as typeof req & { rawBody?: Buffer }).rawBody,
      headers: req.headers,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
