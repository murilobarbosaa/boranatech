// Fonte UNICA de verdade dos precos dos planos Pro: exibicao E cobranca.
// O que o site MOSTRA (Checkout, schema SEO, home/Pro) e o `value` que o server
// ENVIA ao Asaas derivam ambos deste arquivo (via getPlanChargeValue), entao o
// preco exibido e o preco cobrado sao, por definicao, o mesmo numero.

export type PlanId = "pro_monthly" | "pro_semiannual" | "pro_annual";

export interface PlanPricing {
  id: PlanId;
  label: string;
  // Valor total do ciclo: exibido no site/schema E cobrado no Asaas (mesmo numero).
  total: number;
  totalLabel: string;
  period: string;
  // Equivalente mensal exibido; vazio quando nao se aplica (plano mensal).
  monthlyEquivalent: string;
  // Desconto exibido sobre o mensal cheio (0 = sem desconto).
  savingsPercent: number;
}

// Mensal cheio, usado como preco "de" (riscado) nos planos com desconto.
export const MONTHLY_BASE_LABEL = "R$ 29,90";

// Menor mensal exibido (plano anual), para textos "a partir de".
export const FROM_MONTHLY_LABEL = "R$ 18,50";

export const PLAN_PRICING: Record<PlanId, PlanPricing> = {
  pro_monthly: {
    id: "pro_monthly",
    label: "Mensal",
    total: 29.9,
    totalLabel: "R$ 29,90",
    period: "por mês",
    monthlyEquivalent: "",
    savingsPercent: 0,
  },
  pro_semiannual: {
    id: "pro_semiannual",
    label: "Semestral",
    total: 129,
    totalLabel: "R$ 129,00",
    period: "a cada 6 meses",
    monthlyEquivalent: "R$ 21,50/mês",
    savingsPercent: 28,
  },
  pro_annual: {
    id: "pro_annual",
    label: "Anual",
    total: 222,
    totalLabel: "R$ 222,00",
    period: "por ano",
    monthlyEquivalent: "R$ 18,50/mês",
    savingsPercent: 38,
  },
};

export const PLAN_ORDER: PlanId[] = [
  "pro_monthly",
  "pro_semiannual",
  "pro_annual",
];

export function isPlanId(value: string): value is PlanId {
  return value in PLAN_PRICING;
}

// Valor cobrado (enviado ao Asaas) de um plano. Deriva do mesmo `total` exibido
// no site, garantindo que preco exibido e preco cobrado nunca divirjam.
export function getPlanChargeValue(planId: PlanId): number {
  return PLAN_PRICING[planId].total;
}

// Preco em CENTAVOS de um code de plano, ou null se o code nao for um plano Pro
// conhecido (ex.: 'free'). Fonte unica para todos os leitores de preco (server e
// client): substitui a leitura de plans.price_cents. O caller decide o fallback
// para code desconhecido (tipicamente manter o valor antigo ou 0).
export function getPlanPriceCents(code: string): number | null {
  return isPlanId(code) ? Math.round(PLAN_PRICING[code].total * 100) : null;
}

// Matematica de desconto percentual em CENTAVOS (inteiros), fonte unica de
// tudo que exibe preco com desconto no Checkout (card, badge de percentual,
// equivalente mensal e CTA). Em float, 29.90 * 0.70 = 20.9299... e o percentual
// derivado vira 29.999% (floor -> 29%); em centavos inteiros nao ha drift.

// Valor final apos desconto percentual. O DESCONTO e arredondado ao centavo
// mais proximo (Math.round), replicando a Stripe, que calcula o percent_off do
// coupon e arredonda ao centavo mais proximo; e ela quem computa o valor
// cobrado nos dois modos (price fixo no cartao, price_data inline no boleto),
// entao o front so bate com a cobranca usando a mesma regra.
export function discountedPriceCents(
  priceCents: number,
  percent: number,
): number {
  if (percent <= 0) return priceCents;
  return priceCents - Math.round((priceCents * percent) / 100);
}

// Percentual real de desconto de finalCents sobre fullCents, com floor sobre a
// razao de INTEIROS: nunca exibe percentual maior que o desconto real, e
// percentuais exatos nao sofrem drift (30% de 2990 da exatamente 30).
export function savingsPercentFloor(
  fullCents: number,
  finalCents: number,
): number {
  if (fullCents <= 0) return 0;
  return Math.floor(((fullCents - finalCents) * 100) / fullCents);
}
