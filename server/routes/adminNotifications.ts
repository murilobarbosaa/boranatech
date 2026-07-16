import { Router } from "express";
import { z } from "zod";

import { cacheKey, getOrCompute } from "../lib/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  USER_SEGMENTS,
  fetchProStatusSets,
  userMatchesSegment,
  type UserSegment,
} from "../lib/userSegments";
import { createError } from "../middleware/error";

// Montado DENTRO de server/routes/admin.ts, DEPOIS de requireAuth/requireAdmin
// (fail-closed: qualquer coisa que nao seja admin confirmado ja levou 401/403
// antes de chegar aqui). Nao montar este router em outro lugar sem os guards.
//
// Ciclo de vida: draft (tudo editavel) -> published (conteudo IMUTAVEL, so
// expires_at e status mudam, pro historico do usuario ser honesto) ->
// archived (some do feed, permanece aqui). Sem delete fisico.

const router = Router();

const ADMIN_COLUMNS =
  "id, title, body, type, category, audience, coupon_code, discount_percent, cta_url, cta_label, expires_at, status, published_at, created_by, created_at, updated_at";

const NOTIFICATION_TYPES = [
  "announcement",
  "coupon",
  "optin",
  "system",
] as const;
const NOTIFICATION_STATUSES = ["draft", "published", "archived"] as const;

const DB_PAGE = 1000;

const expiresAtSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data de expiração inválida.");

function isFuture(iso: string): boolean {
  return Date.parse(iso) > Date.now();
}

// Cupom exige codigo (mesmo check do banco, validado antes pra dar mensagem
// clara em vez de erro de constraint).
const CreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
    type: z.enum(NOTIFICATION_TYPES).default("announcement"),
    category: z.enum(["product", "promotional"]).default("product"),
    audience: z.enum(USER_SEGMENTS).default("all"),
    coupon_code: z.string().trim().min(1).max(64).nullable().optional(),
    discount_percent: z.number().int().min(1).max(100).nullable().optional(),
    cta_url: z.string().trim().url().max(2048).nullable().optional(),
    cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    expires_at: expiresAtSchema.nullable().optional(),
  })
  .refine((data) => data.type !== "coupon" || Boolean(data.coupon_code), {
    message: "coupon_code é obrigatório quando type é coupon.",
  })
  .refine((data) => !data.expires_at || isFuture(data.expires_at), {
    message: "expires_at deve ser uma data futura.",
  });

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(2000).optional(),
    type: z.enum(NOTIFICATION_TYPES).optional(),
    category: z.enum(["product", "promotional"]).optional(),
    audience: z.enum(USER_SEGMENTS).optional(),
    coupon_code: z.string().trim().min(1).max(64).nullable().optional(),
    discount_percent: z.number().int().min(1).max(100).nullable().optional(),
    cta_url: z.string().trim().url().max(2048).nullable().optional(),
    cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    expires_at: expiresAtSchema.nullable().optional(),
    status: z.enum(["published", "archived"]).optional(),
  })
  .refine((data) => !data.expires_at || isFuture(data.expires_at), {
    message: "expires_at deve ser uma data futura.",
  });

const ListQuerySchema = z.object({
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

type NotificationRow = {
  id: string;
  type: string;
  status: string;
  coupon_code: string | null;
  expires_at: string | null;
  [key: string]: unknown;
};

async function findNotification(
  id: string,
): Promise<NotificationRow | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as NotificationRow) ?? null;
}

// GET /api/admin/notifications?status=&type=&limit=&offset=
// Lista com total e contagem de leituras por notificacao (agregado embutido
// do PostgREST; nao carrega as linhas de leitura).
router.get("/", async (req, res, next) => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
      ),
    );
  }
  const { status, type, limit, offset } = parsed.data;

  try {
    let query = supabaseAdmin
      .from("notifications")
      .select(`${ADMIN_COLUMNS}, notification_reads(count)`, {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const items = ((data ?? []) as unknown as Array<
      NotificationRow & { notification_reads: Array<{ count: number }> }
    >).map(({ notification_reads, ...row }) => ({
      ...row,
      read_count: notification_reads?.[0]?.count ?? 0,
    }));

    res.json({ data: items, total: count ?? items.length });
  } catch (err) {
    console.error("[admin/notifications] list failed", err);
    return next(
      createError(500, "db_error", "Erro ao listar notificações."),
    );
  }
});

