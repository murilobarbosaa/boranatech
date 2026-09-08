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
