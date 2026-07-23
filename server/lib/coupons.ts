import { supabaseAdmin } from "./supabaseAdmin";

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
