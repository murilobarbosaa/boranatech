import { supabaseAdmin } from "./supabaseAdmin";
import {
  discountedPriceCents,
  getPlanChargeValue,
  type PlanId,
} from "../../shared/planPricing";

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

// Regras (todas precisam passar): existe, status active, dentro da janela
// valid_from/valid_until, times_redeemed < max_redemptions (quando definido) e,
// quando planId e informado, o plano esta em applicable_plans (null = todos).
// Retorna null para QUALQUER falha, sem distinguir o motivo (anti-oraculo).
// Cupom nunca derruba fluxo: erro de banco loga e retorna null, sem throw.
export async function findValidCoupon(
  code: string,
  opts: { planId?: string } = {},
): Promise<ValidCoupon | null> {
  if (!isValidCouponCode(code)) return null;

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select(
      "code, discount_percent, valid_from, valid_until, max_redemptions, times_redeemed, applicable_plans",
    )
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[coupons] Erro ao buscar cupom", error);
    return null;
  }
  if (!data) return null;

  const coupon = data as CouponRow;
  const nowMs = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > nowMs) {
    return null;
  }
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() <= nowMs) {
    return null;
  }
  if (
    coupon.max_redemptions !== null &&
    coupon.times_redeemed >= coupon.max_redemptions
  ) {
    return null;
  }
  if (
    opts.planId &&
    coupon.applicable_plans &&
    !coupon.applicable_plans.includes(opts.planId)
  ) {
    return null;
  }

  return {
    code: coupon.code,
    discount_percent: coupon.discount_percent,
    applicable_plans: coupon.applicable_plans,
  };
}

/**
 * PRECO FINAL DO CHECKOUT, em centavos: base do plano mais cupom validado.
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
 * REGRAS DE ELEGIBILIDADE IDENTICAS as do fluxo Stripe, e pela mesma razao de
 * sempre: duas regras do mesmo desconto divergem na primeira correcao. Cupom so
 * na PRIMEIRA compra, e so se `findValidCoupon` aprovar (ativo, dentro da janela,
 * com resgates disponiveis e aplicavel ao plano).
 *
 * CUPOM NUNCA IMPEDE A COMPRA: qualquer recusa segue com o preco cheio e
 * `appliedCouponCode` vazio, exatamente como a Stripe faz. Isso importa para o
 * rastro: quem nao descontou nada nao pode contar resgate na ativacao.
 */
export async function resolveCheckoutPriceCents(input: {
  userId: string;
  planId: PlanId;
  /** Ja normalizado (uppercase/trim); "" quando ausente. */
  couponCode: string;
  /** Injetado para nao acoplar este modulo a providers/shared.ts. */
  isFirstPurchase: (userId: string) => Promise<boolean>;
}): Promise<{ finalCents: number; appliedCouponCode: string }> {
  const baseCents = Math.round(getPlanChargeValue(input.planId) * 100);
  if (!input.couponCode) {
    return { finalCents: baseCents, appliedCouponCode: "" };
  }

  const primeira = await input.isFirstPurchase(input.userId);
  if (!primeira) return { finalCents: baseCents, appliedCouponCode: "" };

  const coupon = await findValidCoupon(input.couponCode, {
    planId: input.planId,
  });
  if (!coupon) return { finalCents: baseCents, appliedCouponCode: "" };

  return {
    finalCents: discountedPriceCents(baseCents, coupon.discount_percent),
    // So o codigo APROVADO viaja adiante. O bruto do cliente nunca vira
    // `coupon_code` na linha, senao a ativacao contaria resgate de um cupom que
    // nao descontou nada.
    appliedCouponCode: coupon.code,
  };
}
