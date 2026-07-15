// Sincroniza os enabled_events de um Webhook Endpoint da Stripe com os eventos que
// o handleWebhook (server/providers/stripe.ts) realmente trata. Adiciona os que
// faltam, PRESERVA os existentes (nunca remove), idempotente.
//
// Motivo: o endpoint de producao estava com 5 eventos, mas faltavam os de boleto
// (async_payment_succeeded/failed) -> boleto pago nao ativava ninguem em producao.
//
// Diferente dos outros scripts (stripe-coupons/stripe-test-prices): este PRECISA
// rodar em LIVE, entao NAO ha fail-closed em sk_live_. Em compensacao, so aplica
// com --confirm (dry-run por padrao) e SEMPRE imprime o diff antes.
//
// Funciona em test e live (a chave decide o modo). Se o endpoint nao existir (ex.:
// o endpoint efemero do `stripe listen` em test), avisa e sai sem erro.
//
// Uso:
//   node scripts/stripe-webhook-events.mjs <webhook_endpoint_id>            # dry-run
//   node scripts/stripe-webhook-events.mjs <webhook_endpoint_id> --confirm  # aplica

import { config } from "dotenv";

config({ quiet: true });

const STRIPE_API = "https://api.stripe.com/v1";

// Eventos que o switch de handleWebhook trata hoje. FONTE: manter em sincronia com
// server/providers/stripe.ts (adicionar aqui quando adicionar um case la).
const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.succeeded",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
];

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("[stripe-webhook-events] env faltando: STRIPE_SECRET_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const confirm = args.includes("--confirm");
const endpointId = args.find((a) => !a.startsWith("--"));
if (!endpointId) {
  console.error(
    "[stripe-webhook-events] uso: node scripts/stripe-webhook-events.mjs <webhook_endpoint_id> [--confirm]",
  );
  process.exit(1);
}

const mode = secretKey.startsWith("sk_live_") ? "LIVE" : "test";

async function stripeRequest(method, path, body) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ?? undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// enabled_events e um array de strings: enabled_events[]=a&enabled_events[]=b...
function encodeEnabledEvents(events) {
  return events
    .map((e) => `enabled_events[]=${encodeURIComponent(e)}`)
    .join("&");
}

async function main() {
  console.log(`[stripe-webhook-events] modo: ${mode} | endpoint: ${endpointId}`);

  const found = await stripeRequest(
    "GET",
    `/webhook_endpoints/${encodeURIComponent(endpointId)}`,
  );

  if (found.status === 404) {
    // Em test o endpoint do `stripe listen` e efemero: nao quebrar, so avisar.
    console.log(
      `[stripe-webhook-events] endpoint ${endpointId} nao encontrado (${mode}). Nada a fazer.`,
    );
    return;
  }
  if (!found.ok) {
    throw new Error(
      `Stripe GET webhook_endpoint -> ${found.status}: ${JSON.stringify(found.data?.error || found.data)}`,
    );
  }

  const current = Array.isArray(found.data.enabled_events)
    ? found.data.enabled_events
    : [];

  // Se o endpoint ja escuta '*' (todos os eventos), nao ha o que adicionar.
  if (current.includes("*")) {
    console.log(
      "[stripe-webhook-events] endpoint escuta '*' (todos os eventos); nada a adicionar.",
    );
    return;
  }

  const currentSet = new Set(current);
  const missing = HANDLED_EVENTS.filter((e) => !currentSet.has(e));
  // Uniao: preserva os existentes (mesmo os que nao estao em HANDLED) + adiciona os que faltam.
  const desired = [...new Set([...current, ...HANDLED_EVENTS])];

  console.log(`\nRegistrados hoje (${current.length}):`);
  for (const e of current) console.log(`  ${e}`);

  if (missing.length === 0) {
    console.log("\n[stripe-webhook-events] ja esta em dia; nada a adicionar.");
    return;
  }

  console.log(`\nA ADICIONAR (${missing.length}):`);
  for (const e of missing) console.log(`  + ${e}`);
  console.log(
    `\nResultado final teria ${desired.length} eventos (nenhum removido).`,
  );

  if (!confirm) {
    console.log(
      "\n[stripe-webhook-events] dry-run. Rode de novo com --confirm para aplicar.",
    );
    return;
  }

  const updated = await stripeRequest(
    "POST",
    `/webhook_endpoints/${encodeURIComponent(endpointId)}`,
    encodeEnabledEvents(desired),
  );
  if (!updated.ok) {
    throw new Error(
      `Stripe POST webhook_endpoint -> ${updated.status}: ${JSON.stringify(updated.data?.error || updated.data)}`,
    );
  }

  const applied = Array.isArray(updated.data.enabled_events)
    ? updated.data.enabled_events
    : [];
  console.log(
    `\n[stripe-webhook-events] aplicado. Endpoint agora com ${applied.length} eventos.`,
  );
}

main().catch((err) => {
  console.error("[stripe-webhook-events] falhou:", err.message || err);
  process.exit(1);
});
