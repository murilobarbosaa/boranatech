import { NextFunction, Request, Response, Router } from "express";

import { syncEvents } from "../jobs/syncEvents";
import { syncJobs } from "../jobs/syncJobs";
import { syncNews } from "../jobs/syncNews";
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
    res.json({ data: result });
  } catch (err) {
    await recordSync("currents", startedAt, { found: 0, created: 0, updated: 0, failed: 1 }, err instanceof Error ? err.message : String(err));
    next(err);
  }
});

router.post("/sync-jobs", async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const result = await syncJobs();
    await recordSync("jooble", startedAt, result);
    res.json({ data: result });
  } catch (err) {
    await recordSync("jooble", startedAt, { found: 0, created: 0, updated: 0, failed: 1 }, err instanceof Error ? err.message : String(err));
    next(err);
  }
});

router.post("/sync-events", async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const result = await syncEvents();
    await recordSync("sympla", startedAt, result);
    res.json({ data: result });
  } catch (err) {
    await recordSync("sympla", startedAt, { found: 0, created: 0, updated: 0, failed: 1 }, err instanceof Error ? err.message : String(err));
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
