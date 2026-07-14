import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { enrichBacklog } from "../jobs/enrichBacklog";
import { runVagasSync } from "../jobs/syncJobs";
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
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";
import { getStripeSubscriptionState } from "../providers/stripe";

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

// TTL 600s: ~22 unidades de fetch (teto 15s cada) rodando por fonte com
// allSettled + upserts em lote, tipico bem abaixo de 10min.
router.post("/sync-jobs", withCronLock("sync-jobs", 600, async (_req, res, next) => {
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
      .eq("provider", "asaas")
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

        // Deixou de ser Pro: invalida o cache do dono apos a escrita
        // confirmada. Fire-and-forget, por usuario afetado (nao em lote).
        void invalidateProStatusCache(sub.user_id);

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
  user_id?: string | null;
  provider?: string | null;
  status?: string | null;
  provider_subscription_id: string | null;
  current_period_end?: string | null;
  plans?: { code?: string } | { code?: string }[] | null;
};

type AsaasPayment = { status?: string; dueDate?: string };

// Resultado de reconciliar UMA linha. `outcome` e provider-especifico
// (promoted/renewed/downgraded para Asaas; activated/reconciled/downgraded para
// Stripe; noop/unchanged/skipped/failed comuns). `reason` acompanha skipped e
// failed. Nenhuma linha e assumida por default: provider desconhecido ou nao
// configurado vira skipped, nunca cancelamento silencioso.
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

// Reconcilia UMA linha Stripe (usado nas duas fases): o estado vivo da Stripe
// (subscription retrieve) E a fonte de verdade, entao refletimos status/periodo
// no banco sem calcular ciclo. Sem STRIPE_SECRET_KEY ou sem id do provedor:
// skipped (nunca assume um estado). So escreve quando ha mudanca real.
async function reconcileStripeRow(sub: SubRow): Promise<RowOutcome> {
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
  const periodChanged = state.currentPeriodEnd !== (sub.current_period_end ?? null);

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
  if (updateError) throw updateError;

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

// FASE 1, linha Asaas: confirma pagamento real no Asaas antes de promover
// incomplete -> active. Sem pagamento pago: noop. Sem config/id: skipped.
async function reconcileIncompleteAsaasRow(sub: SubRow): Promise<RowOutcome> {
  if (!env.asaasApiKey) {
    return {
      provider: "asaas",
      outcome: "skipped",
      reason: "asaas_not_configured",
    };
  }
  if (!sub.provider_subscription_id) {
    return {
      provider: "asaas",
      outcome: "skipped",
      reason: "missing_provider_subscription_id",
    };
  }

  const payments = await getAsaasSubscriptionPayments(
    sub.provider_subscription_id,
  );
  const paid = latestPaidPayment((payments?.data as AsaasPayment[]) || []);
  if (!paid?.dueDate) return { provider: "asaas", outcome: "noop" };

  const planCode = planCodeOf(sub);
  const periodStart = new Date(paid.dueDate);
  const periodEnd = addMonths(periodStart, PLAN_CYCLE_MONTHS[planCode] ?? 1);

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

  // incomplete -> active: virou Pro; invalida o cache do dono.
  if (sub.user_id) void invalidateProStatusCache(sub.user_id);
  return { provider: "asaas", outcome: "promoted" };
}

// FASE 1: subscriptions presas em 'incomplete' ha >15min. Provider-agnostico:
// cada linha e reconciliada contra o provider da PROPRIA coluna, nunca por
// PAYMENT_PROVIDER global. Provider desconhecido/nao configurado: skipped.
// NOTA: o filtro .or(...) com and(...) aninhado equivale a
// coalesce(last_event_at, created_at) <= cutoff. Sintaxe PostgREST sensivel;
// validar empiricamente ao testar o endpoint (supabaseAdmin e destipado).
async function reconcileIncompleteSubscriptions() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, provider, status, provider_subscription_id, current_period_end, plans(code)",
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
    const provider = sub.provider ?? "unknown";
    try {
      let outcome: RowOutcome;
      if (provider === "asaas") {
        outcome = await reconcileIncompleteAsaasRow(sub);
      } else if (provider === "stripe") {
        outcome = await reconcileStripeRow(sub);
      } else {
        outcome = { provider, outcome: "skipped", reason: "unknown_provider" };
      }

      if (outcome.outcome === "skipped") {
        console.warn(
          `[cron/reconcile-subscriptions] incomplete ${sub.id} skipped (provider=${provider}, reason=${outcome.reason ?? "n/a"})`,
        );
      }
      outcomes.push(outcome);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, provider, reason });
      outcomes.push({ provider, outcome: "failed", reason });
      console.error(
        `[cron/reconcile-subscriptions] incomplete ${sub.id} (${provider}) falhou:`,
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

// FASE 2, linha Asaas: se o Asaas mostra um pagamento pago para um ciclo
// posterior -> renovou (webhook perdeu); senao -> past_due (conservador).
async function reconcileExpiredAsaasRow(sub: SubRow): Promise<RowOutcome> {
  if (!env.asaasApiKey) {
    return {
      provider: "asaas",
      outcome: "skipped",
      reason: "asaas_not_configured",
    };
  }
  if (!sub.provider_subscription_id) {
    return {
      provider: "asaas",
      outcome: "skipped",
      reason: "missing_provider_subscription_id",
    };
  }

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

    // Renovou com periodo que ja tinha vencido (>3d de grace): o is_user_pro
    // estava false pelo current_period_end; o novo periodo religa o boolean.
    if (sub.user_id) void invalidateProStatusCache(sub.user_id);
    return { provider: "asaas", outcome: "renewed" };
  }

  // Observabilidade: registra o status real no Asaas (nao decide nada).
  let asaasStatus = "unknown";
  try {
    const remote = await getAsaasSubscription(sub.provider_subscription_id);
    asaasStatus = String(remote?.status || "unknown");
  } catch (err) {
    console.warn(
      `[cron/reconcile-subscriptions] expired ${sub.id} getAsaasSubscription falhou:`,
      err instanceof Error ? err.message : String(err),
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due", last_event_at: new Date().toISOString() })
    .eq("id", sub.id);
  if (updateError) throw updateError;

  // active -> past_due: o boolean ja estava false pelo periodo vencido, mas
  // invalidar e barato e elimina qualquer janela residual.
  if (sub.user_id) void invalidateProStatusCache(sub.user_id);
  console.warn(
    `[cron/reconcile-subscriptions] downgrade ${sub.id} -> past_due (asaas status: ${asaasStatus})`,
  );
  return { provider: "asaas", outcome: "downgraded" };
}

// FASE 2: subscriptions 'active' com periodo vencido ha >3 dias (grace) e que
// NAO estao marcadas para cancelar. Provider-agnostico: reconcilia cada linha
// contra o provider da propria coluna. Stripe: reflete o estado vivo da
// subscription. Provider desconhecido/nao configurado: skipped.
async function reconcileExpiredSubscriptions() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, provider, status, provider_subscription_id, current_period_end, plans(code)",
    )
    .eq("status", "active")
    .or("cancel_at_period_end.is.null,cancel_at_period_end.eq.false")
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
    const provider = sub.provider ?? "unknown";
    try {
      let outcome: RowOutcome;
      if (provider === "asaas") {
        outcome = await reconcileExpiredAsaasRow(sub);
      } else if (provider === "stripe") {
        outcome = await reconcileStripeRow(sub);
      } else {
        outcome = { provider, outcome: "skipped", reason: "unknown_provider" };
      }

      if (outcome.outcome === "skipped") {
        console.warn(
          `[cron/reconcile-subscriptions] expired ${sub.id} skipped (provider=${provider}, reason=${outcome.reason ?? "n/a"})`,
        );
      }
      outcomes.push(outcome);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ subscription_id: sub.id, provider, reason });
      outcomes.push({ provider, outcome: "failed", reason });
      console.error(
        `[cron/reconcile-subscriptions] expired ${sub.id} (${provider}) falhou:`,
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

// TTL 900s: 2 fases x ate 25 subscriptions x ate 2 chamadas Asaas cada
// (teto 15s por chamada); pior caso teorico na casa dos minutos.
router.post("/reconcile-subscriptions", withCronLock("reconcile-subscriptions", 900, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const incomplete = await reconcileIncompleteSubscriptions();
    const expired = await reconcileExpiredSubscriptions();

    const totalFailed = incomplete.failed + expired.failed;
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
