import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O `usage` DA OPENAI CHEGA ATE A LINHA DE USO, ou continua sendo descartado?
 *
 * O buraco (fronteira registrada no relatorio do lote 3): as respostas destas
 * rotas SEMPRE trazem `usage`, porque a OpenAI o devolve em toda chat completion
 * nao-streaming. Os helpers tipavam o corpo sem ele e o jogavam fora, entao os
 * call sites caiam no fallback por caracteres. Custo estimado onde havia medicao
 * disponivel de graca.
 *
 * O que este arquivo prova:
 *
 *   1. com `usage` na resposta, o helper devolve `uso` e o custo que a coluna
 *      recebe e a formula DESSES tokens, com numero literal no assert;
 *   2. sem `usage` (caso raro real), `uso` fica AUSENTE e o call site cai no
 *      fallback declarado por caracteres. Nenhum colapso de ausencia em zero;
 *   3. a soma por request inclui a tentativa que a OpenAI RESPONDEU e nos
 *      reprovamos. Ela foi cobrada igual, e ate aqui sumia da conta.
 *
 * Nada de rede: `fetchWithTimeout` esta dublado e o pool de contexto tambem.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return { ...real, env: { ...real.env, openaiApiKey: "sk-de-teste" } };
});

/**
 * Pool de contexto VAZIO, por Proxy e nao por objeto literal.
 *
 * O literal exigia listar as chaves do pool, e listar chave a mao e a receita
 * conhecida para o duble ficar para tras da fonte: uma chave nova quebra o teste
 * por `undefined.ok`, num arquivo que nao tem nada a ver com o pool. O Proxy
 * responde "nao tenho este dado" para qualquer chave, hoje e depois.
 *
 * O contexto em si e irrelevante aqui: o que se mede e o `usage` da resposta.
 */
vi.mock("./userContext/pool", () => ({
  fetchUserContextPool: async () =>
    new Proxy(
      {},
      { get: () => ({ ok: false, data: null }) },
    ) as unknown as Record<string, { ok: false; data: null }>,
}));

import { custoDaLinha } from "./aiTools";
import * as http from "./http";
import { DEFAULT_MODEL } from "./openai";
import { runIntakeChatTurn as roadmapTurn } from "./aiRoadmap/intakeChat";
import { runIntakeChatTurn as careerTurn } from "./careerPlan/intakeChat";
import { somarUsoDeChamadas } from "./aiRoadmap/generate";

/**
 * Turno valido de cada chat de intake. Os DOIS schemas sao parecidos e
 * diferentes: o do roadmap tem `deadline`, `stackFocus`, `startingPoint`,
 * `motivation` e `constraints`; o do plano de carreira tem `area`, `level`,
 * `horizonMonths` e `budget`. Um fixture so reprovaria num dos dois, que foi
 * exatamente o que aconteceu na primeira versao deste arquivo.
 */
const TURNO_VALIDO = {
  roadmap: {
    reply: "Vi que voce vem de backend, o alvo ainda e IA?",
    intake: {
      goal: null,
      hoursPerWeek: null,
      deadline: null,
      stackFocus: null,
      startingPoint: null,
      motivation: null,
      constraints: null,
    },
    missing: ["goal", "hoursPerWeek", "deadline"],
    ready: false,
  },
  carreira: {
    reply: "Vi que voce vem de backend, o alvo ainda e IA?",
    intake: {
      goal: null,
      area: "ia",
      level: null,
      hoursPerWeek: null,
      horizonMonths: null,
      budget: null,
    },
    missing: ["goal", "level", "hoursPerWeek", "horizonMonths", "budget"],
    ready: false,
  },
} as const;

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

interface IoObservado {
  inputChars: number;
  outputChars: number;
  uso?: { inputTokens: number; outputTokens: number };
}

/**
 * O custo que a coluna recebe, pela MESMA funcao que o escritor usa.
 *
 * E o mesmo mapeamento que os quatro call sites fazem: `uso` presente vai para o
 * ramo de tokens, ausente cai no de caracteres.
 */
