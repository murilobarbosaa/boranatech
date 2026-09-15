import crypto from "crypto";
import { montarDbError } from "../lib/dbError";
import * as Sentry from "@sentry/node";
import { NextFunction, Request, Response, Router } from "express";

import { enrichBacklog } from "../jobs/enrichBacklog";
import { runVagasSync } from "../jobs/syncJobs";
import { syncNews } from "../jobs/syncNews";
import { writeAudienceSnapshots } from "../lib/audienceReach";
import { reindexSearchDocuments } from "../lib/searchIndex";
import { reconcileSentryBugs } from "../lib/sentryBugReconcile";
import {
  resumoParaLog,
  runDegradada,
  syncSentryTasks,
} from "../lib/sentryTaskIntake";
import { coletarTagueado, paginateRange } from "../lib/paginate";
import { recordCronRun } from "../lib/cron-logs";
import { detectarChargesSemDono, LOOKUPS_REAIS } from "../lib/chargeSemDono";
import {
  fetchSuppressedEmailSet,
  reconcileEmailCampaignBatches,
} from "../lib/emailCampaignQueue";
import { env } from "../lib/env";
import { reconcileFiscalInvoices } from "../lib/fiscalReconcile";
import {
  clampWindowDays,
  detectOrphanPayments,
  statusDaRunDeOrfaos,
} from "../lib/orphanPayments";
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { enqueueEmail } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { normalizarDataPix, relogioDeBrasilia } from "../lib/pixVencimento";
import { issueRenewalToken } from "../lib/renewalToken";
import { getStripe } from "../lib/stripeClient";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { SYNC_FINANCE_WINDOW_DAYS } from "../lib/financeSyncWindow";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { collectSubscriptionSnapshot } from "../lib/subscriptionSnapshots";
import { createError } from "../middleware/error";
import { lerSessaoDeBoleto } from "../lib/boletoSession";
import { cancelPayment, lerPagamento } from "../providers/asaas";
import { getStripeSubscriptionState } from "../providers/stripe";
import { isPlanId, PLAN_PRICING, type PlanId } from "../../shared/planPricing";
import { metodoDaRenovacao } from "../../shared/renewalMethod";
import { createTargetedNotification } from "../lib/targetedNotifications";

const router = Router();

type SyncResult = {
  found?: number;
  created: number;
  updated?: number;
  failed: number;
};

function timingSafeEqualStr(a: string, b: string): boolean {
  // Hash de tamanho fixo dos dois lados para comparar em tempo constante
  // sem vazar o comprimento. Mesmo padrao do webhook (billing.ts).
  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  // O caller (pg_cron via public.call_cron_endpoint) envia o segredo apenas no
  // header x-cron-secret. Nao aceitamos query string para nao vazar o segredo
  // em logs de proxy/plataforma.
  const received = req.headers["x-cron-secret"];
  if (
    !env.cronSecret ||
    typeof received !== "string" ||
    !received ||
    !timingSafeEqualStr(received, env.cronSecret)
  ) {
    return next(createError(401, "unauthorized", "Cron secret inválido."));
  }

  next();
}

async function getSource(code: string) {
  const { data } = await supabaseAdmin
    .from("content_sources")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  return data;
}

