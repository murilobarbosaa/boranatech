// Garante na Stripe um coupon por PERCENTUAL de desconto de afiliado existente.
//
// O desconto de afiliado e sempre percentual (affiliates.discount_percent,
// integer 1..100). Dois afiliados com o mesmo percentual usam o MESMO coupon; a
// atribuicao de quem indicou vive no affiliate_code, nunca no cupom.
//
// id DETERMINISTICO: bnt_aff_<percent>_once. Isso mata a colisao sandbox/
// producao: o id e unico POR MODO (test/live), entao bnt_aff_20_once existe como
// dois objetos diferentes e a STRIPE_SECRET_KEY decide qual voce acerta. O schema
// do Supabase nao muda.
//
// duration "once" replica "desconto so na primeira cobranca" (o Asaas edita
// apenas a primeira cobranca). "forever" daria desconto vitalicio, NAO usar.
//
// Idempotente por construcao: retrieve por id; se 404, cria.
//
// Sem SDK: fala direto com a REST da Stripe e do Supabase via fetch (mesmo padrao
// do stripe-setup.mjs), entao roda com `node` sem interop de pacote.
//
// Uso (precisa STRIPE_SECRET_KEY + SUPABASE_URL|VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-coupons.mjs   # sandbox
//   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-coupons.mjs   # producao
// Rode nos DOIS modos: coupon de sandbox e de producao sao objetos diferentes.

import { config } from "dotenv";

config({ quiet: true });

const STRIPE_API = "https://api.stripe.com/v1";

const secretKey = process.env.STRIPE_SECRET_KEY;
// O .env do projeto usa VITE_SUPABASE_URL; aceita os dois nomes com fallback.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];
if (!secretKey) missing.push("STRIPE_SECRET_KEY");
if (!supabaseUrl) missing.push("SUPABASE_URL (ou VITE_SUPABASE_URL)");
if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (missing.length > 0) {
  console.error(`[stripe-coupons] env faltando: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseBase = supabaseUrl.replace(/\/$/, "");

// Codifica objeto (com aninhamento) em application/x-www-form-urlencoded no
// formato que a Stripe espera: metadata[source]=..., etc.
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

async function fetchActivePercents() {
  const url = `${supabaseBase}/rest/v1/affiliates?select=discount_percent&status=eq.active`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${JSON.stringify(data)}`);
  }
  const rows = Array.isArray(data) ? data : [];
  return [...new Set(rows.map((row) => row.discount_percent))]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= 100)
    .sort((a, b) => a - b);
}

async function ensureCoupon(percent) {
  const id = `bnt_aff_${percent}_once`;

  const found = await stripeRequest(
    "GET",
    `/coupons/${encodeURIComponent(id)}`,
  );
  if (found.ok) {
    console.log(`[stripe-coupons] reutilizado: ${id}`);
    return;
  }
  if (found.status !== 404) {
    throw new Error(
      `Stripe GET coupon ${id} -> ${found.status}: ${JSON.stringify(found.data?.error || found.data)}`,
    );
  }

  const created = await stripeRequest("POST", "/coupons", {
    id,
    percent_off: percent,
    duration: "once",
    metadata: { source: "bnt_affiliate", discount_percent: String(percent) },
  });
  if (!created.ok) {
    throw new Error(
      `Stripe POST coupon ${id} -> ${created.status}: ${JSON.stringify(created.data?.error || created.data)}`,
    );
  }
  console.log(`[stripe-coupons] criado: ${id} (${percent}% once)`);
}

async function main() {
  const percents = await fetchActivePercents();

  if (percents.length === 0) {
    console.log("[stripe-coupons] nenhum afiliado ativo; nada a criar.");
    return;
  }

  for (const percent of percents) {
    await ensureCoupon(percent);
  }

  console.log(
    `\n${percents.length} cupom(ns) garantido(s): ${percents
      .map((p) => `bnt_aff_${p}_once`)
      .join(", ")}`,
  );
  console.log(
    "Lembrete: rode este script uma vez com sk_test_ e outra com sk_live_. Mesmos ids, objetos DIFERENTES por modo.",
  );
}

main().catch((err) => {
  console.error("[stripe-coupons] falhou:", err.message || err);
  process.exit(1);
});
