import { Router } from "express";

import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

const REPORT_REASONS = new Set(["sexual", "violence", "spam", "other"]);

// Estagio automatico (por contagem, reversivel): ao bater o limiar de denunciantes
// distintos, esconde a foto (pending_review). Remover/desabilitar e acao de admin.
async function maybeHideAvatar(targetUserId: string): Promise<void> {
  // O indice parcial unico ja garante no maximo uma denuncia ABERTA por par
  // (denunciante, alvo); ainda assim deduplicamos por seguranca.
  const { data: openRows, error } = await supabaseAdmin
    .from("avatar_reports")
    .select("reporter_user_id")
    .eq("target_user_id", targetUserId)
    .eq("status", "open");

  if (error || !openRows) return; // fail-safe: sem contagem confiavel, nao esconde.

  const distinctReporters = new Set(
    openRows.map((row) => row.reporter_user_id),
  ).size;

  // TODO(Ana) SEG-06: contas distintas por denuncia JA garantido (dedupe + indice unico parcial). Pendente ao reativar avatar publico: revisao humana antes de ocultar no limiar (hoje a ocultacao e automatica). Rotas de report montadas em app.ts mesmo sem UI: reavaliar gate ao ativar. Feature sem UI hoje, sem avatar de terceiro exposto.
  if (distinctReporters < env.avatarReportHideThreshold) return;

  const { data: target, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("avatar_mode, avatar_url, avatar_moderation_status")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (targetError || !target) return;

  const showsPhoto = target.avatar_mode === "photo" && !!target.avatar_url;
  if (target.avatar_moderation_status !== "clean" || !showsPhoto) return;

  // Acao automatica: nao seta reviewed_by. Guarda em status='clean' pra nao
  // sobrescrever uma decisao de admin concorrente.
  await supabaseAdmin
    .from("profiles")
    .update({
      avatar_moderation_status: "pending_review",
      avatar_moderation_updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetUserId)
    .eq("avatar_moderation_status", "clean");
}

// POST /api/profiles/:userId/report
router.post("/:userId/report", async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const reporterUserId = req.user!.id;
    const body = req.body as { reason?: unknown };
    const reason = body?.reason;

    if (typeof reason !== "string" || !REPORT_REASONS.has(reason)) {
      return next(
        createError(400, "invalid_reason", "Motivo de denúncia inválido."),
      );
    }

    if (!targetUserId || targetUserId === reporterUserId) {
      return next(
        createError(
          400,
          "invalid_target",
          "Não é possível denunciar o próprio avatar.",
        ),
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("avatar_reports")
      .insert({
        reporter_user_id: reporterUserId,
        target_user_id: targetUserId,
        reason,
      });

    // 23505 = ja existe denuncia aberta desse denunciante pra esse alvo.
    // Idempotente: segue como sucesso, nunca 500.
    if (insertError && (insertError as { code?: string }).code !== "23505") {
      return next(
        createError(
          500,
          "report_failed",
          "Não foi possível registrar a denúncia.",
        ),
      );
    }

    await maybeHideAvatar(targetUserId).catch(() => undefined);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
