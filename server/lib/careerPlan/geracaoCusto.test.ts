import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A GERACAO DO PLANO DE CARREIRA DEIXA DE APARECER COM CUSTO ZERO?
 *
 * O achado (relatorio do lote 3b, secao 6): `server/routes/careerPlan.ts` tinha
 * um QUINTO call site de `logAiUsage`, o da geracao do plano, e ele nao passava
 * `custo` nenhum. Ausencia vale `sem_estimativa` no escritor, entao a chamada
 * MAIS CARA da rota era gravada com `cost_estimate` zero.
 *
 * Nao havia um zero escrito em lugar nenhum, e e por isso que ninguem via: o
 * campo simplesmente nao estava la, e nao estar la e legitimo para as dezenas de
 * call sites que nunca tiveram custo. E a mesma familia do custo que sumia do
 * painel no analisador de LinkedIn.
 *
 * O que este arquivo prova:
 *
 *   1. com `usage` na resposta, o helper devolve `uso` e o custo que a coluna
 *      recebe e a formula DESSES tokens, com numero literal no assert;
 *   2. sem `usage`, `uso` fica AUSENTE e o call site cai no fallback declarado
 *      por caracteres. Nenhum colapso de ausencia em zero;
 *   3. a soma por request inclui a tentativa que a OpenAI RESPONDEU e nos
 *      reprovamos. Aqui isso pesa mais que nos outros helpers: sao quatro portas
 *      de reprova depois da resposta e o teto e de TRES tentativas.
 *
 * Nada de rede: `fetchWithTimeout` esta dublado e o pool de contexto tambem.
 */

vi.mock("../env", async (importActual) => {
  const real = await importActual<typeof import("../env")>();
  return { ...real, env: { ...real.env, openaiApiKey: "sk-de-teste" } };
});

vi.mock("../userContext/pool", () => ({
  fetchUserContextPool: async () =>
    new Proxy(
      {},
      { get: () => ({ ok: false, data: null }) },
    ) as unknown as Record<string, { ok: false; data: null }>,
}));

import { custoDaLinha } from "../aiTools";
import * as http from "../http";
import { DEFAULT_MODEL } from "../openai";
import {
  generateCareerPlan,
  type CareerPlanAiIo,
  type CareerPlanIntake,
  type CareerPlanResult,
} from "./generate";

const INTAKE: CareerPlanIntake = {
  goal: "primeira vaga em dados",
  area: "dados",
  level: "iniciante",
  hoursPerWeek: 10,
  horizonMonths: 6,
  budget: "zero",
};

/** Texto de N caracteres, para os minimos que o schema real exige. */
function texto(n: number): string {
  return "a".repeat(n);
}

/**
 * Plano VALIDO pelo schema real, nao pela fixture do teste vizinho.
 *
 * `generate.test.ts` tem um `baseResult()` que serve para `findInvalidStepRefs`
 * e avisa no comentario que NAO reaplica os minimos do Zod. Aqui o caminho
 * exercitado e o parse de verdade, entao os minimos valem: `objectiveLogic` de
 * 300, tres degraus, dois blocos de cronograma e as razoes com 100, 80 e 60
 * caracteres. `certifications` fica vazia de proposito, para o teste nao depender
 * de nenhum id do catalogo continuar existindo.
 */
function planoValido(): CareerPlanResult {
  const degrau = (id: string) => ({
    id,
    title: `Degrau ${id}`,
    rationale: texto(120),
    items: [{ label: "estudar logica", catalogId: null }],
    estimatedWeeks: 4,
  });
  return {
    objectiveLogic: texto(320),
    steps: [degrau("fundamentos"), degrau("pratica"), degrau("portfolio")],
    certifications: [],
    schedule: [
      {
        monthsLabel: "Meses 1 a 3",
        focus: texto(100),
        stepIds: ["fundamentos", "pratica"],
      },
      {
        monthsLabel: "Meses 4 a 6",
        focus: texto(100),
        stepIds: ["portfolio"],
      },
    ],
    outOfScope: [{ label: "kubernetes", reason: texto(80) }],
  };
}

/** Resposta 200 da OpenAI, com ou sem o objeto `usage`. */
function resposta(
  content: unknown,
  usage?: { prompt_tokens: number; completion_tokens: number },
): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
      ...(usage ? { usage } : {}),
    }),
    text: async () => "",
    headers: new Headers(),
  } as unknown as Response;
}

/**
 * O custo que a coluna recebe, pelo MESMO mapeamento do call site e pela MESMA
 * funcao que o escritor usa.
 */
function custoGravado(io: CareerPlanAiIo): number {
  return custoDaLinha(
    io.uso
      ? {
          tipo: "tokens",
          inputTokens: io.uso.inputTokens,
          outputTokens: io.uso.outputTokens,
        }
      : { tipo: "chars" },
    io.inputChars,
    io.outputChars,
    DEFAULT_MODEL,
  );
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("geracao do plano de carreira: o custo para de ser zero", () => {
  it("com `usage`, o custo gravado sai dos tokens medidos", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta(planoValido(), {
        prompt_tokens: 10_000,
        completion_tokens: 1_000,
      }),
    );

    let io: CareerPlanAiIo = { inputChars: 0, outputChars: 0 };
    await generateCareerPlan("u1", INTAKE, (v) => {
      io = v;
    });

    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    // gpt-4o-mini: 10000/1e6 * 0,15 = 0,0015; 1000/1e6 * 0,60 = 0,0006
    //                                                total    = 0,0021
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
    // E o numero que MORREU: antes deste lote a linha ia com zero.
    expect(custoGravado(io)).not.toBe(0);
  });

  it("SEM `usage`, cai no fallback declarado por caracteres", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta(planoValido()),
    );

    let io: CareerPlanAiIo = { inputChars: 0, outputChars: 0 };
    await generateCareerPlan("u1", INTAKE, (v) => {
      io = v;
    });

    // AUSENCIA E AUSENCIA: nem `uso` com zeros, nem custo zero.
    expect(io.uso).toBeUndefined();
    expect(io.inputChars).toBeGreaterThan(0);
    expect(custoGravado(io)).toBeGreaterThan(0);
  });

  it("a tentativa REPROVADA por nos tambem entra na soma, porque foi cobrada", async () => {
    // Primeira resposta: a OpenAI respondeu (e cobrou 4.000 tokens), mas o plano
    // nao bate com o schema e nos reprovamos. Segunda: valida.
    let n = 0;
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { objectiveLogic: "curto demais" },
            { prompt_tokens: 4_000, completion_tokens: 100 },
          )
        : resposta(planoValido(), {
            prompt_tokens: 6_000,
            completion_tokens: 900,
          });
    });

    let io: CareerPlanAiIo = { inputChars: 0, outputChars: 0 };
    await generateCareerPlan("u1", INTAKE, (v) => {
      io = v;
    });

    expect(n).toBe(2);
    // Com o teto de TRES tentativas e quatro portas de reprova depois da
    // resposta, um plano podia custar tres chamadas e reportar uma.
    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });
});
