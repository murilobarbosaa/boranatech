// scripts/stripe-backfill-transactions.mjs
// Backfill idempotente das balance transactions da Stripe para finance_transactions.
// Sincroniza desde a PRIMEIRA transacao da conta (sem filtro `since`). Rodar duas
// vezes NAO duplica: upsert por stripe_balance_transaction_id.
//
// Antes de escrever, IMPRIME o ambiente alvo (prefixo da chave Stripe e host do
// Supabase) e, se o banco for de producao, exige digitar "producao" para seguir.
// As guardas de ambiente do proprio syncBalanceTransactions valem aqui tambem.
//
// Uso:
//   node --env-file=.env --import tsx scripts/stripe-backfill-transactions.mjs
import { createInterface } from "node:readline/promises";

import { env } from "../server/lib/env";
import {
  isLocalSupabaseUrl,
  stripeKeyMode,
  syncBalanceTransactions,
} from "../server/lib/stripeSync";

function supabaseHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function main() {
  // Mesmo fallback do supabaseAdmin: reporta a URL em que o client escreve.
  const supabaseUrl = env.supabaseUrl || "http://localhost:54321";
  const databaseIsLocal = isLocalSupabaseUrl(supabaseUrl);
  const keyMode = stripeKeyMode(env.stripeSecretKey);
  const keyLabel =
    keyMode === "test"
      ? "sk_test"
      : keyMode === "live"
        ? "sk_live"
        : "prefixo desconhecido";

  console.log("[backfill] ambiente alvo:");
  console.log(`[backfill]   chave Stripe: ${keyLabel}`);
  console.log(
    `[backfill]   Supabase: ${supabaseHost(supabaseUrl)} (${databaseIsLocal ? "local" : "PRODUCAO"})`,
  );

  if (!databaseIsLocal) {
    if (keyMode !== "live") {
      console.error(
        "[backfill] ABORTADO: chave Stripe nao e sk_live_ mas o Supabase e de producao. Nada foi gravado.",
      );
      process.exit(1);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // stdin fechado (EOF) nao resolve rl.question e derrubaria o processo com
    // exit 0 parecendo sucesso: trata EOF como resposta vazia, que cancela.
    const answer = await Promise.race([
      rl.question(
        '[backfill] banco de PRODUCAO detectado. Digite "producao" para continuar: ',
      ),
      new Promise((resolve) => rl.once("close", () => resolve(""))),
    ]);
    rl.close();
    if (answer.trim() !== "producao") {
      console.error("[backfill] cancelado: confirmacao nao recebida. Nada foi gravado.");
      process.exit(1);
    }
  }

  console.log(
    "[backfill] sincronizando balance transactions desde o inicio da conta...",
  );
  const result = await syncBalanceTransactions({});
  console.log(
    `[backfill] concluido: processadas=${result.processed} upsertadas=${result.upserted} puladas=${result.skipped}`,
  );
}

main().catch((err) => {
  console.error("[backfill] FALHOU:", err instanceof Error ? err.message : err);
  process.exit(1);
});
