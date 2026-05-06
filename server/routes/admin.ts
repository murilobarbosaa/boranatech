import { Router } from "express";

import { logAudit } from "../lib/audit";
import { env } from "../lib/env";
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
  affiliates: [
    "name",
    "email",
    "code",
    "discount_percent",
    "commission_percent",
    "status",
    "notes",
    "commission_due_cents",
    "commission_paid_cents",
  ],
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

type PosthogTrendResult = {
  label?: string;
  breakdown_value?: string | number | null;
  aggregated_value?: number | string | null;
  data?: Array<number | string | null>;
};

const emptyPosthogStats = {
  configured: false,
  totalPageviews: 0,
  uniqueUsers: 0,
  pages: [] as Array<{ page: string; views: number }>,
  events: {
    user_signed_up: 0,
    user_signed_in: 0,
    checkout_started: 0,
    quiz_completed: 0,
  },
  acquisition: [] as Array<{ channel: string; users: number }>,
};

type PosthogEventName = keyof typeof emptyPosthogStats.events;

function sumTrendValue(result: PosthogTrendResult): number {
  if (typeof result.aggregated_value === "number") return result.aggregated_value;
  if (typeof result.aggregated_value === "string") return Number(result.aggregated_value) || 0;

  return (result.data || []).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
}

function pagePath(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.pathname || "/";
  } catch {
    return value || "/";
  }
}

async function fetchPosthogTrend(params: Record<string, string>) {
  const url = new URL(`https://us.posthog.com/api/projects/${env.posthogProjectId}/insights/trend/`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.posthogApiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    console.error(`[posthog] API rejeitou credenciais com status ${response.status}`);
    return null;
  }

  if (!response.ok) {
    console.error(`[posthog] Erro ao buscar trend: ${response.status}`);
    return null;
  }

  return response.json() as Promise<{ result?: PosthogTrendResult[] }>;
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

router.get("/posthog-stats", async (_req, res) => {
  const data = structuredClone(emptyPosthogStats);

  if (!env.posthogApiKey || !env.posthogProjectId) {
    res.json({ data });
    return;
  }

  data.configured = true;

  try {
    const events: PosthogEventName[] = ["user_signed_up", "user_signed_in", "checkout_started", "quiz_completed"];
    const [pageviews, uniqueUsers, pages, customEvents, acquisition] = await Promise.all([
      fetchPosthogTrend({
        date_from: "-30d",
        events: JSON.stringify([{ id: "$pageview", type: "events", order: 0 }]),
      }),
      fetchPosthogTrend({
        date_from: "-30d",
        events: JSON.stringify([{ id: "$pageview", type: "events", order: 0, math: "dau" }]),
      }),
      fetchPosthogTrend({
        date_from: "-30d",
        breakdown: "$current_url",
        breakdown_type: "event",
        events: JSON.stringify([{ id: "$pageview", type: "events", order: 0 }]),
      }),
      fetchPosthogTrend({
        date_from: "-30d",
        events: JSON.stringify(events.map((event, index) => ({ id: event, type: "events", order: index }))),
      }),
      fetchPosthogTrend({
        date_from: "-30d",
        breakdown: "$referring_domain",
        breakdown_type: "event",
        events: JSON.stringify([{ id: "$pageview", type: "events", order: 0, math: "dau" }]),
      }),
    ]);

    data.totalPageviews = sumTrendValue(pageviews?.result?.[0] || {});
    data.uniqueUsers = sumTrendValue(uniqueUsers?.result?.[0] || {});
    data.pages = (pages?.result || [])
      .map((item) => ({
        page: pagePath(String(item.breakdown_value || item.label || "/")),
        views: sumTrendValue(item),
      }))
      .filter((item) => item.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    for (const item of customEvents?.result || []) {
      const label = String(item.label || "");
      const eventName = events.find((event) => label.includes(event));
      if (eventName) data.events[eventName] = sumTrendValue(item);
    }

    data.acquisition = (acquisition?.result || [])
      .map((item) => ({
        channel: String(item.breakdown_value || item.label || "Direto"),
        users: sumTrendValue(item),
      }))
      .filter((item) => item.users > 0)
      .sort((a, b) => b.users - a.users)
      .slice(0, 6);
  } catch (err) {
    console.error("[posthog] Erro inesperado ao buscar analytics", err);
    res.json({ data: { ...emptyPosthogStats, configured: true } });
    return;
  }

  res.json({ data });
});

router.get("/churn-risk", async (_req, res) => {
  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, plans(name, price_cents)")
      .eq("status", "active");

    if (error) {
      console.error("[admin] Erro ao buscar assinaturas para churn-risk", error);
      res.json({ data: [] });
      return;
    }

    const activeSubscriptions = (subscriptions || []).filter((subscription) => subscription.user_id);
    const userIds = activeSubscriptions.map((subscription) => subscription.user_id as string);
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("user_id, name, email").in("user_id", userIds)
      : { data: [] };
    const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
    const inactiveThresholdMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const users = await Promise.all(
      activeSubscriptions.map(async (subscription) => {
        const userId = subscription.user_id as string;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authError || !authData.user) return null;

        const lastSeenAt = authData.user.last_sign_in_at || authData.user.created_at;
        if (!lastSeenAt) return null;

        const daysInactive = Math.floor((now - new Date(lastSeenAt).getTime()) / (24 * 60 * 60 * 1000));
        if (daysInactive < 14 || now - new Date(lastSeenAt).getTime() < inactiveThresholdMs) return null;

        const profile = profilesByUserId.get(userId);
        const metadata = authData.user.user_metadata || {};
        const plan = Array.isArray(subscription.plans) ? subscription.plans[0] : subscription.plans;
        const priceCents = Number(plan?.price_cents || 0);

        return {
          name: String(profile?.name || metadata.name || metadata.full_name || authData.user.email || "Usuário"),
          email: String(profile?.email || authData.user.email || ""),
          days_inactive: daysInactive,
          mrr: priceCents / 100,
        };
      }),
    );

    res.json({
      data: users
        .filter((user): user is { name: string; email: string; days_inactive: number; mrr: number } => Boolean(user))
        .sort((a, b) => b.days_inactive - a.days_inactive)
        .slice(0, 10),
    });
  } catch (err) {
    console.error("[admin] Erro inesperado ao buscar churn-risk", err);
    res.json({ data: [] });
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

    if (req.query.force === "true" || type === "affiliates") {
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

router.get("/affiliates-stats", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("affiliates").select("*").order("revenue_cents", { ascending: false });

    if (error) {
      console.error("[admin] Erro ao buscar afiliados", error);
      res.json({ data: [] });
      return;
    }

    res.json({ data: data || [] });
  } catch (err) {
    console.error("[admin] Erro inesperado ao buscar afiliados", err);
    res.json({ data: [] });
  }
});

export default router;
