import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import {
  campaignFooterReason,
  sendCampaignEmail,
  type CampaignAudience,
} from "./email";
import { batchJobId, recipientJobId } from "./emailCampaignJobIds";
import { partitionSendableEmails, validateEmailForSending } from "./emailValidation";
import { env } from "./env";
import { queueConnection } from "./redis";
import { withRedisOpTimeout } from "./redisOpTimeout";
import { supabaseAdmin } from "./supabaseAdmin";
import {
  fetchProStatusSets,
  userMatchesSegment,
  type UserSegment,
} from "./userSegments";
import { buildCampaignUnsubscribeUrl } from "./waitlistUnsubscribe";

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

// Origens de destinatarios de um lote. 'contact_list' e uma lista importada de
// fora da plataforma (Frente C): so membros status='valid', supressao e
// consentimento reconsultados no dispatch.
export type EmailCampaignBatchSource =
  | "waitlist"
  | "newsletter"
  | "custom"
  | "users"
  | "contact_list";

// Origens com tabela propria pra selecao/validacao de elegibilidade.
export const TABLE_BACKED_SOURCES = ["waitlist", "newsletter"] as const;
export type TableBackedSource = (typeof TABLE_BACKED_SOURCES)[number];

// Newsletter: so quem confirmou o double opt-in. Quem se descadastrou dela
// fica fora naturalmente (decisao: descadastro de newsletter NAO entra na
// supressao global, e escopo newsletter).
export const NEWSLETTER_ELIGIBLE_STATUSES = ["confirmed"];

// Segmentos da origem users: logica movida para userSegments.ts (compartilhada
// com as notificacoes in-app). Re-export mantem os imports existentes deste
// modulo funcionando.
export {
  USER_SEGMENTS,
  fetchProStatusSets,
  userMatchesSegment,
} from "./userSegments";
export type { ProStatusSets, UserSegment } from "./userSegments";

