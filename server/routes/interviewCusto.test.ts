import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A ENTREVISTA DEIXA DE APARECER COM CUSTO ZERO NO PAINEL?
 *
 * O guard do lote 3c mediu SETE blocos de `logAiUsage` com a forma do defeito
 * (`status: "success"` mais `inputChars` e SEM `custo`), todos nesta rota. Seis
 * eram chamadas de TEXTO da OpenAI cujo `usage` era descartado no cast do corpo,
 * exatamente como nos lotes 3b e 3c. O setimo e o TTS da ElevenLabs, que fica.
 *
 * Os seis passam por TRES funcoes so, e sao elas que este arquivo exercita:
 *
 *   callInterviewModel      sessao, turno avaliado, turno de fechamento
 *   callHintModel           dica
 *   translateQuestionToPt   traducao antes do audio
 *
 * O que se prova, com numero literal:
 *
 *   1. com `usage`, o `uso` volta preenchido e o custo que a coluna recebe e a
 *      formula DESSES tokens;
 *   2. o retry SOMA, incluindo a tentativa que a OpenAI respondeu e nos
 *      reprovamos. Aqui sao quatro portas de reprova e teto de tres tentativas;
 *   3. sem `usage`, o `uso` fica AUSENTE e o custo cai no fallback declarado por
 *      caracteres. Nenhum colapso de ausencia em zero;
 *   4. o turno de fechamento, que cobra UMA unidade por DUAS chamadas, soma as
 *      duas e preserva a ausencia.
 *
 * Nada de rede: `fetchWithTimeout` esta dublado.
 */

vi.mock("../lib/env", async (importActual) => {
  const real = await importActual<typeof import("../lib/env")>();
  return { ...real, env: { ...real.env, openaiApiKey: "sk-de-teste" } };
});

// O modulo da rota importa o middleware de auth, que monta a URL do JWKS no
// carregamento. Sem `.env` (a condicao do CI) a URL e invalida e o import
// explode antes de qualquer teste rodar. Dublar o middleware evita isso, e nada
// aqui exercita autenticacao: o que se mede sao as tres funcoes de chamada.
vi.mock("../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { custoDaLinha } from "../lib/aiTools";
import * as http from "../lib/http";
import { DEFAULT_MODEL } from "../lib/openai";
import {
  callHintModel,
  callInterviewModel,
  translateQuestionToPt,
  type AiIo,
} from "./interview";
// `somarUsoDeChamadas` saiu de `interview.ts` para o modulo neutro no lote 5.
// O teste continua afirmando a MESMA funcao, e nao uma copia dela.
import { somarUsoDeChamadas } from "../lib/aiUsoMedido";

const MENSAGENS = [
  { role: "system" as const, content: "voce e um entrevistador" },
  { role: "user" as const, content: "comece a entrevista" },
];

/** Turno coerente com o modo `first`: sem avaliacao, com pergunta, sem closing. */
const TURNO_FIRST = {
  evaluation: null,
  nextQuestion: "Fale sobre um projeto que voce entregou.",
  closing: null,
};

/** Resposta 200 da OpenAI, com ou sem o objeto `usage`. */
function resposta(
  content: unknown,
  usage?: { prompt_tokens: number; completion_tokens: number },
): Response {
  const texto = typeof content === "string" ? content : JSON.stringify(content);
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: texto } }],
      ...(usage ? { usage } : {}),
    }),
    text: async () => "",
    headers: new Headers(),
  } as unknown as Response;
}

/**
 * O custo que a coluna recebe, pelo MESMO mapeamento dos call sites e pela MESMA
 * funcao que o escritor usa.
 */
