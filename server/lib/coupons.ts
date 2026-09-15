import { supabaseAdmin } from "./supabaseAdmin";
import {
  discountedPriceCents,
  getPlanChargeValue,
  type PlanId,
} from "../../shared/planPricing";
import { createError } from "../middleware/error";
import { erroEncadeavel } from "./supabaseError";

// Validacao de cupom de marketing, compartilhada entre a rota publica
// (GET /api/coupons/:code) e o checkout (providers/stripe.ts), para o client e
// o server nunca divergirem de regra. Mesmo padrao de code dos afiliados.

export const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidCouponCode(code: string): boolean {
  return COUPON_CODE_PATTERN.test(code);
}

export interface ValidCoupon {
  code: string;
  discount_percent: number;
  applicable_plans: string[] | null;
}

interface CouponRow {
  code: string;
  discount_percent: number;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  applicable_plans: string[] | null;
}

interface ValidAffiliate {
  code: string;
  discount_percent: number;
}

type CouponLookup =
  | { kind: "valid"; coupon: ValidCoupon }
  | { kind: "invalid" }
  | { kind: "db_error"; error: unknown };

async function lookupCoupon(
  code: string,
  opts: { planId?: string } = {},
): Promise<CouponLookup> {
  if (!isValidCouponCode(code)) return { kind: "invalid" };

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select(
      "code, discount_percent, valid_from, valid_until, max_redemptions, times_redeemed, applicable_plans",
    )
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  if (error) return { kind: "db_error", error };
  if (!data) return { kind: "invalid" };

  const coupon = data as CouponRow;
  const nowMs = Date.now();
  if (
    (coupon.valid_from && new Date(coupon.valid_from).getTime() > nowMs) ||
    (coupon.valid_until && new Date(coupon.valid_until).getTime() <= nowMs) ||
    (coupon.max_redemptions !== null &&
      coupon.times_redeemed >= coupon.max_redemptions) ||
    (opts.planId &&
      coupon.applicable_plans &&
      !coupon.applicable_plans.includes(opts.planId))
  ) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    coupon: {
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      applicable_plans: coupon.applicable_plans,
    },
  };
}

// Regras (todas precisam passar): existe, status active, dentro da janela
// valid_from/valid_until, times_redeemed < max_redemptions (quando definido) e,
// quando planId e informado, o plano esta em applicable_plans (null = todos).
// Retorna null para QUALQUER falha, sem distinguir o motivo (anti-oraculo).
// Cupom nunca derruba fluxo: erro de banco loga e retorna null, sem throw.
export async function findValidCoupon(
  code: string,
  opts: { planId?: string } = {},
): Promise<ValidCoupon | null> {
  const result = await lookupCoupon(code, opts);
  if (result.kind === "db_error") {
    console.error("[coupons] Erro ao buscar cupom", result.error);
    return null;
  }
  return result.kind === "valid" ? result.coupon : null;
}

async function findValidAffiliate(
  code: string,
): Promise<ValidAffiliate | null> {
  if (!isValidCouponCode(code)) return null;

  const { data, error } = await supabaseAdmin
    .from("affiliates")
    .select("code, discount_percent")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw createError(
      500,
      "db_error",
      "Não foi possível validar o desconto. Tente novamente.",
      { cause: erroEncadeavel(error) },
    );
  }
  if (!data) return null;

  return {
    code: data.code,
    discount_percent: data.discount_percent,
  };
}

/**
 * PRECO FINAL DO CHECKOUT, em centavos: base do plano mais promocao validada.
 *
 * POR QUE ESTA FUNCAO PRECISOU EXISTIR. No fluxo da Stripe a validacao e nossa
 * (`findValidCoupon` acima) mas a ARITMETICA e deles: a sessao recebe
 * `discounts: [{ coupon }]` e o checkout hospedado faz a conta. Nosso codigo
 * nunca precisou calcular valor com desconto, entao nunca soube calcular.
 *
 * O Asaas cria a cobranca por API, com o valor JA RESOLVIDO. Sem esta funcao ele
 * herdava `getPlanChargeValue(planId)`, o preco cheio, enquanto a tela mostrava
 * o preco com desconto que o frontend calculava por conta propria. Medido ao
 * vivo em 2026-08-31: cupom de 90 por cento, tela com o valor certo, cobranca no
 * Asaas com o valor cheio.
 *
 * A conta usa `discountedPriceCents` (shared/planPricing.ts), **a mesma funcao
 * que o frontend usa na previa**. Nao e uma segunda implementacao com o mesmo
 * resultado: e a mesma implementacao, entao tela e cobranca nao podem divergir
 * por arredondamento.
 *
 * REGRAS COMERCIAIS IDENTICAS as do fluxo Stripe: cupom aplicavel ganha do
 * afiliado, os dois valem apenas na primeira compra e nunca se somam. Cupom
 * valido fora do plano nao se torna invalido: ele apenas cede ao afiliado.
 *
 * Codigo enviado e depois recusado BLOQUEIA o Pix. A tela ja o apresentou como
 * promocao valida; cobrar cheio silenciosamente repetiria o incidente que este
 * resolver existe para impedir. A rota publica continua anti-oraculo e devolve
 * null para qualquer motivo por meio de `findValidCoupon`.
 */
