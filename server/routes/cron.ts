import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { enrichBacklog } from "../jobs/enrichBacklog";
import { syncJobs } from "../jobs/syncJobs";
import { syncNews } from "../jobs/syncNews";
import { reindexSearchDocuments } from "../lib/searchIndex";
import {
  cancelAsaasSubscription,
  getAsaasSubscription,
  getAsaasSubscriptionPayments,
} from "../lib/asaas";
import { PLAN_CYCLE_MONTHS, addMonths } from "../lib/billing-cycle";
import { recordCronRun } from "../lib/cron-logs";
import { env } from "../lib/env";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

const router = Router();

type SyncResult = {
  found?: number;
  created: number;
  updated?: number;
  failed: number;
};

function timingSafeEqualStr(a: string, b: string): boolean {
  // Hash de tamanho fixo dos dois lados para comparar em tempo constante
  // sem vazar o comprimento. Mesmo padrao do webhook Asaas (billing.ts).
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
// idempotentes por natureza (upserts, reindex, estado derivado do Asaas;
// cancelamento duplo no Asaas falha no segundo e e contado por item), entao
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
    console.log(`[cron] ${jobName}: reindex concluida:`, JSON.stringify(summary));
  } catch (err) {
    console.warn(`[cron] ${jobName}: reindex pos-sync falhou (fail-soft):`, err);
  }
}

// TTL 1200s: 4 fetches Currents + enriquecimento OpenAI artigo a artigo,
// duracao tipica de minutos; 2x com folga.
router.post("/sync-news", withCronLock("sync-news", 1200, async (_req, res, next) => {
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
}));

