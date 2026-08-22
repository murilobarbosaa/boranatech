import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

/**
 * CUSTO INTEGRAL POR TENTATIVA (Fase 2, lote 2).
 *
 * O que este arquivo trava: toda tentativa que alcancou a OpenAI vira um evento
 * de contabilizacao, com o desfecho nomeado e com os tokens que a OpenAI
 * mandou, independente de a tentativa ter entregue analise ou nao. Os tres
 * buracos medidos na investigacao da Fase 2:
 *
 *   1. tentativa 1 invalida (9999/888) seguida de tentativa 2 valida
 *      (1111/222) gravava UM evento com 1111/222, e os 9999 tokens pagos
 *      sumiam da conta;
 *   2. duas tentativas falhando nao geravam evento nenhum: a rota gravava
 *      `status error` sem token e sem custo, no exato caso em que se pagou
 *      duas chamadas e nao se entregou nada;
 *   3. truncamento por `finish_reason: "length"` trazia `usage` no corpo e
 *      mesmo assim nao contabilizava.
 *
 * Usage indisponivel e estado NOMEADO, nunca zero: `0 tokens medidos` e
 * `nao deu para medir` sao fatos diferentes e o painel precisa separar os dois.
 *
 * Toda prova aqui e com `fetchWithTimeout` dublado: nenhuma requisicao sai.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import { custoDaLinha, estimateCostFromTokens } from "./aiTools";
import * as http from "./http";
import { UpstreamTimeoutError } from "./http";
import {
  analyzeLinkedin,
  camposDeUsoDaAnalise,
  type AnalyzeAiIo,
  type CamposDeUsoDaAnalise,
} from "./linkedinAnalyze";
import { DEFAULT_MODEL } from "./openai";

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
${"Sou desenvolvedora front-end construindo interfaces de produto para times distribuidos. ".repeat(4)}
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React para 12 squads internos e acompanhei metricas de qualidade durante os ciclos de entrega do produto.`;

/** Perfil quase vazio: o atalho caloroso nao chama a IA. */
const PERFIL_QUASE_VAZIO = `Contato
teste@email.com
Fulana Teste`;

function pedido(profileText: string): LinkedinAnalyzeRequest {
  return {
    profileText,
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "React, TypeScript",
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
  } as LinkedinAnalyzeRequest;
}

const QUALITATIVE = {
  resumo: "Resumo de teste.",
  pontosFortes: ["Ponto um.", "Ponto dois.", "Ponto tres."],
  pontosFracos: ["Fraco um.", "Fraco dois.", "Fraco tres."],
  melhorias: [
    { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
    { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
    { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
    { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
  ],
  proximoPasso: "Proximo passo de teste.",
  headlines: [
    "Front-end | React | foco em produto",
    "Front-end | TypeScript | foco em produto",
    "Front-end | React | design system",
  ],
  sobreReescrito: "Sobre de teste.",
  bulletsReescritos: [],
  skillsParaEstudar: [],
  modeloMensagemRecrutador: "Mensagem de teste.",
};

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

function resposta(
  usage: Usage | undefined,
  content = JSON.stringify(QUALITATIVE),
  finish = "stop",
): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ finish_reason: finish, message: { content } }],
      usage,
    }),
    text: async () => "",
  } as unknown as Response;
}

function respostaHttpErro(status: number, corpo: unknown): Response {
  return {
    ok: false,
    status,
    json: async () => corpo,
    text: async () => JSON.stringify(corpo),
  } as unknown as Response;
}

/** Roda a analise inteira e devolve os eventos por tentativa mais os totais. */
async function medir(profileText: string) {
  const tentativas: AnalyzeAiIo[] = [];
  let erro: unknown = null;
  try {
    await analyzeLinkedin(pedido(profileText), (io) => tentativas.push(io));
  } catch (err) {
    erro = err;
  }
  return { tentativas, campos: camposDeUsoDaAnalise(tentativas), erro };
}

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * O CUSTO QUE A COLUNA VAI RECEBER, pela MESMA funcao que o escritor usa.
 *
 * As assercoes deste arquivo afirmavam `campos.costEstimate`, um numero que a
 * funcao devolvia pronto. Na Fase 4 a decisao passou a viajar em vez do numero
 * (`campos.custo`), e quem calcula e `logAiUsage`. Elas NAO estao afirmando
 * menos: resolvendo aqui pelo mesmo `custoDaLinha`, o que se afirma e o valor
 * que de fato aterrissa em `ai_usage_logs.cost_estimate`, ponta a ponta, em vez
 * de um intermediario que ninguem persiste mais.
 */
