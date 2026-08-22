import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TOKEN MEDIDO E CUSTO POR CARACTERE NAO PODEM COEXISTIR NA MESMA LINHA.
 *
 * O defeito (achado 3 da investigacao da Fase 4): `server/routes/ai.ts` e
 * `server/routes/agent.ts` gravavam `input_tokens` REAIS, lidos do `usage` da
 * OpenAI, ao lado de um `cost_estimate` calculado por CARACTERES. Os dois campos
 * da MESMA linha discordavam entre si, e nada acusava: cada um sozinho parecia
 * plausivel, e so quem fosse recalcular o custo a partir dos tokens gravados
 * descobriria. Ninguem recalcula.
 *
 * Este arquivo trava as tres coisas que fecham o buraco:
 *
 *   1. ARITMETICA. Com tokens fornecidos, o custo gravado e exatamente a formula
 *      dos MESMOS tokens, com o numero literal calculado a mao no assert;
 *   2. IMPOSSIBILIDADE. Nao existe forma de pedir "token medido com custo de
 *      caractere". A prova e por construcao do tipo, e esta descrita abaixo;
 *   3. TOTALIDADE. A lista de call sites que informam custo e conferida por
 *      igualdade de CONJUNTO contra o grep real da fonte. Call site novo sem
 *      classificacao quebra este arquivo.
 *
 * Nada de rede, nada de banco: o supabase esta dublado e guarda a linha escrita.
 */

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return { ...real, env: { ...real.env } };
});

interface LinhaGravada {
  input_tokens?: number;
  output_tokens?: number;
  cost_estimate?: number;
  model?: string;
}

let gravada: LinhaGravada | null = null;

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
      insert: async (payload: LinhaGravada) => {
        gravada = payload;
        return { error: null };
      },
    }),
  },
}));

import { custoDaLinha, estimateCostFromTokens, MODEL_PRICING } from "./aiTools";
import { logAiUsage } from "./aiUsage";
import { DEFAULT_MODEL } from "./openai";

const USUARIO = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  gravada = null;
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function escrever(
  custo: Parameters<typeof logAiUsage>[0]["custo"],
  extra: { inputChars?: number; outputChars?: number; model?: string } = {},
): Promise<LinhaGravada> {
  await logAiUsage({
    userId: USUARIO,
    tool: "ferramenta-de-teste",
    requestId: "req-1",
    status: "success",
    ...extra,
    custo,
  });
  if (!gravada) throw new Error("nada foi gravado");
  return gravada;
}

describe("1. ARITMETICA: o custo gravado e a formula dos tokens gravados", () => {
  it("o numero literal bate, calculado a mao a partir da tabela de precos", async () => {
    // gpt-4o-mini: 0,15 por milhao de entrada, 0,60 por milhao de saida.
    // 10.000 / 1e6 * 0,15 = 0,0015
    //  1.000 / 1e6 * 0,60 = 0,0006
    //                     = 0,0021
    expect(MODEL_PRICING[DEFAULT_MODEL].inputPerMillion).toBe(0.15);
    expect(MODEL_PRICING[DEFAULT_MODEL].outputPerMillion).toBe(0.6);

    const linha = await escrever({
      tipo: "tokens",
      inputTokens: 10_000,
      outputTokens: 1_000,
    });

    expect(linha.cost_estimate).toBeCloseTo(0.0021, 10);
    expect(linha.input_tokens).toBe(10_000);
    expect(linha.output_tokens).toBe(1_000);
  });

  it("os CARACTERES da mesma linha nao influenciam o custo quando ha tokens", async () => {
    // O coracao do defeito: a linha carregava chars E tokens, e o custo saia dos
    // chars. Aqui os chars sao absurdos de proposito; se eles vazarem para a
    // conta, o numero muda e o teste cai.
    const linha = await escrever(
      { tipo: "tokens", inputTokens: 10_000, outputTokens: 1_000 },
      { inputChars: 999_999, outputChars: 999_999 },
    );
    expect(linha.cost_estimate).toBeCloseTo(0.0021, 10);
  });

  it("sem tokens, o fallback por caracteres e usado e DECLARADO", async () => {
    const linha = await escrever(
      { tipo: "chars" },
      { inputChars: 8_000, outputChars: 400 },
    );
    // Tokens ficam ZERO, que aqui significa "nao medi", nao "custou nada".
    expect(linha.input_tokens).toBe(0);
    expect(linha.output_tokens).toBe(0);
    expect(linha.cost_estimate).toBeGreaterThan(0);
  });

  it("sem_estimativa grava zero EXPLICITO, sem inventar numero", async () => {
    const linha = await escrever(
      { tipo: "sem_estimativa" },
      { inputChars: 8_000 },
    );
    expect(linha.cost_estimate).toBe(0);
    expect(linha.input_tokens).toBe(0);
  });

  it("ausencia de `custo` mantem o comportamento das dezenas de call sites antigos", async () => {
    const linha = await escrever(undefined, { inputChars: 8_000 });
    expect(linha.cost_estimate).toBe(0);
    expect(linha.input_tokens).toBe(0);
  });

  it("o modelo da linha e o modelo da conta", async () => {
    const linha = await escrever(
      { tipo: "tokens", inputTokens: 1_000_000, outputTokens: 0 },
      { model: "gpt-4o" },
    );
    // 1 milhao de tokens de entrada em gpt-4o = exatamente o preco por milhao.
    expect(linha.cost_estimate).toBeCloseTo(2.5, 10);
    expect(linha.model).toBe("gpt-4o");
  });
});

