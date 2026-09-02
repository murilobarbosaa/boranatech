import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O SEGUNDO CAMINHO DE `isPro` DEIXOU DE EXISTIR.
 *
 * `GET /api/billing/subscription` recalculava Pro por conta propria
 * (`rpc('is_user_pro')` direto, `isPro = !rpcError && data === true`) e divergia
 * do caminho canonico `resolveProStatus` em tres pontos. As tres divergencias
 * viraram os tres casos do segundo bloco abaixo.
 *
 * A terceira era a unica com efeito em PRODUCAO, e e a que estes testes existem
 * para nao deixar voltar: o canonico devolve `is_user_pro OR is_user_admin`
 * (CLAUDE.md: "isPro || isAdmin e intencional em toda a plataforma"), e a rota
 * devolvia so o primeiro. Um admin sem assinatura via `isPro: false` na pagina
 * de cobranca e `true` em todo o resto do produto.
 */

const estado = vi.hoisted(() => ({
  /** Toda chamada de rpc que o HANDLER fizer, na ordem. */
  rpcCalls: [] as string[],
  subscription: null as Record<string, unknown> | null,
  planoFree: { code: "free", name: "Free" } as Record<string, unknown> | null,
  influencer: null as Record<string, unknown> | null,
  adminRpc: false,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    billingEnabled: true,
    asaasEnabled: false,
    isProd: false,
    devProUserIds: [],
  },
}));

vi.mock("../lib/renewalToken", () => ({
  verifyRenewalToken: () => ({ status: "invalid" }),
  issueRenewalToken: () => "t",
}));
vi.mock("../lib/fiscalStorage", () => ({ signedFiscalUrl: async () => null }));
vi.mock("../providers", () => ({
  stripeProvider: {},
  asaasProvider: {},
}));

vi.mock("../lib/supabaseAdmin", () => {
  function consulta(tabela: string) {
    const q: Record<string, unknown> = {};
    for (const m of [
      "select",
      "eq",
      "in",
      "neq",
      "order",
      "limit",
      "is",
      "gt",
    ]) {
      q[m] = () => q;
    }
    q.maybeSingle = async () => {
      if (tabela === "subscriptions")
        return { data: estado.subscription, error: null };
      if (tabela === "influencers")
        return { data: estado.influencer, error: null };
      if (tabela === "plans") return { data: estado.planoFree, error: null };
      return { data: null, error: null };
    };
    q.single = async () => ({ data: estado.planoFree, error: null });
    return q;
  }
  return {
    supabaseAdmin: {
      from: (tabela: string) => consulta(tabela),
      rpc: async (nome: string) => {
        estado.rpcCalls.push(nome);
        if (nome === "is_user_admin")
          return { data: estado.adminRpc, error: null };
        return { data: null, error: null };
      },
    },
  };
});

import { handleGetSubscription } from "./billing";

function req(isPro: boolean | undefined) {
  return {
    user: { id: "user-1", email: "a@b.com" },
    isPro,
    headers: {},
  } as unknown as Request;
}

function res() {
  const gravado: { json?: Record<string, unknown> } = {};
  const objeto = {
    json(carga: Record<string, unknown>) {
      gravado.json = carga;
      return objeto;
    },
    status() {
      return objeto;
    },
  };
  return { objeto: objeto as unknown as Response, gravado };
}

const next = ((err?: unknown) => {
  if (err) throw err;
}) as unknown as NextFunction;

