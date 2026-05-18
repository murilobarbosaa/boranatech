import { Router } from "express";

import { getCached } from "../lib/memory-cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
const FIVE_MINUTES_MS = 5 * 60 * 1000;

router.get("/users-count", async (_req, res) => {
  try {
    const count = await getCached("stats:users-count", FIVE_MINUTES_MS, async () => {
      const { count: rowCount, error } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) {
        throw error;
      }
      return rowCount ?? 0;
    });
    res.json({ count });
  } catch (err) {
    console.error("[stats] Erro ao obter users-count", err);
    res.json({ count: null });
  }
});

export default router;
