import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { env } from "../lib/env";
import { montarDbError } from "../lib/dbError";
import { signedFiscalUrl } from "../lib/fiscalStorage";
import { verifyRenewalToken } from "../lib/renewalToken";
import { erroEncadeavel } from "../lib/supabaseError";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { asaasProvider, stripeProvider } from "../providers";
import { fetchChargeAmountCents, fetchPixQrCode } from "../providers/asaas";
import { isPlanId, PLAN_PRICING, type PlanId } from "../../shared/planPricing";
import {
  isPaymentMethodAllowed,
  isPaymentMethodId,
  type PaymentMethodId,
} from "../../shared/paymentMethods";

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

/**
 * `checkProStatus` NO LUGAR de um calculo proprio de Pro.
 *
 * Esta rota recalculava `isPro` por conta propria (`rpc('is_user_pro')` direto,
 * e `isPro = !rpcError && data === true`), e divergia do caminho canonico
 * (`resolveProStatus`, server/middleware/auth.ts) em TRES pontos:
 *
 *   1. nao consultava o cache Redis, entao pagava duas RPCs em toda carga da
 *      pagina de cobranca enquanto o resto do sistema respondia do cache;
 *   2. nao passava por `isDevProUser`, entao em desenvolvimento a pagina
 *      contradizia todas as demais telas do mesmo app;
 *   3. **nao combinava o ramo de admin**, e esta era a divergencia com efeito
 *      em producao: `resolveProStatus` devolve `is_user_pro OR is_user_admin`
 *      (CLAUDE.md: "isPro || isAdmin e intencional em toda a plataforma"), e
 *      esta rota devolvia so o primeiro. Um admin sem assinatura via `isPro:
 *      false` AQUI e `true` em qualquer outro lugar.
 *
 * O middleware E o caminho canonico, entao delegar e monta-lo. Ele nunca lanca:
 * qualquer falha vira `req.isPro = false`, que preserva o fail-closed que a
 * rota ja tinha, e sem 500 novo.
 */
/**
 * EXPORTADA para teste, no mesmo criterio de `expirarBoletosVencidos`
 * (server/routes/cron.ts) e `handleAsaasWebhook`: o que importa provar aqui e
 * que a rota DELEGA a decisao de Pro em vez de recalcular, e isso so se prova
 * rodando o handler contra um `req.isPro` controlado.
 */
export async function handleGetSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const isPro = req.isPro === true;

    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // `cause` para o LinkedErrors do Sentry anexar o erro real do Supabase.
      // Sem ele o evento chega com a mensagem generica e um stack que aponta
      // para esta linha, e a causa (timeout, permissao, coluna ausente) fica
      // fora do relatorio. O texto exibido ao usuario nao muda.
      return next(
        createError(500, "db_error", "Erro ao buscar assinatura.", {
          cause: erroEncadeavel(error),
        }),
      );
    }

    // Boleto pendente (aguardando pagamento). Existe no cenario A (primeira compra
    // por boleto, sem sub ativa -> plano free) e no B (renovacao, junto de uma sub
    // ativa). ADITIVO: nao altera a query primaria nem is_user_pro. Cartao nunca
    // tem pending, entao para cartao isto sempre volta null. { planCode, createdAt },
    // sem PII; o card resolve plano/valor via planPricing.ts.
    // Enxerga os DOIS meios avulsos. Antes filtrava `payment_method = 'boleto'`
    // e um Pix aguardando pagamento era invisivel na pagina de cobranca: a
    // pessoa pagava e a tela dizia que ela era do plano free.
    const { data: pending } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "created_at, plan_id, payment_method, provider, provider_subscription_id",
      )
      .eq("user_id", userId)
      .in("payment_method", ["boleto", "pix"])
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // EXPAND/CONTRACT (CLAUDE.md), nao troca seca. `pendingBoleto` continua
    // sendo emitido com a MESMA semantica de antes (so boleto), porque todo
    // bundle ja em execucao le esse nome e nao recarrega sozinho. O campo novo
    // `pendingCharge` carrega o meio, e e o que o frontend novo consome.
    // Remover `pendingBoleto`: depois de o Pix estar no ar e o tempo de vida de
    // uma sessao ter passado.
    let pendingBoleto: { planCode: string; createdAt: string | null } | null =
      null;
    let pendingCharge: {
      planCode: string;
      createdAt: string | null;
      paymentMethod: string;
      /**
       * Valor da COBRANCA, nao do plano. `null` quando nao deu para saber, e a
       * tela cai no preco do plano, que e o comportamento de sempre.
       */
      amountCents: number | null;
    } | null = null;
    if (pending?.plan_id) {
      const { data: pendingPlan } = await supabaseAdmin
        .from("plans")
        .select("code")
        .eq("id", pending.plan_id)
        .maybeSingle();
      if (pendingPlan?.code) {
        const metodo = String(pending.payment_method ?? "boleto");
        // VALOR DA COBRANCA, lido no provedor. Nao existe copia local: a linha
        // pendente guarda `plan_id` e `coupon_code`, e nenhum dos dois e o valor
        // cobrado. Sem isto o card anuncia o preco cheio do plano sobre uma
        // cobranca com cupom, que foi o defeito achado na inspecao ao vivo.
        //
        // A chamada remota so acontece quando ha cobranca Asaas pendente, que e
        // raro, e `fetchChargeAmountCents` devolve `null` em vez de lancar: este
        // endpoint responde a assinatura inteira, e o preco e um rotulo dentro
        // dela, nunca motivo para derrubar a pagina.
        //
        // Boleto (Stripe) fica de fora de proposito: o valor dele nao esta neste
        // caminho e o comportamento atual dele nao muda neste lote.
        const chargeId =
          pending.provider === "asaas"
            ? String(pending.provider_subscription_id ?? "")
            : "";
        const amountCents = chargeId
          ? await fetchChargeAmountCents(chargeId)
          : null;
        pendingCharge = {
          planCode: pendingPlan.code,
          createdAt: pending.created_at,
          paymentMethod: metodo,
          amountCents,
        };
        // Um Pix pendente NAO vira `pendingBoleto`: o bundle antigo mostraria
        // copy de boleto ("vence em 3 dias", "confira seu e-mail") sobre um Pix.
        // Mentir sobre o meio e pior que nao mostrar.
        if (metodo === "boleto") {
          pendingBoleto = {
            planCode: pendingPlan.code,
            createdAt: pending.created_at,
          };
        }
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
    if (subRow?.renewal_type === "manual" && subRow.provider_subscription_id) {
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
          pendingCharge,
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
        pendingCharge,
        nonRenewal,
        accessSource,
      },
    });
  } catch (err) {
    next(err);
  }
}

