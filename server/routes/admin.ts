import { Router } from "express";

import { logAudit } from "../lib/audit";
import { deleteAvatarObject } from "../lib/avatarUpload";
import { env } from "../lib/env";
import { emailQueue } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import emailCampaignsRouter from "./adminEmailCampaigns";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// Campanhas de e-mail pra waitlist (aba Emails). Depois dos guards de admin.
router.use("/email-campaigns", emailCampaignsRouter);

const EDITABLE_TABLES: Record<string, string[]> = {
  news: [
    "title",
    "summary",
    "url",
    "image_url",
    "source",
    "author",
    "published_at",
    "tags",
    "is_published",
  ],
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
  platforms: [
    "name",
    "url",
    "description",
    "price_label",
    "strengths",
    "limitations",
    "best_for",
    "tags",
    "rating",
    "is_published",
  ],
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
  roadmaps: [
    "title",
    "description",
    "area_slug",
    "level",
    "estimated_duration_weeks",
    "is_pro",
    "is_published",
    "sort_order",
  ],
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
  return ["areas", "technologies", "platforms"].includes(type)
    ? "name"
    : "title";
}

function filterPayload(body: Record<string, unknown>, allowedFields: string[]) {
  const payload: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) payload[field] = body[field];
  }
  if ("slug" in body) payload.slug = body.slug;
  return payload;
}

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

type PosthogQueryResponse = {
  results: ReadonlyArray<ReadonlyArray<unknown>>;
  columns?: ReadonlyArray<string>;
};

function cellToNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

