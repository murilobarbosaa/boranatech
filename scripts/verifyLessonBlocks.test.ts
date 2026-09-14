import { describe, expect, it } from "vitest";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import {
  blocosDaTrilha,
  conferirBloco,
  extrairBlocos,
  relatorioBlocos,
} from "./verifyLessonBlocks.mts";
import type { Execucao } from "./verifyQuizPoolByExecution.mts";

// So as funcoes puras: a execucao real fica fora, com executor stub.
const executorQueRoda = (): Execucao => ({
  status: 0,
  stdout: "ok\n",
  erro: "",
  timeout: false,
});
const executorQueLanca = (): Execucao => ({
  status: 1,
  stdout: "",
  erro: "ReferenceError: x is not defined",
  timeout: false,
});

describe("extrairBlocos", () => {
  it("devolve linguagem e corpo de cada cerca, na ordem", () => {
    const blocos = extrairBlocos(
      "Texto.\n\n```bash\n$ git status\n```\n\nMais.\n\n```js\nconsole.log(1);\n```",
    );
    expect(blocos).toEqual([
      { linguagem: "bash", corpo: "$ git status" },
      { linguagem: "js", corpo: "console.log(1);" },
    ]);
  });
});

describe("conferirBloco: bash valida a convencao sem executar", () => {
  it("bloco bash valido passa e sai nao-executado", () => {
    const r = conferirBloco(
      {
        linguagem: "bash",
        corpo:
          "$ git status\nOn branch main\nnothing to commit, working tree clean",
      },
      ["bash"],
      () => {
        throw new Error("bash nao pode ser executado");
      },
    );
    expect(r.veredito).toBe("nao-executado");
    expect(r.problemas).toEqual([]);
  });

  it("linha de comando sem o prefixo $ acusa", () => {
    const r = conferirBloco(
      { linguagem: "bash", corpo: "git status" },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(r.problemas.some((p) => p.includes("$ "))).toBe(true);
  });

  it("comando git no meio da saida sem o prefixo $ acusa", () => {
    const r = conferirBloco(
      {
        linguagem: "bash",
        corpo: "$ git status\nOn branch main\ngit add .",
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(r.problemas.some((p) => p.includes("linha 3"))).toBe(true);
  });

  it("linha acima de 60 caracteres e bloco acima de 10 linhas acusam", () => {
    const longa = conferirBloco(
      { linguagem: "bash", corpo: `$ git commit -m "${"x".repeat(60)}"` },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(longa.problemas.some((p) => p.includes("60"))).toBe(true);
    const comprido = conferirBloco(
      {
        linguagem: "bash",
        corpo: Array.from({ length: 11 }, () => "$ git status").join("\n"),
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(comprido.problemas.some((p) => p.includes("10 linhas"))).toBe(true);
  });
});

describe("conferirBloco: js continua executando", () => {
  it("bloco js que roda sai executado", () => {
    const r = conferirBloco(
      { linguagem: "js", corpo: "console.log('ok');" },
      ["js"],
      () => executorQueRoda(),
    );
    expect(r.veredito).toBe("executado");
    expect(r.problemas).toEqual([]);
  });

  it("bloco js que lanca sai falhou, com o erro", () => {
    const r = conferirBloco(
      { linguagem: "js", corpo: "console.log(x);" },
      ["js"],
      () => executorQueLanca(),
    );
    expect(r.veredito).toBe("falhou");
    expect(r.problemas.join(" ")).toContain("ReferenceError");
  });

  it("cerca fora de codeLanguages so confere limites, sem executar", () => {
    const r = conferirBloco(
      { linguagem: "json", corpo: '{ "a": 1 }' },
      ["js"],
      () => {
        throw new Error("json nao pode ser executado");
      },
    );
    expect(r.veredito).toBe("fora-de-codeLanguages");
    expect(r.problemas).toEqual([]);
  });
});

describe("blocosDaTrilha e relatorioBlocos", () => {
  const trilha = {
    slug: "git",
    codeLanguages: ["bash"],
    sections: [
      {
        id: "s",
        title: "S",
        children: [
          {
            id: "s.a",
            title: "A",
            content: "```bash\n$ git init\n```",
          },
          {
            id: "s.b",
            title: "B",
            byLanguage: {
              linux: { content: "```bash\ngit log\n```" },
            },
          },
        ],
      },
    ],
  } as unknown as RoadmapV2;

  it("percorre content e byLanguage, com o passo de cada bloco", () => {
    const blocos = blocosDaTrilha(trilha);
    expect(blocos.map((b) => b.passo)).toEqual(["s.a", "s.b [linux]"]);
  });

  it("o resumo conta nao-executados, divergencias e traz o aviso sem runner", () => {
    const linhas = blocosDaTrilha(trilha).map((b) => ({
      passo: b.passo,
      linguagem: b.linguagem,
      ...conferirBloco(b, ["bash"], () => executorQueRoda()),
    }));
    const saida = relatorioBlocos(linhas);
    expect(saida).toContain(
      "blocos: 2 | executados: 0 | nao-executados: 2 | falharam: 0 | fora de codeLanguages: 0 | divergencias de convencao: 1",
    );
    expect(saida).toContain(
      "[aviso] 2 trechos de bash sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria",
    );
  });
});
