import { Queue, Worker, type Job } from "bullmq";

import type { Gender } from "../../shared/gender";
import { queueConnection } from "./redis";
import {
  sendCancellationEmail,
  sendCancellationScheduledEmail,
  sendNewsletterConfirmEmail,
  sendNewsletterWelcomeEmail,
  sendPaymentFailedEmail,
  sendProUpgradeEmail,
  sendWaitlistConfirmationEmail,
  sendWelcomeEmail,
} from "./email";

type Recipient = { to: string; name: string; gender?: Gender | null };

export type EmailJobData =
  | ({ type: "welcome" } & Recipient)
  | ({ type: "pro_upgrade"; planName: string } & Recipient)
  | ({ type: "cancellation" } & Recipient)
  | ({ type: "cancellation_scheduled"; effectiveAt: string } & Recipient)
  | ({ type: "payment_failed" } & Recipient)
  | ({ type: "waitlist_confirmation" } & Recipient)
  | { type: "newsletter_confirm"; to: string; confirmUrl: string }
  | { type: "newsletter_welcome"; to: string; unsubscribeUrl: string };

// Re-export de compatibilidade: os throttles de waitlist/newsletter/affiliates
// importam redisConnection daqui. E a conexao de FILA (offline queue ligada);
// migra-los para a cacheConnection fica para uma fase futura.
export const redisConnection = queueConnection;

export const emailQueue = redisConnection
  ? new Queue<EmailJobData>("emails", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  : null;

async function sendDirect(data: EmailJobData) {
  switch (data.type) {
    case "welcome":
      await sendWelcomeEmail(data.to, data.name, data.gender);
      break;
    case "pro_upgrade":
      await sendProUpgradeEmail(data.to, data.name, data.planName, data.gender);
      break;
    case "cancellation":
      await sendCancellationEmail(data.to, data.name, data.gender);
      break;
    case "cancellation_scheduled":
      await sendCancellationScheduledEmail(
        data.to,
        data.name,
        data.effectiveAt,
        data.gender,
      );
      break;
    case "payment_failed":
      await sendPaymentFailedEmail(data.to, data.name, data.gender);
      break;
    case "waitlist_confirmation":
      await sendWaitlistConfirmationEmail(data.to, data.name);
      break;
    case "newsletter_confirm":
      await sendNewsletterConfirmEmail(data.to, data.confirmUrl);
      break;
    case "newsletter_welcome":
      await sendNewsletterWelcomeEmail(data.to, data.unsubscribeUrl);
      break;
  }
}

export function createEmailWorker() {
  if (!redisConnection) {
    console.warn("[queue] REDIS_URL ausente. Worker de e-mail não iniciado.");
    return null;
  }

  const worker = new Worker<EmailJobData>(
    "emails",
    async (job: Job<EmailJobData>) => {
      const data = job.data;
      console.log(`[queue] Processando job ${job.id} tipo ${data.type}`);
      await sendDirect(data);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[queue] Job ${job.id} (${job.data.type}) concluído`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[queue] Job ${job?.id} (${job?.data?.type}) falhou:`,
      err.message,
    );
  });

  worker.on("error", (err) => {
    console.error("[queue] Erro no worker de e-mail:", err.message);
  });

  return worker;
}

export async function enqueueEmail(data: EmailJobData) {
  if (!emailQueue) {
    console.warn("[queue] REDIS_URL ausente. Enviando e-mail diretamente.");
    await sendDirect(data);
    return;
  }

  try {
    await emailQueue.add(data.type, data);
  } catch (err) {
    console.error(
      "[queue] Erro ao enfileirar e-mail. Enviando diretamente.",
      err,
    );
    await sendDirect(data);
  }
}
