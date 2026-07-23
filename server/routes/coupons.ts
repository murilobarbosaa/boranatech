import { Router } from "express";

import {
  findValidCoupon,
  isValidCouponCode,
  normalizeCouponCode,
} from "../lib/coupons";
import { cacheConnection } from "../lib/redis";
import { createError } from "../middleware/error";

const router = Router();

const ATTEMPT_WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_WINDOW = 30;

// Throttle por ip no Redis (mesma filosofia do click de afiliado): INCR + TTL
// setado na primeira tentativa da janela. Fail-open: sem Redis ou em erro,
// valida mesmo assim (cacheConnection e fail-fast, rejeita rapido sem pendurar
// a rota; a de fila penduraria na offline queue).
async function isThrottled(ip: string): Promise<boolean> {
  if (!cacheConnection) return false;
  try {
    const key = `coupon:validate:${ip}`;
    const attempts = await cacheConnection.incr(key);
    if (attempts === 1) {
      await cacheConnection.expire(key, ATTEMPT_WINDOW_SECONDS);
    }
    return attempts > MAX_ATTEMPTS_PER_WINDOW;
  } catch (err) {
    console.warn(
      "[coupons] Throttle Redis indisponivel, seguindo sem throttle",
      err,
    );
    return false;
  }
}

// Falha e SEMPRE o mesmo 404 generico, sem distinguir inexistente, pausado,
// fora da janela, esgotado ou throttled (anti-oraculo, mesmo padrao do
// affiliates.ts). O checkout revalida no server; esta rota e so preview.
router.get("/:code", async (req, res, next) => {
  const notFound = () =>
    next(createError(404, "coupon_not_found", "Cupom não encontrado."));

  try {
    const code = normalizeCouponCode(req.params.code);
    if (!isValidCouponCode(code)) return notFound();

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (await isThrottled(ip)) return notFound();

    const coupon = await findValidCoupon(code);
    if (!coupon) return notFound();

    res.json({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      applicable_plans: coupon.applicable_plans,
    });
  } catch (err) {
    console.error("[coupons] Erro ao validar cupom", err);
    return notFound();
  }
});

export default router;
