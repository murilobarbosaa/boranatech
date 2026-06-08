import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const VALID_MODES = ["produtiva", "ritmo", "dispersa", "revisar"];

function normalizeStudiedAt(input: unknown): string {
  if (typeof input !== "string") {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00-03:00`).toISOString();
  }

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

router.use(requireAuth);

router.get("/entries", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { from, to, limit = "50", offset = "0" } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
    const parsedOffset = parseInt(String(offset), 10) || 0;

    let query = supabaseAdmin
      .from("study_entries")
      .select("*")
      .eq("user_id", userId)
      .order("studied_at", { ascending: false })
      .limit(parsedLimit)
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (from) query = query.gte("studied_at", from as string);
    if (to) query = query.lte("studied_at", to as string);

    const { data, error } = await query;

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar entradas."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post("/entries", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { text, minutes, mode, studied_at } = req.body as Record<
      string,
      unknown
    >;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return next(
        createError(400, "invalid_request", "O campo text é obrigatório."),
      );
    }

    if (typeof minutes !== "number" || minutes <= 0 || minutes > 1440) {
      return next(
        createError(400, "invalid_request", "minutes deve ser entre 1 e 1440."),
      );
    }

    if (!mode || typeof mode !== "string" || !VALID_MODES.includes(mode)) {
      return next(
        createError(
          400,
          "invalid_request",
          `mode deve ser um de: ${VALID_MODES.join(", ")}`,
        ),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("study_entries")
      .insert({
        user_id: userId,
        text: text.trim(),
        minutes: Math.round(minutes),
        mode,
        studied_at: normalizeStudiedAt(studied_at),
      })
      .select()
      .single();

    if (error) {
      return next(createError(500, "db_error", "Erro ao salvar entrada."));
    }

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch("/entries/:id", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { text, minutes, mode } = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};

    if (text !== undefined) {
      if (typeof text !== "string" || text.trim().length === 0) {
        return next(
          createError(400, "invalid_request", "text não pode ser vazio."),
        );
      }
      updates.text = text.trim();
    }

    if (minutes !== undefined) {
      if (typeof minutes !== "number" || minutes <= 0 || minutes > 1440) {
        return next(
          createError(
            400,
            "invalid_request",
            "minutes deve ser entre 1 e 1440.",
          ),
        );
      }
      updates.minutes = Math.round(minutes);
    }

    if (mode !== undefined) {
      if (typeof mode !== "string" || !VALID_MODES.includes(mode)) {
        return next(createError(400, "invalid_request", "mode inválido."));
      }
      updates.mode = mode;
    }

    if (Object.keys(updates).length === 0) {
      return next(
        createError(400, "invalid_request", "Nenhum campo para atualizar."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("study_entries")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return next(createError(404, "not_found", "Entrada não encontrada."));
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/entries/:id", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("study_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return next(createError(500, "db_error", "Erro ao remover entrada."));
    }

    res.json({ data: { removed: true } });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const range = (req.query.range as string) || "7d";
    const validRanges = ["7d", "30d", "90d"];

    if (!validRanges.includes(range)) {
      return next(
        createError(
          400,
          "invalid_request",
          `range deve ser um de: ${validRanges.join(", ")}`,
        ),
      );
    }

    const { data, error } = await supabaseAdmin.rpc("get_study_stats", {
      p_user_id: userId,
      p_range: range,
    });

    if (error) {
      return next(
        createError(500, "db_error", "Erro ao calcular estatísticas."),
      );
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/heatmap", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const requested = parseInt(String(req.query.days || "365"), 10);
    const days = Math.min(
      Math.max(Number.isFinite(requested) ? requested : 365, 7),
      730,
    );

    const { data, error } = await supabaseAdmin.rpc("get_study_heatmap", {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      return next(createError(500, "rpc_error", "Erro ao buscar heatmap."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
