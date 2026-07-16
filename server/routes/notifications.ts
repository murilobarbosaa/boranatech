import { Router } from "express";

import {
  getVisibleNotificationsForUser,
  isNotificationVisibleToUser,
  listVisibleNotificationIds,
  resolveAudienceContext,
  type NotificationAudienceContext,
} from "../lib/notificationAudience";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Notificacoes in-app do usuario logado. Este GET e polled pelo client
// (~90s), entao os handlers ficam baratos de proposito: queries indexadas e
// janela de contagem limitada. Identidade sempre do JWT (req.user); o tier
// vem do checkProStatus (req.isPro, cache Redis), que o modulo de audience
// reutiliza em vez de recalcular Pro.

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Janela do unread_count: só as N publicadas mais recentes entram na conta,
// pra não varrer o histórico inteiro a cada poll. O valor exibido é limitado
// a UNREAD_DISPLAY_CAP (o front mostra "99+").
const UNREAD_WINDOW = 100;
const UNREAD_DISPLAY_CAP = 99;

// Teto do read-all: cobre todo o histórico realista de anúncios em uma
// página; acima disso o endpoint segue idempotente e uma segunda chamada
// completa o restante.
const READ_ALL_CAP = 1000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function audienceContext(
  userId: string,
  isPro: boolean | undefined,
): Promise<NotificationAudienceContext> {
  return resolveAudienceContext(userId, isPro === true);
}

async function fetchReadMap(
  userId: string,
  notificationIds: string[],
): Promise<Map<string, string>> {
  if (notificationIds.length === 0) return new Map();
  const { data, error } = await supabaseAdmin
    .from("notification_reads")
    .select("notification_id, read_at")
    .eq("user_id", userId)
    .in("notification_id", notificationIds);
  if (error) {
    throw new Error(`Falha ao buscar leituras: ${error.message}`);
  }
  return new Map(
    (data ?? []).map((row) => [
      row.notification_id as string,
      row.read_at as string,
    ]),
  );
}

// GET /api/me/notifications?limit=20&cursor=<published_at>
// Uma chamada resolve o popover inteiro: página do feed (published_at desc,
// cursor = published_at do último item), read_at por item e unread_count.
router.get("/", async (req, res, next) => {
  const rawLimit = Number.parseInt(String(req.query.limit ?? ""), 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const cursor =
    typeof req.query.cursor === "string" && req.query.cursor.length > 0
      ? req.query.cursor
      : undefined;
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return next(
      createError(400, "invalid_cursor", "Cursor de paginação inválido."),
    );
  }

  try {
    const ctx = await audienceContext(req.user!.id, req.isPro);
    const [{ items, nextCursor }, windowIds] = await Promise.all([
      getVisibleNotificationsForUser(ctx, { limit, cursor }),
      listVisibleNotificationIds(ctx, UNREAD_WINDOW),
    ]);

    const idsToCheck = Array.from(
      new Set([...items.map((item) => item.id), ...windowIds]),
    );
    const readMap = await fetchReadMap(req.user!.id, idsToCheck);

    const unread = windowIds.filter((id) => !readMap.has(id)).length;

    res.json({
      data: items.map((item) => ({
        ...item,
        read_at: readMap.get(item.id) ?? null,
      })),
      unread_count: Math.min(unread, UNREAD_DISPLAY_CAP),
      next_cursor: nextCursor,
    });
  } catch (err) {
    console.error("[notifications] list failed", err);
    return next(
      createError(
        500,
        "notifications_fetch_failed",
        "Não foi possível carregar as notificações.",
      ),
    );
  }
});

// POST /api/me/notifications/:id/read
// Idempotente: reenvio não duplica (PK composta + ignoreDuplicates). Só grava
// leitura de notificação published e visível ao usuário.
router.post("/:id/read", async (req, res, next) => {
  const notificationId = req.params.id;
  if (!UUID_PATTERN.test(notificationId)) {
    return next(
      createError(404, "notification_not_found", "Notificação não encontrada."),
    );
  }

  try {
    const ctx = await audienceContext(req.user!.id, req.isPro);
    const visible = await isNotificationVisibleToUser(notificationId, ctx);
    if (!visible) {
      return next(
        createError(
          404,
          "notification_not_found",
          "Notificação não encontrada.",
        ),
      );
    }

    const { error } = await supabaseAdmin
      .from("notification_reads")
      .upsert(
        { user_id: req.user!.id, notification_id: notificationId },
        { onConflict: "user_id,notification_id", ignoreDuplicates: true },
      );
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: { read: true } });
  } catch (err) {
    console.error("[notifications] mark read failed", err);
    return next(
      createError(
        500,
        "notification_read_failed",
        "Não foi possível marcar a notificação como lida.",
      ),
    );
  }
});

// POST /api/me/notifications/read-all
// Marca como lidas todas as published visíveis ainda não lidas. supabase-js
// não expressa insert ... select, então: ids visíveis + leituras existentes
// em uma query cada, e UM upsert em lote das faltantes (ignoreDuplicates
// mantém a idempotência mesmo em corrida com o /:id/read).
router.post("/read-all", async (req, res, next) => {
  try {
    const ctx = await audienceContext(req.user!.id, req.isPro);
    const visibleIds = await listVisibleNotificationIds(ctx, READ_ALL_CAP);
    const readMap = await fetchReadMap(req.user!.id, visibleIds);
    const missing = visibleIds.filter((id) => !readMap.has(id));

    if (missing.length > 0) {
      const { error } = await supabaseAdmin.from("notification_reads").upsert(
        missing.map((notificationId) => ({
          user_id: req.user!.id,
          notification_id: notificationId,
        })),
        { onConflict: "user_id,notification_id", ignoreDuplicates: true },
      );
      if (error) {
        throw new Error(error.message);
      }
    }

    res.json({ data: { marked: missing.length } });
  } catch (err) {
    console.error("[notifications] read-all failed", err);
    return next(
      createError(
        500,
        "notifications_read_all_failed",
        "Não foi possível marcar as notificações como lidas.",
      ),
    );
  }
});

export default router;
