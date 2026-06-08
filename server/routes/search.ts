import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    const type = req.query.type as string | undefined;
    const limit = Math.min(
      parseInt(String(req.query.limit || "20"), 10) || 20,
      50,
    );

    if (!query || query.length < 2) {
      return next(
        createError(
          400,
          "invalid_request",
          "q deve ter pelo menos 2 caracteres.",
        ),
      );
    }

    let dbQuery = supabaseAdmin
      .from("search_documents")
      .select("resource_type, resource_id, title, description, url")
      .eq("is_published", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "portuguese",
      })
      .limit(limit);

    if (type) {
      dbQuery = dbQuery.eq("resource_type", type);
    }

    const { data, error } = await dbQuery;

    if (error) {
      let fallbackQuery = supabaseAdmin
        .from("search_documents")
        .select("resource_type, resource_id, title, description, url")
        .eq("is_published", true)
        .ilike("title", `%${query}%`)
        .limit(limit);

      if (type) {
        fallbackQuery = fallbackQuery.eq("resource_type", type);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        return next(createError(500, "db_error", "Erro ao realizar busca."));
      }

      return res.json({
        data: fallbackData || [],
        total: fallbackData?.length || 0,
      });
    }

    res.json({ data: data || [], total: data?.length || 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
