import * as Sentry from "@sentry/node";
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

export const emailQueue = queueConnection
  ? new Queue<EmailJobData>("emails", {
      connection: queueConnection,
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
  if (!queueConnection) {
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
      connection: queueConnection,
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
    Sentry.withScope((scope) => {
      scope.setTag("jobName", job?.data?.type ?? "unknown");
      scope.setTag("jobId", String(job?.id ?? "unknown"));
      Sentry.captureException(err);
    });
  });

  worker.on("error", (err) => {
    console.error("[queue] Erro no worker de e-mail:", err.message);
  });

  return worker;
}

// Teto pro enfileiramento. Com Redis fora, a conexao de fila (offline queue
// ligada, exigencia do BullMQ) segura o add() indefinidamente em vez de
// rejeitar, o catch nunca dispara e a rota pendura. Estourado o teto, cai pro
// envio direto. Trade-off consciente: se o Redis voltar com o processo vivo, o
// add preso na offline queue ainda pode completar e o e-mail sai duplicado;
// melhor que pendurar a rota ou perder o e-mail.
const ENQUEUE_TIMEOUT_MS = 2_000;

const ENQUEUE_TIMEOUT = Symbol("email-enqueue-timeout");

export async function enqueueEmail(data: EmailJobData) {
  if (!emailQueue) {
    console.warn("[queue] REDIS_URL ausente. Enviando e-mail diretamente.");
    await sendDirect(data);
    return;
  }

  // sendDirect fica FORA do try: se rodasse dentro, uma falha dele cairia no
  // catch e dispararia um segundo envio. Exatamente um sendDirect por chamada;
  // falha dele propaga ao chamador.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let needsDirectSend = false;
  try {
    const added = await Promise.race([
      emailQueue.add(data.type, data),
      new Promise<typeof ENQUEUE_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(ENQUEUE_TIMEOUT), ENQUEUE_TIMEOUT_MS);
        timer.unref();
      }),
    ]);
    if (added === ENQUEUE_TIMEOUT) {
      console.error(
        "[queue] Timeout ao enfileirar e-mail. Enviando diretamente.",
      );
      needsDirectSend = true;
    }
  } catch (err) {
    console.error(
      "[queue] Erro ao enfileirar e-mail. Enviando diretamente.",
      err,
    );
    needsDirectSend = true;
  } finally {
    clearTimeout(timer);
  }

  if (needsDirectSend) {
    await sendDirect(data);
  }
}
