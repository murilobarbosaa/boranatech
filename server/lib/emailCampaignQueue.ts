import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import { sendCampaignEmail } from "./email";
import { batchJobId, recipientJobId } from "./emailCampaignJobIds";
import { env } from "./env";
import { queueConnection } from "./redis";
import { supabaseAdmin } from "./supabaseAdmin";
import { buildWaitlistUnsubscribeUrl } from "./waitlistUnsubscribe";

// Dois tipos de job na mesma fila: envio de UM destinatario e gatilho de
// dispatch de um lote (imediato ou agendado via delay). O gatilho passa pelo
// mesmo limiter dos envios; atraso de segundos no disparo de um lote e
// aceitavel e mantem uma fila so.
export type EmailCampaignSendJobData = {
  campaignId: string;
  recipientId: string;
};

export type EmailCampaignBatchJobData = {
  batchId: string;
};

export type EmailCampaignJobData =
  | EmailCampaignSendJobData
  | EmailCampaignBatchJobData;

// Status da waitlist elegiveis pra receber campanha. Nunca 'unsubscribed'.
export const ELIGIBLE_WAITLIST_STATUSES = ["pending", "notified"];

const QUEUE_NAME = "email-campaign";
const CAMPAIGN_ATTEMPTS = 3;
const DB_PAGE = 1000;

export const emailCampaignQueue = queueConnection
  ? new Queue<EmailCampaignJobData>(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: CAMPAIGN_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    })
  : null;

// Enfileira um job por destinatario. jobId deterministico (id do recipient):
// re-disparo ou heal da reconciliacao nao duplica job de quem ja esta na fila.
// SEM fallback de envio direto (diferente do enqueueEmail dos transacionais,
// de proposito): envio em massa fora da fila furaria o rate limit do Resend.
// Redis fora ou add falhando = erro propagado, visivel pro admin.
export async function enqueueCampaignRecipients(
  campaignId: string,
  recipientIds: string[],
) {
  if (!emailCampaignQueue) {
    throw new Error("Fila email-campaign indisponivel (REDIS_URL ausente).");
  }
  const CHUNK = 500;
  for (let i = 0; i < recipientIds.length; i += CHUNK) {
    const chunk = recipientIds.slice(i, i + CHUNK);
    await emailCampaignQueue.addBulk(
      chunk.map((recipientId) => ({
        name: "send",
        data: { campaignId, recipientId },
        opts: { jobId: recipientJobId(recipientId) },
      })),
    );
  }
}

// Gatilho do lote: job atrasado com jobId deterministico batch-{id}. Se o job
// ainda existir no Redis (delayed/waiting), o add e no-op, entao a
// reconciliacao no boot pode chamar isto pra todo batch pending sem duplicar.
export async function scheduleBatchDispatchJob(
  batchId: string,
  scheduledFor: string | null,
) {
  if (!emailCampaignQueue) {
    throw new Error("Fila email-campaign indisponivel (REDIS_URL ausente).");
  }
  const delay = scheduledFor
    ? Math.max(new Date(scheduledFor).getTime() - Date.now(), 0)
    : 0;
  await emailCampaignQueue.add(
    "dispatch-batch",
    { batchId },
    { jobId: batchJobId(batchId), delay },
  );
}

export async function tryCompleteCampaign(campaignId: string) {
  const { error } = await supabaseAdmin.rpc("email_campaign_try_complete", {
    p_campaign_id: campaignId,
  });
  if (error) {
    throw new Error(
      `Falha ao verificar fechamento da campanha: ${error.message}`,
    );
  }
}

async function fetchCampaignRecipientEmailSet(
  campaignId: string,
): Promise<Set<string>> {
  const emails = new Set<string>();
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("email")
      .eq("campaign_id", campaignId)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(
        `Falha ao buscar destinatarios da campanha: ${error.message}`,
      );
    }
    const rows = data ?? [];
    rows.forEach((row) => emails.add(row.email));
    if (rows.length < DB_PAGE) break;
  }
  return emails;
}

