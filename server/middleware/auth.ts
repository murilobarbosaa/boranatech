import type { Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../lib/env";
import { getCachedProStatus, setCachedProStatus } from "../lib/proStatusCache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "./error";

export interface AuthUser {
  id: string;
  email: string;
  role: string; // "authenticated" | "anon" | "admin"
  userMetadata?: Record<string, unknown>;
}

type AuthRequest = Request & {
  headers: Record<string, string | string[] | undefined>;
  hostname?: string;
  user?: AuthUser;
  isPro?: boolean;
};

type MiddlewareNext = (err?: unknown) => void;

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isPro?: boolean;
    }
  }
}

async function isAdminUser(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_user_admin", {
    p_user_id: userId,
  });
  return !error && data === true;
}

// Allowlist dev-only: fora de producao, forca isPro apenas para user ids
// listados em DEV_PRO_USER_IDS. Substitui o antigo gatilho por Host header
// (que era forjavel pelo cliente). Em producao retorna sempre false.
export function isDevProUser(req: AuthRequest) {
  if (env.isProd) return false;
  if (!req.user) return false;
  return env.devProUserIds.includes(req.user.id);
}

// Resolucao standalone do status Pro (cache Redis primeiro, RPCs como fonte
// de verdade), reutilizavel FORA do middleware: gates pontuais por recurso em
// rotas que nao podem pagar essa latencia em todo request (ex: o toggle de
// project_progress so resolve Pro quando o projeto alvo e premium).
// Fail-closed: qualquer erro vira false.
export async function resolveProStatus(userId: string): Promise<boolean> {
  const cached = await getCachedProStatus(userId);
  if (cached !== null) return cached;

  try {
    const [{ data: proData, error: proError }, adminAccess] = await Promise.all(
      [
        supabaseAdmin.rpc("is_user_pro", { p_user_id: userId }),
        isAdminUser(userId),
      ],
    );
    const isPro = (!proError && proData === true) || adminAccess;
    // So cacheia se a RPC de Pro nao deu erro, pra nao persistir um possivel
    // falso negativo causado por falha transitoria. Falha do Redis e ignorada
    // dentro do setCachedProStatus.
    if (!proError) {
      await setCachedProStatus(userId, isPro);
    }
    return isPro;
  } catch {
    return false;
  }
}

// JWKS remoto do Supabase, construido UMA vez no load do modulo. A `jose` cacheia
// a chave publica ES256 em memoria pelo kid, entao a verificacao continua local
// (sem ida a rede por request; so busca o JWKS quando ve um kid desconhecido).
const JWKS = createRemoteJWKSet(
  new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`),
);

// Verificacao LOCAL do access token (ES256) contra o JWKS do projeto. jwtVerify
// valida assinatura e expiracao (exp). Fixamos algorithms em ES256 pra evitar
// ataque de confusao de algoritmo. Tradeoff conhecido: verificacao local nao
// detecta token revogado no meio da sessao; aceitavel pra token de vida curta.
// Em qualquer falha retorna null e o request segue anonimo (mesma semantica).
async function resolveUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ["ES256"],
      clockTolerance: 5,
    });
    if (!payload.sub) {
      return null;
    }
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      role: typeof payload.role === "string" ? payload.role : "authenticated",
      userMetadata:
        payload.user_metadata && typeof payload.user_metadata === "object"
          ? (payload.user_metadata as Record<string, unknown>)
          : {},
    };
  } catch (err) {
    // Nao 401 mudo: logamos o motivo (sem vazar o token) pra diagnostico futuro.
    console.warn("[auth] token verification failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

export async function validateSupabaseJwt(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  const authHeader = firstHeaderValue(req.headers.authorization);
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  const user = await resolveUserFromToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  if (!req.user) {
    return next(createError(401, "unauthorized", "Autenticação necessária."));
  }

  next();
}

export async function checkProStatus(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  if (!req.user) {
    req.isPro = false;
    return next();
  }

  if (isDevProUser(req)) {
    req.isPro = true;
    return next();
  }

  req.isPro = await resolveProStatus(req.user.id);
  next();
}

export function requirePro(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  if (!req.user) {
    return next(createError(401, "unauthorized", "Autenticação necessária."));
  }

  if (isDevProUser(req)) {
    req.isPro = true;
    return next();
  }

  if (!req.isPro) {
    return next(
      createError(
        403,
        "forbidden",
        "Plano Pro necessário para acessar esta funcionalidade.",
      ),
    );
  }

  next();
}

export async function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  if (!req.user) {
    return next(createError(401, "unauthorized", "Autenticação necessária."));
  }

  try {
    const adminAccess = await isAdminUser(req.user.id);

    if (!adminAccess) {
      return next(
        createError(403, "forbidden", "Acesso administrativo necessário."),
      );
    }

    next();
  } catch {
    return next(createError(403, "forbidden", "Erro ao verificar permissão."));
  }
}
