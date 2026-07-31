import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

// Importar a rota carrega supabaseAdmin, que carrega ./env. No CI nao existe
// .env e o job `qualidade` nao recebe secret nenhum, entao o mock e obrigatorio
// (regra do CLAUDE.md). Nada aqui usa o cliente: so a constante.
vi.mock("./../lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));

import { TASK_TYPES } from "./adminTasks";

/**
 * Paridade do conjunto de tipos de tarefa entre as TRES copias.
 *
 * O tipo vive em tres lugares que nao conseguem se importar: o CHECK da
 * migration (SQL), a lista de validacao do server (zod) e a uniao de literal do
 * client (TypeScript). Divergencia entre eles nao da erro de compilacao: da 400
 * em producao no dia em que alguem escolher a opcao nova, ou pior, deixa o
 * banco aceitar um valor que a tela nao sabe desenhar.
 *
 * 'bug' voltou ao conjunto em 20260731040000 depois de ter saido em
 * 20260728120100. Foram duas migrations mexendo no MESMO CHECK em tres dias, e
 * e exatamente esse vaivem que torna a paridade cara de manter na cabeca.
 *
 * O lado SQL e lido por regex, que e a unica opcao possivel sobre um arquivo
 * .sql. Por isso o teste afirma o TOTAL (5) alem da pertinencia: um regex que
 * parar de casar devolve lista vazia, e comparar duas listas vazias passaria de
 * bobeira. O lado server e IMPORTADO, sem parser nenhum no meio.
 */

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
);

/** check (type in ('feature', 'bug', 'melhoria', 'debito_tecnico', 'tarefa')) */
function tiposDoCheck(arquivo: string): string[] {
  const sql = readFileSync(path.join(migrationsDir, arquivo), "utf8");
  // Ancora no `add constraint admin_tasks_type_check` para nao casar com um
  // CHECK de outra coluna que apareca no mesmo arquivo.
  const bloco = sql.match(
    /add\s+constraint\s+admin_tasks_type_check\s+check\s*\(\s*type\s+in\s*\(([^)]*)\)/i,
  );
  if (!bloco) return [];
  const literais = bloco[1].match(/'([^']+)'/g);
  return literais ? literais.map((s) => s.slice(1, -1)) : [];
}

const TIPOS_ESPERADOS = [
  "feature",
  "bug",
  "melhoria",
  "debito_tecnico",
  "tarefa",
];

describe("tipos de admin_tasks: paridade SQL x server", () => {
  it("a migration que devolveu 'bug' declara exatamente os 5 tipos", () => {
    const tipos = tiposDoCheck(
      "20260731040000_readd_bug_to_admin_task_type.sql",
    );
    // Asserção de TAMANHO primeiro: e ela que derruba o regex encolhido.
    expect(tipos).toHaveLength(5);
    expect(tipos.slice().sort()).toEqual(TIPOS_ESPERADOS.slice().sort());
  });

  it("a lista do server e a mesma do CHECK, sem sobra dos dois lados", () => {
    const doSql = tiposDoCheck(
      "20260731040000_readd_bug_to_admin_task_type.sql",
    ).sort();
    const doServer = TASK_TYPES.slice().sort();
    // Igualdade de CONJUNTO, nos dois sentidos. "o que declarei existe?" nao e a
    // mesma pergunta que "o que existe esta declarado?".
    expect(doServer).toEqual(doSql);
  });

  it("'bug' esta aceito pelo server", () => {
    expect(TASK_TYPES).toContain("bug");
  });

  it("a migration anterior (que removeu 'bug') continua sem ele", () => {
    // Controle da leitura: prova que o regex realmente le o conteudo do arquivo
    // e nao devolve a mesma lista para qualquer entrada. Se este teste ficar
    // verde com 'bug' dentro, o parser esta lendo o arquivo errado.
    const tipos = tiposDoCheck(
      "20260728120100_drop_bug_from_admin_task_type.sql",
    );
    expect(tipos).toHaveLength(4);
    expect(tipos).not.toContain("bug");
  });
});
