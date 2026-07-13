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
