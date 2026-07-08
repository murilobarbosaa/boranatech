import { Router } from "express";

import { sendCampaignEmail } from "../lib/email";
import {
  emailCampaignQueue,
  enqueueCampaignRecipients,
} from "../lib/emailCampaignQueue";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  buildWaitlistUnsubscribeUrl,
  waitlistUnsubscribeReady,
} from "../lib/waitlistUnsubscribe";
import { createError } from "../middleware/error";

// Montado DENTRO de server/routes/admin.ts, DEPOIS de requireAuth/requireAdmin
// (fail-closed: qualquer coisa que nao seja admin confirmado ja levou 401/403
// antes de chegar aqui). Nao montar este router em outro lugar sem os guards.
const router = Router();

const CAMPAIGN_COLUMNS =
  "id, subject, body, image_url, status, total_recipients, sent_count, failed_count, created_by, created_at, started_at, completed_at";

// Status da waitlist elegiveis pra receber campanha. Nunca 'unsubscribed'.
const ELIGIBLE_WAITLIST_STATUSES = ["pending", "notified"];

const PAGE_SIZE = 1000;

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

// Pre-requisitos de envio (teste ou massa). Checa ANTES de qualquer mutacao
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

    if (!req.user) {
      return next(createError(401, "unauthorized", "Autenticação necessária."));
    }

    const { data, error } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        subject,
        body: bodyText,
        image_url: imageUrl,
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

// GET /api/admin/email-campaigns/waitlist-count: total de elegiveis pro modal
// de confirmacao. Erro e erro (500), nunca colapsa em zero.
router.get("/waitlist-count", async (_req, res, next) => {
  try {
    const { count, error } = await supabaseAdmin
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .in("status", ELIGIBLE_WAITLIST_STATUSES);
    if (error || count === null) {
      console.error("[email-campaign] Falha ao contar waitlist", error);
      return next(
        createError(
          500,
          "campaign_error",
          "Não foi possível contar a waitlist.",
        ),
      );
    }
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/email-campaigns/:id: detalhe com contadores pro polling.
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
    res.json({ data });
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
        unsubscribeUrl: buildWaitlistUnsubscribeUrl(req.user.email),
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

// Busca ids dos recipients pending em ordem de posicao, paginando (o PostgREST
// corta em 1000 linhas por resposta). limit null = todos.
async function fetchPendingRecipientIds(
  campaignId: string,
  limit: number | null,
): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const remaining = limit === null ? PAGE_SIZE : limit - ids.length;
    if (remaining <= 0) break;
    const to = from + Math.min(PAGE_SIZE, remaining) - 1;
    const { data, error } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(`Falha ao buscar destinatários: ${error.message}`);
    }
    const rows = data ?? [];
    ids.push(...rows.map((row) => row.id));
    if (rows.length < to - from + 1) break;
  }
  return ids;
}

// POST /api/admin/email-campaigns/:id/send: dispara (ou continua) o envio.
// Body opcional { limit }: enfileira so os proximos N pendings, permitindo
// enviar 100 hoje e o restante amanha.
router.post("/:id/send", async (req, res, next) => {
  try {
    const preconditionError = sendPreconditionError(true);
    if (preconditionError) return next(preconditionError);

    const body = (req.body ?? {}) as Record<string, unknown>;
    let limit: number | null = null;
    if (body.limit !== undefined && body.limit !== null) {
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

    let startedNow = false;
    if (campaign.status === "draft") {
      // Snapshot dos elegiveis em ordem de created_at da waitlist. Paginado:
      // o PostgREST corta em 1000 linhas por resposta.
      const emails: string[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabaseAdmin
          .from("waitlist")
          .select("email")
          .in("status", ELIGIBLE_WAITLIST_STATUSES)
          .order("created_at", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (error) {
          console.error("[email-campaign] Falha ao buscar waitlist", error);
          return next(
            createError(
              500,
              "campaign_error",
              "Não foi possível buscar a waitlist.",
            ),
          );
        }
        const rows = data ?? [];
        emails.push(...rows.map((row) => row.email));
        if (rows.length < PAGE_SIZE) break;
      }

      if (emails.length === 0) {
        return next(
          createError(
            409,
            "no_recipients",
            "Nenhum destinatário elegível na waitlist.",
          ),
        );
      }

      // Upsert com ignoreDuplicates: re-disparo apos falha parcial do seed nao
      // duplica nem quebra no unique (campaign_id, email).
      const rows = emails.map((email, index) => ({
        campaign_id: campaignId,
        email,
        position: index + 1,
      }));
      const CHUNK = 500;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabaseAdmin
          .from("email_campaign_recipients")
          .upsert(rows.slice(i, i + CHUNK), {
            onConflict: "campaign_id,email",
            ignoreDuplicates: true,
          });
        if (error) {
          console.error(
            "[email-campaign] Falha ao inserir destinatários",
            error,
          );
          return next(
            createError(
              500,
              "campaign_error",
              "Não foi possível preparar os destinatários.",
            ),
          );
        }
      }

      // CAS draft -> sending: disparo concorrente nao seta started_at duas
      // vezes nem sobrescreve total_recipients.
      const { error: updateError } = await supabaseAdmin
        .from("email_campaigns")
        .update({
          status: "sending",
          total_recipients: emails.length,
          started_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
        .eq("status", "draft");
      if (updateError) {
        console.error(
          "[email-campaign] Falha ao marcar campanha como sending",
          updateError,
        );
        return next(
          createError(
            500,
            "campaign_error",
            "Não foi possível iniciar a campanha.",
          ),
        );
      }
      startedNow = true;
    }

    let recipientIds: string[];
    try {
      recipientIds = await fetchPendingRecipientIds(campaignId, limit);
      await enqueueCampaignRecipients(campaignId, recipientIds);
    } catch (enqueueErr) {
      console.error("[email-campaign] Falha ao enfileirar", enqueueErr);
      // Campanha recem-transicionada e sem nenhum resultado registrado volta
      // pra draft: enfileiramento falhou, a campanha NAO muda de status na
      // pratica. Best-effort (condicoes evitam desfazer progresso real).
      if (startedNow) {
        await supabaseAdmin
          .from("email_campaigns")
          .update({ status: "draft", total_recipients: null, started_at: null })
          .eq("id", campaignId)
          .eq("status", "sending")
          .eq("sent_count", 0)
          .eq("failed_count", 0);
      }
      return next(
        createError(
          502,
          "enqueue_failed",
          "Falha ao enfileirar os envios. Nada foi disparado, tente de novo.",
        ),
      );
    }

    const { data: fresh } = await fetchCampaign(campaignId);
    res.json({
      data: {
        campaign: fresh ?? campaign,
        enqueued: recipientIds.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
