import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `Content-Type` só quando há corpo, nos cinco helpers que ficaram de fora.
 *
 * O bug (BUG-37): `express.json()` decide se lê o corpo pelos HEADERS, não pelo
 * método. Um GET com `Content-Type: application/json`, somado ao
 * `Transfer-Encoding: chunked` que a borda do Railway acrescenta a requisição
 * sem `Content-Length`, faz o parser chamar `getRawBody` num stream que já
 * acabou, e sai `InternalServerError: stream is not readable` (Sentry
 * NODE-EXPRESS-B). O `FavoritesContext` foi consertado em julho; estes cinco
 * carregavam o mesmo defeito porque a guarda tinha sido escrita num call site.
 *
 * DOIS NÍVEIS, de propósito, e vale saber o que cada um prova:
 *
 *   1. COMPORTAMENTO, só em `adminFetch`, que é o único dos cinco exportado de
 *      forma direta o bastante para ser chamado sem montar contexto de React.
 *      Este é o teste que de fato observa o header que sai.
 *   2. FONTE, nos cinco, no mesmo formato de
 *      `FavoritesContext.headers.test.ts`: afirma o TOTAL de ocorrências, não a
 *      pertinência. Um `fetch` novo com o header solto muda a contagem e derruba
 *      o teste, mesmo que o funil siga correto. É a contramedida do CLAUDE.md
 *      para o instrumento que encolhe em silêncio.
 *
 * O nível 2 não substitui o 1: ele afirma que a guarda está escrita, não que ela
 * funciona. O nível 1 não substitui o 2: ele cobre um helper de cinco.
 */

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const HELPERS = [
  { nome: "lib/adminApi.ts", fetches: 2 },
  { nome: "services/badgesService.ts", fetches: 1 },
  { nome: "services/studyService.ts", fetches: 1 },
  { nome: "services/userProgressService.ts", fetches: 1 },
  { nome: "services/roadmapCompletionService.ts", fetches: 1 },
];

describe("fonte dos cinco helpers", () => {
  for (const helper of HELPERS) {
    describe(helper.nome, () => {
      const fonte = readFileSync(path.join(RAIZ, helper.nome), "utf8");

      it("condiciona o Content-Type à presença de corpo", () => {
        expect(fonte).toMatch(
          /options\?\.body === undefined\s*\?\s*\{\}\s*:\s*\{\s*"Content-Type": "application\/json"\s*\}/,
        );
      });

      it("não tem Content-Type incondicional sobrando", () => {
        const ocorrencias = fonte.match(/"Content-Type"/g) ?? [];
        expect(
          ocorrencias,
          `esperado exatamente 1 (a do funil condicional), achei ${ocorrencias.length}`,
        ).toHaveLength(1);
      });

      it("todo fetch do módulo passa pelo funil", () => {
        const chamadas = fonte.match(/[^a-zA-Z.]fetch\(/g) ?? [];
        expect(
          chamadas,
          `esperado ${helper.fetches}, achei ${chamadas.length}`,
        ).toHaveLength(helper.fetches);
      });
    });
  }
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "token-de-teste" } },
      }),
    },
  },
}));

function headersDaChamada(chamada: unknown): Record<string, string> {
  const init = (chamada as [string, RequestInit])[1];
  return (init.headers ?? {}) as Record<string, string>;
}

describe("adminFetch: o header que sai de fato", () => {
  const respostaOk = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: null }),
    });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => respostaOk()),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("GET sai SEM Content-Type", async () => {
    const { adminFetch } = await import("@/lib/adminApi");

    await adminFetch("/users");

    const headers = headersDaChamada(vi.mocked(fetch).mock.calls[0]);
    expect(headers["Content-Type"]).toBeUndefined();
    // A credencial continua indo: a correção é sobre o Content-Type, e um
    // helper que parasse de autenticar passaria no assert de cima.
    expect(headers.Authorization).toBe("Bearer token-de-teste");
  });

  it("POST com corpo sai COM Content-Type", async () => {
    const { adminFetch } = await import("@/lib/adminApi");

    await adminFetch("/users", {
      method: "POST",
      body: JSON.stringify({ id: "u1" }),
    });

    const headers = headersDaChamada(vi.mocked(fetch).mock.calls[0]);
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("um Content-Type explícito do chamador continua vencendo", async () => {
    const { adminFetch } = await import("@/lib/adminApi");

    await adminFetch("/import", {
      method: "POST",
      body: "a,b,c",
      headers: { "Content-Type": "text/csv" },
    });

    const headers = headersDaChamada(vi.mocked(fetch).mock.calls[0]);
    expect(headers["Content-Type"]).toBe("text/csv");
  });
});
