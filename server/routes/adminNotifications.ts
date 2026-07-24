import { Router } from "express";
import { z } from "zod";

import { cacheKey, getOrCompute } from "../lib/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  loadReachContext,
  segmentReach,
} from "../lib/audienceReach";
import { isMissingColumnError } from "../lib/pgErrors";
import { USER_SEGMENTS, type UserSegment } from "../lib/userSegments";
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
  "id, title, body, type, category, audience, coupon_code, discount_percent, cta_url, cta_label, expires_at, status, published_at, scheduled_for, is_super, super_eyebrow, super_title, super_subtitle, super_cta_label, super_cta_url, created_by, created_at, updated_at";

const NOTIFICATION_TYPES = [
  "announcement",
  "coupon",
  "optin",
  "system",
] as const;
const NOTIFICATION_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

// Agendamento: MESMAS regras das campanhas de email (adminEmailCampaigns:
// SCHEDULE_PAST_TOLERANCE_MS / SCHEDULE_MAX_AHEAD_MS). Duplicado com comentario
// como o EMAIL_PATTERN, pra nao acoplar dois routers.
const SCHEDULE_PAST_TOLERANCE_MS = 60_000; // 60s de folga pra clock skew
const SCHEDULE_MAX_AHEAD_MS = 30 * 24 * 60 * 60 * 1000; // 30d

type ScheduleValidation =
  | { ok: true; iso: string }
  | { ok: false; message: string };

// Puro e testavel: valida um scheduled_for contra `nowMs` com as regras do
// email (futuro com tolerancia de 60s, no maximo 30 dias a frente) e devolve o
// ISO canonico. Espelha o bloco de agendamento de adminEmailCampaigns.
export function validateScheduledFor(
  value: string,
  nowMs: number,
): ScheduleValidation {
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) {
    return { ok: false, message: "Data de agendamento inválida." };
  }
  if (ts < nowMs - SCHEDULE_PAST_TOLERANCE_MS) {
    return { ok: false, message: "O agendamento precisa ser no futuro." };
  }
  if (ts > nowMs + SCHEDULE_MAX_AHEAD_MS) {
    return {
      ok: false,
      message: "O agendamento pode ser de no máximo 30 dias à frente.",
    };
  }
  return { ok: true, iso: new Date(ts).toISOString() };
}

// Puro e testavel: o cron promove scheduled -> published quando vencido. Espelha
// EXATAMENTE o WHERE do endpoint /api/cron/publish-scheduled-notifications
// (status='scheduled' AND scheduled_for <= now()); a agendada so vira published
// quando scheduled_for <= now, nunca antes.
export function isScheduledDue(
  scheduledFor: string | null,
  nowMs: number,
): boolean {
  if (!scheduledFor) return false;
  const ts = new Date(scheduledFor).getTime();
  if (!Number.isFinite(ts)) return false;
  return ts <= nowMs;
}

// Audiences aceitas na criacao: os segmentos (avaliados na leitura) mais
// 'custom' (lista fixa materializada em notification_recipients).
const NOTIFICATION_AUDIENCES = [
  "all",
  "never_pro",
  "active_pro",
  "paying_pro",
  "ex_pro",
  "custom",
] as const;

const DB_PAGE = 1000;

// Mesma validacao de email das campanhas (adminEmailCampaigns): presenca de
// local, arroba e dominio com ponto.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_CUSTOM_RECIPIENTS = 500;
const EMAIL_LOOKUP_CHUNK = 100;

const expiresAtSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data de expiração inválida.");

function isFuture(iso: string): boolean {
  return Date.parse(iso) > Date.now();
}

const recipientEmailsSchema = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .max(MAX_EMAIL_LENGTH)
      .regex(EMAIL_PATTERN, "Email inválido na lista de destinatários."),
  )
  .min(1, "Informe pelo menos um email.")
  .max(MAX_CUSTOM_RECIPIENTS, `No máximo ${MAX_CUSTOM_RECIPIENTS} emails.`);

