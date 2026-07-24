import * as Sentry from "@sentry/node";
import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

// Last-known-good em memória. Política: nunca devolver 0 inventado quando a
// query degrada (count:null sem error, ou throw). Em degradação, serve o último
// número REAL bem-sucedido. Sem persistência: cobre o soluço transiente do
// Supabase sem adicionar tabela/escrita. Reinício do processo limpa o lkg,
// próximo request bem-sucedido repopula.
const FRESH_TTL_MS = 5 * 60 * 1000;
let lastKnownGood: number | null = null;
let lastFetchAt = 0;

// Captura explicita da degradacao do contador. O endpoint devolve 200 de
// proposito (serve last-known-good), entao NUNCA chega no errorHandler de 5xx
// do app.ts: sem esta captura, a degradacao so aparecia no console do Railway.
// Correlaciona com os eventos do client via a mesma tag route.
function captureUsersCountDegraded(
  reason: string,
  extra: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    scope.setTag("route", "stats/users-count");
    scope.setLevel("warning");
    scope.setContext("stats_users_count", {
      reason,
      hadLkg: lastKnownGood !== null,
      ...extra,
    });
    Sentry.captureMessage("[stats] users-count degraded");
  });
}

async function queryProfilesCount(): Promise<number | null> {
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return typeof count === "number" ? count : null;
}

router.get("/users-count", async (_req, res) => {
  if (lastKnownGood !== null && Date.now() - lastFetchAt < FRESH_TTL_MS) {
    return res.json({ count: lastKnownGood });
  }

  try {
    const fresh = await queryProfilesCount();
    if (fresh !== null) {
      lastKnownGood = fresh;
      lastFetchAt = Date.now();
      return res.json({ count: fresh });
    }
    // Query resolveu sem erro mas count veio nulo: degradação silenciosa do
    // Supabase. Serve lkg (pode ser null num processo novo) e reporta.
    captureUsersCountDegraded("query_returned_null", { supabaseCount: null });
    return res.json({ count: lastKnownGood });
  } catch (err) {
    console.error("[stats] users-count query failed", err);
    captureUsersCountDegraded("query_threw", {
      supabaseCount: null,
      error: err instanceof Error ? err.message : String(err),
    });
    return res.json({ count: lastKnownGood });
  }
});

// Superfície dedicada a teste: zera o lastKnownGood entre cenários.
// NÃO chamar em código de produção.
export function __resetForTests(): void {
  lastKnownGood = null;
  lastFetchAt = 0;
}

export default router;
