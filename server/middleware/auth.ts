import { createClient } from "@supabase/supabase-js";
import type { Request, Response } from "express";

import { env } from "../lib/env";
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
function isDevProUser(req: AuthRequest) {
  if (env.isProd) return false;
  if (!req.user) return false;
  return env.devProUserIds.includes(req.user.id);
}

export async function validateSupabaseJwt(
  req: AuthRequest,
  _res: Response,
  next: MiddlewareNext,
) {
  try {
    const authHeader = firstHeaderValue(req.headers.authorization);
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    const supabaseUrl = env.supabaseUrl || "http://localhost:54321";
    const supabaseAnonKey = env.supabaseAnonKey || "anon-key-not-configured";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      role: user.role || "authenticated",
      userMetadata: user.user_metadata || {},
    };

    next();
  } catch {
    next();
  }
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

  try {
    const [{ data: proData, error: proError }, adminAccess] = await Promise.all(
      [
        supabaseAdmin.rpc("is_user_pro", { p_user_id: req.user.id }),
        isAdminUser(req.user.id),
      ],
    );
    req.isPro = (!proError && proData === true) || adminAccess;
  } catch {
    req.isPro = false;
  }

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