// mode 'next': proximos N elegiveis da waitlist em ordem de cadastro,
// excluindo quem ja e recipient da campanha. limit null = todos os restantes.
async function selectNextEligibleEmails(
  campaignId: string,
  limit: number | null,
): Promise<string[]> {
  const existing = await fetchCampaignRecipientEmailSet(campaignId);
  const selected: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .select("email")
      .in("status", ELIGIBLE_WAITLIST_STATUSES)
      .order("created_at", { ascending: true })
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar waitlist: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (existing.has(row.email)) continue;
      selected.push(row.email);
      if (limit !== null && selected.length >= limit) return selected;
    }
    if (rows.length < DB_PAGE) break;
  }
  return selected;
}

// mode 'selected': e-mails escolhidos a dedo, com elegibilidade revalidada NA
// HORA do dispatch (quem se descadastrou entre o agendamento e o disparo nao
// recebe), excluindo quem ja e recipient da campanha.
async function selectBatchEligibleEmails(
  campaignId: string,
  batchId: string,
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("email_campaign_batch_recipients")
    .select("email")
    .eq("batch_id", batchId)
    .limit(DB_PAGE);
  if (error) {
    throw new Error(`Falha ao buscar e-mails do lote: ${error.message}`);
  }
  const wanted = (data ?? []).map((row) => row.email);
  if (wanted.length === 0) return [];

  const existing = await fetchCampaignRecipientEmailSet(campaignId);
  const eligible = new Set<string>();
  const CHUNK = 100;
  for (let i = 0; i < wanted.length; i += CHUNK) {
    const chunk = wanted.slice(i, i + CHUNK);
    const { data: rows, error: waitlistError } = await supabaseAdmin
      .from("waitlist")
      .select("email")
      .in("status", ELIGIBLE_WAITLIST_STATUSES)
      .in("email", chunk);
    if (waitlistError) {
      throw new Error(
        `Falha ao validar elegibilidade do lote: ${waitlistError.message}`,
      );
    }
    (rows ?? []).forEach((row) => eligible.add(row.email));
  }
  return wanted.filter(
    (email) => eligible.has(email) && !existing.has(email),
  );
}

async function fetchBatchPendingRecipientIds(
  batchId: string,
): Promise<{ any: boolean; pendingIds: string[] }> {
  let any = false;
  const pendingIds: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("id, status")
      .eq("batch_id", batchId)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(
        `Falha ao buscar destinatarios do lote: ${error.message}`,
      );
    }
    const rows = data ?? [];
    if (rows.length > 0) any = true;
    rows.forEach((row) => {
      if (row.status === "pending") pendingIds.push(row.id);
    });
    if (rows.length < DB_PAGE) break;
  }
  return { any, pendingIds };
}

// Dispatch de um lote: funcao unica usada pelo envio imediato (rota), pelo
// gatilho agendado (worker) e pela reconciliacao no boot.
export async function dispatchCampaignBatch(
  batchId: string,
): Promise<{ dispatched: boolean; enqueued: number }> {
  // CAS pending -> dispatched PRIMEIRO: gatilho duplicado (job reentregue,
  // reconciliacao concorrente) vira no-op aqui.
  const { data: batch, error: casError } = await supabaseAdmin
    .from("email_campaign_batches")
    .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
    .eq("id", batchId)
    .eq("status", "pending")
    .select("id, campaign_id, mode, batch_limit")
    .maybeSingle();
  if (casError) {
    throw new Error(`Falha ao marcar lote como dispatched: ${casError.message}`);
  }
  if (!batch) {
    return { dispatched: false, enqueued: 0 };
  }

  try {
    // Retomada idempotente: se uma tentativa anterior ja inseriu recipients
    // deste lote (a insercao via RPC e atomica, tudo ou nada) e falhou no
    // enfileiramento, NAO seleciona de novo (selecionar de novo mandaria pra
    // outros N alem dos ja inseridos). So reenfileira os pendentes do lote.
    const previous = await fetchBatchPendingRecipientIds(batch.id);
    if (previous.any) {
      if (previous.pendingIds.length > 0) {
        await enqueueCampaignRecipients(batch.campaign_id, previous.pendingIds);
      }
      return { dispatched: true, enqueued: previous.pendingIds.length };
    }

    const emails =
      batch.mode === "selected"
        ? await selectBatchEligibleEmails(batch.campaign_id, batch.id)
        : await selectNextEligibleEmails(
            batch.campaign_id,
            batch.batch_limit ?? null,
          );

    if (emails.length === 0) {
      // Nada novo a inserir. Este lote pode ter sido o ultimo pending
      // segurando o fechamento da campanha.
      await tryCompleteCampaign(batch.campaign_id);
      return { dispatched: true, enqueued: 0 };
    }

    const { data: inserted, error: insertError } = await supabaseAdmin.rpc(
      "email_campaign_add_recipients",
      {
        p_campaign_id: batch.campaign_id,
        p_batch_id: batch.id,
        p_emails: emails,
      },
    );
    if (insertError) {
      throw new Error(
        `Falha ao inserir destinatarios do lote: ${insertError.message}`,
      );
    }
    const rows = (inserted ?? []) as Array<{
      recipient_id: string;
      recipient_email: string;
    }>;
    if (rows.length === 0) {
      await tryCompleteCampaign(batch.campaign_id);
      return { dispatched: true, enqueued: 0 };
    }

    await enqueueCampaignRecipients(
      batch.campaign_id,
      rows.map((row) => row.recipient_id),
    );
    return { dispatched: true, enqueued: rows.length };
  } catch (err) {
    // Devolve o lote pra pending: sem isto, o retry do BullMQ bateria no CAS
    // ja-dispatched e viraria no-op silencioso, perdendo o lote. Com a
    // retomada idempotente acima, o retry nao re-seleciona nem duplica.
    const { error: revertError } = await supabaseAdmin
      .from("email_campaign_batches")
      .update({ status: "pending", dispatched_at: null })
      .eq("id", batchId)
      .eq("status", "dispatched");
    if (revertError) {
      console.error(
        `[email-campaign] Falha ao devolver lote ${batchId} pra pending:`,
        revertError,
      );
      Sentry.captureException(revertError);
    }
    throw err;
  }
}

