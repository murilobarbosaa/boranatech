import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.post("/attempts/batch", requireAuth, async (req, res, next) => {
  try {
    const {
      answers,
      result_area,
      result_area_slug,
      confidence,
      level,
      result_json,
    } = req.body as {
      answers?: Array<{
        question_id?: unknown;
        answer_id?: unknown;
        answer_text?: unknown;
        area?: unknown;
      }>;
      result_area?: unknown;
      result_area_slug?: unknown;
      confidence?: unknown;
      level?: unknown;
      result_json?: unknown;
    };

    const allowedLevels = ["iniciante", "intermediario", "avancado"];
    const normalizedLevel =
      typeof level === "string" && allowedLevels.includes(level)
        ? level
        : null;

    if (!Array.isArray(answers) || answers.length === 0) {
      return next(
        createError(400, "invalid_request", "answers deve ser um array não vazio."),
      );
    }
    if (typeof result_area !== "string" || !result_area.trim()) {
      return next(
        createError(400, "invalid_request", "result_area é obrigatório."),
      );
    }
    if (
      typeof confidence !== "number" ||
      confidence < 0 ||
      confidence > 100
    ) {
      return next(
        createError(400, "invalid_request", "confidence deve ser número entre 0 e 100."),
      );
    }

    const now = new Date().toISOString();

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("career_quiz_attempts")
      .insert({
        user_id: req.user!.id,
        started_at: now,
        completed_at: now,
        result_area,
        result_area_slug:
          typeof result_area_slug === "string" ? result_area_slug : null,
        confidence,
        level: normalizedLevel,
        result_json: result_json ?? {},
      })
      .select("id, completed_at")
      .single();

    if (attemptError || !attempt) {
      return next(createError(500, "db_error", "Erro ao criar tentativa."));
    }

    const answerRows = answers.map((a, idx) => ({
      attempt_id: attempt.id,
      question_id: String(a.question_id ?? ""),
      answer_id: a.answer_id ? String(a.answer_id) : null,
      answer_text: typeof a.answer_text === "string" ? a.answer_text : null,
      area: typeof a.area === "string" ? a.area : null,
      order_index: idx,
    }));

    const { error: answersError } = await supabaseAdmin
      .from("career_quiz_answers")
      .insert(answerRows);

    if (answersError) {
      await supabaseAdmin
        .from("career_quiz_attempts")
        .delete()
        .eq("id", attempt.id);
      return next(createError(500, "db_error", "Erro ao salvar respostas."));
    }

    res.json({
      data: {
        id: attempt.id as string,
        completed_at: attempt.completed_at as string,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/attempts", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("career_quiz_attempts").insert({ user_id: req.user!.id }).select().single();

    if (error) return next(createError(500, "db_error", "Erro ao criar tentativa."));

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/attempts/:id/answers", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const attemptId = req.params.id;
    const { answers } = req.body as { answers?: Array<Record<string, unknown>> };

    if (!Array.isArray(answers) || answers.length === 0) {
      return next(createError(400, "invalid_request", "answers deve ser um array não vazio."));
    }

    const { data: attempt } = await supabaseAdmin
      .from("career_quiz_attempts")
      .select("id, user_id")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .single();

    if (!attempt) return next(createError(404, "not_found", "Tentativa não encontrada."));

    const rows = answers.map((answer, index) => ({
      attempt_id: attemptId,
      question_id: String(answer.question_id),
      answer_id: answer.answer_id ? String(answer.answer_id) : null,
      answer_text: typeof answer.answer_text === "string" ? answer.answer_text : null,
      area: typeof answer.area === "string" ? answer.area : null,
      order_index: index,
    }));

    const { error } = await supabaseAdmin.from("career_quiz_answers").insert(rows);

    if (error) return next(createError(500, "db_error", "Erro ao salvar respostas."));

    res.json({ data: { saved: rows.length } });
  } catch (err) {
    next(err);
  }
});

router.post("/attempts/:id/complete", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const attemptId = req.params.id;
    const { result_area, result_area_slug, confidence, result_json } = req.body as Record<string, unknown>;

    if (!result_area) {
      return next(createError(400, "invalid_request", "result_area é obrigatório."));
    }

    const { data, error } = await supabaseAdmin
      .from("career_quiz_attempts")
      .update({
        completed_at: new Date().toISOString(),
        result_area,
        result_area_slug: result_area_slug || null,
        confidence: confidence || null,
        result_json: result_json || {},
      })
      .eq("id", attemptId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) return next(createError(404, "not_found", "Tentativa não encontrada."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("career_quiz_attempts")
      .select("id, started_at, completed_at, result_area, result_area_slug, confidence, level, result_json")
      .eq("user_id", req.user!.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (error) return next(createError(500, "db_error", "Erro ao buscar histórico."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
