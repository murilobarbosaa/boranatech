import { Router } from "express";

import { logAudit } from "../lib/audit";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const EDITABLE_TABLES: Record<string, string[]> = {
  news: ["title", "summary", "url", "image_url", "source", "author", "published_at", "tags", "is_published"],
  external_jobs: [
    "title",
    "company",
    "location",
    "remote",
    "seniority",
    "employment_type",
    "url",
    "description",
    "tags",
    "area_slug",
    "published_at",
    "is_published",
  ],
  events: [
    "title",
    "description",
    "starts_at",
    "ends_at",
    "location_label",
    "city",
    "state",
    "online",
    "url",
    "source",
    "tags",
    "is_published",
  ],
  areas: [
    "name",
    "short_description",
    "full_description",
    "tag",
    "tag_class",
    "icon",
    "color",
    "daily_tasks",
    "profile_indicated",
    "skills",
    "tools",
    "roles",
    "average_salary",
    "initial_roadmap",
    "projects",
    "free_courses",
    "essential_terms",
    "initial_tips",
    "is_pro",
    "is_published",
    "sort_order",
  ],
  technologies: [
    "name",
    "category",
    "description",
    "long_description",
    "icon",
    "color",
    "use_cases",
    "pros",
    "cons",
    "learning_path",
    "related_area_slugs",
    "market_demand",
    "difficulty",
    "beginner_friendly_score",
    "salary_context",
    "resources",
    "tools",
    "companies_using",
    "is_published",
    "sort_order",
  ],
  courses: [
    "title",
    "provider",
    "url",
    "area_slug",
    "technology_slugs",
    "level",
    "price_label",
    "is_free",
    "workload_hours",
    "certificate",
    "description",
    "tags",
    "language",
    "rating",
    "is_published",
  ],
  platforms: ["name", "url", "description", "price_label", "strengths", "limitations", "best_for", "tags", "rating", "is_published"],
  projects: [
    "title",
    "description",
    "objective",
    "level",
    "area_slug",
    "tools",
    "simplified_steps",
    "portfolio_tips",
    "linkedin_suggestion",
    "tags",
    "is_published",
  ],
  roadmaps: ["title", "description", "area_slug", "level", "estimated_duration_weeks", "is_pro", "is_published", "sort_order"],
};

function getSearchColumn(type: string) {
  return ["areas", "technologies", "platforms"].includes(type) ? "name" : "title";
}