async function recordSync(
  code: string,
  startedAt: Date,
  result: SyncResult,
  errorMessage?: string,
) {
  try {
    const source = await getSource(code);
    if (!source) return;

    const status = errorMessage
      ? "error"
      : result.failed > 0
        ? "partial"
        : "success";
    await supabaseAdmin.from("content_sync_logs").insert({
      source_id: source.id,
      status,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      items_found: result.found || 0,
      items_created: result.created,
      items_updated: result.updated || 0,
      items_failed: result.failed,
      error_message: errorMessage || null,
      raw_summary: result,
    });

    await supabaseAdmin
      .from("content_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        status: errorMessage ? "error" : "active",
      })
      .eq("code", code);
  } catch (err) {
    console.warn(
      "[cron] Falha ao registrar log de sincronização:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

router.use(requireCronSecret);

// Lock distribuido dos jobs longos (auditoria, secao 2): sem ele, uma execucao
// que passa da janela do pg_cron pode se sobrepor a proxima em OUTRA replica.
// SET NX EX com token proprio; release so apaga se o token for o dono (Lua
// compare-and-del, nunca DEL cego, pra nao soltar o lock de uma execucao mais
// nova depois que o TTL do dono expirou).
// Redis fora = roda SEM lock com warn (fail-open): todos os jobs abaixo sao
// idempotentes por natureza (upserts, reindex, estado derivado da Stripe;
// reconciliacao repetida e segura e contada por item), entao
// um double-run esporadico e melhor que nunca rodar.
const RELEASE_LOCK_LUA = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

type CronLock = { token: string } | "locked" | "no_redis";

async function acquireCronLock(
  jobName: string,
  ttlSeconds: number,
): Promise<CronLock> {
  if (!cacheConnection) return "no_redis";
  const token = crypto.randomUUID();
  try {
    const result = await cacheConnection.set(
      `lock:cron:${jobName}`,
      token,
      "EX",
      ttlSeconds,
      "NX",
    );
    return result === "OK" ? { token } : "locked";
  } catch (err) {
    console.warn(
      `[cron] ${jobName}: Redis indisponivel pro lock, rodando sem lock (fail-open):`,
      err instanceof Error ? err.message : String(err),
    );
    return "no_redis";
  }
}

async function releaseCronLock(jobName: string, token: string) {
  if (!cacheConnection) return;
  try {
    await cacheConnection.eval(
      RELEASE_LOCK_LUA,
      1,
      `lock:cron:${jobName}`,
      token,
    );
  } catch (err) {
    console.warn(
      `[cron] ${jobName}: falha ao liberar lock (expira pelo TTL):`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

type CronHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

function withCronLock(
  jobName: string,
  ttlSeconds: number,
  handler: CronHandler,
): CronHandler {
  return async (req, res, next) => {
    const lock = await acquireCronLock(jobName, ttlSeconds);
    if (lock === "locked") {
      // Nao e erro: com replicas ou overlap de agenda, pular e o desejado.
      console.log(`[cron] ${jobName}: lock ocupado, execucao pulada`);
      res.json({ skipped: "locked" });
      return;
    }
    try {
      await handler(req, res, next);
    } finally {
      if (typeof lock === "object") {
        await releaseCronLock(jobName, lock.token);
      }
    }
  };
}

// Reindexacao fail-soft dos resource_types afetados por um sync. NUNCA falha o
// job de insercao que a disparou: qualquer erro vira warn e o sync segue ok.
async function reindexAfterSync(jobName: string, types: string[]) {
  try {
    console.log(`[cron] ${jobName}: reindexando tipos ${types.join(", ")}`);
    const summary = await reindexSearchDocuments(types);
    console.log(
      `[cron] ${jobName}: reindex concluida:`,
      JSON.stringify(summary),
    );
  } catch (err) {
    console.warn(
      `[cron] ${jobName}: reindex pos-sync falhou (fail-soft):`,
      err,
    );
  }
}

// TTL 1200s: 4 fetches Currents + enriquecimento OpenAI artigo a artigo,
// duracao tipica de minutos; 2x com folga.
router.post(
  "/sync-news",
  withCronLock("sync-news", 1200, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const result = await syncNews();
      await recordSync("currents", startedAt, result);
      await recordCronRun({
        jobName: "sync-news",
        status: result.failed > 0 ? "partial" : "success",
        startedAt,
        payload: { ...result },
      });
      await reindexAfterSync("sync-news", ["news"]);
      res.json({ data: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await recordSync(
        "currents",
        startedAt,
        { found: 0, created: 0, updated: 0, failed: 1 },
        errorMessage,
      );
      await recordCronRun({
        jobName: "sync-news",
        status: "error",
        startedAt,
        errorMessage,
      });
      next(err);
    }
  }),
);

// TTL 600s: ~22 unidades de fetch (teto 15s cada) rodando por fonte com
// allSettled + upserts em lote, tipico bem abaixo de 10min.
router.post(
  "/sync-jobs",
  withCronLock("sync-jobs", 600, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const result = await runVagasSync();
      // Um content_sync_log por fonte que rodou (getSource ignora codes sem
      // linha em content_sources; hoje so "jooble" existe, os demais viram
      // no-op ate o cadastro das fontes novas).
      const bySource = new Map<
        string,
        { found: number; created: number; updated: number; failed: number }
      >();
      for (const r of result.results) {
        const acc = bySource.get(r.source) ?? {
          found: 0,
          created: 0,
          updated: 0,
          failed: 0,
        };
        acc.found += r.fetched;
        acc.created += r.upserted;
        acc.failed += r.failed + (r.error ? 1 : 0);
        bySource.set(r.source, acc);
      }
      for (const [code, totals] of Array.from(bySource.entries())) {
        await recordSync(code, startedAt, totals);
      }
      await recordCronRun({
        jobName: "sync-jobs",
        status: result.totals.failed > 0 ? "partial" : "success",
        startedAt,
        payload: { ...result.totals, skipped: result.skippedSources },
      });
      await reindexAfterSync("sync-jobs", ["job"]);
      res.json({ data: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await recordSync(
        "jooble",
        startedAt,
        { found: 0, created: 0, updated: 0, failed: 1 },
        errorMessage,
      );
      await recordCronRun({
        jobName: "sync-jobs",
        status: "error",
        startedAt,
        errorMessage,
      });
      next(err);
    }
  }),
);

// Reindexacao COMPLETA do search_documents (todas as fontes). Agendada diaria
// via pg_cron (migration 20260702120000) e disponivel para disparo manual. O
// reindexador ja e fail-soft por fonte: falhas parciais viram status "partial".
// TTL 1200s: reindex completo de todas as fontes em paginas de 1000, cresce
// com o catalogo; 20min cobre com folga.
router.post(
  "/reindex-search",
  withCronLock("reindex-search", 1200, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      console.log("[cron] reindex-search: iniciando reindexacao completa");
      const summary = await reindexSearchDocuments();
      console.log("[cron] reindex-search: concluida:", JSON.stringify(summary));
      await recordCronRun({
        jobName: "reindex-search",
        status: summary.falhas.length > 0 ? "partial" : "success",
        startedAt,
        payload: { ...summary },
      });
      res.json({ data: summary });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await recordCronRun({
        jobName: "reindex-search",
        status: "error",
        startedAt,
        errorMessage,
      });
      next(err);
    }
  }),
);

// Cancelamento agendado de linha Stripe vencida. O webhook de fim de periodo
// (customer.subscription.deleted) pode ter se perdido, entao a UNICA verdade e a
// API da Stripe: nunca presumimos que ela ja cancelou.
async function reconcileStripeCancellation(sub: SubRow): Promise<RowOutcome> {
  if (!env.stripeSecretKey) {
    return {
      provider: "stripe",
      outcome: "skipped",
      reason: "stripe_not_configured",
    };
  }
  if (!sub.provider_subscription_id) {
    return {
      provider: "stripe",
      outcome: "skipped",
      reason: "missing_provider_subscription_id",
    };
  }

  // BUG LATENTE, so BOLETO. `provider_subscription_id` de linha com
  // `renewal_type='manual'` e um id de SESSAO (`cs_...`), nao de assinatura, e
  // getStripeSubscriptionState chama subscriptions.retrieve com ele. Se uma
  // linha dessas entrar aqui com cancel_at_period_end, a chamada falha a cada
  // execucao, para sempre.
  //
  // Medido em 2026-07-30: 0 boletos com cancel_at_period_end, 0 linhas vencidas,
  // 0 travadas, 1744 execucoes deste cron sem falha. Esta latente, nao ativo, e
  // por isso nao foi consertado nesta rodada. A entrada pela UI esta fechada na
  // rota de cancelamento administrativo (admin.ts, POST
  // /users/:id/subscription/cancel), que recusa boleto no servidor.
  //
  // Se esta leitura FALHAR (rede/5xx/rate limit), a excecao propaga ANTES de
  // qualquer escrita e o caller conta failed. Falha de leitura nunca vira
  // decisao: nem concede nem revoga acesso.
  const state = await getStripeSubscriptionState(sub.provider_subscription_id);

  const proNow = isProLikeStatus(state.status);
  const statusChanged = state.status !== (sub.status ?? null);

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: state.status,
      current_period_start: state.currentPeriodStart,
      current_period_end: state.currentPeriodEnd,
      cancel_at_period_end: state.cancelAtPeriodEnd,
      canceled_at:
        state.status === "canceled"
          ? (state.canceledAt ?? new Date().toISOString())
          : null,
      last_event_at: new Date().toISOString(),
    })
    .eq("id", sub.id);
  if (updateError) throw updateError;

  // Status local mudou -> o boolean Pro pode ter mudado: invalida o cache.
  if (statusChanged && sub.user_id) void invalidateProStatusCache(sub.user_id);

  if (!proNow) {
    // Terminou de fato na Stripe (canceled/past_due/incomplete): Pro cai e a
    // auditoria de cancelamento agendado e fechada.
    if (sub.user_id) {
      await supabaseAdmin
        .from("subscription_cancellations")
        .update({ status: "completed" })
        .eq("user_id", sub.user_id)
        .eq("status", "scheduled");
    }
    return { provider: "stripe", outcome: "reconciled_terminal" };
  }

  if (state.cancelAtPeriodEnd) {
    // Segue active com cancelamento agendado: a Stripe ainda nao finalizou.
    // Nada a decidir agora (is_user_pro ja nega pelo periodo vencido).
    return { provider: "stripe", outcome: "pending" };
  }

  // Cancelamento revertido direto no dashboard da Stripe: a Stripe e a fonte de
  // verdade, entao a linha local reflete o ativo.
  return { provider: "stripe", outcome: "reconciled_active" };
}

// Rede de seguranca de fim de periodo: finaliza no banco (active -> terminal) as
// assinaturas cujo cancelamento agendado venceu, refletindo o estado vivo da
// Stripe. Cobre casos em que o webhook customer.subscription.deleted se perdeu.
// TTL 600s: N subs vencidas x chamadas Stripe (teto 15s cada), tipico de
// segundos; aplicado o minimo de 10min.
router.post(
  "/process-cancellations",
  withCronLock("process-cancellations", 600, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const nowIso = new Date().toISOString();

      // Provider-agnostico. cancel_at_period_end=true NAO pode mais ser excluido
      // silenciosamente do reconcile: para a Stripe o webhook de fim de periodo
      // pode se perder, e ausencia de evento nunca pode manter Pro (fail-open).
      // PAGINADO, e aqui o teto seria FAIL-OPEN: uma pagina truncada deixa de
      // fora assinaturas que ja deveriam ter perdido o Pro, e elas continuam
      // ativas ate alguem reparar. O comentario acima ja diz que ausencia de
      // evento nunca pode manter Pro; ausencia de LINHA tem o mesmo efeito.
      const { data: due, error: dueError } = await coletarTagueado<SubRow>(
        (from, to) =>
          supabaseAdmin
            .from("subscriptions")
            .select(
              "id, user_id, provider, status, provider_subscription_id, current_period_end",
            )
            .eq("cancel_at_period_end", true)
            .eq("status", "active")
            .lte("current_period_end", nowIso)
            .order("id", { ascending: true })
            .range(from, to),
        "process-cancellations due",
      );

      if (dueError) {
        await recordCronRun({
          jobName: "process-cancellations",
          status: "error",
          startedAt,
          errorMessage: dueError.message,
        });
        return next(
          montarDbError(
            "cron",
            "cron/process-cancellations load due",
            dueError,
            "Erro ao buscar cancelamentos pendentes.",
          ),
        );
      }

      const subs = (due || []) as SubRow[];
      const outcomes: RowOutcome[] = [];
      const failures: Array<{
        subscription_id: string;
        provider: string;
        reason: string;
      }> = [];

      for (const sub of subs) {
        try {
          const outcome = await reconcileStripeCancellation(sub);
          if (outcome.outcome === "skipped") {
            console.warn(
              `[cron/process-cancellations] ${sub.id} skipped (reason=${outcome.reason ?? "n/a"})`,
            );
          }
          outcomes.push(outcome);
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          failures.push({
            subscription_id: sub.id,
            provider: "stripe",
            reason,
          });
          outcomes.push({ provider: "stripe", outcome: "failed", reason });
          console.error(`[cron/process-cancellations] ${sub.id} falhou:`, err);
        }
      }

      const processed = subs.length;
      const byProvider = tallyByProvider(outcomes);
      const skipped = countOutcome(outcomes, "skipped");
      const failed = countOutcome(outcomes, "failed");

      await recordCronRun({
        jobName: "process-cancellations",
        status: failed > 0 ? "partial" : "success",
        startedAt,
        payload: { processed, byProvider, skipped, failed },
      });

      res.json({ data: { processed, byProvider, skipped, failed, failures } });
    } catch (err) {
      await recordCronRun({
        jobName: "process-cancellations",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Regua por plano: dias antes do vencimento em que cada lembrete dispara.
 *
 * Fechada sobre `PlanId`: um plano novo obriga uma entrada aqui e o `tsc`
 * cobra. Ate 2026-09-06 o mapa era aberto (`Record<string, ...>`) e o mensal
 * nao estava nele; a linha caia em `skipped` e o job reportava sucesso. Foi o
 * caso vivo do boleto mensal de 21/09: zero lembretes, sem nada acusar.
 */
export const RENEWAL_MILESTONES: Record<PlanId, number[]> = {
  pro_monthly: [7, 3, 1],
  pro_semiannual: [15, 7, 1],
  pro_annual: [30, 7, 1],
};

/** Codigo do marco do DIA ZERO em `renewal_reminders_sent`. */
const DIA_ZERO = "d0";

// Marco "ativo" = o MENOR N cuja janela ainda contem daysUntil. Anual: 30d cobre
// (7,30], 7d cobre (1,7], 1d cobre <=1 (contiguo, sem overlap). Um marco por
// assinatura por run; o array renewal_reminders_sent garante um envio por marco
// mesmo com run diaria/atrasada (catch-up dentro da janela, nunca retroativo).
function activeRenewalMilestone(
  milestones: number[],
  daysUntil: number,
): number | null {
  const eligible = milestones.filter((n) => daysUntil <= n);
  return eligible.length > 0 ? Math.min(...eligible) : null;
}

export type DecisaoDeLembrete =
  | { tipo: "lembrete"; codigo: string; daysRemaining: number }
  | { tipo: "termino"; codigo: typeof DIA_ZERO }
  | { tipo: "pular"; motivo: "sem_marcos" | "ja_enviado" | "fora_da_janela" };

/**
 * O que esta assinatura recebe HOJE: um lembrete de "vence em N dias", o
 * e-mail de termino, ou nada. Pura, para o teste afirmar a tabela.
 *
 * DIA ZERO: `current_period_end` nas ultimas 24 horas. O job roda uma vez por
 * dia (12:00 UTC), entao "venceu hoje" e "venceu desde a rodada anterior", e a
 * janela de 24h e o que garante que ninguem fica sem o aviso nem o recebe duas
 * vezes (o codigo `d0` no array de marcos fecha a segunda parte). Vencida ha
 * mais de 24h nao recebe: o dia zero nao e retroativo, como os outros marcos.
 *
 * `sem_marcos` e NOMEADO em vez de virar `fora_da_janela`, porque a rodada
 * transforma isso em aviso no Sentry: plano sem regua e configuracao faltando,
 * nao ausencia de trabalho.
 */
export function decidirLembrete(args: {
  planCode: string;
  currentPeriodEnd: string | null;
  alreadySent: string[];
  nowMs: number;
}): DecisaoDeLembrete {
  const { planCode, currentPeriodEnd, alreadySent, nowMs } = args;
  if (!isPlanId(planCode)) return { tipo: "pular", motivo: "sem_marcos" };
  if (!currentPeriodEnd) return { tipo: "pular", motivo: "fora_da_janela" };
  const periodEndMs = new Date(currentPeriodEnd).getTime();
  if (!Number.isFinite(periodEndMs)) {
    return { tipo: "pular", motivo: "fora_da_janela" };
  }

  if (periodEndMs <= nowMs) {
    if (nowMs - periodEndMs > DAY_MS) {
      return { tipo: "pular", motivo: "fora_da_janela" };
    }
    if (alreadySent.includes(DIA_ZERO)) {
      return { tipo: "pular", motivo: "ja_enviado" };
    }
    return { tipo: "termino", codigo: DIA_ZERO };
  }

  const daysUntil = (periodEndMs - nowMs) / DAY_MS;
  const n = activeRenewalMilestone(RENEWAL_MILESTONES[planCode], daysUntil);
  if (n === null) return { tipo: "pular", motivo: "fora_da_janela" };
  const codigo = `d${n}`;
  if (alreadySent.includes(codigo)) {
    return { tipo: "pular", motivo: "ja_enviado" };
  }
  return {
    tipo: "lembrete",
    codigo,
    daysRemaining: Math.max(0, Math.round(daysUntil)),
  };
}

export type DecisaoPix =
  | { tipo: "enviar"; estagio: "p1" | "p0"; variant: "aberto" | "vence_hoje" }
  | { tipo: "pular"; motivo: string };

/**
 * Idade minima para o `p1`. Medido: de 32 Pix confirmados, 29 cairam em ate 15
 * minutos da criacao, 1 entre 1h e 6h e 2 acima de 20h. Depois de duas horas o
 * abandono ja aconteceu, e esperar mais gasta a janela util da cobranca.
 */
const PIX_LEMBRETE_IDADE_MINIMA_MS = 2 * 60 * 60 * 1000;
/** Janela de envio em Brasilia, em minutos desde a meia-noite: [09h00, 21h00). */
const PIX_LEMBRETE_INICIO_MIN = 9 * 60;
const PIX_LEMBRETE_FIM_MIN = 21 * 60;

/**
 * O instante cai na janela de envio do lembrete de Pix, em Brasilia?
 *
 * Uma copia so da regra: `decidirLembretePix` e o corte de `rodarLembretesPix`
 * chamam esta funcao. Com a comparacao repetida nos dois, a correcao de um
 * limite aplicada num lugar deixaria o outro errado.
 */
export function dentroDaJanelaPix(agoraMs: number): boolean {
  const { minutos } = relogioDeBrasilia(agoraMs);
  return minutos >= PIX_LEMBRETE_INICIO_MIN && minutos < PIX_LEMBRETE_FIM_MIN;
}

/**
 * Qual lembrete de Pix pendente sai AGORA, se algum. Pura, para o teste afirmar
 * a tabela.
 *
 * `p1` (variante `aberto`) com pelo menos duas horas de vida e antes do dia do
 * vencimento; `p0` (`vence_hoje`) no dia do vencimento, a qualquer hora da
 * janela, com PRIORIDADE sobre o `p1` e sobre a idade minima. A cobranca segue
 * pagavel o dia inteiro: o PAYMENT_OVERDUE foi medido chegando entre 03h e 04h
 * do dia SEGUINTE nos 13 casos observados.
 *
 * Um estagio por execucao e sem retroatividade, como `decidirLembrete`: quem
 * chega ao dia do vencimento sem o `p1` recebe so o `p0`.
 *
 * A JANELA MORA AQUI, e nao na expressao cron, para ser testavel. O limite de
 * 21h e exclusivo. Todo relogio e o de Brasilia (`relogioDeBrasilia`), nunca o
 * do processo, que em producao roda em UTC.
 */
export function decidirLembretePix(args: {
  criadaEmIso: string;
  pixDueDate: string | null;
  jaEnviados: string[];
  agoraMs: number;
}): DecisaoPix {
  const vencimento = normalizarDataPix(args.pixDueDate);
  if (!vencimento) return { tipo: "pular", motivo: "sem_vencimento" };

  if (!dentroDaJanelaPix(args.agoraMs)) {
    return { tipo: "pular", motivo: "fora_do_horario" };
  }
  const { dia: hoje } = relogioDeBrasilia(args.agoraMs);

  // `YYYY-MM-DD` ordena como texto.
  if (hoje > vencimento) return { tipo: "pular", motivo: "vencida" };
  if (hoje === vencimento) {
    return args.jaEnviados.includes("p0")
      ? { tipo: "pular", motivo: "ja_enviado" }
      : { tipo: "enviar", estagio: "p0", variant: "vence_hoje" };
  }

  const criadaMs = Date.parse(args.criadaEmIso);
  // Sem saber a idade, nao ha como respeitar a idade minima: nao envia.
  if (!Number.isFinite(criadaMs)) {
    return { tipo: "pular", motivo: "criacao_ilegivel" };
  }
  if (args.agoraMs - criadaMs < PIX_LEMBRETE_IDADE_MINIMA_MS) {
    return { tipo: "pular", motivo: "muito_recente" };
  }
  if (args.jaEnviados.includes("p1")) {
    return { tipo: "pular", motivo: "ja_enviado" };
  }
  return { tipo: "enviar", estagio: "p1", variant: "aberto" };
}

const COLUNAS_DE_LEMBRETE =
  "id, user_id, current_period_end, renewal_reminders_sent, plan_id, payment_method";

/**
 * Quem recebe lembrete de renovacao: manual, ativa, vencendo dentro da janela.
 *
 * EXPORTADA para teste, no mesmo criterio de `expirarAssinaturasManuais`: o que
 * importa provar aqui e QUAIS LINHAS a condicao pega, e isso so se prova
 * rodando a consulta contra um duble que APLICA os filtros. Um teste que
 * conferisse o formato da query provaria a intencao, nao o efeito.
 *
 * SEM FILTRO DE PROVEDOR desde 2026-09-06. Ate entao `.neq("provider",
 * "asaas")` ficava aqui porque `POST /api/billing/renew` tinha Stripe e boleto
 * fixos em duro, e um assinante Pix receberia lembrete de boleto. A rota passou
 * a despachar por provedor e metodo (shared/renewalMethod.ts), entao a pergunta
 * "quem renova" voltou a ser so `renewal_type='manual'`.
 */
export function selecionarAssinaturasAVencer(
  fromRow: number,
  toRow: number,
  nowIso: string,
  windowIso: string,
) {
  return supabaseAdmin
    .from("subscriptions")
    .select(COLUNAS_DE_LEMBRETE)
    .eq("renewal_type", "manual")
    .eq("status", "active")
    .gt("current_period_end", nowIso)
    .lte("current_period_end", windowIso)
    .order("id", { ascending: true })
    .range(fromRow, toRow);
}

/**
 * Quem venceu desde a rodada anterior: manual, com fim em (desde, agora].
 *
 * ACEITA `canceled` ALEM DE `active`, e isso e o ponto: o cron de expiracao
 * (`expirarAssinaturasManuais`, a cada 6 horas) escreve `canceled` na manual
 * vencida antes de este job rodar, e filtrar so `active` deixaria quase todo
 * mundo sem o e-mail de termino. `superseded` fica fora: a pessoa ja renovou
 * por linha nova. Cartao (`auto`) nunca entra.
 */
export function selecionarAssinaturasRecemVencidas(
  fromRow: number,
  toRow: number,
  desdeIso: string,
  nowIso: string,
) {
  return supabaseAdmin
    .from("subscriptions")
    .select(COLUNAS_DE_LEMBRETE)
    .eq("renewal_type", "manual")
    .in("status", ["active", "canceled"])
    .gt("current_period_end", desdeIso)
    .lte("current_period_end", nowIso)
    .order("id", { ascending: true })
    .range(fromRow, toRow);
}

type LinhaDeLembrete = {
  id: string;
  // Nao-nulo no schema e usado direto no getUserById logo abaixo.
  user_id: string;
  current_period_end: string | null;
  // Array de codigos de marco (`d7`, `d3`, `d0`...), nao contador.
  renewal_reminders_sent: string[] | null;
  plan_id: string | null;
  payment_method: string | null;
};

export type ResultadoDosLembretes = {
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  /** Notificacao no site que falhou DEPOIS de o e-mail sair. Nao e `failed`. */
  notificationFailures: number;
};

/**
 * A rodada de lembretes, separada da rota para ser exercitada com dubles.
 *
 * Por linha: decide o marco (`decidirLembrete`), enfileira o e-mail certo
 * (lembrete ou termino), marca o marco SO depois de o enqueue ser aceito
 * (at-least-once no enfileiramento), e por fim cria a notificacao no site. A
 * notificacao vem por ultimo e nao conta como falha: o e-mail ja saiu e o
 * marco ja esta gravado; um aviso a menos no sino nao justifica reenviar o
 * e-mail na proxima rodada.
 */
export async function rodarLembretesDeRenovacao(
  now: Date,
): Promise<ResultadoDosLembretes> {
  const nowIso = now.toISOString();
  // Janela do maior marco (30d anual) + folga; os demais caem dentro.
  const windowIso = new Date(now.getTime() + 31 * DAY_MS).toISOString();
  const desdeIso = new Date(now.getTime() - DAY_MS).toISOString();

  // PAGINADO: caminho de ENVIO. Truncar aqui nao erra um numero, deixa de
  // mandar o lembrete de renovacao para quem esta no fim da lista, e o cron
  // termina reportando sucesso. Falha silenciosa que so o cliente percebe.
  const aVencer = await coletarTagueado<LinhaDeLembrete>(
    (fromRow, toRow) =>
      selecionarAssinaturasAVencer(fromRow, toRow, nowIso, windowIso),
    "expiring-subscriptions due",
  );
  if (aVencer.error) throw aVencer.error;
  const recemVencidas = await coletarTagueado<LinhaDeLembrete>(
    (fromRow, toRow) =>
      selecionarAssinaturasRecemVencidas(fromRow, toRow, desdeIso, nowIso),
    "expiring-subscriptions ended",
  );
  if (recemVencidas.error) throw recemVencidas.error;

  const rows = [...(aVencer.data ?? []), ...(recemVencidas.data ?? [])];

  // plan_id (uuid) -> code, numa consulta so (poucos planos).
  const planCodeById = new Map<string, string>();
  if (rows.length > 0) {
    const { data: plans } = await supabaseAdmin
      .from("plans")
      .select("id, code");
    for (const p of plans || []) planCodeById.set(p.id, p.code);
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let notificationFailures = 0;
  const semMarcos = new Set<string>();

  for (const row of rows) {
    try {
      const code = row.plan_id ? planCodeById.get(row.plan_id) : undefined;
      const already = row.renewal_reminders_sent ?? [];
      const decisao = decidirLembrete({
        planCode: code ?? "",
        currentPeriodEnd: row.current_period_end,
        alreadySent: already,
        nowMs: now.getTime(),
      });
      if (decisao.tipo === "pular") {
        if (decisao.motivo === "sem_marcos") semMarcos.add(code ?? "?");
        skipped++;
        continue;
      }
      // `decidirLembrete` so devolve lembrete/termino para `PlanId` conhecido
      // e com `current_period_end` legivel; os dois `!` abaixo dependem disso.
      const planId = code as PlanId;
      const currentPeriodEnd = row.current_period_end!;

      const token = issueRenewalToken({
        subscriptionId: row.id,
        currentPeriodEnd,
      });
      if (!token) {
        console.error(
          `[cron/expiring-subscriptions] token nulo para sub ${row.id} (RENEWAL_TOKEN_SECRET ausente?); pulando.`,
        );
        failed++;
        continue;
      }

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        row.user_id,
      );
      const emailTo = authData?.user?.email;
      if (!emailTo) {
        console.warn(
          `[cron/expiring-subscriptions] sub ${row.id} sem e-mail; pulando.`,
        );
        skipped++;
        continue;
      }
      const name = String(
        authData?.user?.user_metadata?.name ||
          emailTo.split("@")[0] ||
          "assinante",
      );

      const pricing = PLAN_PRICING[planId];
      const renewUrl = `${env.appPublicUrl}/renovar?t=${token}`;

      // Enfileira PRIMEIRO; so marca o marco se o enqueue for ACEITO. Se o
      // enqueue lancar (Redis fora/timeout), NAO marca -> a proxima run tenta
      // de novo (at-least-once no enfileiramento). Uma falha posterior do
      // worker (attempts:3) nao desmarca: aquele marco se perde, mas os outros
      // cobrem o assinante.
      if (decisao.tipo === "termino") {
        await enqueueEmail({
          type: "access_ended",
          to: emailTo,
          name,
          gender: null,
          planName: pricing.label,
          priceLabel: pricing.totalLabel,
          renewUrl,
        });
      } else {
        await enqueueEmail({
          type: "renewal_reminder",
          to: emailTo,
          name,
          gender: null,
          planName: pricing.label,
          priceLabel: pricing.totalLabel,
          dueDateIso: currentPeriodEnd,
          renewUrl,
          daysRemaining: decisao.daysRemaining,
          // O e-mail diz por qual meio a renovacao vai ser cobrada, com a
          // MESMA regra que a rota de renovacao aplica no clique.
          paymentMethod: metodoDaRenovacao(row.payment_method, planId),
        });
      }

      const { error: markError } = await supabaseAdmin
        .from("subscriptions")
        .update({ renewal_reminders_sent: [...already, decisao.codigo] })
        .eq("id", row.id);
      if (markError) {
        // Enfileirado mas nao marcado: risco de reenvio na proxima run. Grita.
        console.error(
          `[cron/expiring-subscriptions] marco ${decisao.codigo} enfileirado mas NAO marcado (sub ${row.id}):`,
          markError,
        );
        failed++;
        continue;
      }
      sent++;

      // NOTIFICACAO NO SITE, por ultimo. Tipo `system`: o enum do banco nao
      // tem tipo de cobranca, e criar um e migration (fora deste lote).
      // TODO(Ana)
      try {
        await createTargetedNotification({
          email: emailTo,
          type: "system",
          title:
            decisao.tipo === "termino"
              ? "Seu Pro terminou"
              : `Seu Pro vence em ${decisao.daysRemaining} ${decisao.daysRemaining === 1 ? "dia" : "dias"}`,
          body:
            decisao.tipo === "termino"
              ? "O período da sua assinatura chegou ao fim e o acesso Pro foi pausado. Renove quando quiser."
              : "A renovação é manual. Renove antes do vencimento para não perder o acesso.",
          ctaUrl: renewUrl,
          ctaLabel: "Renovar",
        });
      } catch (err) {
        notificationFailures++;
        console.error(
          `[cron/expiring-subscriptions] notificacao no site falhou para sub ${row.id} (o e-mail ja saiu):`,
          err,
        );
      }
    } catch (err) {
      failed++;
      console.error(
        `[cron/expiring-subscriptions] falha na sub ${row.id}:`,
        err,
      );
    }
  }

  if (semMarcos.size > 0) {
    // Plano sem regua e configuracao faltando: ate 2026-09-06 isto era
    // `skipped` mudo, e o mensal ficou meses sem lembrete por causa disso.
    Sentry.captureMessage("renewal_milestones_ausentes", {
      level: "warning",
      fingerprint: ["renewal-milestones-ausentes"],
      tags: { origem: "cron-expiring-subscriptions" },
      extra: { plan_codes: Array.from(semMarcos).sort() },
    });
  }

  return {
    candidates: rows.length,
    sent,
    skipped,
    failed,
    notificationFailures,
  };
}

// Lembrete de renovacao manual (boleto e Pix). Filtro fail-closed: SO
// renewal_type='manual' (cartao renova sozinho e nunca pode receber este
// e-mail). Um marco por assinatura por run; marca o marco so apos o enqueue
// ser aceito (at-least-once). A rodada vive em `rodarLembretesDeRenovacao`.
router.post(
  "/expiring-subscriptions",
  withCronLock("expiring-subscriptions", 600, async (_req, res, next) => {
    const startedAt = new Date();
    try {
      const r = await rodarLembretesDeRenovacao(new Date());
      await recordCronRun({
        jobName: "expiring-subscriptions",
        status: r.failed > 0 ? "partial" : "success",
        startedAt,
        payload: r,
      });
      res.json({ data: r });
    } catch (err) {
      await recordCronRun({
        jobName: "expiring-subscriptions",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Boleto vence em 3 dias (expires_after_days); passado o prazo o Stripe emite
// async_payment_failed e o handler marca canceled. Se ESSE evento se perde, a linha
// fica pending para sempre e o guard 409 boleto_pending trava o usuario de assinar
// de novo (bug silencioso, permanente, do lado de quem quer pagar). Este cron limpa
// os orfaos: pending de boleto com created_at alem da janela segura. NUNCA cancela
// boleto pago: consulta a Checkout Session e so cancela com payment_status != 'paid'.
// Na duvida (pago, ou erro na consulta), deixa a linha VIVA. Sem e-mail.
const ORPHAN_BOLETO_DAYS = 4; // 3d do boleto + 1d de folga (evento tardio, TZ, skew)

router.post(
  "/expire-pending-boletos",
  withCronLock("expire-pending-boletos", 600, async (_req, res, next) => {
    const startedAt = new Date();
    try {
      const cutoffIso = new Date(
        Date.now() - ORPHAN_BOLETO_DAYS * DAY_MS,
      ).toISOString();

      // PAGINADO: caminho de ESCRITA. Cada linha daqui vira um UPDATE para
      // status='canceled'; a que ficar fora da pagina continua `pending` para
      // sempre e segue bloqueando o guard 409 de nova assinatura.
      const { data: orphans, error: orphansError } = await coletarTagueado<{
        id: string;
        provider_subscription_id: string | null;
      }>(
        (fromRow, toRow) =>
          supabaseAdmin
            .from("subscriptions")
            .select("id, provider_subscription_id")
            .eq("payment_method", "boleto")
            .eq("status", "pending")
            .lt("created_at", cutoffIso)
            .order("id", { ascending: true })
            .range(fromRow, toRow),
        "expire-pending-boletos orphans",
      );

      if (orphansError) {
        await recordCronRun({
          jobName: "expire-pending-boletos",
          status: "error",
          startedAt,
          errorMessage: orphansError.message,
        });
        return next(
          montarDbError(
            "cron",
            "cron/expire-pending-boletos load orphans",
            orphansError,
            "Erro ao buscar boletos pendentes.",
          ),
        );
      }

      const rows = orphans || [];
      const stripe = getStripe();
      let canceled = 0;
      let paidKept = 0;
      let skipped = 0;
      let failed = 0;

      for (const row of rows) {
        try {
          const sessionId = row.provider_subscription_id;
          if (!sessionId) {
            skipped++;
            continue;
          }

          // Guard definitivo antes de matar: 1 retrieve por orfao (raros, e o
          // conjunto ja veio filtrado por idade), custo negligivel.
          //
          // MESMO caminho que o detalhe do admin usa (server/lib/boletoSession.ts).
          // Antes era um retrieve escrito aqui; virou funcao compartilhada para
          // os dois lados nao divergirem, ja que os dois decidem sobre o mesmo
          // boleto. A funcao nao lanca: incerteza vira estado 'indisponivel'.
          const estado = await lerSessaoDeBoleto(sessionId, stripe);

          if (estado.estado === "indisponivel") {
            // Falha na consulta = incerteza: NAO cancela (fail-safe, deixa viva).
            console.error(
              `[cron/expire-pending-boletos] leitura da sessao falhou para ${sessionId}; mantendo linha viva: ${estado.motivo}`,
            );
            failed++;
            continue;
          }

          if (estado.pago) {
            // Boleto PAGO cujo async_payment_succeeded se perdeu: dinheiro entrou,
            // acesso nao saiu. NUNCA cancelar; grita para investigacao (a reativacao
            // passa pelo handler de webhook, fora do escopo deste cron).
            console.error(
              `[cron/expire-pending-boletos] boleto PAGO ainda pending (session ${sessionId}, sub ${row.id}); NAO cancelado, investigar ativacao perdida.`,
            );
            paidKept++;
            continue;
          }

          // Nao pago e alem da janela: orfao. Marca canceled (mesmo estado do
          // async_payment_failed), liberando o guard 409. Condicional em pending
          // para idempotencia.
          const { error: cancelError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              last_event_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .eq("status", "pending");
          if (cancelError) {
            console.error(
              `[cron/expire-pending-boletos] falha ao cancelar sub ${row.id}:`,
              cancelError,
            );
            failed++;
          } else {
            canceled++;
          }
        } catch (err) {
          failed++;
          console.error(
            `[cron/expire-pending-boletos] falha na sub ${row.id}:`,
            err,
          );
        }
      }

      await recordCronRun({
        jobName: "expire-pending-boletos",
        status: failed > 0 ? "partial" : "success",
        startedAt,
        payload: {
          candidates: rows.length,
          canceled,
          paidKept,
          skipped,
          failed,
        },
      });
      res.json({
        data: { candidates: rows.length, canceled, paidKept, skipped, failed },
      });
    } catch (err) {
      await recordCronRun({
        jobName: "expire-pending-boletos",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

/**
 * Ids por consulta de assinantes. O filtro `in` vai na URL do PostgREST, e uma
 * lista longa demais estoura o limite de tamanho dela; 100 uuids ficam bem
 * abaixo.
 */
const PIX_ASSINANTES_POR_BLOCO = 100;

/**
 * Divide a lista em blocos de ate `tamanho`, na ordem. Local de proposito: o
 * `chunk` de server/lib/searchIndex.ts e privado daquele modulo.
 */
function emBlocos<T>(itens: T[], tamanho: number): T[][] {
  const blocos: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    blocos.push(itens.slice(i, i + tamanho));
  }
  return blocos;
}

const COLUNAS_PIX_PENDENTE =
  "id, user_id, plan_id, created_at, provider_subscription_id, pix_due_date, pix_invoice_url, pix_reminders_sent";

type LinhaPixPendente = {
  id: string;
  user_id: string;
  plan_id: string | null;
  created_at: string;
  provider_subscription_id: string | null;
  pix_due_date: string | null;
  pix_invoice_url: string | null;
  pix_reminders_sent: string[] | null;
};

export type ResultadoLembretesPix = {
  /** Estado da flag nesta execucao. `false` e rodada de observacao. */
  ligado: boolean;
  candidatos: number;
  enviados: number;
  /** Com a flag desligada: o que TERIA saido, por estagio. */
  enviaria: { p1: number; p0: number };
  falhas: number;
  backfills: number;
  /** Contagem por motivo de quem ficou sem lembrete. */
  pulados: Record<string, number>;
};

/**
 * A rodada do lembrete de Pix pendente, separada da rota para ser exercitada
 * com dubles.
 *
 * SELECAO PELO BANCO, DECISAO FINAL PELO ASAAS. Cada candidata e relida em
 * `lerPagamento` e so segue com `status === "PENDING"`: em 2026-09-03 a fila de
 * webhooks do Asaas ficou 12 horas parada com um PAYMENT_RECEIVED real preso
 * atras, e uma linha `pending` no banco nao prova que a pessoa nao pagou.
 * Leitura indisponivel nao envia e conta falha.
 *
 * ASSINANTE NAO RECEBE. O `internalRenewal` cria uma linha pending/pix/manual
 * identica a de compra, e quem renova ja recebe a regua de renovacao; sem este
 * guard levaria um segundo e-mail com texto de primeira compra. A checagem e
 * UMA consulta para todos os candidatos, antes do laco.
 *
 * FLAG DESLIGADA (`pixRemindersEnabled`, o padrao) e rodada de observacao: tudo
 * e lido e decidido, e o que sairia vai para `enviaria`, sem enfileirar nem
 * marcar nada. E o que o primeiro deploy registra no cron_run_logs.
 */
export async function rodarLembretesPix(
  agora: Date,
): Promise<ResultadoLembretesPix> {
  const r: ResultadoLembretesPix = {
    ligado: env.pixRemindersEnabled,
    candidatos: 0,
    enviados: 0,
    enviaria: { p1: 0, p0: 0 },
    falhas: 0,
    backfills: 0,
    pulados: {},
  };
  const pular = (motivo: string) => {
    r.pulados[motivo] = (r.pulados[motivo] ?? 0) + 1;
  };

  // PAGINADO: caminho de ENVIO. Truncar deixaria de lembrar quem esta no fim da
  // lista e o cron terminaria reportando sucesso.
  const { data, error } = await coletarTagueado<LinhaPixPendente>(
    (fromRow, toRow) =>
      supabaseAdmin
        .from("subscriptions")
        .select(COLUNAS_PIX_PENDENTE)
        .eq("provider", "asaas")
        .eq("payment_method", "pix")
        .eq("status", "pending")
        .order("id", { ascending: true })
        .range(fromRow, toRow),
    "pix-pending-reminders pendentes",
  );
  if (error) throw new Error(error.message);
  const linhas = data ?? [];
  r.candidatos = linhas.length;
  if (linhas.length === 0) return r;

  // CORTE DE HORARIO ANTES DE TUDO QUE CUSTA. A selecao acima fica de fora: e
  // uma consulta ao nosso banco, e o numero de candidatos e o que a rodada de
  // observacao precisa ver. Ler o Asaas custa uma chamada externa POR LINHA, e
  // fora da janela a resposta nao tem uso nenhum, porque tudo acabaria em
  // `fora_do_horario`. Supressao, assinantes, planos e backfill tambem ficam
  // para as rodadas dentro da janela.
  if (!dentroDaJanelaPix(agora.getTime())) {
    r.pulados.fora_do_horario = linhas.length;
    return r;
  }

  const suprimidos = await fetchSuppressedEmailSet();

  // EM BLOCOS: a lista de ids vai na URL do PostgREST, e numa consulta so ela
  // estouraria o limite de tamanho quando as cobrancas abertas passassem de
  // uma centena. O erro derrubaria a rodada inteira e ninguem receberia nada.
  const userIds = Array.from(new Set(linhas.map((l) => l.user_id)));
  const assinantes = new Set<string>();
  for (const bloco of emBlocos(userIds, PIX_ASSINANTES_POR_BLOCO)) {
    const { data: ativas, error: ativasError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("user_id", bloco)
      .in("status", ["active", "trialing"]);
    // Fail-closed em QUALQUER bloco: sem saber quem ja assina, mandar texto de
    // compra para um assinante e o erro que este guard existe para evitar.
    if (ativasError) {
      throw new Error(
        `pix-pending-reminders: leitura de assinantes falhou: ${ativasError.message}`,
      );
    }
    for (const a of (ativas ?? []) as Array<{ user_id: string }>) {
      assinantes.add(a.user_id);
    }
  }

  const planCodeById = new Map<string, string>();
  const { data: plans } = await supabaseAdmin.from("plans").select("id, code");
  for (const p of (plans ?? []) as Array<{ id: string; code: string }>) {
    planCodeById.set(p.id, p.code);
  }

  for (const linha of linhas) {
    try {
      const chargeId = linha.provider_subscription_id;
      if (!chargeId) {
        pular("sem_cobranca");
        continue;
      }
      if (assinantes.has(linha.user_id)) {
        pular("ja_assinante");
        continue;
      }

      let pagamento: Awaited<ReturnType<typeof lerPagamento>>;
      try {
        pagamento = await lerPagamento(chargeId);
      } catch (err) {
        r.falhas++;
        console.error(
          `[cron/pix-pending-reminders] leitura da cobranca ${chargeId} falhou (linha ${linha.id}); nao envia:`,
          err,
        );
        continue;
      }
      if (pagamento.status !== "PENDING") {
        pular("nao_esta_mais_pendente");
        continue;
      }

      // BACKFILL OPORTUNISTA: a leitura ja aconteceu, entao o vencimento e a
      // fatura que faltam na linha (as criadas antes do lote 2) sao gravados de
      // graca. Best-effort, no mesmo espirito de createCheckout: a decisao usa
      // o valor LIDO, mesmo que a gravacao falhe.
      const vencimentoLido = normalizarDataPix(pagamento.dueDate);
      const backfill: Record<string, string> = {};
      if (!linha.pix_due_date && vencimentoLido) {
        backfill.pix_due_date = vencimentoLido;
      }
      if (!linha.pix_invoice_url && pagamento.invoiceUrl) {
        backfill.pix_invoice_url = pagamento.invoiceUrl;
      }
      if (Object.keys(backfill).length > 0) {
        try {
          const { error: backfillError } = await supabaseAdmin
            .from("subscriptions")
            .update(backfill)
            .eq("id", linha.id);
          if (backfillError) {
            console.warn(
              `[cron/pix-pending-reminders] backfill nao gravado na linha ${linha.id}: ${backfillError.message}`,
            );
          } else {
            r.backfills++;
          }
        } catch (err) {
          console.warn(
            `[cron/pix-pending-reminders] backfill nao gravado na linha ${linha.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      const vencimento = normalizarDataPix(linha.pix_due_date) ?? vencimentoLido;
      if (!vencimento) {
        pular("sem_vencimento");
        continue;
      }
      const jaEnviados = linha.pix_reminders_sent ?? [];
      const decisao = decidirLembretePix({
        criadaEmIso: linha.created_at,
        pixDueDate: vencimento,
        jaEnviados,
        agoraMs: agora.getTime(),
      });
      if (decisao.tipo === "pular") {
        pular(decisao.motivo);
        continue;
      }

      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(
        linha.user_id,
      );
      const emailTo = authData?.user?.email;
      if (!emailTo) {
        pular("sem_email");
        continue;
      }
      if (suprimidos.has(emailTo.toLowerCase())) {
        pular("suprimido");
        continue;
      }

      // VALOR DA COBRANCA, lido no Asaas, e nunca o do plano: com cupom os dois
      // divergem. Sem numero, nao envia: preco inventado num e-mail de cobranca
      // e pior que e-mail nenhum.
      const amountCents = pagamento.valueCents;
      if (amountCents === null) {
        pular("sem_valor");
        continue;
      }
      const planCode = linha.plan_id
        ? planCodeById.get(linha.plan_id)
        : undefined;
      if (!planCode || !isPlanId(planCode)) {
        pular("plano_desconhecido");
        continue;
      }

      if (!r.ligado) {
        r.enviaria[decisao.estagio]++;
        continue;
      }

      const name = String(
        authData?.user?.user_metadata?.name ||
          emailTo.split("@")[0] ||
          "assinante",
      );
      await enqueueEmail(
        {
          type: "pix_pending_reminder",
          to: emailTo,
          name,
          subscriptionId: linha.id,
          variant: decisao.variant,
          planName: PLAN_PRICING[planCode].label,
          amountCents,
          dueDate: vencimento,
          payUrl: `${env.appPublicUrl}/perfil?pix=abrir`,
          invoiceUrl: linha.pix_invoice_url ?? pagamento.invoiceUrl ?? null,
        },
        { jobId: `pix-lembrete:${linha.id}:${decisao.estagio}` },
      );

      // MARCA SO DEPOIS de o enqueue ser aceito. O `jobId` acima existe para o
      // caso em que o enqueue foi aceito e ESTA marcacao falhou: a proxima
      // execucao tenta o mesmo estagio e o BullMQ recusa a duplicata enquanto o
      // job estiver retido. O buraco e a falha dupla: o envio esgota as
      // tentativas (job falho fica retido 30 dias, e o mesmo `jobId` e ignorado
      // em silencio nesse periodo) E a marcacao falha. Ai o lembrete some sem
      // rastro. E raro e preferivel a um e-mail duplicado, mas nao pode ser
      // invisivel: o `duplicata_possivel` no log e o unico sinal de que aquele
      // par linha e estagio ficou num estado ambiguo.
      const { error: markError } = await supabaseAdmin
        .from("subscriptions")
        .update({ pix_reminders_sent: [...jaEnviados, decisao.estagio] })
        .eq("id", linha.id);
      if (markError) {
        console.error(
          `[cron/pix-pending-reminders] duplicata_possivel: estagio ${decisao.estagio} enfileirado e NAO marcado na linha ${linha.id} (${markError.message}).`,
        );
        r.falhas++;
        continue;
      }
      r.enviados++;
    } catch (err) {
      r.falhas++;
      console.error(
        `[cron/pix-pending-reminders] falha na linha ${linha.id}:`,
        err,
      );
    }
  }

  return r;
}

// Lembrete de Pix pendente: e-mail para quem gerou um Pix e nao pagou. Nasce
// DESLIGADO (`pixRemindersEnabled`); desligado, so observa. De hora em hora, e
// a janela de envio (09h a 21h de Brasilia) mora em `decidirLembretePix`.
router.post(
  "/pix-pending-reminders",
  withCronLock("pix-pending-reminders", 600, async (_req, res, next) => {
    const startedAt = new Date();
    try {
      const r = await rodarLembretesPix(new Date());
      await recordCronRun({
        jobName: "pix-pending-reminders",
        status: r.falhas > 0 ? "partial" : "success",
        startedAt,
        payload: r,
      });
      res.json({ data: r });
    } catch (err) {
      await recordCronRun({
        jobName: "pix-pending-reminders",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

/**
 * Pix sem vencimento gravado (linhas anteriores ao lote 2) so expira depois
 * disto, contado do `created_at`: os 2 dias de prazo (`PIX_DUE_DAYS`) mais 2 de
 * folga, na mesma logica do `ORPHAN_BOLETO_DAYS`.
 */
const PIX_SEM_VENCIMENTO_DIAS = 4;

/**
 * Status de cobranca do Asaas que significam dinheiro recebido. O mesmo
 * conjunto de `STATUS_DE_COBRANCA_PAGA` em server/providers/asaas.ts, que e
 * privado daquele modulo.
 */
const STATUS_PIX_PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

const COLUNAS_PIX_EXPIRACAO =
  "id, provider_subscription_id, pix_due_date, created_at";

type LinhaPixExpiracao = {
  id: string;
  provider_subscription_id: string | null;
  pix_due_date: string | null;
  created_at: string;
};

export type ResultadoExpiracaoPix = {
  /** Estado da flag nesta execucao. `false` e rodada de observacao. */
  ligado: boolean;
  candidatos: number;
  canceladas: number;
  /** Com a flag desligada: quantas TERIAM sido canceladas. */
  cancelaria: number;
  /** Cobranca paga no Asaas com a linha ainda pending. Nunca cancelada. */
  pagosMantidos: number;
  falhas: number;
  /** Contagem por motivo de quem ficou de fora. */
  pulados: Record<string, number>;
};

/**
 * Dinheiro entrou e o acesso nao saiu: a linha segue pending com a cobranca
 * paga. NAO cancela (seria fechar a unica linha que o webhook atrasado ainda
 * pode ativar) e grita, porque a correcao e humana.
 */
function gritarPixPagoPendente(
  linhaId: string,
  chargeId: string,
  status: string,
): void {
  console.error(
    `[cron/expire-pending-pix] Pix PAGO com a linha ainda pending (cobranca ${chargeId}, linha ${linhaId}, status ${status}); NAO cancelado, investigar ativacao perdida.`,
  );
  Sentry.captureMessage("pix_expiry_pago_em_linha_pendente", {
    level: "error",
    fingerprint: ["pix-expiry-pago-em-linha-pendente"],
    tags: { origem: "cron-expire-pending-pix" },
    extra: {
      subscription_row_id: linhaId,
      asaas_payment_id: chargeId,
      asaas_status: status,
    },
  });
}

/**
 * A rodada de expiracao do Pix vencido, separada da rota para ser exercitada
 * com dubles.
 *
 * O PROBLEMA: uma linha pending/pix trava o guard 409 `pix_pending` do
 * checkout, e quem a encerra e o PAYMENT_OVERDUE. Quando o evento nao chega, a
 * pessoa nao consegue gerar Pix novo nem assinar, para sempre. O
 * `expire-pending-boletos` faz isto para boleto e nao alcanca Pix.
 *
 * A ORDEM E O PONTO: exclui a cobranca NO ASAAS primeiro, e so depois fecha a
 * linha. Fechar so a linha deixaria a cobranca pagavel sem linha pending para
 * ativar: o pagamento tardio cairia em `registrarPagamentoForaDoFluxo`, entraria
 * no ledger e o acesso nao sairia. Se a exclusao remota nao se confirma, a
 * linha FICA VIVA. Na duvida, sempre viva, igual ao boleto.
 *
 * SELECAO: vencimento anterior a ONTEM em Brasilia (um dia de folga depois do
 * vencimento, porque o PAYMENT_OVERDUE foi medido chegando entre 03h e 04h do
 * dia seguinte), ou sem vencimento e criada ha mais de
 * `PIX_SEM_VENCIMENTO_DIAS`.
 *
 * FLAG DESLIGADA (`pixExpiryEnabled`, o padrao) e rodada de observacao: le o
 * Asaas (leitura), decide, grita o pago e conta em `cancelaria`, sem excluir
 * nada no Asaas nem tocar em linha.
 */
export async function rodarExpiracaoPix(
  agora: Date,
): Promise<ResultadoExpiracaoPix> {
  const r: ResultadoExpiracaoPix = {
    ligado: env.pixExpiryEnabled,
    candidatos: 0,
    canceladas: 0,
    cancelaria: 0,
    pagosMantidos: 0,
    falhas: 0,
    pulados: {},
  };
  const pular = (motivo: string) => {
    r.pulados[motivo] = (r.pulados[motivo] ?? 0) + 1;
  };

  // `pix_due_date` e `date`, e `YYYY-MM-DD` compara como texto.
  const ontem = relogioDeBrasilia(agora.getTime() - DAY_MS).dia;
  const corteSemVencimentoIso = new Date(
    agora.getTime() - PIX_SEM_VENCIMENTO_DIAS * DAY_MS,
  ).toISOString();

  // PAGINADO: caminho de ESCRITA. A linha que ficasse fora da pagina seguiria
  // travando o guard 409 e a rodada reportaria sucesso.
  const vencidas = await coletarTagueado<LinhaPixExpiracao>(
    (fromRow, toRow) =>
      supabaseAdmin
        .from("subscriptions")
        .select(COLUNAS_PIX_EXPIRACAO)
        .eq("provider", "asaas")
        .eq("payment_method", "pix")
        .eq("status", "pending")
        .lt("pix_due_date", ontem)
        .order("id", { ascending: true })
        .range(fromRow, toRow),
    "expire-pending-pix vencidas",
  );
  if (vencidas.error) throw new Error(vencidas.error.message);
  const semVencimento = await coletarTagueado<LinhaPixExpiracao>(
    (fromRow, toRow) =>
      supabaseAdmin
        .from("subscriptions")
        .select(COLUNAS_PIX_EXPIRACAO)
        .eq("provider", "asaas")
        .eq("payment_method", "pix")
        .eq("status", "pending")
        .is("pix_due_date", null)
        .lt("created_at", corteSemVencimentoIso)
        .order("id", { ascending: true })
        .range(fromRow, toRow),
    "expire-pending-pix sem vencimento",
  );
  if (semVencimento.error) throw new Error(semVencimento.error.message);

  const linhas = [...(vencidas.data ?? []), ...(semVencimento.data ?? [])];
  r.candidatos = linhas.length;

  for (const linha of linhas) {
    try {
      const chargeId = linha.provider_subscription_id;
      if (!chargeId) {
        pular("sem_cobranca");
        continue;
      }

      let pagamento: Awaited<ReturnType<typeof lerPagamento>>;
      try {
        pagamento = await lerPagamento(chargeId);
      } catch (err) {
        r.falhas++;
        console.error(
          `[cron/expire-pending-pix] leitura da cobranca ${chargeId} falhou (linha ${linha.id}); mantendo linha viva:`,
          err,
        );
        continue;
      }

      if (pagamento.status && STATUS_PIX_PAGO.has(pagamento.status)) {
        gritarPixPagoPendente(linha.id, chargeId, pagamento.status);
        r.pagosMantidos++;
        continue;
      }

      if (!r.ligado) {
        r.cancelaria++;
        continue;
      }

      // `cancelPayment` nao lanca: o desfecho volta tipado. `already_paid` e o
      // pagamento que caiu entre a leitura acima e a exclusao.
      const cancelamento = await cancelPayment(chargeId);
      if (cancelamento.resultado === "already_paid") {
        gritarPixPagoPendente(linha.id, chargeId, cancelamento.status);
        r.pagosMantidos++;
        continue;
      }
      if (cancelamento.resultado === "falha") {
        r.falhas++;
        console.error(
          `[cron/expire-pending-pix] exclusao da cobranca ${chargeId} nao confirmada (linha ${linha.id}, motivo ${cancelamento.motivo}); mantendo linha viva.`,
        );
        continue;
      }

      // Condicional em pending para idempotencia. Se falhar, a cobranca ja
      // morreu no Asaas e o PAYMENT_DELETED que ele manda fecha a linha pelo
      // `closePendingCharge`; a proxima rodada tambem, pelo balde "ja removida".
      const agoraIso = new Date().toISOString();
      const { error: cancelError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: agoraIso,
          last_event_at: agoraIso,
        })
        .eq("id", linha.id)
        .eq("status", "pending");
      if (cancelError) {
        r.falhas++;
        console.error(
          `[cron/expire-pending-pix] cobranca ${chargeId} excluida no Asaas e a linha ${linha.id} NAO fechou:`,
          cancelError,
        );
        continue;
      }
      r.canceladas++;
    } catch (err) {
      r.falhas++;
      console.error(
        `[cron/expire-pending-pix] falha na linha ${linha.id}:`,
        err,
      );
    }
  }

  return r;
}

// Expiracao de Pix vencido: exclui a cobranca no Asaas e so depois fecha a
// linha. Nasce DESLIGADA (`pixExpiryEnabled`); desligada, so observa. Uma vez
// por dia, depois da hora em que o PAYMENT_OVERDUE costuma chegar.
router.post(
  "/expire-pending-pix",
  withCronLock("expire-pending-pix", 600, async (_req, res, next) => {
    const startedAt = new Date();
    try {
      const r = await rodarExpiracaoPix(new Date());
      await recordCronRun({
        jobName: "expire-pending-pix",
        status: r.falhas > 0 ? "partial" : "success",
        startedAt,
        payload: r,
      });
      res.json({ data: r });
    } catch (err) {
      await recordCronRun({
        jobName: "expire-pending-pix",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

type SubRow = {
  id: string;
  user_id?: string | null;
  provider?: string | null;
  status?: string | null;
  provider_subscription_id: string | null;
  current_period_end?: string | null;
};

// Resultado de reconciliar UMA linha Stripe. `outcome`:
// activated/reconciled/downgraded/unchanged/reconciled_terminal/reconciled_active/
// pending/skipped/failed. `reason` acompanha skipped e failed. Sem
// STRIPE_SECRET_KEY ou sem id do provedor vira skipped, nunca decisao silenciosa.
type RowOutcome = { provider: string; outcome: string; reason?: string };

function tallyByProvider(
  outcomes: RowOutcome[],
): Record<string, Record<string, number>> {
  const acc: Record<string, Record<string, number>> = {};
  for (const o of outcomes) {
    const bucket = acc[o.provider] ?? (acc[o.provider] = {});
    bucket[o.outcome] = (bucket[o.outcome] ?? 0) + 1;
  }
  return acc;
}

function countOutcome(outcomes: RowOutcome[], name: string): number {
  return outcomes.filter((o) => o.outcome === name).length;
}

function isProLikeStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

// Reconcilia UMA linha Stripe (usado nas duas fases): o estado vivo da Stripe
// (subscription retrieve) E a fonte de verdade, entao refletimos status/periodo
// no banco sem calcular ciclo. Sem STRIPE_SECRET_KEY ou sem id do provedor:
// skipped (nunca assume um estado). So escreve quando ha mudanca real.
// EXPORTADA para teste, no mesmo criterio de `expirarAssinaturasManuais` abaixo: o
// que importa provar e o que acontece com a violacao de unicidade na ativacao, e
// isso so se prova rodando a funcao contra um erro real do banco.
export async function reconcileStripeRow(sub: SubRow): Promise<RowOutcome> {
  if (!env.stripeSecretKey) {
    return {
      provider: "stripe",
      outcome: "skipped",
      reason: "stripe_not_configured",
    };
  }
  if (!sub.provider_subscription_id) {
    return {
      provider: "stripe",
      outcome: "skipped",
      reason: "missing_provider_subscription_id",
    };
  }

  const state = await getStripeSubscriptionState(sub.provider_subscription_id);
  const prevStatus = sub.status ?? null;
  const statusChanged = state.status !== prevStatus;
  const periodChanged =
    state.currentPeriodEnd !== (sub.current_period_end ?? null);

  if (!statusChanged && !periodChanged) {
    return { provider: "stripe", outcome: "unchanged" };
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: state.status,
      current_period_start: state.currentPeriodStart,
      current_period_end: state.currentPeriodEnd,
      cancel_at_period_end: state.cancelAtPeriodEnd,
      canceled_at:
        state.status === "canceled"
          ? (state.canceledAt ?? new Date().toISOString())
          : null,
      last_event_at: new Date().toISOString(),
    })
    .eq("id", sub.id);
  if (updateError) {
    // 23505 = unique_violation. So passa a existir com o indice parcial
    // `subscriptions_one_active_per_user` (migration 20260829120000) aplicado, e
    // so alcanca a FASE 1: ela seleciona linhas 'incomplete' e pode escrever
    // 'active', entao bate no indice quando o dono JA tem assinatura ativa.
    //
    // Por que isto merece Sentry e nao so `failed + 1`: duas assinaturas do
    // mesmo dono chegando a 'active' significa POSSIVEL PAGAMENTO DUPLO. Um
    // contador subindo no payload do cron nao faz ninguem agir; a linha some no
    // meio do relatorio da rodada e volta identica na rodada seguinte, para
    // sempre. Alem disso a escrita e uma so (diferente do par do boleto), entao
    // o 23505 aqui e o veredito correto do banco, nao um defeito a corrigir: o
    // que falta e alguem olhar.
    //
    // Demais falhas seguem exatamente como antes: propagam e o chamador conta
    // `failed`.
    if ((updateError as { code?: string }).code === "23505") {
      Sentry.captureMessage("stripe_reconcile_assinatura_duplicada", {
        level: "error",
        fingerprint: ["stripe-reconcile-assinatura-duplicada"],
        tags: { origem: "cron-reconcile-subscriptions" },
        extra: {
          user_id: sub.user_id,
          subscription_id: sub.id,
          provider_subscription_id: sub.provider_subscription_id,
          status_anterior: prevStatus,
          status_pretendido: state.status,
          db_message: updateError.message,
        },
      });
      console.error(
        `[cron/reconcile-subscriptions] VIOLACAO DE UNICIDADE ao ativar ${sub.id} ` +
          `(user ${sub.user_id}): o dono ja tem assinatura ativa. Possivel pagamento duplo, investigar.`,
      );
    }
    throw updateError;
  }

  // So o boolean Pro muda com o status; invalida o cache do dono nesse caso.
  if (statusChanged && sub.user_id) void invalidateProStatusCache(sub.user_id);

  if (isProLikeStatus(state.status) && !isProLikeStatus(prevStatus)) {
    return { provider: "stripe", outcome: "activated" };
  }
  if (!isProLikeStatus(state.status) && isProLikeStatus(prevStatus)) {
    return { provider: "stripe", outcome: "downgraded" };
  }
  return { provider: "stripe", outcome: "reconciled" };
}

// FASE 1: subscriptions presas em 'incomplete' ha >15min, reconciliadas contra
// o estado vivo da Stripe.
// NOTA: o filtro .or(...) com and(...) aninhado equivale a
// coalesce(last_event_at, created_at) <= cutoff. Sintaxe PostgREST sensivel;
// validar empiricamente ao testar o endpoint (supabaseAdmin e destipado).
async function reconcileIncompleteSubscriptions() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, provider, status, provider_subscription_id, current_period_end",
    )
    .eq("status", "incomplete")
    .or(
      `last_event_at.lte.${cutoff},and(last_event_at.is.null,created_at.lte.${cutoff})`,
    )
    .limit(25);

  if (error) throw error;

  const subs = (data || []) as SubRow[];
  const outcomes: RowOutcome[] = [];
  const failures: Array<{
    subscription_id: string;
    provider: string;
    reason: string;
  }> = [];

  for (const sub of subs) {
    try {
      const outcome = await reconcileStripeRow(sub);
      if (outcome.outcome === "skipped") {
        console.warn(
          `[cron/reconcile-subscriptions] incomplete ${sub.id} skipped (reason=${outcome.reason ?? "n/a"})`,
        );
      }
      outcomes.push(outcome);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, provider: "stripe", reason });
      outcomes.push({ provider: "stripe", outcome: "failed", reason });
      console.error(
        `[cron/reconcile-subscriptions] incomplete ${sub.id} falhou:`,
        err,
      );
    }
  }

  return {
    processed: subs.length,
    byProvider: tallyByProvider(outcomes),
    skipped: countOutcome(outcomes, "skipped"),
    failed: countOutcome(outcomes, "failed"),
    failures,
  };
}

// FASE 2: subscriptions 'active' com periodo vencido ha >3 dias (grace) e que
// NAO estao marcadas para cancelar, reconciliadas contra o estado vivo da Stripe.
async function reconcileExpiredSubscriptions() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, provider, status, provider_subscription_id, current_period_end",
    )
    .eq("status", "active")
    .or("cancel_at_period_end.is.null,cancel_at_period_end.eq.false")
    // Boleto (renewal_type='manual') NAO tem subscription na Stripe: seu
    // provider_subscription_id e um Checkout Session cs_..., entao um retrieve
    // lancaria e contaria a linha como failed todo dia. Boleto expirado nao
    // precisa de reconcile: o current_period_end no passado JA e a verdade
    // (is_user_pro nega pelo periodo). Excluido do filtro (renewal_type e NOT
    // NULL default 'auto', entao neq nao descarta cartao). Cartao inalterado.
    .neq("renewal_type", "manual")
    .lte("current_period_end", cutoff)
    .limit(25);

  if (error) throw error;

  const subs = (data || []) as SubRow[];
  const outcomes: RowOutcome[] = [];
  const failures: Array<{
    subscription_id: string;
    provider: string;
    reason: string;
  }> = [];

  for (const sub of subs) {
    try {
      const outcome = await reconcileStripeRow(sub);
      if (outcome.outcome === "skipped") {
        console.warn(
          `[cron/reconcile-subscriptions] expired ${sub.id} skipped (reason=${outcome.reason ?? "n/a"})`,
        );
      }
      outcomes.push(outcome);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, provider: "stripe", reason });
      outcomes.push({ provider: "stripe", outcome: "failed", reason });
      console.error(
        `[cron/reconcile-subscriptions] expired ${sub.id} falhou:`,
        err,
      );
    }
  }

  return {
    processed: subs.length,
    byProvider: tallyByProvider(outcomes),
    skipped: countOutcome(outcomes, "skipped"),
    failed: countOutcome(outcomes, "failed"),
    failures,
  };
}

// TTL 900s: 2 fases x ate 25 subscriptions x ate 2 chamadas Stripe cada
// (teto 15s por chamada); pior caso teorico na casa dos minutos.
/**
 * Teto do lote de expiracao de boleto. Paginado por dentro, mas limitado: uma
 * rodada que tentasse expirar milhares de linhas de uma vez seguraria o lock do
 * cron e competiria com o resto do job. O que sobra e pego na proxima rodada
 * (a cada 6 horas), e `capAtingido` na resposta diz quando sobrou, corte
 * silencioso e a classe de defeito que este projeto ja documentou.
 */
const BOLETO_EXPIRY_BATCH = 200;

/**
 * ASSINATURA MANUAL (boleto ou Pix) PAGA E VENCIDA: fecha o unico fim de vida
 * que nao tinha dono. Nasceu como `expirarBoletosVencidos`; o nome mudou em
 * 2026-09-06 porque o filtro nunca olhou provedor nem metodo, e o Pix manual
 * sempre entrou aqui.
 *
 * O buraco: para `renewal_type='manual'` NENHUM dos quatro caminhos que escrevem
 * `canceled_at` funciona. Nao ha subscription na Stripe (o
 * `provider_subscription_id` e um Checkout Session `cs_...`), entao
 * `customer.subscription.deleted` nunca chega; `process-cancellations` filtra
 * `cancel_at_period_end`, que o cancelamento de boleto NAO seta de proposito; e
 * `reconcileExpiredSubscriptions` exclui boleto explicitamente porque
 * `getStripeSubscriptionState` falharia com um id de sessao.
 * `expire-pending-boletos` cobre o boleto emitido e NAO PAGO. O pago que venceu
 * nao tinha ninguem: ficava `active` com periodo expirado para sempre.
 *
 * O acesso ja estava certo (is_user_pro nega pelo periodo); o que mentia era o
 * `status`, e ele contamina toda contagem que filtra `status='active'`,
 * inclusive o MRR.
 *
 * NAO CHAMA A STRIPE. Nao ha o que perguntar: a expiracao e decidivel no banco,
 * e a data de fim ja esta na linha.
 *
 * POR QUE A CONDICAO NAO PEGA QUEM DEVIA CONTINUAR ATIVO, por construcao e nao
 * por sorte:
 *
 *   - `current_period_end < now()` e exatamente o complemento do que is_user_pro
 *     aceita, entao toda linha que este job toca JA nao dava Pro. O acesso e
 *     inalterado pela mudanca de status. O cache de Pro e invalidado mesmo
 *     assim, pela COERENCIA da tela (ver o comentario junto da escrita);
 *   - `lt` nao casa NULL, entao assinatura sem data de fim (que da Pro
 *     indefinidamente por is_user_pro) nunca entra;
 *   - RENOVACAO EM CURSO nao e afetada: a renovacao de boleto cria uma LINHA
 *     NOVA, com o id da nova sessao e `status='pending'`
 *     (onBoletoAsyncPaymentSucceeded busca por `provider_subscription_id` da
 *     sessao nova e exige `pending`). A linha nova esta fora do filtro por
 *     status; depois de paga, fica fora pelo periodo futuro. Quem sobra e
 *     justamente a linha velha que ninguem mais toca.
 *
 * ESCREVE `canceled_at` E `status='canceled'`, e NAO grava linha em
 * `subscription_cancellations`. Essa ausencia e a informacao: cancelamento
 * VOLUNTARIO tem registro de motivo, vencimento nao tem. Inventar um
 * `reason_code` aqui poluiria o agregado da aba Retencao com um motivo que
 * ninguem deu. A distincao entre "cancelou" e "venceu e nao renovou" fica
 * legivel sem valor de status novo: e churn com registro contra churn sem
 * registro. Um `status='expired'` novo custaria um valor a mais numa coluna que
 * varias telas resolvem por mapa, e nao diria nada que a ausencia do registro ja
 * nao diga.
 */
// EXPORTADA para teste, no mesmo criterio de expenseOccurrences em
// financeMetrics.ts: o que importa provar aqui e QUAIS linhas a condicao pega, e
// isso so se prova rodando a funcao contra um dublê que APLICA os filtros. Um
// teste que apenas conferisse o formato da query estaria conferindo a intencao,
// nao o efeito.
export async function expirarAssinaturasManuais() {
  const nowIso = new Date().toISOString();

  const alvos: Array<{ id: string; user_id: string | null }> = [];
  let capAtingido = false;
  try {
    for await (const row of paginateRange<{
      id: string;
      user_id: string | null;
    }>(
      (from, to) =>
        supabaseAdmin
          .from("subscriptions")
          .select("id, user_id")
          .eq("renewal_type", "manual")
          .eq("status", "active")
          .lt("current_period_end", nowIso)
          .order("id", { ascending: true })
          .range(from, to),
      { errorLabel: "expire-ended-boletos" },
    )) {
      if (alvos.length >= BOLETO_EXPIRY_BATCH) {
        capAtingido = true;
        break;
      }
      alvos.push(row);
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }

  let expired = 0;
  let failed = 0;
  const failures: Array<{ subscription_id: string; reason: string }> = [];

  for (const alvo of alvos) {
    // Condicional em `status='active'`: se outro caminho tiver mudado a linha
    // entre a leitura e agora, o UPDATE nao pega nada e a rodada nao sobrescreve
    // decisao alheia. Mesma idempotencia do expire-pending-boletos.
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: nowIso,
        last_event_at: nowIso,
      })
      .eq("id", alvo.id)
      .eq("status", "active");
    if (error) {
      failed += 1;
      failures.push({ subscription_id: alvo.id, reason: error.message });
      console.error(
        `[cron/reconcile-subscriptions] falha ao expirar assinatura manual ${alvo.id}:`,
        error,
      );
      continue;
    }
    expired += 1;
    // O CACHE DE PRO CAI JUNTO. Nao pelo acesso (is_user_pro ja negava pelo
    // periodo, e o TTL e de 60 s), e sim pela coerencia da tela: a partir
    // daqui /api/billing/subscription devolve `expired`, e um "1" sobrevivente
    // no cache faria o middleware responder Pro sobre a mesma linha por ate um
    // minuto. Fire-and-forget como nos outros call sites do arquivo.
    if (alvo.user_id) void invalidateProStatusCache(alvo.user_id);
  }

  return { processed: alvos.length, expired, failed, capAtingido, failures };
}

router.post(
  "/reconcile-subscriptions",
  withCronLock("reconcile-subscriptions", 900, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const incomplete = await reconcileIncompleteSubscriptions();
      const expired = await reconcileExpiredSubscriptions();
      // TERCEIRA FASE, no MESMO job. O trabalho e o mesmo do job ("por a
      // assinatura no estado certo") e a cadencia serve (6 em 6 horas para algo
      // que so muda quando um periodo vira). Nao virou cron novo porque isso
      // custaria migration de agenda, entrada propria em cron_runs e mais um
      // lock, para um caminho que hoje nao pega nenhuma linha. E nao entrou no
      // expire-pending-boletos porque o nome daquele job diz `pending`, e este
      // trata o PAGO: reaproveitar la faria o nome mentir.
      const boletos = await expirarAssinaturasManuais();

      const totalFailed = incomplete.failed + expired.failed + boletos.failed;
      // Contagens separadas por provider (byProvider) + skipped/failed por fase.
      const payload = {
        incomplete: {
          processed: incomplete.processed,
          byProvider: incomplete.byProvider,
          skipped: incomplete.skipped,
          failed: incomplete.failed,
        },
        expired: {
          processed: expired.processed,
          byProvider: expired.byProvider,
          skipped: expired.skipped,
          failed: expired.failed,
        },
        // `capAtingido` vai na carga de proposito: lote com teto que nao avisa
        // quando cortou reporta sucesso sobre uma superficie menor.
        boletosVencidos: {
          processed: boletos.processed,
          expired: boletos.expired,
          failed: boletos.failed,
          capAtingido: boletos.capAtingido,
        },
      };

      await recordCronRun({
        jobName: "reconcile-subscriptions",
        status: totalFailed > 0 ? "partial" : "success",
        startedAt,
        payload,
      });

      res.json({
        data: {
          ...payload,
          failures: {
            incomplete: incomplete.failures,
            expired: expired.failures,
            boletosVencidos: boletos.failures,
          },
        },
      });
    } catch (err) {
      await recordCronRun({
        jobName: "reconcile-subscriptions",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Rede de seguranca do pipeline FISCAL. Quatro varreduras, na ordem em que
// fazem sentido: cobranca sem nota, notas paradas em processing, paradas em
// pending, e bloqueadas cujo cadastro ja foi completado.
//
// `?dryRun=true` executa tudo e NAO escreve: e como o backfill dos assinantes
// antigos e conferido antes de disparar de verdade. O contador `created` no
// modo seco responde "quantas notas isto criaria", que e a pergunta que se faz
// antes de emitir documento fiscal retroativo.
//
// TTL 900s: a varredura A pagina finance_transactions desde a data de corte, e
// no primeiro backfill isso e a base inteira do periodo.
router.post(
  "/reconcile-fiscal-invoices",
  withCronLock("reconcile-fiscal-invoices", 900, async (req, res, next) => {
    const startedAt = new Date();
    const dryRun = req.query.dryRun === "true";

    try {
      // Kill-switch respeitado tambem aqui: com a emissao desligada nao ha
      // pipeline para reconciliar, e varrer criaria linhas que ninguem
      // processaria.
      if (!env.nfseEnabled) {
        await recordCronRun({
          jobName: "reconcile-fiscal-invoices",
          status: "success",
          startedAt,
          payload: { skipped: "nfse_disabled" },
        });
        res.json({ data: { skipped: "nfse_disabled" } });
        return;
      }

      const resultado = await reconcileFiscalInvoices({ dryRun });

      const payload = {
        dryRun,
        created: resultado.created,
        requeued_processing: resultado.requeued_processing,
        requeued_pending: resultado.requeued_pending,
        unblocked: resultado.unblocked,
        skipped_no_user: resultado.skipped_no_user,
        skipped_before_cutoff: resultado.skipped_before_cutoff,
      };

      // 'partial' quando ha cobranca paga sem dono: o job rodou inteiro, mas o
      // resultado exige acao humana (ninguem sabe para quem emitir) e nao pode
      // aparecer como sucesso limpo na lista de crons. Mesmo criterio do
      // detect-orphan-payments.
      await recordCronRun({
        jobName: "reconcile-fiscal-invoices",
        status: resultado.skipped_no_user > 0 ? "partial" : "success",
        startedAt,
        payload,
      });

      res.json({ data: { ...payload, amostra: resultado.amostra } });
    } catch (err) {
      await recordCronRun({
        jobName: "reconcile-fiscal-invoices",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Rede de seguranca que faltava: o UNICO job que parte da Stripe para o banco.
// reconcile-subscriptions so olha linhas que ja existem em subscriptions, entao
// um pagamento que nunca virou linha (returns mudos de providers/stripe.ts) e
// invisivel para ele. Este aqui lista as Checkout Sessions PAGAS da janela e
// acusa as que nao tem contrapartida. SO DETECTA: nao promove ninguem.
// TTL 900s: uma listagem paginada da Stripe, mesmo teto do reconcile.
router.post(
  "/detect-orphan-payments",
  withCronLock("detect-orphan-payments", 900, async (req, res, next) => {
    const startedAt = new Date();

    try {
      // `?full=1` varre o HISTORICO INTEIRO, ignorando `days`. Sob demanda, nao
      // no agendamento: o diario continua barato e pega o caso novo em horas, e
      // o full e a rede para o que ja escapou dele, foi assim que o orfao de
      // 2026-07-19 ficou 26 dias invisivel para um job que reportava sucesso.
      const full = req.query.full === "1" || req.query.full === "true";
      const scan = await detectOrphanPayments(
        full ? { full: true } : { windowDays: clampWindowDays(req.query.days) },
      );

      // SEGUNDO ACHADO, de fonte diferente: `finance_transactions` em vez da
      // Stripe. Roda no mesmo job de proposito (a pergunta e a mesma, "quem
      // pagou e nao foi atendido") mas em funcao propria, porque a chave, a
      // fonte e o shape sao outros e forcar os dois no mesmo tipo exigiria uma
      // sessao falsa. Custa ZERO requisicoes a Stripe no caminho comum.
      const semDono = await detectarChargesSemDono(LOOKUPS_REAIS);

      // Criterio inteiro (e o porque dele) em `statusDaRunDeOrfaos`, extraido
      // para `server/lib/orphanPayments.ts` por ser testavel isolado.
      const status = statusDaRunDeOrfaos(scan, {
        acionaveis: semDono.acionaveis,
        naoVerificadas: semDono.naoVerificadas,
        leituraOk: semDono.leituraOk,
        persisted: semDono.persisted,
      });

      await recordCronRun({
        jobName: "detect-orphan-payments",
        status,
        startedAt,
        payload: {
          windowDays: scan.windowDays,
          full: scan.full,
          paidSessions: scan.paidSessions,
          skippedRecent: scan.skippedRecent,
          orphans: scan.orphans,
          orphansAcionaveis: scan.orphansAcionaveis,
          porCategoria: scan.porCategoria,
          newOrphans: scan.newOrphans,
          persisted: scan.persisted,
          // Lista inteira no payload de proposito: cron_run_logs existe hoje e
          // sobrevive ao Railway, entao o achado fica consultavel mesmo se a
          // tabela dedicada ainda nao estiver aplicada.
          findings: scan.findings,
          // Estoque nao resolvido, fora da janela da varredura. Resumo, nao o
          // achado inteiro: quem le a run precisa de quem esta esperando e ha
          // quanto tempo, e o resto ja esta em billing_orphan_payments.
          unresolvedAcionaveis: {
            total: scan.unresolvedAcionaveis,
            naoVerificadas: scan.unresolvedNaoVerificadas,
            leituraOk: scan.unresolvedLeituraOk,
            itens: scan.unresolvedItens,
          },
          // Bloco proprio no payload, e nao misturado com `findings`: sao duas
          // fontes com chaves diferentes, e quem le a run precisa saber de qual
          // delas veio cada achado.
          chargesSemDono: semDono,
        },
      });

      res.json({ data: { ...scan, chargesSemDono: semDono } });
    } catch (err) {
      await recordCronRun({
        jobName: "detect-orphan-payments",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Rede de seguranca do financeiro. O webhook e o caminho rapido; este cron
// garante contra evento perdido E alcanca linha gravada antes de uma correcao de
// codigo (o upsert reescreve o dono). Idempotente pelo bt id. A janela e o custo
// dela estao em ../lib/financeSyncWindow. TTL 600s: poucos itens por dia.
router.post(
  "/sync-finance",
  withCronLock("sync-finance", 600, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const since = new Date(
        Date.now() - SYNC_FINANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
      const result = await syncBalanceTransactions({ since });
      await recordCronRun({
        jobName: "sync-finance",
        status: "success",
        startedAt,
        payload: { ...result },
      });
      res.json({ data: result });
    } catch (err) {
      await recordCronRun({
        jobName: "sync-finance",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Rede de seguranca das campanhas de e-mail: reenfileira recipients pending de
// campanhas sending (lote dispatched) que o worker de concorrencia 1 nao chegou a
// processar (worker travado ou reiniciado). Ate agora isso so acontecia no boot;
// sem este cron, uma campanha travada so se curava num restart do processo. Reusa
// a MESMA reconcileEmailCampaignBatches do boot: NAO seleciona recipient novo, so
// reenfileira pending existente. Reentrante com o worker ativo (jobId
// deterministico por recipient torna o re-add no-op; filtro status pending; guarda
// de status no proprio job; so lote dispatched). TTL 600s: folga caso uma execucao
// demore; o proximo tick (5min) pula com withCronLock se ainda estiver rodando.
router.post(
  "/reconcile-email-campaigns",
  withCronLock("reconcile-email-campaigns", 600, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      await reconcileEmailCampaignBatches();
      await recordCronRun({
        jobName: "reconcile-email-campaigns",
        status: "success",
        startedAt,
      });
      res.json({ data: { reconciled: true } });
    } catch (err) {
      await recordCronRun({
        jobName: "reconcile-email-campaigns",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Watchdog de liveness das campanhas (alert-only). Deteccao 100% via Postgres
// (email_campaign_find_stuck), NUNCA toca a queueConnection: funciona com a fila
// congelada. So alerta (Sentry + log); a recuperacao automatica ja e do
// socketTimeout da queueConnection (Rodada 1). TTL 120s: uma RPC de leitura, com
// deadline proprio de 15s no supabaseAdmin; folga ate o proximo tick (5min).
type StuckCampaign = {
  campaign_id: string;
  subject: string;
  started_at: string | null;
  pending_count: number;
  sent_count: number;
  failed_count: number;
  total_recipients: number | null;
  last_sent_at: string | null;
};

/**
 * Janela de realerta por campanha. 60 min contra um tick de 5 min: a mesma
 * campanha travada gera no maximo 1 evento por hora, em vez de 12.
 */
export const JANELA_REALERTA_MS = 60 * 60 * 1000;

/**
 * Ultimo alerta por campanha. EM MEMORIA de proposito.
 *
 * Restart do Railway zera o mapa e a proxima passagem realerta, o que e
 * fail-open por construcao: o pior caso de perder o estado e um evento a mais.
 * Tabela ou chave no Redis seria estado duravel novo para economizar um evento
 * por hora, e ainda daria a este cron uma dependencia que ele hoje NAO tem (o
 * comentario acima registra que ele funciona com a fila congelada justamente
 * por nao tocar a queueConnection).
 *
 * Cresce uma entrada por campanha travada vista no processo. Campanha travada e
 * evento raro e o processo reinicia a cada deploy; nao ha o que podar.
 */
const ultimoAlertaPorCampanha = new Map<string, number>();

/**
 * Esta campanha deve gerar evento AGORA?
 *
 * FAIL-OPEN, e essa e a propriedade que nao pode ser perdida numa refatoracao:
 * qualquer defeito na propria supressao devolve `true`. Alerta repetido
 * incomoda; alerta suprimido por bug desaparece, e watchdog silencioso parece
 * fila calma, que e exatamente o desenho que este projeto ja pagou caro (ver o
 * RUNS_NAO_SADIAS_PARA_AVISAR em shared/tasks/sentryIntake.ts).
 *
 * `agora` e `memoria` entram por parametro para o teste nao depender do relogio
 * nem de estado global entre casos.
 */
export function deveAlertarCampanhaTravada(
  campaignId: string,
  agora: number,
  memoria: Map<string, number> = ultimoAlertaPorCampanha,
): boolean {
  try {
    const ultimo = memoria.get(campaignId);
    if (ultimo !== undefined && agora - ultimo < JANELA_REALERTA_MS) {
      return false;
    }
    memoria.set(campaignId, agora);
    return true;
  } catch {
    return true;
  }
}

router.post(
  "/campaign-liveness",
  withCronLock("campaign-liveness", 120, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const { data, error } = await supabaseAdmin.rpc(
        "email_campaign_find_stuck",
        { p_stale_minutes: 15 },
      );
      if (error) {
        throw new Error(error.message);
      }
      const stuck = (data ?? []) as StuckCampaign[];

      for (const c of stuck) {
        console.error(
          `[campaign-liveness] Campanha travada: ${c.campaign_id} "${c.subject}" ` +
            `pending=${c.pending_count} sent=${c.sent_count} failed=${c.failed_count} ` +
            `total=${c.total_recipients} last_sent_at=${c.last_sent_at}`,
        );
        // O LOG sai em toda passagem, mesmo com o evento suprimido: e ele que da
        // a contagem exata de por quantos ticks a campanha ficou travada. So a
        // captura no Sentry e deduplicada. Mesmo arranjo de `registrarViolacao`
        // em lib/linkedinAnalyze.ts.
        if (!deveAlertarCampanhaTravada(c.campaign_id, Date.now())) {
          continue;
        }
        Sentry.withScope((scope) => {
          scope.setTag("cron", "campaign-liveness");
          scope.setTag("campaignId", c.campaign_id);
          scope.setContext("campaign", {
            subject: c.subject,
            pending: c.pending_count,
            sent: c.sent_count,
            failed: c.failed_count,
            total: c.total_recipients,
            startedAt: c.started_at,
            lastSentAt: c.last_sent_at,
          });
          Sentry.captureException(
            new Error(
              `Campanha de e-mail travada (sending, sem progresso ha >=15min): ${c.campaign_id}`,
            ),
          );
        });
      }

      await recordCronRun({
        jobName: "campaign-liveness",
        status: "success",
        startedAt,
        payload: {
          stuckCount: stuck.length,
          stuckIds: stuck.map((c) => c.campaign_id),
        },
      });
      res.json({ data: { stuck: stuck.length } });
    } catch (err) {
      await recordCronRun({
        jobName: "campaign-liveness",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// TTL 300s: job leve (le subscriptions + getMrrSnapshot + um upsert). Registra o
// snapshot diario do estado das assinaturas em subscription_snapshots (idempotente
// por snapshot_date). subscriptions e apenas LIDA aqui.
router.post(
  "/snapshot-subscriptions",
  withCronLock("snapshot-subscriptions", 300, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const result = await collectSubscriptionSnapshot();
      await recordCronRun({
        jobName: "snapshot-subscriptions",
        status: "success",
        startedAt,
        payload: { ...result },
      });
      res.json({ data: result });
    } catch (err) {
      await recordCronRun({
        jobName: "snapshot-subscriptions",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// TTL 1800s: backlog de enriquecimento OpenAI (teto de 120s por chamada do
// SDK), o job potencialmente mais longo do conjunto.
router.post(
  "/enrich-backlog",
  withCronLock("enrich-backlog", 1800, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const result = await enrichBacklog();
      await recordCronRun({
        jobName: "enrich-backlog",
        status: result.failed > 0 ? "partial" : "success",
        startedAt,
        payload: { ...result },
      });
      res.json({ data: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await recordCronRun({
        jobName: "enrich-backlog",
        status: "error",
        startedAt,
        errorMessage,
      });
      next(err);
    }
  }),
);

// Promove notificacoes agendadas cujo horario venceu: scheduled -> published.
// UPDATE unico, atomico e idempotente (WHERE status='scheduled' garante que uma
// linha ja promovida nao e retocada). published_at e setado AGORA, no momento do
// disparo (nunca no agendamento), pro feed ordenar por published_at desc e o
// "ha X" ficar correto. scheduled_for e preservado como registro do agendamento.
// TTL 300s: job leve (um UPDATE). A visibleQuery so mostra published, entao
// scheduled nunca vaza antes desta promocao.
router.post(
  "/publish-scheduled-notifications",
  withCronLock(
    "publish-scheduled-notifications",
    300,
    async (_req, res, next) => {
      const startedAt = new Date();

      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabaseAdmin
          .from("notifications")
          .update({
            status: "published",
            published_at: nowIso,
            updated_at: nowIso,
          })
          .eq("status", "scheduled")
          .lte("scheduled_for", nowIso)
          .select("id, audience, category");
        if (error) {
          throw new Error(error.message);
        }
        const promoted = (data ?? []) as Array<{
          id: string;
          audience: string;
          category: string;
        }>;
        const published = promoted.length;
        // Snapshot de alcance dos recem-promovidos (denominador exato das
        // stats). Contexto carregado UMA vez por tick e reusado; best-effort,
        // nao reverte a promocao ja feita se falhar.
        if (published > 0) {
          await writeAudienceSnapshots(promoted);
        }
        await recordCronRun({
          jobName: "publish-scheduled-notifications",
          status: "success",
          startedAt,
          payload: { published },
        });
        res.json({ data: { published } });
      } catch (err) {
        await recordCronRun({
          jobName: "publish-scheduled-notifications",
          status: "error",
          startedAt,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        next(err);
      }
    },
  ),
);

// Reconciliacao do bug tracker com o Sentry: backfill de numeric id, retry das
// sincronizacoes de status pendentes e, para cards em done, reabertura quando o
// erro voltou a acontecer (lastSeen > resolved_at). Idempotente e nao destrutivo.
// TTL 600s: backfill/retry limitados a 25 cards por run (1 chamada Sentry cada,
// teto 10s) + uma busca em lote; pior caso na casa dos minutos.
router.post(
  "/reconcile-sentry-bugs",
  withCronLock("reconcile-sentry-bugs", 600, async (_req, res, next) => {
    const startedAt = new Date();

    try {
      const summary = await reconcileSentryBugs();
      const degraded =
        summary.backfillFailed > 0 ||
        summary.syncRetryFailed > 0 ||
        summary.reconcileSkipped !== null;
      await recordCronRun({
        jobName: "reconcile-sentry-bugs",
        status: degraded ? "partial" : "success",
        startedAt,
        payload: { ...summary },
      });
      res.json({ data: summary });
    } catch (err) {
      await recordCronRun({
        jobName: "reconcile-sentry-bugs",
        status: "error",
        startedAt,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  }),
);

// Sync do Sentry para o quadro de tarefas. Duas fases (ingestao a partir da
// listagem, manutencao a partir dos nossos cards), idempotente e nao destrutivo.
//
// `?dryRun=1` percorre tudo, decide tudo e NAO ESCREVE NADA, devolvendo o
// relatorio completo do que faria, card a card, com o motivo. NAO e ferramenta
// de desenvolvimento a ser removida depois: e o unico jeito de ver o que um
// escritor automatico PRETENDE fazer contra o banco de verdade antes de deixa-lo
// fazer, e ele fica. O roteiro de ativacao (Fase 6) comeca por ele.
//
// TTL 600s: ingestao limitada a 25 criacoes por run (1 chamada Sentry cada, teto
// de 10s) mais duas buscas em lote; pior caso na casa dos minutos.
router.post(
  "/sync-sentry-tasks",
  withCronLock("sync-sentry-tasks", 600, async (req, res, next) => {
    const startedAt = new Date();
    // Query string aqui e SEGURA: o segredo vai no header (ver
    // requireCronSecret), e dryRun nao e informacao sensivel.
    const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";

    try {
      const relatorio = await syncSentryTasks({ dryRun });
      // Dry-run NUNCA vira linha de cron_run_logs: ele nao e uma execucao do
      // job, e registrar como se fosse poluiria o historico com runs que nao
      // aconteceram e mascararia a cadencia real.
      if (!dryRun) {
        await recordCronRun({
          jobName: "sync-sentry-tasks",
          status: runDegradada(relatorio) ? "partial" : "success",
          startedAt,
          payload: resumoParaLog(relatorio),
        });
      }
      res.json({ data: relatorio });
    } catch (err) {
      if (!dryRun) {
        await recordCronRun({
          jobName: "sync-sentry-tasks",
          status: "error",
          startedAt,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
      next(err);
    }
  }),
);

router.get("/status", async (_req, res, next) => {
  try {
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from("content_sources")
      .select("id, code, name, type, status, last_sync_at")
      .order("code");

    if (sourcesError)
      return next(
        montarDbError(
          "cron",
          "cron/status load sources",
          sourcesError,
          "Erro ao buscar fontes.",
        ),
      );

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from("content_sync_logs")
      .select(
        "source_id, status, items_found, items_created, items_updated, items_failed, finished_at, error_message",
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError)
      return next(
        montarDbError(
          "cron",
          "cron/status load sync logs",
          logsError,
          "Erro ao buscar logs de sincronização.",
        ),
      );

    res.json({
      data: { sources: sources || [], recent_logs: recentLogs || [] },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
