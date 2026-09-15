import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppError } from "../middleware/error";

/**
 * POST /api/billing/cancel-pending: o cliente cancela a propria cobranca Pix.
 *
 * O que estes testes travam e a regra de dinheiro da rota: a linha local SO
 * fecha quando o Asaas confirmou a exclusao. `already_paid` e falha deixam a
 * linha intacta, porque fechar sobre uma cobranca viva criaria dinheiro pagavel
 * sem linha para ativar. O quinto desfecho (PAYMENT_DELETED posterior como
 * no-op) mora em server/providers/asaasPix.test.ts, junto do webhook real.
 */

const estado = vi.hoisted(() => ({
  pendente: null as Record<string, unknown> | null,
  erroDaLeitura: null as { message: string } | null,
  /** `eq` da consulta, na ordem. */
  filtros: [] as Array<[string, unknown]>,
  cancelamento: { resultado: "cancelada" } as Record<string, unknown>,
  chamadasCancel: [] as string[],
  fechamentos: [] as Array<Record<string, unknown>>,
  erroDoFechamento: null as Error | null,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    billingEnabled: true,
    asaasEnabled: true,
    isProd: false,
    devProUserIds: [],
  },
}));
vi.mock("../lib/renewalToken", () => ({
  verifyRenewalToken: () => ({ status: "invalid" }),
  issueRenewalToken: () => "t",
}));
vi.mock("../lib/fiscalStorage", () => ({ signedFiscalUrl: async () => null }));
vi.mock("../providers", () => ({ stripeProvider: {}, asaasProvider: {} }));

vi.mock("../providers/asaas", () => ({
  fetchPixQrCode: vi.fn(),
  fetchChargeAmountCents: async () => null,
  lerPagamento: vi.fn(),
  cancelPayment: async (chargeId: string) => {
    estado.chamadasCancel.push(chargeId);
    return estado.cancelamento;
  },
  closePendingCharge: async (args: Record<string, unknown>) => {
    estado.fechamentos.push(args);
    if (estado.erroDoFechamento) throw estado.erroDoFechamento;
  },
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      const q: Record<string, unknown> = {};
      for (const m of ["select", "order", "limit"]) q[m] = () => q;
      q.eq = (coluna: string, valor: unknown) => {
        estado.filtros.push([coluna, valor]);
        return q;
      };
      q.maybeSingle = async () => ({
        data: estado.pendente,
        error: estado.erroDaLeitura,
      });
      return q;
    },
  },
}));

import { handleCancelPending } from "./billing";

async function chamar(body: Record<string, unknown> = {}) {
  let json: Record<string, unknown> | undefined;
  let erro: AppError | undefined;
  const res = {
    json(carga: Record<string, unknown>) {
      json = carga;
      return res;
    },
    status() {
      return res;
    },
  };
  const req = {
    user: { id: "user-1", email: "a@b.com" },
    body,
    params: {},
    query: {},
    headers: {},
  } as unknown as Request;
  await handleCancelPending(
    req,
    res as unknown as Response,
    ((e?: unknown) => {
      erro = e as AppError;
    }) as NextFunction,
  );
  return { json, erro };
}

beforeEach(() => {
  estado.pendente = { id: "row-1", provider_subscription_id: "pay_abc" };
  estado.erroDaLeitura = null;
  estado.filtros = [];
  estado.cancelamento = { resultado: "cancelada" };
  estado.chamadasCancel = [];
  estado.fechamentos = [];
  estado.erroDoFechamento = null;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/billing/cancel-pending", () => {
  it("sem cobranca pendente: 404 sem_cobranca_pendente, nada chamado", async () => {
    estado.pendente = null;
    const { erro, json } = await chamar();

    expect(erro).toMatchObject({
      statusCode: 404,
      code: "sem_cobranca_pendente",
    });
    expect(json).toBeUndefined();
    expect(estado.chamadasCancel).toEqual([]);
    expect(estado.fechamentos).toEqual([]);
  });

  it("linha pendente SEM cobranca (criacao em voo): 404, e a linha NAO fecha", async () => {
    estado.pendente = { id: "row-1", provider_subscription_id: null };
    const { erro } = await chamar();

    expect(erro).toMatchObject({ statusCode: 404 });
    expect(estado.chamadasCancel).toEqual([]);
    expect(estado.fechamentos).toEqual([]);
  });

  it("autorizacao por construcao: a cobranca vem do dono, e id no corpo e ignorado", async () => {
    await chamar({ paymentId: "pay_de_outra_pessoa", id: "row-outra" });

    expect(estado.filtros).toEqual([
      ["user_id", "user-1"],
      ["provider", "asaas"],
      ["payment_method", "pix"],
      ["status", "pending"],
    ]);
    expect(estado.chamadasCancel).toEqual(["pay_abc"]);
  });

  it("already_paid: 409 pagamento_ja_recebido, e a linha fica intacta", async () => {
    estado.cancelamento = { resultado: "already_paid", status: "RECEIVED" };
    const { erro, json } = await chamar();

    expect(erro).toMatchObject({
      statusCode: 409,
      code: "pagamento_ja_recebido",
    });
    expect(json).toBeUndefined();
    expect(estado.fechamentos).toEqual([]);
  });

  it("falha generica: 502 cancelamento_falhou, e a linha fica intacta", async () => {
    estado.cancelamento = { resultado: "falha", motivo: "leitura_falhou" };
    const { erro, json } = await chamar();

    expect(erro).toMatchObject({
      statusCode: 502,
      code: "cancelamento_falhou",
    });
    expect(erro?.context).toMatchObject({
      motivo: "leitura_falhou",
      asaas_payment_id: "pay_abc",
    });
    expect(json).toBeUndefined();
    expect(estado.fechamentos).toEqual([]);
  });

  it("sucesso: fecha a linha pelo caminho do webhook e responde 200", async () => {
    const { erro, json } = await chamar();

    expect(erro).toBeUndefined();
    expect(json).toEqual({ data: { canceled: true } });
    expect(estado.fechamentos).toHaveLength(1);
    expect(estado.fechamentos[0]).toMatchObject({
      chargeId: "pay_abc",
      rowId: "row-1",
    });
  });

  it("o Asaas excluiu e o fechamento falhou: o erro sobe, sem 200", async () => {
    estado.erroDoFechamento = new Error("banco fora");
    const { erro, json } = await chamar();

    expect(erro?.message).toBe("banco fora");
    expect(json).toBeUndefined();
  });

  it("leitura da linha falhou: 500 db_error, e o Asaas nao e chamado", async () => {
    estado.erroDaLeitura = { message: "timeout" };
    const { erro } = await chamar();

    expect(erro).toMatchObject({ statusCode: 500, code: "db_error" });
    expect(estado.chamadasCancel).toEqual([]);
  });
});
