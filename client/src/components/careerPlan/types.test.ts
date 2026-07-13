import { describe, expect, it } from "vitest";

import {
  buildTrailVM,
  formatAmount,
  formatPrice,
  summarizeInvestment,
  type StationCertVM,
  type TrailSourceResult,
} from "./types";

// Cert minima para os testes de investimento (o que summarizeInvestment le:
// catalogId e optional).
function cert(catalogId: string, optional = false): StationCertVM {
  return {
    itemId: `cert:${catalogId}`,
    catalogId,
    whenLabel: "quando fizer sentido",
    optional,
    rationale: "motivo",
    done: null,
  };
}

function anchoredPlan(): TrailSourceResult {
  return {
    steps: [
      {
        id: "fundamentos",
        title: "Fundamentos",
        rationale: "primeiro a base",
        items: [
          { label: "estudar logica", catalogId: null },
          { label: "curso intro", catalogId: "curso-intro" },
        ],
        estimatedWeeks: 4,
      },
      {
        id: "pratica",
        title: "Pratica",
        rationale: "depois a pratica",
        items: [{ label: "projeto pessoal", catalogId: null }],
        estimatedWeeks: 6,
      },
    ],
    certifications: [
      {
        catalogId: "cert-base",
        stepId: "fundamentos",
        whenLabel: "depois do degrau fundamentos",
        optional: false,
        rationale: "valida a base",
      },
      {
        catalogId: "cert-transversal",
        stepId: null,
        whenLabel: "quando fizer sentido",
        optional: true,
        rationale: "transversal a rota",
      },
    ],
    schedule: [
      {
        monthsLabel: "Meses 1 a 3",
        focus: "base",
        stepIds: ["fundamentos"],
      },
      {
        monthsLabel: "Meses 4 a 6",
        focus: "pratica e revisao da base",
        stepIds: ["fundamentos", "pratica"],
      },
      { monthsLabel: "Mes 7", focus: "revisao geral", stepIds: [] },
    ],
  };
}

// Plano persistido antes da Fase 1: nenhuma ancora presente.
function legacyPlan(): TrailSourceResult {
  const plan = anchoredPlan();
  return {
    steps: plan.steps,
    certifications: plan.certifications.map(
      ({ stepId: _stepId, ...cert }) => cert,
    ),
    schedule: plan.schedule.map(({ stepIds: _stepIds, ...block }) => block),
  };
}

describe("buildTrailVM", () => {
  it("monta estacoes na ordem dos steps com certs, cronograma e progresso", () => {
    const done = new Set([
      "step:fundamentos:0",
      "step:fundamentos:1",
      "cert:cert-base",
    ]);
    const vm = buildTrailVM(anchoredPlan(), done);

    expect(vm.unanchored).toBe(false);
    expect(vm.stations.map((s) => s.step.id)).toEqual([
      "fundamentos",
      "pratica",
    ]);

    const [first, second] = vm.stations;
    expect(first.anchoredCerts.map((c) => c.catalogId)).toEqual(["cert-base"]);
    expect(first.scheduleLabel).toBe("Meses 1 a 3");
    expect(first.progress).toEqual({ done: 3, total: 3 });
    expect(first.state).toBe("complete");

    expect(second.anchoredCerts).toEqual([]);
    expect(second.scheduleLabel).toBe("Meses 4 a 6");
    expect(second.progress).toEqual({ done: 0, total: 1 });
    expect(second.state).toBe("current");

    expect(vm.currentStationIndex).toBe(1);
    expect(vm.generalCerts.map((c) => c.catalogId)).toEqual([
      "cert-transversal",
    ]);
    expect(vm.generalCerts[0].done).toBe(false);

    // Blocos com estacao ficam fora da faixa; o de stepIds vazio entra.
    expect(vm.looseScheduleBlocks).toEqual([
      { monthsLabel: "Mes 7", focus: "revisao geral" },
    ]);
  });

  it("plano antigo sem ancoras: tudo na prateleira geral e unanchored true", () => {
    const vm = buildTrailVM(legacyPlan(), new Set());

    expect(vm.unanchored).toBe(true);
    expect(vm.generalCerts.map((c) => c.catalogId)).toEqual([
      "cert-base",
      "cert-transversal",
    ]);
    expect(vm.stations.every((s) => s.anchoredCerts.length === 0)).toBe(true);
    expect(vm.stations.every((s) => s.scheduleLabel === null)).toBe(true);

    // Plano antigo: a faixa de cronograma mostra TODOS os blocos, na ordem.
    expect(vm.looseScheduleBlocks.map((b) => b.monthsLabel)).toEqual([
      "Meses 1 a 3",
      "Meses 4 a 6",
      "Mes 7",
    ]);
  });

  it("checklist indisponivel propaga null, nunca 0", () => {
    const vm = buildTrailVM(anchoredPlan(), null);

    expect(vm.stations.every((s) => s.progress.done === null)).toBe(true);
    expect(vm.stations.every((s) => s.state === "indeterminate")).toBe(true);
    expect(vm.stations[0].items.every((item) => item.done === null)).toBe(true);
    expect(vm.generalCerts[0].done).toBeNull();
    expect(vm.currentStationIndex).toBeNull();
  });

  it("stepId invalido cai na prateleira geral sem marcar o plano como antigo", () => {
    const plan = anchoredPlan();
    plan.certifications[0].stepId = "degrau-fantasma";

    const vm = buildTrailVM(plan, new Set());

    expect(vm.unanchored).toBe(false);
    expect(vm.generalCerts.map((c) => c.catalogId)).toEqual([
      "cert-base",
      "cert-transversal",
    ]);
    expect(vm.stations[0].anchoredCerts).toEqual([]);
    expect(vm.stations[0].progress.total).toBe(2);
  });

  it("bloco do cronograma so com ids invalidos vira faixa nao-ancorada", () => {
    const plan = anchoredPlan();
    plan.schedule[0].stepIds = ["degrau-fantasma"];

    const vm = buildTrailVM(plan, new Set());

    expect(vm.looseScheduleBlocks.map((b) => b.monthsLabel)).toEqual([
      "Meses 1 a 3",
      "Mes 7",
    ]);
    // A estacao passa a ancorar no primeiro bloco valido seguinte.
    expect(vm.stations[0].scheduleLabel).toBe("Meses 4 a 6");
    expect(vm.unanchored).toBe(false);
  });
});

