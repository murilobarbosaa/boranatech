import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BUG-79: dados do Auth por RPC, nao por varredura de `auth.admin.listUsers`.
 *
 * O que estes testes travam: em 31/08/2026 o `GET /api/admin/churn-risk` caiu
 * com `AuthRetryableFetchError: The operation was aborted due to timeout`
 * (issue NODE-EXPRESS-T), porque `fetchAuthUsersByIds` paginava o Auth de 1000
 * em 1000 sobre 8.317 perfis para achar ~60 assinantes. O custo era da BASE, e
 * o alvo era pequeno.
 *
 * Expectativas escritas a mao (3 lotes de 500/500/200, o mapa agregado, a
 * rejeicao), nunca derivadas de chamar o proprio mecanismo.
 */

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseServiceRoleKey: "service-role-de-teste",
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
    nodeEnv: "test",
  },
}));

const estado = vi.hoisted(() => ({
  chamadas: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  resposta: null as unknown,
  erro: null as unknown,
  // Caminho PAGINADO (`admin_auth_times`): `paginas` sao as respostas em ordem,
  // e `count` e o total que o `{ count: "exact" }` devolveria. Separado do
  // `resposta` de proposito: os dois wrappers usam formas diferentes do cliente
  // (um chama `rpc` direto, o outro encadeia `.order().range()`), e um dublê so
  // para os dois esconderia essa diferenca.
  paginas: [] as Array<Array<Record<string, unknown>>>,
  count: null as number | null,
  ranges: [] as Array<[number, number]>,
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: (
      nome: string,
      args: Record<string, unknown>,
      opts?: { count?: string },
    ) => {
      estado.chamadas.push({ nome, args });

      // Caminho DIRETO (`await rpc(...)`), usado por fetchAuthUsersByIds.
      const direto = () => {
        if (estado.erro) return { data: null, error: estado.erro, count: null };
        const resp = estado.resposta;
        return {
          data:
            typeof resp === "function"
              ? (resp as (a: unknown) => unknown)(args)
              : resp,
          error: null,
          count: null,
        };
      };

      // Caminho ENCADEADO (`rpc(...).order(...).range(...)`), usado por
      // fetchAuthTimes. Serve a pagina correspondente ao `from` pedido.
      const builder = {
        order: () => builder,
        range: async (from: number, to: number) => {
          estado.ranges.push([from, to]);
          if (estado.erro) {
            return { data: null, error: estado.erro, count: null };
          }
          const indice = estado.ranges.length - 1;
          const pagina = estado.paginas[indice] ?? [];
          return {
            data: pagina,
            error: null,
            count: opts?.count === "exact" ? estado.count : null,
          };
        },
        // Aguardavel direto, para o wrapper que nao encadeia.
        then: (
          resolve: (v: unknown) => unknown,
          reject?: (e: unknown) => unknown,
        ) => Promise.resolve(direto()).then(resolve, reject),
      };
      return builder;
    },
  },
}));

vi.mock("@sentry/node", () => ({
  captureMessage: () => {},
  captureException: () => {},
  addBreadcrumb: () => {},
  withScope: (cb: (s: unknown) => void) =>
    cb({ setTag: () => {}, setLevel: () => {}, setContext: () => {} }),
}));

import { AUTH_LITE_BATCH, fetchAuthUsersByIds } from "./admin";
import { fetchAuthTimes } from "../lib/authUsers";

function linhaLite(id: string) {
  return {
    user_id: id,
    email: `${id}@exemplo.com`,
    last_sign_in_at: "2026-08-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    name: `Nome ${id}`,
  };
}