// Reconciliacao no boot: Postgres e a fonte de verdade do agendamento. Recria
// o gatilho de todo batch pending (jobId deterministico evita duplicata se o
// job sobreviveu no Redis; scheduled_for no passado vira delay 0 e dispara ja)
// e reenfileira recipients pending de campanhas sending (heal de crash entre
// insercao e enfileiramento; jobId por recipient tambem dedupa).
export async function reconcileEmailCampaignBatches() {
  if (!emailCampaignQueue) {
    console.warn(
      "[email-campaign] REDIS_URL ausente. Reconciliacao de lotes pulada.",
    );
    return;
  }

  const { data: batches, error } = await supabaseAdmin
    .from("email_campaign_batches")
    .select("id, scheduled_for")
    .eq("status", "pending");
  if (error) {
    console.error(
      "[email-campaign] Falha ao buscar lotes pending na reconciliacao:",
      error,
    );
    Sentry.captureException(new Error(error.message));
    return;
  }
  for (const batch of batches ?? []) {
    try {
      await scheduleBatchDispatchJob(batch.id, batch.scheduled_for);
    } catch (err) {
      console.error(
        `[email-campaign] Falha ao reagendar lote ${batch.id}:`,
        err,
      );
      Sentry.captureException(err);
    }
  }

  const { data: sendingCampaigns, error: campaignsError } = await supabaseAdmin
    .from("email_campaigns")
    .select("id")
    .eq("status", "sending");
  if (campaignsError) {
    console.error(
      "[email-campaign] Falha ao buscar campanhas sending na reconciliacao:",
      campaignsError,
    );
    return;
  }
  for (const campaign of sendingCampaigns ?? []) {
    try {
      const pendingIds: string[] = [];
      for (let from = 0; ; from += DB_PAGE) {
        const { data, error: pendingError } = await supabaseAdmin
          .from("email_campaign_recipients")
          .select("id")
          .eq("campaign_id", campaign.id)
          .eq("status", "pending")
          .order("position", { ascending: true })
          .range(from, from + DB_PAGE - 1);
        if (pendingError) {
          throw new Error(pendingError.message);
        }
        const rows = data ?? [];
        pendingIds.push(...rows.map((row) => row.id));
        if (rows.length < DB_PAGE) break;
      }
      if (pendingIds.length > 0) {
        await enqueueCampaignRecipients(campaign.id, pendingIds);
      }
    } catch (err) {
      console.error(
        `[email-campaign] Falha no heal de recipients da campanha ${campaign.id}:`,
        err,
      );
      Sentry.captureException(err);
    }
  }
}

