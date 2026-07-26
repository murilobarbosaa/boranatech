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
