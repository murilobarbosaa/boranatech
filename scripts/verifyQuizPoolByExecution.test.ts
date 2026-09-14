import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  conferirCodigo,
  erroDoStderr,
  excecaoObservada,
  type Execucao,
  fillGap,
  makeExecutor,
  normalizeStdout,
  runnerFor,
  stdoutMatches,
} from "./verifyQuizPoolByExecution.mts";

// So as funcoes puras do verificador: a execucao real (spawn de node ou
// python3) fica fora do teste. Literais escritos a mao.
describe("normalizeStdout e stdoutMatches", () => {
  it("normaliza quebras de linha e espacos das pontas", () => {
    expect(normalizeStdout("  a\r\nb \n\n")).toBe("a\nb");
  });

  it("compara saida com alternativa ignorando espacos das pontas de cada linha", () => {
    expect(stdoutMatches("uva\nkiwi\nmanga\n", "uva\nkiwi\nmanga")).toBe(true);
    expect(stdoutMatches("uva\nkiwi\nmanga", "uva, kiwi, manga")).toBe(false);
    expect(stdoutMatches("50", "O codigo imprime 50.")).toBe(false);
  });
});

describe("fillGap", () => {
  it("substitui a unica lacuna pela alternativa", () => {
    expect(fillGap("const a = ____;", "1")).toBe("const a = 1;");
  });

  it("nao mexe num trecho sem lacuna", () => {
    expect(fillGap("const a = 1;", "2")).toBe("const a = 1;");
  });
});

describe("runnerFor", () => {
  it("js roda com node em .mjs", () => {
    expect(runnerFor("js")).toEqual({ command: "node", ext: ".mjs" });
  });

  it("python roda com python3 em .py", () => {
    expect(runnerFor("python")).toEqual({ command: "python3", ext: ".py" });
  });

  it("linguagem sem runner devolve null", () => {
    expect(runnerFor("bash")).toBeNull();
  });
});

describe("erroDoStderr", () => {
  it("prefere a ultima linha de erro, nao a linha de codigo que o Node imprime antes", () => {
    const stderr = [
      "file:///tmp/q.mjs:3",
      "    if (id <= 0) return rejeitar(new Error('id invalido'));",
      "                                 ^",
      "",
      "Error: id invalido",
      "    at file:///tmp/q.mjs:3:34",
      "",
      "Node.js v24.13.1",
    ].join("\n");
    expect(erroDoStderr(stderr)).toBe("Error: id invalido");
  });

  it("aceita nome de erro no inicio da linha (SyntaxError, TypeError)", () => {
    expect(
      erroDoStderr("x\n\nSyntaxError: missing ) after argument list\n    at y"),
    ).toBe("SyntaxError: missing ) after argument list");
  });

  it("sem linha de erro devolve a primeira linha nao vazia", () => {
    expect(erroDoStderr("\n  aviso qualquer\n")).toBe("aviso qualquer");
    expect(erroDoStderr("")).toBe("");
  });
});

describe("conferirCodigo com executor stub", () => {
  const ok = (stdout: string): Execucao => ({
    status: 0,
    stdout,
    erro: "",
    timeout: false,
  });
  const falha = (erro: string): Execucao => ({
    status: 1,
    stdout: "",
    erro,
    timeout: false,
  });
  const alternativas = { a: "1", b: "1.0", c: "2", d: "3" };

  it("saida cujo stdout difere da correta e CORRIGIR", () => {
    const r = conferirCodigo(
      {
        tipo: "saida",
        codigo: { linguagem: "js", trecho: "console.log(3);" },
        alternativas: { a: "2", b: "3", c: "4", d: "5" },
        correta: "a",
      },
      () => ok("3"),
    );
    expect(r.veredito).toBe("CORRIGIR");
    expect(r.resultado).toContain('obtido="3"');
  });

  it("erro com saidaEsperada que roda limpo e imprime a saida esperada e CORRIGIR", () => {
    const r = conferirCodigo(
      {
        tipo: "erro",
        codigo: {
          linguagem: "js",
          trecho: "console.log(2);",
          saidaEsperada: "2",
        },
        alternativas,
        correta: "a",
      },
      () => ok("2"),
    );
    expect(r.veredito).toBe("CORRIGIR");
    expect(r.resultado).toContain("erro sem defeito");
  });

  it("erro com saidaEsperada que lanca ou diverge e OK", () => {
    const base = {
      tipo: "erro" as const,
      codigo: {
        linguagem: "js",
        trecho: "console.log(x);",
        saidaEsperada: "2",
      },
      alternativas,
      correta: "a" as const,
    };
    expect(
      conferirCodigo(base, () => falha("ReferenceError: x")).veredito,
    ).toBe("OK");
    expect(conferirCodigo(base, () => ok("3")).veredito).toBe("OK");
  });

  it("erro sem saidaEsperada continua LER", () => {
    const r = conferirCodigo(
      {
        tipo: "erro",
        codigo: { linguagem: "js", trecho: "console.log(2);" },
        alternativas,
        correta: "a",
      },
      () => ok("2"),
    );
    expect(r.veredito).toBe("LER");
  });

  it("completar com distrator equivalente e CORRIGIR e o nomeia", () => {
    const r = conferirCodigo(
      {
        tipo: "completar",
        codigo: { linguagem: "js", trecho: "const a = ____;\nconsole.log(a);" },
        alternativas,
        correta: "a",
      },
      (code) => ok(String(Number(code.match(/const a = (.*);/)?.[1]))),
    );
    expect(r.veredito).toBe("CORRIGIR");
    expect(r.resultado).toContain("distratores equivalentes: b");
  });
});

