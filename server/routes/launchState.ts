import crypto from "crypto";

import { Router } from "express";

import { env } from "../lib/env";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Token de beta: payload base64url com expiracao, assinado por HMAC-SHA256 com
// WAITLIST_TOKEN_SECRET. Independente do auth do Supabase. ~90 dias de validade.
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Tamanho maximo do codigo enviado. Corta payload absurdo antes de qualquer
// consulta e limita o attempted_code gravado no log.
const MAX_CODE_LENGTH = 64;

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

function issueToken(secret: string, label: string) {
  const payload = Buffer.from(
    JSON.stringify({ label, exp: Date.now() + TOKEN_TTL_MS }),
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

// Log de tentativa de unlock, best-effort: nunca derruba a resposta. Cobre tanto
// o erro thrown (rede) quanto o { error } que o supabase-js devolve.
async function logUnlock(fields: {
  code_id?: string;
  label?: string;
  success: boolean;
  attempted_code: string;
  ip: string;
  user_agent?: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from("beta_unlock_logs")
      .insert(fields);
    if (error) {
      console.warn("[beta] Falha ao registrar log de unlock", error);
    }
  } catch (err) {
    console.warn("[beta] Falha ao registrar log de unlock", err);
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

  // billingEnabled: kill-switch do pagamento exposto ao client no mesmo endpoint
  // publico de flags. Apenas acrescenta a chave; o shape { status, access } segue
  // intacto. Fail-closed ja garantido pelo env (default off).
  res.json({ status, access, billingEnabled: env.billingEnabled });
});

// POST /api/beta/unlock
// Recebe { code }, valida contra public.beta_access_codes (codigo por pessoa) e,
// se ativo, emite um token assinado e registra o uso. Fail-closed: sem secret ou
// erro de banco nunca vira acesso.
//
// SEGURANCA: o codigo com label "admin" (ou qualquer outro) e APENAS um rotulo de
// log para a Ana identificar quem entrou. Ele NAO concede papel de admin. Papel
// de admin continua resolvido exclusivamente por requireAdmin via RPC
// is_user_admin sobre JWT verificado. Codigo de convite jamais e fonte de
// privilegio (referencia: incidente all-accounts-Pro).
export const betaRouter = Router();

betaRouter.post("/unlock", async (req, res, next) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.get("user-agent") || undefined;

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
    const raw = typeof body.code === "string" ? body.code : "";
    const code = raw.trim().toUpperCase();

    // Input invalido (vazio ou grande demais): 401 seco, sem consultar banco nem
    // poluir o log com lixo.
    if (!code || code.length > MAX_CODE_LENGTH) {
      return next(createError(401, "invalid_code", "Codigo invalido."));
    }

    // Fail-closed de configuracao: sem secret nao da pra assinar token. Responde
    // 503 antes de tocar o banco. Segredo ausente nunca vira acesso liberado.
    if (!env.waitlistTokenSecret) {
      return next(
        createError(503, "gate_unavailable", "Portao indisponivel no momento."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("beta_access_codes")
      .select("id, label, active")
      .eq("code", code)
      .maybeSingle();

    // Erro de banco: 503. Falha nunca colapsa em acesso valido.
    if (error) {
      console.error("[beta] Falha ao consultar codigo de acesso", error);
      return next(
        createError(503, "gate_unavailable", "Portao indisponivel no momento."),
      );
    }

    // Nao encontrado ou revogado (active false): registra a falha e nega.
    if (!data || data.active !== true) {
      await logUnlock({
        success: false,
        attempted_code: code,
        ip,
        user_agent: userAgent,
      });
      return next(createError(401, "invalid_code", "Codigo invalido."));
    }

    // Codigo valido e ativo: registra o uso e emite token com o label nas claims.
    await logUnlock({
      code_id: data.id,
      label: data.label,
      success: true,
      attempted_code: code,
      ip,
      user_agent: userAgent,
    });

    res.json({ token: issueToken(env.waitlistTokenSecret, data.label) });
  } catch (err) {
    next(err);
  }
});

export default launchStateRouter;
