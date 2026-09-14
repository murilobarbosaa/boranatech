import express from "express";
import { createServer, request } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * POST /api/affiliates/:code/click: contador e evento andam JUNTOS.
 *
 * Nao havia teste desta rota. O que se trava aqui e a regra do lote 01 dos
 * Creators: o evento `click` em creator_events so e gravado quando o clique
 * CONTOU no contador (passou no dedup do Redis e a RPC nao falhou), para a
 * serie por dia bater com `affiliates.clicks`. E o IP nunca vai em claro.
 *
 * O Redis e um duble com a semantica real do `SET NX EX`: a primeira chave da
 * janela devolve "OK", a repetida devolve null. Nenhuma requisicao sai daqui.
 */

const estado = vi.hoisted(() => ({
  env: { creatorEventsSalt: "sal-de-teste" },
  chavesRedis: new Set<string>(),
  redisFalha: false,
  ativos: {} as Record<string, { id: string } | undefined>,
  rpcCalls: [] as Array<{ nome: string; args: Record<string, unknown> }>,
  rpcError: null as { message: string } | null,
  eventos: [] as Array<Record<string, unknown>>,
}));

vi.mock("../lib/env", () => ({ env: estado.env }));

vi.mock("../lib/redis", () => ({
  cacheConnection: {
    set: async (chave: string, ..._resto: unknown[]) => {
      if (estado.redisFalha) throw new Error("ECONNREFUSED");
      if (estado.chavesRedis.has(chave)) return null;
      estado.chavesRedis.add(chave);
      return "OK";
    },
  },
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela !== "affiliates") {
        throw new Error(`tabela inesperada neste arquivo: ${tabela}`);
      }
      const filtros: Record<string, unknown> = {};
      const consulta = {
        select: () => consulta,
        eq: (coluna: string, valor: unknown) => {
          filtros[coluna] = valor;
          return consulta;
        },
        maybeSingle: async () => ({
          data:
            filtros.status === "active"
              ? (estado.ativos[String(filtros.code)] ?? null)
              : null,
          error: null,
        }),
      };
      return consulta;
    },
    rpc: async (nome: string, args: Record<string, unknown>) => {
      estado.rpcCalls.push({ nome, args });
      return { data: null, error: estado.rpcError };
    },
  },
}));

vi.mock("../lib/creatorEvents", () => ({
  recordCreatorEvent: async (input: Record<string, unknown>) => {
    estado.eventos.push(input);
    return { ok: true };
  },
}));

import affiliatesRouter from "./affiliates";

const app = express();
app.use(express.json());
app.use("/api/affiliates", affiliatesRouter);
const servidor = createServer(app);
const pronto = new Promise<void>((resolve) => {
  servidor.listen(0, "127.0.0.1", () => resolve());
});

afterAll(() => {
  servidor.close();
});

/** sha256("sal-de-teste:127.0.0.1"), calculado fora da implementacao. */
const HASH_DO_IP_DE_TESTE =
  "a16db0217b191570a1839d7aa044602723e03ad215aa4c72e1b0b080b60e52a5";

/**
 * `node:http` e nao `fetch`: o teste precisa mandar Referer e User-Agent
 * exatos, e o fetch trata esses cabecalhos de forma propria.
 */
async function clicar(
  codigo: string,
  pathCodificado = "%2Fplanos",
): Promise<{ status: number; body: unknown }> {
  await pronto;
  const porta = (servidor.address() as AddressInfo).port;
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port: porta,
        method: "POST",
        path: `/api/affiliates/${codigo}/click?path=${pathCodificado}`,
        headers: {
          "User-Agent": "Mozilla/5.0 teste",
          Referer: "https://boranatech.com.br/planos?ref=BORA10",
        },
      },
      (res) => {
        let corpo = "";
        res.on("data", (parte) => (corpo += parte));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(corpo) }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const cliquesContados = () =>
  estado.rpcCalls.filter((c) => c.nome === "increment_affiliate_clicks");

