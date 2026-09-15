import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * EVENTO `sale` DE CREATOR: nasce no MESMO ponto do contador de comissao, e so
 * quando o contador somou.
 *
 * Irmao de comissaoBasePaga.test.ts, que trava a BASE do contador (valor pago,
 * nunca preco de tabela). Este trava o evento que o lote 01 dos Creators passou
 * a gravar ao lado: mesmos numeros do contador, e ausente exatamente nos casos
 * em que o contador tambem nao soma (valor nao declarado, recuperacao de
 * past_due, falha da RPC). Serie que conta o que o contador nao conta diverge
 * do total do painel sem ninguem perceber.
 *
 * Os numeros sao escritos a mao: R$ 20,93 e o mensal de 29,90 com cupom de 30
 * por cento, e 30 por cento de 2093 e 627,9, que arredonda para 628, a mesma
 * conta que o `round(p_revenue_cents * commission_percent / 100.0)` do SQL.
 */

const estado = vi.hoisted(() => ({
  afiliado: null as { id: string; commission_percent: number } | null,
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  rpcErro: null as { message: string } | null,
  eventos: [] as Array<Record<string, unknown>>,
}));

vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  addBreadcrumb: () => {},
}));

vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async () => {},
}));

vi.mock("../lib/queue", () => ({
  enqueueEmail: async () => {},
}));

vi.mock("../lib/creatorEvents", () => ({
  recordCreatorEvent: async (input: Record<string, unknown>) => {
    estado.eventos.push(input);
    return { ok: true };
  },
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      const consulta = {
        select: () => consulta,
        eq: () => consulta,
        maybeSingle: async () => {
          if (tabela === "affiliates") {
            return { data: estado.afiliado, error: null };
          }
          if (tabela === "profiles") {
            return { data: { gender: null }, error: null };
          }
          throw new Error(`tabela inesperada neste arquivo: ${tabela}`);
        },
      };
      return consulta;
    },
    rpc: async (nome: string, args: Record<string, unknown>) => {
      estado.rpcCalls.push({ nome, args });
      return { data: null, error: estado.rpcErro };
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { email: "pessoa@exemplo.com", user_metadata: {} } },
        }),
      },
    },
  },
}));

import { applyActivationEffects } from "./shared";

/** Mensal de 29,90 com cupom de 30 por cento: o que a pessoa de fato pagou. */
const MENSAL_COM_CUPOM_CENTS = 2093;
/** 30 por cento de 2093 = 627,9, arredondado. */
const COMISSAO_ESPERADA_CENTS = 628;

function ativar(over: Partial<Parameters<typeof applyActivationEffects>[0]>) {
  return applyActivationEffects({
    userId: "user-1",
    logPrefix: "webhook/stripe",
    motivo: "primeira_ativacao",
    affiliateCode: "BORA10",
    revenueCents: MENSAL_COM_CUPOM_CENTS,
    subscriptionId: "sub-row-1",
    planId: "plan-uuid-mensal",
    paymentMethod: "card",
    prevStatus: null,
    ...over,
  });
}

const conversoes = () =>
  estado.rpcCalls.filter((c) => c.nome === "increment_affiliate_conversion");

beforeEach(() => {
  estado.afiliado = { id: "aff-1", commission_percent: 30 };
  estado.rpcCalls = [];
  estado.rpcErro = null;
  estado.eventos = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("evento sale: mesmos numeros do contador", () => {
  it("venda de R$ 20,93 com 30 por cento grava sale com 2093 e 628", async () => {
    await ativar({});

    expect(conversoes()).toHaveLength(1);
    expect(estado.eventos).toEqual([
      {
        eventType: "sale",
        affiliateId: "aff-1",
        userId: "user-1",
        subscriptionId: "sub-row-1",
        planId: "plan-uuid-mensal",
        paymentMethod: "card",
        revenueCents: MENSAL_COM_CUPOM_CENTS,
        commissionCents: COMISSAO_ESPERADA_CENTS,
      },
    ]);
  });

  it("zero DECLARADO grava a venda com comissao zero, como o contador", async () => {
    await ativar({ revenueCents: 0 });

    expect(estado.eventos).toHaveLength(1);
    expect(estado.eventos[0]).toMatchObject({
      revenueCents: 0,
      commissionCents: 0,
    });
  });
});

describe("evento sale: ausente onde o contador nao soma", () => {
  it("venda sem valor declarado nao grava evento (nem o contador soma)", async () => {
    await ativar({ revenueCents: undefined });

    expect(conversoes()).toEqual([]);
    expect(estado.eventos).toEqual([]);
  });

  it("recuperacao de past_due nao grava evento (nem o contador soma)", async () => {
    await ativar({ motivo: "recuperacao", prevStatus: "past_due" });

    expect(conversoes()).toEqual([]);
    expect(estado.eventos).toEqual([]);
  });

  it("falha na RPC do contador nao grava evento", async () => {
    estado.rpcErro = { message: "statement timeout" };

    await ativar({});

    expect(conversoes()).toHaveLength(1);
    expect(estado.eventos).toEqual([]);
  });

  it("afiliado inexistente nao soma nem grava", async () => {
    estado.afiliado = null;

    await ativar({});

    expect(conversoes()).toEqual([]);
    expect(estado.eventos).toEqual([]);
  });
});
