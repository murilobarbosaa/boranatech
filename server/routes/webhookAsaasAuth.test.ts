import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AUTENTICACAO E CONTRATO DE STATUS DO WEBHOOK DO ASAAS.
 *
 * O que estes casos travam nao e a comparacao de strings, e sim o CONTRATO DE
 * STATUS, porque ele foi desenhado contra um comportamento especifico da
 * plataforma: a fila do Asaas PAUSA a conta inteira depois de uma sequencia de
 * falhas. Entao "responder erro" nao e neutro aqui. Tipo desconhecido tem de
 * devolver 200, ou um evento que nem nos interessa derruba a entrega de todos os
 * outros.
 */

const estado = vi.hoisted(() => ({
  habilitado: true,
  token: "token-de-teste",
  /** O que processarEventoAsaas devolve, ou lanca. */
  resultado: { received: true } as unknown,
  erro: null as Error | null,
  /** Eventos que chegaram ao processamento. */
  processados: [] as unknown[],
}));

vi.mock("../lib/env", () => ({
  env: {
    get asaasEnabled() {
      return estado.habilitado;
    },
    get asaasWebhookToken() {
      return estado.token;
    },
  },
}));

vi.mock("../providers/asaas", () => ({
  processarEventoAsaas: async (evento: unknown) => {
    estado.processados.push(evento);
    if (estado.erro) throw estado.erro;
    return estado.resultado;
  },
}));

import { handleAsaasWebhook, tokenConfere } from "./webhooksAsaas";

function req(headers: Record<string, string | undefined>, body: unknown = {}) {
  return { headers, body } as unknown as Request;
}

function res() {
  const gravado: { status?: number; json?: unknown; ended?: boolean } = {};
  const objeto = {
    status(codigo: number) {
      gravado.status = codigo;
      return objeto;
    },
    json(carga: unknown) {
      gravado.json = carga;
      return objeto;
    },
    end() {
      gravado.ended = true;
      return objeto;
    },
  };
  return { objeto: objeto as unknown as Response, gravado };
}

const next = (() => {}) as unknown as NextFunction;

describe("tokenConfere", () => {
  it("token exato confere", () => {
    expect(tokenConfere("abc123", "abc123")).toBe(true);
  });

  it("token errado do MESMO tamanho nao confere", () => {
    expect(tokenConfere("abc124", "abc123")).toBe(false);
  });

  it("token mais CURTO nao confere e nao lanca", () => {
    // timingSafeEqual lanca com buffers de tamanhos diferentes, e o tamanho e o
    // que o atacante controla. A funcao normaliza antes de comparar.
    expect(() => tokenConfere("abc", "abc123")).not.toThrow();
    expect(tokenConfere("abc", "abc123")).toBe(false);
  });

  it("token mais LONGO nao confere e nao lanca", () => {
    expect(() => tokenConfere("abc123456", "abc123")).not.toThrow();
    expect(tokenConfere("abc123456", "abc123")).toBe(false);
  });

  it("prefixo correto do tamanho errado nao passa", () => {
    expect(tokenConfere("abc12", "abc123")).toBe(false);
  });

  it("esperado vazio nunca confere: configuracao ausente nao vira porta aberta", () => {
    expect(tokenConfere("", "")).toBe(false);
    expect(tokenConfere("qualquer", "")).toBe(false);
  });
});

describe("contrato de status da rota", () => {
  beforeEach(() => {
    estado.habilitado = true;
    estado.token = "token-de-teste";
    estado.resultado = { received: true };
    estado.erro = null;
    estado.processados = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("token AUSENTE: 401 sem corpo, e nada e processado", async () => {
    const r = res();
    await handleAsaasWebhook(req({}), r.objeto, next);

    expect(r.gravado.status).toBe(401);
    expect(r.gravado.ended).toBe(true);
    expect(r.gravado.json).toBeUndefined();
    expect(estado.processados).toEqual([]);
  });

  it("token ERRADO: 401 sem corpo, e nada e processado", async () => {
    const r = res();
    await handleAsaasWebhook(
      req({ "asaas-access-token": "token-errado" }),
      r.objeto,
      next,
    );

    expect(r.gravado.status).toBe(401);
    expect(estado.processados).toEqual([]);
  });

  it("Asaas DESLIGADO: 503 antes de olhar o token", async () => {
    estado.habilitado = false;
    const r = res();
    // Token correto de proposito: o 503 tem de vencer, porque sem configuracao
    // nao ha o que comparar e um 401 diria "credencial errada" sobre um
    // ambiente que simplesmente nao tem Asaas.
    await handleAsaasWebhook(
      req({ "asaas-access-token": "token-de-teste" }),
      r.objeto,
      next,
    );

    expect(r.gravado.status).toBe(503);
    expect(estado.processados).toEqual([]);
  });

  it("token CERTO: processa e devolve o resultado", async () => {
    estado.resultado = { received: true, activated: true };
    const r = res();
    await handleAsaasWebhook(
      req(
        { "asaas-access-token": "token-de-teste" },
        { event: "PAYMENT_RECEIVED" },
      ),
      r.objeto,
      next,
    );

    expect(estado.processados).toHaveLength(1);
    expect(r.gravado.json).toMatchObject({ received: true, activated: true });
    // Sem status explicito: o express responde 200.
    expect(r.gravado.status).toBeUndefined();
  });

  it("evento DESCONHECIDO devolve 200, nunca 4xx: 4xx pausaria a fila", async () => {
    estado.resultado = { received: true, unhandled: true };
    const r = res();
    await handleAsaasWebhook(
      req(
        { "asaas-access-token": "token-de-teste" },
        { event: "PAYMENT_AWAITING_RISK_ANALYSIS" },
      ),
      r.objeto,
      next,
    );

    expect(r.gravado.status).toBeUndefined();
    expect(r.gravado.json).toMatchObject({ unhandled: true });
  });

  it("falha de processamento vai para o next, virando 500 e reentrega", async () => {
    estado.erro = new Error("db fora do ar");
    const capturado: unknown[] = [];
    const r = res();

    await handleAsaasWebhook(
      req({ "asaas-access-token": "token-de-teste" }),
      r.objeto,
      ((err: unknown) => capturado.push(err)) as unknown as NextFunction,
    );

    expect(capturado).toHaveLength(1);
    expect(r.gravado.json).toBeUndefined();
  });
});
