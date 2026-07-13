import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import type { Gender } from "../../shared/gender";
import { env } from "./env";
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

// Criticidade por tipo de e-mail, explicita (nunca inferida por string):
// "critical" = o usuario perde algo que pagou ou fica travado sem ele (cobranca,
// recibo, mudanca de acesso). "standard" = reenviavel (saudacao, waitlist,
// newsletter). So os criticos mantem o envio direto quando NAO ha fila (Redis
// ausente); os demais falham limpo. O Record forca exaustividade: um tipo novo
// sem entrada aqui nao compila.
const EMAIL_CRITICALITY: Record<
  EmailJobData["type"],
  "critical" | "standard"
> = {
  welcome: "standard",
  pro_upgrade: "critical",
  cancellation: "critical",
  cancellation_scheduled: "critical",
  payment_failed: "critical",
  waitlist_confirmation: "standard",
  newsletter_confirm: "standard",
  newsletter_welcome: "standard",
};

function isCriticalEmail(type: EmailJobData["type"]): boolean {
  return EMAIL_CRITICALITY[type] === "critical";
}

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
      // Rate limiter GLOBAL por fila (BullMQ v5, coordenado via Redis): mesmo com o
      // worker rodando em varias replicas, o teto e compartilhado, nao multiplicado.
      // O Resend limita a 2 req/s e a fila email-campaign ja reserva ~1 req/s, entao
      // 1 envio por TRANSACTIONAL_EMAIL_RATE_MS (default 1000ms) mantem o total no
      // teto. O limiter controla o inicio dos jobs, entao a concorrencia acima nao
      // fura o limite. Configuravel por env pra afrouxar quando a conta virar Pro.
      limiter: {
        max: 1,
        duration: env.transactionalEmailRateMs,
      },
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
// rejeitar, entao sem este teto a rota penduraria. Estourado o teto, o enqueue
// PROPAGA o erro em vez de enviar direto: o add preso na offline queue completa
// quando o Redis volta (o worker envia), entao um envio direto aqui duplicaria
// o e-mail e furaria o limiter de taxa. O chamador trata o erro (best-effort
// nos nao criticos; nos criticos o e-mail ainda sai pela fila que se recupera).
const ENQUEUE_TIMEOUT_MS = 2_000;

const ENQUEUE_TIMEOUT = Symbol("email-enqueue-timeout");

export async function enqueueEmail(data: EmailJobData) {
  if (!emailQueue) {
    // Redis nao configurado (sem fila): nao existe job pra completar depois,
    // entao nao ha duplicata possivel e o envio direto e o unico caminho. So os
    // e-mails CRITICOS (cobranca, recibo, acesso) valem esse envio fora da fila;
    // os NAO CRITICOS falham limpo, o chamador devolve erro e o usuario reenvia
    // (mesma politica da emailCampaignQueue, que recusa fallback de proposito).
    if (isCriticalEmail(data.type)) {
      console.warn(
        `[queue] REDIS_URL ausente. Enviando e-mail critico (${data.type}) diretamente.`,
      );
      await sendDirect(data);
      return;
    }
    console.warn(
      `[queue] REDIS_URL ausente. E-mail nao critico (${data.type}) nao enviado.`,
    );
    throw new Error(
      `Fila de e-mail indisponivel (REDIS_URL ausente); ${data.type} nao enviado.`,
    );
  }

  // Fila existe: o e-mail vai pela fila OU falha. Nunca envio direto aqui.
  // Timeout do add (Redis lento) ou rejeicao propagam pro chamador; enviar
  // direto duplicaria (o add preso completa depois) e furaria o limiter.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const added = await Promise.race([
      emailQueue.add(data.type, data),
      new Promise<typeof ENQUEUE_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(ENQUEUE_TIMEOUT), ENQUEUE_TIMEOUT_MS);
        timer.unref();
      }),
    ]);
    if (added === ENQUEUE_TIMEOUT) {
      throw new Error(
        `Timeout ao enfileirar e-mail (${data.type}) apos ${ENQUEUE_TIMEOUT_MS}ms.`,
      );
    }
  } finally {
    clearTimeout(timer);
  }
}