describe("a rota DELEGA: nao ha mais decisao propria de Pro", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.subscription = null;
    estado.influencer = null;
    estado.adminRpc = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("NAO chama is_user_pro: a decisao ja veio pronta do middleware", async () => {
    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    expect(estado.rpcCalls).not.toContain("is_user_pro");
  });

  it("responde exatamente o que o caminho canonico decidiu: true", async () => {
    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    expect(r.gravado.json?.data).toMatchObject({ isPro: true });
  });

  it("responde exatamente o que o caminho canonico decidiu: false", async () => {
    const r = res();
    await handleGetSubscription(req(false), r.objeto, next);

    expect(r.gravado.json?.data).toMatchObject({ isPro: false });
  });

  it("FAIL-CLOSED preservado: `req.isPro` ausente vira false, sem excecao", async () => {
    // `checkProStatus` nunca lanca (captura tudo e devolve false), mas se por
    // qualquer motivo o campo nao chegar, a rota nao pode conceder acesso nem
    // estourar 500.
    const r = res();
    // `resolves` sem `toBeUndefined`: o handler devolve o retorno de
    // `res.json()`, que e o proprio res. O que importa e que NAO lanca.
    await expect(
      handleGetSubscription(req(undefined), r.objeto, next),
    ).resolves.not.toThrow();
    expect(r.gravado.json?.data).toMatchObject({ isPro: false });
  });
});

describe("as tres divergencias registradas, uma a uma", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.subscription = null;
    estado.influencer = null;
    estado.adminRpc = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("1. cache: a rota nao emite mais a RPC que o cache existia para evitar", async () => {
    // A divergencia era pagar `is_user_pro` em toda carga da pagina de cobranca
    // enquanto o resto do sistema respondia do cache Redis. Agora quem decide e
    // `resolveProStatus`, que consulta o cache antes de qualquer RPC.
    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    expect(estado.rpcCalls.filter((n) => n === "is_user_pro")).toEqual([]);
  });

  it("2. dev-pro: a rota nao tem mais opiniao propria, entao herda a do middleware", async () => {
    // `isDevProUser` vive dentro de `checkProStatus`. Como a rota so le
    // `req.isPro`, um usuario dev-pro chega aqui ja como true e a pagina para de
    // contradizer as demais telas do mesmo app.
    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    expect(r.gravado.json?.data).toMatchObject({ isPro: true });
  });

  it("3. ADMIN sem assinatura: era false aqui e true no resto do produto", async () => {
    // A divergencia com efeito em producao. Sem assinatura nenhuma, o canonico
    // devolve true por `is_user_admin`; a rota devolvia false porque so olhava
    // `is_user_pro`. Agora ela responde o que o canonico decidiu.
    estado.subscription = null;
    estado.adminRpc = true;

    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    const data = r.gravado.json?.data as Record<string, unknown>;
    expect(data.isPro).toBe(true);
    // E o rotulo de origem continua honesto: acesso de admin, nao de assinatura.
    expect(data.accessSource).toBe("admin");
  });
});

describe("o contrato da resposta nao mudou", () => {
  beforeEach(() => {
    estado.rpcCalls = [];
    estado.subscription = null;
    estado.influencer = null;
    estado.adminRpc = false;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sem assinatura: plano free e os campos aditivos seguem presentes", async () => {
    const r = res();
    await handleGetSubscription(req(false), r.objeto, next);

    const data = r.gravado.json?.data as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual([
      "accessSource",
      "isPro",
      "nonRenewal",
      "pendingBoleto",
      "pendingCharge",
      "plan",
      "status",
    ]);
    expect(data.status).toBe("free");
  });

  it("com assinatura: o shape espalha a linha e acrescenta os aditivos", async () => {
    estado.subscription = {
      id: "sub-1",
      status: "active",
      renewal_type: "manual",
      provider_subscription_id: "pay_1",
      current_period_end: "2027-01-01T00:00:00.000Z",
    };

    const r = res();
    await handleGetSubscription(req(true), r.objeto, next);

    const data = r.gravado.json?.data as Record<string, unknown>;
    expect(data.id).toBe("sub-1");
    expect(data.isPro).toBe(true);
    expect(data).toHaveProperty("pendingBoleto");
    expect(data).toHaveProperty("pendingCharge");
    expect(data).toHaveProperty("nonRenewal");
    expect(data).toHaveProperty("accessSource");
  });
});
