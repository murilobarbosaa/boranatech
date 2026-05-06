import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const EDITABLE_FIELDS = [
  "name",
  "handle",
  "avatar_url",
  "bio",
  "area_interesse",
  "nivel_atual",
  "objetivo",
  "onboarding_completed",
  "onboarding_step",
  "preferences",
];

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("user_id", userId).single();

    if (error?.code === "PGRST116" || !profile) {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          email: req.user!.email,
          name: req.user!.email.split("@")[0],
        })
        .select()
        .single();

      if (insertError) {
        return next(createError(500, "db_error", "Erro ao criar perfil."));
      }

      return res.json({ data: newProfile });
    }

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar perfil."));
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return next(createError(400, "invalid_request", "Nenhum campo válido para atualizar."));
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return next(createError(500, "db_error", "Erro ao atualizar perfil."));
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

export default router;