function filterPayload(body: Record<string, unknown>, allowedFields: string[]) {
  const payload: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) payload[field] = body[field];
  }
  if ("slug" in body) payload.slug = body.slug;
  return payload;
}

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [{ count: usersCount }, { count: subsCount }, { count: areasCount }, { count: coursesCount }, { count: aiLogsCount }, recentAudit] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabaseAdmin.from("areas").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("courses").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("ai_usage_logs").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("content_audit_logs")
          .select("action, resource_type, resource_slug, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    res.json({
      data: {
        counts: {
          users: usersCount || 0,
          active_subscriptions: subsCount || 0,
          areas: areasCount || 0,
          courses: coursesCount || 0,
          ai_calls_total: aiLogsCount || 0,
        },
        recent_audit: recentAudit.data || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const { data: role } = await supabaseAdmin.from("admin_roles").select("role, created_at").eq("user_id", req.user!.id).single();
    res.json({ data: { user: req.user, role: role?.role || "editor" } });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!EDITABLE_TABLES[type]) return next(createError(404, "not_found", `Tipo '${type}' não reconhecido.`));

    const { search, published } = req.query;
    const orderField = type === "external_jobs" ? "fetched_at" : "created_at";
    let query = supabaseAdmin.from(type).select("*").order(orderField, { ascending: false }).limit(100);

    if (published !== undefined) query = query.eq("is_published", published === "true");
    if (search) query = query.ilike(getSearchColumn(type), `%${search}%`);

    const { data, error } = await query;
    if (error) return next(createError(500, "db_error", "Erro ao buscar conteúdo."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!EDITABLE_TABLES[type]) return next(createError(404, "not_found", `Tipo '${type}' não reconhecido.`));

    const { data, error } = await supabaseAdmin.from(type).select("*").eq("id", id).single();
    if (error || !data) return next(createError(404, "not_found", "Item não encontrado."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const allowedFields = EDITABLE_TABLES[type];
    if (!allowedFields) return next(createError(404, "not_found", `Tipo '${type}' não reconhecido.`));

    const payload = filterPayload(req.body as Record<string, unknown>, allowedFields);

    const { data, error } = await supabaseAdmin.from(type).insert(payload).select().single();
    if (error) {
      if (error.code === "23505") return next(createError(409, "conflict", "Já existe um item com este slug."));
      return next(createError(500, "db_error", "Erro ao criar item."));
    }

    await logAudit({
      actorUserId: req.user!.id,
      action: "create",
      resourceType: type,
      resourceId: data.id,
      resourceSlug: data.slug,
      after: data,
    });

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const allowedFields = EDITABLE_TABLES[type];
    if (!allowedFields) return next(createError(404, "not_found", `Tipo '${type}' não reconhecido.`));

    const { data: before } = await supabaseAdmin.from(type).select("*").eq("id", id).single();
    if (!before) return next(createError(404, "not_found", "Item não encontrado."));

    const updates = filterPayload(req.body as Record<string, unknown>, allowedFields);
    delete updates.slug;

    if (Object.keys(updates).length === 0) return next(createError(400, "invalid_request", "Nenhum campo válido para atualizar."));

    const { data, error } = await supabaseAdmin.from(type).update(updates).eq("id", id).select().single();
    if (error) return next(createError(500, "db_error", "Erro ao atualizar item."));

    const action = "is_published" in updates ? (updates.is_published ? "publish" : "unpublish") : "update";

    await logAudit({
      actorUserId: req.user!.id,
      action,
      resourceType: type,
      resourceId: id,
      resourceSlug: before.slug,
      before,
      after: data,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!EDITABLE_TABLES[type]) return next(createError(404, "not_found", `Tipo '${type}' não reconhecido.`));

    const { data: before } = await supabaseAdmin.from(type).select("*").eq("id", id).single();
    if (!before) return next(createError(404, "not_found", "Item não encontrado."));

    if (req.query.force === "true") {
      const { error } = await supabaseAdmin.from(type).delete().eq("id", id);
      if (error) return next(createError(500, "db_error", "Erro ao deletar item."));
    } else {
      const { error } = await supabaseAdmin.from(type).update({ is_published: false }).eq("id", id);
      if (error) return next(createError(500, "db_error", "Erro ao despublicar item."));
    }

    await logAudit({
      actorUserId: req.user!.id,
      action: "delete",
      resourceType: type,
      resourceId: id,
      resourceSlug: before.slug,
      before,
    });

    res.json({ data: { deleted: true, id } });
  } catch (err) {
    next(err);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const { resource_type, limit = "50", offset = "0" } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
    const parsedOffset = parseInt(String(offset), 10) || 0;

    let query = supabaseAdmin
      .from("content_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parsedLimit)
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (resource_type) query = query.eq("resource_type", resource_type);

    const { data, error } = await query;
    if (error) return next(createError(500, "db_error", "Erro ao buscar logs."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { limit = "50", offset = "0", search } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
    const parsedOffset = parseInt(String(offset), 10) || 0;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, user_id, name, email, area_interesse, onboarding_completed, created_at")
      .order("created_at", { ascending: false })
      .limit(parsedLimit)
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (search) query = query.ilike("email", `%${search}%`);

    const { data, error } = await query;
    if (error) return next(createError(500, "db_error", "Erro ao buscar usuários."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/subscriptions", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plans(name, code, price_cents)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return next(createError(500, "db_error", "Erro ao buscar assinaturas."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/ai-stats", async (_req, res, next) => {
  try {
    const { data: byTool, error } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("tool, status, cost_estimate")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) return next(createError(500, "db_error", "Erro ao buscar stats de IA."));

    const stats: Record<string, { calls: number; success: number; cost: number }> = {};
    for (const log of byTool || []) {
      if (!stats[log.tool]) stats[log.tool] = { calls: 0, success: 0, cost: 0 };
      stats[log.tool].calls += 1;
      if (log.status === "success") stats[log.tool].success += 1;
      stats[log.tool].cost += parseFloat(log.cost_estimate || "0");
    }

    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
