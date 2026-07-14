import { Router } from "express";

import { sendCampaignEmail } from "../lib/email";
import { batchJobId } from "../lib/emailCampaignJobIds";
import {
  ELIGIBLE_WAITLIST_STATUSES,
  NEWSLETTER_ELIGIBLE_STATUSES,
  USER_SEGMENTS,
  cleanupCanceledBatch,
  dispatchCampaignBatch,
  emailCampaignQueue,
  fetchCampaignRecipientEmailSet,
  fetchProStatusSets,
  fetchSentEmailSetFromOtherCampaigns,
  fetchSuppressedEmailSet,
  scheduleBatchDispatchJob,
  userMatchesSegment,
  type EmailCampaignCategory,
  type TableBackedSource,
  type UserSegment,
} from "../lib/emailCampaignQueue";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  buildCampaignUnsubscribeUrl,
  waitlistUnsubscribeReady,
} from "../lib/waitlistUnsubscribe";
import { createError } from "../middleware/error";

// Montado DENTRO de server/routes/admin.ts, DEPOIS de requireAuth/requireAdmin
// (fail-closed: qualquer coisa que nao seja admin confirmado ja levou 401/403
// antes de chegar aqui). Nao montar este router em outro lugar sem os guards.
const router = Router();

const CAMPAIGN_COLUMNS =
  "id, subject, body, image_url, category, status, total_recipients, sent_count, failed_count, created_by, created_at, started_at, completed_at";

const BATCH_COLUMNS =
  "id, campaign_id, mode, batch_limit, exclude_other_campaigns, source, user_segment, scheduled_for, status, dispatched_at, created_at";

// Categoria declarada pelo admin, obrigatoria na criacao e edicao.
function parseCategory(value: unknown): EmailCampaignCategory | null {
  return value === "product" || value === "promotional" ? value : null;
}

const MAX_SELECTED_PER_BATCH = 500;

// Mesma validacao do POST /api/waitlist: presenca de local, arroba e dominio
// com ponto. Usada na lista avulsa (custom), unica origem sem tabela por tras.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const BATCH_SOURCES = [
  "waitlist",
  "newsletter",
  "custom",
  "users",
  "contact_list",
] as const;
type BatchSource = (typeof BATCH_SOURCES)[number];

function isTableBackedSource(value: string): value is TableBackedSource {
  return value === "waitlist" || value === "newsletter";
}

// Query paginavel de elegiveis da origem (mesmos filtros da selecao do lote).
function audienceQuery(source: TableBackedSource, withCount = false) {
  const options = withCount ? { count: "exact" as const } : undefined;
  if (source === "newsletter") {
    return supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, created_at, status", options)
      .in("status", NEWSLETTER_ELIGIBLE_STATUSES);
  }
  return supabaseAdmin
    .from("waitlist")
    .select("email, created_at, status", options)
    .in("status", ELIGIBLE_WAITLIST_STATUSES);
}
const SCHEDULE_PAST_TOLERANCE_MS = 60_000;
const SCHEDULE_MAX_AHEAD_MS = 30 * 24 * 60 * 60 * 1000; // 30d

function isAllowedImageUrl(value: string): boolean {
  let parsed: URL;
  let supabaseHost: string;
  try {
    parsed = new URL(value);
    supabaseHost = new URL(env.supabaseUrl).host;
  } catch {
    return false;
  }
  return (
    parsed.protocol === "https:" &&
    parsed.host === supabaseHost &&
    parsed.pathname.startsWith("/storage/v1/object/public/")
  );
}

// Pre-requisitos de envio (teste ou lote). Checa ANTES de qualquer mutacao
// pra falha de configuracao nao deixar campanha em estado intermediario.
function sendPreconditionError(needQueue: boolean) {
  if (!env.resendApiKey) {
    return createError(
      503,
      "email_campaign_unconfigured",
      "RESEND_API_KEY ausente. Configure o Resend antes de enviar.",
    );
  }
  if (!waitlistUnsubscribeReady()) {
    return createError(
      503,
      "email_campaign_unconfigured",
      "NEWSLETTER_TOKEN_SECRET ou NEWSLETTER_PUBLIC_BASE_URL ausente. Sem link de descadastro nao ha envio.",
    );
  }
  if (needQueue && !emailCampaignQueue) {
    return createError(
      503,
      "email_campaign_unconfigured",
      "Fila indisponivel (REDIS_URL ausente). Envio em massa exige a fila.",
    );
  }
  return null;
}

