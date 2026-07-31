import { describe, expect, it } from "vitest";
import {
  IntakeChatApiError,
  parseIntakeChatResponse,
} from "./aiRoadmapService";

/**
 * CENARIO 4 do smoke test, na forma permanente: o CONTRATO da resposta do turno
 * atravessando a janela de deploy, nos dois sentidos.
 *
 * Vercel e Railway sobem separados e a Vercel costuma terminar primeiro, entao
 * existe uma janela de 1 a 3 minutos em que este bundle fala com o backend
 * ANTERIOR. E um rollback do servidor reabre essa janela por tempo
 * indeterminado, com o bundle novo ja em cache nos navegadores.
 *
 * Roda offline: sem rede, sem OpenAI, sem escrita.
 */

// Resposta do backend de PRODUCAO (47e6a32 / bd4b91d): exatamente 4 campos.
const RESPOSTA_BACKEND_ANTIGO = {
  reply: "E qual e o seu objetivo principal?",
  intake: {
    goal: null,
    hoursPerWeek: "5-10",
    deadline: null,
    stackFocus: null,
    startingPoint: null,
    motivation: null,
    constraints: null,
  },
  missing: ["goal", "deadline"],
  ready: false,
};

// Resposta do backend NOVO: os 4 acima mais os 4 da fase 2.
const RESPOSTA_BACKEND_NOVO = {
  ...RESPOSTA_BACKEND_ANTIGO,
  canGenerate: false,
  missingToGenerate: ["goal", "deadline"],
  restantes: 17,
  maxMensagens: 20,
};

describe("contrato: bundle NOVO contra backend ANTIGO", () => {
  it("aceita a resposta de 4 campos sem quebrar", () => {
    const r = parseIntakeChatResponse(RESPOSTA_BACKEND_ANTIGO);
    expect(r.reply).toBe(RESPOSTA_BACKEND_ANTIGO.reply);
    expect(r.ready).toBe(false);
    expect(r.missing).toEqual(["goal", "deadline"]);
  });

  it("os quatro campos da fase 2 degradam para NULL, nunca undefined", () => {
    const r = parseIntakeChatResponse(RESPOSTA_BACKEND_ANTIGO);
    // null e o sinal de "backend antigo"; a pagina recalcula canGenerate
    // localmente com a funcao compartilhada e so mostra o aviso de orcamento
    // quando o numero existe. undefined passaria despercebido num `if`.
    expect(r.canGenerate).toBeNull();
    expect(r.missingToGenerate).toBeNull();
    expect(r.restantes).toBeNull();
    expect(r.maxMensagens).toBeNull();
  });
});

describe("contrato: `ready` continua OBRIGATORIO", () => {
  it("resposta completa do backend novo passa", () => {
    const r = parseIntakeChatResponse(RESPOSTA_BACKEND_NOVO);
    expect(r.ready).toBe(false);
    expect(r.canGenerate).toBe(false);
    expect(r.restantes).toBe(17);
    expect(r.maxMensagens).toBe(20);
  });

  it("resposta SEM `ready` e rejeitada", () => {
    // Trava a decisao: `ready` nao pode sair do contrato numa troca seca. O
    // bundle antigo em cache o usa para renderizar o botao, e a regra de
    // expand/contract do CLAUDE.md manda emitir os dois nomes antes de remover.
    const { ready: _, ...semReady } = RESPOSTA_BACKEND_NOVO;
    expect(() => parseIntakeChatResponse(semReady)).toThrow(IntakeChatApiError);
  });

  it("`ready` com tipo errado tambem e rejeitado", () => {
    expect(() =>
      parseIntakeChatResponse({ ...RESPOSTA_BACKEND_NOVO, ready: "sim" }),
    ).toThrow(IntakeChatApiError);
  });

  for (const campo of ["reply", "intake", "missing"] as const) {
    it(`resposta sem \`${campo}\` e rejeitada`, () => {
      const copia: Record<string, unknown> = { ...RESPOSTA_BACKEND_NOVO };
      delete copia[campo];
      expect(() => parseIntakeChatResponse(copia)).toThrow(IntakeChatApiError);
    });
  }
});

describe("contrato: entradas degeneradas nao explodem", () => {
  it("null, undefined e objeto vazio viram erro tipado, nao TypeError", () => {
    for (const entrada of [null, undefined, {}, "texto", 42]) {
      expect(() => parseIntakeChatResponse(entrada)).toThrow(
        IntakeChatApiError,
      );
    }
  });

  it("campo novo com tipo errado degrada para null em vez de derrubar", () => {
    const r = parseIntakeChatResponse({
      ...RESPOSTA_BACKEND_ANTIGO,
      canGenerate: "talvez",
      restantes: "muitas",
      missingToGenerate: "goal",
    });
    expect(r.canGenerate).toBeNull();
    expect(r.restantes).toBeNull();
    expect(r.missingToGenerate).toBeNull();
  });
});