router.get("/subscription", requireAuth, checkProStatus, handleGetSubscription);

/**
 * QR Code Pix da cobranca pendente DO PROPRIO USUARIO.
 *
 * AUTORIZACAO POR CONSTRUCAO, nao por checagem: a rota nao aceita id nenhum. Ela
 * resolve a cobranca a partir de `req.user.id`, entao nao existe o caso "id de
 * outra pessoa", e portanto nao existe checagem de dono para alguem esquecer de
 * escrever. Um id de pagamento numa URL publica seria enumeravel e teria de ser
 * defendido; este desenho nao tem o que defender.
 *
 * 404 nomeado quando nao ha Pix pendente: e o estado normal de quem nao esta
 * comprando, nao um erro.
 */
router.get("/pix-qrcode", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: pending, error } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", userId)
      .eq("provider", "asaas")
      .eq("payment_method", "pix")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return next(
        createError(500, "db_error", "Erro ao buscar a cobrança.", {
          cause: error,
        }),
      );
    }
    if (!pending?.provider_subscription_id) {
      return next(
        createError(
          404,
          "pix_pendente_ausente",
          "Nenhum Pix aguardando pagamento.",
        ),
      );
    }

    const qr = await fetchPixQrCode(pending.provider_subscription_id);
    return res.json({ data: qr });
  } catch (err) {
    return next(err);
  }
});

/**
 * Estado da emissao de NFS-e, para o frontend decidir o que montar.
 *
 * POR QUE UMA ROTA, e nao uma env do bundle: `VITE_NFSE_ENABLED` congelaria o
 * valor no build, e o deploy nao e atomico (a Vercel sobe antes do Railway).
 * Uma janela de minutos com frontend afirmando "ligado" contra um backend que
 * ainda responde desligado e exatamente o que esta rota evita: quem sabe do
 * kill-switch e o processo que o le.
 *
 * PUBLICA de proposito. O banner fiscal mora no Layout, que atravessa TODA
 * pagina, inclusive as anonimas; com `requireAuth` cada carga deslogada geraria
 * um 401 previsivel e inutil. O dado nao e do usuario: e uma flag de
 * configuracao do produto, a mesma para todo mundo, e nao revela nada sobre
 * quem pergunta.
 *
 * O valor POSITIVO tambem e declarado (nao so o "disabled" das outras rotas
 * fiscais) porque o consumidor e fail-closed: o cliente so mostra superficie
 * fiscal com o literal "enabled" na mao, e trata ausencia, erro e resposta
 * desconhecida como desligado.
 */
router.get("/nfse-status", (_req, res) => {
  res.json({ data: { nfse: env.nfseEnabled ? "enabled" : "disabled" } });
});

