import { Router } from "express";
import type { Request } from "express";

import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { GENDER_VALUES, type Gender } from "../../shared/gender";

const router = Router();

const GENDER_SET = new Set<string>(GENDER_VALUES);

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
  "gender",
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
      gender: (profile.gender as Gender | null | undefined) ?? null,
    });
  } catch (emailError) {
    console.error("[email] Erro ao enfileirar boas-vindas", emailError);
    return;
  }

  const { error: flagError } = await supabaseAdmin
    .from("profiles")
    .update({ welcome_email_sent: true })
    .eq("user_id", userId);
  if (flagError) {
    console.error("[email] Erro ao marcar welcome_email_sent", flagError);
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

    if ("gender" in updates) {
      const value = updates.gender;
      if (value !== null && (typeof value !== "string" || !GENDER_SET.has(value))) {
        return next(createError(400, "invalid_gender", "Valor inválido para gender."));
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

router.get("/roadmaps", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: progress, error: progressError } = await supabaseAdmin
      .from("user_roadmap_progress")
      .select("roadmap_id, step_id, status")
      .eq("user_id", userId);

    if (progressError) {
      return next(createError(500, "db_error", "Erro ao buscar progresso de roadmaps."));
    }

    if (!progress || progress.length === 0) {
      return res.json({ data: [] });
    }

    const completedByRoadmap = new Map<string, number>();
    for (const row of progress) {
      if (row.status !== "completed") continue;
      const id = String(row.roadmap_id);
      completedByRoadmap.set(id, (completedByRoadmap.get(id) || 0) + 1);
    }

    const roadmapIds = Array.from(new Set(progress.map((row) => String(row.roadmap_id))));

    const { data: roadmaps, error: roadmapsError } = await supabaseAdmin
      .from("roadmaps")
      .select("id, slug, title, area_slug, roadmap_steps(count)")
      .in("id", roadmapIds);

    if (roadmapsError) {
      return next(createError(500, "db_error", "Erro ao buscar trilhas."));
    }

    const result = (roadmaps || [])
      .map((roadmap) => {
        const totalSteps = Number(
          Array.isArray(roadmap.roadmap_steps) && roadmap.roadmap_steps.length > 0
            ? roadmap.roadmap_steps[0].count || 0
            : 0,
        );
        const completed = completedByRoadmap.get(String(roadmap.id)) || 0;
        const progressPercent =
          totalSteps > 0 ? Math.min(Math.round((completed / totalSteps) * 100), 100) : 0;

        return {
          id: roadmap.id,
          slug: roadmap.slug,
          title: roadmap.title,
          areaSlug: roadmap.area_slug,
          total_steps: totalSteps,
          completed_steps: completed,
          progress: progressPercent,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    res.json({ data: result });
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