async function recordResult(
  recipientId: string,
  success: boolean,
  errorMessage: string | null,
) {
  const { error } = await supabaseAdmin.rpc("email_campaign_record_result", {
    p_recipient_id: recipientId,
    p_success: success,
    p_error: errorMessage,
  });
  if (error) {
    throw new Error(`Falha ao registrar resultado do envio: ${error.message}`);
  }
}

async function processRecipientJob(job: Job<EmailCampaignJobData>) {
  const { campaignId, recipientId } = job.data as EmailCampaignSendJobData;

  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select("id, email, status")
    .eq("id", recipientId)
    .maybeSingle();
  if (recipientError) {
    throw new Error(`Falha ao buscar destinatario: ${recipientError.message}`);
  }
  if (!recipient) {
    console.warn(
      `[email-campaign] Destinatario ${recipientId} nao encontrado, ignorando job`,
    );
    return;
  }
  // Idempotencia: ja resolvido (sent ou failed definitivo) e no-op.
  if (recipient.status !== "pending") {
    return;
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("email_campaigns")
    .select("id, subject, body, image_url")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) {
    throw new Error(`Falha ao buscar campanha: ${campaignError.message}`);
  }
  if (!campaign) {
    throw new Error(`Campanha ${campaignId} nao encontrada.`);
  }

  const unsubscribeUrl = buildWaitlistUnsubscribeUrl(recipient.email);
  await sendCampaignEmail({
    to: recipient.email,
    subject: campaign.subject,
    body: campaign.body,
    imageUrl: campaign.image_url,
    unsubscribeUrl,
  });

  // RPC falhando DEPOIS do envio: rethrow deixa o BullMQ tentar de novo e o
  // retry reenvia o e-mail (destinatario segue pending). Trade-off consciente:
  // duplicar num blip transitorio de banco e melhor que travar o contador e a
  // campanha pra sempre.
  await recordResult(recipientId, true, null);
}

async function processCampaignJob(job: Job<EmailCampaignJobData>) {
  if ("batchId" in job.data) {
    await dispatchCampaignBatch(job.data.batchId);
    return;
  }
  await processRecipientJob(job);
}

export function createEmailCampaignWorker() {
  if (!queueConnection) {
    console.warn(
      "[email-campaign] REDIS_URL ausente. Worker de campanha não iniciado.",
    );
    return null;
  }

  const worker = new Worker<EmailCampaignJobData>(
    QUEUE_NAME,
    processCampaignJob,
    {
      connection: queueConnection,
      // Um envio por vez, no maximo 1 job a cada EMAIL_CAMPAIGN_RATE_MS
      // (default 1000ms): o Resend limita a 2 req/s e a fila de transacionais
      // ja consome parte desse orcamento.
      concurrency: 1,
      limiter: {
        max: 1,
        duration: env.emailCampaignRateMs,
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[email-campaign] Job ${job.id} concluído`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[email-campaign] Job ${job?.id} falhou:`, err.message);
    Sentry.withScope((scope) => {
      scope.setTag("jobName", QUEUE_NAME);
      scope.setTag("jobId", String(job?.id ?? "unknown"));
      Sentry.captureException(err);
    });
    if (!job) return;
    // Gatilho de lote: o dispatch ja devolveu o batch pra pending no erro;
    // retry do BullMQ e reconciliacao no boot cuidam do resto. Nao ha
    // recipient pra marcar como failed.
    if ("batchId" in job.data) return;
    // failed definitivo SO depois de esgotar as tentativas (attempts 3 com
    // backoff exponencial). Antes disso o BullMQ reagenda e o recipient segue
    // pending. Erro nunca colapsa em sucesso.
    const maxAttempts =
      typeof job.opts.attempts === "number"
        ? job.opts.attempts
        : CAMPAIGN_ATTEMPTS;
    if (job.attemptsMade >= maxAttempts) {
      void recordResult(
        job.data.recipientId,
        false,
        err.message.slice(0, 500),
      ).catch((rpcErr) => {
        console.error(
          `[email-campaign] Falha ao marcar recipient como failed:`,
          rpcErr,
        );
        Sentry.captureException(rpcErr);
      });
    }
  });

  worker.on("error", (err) => {
    console.error("[email-campaign] Erro no worker:", err.message);
  });

  return worker;
}