describe("fetchAuthUsersByIds: lotes, agregacao e falha fechada", () => {
  beforeEach(() => {
    estado.chamadas.length = 0;
    estado.resposta = null;
    estado.erro = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("o tamanho do lote e 500", () => {
    // Escrito a mao: se alguem mudar a constante, os numeros abaixo mudam junto
    // e este teste diz por que.
    expect(AUTH_LITE_BATCH).toBe(500);
  });

  it("(a) 1.200 ids viram 3 chamadas de 500, 500 e 200, e o mapa agrega as tres", async () => {
    const ids = Array.from(
      { length: 1200 },
      (_, i) => `u${String(i).padStart(4, "0")}`,
    );
    estado.resposta = (args: unknown) =>
      (args as { p_user_ids: string[] }).p_user_ids.map(linhaLite);

    const mapa = await fetchAuthUsersByIds(ids);

    expect(estado.chamadas).toHaveLength(3);
    expect(estado.chamadas.map((c) => c.nome)).toEqual([
      "admin_auth_users_lite",
      "admin_auth_users_lite",
      "admin_auth_users_lite",
    ]);
    const tamanhos = estado.chamadas.map(
      (c) => (c.args.p_user_ids as string[]).length,
    );
    expect(tamanhos).toEqual([500, 500, 200]);

    // Agregacao: o mapa tem os 1.200, nao so o ultimo lote.
    expect(mapa.size).toBe(1200);
    expect(mapa.get("u0000")?.email).toBe("u0000@exemplo.com");
    expect(mapa.get("u0700")?.name).toBe("Nome u0700");
    expect(mapa.get("u1199")?.createdAt).toBe("2026-01-01T00:00:00Z");
  });

  it("lista vazia nao chama a RPC", async () => {
    const mapa = await fetchAuthUsersByIds([]);
    expect(estado.chamadas).toHaveLength(0);
    expect(mapa.size).toBe(0);
  });

  it("(b) erro da RPC REJEITA, e nunca devolve mapa", async () => {
    // Mapa vazio aqui seria "ninguem esta em risco de churn", indistinguivel de
    // uma medicao correta. A rejeicao e o ponto.
    estado.erro = { message: "statement timeout", code: "57014" };

    await expect(fetchAuthUsersByIds(["u1"])).rejects.toThrow();

    const err = await fetchAuthUsersByIds(["u1"]).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { code?: string }).code).toBe("db_error");
    // `cause` encadeavel para o Sentry, e `context` com o pgCode real.
    expect((err as { cause?: unknown }).cause).toBeInstanceOf(Error);
    expect((err as { context?: { pgCode?: string } }).context?.pgCode).toBe(
      "57014",
    );
  });

  it("(c) id pedido e nao devolvido simplesmente NAO esta no mapa", async () => {
    // Nada de entrada nula: o churn-risk faz `authByUserId.get(id)` e trata
    // ausencia com `if (!authUser) return null`. Uma entrada nula passaria por
    // esse guard e quebraria adiante.
    estado.resposta = [linhaLite("u1")];

    const mapa = await fetchAuthUsersByIds(["u1", "u2"]);

    expect(mapa.size).toBe(1);
    expect(mapa.has("u1")).toBe(true);
    expect(mapa.has("u2")).toBe(false);
    expect(mapa.get("u2")).toBeUndefined();
  });

  it("data que NAO e array rejeita, em vez de virar mapa vazio", async () => {
    // O `?? []` que existia aqui transformava uma resposta inesperada em
    // "nenhum usuario encontrado", e o churn-risk publicaria uma tela vazia
    // afirmando que ninguem esta em risco sobre uma leitura que nao aconteceu.
    estado.resposta = null;

    await expect(fetchAuthUsersByIds(["u1"])).rejects.toThrow();

    const err = await fetchAuthUsersByIds(["u1"]).catch((e) => e);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { code?: string }).code).toBe("db_error");
    expect((err as { context?: Record<string, unknown> }).context).toEqual({
      op: "admin_auth_users_lite",
      recebido: "object",
    });
  });

  it("campos nulos do Auth viram null, nao undefined", async () => {
    estado.resposta = [
      {
        user_id: "u9",
        email: null,
        last_sign_in_at: null,
        created_at: null,
        name: null,
      },
    ];
    const mapa = await fetchAuthUsersByIds(["u9"]);
    expect(mapa.get("u9")).toEqual({
      email: null,
      lastSignInAt: null,
      createdAt: null,
      name: null,
    });
  });
});

describe("fetchAuthTimes: pagina e PROVA o total", () => {
  beforeEach(() => {
    estado.chamadas.length = 0;
    estado.ranges.length = 0;
    estado.paginas.length = 0;
    estado.resposta = null;
    estado.erro = null;
    estado.count = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function linhaTimes(n: number) {
    return {
      user_id: `p${String(n).padStart(5, "0")}`,
      last_sign_in_at: "2026-08-30T10:00:00Z",
      created_at: "2026-01-02T00:00:00Z",
    };
  }

  it("paginas de 1000, 1000 e 370 com count 2370 dao um mapa de 2370", async () => {
    // 2370 escrito a mao, nao `paginas.flat().length`: derivar a expectativa do
    // mesmo arranjo que alimenta o mecanismo faria os dois errarem juntos.
    estado.count = 2370;
    estado.paginas = [
      Array.from({ length: 1000 }, (_, i) => linhaTimes(i)),
      Array.from({ length: 1000 }, (_, i) => linhaTimes(1000 + i)),
      Array.from({ length: 370 }, (_, i) => linhaTimes(2000 + i)),
      [],
    ];

    const mapa = await fetchAuthTimes();

    expect(mapa.size).toBe(2370);
    expect(mapa.get("p00000")).toEqual({
      lastSignInAt: "2026-08-30T10:00:00Z",
      createdAt: "2026-01-02T00:00:00Z",
    });
    expect(mapa.get("p02369")).toBeTruthy();
    // Avanca pelo tamanho REAL da pagina: 0, 1000, 2000, 2370.
    expect(estado.ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2370, 3369],
    ]);
  });

  it("count 2370 com paginas somando 2000 REJEITA", async () => {
    // O caso que motivou o lote: em producao a resposta vinha 200 com 1000 de
    // 8.370, e nada acusava. Aqui a prova de total e o que acusa.
    estado.count = 2370;
    estado.paginas = [
      Array.from({ length: 1000 }, (_, i) => linhaTimes(i)),
      Array.from({ length: 1000 }, (_, i) => linhaTimes(1000 + i)),
      [],
    ];

    // UMA chamada so: `estado.ranges` avanca o indice das paginas, entao chamar
    // de novo no mesmo teste leria outras paginas e mediria outra coisa.
    const err = await fetchAuthTimes().catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { code?: string }).code).toBe("db_error");
    expect((err as { context?: Record<string, unknown> }).context).toEqual({
      op: "admin_auth_times",
      esperado: 2370,
      obtido: 2000,
    });
  });

  it("resposta SEM count REJEITA: sem o total nao da para provar completude", async () => {
    estado.count = null;
    estado.paginas = [[linhaTimes(1)], []];

    const err = await fetchAuthTimes().catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { context?: Record<string, unknown> }).context).toEqual({
      op: "admin_auth_times",
      obtido: 1,
      esperado: null,
    });
  });

  it("erro na pagina REJEITA, e nunca devolve mapa parcial", async () => {
    estado.erro = { message: "permission denied for function", code: "42501" };

    const err = await fetchAuthTimes().catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { cause?: unknown }).cause).toBeInstanceOf(Error);
    expect((err as { context?: { op?: string } }).context?.op).toBe(
      "admin_auth_times",
    );
  });

  it("base vazia: count 0, mapa vazio, sem erro", async () => {
    estado.count = 0;
    estado.paginas = [[]];
    const mapa = await fetchAuthTimes();
    expect(mapa.size).toBe(0);
  });
});
