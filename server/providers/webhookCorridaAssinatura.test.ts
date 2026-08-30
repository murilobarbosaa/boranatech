import { beforeEach, describe, expect, it, vi } from "vitest";

import { applySubscription } from "./stripe";

/**
 * CLASSIFICACAO DO 23505 NO INDICE PARCIAL `subscriptions_one_active_per_user`.
 *
 * O que estes testes travam: o `upsert` de `applySubscription` arbitra
 * `provider_subscription_id`, e `ON CONFLICT` so absorve conflito no indice
 * ARBITRADO. O indice parcial da migration 20260829120000 e um SEGUNDO indice
 * unico sobre a mesma tabela, entao ele levanta 23505 em vez de virar DO
 * NOTHING. O evento de 30/08 13:50 foi corrida benigna (o ocupante do slot era
 * a propria assinatura do evento, criada 374ms antes por outro handler) e
 * mesmo assim devolveu 500.
 *
 * O erro NAO diz qual dos dois casos e: o `details` do Postgres nomeia so a
 * chave (`Key (user_id)=(...)`), nunca o ocupante. Por isso ha uma consulta de
 * classificacao, e por isso ela tem TRES desfechos e nao dois. O ramo que mais
 * importa aqui e o terceiro: consulta vazia ou consulta que falha lancam, nunca
 * viram sucesso. Essa consulta corre a mesma corrida do upsert e pode voltar
 * vazia por ter rodado antes do commit do vencedor, e colapsar "nao sei" em
 * "esta tudo bem" e o defeito que este projeto persegue.
 *
 * O erro do duble e um OBJETO PLANO com code/details/hint/message, que e o que
 * o postgrest-js devolve no modo `{ data, error }` (medido em
 * server/lib/supabaseError.test.ts). Uma instancia de `Error` aqui testaria uma
 * condicao que nao acontece em producao.
 */

type Resultado = { data: unknown; error: unknown };

const estado = vi.hoisted(() => ({
  /** Toda consulta de CLASSIFICACAO (a que filtra por user_id), na ordem. */
  classificacoes: [] as Array<Record<string, unknown>>,
  /** Toda escrita em tabela, na ordem. */
  escritas: [] as Array<{ tabela: string; operacao: string }>,
  capturas: [] as Array<{ mensagem: string; opcoes: Record<string, unknown> }>,
  /** Invalidacoes de cache: o primeiro efeito de handleTransition. */
  transicoes: [] as string[],
  /** Linha lida por provider_subscription_id, antes da escrita. */
  existing: null as Record<string, unknown> | null,
  /** Resultado do `upsert(...).select("id")`. */
  upsertResultado: { data: [], error: null } as Resultado,
  /** Resultado da consulta de classificacao. */
  classificacao: { data: null, error: null } as Resultado,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    stripeSecretKey: "sk_test_x",
    stripeWebhookSecret: "whsec_x",
    stripePriceIds: {
      pro_monthly: "price_monthly",
      pro_semiannual: "price_semiannual",
      pro_annual: "price_annual",
    },
    appPublicUrl: "https://exemplo.com.br",
    billingEnabled: true,
    isProd: false,
  },
}));

vi.mock("@sentry/node", () => ({
  captureMessage: (mensagem: string, opcoes: Record<string, unknown>) => {
    estado.capturas.push({ mensagem, opcoes });
  },
  captureException: () => {},
  addBreadcrumb: () => {},
}));

vi.mock("../lib/stripeClient", () => ({
  getStripe: () => {
    throw new Error("applySubscription nao chama a Stripe");
  },
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

// Efeitos de handleTransition. `invalidateProStatusCache` e o primeiro deles e
// dispara sempre que o status muda, entao e nele que se le "a transicao rodou".
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: async (userId: string) => {
    estado.transicoes.push(userId);
  },
}));
vi.mock("../lib/queue", () => ({ enqueueEmail: async () => {} }));
vi.mock("../lib/stripeSync", () => ({
  syncBalanceTransactions: async () => {},
}));
vi.mock("../lib/coupons", () => ({ findValidCoupon: async () => null }));

