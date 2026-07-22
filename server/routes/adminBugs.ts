import { Router } from "express";
import { z } from "zod";

import { sendBugCreatedEmail, sendBugResolvedEmail } from "../lib/email";
import { env } from "../lib/env";
import { listSentryIssues } from "../lib/sentryApi";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createTargetedNotification } from "../lib/targetedNotifications";
import { createError } from "../middleware/error";

// Aba Bugs & Erros do admin: issues lidas da API do Sentry (read-only) e bug
// tracker manual em admin_bugs. Sub-montado em admin.ts DEPOIS de
// requireAuth + requireAdmin; nenhum guard local.
//
// Emails de notificacao (bug novo / bug resolvido) sao fire-and-forget: a
// resposta HTTP nao espera nem falha por causa do envio, erro so vira log.

const router = Router();

const BUG_STATUSES = ["open", "in_progress", "done"] as const;
const BUG_SEVERITIES = ["low", "medium", "high", "critical"] as const;

const SEVERITY_LABELS: Record<(typeof BUG_SEVERITIES)[number], string> = {
  low: "baixa",
  medium: "média",
  high: "alta",
  critical: "crítica",
};

const SentryQuerySchema = z.object({
  query: z.string().trim().min(1).max(200).default("is:unresolved"),
  cursor: z.string().trim().min(1).max(200).optional(),
  // Janela relativa no formato do Sentry (24h, 14d...). Valida o formato aqui
  // pra nao repassar lixo arbitrario de querystring pra API externa.
  statsPeriod: z
    .string()
    .regex(/^\d{1,3}[hdwm]$/, "statsPeriod inválido (ex: 24h, 14d).")
    .default("14d"),
});

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000).nullable().optional(),
  severity: z.enum(BUG_SEVERITIES).default("medium"),
  sentry_issue_id: z.string().trim().min(1).max(100).nullable().optional(),
  sentry_issue_url: z.string().trim().url().max(2048).nullable().optional(),
});

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).nullable().optional(),
    severity: z.enum(BUG_SEVERITIES).optional(),
    status: z.enum(BUG_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

const ListQuerySchema = z.object({
  status: z.enum(BUG_STATUSES).optional(),
});

type BugRow = {
  id: string;
  title: string;
  description: string | null;
  status: (typeof BUG_STATUSES)[number];
  severity: (typeof BUG_SEVERITIES)[number];
  sentry_issue_id: string | null;
  sentry_issue_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const BUG_COLUMNS =
  "id, title, description, status, severity, sentry_issue_id, sentry_issue_url, created_by, created_at, updated_at, resolved_at";

router.get("/sentry-issues", async (req, res, next) => {
  const parsed = SentryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
      ),
    );
  }

  const result = await listSentryIssues(parsed.data);
  if (result.state === "not_configured") {
    return next(
      createError(
        503,
        "sentry_not_configured",
        `Integração com o Sentry não configurada (faltam: ${result.missing.join(", ")}).`,
      ),
    );
  }
  if (result.state === "rate_limited") {
    return next(
      createError(
        429,
        "sentry_rate_limited",
        "A API do Sentry limitou as requisições. Tente de novo em instantes.",
      ),
    );
  }
  if (result.state === "error") {
    console.error("[admin-bugs] Falha na API do Sentry:", result.reason);
    return next(
      createError(502, "sentry_error", "Erro ao consultar a API do Sentry."),
    );
  }

  res.json({
    issues: result.issues,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
  });
});

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

  let query = supabaseAdmin
    .from("admin_bugs")
    .select(BUG_COLUMNS)
    .order("created_at", { ascending: false });
  if (parsed.data.status) query = query.eq("status", parsed.data.status);

  // Contagem por status independente do filtro (badges das colunas no front).
  const countByStatus = (status: string) =>
    supabaseAdmin
      .from("admin_bugs")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

  const [bugs, ...statusCounts] = await Promise.all([
    query,
    ...BUG_STATUSES.map(countByStatus),
  ]);

  if (bugs.error || statusCounts.some((r) => r.error)) {
    console.error(
      "[admin-bugs] Falha ao listar bugs:",
      bugs.error ?? statusCounts.find((r) => r.error)?.error,
    );
    return next(createError(500, "db_error", "Erro ao listar bugs."));
  }

  res.json({
    bugs: (bugs.data ?? []) as BugRow[],
    counts: Object.fromEntries(
      BUG_STATUSES.map((status, i) => [status, statusCounts[i].count ?? 0]),
    ),
  });
});

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

  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      severity: parsed.data.severity,
      sentry_issue_id: parsed.data.sentry_issue_id ?? null,
      sentry_issue_url: parsed.data.sentry_issue_url ?? null,
      created_by: req.user!.id,
    })
    .select(BUG_COLUMNS)
    .single();

  if (error || !data) {
    console.error("[admin-bugs] Falha ao criar bug:", error);
    return next(createError(500, "db_error", "Erro ao criar bug."));
  }

  const bug = data as BugRow;
  // Email e notificacao in-app sao independentes: cada um com seu catch, a
  // falha de um nao segura o outro e nenhum bloqueia a resposta.
  void sendBugCreatedEmail({
    title: bug.title,
    severity: bug.severity,
    description: bug.description,
    sentryIssueUrl: bug.sentry_issue_url,
  }).catch((emailError) => {
    console.error("[admin-bugs] Falha no email de bug novo:", emailError);
  });
  void createTargetedNotification({
    email: env.bugNotifyNewEmail,
    title: `🐛 Novo bug: ${bug.title}`,
    body: `Um novo bug de severidade ${SEVERITY_LABELS[bug.severity]} foi registrado no admin.`,
    createdBy: req.user!.id,
  }).catch((notificationError) => {
    console.error(
      "[admin-bugs] Falha na notificação de bug novo:",
      notificationError,
    );
  });

  res.status(201).json(bug);
});