// Leitura via HogQL no endpoint /query/ (POST). E o caminho que a Personal API
// Key escopada (phx_) autoriza; o legado /insights/trend/ retornava nao-2xx e o
// erro era engolido. Aqui, em qualquer nao-2xx, logamos status E corpo da
// resposta do PostHog (que explica o motivo) e retornamos null.
async function runPosthogQuery(
  hogql: string,
): Promise<PosthogQueryResponse | null> {
  try {
    const response = await fetch(
      `https://us.posthog.com/api/projects/${env.posthogProjectId}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.posthogApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: { kind: "HogQLQuery", query: hogql },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `[posthog] query falhou status=${response.status} body=${body}`,
      );
      return null;
    }

    return (await response.json()) as PosthogQueryResponse;
  } catch (err) {
    console.error("[posthog] erro ao executar query HogQL", err);
    return null;
  }
}

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [
      { count: usersCount },
      { count: subsCount },
      { count: areasCount },
      { count: coursesCount },
      { count: aiLogsCount },
      recentAudit,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin.from("areas").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("courses").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true }),
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

  const since = "now() - interval 30 day";

  try {
    const events: PosthogEventName[] = [
      "user_signed_up",
      "user_signed_in",
      "checkout_started",
      "quiz_completed",
    ];
    const [pageviews, uniqueUsers, pages, customEvents, acquisition] =
      await Promise.all([
        runPosthogQuery(
          `select count() from events where event = '$pageview' and timestamp > ${since}`,
        ),
        runPosthogQuery(
          `select count(distinct person_id) from events where event = '$pageview' and timestamp > ${since}`,
        ),
        runPosthogQuery(
          `select if(trimRight(path(properties.$current_url), '/') = '', '/', trimRight(path(properties.$current_url), '/')) as page, count() as views from events where event = '$pageview' and timestamp > ${since} group by page order by views desc limit 10`,
        ),
        runPosthogQuery(
          `select event, count() as total from events where event in ('user_signed_up','user_signed_in','checkout_started','quiz_completed') and timestamp > ${since} group by event`,
        ),
        runPosthogQuery(
          `select trimRight(properties.$referring_domain, '/') as domain, count(distinct person_id) as users from events where event = '$pageview' and timestamp > ${since} and properties.$referring_domain is not null group by domain order by users desc limit 6`,
        ),
      ]);

    data.totalPageviews = cellToNumber(pageviews?.results?.[0]?.[0]);
    data.uniqueUsers = cellToNumber(uniqueUsers?.results?.[0]?.[0]);

    data.pages = (pages?.results || [])
      .map((row) => ({
        page: String(row[0] ?? "/"),
        views: cellToNumber(row[1]),
      }))
      .filter((item) => item.views > 0)
      .slice(0, 10);

    for (const row of customEvents?.results || []) {
      const eventName = events.find((event) => event === String(row[0]));
      if (eventName) data.events[eventName] = cellToNumber(row[1]);
    }

    data.acquisition = (acquisition?.results || [])
      .map((row) => ({
        channel: String(row[0] ?? "Direto"),
        users: cellToNumber(row[1]),
      }))
      .filter((item) => item.users > 0)
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
      console.error(
        "[admin] Erro ao buscar assinaturas para churn-risk",
        error,
      );
      res.json({ data: [] });
      return;
    }

    const activeSubscriptions = (subscriptions || []).filter(
      (subscription) => subscription.user_id,
    );
    const userIds = activeSubscriptions.map(
      (subscription) => subscription.user_id as string,
    );
    const { data: profiles } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds)
      : { data: [] };
    const profilesByUserId = new Map(
      (profiles || []).map((profile) => [profile.user_id, profile]),
    );
    const inactiveThresholdMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const users = await Promise.all(
      activeSubscriptions.map(async (subscription) => {
        const userId = subscription.user_id as string;
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(userId);
        if (authError || !authData.user) return null;

        const lastSeenAt =
          authData.user.last_sign_in_at || authData.user.created_at;
        if (!lastSeenAt) return null;

        const daysInactive = Math.floor(
          (now - new Date(lastSeenAt).getTime()) / (24 * 60 * 60 * 1000),
        );
        if (
          daysInactive < 14 ||
          now - new Date(lastSeenAt).getTime() < inactiveThresholdMs
        )
          return null;

        const profile = profilesByUserId.get(userId);
        const metadata = authData.user.user_metadata || {};
        const plan = Array.isArray(subscription.plans)
          ? subscription.plans[0]
          : subscription.plans;
        const priceCents = Number(plan?.price_cents || 0);

        return {
          name: String(
            profile?.name ||
              metadata.name ||
              metadata.full_name ||
              authData.user.email ||
              "Usuário",
          ),
          email: String(profile?.email || authData.user.email || ""),
          days_inactive: daysInactive,
          mrr: priceCents / 100,
        };
      }),
    );

    res.json({
      data: users
        .filter(
          (
            user,
          ): user is {
            name: string;
            email: string;
            days_inactive: number;
            mrr: number;
          } => Boolean(user),
        )
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
    const { data: role } = await supabaseAdmin
      .from("admin_roles")
      .select("role, created_at")
      .eq("user_id", req.user!.id)
      .single();
    res.json({ data: { user: req.user, role: role?.role || "editor" } });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { search, published } = req.query;
    const orderField = type === "external_jobs" ? "fetched_at" : "created_at";
    let query = supabaseAdmin
      .from(type)
      .select("*")
      .order(orderField, { ascending: false })
      .limit(100);

    if (published !== undefined)
      query = query.eq("is_published", published === "true");
    if (search) query = query.ilike(getSearchColumn(type), `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar conteúdo."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.get("/content/:type/:id", async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data, error } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data)
      return next(createError(404, "not_found", "Item não encontrado."));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/content/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const allowedFields = EDITABLE_TABLES[type];
    if (!allowedFields)
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const payload = filterPayload(
      req.body as Record<string, unknown>,
      allowedFields,
    );

    const { data, error } = await supabaseAdmin
      .from(type)
      .insert(payload)
      .select()
      .single();
    if (error) {
      if (error.code === "23505")
        return next(
          createError(409, "conflict", "Já existe um item com este slug."),
        );
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
    if (!allowedFields)
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data: before } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (!before)
      return next(createError(404, "not_found", "Item não encontrado."));

    const updates = filterPayload(
      req.body as Record<string, unknown>,
      allowedFields,
    );
    delete updates.slug;

    if (Object.keys(updates).length === 0)
      return next(
        createError(
          400,
          "invalid_request",
          "Nenhum campo válido para atualizar.",
        ),
      );

    const { data, error } = await supabaseAdmin
      .from(type)
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error)
      return next(createError(500, "db_error", "Erro ao atualizar item."));

    const action =
      "is_published" in updates
        ? updates.is_published
          ? "publish"
          : "unpublish"
        : "update";

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
    if (!EDITABLE_TABLES[type])
      return next(
        createError(404, "not_found", `Tipo '${type}' não reconhecido.`),
      );

    const { data: before } = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("id", id)
      .single();
    if (!before)
      return next(createError(404, "not_found", "Item não encontrado."));

    if (req.query.force === "true" || type === "affiliates") {
      const { error } = await supabaseAdmin.from(type).delete().eq("id", id);
      if (error)
        return next(createError(500, "db_error", "Erro ao deletar item."));
    } else {
      const { error } = await supabaseAdmin
        .from(type)
        .update({ is_published: false })
        .eq("id", id);
      if (error)
        return next(createError(500, "db_error", "Erro ao despublicar item."));
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
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar logs."));

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
      .select(
        "id, user_id, name, email, area_interesse, onboarding_completed, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(parsedLimit)
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (search) query = query.ilike("email", `%${search}%`);

    const { data, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar usuários."));

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

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar assinaturas."));

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
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar stats de IA."));

    const stats: Record<
      string,
      { calls: number; success: number; cost: number }
    > = {};
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

router.get("/ai-usage-summary", async (req, res, next) => {
  try {
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : null;
    const untilRaw = typeof req.query.until === "string" ? req.query.until : null;
    const since =
      sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? sinceRaw : null;
    const until =
      untilRaw && !Number.isNaN(Date.parse(untilRaw)) ? untilRaw : null;
    const { data, error } = await supabaseAdmin.rpc(
      "get_ai_usage_admin_summary",
      {
        p_since: since,
        p_until: until,
      },
    );
    if (error) {
      return next(
        createError(
          500,
          "ai_usage_summary_failed",
          "Falha ao agregar uso de IA.",
        ),
      );
    }
    res.json({ data: data ?? [] });
  } catch (err) {
    next(err);
  }
});

router.get("/queue-stats", async (_req, res) => {
  try {
    if (!emailQueue) {
      res.json({ data: { waiting: 0, active: 0, completed: 0, failed: 0 } });
      return;
    }

    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);
    res.json({ data: { waiting, active, completed, failed } });
  } catch (err) {
    console.error("[queue] Erro ao buscar stats", err);
    res.json({ data: { waiting: 0, active: 0, completed: 0, failed: 0 } });
  }
});

router.get("/affiliates-stats", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .order("revenue_cents", { ascending: false });

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

router.get("/avatar-reports", async (_req, res, next) => {
  try {
    const { data: targets, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, avatar_url, avatar_moderation_updated_at")
      .eq("avatar_moderation_status", "pending_review")
      .order("avatar_moderation_updated_at", {
        ascending: true,
        nullsFirst: true,
      });

    if (error)
      return next(
        createError(500, "db_error", "Erro ao buscar fila de moderação."),
      );

    const rows = targets || [];
    if (rows.length === 0) {
      res.json({ data: [] });
      return;
    }

    const targetIds = rows.map((row) => row.user_id);
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .select("target_user_id, reporter_user_id, reason")
      .in("target_user_id", targetIds)
      .eq("status", "open");

    if (reportsError)
      return next(createError(500, "db_error", "Erro ao buscar denúncias."));

    const agg = new Map<
      string,
      { reporters: Set<string>; reasons: Record<string, number> }
    >();
    for (const report of reports || []) {
      let entry = agg.get(report.target_user_id);
      if (!entry) {
        entry = { reporters: new Set<string>(), reasons: {} };
        agg.set(report.target_user_id, entry);
      }
      entry.reporters.add(report.reporter_user_id);
      entry.reasons[report.reason] = (entry.reasons[report.reason] || 0) + 1;
    }

    const data = rows.map((row) => {
      const entry = agg.get(row.user_id);
      return {
        userId: row.user_id,
        name: row.name || "",
        avatarUrl: row.avatar_url,
        distinctReporters: entry ? entry.reporters.size : 0,
        reasons: entry ? entry.reasons : {},
        pendingSince: row.avatar_moderation_updated_at,
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/avatar-reports/:userId/restore", async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const nowIso = new Date().toISOString();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_moderation_status: "clean",
        avatar_moderation_updated_at: nowIso,
        avatar_moderation_reviewed_by: req.user!.id,
      })
      .eq("user_id", targetUserId);

    if (profileError)
      return next(createError(500, "db_error", "Erro ao restaurar avatar."));

    const { error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .update({ status: "closed" })
      .eq("target_user_id", targetUserId)
      .eq("status", "open");

    if (reportsError)
      return next(createError(500, "db_error", "Erro ao fechar denúncias."));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/avatar-reports/:userId/confirm", async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const nowIso = new Date().toISOString();

    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("avatar_storage_path")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_moderation_status: "removed",
        avatar_upload_disabled: true,
        avatar_url: null,
        avatar_storage_path: null,
        avatar_mode: "icon",
        avatar_moderation_updated_at: nowIso,
        avatar_moderation_reviewed_by: req.user!.id,
      })
      .eq("user_id", targetUserId);

    if (profileError)
      return next(createError(500, "db_error", "Erro ao remover avatar."));

    // Nao deixa a imagem de violacao confirmada no bucket (best-effort).
    await deleteAvatarObject(target?.avatar_storage_path ?? null);

    const { error: reportsError } = await supabaseAdmin
      .from("avatar_reports")
      .update({ status: "closed" })
      .eq("target_user_id", targetUserId)
      .eq("status", "open");

    if (reportsError)
      return next(createError(500, "db_error", "Erro ao fechar denúncias."));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Visao somente leitura dos assinantes da newsletter, por status. Sem mutacao:
// nao entra no CRUD generico de /content/:type. Filtro de status opcional,
// paginacao por limit/offset. Tudo via supabaseAdmin (bypassa RLS).
router.get("/newsletter/subscribers", async (req, res, next) => {
  try {
    const NEWSLETTER_STATUSES = [
      "pending_confirmation",
      "confirmed",
      "unsubscribed",
    ] as const;
    type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

    const statusParam =
      typeof req.query.status === "string" ? req.query.status : undefined;
    if (
      statusParam !== undefined &&
      !NEWSLETTER_STATUSES.includes(statusParam as NewsletterStatus)
    ) {
      return next(createError(400, "invalid_status", "Status inválido."));
    }
    const statusFilter = statusParam as NewsletterStatus | undefined;

    const parsedLimit = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1),
      200,
    );
    const parsedOffset = parseInt(String(req.query.offset ?? "0"), 10);
    const offset = Math.max(
      Number.isFinite(parsedOffset) ? parsedOffset : 0,
      0,
    );

    // Counts por status (head + count exato), um por status. Usa o indice
    // newsletter_subscribers_status_idx.
    const countResults = await Promise.all(
      NEWSLETTER_STATUSES.map((s) =>
        supabaseAdmin
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", s),
      ),
    );
    for (const result of countResults) {
      if (result.error)
        return next(createError(500, "db_error", "Erro ao contar assinantes."));
    }
    const counts = {
      pending_confirmation: countResults[0].count ?? 0,
      confirmed: countResults[1].count ?? 0,
      unsubscribed: countResults[2].count ?? 0,
      total: 0,
    };
    counts.total =
      counts.pending_confirmation + counts.confirmed + counts.unsubscribed;

    // Lista paginada. O count exato DESSA query (mesmo filtro) e o total da
    // paginacao.
    let listQuery = supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, status, created_at, confirmed_at, unsubscribed_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) listQuery = listQuery.eq("status", statusFilter);

    const { data, count, error } = await listQuery;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar assinantes."));

    res.json({
      data: {
        counts,
        subscribers: data || [],
        pagination: { limit, offset, total: count ?? 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Codigos de beta: lista com agregado de usos com sucesso e ultimo acesso. Os
// logs sao agregados no servidor (duas queries) porque o supabase-js nao faz
// group-by sem RPC; volume e pequeno (beta fechado).
router.get("/beta-codes", async (_req, res, next) => {
  try {
    const [codesRes, logsRes] = await Promise.all([
      supabaseAdmin
        .from("beta_access_codes")
        .select("id, code, label, active, created_at, revoked_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("beta_unlock_logs")
        .select("code_id, created_at")
        .eq("success", true),
    ]);

    if (codesRes.error)
      return next(createError(500, "db_error", "Erro ao buscar códigos."));

    // Falha nos logs nao derruba a lista: agregado zera, os codigos aparecem.
    const usage = new Map<string, { count: number; last: string | null }>();
    for (const log of logsRes.data || []) {
      if (!log.code_id) continue;
      const cur = usage.get(log.code_id) || { count: 0, last: null };
      cur.count += 1;
      if (!cur.last || log.created_at > cur.last) cur.last = log.created_at;
      usage.set(log.code_id, cur);
    }

    const data = (codesRes.data || []).map((c) => {
      const u = usage.get(c.id);
      return {
        ...c,
        success_count: u?.count ?? 0,
        last_access: u?.last ?? null,
      };
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// Ultimos logs de tentativa de unlock. Teto de 500 por request.
router.get("/beta-logs", async (req, res, next) => {
  try {
    const { limit = "100" } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 500);

    const { data, error } = await supabaseAdmin
      .from("beta_unlock_logs")
      .select(
        "id, code_id, label, success, attempted_code, ip, user_agent, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(parsedLimit);

    if (error) return next(createError(500, "db_error", "Erro ao buscar logs."));

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// Revoga um codigo: active false e revoked_at now(). Tentativas futuras com ele
// voltam a 401. Nao apaga o historico de uso.
router.post("/beta-codes/:id/revoke", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("beta_access_codes")
      .update({ active: false, revoked_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, code, label, active, created_at, revoked_at")
      .maybeSingle();

    if (error)
      return next(createError(500, "db_error", "Erro ao revogar código."));
    if (!data)
      return next(createError(404, "not_found", "Código não encontrado."));

    await logAudit({
      actorUserId: req.user!.id,
      action: "update",
      resourceType: "beta_code",
      resourceId: data.id,
      after: data,
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
