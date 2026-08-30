import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O CORPO DA RESPOSTA no erro do PostHog.
 *
 * O que motivou: em 2026-08-29 a serie de ativos subiu com HTTP 400 e o motivo
 * ("Function 'toDate' expects 1 argument, found 2") estava no corpo da resposta
 * o tempo todo. Diagnosticar exigiu refazer a chamada com curl.
 *
 * O corpo JA ia para a `message` antes desta mudanca, e este arquivo trava as
 * duas coisas que faltavam: ele agora e CAMPO (nao um trecho a ser fatiado de
 * uma string formatada para humano) e o corte DECLARA que cortou.
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

import { PosthogQueryError, getAtivosDiarios, recorteDeCorpo } from "./posthog";

const CORPO_REAL =
  '{"type":"validation_error","code":"hogql_query_error","detail":"Function \'toDate\' expects 1 argument, found 2"}';

beforeEach(() => {
  envState.apiKey = "phx_teste";
  envState.projectId = "411657";
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-20T15:00:00.000Z"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("recorteDeCorpo", () => {
  it("corpo curto passa INTEIRO, sem sufixo", () => {
    // CONTROLE: sem isto, "sempre trunca" passaria, e todo diagnostico viria
    // com um aviso de corte que nao aconteceu.
    expect(recorteDeCorpo(CORPO_REAL)).toBe(CORPO_REAL);
    expect(recorteDeCorpo(CORPO_REAL)).not.toContain("truncado");
  });

  it("corpo longo e cortado e o CORTE E DECLARADO", () => {
    // O defeito que isto resolve: o corte de 200 antigo terminava no meio de
    // uma palavra e parecia a resposta inteira. Quem le um trecho sem aviso nao
    // tem como saber que falta coisa.
    const gigante = "x".repeat(5000);
    const r = recorteDeCorpo(gigante);

    expect(r).toContain("truncado");
    expect(r).toContain("5000 caracteres no total");
    expect(r.startsWith("x".repeat(300))).toBe(true);
    // E nao carrega o corpo inteiro para dentro de um log.
    expect(r.length).toBeLessThan(400);
  });

  it("o limite e uma FRONTEIRA, nao um arredondamento", () => {
    // Exatamente no teto passa inteiro; um caractere alem, corta.
    expect(recorteDeCorpo("y".repeat(300))).toBe("y".repeat(300));
    expect(recorteDeCorpo("y".repeat(301))).toContain("truncado");
  });
});

describe("PosthogQueryError", () => {
  it("carrega o corpo como CAMPO, alem de na mensagem", async () => {
    // A prova de ponta a ponta: o corpo do 400 chega ao erro construido no
    // ponto do throw. Sem o campo, quem quisesse logar teria que fatiar a
    // mensagem, que e um parser sobre texto livre.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(CORPO_REAL, {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    // getAtivosDiarios converte para estado nomeado; o erro em si e observado
    // pelo `reason`, que compartilha o MESMO recorte do campo.
    const r = await getAtivosDiarios("30");
    expect(r.state).toBe("error");
    if (r.state !== "error") return;
    expect(r.httpStatus).toBe(400);
    expect(r.reason).toContain("Function 'toDate' expects 1 argument");
  });

  it("corpo LONGO vindo do PostHog chega truncado e declarado", async () => {
    // A LACUNA que este teste fecha, achada por mutacao: os testes de
    // `recorteDeCorpo` chamam a funcao direto, e o de ponta a ponta usava um
    // corpo curto. Trocar `recorteDeCorpo(body)` por um `slice` cru no ponto do
    // throw passava por todos eles. Aqui o corpo e grande, entao o caminho do
    // throw precisa mesmo usar o recorte que declara o corte.
    const gigante = "w".repeat(4000);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(gigante, { status: 500 })),
    );

    const r = await getAtivosDiarios("30");
    expect(r.state).toBe("error");
    if (r.state !== "error") return;
    expect(r.reason).toContain("truncado");
    expect(r.reason).toContain("4000 caracteres no total");
    // E o corpo inteiro NAO vaza para a razao.
    expect(r.reason.length).toBeLessThan(500);
  });

  it("o campo e a mensagem usam o MESMO recorte", () => {
    // Dois cortes de tamanhos diferentes fariam o log e a mensagem discordarem
    // sobre o que o PostHog respondeu, que e a divergencia mais irritante
    // possivel dentro de um diagnostico.
    const recorte = recorteDeCorpo("z".repeat(1000));
    const erro = new PosthogQueryError(`falhou: ${recorte}`, 400, recorte);

    expect(erro.responseBody).toBe(recorte);
    expect(erro.message).toContain(recorte);
    expect(erro.httpStatus).toBe(400);
    expect(erro.name).toBe("PosthogQueryError");
  });
});
