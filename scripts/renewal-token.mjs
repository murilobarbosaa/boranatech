// DEV-only: gera um token de renovacao de boleto para testar o endpoint
// /api/billing/renew (e a pagina /renovar) na mao, sem esperar o cron da regua.
//
// Espelha EXATAMENTE server/lib/renewalToken.ts + server/lib/signedToken.ts (o
// import direto quebra fora do build: TS + imports sem extensao). Fonte da verdade
// e o codigo do server; qualquer mudanca la precisa refletir aqui.
//   payload = { purpose:"boleto_renewal", sub:<id>, pend:<period_end_ms>, exp }
//   exp = period_end_ms + 7 dias     (validade: ate 7 dias depois do vencimento)
//   token = base64url(JSON(payload)) + "." + HMAC_sha256(payloadB64, secret)b64url
//
// Fail-closed em live: se STRIPE_SECRET_KEY for sk_live_, aborta (dev-only),
// mesmo padrao de stripe-coupons.mjs / stripe-test-prices.mjs.
//
// Uso (precisa RENEWAL_TOKEN_SECRET + SUPABASE_URL|VITE_SUPABASE_URL + SERVICE_ROLE):
//   node scripts/renewal-token.mjs <subscription_id>

import crypto from "crypto";
import { config } from "dotenv";

config({ quiet: true });

const PURPOSE = "boleto_renewal";
const GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias apos o vencimento

const secret = process.env.RENEWAL_TOKEN_SECRET;
// O .env do projeto usa VITE_SUPABASE_URL; aceita os dois nomes com fallback.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

// Fail-closed: script de desenvolvimento, nunca contra producao.
if (stripeKey && stripeKey.startsWith("sk_live_")) {
  console.error(
    "[renewal-token] STRIPE_SECRET_KEY e live (sk_live_). Script dev-only; abortando.",
  );
  process.exit(1);
}

const missing = [];
if (!secret) missing.push("RENEWAL_TOKEN_SECRET");
if (!supabaseUrl) missing.push("SUPABASE_URL (ou VITE_SUPABASE_URL)");
if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length > 0) {
  console.error(`[renewal-token] env faltando: ${missing.join(", ")}`);
  process.exit(1);
}

const subscriptionId = process.argv[2];
if (!subscriptionId) {
  console.error("[renewal-token] uso: node scripts/renewal-token.mjs <subscription_id>");
  process.exit(1);
}

const supabaseBase = supabaseUrl.replace(/\/$/, "");

function toBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

async function fetchSubscription(id) {
  const url =
    `${supabaseBase}/rest/v1/subscriptions` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&select=id,current_period_end,renewal_type,status,payment_method`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${JSON.stringify(data)}`);
  }
  return Array.isArray(data) ? data[0] : null;
}

async function main() {
  const sub = await fetchSubscription(subscriptionId);
  if (!sub) {
    console.error(`[renewal-token] subscription ${subscriptionId} nao encontrada.`);
    process.exit(1);
  }
  if (sub.renewal_type !== "manual") {
    console.error(
      `[renewal-token] subscription ${subscriptionId} tem renewal_type='${sub.renewal_type}', nao 'manual'. Renovacao por token so vale para boleto manual.`,
    );
    process.exit(1);
  }
  if (!sub.current_period_end) {
    console.error(
      `[renewal-token] subscription ${subscriptionId} sem current_period_end; nao da para gerar o token (pend/validade).`,
    );
    process.exit(1);
  }

  const periodEndMs = new Date(sub.current_period_end).getTime();
  if (!Number.isFinite(periodEndMs)) {
    console.error(
      `[renewal-token] current_period_end invalido: ${sub.current_period_end}`,
    );
    process.exit(1);
  }

  const exp = periodEndMs + GRACE_MS;
  if (exp <= Date.now()) {
    console.error(
      `[renewal-token] janela de renovacao ja passou (vencimento ${sub.current_period_end} + 7 dias < agora); issueRenewalToken retornaria null.`,
    );
    process.exit(1);
  }

  const payloadB64 = toBase64Url(
    JSON.stringify({ purpose: PURPOSE, sub: sub.id, pend: periodEndMs, exp }),
  );
  const token = `${payloadB64}.${sign(payloadB64)}`;

  console.log(`\nsubscription: ${sub.id} (status=${sub.status})`);
  console.log(`vencimento:   ${sub.current_period_end}`);
  console.log(`token expira: ${new Date(exp).toISOString()}\n`);
  console.log(`TOKEN:\n${token}\n`);
  console.log(`Pagina:  http://localhost:3000/renovar?t=${token}\n`);
  console.log("Preview (GET):");
  console.log(
    `  curl "http://localhost:3100/api/billing/renew?token=${token}"\n`,
  );
  console.log("Gerar boleto (POST):");
  console.log(
    `  curl -X POST http://localhost:3100/api/billing/renew -H 'Content-Type: application/json' -d '{"token":"${token}"}'\n`,
  );
}

main().catch((err) => {
  console.error("[renewal-token] falhou:", err.message || err);
  process.exit(1);
});