describe("2. IMPOSSIBILIDADE: token medido com custo de caractere nao e exprimivel", () => {
  it("toda variante que carrega tokens produz custo DE tokens", () => {
    // A prova estrutural: os tokens so existem dentro da variante `tokens`, e
    // `custoDaLinha` responde a essa variante SEMPRE pela formula de tokens. Nao
    // ha combinacao de argumentos que produza tokens nao-nulos com custo vindo
    // de caracteres, porque nao existe forma de dizer isso. O `tsc` recusa
    // `{ tipo: "chars", inputTokens: 10 }`, e a varredura do teste 3 garante que
    // ninguem contorne isso por outro caminho.
    for (const [i, o] of [
      [0, 0],
      [1, 0],
      [10_000, 1_000],
      [123_456, 7_890],
    ]) {
      const comChars = custoDaLinha(
        { tipo: "tokens", inputTokens: i, outputTokens: o },
        999_999,
        999_999,
        DEFAULT_MODEL,
      );
      const semChars = custoDaLinha(
        { tipo: "tokens", inputTokens: i, outputTokens: o },
        0,
        0,
        DEFAULT_MODEL,
      );
      expect(comChars).toBe(semChars);
      expect(comChars).toBe(estimateCostFromTokens(i, o, DEFAULT_MODEL));
    }
  });

  it("`LogAiUsageParams` nao tem mais campo de token nem de custo pronto", () => {
    // Se alguem reintroduzir `inputTokens`/`costEstimate` como campos soltos, a
    // porta do defeito reabre e o `tsc` nao acusa (campo novo e aditivo). Este
    // assert e sobre a FONTE, e e barato.
    const fonte = readFileSync(path.join(AQUI, "aiUsage.ts"), "utf8");
    const params = fonte.slice(
      fonte.indexOf("export interface LogAiUsageParams"),
      fonte.indexOf("export const DETALHE_DE_TENTATIVAS_INDISPONIVEL"),
    );
    expect(params.length).toBeGreaterThan(100);
    expect(params).not.toMatch(/^\s*inputTokens\??:/m);
    expect(params).not.toMatch(/^\s*outputTokens\??:/m);
    expect(params).not.toMatch(/^\s*costEstimate\??:/m);
    expect(params).toMatch(/^\s*custo\?:/m);
  });
});

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "..", "..");

/**
 * Call sites de `logAiUsage` que informam CUSTO, com a fonte declarada de cada.
 *
 * Alterar esta lista e ato deliberado, no commit que mexe no call site: e o
 * mesmo contrato de `EXPECTED_TABLE_COUNT`. O teste abaixo a confronta com o que
 * existe no disco, nos DOIS sentidos.
 */