// POST /api/admin/notifications: cria sempre em draft; publicar e um passo
// explicito (POST /:id/publish).
router.post("/", async (req, res, next) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Payload inválido.",
      ),
    );
  }
  const data = parsed.data;

  try {
    const { data: created, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        title: data.title,
        body: data.body,
        type: data.type,
        category: data.category,
        audience: data.audience,
        coupon_code: data.coupon_code ?? null,
        discount_percent: data.discount_percent ?? null,
        cta_url: data.cta_url ?? null,
        cta_label: data.cta_label ?? null,
        expires_at: data.expires_at ?? null,
        status: "draft",
        created_by: req.user!.id,
      })
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.status(201).json({ data: created });
  } catch (err) {
    console.error("[admin/notifications] create failed", err);
    return next(createError(500, "db_error", "Erro ao criar notificação."));
  }
});

// Campos de conteudo, imutaveis apos a publicacao.
const CONTENT_FIELDS = [
  "title",
  "body",
  "type",
  "category",
  "audience",
  "coupon_code",
  "discount_percent",
  "cta_url",
  "cta_label",
] as const;

// PATCH /api/admin/notifications/:id
// draft: edita conteudo e expires_at (status so via /publish). published e
// archived: SOMENTE expires_at (encurtar/estender, sempre pra data futura) e
// status (published <-> archived); conteudo imutavel mantem o historico
// honesto com o que o usuario leu.
router.patch("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Notificação não encontrada."));
  }
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Payload inválido.",
      ),
    );
  }
  const patch = parsed.data;

  try {
    const existing = await findNotification(id.data);
    if (!existing) {
      return next(
        createError(404, "not_found", "Notificação não encontrada."),
      );
    }

    const update: Record<string, unknown> = {};

    if (existing.status === "draft") {
      if (patch.status !== undefined) {
        return next(
          createError(
            400,
            "use_publish_endpoint",
            "Use POST /:id/publish para publicar um rascunho.",
          ),
        );
      }
      for (const field of CONTENT_FIELDS) {
        if (patch[field] !== undefined) {
          update[field] = patch[field];
        }
      }
      if (patch.expires_at !== undefined) {
        update.expires_at = patch.expires_at;
      }
      const effectiveType = (update.type ?? existing.type) as string;
      const effectiveCoupon =
        update.coupon_code !== undefined
          ? update.coupon_code
          : existing.coupon_code;
      if (effectiveType === "coupon" && !effectiveCoupon) {
        return next(
          createError(
            400,
            "invalid_request",
            "coupon_code é obrigatório quando type é coupon.",
          ),
        );
      }
    } else {
      const touchedContent = CONTENT_FIELDS.some(
        (field) => patch[field] !== undefined,
      );
      if (touchedContent) {
        return next(
          createError(
            409,
            "published_immutable",
            "Conteúdo de notificação publicada é imutável; edite apenas expires_at e status.",
          ),
        );
      }
      if (patch.expires_at !== undefined) {
        update.expires_at = patch.expires_at;
      }
      if (patch.status !== undefined) {
        update.status = patch.status;
      }
    }

    if (Object.keys(update).length === 0) {
      return res.json({ data: existing });
    }
    update.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from("notifications")
      .update(update)
      .eq("id", id.data)
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("[admin/notifications] patch failed", err);
    return next(createError(500, "db_error", "Erro ao editar notificação."));
  }
});

const AudiencePreviewQuerySchema = z.object({
  audience: z.enum(USER_SEGMENTS),
  category: z.enum(["product", "promotional"]).default("product"),
});

// Ids com marketing_opt_in = true (regra da category promotional), paginado.
async function fetchOptedInUserIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("marketing_opt_in", true)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const rows = data ?? [];
    ids.push(...rows.map((row) => row.id as string));
    if (rows.length < DB_PAGE) break;
  }
  return ids;
}

// Estimativa de alcance com a MESMA semantica do feed (userSegments): quantos
// usuarios da base casam com audience + category. E preview, nao contrato: a
// visibilidade real e decidida por usuario na leitura, entao contas que virem
// Pro (ou derem opt-in) depois entram no alcance sem refletir aqui.
async function computeAudiencePreview(
  audience: UserSegment,
  category: "product" | "promotional",
): Promise<{ total_users: number; matched: number }> {
  const [profilesResult, sets] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    fetchProStatusSets(),
  ]);
  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }
  const totalUsers = profilesResult.count ?? 0;

  if (category === "promotional") {
    const optedIn = await fetchOptedInUserIds();
    const matched = optedIn.filter((id) =>
      userMatchesSegment(id, audience, sets),
    ).length;
    return { total_users: totalUsers, matched };
  }

  let matched: number;
  if (audience === "all") {
    matched = totalUsers;
  } else if (audience === "active_pro") {
    matched = sets.active.size;
  } else if (audience === "never_pro") {
    // never_pro exige !everPaid E !active: influencer ativo que nunca pagou
    // esta em active (Pro vitalicio) e sai da conta.
    const everPaidOrActive = new Set(sets.everPaid);
    sets.active.forEach((id) => everPaidOrActive.add(id));
    matched = Math.max(0, totalUsers - everPaidOrActive.size);
  } else {
    matched = Array.from(sets.everPaid).filter(
      (id) => !sets.active.has(id) && !sets.pastDue.has(id),
    ).length;
  }
  return { total_users: totalUsers, matched };
}

