import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  QuizNivel,
  QuizPool,
  QuizQuestion,
  QuizTipo,
} from "../../shared/roadmapQuiz/types";
import { drawQuestions, gradeAttempt } from "./roadmapQuiz";

// rng "sem troca": Math.floor(0.999 * (i + 1)) === i para todo i < 1000, entao
// o Fisher-Yates de shuffle nao troca nenhuma posicao e a ordem de saida e a
// ordem de entrada. Com ele, "as primeiras N do nivel na ordem do pool" e o
// que o sorteio devolve, e o teste controla o resultado pela ordem em que
// escreve as perguntas na fixture.
const semTroca = () => 0.999;

function pergunta(id: string, nivel: QuizNivel, tipo?: QuizTipo): QuizQuestion {
  return {
    id,
    nivel,
    pergunta: `Pergunta ${id}`,
    alternativas: { a: "A", b: "B", c: "C", d: "D" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "s1.f1",
    ...(tipo
      ? { tipo, codigo: { linguagem: "js", trecho: "console.log(1);" } }
      : {}),
  };
}

// Ids escritos a mao: ini-01..09, int-01..12, av-01..09, sem codigo.
const semCodigo: QuizPool = {
  slug: "teste",
  questions: [
    pergunta("ini-01", "iniciante"),
    pergunta("ini-02", "iniciante"),
    pergunta("ini-03", "iniciante"),
    pergunta("ini-04", "iniciante"),
    pergunta("ini-05", "iniciante"),
    pergunta("ini-06", "iniciante"),
    pergunta("ini-07", "iniciante"),
    pergunta("ini-08", "iniciante"),
    pergunta("ini-09", "iniciante"),
    pergunta("int-01", "intermediario"),
    pergunta("int-02", "intermediario"),
    pergunta("int-03", "intermediario"),
    pergunta("int-04", "intermediario"),
    pergunta("int-05", "intermediario"),
    pergunta("int-06", "intermediario"),
    pergunta("int-07", "intermediario"),
    pergunta("int-08", "intermediario"),
    pergunta("int-09", "intermediario"),
    pergunta("int-10", "intermediario"),
    pergunta("int-11", "intermediario"),
    pergunta("int-12", "intermediario"),
    pergunta("av-01", "avancado"),
    pergunta("av-02", "avancado"),
    pergunta("av-03", "avancado"),
    pergunta("av-04", "avancado"),
    pergunta("av-05", "avancado"),
    pergunta("av-06", "avancado"),
    pergunta("av-07", "avancado"),
    pergunta("av-08", "avancado"),
    pergunta("av-09", "avancado"),
  ],
};

// Intermediario com 8 de conceito ANTES e 4 de codigo DEPOIS na ordem do
// pool: com o rng sem troca, um sorteio sem garantia pega as 4 primeiras (so
// conceito). Os outros niveis nao tem codigo.
const CODIGO_INT = ["int-c1", "int-c2", "int-c3", "int-c4"];
const comCodigoNoIntermediario: QuizPool = {
  slug: "teste",
  questions: [
    ...semCodigo.questions.filter((q) => q.nivel !== "intermediario"),
    pergunta("int-01", "intermediario"),
    pergunta("int-02", "intermediario"),
    pergunta("int-03", "intermediario"),
    pergunta("int-04", "intermediario"),
    pergunta("int-05", "intermediario"),
    pergunta("int-06", "intermediario"),
    pergunta("int-07", "intermediario"),
    pergunta("int-08", "intermediario"),
    pergunta("int-c1", "intermediario", "completar"),
    pergunta("int-c2", "intermediario", "erro"),
    pergunta("int-c3", "intermediario", "saida"),
    pergunta("int-c4", "intermediario", "saida"),
  ],
};

function contarPorPrefixo(ids: string[], prefixo: string): number {
  return ids.filter((id) => id.startsWith(prefixo)).length;
}

function contarCodigo(ids: string[]): number {
  return ids.filter((id) => CODIGO_INT.includes(id)).length;
}

describe("drawQuestions", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pool sem codigo: 10 perguntas, 3 + 4 + 3, alternativas a-d uma vez cada", () => {
    const snapshot = drawQuestions(semCodigo, new Set(), semTroca);
    const ids = snapshot.map((entry) => entry.id);
    expect(ids).toHaveLength(10);
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarPorPrefixo(ids, "av-")).toBe(3);
    for (const entry of snapshot) {
      expect([...entry.alternativas].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });

  it("nivel com codigo disponivel leva pelo menos uma de codigo", () => {
    const ids = drawQuestions(
      comCodigoNoIntermediario,
      new Set(),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBeGreaterThanOrEqual(1);
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(contarPorPrefixo(ids, "av-")).toBe(3);
  });

  it("nivel so com perguntas de codigo sai com a cota normal", () => {
    const pool: QuizPool = {
      slug: "teste",
      questions: [
        ...semCodigo.questions.filter((q) => q.nivel !== "iniciante"),
        pergunta("ini-c1", "iniciante", "saida"),
        pergunta("ini-c2", "iniciante", "saida"),
        pergunta("ini-c3", "iniciante", "saida"),
        pergunta("ini-c4", "iniciante", "saida"),
      ],
    };
    const ids = drawQuestions(pool, new Set(), semTroca).map(
      (entry) => entry.id,
    );
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(ids).toHaveLength(10);
  });

  it("exclusao que cobre todo o codigo do nivel vence a garantia", () => {
    const ids = drawQuestions(
      comCodigoNoIntermediario,
      new Set(CODIGO_INT),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBe(0);
  });

  it("exclusao que deixa o nivel abaixo da cota relaxa e a garantia volta", () => {
    const pool: QuizPool = {
      slug: "teste",
      questions: [
        ...semCodigo.questions.filter((q) => q.nivel !== "intermediario"),
        pergunta("int-01", "intermediario"),
        pergunta("int-02", "intermediario"),
        pergunta("int-03", "intermediario"),
        pergunta("int-c1", "intermediario", "erro"),
        pergunta("int-c2", "intermediario", "saida"),
      ],
    };
    // Sobram so int-02 e int-03 fora da exclusao: 2 < 4, relaxa.
    const ids = drawQuestions(
      pool,
      new Set(["int-01", "int-c1", "int-c2"]),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBeGreaterThanOrEqual(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe("gradeAttempt", () => {
  it("conta acerto, erro e sem resposta; reprova abaixo de 7", () => {
    const grade = gradeAttempt(
      semCodigo,
      [
        { id: "ini-01", alternativas: ["a", "b", "c", "d"] },
        { id: "int-01", alternativas: ["a", "b", "c", "d"] },
        { id: "av-01", alternativas: ["a", "b", "c", "d"] },
      ],
      { "ini-01": "a", "int-01": "b" },
    );
    expect(grade.score).toBe(1);
    expect(grade.aprovado).toBe(false);
    expect(grade.porPergunta).toEqual([
      { id: "ini-01", acertou: true },
      { id: "int-01", acertou: false },
      { id: "av-01", acertou: false },
    ]);
  });

  it("pergunta que sumiu do pool e anulada a favor", () => {
    const grade = gradeAttempt(
      semCodigo,
      [{ id: "sumiu-99", alternativas: ["d", "c", "b", "a"] }],
      {},
    );
    expect(grade.porPergunta).toEqual([
      { id: "sumiu-99", acertou: true, anulada: true },
    ]);
    expect(grade.score).toBe(1);
  });
});
