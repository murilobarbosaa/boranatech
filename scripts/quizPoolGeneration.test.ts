import { describe, expect, it } from "vitest";
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import {
  buildCodeRules,
  buildQuestionSchema,
  buildUserPrompt,
  codeQuotaFor,
  codeRuleViolations,
  type GeneratedQuestion,
  missingCodeCount,
  normalizeGeneratedQuestion,
  type SectionMaterial,
} from "./quizPoolGeneration.mts";

// Literais escritos a mao. A fixture de trilha e minima: o que importa para o
// prompt e titulo, area e o material da secao.
const trilha: RoadmapV2 = {
  slug: "python",
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["python"],
  title: "Python do Zero",
  level: "Iniciante",
  description: "Trilha de teste.",
  sections: [],
};

const secao: SectionMaterial = {
  title: "Variaveis",
  leaves: [
    {
      id: "basico.variaveis",
      title: "Variaveis",
      description: "O que e uma variavel.",
      content: "Uma variavel guarda um valor.",
    },
    {
      id: "basico.tipos",
      title: "Tipos",
      description: "",
      content: "int, str e float.",
    },
  ],
};

const DASH_RE = /\u2014|\u2013/;

function gerada(extra: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    pergunta: "Qual e o valor?",
    alternativas: { a: "1", b: "2", c: "3", d: "4" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "basico.variaveis",
    ...extra,
  };
}

describe("codeQuotaFor", () => {
  it("zero para trilha sem kind, carreira e linguagem sem codeLanguages", () => {
    expect(codeQuotaFor({}, 6)).toBe(0);
    expect(codeQuotaFor({ kind: "carreira" }, 6)).toBe(0);
    expect(codeQuotaFor({ kind: "linguagem" }, 6)).toBe(0);
  });

  it("linguagem com codeLanguages: metade, piso 1, teto quota menos 1", () => {
    const py = { kind: "linguagem" as const, codeLanguages: ["python"] };
    expect(codeQuotaFor(py, 6)).toBe(3);
    expect(codeQuotaFor(py, 2)).toBe(1);
    expect(codeQuotaFor(py, 1)).toBe(0);
  });

  it("ferramenta com quota 5 da 2 e framework com quota 3 da 2", () => {
    expect(
      codeQuotaFor({ kind: "ferramenta", codeLanguages: ["bash"] }, 5),
    ).toBe(2);
    expect(codeQuotaFor({ kind: "framework", codeLanguages: ["js"] }, 3)).toBe(
      2,
    );
  });
});

describe("buildUserPrompt", () => {
  it("sem cota de codigo nao fala em codigo", () => {
    const texto = buildUserPrompt(trilha, "iniciante", secao, 5, null, 0);
    expect(texto).not.toContain("codigo");
  });

  it("com cota 2 de 5 pede exatamente 2 de codigo e 3 de conceito", () => {
    const texto = buildUserPrompt(trilha, "iniciante", secao, 5, null, 2);
    expect(texto).toContain("Dessas 5, exatamente 2 devem ser de codigo");
    expect(texto).toContain("3 de conceito");
  });
});

describe("buildCodeRules", () => {
  it("lista as linguagens, a lacuna e os limites, sem travessao", () => {
    const regras = buildCodeRules(["js", "ts"]);
    expect(regras).toContain("js, ts");
    expect(regras).toContain("____");
    expect(regras).toContain("12 linhas");
    expect(regras).toContain("70 caracteres");
    expect(DASH_RE.test(regras)).toBe(false);
  });
});

describe("buildQuestionSchema", () => {
  const ids = ["basico.variaveis", "basico.tipos"];

  it("sem cota de codigo o schema strict nao tem tipo", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(buildQuestionSchema(ids, 3, 0)),
    );
    expect(json).not.toContain('"tipo"');
  });

  it("com cota de codigo o schema tem tipo, codigo nullable e alternativasCodigo", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(buildQuestionSchema(ids, 3, 1)),
    );
    expect(json).toContain('"tipo"');
    expect(json).toContain('"codigo"');
    expect(json).toContain('"alternativasCodigo"');
    expect(json).toContain('"null"');
  });
});

