import { describe, expect, it } from "vitest";
import { SQL_BANCOS } from "../shared/roadmapV2/sqlBancos";
import { capabilityOf } from "./languageCapabilities.mts";
import {
  arquivosDoBloco,
  conferirBloco,
  lerCerca,
} from "./verifyLessonBlocks.mts";
import {
  makeExecutor,
  makeGroupExecutor,
} from "./verifyQuizPoolByExecution.mts";

// Lote 11a, decisao 7. `banco=` na cerca de sql: o bloco executa depois de
// carregar a base nomeada de shared/roadmapV2/sqlBancos.ts. Pelo executor
// real: o que precisa ser provado e que a base e MESMO carregada antes do
// trecho, e um stub provaria so a montagem da lista de arquivos.
const runner = capabilityOf("sql").runner!;
const executar = makeExecutor(runner);
const executarGrupo = makeGroupExecutor(runner);
const LIMITE = 30000;

const CONSULTA = "SELECT nome FROM clientes ORDER BY id;";

describe("banco= carrega a base antes do bloco", () => {
  it(
    "com banco=teste o bloco consulta a tabela da base e imprime",
    () => {
      const bloco = { ...lerCerca("sql banco=teste"), corpo: CONSULTA };
      expect(bloco.problemasDaCerca).toEqual([]);
      const r = executarGrupo(arquivosDoBloco(bloco));
      expect(r.status).toBe(0);
      expect(r.stdout).toBe("nome\nAna\nBruno\n");
      expect(
        conferirBloco(bloco, ["sql"], executar, executarGrupo).veredito,
      ).toBe("executado");
    },
    LIMITE,
  );

  it(
    "CONTROLE: o mesmo bloco SEM banco= reprova, porque a tabela nao existe",
    () => {
      const c = conferirBloco(
        { ...lerCerca("sql"), corpo: CONSULTA },
        ["sql"],
        executar,
        executarGrupo,
      );
      expect(c.veredito).toBe("falhou");
      expect(c.problemas.join(" ")).toContain("SQLITE_ERROR");
      expect(c.problemas.join(" ")).toContain("clientes");
    },
    LIMITE,
  );

  it(
    "base com erro de sintaxe: a mensagem cita __banco.sql",
    () => {
      const r = executarGrupo([
        { nome: "__banco.sql", corpo: "CREATE TABLE quebrada (;\n" },
        { nome: "trecho.sql", corpo: "SELECT 1 AS um;\n" },
      ]);
      expect(r.status).toBe(1);
      expect(r.erro).toContain("__banco.sql");
      expect(r.erro).toMatch(/^SQLITE_ERROR: /);
    },
    LIMITE,
  );
});

describe("banco= na cerca: as tres regras", () => {
  it("nome fora do registro e erro de cerca", () => {
    expect(lerCerca("sql banco=inexistente").problemasDaCerca).toEqual([
      "banco desconhecido na cerca: inexistente (fora de shared/roadmapV2/sqlBancos.ts)",
    ]);
  });

  it("nome herdado de Object.prototype nao passa por base", () => {
    expect(lerCerca("sql banco=toString").problemasDaCerca.length).toBe(1);
  });

  it("banco= fora de sql e erro de cerca", () => {
    expect(lerCerca("js banco=teste").problemasDaCerca).toEqual([
      "banco= so vale em cerca sql (cerca js)",
    ]);
  });

  it("banco= junto de arquivo= e erro de cerca", () => {
    // Pertinencia, e nao igualdade: desde que arquivo= em sql e erro por si
    // (teste abaixo), a cerca acusa os dois problemas.
    expect(
      lerCerca("sql banco=teste arquivo=x.sql").problemasDaCerca,
    ).toContain("banco= e arquivo= na mesma cerca");
  });

  // O wrapper de sql executa so o ULTIMO arquivo do grupo e nao carrega os
  // anteriores, porque SQL nao tem import: erro no primeiro arquivo passaria
  // calado, a mesma classe do diagnostico perdido do ts no Lote 10b. Ate a
  // trilha de SQL dar semantica de grupo (Lote 11), arquivo= em sql e erro.
  it("arquivo= em cerca sql e erro de cerca", () => {
    expect(lerCerca("sql arquivo=a.sql").problemasDaCerca).toEqual([
      "arquivo= ainda nao vale em cerca sql: sql nao tem semantica de grupo (Lote 11), e so o ultimo arquivo executaria",
    ]);
  });

  it("CONTROLE: arquivo= em cerca js continua valendo", () => {
    expect(lerCerca("js arquivo=a.js").problemasDaCerca).toEqual([]);
  });

  it("CONTROLE: banco valido em sql nao tem problema", () => {
    const cerca = lerCerca("sql banco=teste");
    expect(cerca.problemasDaCerca).toEqual([]);
    expect(cerca.banco).toBe("teste");
  });
});

it("o registro tem a base de teste", () => {
  expect(Object.keys(SQL_BANCOS)).toContain("teste");
});