export async function resolveCheckoutPriceCents(input: {
  userId: string;
  planId: PlanId;
  /** Ja normalizado (uppercase/trim); "" quando ausente. */
  couponCode: string;
  /** Ja normalizado (uppercase/trim); "" quando ausente. */
  affiliateCode: string;
  /** Injetado para nao acoplar este modulo a providers/shared.ts. */
  isFirstPurchase: (userId: string) => Promise<boolean>;
}): Promise<{
  finalCents: number;
  appliedCouponCode: string;
  validAffiliateCode: string;
}> {
  const baseCents = Math.round(getPlanChargeValue(input.planId) * 100);
  if (!input.couponCode && !input.affiliateCode) {
    return {
      finalCents: baseCents,
      appliedCouponCode: "",
      validAffiliateCode: "",
    };
  }

  const primeira = await input.isFirstPurchase(input.userId);
  if (!primeira) {
    throw createError(
      422,
      "promotion_first_purchase_only",
      "Este desconto é válido somente na primeira compra.",
    );
  }

  let validCoupon: ValidCoupon | null = null;
  if (input.couponCode) {
    // Sem `planId` de proposito: expirado/inativo/esgotado e uma promocao que
    // deixou de existir e BLOQUEIA a cobranca. Um cupom ainda valido mas fora
    // deste plano nao bloqueia; nesse caso o frontend mostra o afiliado (ou o
    // preco cheio), e o resolver segue a mesma precedencia.
    const result = await lookupCoupon(input.couponCode);
    if (result.kind === "db_error") {
      throw createError(
        500,
        "db_error",
        "Não foi possível validar o desconto. Tente novamente.",
        { cause: erroEncadeavel(result.error) },
      );
    }
    if (result.kind === "invalid") {
      throw createError(
        422,
        "coupon_unavailable",
        "Este cupom não está mais disponível.",
      );
    }
    if (
      !result.coupon.applicable_plans ||
      result.coupon.applicable_plans.includes(input.planId)
    ) {
      validCoupon = result.coupon;
    }
  }

  let validAffiliate: ValidAffiliate | null = null;
  if (input.affiliateCode) {
    try {
      validAffiliate = await findValidAffiliate(input.affiliateCode);
    } catch (error) {
      // O cupom ja determinou o preco. O afiliado agora serve somente para
      // atribuicao, e o Stripe segue a compra quando esta consulta falha.
      if (!validCoupon) throw error;
      console.error(
        `[checkout/price] afiliado ${input.affiliateCode} nao foi validado para atribuicao; ` +
          "o cupom aplicavel permanece no preco:",
        error,
      );
    }
    if (!validAffiliate) {
      if (!validCoupon) {
        throw createError(
          422,
          "affiliate_unavailable",
          "Este desconto de afiliado não está mais disponível.",
        );
      }
      console.warn(
        `[checkout/price] afiliado ${input.affiliateCode} invalido ou inativo; ` +
          "o cupom aplicavel permanece no preco, sem atribuicao.",
      );
    }
  }

  const discountPercent =
    validCoupon?.discount_percent ?? validAffiliate?.discount_percent;

  return {
    finalCents:
      discountPercent === undefined
        ? baseCents
        : discountedPriceCents(baseCents, discountPercent),
    // So o codigo APROVADO viaja adiante. O bruto do cliente nunca vira
    // `coupon_code` na linha, senao a ativacao contaria resgate de um cupom que
    // nao descontou nada.
    appliedCouponCode: validCoupon?.code ?? "",
    // Afiliacao e atribuicao, nao uma segunda promocao: persiste mesmo quando o
    // cupom ganha no preco, sem somar percentuais.
    validAffiliateCode: validAffiliate?.code ?? "",
  };
}