// Cupom exige codigo (mesmo check do banco, validado antes pra dar mensagem
// clara em vez de erro de constraint).
const CreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
    type: z.enum(NOTIFICATION_TYPES).default("announcement"),
    category: z.enum(["product", "promotional"]).default("product"),
    audience: z.enum(NOTIFICATION_AUDIENCES).default("all"),
    coupon_code: z.string().trim().min(1).max(64).nullable().optional(),
    discount_percent: z.number().int().min(1).max(100).nullable().optional(),
    cta_url: z.string().trim().url().max(2048).nullable().optional(),
    cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    expires_at: expiresAtSchema.nullable().optional(),
    // SUPER: colunas dedicadas. is_super default false; super_cta_url segue as
    // mesmas regras de cta_url (url valida). Uma super pode ser tambem cupom
    // e/ou agendada (flags ortogonais, sem regra especial de par).
    is_super: z.boolean().optional().default(false),
    super_eyebrow: z.string().trim().min(1).max(60).nullable().optional(),
    super_title: z.string().trim().min(1).max(120).nullable().optional(),
    super_subtitle: z.string().trim().min(1).max(200).nullable().optional(),
    super_cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    super_cta_url: z.string().trim().url().max(2048).nullable().optional(),
    recipient_emails: recipientEmailsSchema.optional(),
  })
  .refine((data) => data.type !== "coupon" || Boolean(data.coupon_code), {
    message: "coupon_code é obrigatório quando type é coupon.",
  })
  .refine((data) => !data.expires_at || isFuture(data.expires_at), {
    message: "expires_at deve ser uma data futura.",
  })
  .refine(
    (data) =>
      !data.is_super ||
      (Boolean(data.super_title) &&
        Boolean(data.super_cta_label) &&
        Boolean(data.super_cta_url)),
    {
      message:
        "Super exige super_title, super_cta_label e super_cta_url.",
    },
  )
  .refine(
    (data) =>
      data.audience !== "custom" || (data.recipient_emails?.length ?? 0) > 0,
    { message: "recipient_emails é obrigatório quando audience é custom." },
  )
  .refine((data) => data.audience === "custom" || !data.recipient_emails, {
    message: "recipient_emails só é aceito com audience custom.",
  });

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(2000).optional(),
    type: z.enum(NOTIFICATION_TYPES).optional(),
    category: z.enum(["product", "promotional"]).optional(),
    audience: z.enum(NOTIFICATION_AUDIENCES).optional(),
    coupon_code: z.string().trim().min(1).max(64).nullable().optional(),
    discount_percent: z.number().int().min(1).max(100).nullable().optional(),
    cta_url: z.string().trim().url().max(2048).nullable().optional(),
    cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    expires_at: expiresAtSchema.nullable().optional(),
    status: z.enum(["published", "archived"]).optional(),
    // SUPER no patch: campos individuais validados aqui; a exigencia "super
    // completa" (title+cta) e checada no handler contra os valores efetivos
    // (patch ?? existing), como o cupom, porque o patch e parcial.
    is_super: z.boolean().optional(),
    super_eyebrow: z.string().trim().min(1).max(60).nullable().optional(),
    super_title: z.string().trim().min(1).max(120).nullable().optional(),
    super_subtitle: z.string().trim().min(1).max(200).nullable().optional(),
    super_cta_label: z.string().trim().min(1).max(60).nullable().optional(),
    super_cta_url: z.string().trim().url().max(2048).nullable().optional(),
    recipient_emails: recipientEmailsSchema.optional(),
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
  audience: string;
  coupon_code: string | null;
  expires_at: string | null;
  scheduled_for: string | null;
  [key: string]: unknown;
};

type ResolvedRecipients = {
  matched: string[];
  unmatched: string[];
  userIds: string[];
  // Pares (user_id, email) pro insert: uma linha por destinatario, com o email
  // resolvido guardado pra recuperar a lista depois. Dedupados por user_id.
  recipients: Array<{ userId: string; email: string }>;
};