beforeEach(() => {
  estado.env.creatorEventsSalt = "sal-de-teste";
  estado.chavesRedis = new Set();
  estado.redisFalha = false;
  estado.ativos = { BORA10: { id: "aff-1" } };
  estado.rpcCalls = [];
  estado.rpcError = null;
  estado.eventos = [];
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("clique que passa no dedup", () => {
  it("incrementa o contador E grava um evento click, com o IP em hash", async () => {
    const r = await clicar("BORA10");

    expect(r).toEqual({ status: 200, body: { recorded: true } });
    expect(cliquesContados()).toEqual([
      { nome: "increment_affiliate_clicks", args: { p_code: "BORA10" } },
    ]);
    expect(estado.eventos).toEqual([
      {
        eventType: "click",
        affiliateId: "aff-1",
        metadata: {
          ip_hash: HASH_DO_IP_DE_TESTE,
          user_agent: "Mozilla/5.0 teste",
          referer: "https://boranatech.com.br/planos?ref=BORA10",
          path: "/planos",
        },
      },
    ]);
    // O IP em claro nao aparece em lugar nenhum do evento.
    expect(JSON.stringify(estado.eventos)).not.toContain("127.0.0.1");
  });

  it("sem CREATOR_EVENTS_SALT o ip_hash e null, nunca o IP em claro", async () => {
    estado.env.creatorEventsSalt = "";

    await clicar("BORA10");

    expect(estado.eventos).toHaveLength(1);
    expect(
      (estado.eventos[0].metadata as Record<string, unknown>).ip_hash,
    ).toBeNull();
    expect(JSON.stringify(estado.eventos)).not.toContain("127.0.0.1");
  });
});

describe("clique que NAO conta nao vira evento", () => {
  it("clique repetido dentro da janela nao incrementa nem grava", async () => {
    await clicar("BORA10");
    const r = await clicar("BORA10");

    expect(r.body).toEqual({ recorded: true });
    expect(cliquesContados()).toHaveLength(1);
    expect(estado.eventos).toHaveLength(1);
  });

  it("codigo inexistente ou inativo: a RPC nao conta, e o evento tambem nao", async () => {
    // A RPC e chamada (ela mesma filtra status = 'active' e responde igual),
    // mas a busca do id usa o mesmo filtro e nao acha nada.
    const r = await clicar("PAUSADO");

    expect(r.body).toEqual({ recorded: true });
    expect(cliquesContados()).toHaveLength(1);
    expect(estado.eventos).toEqual([]);
  });

  it("erro na RPC do contador nao grava evento", async () => {
    estado.rpcError = { message: "timeout" };

    await clicar("BORA10");

    expect(estado.eventos).toEqual([]);
  });
});

describe("Redis indisponivel", () => {
  it("fail-open (comportamento atual): incrementa E grava o evento", async () => {
    estado.redisFalha = true;

    await clicar("BORA10");
    await clicar("BORA10");

    // Sem Redis nao ha dedup: os dois cliques contam. Documentado, nao
    // endossado: e o comportamento que ja existia antes do evento.
    expect(cliquesContados()).toHaveLength(2);
    expect(estado.eventos).toHaveLength(2);
  });
});

describe("path do evento: so caminho relativo ao site", () => {
  const pathDoEvento = () =>
    (estado.eventos[0].metadata as Record<string, unknown>).path;

  it("?path=/planos grava /planos", async () => {
    await clicar("BORA10", "%2Fplanos");

    expect(estado.eventos).toHaveLength(1);
    expect(pathDoEvento()).toBe("/planos");
  });

  it("?path=https://x grava path null, e o clique conta igual", async () => {
    await clicar("BORA10", "https%3A%2F%2Fx");

    expect(cliquesContados()).toHaveLength(1);
    expect(estado.eventos).toHaveLength(1);
    expect(pathDoEvento()).toBeNull();
  });
});
