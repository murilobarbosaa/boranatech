import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DETALHE POR TENTATIVA EM COLUNA ESTRUTURADA (Fase 3, lote 5).
 *
 * A limitacao que este lote fecha: o detalhe de cada tentativa (numero,
 * desfecho classificado, tokens medidos ou o estado nomeado de usage
 * indisponivel, chars) era espremido numa STRING dentro de `error_message`,
 * com teto de 500 caracteres, porque nao havia campo estruturado. O campo do
 * erro carregava a contabilidade da chamada, e somar tokens por desfecho
 * exigiria parsear texto livre em SQL.
 *
 * O que este arquivo trava:
 *   1. o array chega INTEGRO na coluna, nos DOIS caminhos de escrita (a
 *      confirmacao de reserva por UPDATE e o INSERT solto);
 *   2. o estado nomeado de usage indisponivel sobrevive dentro do jsonb, em vez
 *      de virar zero;
 *   3. a leitura e fail-closed: linha antiga (coluna nula) le como o estado
 *      nomeado, nunca como array vazio medido;
 *   4. TOTALIDADE: os desfechos possiveis vem da uniao lida da FONTE.
 *
 * Zero rede: o supabase e dublado e guarda o payload escrito.
 */

interface Linha {
  id: string;
  status: string;
  error_message?: string | null;
  attempt_details?: unknown;
}

const linhas: Linha[] = [];
const inseridos: Array<Record<string, unknown>> = [];
/** Liga a busca de reserva: com `false`, `logAiUsage` cai no INSERT. */
const estado = { temReserva: true };

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return { ...real, env: { ...real.env, openaiApiKey: "sk-de-teste" } };
});

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: (_coluna: string, status: string) => ({
              order: () => ({
                limit: async () => ({
                  data: estado.temReserva
                    ? linhas
                        .filter((l) => l.status === status)
                        .map((l) => ({ id: l.id }))
                    : [],
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
      insert: async (payload: Record<string, unknown>) => {
        inseridos.push(payload);
        return { error: null };
      },
    }),
  },
}));

import {
  DETALHE_DE_TENTATIVAS_INDISPONIVEL,
  lerDetalheDeTentativas,
  logAiUsage,
} from "./aiUsage";
import type { AnalyzeAiIo } from "./linkedinAnalyze";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

const USUARIO = "00000000-0000-4000-8000-000000000001";

/** Duas tentativas reais: a primeira medida, a segunda SEM usage disponivel. */
const TENTATIVAS: AnalyzeAiIo[] = [
  {
    tentativa: 1,
    desfecho: "json_invalido",
    inputChars: 8000,
    outputChars: 20,
    uso: { medido: true, inputTokens: 5000, outputTokens: 500 },
  },
  {
    tentativa: 2,
    desfecho: "timeout",
    inputChars: 8000,
    uso: { medido: false, motivo: "sem_resposta" },
  },
];

