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

  it("orienta avaliar assinatura mensal pelo custo do periodo, nao pela mensalidade isolada", () => {
    expect(SYSTEM_PROMPT).toContain(
      "Itens de assinatura mensal devem ser avaliados pelo custo do período previsto no cronograma",
    );
    expect(SYSTEM_PROMPT).toContain("nunca pela mensalidade isolada");
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

/**
 * Piso de `schedule[].focus`: o que o Zod pode EXIGIR de verdade.
 *
 * O piso era 80. Ele nunca chegou ao modelo: `toOpenAIStrictSchema` remove
 * `minLength` antes de montar o response_format (openaiStrictSchema.ts:19, na
 * lista UNSUPPORTED_KEYWORDS), porque o strict mode da OpenAI rejeita a
 * keyword. Sobrava a instrucao em prosa no SYSTEM_PROMPT, que e pedido e nao
 * garantia. Quando o modelo devolvia um `focus` mais curto, as 3 tentativas
 * repetiam o MESMO prompt, falhavam igual, e o usuario levava 502
 * ("Nao foi possivel gerar o plano agora"). Sentry NODE-EXPRESS-H, com a cadeia
 * de excecao nomeando `path: ["schedule", 1, "focus"], minimum: 80`.
 *
 * 20 e um piso que continua barrando vazio e degenerado ("ok", "base") sem
 * fingir uma garantia que a camada de baixo nao sustenta. A instrucao de ~80
 * caracteres FICA no prompt de proposito: pedir mais do que se exige e legitimo;
 * exigir o que nao se pode pedir e que nao era.
 */
const FOCO_CURTO = "Base de dados.";
/** Entre o piso novo (20) e o antigo (80): e o caso que o bug derrubava. */
const FOCO_ENTRE_OS_DOIS_PISOS = "Fundamentos de SQL e planilhas";
const FOCO_LONGO =
  "Fundamentos de SQL, modelagem dimensional e pratica diaria com planilhas reais ate virar automatico.";

/** Plano valido contra o schema INTEIRO, com `schedule[0].focus` parametrizado. */
function planoValidoComFoco(focus: string) {
  const frase =
    "A rota parte do que voce ja sabe e avanca em degraus curtos, cada um com entrega propria. ";
  return {
    objectiveLogic: frase.repeat(4),
    steps: [1, 2, 3].map((n) => ({
      id: `degrau-${n}`,
      title: `Degrau ${n}`,
      rationale: frase.repeat(2),
      items: [{ label: "estudar o essencial", catalogId: null }],
      estimatedWeeks: 4,
    })),
    certifications: [],
    schedule: [
      { monthsLabel: "Meses 1 a 3", focus, stepIds: ["degrau-1"] },
      // Fixo e longo: mantem o segundo bloco valido nos dois pisos, para a
      // falha do teste apontar so para o indice 0.
      { monthsLabel: "Meses 4 a 6", focus: FOCO_LONGO, stepIds: ["degrau-2"] },
    ],
    outOfScope: [{ label: "kubernetes", reason: frase }],
  };
}

describe("piso de schedule[].focus", () => {
  it("aceita focus entre o piso novo e o antigo, que era o caso do 502", () => {
    expect(FOCO_ENTRE_OS_DOIS_PISOS.length).toBeGreaterThanOrEqual(20);
    expect(FOCO_ENTRE_OS_DOIS_PISOS.length).toBeLessThan(80);

    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoComFoco(FOCO_ENTRE_OS_DOIS_PISOS),
    );

    expect(parsed.error?.issues).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  // CONTROLE NEGATIVO: o piso continua existindo. Falha se alguem "resolver" o
  // bug apagando o `.min()` em vez de baixa-lo, que era a alternativa tentadora.
  it("CONTROLE NEGATIVO: recusa focus abaixo de 20 caracteres", () => {
    expect(FOCO_CURTO.length).toBeLessThan(20);

    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoComFoco(FOCO_CURTO),
    );

    expect(parsed.success).toBe(false);
    // Caminho conferido para a recusa ser atribuivel a `focus`, e nao a algum
    // outro campo da fixture ter quebrado junto.
    expect(parsed.error?.issues.map((i) => i.path.join("."))).toContain(
      "schedule.0.focus",
    );
  });
});

/**
 * Os outros dois pisos inalcancaveis do MESMO schema.
 *
 * `certifications[].rationale` (era 80) e `outOfScope[].reason` (era 60) sao a
 * mesma classe do `focus`: o `minLength` e removido por
 * `toOpenAIStrictSchema` (openaiStrictSchema.ts:19) e nunca chega ao modelo, e a
 * unica coisa que sobra e o pedido em prosa no SYSTEM_PROMPT. Nenhum dos dois
 * abriu evento no Sentry ainda, mas o mecanismo que derrubou o `focus` esta
 * inteiro nos dois: um dia ruim do modelo produz o mesmo 502.
 *
 * Preventivo, entao, e nao conserto de incidente. A varredura da rodada 1 mediu
 * 32 constraints declaradas no Zod e ZERO chegando a OpenAI; estes dois eram os
 * unicos com piso alto o bastante para o modelo errar.
 */
const TEXTO_ENTRE_20_E_60 = "Fecha a base antes de escalar";

function planoValidoCom(over: {
  certificationRationale?: string;
  outOfScopeReason?: string;
}) {
  const base = planoValidoComFoco(FOCO_LONGO);
  return {
    ...base,
    certifications: [
      {
        catalogId: "aws-cloud-practitioner",
        stepId: "degrau-1",
        whenLabel: "depois do degrau 1",
        optional: false,
        rationale: over.certificationRationale ?? FOCO_LONGO,
      },
    ],
    outOfScope: [
      {
        label: "kubernetes",
        reason: over.outOfScopeReason ?? FOCO_LONGO,
      },
    ],
  };
}

describe("pisos preventivos do mesmo schema", () => {
  it("certifications[].rationale aceita texto entre o piso novo e o antigo", () => {
    expect(TEXTO_ENTRE_20_E_60.length).toBeGreaterThanOrEqual(20);
    expect(TEXTO_ENTRE_20_E_60.length).toBeLessThan(80);

    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoCom({ certificationRationale: TEXTO_ENTRE_20_E_60 }),
    );

    expect(parsed.error?.issues).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  it("outOfScope[].reason aceita texto entre o piso novo e o antigo", () => {
    expect(TEXTO_ENTRE_20_E_60.length).toBeLessThan(60);

    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoCom({ outOfScopeReason: TEXTO_ENTRE_20_E_60 }),
    );

    expect(parsed.error?.issues).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  it("CONTROLE NEGATIVO: certifications[].rationale abaixo de 20 e recusado", () => {
    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoCom({ certificationRationale: "vale a pena" }),
    );

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.path.join("."))).toContain(
      "certifications.0.rationale",
    );
  });

  it("CONTROLE NEGATIVO: outOfScope[].reason abaixo de 20 e recusado", () => {
    const parsed = CareerPlanResultSchema.safeParse(
      planoValidoCom({ outOfScopeReason: "cedo demais" }),
    );

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.path.join("."))).toContain(
      "outOfScope.0.reason",
    );
  });
});
