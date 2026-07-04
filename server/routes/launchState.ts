import crypto from "crypto";

import { Router } from "express";

import { env } from "../lib/env";
import { cacheConnection } from "../lib/redis";
import { createError } from "../middleware/error";

// Token de beta: payload base64url com expiracao, assinado por HMAC-SHA256 com
// WAITLIST_TOKEN_SECRET. Independente do auth do Supabase. ~90 dias de validade.
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Brute-force do codigo: conta tentativas por IP numa janela curta e bloqueia ao
// passar do teto. Diferente do throttle one-shot do affiliates (SET NX) de
// proposito: um cadastro de cupom pode ocorrer uma vez por janela, mas digitar o
// codigo errado uma vez nao pode trancar a pessoa por uma hora.
const UNLOCK_WINDOW_SECONDS = 10 * 60;
const UNLOCK_MAX_ATTEMPTS = 10;

function sign(payloadB64: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

function issueToken(secret: string) {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  const expected = sign(payload, secret);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

// GET /api/launch-state
// Estado do portao por env runtime (WAITLIST_MODE, default "gated"). Le o header
// x-beta-token opcional e devolve access=true se o token for valido e nao expirado.
const launchStateRouter = Router();

launchStateRouter.get("/", (req, res) => {
  const status = env.waitlistMode === "open" ? "open" : "gated";

  let access = false;
  const token = req.header("x-beta-token");
  if (token && env.waitlistTokenSecret) {
    access = verifyToken(token, env.waitlistTokenSecret);
  }

  res.json({ status, access });
});

// POST /api/beta/unlock
// Recebe { code } e, se bater com WAITLIST_ACCESS_CODE (comparacao constant-time),
// emite um token assinado. Fail-closed: sem env de codigo, sempre 401.
export const betaRouter = Router();

betaRouter.post("/unlock", async (req, res, next) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (cacheConnection) {
      try {
        const key = `beta:unlock:${ip}`;
        const attempts = await cacheConnection.incr(key);
        if (attempts === 1) {
          await cacheConnection.expire(key, UNLOCK_WINDOW_SECONDS);
        }
        if (attempts > UNLOCK_MAX_ATTEMPTS) {
          return next(
            createError(
              429,
              "too_many_attempts",
              "Muitas tentativas. Tente novamente em instantes.",
            ),
          );
        }
      } catch (err) {
        console.warn(
          "[beta] Throttle Redis indisponivel, seguindo sem throttle",
          err,
        );
      }
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const expected = env.waitlistAccessCode;

    // Fail-closed: sem codigo configurado ou sem codigo enviado, nega.
    if (!expected || !code) {
      return next(createError(401, "invalid_code", "Codigo invalido."));
    }

    const codeBuf = Buffer.from(code);
    const expectedBuf = Buffer.from(expected);
    const match =
      codeBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(codeBuf, expectedBuf);
    if (!match) {
      return next(createError(401, "invalid_code", "Codigo invalido."));
    }

    // Codigo certo, mas sem secret nao da pra assinar token. Nao crasha.
    if (!env.waitlistTokenSecret) {
      return next(
        createError(
          503,
          "gate_unavailable",
          "Portao indisponivel no momento.",
        ),
      );
    }

    res.json({ token: issueToken(env.waitlistTokenSecret) });
  } catch (err) {
    next(err);
  }
});

export default launchStateRouter;
