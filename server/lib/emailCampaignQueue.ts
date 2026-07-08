import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import { sendCampaignEmail } from "./email";
import { env } from "./env";
import { queueConnection } from "./redis";
import { supabaseAdmin } from "./supabaseAdmin";
import { buildWaitlistUnsubscribeUrl } from "./waitlistUnsubscribe";

export type EmailCampaignJobData = {
  campaignId: string;
  recipientId: string;
};

const QUEUE_NAME = "email-campaign";
const CAMPAIGN_ATTEMPTS = 3;

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
// re-disparo do send nao duplica job de quem ja esta na fila. SEM fallback de
// envio direto (diferente do enqueueEmail dos transacionais, de proposito):
// envio em massa fora da fila furaria o rate limit do Resend. Redis fora ou
// add falhando = erro propagado pra rota, visivel pro admin.
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
        opts: { jobId: `ecr:${recipientId}` },
      })),
    );
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

async function processCampaignJob(job: Job<EmailCampaignJobData>) {
  const { campaignId, recipientId } = job.data;

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
          `[email-campaign] Falha ao marcar recipient ${job.data.recipientId} como failed:`,
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