async function fetchCampaign(id: string) {
  return supabaseAdmin
    .from("email_campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
}

// Todo cancelamento de lote (rota DELETE ou automatico apos falha) passa por
// aqui: cancela e LIMPA os recipients pending que o lote inseriu (deleta,
// decrementa total_recipients e reavalia a campanha na RPC). Sem a limpeza,
// os orfaos seriam reenviados pela reconciliacao do proximo boot.
async function cancelBatchWithCleanup(batchId: string) {
  await supabaseAdmin
    .from("email_campaign_batches")
    .update({ status: "canceled" })
    .eq("id", batchId)
    .eq("status", "pending");
  try {
    await cleanupCanceledBatch(batchId);
  } catch (cleanupErr) {
    console.error(
      "[email-campaign] Falha na limpeza do lote cancelado",
      cleanupErr,
    );
  }
}

// POST /api/admin/email-campaigns: cria campanha em draft.
router.post("/", async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : "";
    if (!subject || !bodyText) {
      return next(
        createError(
          400,
          "invalid_campaign",
          "Assunto e corpo são obrigatórios.",
        ),
      );
    }

    let imageUrl: string | null = null;
    const rawImageUrl = body.image_url;
    if (
      rawImageUrl !== undefined &&
      rawImageUrl !== null &&
      rawImageUrl !== ""
    ) {
      if (
        typeof rawImageUrl !== "string" ||
        !isAllowedImageUrl(rawImageUrl.trim())
      ) {
        return next(
          createError(
            400,
            "invalid_image_url",
            "A imagem precisa ser uma URL https do Supabase Storage público do projeto.",
          ),
        );
      }
      imageUrl = rawImageUrl.trim();
    }

    const category = parseCategory(body.category);
    if (!category) {
      return next(
        createError(
          400,
          "invalid_category",
          "Categoria da campanha é obrigatória: produto ou promocional.",
        ),
      );
    }

    if (!req.user) {
      return next(createError(401, "unauthorized", "Autenticação necessária."));
    }

    const { data, error } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        subject,
        body: bodyText,
        image_url: imageUrl,
        category,
        created_by: req.user.id,
      })
      .select(CAMPAIGN_COLUMNS)
      .single();
    if (error) {
      console.error("[email-campaign] Falha ao criar campanha", error);
      return next(
        createError(500, "campaign_error", "Não foi possível criar a campanha."),
      );
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/email-campaigns: listagem para o painel.
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("email_campaigns")
      .select(CAMPAIGN_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[email-campaign] Falha ao listar campanhas", error);
      return next(
        createError(
          500,
          "campaign_error",
          "Não foi possível listar as campanhas.",
        ),
      );
    }
    res.json({ data: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/email-campaigns/audience-count: total de elegiveis da origem
// pro modal de novo lote, com os MESMOS filtros da selecao (supressao global,
// dedup da propria campanha e, com excludeOtherCampaigns=true, sent em outras
// campanhas) pro numero exibido bater com o que sera enviado. Erro e erro
// (500), nunca colapsa em zero.
router.get("/audience-count", async (req, res, next) => {
  try {
    const campaignId =
      typeof req.query.campaignId === "string" ? req.query.campaignId : "";
    if (!campaignId) {
      return next(
        createError(400, "invalid_campaign", "campaignId é obrigatório."),
      );
    }
    const source =
      typeof req.query.source === "string" ? req.query.source : "waitlist";
    if (!isTableBackedSource(source) && source !== "users") {
      return next(
        createError(400, "invalid_source", "Origem inválida para contagem."),
      );
    }
    const excludeOther = req.query.excludeOtherCampaigns === "true";

    // Origem users: a contagem aplica a regra de consentimento da categoria
    // da campanha (promotional exige opt-in) e o segmento, iguais a selecao.
    let segment: UserSegment = "all";
    let needOptIn = false;
    if (source === "users") {
      const rawSegment =
        typeof req.query.segment === "string" ? req.query.segment : "all";
      if (!USER_SEGMENTS.includes(rawSegment as UserSegment)) {
        return next(
          createError(400, "invalid_segment", "Segmento de usuários inválido."),
        );
      }
      segment = rawSegment as UserSegment;
      const { data: campaign, error: campaignError } =
        await fetchCampaign(campaignId);
      if (campaignError) {
        console.error(
          "[email-campaign] Falha ao buscar campanha",
          campaignError,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível buscar a campanha.",
          ),
        );
      }
      if (!campaign) {
        return next(createError(404, "not_found", "Campanha não encontrada."));
      }
      needOptIn = campaign.category === "promotional";
    }

    const existing = await fetchCampaignRecipientEmailSet(campaignId);
    const suppressed = await fetchSuppressedEmailSet();
    const sentElsewhere = excludeOther
      ? await fetchSentEmailSetFromOtherCampaigns(campaignId)
      : null;
    const proSets =
      source === "users" && segment !== "all"
        ? await fetchProStatusSets()
        : null;

    const PAGE = 1000;
    let count = 0;
    if (source === "users") {
      const seen = new Set<string>();
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("user_id, email, marketing_opt_in")
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[email-campaign] Falha ao contar usuários", error);
          return next(
            createError(
              500,
              "campaign_error",
              "Não foi possível contar os elegíveis.",
            ),
          );
        }
        const rows = data ?? [];
        for (const row of rows) {
          if (!row.email) continue;
          const email = row.email.toLowerCase();
          if (seen.has(email)) continue;
          seen.add(email);
          if (needOptIn && row.marketing_opt_in !== true) continue;
          if (proSets && !userMatchesSegment(row.user_id, segment, proSets)) {
            continue;
          }
          if (existing.has(email)) continue;
          if (suppressed.has(email)) continue;
          if (sentElsewhere?.has(email)) continue;
          count += 1;
        }
        if (rows.length < PAGE) break;
      }
    } else {
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await audienceQuery(source).range(
          from,
          from + PAGE - 1,
        );
        if (error) {
          console.error("[email-campaign] Falha ao contar a origem", error);
          return next(
            createError(
              500,
              "campaign_error",
              "Não foi possível contar os elegíveis.",
            ),
          );
        }
        const rows = data ?? [];
        for (const row of rows) {
          if (existing.has(row.email)) continue;
          if (suppressed.has(row.email.toLowerCase())) continue;
          if (sentElsewhere?.has(row.email.toLowerCase())) continue;
          count += 1;
        }
        if (rows.length < PAGE) break;
      }
    }

    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/email-campaigns/audience-recipients: lista paginada dos
// elegiveis da origem (waitlist ou newsletter) pra UI de selecao, com busca
// por e-mail e flags de quem ja e recipient da campanha e de quem esta na
// supressao global (campaignId obrigatorio). Maximo 100 por pagina.
router.get("/audience-recipients", async (req, res, next) => {
  try {
    const campaignId =
      typeof req.query.campaignId === "string" ? req.query.campaignId : "";
    if (!campaignId) {
      return next(
        createError(400, "invalid_campaign", "campaignId é obrigatório."),
      );
    }
    const source =
      typeof req.query.source === "string" ? req.query.source : "waitlist";
    if (!isTableBackedSource(source) && source !== "users") {
      return next(
        createError(400, "invalid_source", "Origem inválida para seleção."),
      );
    }
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const rawLimit = parseInt(String(req.query.limit ?? ""), 10);
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100
        ? rawLimit
        : 50;
    const rawOffset = parseInt(String(req.query.offset ?? ""), 10);
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    let rows: Array<{ email: string; created_at: string; status: string }> =
      [];
    let total = 0;

    if (source === "users") {
      const rawSegment =
        typeof req.query.segment === "string" ? req.query.segment : "all";
      if (!USER_SEGMENTS.includes(rawSegment as UserSegment)) {
        return next(
          createError(400, "invalid_segment", "Segmento de usuários inválido."),
        );
      }
      const segment = rawSegment as UserSegment;
      const { data: campaign, error: campaignError } =
        await fetchCampaign(campaignId);
      if (campaignError) {
        console.error(
          "[email-campaign] Falha ao buscar campanha",
          campaignError,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível buscar a campanha.",
          ),
        );
      }
      if (!campaign) {
        return next(createError(404, "not_found", "Campanha não encontrada."));
      }
      const needOptIn = campaign.category === "promotional";
      const proSets =
        segment === "all" ? null : await fetchProStatusSets();

      // Filtro em memoria: segmento e opt-in por categoria nao sao
      // filtraveis via PostgREST (dependem de subscriptions). Na escala
      // atual (dezenas de usuarios) e barato; paginacao aplicada no slice.
      const searchLower = search.toLowerCase();
      const seen = new Set<string>();
      const filtered: Array<{
        email: string;
        created_at: string;
        status: string;
      }> = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("user_id, email, marketing_opt_in, created_at")
          .order("created_at", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[email-campaign] Falha ao listar usuários", error);
          return next(
            createError(
              500,
              "campaign_error",
              "Não foi possível listar os elegíveis.",
            ),
          );
        }
        const pageRows = data ?? [];
        for (const row of pageRows) {
          if (!row.email) continue;
          const email = row.email.toLowerCase();
          if (seen.has(email)) continue;
          seen.add(email);
          if (needOptIn && row.marketing_opt_in !== true) continue;
          if (proSets && !userMatchesSegment(row.user_id, segment, proSets)) {
            continue;
          }
          if (searchLower && !email.includes(searchLower)) continue;
          filtered.push({
            email: row.email,
            created_at: row.created_at,
            // TODO(Ana): rotulo de status do usuario na selecao.
            status: row.marketing_opt_in ? "opt_in" : "sem_opt_in",
          });
        }
        if (pageRows.length < PAGE) break;
      }
      total = filtered.length;
      rows = filtered.slice(offset, offset + limit);
    } else {
      let query = audienceQuery(source, true)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);
      if (search) {
        // Escapa curingas do LIKE pra busca literal.
        const escaped = search.replace(/[\\%_]/g, (match) => `\\${match}`);
        query = query.ilike("email", `%${escaped}%`);
      }

      const { data, error, count } = await query;
      if (error) {
        console.error("[email-campaign] Falha ao listar a origem", error);
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível listar os elegíveis.",
          ),
        );
      }
      rows = data ?? [];
      total = count ?? 0;
    }
    let recipientSet = new Set<string>();
    let suppressedSet = new Set<string>();
    if (rows.length > 0) {
      const emails = rows.map((row) => row.email);
      const [recipientsResult, suppressionsResult] = await Promise.all([
        supabaseAdmin
          .from("email_campaign_recipients")
          .select("email")
          .eq("campaign_id", campaignId)
          .in("email", emails),
        supabaseAdmin
          .from("email_suppressions")
          .select("email")
          .in(
            "email",
            emails.map((email) => email.toLowerCase()),
          ),
      ]);
      if (recipientsResult.error || suppressionsResult.error) {
        console.error(
          "[email-campaign] Falha ao verificar flags dos elegíveis",
          recipientsResult.error ?? suppressionsResult.error,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível verificar os destinatários da campanha.",
          ),
        );
      }
      recipientSet = new Set(
        (recipientsResult.data ?? []).map((row) => row.email),
      );
      suppressedSet = new Set(
        (suppressionsResult.data ?? []).map((row) => row.email),
      );
    }

    res.json({
      data: {
        items: rows.map((row) => ({
          email: row.email,
          created_at: row.created_at,
          status: row.status,
          already_recipient: recipientSet.has(row.email),
          suppressed: suppressedSet.has(row.email.toLowerCase()),
        })),
        pagination: { total, limit, offset },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/email-campaigns/:id: detalhe com contadores e lotes.
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await fetchCampaign(req.params.id);
    if (error) {
      console.error("[email-campaign] Falha ao buscar campanha", error);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar a campanha."),
      );
    }
    if (!data) {
      return next(createError(404, "not_found", "Campanha não encontrada."));
    }

    const { data: batches, error: batchesError } = await supabaseAdmin
      .from("email_campaign_batches")
      .select(BATCH_COLUMNS)
      .eq("campaign_id", req.params.id)
      .order("created_at", { ascending: true });
    if (batchesError) {
      console.error("[email-campaign] Falha ao buscar lotes", batchesError);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar os lotes."),
      );
    }

    const withCounts = await Promise.all(
      (batches ?? []).map(async (batch) => {
        if (batch.mode !== "selected") {
          return { ...batch, selected_count: null };
        }
        const { count, error: countError } = await supabaseAdmin
          .from("email_campaign_batch_recipients")
          .select("email", { count: "exact", head: true })
          .eq("batch_id", batch.id);
        // Erro na contagem vira null (desconhecido), nunca zero.
        return { ...batch, selected_count: countError ? null : count };
      }),
    );

    res.json({ data: { ...data, batches: withCounts } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/email-campaigns/:id: edita subject, body e image_url
// APENAS em draft. Campanha que ja iniciou envio nao e editavel: o historico
// do que foi enviado precisa refletir a verdade.
router.patch("/:id", async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body.trim() : "";
    if (!subject || !bodyText) {
      return next(
        createError(
          400,
          "invalid_campaign",
          "Assunto e corpo são obrigatórios.",
        ),
      );
    }

    let imageUrl: string | null = null;
    const rawImageUrl = body.image_url;
    if (
      rawImageUrl !== undefined &&
      rawImageUrl !== null &&
      rawImageUrl !== ""
    ) {
      if (
        typeof rawImageUrl !== "string" ||
        !isAllowedImageUrl(rawImageUrl.trim())
      ) {
        return next(
          createError(
            400,
            "invalid_image_url",
            "A imagem precisa ser uma URL https do Supabase Storage público do projeto.",
          ),
        );
      }
      imageUrl = rawImageUrl.trim();
    }

    const { data: campaign, error } = await fetchCampaign(req.params.id);
    if (error) {
      console.error("[email-campaign] Falha ao buscar campanha", error);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar a campanha."),
      );
    }
    if (!campaign) {
      return next(createError(404, "not_found", "Campanha não encontrada."));
    }
    if (campaign.status !== "draft") {
      return next(
        createError(
          409,
          "campaign_not_editable",
          "Campanha que já iniciou envio não pode ser editada.",
        ),
      );
    }

    const category = parseCategory(body.category);
    if (!category) {
      return next(
        createError(
          400,
          "invalid_category",
          "Categoria da campanha é obrigatória: produto ou promocional.",
        ),
      );
    }

    // CAS no update: se a campanha saiu de draft entre a checagem e o update
    // (disparo concorrente), nada e alterado.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("email_campaigns")
      .update({ subject, body: bodyText, image_url: imageUrl, category })
      .eq("id", req.params.id)
      .eq("status", "draft")
      .select(CAMPAIGN_COLUMNS)
      .maybeSingle();
    if (updateError) {
      console.error("[email-campaign] Falha ao editar campanha", updateError);
      return next(
        createError(500, "campaign_error", "Não foi possível editar a campanha."),
      );
    }
    if (!updated) {
      return next(
        createError(
          409,
          "campaign_not_editable",
          "Campanha que já iniciou envio não pode ser editada.",
        ),
      );
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/email-campaigns/:id: exclui APENAS draft puro (sem nenhum
// recipient sent). Campanha com envios fica permanente no historico.
router.delete("/:id", async (req, res, next) => {
  try {
    const { data: campaign, error } = await fetchCampaign(req.params.id);
    if (error) {
      console.error("[email-campaign] Falha ao buscar campanha", error);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar a campanha."),
      );
    }
    if (!campaign) {
      return next(createError(404, "not_found", "Campanha não encontrada."));
    }
    if (campaign.status !== "draft") {
      return next(
        createError(
          409,
          "campaign_not_deletable",
          "Campanha com envios fica no histórico e não pode ser excluída.",
        ),
      );
    }

    // Checagem defensiva do "draft puro": draft com sent nao deveria existir,
    // mas se existir o historico vence e a exclusao e negada.
    const { count: sentCount, error: sentError } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "sent");
    if (sentError) {
      console.error("[email-campaign] Falha ao contar enviados", sentError);
      return next(
        createError(500, "campaign_error", "Não foi possível excluir a campanha."),
      );
    }
    if ((sentCount ?? 0) > 0) {
      return next(
        createError(
          409,
          "campaign_not_deletable",
          "Campanha com envios fica no histórico e não pode ser excluída.",
        ),
      );
    }

    const { data: batches, error: batchesError } = await supabaseAdmin
      .from("email_campaign_batches")
      .select("id, status")
      .eq("campaign_id", campaign.id);
    if (batchesError) {
      console.error("[email-campaign] Falha ao buscar lotes", batchesError);
      return next(
        createError(500, "campaign_error", "Não foi possível excluir a campanha."),
      );
    }

    // Remove gatilhos agendados best-effort: se sobrar job no Redis, o
    // dispatch acha o batch deletado (CAS sem linha) e vira no-op.
    for (const batch of batches ?? []) {
      if (batch.status === "pending" && emailCampaignQueue) {
        try {
          await emailCampaignQueue.remove(batchJobId(batch.id));
        } catch (removeErr) {
          console.warn(
            "[email-campaign] Falha ao remover gatilho na exclusão",
            removeErr,
          );
        }
      }
    }

    // Filhos primeiro (FKs sem cascade): recipients, e-mails dos lotes, lotes
    // e por fim a campanha.
    const batchIds = (batches ?? []).map((batch) => batch.id);
    const { error: recipientsDeleteError } = await supabaseAdmin
      .from("email_campaign_recipients")
      .delete()
      .eq("campaign_id", campaign.id);
    if (recipientsDeleteError) {
      console.error(
        "[email-campaign] Falha ao excluir recipients",
        recipientsDeleteError,
      );
      return next(
        createError(500, "campaign_error", "Não foi possível excluir a campanha."),
      );
    }
    if (batchIds.length > 0) {
      const { error: batchRecipientsDeleteError } = await supabaseAdmin
        .from("email_campaign_batch_recipients")
        .delete()
        .in("batch_id", batchIds);
      if (batchRecipientsDeleteError) {
        console.error(
          "[email-campaign] Falha ao excluir e-mails dos lotes",
          batchRecipientsDeleteError,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível excluir a campanha.",
          ),
        );
      }
      const { error: batchesDeleteError } = await supabaseAdmin
        .from("email_campaign_batches")
        .delete()
        .eq("campaign_id", campaign.id);
      if (batchesDeleteError) {
        console.error(
          "[email-campaign] Falha ao excluir lotes",
          batchesDeleteError,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível excluir a campanha.",
          ),
        );
      }
    }
    const { error: campaignDeleteError } = await supabaseAdmin
      .from("email_campaigns")
      .delete()
      .eq("id", campaign.id);
    if (campaignDeleteError) {
      console.error(
        "[email-campaign] Falha ao excluir campanha",
        campaignDeleteError,
      );
      return next(
        createError(500, "campaign_error", "Não foi possível excluir a campanha."),
      );
    }

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

const RECIPIENT_STATUS_FILTERS = ["sent", "failed", "pending"];

// GET /api/admin/email-campaigns/:id/recipients: quem recebeu (ou vai
// receber), paginado com busca e filtro por status. Erro e erro (500), nunca
// colapsa em lista vazia.
router.get("/:id/recipients", async (req, res, next) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const rawStatus = req.query.status;
    let statusFilter: string | null = null;
    if (rawStatus !== undefined && rawStatus !== "") {
      if (
        typeof rawStatus !== "string" ||
        !RECIPIENT_STATUS_FILTERS.includes(rawStatus)
      ) {
        return next(
          createError(400, "invalid_status", "Filtro de status inválido."),
        );
      }
      statusFilter = rawStatus;
    }
    const rawLimit = parseInt(String(req.query.limit ?? ""), 10);
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100
        ? rawLimit
        : 50;
    const rawOffset = parseInt(String(req.query.offset ?? ""), 10);
    const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    let query = supabaseAdmin
      .from("email_campaign_recipients")
      .select("email, status, sent_at, error", { count: "exact" })
      .eq("campaign_id", req.params.id)
      .order("position", { ascending: true })
      .range(offset, offset + limit - 1);
    if (statusFilter) query = query.eq("status", statusFilter);
    if (search) {
      const escaped = search.replace(/[\\%_]/g, (match) => `\\${match}`);
      query = query.ilike("email", `%${escaped}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error(
        "[email-campaign] Falha ao listar destinatários",
        error,
      );
      return next(
        createError(
          500,
          "campaign_error",
          "Não foi possível listar os destinatários.",
        ),
      );
    }

    res.json({
      data: {
        items: data ?? [],
        pagination: { total: count ?? 0, limit, offset },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/email-campaigns/:id/test: envia UM e-mail de teste para o
// admin autenticado. E-mail vem do JWT, nunca do body. Nao altera status.
router.post("/:id/test", async (req, res, next) => {
  try {
    const preconditionError = sendPreconditionError(false);
    if (preconditionError) return next(preconditionError);

    if (!req.user?.email) {
      return next(
        createError(
          400,
          "admin_email_missing",
          "Seu token de acesso não tem e-mail. Refaça o login e tente de novo.",
        ),
      );
    }

    const { data: campaign, error } = await fetchCampaign(req.params.id);
    if (error) {
      console.error("[email-campaign] Falha ao buscar campanha", error);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar a campanha."),
      );
    }
    if (!campaign) {
      return next(createError(404, "not_found", "Campanha não encontrada."));
    }

    try {
      await sendCampaignEmail({
        to: req.user.email,
        subject: campaign.subject,
        body: campaign.body,
        imageUrl: campaign.image_url,
        unsubscribeUrl: buildCampaignUnsubscribeUrl(req.user.email),
      });
    } catch (sendErr) {
      console.error("[email-campaign] Falha no envio de teste", sendErr);
      return next(
        createError(
          502,
          "test_send_failed",
          sendErr instanceof Error
            ? sendErr.message
            : "Falha ao enviar o e-mail de teste.",
        ),
      );
    }

    res.json({ data: { sent: true, to: req.user.email } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/email-campaigns/:id/batches: cria um lote de envio.
// scheduledFor ausente = dispara agora; presente = grava pending no Postgres
// (fonte de verdade) e agenda o gatilho atrasado na fila.
router.post("/:id/batches", async (req, res, next) => {
  try {
    const preconditionError = sendPreconditionError(true);
    if (preconditionError) return next(preconditionError);
    if (!req.user) {
      return next(createError(401, "unauthorized", "Autenticação necessária."));
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    const rawSource = body.source ?? "waitlist";
    if (
      typeof rawSource !== "string" ||
      !BATCH_SOURCES.includes(rawSource as BatchSource)
    ) {
      return next(
        createError(400, "invalid_source", "Origem de destinatários inválida."),
      );
    }
    const source = rawSource as BatchSource;

    // Segmento so existe (e e obrigatorio) na origem users. A regra de
    // consentimento por categoria e imposta no dispatch.
    let userSegment: UserSegment | null = null;
    if (source === "users") {
      const rawSegment = body.userSegment;
      if (
        typeof rawSegment !== "string" ||
        !USER_SEGMENTS.includes(rawSegment as UserSegment)
      ) {
        return next(
          createError(
            400,
            "invalid_segment",
            "Segmento de usuários inválido.",
          ),
        );
      }
      userSegment = rawSegment as UserSegment;
    } else if (body.userSegment !== undefined && body.userSegment !== null) {
      return next(
        createError(
          400,
          "invalid_segment",
          "Segmento só se aplica à origem usuários.",
        ),
      );
    }

    const mode = body.mode;
    if (mode !== "next" && mode !== "selected") {
      return next(
        createError(400, "invalid_mode", "Modo de lote inválido."),
      );
    }
    // Lista avulsa e lista importada nao tem "proximos da fila": e sempre a
    // lista escolhida (modo selected).
    if ((source === "custom" || source === "contact_list") && mode !== "selected") {
      return next(
        createError(
          400,
          "invalid_mode",
          "Lista avulsa exige a lista de e-mails (modo selected).",
        ),
      );
    }

    let limit: number | null = null;
    if (mode === "next" && body.limit !== undefined && body.limit !== null) {
      if (
        typeof body.limit !== "number" ||
        !Number.isInteger(body.limit) ||
        body.limit < 1
      ) {
        return next(
          createError(
            400,
            "invalid_limit",
            "O limite precisa ser um número inteiro maior que zero.",
          ),
        );
      }
      limit = body.limit;
    }

    let emails: string[] = [];
    if (source === "contact_list") {
      // Emails resolvidos NO SERVER a partir dos membros validos da lista (nunca
      // confia numa lista de e-mails vinda do client). Cada lote pega ate 500
      // membros validos ainda nao incluidos nesta campanha; listas maiores usam
      // varios lotes. Supressao e consentimento sao reconsultados no dispatch.
      const contactListId =
        typeof body.contactListId === "string" ? body.contactListId : "";
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          contactListId,
        )
      ) {
        return next(
          createError(
            400,
            "missing_contact_list",
            "Selecione a lista de contatos.",
          ),
        );
      }
      const alreadyInCampaign =
        await fetchCampaignRecipientEmailSet(req.params.id);
      const picked = new Set<string>();
      for (let from = 0; ; from += 1000) {
        const { data: memberRows, error: membersError } = await supabaseAdmin
          .from("contact_list_members")
          .select("email")
          .eq("list_id", contactListId)
          .eq("status", "valid")
          .order("created_at", { ascending: true })
          .range(from, from + 999);
        if (membersError) {
          return next(
            createError(500, "db_error", "Erro ao ler a lista de contatos."),
          );
        }
        const rows = memberRows ?? [];
        for (const row of rows) {
          if (typeof row.email !== "string" || !row.email.trim()) continue;
          const email = row.email.trim().toLowerCase();
          if (alreadyInCampaign.has(email) || picked.has(email)) continue;
          picked.add(email);
          if (picked.size >= MAX_SELECTED_PER_BATCH) break;
        }
        if (rows.length < 1000 || picked.size >= MAX_SELECTED_PER_BATCH) break;
      }
      emails = Array.from(picked);
      if (emails.length === 0) {
        return next(
          createError(
            400,
            "no_eligible_members",
            // TODO(Ana)
            "Nenhum contato válido novo nesta lista para enviar.",
          ),
        );
      }
    } else if (mode === "selected") {
      if (!Array.isArray(body.emails) || body.emails.length === 0) {
        return next(
          createError(
            400,
            "invalid_emails",
            "Selecione ao menos um e-mail para o lote.",
          ),
        );
      }
      const normalized = new Set<string>();
      for (const raw of body.emails) {
        if (typeof raw !== "string" || !raw.trim()) {
          return next(
            createError(400, "invalid_emails", "Lista de e-mails inválida."),
          );
        }
        const email = raw.trim().toLowerCase();
        // Lista avulsa e a unica origem sem tabela por tras: valida o formato
        // aqui (picker de waitlist/newsletter ja vem de dados validados).
        if (
          source === "custom" &&
          (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))
        ) {
          return next(
            createError(
              400,
              "invalid_emails",
              `E-mail inválido na lista: ${email.slice(0, 80)}`,
            ),
          );
        }
        normalized.add(email);
      }
      emails = Array.from(normalized);
      if (emails.length > MAX_SELECTED_PER_BATCH) {
        return next(
          createError(
            400,
            "too_many_emails",
            `Máximo de ${MAX_SELECTED_PER_BATCH} e-mails por lote.`,
          ),
        );
      }
    }

    let excludeOtherCampaigns = false;
    if (
      body.excludeOtherCampaigns !== undefined &&
      body.excludeOtherCampaigns !== null
    ) {
      if (typeof body.excludeOtherCampaigns !== "boolean") {
        return next(
          createError(
            400,
            "invalid_exclude_flag",
            "excludeOtherCampaigns precisa ser booleano.",
          ),
        );
      }
      excludeOtherCampaigns = body.excludeOtherCampaigns;
    }

    let scheduledFor: string | null = null;
    if (
      body.scheduledFor !== undefined &&
      body.scheduledFor !== null &&
      body.scheduledFor !== ""
    ) {
      if (typeof body.scheduledFor !== "string") {
        return next(
          createError(400, "invalid_schedule", "Data de agendamento inválida."),
        );
      }
      const timestamp = new Date(body.scheduledFor).getTime();
      if (!Number.isFinite(timestamp)) {
        return next(
          createError(400, "invalid_schedule", "Data de agendamento inválida."),
        );
      }
      const now = Date.now();
      if (timestamp < now - SCHEDULE_PAST_TOLERANCE_MS) {
        return next(
          createError(
            400,
            "invalid_schedule",
            "O agendamento precisa ser no futuro.",
          ),
        );
      }
      if (timestamp > now + SCHEDULE_MAX_AHEAD_MS) {
        return next(
          createError(
            400,
            "invalid_schedule",
            "O agendamento pode ser de no máximo 30 dias à frente.",
          ),
        );
      }
      scheduledFor = new Date(timestamp).toISOString();
    }

    const campaignId = req.params.id;
    const { data: campaign, error: campaignError } =
      await fetchCampaign(campaignId);
    if (campaignError) {
      console.error("[email-campaign] Falha ao buscar campanha", campaignError);
      return next(
        createError(500, "campaign_error", "Não foi possível buscar a campanha."),
      );
    }
    if (!campaign) {
      return next(createError(404, "not_found", "Campanha não encontrada."));
    }
    if (campaign.status !== "draft" && campaign.status !== "sending") {
      return next(
        createError(
          409,
          "campaign_finished",
          "Esta campanha já foi finalizada.",
        ),
      );
    }

    const { data: batch, error: batchError } = await supabaseAdmin
      .from("email_campaign_batches")
      .insert({
        campaign_id: campaignId,
        mode,
        batch_limit: limit,
        exclude_other_campaigns: excludeOtherCampaigns,
        source,
        user_segment: userSegment,
        scheduled_for: scheduledFor,
        created_by: req.user.id,
      })
      .select(BATCH_COLUMNS)
      .single();
    if (batchError) {
      console.error("[email-campaign] Falha ao criar lote", batchError);
      return next(
        createError(500, "campaign_error", "Não foi possível criar o lote."),
      );
    }

    if (mode === "selected") {
      const { error: recipientsError } = await supabaseAdmin
        .from("email_campaign_batch_recipients")
        .insert(emails.map((email) => ({ batch_id: batch.id, email })));
      if (recipientsError) {
        console.error(
          "[email-campaign] Falha ao gravar e-mails do lote",
          recipientsError,
        );
        // Lote sem os e-mails gravados nao pode ficar pending (dispararia
        // vazio): cancela antes de reportar o erro.
        await cancelBatchWithCleanup(batch.id);
        return next(
          createError(500, "campaign_error", "Não foi possível criar o lote."),
        );
      }
    }

    if (!scheduledFor) {
      try {
        const result = await dispatchCampaignBatch(batch.id);
        const { data: fresh } = await fetchCampaign(campaignId);
        res.json({
          data: {
            scheduled: false,
            enqueued: result.enqueued,
            batch: { ...batch, status: "dispatched" },
            campaign: fresh ?? campaign,
          },
        });
      } catch (dispatchErr) {
        console.error(
          "[email-campaign] Falha ao disparar lote imediato",
          dispatchErr,
        );
        // Sem cancelar, o batch pending seria disparado pela reconciliacao no
        // proximo boot, surpreendendo o admin que viu erro aqui. A limpeza
        // dentro do helper remove os pending que o dispatch chegou a inserir
        // (causa raiz do incidente dos 100 e-mails).
        await cancelBatchWithCleanup(batch.id);
        return next(
          createError(
            502,
            "batch_dispatch_failed",
            "Falha ao disparar o lote. Nenhum lote ficou ativo, tente de novo.",
          ),
        );
      }
      return;
    }

    try {
      await scheduleBatchDispatchJob(batch.id, scheduledFor);
    } catch (scheduleErr) {
      console.error("[email-campaign] Falha ao agendar lote", scheduleErr);
      await cancelBatchWithCleanup(batch.id);
      return next(
        createError(
          502,
          "batch_schedule_failed",
          "Falha ao agendar o lote. Nada foi agendado, tente de novo.",
        ),
      );
    }

    res.json({ data: { scheduled: true, batch } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/email-campaigns/:id/batches/:batchId: cancela lote pending.
router.delete("/:id/batches/:batchId", async (req, res, next) => {
  try {
    const { data: canceled, error } = await supabaseAdmin
      .from("email_campaign_batches")
      .update({ status: "canceled" })
      .eq("id", req.params.batchId)
      .eq("campaign_id", req.params.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[email-campaign] Falha ao cancelar lote", error);
      return next(
        createError(500, "campaign_error", "Não foi possível cancelar o lote."),
      );
    }
    if (!canceled) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("email_campaign_batches")
        .select("id, status")
        .eq("id", req.params.batchId)
        .eq("campaign_id", req.params.id)
        .maybeSingle();
      if (existingError) {
        console.error(
          "[email-campaign] Falha ao buscar lote",
          existingError,
        );
        return next(
          createError(500, "campaign_error", "Não foi possível buscar o lote."),
        );
      }
      if (!existing) {
        return next(createError(404, "not_found", "Lote não encontrado."));
      }
      return next(
        createError(
          409,
          "batch_not_pending",
          "Este lote já foi disparado ou cancelado.",
        ),
      );
    }

    // Remove o gatilho atrasado. Best-effort: se falhar (Redis fora, job
    // ativo), o CAS acima ja garante que o gatilho remanescente vira no-op.
    if (emailCampaignQueue) {
      try {
        await emailCampaignQueue.remove(batchJobId(req.params.batchId));
      } catch (removeErr) {
        console.warn(
          "[email-campaign] Falha ao remover gatilho do lote cancelado",
          removeErr,
        );
      }
    }

    // Limpa os pending que o lote inseriu e reavalia a campanha (fechamento
    // ou volta pra draft) na mesma RPC.
    try {
      await cleanupCanceledBatch(req.params.batchId);
    } catch (cleanupErr) {
      console.error(
        "[email-campaign] Falha na limpeza apos cancelamento",
        cleanupErr,
      );
    }

    res.json({ data: { canceled: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
