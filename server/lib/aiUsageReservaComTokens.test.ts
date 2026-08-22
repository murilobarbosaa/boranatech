import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Gravar TOKENS numa linha de erro muda alguma coisa na cota da pessoa?
 *
 * O lote 2 da Fase 2 passou a mandar `inputTokens`, `outputTokens` e
 * `costEstimate` tambem no ramo de erro da rota do LinkedIn. A pergunta que
 * este arquivo fecha e a unica que importa para o usuario: a reserva continua
 * sendo devolvida, e a cota diaria continua no mesmo lugar?
 *
 * Quem roda aqui e o `logAiUsage` REAL, com um duble de supabase que guarda o
 * update. As duas regras de contagem estao modeladas a partir do SQL das
 * migrations, e a assercao e sobre elas:
 *
 *   - `get_ai_usage_today` conta somente `status = 'success'`;
 *   - `reserve_ai_usage_slot` conta `status in ('success', 'reserved')`.
 *
 * Linha `error` nao entra em nenhuma das duas. Token na linha nao aparece em
 * criterio nenhum das duas contagens, e e isso que este teste trava: se alguem
 * um dia mudar `logAiUsage` para escrever outro status quando houver token, a
 * pessoa perde uma analise do dia por causa de uma falha nossa.
 */

interface Linha {
  id: string;
  status: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_estimate?: number;
}

const linhas: Linha[] = [];

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
    }),
  },
}));

import { estimateCostFromTokens } from "./aiTools";
import { logAiUsage } from "./aiUsage";
import { DEFAULT_MODEL } from "./openai";

/** `get_ai_usage_today`: conta so 'success'. */
const cotaDoDia = () => linhas.filter((l) => l.status === "success").length;

/** `reserve_ai_usage_slot`: conta 'success' e 'reserved'. */
const vagasOcupadas = () =>
  linhas.filter((l) => l.status === "success" || l.status === "reserved")
    .length;

afterEach(() => {
  linhas.length = 0;
  vi.restoreAllMocks();
});

describe("linha de erro COM tokens nao consome cota", () => {
  it("a reserva vira 'error', carrega o custo, e a cota volta ao que era", async () => {
    // Estado inicial: uma analise bem-sucedida hoje e a reserva desta chamada.
    linhas.push({ id: "l1", status: "success" });
    linhas.push({ id: "l2", status: "reserved" });
    expect(cotaDoDia()).toBe(1);
    expect(vagasOcupadas()).toBe(2);

    await logAiUsage({
      userId: "00000000-0000-4000-8000-000000000001",
      tool: "linkedin-analyzer",
      requestId: "req-1",
      status: "error",
      // A mensagem LIMPA, sem a trilha colada por um pipe. Ate a Fase 3 este
      // teste passava a string espremida aqui, reproduzindo a limitacao que o
      // lote do detalhe estruturado removeu: o detalhe por tentativa agora vai
      // em `attempt_details`, e `error_message` carrega so a mensagem. A
      // afirmacao do arquivo nao muda com isso (ela e sobre a COTA, e a cota
      // nao olha para nenhum dos dois campos).
      errorMessage: "Resposta da IA não veio em JSON válido",
      inputChars: 8000,
      outputChars: 20,
      custo: { tipo: "tokens", inputTokens: 10000, outputTokens: 1000 },
    });

    const reserva = linhas.find((l) => l.id === "l2");
    expect(reserva?.status).toBe("error");
    // O custo REAL das duas tentativas ficou gravado.
    expect(reserva?.input_tokens).toBe(10000);
    expect(reserva?.output_tokens).toBe(1000);
    // ESTA EXPECTATIVA AFIRMAVA O DEFEITO, e por isso mudou.
    //
    // Ela dizia `0.002`, um numero escolhido a mao pelo teste e passado pronto
    // ao lado dos tokens. Ele nem batia com os proprios tokens da linha: a conta
    // de 10.000 entrada e 1.000 saida no gpt-4o-mini da 0,0021, nao 0,002. Ou
    // seja, o teste travava a possibilidade de tokens e custo discordarem, que e
    // exatamente o que o lote 3 fecha. Agora o escritor deriva, e o que se
    // afirma e a formula, com o numero literal calculado a mao aqui:
    //   10000/1e6 * 0,15 + 1000/1e6 * 0,60 = 0,0015 + 0,0006 = 0,0021
    expect(reserva?.cost_estimate).toBeCloseTo(0.0021, 10);
    expect(reserva?.cost_estimate).toBe(
      estimateCostFromTokens(10000, 1000, DEFAULT_MODEL),
    );
    // E a pessoa nao pagou por isso com a cota dela: a vaga foi devolvida.
    expect(cotaDoDia()).toBe(1);
    expect(vagasOcupadas()).toBe(1);
  });

  it("sucesso continua ocupando a vaga, com os totais somados", async () => {
    linhas.push({ id: "l1", status: "reserved" });

    await logAiUsage({
      userId: "00000000-0000-4000-8000-000000000001",
      tool: "linkedin-analyzer",
      requestId: "req-2",
      status: "success",
      custo: { tipo: "tokens", inputTokens: 11110, outputTokens: 1110 },
    });

    expect(linhas[0].status).toBe("success");
    expect(linhas[0].input_tokens).toBe(11110);
    // Mesmo motivo do caso acima: o `0.004` que vinha pronto era um numero solto
    // que ninguem conferia contra os tokens da propria linha (a conta da 0,0023325).
    //   11110/1e6 * 0,15 + 1110/1e6 * 0,60 = 0,0016665 + 0,000666 = 0,0023325
    expect(linhas[0].cost_estimate).toBeCloseTo(0.0023325, 10);
    expect(cotaDoDia()).toBe(1);
    expect(vagasOcupadas()).toBe(1);
  });
});