// Execucao REAL (os unicos testes deste arquivo que chamam python3): o trecho
// que roda vem de um modelo, e estas duas asserções sao a prova do
// isolamento. Um trecho criou usuario.json na raiz do repositorio durante a
// geracao do Lote 06, porque o spawn herdava o cwd e o env do gerador.
describe("isolamento do executor", () => {
  const runner = runnerFor("python");
  if (!runner) throw new Error("runner de python ausente");

  it("escrita do trecho fica no diretorio do executor, nao no worktree", () => {
    const executar = makeExecutor(runner);
    const escreveu = executar(
      "with open('marcador.txt', 'w') as f:\n    f.write('x')\nprint('ok')",
    );
    expect(escreveu.status).toBe(0);
    expect(normalizeStdout(escreveu.stdout)).toBe("ok");
    const leu = executar("print(open('marcador.txt').read())");
    expect(normalizeStdout(leu.stdout)).toBe("x");
    const noWorktree = path.join(process.cwd(), "marcador.txt");
    expect(existsSync(noWorktree)).toBe(false);
    rmSync(noWorktree, { force: true });
  });

  it("o trecho nao enxerga os segredos do processo do gerador", () => {
    process.env.OPENAI_API_KEY = "sk-teste-do-vitest";
    const executar = makeExecutor(runner);
    const r = executar(
      "import os\nprint(os.environ.get('OPENAI_API_KEY'))\nprint(os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))",
    );
    expect(r.status).toBe(0);
    expect(normalizeStdout(r.stdout)).toBe("None\nNone");
  });

  it("trecho que espera entrada do usuario falha rapido em vez de travar", () => {
    const executar = makeExecutor(runner);
    const r = executar("nome = input()\nprint(nome)");
    expect(r.status).not.toBe(0);
    expect(r.timeout).toBe(false);
  });
});

describe("excecaoObservada: o que a execucao de uma pergunta de erro viu", () => {
  const alternativas = { a: "1", b: "2", c: "3", d: "4" };
  const erroPy = {
    tipo: "erro" as const,
    codigo: {
      linguagem: "python",
      trecho: "x = 1\ny = (x malformado)\nprint(y)",
      saidaEsperada: "1",
    },
    alternativas,
    correta: "a" as const,
  };

  it("stub: SyntaxError com a linha do traceback do python", () => {
    const r = excecaoObservada(erroPy, () => ({
      status: 1,
      stdout: "",
      erro: "SyntaxError: invalid syntax",
      timeout: false,
      stderr:
        '  File "/tmp/x/q0.py", line 2\n    y = (x malformado)\n         ^\nSyntaxError: invalid syntax',
    }));
    expect(r).toBe("SyntaxError: invalid syntax (linha 2)");
  });

  it("pergunta de saida nao produz linha e nem executa", () => {
    const r = excecaoObservada(
      {
        tipo: "saida",
        codigo: { linguagem: "python", trecho: "print(1)" },
      },
      () => {
        throw new Error("nao devia executar");
      },
    );
    expect(r).toBeNull();
  });

  it("erro que roda limpo diz isso, com o stdout", () => {
    const r = excecaoObservada(erroPy, () => ({
      status: 0,
      stdout: "3\n",
      erro: "",
      timeout: false,
    }));
    expect(r).toBe('roda limpo, stdout="3"');
  });

  it("execucao real em python: SyntaxError e a linha 2", () => {
    const runner = runnerFor("python");
    if (!runner) throw new Error("runner de python ausente");
    const r = excecaoObservada(erroPy, makeExecutor(runner));
    expect(r).toMatch(/^SyntaxError: .* \(linha 2\)$/);
  });

  it("execucao real em node: ReferenceError e a linha 2", () => {
    const runner = runnerFor("js");
    if (!runner) throw new Error("runner de js ausente");
    const r = excecaoObservada(
      {
        tipo: "erro",
        codigo: {
          linguagem: "js",
          trecho: "const a = 1;\nconsole.log(b);",
          saidaEsperada: "1",
        },
      },
      makeExecutor(runner),
    );
    expect(r).toBe("ReferenceError: b is not defined (linha 2)");
  });
});
