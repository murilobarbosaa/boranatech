// Cria em TEST MODE o Product Pro e os tres Prices (mensal, semestral, anual),
// espelhando os valores das linhas Pro da tabela plans. Serve para testar o
// checkout (incluindo boleto, que entra em outra task) sem tocar o live mode,
// onde esses prices ja existem.
//
// Valores HARDCODED de proposito (a task fixou): nao busca em plans nem no banco.
//   pro_monthly     2490  BRL  mensal
//   pro_semiannual  11940 BRL  a cada 6 meses
//   pro_annual      17990 BRL  anual
// Os tres sao recurring (mode: subscription).
//
// Idempotente por construcao: o Product tem id deterministico (retrieve; se 404,
// cria) e cada Price e localizado por lookup_key (= code do plano) antes de criar.
// Rodar duas vezes reutiliza tudo, nao duplica.
//
// Fail-closed em live: se STRIPE_SECRET_KEY comecar com sk_live_, aborta. Este
// script e test-only; criar prices duplicados em producao seria ruim.
//
// Sem SDK: fala direto com a REST da Stripe via fetch (mesmo padrao de
// stripe-coupons.mjs), entao roda com `node` sem interop de pacote.
//
// Uso (precisa STRIPE_SECRET_KEY test):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-test-prices.mjs

import { config } from "dotenv";

config({ quiet: true });

const STRIPE_API = "https://api.stripe.com/v1";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("[stripe-test-prices] env faltando: STRIPE_SECRET_KEY");
  process.exit(1);
}

if (secretKey.startsWith("sk_live_")) {
  console.error(
    "[stripe-test-prices] STRIPE_SECRET_KEY e live (sk_live_). Este script e test-only; abortando para nao duplicar prices em producao.",
  );
  process.exit(1);
}

// Product deterministico para reaproveitar entre execucoes.
const PRODUCT_ID = "bnt_pro_test";

// As tres linhas Pro. Stripe recurring so aceita day/week/month/year, entao
// "a cada 6 meses" e month com interval_count 6.
const PLANS = [
  {
    code: "pro_monthly",
    unitAmount: 2490,
    interval: "month",
    intervalCount: 1,
    envKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
  {
    code: "pro_semiannual",
    unitAmount: 11940,
    interval: "month",
    intervalCount: 6,
    envKey: "STRIPE_PRICE_PRO_SEMIANNUAL",
  },
  {
    code: "pro_annual",
    unitAmount: 17990,
    interval: "year",
    intervalCount: 1,
    envKey: "STRIPE_PRICE_PRO_ANNUAL",
  },
];

// Codifica objeto (com aninhamento) em application/x-www-form-urlencoded no
// formato que a Stripe espera: metadata[plan_code]=..., recurring[interval]=...
function encodeForm(obj, prefix) {
  const parts = [];
  for (const [rawKey, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const key = prefix ? `${prefix}[${rawKey}]` : rawKey;
    if (typeof value === "object") {
      const nested = encodeForm(value, key);
      if (nested) parts.push(nested);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}

async function stripeRequest(method, path, body) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? encodeForm(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function ensureProduct() {
  const found = await stripeRequest(
    "GET",
    `/products/${encodeURIComponent(PRODUCT_ID)}`,
  );
  if (found.ok) {
    console.log(`[stripe-test-prices] product reutilizado: ${PRODUCT_ID}`);
    return PRODUCT_ID;
  }
  if (found.status !== 404) {
    throw new Error(
      `Stripe GET product ${PRODUCT_ID} -> ${found.status}: ${JSON.stringify(found.data?.error || found.data)}`,
    );
  }

  const created = await stripeRequest("POST", "/products", {
    id: PRODUCT_ID,
    name: "Bora na Tech Pro",
    metadata: { source: "bnt_pro" },
  });
  if (!created.ok) {
    throw new Error(
      `Stripe POST product ${PRODUCT_ID} -> ${created.status}: ${JSON.stringify(created.data?.error || created.data)}`,
    );
  }
  console.log(`[stripe-test-prices] product criado: ${PRODUCT_ID}`);
  return PRODUCT_ID;
}

// lookup_key (= code do plano) da a idempotencia do price. Busca antes de criar.
async function ensurePrice(plan, productId) {
  const found = await stripeRequest(
    "GET",
    `/prices?lookup_keys[]=${encodeURIComponent(plan.code)}&limit=1`,
  );
  if (!found.ok) {
    throw new Error(
      `Stripe GET price ${plan.code} -> ${found.status}: ${JSON.stringify(found.data?.error || found.data)}`,
    );
  }
  const existing = Array.isArray(found.data?.data) ? found.data.data[0] : null;
  if (existing) {
    console.log(
      `[stripe-test-prices] price reutilizado: ${plan.code} -> ${existing.id}`,
    );
    return existing.id;
  }

  const created = await stripeRequest("POST", "/prices", {
    product: productId,
    unit_amount: plan.unitAmount,
    currency: "brl",
    lookup_key: plan.code,
    recurring: { interval: plan.interval, interval_count: plan.intervalCount },
    metadata: { plan_code: plan.code },
  });
  if (!created.ok) {
    throw new Error(
      `Stripe POST price ${plan.code} -> ${created.status}: ${JSON.stringify(created.data?.error || created.data)}`,
    );
  }
  console.log(
    `[stripe-test-prices] price criado: ${plan.code} -> ${created.data.id}`,
  );
  return created.data.id;
}

async function main() {
  const productId = await ensureProduct();

  const results = [];
  for (const plan of PLANS) {
    const priceId = await ensurePrice(plan, productId);
    results.push({ envKey: plan.envKey, priceId });
  }

  console.log("\nCole no .env (test mode):");
  for (const { envKey, priceId } of results) {
    console.log(`  ${envKey}=${priceId}`);
  }
}

main().catch((err) => {
  console.error("[stripe-test-prices] falhou:", err.message || err);
  process.exit(1);
});