/**
 * Notas fiscais do proprio usuario.
 *
 * So `issued` e `canceled`: os demais estados sao de PROCESSO nosso (pending,
 * processing, failed, blocked_missing_data) e nao dizem nada util para quem
 * comprou. Mostrar "falhou" na conta do cliente transformaria um problema
 * nosso, que a reconciliacao ainda pode resolver, num aviso que ele nao tem
 * como agir.
 *
 * As URLs sao ASSINADAS SOB DEMANDA e de curta duracao. Nunca sao persistidas:
 * uma URL assinada guardada no banco vira um link que expira sem ninguem
 * entender por que parou de funcionar.
 */
router.get("/invoices", requireAuth, async (req, res, next) => {
  try {
    // Kill-switch ANTES da consulta. Com a emissao desligada nao existe nota
    // para listar, e perguntar mesmo assim e o unico caminho medido em que
    // ausencia de configuracao fiscal chega ao banco: se a migration ainda nao
    // tiver sido aplicada, o erro do PostgREST vira 500 na tela de todo
    // assinante que abrir o /perfil.
    //
    // 200 com lista vazia, NUNCA status de erro: FiscalInvoicesSection trata
    // qualquer `!res.ok` como falha e mostra "nao conseguimos carregar suas
    // notas agora", que e mensagem de defeito para um estado que nao e defeito.
    // O campo `nfse` existe para o estado ficar NOMEADO: sem ele, "emissao
    // desligada" e "voce nao tem notas" chegariam ao cliente identicos.
    if (!env.nfseEnabled) {
      res.json({ data: [], nfse: "disabled" });
      return;
    }

    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from("fiscal_invoices")
      .select(
        "id, numero, serie, codigo_verificacao, status, issued_at, amount_cents, plan_code, service_description, pdf_path, xml_path",
      )
      .eq("user_id", userId)
      .in("status", ["issued", "canceled"])
      .order("issued_at", { ascending: false })
      .limit(100);

    if (error) {
      return next(
        // TODO(Ana): mensagem de falha ao listar as notas do assinante.
        montarDbError(
          "billing",
          "billing list invoices",
          error,
          "Erro ao buscar notas fiscais.",
        ),
      );
    }

    const linhas = (data ?? []) as Array<{
      id: string;
      numero: string | null;
      serie: string | null;
      codigo_verificacao: string | null;
      status: string;
      issued_at: string | null;
      amount_cents: number;
      plan_code: string | null;
      service_description: string | null;
      pdf_path: string | null;
      xml_path: string | null;
    }>;

    const invoices = await Promise.all(
      linhas.map(async (linha) => ({
        id: linha.id,
        numero: linha.numero,
        serie: linha.serie,
        codigoVerificacao: linha.codigo_verificacao,
        status: linha.status,
        issuedAt: linha.issued_at,
        amountCents: linha.amount_cents,
        planCode: linha.plan_code,
        descricao: linha.service_description,
        // null quando o documento nao chegou ao storage ou a assinatura falhou:
        // a linha aparece sem botao de download, em vez de a lista inteira cair.
        pdfUrl: await signedFiscalUrl(linha.pdf_path),
        xmlUrl: await signedFiscalUrl(linha.xml_path),
      })),
    );

    res.json({ data: invoices });
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
      // O ator e a propria pessoa neste caminho.
      actorUserId: userId,
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
      !isPaymentMethodId(rawPaymentMethod)
    ) {
      return next(
        createError(
          400,
          "invalid_payment_method",
          "Forma de pagamento inválida.",
        ),
      );
    }
    const paymentMethod: PaymentMethodId = rawPaymentMethod ?? "card";

    // GATING POR INCLUSAO, do ponto unico (shared/paymentMethods.ts). O que
    // estava aqui negava `pro_monthly` PELO NOME, entao um plano novo passaria
    // por omissao. Agora o que nao esta declarado como permitido e recusado.
    if (!isPaymentMethodAllowed(planId, paymentMethod)) {
      return next(
        createError(
          400,
          "payment_method_not_allowed",
          "Esta forma de pagamento não está disponível neste plano.",
        ),
      );
    }

    // Seletor de provedor: NOMEADO pelo meio de pagamento, nao por env nem por
    // mapa indexado por valor de fora. `pix` e Asaas; cartao e boleto sao Stripe.
    // A uniao fechada faz o `tsc` cobrar o ramo quando um meio novo entrar.
    if (paymentMethod === "pix") {
      if (!env.asaasEnabled) {
        return next(
          createError(
            503,
            "asaas_disabled",
            "Pagamento por Pix indisponível no momento.",
          ),
        );
      }
      const data = await asaasProvider.createCheckout({
        user: { id: userId, email: req.user!.email },
        planId,
        affiliateCode,
        couponCode,
        paymentMethod,
      });
      return res.json({ data });
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
