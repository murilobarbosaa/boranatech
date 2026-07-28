import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOARD_COLUMNS,
  DEFAULT_BOARD_LABELS,
} from "./boardDefaults";

// Trava a segunda copia do seed.
//
// A definicao viva e o boardDefaults.ts; o bloco de seed da migration tem os
// mesmos valores e nao pode importar dali (e SQL). Este teste le o SQL de
// verdade e compara.
//
// Ele afirma o TOTAL alem da pertinencia: se o regex parar de casar e ler zero
// tuplas, a comparacao de listas vazias passaria de bobeira. A assercao de
// tamanho (5 e 6) e o que derruba o parser encolhido, que e a classe de defeito
// mais cara desta base.

const MIGRATION = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
  "20260727160000_create_admin_tasks.sql",
);

const sql = readFileSync(MIGRATION, "utf8");

/** ('Backlog', '#94A3B8', 1000::double precision, true,  false) */
const COLUMN_TUPLE =
  /\(\s*'([^']+)'\s*,\s*'(#[0-9A-Fa-f]{6})'\s*,\s*\d+::double precision\s*,\s*(true|false)\s*,\s*(true|false)\s*\)/g;

/** ('Frontend', '#38BDF8') */
const LABEL_TUPLE = /\(\s*'([^']+)'\s*,\s*'(#[0-9A-Fa-f]{6})'\s*\)/g;

/** exec em laco, e nao [...matchAll]: o tsconfig do projeto nao habilita
 *  downlevelIteration, entao espalhar o iterador de matches nao compila. */
function todosOsMatches(re: RegExp, texto: string): RegExpExecArray[] {
  const out: RegExpExecArray[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) out.push(m);
  return out;
}

function parseColumns() {
  return todosOsMatches(COLUMN_TUPLE, sql).map((m) => ({
    name: m[1],
    color: m[2],
    is_start: m[3] === "true",
    is_done: m[4] === "true",
  }));
}

function parseLabels() {
  // O padrao de 2 campos tambem casaria pedaco de tupla de coluna, entao a
  // busca e restrita ao bloco de etiquetas.
  const start = sql.indexOf("insert into public.admin_task_labels");
  expect(start).toBeGreaterThan(-1);
  const bloco = sql.slice(start);
  return todosOsMatches(LABEL_TUPLE, bloco).map((m) => ({
    name: m[1],
    color: m[2],
  }));
}

describe("seed do quadro: TS e SQL nao podem divergir", () => {
  it("o parser LEU as tuplas (guarda contra regex que encolheu)", () => {
    expect(parseColumns()).toHaveLength(5);
    expect(parseLabels()).toHaveLength(6);
  });

  it("as etapas do SQL sao exatamente as do boardDefaults", () => {
    expect(parseColumns()).toEqual(DEFAULT_BOARD_COLUMNS);
  });

  it("as etiquetas do SQL sao exatamente as do boardDefaults", () => {
    expect(parseLabels()).toEqual(DEFAULT_BOARD_LABELS);
  });

  it("exatamente uma etapa inicial e uma terminal", () => {
    expect(DEFAULT_BOARD_COLUMNS.filter((c) => c.is_start)).toHaveLength(1);
    expect(DEFAULT_BOARD_COLUMNS.filter((c) => c.is_done)).toHaveLength(1);
  });

  it("nomes de etiqueta nao colidem em minusculas (indice unico do banco)", () => {
    const lower = DEFAULT_BOARD_LABELS.map((l) => l.name.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});
