import * as Sentry from "@sentry/node";

import { getPlanPriceCents } from "../../shared/planPricing";

// Codes de plano que legitimamente NAO tem preco no planPricing.ts (nao sao planos
// pagos): caem no fallback sem serem anomalia, entao nao logam (senao vira ruido).
const EXPECTED_UNPRICED_CODES = new Set(["free"]);

// Resolve o preco em centavos de um plano pela FONTE UNICA (planPricing.ts). Se o
// code nao estiver la, cai para o valor do banco (comportamento INALTERADO) mas
// GRITA (Sentry warning): um code real fora do planPricing significa que alguem
// adicionou um plano no banco e esqueceu no modulo — exatamente a falha silenciosa
// de preco que este projeto ja pagou caro. `free` e code ausente nao logam.
export function resolvePlanPriceCents(
  code: string | null | undefined,
  dbPriceCents: number,
  context: string,
): number {
  const fromModule = code ? getPlanPriceCents(code) : null;
  if (fromModule != null) return fromModule;

  if (code && !EXPECTED_UNPRICED_CODES.has(code)) {
    const message = `[planPrice] code "${code}" sem preco no planPricing.ts; usando plans.price_cents=${dbPriceCents} (fonte antiga) em ${context}. Adicione o plano ao planPricing.ts.`;
    console.error(message);
    Sentry.captureMessage(message, "warning");
  }
  return dbPriceCents;
}