beforeEach(() => {
  linhas.length = 0;
  inseridos.length = 0;
  estado.temReserva = true;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("o array chega integro na coluna, nos dois caminhos de escrita", () => {
  it("confirmacao de reserva (UPDATE) grava o detalhe", async () => {
    linhas.push({ id: "l1", status: "reserved" });

    await logAiUsage({
      userId: USUARIO,
      tool: "linkedin-analyzer",
      requestId: "req-1",
      status: "error",
      errorMessage: "Resposta da IA não veio em JSON válido",
      attemptDetails: TENTATIVAS,
    });

    const linha = linhas.find((l) => l.id === "l1");
    expect(linha?.attempt_details).toEqual(TENTATIVAS);
    // `error_message` volta a significar UMA coisa: a mensagem.
    expect(linha?.error_message).toBe("Resposta da IA não veio em JSON válido");
    expect(String(linha?.error_message)).not.toContain("tentativas:");
  });

  it("INSERT solto (sem reserva em voo) grava o detalhe", async () => {
    estado.temReserva = false;

    await logAiUsage({
      userId: USUARIO,
      tool: "linkedin-analyzer",
      requestId: "req-2",
      status: "success",
      attemptDetails: TENTATIVAS,
    });

    expect(inseridos).toHaveLength(1);
    expect(inseridos[0].attempt_details).toEqual(TENTATIVAS);
    expect(inseridos[0].error_message).toBeNull();
  });

  it("sem detalhe passado, a coluna vai NULL, e nao array vazio", async () => {
    // As outras oito ferramentas nao montam tentativa. Elas nao podem passar a
    // afirmar "rodei e nao tive tentativa" so por existirem.
    estado.temReserva = false;

    await logAiUsage({
      userId: USUARIO,
      tool: "github-perfil",
      requestId: "req-3",
      status: "success",
    });

    expect(inseridos[0].attempt_details).toBeNull();
  });

  it("array VAZIO e preservado como vazio, e nao virado em NULL", async () => {
    // O atalho sem IA (perfil quase vazio) nao chama a OpenAI: zero tentativa e
    // uma MEDICAO. Um `|| null` no caminho de escrita colapsaria isso com
    // "nao registrei", e sao coisas diferentes.
    estado.temReserva = false;

    await logAiUsage({
      userId: USUARIO,
      tool: "linkedin-analyzer",
      requestId: "req-4",
      status: "skipped",
      attemptDetails: [],
    });

    expect(inseridos[0].attempt_details).toEqual([]);
    expect(inseridos[0].attempt_details).not.toBeNull();
  });
});

describe("o estado nomeado de usage indisponivel sobrevive ao jsonb", () => {
  it("`medido: false` com motivo chega inteiro, sem virar zero", async () => {
    linhas.push({ id: "l1", status: "reserved" });

    await logAiUsage({
      userId: USUARIO,
      tool: "linkedin-analyzer",
      requestId: "req-5",
      status: "error",
      errorMessage: "falhou",
      attemptDetails: TENTATIVAS,
    });

    // Round-trip pelo JSON, que e o que o jsonb faz de verdade.
    const gravado = JSON.parse(
      JSON.stringify(linhas[0].attempt_details),
    ) as AnalyzeAiIo[];

    expect(gravado[1].uso.medido).toBe(false);
    expect(gravado[1].uso).toEqual({ medido: false, motivo: "sem_resposta" });
    // O que o texto espremido nao conseguia distinguir: zero medido de nao
    // medido. Aqui a distincao e estrutural.
    expect(JSON.stringify(gravado[1].uso)).not.toContain("inputTokens");
  });
});

describe("leitura FAIL-CLOSED", () => {
  it("linha antiga (coluna nula) le como o estado nomeado", async () => {
    // 100% das linhas gravadas antes desta coluna. `[]` seria a afirmacao de
    // que a chamada rodou sem nenhuma tentativa, que ninguem mediu.
    expect(lerDetalheDeTentativas(null)).toBe(
      DETALHE_DE_TENTATIVAS_INDISPONIVEL,
    );
    expect(lerDetalheDeTentativas(undefined)).toBe(
      DETALHE_DE_TENTATIVAS_INDISPONIVEL,
    );
    expect(lerDetalheDeTentativas(null)).not.toEqual([]);
  });

  it("jsonb corrompido ou de outro formato tambem cai no estado nomeado", () => {
    expect(lerDetalheDeTentativas({ tentativa: 1 })).toBe(
      DETALHE_DE_TENTATIVAS_INDISPONIVEL,
    );
    expect(lerDetalheDeTentativas("texto")).toBe(
      DETALHE_DE_TENTATIVAS_INDISPONIVEL,
    );
    expect(lerDetalheDeTentativas(7)).toBe(DETALHE_DE_TENTATIVAS_INDISPONIVEL);
  });

  it("array VAZIO passa como array, porque e medicao legitima", () => {
    expect(lerDetalheDeTentativas([])).toEqual([]);
    expect(lerDetalheDeTentativas([])).not.toBe(
      DETALHE_DE_TENTATIVAS_INDISPONIVEL,
    );
  });

  it("array com conteudo atravessa intacto", () => {
    expect(lerDetalheDeTentativas(TENTATIVAS)).toEqual(TENTATIVAS);
  });
});

describe("TOTALIDADE: os desfechos vem da uniao lida da FONTE", () => {
  it("todo desfecho declarado e gravavel, e o total e afirmado", () => {
    // A uniao e um tipo e some na compilacao. Ler a declaracao de volta do
    // disco e a unica forma de afirmar que o conjunto nao encolheu; e a mesma
    // contramedida de `linkedinLogSemTexto.test.ts` e do resumo de lastro.
    const fonte = readFileSync(path.join(AQUI, "linkedinAnalyze.ts"), "utf8");
    const bloco = fonte
      .slice(fonte.indexOf("export type DesfechoTentativa"))
      .split(";")[0];
    const daFonte = bloco
      .split("\n")
      .map((linha) => linha.trim().match(/^\|\s*"([a-z_]+)"$/)?.[1])
      .filter((t): t is string => t !== undefined);

    // Afirma o TOTAL, nao so a pertinencia: um parser que casasse metade
    // passaria num teste de "todos os que li estao la".
    expect(daFonte.length).toBe(10);
    expect(new Set(daFonte).size).toBe(10);

    // E cada um deles sobrevive ao round-trip do jsonb, com o numero da
    // tentativa preservado. Desfecho novo na uniao entra aqui sozinho.
    const todos: AnalyzeAiIo[] = daFonte.map((desfecho, i) => ({
      tentativa: i + 1,
      desfecho: desfecho as AnalyzeAiIo["desfecho"],
      inputChars: 100,
      uso: { medido: false, motivo: "sem_resposta" },
    }));
    const gravado = JSON.parse(JSON.stringify(todos)) as AnalyzeAiIo[];
    expect(gravado.map((t) => t.desfecho)).toEqual(daFonte);
  });
});
