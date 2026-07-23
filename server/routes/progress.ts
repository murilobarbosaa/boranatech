import { Router } from "express";

import { projetos } from "../../shared/projects/catalog";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  isDevProUser,
  requireAuth,
  resolveProStatus,
} from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const VALID_CONTEXTS = [
  "portfolio_checklist",
  "favorites",
  "course_progress",
  "quiz_history",
  "career_plan",
  "project_progress",
];

function isValidContext(value: string) {
  return VALID_CONTEXTS.includes(value);
}

router.use(requireAuth);

router.get("/:context", async (req, res, next) => {
  try {
    const { context } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key, state, updated_at")
      .eq("user_id", req.user!.id)
      .eq("context", context);

    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar progresso."));
    }

    res.json({
      data: (data ?? []).map((row) => ({
        itemKey: row.item_key,
        state: row.state ?? {},
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:context/:itemKey", async (req, res, next) => {
  try {
    const { context, itemKey } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }
    if (!itemKey) {
      return next(
        createError(400, "invalid_request", "itemKey é obrigatório."),
      );
    }

    // project_progress: conclusao AUTODECLARADA de projeto (mesmo nivel de
    // confianca dos checkboxes de trilha). A conclusao VALIDADA pelo leitor
    // de GitHub e assunto da fase 5c, em tabela propria escrita so pelo
    // server. item_key precisa resolver no catalogo (que e publico, entao
    // 404 direto, sem anti-enumeracao); projeto premium exige Pro, resolvido
    // AQUI dentro e so quando o alvo e pro, pra os toggles dos demais
    // contextos (trilha, checklists) nao pagarem cache+RPC a cada clique.
    if (context === "project_progress") {
      const project = projetos.find((p) => p.id === itemKey);
      if (!project) {
        return next(createError(404, "not_found", "Projeto não encontrado."));
      }
      if (project.pro === true) {
        const isPro =
          isDevProUser(req) || (await resolveProStatus(req.user!.id));
        if (!isPro) {
          return next(
            createError(
              403,
              "forbidden",
              "Recurso Pro. Assine o Plano Pro para concluir projetos premium.",
            ),
          );
        }
      }
    }

    const { state } = req.body as { state?: unknown };
    if (
      state !== undefined &&
      (typeof state !== "object" || state === null || Array.isArray(state))
    ) {
      return next(
        createError(400, "invalid_request", "state deve ser um objeto."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        {
          user_id: req.user!.id,
          context,
          item_key: itemKey,
          state: (state as Record<string, unknown> | undefined) ?? {},
        },
        { onConflict: "user_id,context,item_key" },
      )
      .select("item_key, state, updated_at")
      .single();

    if (error) {
      // Preserva o erro cru do Supabase (cause -> LinkedErrors do Sentry) e
      // anexa contexto: sem isso o Sentry so via a mensagem generica.
      console.error(
        `[progress] upsert falhou context=${context} item_key=${itemKey} user=${req.user!.id}`,
        error,
      );
      return next(
        createError(500, "db_error", "Erro ao salvar progresso.", {
          cause: error,
          context: {
            type: context,
            slug: itemKey,
            userId: req.user!.id,
            state: (state as Record<string, unknown> | undefined) ?? {},
          },
        }),
      );
    }

    res.json({
      data: {
        itemKey: data.item_key,
        state: data.state ?? {},
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:context/:itemKey", async (req, res, next) => {
  try {
    const { context, itemKey } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }

    const { error } = await supabaseAdmin
      .from("user_progress")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("context", context)
      .eq("item_key", itemKey);

    if (error) {
      return next(createError(500, "db_error", "Erro ao remover progresso."));
    }

    res.json({ data: { removed: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