// Categoria declarada da campanha. Regra de consentimento imposta na selecao
// da origem users: product seleciona qualquer usuario nao suprimido (legitimo
// interesse, opt-out); promotional exige profiles.marketing_opt_in = true.
export type EmailCampaignCategory = "product" | "promotional";

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
    // Teto de 2s: com a fila half-open o addBulk ficaria pendente na offline
    // queue e penduraria a rota admin. O timeout propaga pro caminho de erro ja
    // existente do chamador (dispatch reverte o lote; reconciliacao reenfileira
    // depois). jobId deterministico + idempotencia impedem duplicata.
    await withRedisOpTimeout(
      emailCampaignQueue.addBulk(
        chunk.map((recipientId) => ({
          name: "send",
          data: { campaignId, recipientId },
          opts: { jobId: recipientJobId(recipientId) },
        })),
      ),
      `enqueueCampaignRecipients:${campaignId}`,
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
  // Teto de 2s (mesmo motivo do addBulk acima): o jobId deterministico batch-{id}
  // torna o re-add da reconciliacao no-op, entao um add abandonado pelo timeout e
  // recriado sem duplicar.
  await withRedisOpTimeout(
    emailCampaignQueue.add(
      "dispatch-batch",
      { batchId },
      { jobId: batchJobId(batchId), delay },
    ),
    `scheduleBatchDispatchJob:${batchId}`,
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

// Limpeza obrigatoria apos QUALQUER cancelamento de lote: deleta os recipients
// pending que o lote inseriu (sent/failed sao historico e ficam), decrementa
// total_recipients e reavalia a campanha (fechamento, ou volta pra draft se
// zerou). Sem isso, um dispatch que falhou depois de inserir deixa orfaos que
// a reconciliacao do boot reenviaria sem acao do admin (incidente dos 100
// e-mails).
export async function cleanupCanceledBatch(batchId: string) {
  const { error } = await supabaseAdmin.rpc(
    "email_campaign_cleanup_canceled_batch",
    { p_batch_id: batchId },
  );
  if (error) {
    throw new Error(
      `Falha ao limpar recipients do lote cancelado: ${error.message}`,
    );
  }
}

export async function fetchCampaignRecipientEmailSet(
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

// E-mails com status sent em QUALQUER campanha que nao seja a atual, em
// minusculas (comparacao case-insensitive; a waitlist ja indexa lower(email)).
// Só sent: failed/pending de outra campanha nao contam como "ja recebeu".
export async function fetchSentEmailSetFromOtherCampaigns(
  excludingCampaignId: string,
): Promise<Set<string>> {
  const emails = new Set<string>();
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("email_campaign_recipients")
      .select("email")
      .eq("status", "sent")
      .neq("campaign_id", excludingCampaignId)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(
        `Falha ao buscar enviados de outras campanhas: ${error.message}`,
      );
    }
    const rows = data ?? [];
    rows.forEach((row) => emails.add(row.email.toLowerCase()));
    if (rows.length < DB_PAGE) break;
  }
  return emails;
}

// Supressao GLOBAL: e-mails que nunca recebem campanha, de qualquer origem
// (descadastro de campanha, bounce, insercao manual). Em minusculas.
export async function fetchSuppressedEmailSet(): Promise<Set<string>> {
  const emails = new Set<string>();
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("email_suppressions")
      .select("email")
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar supressoes: ${error.message}`);
    }
    const rows = data ?? [];
    rows.forEach((row) => emails.add(row.email.toLowerCase()));
    if (rows.length < DB_PAGE) break;
  }
  return emails;
}

function sourceTableQuery(source: TableBackedSource) {
  if (source === "newsletter") {
    return supabaseAdmin
      .from("newsletter_subscribers")
      .select("email")
      .in("status", NEWSLETTER_ELIGIBLE_STATUSES);
  }
  return supabaseAdmin
    .from("waitlist")
    .select("email")
    .in("status", ELIGIBLE_WAITLIST_STATUSES);
}

// mode 'next': proximos N elegiveis da origem em ordem de cadastro, excluindo
// suprimidos, quem ja e recipient da campanha e (com excludeOtherCampaigns)
// quem ja recebeu qualquer outra campanha. limit null = todos os restantes.
async function selectNextEligibleEmails(
  campaignId: string,
  limit: number | null,
  excludeOtherCampaigns: boolean,
  source: TableBackedSource,
): Promise<string[]> {
  const existing = await fetchCampaignRecipientEmailSet(campaignId);
  const suppressed = await fetchSuppressedEmailSet();
  const sentElsewhere = excludeOtherCampaigns
    ? await fetchSentEmailSetFromOtherCampaigns(campaignId)
    : null;
  const selected: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await sourceTableQuery(source)
      .order("created_at", { ascending: true })
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar a origem ${source}: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (existing.has(row.email)) continue;
      if (suppressed.has(row.email.toLowerCase())) continue;
      if (sentElsewhere?.has(row.email.toLowerCase())) continue;
      selected.push(row.email);
      if (limit !== null && selected.length >= limit) return selected;
    }
    if (rows.length < DB_PAGE) break;
  }
  return selected;
}

// mode 'next' da origem users: proximos N usuarios da plataforma em ordem de
// cadastro (profiles.created_at), aplicando a regra de consentimento da
// categoria (promotional exige marketing_opt_in) e o segmento, alem dos
// filtros globais (supressao, dedup da campanha, exclude entre campanhas).
async function selectNextEligibleUserEmails(
  campaignId: string,
  limit: number | null,
  excludeOtherCampaigns: boolean,
  category: EmailCampaignCategory,
  segment: UserSegment,
): Promise<string[]> {
  const existing = await fetchCampaignRecipientEmailSet(campaignId);
  const suppressed = await fetchSuppressedEmailSet();
  const sentElsewhere = excludeOtherCampaigns
    ? await fetchSentEmailSetFromOtherCampaigns(campaignId)
    : null;
  const proSets = segment === "all" ? null : await fetchProStatusSets();
  const needOptIn = category === "promotional";

  const seen = new Set<string>();
  const selected: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, marketing_opt_in")
      .order("created_at", { ascending: true })
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(`Falha ao buscar usuarios: ${error.message}`);
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
      selected.push(email);
      if (limit !== null && selected.length >= limit) return selected;
    }
    if (rows.length < DB_PAGE) break;
  }
  return selected;
}

// E-mails (lower) de USUARIOS existentes que recusaram marketing. Usado no
// dispatch de contact_list promotional: um usuario que optou por nao receber
// marketing NAO recebe so porque o e-mail apareceu numa lista importada. Quem
// nao e usuario (sem conta) nao aparece aqui e passa (a base legal do import
// vale). Pagina profiles e casa por lower(email), como o caminho de users.
async function fetchMarketingOptedOutEmails(
  wantedLower: Set<string>,
): Promise<Set<string>> {
  const blocked = new Set<string>();
  if (wantedLower.size === 0) return blocked;
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("email, marketing_opt_in")
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(
        `Falha ao revalidar consentimento de marketing: ${error.message}`,
      );
    }
    const rows = data ?? [];
    for (const row of rows) {
      if (!row.email) continue;
      const lower = row.email.toLowerCase();
      if (wantedLower.has(lower) && row.marketing_opt_in !== true) {
        blocked.add(lower);
      }
    }
    if (rows.length < DB_PAGE) break;
  }
  return blocked;
}

// mode 'selected' (origem custom e contact_list): e-mails colados ou de uma
// lista importada, com elegibilidade revalidada NA HORA do dispatch (quem se
// descadastrou entre o agendamento e o disparo nao recebe), excluindo suprimidos
// e quem ja e recipient da campanha. contact_list promotional tambem exclui
// usuario existente que recusou marketing (consentimento reconsultado no envio).
async function selectBatchEligibleEmails(
  campaignId: string,
  batchId: string,
  excludeOtherCampaigns: boolean,
  source: EmailCampaignBatchSource,
  usersFilter?: { category: EmailCampaignCategory; segment: UserSegment },
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
  const suppressed = await fetchSuppressedEmailSet();

  let eligible: Set<string> | null = null;
  if (source === "waitlist" || source === "newsletter") {
    eligible = new Set<string>();
    const CHUNK = 100;
    for (let i = 0; i < wanted.length; i += CHUNK) {
      const chunk = wanted.slice(i, i + CHUNK);
      const { data: rows, error: sourceError } = await sourceTableQuery(
        source,
      ).in("email", chunk);
      if (sourceError) {
        throw new Error(
          `Falha ao validar elegibilidade do lote: ${sourceError.message}`,
        );
      }
      (rows ?? []).forEach((row) => eligible?.add(row.email));
    }
  } else if (source === "users" && usersFilter) {
    // Revalida na hora do dispatch: categoria promotional exige opt-in AGORA
    // (quem desmarcou entre o agendamento e o disparo nao recebe) e o
    // segmento e recalculado. Match em memoria por lower(email) porque o
    // e-mail em profiles pode ter caixa mista.
    const needOptIn = usersFilter.category === "promotional";
    const proSets =
      usersFilter.segment === "all" ? null : await fetchProStatusSets();
    eligible = new Set<string>();
    for (let from = 0; ; from += DB_PAGE) {
      const { data: rows, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email, marketing_opt_in")
        .range(from, from + DB_PAGE - 1);
      if (profilesError) {
        throw new Error(
          `Falha ao validar usuarios do lote: ${profilesError.message}`,
        );
      }
      const pageRows = rows ?? [];
      for (const row of pageRows) {
        if (!row.email) continue;
        if (needOptIn && row.marketing_opt_in !== true) continue;
        if (
          proSets &&
          !userMatchesSegment(row.user_id, usersFilter.segment, proSets)
        ) {
          continue;
        }
        eligible.add(row.email.toLowerCase());
      }
      if (pageRows.length < DB_PAGE) break;
    }
  }

  const sentElsewhere = excludeOtherCampaigns
    ? await fetchSentEmailSetFromOtherCampaigns(campaignId)
    : null;

  // contact_list promotional: reconsulta o consentimento de marketing dos que ja
  // sao usuarios (nunca confia no snapshot do import). custom nao passa por aqui.
  const marketingBlocked =
    source === "contact_list" && usersFilter?.category === "promotional"
      ? await fetchMarketingOptedOutEmails(
          new Set(wanted.map((e) => e.toLowerCase())),
        )
      : null;

  return wanted.filter(
    (email) =>
      (eligible === null || eligible.has(email)) &&
      !existing.has(email) &&
      !suppressed.has(email.toLowerCase()) &&
      !sentElsewhere?.has(email.toLowerCase()) &&
      !marketingBlocked?.has(email.toLowerCase()),
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
    .select(
      "id, campaign_id, mode, batch_limit, exclude_other_campaigns, source, user_segment",
    )
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

    const excludeOtherCampaigns = batch.exclude_other_campaigns === true;
    const source = (batch.source ?? "waitlist") as EmailCampaignBatchSource;

    // Regra de consentimento imposta AQUI, na hora do disparo: a categoria
    // vem da campanha (declarada pelo admin, nunca inferida) e o segmento do
    // proprio lote.
    let usersFilter:
      | { category: EmailCampaignCategory; segment: UserSegment }
      | undefined;
    // users usa categoria+segmento; contact_list usa a categoria para reconsultar
    // o consentimento de marketing dos membros que ja sao usuarios (segmento nao
    // se aplica a lista importada, fica "all").
    if (source === "users" || source === "contact_list") {
      const { data: campaignRow, error: categoryError } = await supabaseAdmin
        .from("email_campaigns")
        .select("category")
        .eq("id", batch.campaign_id)
        .maybeSingle();
      if (categoryError || !campaignRow) {
        throw new Error(
          `Falha ao buscar categoria da campanha: ${categoryError?.message ?? "campanha nao encontrada"}`,
        );
      }
      usersFilter = {
        category: (campaignRow.category ?? "product") as EmailCampaignCategory,
        segment: (batch.user_segment ?? "all") as UserSegment,
      };
    }

    let emails: string[];
    // contact_list e sempre mode=selected (garantido na criacao): resolvido por
    // selectBatchEligibleEmails, que reconsulta supressao e consentimento.
    if (
      batch.mode === "selected" ||
      source === "custom" ||
      source === "contact_list"
    ) {
      emails = await selectBatchEligibleEmails(
        batch.campaign_id,
        batch.id,
        excludeOtherCampaigns,
        source,
        usersFilter,
      );
    } else if (source === "users") {
      if (!usersFilter) {
        throw new Error("Filtro de usuarios ausente no dispatch.");
      }
      emails = await selectNextEligibleUserEmails(
        batch.campaign_id,
        batch.batch_limit ?? null,
        excludeOtherCampaigns,
        usersFilter.category,
        usersFilter.segment,
      );
    } else {
      emails = await selectNextEligibleEmails(
        batch.campaign_id,
        batch.batch_limit ?? null,
        excludeOtherCampaigns,
        source,
      );
    }

    // Barreira central: nenhuma origem (waitlist/newsletter/users/custom/
    // contact_list) insere e-mail com sintaxe invalida ou dominio reservado
    // (example.com etc). O admin (custom) e o import (contact_list) ja filtram
    // na entrada; aqui cobre tambem waitlist/newsletter/users, que nao validavam.
    const { sendable, rejected } = partitionSendableEmails(emails);
    if (rejected.length > 0) {
      console.warn(
        `[email-campaign] Lote ${batch.id}: ${rejected.length} destinatario(s) descartado(s) por e-mail invalido/reservado antes do envio:`,
        rejected.slice(0, 10).map((r) => `${r.email} (${r.reason})`),
      );
    }
    emails = sendable;

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
      // Dupla protecao do incidente dos 100 e-mails: so reenfileira pending
      // cujo lote esta DISPATCHED. Pending de lote canceled e orfao de falha
      // de dispatch (a limpeza do cancelamento ja deleta; este filtro segura
      // qualquer sobra) e pending de lote pending ainda nem devia existir.
      const { data: dispatchedBatches, error: batchesError } =
        await supabaseAdmin
          .from("email_campaign_batches")
          .select("id")
          .eq("campaign_id", campaign.id)
          .eq("status", "dispatched");
      if (batchesError) {
        throw new Error(batchesError.message);
      }
      const batchIds = (dispatchedBatches ?? []).map((row) => row.id);
      if (batchIds.length === 0) continue;

      const pendingIds: string[] = [];
      for (let from = 0; ; from += DB_PAGE) {
        const { data, error: pendingError } = await supabaseAdmin
          .from("email_campaign_recipients")
          .select("id")
          .eq("campaign_id", campaign.id)
          .eq("status", "pending")
          .in("batch_id", batchIds)
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
  providerMessageId: string | null = null,
) {
  const { error } = await supabaseAdmin.rpc("email_campaign_record_result", {
    p_recipient_id: recipientId,
    p_success: success,
    p_error: errorMessage,
    p_provider_message_id: providerMessageId,
  });
  if (error) {
    throw new Error(`Falha ao registrar resultado do envio: ${error.message}`);
  }
}

// Resolve a frase de rodape a partir do lote do destinatario. Uma consulta ao
// lote (source + contact_list_id); para contact_list, mais uma a contact_lists
// pela frase daquela lista. Sem lote (recipient antigo sem batch_id) ou origem
// desconhecida: fallback neutro. Erros de consulta propagam (retry do worker),
// no mesmo padrao das outras leituras do envio.
async function resolveCampaignFooterReason(
  batchId: string | null,
): Promise<string> {
  if (!batchId) return campaignFooterReason("custom");

  const { data: batch, error } = await supabaseAdmin
    .from("email_campaign_batches")
    .select("source, contact_list_id")
    .eq("id", batchId)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar lote do destinatario: ${error.message}`);
  }
  if (!batch) return campaignFooterReason("custom");

  const source = (batch.source ?? "custom") as CampaignAudience;

  if (source === "contact_list") {
    let contactListReason: string | null = null;
    if (batch.contact_list_id) {
      const { data: list, error: listError } = await supabaseAdmin
        .from("contact_lists")
        .select("footer_reason")
        .eq("id", batch.contact_list_id)
        .maybeSingle();
      if (listError) {
        throw new Error(
          `Falha ao buscar a lista de contatos do lote: ${listError.message}`,
        );
      }
      contactListReason = list?.footer_reason ?? null;
    }
    return campaignFooterReason("contact_list", contactListReason);
  }

  return campaignFooterReason(source);
}

