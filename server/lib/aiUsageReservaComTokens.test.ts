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

import { logAiUsage } from "./aiUsage";

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
      inputTokens: 10000,
      outputTokens: 1000,
      costEstimate: 0.002,
    });

    const reserva = linhas.find((l) => l.id === "l2");
    expect(reserva?.status).toBe("error");
    // O custo REAL das duas tentativas ficou gravado.
    expect(reserva?.input_tokens).toBe(10000);
    expect(reserva?.output_tokens).toBe(1000);
    expect(reserva?.cost_estimate).toBe(0.002);
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
      inputTokens: 11110,
      outputTokens: 1110,
      costEstimate: 0.004,
    });

    expect(linhas[0].status).toBe("success");
    expect(linhas[0].input_tokens).toBe(11110);
    expect(cotaDoDia()).toBe(1);
    expect(vagasOcupadas()).toBe(1);
  });
});
