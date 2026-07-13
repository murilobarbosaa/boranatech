import { describe, expect, it } from "vitest";

import {
  getPlanChargeValue,
  PLAN_ORDER,
  PLAN_PRICING,
  type PlanId,
} from "./planPricing";

// Guarda anti-regressao do bug: /planos exibia um preco e o Asaas cobrava outro,
// porque havia DUAS fontes de verdade (PLAN_PRICING no client, PLAN_VALUES no
// server). Agora ha uma so; este teste falha se elas voltarem a divergir.
//
// getPlanChargeValue e a MESMA funcao que o server usa para montar o `value`
// enviado ao Asaas; PLAN_PRICING[id].total e o MESMO numero que o client exibe.

// Precos canonicos esperados (ancora independente: mexer num total sem querer
// quebra este teste em vez de vazar para producao).
const EXPECTED_TOTAL: Record<PlanId, number> = {
  pro_monthly: 29.9,
  pro_semiannual: 129,
  pro_annual: 222,
};

describe("plan pricing: preco exibido === preco cobrado", () => {
  it.each(PLAN_ORDER)(
    "%s: valor cobrado no Asaas bate com o total exibido",
    (planId) => {
      expect(getPlanChargeValue(planId)).toBe(PLAN_PRICING[planId].total);
    },
  );

  it.each(PLAN_ORDER)("%s: precos batem com os valores canonicos", (planId) => {
    expect(PLAN_PRICING[planId].total).toBe(EXPECTED_TOTAL[planId]);
    expect(getPlanChargeValue(planId)).toBe(EXPECTED_TOTAL[planId]);
  });
});
