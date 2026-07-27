import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeLinkedin } from "./linkedinAnalyze";
import { capturados } from "./__mocks__/sentryEspiao";
import * as http from "./http";
import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

/**
 * A camada de lastro AGE no caminho real da rota?
 *
 * Este é o único elo entre o que a série de medições de fidelidade mediu
 * (58 -> 22 -> 3 -> 0) e o que o usuário recebe que nunca tinha sido verificado
 * fora do harness: o harness chama a OpenAI direto e **contorna o app**, então
 * ele prova que a REGRA funciona, não que ela está ligada na rota.
 *
 * Uma execução real com o perfil de fixture não fecha isso sozinha: se o modelo
 * vier limpo, o resultado é "a camada não teve o que fazer", que é compatível
 * com ela estar desligada. Aqui a resposta da IA é injetada COM violação, então
 * a única saída limpa possível é a camada tendo agido.
 */

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

const FIXTURE = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "__fixtures__",
    "linkedin",
    "perfil-real-anonimizado.txt",
  ),
  "utf8",
);

const PEDIDO = {
  profileText: FIXTURE,
  area: "fullstack",
  level: "pleno",
  mercado: "exterior",
  skills: "AI Agents, Vector Databases, Retrieval-Augmented Generation",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "500-mais",
  atividade: "raramente",
} as unknown as LinkedinAnalyzeRequest;

/** Resposta da IA com duas violações plantadas, no formato do schema estrito. */
function respostaComViolacao() {
  const qualitative = {
    resumo: "Resumo de teste.",
    pontosFortes: ["Ponto forte um.", "Ponto forte dois.", "Ponto forte tres."],
    pontosFracos: ["Ponto fraco um.", "Ponto fraco dois.", "Ponto fraco tres."],
    // VIOLACAO 1: Kubernetes nao esta em keywordsEncontradas deste perfil.
    headlines: [
      "Full-Stack Engineer | React | Kubernetes",
      "Engenheira Full-Stack | React | Node.js",
      "Desenvolvedora Full-Stack | TypeScript | Node.js",
    ],
    sobreReescrito: "Sobre de teste.",
    bulletsReescritos: [
      {
        contexto: "Artificial Intelligence Engineer (NexoRH)",
        // VIOLACAO 2: 97% nao aparece no texto daquela experiencia.
        bullets: ["Reduzi a latencia em 97% com pre-routers deterministicos."],
      },
    ],
    competenciasSugeridas: ["React"],
    skillsParaEstudar: [],
    melhorias: [
      { prioridade: "alta", titulo: "Melhoria um", comoFazer: "Faca isso." },
      { prioridade: "alta", titulo: "Melhoria dois", comoFazer: "Faca aquilo." },
      { prioridade: "media", titulo: "Melhoria tres", comoFazer: "Faca mais." },
      { prioridade: "baixa", titulo: "Melhoria quatro", comoFazer: "E isso." },
    ],
    modeloMensagemRecrutador: "Mensagem de teste.",
    proximoPasso: "Proximo passo de teste.",
  };
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(qualitative) } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100 },
    }),
    text: async () => "",
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("camada de lastro no caminho da rota", () => {
  it("SANEIA a tecnologia sem lastro que a IA colocou na headline", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaComViolacao());
    const { response } = await analyzeLinkedin(PEDIDO);
    const q = response.qualitative as unknown as { headlines: string[] };
    const comprovadas = response.deterministic.keywordsEncontradas.map((t) =>
      t.toLowerCase(),
    );
    expect(comprovadas).not.toContain("kubernetes");
    // A headline chegou com Kubernetes e tem que sair sem.
    expect(q.headlines.join(" ")).not.toContain("Kubernetes");
    // E sem deixar separador orfao: "React |" no fim seria lixo visivel.
    expect(q.headlines[0]).not.toMatch(/\|\s*$/);
  });

  it("SANEIA o numeral fabricado no bullet", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaComViolacao());
    const { response } = await analyzeLinkedin(PEDIDO);
    const q = response.qualitative as unknown as {
      bulletsReescritos: { bullets: string[] }[];
    };
    const texto = q.bulletsReescritos.flatMap((b) => b.bullets).join(" ");
    // 97% nao existe no texto daquela experiencia: tem que ter sido removido.
    expect(texto).not.toContain("97%");
  });

  it("MANDA a violacao para o Sentry, com um issue por tipo", async () => {
    // `console.warn` NAO chega ao Sentry neste projeto: o init nao declara
    // `integrations` e `captureConsoleIntegration` nao e padrao no
    // @sentry/node. Sem esta captura o sinal morria no log do Railway.
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaComViolacao());
    // ESM nao deixa espiar o namespace do modulo, entao o mock e do modulo
    // inteiro, com o resto passando adiante.
    await analyzeLinkedin(PEDIDO);
    expect(capturados.length).toBeGreaterThanOrEqual(1);
    const o = capturados[0].opts as {
      level: string;
      fingerprint: string[];
      tags: Record<string, string>;
    };
    expect(capturados[0].msg).toContain("ai_lastro_violado");
    // `warning`, nao `error`: a protecao FUNCIONOU. `error` e reservado para
    // protecao desligada (o modo degradado da cota).
    expect(o.level).toBe("warning");
    expect(o.tags.area).toBe("ai-lastro");
    // Um issue por TIPO, para um tipo nao esconder o outro atras do volume.
    expect(o.fingerprint[0]).toBe("ai-lastro-violado");
    expect(o.fingerprint).toHaveLength(2);
  });

  it("REGISTRA a violacao, em vez de sanear em silencio", async () => {
    vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(respostaComViolacao());
    const logs: string[] = [];
    // registrarViolacao usa console.warn, nao console.log.
    vi.spyOn(console, "warn").mockImplementation((...a) => {
      logs.push(a.map(String).join(" "));
    });
    await analyzeLinkedin(PEDIDO);
    const violacoes = logs.filter((l) => l.includes("ai_lastro_violado"));
    expect(violacoes.length).toBeGreaterThanOrEqual(2);
    expect(violacoes.join(" ")).toContain("tecnologia_sem_lastro");
    expect(violacoes.join(" ")).toContain("numeral");
  });
});
