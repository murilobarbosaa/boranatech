import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import { enrichBacklog } from "../jobs/enrichBacklog";
import { runVagasSync } from "../jobs/syncJobs";
import { syncNews } from "../jobs/syncNews";
import { reindexSearchDocuments } from "../lib/searchIndex";
import { recordCronRun } from "../lib/cron-logs";
import { env } from "../lib/env";
import { invalidateProStatusCache } from "../lib/proStatusCache";
import { enqueueEmail } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { issueRenewalToken } from "../lib/renewalToken";
import { getStripe } from "../lib/stripeClient";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { syncBalanceTransactions } from "../lib/stripeSync";
import { createError } from "../middleware/error";
import { getStripeSubscriptionState } from "../providers/stripe";
import { isPlanId, PLAN_PRICING } from "../../shared/planPricing";

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
router.post("/process-cancellations", withCronLock("process-cancellations", 600, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const nowIso = new Date().toISOString();

    // Provider-agnostico. cancel_at_period_end=true NAO pode mais ser excluido
    // silenciosamente do reconcile: para a Stripe o webhook de fim de periodo
    // pode se perder, e ausencia de evento nunca pode manter Pro (fail-open).
    const { data: due, error: dueError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, provider, status, provider_subscription_id, current_period_end",
      )
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
        failures.push({ subscription_id: sub.id, provider: "stripe", reason });
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
}));

const DAY_MS = 24 * 60 * 60 * 1000;

// Regua por plano: dias antes do vencimento em que cada lembrete dispara.
const RENEWAL_MILESTONES: Record<string, number[]> = {
  pro_annual: [30, 7, 1],
  pro_semiannual: [15, 7, 1],
};

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

// Lembrete de renovacao de boleto manual. Filtro fail-closed: SO renewal_type=
// 'manual' (cartao renova sozinho e nunca pode receber este e-mail) e status=
// 'active', com vencimento na janela do maior marco. Um marco por assinatura por
// run; marca o marco so apos o enqueue ser aceito (at-least-once).
router.post(
  "/expiring-subscriptions",
  withCronLock("expiring-subscriptions", 600, async (_req, res, next) => {
    const startedAt = new Date();
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      // Janela do maior marco (30d anual) + folga; semestral (<=15d) cai dentro.
      const windowIso = new Date(now.getTime() + 31 * DAY_MS).toISOString();

      // Usa o indice parcial subscriptions_manual_renewal_expiry_idx
      // (renewal_type='manual' AND status='active', em current_period_end).
      const { data: due, error: dueError } = await supabaseAdmin
        .from("subscriptions")
        .select(
          "id, user_id, current_period_end, renewal_reminders_sent, plan_id",
        )
        .eq("renewal_type", "manual")
        .eq("status", "active")
        .gt("current_period_end", nowIso)
        .lte("current_period_end", windowIso);

      if (dueError) {
        await recordCronRun({
          jobName: "expiring-subscriptions",
          status: "error",
          startedAt,
          errorMessage: dueError.message,
        });
        return next(
          createError(500, "db_error", "Erro ao buscar assinaturas a vencer."),
        );
      }

      const rows = due || [];

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

      for (const row of rows) {
        try {
          const code = row.plan_id ? planCodeById.get(row.plan_id) : undefined;
          const milestones = code ? RENEWAL_MILESTONES[code] : undefined;
          if (
            !code ||
            !isPlanId(code) ||
            !milestones ||
            !row.current_period_end
          ) {
            skipped++;
            continue;
          }

          const periodEndMs = new Date(row.current_period_end).getTime();
          const daysUntil = (periodEndMs - now.getTime()) / DAY_MS;
          const n = activeRenewalMilestone(milestones, daysUntil);
          if (n === null) {
            skipped++;
            continue;
          }

          const milestoneCode = `d${n}`;
          const already = row.renewal_reminders_sent ?? [];
          if (already.includes(milestoneCode)) {
            skipped++;
            continue;
          }

          const token = issueRenewalToken({
            subscriptionId: row.id,
            currentPeriodEnd: row.current_period_end,
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

          const pricing = PLAN_PRICING[code];
          const renewUrl = `${env.appPublicUrl}/renovar?t=${token}`;
          const daysRemaining = Math.max(0, Math.round(daysUntil));

          // Enfileira PRIMEIRO; so marca o marco se o enqueue for ACEITO. Se o
          // enqueue lancar (Redis fora/timeout), NAO marca -> a proxima run tenta
          // de novo (at-least-once no enfileiramento). Uma falha posterior do
          // worker (attempts:3) nao desmarca: aquele marco se perde, mas os outros
          // dois cobrem o assinante.
          await enqueueEmail({
            type: "renewal_reminder",
            to: emailTo,
            name,
            gender: null,
            planName: pricing.label,
            priceLabel: pricing.totalLabel,
            dueDateIso: row.current_period_end,
            renewUrl,
            daysRemaining,
          });

          const { error: markError } = await supabaseAdmin
            .from("subscriptions")
            .update({ renewal_reminders_sent: [...already, milestoneCode] })
            .eq("id", row.id);
          if (markError) {
            // Enfileirado mas nao marcado: risco de reenvio na proxima run. Grita.
            console.error(
              `[cron/expiring-subscriptions] marco ${milestoneCode} enfileirado mas NAO marcado (sub ${row.id}):`,
              markError,
            );
            failed++;
          } else {
            sent++;
          }
        } catch (err) {
          failed++;
          console.error(
            `[cron/expiring-subscriptions] falha na sub ${row.id}:`,
            err,
          );
        }
      }

      await recordCronRun({
        jobName: "expiring-subscriptions",
        status: failed > 0 ? "partial" : "success",
        startedAt,
        payload: { candidates: rows.length, sent, skipped, failed },
      });
      res.json({ data: { candidates: rows.length, sent, skipped, failed } });
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

      const { data: orphans, error: orphansError } = await supabaseAdmin
        .from("subscriptions")
        .select("id, provider_subscription_id")
        .eq("payment_method", "boleto")
        .eq("status", "pending")
        .lt("created_at", cutoffIso);

      if (orphansError) {
        await recordCronRun({
          jobName: "expire-pending-boletos",
          status: "error",
          startedAt,
          errorMessage: orphansError.message,
        });
        return next(
          createError(500, "db_error", "Erro ao buscar boletos pendentes."),
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
          let session: Awaited<
            ReturnType<typeof stripe.checkout.sessions.retrieve>
          >;
          try {
            session = await stripe.checkout.sessions.retrieve(sessionId);
          } catch (stripeErr) {
            // Falha na consulta = incerteza: NAO cancela (fail-safe, deixa viva).
            console.error(
              `[cron/expire-pending-boletos] retrieve falhou para ${sessionId}; mantendo linha viva:`,
              stripeErr,
            );
            failed++;
            continue;
          }

          if (session.payment_status === "paid") {
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

// Rede de seguranca do financeiro: sincroniza as balance transactions das
// ultimas 72h. O webhook e o caminho rapido; este cron garante contra evento
// perdido. Idempotente pelo bt id. TTL 600s: poucos itens por dia.
router.post("/sync-finance", withCronLock("sync-finance", 600, async (_req, res, next) => {
  const startedAt = new Date();

  try {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
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
