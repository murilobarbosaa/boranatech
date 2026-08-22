import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * UMA REQUISICAO PODE FECHAR A RESERVA DE OUTRA?
 *
 * Ate a Fase 4 lote 5, podia. `acharReserva` seleciona por
 * `(user_id, tool, status = 'reserved')` ordenado por `created_at` ASC com
 * `limit 1`: a MAIS ANTIGA pendente, sem nenhuma nocao de dona. Duas
 * requisicoes do mesmo usuario e da mesma ferramenta em voo, e quem terminasse
 * primeiro fechava a reserva da outra.
 *
 * Dois estragos distintos, e os dois estao reproduzidos aqui:
 *
 *   1. SEQUESTRO POR FALHA. A requisicao B estoura a cota (429), nao reserva
 *      nada, e mesmo assim fecha a reserva da A, que ainda esta rodando. A vaga
 *      de A e liberada no meio do caminho e a linha dela vira o registro da
 *      recusa de B;
 *   2. TROCA DE ATRIBUICAO. A e B reservam e terminam fora de ordem. Cada uma
 *      fecha a reserva da outra, e tokens, custo, `request_id` e detalhe por
 *      tentativa aterrissam na linha errada. A conta da cota fecha; a de quem
 *      gastou o que, nao.
 *
 * O analisador de LinkedIn ficou protegido pela serializacao do lote 2. As
 * outras oito ferramentas nao serializam, e e para elas que este arquivo existe.
 *
 * Storage dublado, nada de rede.
 */

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return { ...real, env: { ...real.env, aiDailyLimitPro: 20 } };
});

interface Linha {
  id: string;
  status: string;
  request_id?: string;
  input_tokens?: number;
}

/** As linhas de `ai_usage_logs`, na ordem de criacao. */
const linhas: Linha[] = [];

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: (_coluna: string, status: string) => ({
              // A ORDENACAO DE PRODUCAO, reproduzida: mais antiga primeiro.
              order: () => ({
                limit: async () => ({
                  data: linhas
                    .filter((l) => l.status === status)
                    .map((l) => ({ id: l.id })),
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: async (_coluna: string, id: string) => {
          const alvo = linhas.find((l) => l.id === id);
          if (alvo) Object.assign(alvo, payload);
          return { error: null };
        },
      }),
      insert: async (payload: Linha) => {
        linhas.push({ ...payload, id: `inserida-${linhas.length + 1}` });
        return { error: null };
      },
    }),
  },
}));

import { logAiUsage } from "./aiUsage";

const USUARIO = "00000000-0000-4000-8000-000000000001";
const TOOL = "github-perfil";

function base(requestId: string) {
  return { userId: USUARIO, tool: TOOL, requestId };
}

beforeEach(() => {
  linhas.length = 0;
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("1. SEQUESTRO POR FALHA: quem nao reservou nao fecha reserva alheia", () => {
  it("B estoura a cota e a reserva de A continua PENDENTE", async () => {
    // A reservou e esta em voo.
    linhas.push({ id: "reserva-de-A", status: "reserved" });

    // B nao conseguiu reservar: a cota estourou. `reservationId` vem `null` de
    // `checkAiDailyLimit`, e e ele que impede a busca.
    await logAiUsage({
      ...base("req-de-B"),
      status: "rate_limited",
      reservationId: null,
    });

    // A RESERVA DE A NAO FOI TOCADA. Este e o assert que falhava antes.
    const deA = linhas.find((l) => l.id === "reserva-de-A");
    expect(deA?.status).toBe("reserved");
    expect(deA?.request_id).toBeUndefined();

    // E B registrou a propria recusa, numa linha propria.
    const deB = linhas.find((l) => l.request_id === "req-de-B");
    expect(deB).toBeDefined();
    expect(deB?.status).toBe("rate_limited");
    expect(linhas).toHaveLength(2);
  });

  it("depois disso, A ainda fecha a PROPRIA reserva", async () => {
    linhas.push({ id: "reserva-de-A", status: "reserved" });
    await logAiUsage({
      ...base("req-de-B"),
      status: "rate_limited",
      reservationId: null,
    });

    await logAiUsage({
      ...base("req-de-A"),
      status: "success",
      reservationId: "reserva-de-A",
      custo: { tipo: "tokens", inputTokens: 1_000, outputTokens: 100 },
    });

    const deA = linhas.find((l) => l.id === "reserva-de-A");
    expect(deA?.status).toBe("success");
    expect(deA?.request_id).toBe("req-de-A");
    expect(deA?.input_tokens).toBe(1_000);
    // Nenhuma linha a mais: A fechou a que ja existia, nao inseriu outra.
    expect(linhas).toHaveLength(2);
  });
});

describe("2. TROCA DE ATRIBUICAO: terminar fora de ordem nao troca as linhas", () => {
  it("B termina primeiro e ainda assim fecha a reserva de B", async () => {
    // A reservou antes de B. Pela ordenacao de producao, a de A e a "mais
    // antiga", e era ela que qualquer um dos dois fechava.
    linhas.push({ id: "reserva-de-A", status: "reserved" });
    linhas.push({ id: "reserva-de-B", status: "reserved" });

    // B termina PRIMEIRO.
    await logAiUsage({
      ...base("req-de-B"),
      status: "success",
      reservationId: "reserva-de-B",
      custo: { tipo: "tokens", inputTokens: 2_000, outputTokens: 200 },
    });
    // A termina depois.
    await logAiUsage({
      ...base("req-de-A"),
      status: "success",
      reservationId: "reserva-de-A",
      custo: { tipo: "tokens", inputTokens: 1_000, outputTokens: 100 },
    });

    // CADA DADO NA SUA LINHA. Sem a identidade, os dois trocavam de lugar.
    const deA = linhas.find((l) => l.id === "reserva-de-A");
    const deB = linhas.find((l) => l.id === "reserva-de-B");
    expect(deA?.request_id).toBe("req-de-A");
    expect(deA?.input_tokens).toBe(1_000);
    expect(deB?.request_id).toBe("req-de-B");
    expect(deB?.input_tokens).toBe(2_000);
    expect(linhas).toHaveLength(2);
  });
});

describe("3. o caminho LEGADO nao mudou", () => {
  it("sem `reservationId`, continua procurando a mais antiga", async () => {
    // Os call sites que nunca passaram por uma reserva seguem como antes:
    // `undefined` mantem a busca por (usuario, ferramenta).
    linhas.push({ id: "reserva-antiga", status: "reserved" });

    await logAiUsage({ ...base("req-legado"), status: "success" });

    const alvo = linhas.find((l) => l.id === "reserva-antiga");
    expect(alvo?.status).toBe("success");
    expect(alvo?.request_id).toBe("req-legado");
    expect(linhas).toHaveLength(1);
  });

  it("sem reserva nenhuma e sem id, insere como sempre inseriu", async () => {
    await logAiUsage({ ...base("req-sozinho"), status: "success" });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].request_id).toBe("req-sozinho");
  });
});
