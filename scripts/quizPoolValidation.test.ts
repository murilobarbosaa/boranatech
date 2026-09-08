import { describe, expect, it } from "vitest";
import type { QuizPool, QuizQuestion } from "../shared/roadmapQuiz/types";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import { validateQuizPool } from "./quizPoolValidation.mts";

// Literais escritos a mao. O slug "a+b" tem um metacaractere de regex: sem
// escape, o "+" vira quantificador e o id correto "a+b-ini-01" deixa de casar
// o formato (ou a validacao lanca). Trilha minima so para o slug existir no
// agregado e a pergunta ter uma folha real de fonte.
const roadmap: RoadmapV2 = {
  slug: "a+b",
  area: "frontend",
  title: "A mais B",
  level: "Iniciante",
  description: "Trilha de teste.",
  sections: [
    {
      id: "s1",
      title: "Secao 1",
      level: "iniciante",
      children: [{ id: "s1.f1", title: "Folha 1" }],
    },
  ],
};

function pergunta(id: string): QuizQuestion {
  return {
    id,
    nivel: "iniciante",
    pergunta: "Qual e a resposta?",
    alternativas: { a: "Um", b: "Dois", c: "Tres", d: "Quatro" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "s1.f1",
  };
}

function problemasDeFormato(pool: QuizPool): string[] {
  return validateQuizPool(pool, "a+b", roadmap).filter((problem) =>
    problem.includes("fora do formato"),
  );
}

describe("validateQuizPool com slug que tem metacaractere de regex", () => {
  it("nao lanca e aceita o id no formato <slug>-ini-NN", () => {
    const pool: QuizPool = { slug: "a+b", questions: [pergunta("a+b-ini-01")] };
    expect(() => validateQuizPool(pool, "a+b", roadmap)).not.toThrow();
    expect(problemasDeFormato(pool)).toEqual([]);
  });

  it("reprova exatamente um id fora do formato", () => {
    const pool: QuizPool = { slug: "a+b", questions: [pergunta("axb-ini-01")] };
    expect(problemasDeFormato(pool)).toHaveLength(1);
  });
});

// Perguntas de codigo: cada caso usa `pergunta(id)` com os campos novos por
// cima e filtra os problemas pelo trecho da mensagem esperada.
function problemasContendo(question: QuizQuestion, trecho: string): string[] {
  const pool: QuizPool = { slug: "a+b", questions: [question] };
  return validateQuizPool(pool, "a+b", roadmap).filter((problem) =>
    problem.includes(trecho),
  );
}

function problemasDeCodigo(question: QuizQuestion): string[] {
  const pool: QuizPool = { slug: "a+b", questions: [question] };
  return validateQuizPool(pool, "a+b", roadmap).filter(
    (problem) =>
      problem.includes("codigo") ||
      problem.includes("tipo invalido") ||
      problem.includes("lacuna"),
  );
}

describe("perguntas de codigo", () => {
  it("saida com codigo valido de 3 linhas nao gera problema de codigo", () => {
    expect(
      problemasDeCodigo({
        ...pergunta("a+b-ini-01"),
        tipo: "saida",
        codigo: {
          linguagem: "js",
          trecho: "const a = 1;\nconst b = 2;\nconsole.log(a + b);",
        },
      }),
    ).toEqual([]);
  });

  it("tipo fora da lista gera tipo invalido", () => {
    expect(
      problemasContendo(
        { ...pergunta("a+b-ini-01"), tipo: "xyz" as never },
        'tipo invalido "xyz"',
      ),
    ).toHaveLength(1);
  });

  it("erro sem codigo gera sem campo codigo", () => {
    expect(
      problemasContendo(
        { ...pergunta("a+b-ini-01"), tipo: "erro" },
        "sem campo codigo",
      ),
    ).toHaveLength(1);
  });

  it("codigo em pergunta sem tipo gera so e permitido", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          codigo: { linguagem: "js", trecho: "let x = 1;" },
        },
        "so e permitido em pergunta de tipo completar, erro ou saida",
      ),
    ).toHaveLength(1);
  });

  it("completar sem lacuna gera encontradas 0", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "let x = 1;" },
        },
        "exatamente uma lacuna ____ no trecho (encontradas 0)",
      ),
    ).toHaveLength(1);
  });

  it("completar com duas lacunas gera encontradas 2", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "let ____ = ____;" },
        },
        "(encontradas 2)",
      ),
    ).toHaveLength(1);
  });

  it("saida com lacuna no trecho gera so e permitida em completar", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "js", trecho: "console.log(____);" },
        },
        "lacuna ____ so e permitida em pergunta completar",
      ),
    ).toHaveLength(1);
  });

  it("trecho de 13 linhas gera com 13 linhas", () => {
    const trecho = [
      "l1",
      "l2",
      "l3",
      "l4",
      "l5",
      "l6",
      "l7",
      "l8",
      "l9",
      "l10",
      "l11",
      "l12",
      "l13",
    ].join("\n");
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "python", trecho },
        },
        "codigo.trecho com 13 linhas (maximo 12)",
      ),
    ).toHaveLength(1);
  });

  it("linha de 71 caracteres gera linha de 71 caracteres", () => {
    const linha =
      "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrs";
    expect(linha).toHaveLength(71);
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "sql", trecho: `print(1)\n${linha}` },
        },
        "codigo.trecho com linha de 71 caracteres (maximo 70)",
      ),
    ).toHaveLength(1);
  });

  it("meia-risca no trecho gera travessao ou meia-risca", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "bash", trecho: "echo a \u2013 b" },
        },
        "codigo.trecho com travessao ou meia-risca",
      ),
    ).toHaveLength(1);
  });
});