function custoGravado(campos: CamposDeUsoDaAnalise): number {
  return custoDaLinha(
    campos.custo,
    campos.inputChars,
    campos.outputChars,
    DEFAULT_MODEL,
  );
}

describe("1. sucesso em uma tentativa (nao regressao)", () => {
  it("grava os mesmos totais de antes da mudanca, com contagem 1", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta({ prompt_tokens: 1111, completion_tokens: 222 }),
    );
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect(erro).toBeNull();
    expect(tentativas).toHaveLength(1);
    expect(tentativas[0].tentativa).toBe(1);
    expect(tentativas[0].desfecho).toBe("sucesso");
    expect(tentativas[0].uso).toEqual({
      medido: true,
      inputTokens: 1111,
      outputTokens: 222,
    });

    expect(campos.tentativas).toBe(1);
    expect(campos.inputTokens).toBe(1111);
    expect(campos.outputTokens).toBe(222);
    expect(campos.tokensMedidos).toBe(true);
    // A conta de custo do caminho de sucesso e a MESMA de antes: tokens exatos
    // quando existem. Se este numero mudar, o painel muda de valor sem aviso.
    expect(custoGravado(campos)).toBe(
      estimateCostFromTokens(1111, 222, DEFAULT_MODEL),
    );
    expect(campos.inputChars).toBeGreaterThan(0);
    expect(campos.outputChars).toBe(JSON.stringify(QUALITATIVE).length);
  });
});

describe("2. tentativa invalida seguida de tentativa valida", () => {
  it("soma as duas: 11110 de entrada, 1110 de saida, contagem 2", async () => {
    let n = 0;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { prompt_tokens: 9999, completion_tokens: 888 },
            "{ isto nao e json",
          )
        : resposta({ prompt_tokens: 1111, completion_tokens: 222 });
    });
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect(erro).toBeNull();
    expect(tentativas.map((t) => t.desfecho)).toEqual([
      "json_invalido",
      "sucesso",
    ]);
    // O NUMERO QUE SUMIA: 9999 + 1111.
    expect(campos.inputTokens).toBe(11110);
    expect(campos.outputTokens).toBe(1110);
    expect(campos.tentativas).toBe(2);
    expect(custoGravado(campos)).toBe(
      estimateCostFromTokens(11110, 1110, DEFAULT_MODEL),
    );
    // A TRILHA SAIU, e o que ela dizia continua afirmado aqui.
    //
    // Ela era uma RENDERIZACAO em texto de fatos que este teste ja afirma por
    // estrutura: os desfechos das duas tentativas (acima) e os tokens de cada
    // uma (abaixo). Desde a Fase 3 a rota grava esses mesmos fatos integros em
    // `ai_usage_logs.attempt_details`, e o campo de texto deixou de ter
    // consumidor. Afirmar a string espremida seria travar um formato que
    // ninguem le mais; o que precisa continuar verdadeiro e o dado por
    // tentativa, e e ele que esta abaixo.
    expect(tentativas.map((t) => t.uso)).toEqual([
      { medido: true, inputTokens: 9999, outputTokens: 888 },
      { medido: true, inputTokens: 1111, outputTokens: 222 },
    ]);
  });
});

describe("3. duas tentativas falhando", () => {
  it("a linha de ERRO leva os tokens medidos das duas e o custo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta({ prompt_tokens: 5000, completion_tokens: 500 }, "{ invalido"),
    );
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect(erro).toBeInstanceOf(Error);
    expect(tentativas).toHaveLength(2);
    expect(tentativas.map((t) => t.desfecho)).toEqual([
      "json_invalido",
      "json_invalido",
    ]);
    // Antes: nenhum evento, linha de erro sem token e custo zero. Duas chamadas
    // pagas apareciam de graca, exatamente no pior caso.
    expect(campos.inputTokens).toBe(10000);
    expect(campos.outputTokens).toBe(1000);
    expect(campos.tentativas).toBe(2);
    expect(custoGravado(campos)).toBeGreaterThan(0);
    expect(custoGravado(campos)).toBe(
      estimateCostFromTokens(10000, 1000, DEFAULT_MODEL),
    );
  });
});

describe("4. resposta truncada", () => {
  it("contabiliza o usage que veio e nao retenta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchDublado = vi
      .spyOn(http, "fetchWithTimeout")
      .mockResolvedValue(
        resposta(
          { prompt_tokens: 7000, completion_tokens: 4000 },
          '{"resumo":"cor',
          "length",
        ),
      );
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect((erro as Error).name).toBe("LinkedinTruncatedError");
    // Truncamento e deterministico: continua sem retry, como antes.
    expect(fetchDublado).toHaveBeenCalledTimes(1);
    expect(tentativas).toHaveLength(1);
    expect(tentativas[0].desfecho).toBe("truncada");
    expect(campos.inputTokens).toBe(7000);
    expect(campos.outputTokens).toBe(4000);
    expect(campos.tokensMedidos).toBe(true);
    expect(custoGravado(campos)).toBeGreaterThan(0);
    // O conteudo cortado tambem foi pago, entao os chars dele contam.
    expect(campos.outputChars).toBe('{"resumo":"cor'.length);
  });
});