const CALL_SITES_COM_CUSTO = [
  { arquivo: "server/routes/agent.ts", fontes: ["tokens", "chars"] },
  { arquivo: "server/routes/ai.ts", fontes: ["tokens", "chars"] },
  { arquivo: "server/routes/aiRoadmap.ts", fontes: ["chars"] },
  { arquivo: "server/routes/careerPlan.ts", fontes: ["chars"] },
  { arquivo: "server/routes/linkedin.ts", fontes: ["repassado"] },
  { arquivo: "server/routes/resumeAnalysis.ts", fontes: ["chars"] },
] as const;

/**
 * Os blocos `logAiUsage({ ... })` de um arquivo, com as chaves BALANCEADAS.
 *
 * Um `/custo:/` solto sobre o arquivo inteiro nao serve, e isto foi medido: ele
 * casou a palavra "custo:" dentro de um COMENTARIO em prosa de
 * `server/routes/admin.ts` ("O que sai junto e o custo: cinco count(*)...") e
 * acusou uma rota que nao informa custo nenhum. Regex ampla sobre texto livre e
 * a mesma classe de defeito que este projeto ja documentou varias vezes; aqui
 * ela apareceu do lado que produz falso POSITIVO, que ao menos e barulhento.
 */
function blocosDeLogAiUsage(fonte: string): string[] {
  const blocos: string[] = [];
  const re = /logAiUsage\(\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fonte)) !== null) {
    let i = m.index + m[0].length - 1;
    let profundidade = 0;
    for (; i < fonte.length; i += 1) {
      if (fonte[i] === "{") profundidade += 1;
      else if (fonte[i] === "}") {
        profundidade -= 1;
        if (profundidade === 0) break;
      }
    }
    blocos.push(fonte.slice(m.index, i + 1));
  }
  return blocos;
}

function arquivosDeRota(): string[] {
  const dir = path.join(RAIZ, "server", "routes");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !/\.test\.tsx?$/.test(f))
    .map((f) => path.join("server", "routes", f));
}

describe("3. TOTALIDADE: nenhum call site informa custo sem estar classificado", () => {
  it("o conjunto de arquivos que passam `custo` e exatamente o declarado", () => {
    const naFonte = arquivosDeRota().filter((rel) =>
      blocosDeLogAiUsage(readFileSync(path.join(RAIZ, rel), "utf8")).some((b) =>
        /\bcusto:/.test(b),
      ),
    );
    // Igualdade de CONJUNTO, nos dois sentidos: pega tanto o call site novo que
    // ninguem declarou quanto a declaracao que virou cemiterio.
    expect(new Set(naFonte)).toEqual(
      new Set(CALL_SITES_COM_CUSTO.map((c) => c.arquivo)),
    );
  });

  it("a varredura nao esta vazia (o instrumento nao mediu nada)", () => {
    // Sem isto, um erro de caminho faria a varredura achar zero arquivo e o
    // teste passaria afirmando conjunto vazio contra conjunto vazio.
    expect(arquivosDeRota().length).toBeGreaterThan(10);
    // E o extrator de blocos tem de estar achando blocos de verdade: se ele
    // devolvesse sempre vazio, o conjunto acima seria vazio e a igualdade
    // passaria a exigir uma lista vazia, silenciosamente.
    const total = arquivosDeRota().reduce(
      (n, rel) =>
        n +
        blocosDeLogAiUsage(readFileSync(path.join(RAIZ, rel), "utf8")).length,
      0,
    );
    expect(total).toBeGreaterThan(30);
  });

  it("NENHUMA rota calcula custo por conta propria", () => {
    // A outra metade da fonte unica: depois deste lote, nenhum arquivo de rota
    // pode chamar as funcoes de preco. Quem calcula e o escritor.
    for (const rel of arquivosDeRota()) {
      const fonte = readFileSync(path.join(RAIZ, rel), "utf8");
      expect(
        /\bestimateCost\s*\(|\bestimateCostFromTokens\s*\(/.test(fonte),
        `${rel} ainda calcula custo no call site`,
      ).toBe(false);
    }
  });
});