// Mapeamento puro linhas de profiles -> recipients. ATENCAO ao schema:
// profiles tem id PROPRIO (uuid local) e user_id (FK para auth.users, o valor
// que notification_recipients.user_id exige). Linha sem user_id valido vira
// unmatched, nunca erro: so falha real de banco vira 500.
export function mapProfileRowsToRecipients(
  requested: string[],
  rows: Array<{ user_id: string | null; email: string | null }>,
): ResolvedRecipients {
  const matched: string[] = [];
  // Dedupe por user_id preservando o primeiro email visto: o insert grava uma
  // linha (user_id, email) por destinatario, e o email guardado permite
  // repopular o textarea ao reeditar a lista custom.
  const emailByUserId = new Map<string, string>();
  for (const row of rows) {
    if (!row.email || !row.user_id) continue;
    const email = String(row.email).toLowerCase();
    matched.push(email);
    if (!emailByUserId.has(row.user_id)) {
      emailByUserId.set(row.user_id, email);
    }
  }
  const matchedSet = new Set(matched);
  const unmatched = requested.filter((email) => !matchedSet.has(email));
  const recipients = Array.from(emailByUserId, ([userId, email]) => ({
    userId,
    email,
  }));
  return {
    matched,
    unmatched,
    userIds: recipients.map((r) => r.userId),
    recipients,
  };
}

