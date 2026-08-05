import { describe, expect, it } from "vitest";

import {
  classificarFalhaOpenAi,
  erroDaRespostaOpenAi,
  falhaOpenAiNaCadeia,
  isFalhaPermanente,
  OpenAiFalhaError,
} from "./openaiFailure";

// Corpo REAL do incidente de 2026-08-05, copiado de
// ai_usage_logs.error_message (linha das 03:01:44Z, tool linkedin-analyzer).
// Fica literal de proposito: o valor do teste esta em ser a resposta que a
// OpenAI de fato mandou, nao uma que eu imaginei que ela mandaria.
const CORPO_SALDO_ZERADO = JSON.stringify({
  error: {
    message:
      "You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.",
    type: "insufficient_quota",
    param: null,
    code: "credit_balance_exhausted",
  },
});

const CORPO_RATE_LIMIT = JSON.stringify({
  error: {
    message:
      "Rate limit reached for gpt-4o-mini in organization org-x on requests per min (RPM): Limit 500, Used 500, Requested 1.",
    type: "requests",
    param: null,
    code: "rate_limit_exceeded",
  },
});

describe("classificarFalhaOpenAi", () => {
  it("classifica saldo esgotado como cota e permanente", () => {
    const falha = classificarFalhaOpenAi(429, CORPO_SALDO_ZERADO);
    expect(falha.classificacao).toBe("cota");
    expect(falha.permanente).toBe(true);
    expect(falha.code).toBe("credit_balance_exhausted");
    expect(falha.type).toBe("insufficient_quota");
    expect(falha.rotulo).toBe("cota:credit_balance_exhausted");
  });

  it("classifica rate limit como transitorio", () => {
    const falha = classificarFalhaOpenAi(429, CORPO_RATE_LIMIT);
    expect(falha.classificacao).toBe("transitorio");
    expect(falha.permanente).toBe(false);
    expect(falha.rotulo).toBe("transitorio:rate_limit_exceeded");
  });

  it("aceita insufficient_quota vindo so no code", () => {
    const falha = classificarFalhaOpenAi(
      429,
      JSON.stringify({ error: { code: "insufficient_quota" } }),
    );
    expect(falha.classificacao).toBe("cota");
    expect(falha.permanente).toBe(true);
  });

  // As quatro formas de "nao deu para classificar". Todas precisam cair no
  // ramo TRANSITORIO: o ramo permanente e o unico que interrompe o retry, e
  // alcanca-lo por omissao seria transformar falha de leitura em veredito.
  it.each([
    ["corpo vazio", ""],
    ["corpo nao-JSON", "<html>502 Bad Gateway</html>"],
    ["JSON sem error", JSON.stringify({ ok: false })],
    ["error sem type nem code", JSON.stringify({ error: { message: "x" } })],
  ])("nao classifica e nao marca permanente: %s", (_nome, corpo) => {
    const falha = classificarFalhaOpenAi(429, corpo);
    expect(falha.classificacao).toBe("nao_classificado");
    expect(falha.permanente).toBe(false);
    expect(falha.rotulo).toBe("nao_classificado");
  });

  it("codigo desconhecido fica nao classificado, mas nomeado no rotulo", () => {
    const falha = classificarFalhaOpenAi(
      429,
      JSON.stringify({ error: { code: "codigo_que_ainda_nao_existe" } }),
    );
    expect(falha.classificacao).toBe("nao_classificado");
    expect(falha.permanente).toBe(false);
    expect(falha.rotulo).toBe("nao_classificado:codigo_que_ainda_nao_existe");
  });

  // Guarda contra a regressao mais provavel desta funcao: alguem "melhorar" o
  // casamento passando a olhar a mensagem. O texto abaixo fala de credito e
  // cota em ingles e portugues, e mesmo assim NAO pode virar cota, porque
  // nenhum campo estruturado afirma isso.
  it("nao classifica por texto da mensagem", () => {
    const falha = classificarFalhaOpenAi(
      429,
      JSON.stringify({
        error: {
          message:
            "You have no credits remaining, insufficient_quota, saldo e cota esgotados",
        },
      }),
    );
    expect(falha.classificacao).toBe("nao_classificado");
    expect(falha.permanente).toBe(false);
  });
});

describe("erroDaRespostaOpenAi", () => {
  it("monta a mensagem com status, rotulo e corpo", async () => {
    const err = await erroDaRespostaOpenAi({
      status: 429,
      text: async () => CORPO_SALDO_ZERADO,
    });
    expect(err).toBeInstanceOf(OpenAiFalhaError);
    expect(err.httpStatus).toBe(429);
    expect(err.message).toContain("OpenAI respondeu 429");
    expect(err.message).toContain("[cota:credit_balance_exhausted]");
    expect(isFalhaPermanente(err)).toBe(true);
  });

  it("corpo ilegivel nao vira cota", async () => {
    const err = await erroDaRespostaOpenAi({
      status: 429,
      text: async () => {
        throw new Error("socket fechou no meio da leitura");
      },
    });
    expect(err.classificacao).toBe("nao_classificado");
    expect(isFalhaPermanente(err)).toBe(false);
  });
});

