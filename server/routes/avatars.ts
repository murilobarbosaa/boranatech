import { Router } from "express";

import { resolveAvatars } from "../lib/avatarResolver";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

const MAX_USER_IDS = 100;

// POST /api/avatars/resolve
// Avatar efetivo de terceiros. Nunca depende do Pro de quem chama, so do dono.
router.post("/resolve", async (req, res, next) => {
  try {
    const body = req.body as { userIds?: unknown };
    const userIds = body?.userIds;

    if (!Array.isArray(userIds)) {
      return next(
        createError(400, "invalid_body", "userIds deve ser uma lista."),
      );
    }

    if (userIds.length > MAX_USER_IDS) {
      return next(
        createError(
          400,
          "too_many_ids",
          `Máximo de ${MAX_USER_IDS} usuários por requisição.`,
        ),
      );
    }

    const ids = userIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );

    const avatars = await resolveAvatars(ids);
    res.json({ avatars });
  } catch (err) {
    next(err);
  }
});

export default router;
