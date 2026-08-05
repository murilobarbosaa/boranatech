import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// env.ts le process.env no import; a chave precisa existir ANTES de importar o
// modulo sob teste, senao runQualitative aborta com "IA nao configurada".
process.env.OPENAI_API_KEY ||= "sk-test-nao-usada-o-fetch-e-stub";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

let analyzeLinkedin: typeof import("./linkedinAnalyze").analyzeLinkedin;
let LinkedinTruncatedError: typeof import("./linkedinAnalyze").LinkedinTruncatedError;

beforeAll(async () => {
  const mod = await import("./linkedinAnalyze");
  analyzeLinkedin = mod.analyzeLinkedin;
  LinkedinTruncatedError = mod.LinkedinTruncatedError;
});

// Perfil com headline, Sobre e experiencia: evita o atalho de perfil quase
// vazio, que nao chama a IA.
const PROFILE_TEXT = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
${"Sou desenvolvedora front-end com experiencia em React, TypeScript e Node.js construindo interfaces. ".repeat(4)}
Experience
Empresa Teste
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React e APIs em Node.js. Implementei testes automatizados reduzindo bugs em 30%.`;

const REQUEST: LinkedinAnalyzeRequest = {
  profileText: PROFILE_TEXT,
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  skills: "React, TypeScript, JavaScript, HTML, CSS",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "100-500",
  atividade: "semanal",
};

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analyzeLinkedin: resposta cortada por max_tokens", () => {
  // Payload real capturado da OpenAI com max_tokens baixo: finish_reason
  // "length" e content com JSON incompleto. Antes desta checagem o erro virava
  // "Resposta da IA nao veio em JSON valido", que aponta para o parser em vez
  // do orcamento de saida.
  const TRUNCATED = {
    choices: [
      {
        finish_reason: "length",
        message: {
          content:
            '{"resumo":"Seu perfil esta bem estruturado e apresenta uma solida experiencia',
        },
      },
    ],
  };

  it("lanca LinkedinTruncatedError em vez de erro de JSON invalido", async () => {
    const fetchMock = vi.fn(async () => okResponse(TRUNCATED));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toBeInstanceOf(
      LinkedinTruncatedError,
    );
  });

  it("NAO gasta a segunda tentativa: truncamento e deterministico", async () => {
    const fetchMock = vi.fn(async () => okResponse(TRUNCATED));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toBeInstanceOf(
      LinkedinTruncatedError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("JSON malformado SEM finish_reason length segue retentando (2 tentativas)", async () => {
    const fetchMock = vi.fn(async () =>
      okResponse({
        choices: [{ finish_reason: "stop", message: { content: "{ nao e json" } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toThrow(
      /JSON válido/i,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// Prova de comportamento do retry diante do 429, que tem duas causas com o
// mesmo status. O que estes testes travam nao e a classificacao em si (isso e
// openaiFailure.test.ts), e sim a decisao de RETENTAR OU NAO no caminho real da
// analise, que e onde o custo aparece.
describe("analyzeLinkedin: 429 da OpenAI, cota versus rate limit", () => {
  function erroResponse(status: number, body: unknown) {
    return {
      ok: false,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  // Corpo REAL do incidente de 2026-08-05 (ai_usage_logs, 03:01:44Z).
  const SALDO_ZERADO = {
    error: {
      message:
        "You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.",
      type: "insufficient_quota",
      param: null,
      code: "credit_balance_exhausted",
    },
  };

  const RATE_LIMIT = {
    error: {
      message: "Rate limit reached for gpt-4o-mini in organization org-x.",
      type: "requests",
      param: null,
      code: "rate_limit_exceeded",
    },
  };

  it("saldo esgotado NAO gasta a segunda tentativa", async () => {
    const fetchMock = vi.fn(async () => erroResponse(429, SALDO_ZERADO));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toThrow(
      /\[cota:credit_balance_exhausted\]/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rate limit segue retentando (2 tentativas)", async () => {
    const fetchMock = vi.fn(async () => erroResponse(429, RATE_LIMIT));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toThrow(
      /\[transitorio:rate_limit_exceeded\]/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // Credencial revogada: permanente pelo mesmo motivo, e a prova de que o
  // estado novo chega ate o caminho real da analise, nao so ao classificador.
  it("401 de chave invalida NAO gasta a segunda tentativa", async () => {
    const fetchMock = vi.fn(async () =>
      erroResponse(401, {
        error: {
          message: "Incorrect API key provided: sk-xxx.",
          type: "invalid_request_error",
          code: "invalid_api_key",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toThrow(
      /\[credencial:invalid_api_key\]/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // O ramo que nao pode nascer por omissao: 429 sem corpo classificavel se
  // comporta como antes da mudanca, retentando.
  it("429 sem corpo classificavel segue retentando (2 tentativas)", async () => {
    const fetchMock = vi.fn(async () => erroResponse(429, { erro: "opaco" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeLinkedin(REQUEST)).rejects.toThrow(
      /\[nao_classificado\]/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
