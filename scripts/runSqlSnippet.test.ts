import { readdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { capabilityOf } from "./languageCapabilities.mts";
import { conferirBloco } from "./verifyLessonBlocks.mts";
import {
  erroDoStderr,
  linhaDoErro,
  makeExecutor,
} from "./verifyQuizPoolByExecution.mts";

// Lote 11a. Controles do runner de SQL, pelo EXECUTOR REAL: o formato de saida
// e de erro e o contrato de que a trilha e a pool dependem, e um stub provaria
// so o meu if.
const runner = capabilityOf("sql").runner!;
const executar = makeExecutor(runner);
const LIMITE = 30000;

// Mesmo censo do runTsSnippet.test.ts: pelo EXECUTAVEL, nunca por comm (o node
// renomeia a thread principal para "MainThread") e nunca por pgrep, que
// casaria a linha de comando do proprio teste.
function processosCitando(dir: string): string[] {
  const achados: string[] = [];
  for (const pid of readdirSync("/proc")) {
    if (!/^\d+$/.test(pid)) continue;
    let cmd: string;
    try {
      cmd = readFileSync(`/proc/${pid}/cmdline`).toString("utf8");
    } catch {
      continue;
    }
    if (!cmd.includes(dir)) continue;
    try {
      if (!realpathSync(`/proc/${pid}/exe`).endsWith("/node")) continue;
    } catch {
      continue;
    }
    achados.push(`${pid} ${cmd.replace(/\0/g, " ").trim().slice(0, 120)}`);
  }
  return achados;
}

const TABELA =
  "CREATE TABLE p (nome TEXT, preco REAL);\n" +
  "INSERT INTO p VALUES ('caneta', 2.5), ('caderno', 12);\n";

describe("runner de sql: formato de saida", () => {
  it(
    "consulta simples imprime cabecalho e valor",
    () => {
      const r = executar("SELECT 1 + 1 AS total;\n");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("total\n2\n");
    },
    LIMITE,
  );

  it(
    "tabela com ORDER BY: cabecalho e duas linhas exatas",
    () => {
      const r = executar(
        TABELA + "SELECT nome, preco FROM p ORDER BY preco;\n",
      );
      expect(r.status).toBe(0);
      // 12 numa coluna REAL e real: sai 12.0, como no shell sqlite3.
      expect(r.stdout).toBe("nome | preco\ncaneta | 2.5\ncaderno | 12.0\n");
    },
    LIMITE,
  );

  it(
    "NULL sai como NULL",
    () => {
      const r = executar("SELECT NULL AS vazio, 'x' AS letra;\n");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("vazio | letra\nNULL | x\n");
    },
    LIMITE,
  );

  it(
    "consulta sem registro imprime so o cabecalho",
    () => {
      const r = executar(TABELA + "SELECT nome FROM p WHERE preco > 100;\n");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("nome\n");
    },
    LIMITE,
  );

  it(
    "duas consultas saem separadas por uma linha em branco",
    () => {
      const r = executar("SELECT 1 AS a;\nSELECT 2 AS b;\n");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("a\n1\n\nb\n2\n");
    },
    LIMITE,
  );

  it(
    "blob sai em hexadecimal",
    () => {
      const r = executar("SELECT x'0aff' AS dado;\n");
      expect(r.stdout).toBe("dado\nx'0aff'\n");
    },
    LIMITE,
  );

  it(
    "instrucao sem resultado nao imprime nada",
    () => {
      const r = executar(TABELA);
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("");
    },
    LIMITE,
  );

  it(
    "sucesso deixa o stderr VAZIO (o aviso experimental nao sai)",
    () => {
      const r = executar("SELECT 1 AS um;\n");
      expect(r.status).toBe(0);
      expect(r.stderr).toBe("");
    },
    LIMITE,
  );
});

// Conserto da decisao 3. Real impresso pelo String() do JavaScript diverge do
// que o aluno ve no shell sqlite3: 12.0 saia 12, AVG saia 8 em vez de 8.0, e
// 0.1 + 0.2 saia 0.30000000000000004 em vez de 0.3. O real passa a ser
// formatado pelo proprio SQLite com printf('%!.15g'), que e o formato do shell.
describe("runner de sql: real no formato do shell sqlite3", () => {
  const um = (sql: string) => executar(sql).stdout.split("\n")[1];

  it(
    "SELECT 12.0 sai 12.0",
    () => {
      expect(um("SELECT 12.0 AS v;\n")).toBe("12.0");
    },
    LIMITE,
  );

  it(
    "SELECT 0.1 + 0.2 sai 0.3",
    () => {
      expect(um("SELECT 0.1 + 0.2 AS v;\n")).toBe("0.3");
    },
    LIMITE,
  );

  it(
    "SELECT 2.5 sai 2.5",
    () => {
      expect(um("SELECT 2.5 AS v;\n")).toBe("2.5");
    },
    LIMITE,
  );

  it(
    "AVG de 7 e 9 inteiros sai 8.0",
    () => {
      expect(
        um("SELECT avg(x) AS v FROM (SELECT 7 AS x UNION ALL SELECT 9);\n"),
      ).toBe("8.0");
    },
    LIMITE,
  );

  it(
    "CONTROLE: inteiro continua inteiro",
    () => {
      expect(um("SELECT 7 AS v;\n")).toBe("7");
    },
    LIMITE,
  );
});

describe("runner de sql: divisao em instrucoes", () => {
  it(
    "; dentro de aspas nao divide",
    () => {
      const r = executar("SELECT 'a;b' AS t;\n");
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("t\na;b\n");
    },
    LIMITE,
  );

  it(
    "; em comentario de linha e de bloco nao divide",
    () => {
      const r = executar(
        "-- comentario; com ponto e virgula\nSELECT 1 /* ; */ + 1 AS n;\n",
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("n\n2\n");
    },
    LIMITE,
  );
});

describe("runner de sql: erros", () => {
  it(
    "UNIQUE violado: SQLITE_CONSTRAINT na linha do segundo INSERT",
    () => {
      const r = executar(
        "CREATE TABLE u (email TEXT UNIQUE);\n" +
          "INSERT INTO u VALUES ('a@x');\n" +
          "INSERT INTO u VALUES ('a@x');\n",
      );
      expect(r.status).toBe(1);
      expect(r.erro).toMatch(/^SQLITE_CONSTRAINT: /);
      expect(linhaDoErro(r.stderr ?? "")).toBe(3);
    },
    LIMITE,
  );

  it(
    "coluna inexistente: SQLITE_ERROR na linha da consulta",
    () => {
      const r = executar(TABELA + "\nSELECT nada\nFROM p;\n");
      expect(r.status).toBe(1);
      expect(r.erro).toMatch(/^SQLITE_ERROR: /);
      expect(r.erro).toContain("nada");
      expect(linhaDoErro(r.stderr ?? "")).toBe(4);
    },
    LIMITE,
  );

  it(
    "mais de 200 registros e erro, rapido",
    () => {
      const inicio = Date.now();
      const r = executar(
        "WITH RECURSIVE c(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM c)\nSELECT n FROM c;\n",
      );
      expect(r.timeout).toBe(false);
      expect(r.status).toBe(1);
      expect(r.erro).toContain("resultado com mais de 200 linhas");
      expect(Date.now() - inicio).toBeLessThan(5000);
    },
    LIMITE,
  );

  it(
    "ATTACH e recusado e nao grava arquivo no diretorio do executor",
    () => {
      const r = executar("ATTACH 'x.db' AS x;\n");
      expect(r.status).toBe(1);
      expect(r.erro).toContain("ATTACH");
      expect(r.erro).toContain("nao e permitido");
      const dir = executar.dir;
      // O diretorio some quando fica vazio; se ainda existir, nao tem x.db.
      let conteudo: string[] = [];
      try {
        conteudo = readdirSync(dir!);
      } catch {
        conteudo = [];
      }
      expect(conteudo).not.toContain("x.db");
    },
    LIMITE,
  );

  it(
    "DETACH e recusado",
    () => {
      const r = executar("DETACH x;\n");
      expect(r.status).toBe(1);
      expect(r.erro).toContain("DETACH");
    },
    LIMITE,
  );

  it(
    "VACUUM INTO e recusado",
    () => {
      const r = executar("VACUUM INTO 'y.db';\n");
      expect(r.status).toBe(1);
      expect(r.erro).toContain("VACUUM INTO");
    },
    LIMITE,
  );

  it(
    "load_extension e recusado",
    () => {
      const r = executar("SELECT load_extension('x');\n");
      expect(r.status).toBe(1);
      expect(r.erro).toContain("load_extension");
    },
    LIMITE,
  );

  it(
    "CREATE TRIGGER e recusado",
    () => {
      const r = executar(
        "CREATE TABLE t (v);\nCREATE TRIGGER g AFTER INSERT ON t BEGIN SELECT 1; END;\n",
      );
      expect(r.status).toBe(1);
      expect(r.erro).toContain("CREATE TRIGGER");
      expect(linhaDoErro(r.stderr ?? "")).toBe(2);
    },
    LIMITE,
  );

  // Decisao 2: o wrapper e um processo so e nao instala handler de sinal. Uma
  // consulta presa numa chamada nativa (count(*) sobre CTE sem fim) nunca
  // devolveria o controle ao loop de eventos, e o SIGTERM do executor so a
  // derruba porque a acao padrao do sinal continua valendo.
  it(
    "CTE sem fim dentro de count(*) estoura o timeout e nao deixa processo",
    async () => {
      const r = executar(
        "WITH RECURSIVE c(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM c)\nSELECT count(*) FROM c;\n",
      );
      expect(r.timeout).toBe(true);
      const dir = executar.dir;
      expect(typeof dir).toBe("string");
      const prazo = Date.now() + 3000;
      let vivos = processosCitando(dir!);
      while (vivos.length > 0 && Date.now() < prazo) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        vivos = processosCitando(dir!);
      }
      expect(vivos).toEqual([]);
    },
    LIMITE,
  );
});

describe("erroDoStderr e linhaDoErro leem o erro do sqlite", () => {
  const stderr =
    "q0.sql:3: error SQLITE_CONSTRAINT: UNIQUE constraint failed: u.email\n";

  it("o erro sai com o codigo primario e a mensagem", () => {
    expect(erroDoStderr(stderr)).toBe(
      "SQLITE_CONSTRAINT: UNIQUE constraint failed: u.email",
    );
  });

  it("a linha sai do prefixo", () => {
    expect(linhaDoErro(stderr)).toBe(3);
  });

  it("os formatos de ts, python e mjs continuam sendo lidos", () => {
    expect(linhaDoErro("q0.ts(3,7): error TS2322: x")).toBe(3);
    expect(
      linhaDoErro(
        'Traceback:\n  File "/tmp/q0.py", line 4, in <module>\nKeyError: 1',
      ),
    ).toBe(4);
    expect(linhaDoErro("file:///tmp/x/q0.mjs:7\nReferenceError: x")).toBe(7);
    expect(erroDoStderr("q0.ts(3,7): error TS2322: tipo")).toBe("TS2322: tipo");
  });
});

// Contrato com o verificador de blocos: `lanca=` casa por palavra inteira, e o
// formato de erro leva so o codigo PRIMARIO justamente para `lanca=SQLITE_CONSTRAINT`
// casar sem precisar do sufixo _UNIQUE.
describe("lanca= em bloco sql", () => {
  const corpo =
    "CREATE TABLE u (email TEXT UNIQUE);\n" +
    "INSERT INTO u VALUES ('a@x');\n" +
    "INSERT INTO u VALUES ('a@x');";

  it(
    "lanca=SQLITE_CONSTRAINT num UNIQUE violado passa",
    () => {
      const c = conferirBloco(
        { linguagem: "sql", corpo, lanca: "SQLITE_CONSTRAINT" },
        ["sql"],
        executar,
      );
      expect(c.veredito).toBe("lancou-como-esperado");
    },
    LIMITE,
  );

  it(
    "lanca=SQLITE_ERROR no mesmo bloco reprova",
    () => {
      const c = conferirBloco(
        { linguagem: "sql", corpo, lanca: "SQLITE_ERROR" },
        ["sql"],
        executar,
      );
      expect(c.veredito).toBe("falhou");
    },
    LIMITE,
  );
});

it("o wrapper mora ao lado deste teste", () => {
  expect(path.basename(runner.args![runner.args!.length - 1])).toBe(
    "runSqlSnippet.mjs",
  );
});
