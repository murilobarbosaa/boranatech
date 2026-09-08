import { describe, expect, it } from "vitest";
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import {
  buildCodeRules,
  buildQuestionSchema,
  buildUserPrompt,
  codeLeafIds,
  codeQuotaFor,
  codeRuleViolations,
  codeTypeViolations,
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
    expect(codeQuotaFor({}, 6, 10)).toBe(0);
    expect(codeQuotaFor({ kind: "carreira" }, 6, 10)).toBe(0);
    expect(codeQuotaFor({ kind: "linguagem" }, 6, 10)).toBe(0);
  });

  it("linguagem com codeLanguages: metade, piso 1, teto quota menos 1", () => {
    const py = { kind: "linguagem" as const, codeLanguages: ["python"] };
    expect(codeQuotaFor(py, 6, 10)).toBe(3);
    expect(codeQuotaFor(py, 2, 10)).toBe(1);
    expect(codeQuotaFor(py, 1, 10)).toBe(0);
  });

  it("ferramenta com quota 5 da 2 e framework com quota 3 da 2", () => {
    expect(
      codeQuotaFor({ kind: "ferramenta", codeLanguages: ["bash"] }, 5, 10),
    ).toBe(2);
    expect(
      codeQuotaFor({ kind: "framework", codeLanguages: ["js"] }, 3, 10),
    ).toBe(2);
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

  it("com cota de codigo o schema tem tipo, codigo e alternativasCodigo", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(buildQuestionSchema(ids, 3, 1)),
    );
    expect(json).toContain('"tipo"');
    expect(json).toContain('"codigo"');
    expect(json).toContain('"alternativasCodigo"');
    expect(json).toContain('"null"');
  });

  it("com cota de codigo a pergunta e uma uniao discriminada por tipo", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(buildQuestionSchema(ids, 3, 1)),
    );
    expect(json).toContain('"anyOf"');
    expect(json).toContain('"tipo":{"type":"string","const":"conceito"}');
    expect(json).toContain('"codigo":{"type":"null"}');
    expect(json).toContain(
      '"alternativasCodigo":{"type":"boolean","const":false}',
    );
    expect(json).toContain(
      '"tipo":{"type":"string","enum":["completar","erro","saida"]}',
    );
    expect(json).toContain(
      '"codigo":{"type":"object","properties":{"linguagem":{"type":"string"},"trecho":{"type":"string"}},"required":["linguagem","trecho"],"additionalProperties":false}',
    );
    expect(json).not.toContain('"codigo":{"anyOf"');
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
          alternativasCodigo: true,
        }),
        gerada({
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "const x = 1;" },
          alternativasCodigo: true,
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
      [
        gerada({
          tipo: "saida",
          codigo: { linguagem: "js", trecho: linha },
          alternativasCodigo: true,
        }),
      ],
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

describe("codeLeafIds e a cota pelo material", () => {
  const secaoMista: SectionMaterial = {
    title: "Mista",
    leaves: [
      {
        id: "m.js",
        title: "Com js",
        description: "",
        content: "Texto.\n\n```js\nconsole.log(1);\n```\n\nMais texto.",
      },
      {
        id: "m.json",
        title: "Com json",
        description: "",
        content: 'Texto.\n\n```json\n{ "a": 1 }\n```',
      },
      {
        id: "m.prosa",
        title: "Sem cerca",
        description: "",
        content: "So prosa.",
      },
    ],
  };
  const js = { kind: "linguagem" as const, codeLanguages: ["js"] };

  it("codeLeafIds so conta cerca na linguagem da trilha", () => {
    expect(codeLeafIds(secaoMista, ["js"])).toEqual(["m.js"]);
  });

  const secaoImports: SectionMaterial = {
    title: "Imports",
    leaves: [
      {
        id: "f1",
        title: "Autocontida",
        description: "",
        content: "Texto.\n\n```js\nconsole.log(1);\n```",
      },
      {
        id: "f2",
        title: "So import",
        description: "",
        content:
          "Texto.\n\n```js\nimport x from './x.js';\nconsole.log(x);\n```",
      },
      {
        id: "f3",
        title: "Fetch e autocontida",
        description: "",
        content:
          "Texto.\n\n```js\nfetch('/api');\n```\n\nMais.\n\n```js\nconst a = 1;\nconsole.log(a);\n```",
      },
    ],
  };

  it("codeLeafIds em js ignora folha cujo unico codigo depende de import ou fetch", () => {
    expect(codeLeafIds(secaoImports, ["js"])).toEqual(["f1", "f3"]);
  });

  it("codeLeafIds em js ignora folha cuja unica cerca so exporta", () => {
    const secao: SectionMaterial = {
      title: "Modulos",
      leaves: [
        {
          id: "m.esm",
          title: "So export",
          description: "",
          content:
            "Texto.\n\n```js\nexport function dobro(n) {\n  return n * 2;\n}\n```",
        },
      ],
    };
    expect(codeLeafIds(secao, ["js"])).toEqual([]);
    const bash: SectionMaterial = {
      title: "Bash",
      leaves: [
        {
          ...secao.leaves[0],
          content: "Texto.\n\n```bash\nexport PATH=$PATH:/opt/bin\n```",
        },
      ],
    };
    expect(codeLeafIds(bash, ["bash"])).toEqual(["m.esm"]);
  });

  it("codeLeafIds em bash conta folha com import na cerca", () => {
    const bash: SectionMaterial = {
      title: "Bash",
      leaves: secaoImports.leaves.map((leaf) => ({
        ...leaf,
        content: leaf.content.replace(/```js/g, "```bash"),
      })),
    };
    expect(codeLeafIds(bash, ["bash"])).toEqual(["f1", "f2", "f3"]);
  });

  it("quota 7 com 1 folha de codigo da 2 (teto por folha)", () => {
    expect(codeQuotaFor(js, 7, 1)).toBe(2);
  });

  it("quota 3 com 0 folhas de codigo da 0", () => {
    expect(codeQuotaFor(js, 3, 0)).toBe(0);
  });

  it("quota 5 com 3 folhas da 3 (o share manda)", () => {
    expect(codeQuotaFor(js, 5, 3)).toBe(3);
  });

  it("quota 5 com 1 folha da 2 (o teto por folha manda)", () => {
    expect(codeQuotaFor(js, 5, 1)).toBe(2);
  });

  it("buildUserPrompt lista os passos com codigo", () => {
    const texto = buildUserPrompt(trilha, "iniciante", secao, 5, null, 2, [
      "a.x",
      "a.y",
    ]);
    expect(texto).toContain("passos que trazem codigo no material: a.x, a.y");
  });
});

describe("codeRuleViolations: regras novas do Lote 04c", () => {
  const js = ["js"];
  const saidaOk = (extra: Partial<GeneratedQuestion> = {}): GeneratedQuestion =>
    gerada({
      tipo: "saida",
      codigo: { linguagem: "js", trecho: "console.log(1);" },
      alternativas: { a: "1", b: "2", c: "3", d: "4" },
      alternativasCodigo: true,
      ...extra,
    });

  it("pergunta com cerca markdown acusa", () => {
    const v = codeRuleViolations(
      [saidaOk({ pergunta: "O que imprime?\n```js\nconsole.log(1);\n```" })],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("pergunta contem codigo");
  });

  it("pergunta que repete o trecho inteiro acusa", () => {
    const v = codeRuleViolations(
      [saidaOk({ pergunta: "Veja console.log(1); e diga a saida" })],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("pergunta contem codigo");
  });

  it("trecho com import em js acusa", () => {
    const v = codeRuleViolations(
      [
        saidaOk({
          codigo: {
            linguagem: "js",
            trecho: "import x from './x.js';\nconsole.log(x);",
          },
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("autocontido");
  });

  it("trecho com import em bash nao acusa a regra de import", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "erro",
          codigo: { linguagem: "bash", trecho: "import foo\necho ok" },
          alternativasCodigo: false,
        }),
      ],
      ["bash"],
    );
    expect(v).toEqual([]);
  });

  it("completar com a lacuna ocupando a linha inteira acusa", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "completar",
          codigo: {
            linguagem: "js",
            trecho: "const a = 1;\n____\nconsole.log(a);",
          },
          alternativas: { a: "a = 2;", b: "a++;", c: "a--;", d: "a = 0;" },
          alternativasCodigo: true,
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("lacuna ocupa a linha inteira");
  });

  it("alternativa de completar com mais de uma linha acusa", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "const a = ____;" },
          alternativas: { a: "1", b: "2\n3", c: "3", d: "4" },
          alternativasCodigo: true,
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("mais de uma linha");
  });

  it("saida sem alternativasCodigo acusa", () => {
    const v = codeRuleViolations([saidaOk({ alternativasCodigo: false })], js);
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("saida exige alternativasCodigo true");
  });

  it("erro com alternativasCodigo true acusa", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "erro",
          codigo: { linguagem: "js", trecho: "console.log(x);" },
          alternativasCodigo: true,
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("erro exige alternativasCodigo false");
  });

  it("alternativa de saida escrita como frase acusa", () => {
    const v = codeRuleViolations(
      [
        saidaOk({
          alternativas: { a: "O codigo imprime 50.", b: "1", c: "2", d: "3" },
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("escrita como frase");
  });

  it("saida crua nao acusa", () => {
    expect(codeRuleViolations([saidaOk()], js)).toEqual([]);
  });
});

describe("codeRuleViolations: alternativa de completar que repete a linha", () => {
  const js = ["js"];
  const completar = (
    trecho: string,
    alternativas: GeneratedQuestion["alternativas"],
  ): GeneratedQuestion =>
    gerada({
      tipo: "completar",
      codigo: { linguagem: "js", trecho },
      alternativas,
      alternativasCodigo: true,
    });

  it("alternativa que repete o prefixo da linha acusa", () => {
    const v = codeRuleViolations(
      [
        completar("const resultado = ____;", {
          a: "const resultado = 1",
          b: "2",
          c: "3",
          d: "4",
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("alternativa de completar repete o resto da linha");
  });

  it("alternativa so com o que entra na lacuna passa", () => {
    const v = codeRuleViolations(
      [
        completar("const resultado = ____;", {
          a: "1",
          b: "2",
          c: "3",
          d: "4",
        }),
      ],
      js,
    );
    expect(v).toEqual([]);
  });

  it("alternativa terminando so em ponto e virgula nao acusa", () => {
    const v = codeRuleViolations(
      [
        completar("const resultado = ____;", {
          a: "1;",
          b: "2",
          c: "3",
          d: "4",
        }),
      ],
      js,
    );
    expect(v).toEqual([]);
  });

  it("alternativa que repete o sufixo da linha acusa", () => {
    const v = codeRuleViolations(
      [completar("____ = 3;", { a: "x = 3;", b: "let x", c: "var x", d: "x" })],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("alternativa de completar repete o resto da linha");
  });
});

describe("codeTypeViolations", () => {
  const de = (tipo: "saida" | "erro" | "completar"): GeneratedQuestion =>
    gerada({ tipo, codigo: { linguagem: "js", trecho: "console.log(1);" } });

  it("tres ou mais de codigo sem algum tipo acusa", () => {
    const v = codeTypeViolations(
      [de("saida"), de("saida"), de("erro"), gerada()],
      3,
    );
    expect(v.some((l) => l.includes("completar"))).toBe(true);
  });

  it("duas de codigo do mesmo tipo acusa", () => {
    const v = codeTypeViolations([de("erro"), de("erro"), gerada()], 2);
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("tipos diferentes");
  });

  it("saida acima da metade acusa", () => {
    const v = codeTypeViolations(
      [de("saida"), de("saida"), de("saida"), de("erro"), de("completar")],
      5,
    );
    expect(v.some((l) => l.includes("metade"))).toBe(true);
  });

  it("um de cada tipo e saida na metade passa", () => {
    expect(
      codeTypeViolations(
        [de("saida"), de("erro"), de("completar"), gerada()],
        3,
      ),
    ).toEqual([]);
  });

  it("cota zero nao acusa nada", () => {
    expect(codeTypeViolations([gerada(), gerada()], 0)).toEqual([]);
  });
});
