import { afterEach, describe, expect, it, vi } from "vitest";

import { parseLinkedinText } from "../../shared/linkedin/parse";
import type { LinkedinAnalyzeRequest } from "../../shared/linkedin/schema";

/**
 * `skillsParaEstudar` passava SEM NENHUMA verificacao.
 *
 * Medido na investigacao da Fase 2: o payload
 * ["React","TypeScript","Rust","COBOL inventado"] saia identico, incluindo o
 * que o perfil ja evidencia (React e TypeScript estao em keywordsEncontradas,
 * mandar estudar o que a pessoa ja usa e conselho errado) e string que nao
 * estava na lista entregue no prompt.
 *
 * A correcao filtra pela intersecao com `deterministic.keywordsFaltantes`, a
 * MESMA lista ja calculada e enviada ao modelo. Fonte unica: nada e
 * recalculado aqui, entao a lista do prompt e a lista aceita nao podem
 * divergir.
 *
 * NOTA sobre a fixture: a lista de faltantes usada nas asserções e a REAL,
 * lida de `deterministic.keywordsFaltantes`, e nao uma lista escrita a mao.
 * Escrever a lista aqui a acoplaria ao catalogo de tecnologias da area, que
 * muda, e o teste passaria a afirmar o catalogo em vez do filtro.
 */

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import * as http from "./http";
import { analyzeLinkedin } from "./linkedinAnalyze";
import { runLinkedinChecks } from "./linkedinChecks";

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
Sou desenvolvedora front-end construindo interfaces de produto com React e TypeScript para times distribuidos e cuido de acessibilidade nas entregas do time.
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React e TypeScript para 12 squads internos e acompanhei metricas.`;

const PEDIDO = {
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
} as LinkedinAnalyzeRequest;

/** As listas REAIS desta fixture, do mesmo calculo que alimenta o prompt. */
function listas() {
  const parsed = parseLinkedinText(PERFIL);
  const deterministic = runLinkedinChecks({
    parsed,
    profileText: PERFIL,
    area: PEDIDO.area,
    level: PEDIDO.level,
    mercado: PEDIDO.mercado,
    skills: PEDIDO.skills,
    foto: PEDIDO.foto,
    banner: PEDIDO.banner,
    openToWork: PEDIDO.openToWork,
    conexoes: PEDIDO.conexoes,
    atividade: PEDIDO.atividade,
  });
  return {
    encontradas: deterministic.keywordsEncontradas,
    faltantes: deterministic.keywordsFaltantes,
  };
}

const QUALITATIVE_BASE = {
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
  modeloMensagemRecrutador: "Mensagem de teste.",
};

function resposta(skillsParaEstudar: string[]): Response {
  const qualitative = { ...QUALITATIVE_BASE, skillsParaEstudar };
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(qualitative) },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100 },
    }),
    text: async () => "",
  } as unknown as Response;
}

/** Roda a analise com a lista forjada e colhe o resultado mais as violacoes. */
async function analisar(skillsParaEstudar: string[]) {
  vi.spyOn(http, "fetchWithTimeout").mockResolvedValue(
    resposta(skillsParaEstudar),
  );
  const avisos: string[] = [];
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    avisos.push(args.map(String).join(" "));
  });
  const { response } = await analyzeLinkedin(PEDIDO);
  const qual = response.qualitative as unknown as {
    skillsParaEstudar: string[];
    skillsSugeridas: string[];
  };
  return {
    skills: qual.skillsParaEstudar,
    alias: qual.skillsSugeridas,
    violacoes: avisos.filter((l) => l.includes("skill_estudo_sem_lastro")),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("skillsParaEstudar so aceita o que estava na lista de faltantes", () => {
  it("a fixture tem mesmo o que o caso precisa", () => {
    const { encontradas, faltantes } = listas();
    expect(encontradas).toContain("React");
    expect(encontradas).toContain("TypeScript");
    expect(faltantes).toContain("Node.js");
    expect(faltantes).not.toContain("React");
  });

  it("o payload da investigacao sobra so com o item legitimo", async () => {
    const { skills, violacoes } = await analisar([
      "React",
      "TypeScript",
      "Node.js",
      "COBOL inventado",
    ]);
    // React e TypeScript ja sao evidenciados; "COBOL inventado" nunca esteve na
    // lista entregue ao modelo. Os tres saem, e cada um deixa rastro.
    expect(skills).toEqual(["Node.js"]);
    expect(violacoes).toHaveLength(3);
    expect(violacoes.join(" ")).toContain("React");
    expect(violacoes.join(" ")).toContain("TypeScript");
    expect(violacoes.join(" ")).toContain("COBOL inventado");
  });

  it("casa ignorando caixa e espaco, e devolve a grafia canonica", async () => {
    const { skills, violacoes } = await analisar(["  node.js "]);
    expect(skills).toEqual(["Node.js"]);
    expect(violacoes).toEqual([]);
  });

  it("duplicata sai, e a ordem do modelo e preservada", async () => {
    const { skills } = await analisar([
      "Vue.js",
      "Node.js",
      "node.js",
      "Vue.js",
    ]);
    expect(skills).toEqual(["Vue.js", "Node.js"]);
  });

  it("todos invalidos: lista VAZIA, sem completar com nada", async () => {
    const { skills, alias, violacoes } = await analisar([
      "React",
      "COBOL inventado",
    ]);
    expect(skills).toEqual([]);
    expect(alias).toEqual([]);
    expect(violacoes).toHaveLength(2);
  });

  it("lista ja limpa passa inteira, sem violacao", async () => {
    const { skills, violacoes } = await analisar(["Node.js", "Vue.js", "Git"]);
    expect(skills).toEqual(["Node.js", "Vue.js", "Git"]);
    expect(violacoes).toEqual([]);
  });

  it("o alias skillsSugeridas reflete a lista FILTRADA", async () => {
    const { skills, alias } = await analisar([
      "React",
      "Node.js",
      "COBOL inventado",
    ]);
    expect(alias).toEqual(skills);
    expect(alias).toEqual(["Node.js"]);
  });
});
