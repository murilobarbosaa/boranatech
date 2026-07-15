import { Router } from "express";

import { logAudit } from "../lib/audit";
import { deleteAvatarObject } from "../lib/avatarUpload";
import {
  getChurnSnapshot,
  getMrrSnapshot,
  getSubscriberList,
} from "../lib/billingMetrics";
import { env } from "../lib/env";
import {
  getDeferredRevenue,
  getFinanceSummary,
  getFinanceTimeseries,
} from "../lib/financeMetrics";
import { fetchUsdBrlRate } from "../lib/fx/ptax";
import { getPosthogStats, getPosthogUserActivity } from "../lib/posthog";
import { emailQueue } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { resolvePlanPriceCents } from "../lib/planPrice";
import contactListsRouter from "./adminContactLists";
import emailCampaignsRouter from "./adminEmailCampaigns";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// Campanhas de e-mail pra waitlist (aba Emails). Depois dos guards de admin.
router.use("/email-campaigns", emailCampaignsRouter);
router.use("/contact-lists", contactListsRouter);

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

type AuthUserLite = {
  email: string | null;
  lastSignInAt: string | null;
  createdAt: string | null;
  name: string | null;
};

// Resolve dados de Auth (email, last_sign_in_at, created_at, nome do metadata)
// de varios usuarios em UMA varredura paginada de listUsers, no lugar do
// anti-padrao de um getUserById por linha. last_sign_in_at so existe em
// auth.users (nao em profiles), por isso a varredura do Auth e necessaria aqui.
// Para o alvo de hoje (poucos assinantes ativos) a varredura e barata; se a base
// crescer muito, avaliar um RPC dedicado. Erro propaga, nunca vira mapa vazio.
async function fetchAuthUsersByIds(
  ids: string[],
): Promise<Map<string, AuthUserLite>> {
  const result = new Map<string, AuthUserLite>();
  if (ids.length === 0) return result;

  const wanted = new Set(ids);
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const users = data.users;
    for (const user of users) {
      if (!wanted.has(user.id)) continue;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName = typeof meta.name === "string" ? meta.name : null;
      result.set(user.id, {
        email: user.email ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        createdAt: user.created_at ?? null,
        name: metaName,
      });
    }

    if (users.length < perPage || result.size === wanted.size) break;
    page += 1;
  }
  return result;
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

