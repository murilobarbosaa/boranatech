import { Router } from "express";

import {
  aliasesOf,
  dedupeByCanonicalId,
  resolveProjectId,
} from "../../shared/projects/aliases";
import { projetos } from "../../shared/projects/catalog";
import { erroEncadeavel } from "../lib/supabaseError";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  isDevProUser,
  requireAuth,
  resolveProStatus,
} from "../middleware/auth";
import { createError } from "../middleware/error";
import { montarDbError } from "../lib/dbError";

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

    // Ordem por updated_at desc so importa em project_progress, mas custa
    // nada nos demais contextos e evita um segundo caminho de consulta: e o
    // que faz o dedupe abaixo descartar a marcacao ANTIGA (a do id fundido)
    // e ficar com a mais recente.
    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key, state, updated_at")
      .eq("user_id", req.user!.id)
      .eq("context", context)
      .order("updated_at", { ascending: false });

    if (error) {
      return next(
        montarDbError(
          "progress",
          "progress load",
          error,
          "Erro ao buscar progresso.",
        ),
      );
    }

    const linhas = (data ?? []).map((row) => ({
      itemKey: row.item_key as string,
      state: (row.state ?? {}) as Record<string, unknown>,
      updatedAt: row.updated_at as string,
    }));

    // Quem marcou os dois lados de uma duplicata (medido em producao:
    // landing-page-pessoal e portfolio-pessoal-html-css marcados pela mesma
    // pessoa) tem duas linhas que hoje viram o MESMO projeto. Sem o colapso o
    // client recebe um id que nao existe mais e o contador de concluidos
    // diverge da lista. A guarda fica AQUI, na rota, nao em cada chamador.
    res.json({
      data:
        context === "project_progress"
          ? dedupeByCanonicalId(
              linhas,
              (r) => r.itemKey,
              (r, itemKey) => ({ ...r, itemKey }),
            )
          : linhas,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:context/:itemKey", async (req, res, next) => {
  try {
    const { context } = req.params;
    if (!isValidContext(context)) {
      return next(
        createError(400, "invalid_request", `Contexto inválido: ${context}`),
      );
    }
    if (!req.params.itemKey) {
      return next(
        createError(400, "invalid_request", "itemKey é obrigatório."),
      );
    }
    // Alias resolvido ANTES do find e do upsert, entao o banco so recebe id
    // canonico. Sem isto, a migracao do localStorage anonimo no primeiro
    // login trava para sempre: useProjectCompletion manda os ids locais num
    // Promise.all, um id fundido daria 404, o lote inteiro rejeita, o catch
    // preserva o localStorage e a tentativa se repete em toda sessao futura.
    const itemKey =
      context === "project_progress"
        ? resolveProjectId(req.params.itemKey)
        : req.params.itemKey;

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
          cause: erroEncadeavel(error),
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

    // Desmarcar apaga o canonico E os aliases: apagar so o canonico deixaria
    // a linha do id fundido no banco, e o proximo GET a traria de volta pelo
    // dedupe. A marcacao ressuscitaria sozinha depois de desmarcada.
    const chaves =
      context === "project_progress"
        ? [resolveProjectId(itemKey), ...aliasesOf(resolveProjectId(itemKey))]
        : [itemKey];

    const { error } = await supabaseAdmin
      .from("user_progress")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("context", context)
      .in("item_key", chaves);

    if (error) {
      return next(createError(500, "db_error", "Erro ao remover progresso."));
    }

    res.json({ data: { removed: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
