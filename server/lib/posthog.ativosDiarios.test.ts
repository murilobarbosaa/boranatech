import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ATIVOS POR DIA: a serie de 30 pontos, e o que nao pode virar numero.
 *
 * O peso deste arquivo esta em duas propriedades, e as duas falham em silencio:
 *
 *   1. A serie sai SEMPRE com 30 pontos. O HogQL com `group by` so devolve dia
 *      que teve evento, entao a resposta crua e mais curta que a janela sempre
 *      que houve um dia morto. Se o preenchimento sumir, o grafico encolhe e
 *      passa a mentir sobre o periodo que esta mostrando.
 *
 *   2. Falha NAO vira serie de zeros. Trinta barras zeradas sao um desenho
 *      perfeitamente plausivel de "o site esta vazio", e indistinguivel do
 *      certo. Por isso os testes de erro afirmam que NENHUM ponto sai, nao so
 *      que o estado se chama "error".
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

import { getAtivosDiarios } from "./posthog";

function respostaHogql(results: unknown): Response {
  return new Response(JSON.stringify({ results, columns: ["dia", "ativos"] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Relogio fixo. A serie e ancorada em "hoje", entao sem congelar o tempo as
// datas esperadas mudariam a cada execucao e o teste viraria uma medicao do
// calendario da maquina. 15:00Z e meio do dia em Brasilia: a data de parede e a
// mesma em UTC e no fuso local, entao o teste nao passa a depender de qual dos
// dois o codigo usou por acidente.
const AGORA = new Date("2026-08-20T15:00:00.000Z");

beforeEach(() => {
  envState.apiKey = "phx_teste";
  envState.projectId = "411657";
  envState.host = "https://us.posthog.com";
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getAtivosDiarios", () => {
  it("devolve 30 pontos, terminando hoje e comecando 29 dias antes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r.state).toBe("ok");
    if (r.state !== "ok") return;

    expect(r.pontos.length).toBe(30);
    expect(r.dias).toBe(30);
    expect(r.pontos[0].date).toBe("2026-07-22");
    expect(r.pontos[29].date).toBe("2026-08-20");
    // UMA query para a serie inteira, nao uma por dia.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dia SEM evento vira zero explicito, e o dia com evento mantem o valor", async () => {
    // O caso que motiva o preenchimento no servidor: a resposta traz DOIS dias
    // de trinta. Os outros 28 nao sao desconhecidos, sao vazios, e quem sabe
    // disso e a fonte, que consultou a janela inteira.
    const fetchMock = vi.fn().mockResolvedValue(
      respostaHogql([
        ["2026-08-19", 41],
        ["2026-08-20", 7],
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    if (r.state !== "ok") throw new Error(`esperado ok, veio ${r.state}`);

    const porDia = new Map(r.pontos.map((p) => [p.date, p.ativos]));
    expect(porDia.get("2026-08-19")).toBe(41);
    expect(porDia.get("2026-08-20")).toBe(7);
    expect(porDia.get("2026-08-18")).toBe(0);
    expect(porDia.get("2026-07-22")).toBe(0);
    // Nenhum ponto fica indefinido: 30 pontos, 30 numeros.
    expect(r.pontos.every((p) => typeof p.ativos === "number")).toBe(true);
    expect(r.pontos.length).toBe(30);
  });

  it("a ordem e cronologica, sem depender da ordem da resposta", async () => {
    // O `order by dia` esta na query, mas o preenchimento nao confia nele: ele
    // percorre a janela, nao a resposta. Aqui a resposta chega embaralhada.
    const fetchMock = vi.fn().mockResolvedValue(
      respostaHogql([
        ["2026-08-20", 7],
        ["2026-07-22", 3],
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    if (r.state !== "ok") throw new Error(`esperado ok, veio ${r.state}`);

    const datas = r.pontos.map((p) => p.date);
    expect([...datas].sort()).toEqual(datas);
    expect(r.pontos[0].ativos).toBe(3);
    expect(r.pontos[29].ativos).toBe(7);
  });

  it("zero em TODOS os dias e medicao valida, e passa como ok", async () => {
    // CONTROLE do controle. Sem ele, "erro nunca devolve ponto" seria
    // compativel com "serie zerada nunca aparece", e um mes legitimamente vazio
    // ficaria indistinguivel de falha.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r.state).toBe("ok");
    if (r.state !== "ok") return;
    expect(r.pontos.every((p) => p.ativos === 0)).toBe(true);
  });

  it("erro HTTP vira state error, SEM ponto nenhum", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r.state).toBe("error");
    expect(r).not.toHaveProperty("pontos");
    if (r.state === "error") expect(r.httpStatus).toBe(403);
  });

  it("rede caida vira state error, SEM ponto nenhum", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r.state).toBe("error");
    expect(r).not.toHaveProperty("pontos");
  });

  it("2xx SEM results e erro de fonte, nao um mes vazio", async () => {
    // A distincao que o modulo inteiro defende: resposta que nao responde nao e
    // resposta de zero. Trinta zeros aqui seriam um grafico plausivel construido
    // sobre nada.
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ columns: ["dia", "ativos"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r.state).toBe("error");
    expect(r).not.toHaveProperty("pontos");
  });

  it("sem credencial nao consulta nada e nomeia o que falta", async () => {
    envState.apiKey = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios();
    expect(r).toEqual({
      state: "not_configured",
      missing: ["POSTHOG_API_KEY"],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("`all` SEM o primeiro dia recusa, em vez de chutar uma janela", async () => {
    // Contrato interno. Chutar um inicio devolveria uma serie bem formada de um
    // periodo que ninguem escolheu, que e a familia de erro que este modulo
    // inteiro evita.
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios("all");
    expect(r.state).toBe("error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("`all` agrega por SEMANA e declara a granularidade", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaHogql([
        ["2026-08-02", 2810],
        ["2026-08-09", 7359],
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios("all", "2026-08-05");
    if (r.state !== "ok") throw new Error(`esperado ok, veio ${r.state}`);

    expect(r.granularidade).toBe("semana");
    expect(r.window).toBe("all");
    expect(r.inicio).toBe("2026-08-05");
    // Do domingo da semana do primeiro evento (05/08 e quarta, domingo 02/08)
    // ate o domingo da semana de HOJE, que o relogio congelado fixa em
    // 2026-08-20 (domingo 16/08). Sao tres baldes, nao quatro: a serie termina
    // na semana corrente e nao inventa a seguinte.
    expect(r.pontos.map((p) => p.date)).toEqual([
      "2026-08-02",
      "2026-08-09",
      "2026-08-16",
    ]);
    expect(r.dias).toBe(3);
  });

  it("semana SEM evento vira zero afirmado, como no modo diario", async () => {
    // A mesma propriedade do preenchimento diario, no balde novo: a query so
    // devolve semana com evento, e quem sabe que a janela foi consultada
    // inteira e a fonte.
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respostaHogql([["2026-08-09", 7359]]));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios("all", "2026-08-05");
    if (r.state !== "ok") throw new Error(`esperado ok, veio ${r.state}`);

    const porSemana = new Map(r.pontos.map((p) => [p.date, p.ativos]));
    expect(porSemana.get("2026-08-09")).toBe(7359);
    expect(porSemana.get("2026-08-02")).toBe(0);
    expect(porSemana.get("2026-08-16")).toBe(0);
    expect(r.pontos).toHaveLength(3);
  });

  it("o modo diario continua declarando granularidade `dia`", async () => {
    // CONTROLE: sem ele, "declara semana" seria compativel com "declara semana
    // sempre", e a tela rotularia serie diaria como semanal.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    const r = await getAtivosDiarios("30");
    if (r.state !== "ok") throw new Error(`esperado ok, veio ${r.state}`);
    expect(r.granularidade).toBe("dia");
    expect(r.inicio).toBeUndefined();
  });

  it("a query de `all` usa toStartOfWeek, nao toDate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    await getAtivosDiarios("all", "2026-08-05");
    const corpo = String((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(corpo).toContain("toStartOfWeek(toTimeZone(timestamp");
    expect(corpo).toContain("uniq(distinct_id)");
  });

  it("agrupa pelo dia de BRASILIA, nao pelo dia UTC", async () => {
    // A query carrega o nome do fuso. Sem ele, `toDate(timestamp)` agruparia em
    // UTC e tudo depois das 21h cairia no balde do dia seguinte, deslocando a
    // serie inteira sem sintoma visivel.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    await getAtivosDiarios();
    const corpo = String((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(corpo).toContain("America/Sao_Paulo");
  });

  it("fala o DIALETO do HogQL, nao ClickHouse puro", async () => {
    // Esta serie subiu quebrada em producao com HTTP 400 e o corpo do erro
    // dizendo "Function 'toDate' expects 1 argument, found 2": o fuso como
    // SEGUNDO argumento de toDate e ClickHouse puro, e o parser do HogQL
    // recusa. A forma aceita converte primeiro e extrai o dia depois.
    //
    // O teste anterior nao pegava isso: ele afirmava que o nome do fuso estava
    // na string, e ele estava, no lugar errado. String continha o token certo e
    // a query nao rodava, que e a assinatura de um teste que confere presenca
    // quando a pergunta era de FORMA.
    //
    // `uniq` e a mesma funcao da irma contarAtividadeAgora. Nao e a unica que
    // o HogQL aceita (count(distinct ...) tambem passa, conferido em
    // 2026-08-29), mas divergir de unidade entre dois numeros exibidos na mesma
    // aba e pior que qualquer economia.
    const fetchMock = vi.fn().mockResolvedValue(respostaHogql([]));
    vi.stubGlobal("fetch", fetchMock);

    await getAtivosDiarios();
    const corpo = String((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(corpo).toContain(
      "toDate(toTimeZone(timestamp, 'America/Sao_Paulo'))",
    );
    expect(corpo).toContain("uniq(distinct_id)");
    // CONTROLE NEGATIVO: a forma que o PostHog recusou nao pode voltar.
    expect(corpo).not.toContain("toDate(timestamp,");
  });
});
