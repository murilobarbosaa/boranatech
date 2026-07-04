import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

const VALID_RESOURCE_TYPES = [
  "area",
  "roadmap",
  "curso",
  "projeto",
  "dica",
  "conceito",
  "plataforma",
  "evento",
  "noticia",
  "comunidade",
  "faculdade",
  "tecnologia",
  "empresa",
  "vaga",
];

// Range size requested per query. Since the loop advances by the number of
// rows actually returned and only stops on an empty page, correctness does not
// depend on this matching the PostgREST max_rows cap (a smaller cap just means
// more pages).
const BOOKMARKS_PAGE_SIZE = 1000;
// Safety ceiling on total rows collected, to avoid a pathological loop.
const BOOKMARKS_MAX_ROWS = 10000;

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    // COM page/limit: resposta paginada (novo client). SEM os params:
    // comportamento legado byte-identico, pro client antigo no ar durante a
    // janela de deploy (Railway e Vercel deployam separados).
    const wantsPagination =
      req.query.page !== undefined || req.query.limit !== undefined;

    if (wantsPagination) {
      // Clamp ANTES de qualquer uso: invalido cai no default, acima do teto
      // clampa (mesma politica do /content/news e /content/jobs).
      const rawPage = parseInt(String(req.query.page ?? ""), 10);
      const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
      const rawLimit = parseInt(String(req.query.limit ?? ""), 10);
      const limit =
        !Number.isInteger(rawLimit) || rawLimit < 1
          ? 50
          : Math.min(rawLimit, 100);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabaseAdmin
        .from("user_bookmarks")
        .select("*", { count: "exact" })
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        return next(createError(500, "db_error", "Erro ao buscar favoritos."));
      }

      const total = count ?? 0;
      const total_pages = Math.max(1, Math.ceil(total / limit));

      return res.json({
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          total_pages,
          has_next: page < total_pages,
          has_prev: page > 1,
        },
      });
    }

    const bookmarks: unknown[] = [];

    while (bookmarks.length < BOOKMARKS_MAX_ROWS) {
      const from = bookmarks.length;
      const to = from + BOOKMARKS_PAGE_SIZE - 1;

      const { data, error } = await supabaseAdmin
        .from("user_bookmarks")
        .select("*")
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        return next(createError(500, "db_error", "Erro ao buscar favoritos."));
      }

      const rows = data || [];
      if (rows.length === 0) {
        return res.json({ data: bookmarks });
      }

      bookmarks.push(...rows);
    }

    console.warn(
      `[bookmarks] user ${req.user!.id} hit BOOKMARKS_MAX_ROWS (${BOOKMARKS_MAX_ROWS}); results may be truncated.`,
    );
    res.json({ data: bookmarks });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      resource_type,
      resource_id,
      title_snapshot,
      subtitle_snapshot,
      url_snapshot,
    } = req.body as Record<string, unknown>;

    if (!resource_type || !resource_id) {
      return next(
        createError(
          400,
          "invalid_request",
          "resource_type e resource_id são obrigatórios.",
        ),
      );
    }

    if (
      typeof resource_type !== "string" ||
      !VALID_RESOURCE_TYPES.includes(resource_type)
    ) {
      return next(
        createError(400, "invalid_request", `Tipo inválido: ${resource_type}`),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_bookmarks")
      .insert({
        user_id: req.user!.id,
        resource_type,
        resource_id: String(resource_id),
        title_snapshot:
          typeof title_snapshot === "string" ? title_snapshot : null,
        subtitle_snapshot:
          typeof subtitle_snapshot === "string" ? subtitle_snapshot : null,
        url_snapshot: typeof url_snapshot === "string" ? url_snapshot : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: existing } = await supabaseAdmin
          .from("user_bookmarks")
          .select("*")
          .eq("user_id", req.user!.id)
          .eq("resource_type", resource_type)
          .eq("resource_id", String(resource_id))
          .single();

        return res.json({ data: existing });
      }

      return next(createError(500, "db_error", "Erro ao salvar favorito."));
    }

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:resourceType/:resourceId", async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;

    const { error } = await supabaseAdmin
      .from("user_bookmarks")
      .delete()
      .eq("user_id", req.user!.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId);

    if (error) {
      return next(createError(500, "db_error", "Erro ao remover favorito."));
    }

    res.json({ data: { removed: true } });
  } catch (err) {
    next(err);
  }
});

router.post("/migrate", async (req, res, next) => {
  try {
    const { bookmarks } = req.body as {
      bookmarks?: Array<Record<string, unknown>>;
    };

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return res.json({ data: { migrated: 0 } });
    }

    const rows = bookmarks
      .slice(0, 500)
      .filter(
        (bookmark) =>
          bookmark.resource_type &&
          bookmark.resource_id &&
          VALID_RESOURCE_TYPES.includes(String(bookmark.resource_type)),
      )
      .map((bookmark) => ({
        user_id: req.user!.id,
        resource_type: String(bookmark.resource_type),
        resource_id: String(bookmark.resource_id),
        title_snapshot:
          typeof bookmark.title_snapshot === "string"
            ? bookmark.title_snapshot
            : null,
        subtitle_snapshot:
          typeof bookmark.subtitle_snapshot === "string"
            ? bookmark.subtitle_snapshot
            : null,
        url_snapshot:
          typeof bookmark.url_snapshot === "string"
            ? bookmark.url_snapshot
            : null,
      }));

    if (rows.length === 0) {
      return res.json({ data: { migrated: 0 } });
    }

    const { error } = await supabaseAdmin.from("user_bookmarks").upsert(rows, {
      onConflict: "user_id,resource_type,resource_id",
      ignoreDuplicates: true,
    });

    if (error) {
      return next(createError(500, "db_error", "Erro ao migrar favoritos."));
    }

    res.json({ data: { migrated: rows.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