// TTL 600s: 3 chamadas Jooble (teto 15s cada) + upserts, tipico abaixo de
// 1min; aplicado o minimo de 10min.
router.post("/sync-jobs", withCronLock("sync-jobs", 600, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const result = await syncJobs();
    await recordSync("jooble", startedAt, result);
    await recordCronRun({
      jobName: "sync-jobs",
      status: result.failed > 0 ? "partial" : "success",
      startedAt,
      payload: { ...result },
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
}));

// Reindexacao COMPLETA do search_documents (todas as fontes). Agendada diaria
// via pg_cron (migration 20260702120000) e disponivel para disparo manual. O
// reindexador ja e fail-soft por fonte: falhas parciais viram status "partial".
// TTL 1200s: reindex completo de todas as fontes em paginas de 1000, cresce
// com o catalogo; 20min cobre com folga.
router.post("/reindex-search", withCronLock("reindex-search", 1200, async (_req, res, next) => {
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
}));

// NOTA (redesenho billing, abordagem C): desde que POST /billing/cancel passou a
// avisar o Asaas na hora (endDate + DELETE das pendentes futuras), o cancelAsaasSubscription
// abaixo deixou de ser o mecanismo PRIMARIO de parar o billing no caminho feliz, o Asaas
// ja para sozinho via endDate. Este cron agora vale como RECONCILIADOR / rede de seguranca:
// finaliza o status no banco (active -> canceled) no vencimento e cobre casos em que o /cancel
// falhou no meio ou subs legadas sem endDate. Desligar/ajustar e o passo 7 do plano, nao agora.
// TTL 600s: N subs vencidas x chamadas Asaas (teto 15s cada), tipico de
// segundos; aplicado o minimo de 10min.
router.post("/process-cancellations", withCronLock("process-cancellations", 600, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const nowIso = new Date().toISOString();

    const { data: due, error: dueError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, provider_subscription_id, current_period_end")
      .eq("cancel_at_period_end", true)
      .eq("status", "active")
      .lte("current_period_end", nowIso);

    if (dueError) {
      await recordCronRun({
        jobName: "process-cancellations",
        status: "error",
        startedAt,
        errorMessage: dueError.message,
      });
      return next(
        createError(500, "db_error", "Erro ao buscar cancelamentos pendentes."),
      );
    }

    const subscriptions = due || [];
    let canceled = 0;
    let failed = 0;
    const failures: Array<{ subscription_id: string; reason: string }> = [];

    for (const sub of subscriptions) {
      try {
        if (sub.provider_subscription_id) {
          await cancelAsaasSubscription(sub.provider_subscription_id);
        }

        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("id", sub.id);

        if (updateError) throw updateError;

        await supabaseAdmin
          .from("subscription_cancellations")
          .update({ status: "completed" })
          .eq("user_id", sub.user_id)
          .eq("status", "scheduled");

        canceled += 1;
      } catch (err) {
        failed += 1;
        failures.push({
          subscription_id: sub.id,
          reason: err instanceof Error ? err.message : String(err),
        });
        console.error(`[cron/process-cancellations] Falha em ${sub.id}:`, err);
      }
    }

    const processed = subscriptions.length;
    await recordCronRun({
      jobName: "process-cancellations",
      status: failed > 0 ? "partial" : "success",
      startedAt,
      payload: { processed, canceled, failed },
    });

    res.json({ data: { processed, canceled, failed, failures } });
  } catch (err) {
    await recordCronRun({
      jobName: "process-cancellations",
      status: "error",
      startedAt,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
}));

const PAID_PAYMENT_STATUSES = new Set([
  "CONFIRMED",
  "RECEIVED",
  "RECEIVED_IN_CASH",
]);

type SubRow = {
  id: string;
  provider_subscription_id: string | null;
  current_period_end?: string | null;
  plans?: { code?: string } | { code?: string }[] | null;
};

type AsaasPayment = { status?: string; dueDate?: string };

function planCodeOf(sub: SubRow): string {
  const plans = sub.plans;
  const code = Array.isArray(plans) ? plans[0]?.code : plans?.code;
  return code || "pro_monthly";
}

function latestPaidPayment(
  payments: AsaasPayment[],
  after?: Date | null,
): AsaasPayment | null {
  return (payments || [])
    .filter((p) => p?.dueDate && PAID_PAYMENT_STATUSES.has(String(p.status)))
    .filter((p) => !after || new Date(p.dueDate as string) > after)
    .reduce<AsaasPayment | null>(
      (latest, p) =>
        !latest ||
        new Date(p.dueDate as string) > new Date(latest.dueDate as string)
          ? p
          : latest,
      null,
    );
}

// FASE 1: subscriptions presas em 'incomplete' ha >15min. Confirma pagamento
// real no Asaas antes de promover. Sem pagamento pago: deixa como esta.
// NOTA: o filtro .or(...) com and(...) aninhado equivale a
// coalesce(last_event_at, created_at) <= cutoff. Sintaxe PostgREST sensivel;
// validar empiricamente ao testar o endpoint (supabaseAdmin e destipado).
async function reconcileIncompleteSubscriptions() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, provider_subscription_id, plans(code)")
    .eq("status", "incomplete")
    .or(
      `last_event_at.lte.${cutoff},and(last_event_at.is.null,created_at.lte.${cutoff})`,
    )
    .limit(25);

  if (error) throw error;

  const subs = (data || []) as SubRow[];
  let promoted = 0;
  let failed = 0;
  const failures: Array<{ subscription_id: string; reason: string }> = [];

  for (const sub of subs) {
    try {
      if (!sub.provider_subscription_id) continue;

      const payments = await getAsaasSubscriptionPayments(
        sub.provider_subscription_id,
      );
      const paid = latestPaidPayment((payments?.data as AsaasPayment[]) || []);
      if (!paid?.dueDate) continue; // sem pagamento pago: continua incomplete

      const planCode = planCodeOf(sub);
      const periodStart = new Date(paid.dueDate);
      const periodEnd = addMonths(
        periodStart,
        PLAN_CYCLE_MONTHS[planCode] ?? 1,
      );

      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          canceled_at: null,
          last_event_at: new Date().toISOString(),
          raw_provider_payload: paid,
        })
        .eq("id", sub.id);
      if (updateError) throw updateError;

      promoted += 1;
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, reason });
      console.error(
        `[cron/reconcile-subscriptions] incomplete ${sub.id} falhou:`,
        err,
      );
    }
  }

  return { processed: subs.length, promoted, failed, failures };
}

