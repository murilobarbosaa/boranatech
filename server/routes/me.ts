import { Router } from "express";
import type { Request } from "express";

import { PRO_AVATAR_BORDERS } from "../lib/avatarBorders";
import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { GENDER_VALUES, type Gender } from "../../shared/gender";
import {
  MAX_PROFILE_SKILLS,
  SKILL_KINDS,
  SKILL_LEVELS,
  type SkillKind,
  type SkillLevel,
} from "../../shared/profileSkills";

const router = Router();

const GENDER_SET = new Set<string>(GENDER_VALUES);
const SKILL_KIND_SET = new Set<string>(SKILL_KINDS);
const SKILL_LEVEL_SET = new Set<string>(SKILL_LEVELS);

const PROFILE_TEXT_LIMITS: Record<string, number> = {
  headline: 140,
  city: 80,
  uf: 40,
  career_goal: 240,
};
const PROFILE_URL_FIELDS = ["github_url", "linkedin_url", "website_url"];
const PROFILE_URL_MAX = 300;
const SKILL_TEXT_MAX = 80;

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
  "headline",
  "city",
  "uf",
  "career_goal",
  "github_url",
  "linkedin_url",
  "website_url",
];

const AVATAR_VALUES = {
  avatar_border: new Set([
    "classic",
    "purple",
    "gold",
    "pink",
    "green",
    "blue",
    "orange",
    "red",
    "cyan",
    "pro-rgb",
    "pro-holo",
    "pro-godzilla",
    "pro-storm",
  ]),
  avatar_icon: new Set([
    "initials",
    "code",
    "sparkles",
    "rocket",
    "brain",
    "laptop",
    "star",
    "target",
    "crown",
  ]),
  avatar_bg: new Set([
    "slate",
    "yellow",
    "purple",
    "pink",
    "green",
    "blue",
    "orange",
    "cream",
    "white",
  ]),
} as const;

router.use(requireAuth);

function profileNameFromAuth(req: Request) {
  const metadata = req.user?.userMetadata || {};
  const metadataName =
    metadata.name || metadata.full_name || metadata.user_name;
  if (typeof metadataName === "string" && metadataName.trim())
    return metadataName.trim();
  return req.user!.email.split("@")[0];
}

function validateAvatarPreference(
  field: keyof typeof AVATAR_VALUES,
  value: unknown,
) {
  if (typeof value !== "string" || !AVATAR_VALUES[field].has(value)) {
    return createError(
      400,
      "invalid_avatar_preference",
      `Valor inválido para ${field}.`,
    );
  }

  return null;
}

function validateProfileText(field: string, value: unknown, max: number) {
  if (value === null) return null;
  if (typeof value !== "string") {
    return createError(400, "invalid_request", `Valor inválido para ${field}.`);
  }
  if (value.length > max) {
    return createError(
      400,
      "invalid_request",
      `O campo ${field} excede o tamanho máximo.`,
    );
  }
  return null;
}

function validateProfileUrl(field: string, value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") {
    return createError(400, "invalid_request", `Valor inválido para ${field}.`);
  }
  if (value.length > PROFILE_URL_MAX) {
    return createError(
      400,
      "invalid_request",
      `O campo ${field} excede o tamanho máximo.`,
    );
  }
  if (value.trim() !== "" && !/^https?:\/\/.+/.test(value.trim())) {
    return createError(
      400,
      "invalid_request",
      `O campo ${field} deve ser uma URL http ou https.`,
    );
  }
  return null;
}

