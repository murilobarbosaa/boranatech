// scripts/stripe-backfill-transactions.mjs
// Backfill idempotente das balance transactions da Stripe para finance_transactions.
// Sincroniza desde a PRIMEIRA transacao da conta (sem filtro `since`). Rodar duas
// vezes NAO duplica: upsert por stripe_balance_transaction_id.
//
// Uso:
//   node --env-file=.env --import tsx scripts/stripe-backfill-transactions.mjs
import { syncBalanceTransactions } from "../server/lib/stripeSync";

async function main() {
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
