import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O LOTE MENSAL (regras R2, R3 e R5), pelo `executarLoteMensal` real e pela
 * fila real (`enqueueFiscalInvoice`); banco e BullMQ dublados.
 *
 * O duble do banco APLICA os filtros que o lote usa (`eq`, `lte`), inclusive
 * no update condicional: e a condicao `status = 'awaiting_batch'` que torna o
 * lote idempotente, e um duble que a ignorasse provaria a coisa errada.
 */

const estado = vi.hoisted(() => ({
  linhas: [] as Array<Record<string, unknown>>,
  jobs: [] as Array<{ nome: string; dados: unknown; opcoes: unknown }>,
}));

vi.mock("./env", () => ({ env: { nfseEnabled: true, redisUrl: "" } }));
vi.mock("./redis", () => ({ queueConnection: {}, cacheConnection: null }));
vi.mock("bullmq", () => ({
  Queue: class {
    async add(nome: string, dados: unknown, opcoes: unknown) {
      // jobId deterministico: o BullMQ ignora add de jobId repetido.
      const id = (opcoes as { jobId: string }).jobId;
      if (
        !estado.jobs.some((j) => (j.opcoes as { jobId: string }).jobId === id)
      ) {
        estado.jobs.push({ nome, dados, opcoes });
      }
      return {};
    }
  },
  Worker: class {},
}));
vi.mock("./queue", () => ({ enqueueEmail: async () => {} }));

vi.mock("./supabaseAdmin", () => {
  function consulta() {
    const filtros: Array<(l: Record<string, unknown>) => boolean> = [];
    let patch: Record<string, unknown> | null = null;
    let limite = Infinity;
    const q: Record<string, unknown> = {
      select: () => q,
      order: () => q,
      limit: (n: number) => {
        limite = n;
        return q;
      },
      update: (p: Record<string, unknown>) => {
        patch = p;
        return q;
      },
      eq: (c: string, v: unknown) => {
        filtros.push((l) => l[c] === v);
        return q;
      },
      lte: (c: string, v: string) => {
        filtros.push((l) => typeof l[c] === "string" && (l[c] as string) <= v);
        return q;
      },
      then: (resolve: (v: unknown) => unknown) => {
        const alvo = estado.linhas
          .filter((l) => filtros.every((f) => f(l)))
          .slice(0, limite);
        if (patch) for (const l of alvo) Object.assign(l, patch);
        return Promise.resolve(
          resolve({
            data: patch
              ? alvo.map((l) => ({ id: l.id }))
              : alvo.map((l) => ({ ...l })),
            error: null,
          }),
        );
      },
    };
    return q;
  }
  return { supabaseAdmin: { from: () => consulta() } };
});

import { executarLoteMensal } from "./fiscalLote";

function linha(
  id: string,
  over: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id,
    charge_key: `stripe:${id}`,
    status: "awaiting_batch",
    competencia: "2026-10-10",
    amount_cents: 2990,
    refunded_cents: 0,
    ...over,
  };
}

beforeEach(() => {
  estado.jobs = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("executarLoteMensal", () => {
  it("enfileira as notas do mes e deixa as do mes seguinte", async () => {
    estado.linhas = [
      linha("ch_out", { competencia: "2026-10-31" }),
      linha("ch_nov", { competencia: "2026-11-01" }),
    ];

    const r = await executarLoteMensal("2026-10");

    expect(r).toEqual({
      mes: "2026-10",
      enfileiradas: 1,
      dispensadas_estorno_integral: 0,
    });
    expect(estado.jobs).toEqual([
      {
        nome: "issue",
        dados: { kind: "issue", chargeKey: "stripe:ch_out" },
        opcoes: { jobId: "issue-stripe-ch_out" },
      },
    ]);
    expect(estado.linhas[0].status).toBe("pending");
    expect(estado.linhas[1].status).toBe("awaiting_batch");
  });

  it("venda de mes anterior que ficou para tras entra no lote seguinte", async () => {
    // Venda de 31/10 registrada depois do lote de outubro: sai no de novembro,
    // com a competencia de outubro intacta.
    estado.linhas = [linha("ch_atrasada", { competencia: "2026-10-31" })];

    const r = await executarLoteMensal("2026-11");

    expect(r.enfileiradas).toBe(1);
    expect(estado.linhas[0]).toMatchObject({
      status: "pending",
      competencia: "2026-10-31",
    });
  });

  it("rodar DUAS vezes nao duplica", async () => {
    estado.linhas = [linha("ch_a"), linha("ch_b")];

    const primeira = await executarLoteMensal("2026-10");
    const segunda = await executarLoteMensal("2026-10");

    expect(primeira.enfileiradas).toBe(2);
    expect(segunda).toEqual({
      mes: "2026-10",
      enfileiradas: 0,
      dispensadas_estorno_integral: 0,
    });
    expect(estado.jobs).toHaveLength(2);
  });

  it("estorno integral antes do lote NAO emite, com motivo proprio", async () => {
    estado.linhas = [linha("ch_estornada", { refunded_cents: 2990 })];

    const r = await executarLoteMensal("2026-10");

    expect(r.dispensadas_estorno_integral).toBe(1);
    expect(r.enfileiradas).toBe(0);
    expect(estado.jobs).toEqual([]);
    expect(estado.linhas[0]).toMatchObject({
      status: "skipped",
      error_code: "estorno_integral_antes_da_emissao",
    });
  });

  it("estorno parcial segue para a fila (o worker emite pelo liquido)", async () => {
    estado.linhas = [linha("ch_parcial", { refunded_cents: 1000 })];

    const r = await executarLoteMensal("2026-10");

    expect(r.enfileiradas).toBe(1);
    expect(estado.linhas[0].status).toBe("pending");
  });

  it("nao toca linha fora de 'awaiting_batch'", async () => {
    estado.linhas = [linha("ch_emitida", { status: "issued" })];

    const r = await executarLoteMensal("2026-10");

    expect(r.enfileiradas).toBe(0);
    expect(estado.linhas[0].status).toBe("issued");
    expect(estado.jobs).toEqual([]);
  });
});
