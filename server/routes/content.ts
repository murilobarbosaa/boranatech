import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.get("/areas", async (req, res, next) => {
  try {
    const { tag, search } = req.query;
    let query = supabaseAdmin
      .from("areas")
      .select(
        "id, slug, name, short_description, tag, tag_class, icon, color, is_pro, sort_order, profile_indicated, skills, roles",
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (tag) query = query.eq("tag", tag);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar áreas."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/areas/:slug", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("areas")
      .select("*")
      .eq("slug", req.params.slug)
      .eq("is_published", true)
      .single();

    if (error || !data)
      return next(createError(404, "not_found", "Área não encontrada."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/technologies", async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = supabaseAdmin
      .from("technologies")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar tecnologias."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/ranking", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("technologies")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar ranking."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/compare", async (req, res, next) => {
  try {
    const { left, right } = req.query;
    if (!left || !right) {
      return next(
        createError(
          400,
          "invalid_request",
          "Parâmetros left e right são obrigatórios.",
        ),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("technologies")
      .select("*")
      .in("slug", [String(left), String(right)])
      .eq("is_published", true);

    if (error)
      return next(
        createError(500, "db_error", "Erro ao comparar tecnologias."),
      );
    if (!data || data.length < 2)
      return next(
        createError(
          404,
          "not_found",
          "Uma ou mais tecnologias não encontradas.",
        ),
      );

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/technologies/:slug", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("technologies")
      .select("*")
      .eq("slug", req.params.slug)
      .eq("is_published", true)
      .single();

    if (error || !data)
      return next(createError(404, "not_found", "Tecnologia não encontrada."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/courses", async (req, res, next) => {
  try {
    const { area, is_free, level, search } = req.query;
    let query = supabaseAdmin
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (area) query = query.eq("area_slug", area);
    if (is_free !== undefined) query = query.eq("is_free", is_free === "true");
    if (level) query = query.eq("level", level);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar cursos."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/platforms", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("platforms")
      .select("*")
      .eq("is_published", true)
      .order("name", { ascending: true });

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar plataformas."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const { area, level } = req.query;
    let query = supabaseAdmin
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (area) query = query.eq("area_slug", area);
    if (level) query = query.eq("level", level);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar projetos."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:slug", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("slug", req.params.slug)
      .eq("is_published", true)
      .single();

    if (error || !data)
      return next(createError(404, "not_found", "Projeto não encontrado."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps", async (req, res, next) => {
  try {
    const { area } = req.query;
    let query = supabaseAdmin
      .from("roadmaps")
      .select(
        "id, slug, title, description, area_slug, level, estimated_duration_weeks, is_pro, sort_order",
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (area) query = query.eq("area_slug", area);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar roadmaps."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps/:slug/progress", requireAuth, async (req, res, next) => {
  try {
    const { data: roadmap } = await supabaseAdmin
      .from("roadmaps")
      .select("id")
      .eq("slug", req.params.slug)
      .single();

    if (!roadmap)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    const { data, error } = await supabaseAdmin
      .from("user_roadmap_progress")
      .select("step_id, status, completed_at, notes")
      .eq("user_id", req.user!.id)
      .eq("roadmap_id", roadmap.id);

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar progresso."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post("/roadmaps/:slug/progress", requireAuth, async (req, res, next) => {
  try {
    const { step_id, status, notes } = req.body as Record<string, unknown>;

    if (!step_id)
      return next(
        createError(400, "invalid_request", "step_id é obrigatório."),
      );
    if (status && !["completed", "skipped"].includes(String(status))) {
      return next(createError(400, "invalid_request", "status inválido."));
    }

    const { data: roadmap } = await supabaseAdmin
      .from("roadmaps")
      .select("id")
      .eq("slug", req.params.slug)
      .single();
    if (!roadmap)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    if (status === null || status === undefined) {
      await supabaseAdmin
        .from("user_roadmap_progress")
        .delete()
        .eq("user_id", req.user!.id)
        .eq("step_id", step_id);
      return res.json({ data: { removed: true } });
    }

    const { data, error } = await supabaseAdmin
      .from("user_roadmap_progress")
      .upsert(
        {
          user_id: req.user!.id,
          roadmap_id: roadmap.id,
          step_id,
          status: status || "completed",
          completed_at: new Date().toISOString(),
          notes: notes || null,
        },
        { onConflict: "user_id,step_id" },
      )
      .select()
      .single();

    if (error)
      return next(createError(500, "db_error", "Erro ao salvar progresso."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps/:slug", async (req, res, next) => {
  try {
    const { data: roadmap, error } = await supabaseAdmin
      .from("roadmaps")
      .select("*, roadmap_steps(*)")
      .eq("slug", req.params.slug)
      .eq("is_published", true)
      .order("order_index", {
        referencedTable: "roadmap_steps",
        ascending: true,
      })
      .single();

    if (error || !roadmap)
      return next(createError(404, "not_found", "Roadmap não encontrado."));

    res.json({ data: roadmap });
  } catch (err) {
    next(err);
  }
});

router.get("/sources/status", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("content_sources")
      .select("code, name, type, status, last_sync_at")
      .order("code");

    if (error)
      return next(
        createError(500, "db_error", "Erro ao buscar status das fontes."),
      );

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/news", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "21"), 10) || 21, 1),
      100,
    );
    const level = req.query.level ? String(req.query.level) : "";
    const q = req.query.q ? String(req.query.q).trim() : "";

    let query = supabaseAdmin
      .from("news")
      .select(
        "id, slug, title, title_pt_br, summary, summary_pt_br, level, why_it_matters, url, image_url, source, author, published_at, tags, enriched_at",
        { count: "exact" },
      )
      .eq("is_published", true)
      .not("enriched_at", "is", null);

    if (level && ["iniciante", "intermediario", "avancado"].includes(level)) {
      query = query.eq("level", level);
    }

    if (q) {
      const safe = q.replace(/[%,()]/g, " ");
      const term = `%${safe}%`;
      query = query.or(
        `title_pt_br.ilike.${term},summary_pt_br.ilike.${term},why_it_matters.ilike.${term}`,
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar notícias."));

    const total = count ?? 0;
    const total_pages = Math.max(1, Math.ceil(total / limit));

    res.json({
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
  } catch (err) {
    next(err);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt(String(req.query.limit || "20"), 10) || 20,
      50,
    );
    const offset = Math.max(
      parseInt(String(req.query.offset || "0"), 10) || 0,
      0,
    );
    const area = req.query.area ? String(req.query.area) : "";
    const seniority = req.query.seniority ? String(req.query.seniority) : "";

    let query = supabaseAdmin
      .from("external_jobs")
      .select(
        "id, title, company, location, remote, seniority, url, area_slug, published_at",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (area) query = query.eq("area_slug", area);
    if (seniority) query = query.eq("seniority", seniority);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar vagas."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