// FASE 2: subscriptions 'active' com periodo vencido ha >3 dias (grace) e que
// NAO estao marcadas para cancelar. Se o Asaas mostra um pagamento pago para um
// ciclo posterior -> renovou (webhook perdeu); senao -> past_due (conservador).
async function reconcileExpiredSubscriptions() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, provider_subscription_id, current_period_end, plans(code)")
    .eq("status", "active")
    .or("cancel_at_period_end.is.null,cancel_at_period_end.eq.false")
    .lte("current_period_end", cutoff)
    .limit(25);

  if (error) throw error;

  const subs = (data || []) as SubRow[];
  let renewed = 0;
  let downgraded = 0;
  let failed = 0;
  const failures: Array<{ subscription_id: string; reason: string }> = [];

  for (const sub of subs) {
    try {
      if (!sub.provider_subscription_id) continue;

      const payments = await getAsaasSubscriptionPayments(
        sub.provider_subscription_id,
      );
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end)
        : null;
      const renewal = latestPaidPayment(
        (payments?.data as AsaasPayment[]) || [],
        periodEnd,
      );

      if (renewal?.dueDate) {
        const planCode = planCodeOf(sub);
        const newEnd = addMonths(
          new Date(renewal.dueDate),
          PLAN_CYCLE_MONTHS[planCode] ?? 1,
        );

        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            current_period_end: newEnd.toISOString(),
            last_event_at: new Date().toISOString(),
            raw_provider_payload: renewal,
          })
          .eq("id", sub.id);
        if (updateError) throw updateError;

        renewed += 1;
      } else {
        // Observabilidade: registra o status real no Asaas (nao decide nada).
        let asaasStatus = "unknown";
        try {
          const remote = await getAsaasSubscription(
            sub.provider_subscription_id,
          );
          asaasStatus = String(remote?.status || "unknown");
        } catch (err) {
          console.warn(
            `[cron/reconcile-subscriptions] expired ${sub.id} getAsaasSubscription falhou:`,
            err instanceof Error ? err.message : String(err),
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due",
            last_event_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        if (updateError) throw updateError;

        console.warn(
          `[cron/reconcile-subscriptions] downgrade ${sub.id} -> past_due (asaas status: ${asaasStatus})`,
        );
        downgraded += 1;
      }
    } catch (err) {
      failed += 1;
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, reason });
      console.error(
        `[cron/reconcile-subscriptions] expired ${sub.id} falhou:`,
        err,
      );
    }
  }

  return { processed: subs.length, renewed, downgraded, failed, failures };
}

// TTL 900s: 2 fases x ate 25 subscriptions x ate 2 chamadas Asaas cada
// (teto 15s por chamada); pior caso teorico na casa dos minutos.
router.post("/reconcile-subscriptions", withCronLock("reconcile-subscriptions", 900, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const incomplete = await reconcileIncompleteSubscriptions();
    const expired = await reconcileExpiredSubscriptions();

    const totalFailed = incomplete.failed + expired.failed;
    const payload = {
      incomplete: {
        processed: incomplete.processed,
        promoted: incomplete.promoted,
        failed: incomplete.failed,
      },
      expired: {
        processed: expired.processed,
        renewed: expired.renewed,
        downgraded: expired.downgraded,
        failed: expired.failed,
      },
    };

    await recordCronRun({
      jobName: "reconcile-subscriptions",
      status: totalFailed > 0 ? "partial" : "success",
      startedAt,
      payload,
    });

    res.json({ data: payload });
  } catch (err) {
    await recordCronRun({
      jobName: "reconcile-subscriptions",
      status: "error",
      startedAt,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
}));

// TTL 1800s: backlog de enriquecimento OpenAI (teto de 120s por chamada do
// SDK), o job potencialmente mais longo do conjunto.
router.post("/enrich-backlog", withCronLock("enrich-backlog", 1800, async (_req, res, next) => {
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
}));

router.get("/status", async (_req, res, next) => {
  try {
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from("content_sources")
      .select("id, code, name, type, status, last_sync_at")
      .order("code");

    if (sourcesError)
      return next(createError(500, "db_error", "Erro ao buscar fontes."));

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from("content_sync_logs")
      .select(
        "source_id, status, items_found, items_created, items_updated, items_failed, finished_at, error_message",
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError)
      return next(
        createError(500, "db_error", "Erro ao buscar logs de sincronização."),
      );

    res.json({
      data: { sources: sources || [], recent_logs: recentLogs || [] },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