vi.mock("../lib/supabaseAdmin", () => {
  function consultaDeTabela(tabela: string) {
    const filtros: Record<string, unknown> = {};
    let ultimaEscrita: string | null = null;
    const consulta: Record<string, unknown> = {};

    for (const metodo of ["select", "order", "limit", "neq", "is", "gt"]) {
      consulta[metodo] = () => consulta;
    }
    for (const filtro of ["eq", "in"]) {
      consulta[filtro] = (coluna: string, valor: unknown) => {
        filtros[coluna] = valor;
        return consulta;
      };
    }
    for (const operacao of ["update", "upsert", "insert", "delete"]) {
      consulta[operacao] = () => {
        ultimaEscrita = operacao;
        estado.escritas.push({ tabela, operacao });
        return consulta;
      };
    }

    consulta.maybeSingle = async (): Promise<Resultado> => {
      if (tabela === "plans") {
        return {
          data: { id: "plan-row-uuid", name: "Pro Anual" },
          error: null,
        };
      }
      if (tabela === "subscriptions") {
        // A consulta de classificacao e a unica que filtra por user_id; a
        // leitura de `existing` filtra por provider_subscription_id.
        if ("user_id" in filtros) {
          estado.classificacoes.push({ ...filtros });
          return estado.classificacao;
        }
        return { data: estado.existing, error: null };
      }
      return { data: null, error: null };
    };

    // O `upsert(...).select("id")` e aguardado direto, sem maybeSingle, entao a
    // cadeia precisa ser thenable.
    consulta.then = (
      resolve: (v: Resultado) => unknown,
      reject?: (e: unknown) => unknown,
    ) =>
      Promise.resolve(
        ultimaEscrita === "upsert"
          ? estado.upsertResultado
          : ({ data: null, error: null } as Resultado),
      ).then(resolve, reject);

    return consulta;
  }

  return {
    supabaseAdmin: {
      from: (tabela: string) => consultaDeTabela(tabela),
      rpc: async () => ({ data: null, error: null }),
      auth: {
        admin: {
          getUserById: async () => ({
            data: { user: { email: "", user_metadata: {} } },
            error: null,
          }),
        },
      },
    },
  };
});

const USER = "81129623-79a8-415c-be5c-30ae9f86d3af";
const SUB = "sub_1UA97sQ6lxIhx7VyF77F9STc";
const OUTRA_SUB = "sub_9ZZZZZQ6lxIhx7VyOUTRA000";
const EVENT = "evt_1UA97tQ6lxIhx7VyI5ypzLNe";
const INDICE = "subscriptions_one_active_per_user";

/** Erro do postgrest: objeto PLANO, como o `JSON.parse(body)` do modo { data, error }. */
function erroDoPostgrest(over: Record<string, unknown> = {}) {
  return {
    code: "23505",
    details: `Key (user_id)=(${USER}) already exists.`,
    hint: null,
    message: `duplicate key value violates unique constraint "${INDICE}"`,
    ...over,
  };
}

function assinatura() {
  return {
    id: SUB,
    status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    customer: "cus_teste",
    metadata: { supabase_user_id: USER, plan_id: "pro_annual" },
    items: {
      data: [
        {
          price: { id: "price_annual" },
          current_period_start: 1756400000,
          current_period_end: 1787936000,
        },
      ],
    },
  } as unknown as Parameters<typeof applySubscription>[0];
}

function evento() {
  return {
    id: EVENT,
    type: "checkout.session.completed",
    created: 1756565427,
    data: { object: { id: "cs_teste" } },
  } as unknown as Parameters<typeof applySubscription>[1];
}

async function rodar() {
  return applySubscription(
    assinatura(),
    evento(),
    new Date("2026-08-30T13:50:25.000Z"),
  );
}

/** Cadeia de `cause`, achatada em texto, para procurar os ids. */
function textoDaCadeia(err: unknown): string {
  const partes: string[] = [];
  let atual: unknown = err;
  while (atual instanceof Error) {
    partes.push(atual.name, atual.message);
    atual = atual.cause;
  }
  return partes.join(" | ");
}