router.patch("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Bug não encontrado."));
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

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("admin_bugs")
    .select(BUG_COLUMNS)
    .eq("id", id.data)
    .maybeSingle();
  if (fetchError) {
    console.error("[admin-bugs] Falha ao buscar bug:", fetchError);
    return next(createError(500, "db_error", "Erro ao buscar bug."));
  }
  if (!existing) {
    return next(createError(404, "not_found", "Bug não encontrado."));
  }

  const current = existing as BugRow;
  const patch = parsed.data;
  const update: Record<string, unknown> = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  // resolved_at e derivado do status, nunca aceito do client: setado na
  // transicao pra done, limpo quando o bug sai de done (reaberto). done ->
  // done nao reseta o timestamp nem reenvia o email de conclusao.
  const becameDone = patch.status === "done" && current.status !== "done";
  if (becameDone) update.resolved_at = new Date().toISOString();
  if (patch.status && patch.status !== "done" && current.status === "done") {
    update.resolved_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .update(update)
    .eq("id", id.data)
    .select(BUG_COLUMNS)
    .single();

  if (error || !data) {
    console.error("[admin-bugs] Falha ao atualizar bug:", error);
    return next(createError(500, "db_error", "Erro ao atualizar bug."));
  }

  const bug = data as BugRow;
  // Ambos os avisos atras do MESMO gate becameDone (anti-duplicata da
  // transicao); entre si sao independentes, cada um com seu catch.
  if (becameDone) {
    void sendBugResolvedEmail({
      title: bug.title,
      createdAt: bug.created_at,
      resolvedAt: bug.resolved_at ?? new Date().toISOString(),
      resolvedBy: req.user?.email ?? null,
    }).catch((emailError) => {
      console.error(
        "[admin-bugs] Falha no email de bug resolvido:",
        emailError,
      );
    });
    void createTargetedNotification({
      email: env.bugNotifyDoneEmail,
      title: `✅ Bug resolvido: ${bug.title}`,
      body: `O bug de severidade ${SEVERITY_LABELS[bug.severity]} foi marcado como corrigido.`,
      createdBy: req.user?.id ?? null,
    }).catch((notificationError) => {
      console.error(
        "[admin-bugs] Falha na notificação de bug resolvido:",
        notificationError,
      );
    });
  }

  res.json(bug);
});

router.delete("/:id", async (req, res, next) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Bug não encontrado."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_bugs")
    .delete()
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin-bugs] Falha ao excluir bug:", error);
    return next(createError(500, "db_error", "Erro ao excluir bug."));
  }
  if (!data || data.length === 0) {
    return next(createError(404, "not_found", "Bug não encontrado."));
  }

  res.json({ ok: true });
});

export default router;
