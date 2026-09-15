import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "../shared/roadmapQuiz/types";
import {
  conferirCodigo,
  erroDoStderr,
  excecaoObservada,
  type Execucao,
  fillGap,
  makeExecutor,
  normalizeStdout,
  relatorioVerificacao,
  resumoCorreta,
  runnerFor,
  stdoutMatches,
  tabelaRevisao,
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

  it("stub: a linha e a do trecho, nao a da biblioteca padrao onde a excecao nasceu", () => {
    const r = excecaoObservada(erroPy, () => ({
      status: 1,
      stdout: "",
      erro: "json.decoder.JSONDecodeError: Expecting property name",
      timeout: false,
      stderr:
        'Traceback (most recent call last):\n  File "/tmp/verify-pool-x/q7.py", line 3, in <module>\n    dados = json.loads(texto)\n  File "/usr/lib/python3.12/json/__init__.py", line 346, in loads\n    return _default_decoder.decode(s)\n  File "/usr/lib/python3.12/json/decoder.py", line 353, in raw_decode\n    obj, end = self.scan_once(s, idx)\njson.decoder.JSONDecodeError: Expecting property name',
    }));
    expect(r).toBe(
      "json.decoder.JSONDecodeError: Expecting property name (linha 3)",
    );
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

describe("relatorioVerificacao: o verificador diz o que fez e o que nao fez", () => {
  const linhas = [
    {
      id: "git-ini-01",
      tipo: "saida",
      fonte: "git.status",
      linguagem: "bash",
      resultado: "linguagem bash",
      veredito: "SEM RUNNER" as const,
    },
    {
      id: "python-ini-09",
      tipo: "erro",
      fonte: "valores.conversao",
      linguagem: "python",
      resultado: "lanca: ValueError",
      veredito: "OK" as const,
      observado: "ValueError: could not convert (linha 2)",
    },
  ];

  it("pergunta sem runner sai marcada nao-executado, sem linha observado", () => {
    const saida = relatorioVerificacao(linhas);
    expect(saida).toContain("git-ini-01  saida  nao-executado");
    expect(
      saida.some((l) => l.startsWith("git-ini-01  saida  observado")),
    ).toBe(false);
    expect(saida).toContain(
      "python-ini-09  erro  observado: ValueError: could not convert (linha 2)",
    );
  });

  it("o resumo traz a contagem de nao executados com o aviso de revisao humana", () => {
    const saida = relatorioVerificacao(linhas);
    expect(saida).toContain(
      "[aviso] 1 trechos de bash sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria",
    );
  });
});

describe("tabelaRevisao: uma linha por pergunta de codigo para a revisao humana", () => {
  const base = {
    nivel: "iniciante" as const,
    pergunta: "Pergunta?",
    explicacao: "Explicacao.",
    fonte: "folha.x",
  };
  const perguntas: QuizQuestion[] = [
    {
      ...base,
      id: "git-ini-01",
      tipo: "saida",
      codigo: { linguagem: "bash", trecho: "git pull" },
      alternativas: {
        a: "Already up to date.",
        b: "fatal: not a git repository",
        c: "nothing to commit",
        d: "error: failed to push",
      },
      correta: "a",
      alternativasCodigo: true,
    },
    {
      ...base,
      id: "git-ini-02",
      alternativas: { a: "Um", b: "Dois", c: "Tres", d: "Quatro" },
      correta: "b",
    },
    {
      ...base,
      id: "python-ini-03",
      tipo: "erro",
      codigo: {
        linguagem: "python",
        trecho: "x = int('a')",
        saidaEsperada: "1",
      },
      alternativas: {
        a: "int nao converte a string 'a' e a linha lanca ValueError antes de qualquer print\nno programa",
        b: "b",
        c: "c",
        d: "d",
      },
      correta: "a",
    },
    {
      ...base,
      id: "html-ini-04",
      tipo: "completar",
      codigo: { linguagem: "html", trecho: "<____>Titulo</h1>" },
      alternativas: { a: "h2", b: "h1", c: "p", d: "div" },
      correta: "b",
      alternativasCodigo: true,
    },
  ];

  it("uma linha por pergunta de codigo e nenhuma para conceito", () => {
    const tabela = tabelaRevisao(perguntas);
    expect(tabela).toHaveLength(3);
    expect(tabela.some((l) => l.includes("git-ini-02"))).toBe(false);
  });

  it("cada linha traz id, tipo, linguagem, execucao e o resumo da correta", () => {
    const tabela = tabelaRevisao(perguntas);
    expect(tabela[0]).toBe(
      "git-ini-01 | saida | bash | nao-executado | - | Already up to date.",
    );
    expect(tabela[2]).toBe(
      "html-ini-04 | completar | html | nao-executado | limpo (erradas limpas: 0/3) | h1",
    );
    expect(
      tabela[1].startsWith("python-ini-03 | erro | python | executado | - | "),
    ).toBe(true);
  });

  it("o resumo da correta tem no maximo 60 caracteres e uma linha so", () => {
    const resumo = resumoCorreta(
      "int nao converte a string 'a' e a linha lanca ValueError antes de qualquer print\nno programa",
    );
    expect(resumo.length).toBeLessThanOrEqual(60);
    expect(resumo.endsWith("...")).toBe(true);
    expect(resumo).not.toContain("\n");
    expect(resumoCorreta("  curta   com\n espacos ")).toBe("curta com espacos");
    expect(resumoCorreta("x".repeat(60))).toBe("x".repeat(60));
  });

  it("linguagem fora de LANGUAGE_CAPABILITIES e erro de configuracao, nao linha", () => {
    expect(() =>
      tabelaRevisao([
        {
          ...perguntas[0],
          id: "x-ini-01",
          codigo: { linguagem: "cobol", trecho: "DISPLAY 'OI'." },
        },
      ]),
    ).toThrow(/cobol/);
  });
});

describe("tabelaRevisao: coluna estrutura nas perguntas de html", () => {
  const base = {
    nivel: "iniciante" as const,
    pergunta: "Qual e o defeito?",
    explicacao: "Explicacao.",
    fonte: "fundamentos.documento",
  };
  const perguntas: QuizQuestion[] = [
    {
      ...base,
      id: "html-ini-01",
      tipo: "erro",
      codigo: { linguagem: "html", trecho: "<div>\n  <p>texto</p>" },
      alternativas: {
        a: "A div abre e nunca fecha",
        b: "O p esta fora de ordem",
        c: "Falta o atributo lang",
        d: "A div nao aceita p dentro",
      },
      correta: "a",
    },
    {
      ...base,
      id: "html-ini-02",
      tipo: "completar",
      codigo: {
        linguagem: "html",
        trecho: '<img src="foto.jpg" ____="Ana sorrindo">',
      },
      alternativas: { a: "alt", b: "title", c: "name", d: "label" },
      correta: "a",
      alternativasCodigo: true,
    },
    {
      ...base,
      id: "git-ini-01",
      tipo: "completar",
      codigo: { linguagem: "bash", trecho: "$ git ____ ." },
      alternativas: { a: "add", b: "commit", c: "status", d: "restore" },
      correta: "a",
      alternativasCodigo: true,
    },
  ];

  it("erro com defeito estrutural sai com acusa e o problema", () => {
    const linha = tabelaRevisao(perguntas)[0];
    expect(linha).toContain("| acusa:");
    expect(linha).toContain("div");
  });

  it("completar com a correta na lacuna sai limpo e conta as erradas limpas", () => {
    const linha = tabelaRevisao(perguntas)[1];
    expect(linha).toContain("| limpo");
    expect(linha).toMatch(/erradas limpas: \d\/3/);
  });

  it("linguagem sem verificador estrutural mostra hifen na coluna", () => {
    expect(tabelaRevisao(perguntas)[2].split(" | ")[4]).toBe("-");
  });
});
