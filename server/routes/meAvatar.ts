import { Router } from "express";

import {
  AvatarUploadError,
  decodeImageInput,
  deleteAvatarObject,
  downloadGoogleImage,
  getTrustedGoogleAvatarUrl,
  storeAvatar,
  validateAndModerate,
} from "../lib/avatarUpload";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

// GATE de perfil: upload habilitado e fora de revisao. O Pro e checado via
// checkProStatus + req.isPro no handler (padrao das outras rotas Pro do projeto).
// Retorna o avatar_storage_path anterior (pra limpar depois do novo entrar).
async function gateAndGetPrevPath(userId: string): Promise<string | null> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("avatar_upload_disabled, avatar_moderation_status, avatar_storage_path")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new AvatarUploadError(
      403,
      "upload_unavailable",
      "Não foi possível verificar seu perfil.",
    );
  }
  if (profile.avatar_upload_disabled === true) {
    throw new AvatarUploadError(
      403,
      "upload_disabled",
      "Upload de foto desabilitado para esta conta.",
    );
  }
  if (profile.avatar_moderation_status === "pending_review") {
    throw new AvatarUploadError(
      403,
      "pending_review",
      "Seu avatar está em revisão. Aguarde a análise.",
    );
  }

  return profile.avatar_storage_path ?? null;
}

// Ordem segura: sobe o NOVO, aponta o profile pro novo, SO ENTAO apaga o antigo.
async function applyNewAvatar(
  userId: string,
  prevPath: string | null,
  bytes: Buffer,
): Promise<{ avatarUrl: string }> {
  const contentType = await validateAndModerate(bytes);
  const { path, publicUrl } = await storeAvatar(userId, bytes, contentType);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      avatar_storage_path: path,
      avatar_mode: "photo",
    })
    .eq("user_id", userId);

  if (error) {
    // rollback do objeto novo pra nao deixar orfao
    await deleteAvatarObject(path);
    throw new AvatarUploadError(
      500,
      "profile_update_failed",
      "Não foi possível atualizar o avatar.",
    );
  }

  if (prevPath && prevPath !== path) {
    await deleteAvatarObject(prevPath);
  }

  return { avatarUrl: publicUrl };
}

function handleError(err: unknown, next: (err?: unknown) => void) {
  if (err instanceof AvatarUploadError) {
    return next(createError(err.status, err.code, err.message));
  }
  next(err);
}

// POST /api/me/avatar - upload de foto (body { imageBase64 }, data URL ou base64 puro)
router.post("/", checkProStatus, async (req, res, next) => {
  try {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "pro_required",
          "Recurso Pro. Assine o Plano Pro para usar foto no avatar.",
        ),
      );
    }
    const userId = req.user!.id;
    const prevPath = await gateAndGetPrevPath(userId);

    const body = req.body as { imageBase64?: unknown };
    const bytes = decodeImageInput(body?.imageBase64);
    if (!bytes) {
      return next(createError(400, "invalid_image", "Imagem inválida."));
    }

    const { avatarUrl } = await applyNewAvatar(userId, prevPath, bytes);
    res.json({ avatarUrl, mode: "photo" });
  } catch (err) {
    handleError(err, next);
  }
});

// POST /api/me/avatar/from-google - usar a foto do Google (fonte confiavel do provedor)
router.post("/from-google", checkProStatus, async (req, res, next) => {
  try {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "pro_required",
          "Recurso Pro. Assine o Plano Pro para usar foto no avatar.",
        ),
      );
    }
    const userId = req.user!.id;
    const prevPath = await gateAndGetPrevPath(userId);

    const googleUrl = await getTrustedGoogleAvatarUrl(userId);
    if (!googleUrl) {
      return next(
        createError(404, "no_google_photo", "Nenhuma foto do Google disponível."),
      );
    }

    const bytes = await downloadGoogleImage(googleUrl);
    const { avatarUrl } = await applyNewAvatar(userId, prevPath, bytes);
    res.json({ avatarUrl, mode: "photo" });
  } catch (err) {
    handleError(err, next);
  }
});

// DELETE /api/me/avatar - remover foto e voltar pro icone (nao exige Pro)
router.delete("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("avatar_storage_path, avatar_moderation_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !profile) {
      return next(
        createError(500, "profile_read_failed", "Não foi possível ler o perfil."),
      );
    }

    if (profile.avatar_storage_path) {
      await deleteAvatarObject(profile.avatar_storage_path);
    }

    const update: Record<string, unknown> = {
      avatar_url: null,
      avatar_storage_path: null,
      avatar_mode: "icon",
    };

    // O conteudo reportado deixou de existir: resolve pending_review pra clean.
    // Estado punitivo 'removed' (+ upload_disabled) nao e tocado aqui.
    const wasPending = profile.avatar_moderation_status === "pending_review";
    if (wasPending) {
      update.avatar_moderation_status = "clean";
      update.avatar_moderation_updated_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("user_id", userId);

    if (updateError) {
      return next(
        createError(
          500,
          "profile_update_failed",
          "Não foi possível atualizar o avatar.",
        ),
      );
    }

    if (wasPending) {
      await supabaseAdmin
        .from("avatar_reports")
        .update({ status: "closed" })
        .eq("target_user_id", userId)
        .eq("status", "open");
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
