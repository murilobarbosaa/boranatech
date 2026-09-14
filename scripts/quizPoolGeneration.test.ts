import { describe, expect, it } from "vitest";
import type { Execucao } from "./verifyQuizPoolByExecution.mts";
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import type { QuizQuestion } from "../shared/roadmapQuiz/types";
import {
  buildCodeRules,
  buildQuestionSchema,
  buildUserPrompt,
  codeLeafIds,
  codeQuotaFor,
  codeRuleViolations,
  codeQuotaWarnings,
  codeTypeViolations,
  dependsOnExternal,
  execViolations,
  externalDependency,
  type GeneratedQuestion,
  missingCodeCount,
  MAX_QUOTA_PER_SECTION,
  normalizeGeneratedQuestion,
  poolGateViolations,
  type SectionMaterial,
  sectionQuotaWarnings,
  sectionQuotas,
  toGeneratedQuestion,
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
      '"tipo":{"type":"string","enum":["completar","saida"]}',
    );
    expect(json).toContain(
      '"codigo":{"type":"object","properties":{"linguagem":{"type":"string"},"trecho":{"type":"string"}},"required":["linguagem","trecho"],"additionalProperties":false},"alternativasCodigo":{"type":"boolean","const":true}',
    );
    expect(json).not.toContain('"codigo":{"anyOf"');
  });

  it("com cota de codigo o ramo erro exige saidaEsperada e alternativasCodigo false", () => {
    const json = JSON.stringify(
      toOpenAIStrictSchema(buildQuestionSchema(ids, 3, 1)),
    );
    expect(json).toContain('"tipo":{"type":"string","const":"erro"}');
    expect(json).toContain(
      '"codigo":{"type":"object","properties":{"linguagem":{"type":"string"},"trecho":{"type":"string"},"saidaEsperada":{"type":"string"}},"required":["linguagem","trecho","saidaEsperada"],"additionalProperties":false},"alternativasCodigo":{"type":"boolean","const":false}',
    );
    expect(json.split('"anyOf"').length - 1).toBe(1);
    expect(json.split('"tipo":{').length - 1).toBe(3);
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

  it("erro copia saidaEsperada e saida nao a carrega", () => {
    const erro = normalizeGeneratedQuestion(
      gerada({
        tipo: "erro",
        codigo: { linguagem: "python", trecho: "print(x", saidaEsperada: "2" },
        alternativasCodigo: false,
      }),
      "python-av-02",
      "avancado",
    );
    expect(erro.codigo).toEqual({
      linguagem: "python",
      trecho: "print(x",
      saidaEsperada: "2",
    });
    const saida = normalizeGeneratedQuestion(
      gerada({
        tipo: "saida",
        codigo: { linguagem: "python", trecho: "print(2)", saidaEsperada: "2" },
        alternativasCodigo: true,
      }),
      "python-av-03",
      "avancado",
    );
    expect(saida.codigo).toEqual({ linguagem: "python", trecho: "print(2)" });
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
          codigo: {
            linguagem: "python",
            trecho: "print(1)",
            saidaEsperada: "2",
          },
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
          codigo: {
            linguagem: "bash",
            trecho: "import foo\necho ok",
            saidaEsperada: "ok",
          },
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
          codigo: {
            linguagem: "js",
            trecho: "console.log(x);",
            saidaEsperada: "1",
          },
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

describe("codeRuleViolations: saidaEsperada em erro", () => {
  const js = ["js"];
  const erro = (codigo: GeneratedQuestion["codigo"]): GeneratedQuestion =>
    gerada({ tipo: "erro", codigo, alternativasCodigo: false });

  it("erro sem saidaEsperada acusa", () => {
    const v = codeRuleViolations(
      [erro({ linguagem: "js", trecho: "console.log(1 + '1');" })],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("erro exige codigo.saidaEsperada");
  });

  it("saidaEsperada escrita como frase acusa", () => {
    const v = codeRuleViolations(
      [
        erro({
          linguagem: "js",
          trecho: "console.log(1 + '1');",
          saidaEsperada: "O codigo imprime 2.",
        }),
      ],
      js,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("saidaEsperada escrita como frase");
  });

  it("erro com saidaEsperada crua passa", () => {
    expect(
      codeRuleViolations(
        [
          erro({
            linguagem: "js",
            trecho: "console.log(1 + '1');",
            saidaEsperada: "2",
          }),
        ],
        js,
      ),
    ).toEqual([]);
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

  it("duas de codigo de tipos diferentes sem completar acusa a completar", () => {
    const v = codeTypeViolations([de("erro"), de("saida"), gerada()], 2);
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("completar");
  });

  it("duas de codigo com uma completar passa", () => {
    expect(
      codeTypeViolations([de("erro"), de("completar"), gerada()], 2),
    ).toEqual([]);
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

describe("execViolations com executor stub", () => {
  const ok = (stdout: string): Execucao => ({
    status: 0,
    stdout,
    erro: "",
    timeout: false,
  });
  // Stub: js "executa" devolvendo o numero da atribuicao ou o argumento do
  // console.log; qualquer outra linguagem nao tem runner.
  const executarPor = (linguagem: string) =>
    linguagem === "js"
      ? (code: string) => {
          const m = code.match(/const a = (.*);/) ?? code.match(/log\((.*)\)/);
          return ok(String(Number(m?.[1])));
        }
      : null;

  it("saida cujo stdout difere da correta acusa", () => {
    const v = execViolations(
      [
        gerada({
          tipo: "saida",
          codigo: { linguagem: "js", trecho: "console.log(3);" },
          alternativas: { a: "2", b: "3", c: "4", d: "5" },
          alternativasCodigo: true,
        }),
      ],
      ["js"],
      executarPor,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/^pergunta 1 \(fonte basico.variaveis\): obtido="3"/);
  });

  it("erro com saidaEsperada igual ao stdout acusa sem defeito", () => {
    const v = execViolations(
      [
        gerada({
          tipo: "erro",
          codigo: {
            linguagem: "js",
            trecho: "console.log(2);",
            saidaEsperada: "2",
          },
          alternativasCodigo: false,
        }),
      ],
      ["js"],
      executarPor,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("erro sem defeito");
  });

  it("completar com distrator equivalente acusa", () => {
    const v = execViolations(
      [
        gerada({
          tipo: "completar",
          codigo: {
            linguagem: "js",
            trecho: "const a = ____;\nconsole.log(a);",
          },
          alternativas: { a: "1", b: "1.0", c: "2", d: "3" },
          alternativasCodigo: true,
        }),
      ],
      ["js"],
      executarPor,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("distratores equivalentes: b");
  });

  it("linguagem sem runner e conceito nao acusam nada", () => {
    const v = execViolations(
      [
        gerada(),
        gerada({
          tipo: "saida",
          codigo: { linguagem: "bash", trecho: "echo 3" },
          alternativas: { a: "2", b: "3", c: "4", d: "5" },
          alternativasCodigo: true,
        }),
      ],
      ["bash"],
      executarPor,
    );
    expect(v).toEqual([]);
  });
});

describe("dependsOnExternal", () => {
  it("python: import da biblioteca padrao permitida nao e externo", () => {
    expect(
      dependsOnExternal("import json\nprint(json.dumps([1]))", ["python"]),
    ).toBe(false);
    expect(
      dependsOnExternal("from collections import Counter", ["python"]),
    ).toBe(false);
  });

  it("python: pacote de fora e modulo fora da lista sao externos", () => {
    expect(dependsOnExternal("import requests", ["python"])).toBe(true);
    expect(dependsOnExternal("from os import path", ["python"])).toBe(true);
    expect(dependsOnExternal("import random", ["python"])).toBe(true);
  });

  it("python: open continua externo", () => {
    expect(
      dependsOnExternal("with open('a.txt') as f:\n  pass", ["python"]),
    ).toBe(true);
  });

  it("js: qualquer import, export, require e fetch sao externos", () => {
    expect(dependsOnExternal("import x from './x.js';", ["js"])).toBe(true);
    expect(dependsOnExternal("export const a = 1;", ["js"])).toBe(true);
    expect(dependsOnExternal("import json", ["js"])).toBe(true);
    expect(dependsOnExternal("const fs = require('fs');", ["js"])).toBe(true);
    expect(dependsOnExternal("console.log(1);", ["js"])).toBe(false);
  });

  it("bash: nada e externo", () => {
    expect(dependsOnExternal("import foo\nexport PATH=1", ["bash"])).toBe(
      false,
    );
  });
});

describe("sectionQuotas: teto flexivel por secao", () => {
  const secao = (title: string, folhas: number): SectionMaterial => ({
    title,
    leaves: Array.from({ length: folhas }, (_, i) => ({
      id: `${title}.f${i}`,
      title: `Folha ${i}`,
      description: "",
      content: "",
    })),
  });
  const tres = [secao("a", 5), secao("b", 5), secao("c", 5)];
  const duas = [secao("a", 5), secao("b", 5)];
  const uma = [secao("unica", 10)];

  it("sem o parametro, as cotas de hoje, byte a byte", () => {
    expect(sectionQuotas(tres, 15)).toEqual([5, 5, 5]);
    expect(sectionQuotas(duas, 15)).toEqual([8, 7]);
    expect(sectionQuotas(uma, 15)).toEqual([15]);
    expect(sectionQuotaWarnings(tres, 15)).toEqual([]);
  });

  it("tres secoes com teto 7 somam 15 sem passar do teto e sem aviso", () => {
    const quotas = sectionQuotas(tres, 15, MAX_QUOTA_PER_SECTION);
    expect(quotas.reduce((x, y) => x + y, 0)).toBe(15);
    expect(Math.max(...quotas)).toBeLessThanOrEqual(MAX_QUOTA_PER_SECTION);
    expect(sectionQuotaWarnings(tres, 15, MAX_QUOTA_PER_SECTION)).toEqual([]);
  });

  it("duas secoes nao comportam 15 com teto 7: mantem a cota alta e avisa", () => {
    const quotas = sectionQuotas(duas, 15, MAX_QUOTA_PER_SECTION);
    expect(quotas.reduce((x, y) => x + y, 0)).toBe(15);
    expect(Math.max(...quotas)).toBe(8);
    const avisos = sectionQuotaWarnings(duas, 15, MAX_QUOTA_PER_SECTION);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain("cota 8");
    expect(avisos[0]).toContain("acima do teto de 7");
  });

  it("uma secao com folhas de sobra fica com o alvo inteiro e avisa", () => {
    expect(sectionQuotas(uma, 15, MAX_QUOTA_PER_SECTION)).toEqual([15]);
    const avisos = sectionQuotaWarnings(uma, 15, MAX_QUOTA_PER_SECTION);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain("cota 15");
  });

  it("secao gorda cede o excedente para as magras quando ha folga", () => {
    const quotas = sectionQuotas(
      [secao("gorda", 12), secao("magra", 3), secao("outra", 3)],
      15,
      MAX_QUOTA_PER_SECTION,
    );
    expect(quotas[0]).toBe(MAX_QUOTA_PER_SECTION);
    expect(quotas.reduce((x, y) => x + y, 0)).toBe(15);
  });
});

describe("buildCodeRules: exemplo de completar na linguagem da trilha", () => {
  it("python usa atribuicao sem const", () => {
    const texto = buildCodeRules(["python"]);
    expect(texto).toContain("x = ____");
    expect(texto).not.toContain("const");
  });

  it("js mantem o exemplo de hoje, byte a byte", () => {
    expect(buildCodeRules(["js"])).toContain(
      "- Exemplo de completar: trecho const x = ____; com alternativas 1, 2, 3 e 4. NUNCA const x = 1; como alternativa: a alternativa e so o que entra na lacuna, sem o resto da linha.",
    );
  });

  it("linguagem sem forma propria nao ganha exemplo em sintaxe de js", () => {
    const regras = buildCodeRules(["bash"]);
    expect(regras).not.toContain("const x = ____;");
    expect(regras).not.toContain("Exemplo de completar");
  });

  it("variedade marca completar como obrigatoria com 2 ou mais de codigo", () => {
    expect(buildCodeRules(["python"])).toContain(
      "em secao com 2 ou mais perguntas de codigo, pelo menos uma e completar (obrigatoria)",
    );
  });
});

describe("portao final: adaptador e rotulo por id", () => {
  const completar: QuizQuestion = {
    id: "python-ini-14",
    nivel: "iniciante",
    pergunta: "Qual valor completa a lacuna?",
    alternativas: { a: "1", b: "2", c: "3", d: "4" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "basico.variaveis",
    tipo: "completar",
    codigo: { linguagem: "python", trecho: "x = ____\nprint(x)" },
    alternativasCodigo: true,
  };
  const conceito: QuizQuestion = {
    id: "python-ini-13",
    nivel: "iniciante",
    pergunta: "O que e uma variavel?",
    alternativas: { a: "Um nome", b: "Um laco", c: "Um tipo", d: "Um erro" },
    correta: "a",
    explicacao: "Guarda um valor.",
    fonte: "basico.variaveis",
  };
  const erro: QuizQuestion = {
    ...conceito,
    id: "python-int-02",
    nivel: "intermediario",
    tipo: "erro",
    codigo: { linguagem: "python", trecho: "print(1)", saidaEsperada: "2" },
  };

  it("adaptador converte pergunta de codigo na GeneratedQuestion equivalente", () => {
    expect(toGeneratedQuestion(completar)).toEqual({
      pergunta: "Qual valor completa a lacuna?",
      alternativas: { a: "1", b: "2", c: "3", d: "4" },
      correta: "a",
      explicacao: "Porque sim.",
      fonte: "basico.variaveis",
      tipo: "completar",
      codigo: { linguagem: "python", trecho: "x = ____\nprint(x)" },
      alternativasCodigo: true,
    });
  });

  it("adaptador e normalizeGeneratedQuestion fazem ida e volta", () => {
    for (const q of [completar, conceito, erro]) {
      expect(
        normalizeGeneratedQuestion(toGeneratedQuestion(q), q.id, q.nivel),
      ).toEqual(q);
    }
  });

  it("violacao de regra sai rotulada com o id, nao com o indice", () => {
    const semLacuna: QuizQuestion = {
      ...completar,
      codigo: { linguagem: "python", trecho: "x = 1\nprint(x)" },
    };
    const v = poolGateViolations([conceito, semLacuna], [], ["python"], null);
    expect(v).toContain(
      "python-ini-14 (fonte basico.variaveis): completar exige exatamente uma lacuna ____ (encontradas 0)",
    );
    expect(v.join("\n")).not.toMatch(/pergunta \d+ \(fonte/);
  });

  it("violacao de execucao sai rotulada com o id", () => {
    const saida: QuizQuestion = {
      ...conceito,
      id: "js-av-07",
      nivel: "avancado",
      tipo: "saida",
      codigo: { linguagem: "js", trecho: "console.log(3);" },
      alternativas: { a: "2", b: "3", c: "4", d: "5" },
      alternativasCodigo: true,
    };
    const executarPor = (linguagem: string) =>
      linguagem === "js"
        ? (): Execucao => ({ status: 0, stdout: "3", erro: "", timeout: false })
        : null;
    const v = poolGateViolations([saida], [], ["js"], executarPor);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/^js-av-07 \(fonte basico.variaveis\): obtido="3"/);
  });

  it("variedade roda por secao, com a cota da secao e o rotulo dela", () => {
    const erro2: QuizQuestion = { ...erro, id: "python-int-03" };
    const secoes = [
      {
        label: "intermediario / Erros",
        codeQuota: 2,
        ids: ["python-int-02", "python-int-03"],
      },
    ];
    const v = poolGateViolations([erro, erro2], secoes, ["python"], null);
    expect(v).toContain(
      "intermediario / Erros: variedade: as 2 perguntas de codigo precisam ser de tipos diferentes (vieram 2 de erro)",
    );
  });

  it("pool limpa nao acusa nada", () => {
    expect(
      poolGateViolations(
        [conceito, completar],
        [{ label: "iniciante / X", codeQuota: 1, ids: ["python-ini-14"] }],
        ["python"],
        null,
      ),
    ).toEqual([]);
  });
});

describe("externalDependency: o motivo, nao so o sim ou nao", () => {
  it("import de modulo da lista em python nao e dependencia", () => {
    expect(
      externalDependency("import json\nprint(json.dumps([1]))", ["python"]),
    ).toBeNull();
  });

  it("import de pacote de fora nomeia o pacote", () => {
    expect(externalDependency("import requests", ["python"])).toContain(
      "requests",
    );
  });

  it("open nomeia o arquivo como motivo, nao o import", () => {
    const motivo = externalDependency(
      "import json\nwith open('a.json') as f:\n  print(json.load(f))",
      ["python"],
    );
    expect(motivo).toContain("open");
    expect(motivo).not.toContain("import");
  });

  it("a violacao de trecho nao autocontido traz o motivo especifico", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "saida",
          codigo: {
            linguagem: "python",
            trecho: "with open('a.txt') as f:\n  print(f.read())",
          },
          alternativas: { a: "1", b: "2", c: "3", d: "4" },
          alternativasCodigo: true,
        }),
      ],
      ["python"],
    );
    const linha = v.find((x) => x.includes("autocontido"));
    expect(linha).toContain("open");
    expect(linha).not.toContain("import, require, fetch ou arquivo");
  });
});

describe("buildCodeRules: imports e arquivo em python", () => {
  it("python nao diz sem import e explica o import da lista e o JSON sobre texto", () => {
    const regras = buildCodeRules(["python"]);
    expect(regras).not.toContain("sem import, require");
    expect(regras).toContain("o import aparece no proprio trecho");
    expect(regras).toContain("json.dumps e json.loads");
  });

  it("js mantem a regra de autocontido de hoje, byte a byte", () => {
    expect(buildCodeRules(["js"])).toContain(
      "- Trecho autocontido: sem import, require, fetch, leitura de arquivo ou qualquer dependencia externa; so a linguagem e a biblioteca padrao. Sem entrada do usuario, sem aleatoriedade, sem data e hora.",
    );
  });
});

describe("codigo no enunciado: exemplo negativo e nota de correcao", () => {
  it("python traz o exemplo proibido ao lado do certo", () => {
    const regras = buildCodeRules(["python"]);
    expect(regras).toContain("PROIBIDO (codigo no enunciado)");
    expect(regras).toContain("print(len('abc'))");
    expect(regras).toContain("O que este codigo imprime?");
  });

  it("js nao ganha o exemplo: o prompt dela fica como esta", () => {
    expect(buildCodeRules(["js"])).not.toContain(
      "PROIBIDO (codigo no enunciado)",
    );
  });

  it("a violacao manda mover o codigo e reescrever a pergunta", () => {
    const v = codeRuleViolations(
      [
        gerada({
          tipo: "saida",
          pergunta: "O que imprime print(len('abc'))?",
          codigo: { linguagem: "python", trecho: "print(len('abc'))" },
          alternativas: { a: "2", b: "3", c: "4", d: "abc" },
          alternativasCodigo: true,
        }),
      ],
      ["python"],
    );
    const linha = v.find((x) => x.includes("pergunta contem codigo"));
    expect(linha).toContain(
      "mova o codigo para codigo.trecho e reescreva a pergunta sem ele",
    );
  });
});

describe("codeQuotaWarnings: cota de codigo por nivel no portao", () => {
  const pergunta = (
    id: string,
    nivel: QuizQuestion["nivel"],
    codigo: boolean,
  ): QuizQuestion => ({
    id,
    nivel,
    pergunta: "Qual?",
    alternativas: { a: "1", b: "2", c: "3", d: "4" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "basico.variaveis",
    ...(codigo
      ? {
          tipo: "saida" as const,
          codigo: { linguagem: "python", trecho: "print(1)" },
          alternativasCodigo: true as const,
        }
      : {}),
  });

  it("nivel com menos codigo que a cota somada vira aviso com os dois numeros", () => {
    const qs = [
      pergunta("python-av-01", "avancado", true),
      pergunta("python-av-02", "avancado", true),
      pergunta("python-av-03", "avancado", false),
      pergunta("python-av-04", "avancado", true),
      pergunta("python-av-05", "avancado", true),
      pergunta("python-av-06", "avancado", true),
      pergunta("python-av-07", "avancado", false),
    ];
    const secoes = [
      {
        label: "avancado / A",
        codeQuota: 3,
        ids: ["python-av-01", "python-av-02", "python-av-03"],
      },
      {
        label: "avancado / B",
        codeQuota: 4,
        ids: ["python-av-04", "python-av-05", "python-av-06", "python-av-07"],
      },
    ];
    expect(codeQuotaWarnings(qs, secoes)).toEqual([
      "nivel avancado: 5 perguntas de codigo de 7 previstas",
    ]);
  });

  it("nivel que fecha a cota nao avisa", () => {
    const qs = [
      pergunta("python-ini-01", "iniciante", true),
      pergunta("python-ini-02", "iniciante", false),
    ];
    expect(
      codeQuotaWarnings(qs, [
        {
          label: "iniciante / A",
          codeQuota: 1,
          ids: ["python-ini-01", "python-ini-02"],
        },
      ]),
    ).toEqual([]);
  });
});

describe("folhas elegiveis para codigo", () => {
  const saidaPy = (fonte: string) =>
    gerada({
      fonte,
      tipo: "saida",
      codigo: { linguagem: "python", trecho: "print(1)" },
      alternativas: { a: "1", b: "2", c: "3", d: "4" },
      alternativasCodigo: true,
    });

  it("o prompt restringe o codigo as elegiveis quando alguma folha nao e", () => {
    const texto = buildUserPrompt(trilha, "iniciante", secao, 5, null, 2, [
      "basico.variaveis",
    ]);
    expect(texto).toContain(
      "Perguntas de codigo APENAS sobre: basico.variaveis. As demais fontes recebem perguntas de conceito.",
    );
  });

  it("com todas as folhas elegiveis a linha nao aparece", () => {
    const texto = buildUserPrompt(trilha, "iniciante", secao, 5, null, 2, [
      "basico.variaveis",
      "basico.tipos",
    ]);
    expect(texto).not.toContain("APENAS sobre");
  });

  it("pergunta de codigo com fonte inelegivel viola, com a nota de troca", () => {
    const v = codeRuleViolations(
      [saidaPy("basico.variaveis")],
      ["python"],
      undefined,
      ["basico.tipos"],
    );
    expect(v.some((l) => l.includes("troque o tipo para conceito"))).toBe(true);
  });

  it("sem a lista de elegiveis, e em conceito, nao ha essa violacao", () => {
    expect(
      codeRuleViolations([saidaPy("basico.variaveis")], ["python"]).some((l) =>
        l.includes("troque o tipo"),
      ),
    ).toBe(false);
    expect(
      codeRuleViolations([gerada()], ["python"], undefined, ["basico.tipos"]),
    ).toEqual([]);
  });

  it("o portao acusa a inelegivel pelo id quando a secao traz as elegiveis", () => {
    const q: QuizQuestion = {
      id: "python-int-05",
      nivel: "intermediario",
      pergunta: "O que este codigo imprime?",
      alternativas: { a: "1", b: "2", c: "3", d: "4" },
      correta: "a",
      explicacao: "Porque sim.",
      fonte: "basico.variaveis",
      tipo: "saida",
      codigo: { linguagem: "python", trecho: "print(1)" },
      alternativasCodigo: true,
    };
    const v = poolGateViolations(
      [q],
      [
        {
          label: "intermediario / X",
          codeQuota: 1,
          ids: ["python-int-05"],
          eligible: ["basico.tipos"],
        },
      ],
      ["python"],
      null,
    );
    expect(
      v.some((l) =>
        l.startsWith(
          "python-int-05 (fonte basico.variaveis): pergunta de codigo sobre passo sem trecho autocontido",
        ),
      ),
    ).toBe(true);
  });
});
