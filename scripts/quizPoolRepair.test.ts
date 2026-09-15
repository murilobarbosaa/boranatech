import { describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "../shared/roadmapQuiz/types";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import { repairPool } from "./quizPoolRepair.mts";

// Trilha minima: so o nivel iniciante, uma secao com duas folhas de cerca
// python autocontida. O reparo so olha as secoes que existem.
const trilha: RoadmapV2 = {
  slug: "python",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["python"],
  title: "Python do Zero",
  level: "Iniciante",
  description: "Trilha de teste.",
  sections: [
    {
      id: "valores",
      title: "Valores",
      level: "iniciante",
      description: "",
      children: [
        {
          id: "valores.a",
          title: "Imprimir",
          description: "",
          content: "Use print.\n\n```python\nprint(1)\n```",
        },
        {
          id: "valores.b",
          title: "Variaveis",
          description: "",
          content: "Guarde valores.\n\n```python\nx = 2\nprint(x)\n```",
        },
      ],
    },
  ],
};

const conceito: QuizQuestion = {
  id: "python-ini-01",
  nivel: "iniciante",
  pergunta: "O que e uma variavel?",
  alternativas: { a: "Um nome", b: "Um laco", c: "Um tipo", d: "Um erro" },
  correta: "a",
  explicacao: "Guarda um valor.",
  fonte: "valores.b",
};
const completar: QuizQuestion = {
  id: "python-ini-02",
  nivel: "iniciante",
  pergunta: "Qual valor completa a lacuna?",
  alternativas: { a: "1", b: "2", c: "3", d: "4" },
  correta: "a",
  explicacao: "Porque sim.",
  fonte: "valores.b",
  tipo: "completar",
  codigo: { linguagem: "python", trecho: "x = ____\nprint(x)" },
  alternativasCodigo: true,
};
// Suja: o trecho aparece dentro do enunciado.
const saidaSuja: QuizQuestion = {
  id: "python-ini-03",
  nivel: "iniciante",
  pergunta: "O que imprime print(1)?",
  alternativas: { a: "1", b: "2", c: "3", d: "4" },
  correta: "a",
  explicacao: "Imprime 1.",
  fonte: "valores.a",
  tipo: "saida",
  codigo: { linguagem: "python", trecho: "print(1)" },
  alternativasCodigo: true,
};
const saidaLimpa: QuizQuestion = {
  ...saidaSuja,
  pergunta: "O que este codigo imprime?",
};

// Resposta do modelo no shape da geracao (uma pergunta em questions).
function resposta(q: QuizQuestion) {
  return {
    parsed: {
      questions: [
        {
          pergunta: q.pergunta,
          alternativas: q.alternativas,
          correta: q.correta,
          explicacao: q.explicacao,
          fonte: q.fonte,
          tipo: q.tipo ?? "conceito",
          codigo: q.codigo ?? null,
          alternativasCodigo: q.alternativasCodigo ?? false,
        },
      ],
    },
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  };
}

function rodar(
  questions: QuizQuestion[],
  callModel: Parameters<typeof repairPool>[0]["callModel"],
) {
  return repairPool({
    roadmap: trilha,
    questions,
    systemPrompt: "SYSTEM",
    callModel,
    executarPor: null,
    custo: () => 0,
    orcamentoUsd: 1,
  });
}

describe("repairPool", () => {
  it("pergunta limpa nao gera chamada nem muda", async () => {
    const chamar = vi.fn();
    const r = await rodar([conceito, completar], chamar);
    expect(chamar).not.toHaveBeenCalled();
    expect(r.questions).toEqual([conceito, completar]);
    expect(r.linhas).toEqual([]);
  });

  it("pergunta suja com resposta limpa e substituida, com o mesmo id", async () => {
    const chamar = vi.fn(async () => resposta(saidaLimpa));
    const r = await rodar([conceito, completar, saidaSuja], chamar);
    expect(chamar).toHaveBeenCalledTimes(1);
    expect(r.questions[2]).toEqual(saidaLimpa);
    expect(r.questions.map((q) => q.id)).toEqual([
      "python-ini-01",
      "python-ini-02",
      "python-ini-03",
    ]);
    expect(r.linhas).toEqual([
      expect.objectContaining({
        id: "python-ini-03",
        rodadas: 1,
        resultado: "reparada",
      }),
    ]);
  });

  it("pergunta suja que esgota as 3 rodadas fica, com o original", async () => {
    const chamar = vi.fn(async () => resposta(saidaSuja));
    const r = await rodar([conceito, completar, saidaSuja], chamar);
    expect(chamar).toHaveBeenCalledTimes(3);
    expect(r.questions[2]).toEqual(saidaSuja);
    expect(r.linhas[0]).toMatchObject({
      id: "python-ini-03",
      rodadas: 3,
      resultado: "suja",
    });
    expect(r.linhas[0].pendencias.join("\n")).toContain(
      "pergunta contem codigo",
    );
  });

  it("troca de tipo sem pedido e recusada", async () => {
    const virouConceito: QuizQuestion = {
      id: saidaSuja.id,
      nivel: saidaSuja.nivel,
      pergunta: "O que print faz?",
      alternativas: { a: "Mostra", b: "Soma", c: "Le", d: "Apaga" },
      correta: "a",
      explicacao: "Mostra no terminal.",
      fonte: "valores.a",
    };
    const chamar = vi.fn(async () => resposta(virouConceito));
    const r = await rodar([conceito, completar, saidaSuja], chamar);
    expect(chamar).toHaveBeenCalledTimes(3);
    expect(r.questions[2]).toEqual(saidaSuja);
    expect(r.linhas[0].pendencias.join("\n")).toContain(
      "o tipo tem que continuar saida",
    );
  });

  it("a instrucao ao modelo traz a violacao e o material da fonte", async () => {
    const chamar = vi.fn(async () => resposta(saidaLimpa));
    await rodar([conceito, completar, saidaSuja], chamar);
    const [system, user] = chamar.mock.calls[0] as unknown as [string, string];
    expect(system).toBe("SYSTEM");
    expect(user).toContain("pergunta contem codigo");
    expect(user).toContain("### valores.a | Imprimir");
    expect(user).toContain("Mantenha o tipo saida e a fonte valores.a.");
  });
});