// Primeiro nome: primeira palavra do nome, com trim. Vazio, so espacos ou
// ausente retorna "" (nome ausente NAO e erro, e vazio legitimo).
function firstNameFrom(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

// Resolve o PRIMEIRO nome do destinatario conforme a origem do lote:
// - users: lookup em profiles por email (name, senao full_name).
// - contact_list: contact_list_members.name daquele membro naquela lista.
// - waitlist, newsletter, custom: sempre "" (essas origens nao tem nome; NAO
//   derivar do e-mail, que e chute).
// Erro de consulta PROPAGA (retry do worker); nome ausente e "" legitimo.
async function resolveRecipientFirstName(
  email: string,
  batchId: string | null,
): Promise<string> {
  if (!batchId) return "";

  const { data: batch, error } = await supabaseAdmin
    .from("email_campaign_batches")
    .select("source, contact_list_id")
    .eq("id", batchId)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao buscar lote do destinatario: ${error.message}`);
  }
  if (!batch) return "";

  const source = (batch.source ?? "custom") as CampaignAudience;

  if (source === "users") {
    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("name, full_name")
      .eq("email", email)
      .limit(1);
    if (profileError) {
      throw new Error(
        `Falha ao buscar perfil do destinatario: ${profileError.message}`,
      );
    }
    const row = data?.[0];
    return firstNameFrom(row?.name || row?.full_name);
  }

  if (source === "contact_list") {
    if (!batch.contact_list_id) return "";
    const { data, error: memberError } = await supabaseAdmin
      .from("contact_list_members")
      .select("name")
      .eq("list_id", batch.contact_list_id)
      .eq("email", email)
      .limit(1);
    if (memberError) {
      throw new Error(
        `Falha ao buscar membro da lista: ${memberError.message}`,
      );
    }
    return firstNameFrom(data?.[0]?.name);
  }

  return "";
}

async function processRecipientJob(job: Job<EmailCampaignJobData>) {
  const { campaignId, recipientId } = job.data as EmailCampaignSendJobData;

  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from("email_campaign_recipients")
    .select("id, email, status, batch_id")
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

  // Barreira final antes do Resend: dado sujo conhecido (dominio reservado ou
  // sintaxe invalida) e marcado failed direto, SEM chamar o Resend nem queimar
  // as tentativas/poluir o Sentry com um erro que ja se sabe ser dado sujo. O
  // dispatch ja filtra na selecao; esta barreira pega recipient antigo ja
  // inserido (ex.: reenfileirado pela reconciliacao no boot). recordResult
  // marca failed e retorna: o job completa normal (sem throw = sem retry).
  const emailCheck = validateEmailForSending(recipient.email);
  if (!emailCheck.ok) {
    await recordResult(
      recipientId,
      false,
      emailCheck.reason === "reserved"
        ? "Dominio reservado (nao entregavel); envio ignorado sem chamar o Resend."
        : "E-mail com sintaxe invalida; envio ignorado sem chamar o Resend.",
    );
    return;
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("email_campaigns")
    .select("id, subject, body, body_is_html, image_url")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) {
    throw new Error(`Falha ao buscar campanha: ${campaignError.message}`);
  }
  if (!campaign) {
    throw new Error(`Campanha ${campaignId} nao encontrada.`);
  }

  // Rodape honesto por origem: a razao do envio vem do lote do destinatario
  // (email_campaign_batches.source). Para contact_list, usa a frase que o admin
  // escreveu para AQUELA lista (contact_lists.footer_reason). Lote ausente
  // (recipient antigo sem batch_id) cai no fallback neutro do campaignFooterReason.
  const footerReason = await resolveCampaignFooterReason(recipient.batch_id);
  // Primeiro nome por destinatario (origem do lote). Vazio quando a origem nao
  // tem nome ou o registro nao traz um: a copy com {nome} some sem quebrar.
  const firstName = await resolveRecipientFirstName(
    recipient.email,
    recipient.batch_id,
  );

  const unsubscribeUrl = buildCampaignUnsubscribeUrl(recipient.email);
  // messageId (data.id do Resend) correlaciona este recipient com o webhook de
  // bounce/complaint. Pode vir null (envio aceito sem id): recordResult grava
  // null e o fluxo segue.
  const messageId = await sendCampaignEmail({
    to: recipient.email,
    subject: campaign.subject,
    body: campaign.body,
    bodyIsHtml: campaign.body_is_html === true,
    imageUrl: campaign.image_url,
    unsubscribeUrl,
    footerReason,
    firstName,
  });

  // RPC falhando DEPOIS do envio: rethrow deixa o BullMQ tentar de novo e o
  // retry reenvia o e-mail (destinatario segue pending). Trade-off consciente:
  // duplicar num blip transitorio de banco e melhor que travar o contador e a
  // campanha pra sempre.
  await recordResult(recipientId, true, null, messageId);
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
