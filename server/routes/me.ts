import { Router } from "express";
import type { Request } from "express";

import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const EDITABLE_FIELDS = [
  "name",
  "handle",
  "avatar_border",
  "avatar_icon",
  "avatar_bg",
  "bio",
  "area_interesse",
  "nivel_atual",
  "objetivo",
  "onboarding_completed",
  "onboarding_step",
  "preferences",
];

const AVATAR_VALUES = {
  avatar_border: new Set(["classic", "purple", "gold", "pink", "green", "blue", "orange", "red", "cyan"]),
  avatar_icon: new Set(["initials", "code", "sparkles", "rocket", "brain", "laptop", "star", "target", "crown"]),
  avatar_bg: new Set(["slate", "yellow", "purple", "pink", "green", "blue", "orange", "cream", "white"]),
} as const;

router.use(requireAuth);

function profileNameFromAuth(req: Request) {
  const metadata = req.user?.userMetadata || {};
  const metadataName = metadata.name || metadata.full_name || metadata.user_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return req.user!.email.split("@")[0];
}

function validateAvatarPreference(field: keyof typeof AVATAR_VALUES, value: unknown) {
  if (typeof value !== "string" || !AVATAR_VALUES[field].has(value)) {
    return createError(400, "invalid_avatar_preference", `Valor inválido para ${field}.`);
  }

  return null;
}

async function enqueueWelcomeEmailIfNeeded(profile: Record<string, unknown>, userId: string, email: string) {
  if (profile.welcome_email_sent === true) return;

  try {
    await enqueueEmail({
      type: "welcome",
      to: email,
      name: String(profile.name || email.split("@")[0]),
    });

    await supabaseAdmin.from("profiles").update({ welcome_email_sent: true }).eq("user_id", userId);
  } catch (emailError) {
    console.error("[email] Erro ao enfileirar boas-vindas", emailError);
  }
}

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
          name: profileNameFromAuth(req),
        })
        .select()
        .single();

      if (insertError) {
        return next(createError(500, "db_error", "Erro ao criar perfil."));
      }

      void enqueueWelcomeEmailIfNeeded(newProfile, userId, req.user!.email);

      return res.json({ data: newProfile });
    }

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar perfil."));
    }

    void enqueueWelcomeEmailIfNeeded(profile, userId, req.user!.email);

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

    for (const field of Object.keys(AVATAR_VALUES) as Array<keyof typeof AVATAR_VALUES>) {
      if (field in updates) {
        const validationError = validateAvatarPreference(field, updates[field]);
        if (validationError) return next(validationError);
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

router.delete("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[me] Erro ao excluir conta:", error);
      return next(createError(500, "delete_account_failed", "Erro ao excluir conta."));
    }

    console.log("[me] Conta excluída:", userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