describe("23505 no indice parcial de assinatura ativa", () => {
  beforeEach(() => {
    estado.classificacoes = [];
    estado.escritas = [];
    estado.capturas = [];
    estado.transicoes = [];
    estado.existing = null;
    estado.upsertResultado = { data: [], error: null };
    estado.classificacao = { data: null, error: null };
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("corrida benigna (mesmo provider_subscription_id): nao lanca e nao dispara a transicao", async () => {
    estado.upsertResultado = { data: null, error: erroDoPostgrest() };
    estado.classificacao = {
      data: { id: "row", provider_subscription_id: SUB, status: "active" },
      error: null,
    };

    await expect(rodar()).resolves.toBeUndefined();

    expect(estado.classificacoes).toHaveLength(1);
    expect(estado.classificacoes[0].user_id).toBe(USER);
    expect(estado.classificacoes[0].status).toEqual(["active", "trialing"]);
    // A transicao e do handler que criou a linha, nao deste.
    expect(estado.transicoes).toEqual([]);

    const capturas = estado.capturas.filter(
      (c) => c.mensagem === "stripe_corrida_assinatura_ativa",
    );
    expect(capturas).toHaveLength(1);
    expect(capturas[0].opcoes.level).toBe("info");
    expect(capturas[0].opcoes.fingerprint).toEqual([
      "stripe-corrida-assinatura-ativa",
    ]);
    expect(capturas[0].opcoes.extra).toMatchObject({
      user_id: USER,
      subscription_id: SUB,
      event_id: EVENT,
    });
  });

  it("ocupante DIFERENTE: lanca, e a mensagem interna carrega os dois ids", async () => {
    estado.upsertResultado = { data: null, error: erroDoPostgrest() };
    estado.classificacao = {
      data: {
        id: "row",
        provider_subscription_id: OUTRA_SUB,
        status: "active",
      },
      error: null,
    };

    const erro = await rodar().then(
      () => null,
      (e: unknown) => e,
    );
    expect(erro).toBeInstanceOf(Error);

    const texto = textoDaCadeia(erro);
    expect(texto).toContain(SUB);
    expect(texto).toContain(OUTRA_SUB);
    expect(texto).toContain(USER);
    // O 23505 original continua na cadeia: e o fato do incidente.
    expect(texto).toContain("23505");
    expect(estado.transicoes).toEqual([]);
  });

  it("classificacao devolve VAZIO: lanca, nao trata como benigno", async () => {
    estado.upsertResultado = { data: null, error: erroDoPostgrest() };
    estado.classificacao = { data: null, error: null };

    await expect(rodar()).rejects.toThrow("Erro ao gravar assinatura.");
    expect(estado.classificacoes).toHaveLength(1);
    expect(
      estado.capturas.filter(
        (c) => c.mensagem === "stripe_corrida_assinatura_ativa",
      ),
    ).toHaveLength(0);
    expect(estado.transicoes).toEqual([]);
  });

  it("classificacao FALHA: lanca, e com o erro ORIGINAL da escrita", async () => {
    estado.upsertResultado = { data: null, error: erroDoPostgrest() };
    estado.classificacao = {
      data: null,
      error: {
        code: "57014",
        details: null,
        hint: null,
        message: "canceling statement due to statement timeout",
      },
    };

    const erro = await rodar().then(
      () => null,
      (e: unknown) => e,
    );
    const texto = textoDaCadeia(erro);
    expect(texto).toContain("23505");
    expect(texto).toContain(INDICE);
    // O erro da classificacao NAO substitui o original.
    expect(texto).not.toContain("statement timeout");
    expect(estado.transicoes).toEqual([]);
  });

  it("23505 em OUTRA constraint: comportamento atual, lanca sem classificar", async () => {
    estado.upsertResultado = {
      data: null,
      error: erroDoPostgrest({
        message:
          'duplicate key value violates unique constraint "subscriptions_provider_subscription_id_key"',
        details: `Key (provider_subscription_id)=(${SUB}) already exists.`,
      }),
    };

    await expect(rodar()).rejects.toThrow("Erro ao gravar assinatura.");
    expect(estado.classificacoes).toEqual([]);
  });

  it("CONTROLE NEGATIVO: 23503 (o do BUG-74) lanca como hoje, sem consulta extra", async () => {
    estado.upsertResultado = {
      data: null,
      error: {
        code: "23503",
        details: `Key (user_id)=(${USER}) is not present in table "users".`,
        hint: null,
        message:
          'insert or update on table "subscriptions" violates foreign key constraint "subscriptions_user_id_fkey"',
      },
    };

    await expect(rodar()).rejects.toThrow("Erro ao gravar assinatura.");
    expect(estado.classificacoes).toEqual([]);
    expect(estado.transicoes).toEqual([]);
  });

  it("CONTROLE NEGATIVO: upsert com sucesso nao dispara classificacao nenhuma", async () => {
    estado.upsertResultado = { data: [{ id: "row-nova" }], error: null };

    await expect(rodar()).resolves.toBeUndefined();
    expect(estado.classificacoes).toEqual([]);
    // Vencedor da corrida: a transicao roda.
    expect(estado.transicoes).toEqual([USER]);
  });
});
