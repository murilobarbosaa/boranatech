import { describe, expect, it } from "vitest";

import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import {
  CareerPlanResultSchema,
  findInvalidStepRefs,
  SYSTEM_PROMPT,
  type CareerPlanResult,
  type CareerPlanStoredResult,
} from "./generate";

// Fixture minima valida para o TIPO CareerPlanResult (findInvalidStepRefs nao
// reaplica os limites de tamanho do Zod; eles sao validados no parse real).
function baseResult(): CareerPlanResult {
  return {
    objectiveLogic: "logica da rota",
    steps: [
      {
        id: "fundamentos",
        title: "Fundamentos",
        rationale: "primeiro a base",
        items: [{ label: "estudar logica", catalogId: null }],
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
        catalogId: "aws-cloud-practitioner",
        stepId: "fundamentos",
        whenLabel: "depois do degrau fundamentos",
        optional: false,
        rationale: "valida a base",
      },
    ],
    schedule: [
      {
        monthsLabel: "Meses 1 a 3",
        focus: "base e primeiros projetos",
        stepIds: ["fundamentos", "pratica"],
      },
    ],
    outOfScope: [{ label: "kubernetes", reason: "cedo demais para a rota" }],
  };
}

describe("findInvalidStepRefs", () => {
  it("aceita ancoras validas, stepId null e stepIds vazio", () => {
    const result = baseResult();
    result.certifications.push({
      catalogId: "aws-ai-practitioner",
      stepId: null,
      whenLabel: "quando fizer sentido",
      optional: true,
      rationale: "transversal a rota",
    });
    result.schedule.push({
      monthsLabel: "Mes 4",
      focus: "revisao geral",
      stepIds: [],
    });

    expect(findInvalidStepRefs(result)).toEqual([]);
  });

  it("reprova certifications[].stepId que nao existe em steps[].id", () => {
    const result = baseResult();
    result.certifications[0].stepId = "degrau-fantasma";

    expect(findInvalidStepRefs(result)).toEqual(["degrau-fantasma"]);
  });

  it("reprova id inexistente dentro de schedule[].stepIds", () => {
    const result = baseResult();
    result.schedule[0].stepIds = ["fundamentos", "degrau-fantasma"];

    expect(findInvalidStepRefs(result)).toEqual(["degrau-fantasma"]);
  });
});

describe("schema strict de geracao", () => {
  it("exige stepId e stepIds e mantem additionalProperties false", () => {
    const schema = toOpenAIStrictSchema(CareerPlanResultSchema) as {
      additionalProperties?: boolean;
      required?: string[];
      properties: Record<
        string,
        { items?: { required?: string[]; additionalProperties?: boolean } }
      >;
    };

    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "objectiveLogic",
        "steps",
        "certifications",
        "schedule",
        "outOfScope",
      ]),
    );

    const cert = schema.properties.certifications.items;
    expect(cert?.additionalProperties).toBe(false);
    expect(cert?.required).toEqual(expect.arrayContaining(["stepId"]));

    const block = schema.properties.schedule.items;
    expect(block?.additionalProperties).toBe(false);
    expect(block?.required).toEqual(expect.arrayContaining(["stepIds"]));
  });
});

describe("regra de orcamento no prompt do sistema", () => {
  // A infra de teste do prompt e de string: o assert garante que a regra
  // esta presente no prompt montado, sem chamar o modelo.
  it("mantem a regra de orcamento com os dois niveis (zero e ate 500)", () => {
    expect(SYSTEM_PROMPT).toContain("REGRA DE ORÇAMENTO");
    expect(SYSTEM_PROMPT).toContain(
      "com orçamento zero, cite apenas itens gratuitos do catálogo",
    );
    expect(SYSTEM_PROMPT).toContain(
      "certificação paga só pode aparecer em outOfScope",
    );
    expect(SYSTEM_PROMPT).toContain(
      "NUNCA deve estourar o orçamento declarado",
    );
  });
});

describe("tipo de leitura retrocompativel", () => {
  it("resultado antigo sem stepId e stepIds segue valido como CareerPlanStoredResult", () => {
    // Compila apenas se os campos novos forem OPCIONAIS na leitura: este
    // literal reproduz um result persistido antes da ancoragem.
    const legacy: CareerPlanStoredResult = {
      objectiveLogic: "logica antiga",
      steps: [
        {
          id: "fundamentos",
          title: "Fundamentos",
          rationale: "base",
          items: [{ label: "estudar", catalogId: null }],
          estimatedWeeks: 4,
        },
      ],
      certifications: [
        {
          catalogId: "aws-cloud-practitioner",
          whenLabel: "depois do degrau fundamentos",
          optional: false,
          rationale: "valida a base",
        },
      ],
      schedule: [{ monthsLabel: "Meses 1 a 3", focus: "base" }],
      outOfScope: [{ label: "kubernetes", reason: "cedo demais" }],
      checklist: [
        {
          itemId: "step:fundamentos:0",
          label: "estudar",
          kind: "step_item",
          stepId: "fundamentos",
        },
      ],
    };

    expect(legacy.certifications[0].stepId).toBeUndefined();
    expect(legacy.schedule[0].stepIds).toBeUndefined();
  });
});
