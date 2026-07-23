import { Router } from "express";

import { roadmapsV2 } from "../../shared/roadmapV2/content";
import { requiredLeaves } from "../../shared/roadmapV2/progress";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Preserva o erro cru do Supabase (cause -> LinkedErrors do Sentry) e anexa
// contexto minimo (sem PII alem do userId): sem isso o Sentry so via a mensagem
// generica. Mesma mecanica do handler de progresso (server/routes/progress.ts).
function dbError(
  op: string,
  userId: string,
  message: string,
  error: unknown,
  slug?: string,
) {
  console.error(
    `[roadmap-completions] ${op} falhou${slug ? ` slug=${slug}` : ""} user=${userId}`,
    error,
  );
  return createError(500, "db_error", message, {
    cause: error,
    context: {
      op,
      userId,
      ...(slug !== undefined ? { slug } : {}),
      pgCode: (error as { code?: string } | null | undefined)?.code,
    },
  });
}

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
      return next(
        dbError(
          "check_progress",
          req.user!.id,
          "Erro ao verificar progresso.",
          error,
          slug,
        ),
      );
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

    // completed_at e imutavel (a primeira conclusao vale pra sempre), mas
    // required_count acompanha o catalogo: se a trilha ganhou passos
    // obrigatorios e o usuario concluiu tudo de novo, o registro sobe pro
    // count atual. Nunca desce: um count menor (passo removido do catalogo)
    // nao reescreve o congelado, senao o card de "conteudo novo" oscilaria.
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("roadmap_completions")
      .select("completed_at, required_count")
      .eq("user_id", req.user!.id)
      .eq("roadmap_slug", slug)
      .maybeSingle();

    if (selectError) {
      return next(
        dbError(
          "read_completion",
          req.user!.id,
          "Erro ao ler conclusão.",
          selectError,
          slug,
        ),
      );
    }

    let row = existing;

    if (!existing) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("roadmap_completions")
        .insert({
          user_id: req.user!.id,
          roadmap_slug: slug,
          required_count: requiredCount,
        })
        .select("completed_at, required_count")
        .single();

      if (insertError) {
        // 23505: outro request concorrente inseriu primeiro. Re-le e segue
        // (idempotente).
        if (insertError.code === "23505") {
          const { data: raced, error: racedError } = await supabaseAdmin
            .from("roadmap_completions")
            .select("completed_at, required_count")
            .eq("user_id", req.user!.id)
            .eq("roadmap_slug", slug)
            .single();
          if (racedError || !raced) {
            return next(
              dbError(
                "register_race_reread",
                req.user!.id,
                "Erro ao registrar conclusão.",
                racedError,
                slug,
              ),
            );
          }
          row = raced;
        } else {
          return next(
            dbError(
              "insert_completion",
              req.user!.id,
              "Erro ao registrar conclusão.",
              insertError,
              slug,
            ),
          );
        }
      } else {
        row = inserted;
      }
    } else if (existing.required_count < requiredCount) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("roadmap_completions")
        .update({ required_count: requiredCount })
        .eq("user_id", req.user!.id)
        .eq("roadmap_slug", slug)
        .select("completed_at, required_count")
        .single();

      if (updateError || !updated) {
        return next(
          dbError(
            "update_completion",
            req.user!.id,
            "Erro ao atualizar conclusão.",
            updateError,
            slug,
          ),
        );
      }
      row = updated;
    }

    if (!row) {
      // Guarda de invariante, nao erro do Supabase: nenhum branch acima populou
      // row apesar de nenhuma query ter falhado. Sem `cause` (nao ha erro cru),
      // so log + contexto para o Sentry.
      console.error(
        `[roadmap-completions] read_completion_missing_row slug=${slug} user=${req.user!.id}`,
      );
      return next(
        createError(500, "db_error", "Erro ao ler conclusão.", {
          context: {
            op: "read_completion_missing_row",
            userId: req.user!.id,
            slug,
          },
        }),
      );
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
      .select("roadmap_slug, completed_at, required_count")
      .eq("user_id", req.user!.id)
      .order("completed_at", { ascending: false });

    if (error) {
      return next(
        dbError("list", req.user!.id, "Erro ao buscar conclusões.", error),
      );
    }

    res.json({
      data: (data ?? []).map((row) => ({
        roadmapSlug: row.roadmap_slug,
        completedAt: row.completed_at,
        requiredCount: row.required_count,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
