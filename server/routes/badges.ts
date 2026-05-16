import { Router } from "express";

import { checkAndPersistBadges } from "../lib/badgeChecker";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/list", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const result = await checkAndPersistBadges(userId);

    res.json({
      data: {
        badges: result.allBadges.map((b) => ({
          id: b.badge.id,
          category: b.badge.category,
          name: b.badge.name,
          description: b.badge.description,
          iconName: b.badge.iconName,
          unlockCriteria: b.badge.unlockCriteria,
          isUnlocked: b.isUnlocked,
          unlockedAt: b.unlockedAt,
          progress: b.progress,
          isNew: b.isNew,
        })),
        newlyUnlocked: result.newlyUnlocked.map((b) => b.id),
        totalCount: result.allBadges.length,
        unlockedCount: result.allBadges.filter((b) => b.isUnlocked).length,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
