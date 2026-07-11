import { Router } from "express";

import { roadmapsV2 } from "../../shared/roadmapV2/content";
import { requiredLeaves } from "../../shared/roadmapV2/progress";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

// Valida no server que o usuario concluiu TODAS as required leaves da trilha
// (presenca da linha em user_progress, context course_progress, item_key
// "slug:nodeId") antes de registrar a conclusao em roadmap_completions.
router.post("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Roadmaps gerados por IA (slug "ia-<hex>") ficam de fora por enquanto:
    // a conclusao deles tem card proprio no RoadmapIAView e o registro em
    // roadmap_completions para trilhas de IA fica pra uma fase futura.
    if (slug.startsWith("ia-")) {
      return next(createError(404, "not_found", "Roadmap não encontrado."));
    }

    const roadmap = roadmapsV2.find((r) => r.slug === slug);
    if (!roadmap) {
      return next(createError(404, "not_found", "Roadmap não encontrado."));
    }

    const required = roadmap.sections.flatMap((section) =>
      requiredLeaves(section),
    );
    const requiredCount = required.length;
    if (requiredCount === 0) {
      return next(
        createError(409, "not_complete", "Roadmap sem passos obrigatórios."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key")
      .eq("user_id", req.user!.id)
      .eq("context", "course_progress")
      .like("item_key", `${slug}:%`);

    if (error) {
      return next(createError(500, "db_error", "Erro ao verificar progresso."));
    }

    const doneKeys = new Set((data ?? []).map((row) => row.item_key));
    const missing = required.filter(
      (leaf) => !doneKeys.has(`${slug}:${leaf.id}`),
    );
    if (missing.length > 0) {
      return next(
        createError(409, "not_complete", "Roadmap ainda não está completo."),
      );
    }

    // ignoreDuplicates preserva o completed_at da primeira conclusao; o
    // select depois do upsert devolve o registro persistido (original em
    // caso de repeticao).
    const { error: upsertError } = await supabaseAdmin
      .from("roadmap_completions")
      .upsert(
        {
          user_id: req.user!.id,
          roadmap_slug: slug,
          required_count: requiredCount,
        },
        { onConflict: "user_id,roadmap_slug", ignoreDuplicates: true },
      );

    if (upsertError) {
      return next(createError(500, "db_error", "Erro ao registrar conclusão."));
    }

    const { data: row, error: readError } = await supabaseAdmin
      .from("roadmap_completions")
      .select("completed_at, required_count")
      .eq("user_id", req.user!.id)
      .eq("roadmap_slug", slug)
      .single();

    if (readError || !row) {
      return next(createError(500, "db_error", "Erro ao ler conclusão."));
    }

    res.json({
      data: {
        completedAt: row.completed_at,
        requiredCount: row.required_count,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("roadmap_completions")
      .select("roadmap_slug, completed_at")
      .eq("user_id", req.user!.id)
      .order("completed_at", { ascending: false });

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar conclusões."));
    }

    res.json({
      data: (data ?? []).map((row) => ({
        roadmapSlug: row.roadmap_slug,
        completedAt: row.completed_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
