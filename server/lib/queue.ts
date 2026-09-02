import os from "os";

import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import type { Gender } from "../../shared/gender";
import { env } from "./env";
import { queueConnection } from "./redis";
import { withRedisOpTimeout } from "./redisOpTimeout";
import {
  sendCancellationEmail,
  sendCancellationScheduledEmail,
  sendFiscalInvoiceEmail,
  sendNewsletterConfirmEmail,
  sendNewsletterWelcomeEmail,
  sendPaymentFailedEmail,
  sendProUpgradeEmail,
  sendRenewalReminderEmail,
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
  | ({
      type: "renewal_reminder";
      planName: string;
      priceLabel: string;
      dueDateIso: string;
      renewUrl: string;
      daysRemaining: number;
    } & Recipient)
  | ({ type: "waitlist_confirmation" } & Recipient)
  | { type: "newsletter_confirm"; to: string; confirmUrl: string }
  | { type: "newsletter_welcome"; to: string; unsubscribeUrl: string }
  | {
      type: "fiscal_invoice_issued";
      to: string;
      numero: string | null;
      codigoVerificacao: string | null;
      descricao: string | null;
      valorLabel: string;
      /**
       * PDF em base64, quando existir. Viaja DENTRO do job de propósito: o
       * worker de e-mail nao fala com o Storage, e um caminho aqui exigiria
       * assinar uma URL que expiraria antes da ultima tentativa do backoff.
       */
      pdfBase64: string | null;
      pdfFilename: string | null;
    };

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
  // Critico: se o lembrete nao sai, o boleto vence e o assinante perde o acesso
  // que renovaria. Com Redis fora, o envio direto (fallback critico) mantem o
  // lembrete saindo em vez de sumir calado.
  renewal_reminder: "critical",
  waitlist_confirmation: "standard",
  newsletter_confirm: "standard",
  newsletter_welcome: "standard",
  // Critico: e o recibo fiscal de algo que a pessoa pagou, e o unico envio que
  // carrega o documento. Com o Redis fora, sai direto, como os demais criticos.
  fiscal_invoice_issued: "critical",
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
        // RETENCAO POR IDADE, nao por contagem, e o motivo foi medido em
        // 02/09/2026. Com `removeOnComplete: 100` e ~85 `welcome` por dia, o
        // historico da fila durava cerca de SETE HORAS: quando se foi
        // investigar o que um worker de dev consumiu entre 29/08 e 02/09, os
        // jobs do periodo ja tinham sido descartados pelo proprio BullMQ, e a
        // pergunta ficou sem resposta possivel. Reter por tempo responde a
        // pergunta que se faz de verdade ("o que aconteceu nos ultimos dias"),
        // que contagem nao responde: o mesmo 100 vale meses numa fila parada e
        // horas numa movimentada.
        //
        // `count` continua como TETO de memoria, e o que vier primeiro corta.
        // Custo medido em 10 jobs reais desta fila: `data` 84 a 110 B, `opts`
        // 102 B, `returnvalue` 4 B, ou seja ~198 B de campos variaveis; com os
        // campos fixos do hash e o overhead do Redis, ~448 B por job. 5000 jobs
        // dao ~2,1 MB, folgado.
        removeOnComplete: { age: 7 * 24 * 3600, count: 5000 },
        removeOnFail: { age: 30 * 24 * 3600, count: 5000 },
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
    case "renewal_reminder":
      await sendRenewalReminderEmail(data.to, data.name, {
        planName: data.planName,
        priceLabel: data.priceLabel,
        dueDateIso: data.dueDateIso,
        renewUrl: data.renewUrl,
        daysRemaining: data.daysRemaining,
      });
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
    case "fiscal_invoice_issued":
      await sendFiscalInvoiceEmail(data.to, {
        numero: data.numero,
        codigoVerificacao: data.codigoVerificacao,
        descricao: data.descricao,
        valorLabel: data.valorLabel,
        pdf:
          data.pdfBase64 && data.pdfFilename
            ? { filename: data.pdfFilename, content: data.pdfBase64 }
            : null,
      });
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
      // NOME DO WORKER: e ele que o BullMQ grava no campo `pb` do job
      // (`processedBy`). Sem `name`, o campo simplesmente nao existe, e foi
      // por isso que a investigacao de 02/09 nao conseguiu dizer QUEM
      // processou os jobs: o Lua de `moveToActive` so escreve `pb` dentro de
      // `if opts['name']`, e nenhum dos 100 jobs medidos tinha o campo.
      //
      // `os.hostname()` e nao um literal: no Railway da o hostname do
      // container (e distingue replicas), na maquina de quem programa da o
      // nome dela. Um nome fixo no codigo diria "e um worker", que e o que ja
      // se sabe, em vez de QUAL.
      name: os.hostname(),
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
  await withRedisOpTimeout(emailQueue.add(data.type, data), `email:${data.type}`);
}