describe("isFalhaPermanente", () => {
  it("enxerga o erro embrulhado via cause", async () => {
    const original = await erroDaRespostaOpenAi({
      status: 429,
      text: async () => CORPO_SALDO_ZERADO,
    });
    const embrulhado = new Error("Falha ao gerar a analise.", {
      cause: original,
    });
    expect(falhaOpenAiNaCadeia(embrulhado)).toBe(original);
    expect(isFalhaPermanente(embrulhado)).toBe(true);
  });

  it("e falso para rate limit, timeout e erro qualquer", async () => {
    const rate = await erroDaRespostaOpenAi({
      status: 429,
      text: async () => CORPO_RATE_LIMIT,
    });
    expect(isFalhaPermanente(rate)).toBe(false);
    expect(isFalhaPermanente(new Error("upstream_timeout"))).toBe(false);
    expect(isFalhaPermanente(null)).toBe(false);
    expect(isFalhaPermanente("erro em string")).toBe(false);
  });

  it("nao entra em loop com cause circular", () => {
    const a = new Error("a");
    const b = new Error("b", { cause: a });
    (a as Error & { cause?: unknown }).cause = b;
    expect(isFalhaPermanente(b)).toBe(false);
  });
});

// CREDENCIAL. Os dois casos que o canario existe para pegar e que, ate aqui,
// eram indistinguiveis de "codigo novo da OpenAI": chave revogada e conta sem
// permissao. Os corpos abaixo sao reais, medidos em 2026-08-05 batendo nos
// endpoints de billing da OpenAI com a chave do projeto.
describe("classificarFalhaOpenAi: credencial", () => {
  const CORPO_403_ESCOPO = JSON.stringify({
    error:
      "You have insufficient permissions for this operation. Missing scopes: api.usage.read.",
  });

  const CORPO_401_CHAVE = JSON.stringify({
    error: {
      message: "Incorrect API key provided: sk-xxx.",
      type: "invalid_request_error",
      param: null,
      code: "invalid_api_key",
    },
  });

  it("401 com code de chave invalida vira credencial permanente", () => {
    const falha = classificarFalhaOpenAi(401, CORPO_401_CHAVE);
    expect(falha.classificacao).toBe("credencial");
    expect(falha.permanente).toBe(true);
    expect(falha.rotulo).toBe("credencial:invalid_api_key");
  });

  // O 403 real da OpenAI traz `error` como STRING, nao como objeto: nao ha
  // `code` nenhum para ler. E exatamente por isso que este ramo decide pelo
  // status, e nao pelo corpo.
  it("403 sem code utilizavel ainda vira credencial", () => {
    const falha = classificarFalhaOpenAi(403, CORPO_403_ESCOPO);
    expect(falha.classificacao).toBe("credencial");
    expect(falha.permanente).toBe(true);
    expect(falha.rotulo).toBe("credencial");
  });

  it("401 sem corpo nenhum ainda vira credencial", () => {
    const falha = classificarFalhaOpenAi(401, "");
    expect(falha.classificacao).toBe("credencial");
    expect(falha.permanente).toBe(true);
  });

  // ADVERSARIAL, pedido explicitamente: um 401 que fala de cota nao pode virar
  // cota, nem pelo texto livre (que nunca lemos) nem pelo `code`. A acao certa
  // continua sendo olhar a credencial: sem chave valida, saldo nao resolve.
  it("401 com corpo mencionando cota NAO vira cota", () => {
    const porTexto = classificarFalhaOpenAi(
      401,
      JSON.stringify({
        error: {
          message:
            "You have no credits remaining, insufficient_quota, saldo esgotado",
        },
      }),
    );
    expect(porTexto.classificacao).toBe("credencial");

    const porCode = classificarFalhaOpenAi(
      401,
      JSON.stringify({
        error: { type: "insufficient_quota", code: "credit_balance_exhausted" },
      }),
    );
    expect(porCode.classificacao).toBe("credencial");
    expect(porCode.classificacao).not.toBe("cota");
  });

  // A confirmacao que o `nao_classificado` nao afrouxou: tirar 401/403 dele
  // nao mexeu em NENHUM outro status. Tudo que nao e afirmado segue retentando.
  it.each([[400], [404], [408], [429], [500], [502], [503]])(
    "status %i com corpo opaco continua nao classificado e retentando",
    (status) => {
      const falha = classificarFalhaOpenAi(status, "<html>erro</html>");
      expect(falha.classificacao).toBe("nao_classificado");
      expect(falha.permanente).toBe(false);
    },
  );

  it("500 com code desconhecido continua nao classificado", () => {
    const falha = classificarFalhaOpenAi(
      500,
      JSON.stringify({ error: { code: "engine_overloaded_novo" } }),
    );
    expect(falha.classificacao).toBe("nao_classificado");
    expect(falha.permanente).toBe(false);
    expect(falha.rotulo).toBe("nao_classificado:engine_overloaded_novo");
  });

  it("rate limit segue transitorio: credencial nao capturou o 429", () => {
    expect(classificarFalhaOpenAi(429, CORPO_RATE_LIMIT).permanente).toBe(
      false,
    );
  });
});
