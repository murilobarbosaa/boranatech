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
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: async (nome: string, args: Record<string, unknown>) => {
      estado.chamadas.push({ nome, args });
      if (estado.erro) return { data: null, error: estado.erro };
      const resp = estado.resposta;
      return {
        data:
          typeof resp === "function"
            ? (resp as (a: unknown) => unknown)(args)
            : resp,
        error: null,
      };
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

describe("fetchAuthTimes: uma query, sem varredura", () => {
  beforeEach(() => {
    estado.chamadas.length = 0;
    estado.resposta = null;
    estado.erro = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("chama admin_auth_times UMA vez e monta o mapa", async () => {
    estado.resposta = [
      {
        user_id: "a",
        last_sign_in_at: "2026-08-30T10:00:00Z",
        created_at: "2026-01-02T00:00:00Z",
      },
      {
        user_id: "b",
        last_sign_in_at: null,
        created_at: "2026-02-03T00:00:00Z",
      },
    ];

    const mapa = await fetchAuthTimes();

    expect(estado.chamadas).toHaveLength(1);
    expect(estado.chamadas[0].nome).toBe("admin_auth_times");
    expect(mapa.size).toBe(2);
    expect(mapa.get("a")).toEqual({
      lastSignInAt: "2026-08-30T10:00:00Z",
      createdAt: "2026-01-02T00:00:00Z",
    });
    expect(mapa.get("b")).toEqual({
      lastSignInAt: null,
      createdAt: "2026-02-03T00:00:00Z",
    });
  });

  it("erro REJEITA, e nunca devolve mapa vazio", async () => {
    // Mapa vazio faria a retencao publicar zeros como se fossem medicao.
    estado.erro = { message: "permission denied for function", code: "42501" };

    await expect(fetchAuthTimes()).rejects.toThrow();
    const err = await fetchAuthTimes().catch((e) => e);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { cause?: unknown }).cause).toBeInstanceOf(Error);
    expect((err as { context?: { pgCode?: string } }).context?.pgCode).toBe(
      "42501",
    );
  });

  it("data que NAO e array rejeita, em vez de mapa vazio", async () => {
    estado.resposta = null;

    await expect(fetchAuthTimes()).rejects.toThrow();

    const err = await fetchAuthTimes().catch((e) => e);
    expect((err as { statusCode?: number }).statusCode).toBe(500);
    expect((err as { context?: Record<string, unknown> }).context).toEqual({
      op: "admin_auth_times",
      recebido: "object",
    });
  });

  it("resposta vazia e um mapa vazio legitimo, sem erro", async () => {
    estado.resposta = [];
    const mapa = await fetchAuthTimes();
    expect(mapa.size).toBe(0);
  });
});
