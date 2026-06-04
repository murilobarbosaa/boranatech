import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const VALID_CONTEXTS = [
  "portfolio_checklist",
  "favorites",
  "course_progress",
  "quiz_history",
];

function isValidContext(value: string) {
  return VALID_CONTEXTS.includes(value);
}

router.use(requireAuth);

router.get("/:context", async (req, res, next) => {
  try {
    const { context } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key, state, updated_at")
      .eq("user_id", req.user!.id)
      .eq("context", context);

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar progresso."));
    }

    res.json({
      data: (data ?? []).map((row) => ({
        itemKey: row.item_key,
        state: row.state ?? {},
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:context/:itemKey", async (req, res, next) => {
  try {
    const { context, itemKey } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }
    if (!itemKey) {
      return next(
        createError(400, "invalid_request", "itemKey é obrigatório."),
      );
    }

    const { state } = req.body as { state?: Record<string, unknown> };

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        {
          user_id: req.user!.id,
          context,
          item_key: itemKey,
          state: state ?? {},
        },
        { onConflict: "user_id,context,item_key" },
      )
      .select("item_key, state, updated_at")
      .single();

    if (error) {
      return next(createError(500, "db_error", "Erro ao salvar progresso."));
    }

    res.json({
      data: {
        itemKey: data.item_key,
        state: data.state ?? {},
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:context/:itemKey", async (req, res, next) => {
  try {
    const { context, itemKey } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }

    const { error } = await supabaseAdmin
      .from("user_progress")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("context", context)
      .eq("item_key", itemKey);

    if (error) {
      return next(createError(500, "db_error", "Erro ao remover progresso."));
    }

    res.json({ data: { removed: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
