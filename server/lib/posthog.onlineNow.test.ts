import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PRESENCA AGORA: os tres estados, e o que NAO pode aparecer em cada um.
 *
 * O valor deste arquivo esta nos controles negativos, nao no caminho feliz. A
 * regra da casa e que ausencia e estado NOMEADO, e a forma de ela falhar aqui e
 * silenciosa: um `catch` que devolvesse `{ online: 0, hojePessoas: 0 }` produz
 * um card plausivel ("ninguem online agora") e indistinguivel do certo. Entao os
 * testes de erro afirmam que NENHUM numero sai, nao so que o estado e "error".
 *
 * `./env` e mockado porque no CI nao existe `.env` e o job `qualidade` nao
 * recebe secret nenhum.
 */

const envState = vi.hoisted(() => ({
  apiKey: "phx_teste",
  projectId: "411657",
  host: "https://us.posthog.com",
}));

vi.mock("./env", () => ({
  env: {
    get posthogApiKey() {
      return envState.apiKey;
    },
    get posthogProjectId() {
      return envState.projectId;
    },
    get posthogHost() {
      return envState.host;
    },
  },
}));

import { contarAtividadeAgora } from "./posthog";

function respostaHogql(results: unknown): Response {
  return new Response(
    JSON.stringify({ results, columns: ["online", "hoje"] }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

beforeEach(() => {
  envState.apiKey = "phx_teste";
  envState.projectId = "411657";
  envState.host = "https://us.posthog.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("contarAtividadeAgora", () => {
  it("resposta com os dois numeros vira state ok com ambos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([[9, 1253]]));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await contarAtividadeAgora();

    expect(resultado).toEqual({
      state: "ok",
      atividade: { online: 9, hojePessoas: 1253 },
    });
    // UMA query, nao duas: os dois agregados saem da mesma leitura.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("zero e um valor MEDIDO e passa como zero", async () => {
    // CONTROLE do controle: sem este teste, "erro nunca devolve numero" seria
    // compativel com "zero nunca aparece", e um site de madrugada legitimamente
    // vazio ficaria indistinguivel de falha.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([[0, 0]]));
    vi.stubGlobal("fetch", fetchMock);

    expect(await contarAtividadeAgora()).toEqual({
      state: "ok",
      atividade: { online: 0, hojePessoas: 0 },
    });
  });

  it("erro HTTP do PostHog vira state error, SEM numero nenhum", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await contarAtividadeAgora();

    expect(resultado.state).toBe("error");
    if (resultado.state !== "error") throw new Error("estado inesperado");
    expect(resultado.httpStatus).toBe(403);
    // O QUE NAO PODE ESTAR LA. `toEqual` sobre o objeto inteiro nao serve:
    // ele passaria com uma chave `atividade` extra se alguem a acrescentasse.
    expect("atividade" in resultado).toBe(false);
    expect(JSON.stringify(resultado)).not.toContain("online");
  });

  it("resposta 2xx sem linha nao vira zero", async () => {
    // 200 com `results` vazio e uma resposta que NAO responde. Zero aqui seria
    // lido como "ninguem no site", que e uma afirmacao que ninguem mediu.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await contarAtividadeAgora();

    expect(resultado.state).toBe("error");
    expect("atividade" in resultado).toBe(false);
  });

  it("env ausente vira not_configured, e lista o que falta", async () => {
    envState.apiKey = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await contarAtividadeAgora();

    expect(resultado).toEqual({
      state: "not_configured",
      missing: ["POSTHOG_API_KEY"],
    });
    // Sem env NAO se bate na rede: o estado e decidido antes.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a janela comeca no inicio do dia civil de BRASILIA, nao em UTC", async () => {
    // As 01h de Brasilia de 17/08 ja e 04h UTC do mesmo dia, e o dia civil
    // comecou as 03:00Z. Uma janela em UTC ("desde 00:00Z de hoje") incluiria
    // as tres horas da noite anterior em Brasilia e inflaria "ativos hoje".
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-17T04:00:00.000Z"));
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([[9, 1253]]));
    vi.stubGlobal("fetch", fetchMock);

    await contarAtividadeAgora();

    const corpo = String(fetchMock.mock.calls[0][1].body);
    expect(corpo).toContain("toDateTime('2026-08-17 03:00:00')");
    expect(corpo).toContain("interval 5 minute");
  });
});