// GET /api/admin/notifications/audience-preview?audience=&category=
// Varre subscriptions/profiles na base toda, entao o resultado fica em cache
// (Redis, fail-open pra compute direto sem Redis) por 10 min por combinacao.
router.get("/audience-preview", async (req, res, next) => {
  const parsed = AudiencePreviewQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
      ),
    );
  }
  const { audience, category } = parsed.data;

  try {
    const data = await getOrCompute(
      cacheKey("admin-notifications-audience-preview", { audience, category }),
      600,
      () => computeAudiencePreview(audience, category),
    );
    res.json({ data });
  } catch (err) {
    console.error("[admin/notifications] audience-preview failed", err);
    return next(
      createError(500, "db_error", "Erro ao estimar o alcance da audiência."),
    );
  }
});

// POST /api/admin/notifications/:id/publish: draft -> published. Revalida a
// expiracao na hora da publicacao (o draft pode ter envelhecido).
router.post("/:id/publish", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Notificação não encontrada."));
  }

  try {
    const existing = await findNotification(id.data);
    if (!existing) {
      return next(
        createError(404, "not_found", "Notificação não encontrada."),
      );
    }
    if (existing.status !== "draft") {
      return next(
        createError(
          409,
          "invalid_status",
          "Só rascunhos podem ser publicados.",
        ),
      );
    }
    if (existing.expires_at && !isFuture(existing.expires_at)) {
      return next(
        createError(
          400,
          "invalid_request",
          "expires_at deve ser uma data futura para publicar.",
        ),
      );
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "published", published_at: nowIso, updated_at: nowIso })
      .eq("id", id.data)
      .eq("status", "draft")
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("[admin/notifications] publish failed", err);
    return next(
      createError(500, "db_error", "Erro ao publicar notificação."),
    );
  }
});

// POST /api/admin/notifications/:id/archive: published -> archived. Some do
// feed dos usuarios, permanece no admin. Sem delete fisico.
router.post("/:id/archive", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Notificação não encontrada."));
  }

  try {
    const existing = await findNotification(id.data);
    if (!existing) {
      return next(
        createError(404, "not_found", "Notificação não encontrada."),
      );
    }
    if (existing.status !== "published") {
      return next(
        createError(
          409,
          "invalid_status",
          "Só notificações publicadas podem ser arquivadas.",
        ),
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("notifications")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id.data)
      .eq("status", "published")
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("[admin/notifications] archive failed", err);
    return next(
      createError(500, "db_error", "Erro ao arquivar notificação."),
    );
  }
});

// GET /api/admin/notifications/:id/stats: total de leituras + leituras por
// dia (UTC). Agregacao em memoria paginando read_at; volume por notificacao
// e limitado pela base de usuarios, sem explosao combinatoria.
router.get("/:id/stats", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Notificação não encontrada."));
  }

  try {
    const existing = await findNotification(id.data);
    if (!existing) {
      return next(
        createError(404, "not_found", "Notificação não encontrada."),
      );
    }

    const byDay = new Map<string, number>();
    let total = 0;
    for (let from = 0; ; from += DB_PAGE) {
      const { data, error } = await supabaseAdmin
        .from("notification_reads")
        .select("read_at")
        .eq("notification_id", id.data)
        .order("read_at", { ascending: true })
        .range(from, from + DB_PAGE - 1);
      if (error) {
        throw new Error(error.message);
      }
      const rows = data ?? [];
      for (const row of rows) {
        total += 1;
        const day = String(row.read_at).slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      if (rows.length < DB_PAGE) break;
    }

    res.json({
      data: {
        total_reads: total,
        reads_by_day: Array.from(byDay.entries()).map(([day, count]) => ({
          day,
          count,
        })),
      },
    });
  } catch (err) {
    console.error("[admin/notifications] stats failed", err);
    return next(
      createError(500, "db_error", "Erro ao buscar estatísticas."),
    );
  }
});

export default router;
