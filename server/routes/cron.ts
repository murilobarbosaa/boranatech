import { NextFunction, Request, Response, Router } from "express";

import { enrichBacklog } from "../jobs/enrichBacklog";
import { syncJobs } from "../jobs/syncJobs";
import { syncNews } from "../jobs/syncNews";
import { cancelAsaasSubscription } from "../lib/asaas";
import { recordCronRun } from "../lib/cron-logs";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

const router = Router();

type SyncResult = {
  found?: number;
  created: number;
  updated?: number;
  failed: number;
};

function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (!env.cronSecret || secret !== env.cronSecret) {
    return next(createError(401, "unauthorized", "Cron secret inválido."));
  }

  next();
}

async function getSource(code: string) {
  const { data } = await supabaseAdmin.from("content_sources").select("id").eq("code", code).maybeSingle();
  return data;
}

async function recordSync(code: string, startedAt: Date, result: SyncResult, errorMessage?: string) {
  try {
    const source = await getSource(code);
    if (!source) return;

    const status = errorMessage ? "error" : result.failed > 0 ? "partial" : "success";
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
    console.warn("[cron] Falha ao registrar log de sincronização:", err instanceof Error ? err.message : String(err));
  }
}

router.use(requireCronSecret);

router.post("/sync-news", async (_req, res, next) => {
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
    res.json({ data: result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await recordSync("currents", startedAt, { found: 0, created: 0, updated: 0, failed: 1 }, errorMessage);
    await recordCronRun({
      jobName: "sync-news",
      status: "error",
      startedAt,
      errorMessage,
    });
    next(err);
  }
});

router.post("/sync-jobs", async (_req, res, next) => {
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
    res.json({ data: result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await recordSync("jooble", startedAt, { found: 0, created: 0, updated: 0, failed: 1 }, errorMessage);
    await recordCronRun({
      jobName: "sync-jobs",
      status: "error",
      startedAt,
      errorMessage,
    });
    next(err);
  }
});

// NOTA (redesenho billing — abordagem C): desde que POST /billing/cancel passou a
// avisar o Asaas na hora (endDate + DELETE das pendentes futuras), o cancelAsaasSubscription
// abaixo deixou de ser o mecanismo PRIMARIO de parar o billing no caminho feliz — o Asaas
// ja para sozinho via endDate. Este cron agora vale como RECONCILIADOR / rede de seguranca:
// finaliza o status no banco (active -> canceled) no vencimento e cobre casos em que o /cancel
// falhou no meio ou subs legadas sem endDate. Desligar/ajustar e o passo 7 do plano, nao agora.
router.post("/process-cancellations", async (_req, res, next) => {
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
      return next(createError(500, "db_error", "Erro ao buscar cancelamentos pendentes."));
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
});

router.post("/enrich-backlog", async (_req, res, next) => {
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
});

router.get("/status", async (_req, res, next) => {
  try {
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from("content_sources")
      .select("id, code, name, type, status, last_sync_at")
      .order("code");

    if (sourcesError) return next(createError(500, "db_error", "Erro ao buscar fontes."));

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from("content_sync_logs")
      .select("source_id, status, items_found, items_created, items_updated, items_failed, finished_at, error_message")
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsError) return next(createError(500, "db_error", "Erro ao buscar logs de sincronização."));

    res.json({ data: { sources: sources || [], recent_logs: recentLogs || [] } });
  } catch (err) {
    next(err);
  }
});

export default router;