describe("normalizeGeneratedQuestion", () => {
  it("conceito sai so com as chaves de sempre", () => {
    const q = normalizeGeneratedQuestion(
      gerada(),
      "python-ini-01",
      "iniciante",
    );
    expect(Object.keys(q).sort()).toEqual([
      "alternativas",
      "correta",
      "explicacao",
      "fonte",
      "id",
      "nivel",
      "pergunta",
    ]);
    expect(q.id).toBe("python-ini-01");
    expect(q.nivel).toBe("iniciante");
  });

  it("tipo conceito explicito tambem sai sem os campos de codigo", () => {
    const q = normalizeGeneratedQuestion(
      gerada({ tipo: "conceito", codigo: null, alternativasCodigo: false }),
      "python-ini-02",
      "iniciante",
    );
    expect(q).not.toHaveProperty("tipo");
    expect(q).not.toHaveProperty("codigo");
    expect(q).not.toHaveProperty("alternativasCodigo");
  });

  it("completar com codigo e alternativasCodigo true sai com os tres campos", () => {
    const q = normalizeGeneratedQuestion(
      gerada({
        tipo: "completar",
        codigo: { linguagem: "python", trecho: "x = ____" },
        alternativasCodigo: true,
      }),
      "python-int-01",
      "intermediario",
    );
    expect(Object.keys(q).sort()).toEqual([
      "alternativas",
      "alternativasCodigo",
      "codigo",
      "correta",
      "explicacao",
      "fonte",
      "id",
      "nivel",
      "pergunta",
      "tipo",
    ]);
    expect(q.alternativasCodigo).toBe(true);
  });

  it("erro com alternativasCodigo false sai sem essa chave", () => {
    const q = normalizeGeneratedQuestion(
      gerada({
        tipo: "erro",
        codigo: { linguagem: "python", trecho: "print(x" },
        alternativasCodigo: false,
      }),
      "python-av-01",
      "avancado",
    );
    expect(q.tipo).toBe("erro");
    expect(q).not.toHaveProperty("alternativasCodigo");
  });

  it("saida com codigo null lanca com o id na mensagem", () => {
    expect(() =>
      normalizeGeneratedQuestion(
        gerada({ tipo: "saida", codigo: null, alternativasCodigo: true }),
        "python-av-02",
        "avancado",
      ),
    ).toThrow("python-av-02");
  });
});

describe("missingCodeCount", () => {
  const cinco = [
    gerada(),
    gerada({
      tipo: "saida",
      codigo: { linguagem: "python", trecho: "print(1)" },
    }),
    gerada(),
    gerada({ tipo: "conceito" }),
    gerada(),
  ];

  it("conta quantas faltam para a cota", () => {
    expect(missingCodeCount(cinco, 2)).toBe(1);
  });

  it("zero quando nao ha cota", () => {
    expect(missingCodeCount(cinco, 0)).toBe(0);
  });
});

describe("codeRuleViolations", () => {
  const js = ["js"];

  it("completar sem lacuna e a unica violacao numa lista com saida valida", () => {
    const violacoes = codeRuleViolations(
      [
        gerada({
          tipo: "saida",
          codigo: { linguagem: "js", trecho: "console.log(1);" },
        }),
        gerada({
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "const x = 1;" },
        }),
      ],
      js,
    );
    expect(violacoes).toHaveLength(1);
    expect(violacoes[0]).toContain("lacuna");
  });

  it("linha de 71 caracteres cita 71", () => {
    const linha =
      "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrs";
    const violacoes = codeRuleViolations(
      [gerada({ tipo: "saida", codigo: { linguagem: "js", trecho: linha } })],
      js,
    );
    expect(violacoes).toHaveLength(1);
    expect(violacoes[0]).toContain("71");
  });

  it("linguagem fora das codeLanguages cita a linguagem", () => {
    const violacoes = codeRuleViolations(
      [
        gerada({
          tipo: "erro",
          codigo: { linguagem: "python", trecho: "print(1)" },
        }),
      ],
      js,
    );
    expect(violacoes).toHaveLength(1);
    expect(violacoes[0]).toContain("python");
  });

  it("lista so de conceito nao tem violacao", () => {
    expect(
      codeRuleViolations([gerada(), gerada({ tipo: "conceito" })], js),
    ).toEqual([]);
  });
});