async function enqueueWelcomeEmailIfNeeded(
  profile: Record<string, unknown>,
  userId: string,
  email: string,
) {
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

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

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
        // 23505: outra requisicao/replica criou o profile entre o select e o
        // insert. Caso esperado sob corrida, nao erro: devolve o profile que
        // ja existe. O e-mail de boas-vindas fica por conta do vencedor da
        // corrida (que acabou de enfileirar), pra nao duplicar o envio.
        if (insertError.code === "23505") {
          const { data: existing, error: refetchError } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (refetchError || !existing) {
            return next(createError(500, "db_error", "Erro ao criar perfil."));
          }

          return res.json({ data: existing });
        }

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

router.patch("/", checkProStatus, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    for (const field of Object.keys(AVATAR_VALUES) as Array<
      keyof typeof AVATAR_VALUES
    >) {
      if (field in updates) {
        const validationError = validateAvatarPreference(field, updates[field]);
        if (validationError) return next(validationError);
      }
    }

    // Pro-gate no write: borda Pro so pra quem e Pro. Usa o mesmo mecanismo do
    // upload de foto (checkProStatus monta req.isPro, com atalho de dev/localhost
    // e admin). Defesa server-side. Fail-closed: req.isPro != true -> 403.
    if (
      typeof updates.avatar_border === "string" &&
      PRO_AVATAR_BORDERS.has(updates.avatar_border) &&
      req.isPro !== true
    ) {
      return next(
        createError(
          403,
          "forbidden_pro_border",
          "Essa borda é exclusiva do Plano Pro.",
        ),
      );
    }

    if ("gender" in updates) {
      const value = updates.gender;
      if (
        value !== null &&
        (typeof value !== "string" || !GENDER_SET.has(value))
      ) {
        return next(
          createError(400, "invalid_gender", "Valor inválido para gender."),
        );
      }
    }

    for (const [field, max] of Object.entries(PROFILE_TEXT_LIMITS)) {
      if (field in updates) {
        const textError = validateProfileText(field, updates[field], max);
        if (textError) return next(textError);
      }
    }

    for (const field of PROFILE_URL_FIELDS) {
      if (field in updates) {
        const urlError = validateProfileUrl(field, updates[field]);
        if (urlError) return next(urlError);
      }
    }

    if (Object.keys(updates).length === 0) {
      return next(
        createError(
          400,
          "invalid_request",
          "Nenhum campo válido para atualizar.",
        ),
      );
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
      return next(
        createError(500, "db_error", "Erro ao buscar progresso de roadmaps."),
      );
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

    const roadmapIds = Array.from(
      new Set(progress.map((row) => String(row.roadmap_id))),
    );

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
          Array.isArray(roadmap.roadmap_steps) &&
            roadmap.roadmap_steps.length > 0
            ? roadmap.roadmap_steps[0].count || 0
            : 0,
        );
        const completed = completedByRoadmap.get(String(roadmap.id)) || 0;
        const progressPercent =
          totalSteps > 0
            ? Math.min(Math.round((completed / totalSteps) * 100), 100)
            : 0;

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
      return next(
        createError(500, "delete_account_failed", "Erro ao excluir conta."),
      );
    }

    console.log("[me] Conta excluída:", userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

type SkillRow = {
  user_id: string;
  kind: SkillKind;
  slug: string;
  label: string;
  level: SkillLevel;
};

router.get("/skills", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabaseAdmin
      .from("profile_skills")
      .select("kind, slug, label, level")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar skills."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.put("/skills", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as { skills?: unknown };
    const rawSkills = body.skills;

    if (!Array.isArray(rawSkills)) {
      return next(
        createError(400, "invalid_request", "skills deve ser uma lista."),
      );
    }
    if (rawSkills.length > MAX_PROFILE_SKILLS) {
      return next(
        createError(
          400,
          "invalid_request",
          `Máximo de ${MAX_PROFILE_SKILLS} skills.`,
        ),
      );
    }

    const seen = new Set<string>();
    const rows: SkillRow[] = [];

    for (const item of rawSkills) {
      if (typeof item !== "object" || item === null) {
        return next(
          createError(400, "invalid_request", "Item de skill inválido."),
        );
      }
      const entry = item as Record<string, unknown>;
      const { kind, slug, label, level } = entry;

      if (typeof kind !== "string" || !SKILL_KIND_SET.has(kind)) {
        return next(createError(400, "invalid_request", "kind inválido."));
      }
      if (typeof level !== "string" || !SKILL_LEVEL_SET.has(level)) {
        return next(createError(400, "invalid_request", "level inválido."));
      }
      if (
        typeof slug !== "string" ||
        !slug.trim() ||
        slug.length > SKILL_TEXT_MAX
      ) {
        return next(createError(400, "invalid_request", "slug inválido."));
      }
      if (
        typeof label !== "string" ||
        !label.trim() ||
        label.length > SKILL_TEXT_MAX
      ) {
        return next(createError(400, "invalid_request", "label inválido."));
      }

      const key = `${kind}:${slug.trim()}`;
      if (seen.has(key)) {
        return next(
          createError(400, "invalid_request", "skill duplicada (kind + slug)."),
        );
      }
      seen.add(key);

      rows.push({
        user_id: userId,
        kind: kind as SkillKind,
        slug: slug.trim(),
        label: label.trim(),
        level: level as SkillLevel,
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("profile_skills")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return next(createError(500, "db_error", "Erro ao atualizar skills."));
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("profile_skills")
        .insert(rows);

      if (insertError) {
        return next(createError(500, "db_error", "Erro ao salvar skills."));
      }
    }

    const { data, error } = await supabaseAdmin
      .from("profile_skills")
      .select("kind, slug, label, level")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar skills."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
