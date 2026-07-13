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
// Uso (precisa STRIPE_SECRET_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-coupons.mjs   # sandbox
//   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-coupons.mjs   # producao
// Rode nos DOIS modos: coupon de sandbox e de producao sao objetos diferentes.

import { config } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

config({ quiet: true });

const STRIPE_API_VERSION = "2026-06-24.dahlia";

const secretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!secretKey) {
  console.error(
    "[stripe-coupons] STRIPE_SECRET_KEY ausente. Defina a chave (sk_test_... ou sk_live_...) e rode de novo.",
  );
  process.exit(1);
}
if (!supabaseUrl || !serviceKey) {
  console.error(
    "[stripe-coupons] SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY ausentes.",
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
const supabase = createClient(supabaseUrl, serviceKey);

function isResourceMissing(err) {
  return Boolean(err) && (err.code === "resource_missing" || err.statusCode === 404);
}

async function ensureCoupon(percent) {
  const id = `bnt_aff_${percent}_once`;
  try {
    await stripe.coupons.retrieve(id);
    console.log(`[stripe-coupons] reutilizado: ${id}`);
    return;
  } catch (err) {
    if (!isResourceMissing(err)) throw err;
  }
  await stripe.coupons.create({
    id,
    percent_off: percent,
    duration: "once",
    metadata: { source: "bnt_affiliate", discount_percent: String(percent) },
  });
  console.log(`[stripe-coupons] criado: ${id} (${percent}% once)`);
}

async function main() {
  const { data, error } = await supabase
    .from("affiliates")
    .select("discount_percent")
    .eq("status", "active");
  if (error) throw new Error(`Supabase: ${error.message}`);

  const percents = [...new Set((data || []).map((row) => row.discount_percent))]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= 100)
    .sort((a, b) => a - b);

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
