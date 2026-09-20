import { describe, expect, it } from "vitest";
import type { QuizPool } from "../shared/roadmapQuiz/types";
import { capabilityOf } from "./languageCapabilities.mts";
import { conferirGrupo } from "./verifyLessonBlocks.mts";
import {
  conferirCodigo,
  erroDoStderr,
  linhaDoErro,
  makeExecutor,
  makeGroupExecutor,
} from "./verifyQuizPoolByExecution.mts";

// Lote 10a. Controles do runner de TypeScript, pelo EXECUTOR REAL: o que eles
// precisam provar e que a checagem de tipos acontece ANTES da execucao, e um
// stub provaria so o meu if. O tsx sozinho nao serviria como runner: ele
// remove os tipos sem conferir, e todo caso de TS abaixo passaria calado.
const runner = capabilityOf("ts").runner!;
const executar = makeExecutor(runner);
const LIMITE = 30000;

describe("runner de ts: checagem de tipos antes da execucao", () => {
  it("codigo valido roda e imprime", () => {
    const r = executar("const total: number = 2 + 3;\nconsole.log(total);\n");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("5\n");
  }, LIMITE);

  it("erro de tipo reprova com o codigo TS e a linha", () => {
    const r = executar('const n: number = "5";\n');
    expect(r.status).not.toBe(0);
    expect(r.erro).toContain("TS2322");
    expect(linhaDoErro(r.stderr ?? "")).toBe(1);
  }, LIMITE);

  it("sem a lib dom, um global do navegador e erro de nome", () => {
    // Se a lib dom entrasse, `name` existiria como global e o erro de
    // variavel nao declarada passaria calado.
    const r = executar("console.log(name);\n");
    expect(r.status).not.toBe(0);
    expect(r.erro).toContain("TS2304");
  }, LIMITE);

  it("chamada com argumento faltando reprova", () => {
    const r = executar(
      "function soma(a: number, b: number) {\n  return a + b;\n}\nconsole.log(soma(1));\n",
    );
    expect(r.status).not.toBe(0);
    expect(r.erro).toContain("TS2554");
  }, LIMITE);

  it("codigo com tipos certos que quebra em execucao lanca de verdade", () => {
    const r = executar('const x = JSON.parse("{");\nconsole.log(x);\n');
    expect(r.status).not.toBe(0);
    expect(r.erro).toContain("SyntaxError");
  }, LIMITE);

  it("interface e objeto tipado rodam", () => {
    const r = executar(
      'interface P {\n  nome: string;\n}\nconst p: P = { nome: "Ana" };\nconsole.log(p.nome);\n',
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("Ana\n");
  }, LIMITE);

  it("laco infinito estoura o timeout", () => {
    const r = executar("while (true) {}\n");
    expect(r.timeout).toBe(true);
  }, LIMITE);

  it("process nao esta declarado, e o ambiente do filho nao tem a chave", () => {
    // Duas protecoes independentes: a checagem de tipos recusa `process`, e
    // mesmo que ela fosse pulada o ambiente montado do zero nao carrega o .env.
    const r = executar('console.log(process.env.OPENAI_API_KEY ?? "vazio");\n');
    expect(r.status).not.toBe(0);
    expect(r.erro).toMatch(/TS2\d{3}/);
    expect(r.erro).toContain("process");
  }, LIMITE);
});

describe("erroDoStderr e linhaDoErro leem o diagnostico do compilador", () => {
  const stderr =
    "q0.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.\n";

  it("o erro sai com o codigo TS e a mensagem", () => {
    expect(erroDoStderr(stderr)).toBe(
      "TS2322: Type 'string' is not assignable to type 'number'.",
    );
  });

  it("a linha sai do diagnostico", () => {
    expect(linhaDoErro(stderr)).toBe(3);
  });

  it("stderr de runtime continua sendo lido como antes", () => {
    expect(linhaDoErro("file:///tmp/x/q0.mjs:7\nReferenceError: x")).toBe(7);
  });
});

// Pool minima de ts, em memoria: nunca em server/data. Prova que o verificador
// de pool trata ts como qualquer linguagem com runner, sem mudanca alem da
// capacidade.
describe("verificacao de pool em ts, com uma pergunta de cada tipo", () => {
  const pool: QuizPool = {
    slug: "ts-teste",
    questions: [],
  } as unknown as QuizPool;

  it("saida: roda e bate com a correta", () => {
    const r = conferirCodigo(
      {
        tipo: "saida",
        codigo: {
          linguagem: "ts",
          trecho: "const n: number = 21;\nconsole.log(n * 2);\n",
        },
        alternativas: { a: "42", b: "21", c: "2142", d: "NaN" },
        correta: "a",
      },
      executar,
    );
    expect(r.veredito).toBe("OK");
  }, LIMITE);

  it("completar: a correta roda e nenhuma errada da o mesmo stdout", () => {
    const r = conferirCodigo(
      {
        tipo: "completar",
        codigo: {
          linguagem: "ts",
          trecho: "const nome: ____ = 'Ana';\nconsole.log(nome.length);\n",
        },
        alternativas: { a: "string", b: "number", c: "boolean", d: "void" },
        correta: "a",
      },
      executar,
    );
    expect(r.veredito).toBe("OK");
  }, LIMITE);

  it("erro com erro de tipo: o compilador acusa e a saida esperada roda", () => {
    const r = conferirCodigo(
      {
        tipo: "erro",
        codigo: {
          linguagem: "ts",
          trecho: "const idade: number = '30';\nconsole.log(idade + 1);\n",
          saidaEsperada: "31\n",
        },
        alternativas: {
          a: "A string foi atribuida a uma variavel de tipo number",
          b: "Falta declarar o tipo da variavel",
          c: "O operador + nao existe para number",
          d: "console.log nao aceita expressao",
        },
        correta: "a",
      },
      executar,
    );
    expect(r.veredito).toBe("OK");
    expect(pool.slug).toBe("ts-teste");
  }, LIMITE);
});

// Lote 10b. O Passo 0 do Lote 10 achou um verificador que falha PASSANDO: a
// checagem de tipos so olhava o diagnostico do arquivo EXECUTADO, entao erro
// de tipo no primeiro arquivo de um grupo `arquivo=` passava calado. Em SQL,
// onde esquema e consulta ficam em arquivos separados, ele mentiria na maioria
// dos casos. O nome do arquivo entra no TEXTO do diagnostico, e nao so no
// prefixo, porque erroDoStderr descarta o prefixo: sem isso a pessoa leria
// "TS2322" e procuraria no arquivo errado.
describe("runner de ts: erro de tipo em QUALQUER arquivo do grupo", () => {
  const executarGrupo = makeGroupExecutor(runner);
  const grupo = (mat: string, app: string) =>
    conferirGrupo(
      [
        { linguagem: "ts", arquivo: "mat.ts", corpo: mat },
        { linguagem: "ts", arquivo: "app.ts", corpo: app },
      ],
      ["ts"],
      executarGrupo,
    );

  const MAT_OK =
    "export function dobro(n: number): number {\n  return n * 2;\n}\n";
  const APP_OK = "import { dobro } from './mat';\nconsole.log(dobro(2));\n";

  it("erro no PRIMEIRO arquivo reprova e diz em qual arquivo ele esta", () => {
    const r = grupo('const x: number = "texto";\n' + MAT_OK, APP_OK);
    // O veredito cai no ULTIMO bloco: conferirGrupo marca os anteriores como
    // "gravado" sem olhar a execucao. Quem precisa citar mat.ts e a mensagem.
    expect(r.map((c) => c.veredito)).toEqual(["gravado", "falhou"]);
    expect(r[1].problemas.join(" ")).toContain("TS2322");
    expect(r[1].problemas.join(" ")).toContain("mat.ts");
  }, LIMITE);

  it("CONTROLE: com os dois limpos continua gravado e executado", () => {
    const r = grupo(MAT_OK, APP_OK);
    expect(r.map((c) => c.veredito)).toEqual(["gravado", "executado"]);
  }, LIMITE);

  it("CONTROLE: erro no ULTIMO arquivo continua reprovando como antes", () => {
    // Sem prefixo de arquivo aqui de proposito: o diagnostico e do proprio
    // arquivo executado, e o trecho de arquivo unico fica byte a byte.
    const r = grupo(MAT_OK, 'const y: number = "texto";\n' + APP_OK);
    expect(r.map((c) => c.veredito)).toEqual(["gravado", "falhou"]);
    expect(r[1].problemas.join(" ")).toContain("TS2322");
  }, LIMITE);
});
