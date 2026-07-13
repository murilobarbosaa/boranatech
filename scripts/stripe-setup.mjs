// Setup idempotente dos produtos/precos da Stripe para o Plano Pro.
//
// Cria 1 product "BoraNaTech Pro" e 3 prices recorrentes em BRL, com os valores
// vindos de shared/planPricing.ts (FONTE UNICA, nao duplicar valor aqui).
// Ao final imprime as linhas STRIPE_PRICE_* prontas para colar nas envs.
//
// Idempotente: reusa o product com metadata.slug === PRODUCT_SLUG e reusa um
// price ativo do mesmo plano/valor/intervalo em vez de duplicar.
//
// Uso (precisa STRIPE_SECRET_KEY no ambiente; sandbox e producao tem chaves e
// price_ids DIFERENTES, rode uma vez por ambiente):
//   pnpm exec tsx scripts/stripe-setup.mjs
//
// Nao depende do SDK `stripe`: fala direto com a REST API da Stripe via fetch,
// entao roda mesmo antes da instalacao do SDK (Fase 4).

import { config } from "dotenv";

import { PLAN_ORDER, PLAN_PRICING } from "../shared/planPricing";

config({ quiet: true });

const STRIPE_API = "https://api.stripe.com/v1";
const PRODUCT_SLUG = "boranatech-pro";
const PRODUCT_NAME = "BoraNaTech Pro";

// Stripe nao tem intervalo "semiannual": semestral = month a cada 6.
const RECURRING = {
  pro_monthly: { interval: "month", interval_count: 1 },
  pro_semiannual: { interval: "month", interval_count: 6 },
  pro_annual: { interval: "year", interval_count: 1 },
};

const ENV_NAME = {
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_semiannual: "STRIPE_PRICE_PRO_SEMIANNUAL",
  pro_annual: "STRIPE_PRICE_PRO_ANNUAL",
};

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error(
    "[stripe-setup] STRIPE_SECRET_KEY ausente. Defina a chave (sk_test_... ou sk_live_...) no ambiente e rode de novo.",
  );
  process.exit(1);
}

// Codifica objeto (com aninhamento) em application/x-www-form-urlencoded no
// formato que a Stripe espera: metadata[slug]=..., recurring[interval]=...
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
  if (!res.ok) {
    throw new Error(
      `Stripe ${method} ${path} -> ${res.status}: ${JSON.stringify(data?.error || data)}`,
    );
  }
  return data;
}

async function findOrCreateProduct() {
  const query = `metadata['slug']:'${PRODUCT_SLUG}'`;
  const search = await stripeRequest(
    "GET",
    `/products/search?query=${encodeURIComponent(query)}`,
  );
  if (Array.isArray(search.data) && search.data.length > 0) {
    console.log(`[stripe-setup] product reutilizado: ${search.data[0].id}`);
    return search.data[0];
  }

  const created = await stripeRequest("POST", "/products", {
    name: PRODUCT_NAME,
    metadata: { slug: PRODUCT_SLUG },
  });
  console.log(`[stripe-setup] product criado: ${created.id}`);
  return created;
}

async function findOrCreatePrice(productId, planId) {
  const pricing = PLAN_PRICING[planId];
  // BRL em centavos, derivado do total exibido no site (fonte unica).
  const unitAmount = Math.round(pricing.total * 100);
  const recurring = RECURRING[planId];

  const list = await stripeRequest(
    "GET",
    `/prices?product=${encodeURIComponent(productId)}&active=true&limit=100`,
  );
  const match = (list.data || []).find(
    (p) =>
      p?.metadata?.plan_id === planId &&
      p?.unit_amount === unitAmount &&
      p?.currency === "brl" &&
      p?.recurring?.interval === recurring.interval &&
      (p?.recurring?.interval_count ?? 1) === recurring.interval_count,
  );
  if (match) {
    console.log(`[stripe-setup] price reutilizado (${planId}): ${match.id}`);
    return match;
  }

  const created = await stripeRequest("POST", "/prices", {
    product: productId,
    currency: "brl",
    unit_amount: unitAmount,
    recurring,
    metadata: { plan_id: planId },
  });
  console.log(`[stripe-setup] price criado (${planId}): ${created.id}`);
  return created;
}

async function main() {
  const product = await findOrCreateProduct();

  const envLines = [];
  for (const planId of PLAN_ORDER) {
    const price = await findOrCreatePrice(product.id, planId);
    envLines.push(`${ENV_NAME[planId]}=${price.id}`);
  }

  console.log("\n== Cole estas envs no ambiente correspondente (Railway) ==");
  console.log(envLines.join("\n"));
  console.log(
    "\nLembrete: price_ids de sandbox e producao sao DIFERENTES. Rode este script uma vez por ambiente, com a STRIPE_SECRET_KEY daquele ambiente.",
  );
}

main().catch((err) => {
  console.error("[stripe-setup] falhou:", err.message || err);
  process.exit(1);
});