// Resolve emails -> auth user_id via profiles.user_id (mesmo padrao do
// emailCampaignQueue, que sempre le user_id de profiles). Entrada ja vem
// lowercased pelo zod; o match e por igualdade no email do profile (espelho
// do auth, normalizado pelo GoTrue). Lotes de 100 pra nao estourar o tamanho
// de URL do PostgREST com listas de ate 500.
async function resolveRecipientEmails(
  emails: string[],
): Promise<ResolvedRecipients> {
  const unique = Array.from(new Set(emails));
  const rows: Array<{ user_id: string | null; email: string | null }> = [];
  for (let i = 0; i < unique.length; i += EMAIL_LOOKUP_CHUNK) {
    const chunk = unique.slice(i, i + EMAIL_LOOKUP_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("email", chunk);
    if (error) {
      throw new Error(error.message);
    }
    rows.push(
      ...((data ?? []) as Array<{
        user_id: string | null;
        email: string | null;
      }>),
    );
  }
  return mapProfileRowsToRecipients(unique, rows);
}

// Detecção de "coluna email inexistente" (delega ao helper compartilhado que
// cobre PGRST204 do insert e 42703 do select). Enquanto a migration nao roda
// (deploy do codigo vem ANTES do db:push), este e o caminho esperado.
export function isEmailColumnMissing(error: {
  code?: string;
  message?: string;
}): boolean {
  return isMissingColumnError(error, "email");
}

type RecipientRow = {
  notification_id: string;
  user_id: string;
  email?: string;
};

// Puro e testavel: monta as linhas do insert. withEmail=false e o shape legado
// (schema antigo, sem a coluna), usado no fallback de degradacao.
export function buildRecipientRows(
  notificationId: string,
  recipients: Array<{ userId: string; email: string }>,
  options: { withEmail: boolean },
): RecipientRow[] {
  return recipients.map(({ userId, email }) =>
    options.withEmail
      ? { notification_id: notificationId, user_id: userId, email }
      : { notification_id: notificationId, user_id: userId },
  );
}

// Puro e testavel: monta a resposta do GET a partir das linhas. Linha com email
// null (legado, anterior a coluna) nao entra em `emails`; `missing` > 0 sinaliza
// a UI que a lista original nao esta completa (cai no comportamento legado).
export function buildRecipientsResponse(
  rows: Array<{ email: string | null }>,
): { emails: string[]; total: number; missing: number } {
  const emails: string[] = [];
  for (const row of rows) {
    if (row.email) emails.push(String(row.email));
  }
  return { emails, total: rows.length, missing: rows.length - emails.length };
}

type InsertResult = { error: { code?: string; message?: string } | null };

// Puro quanto ao IO (recebe runInsert injetavel): tenta gravar COM email; se o
// schema ainda nao tem a coluna, reinsere so (notification_id, user_id) pra o
// envio custom nunca quebrar entre o deploy e o db:push. Outros erros propagam
// (nao mascara falha real). onColumnMissing dispara uma vez pra logar o aviso.
export async function insertRecipientsWithFallback(
  notificationId: string,
  recipients: Array<{ userId: string; email: string }>,
  runInsert: (rows: RecipientRow[]) => Promise<InsertResult>,
  onColumnMissing?: () => void,
): Promise<void> {
  const first = await runInsert(
    buildRecipientRows(notificationId, recipients, { withEmail: true }),
  );
  if (!first.error) return;
  if (isEmailColumnMissing(first.error)) {
    onColumnMissing?.();
    const fallback = await runInsert(
      buildRecipientRows(notificationId, recipients, { withEmail: false }),
    );
    if (fallback.error) {
      throw new Error(fallback.error.message ?? "insert failed");
    }
    return;
  }
  throw new Error(first.error.message ?? "insert failed");
}

// Aviso logado uma unica vez por processo (nao por linha nem por notificacao).
let emailColumnMissingWarned = false;

async function insertRecipients(
  notificationId: string,
  recipients: Array<{ userId: string; email: string }>,
): Promise<void> {
  await insertRecipientsWithFallback(
    notificationId,
    recipients,
    async (rows) => {
      const { error } = await supabaseAdmin
        .from("notification_recipients")
        .insert(rows);
      return { error };
    },
    () => {
      if (!emailColumnMissingWarned) {
        console.warn(
          "[admin/notifications] coluna notification_recipients.email ausente; gravando recipients sem email até o db:push.",
        );
        emailColumnMissingWarned = true;
      }
    },
  );
}

async function countRecipients(notificationId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("notification_recipients")
    .select("user_id", { count: "exact", head: true })
    .eq("notification_id", notificationId);
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

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
      .select(
        `${ADMIN_COLUMNS}, notification_reads(count), notification_recipients(count)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const items = ((data ?? []) as unknown as Array<
      NotificationRow & {
        notification_reads: Array<{ count: number }>;
        notification_recipients: Array<{ count: number }>;
      }
    >).map(({ notification_reads, notification_recipients, ...row }) => ({
      ...row,
      read_count: notification_reads?.[0]?.count ?? 0,
      recipient_count: notification_recipients?.[0]?.count ?? 0,
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
// explicito (POST /:id/publish). Para audience=custom, a lista e resolvida e
// materializada AQUI: se nenhum email casar, nada e criado; se o insert dos
// recipients falhar depois da notificacao criada, a notificacao e deletada
// (compensacao) pra nunca sobrar custom sem lista.
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
    let resolved: ResolvedRecipients | null = null;
    if (data.audience === "custom") {
      resolved = await resolveRecipientEmails(data.recipient_emails ?? []);
      if (resolved.userIds.length === 0) {
        return next(
          createError(
            400,
            "no_recipients_matched",
            "Nenhum dos emails informados tem cadastro na plataforma.",
          ),
        );
      }
    }

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
        is_super: data.is_super ?? false,
        super_eyebrow: data.super_eyebrow ?? null,
        super_title: data.super_title ?? null,
        super_subtitle: data.super_subtitle ?? null,
        super_cta_label: data.super_cta_label ?? null,
        super_cta_url: data.super_cta_url ?? null,
        status: "draft",
        created_by: req.user!.id,
      })
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    const createdRow = created as unknown as NotificationRow;

    if (resolved) {
      try {
        await insertRecipients(createdRow.id, resolved.recipients);
      } catch (recipientsErr) {
        await supabaseAdmin
          .from("notifications")
          .delete()
          .eq("id", createdRow.id);
        throw recipientsErr;
      }
    }

    res.status(201).json({
      data: created,
      ...(resolved
        ? { matched: resolved.matched, unmatched: resolved.unmatched }
        : {}),
    });
  } catch (err) {
    console.error("[admin/notifications] create failed", err);
    return next(createError(500, "db_error", "Erro ao criar notificação."));
  }
});

// Campos de conteudo, imutaveis apos a publicacao. super_* entram aqui: seguem
// a mesma regra dos outros campos de conteudo (editaveis em draft/scheduled,
// imutaveis em published/archived).
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
  "is_super",
  "super_eyebrow",
  "super_title",
  "super_subtitle",
  "super_cta_label",
  "super_cta_url",
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

    // draft e scheduled sao editaveis (conteudo mutavel): scheduled ainda NAO
    // foi publicada. As transicoes de status (publicar/agendar/cancelar) tem
    // endpoints proprios, entao patch.status nao e aceito aqui nesse ramo.
    const editable =
      existing.status === "draft" || existing.status === "scheduled";
    if (editable) {
      if (patch.status !== undefined) {
        return next(
          createError(
            400,
            "use_publish_endpoint",
            "Use POST /:id/publish, /:id/schedule ou /:id/unschedule para mudar o status.",
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
      // Super completa contra os valores efetivos (patch ?? existing), como o
      // cupom: patch parcial pode ligar is_super sem reenviar os super_*.
      const effectiveIsSuper =
        update.is_super !== undefined ? update.is_super : existing.is_super;
      if (effectiveIsSuper === true) {
        const effTitle =
          update.super_title !== undefined
            ? update.super_title
            : existing.super_title;
        const effCtaLabel =
          update.super_cta_label !== undefined
            ? update.super_cta_label
            : existing.super_cta_label;
        const effCtaUrl =
          update.super_cta_url !== undefined
            ? update.super_cta_url
            : existing.super_cta_url;
        if (!effTitle || !effCtaLabel || !effCtaUrl) {
          return next(
            createError(
              400,
              "invalid_request",
              "Super exige super_title, super_cta_label e super_cta_url.",
            ),
          );
        }
      }
    } else {
      const touchedContent =
        CONTENT_FIELDS.some((field) => patch[field] !== undefined) ||
        patch.recipient_emails !== undefined;
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

    // Recipients: so em draft/scheduled (published caiu no 409 acima se tocou).
    // A lista e substituida INTEIRA (delete + insert) quando recipient_emails
    // vem no patch; sem o campo, a lista atual e mantida.
    let resolved: ResolvedRecipients | null = null;
    if (editable) {
      const effectiveAudience = (update.audience ??
        existing.audience) as string;
      if (patch.recipient_emails && effectiveAudience !== "custom") {
        return next(
          createError(
            400,
            "invalid_request",
            "recipient_emails só é aceito com audience custom.",
          ),
        );
      }
      if (effectiveAudience === "custom") {
        if (existing.audience !== "custom" && !patch.recipient_emails) {
          return next(
            createError(
              400,
              "invalid_request",
              "Informe recipient_emails ao mudar a audience para custom.",
            ),
          );
        }
        if (patch.recipient_emails) {
          resolved = await resolveRecipientEmails(patch.recipient_emails);
          if (resolved.userIds.length === 0) {
            return next(
              createError(
                400,
                "no_recipients_matched",
                "Nenhum dos emails informados tem cadastro na plataforma.",
              ),
            );
          }
        }
      }
    }

    if (Object.keys(update).length === 0 && resolved === null) {
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
    const updatedRow = updated as unknown as NotificationRow;

    if (editable) {
      if (resolved) {
        const { error: deleteError } = await supabaseAdmin
          .from("notification_recipients")
          .delete()
          .eq("notification_id", id.data);
        if (deleteError) {
          throw new Error(deleteError.message);
        }
        await insertRecipients(id.data, resolved.recipients);
      } else if (
        existing.audience === "custom" &&
        updatedRow.audience !== "custom"
      ) {
        // Saiu de custom pra segmento: a lista antiga nao faz mais sentido.
        const { error: deleteError } = await supabaseAdmin
          .from("notification_recipients")
          .delete()
          .eq("notification_id", id.data);
        if (deleteError) {
          throw new Error(deleteError.message);
        }
      }
    }

    res.json({
      data: updated,
      ...(resolved
        ? { matched: resolved.matched, unmatched: resolved.unmatched }
        : {}),
    });
  } catch (err) {
    console.error("[admin/notifications] patch failed", err);
    return next(createError(500, "db_error", "Erro ao editar notificação."));
  }
});

const AudiencePreviewQuerySchema = z.object({
  audience: z.enum(USER_SEGMENTS),
  category: z.enum(["product", "promotional"]).default("product"),
});

// Estimativa de alcance com a MESMA semantica do feed (userSegments): quantos
// usuarios da base casam com audience + category. E preview, nao contrato: a
// visibilidade real e decidida por usuario na leitura, entao contas que virem
// Pro (ou derem opt-in) depois entram no alcance sem refletir aqui. Reusa o
// mesmo calculo (audienceReach) do snapshot gravado na publicacao.
async function computeAudiencePreview(
  audience: UserSegment,
  category: "product" | "promotional",
): Promise<{ total_users: number; matched: number }> {
  const ctx = await loadReachContext({
    needOptedIn: category === "promotional",
  });
  return {
    total_users: ctx.totalUsers,
    matched: segmentReach(audience, category, ctx),
  };
}

// GET /api/admin/notifications/audience-preview?audience=&category=
// Varre subscriptions/profiles na base toda, entao o resultado fica em cache
// (Redis, fail-open pra compute direto sem Redis) por 10 min por combinacao.
router.get("/audience-preview", async (req, res, next) => {
  // custom nao tem preview de segmento: o alcance e o matched da resolucao
  // de emails, que o POST/PATCH ja retorna.
  if (req.query.audience === "custom") {
    return next(
      createError(
        400,
        "invalid_request",
        "audience custom não tem preview de segmento; o alcance é a lista de destinatários.",
      ),
    );
  }
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

// Puro e testavel: escolhe o denominador da taxa de leitura e a origem.
// - custom: recipient_count (lista fixa, sempre exato) -> 'recipients'.
// - snapshot != null: alcance congelado na publicacao -> 'snapshot' (exato).
// - snapshot null (legado, publicada antes da feature): estimativa de agora.
export function resolveDenominator(input: {
  audience: string;
  audienceSnapshot: number | null;
  recipientCount: number;
  estimate: number;
}): {
  denominator: number;
  denominator_source: "recipients" | "snapshot" | "estimate";
} {
  if (input.audience === "custom") {
    return {
      denominator: input.recipientCount,
      denominator_source: "recipients",
    };
  }
  if (input.audienceSnapshot !== null) {
    return {
      denominator: input.audienceSnapshot,
      denominator_source: "snapshot",
    };
  }
  return { denominator: input.estimate, denominator_source: "estimate" };
}

type PublishUpdateResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

// Publica gravando audience_snapshot; se a coluna ainda nao existe (janela
// entre deploy e db:push), refaz o update SEM o snapshot pra publicar mesmo
// assim. So o snapshot cai (denominador vira estimativa); publicar NUNCA falha
// por causa da coluna nova. Outros erros propagam (o handler decide). runUpdate
// injetavel pra ser testavel sem o supabaseAdmin.
export async function publishWithSnapshotFallback(
  baseFields: Record<string, unknown>,
  snapshot: number | null,
  runUpdate: (payload: Record<string, unknown>) => Promise<PublishUpdateResult>,
  onColumnMissing?: () => void,
): Promise<PublishUpdateResult> {
  const first = await runUpdate({
    ...baseFields,
    audience_snapshot: snapshot,
  });
  if (!first.error) return first;
  if (isMissingColumnError(first.error, "audience_snapshot")) {
    onColumnMissing?.();
    return runUpdate(baseFields);
  }
  return first;
}

// Aviso logado uma unica vez por processo (nao por publicacao).
let snapshotColumnMissingWarned = false;
function warnSnapshotColumnMissing(): void {
  if (!snapshotColumnMissingWarned) {
    console.warn(
      "[admin/notifications] coluna notifications.audience_snapshot ausente; publicando sem snapshot até o db:push.",
    );
    snapshotColumnMissingWarned = true;
  }
}

// Le o audience_snapshot tolerando o schema antigo: se a coluna nao existe
// (42703 no select), devolve null (a UI cai na estimativa). Nao carrega o resto
// da notificacao (isso vem do findNotification).
async function fetchAudienceSnapshot(
  notificationId: string,
): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("audience_snapshot")
    .eq("id", notificationId)
    .maybeSingle();
  if (error) {
    if (isMissingColumnError(error, "audience_snapshot")) return null;
    throw new Error(error.message);
  }
  return (data?.audience_snapshot as number | null | undefined) ?? null;
}

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
    // Publica imediatamente draft OU scheduled (o "publicar agora" ignora e
    // limpa o agendamento pendente).
    if (existing.status !== "draft" && existing.status !== "scheduled") {
      return next(
        createError(
          409,
          "invalid_status",
          "Só rascunhos ou agendadas podem ser publicados.",
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
    // Guarda de integridade: custom sem destinatario nunca publica (pode
    // acontecer se um replace de lista falhou no meio; o draft fica sem
    // linhas e o admin resolve reenviando a lista). O count vira o snapshot.
    let customRecipientCount = 0;
    if (existing.audience === "custom") {
      customRecipientCount = await countRecipients(existing.id);
      if (customRecipientCount === 0) {
        return next(
          createError(
            400,
            "no_recipients_matched",
            "Esta notificação custom está sem destinatários; reenvie a lista de emails antes de publicar.",
          ),
        );
      }
    }

    // Snapshot de alcance pro denominador exato das stats. BEST-EFFORT: se o
    // calculo falhar, grava null e publica mesmo assim (publicar > metrica).
    let audienceSnapshot: number | null = null;
    try {
      if (existing.audience === "custom") {
        audienceSnapshot = customRecipientCount;
      } else {
        const ctx = await loadReachContext({
          needOptedIn: existing.category === "promotional",
        });
        audienceSnapshot = segmentReach(
          existing.audience as UserSegment,
          existing.category as "product" | "promotional",
          ctx,
        );
      }
    } catch (snapErr) {
      console.warn(
        "[admin/notifications] cálculo do snapshot de alcance falhou; publicando sem snapshot",
        snapErr,
      );
      audienceSnapshot = null;
    }

    // scheduled_for e zerado no disparo imediato: uma published nunca carrega
    // agendamento pendente (o cron so olha status='scheduled', mas manter a
    // coluna limpa evita confusao).
    const nowIso = new Date().toISOString();
    const result = await publishWithSnapshotFallback(
      {
        status: "published",
        published_at: nowIso,
        updated_at: nowIso,
        scheduled_for: null,
      },
      audienceSnapshot,
      async (payload) => {
        const r = await supabaseAdmin
          .from("notifications")
          .update(payload)
          .eq("id", id.data)
          .in("status", ["draft", "scheduled"])
          .select(ADMIN_COLUMNS)
          .single();
        return { data: r.data, error: r.error };
      },
      warnSnapshotColumnMissing,
    );
    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({ data: result.data });
  } catch (err) {
    console.error("[admin/notifications] publish failed", err);
    return next(
      createError(500, "db_error", "Erro ao publicar notificação."),
    );
  }
});

const ScheduleSchema = z.object({
  scheduled_for: z.string(),
});

// POST /api/admin/notifications/:id/schedule { scheduled_for }
// draft|scheduled -> scheduled (o mesmo endpoint agenda e reagenda). Espelha o
// passo de disparo agendado das campanhas de email: o "quando" e decidido aqui,
// nao na criacao. published_at continua null (so o cron/publish o seta no
// disparo). Aplica as MESMAS guardas do publish (expiracao futura, custom com
// destinatarios) porque scheduled vira published sozinha depois.
router.post("/:id/schedule", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Notificação não encontrada."));
  }
  const parsed = ScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(400, "invalid_schedule", "Data de agendamento inválida."),
    );
  }

  const validation = validateScheduledFor(parsed.data.scheduled_for, Date.now());
  if (!validation.ok) {
    return next(createError(400, "invalid_schedule", validation.message));
  }
  const scheduledForIso = validation.iso;

  try {
    const existing = await findNotification(id.data);
    if (!existing) {
      return next(
        createError(404, "not_found", "Notificação não encontrada."),
      );
    }
    if (existing.status !== "draft" && existing.status !== "scheduled") {
      return next(
        createError(
          409,
          "invalid_status",
          "Só rascunhos ou agendadas podem ser agendados.",
        ),
      );
    }
    if (existing.expires_at && !isFuture(existing.expires_at)) {
      return next(
        createError(
          400,
          "invalid_request",
          "expires_at deve ser uma data futura para agendar.",
        ),
      );
    }
    // Agendar depois da expiracao publicaria algo ja expirado: rejeita.
    if (
      existing.expires_at &&
      Date.parse(scheduledForIso) >= Date.parse(existing.expires_at)
    ) {
      return next(
        createError(
          400,
          "invalid_schedule",
          "O agendamento precisa ser antes da data de expiração.",
        ),
      );
    }
    if (existing.audience === "custom") {
      const recipients = await countRecipients(existing.id);
      if (recipients === 0) {
        return next(
          createError(
            400,
            "no_recipients_matched",
            "Esta notificação custom está sem destinatários; reenvie a lista de emails antes de agendar.",
          ),
        );
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("notifications")
      .update({
        status: "scheduled",
        scheduled_for: scheduledForIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id.data)
      .in("status", ["draft", "scheduled"])
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("[admin/notifications] schedule failed", err);
    return next(
      createError(500, "db_error", "Erro ao agendar notificação."),
    );
  }
});

// POST /api/admin/notifications/:id/unschedule: scheduled -> draft. Cancela o
// agendamento (limpa scheduled_for) sem publicar. Conteudo intacto.
router.post("/:id/unschedule", async (req, res, next) => {
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
    if (existing.status !== "scheduled") {
      return next(
        createError(
          409,
          "invalid_status",
          "Só notificações agendadas podem ter o agendamento cancelado.",
        ),
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("notifications")
      .update({
        status: "draft",
        scheduled_for: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id.data)
      .eq("status", "scheduled")
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      throw new Error(error.message);
    }

    res.json({ data: updated });
  } catch (err) {
    console.error("[admin/notifications] unschedule failed", err);
    return next(
      createError(500, "db_error", "Erro ao cancelar o agendamento."),
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

    // Denominador da taxa de leitura: custom usa recipient_count; segmento com
    // snapshot usa o alcance congelado (exato); segmento legado (sem snapshot)
    // cai na estimativa de agora, so calculada nesse caso (evita a varredura).
    const audienceSnapshot =
      existing.audience === "custom"
        ? null
        : await fetchAudienceSnapshot(id.data);
    const recipientCount =
      existing.audience === "custom"
        ? await countRecipients(id.data)
        : 0;
    let estimate = 0;
    if (existing.audience !== "custom" && audienceSnapshot === null) {
      const ctx = await loadReachContext({
        needOptedIn: existing.category === "promotional",
      });
      estimate = segmentReach(
        existing.audience as UserSegment,
        existing.category as "product" | "promotional",
        ctx,
      );
    }
    const { denominator, denominator_source } = resolveDenominator({
      audience: existing.audience,
      audienceSnapshot,
      recipientCount,
      estimate,
    });

    res.json({
      data: {
        total_reads: total,
        reads_by_day: Array.from(byDay.entries()).map(([day, count]) => ({
          day,
          count,
        })),
        denominator,
        denominator_source,
      },
    });
  } catch (err) {
    console.error("[admin/notifications] stats failed", err);
    return next(
      createError(500, "db_error", "Erro ao buscar estatísticas."),
    );
  }
});

// Le as linhas de recipients pra o GET. Degrada quando o schema ainda nao tem a
// coluna email (select falha com 42703): reconta as linhas por uma coluna que
// existe (user_id) e devolve email null pra cada, ou seja, "todos legados".
async function fetchLegacyRecipientRows(
  notificationId: string,
): Promise<Array<{ email: string | null }>> {
  const rows: Array<{ email: string | null }> = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("notification_recipients")
      .select("user_id")
      .eq("notification_id", notificationId)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const page = data ?? [];
    for (let i = 0; i < page.length; i += 1) rows.push({ email: null });
    if (page.length < DB_PAGE) break;
  }
  return rows;
}

async function fetchRecipientEmailRows(
  notificationId: string,
): Promise<Array<{ email: string | null }>> {
  const rows: Array<{ email: string | null }> = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("notification_recipients")
      .select("email")
      .eq("notification_id", notificationId)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      if (isEmailColumnMissing(error)) {
        return fetchLegacyRecipientRows(notificationId);
      }
      throw new Error(error.message);
    }
    const page = (data ?? []) as Array<{ email: string | null }>;
    for (const row of page) rows.push({ email: row.email });
    if (page.length < DB_PAGE) break;
  }
  return rows;
}

// GET /api/admin/notifications/:id/recipients: emails da lista custom, pra
// repopular o textarea ao editar (antes so a contagem era recuperavel). Linhas
// legadas (email null, anteriores a coluna) contam mas nao tem email; `missing`
// deixa a UI detectar que a lista original nao esta completa e cair no legado.
router.get("/:id/recipients", async (req, res, next) => {
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

    const rows = await fetchRecipientEmailRows(id.data);
    res.json({ data: buildRecipientsResponse(rows) });
  } catch (err) {
    console.error("[admin/notifications] recipients failed", err);
    return next(
      createError(500, "db_error", "Erro ao carregar destinatários."),
    );
  }
});

export default router;
