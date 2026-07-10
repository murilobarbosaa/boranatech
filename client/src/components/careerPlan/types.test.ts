import { describe, expect, it } from "vitest";

import { buildTrailVM, type TrailSourceResult } from "./types";

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
});