function custoGravado(io: IoObservado): number {
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

const CHATS = [
  {
    nome: "roadmap intake chat",
    rodar: roadmapTurn,
    turno: TURNO_VALIDO.roadmap,
  },
  {
    nome: "career plan intake chat",
    rodar: careerTurn,
    turno: TURNO_VALIDO.carreira,
  },
] as const;

describe.each(CHATS)("$nome", ({ rodar, turno }) => {
  it("com `usage`, devolve o uso medido e o custo sai DELE", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta(turno, {
        prompt_tokens: 10_000,
        completion_tokens: 1_000,
      }),
    );

    let io: IoObservado = { inputChars: 0, outputChars: 0 };
    await rodar(
      "u1",
      [{ role: "user", content: "quero migrar para IA" }],
      (v) => {
        io = v;
      },
    );

    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    // gpt-4o-mini: 10000/1e6 * 0,15 = 0,0015; 1000/1e6 * 0,60 = 0,0006
    //                                                total    = 0,0021
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });

  it("SEM `usage`, o uso fica ausente e o custo cai no fallback por caracteres", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(resposta(turno));

    let io: IoObservado = { inputChars: 0, outputChars: 0 };
    await rodar(
      "u1",
      [{ role: "user", content: "quero migrar para IA" }],
      (v) => {
        io = v;
      },
    );

    // AUSENCIA E AUSENCIA: nem `uso` com zeros, nem custo zero.
    expect(io.uso).toBeUndefined();
    expect(io.inputChars).toBeGreaterThan(0);
    expect(custoGravado(io)).toBeGreaterThan(0);
  });

  it("a tentativa REPROVADA por nos tambem entra na soma, porque foi cobrada", async () => {
    // Primeira resposta: a OpenAI respondeu (e cobrou 4.000 tokens), mas o
    // conteudo nao bate com o schema e nos reprovamos. Segunda: valida.
    let n = 0;
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { reply: "faltando campos" },
            { prompt_tokens: 4_000, completion_tokens: 100 },
          )
        : resposta(turno, {
            prompt_tokens: 6_000,
            completion_tokens: 900,
          });
    });

    let io: IoObservado = { inputChars: 0, outputChars: 0 };
    await rodar(
      "u1",
      [{ role: "user", content: "quero migrar para IA" }],
      (v) => {
        io = v;
      },
    );

    expect(n).toBe(2);
    // ESTE E O NUMERO QUE SUMIA. Ate a Fase 4 o callback so disparava no
    // sucesso, entao os 4.000 tokens da primeira tentativa nao apareciam em
    // lugar nenhum: pagos e invisiveis.
    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });
});

describe("soma entre CHAMADAS do mesmo request (roadmap generate)", () => {
  it("soma as duas quando as duas mediram", () => {
    expect(
      somarUsoDeChamadas(
        { inputTokens: 7_000, outputTokens: 700 },
        { inputTokens: 3_000, outputTokens: 300 },
      ),
    ).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
  });

  it("preserva a AUSENCIA em vez de somar com zero fingido", () => {
    // Se uma chamada nao mediu, o total nao pode fingir que ela custou zero: o
    // que se sabe e o que a outra mediu, e e so isso que vai.
    expect(
      somarUsoDeChamadas(undefined, { inputTokens: 5, outputTokens: 1 }),
    ).toEqual({ inputTokens: 5, outputTokens: 1 });
    expect(
      somarUsoDeChamadas({ inputTokens: 5, outputTokens: 1 }, undefined),
    ).toEqual({ inputTokens: 5, outputTokens: 1 });
    expect(somarUsoDeChamadas(undefined, undefined)).toBeUndefined();
  });

  it("nenhuma medicao em nenhuma chamada mantem o fallback por caracteres", () => {
    const io: IoObservado = {
      inputChars: 8_000,
      outputChars: 400,
      uso: somarUsoDeChamadas(undefined, undefined),
    };
    expect(io.uso).toBeUndefined();
    expect(custoGravado(io)).toBeGreaterThan(0);
  });
});