describe("formatAmount", () => {
  it("formata valor unico sem sufixo (default e nas moedas)", () => {
    expect(formatAmount(150, "USD")).toBe("USD 150");
    expect(formatAmount(200, "BRL", "once")).toBe("R$ 200");
  });

  it("sufixa /mes quando a periodicidade e mensal", () => {
    expect(formatAmount(49, "USD", "monthly")).toBe("USD 49/mês");
    expect(formatAmount(200, "BRL", "monthly")).toBe("R$ 200/mês");
  });
});

describe("formatPrice", () => {
  it("usa a periodicidade do catalogo (unico vs mensal)", () => {
    // aws-cloud-practitioner e pagamento unico; google-it-support e mensal.
    expect(formatPrice("aws-cloud-practitioner")).toBe("USD 100");
    expect(formatPrice("google-it-support")).toBe("USD 49/mês");
  });

  it("mostra Gratuito para item gratuito e vazio para item fora do catalogo", () => {
    expect(formatPrice("freecodecamp")).toBe("Gratuito");
    expect(formatPrice("curso-fantasma-xyz")).toBe("");
  });
});

describe("summarizeInvestment", () => {
  it("separa unicos e mensais; o mensal NUNCA entra no total unico", () => {
    const breakdown = summarizeInvestment([
      cert("aws-cloud-practitioner"), // once, obrigatoria, USD 100
      cert("cisco-ccna", true), // once, opcional, USD 300
      cert("google-it-support"), // monthly, obrigatoria, USD 49
      cert("meta-front-end", true), // monthly, opcional, USD 49
      cert("freecodecamp"), // gratuito, fora da soma
      cert("curso-fantasma-xyz"), // fora do catalogo, fora da soma
    ]);

    expect(breakdown.onceTotals).toEqual([
      { currency: "USD", required: 100, withOptionals: 400 },
    ]);
    expect(breakdown.monthlyTotals).toEqual([
      { currency: "USD", required: 49, withOptionals: 98 },
    ]);
    // Prova de que o mensal (49) nao inflou o total unico: obrigatoria 100 e
    // com opcional 400 (100 + 300), sem os 49 mensais.
    expect(breakdown.onceTotals[0].required).toBe(100);
    expect(breakdown.onceTotals[0].withOptionals).toBe(400);

    expect(breakdown.freeCount).toBe(1);
    expect(breakdown.outdatedCount).toBe(1);
  });

  it("plano so com itens de pagamento unico nao gera linha mensal", () => {
    const breakdown = summarizeInvestment([
      cert("aws-cloud-practitioner"),
      cert("cisco-ccna"),
    ]);
    expect(breakdown.monthlyTotals).toEqual([]);
    expect(breakdown.onceTotals).toEqual([
      { currency: "USD", required: 400, withOptionals: 400 },
    ]);
  });
});
