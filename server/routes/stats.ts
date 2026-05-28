import { Router } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

// Last-known-good em memória. Política: nunca devolver 0 inventado quando a
// query degrada (count:null sem error, ou throw). Em degradação, serve o último
// número REAL bem-sucedido. Sem persistência: cobre o soluço transiente do
// Supabase sem adicionar tabela/escrita. Reinício do processo limpa o lkg —
// próximo request bem-sucedido repopula.
const FRESH_TTL_MS = 5 * 60 * 1000;
let lastKnownGood: number | null = null;
let lastFetchAt = 0;

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
    return res.json({ count: lastKnownGood });
  } catch (err) {
    console.error("[stats] users-count query failed", err);
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
