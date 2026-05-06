import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
// TODO: mover para Redis quando tiver múltiplas instâncias.
const clickRateLimit = new Map<string, number>();
const CLICK_WINDOW_MS = 60 * 60 * 1000;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

router.get("/:code", async (req, res) => {
  try {
    const code = normalizeCode(req.params.code);
    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("name, code, discount_percent, status")
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) {
      res.json({ valid: false });
      return;
    }

    res.json({
      valid: true,
      code: data.code,
      discount_percent: data.discount_percent,
      name: data.name,
    });
  } catch (err) {
    console.error("[affiliates] Erro ao validar cupom", err);
    res.json({ valid: false });
  }
});

router.post("/:code/click", async (req, res) => {
  try {
    const code = normalizeCode(req.params.code);
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${code}`;
    const now = Date.now();
    const lastClick = clickRateLimit.get(key);

    if (lastClick && now - lastClick < CLICK_WINDOW_MS) {
      res.json({ recorded: false, rateLimited: true });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("id, clicks")
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) {
      res.json({ recorded: false });
      return;
    }

    const { error: updateError } = await supabaseAdmin
      .from("affiliates")
      .update({ clicks: Number(data.clicks || 0) + 1 })
      .eq("id", data.id);

    if (updateError) {
      res.json({ recorded: false });
      return;
    }

    clickRateLimit.set(key, now);
    res.json({ recorded: true });
  } catch (err) {
    console.error("[affiliates] Erro ao registrar clique", err);
    res.json({ recorded: false });
  }
});

export default router;
