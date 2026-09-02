import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A BASE INTEIRA da retencao precisa ser a base inteira.
 *
 * O defeito, medido em producao em 02/09/2026: o `select("user_id")` de
 * `profiles` vinha sem `range`, e o Supabase capa a resposta em 1000 linhas
 * (`content-range: 0-0/8370`). O comentario do codigo dizia "todos os profiles
 * (a base inteira)", e a base inteira eram 12% dela. Nao medimos desde quando
 * estava assim; so que ja estava antes de 02/09/2026.
 *
 * Aqui se afirma o TOTAL, nao a pertinencia: um conjunto menor que o `count`
 * reprova, em vez de virar metrica parcial com cara de completa.
 */

vi.mock("../lib/env", () => ({
  env: { posthogApiKey: "k", posthogProjectId: "1", posthogHost: "https://x" },
}));

const estado = vi.hoisted(() => ({
  paginas: [] as Array<Array<{ user_id: string | null }>>,
  count: null as number | null,
  ranges: [] as Array<[number, number]>,
  authTimes: new Map<
    string,
    { lastSignInAt: string | null; createdAt: string | null }
  >(),
}));

vi.mock("./posthog", () => ({
  getPosthogPersonActivity: async () => ({
    state: "ok",
    persons: [],
  }),
}));

vi.mock("./authUsers", () => ({
  fetchAuthTimes: async () => estado.authTimes,
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      const builder = {
        select: () => builder,
        order: () => builder,
        range: async (from: number, to: number) => {
          estado.ranges.push([from, to]);
          const pagina = estado.paginas[estado.ranges.length - 1] ?? [];
          return { data: pagina, error: null, count: estado.count };
        },
      };
      return builder;
    },
  },
}));

import { getUsageRetention } from "./usageRetention";

function perfil(n: number) {
  return { user_id: `u${String(n).padStart(5, "0")}` };
}

describe("usageRetention: profiles pagina e prova o total", () => {
  beforeEach(() => {
    estado.paginas.length = 0;
    estado.ranges.length = 0;
    estado.count = null;
    estado.authTimes = new Map();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("paginas de 1000, 1000 e 370 com count 2370 varrem os 2370", async () => {
    // 2370 escrito a mao. Cada pessoa entra numa faixa de ultimo acesso, entao a
    // soma das faixas prova quantas foram efetivamente varridas.
    estado.count = 2370;
    estado.paginas = [
      Array.from({ length: 1000 }, (_, i) => perfil(i)),
      Array.from({ length: 1000 }, (_, i) => perfil(1000 + i)),
      Array.from({ length: 370 }, (_, i) => perfil(2000 + i)),
      [],
    ];

    const r = await getUsageRetention();

    expect(r.state).toBe("ok");
    const dados = (
      r as {
        data: {
          baseTotal: number;
          lastAccess: Array<{ key: string; count: number }>;
        };
      }
    ).data;
    expect(dados.baseTotal).toBe(2370);
    // A soma das faixas prova que as 2370 foram efetivamente PERCORRIDAS, e nao
    // so contadas: cada pessoa do laco cai em exatamente uma faixa. Sem isto,
    // um `baseTotal` certo com laco truncado passaria.
    const somaDasFaixas = dados.lastAccess.reduce((a, b) => a + b.count, 0);
    expect(somaDasFaixas).toBe(2370);
    expect(estado.ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2370, 3369],
    ]);
  });

  it("count 2370 com paginas somando 2000 NAO vira metrica parcial", async () => {
    estado.count = 2370;
    estado.paginas = [
      Array.from({ length: 1000 }, (_, i) => perfil(i)),
      Array.from({ length: 1000 }, (_, i) => perfil(1000 + i)),
      [],
    ];

    const r = await getUsageRetention();

    // A funcao trata o erro e devolve estado de erro; o que importa e que NAO
    // devolveu `ok` com 2000 pessoas como se fossem a base.
    expect(r.state).not.toBe("ok");
  });

  it("resposta SEM count nao vira metrica", async () => {
    estado.count = null;
    estado.paginas = [[perfil(1)], []];

    const r = await getUsageRetention();

    expect(r.state).not.toBe("ok");
  });
});