// Estado do PostHog como union discriminado (not_configured | error | ok). A
// logica vive em lib/posthog.ts; erro nunca vira zero. O client sera migrado
// para ler o novo shape na proxima sessao.
router.get("/posthog-stats", async (req, res, next) => {
  try {
    // Periodo opcional (from/to ISO). Datas invalidas caem no default (30 dias)
    // do proprio getPosthogStats; nunca mascaram falha (erro real vira state error).
    const fromRaw = typeof req.query.from === "string" ? req.query.from : "";
    const toRaw = typeof req.query.to === "string" ? req.query.to : "";
    const fromDate = fromRaw ? new Date(fromRaw) : undefined;
    const toDate = toRaw ? new Date(toRaw) : undefined;
    const from =
      fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined;
    const to = toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined;
    const result = await getPosthogStats({ from, to });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Saude das integracoes, sem vazar segredos (so presenca/booleanos e o union do
// PostHog). Responde de vez as perguntas de ambiente em aberto do relatorio.
router.get("/integrations/health", async (_req, res, next) => {
  try {
    const posthog = await getPosthogStats();

    let redis: { configured: boolean; ok: boolean } = {
      configured: Boolean(env.redisUrl),
      ok: false,
    };
    if (cacheConnection) {
      try {
        const pong = await cacheConnection.ping();
        redis = { configured: true, ok: pong === "PONG" };
      } catch {
        redis = { configured: true, ok: false };
      }
    }

    res.json({
      data: {
        billingEnabled: env.billingEnabled,
        posthog,
        stripe: {
          secretKey: Boolean(env.stripeSecretKey),
          webhookSecret: Boolean(env.stripeWebhookSecret),
          priceIds: {
            pro_monthly: Boolean(env.stripePriceIds.pro_monthly),
            pro_semiannual: Boolean(env.stripePriceIds.pro_semiannual),
            pro_annual: Boolean(env.stripePriceIds.pro_annual),
          },
        },
        redis,
        resend: { apiKey: Boolean(env.resendApiKey) },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/churn-risk", async (_req, res, next) => {
  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, plans(code, name, price_cents)")
      .eq("status", "active");

    // Propaga o erro (nao mascara com lista vazia): o client sera ajustado para
    // exibir estado de erro na proxima sessao.
    if (error)
      return next(
        // TODO(Ana)
        createError(500, "db_error", "Erro ao buscar assinaturas."),
      );

    const activeSubscriptions = (subscriptions || []).filter(
      (subscription) => subscription.user_id,
    );
    const userIds = activeSubscriptions.map(
      (subscription) => subscription.user_id as string,
    );

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds)
      : { data: [], error: null };
    if (profilesError)
      return next(
        // TODO(Ana)
        createError(500, "db_error", "Erro ao buscar perfis."),
      );
    const profilesByUserId = new Map(
      (profiles || []).map((profile) => [profile.user_id, profile]),
    );

    // Um unico batch de Auth para todos os assinantes ativos, no lugar do loop
    // Promise.all de getUserById (uma ida ao Auth por linha).
    const authByUserId = await fetchAuthUsersByIds(userIds);

    const inactiveThresholdMs = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const users = activeSubscriptions.map((subscription) => {
      const userId = subscription.user_id as string;
      const authUser = authByUserId.get(userId);
      if (!authUser) return null;

      const lastSeenAt = authUser.lastSignInAt || authUser.createdAt;
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
      const plan = Array.isArray(subscription.plans)
        ? subscription.plans[0]
        : subscription.plans;
      // Preco do planPricing.ts (fonte unica); fallback defensivo para o banco (o
      // helper grita no Sentry se o code for real e faltar no modulo).
      const priceCents = resolvePlanPriceCents(
        plan?.code,
        Number(plan?.price_cents || 0),
        "churn-risk",
      );

      return {
        name: String(
          profile?.name || authUser.name || authUser.email || "Usuário",
        ),
        email: String(profile?.email || authUser.email || ""),
        days_inactive: daysInactive,
        mrr: priceCents / 100,
      };
    });

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
    next(err);
  }
});

// Agrega os motivos de cancelamento (subscription_cancellations) para a aba
// Retencao. SO leitura. Considera status IN ('scheduled','completed'): 'reverted'
// e desistencia (a pessoa deu o motivo mas FICOU), entao nao conta como
// cancelamento, senao inflaria a distribuicao com quem nao cancelou. Percentual e
// sobre o total considerado; linhas sem reason_code entram no total mas nao em
// nenhum bucket (a diferenca ate 100% e "nao informado").
const CANCELLATION_REASON_CODES = [
  "expensive",
  "unused",
  "missing_feature",
  "paused",
  "other",
] as const;

router.get("/cancellation-reasons", async (_req, res, next) => {
  try {
    // Tally paginado do reason_code entre os cancelamentos considerados.
    const counts: Record<string, number> = {};
    let total = 0;
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .from("subscription_cancellations")
        .select("reason_code")
        .in("status", ["scheduled", "completed"])
        .range(from, from + PAGE - 1);
      if (error)
        return next(
          createError(500, "db_error", "Erro ao buscar cancelamentos."),
        );
      const rows = (data ?? []) as Array<{ reason_code: string | null }>;
      for (const row of rows) {
        total += 1;
        if (row.reason_code) {
          counts[row.reason_code] = (counts[row.reason_code] ?? 0) + 1;
        }
      }
      if (rows.length < PAGE) break;
    }

    const byReason = CANCELLATION_REASON_CODES.map((code) => {
      const count = counts[code] ?? 0;
      return {
        code,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    // Comentarios livres (o insight real): ultimos 50 com reason_text preenchido,
    // mais recentes primeiro.
    const { data: commentRows, error: commentsError } = await supabaseAdmin
      .from("subscription_cancellations")
      .select("reason_code, reason_text, canceled_at")
      .in("status", ["scheduled", "completed"])
      .not("reason_text", "is", null)
      .neq("reason_text", "")
      .order("canceled_at", { ascending: false })
      .limit(50);
    if (commentsError)
      return next(
        createError(500, "db_error", "Erro ao buscar comentários."),
      );

    const comments = (
      (commentRows ?? []) as Array<{
        reason_code: string | null;
        reason_text: string | null;
        canceled_at: string | null;
      }>
    ).map((row) => ({
      reasonCode: row.reason_code,
      reasonText: row.reason_text,
      canceledAt: row.canceled_at,
    }));

    res.json({ data: { total, byReason, comments } });
  } catch (err) {
    next(err);
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

// Aceita apenas UUID: as chaves de auth.users / profiles.user_id sao UUID.
// Barra qualquer coisa fora desse formato antes de tocar o banco ou o PostHog.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// CPF e guardado so com digitos. maskCpf revela APENAS os 2 ultimos digitos
// (default seguro do modal); null quando nao ha CPF. formatCpf so e usado no
// endpoint de revelacao (auditado) para exibir o numero completo formatado.
function maskCpf(raw: string | null | undefined): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return null;
  const last2 = digits.slice(-2).padStart(2, "*");
  return `***.***.***-${last2}`;
}

function formatCpf(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

router.get("/users", async (req, res, next) => {
  try {
    const { limit = "50", offset = "0", search } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 100);
    const parsedOffset = parseInt(String(offset), 10) || 0;

    // Lista ENXUTA: so o necessario para a linha (nome, email, status). CPF e os
    // demais campos de profiles NAO trafegam aqui; vem sob demanda em /users/:id.
    let query = supabaseAdmin
      .from("profiles")
      .select("id, user_id, name, email, onboarding_completed")
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

// Detalhe de um usuario para o modal do admin. Chave = user_id (UUID). Retorna
// os campos de profiles uteis no perfil; o CPF vem MASCARADO (cpf_masked) e o
// numero completo so pelo endpoint de revelacao (auditado) abaixo. Campos
// operacionais de moderacao de avatar e o blob de preferences ficam de fora.
router.get("/users/:id", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, name, full_name, email, handle, gender, headline, bio, city, uf, area_interesse, nivel_atual, objetivo, career_goal, github_url, linkedin_url, website_url, onboarding_completed, onboarding_step, marketing_opt_in, marketing_opt_in_at, welcome_email_sent, cpf, created_at, updated_at",
      )
      .eq("user_id", uid)
      .maybeSingle();

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar usuário."));
    if (!data)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    const { cpf, ...rest } = data;
    res.json({
      data: {
        ...rest,
        cpf_masked: maskCpf(cpf),
        has_cpf: Boolean((cpf || "").replace(/\D/g, "")),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Revelacao do CPF completo. So existe UM caminho e ele SEMPRE audita antes de
// devolver o numero: escreve o log em content_audit_logs e, se essa escrita
// falhar, responde erro SEM o CPF (fail-closed). Nao ha caminho que revele sem
// registrar quem revelou, de quem e quando.
router.post("/users/:id/reveal-cpf", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("cpf")
      .eq("user_id", uid)
      .maybeSingle();

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar usuário."));
    if (!data)
      return next(createError(404, "not_found", "Usuário não encontrado."));

    const digits = (data.cpf || "").replace(/\D/g, "");
    if (!digits) {
      return next(
        createError(404, "cpf_not_found", "Usuário sem CPF cadastrado."),
      );
    }

    // Auditoria PRIMEIRO. Fail-closed: sem log gravado, nao ha revelacao.
    const { error: auditError } = await supabaseAdmin
      .from("content_audit_logs")
      .insert({
        actor_user_id: req.user!.id,
        action: "reveal",
        resource_type: "profile_cpf",
        resource_id: uid,
        resource_slug: null,
        before_json: null,
        after_json: null,
      });

    if (auditError) {
      return next(
        createError(
          500,
          "audit_failed",
          "Não foi possível registrar a auditoria da revelação.",
        ),
      );
    }

    res.json({ data: { cpf: formatCpf(data.cpf) } });
  } catch (err) {
    next(err);
  }
});

// Atividade real do usuario no PostHog (funcionalidades usadas + historico de
// navegacao). Repassa a maquina de estados do getPosthogUserActivity; nunca
// colapsa falha em lista vazia.
router.get("/users/:id/activity", async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (!UUID_RE.test(uid)) {
      return next(
        createError(400, "invalid_user_id", "Identificador de usuário inválido."),
      );
    }
    const result = await getPosthogUserActivity(uid);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// DEPRECATED: use GET /subscribers (paginado). Mantido enquanto o client ainda o consome no lookup por usuario; sera removido apos a migracao do client.
router.get("/subscriptions", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plans(name, code, price_cents)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error)
      return next(createError(500, "db_error", "Erro ao buscar assinaturas."));

    // Mantem a forma da resposta, mas o preco exibido vem do planPricing.ts (fonte
    // unica), nao de plans.price_cents. Fallback defensivo para o banco (helper
    // grita no Sentry se o code for real e faltar no modulo).
    const rows = (data || []).map((row) => {
      const plans = (
        row as {
          plans?: { code?: string | null; price_cents?: number | null } | null;
        }
      ).plans;
      if (!plans) return row;
      const cents = resolvePlanPriceCents(
        plans.code,
        plans.price_cents ?? 0,
        "/subscriptions",
      );
      return { ...row, plans: { ...plans, price_cents: cents } };
    });

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// Lista paginada de assinantes (subscriptions join plans + email do usuario).
// Substitui o /subscriptions legado (cap fixo de 100, sem paginacao).
router.get("/subscribers", async (req, res, next) => {
  try {
    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const pageSizeRaw = parseInt(String(req.query.pageSize ?? "25"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      Math.max(Number.isFinite(pageSizeRaw) ? pageSizeRaw : 25, 1),
      100,
    );
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const provider =
      typeof req.query.provider === "string" ? req.query.provider : undefined;
    const planCode =
      typeof req.query.planCode === "string" ? req.query.planCode : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await getSubscriberList({
      page,
      pageSize,
      status,
      provider,
      planCode,
      search,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Metricas financeiras reais (MRR + churn), substituindo os mocks do admin.
// Erros propagam (o modulo nunca colapsa em 0); ausencia vem como estado nomeado.
router.get("/billing-metrics", async (_req, res, next) => {
  try {
    const [mrr, churn] = await Promise.all([
      getMrrSnapshot(),
      getChurnSnapshot({}),
    ]);
    res.json({ data: { mrr, churn } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Financeiro (regime de caixa; fonte de verdade: Stripe balance transactions)
// ---------------------------------------------------------------------------

const EXPENSE_CATEGORIES = new Set([
  "infra",
  "ia",
  "email",
  "marketing",
  "juridico",
  "contabil",
  "ferramentas",
  "dominio",
  "outros",
]);
const EXPENSE_KINDS = new Set(["recurring", "one_off"]);
const EXPENSE_INTERVALS = new Set(["monthly", "yearly"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: unknown, fallback: Date): Date {
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function parsePageParams(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
} {
  const pageRaw = parseInt(String(query.page ?? "1"), 10);
  const sizeRaw = parseInt(String(query.pageSize ?? "25"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(sizeRaw) ? sizeRaw : 25, 1),
    100,
  );
  return { page, pageSize };
}

// Converte para BRL travando o cambio no lancamento. BRL: 1:1. USD: PTAX. Moeda
// nao suportada ou PTAX indisponivel: ERRO (nunca grava cambio chutado nem 1:1).
async function resolveBrlAmount(
  amountCents: number,
  currency: string,
): Promise<{ amountBrlCents: number; fxRate: number | null; fxDate: string | null }> {
  const cur = currency.toUpperCase();
  if (cur === "BRL") {
    return { amountBrlCents: amountCents, fxRate: null, fxDate: null };
  }
  if (cur === "USD") {
    const rate = await fetchUsdBrlRate();
    if (!rate) {
      throw createError(
        502,
        "fx_unavailable",
        // TODO(Ana)
        "Cotação do dólar (PTAX) indisponível agora. Tente novamente em instantes.",
      );
    }
    return {
      amountBrlCents: Math.round(amountCents * rate.usdBrl),
      fxRate: rate.usdBrl,
      fxDate: rate.quoteDate,
    };
  }
  throw createError(
    400,
    "unsupported_currency",
    // TODO(Ana)
    "Moeda não suportada. Use BRL ou USD.",
  );
}

type ExpenseInput = {
  description: string;
  category: string;
  vendor: string | null;
  kind: string;
  amount_cents: number;
  currency: string;
  incurred_on: string;
  recurrence_start: string | null;
  recurrence_end: string | null;
  recurrence_interval: string | null;
  notes: string | null;
};

// Valida e normaliza o corpo de uma despesa; lanca createError em invalido.
function parseExpenseBody(body: Record<string, unknown>): ExpenseInput {
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    // TODO(Ana)
    throw createError(400, "invalid_description", "Descrição obrigatória.");
  }

  const category = typeof body.category === "string" ? body.category : "";
  if (!EXPENSE_CATEGORIES.has(category)) {
    // TODO(Ana)
    throw createError(400, "invalid_category", "Categoria inválida.");
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!EXPENSE_KINDS.has(kind)) {
    // TODO(Ana)
    throw createError(400, "invalid_kind", "Tipo inválido (recurring ou one_off).");
  }

  const amountCents = Number(body.amount_cents);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    // TODO(Ana)
    throw createError(
      400,
      "invalid_amount",
      "Valor inválido (centavos inteiros maiores que zero).",
    );
  }

  const currency =
    typeof body.currency === "string" && body.currency ? body.currency : "BRL";

  const incurredOn =
    typeof body.incurred_on === "string" ? body.incurred_on : "";
  if (!ISO_DATE_RE.test(incurredOn)) {
    // TODO(Ana)
    throw createError(
      400,
      "invalid_incurred_on",
      "Data de competência inválida (AAAA-MM-DD).",
    );
  }

  const vendor =
    typeof body.vendor === "string" && body.vendor.trim()
      ? body.vendor.trim()
      : null;
  const notes =
    typeof body.notes === "string" && body.notes.trim()
      ? body.notes.trim()
      : null;

  let recurrenceStart: string | null = null;
  let recurrenceEnd: string | null = null;
  let recurrenceInterval: string | null = null;
  if (kind === "recurring") {
    recurrenceInterval =
      typeof body.recurrence_interval === "string"
        ? body.recurrence_interval
        : "";
    if (!EXPENSE_INTERVALS.has(recurrenceInterval)) {
      // TODO(Ana)
      throw createError(
        400,
        "invalid_interval",
        "Recorrência inválida (monthly ou yearly).",
      );
    }
    recurrenceStart =
      typeof body.recurrence_start === "string" &&
      ISO_DATE_RE.test(body.recurrence_start)
        ? body.recurrence_start
        : incurredOn;
    recurrenceEnd =
      typeof body.recurrence_end === "string" &&
      ISO_DATE_RE.test(body.recurrence_end)
        ? body.recurrence_end
        : null;
  }

  return {
    description,
    category,
    vendor,
    kind,
    amount_cents: amountCents,
    currency,
    incurred_on: incurredOn,
    recurrence_start: recurrenceStart,
    recurrence_end: recurrenceEnd,
    recurrence_interval: recurrenceInterval,
    notes,
  };
}

function expenseRowFromInput(
  input: ExpenseInput,
  fx: { amountBrlCents: number; fxRate: number | null; fxDate: string | null },
) {
  return {
    description: input.description,
    category: input.category,
    vendor: input.vendor,
    kind: input.kind,
    amount_cents: input.amount_cents,
    currency: input.currency.toUpperCase(),
    amount_brl_cents: fx.amountBrlCents,
    fx_rate: fx.fxRate,
    fx_date: fx.fxDate,
    incurred_on: input.incurred_on,
    recurrence_start: input.recurrence_start,
    recurrence_end: input.recurrence_end,
    recurrence_interval: input.recurrence_interval,
    notes: input.notes,
  };
}

router.get("/finance/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const defFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const from = parseDateParam(req.query.from, defFrom);
    const to = parseDateParam(req.query.to, now);
    const [summary, deferred] = await Promise.all([
      getFinanceSummary({ from, to }),
      getDeferredRevenue(),
    ]);
    res.json({ data: { ...summary, deferred } });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/timeseries", async (req, res, next) => {
  try {
    const now = new Date();
    const defFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const from = parseDateParam(req.query.from, defFrom);
    const to = parseDateParam(req.query.to, now);
    const series = await getFinanceTimeseries({ from, to, granularity: "month" });
    res.json({ data: series });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/transactions", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePageParams(
      req.query as Record<string, unknown>,
    );
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let query = supabaseAdmin
      .from("finance_transactions")
      .select(
        "id, stripe_charge_id, stripe_invoice_id, type, gross_cents, fee_cents, net_cents, currency, occurred_at, user_id, plan_code",
        { count: "exact" },
      )
      .order("occurred_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    const typeFilter =
      typeof req.query.type === "string" ? req.query.type : "";
    if (typeFilter) query = query.eq("type", typeFilter);

    const { data, count, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar transações."));

    res.json({
      data: { rows: data ?? [], total: count ?? 0, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/finance/expenses", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePageParams(
      req.query as Record<string, unknown>,
    );
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let query = supabaseAdmin
      .from("expenses")
      .select("*", { count: "exact" })
      .order("incurred_on", { ascending: false })
      .range(rangeFrom, rangeTo);

    const category =
      typeof req.query.category === "string" ? req.query.category : "";
    const kind = typeof req.query.kind === "string" ? req.query.kind : "";
    if (category) query = query.eq("category", category);
    if (kind) query = query.eq("kind", kind);

    const { data, count, error } = await query;
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar despesas."));

    res.json({
      data: { rows: data ?? [], total: count ?? 0, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/finance/expenses", async (req, res, next) => {
  try {
    const input = parseExpenseBody((req.body ?? {}) as Record<string, unknown>);
    const fx = await resolveBrlAmount(input.amount_cents, input.currency);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert({ ...expenseRowFromInput(input, fx), created_by: req.user!.id })
      .select()
      .single();
    if (error)
      return next(createError(500, "db_error", "Erro ao criar despesa."));
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch("/finance/expenses/:id", async (req, res, next) => {
  try {
    const input = parseExpenseBody((req.body ?? {}) as Record<string, unknown>);
    const fx = await resolveBrlAmount(input.amount_cents, input.currency);
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update(expenseRowFromInput(input, fx))
      .eq("id", req.params.id)
      .select()
      .maybeSingle();
    if (error)
      return next(createError(500, "db_error", "Erro ao atualizar despesa."));
    if (!data)
      return next(createError(404, "not_found", "Despesa não encontrada."));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete("/finance/expenses/:id", async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("id", req.params.id);
    if (error)
      return next(createError(500, "db_error", "Erro ao remover despesa."));
    res.json({ data: { deleted: true, id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

// Sincroniza balance transactions da Stripe sob demanda (botao "sincronizar agora").
router.post("/finance/sync", async (_req, res, next) => {
  try {
    const result = await syncBalanceTransactions({});
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// Cotacao PTAX que SERA usada ao salvar uma despesa em moeda estrangeira (preview
// antes de gravar). BRL: 1:1. USD: PTAX. Outra moeda ou PTAX indisponivel: erro.
router.get("/finance/fx-preview", async (req, res, next) => {
  try {
    const currency =
      typeof req.query.currency === "string"
        ? req.query.currency.toUpperCase()
        : "BRL";
    if (currency === "BRL") {
      res.json({ data: { rate: 1, quoteDate: null } });
      return;
    }
    if (currency !== "USD") {
      // TODO(Ana)
      return next(
        createError(400, "unsupported_currency", "Moeda não suportada. Use BRL ou USD."),
      );
    }
    const rate = await fetchUsdBrlRate();
    if (!rate) {
      // TODO(Ana)
      return next(
        createError(
          502,
          "fx_unavailable",
          "Cotação do dólar (PTAX) indisponível agora. Tente novamente em instantes.",
        ),
      );
    }
    res.json({ data: { rate: rate.usdBrl, quoteDate: rate.quoteDate } });
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

router.get("/queue-stats", async (_req, res, next) => {
  try {
    if (!emailQueue) {
      // Fila indisponivel (sem Redis) e um estado NOMEADO, nao zeros mascarados.
      return next(
        // TODO(Ana)
        createError(503, "queue_unavailable", "Fila de e-mail indisponível."),
      );
    }

    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);
    res.json({ data: { waiting, active, completed, failed } });
  } catch (err) {
    next(err);
  }
});

router.get("/affiliates-stats", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .order("revenue_cents", { ascending: false });

    // Propaga o erro em vez de mascarar com lista vazia.
    if (error)
      return next(
        // TODO(Ana)
        createError(500, "db_error", "Erro ao buscar afiliados."),
      );

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
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