describe("5. 401 na primeira tentativa", () => {
  it("registra uma tentativa http_erro, sem retry e sem inventar tokens", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchDublado = vi
      .spyOn(http, "fetchWithTimeout")
      .mockResolvedValue(
        respostaHttpErro(401, { error: { code: "invalid_api_key" } }),
      );
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect(erro).toBeInstanceOf(Error);
    // Credencial invalida e permanente: a segunda tentativa colheria o mesmo.
    expect(fetchDublado).toHaveBeenCalledTimes(1);
    expect(tentativas).toHaveLength(1);
    expect(tentativas[0].desfecho).toBe("http_erro");
    // Corpo de erro da OpenAI nao carrega usage. Estado NOMEADO, nao zero.
    expect(tentativas[0].uso).toEqual({
      medido: false,
      motivo: "corpo_de_erro",
    });
    expect(campos.tokensMedidos).toBe(false);
    // A trilha dizia "1 tentativa, http_erro, sem tokens (corpo_de_erro)". As
    // tres partes seguem afirmadas: a contagem aqui, o desfecho e o motivo
    // nomeado logo acima, por estrutura em vez de por texto.
    expect(campos.tentativas).toBe(1);
    // Sem medicao e sem saida, custo nao e estimado: numero plausivel aqui
    // seria indistinguivel de um custo real.
    expect(custoGravado(campos)).toBe(0);
  });
});

describe("6. timeout", () => {
  it("registra as tentativas com usage indisponivel NOMEADO, nunca zero medido", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(http, "fetchWithTimeout").mockRejectedValue(
      new UpstreamTimeoutError("openai", 45_000),
    );
    const { tentativas, campos, erro } = await medir(PERFIL);

    expect((erro as Error).name).toBe("UpstreamTimeoutError");
    expect(tentativas).toHaveLength(2);
    expect(tentativas.map((t) => t.desfecho)).toEqual(["timeout", "timeout"]);
    for (const t of tentativas) {
      expect(t.uso).toEqual({ medido: false, motivo: "sem_resposta" });
      expect(t.outputChars).toBeUndefined();
    }
    // A distincao que o zero sozinho nao carrega: nao houve medicao.
    expect(campos.tokensMedidos).toBe(false);
    expect(campos.inputTokens).toBe(0);
    // O `sem tokens (sem_resposta)` que a trilha carregava em texto ja esta
    // afirmado por tentativa no laco acima, para as DUAS, o que e mais forte
    // que o `toContain` de uma ocorrencia.
    expect(campos.tentativas).toBe(2);
    expect(custoGravado(campos)).toBe(0);
    // As duas tentativas enviaram o prompt, e isso continua registrado.
    expect(campos.inputChars).toBeGreaterThan(0);
  });
});

describe("resposta 200 sem o objeto usage", () => {
  it("cai no fallback por chars e nomeia a ausencia da medicao", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(resposta(undefined));
    const { campos, tentativas } = await medir(PERFIL);

    expect(tentativas[0].uso).toEqual({
      medido: false,
      motivo: "ausente_no_corpo",
    });
    expect(campos.tokensMedidos).toBe(false);
    // Houve saida do modelo, entao a estimativa por chars continua valendo:
    // e o mesmo fallback que o caminho de sucesso ja usava.
    expect(custoGravado(campos)).toBeGreaterThan(0);
  });
});

describe("atalho sem IA", () => {
  it("perfil quase vazio nao gera tentativa, nem custo", async () => {
    const fetchDublado = vi.spyOn(http, "fetchWithTimeout");
    const { tentativas, campos, erro } = await medir(PERFIL_QUASE_VAZIO);

    expect(erro).toBeNull();
    expect(fetchDublado).not.toHaveBeenCalled();
    expect(tentativas).toEqual([]);
    expect(campos).toEqual({
      tentativas: 0,
      inputChars: 0,
      outputChars: 0,
      inputTokens: 0,
      outputTokens: 0,
      tokensMedidos: false,
      // O atalho sem IA nao teve medicao NEM saida em que basear estimativa, e
      // agora isso e dito com nome. Antes era um `costEstimate: 0`, e zero e
      // ambiguo: nao distingue "nao ha o que estimar" de "estimei e deu zero".
      custo: { tipo: "sem_estimativa" },
    });
  });
});