function custoGravado(io: AiIo): number {
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

describe("callInterviewModel: sessao, turno e fechamento", () => {
  it("com `usage`, o custo gravado sai dos tokens medidos", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta(TURNO_FIRST, {
        prompt_tokens: 10_000,
        completion_tokens: 1_000,
      }),
    );

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callInterviewModel(MENSAGENS, "first", (v) => {
      io = v;
    });

    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    // gpt-4o-mini: 10000/1e6 * 0,15 = 0,0015; 1000/1e6 * 0,60 = 0,0006
    //                                                total    = 0,0021
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
    // E o numero que MORREU: antes deste lote a linha ia com zero por omissao.
    expect(custoGravado(io)).not.toBe(0);
  });

  it("SEM `usage`, cai no fallback declarado por caracteres", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(resposta(TURNO_FIRST));

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callInterviewModel(MENSAGENS, "first", (v) => {
      io = v;
    });

    // AUSENCIA E AUSENCIA: nem `uso` com zeros, nem custo zero.
    expect(io.uso).toBeUndefined();
    expect(io.inputChars).toBeGreaterThan(0);
    expect(custoGravado(io)).toBeGreaterThan(0);
  });

  it("a tentativa REPROVADA por nos tambem entra na soma, porque foi cobrada", async () => {
    // A primeira resposta e coerente com o schema mas INCOERENTE com o modo
    // `first` (traz closing), que e uma das quatro portas de reprova deste
    // caminho. A OpenAI cobrou os 4.000 tokens do mesmo jeito.
    let n = 0;
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { evaluation: null, nextQuestion: null, closing: "ate mais" },
            { prompt_tokens: 4_000, completion_tokens: 100 },
          )
        : resposta(TURNO_FIRST, {
            prompt_tokens: 6_000,
            completion_tokens: 900,
          });
    });

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callInterviewModel(MENSAGENS, "first", (v) => {
      io = v;
    });

    expect(n).toBe(2);
    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });
});

describe("callHintModel: a dica", () => {
  it("com `usage`, o custo gravado sai dos tokens medidos", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta(
        { hint: "pense no impacto que a entrega teve" },
        { prompt_tokens: 10_000, completion_tokens: 1_000 },
      ),
    );

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callHintModel(MENSAGENS, (v) => {
      io = v;
    });

    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });

  it("SEM `usage`, cai no fallback declarado por caracteres", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta({ hint: "pense no impacto que a entrega teve" }),
    );

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callHintModel(MENSAGENS, (v) => {
      io = v;
    });

    expect(io.uso).toBeUndefined();
    expect(custoGravado(io)).toBeGreaterThan(0);
  });

  it("dica vazia reprova a tentativa, e o token dela entra na conta", async () => {
    let n = 0;
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { hint: "   " },
            { prompt_tokens: 4_000, completion_tokens: 100 },
          )
        : resposta(
            { hint: "pense no impacto" },
            { prompt_tokens: 6_000, completion_tokens: 900 },
          );
    });

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await callHintModel(MENSAGENS, (v) => {
      io = v;
    });

    expect(n).toBe(2);
    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });
});

describe("translateQuestionToPt: a traducao antes do audio", () => {
  it("com `usage`, o custo gravado sai dos tokens medidos", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta("Fale sobre um projeto que voce entregou.", {
        prompt_tokens: 10_000,
        completion_tokens: 1_000,
      }),
    );

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await translateQuestionToPt("Tell me about a project", (v) => {
      io = v;
    });

    expect(io.uso).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
    expect(custoGravado(io)).toBeCloseTo(0.0021, 10);
  });

  it("SEM `usage`, cai no fallback declarado por caracteres", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta("Fale sobre um projeto que voce entregou."),
    );

    let io: AiIo = { inputChars: 0, outputChars: 0 };
    await translateQuestionToPt("Tell me about a project", (v) => {
      io = v;
    });

    expect(io.uso).toBeUndefined();
    expect(custoGravado(io)).toBeGreaterThan(0);
  });
});

describe("turno de fechamento: uma cobranca, DUAS chamadas", () => {
  it("soma as duas quando as duas mediram", () => {
    expect(
      somarUsoDeChamadas(
        { inputTokens: 7_000, outputTokens: 700 },
        { inputTokens: 3_000, outputTokens: 300 },
      ),
    ).toEqual({ inputTokens: 10_000, outputTokens: 1_000 });
  });

  it("preserva a AUSENCIA em vez de somar com zero fingido", () => {
    expect(
      somarUsoDeChamadas(undefined, { inputTokens: 5, outputTokens: 1 }),
    ).toEqual({ inputTokens: 5, outputTokens: 1 });
    expect(
      somarUsoDeChamadas({ inputTokens: 5, outputTokens: 1 }, undefined),
    ).toEqual({ inputTokens: 5, outputTokens: 1 });
    expect(somarUsoDeChamadas(undefined, undefined)).toBeUndefined();
  });
});
