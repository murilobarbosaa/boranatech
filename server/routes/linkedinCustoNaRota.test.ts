import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

/**
 * A rota /analyze grava mesmo o custo integral, nos DOIS ramos?
 *
 * O arquivo irmao (`server/lib/linkedinCustoPorTentativa.test.ts`) prova que a
 * contabilizacao por tentativa acontece e que os totais fecham. Ele nao prova
 * que a rota USA esses totais, e era exatamente ali que o dado se perdia: a
 * rota lia o ultimo evento e sobrescrevia o anterior, e o ramo de erro nao
 * gravava token nenhum. Aqui o que roda e o router de producao inteiro, com o
 * express real, e a assercao e sobre os argumentos que chegam a `logAiUsage`.
 *
 * O transporte esta dublado em `fetchWithTimeout`, entao nenhuma requisicao sai
 * para a OpenAI. O `fetch` global fica intacto de proposito: e ele que o
 * cliente de teste usa para falar com o servidor efemero.
 */

vi.mock("../lib/env", async (importActual) => {
  const real = await importActual<typeof import("../lib/env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

/** O subconjunto de `LogAiUsageParams` que este teste inspeciona. */
interface ParamsDoLog {
  status: string;
  tool: string;
  inputTokens?: number;
  outputTokens?: number;
  inputChars?: number;
  outputChars?: number;
  costEstimate?: number;
  errorMessage?: string;
}

interface UsuarioDoTeste {
  id: string;
  email: string;
  role: string;
}

vi.mock("../middleware/auth", () => ({
  requireAuth: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { user: UsuarioDoTeste }).user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "teste@boranatech.com.br",
      role: "authenticated",
    };
    next();
  },
  checkProStatus: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { isPro: boolean }).isPro = true;
    next();
  },
}));

const logAiUsage = vi.fn(async (_params: ParamsDoLog) => undefined);
vi.mock("../lib/aiUsage", () => ({
  checkAiDailyLimit: vi.fn(async () => ({ allowed: true, limit: 20, used: 0 })),
  logAiUsage: (params: ParamsDoLog) => logAiUsage(params),
}));

// Persistencia e fail-soft na rota: sem banco ela loga e segue, e o que
// interessa aqui (a chamada a logAiUsage) acontece ANTES dela.
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      throw new Error("sem banco neste teste");
    },
  },
}));

import * as http from "../lib/http";
import { errorHandler } from "../middleware/error";
import linkedinRouter from "./linkedin";

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

const CORPO = {
  profileText: PERFIL,
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  skills: "React, TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "100-500",
  atividade: "semanal",
};

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

function resposta(
  usage: { prompt_tokens: number; completion_tokens: number },
  content = JSON.stringify(QUALITATIVE),
): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ finish_reason: "stop", message: { content } }],
      usage,
    }),
    text: async () => "",
  } as unknown as Response;
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use("/api/linkedin", linkedinRouter);
app.use(errorHandler);
const servidor = createServer(app);
const pronto = new Promise<void>((resolve) =>
  servidor.listen(0, "127.0.0.1", resolve),
);

async function analisar(): Promise<{ status: number }> {
  await pronto;
  const porta = (servidor.address() as AddressInfo).port;
  const r = await fetch(`http://127.0.0.1:${porta}/api/linkedin/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CORPO),
  });
  await r.text();
  return { status: r.status };
}

function linhaGravada(): ParamsDoLog {
  expect(logAiUsage).toHaveBeenCalledTimes(1);
  return logAiUsage.mock.calls[0][0];
}

afterEach(() => {
  vi.restoreAllMocks();
  logAiUsage.mockClear();
});

afterAll(() => {
  servidor.close();
});

describe("a rota grava o custo de TODAS as tentativas", () => {
  it("sucesso de primeira: uma linha, sem trilha, como sempre foi", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta({ prompt_tokens: 1111, completion_tokens: 222 }),
    );
    const { status } = await analisar();
    const linha = linhaGravada();

    expect(status).toBe(200);
    expect(linha.status).toBe("success");
    expect(linha.tool).toBe("linkedin-analyzer");
    expect(linha.inputTokens).toBe(1111);
    expect(linha.outputTokens).toBe(222);
    expect(linha.costEstimate).toBeGreaterThan(0);
    // Sem tentativa perdida nao ha o que contar: a coluna de texto fica nula,
    // exatamente como nas linhas ja gravadas em producao.
    expect(linha.errorMessage).toBeUndefined();
  });

  it("sucesso na segunda tentativa: a linha leva a soma das duas", async () => {
    let n = 0;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(async () => {
      n += 1;
      return n === 1
        ? resposta(
            { prompt_tokens: 9999, completion_tokens: 888 },
            "{ nao e json",
          )
        : resposta({ prompt_tokens: 1111, completion_tokens: 222 });
    });
    const { status } = await analisar();
    const linha = linhaGravada();

    expect(status).toBe(200);
    expect(linha.status).toBe("success");
    // Antes: 1111 e 222, com os 9999 tokens da tentativa 1 fora da conta.
    expect(linha.inputTokens).toBe(11110);
    expect(linha.outputTokens).toBe(1110);
    expect(linha.errorMessage).toBe(
      "tentativas: 2 | 1 json_invalido 9999/888; 2 sucesso 1111/222",
    );
  });

  it("duas tentativas falhando: linha de ERRO com os tokens das duas", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
      resposta({ prompt_tokens: 5000, completion_tokens: 500 }, "{ invalido"),
    );
    const { status } = await analisar();
    const linha = linhaGravada();

    expect(status).toBe(502);
    // A cota NAO muda de semantica: continua 'error', e e esse status que faz
    // a reserva deixar de ocupar vaga. O que mudou foi so o que a linha
    // carrega de custo. A devolucao em si esta provada em
    // server/lib/aiUsageReservaComTokens.test.ts, com o logAiUsage real.
    expect(linha.status).toBe("error");
    expect(linha.inputTokens).toBe(10000);
    expect(linha.outputTokens).toBe(1000);
    expect(linha.costEstimate).toBeGreaterThan(0);
    // A mensagem original continua na frente; a trilha entra depois dela.
    expect(linha.errorMessage).toContain("JSON válido");
    expect(linha.errorMessage).toContain(
      "tentativas: 2 | 1 json_invalido 5000/500; 2 json_invalido 5000/500",
    );
  });

  it("erro antes de qualquer chamada grava zeros, sem trilha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchDublado = vi.spyOn(http, "fetchWithTimeout");
    await pronto;
    const porta = (servidor.address() as AddressInfo).port;
    // Texto longo o bastante para passar no schema e ilegivel para o parser:
    // `analyzeLinkedin` lanca antes de existir tentativa.
    const r = await fetch(`http://127.0.0.1:${porta}/api/linkedin/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...CORPO, profileText: "x ".repeat(200) }),
    });
    await r.text();
    const linha = linhaGravada();

    expect(r.status).toBe(422);
    expect(fetchDublado).not.toHaveBeenCalled();
    expect(linha.status).toBe("error");
    expect(linha.inputTokens).toBe(0);
    expect(linha.costEstimate).toBe(0);
    expect(linha.errorMessage).not.toContain("tentativas:");
  });
});
