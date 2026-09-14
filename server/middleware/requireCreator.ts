import * as Sentry from "@sentry/node";
import type { Request, Response } from "express";

import type { CreatorKind } from "../lib/creatorKind";
import { creatorKindOf } from "../lib/creatorKind";
import {
  getCachedCreatorStatus,
  setCachedCreatorStatus,
} from "../lib/creatorStatusCache";
import { erroEncadeavel } from "../lib/supabaseError";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "./error";

declare global {
  namespace Express {
    interface Request {
      creator?: { kind: CreatorKind };
    }
  }
}

type MiddlewareNext = (err?: unknown) => void;

/**
 * Kind da concessao ATIVA do usuario, ou null quando ele nao e creator.
 *
 * LANCA em erro de consulta, e nunca devolve null nesse caso: "nao e creator"
 * e "nao consegui saber" sao estados distintos, e quem chama decide o que cada
 * um vira (403 no requireCreator, 503 no /api/creator/status). Kind
 * desconhecido tambem lanca (creatorKindOf), pelo mesmo motivo.
 *
 * Cache primeiro (60s, creatorStatusCache). So grava no cache depois de um
 * MISS: com o Redis indisponivel a consulta vai ao banco e o valor nao e
 * gravado.
 */
export async function resolverCreatorKind(
  userId: string,
): Promise<CreatorKind | null> {
  const leitura = await getCachedCreatorStatus(userId);
  if (leitura.estado === "hit") {
    return leitura.valor === "none" ? null : leitura.valor;
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("kind")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) {
    throw erroEncadeavel(error);
  }
  const kind = data ? creatorKindOf(data.kind) : null;

  if (leitura.estado === "miss") {
    await setCachedCreatorStatus(userId, kind ?? "none");
  }
  return kind;
}

/**
 * Guarda das rotas do painel do creator. Montar DEPOIS de requireAuth.
 *
 * Fail-closed: erro de consulta NUNCA deixa passar. Responde 403, com log e
 * Sentry, e com um code proprio (`creator_check_failed`) em vez do
 * `not_creator`, para o client e o log separarem "nao e creator" de "nao deu
 * para conferir". O Sentry e chamado aqui porque o handler central so reporta
 * 5xx, e um 403 passaria mudo.
 */
export async function requireCreator(
  req: Request,
  _res: Response,
  next: MiddlewareNext,
) {
  if (!req.user) {
    return next(createError(401, "unauthorized", "Autenticação necessária."));
  }

  let kind: CreatorKind | null;
  try {
    kind = await resolverCreatorKind(req.user.id);
  } catch (err) {
    console.error("[requireCreator] falha ao conferir a concessao:", err);
    Sentry.captureException(err, {
      tags: { area: "creators", guard: "requireCreator" },
    });
    return next(
      createError(
        403,
        "creator_check_failed",
        // TODO(Ana)
        "Não foi possível confirmar seu acesso de creator.",
      ),
    );
  }

  if (!kind) {
    return next(
      createError(
        403,
        "not_creator",
        // TODO(Ana)
        "Acesso de creator necessário.",
      ),
    );
  }

  req.creator = { kind };
  next();
}
