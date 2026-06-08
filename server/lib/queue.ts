import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

import type { Gender } from "../../shared/gender";
import { env } from "./env";
import {
  sendCancellationEmail,
  sendCancellationScheduledEmail,
  sendPaymentFailedEmail,
  sendProUpgradeEmail,
  sendWelcomeEmail,
} from "./email";

type Recipient = { to: string; name: string; gender?: Gender | null };

export type EmailJobData =
  | ({ type: "welcome" } & Recipient)
  | ({ type: "pro_upgrade"; planName: string } & Recipient)
  | ({ type: "cancellation" } & Recipient)
  | ({ type: "cancellation_scheduled"; effectiveAt: string } & Recipient)
  | ({ type: "payment_failed" } & Recipient);

export const redisConnection = env.redisUrl
  ? new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : null;

redisConnection?.on("error", (err) => {
  console.error("[queue] Erro na conexão Redis:", err.message);
});

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
