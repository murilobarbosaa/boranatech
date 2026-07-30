import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * HARNESS de integração das rotas de usuário do admin.
 *
 * O risco central de um teste de integração com dublê é o dublê aceitar
 * qualquer coisa e passar a testar a si mesmo. As três defesas, todas
 * exercitadas pelos testes deste arquivo:
 *
 *  1. TABELA NAO REGISTRADA lança. Consulta a uma tabela que o teste não
 *     preparou não devolve vazio: quebra dizendo qual foi.
 *  2. COLUNA INEXISTENTE lança, e o conjunto de colunas válidas vem de
 *     `shared/database.types.ts`, que é GERADO do banco real. Não é lista
 *     escrita à mão: se a rota selecionar coluna que não existe, o dublê
 *     reproduz o erro que o Postgres daria.
 *  3. O parser que lê os tipos AFIRMA O TOTAL (84 tabelas, medido no banco em
 *     2026-07-30). Um parser que sub-casasse em silêncio devolveria menos
 *     tabelas e passaria a aceitar colunas inexistentes; a asserção de total
 *     derruba o arquivo inteiro antes de qualquer teste rodar.
 */

// Total conferido contra `select count(*) from pg_tables where schemaname='public'`
// em 2026-07-30 (85 desde a migration 20260730160000, que criou admin_refunds). Alterar este número é ato deliberado, no mesmo commit da
// migration que cria ou dropa a tabela.
const EXPECTED_TABLE_COUNT = 85;

function parseColumnsFromTypes(): Map<string, Set<string>> {
  const file = resolve(process.cwd(), "shared/database.types.ts");
  const src = readFileSync(file, "utf8");

  const publicIdx = src.indexOf("\n  public: {");
  if (publicIdx < 0) throw new Error("schema public não encontrado nos tipos");
  const tablesIdx = src.indexOf("\n    Tables: {", publicIdx);
  const viewsIdx = src.indexOf("\n    Views: {", tablesIdx);
  if (tablesIdx < 0 || viewsIdx < 0)
    throw new Error("bloco Tables não delimitado nos tipos");

  const bloco = src.slice(tablesIdx, viewsIdx);
  const mapa = new Map<string, Set<string>>();

  // Estrutura do arquivo gerado:
  //       nome_da_tabela: {
  //         Row: {
  //           coluna: tipo
  const linhas = bloco.split("\n");
  let tabelaAtual: string | null = null;
  let dentroDoRow = false;
  for (const linha of linhas) {
    const tabela = /^ {6}([a-z0-9_]+): \{$/.exec(linha);
    if (tabela) {
      tabelaAtual = tabela[1];
      mapa.set(tabelaAtual, new Set());
      dentroDoRow = false;
      continue;
    }
    if (!tabelaAtual) continue;
    if (/^ {8}Row: \{$/.test(linha)) {
      dentroDoRow = true;
      continue;
    }
    if (dentroDoRow && /^ {8}\}$/.test(linha)) {
      dentroDoRow = false;
      continue;
    }
    if (dentroDoRow) {
      const coluna = /^ {10}([a-z0-9_]+)\??:/.exec(linha);
      if (coluna) mapa.get(tabelaAtual)!.add(coluna[1]);
    }
  }

  return mapa;
}

/**
 * Tabelas que o código já usa e que ainda NÃO estão em
 * `shared/database.types.ts` porque a migration que as cria não foi aplicada.
 *
 * As colunas NÃO são liberadas em bloco: elas são extraídas do próprio
 * `CREATE TABLE` da migration, então uma coluna inventada continua sendo
 * recusada. Tabela sem migration correspondente também é recusada.
 *
 * Esvaziar esta lista é o normal depois de aplicar a migration e rodar
 * `pnpm db:types`.
 */
const TABELAS_PENDENTES: string[] = [
  // Vazia: a migration 20260730160000 foi aplicada e os tipos regenerados,
  // então admin_refunds saiu daqui. É o estado normal.
];

function colunasDeCreateTable(tabela: string): Set<string> | null {
  const dir = resolve(process.cwd(), "supabase/migrations");
  for (const arquivo of readdirSync(dir)) {
    if (!arquivo.endsWith(".sql")) continue;
    const sql = readFileSync(resolve(dir, arquivo), "utf8");
    const re = new RegExp(
      `CREATE TABLE(?:\\s+IF NOT EXISTS)?\\s+(?:public\\.)?"?${tabela}"?\\s*\\(([\\s\\S]*?)\\n\\);`,
      "i",
    );
    const m = re.exec(sql);
    if (!m) continue;
    const cols = new Set<string>();
    for (const linha of m[1].split("\n")) {
      const c = /^\s{2,}"?([a-z0-9_]+)"?\s+[a-z]/i.exec(linha);
      if (
        c &&
        !["constraint", "primary", "unique", "foreign", "check"].includes(
          c[1].toLowerCase(),
        )
      ) {
        cols.add(c[1]);
      }
    }
    return cols.size ? cols : null;
  }
  return null;
}

export const COLUNAS_POR_TABELA = parseColumnsFromTypes();

// Total do que o ARQUIVO DE TIPOS traz, medido antes de injetar tabelas
// pendentes de migration: é ele que precisa bater com o banco.
const TABELAS_NOS_TIPOS = COLUNAS_POR_TABELA.size;

// Tabelas pendentes entram no mapa com as colunas declaradas na migration. Se a
// migration nao existir ou nao tiver colunas legiveis, a tabela NAO entra e
// continua sendo recusada.
for (const tabela of TABELAS_PENDENTES) {
  if (COLUNAS_POR_TABELA.has(tabela)) continue;
  const cols = colunasDeCreateTable(tabela);
  if (cols) COLUNAS_POR_TABELA.set(tabela, cols);
}

/** Colunas de relacionamento que o PostgREST aceita no select e não são colunas. */
const EMBEDS_CONHECIDOS = new Set(["plans"]);

/**
 * Colunas que o código já escreve e que ainda NÃO estão em
 * `shared/database.types.ts` porque a migration que as cria não foi aplicada
 * (e portanto os tipos não foram regenerados).
 *
 * A exceção NÃO é uma lista de confiança: cada entrada é conferida contra os
 * arquivos de `supabase/migrations/`, e só vale se alguma migration do
 * repositório declarar `ADD COLUMN ... <coluna>`. Um erro de digitação não é
 * absorvido — ele simplesmente não acha migration e continua sendo recusado.
 *
 * Esvaziar esta lista é o comportamento normal depois de aplicar a migration e
 * rodar `pnpm db:types`.
 */
const COLUNAS_PENDENTES: Array<{ tabela: string; coluna: string }> = [
  // Vazia agora: a migration 20260730140000 foi aplicada e os tipos foram
  // regenerados, então canceled_by saiu daqui. É o estado normal.
];

function colunasDeclaradasEmMigrations(): Set<string> {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const declaradas = new Set<string>();
  for (const arquivo of readdirSync(dir)) {
    if (!arquivo.endsWith(".sql")) continue;
    const sql = readFileSync(resolve(dir, arquivo), "utf8");
    // Array.from em vez de for..of sobre matchAll: o target do tsconfig nao
    // habilita downlevelIteration.
    for (const m of Array.from(
      sql.matchAll(/ADD COLUMN(?:\s+IF NOT EXISTS)?\s+"?([a-z0-9_]+)"?/gi),
    )) {
      declaradas.add(m[1].toLowerCase());
    }
  }
  return declaradas;
}

const COLUNAS_PENDENTES_VALIDAS = (() => {
  const declaradas = colunasDeclaradasEmMigrations();
  const validas = new Set<string>();
  for (const { tabela, coluna } of COLUNAS_PENDENTES) {
    if (declaradas.has(coluna)) validas.add(`${tabela}.${coluna}`);
  }
  return validas;
})();

export type LinhaQualquer = Record<string, unknown>;

export type RespostaTabela = {
  rows?: LinhaQualquer[];
  error?: { message: string; code?: string } | null;
  /** Usado quando a rota pede { count: "exact", head: true }. */
  count?: number;
};

type Chamada = {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  colunas: string[];
  filtros: Array<{ tipo: string; coluna: string; valor: unknown }>;
  payload?: LinhaQualquer;
};

export type SupabaseDouble = {
  client: {
    from: (table: string) => unknown;
    auth: { admin: Record<string, unknown> };
    rpc: (...args: unknown[]) => Promise<unknown>;
  };
  /** Tudo que a rota consultou, na ordem. */
  chamadas: Chamada[];
  de: (table: string) => Chamada[];
};

/**
 * Cria o dublê. `respostas` mapeia tabela -> resposta; tabela ausente do mapa
 * faz a consulta LANÇAR, nunca devolver vazio.
 */
export function criarSupabaseDouble(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  authAdmin: Record<string, unknown> = {},
  rpcImpl: (nome: string, args: unknown) => Promise<unknown> = async () => ({
    data: null,
    error: null,
  }),
): SupabaseDouble {
  const chamadas: Chamada[] = [];

  function validarColunas(table: string, colunas: string[]) {
    const validas = COLUNAS_POR_TABELA.get(table);
    if (!validas) {
      throw new Error(
        `[double] tabela "${table}" não existe em shared/database.types.ts`,
      );
    }
    for (const col of colunas) {
      if (col === "*" || EMBEDS_CONHECIDOS.has(col)) continue;
      if (COLUNAS_PENDENTES_VALIDAS.has(`${table}.${col}`)) continue;
      if (!validas.has(col)) {
        throw new Error(
          `[double] coluna "${col}" não existe em "${table}" (o Postgres recusaria esta query)`,
        );
      }
    }
  }

  function resolver(table: string): RespostaTabela {
    const r = respostas[table];
    if (r === undefined) {
      throw new Error(
        `[double] consulta NÃO ESPERADA à tabela "${table}". ` +
          `Registre a resposta no teste ou corrija a rota.`,
      );
    }
    return typeof r === "function" ? r() : r;
  }

  function makeQuery(
    table: string,
    op: Chamada["op"],
    payload?: LinhaQualquer,
  ) {
    const chamada: Chamada = { table, op, colunas: [], filtros: [], payload };
    chamadas.push(chamada);

    if (payload) {
      validarColunas(table, Object.keys(payload));
    }

    let headOnly = false;
    let contarExato = false;

    const q: Record<string, unknown> = {};

    q.select = (cols?: string, opts?: { count?: string; head?: boolean }) => {
      if (typeof cols === "string" && cols.trim() !== "") {
        // "user_id, name, plans(code)" -> ["user_id","name","plans"]
        const nomes = cols
          .split(",")
          .map((c) => c.trim().replace(/\(.*$/, ""))
          .filter(Boolean);
        chamada.colunas.push(...nomes);
        validarColunas(table, nomes);
      }
      if (opts?.head) headOnly = true;
      if (opts?.count === "exact") contarExato = true;
      return q;
    };

    for (const metodo of [
      "eq",
      "neq",
      "is",
      "in",
      "not",
      "ilike",
      "gte",
      "lte",
      "or",
    ]) {
      q[metodo] = (coluna: string, valor: unknown) => {
        // `or` recebe uma expressão inteira, não uma coluna: não valida.
        if (metodo !== "or" && typeof coluna === "string") {
          chamada.filtros.push({ tipo: metodo, coluna, valor });
          validarColunas(table, [coluna]);
        }
        return q;
      };
    }
    q.order = (coluna: string) => {
      if (typeof coluna === "string") validarColunas(table, [coluna]);
      return q;
    };
    for (const metodo of ["range", "limit"]) {
      q[metodo] = () => q;
    }

    function resultado() {
      const r = resolver(table);
      if (r.error) return { data: null, error: r.error, count: null };
      const rows = r.rows ?? [];
      return {
        data: headOnly ? null : rows,
        error: null,
        count: contarExato ? (r.count ?? rows.length) : null,
      };
    }

    // Erro vira REJEICAO, nao throw sincrono: o client real devolve promise, e
    // um dublê que lança fora do await esconderia o caminho de erro de quem
    // usa try/catch.
    q.maybeSingle = () =>
      Promise.resolve().then(() => {
        const r = resultado();
        if (r.error) return r;
        const rows = (r.data as LinhaQualquer[] | null) ?? [];
        return { data: rows[0] ?? null, error: null };
      });
    q.single = q.maybeSingle;
    q.then = (
      resolve: (v: unknown) => unknown,
      reject: (e: unknown) => unknown,
    ) =>
      Promise.resolve()
        .then(() => resultado())
        .then(resolve, reject);

    return q;
  }

  return {
    client: {
      from: (table: string) => ({
        select: (...a: unknown[]) =>
          (makeQuery(table, "select") as Record<string, Function>).select(...a),
        insert: (payload: LinhaQualquer) => makeQuery(table, "insert", payload),
        update: (payload: LinhaQualquer) => makeQuery(table, "update", payload),
        delete: () => makeQuery(table, "delete"),
      }),
      auth: { admin: authAdmin },
      rpc: (...args: unknown[]) => rpcImpl(args[0] as string, args[1]),
    },
    chamadas,
    de: (table: string) => chamadas.filter((c) => c.table === table),
  };
}

// ---------------------------------------------------------------------------
// Testes DO PRÓPRIO harness: provam que o dublê não é permissivo.
// ---------------------------------------------------------------------------

describe("o parser de colunas afirma o TOTAL, não só a pertinência", () => {
  it("encontra exatamente as tabelas que existem no banco", () => {
    // Se este número divergir sem migration nova, investigue o PARSER antes de
    // mexer no número: um parser que encolhe em silêncio faria o dublê aceitar
    // colunas inexistentes e o arquivo inteiro passaria a testar a si mesmo.
    expect(TABELAS_NOS_TIPOS).toBe(EXPECTED_TABLE_COUNT);
  });

  it("lê as colunas de verdade, não um conjunto vazio", () => {
    const profiles = COLUNAS_POR_TABELA.get("profiles")!;
    expect(profiles.has("user_id")).toBe(true);
    expect(profiles.has("headline")).toBe(true);
    expect(profiles.has("cpf")).toBe(true);
    // 28 colunas em profiles; um parser truncado devolveria bem menos.
    expect(profiles.size).toBeGreaterThan(20);
  });

  it("não inventa coluna que não existe", () => {
    expect(COLUNAS_POR_TABELA.get("profiles")!.has("coluna_fantasma")).toBe(
      false,
    );
  });
});

describe("o dublê falha em vez de aceitar qualquer query", () => {
  it("consulta a tabela não registrada LANÇA, não devolve vazio", async () => {
    const d = criarSupabaseDouble({ profiles: { rows: [] } });
    await expect(
      (
        d.client.from("subscriptions") as {
          select: (c: string) => PromiseLike<unknown>;
        }
      ).select("user_id"),
    ).rejects.toThrow(/NÃO ESPERADA/);
  });

  it("select de coluna inexistente LANÇA", () => {
    const d = criarSupabaseDouble({ profiles: { rows: [] } });
    expect(() =>
      (d.client.from("profiles") as { select: (c: string) => unknown }).select(
        "user_id, coluna_que_nao_existe",
      ),
    ).toThrow(/não existe em "profiles"/);
  });

  it("filtro em coluna inexistente LANÇA", () => {
    const d = criarSupabaseDouble({ profiles: { rows: [] } });
    expect(() => {
      const q = (
        d.client.from("profiles") as {
          select: (c: string) => Record<string, Function>;
        }
      ).select("user_id");
      q.eq("coluna_fantasma", 1);
    }).toThrow(/não existe em "profiles"/);
  });

  it("insert com coluna inexistente LANÇA", () => {
    const d = criarSupabaseDouble({ content_audit_logs: { rows: [] } });
    expect(() =>
      (
        d.client.from("content_audit_logs") as {
          insert: (p: Record<string, unknown>) => unknown;
        }
      ).insert({ actor_user_id: "u", campo_inventado: 1 }),
    ).toThrow(/não existe em "content_audit_logs"/);
  });

  it("tabela fora do schema LANÇA", () => {
    const d = criarSupabaseDouble({ tabela_inexistente: { rows: [] } });
    expect(() =>
      (
        d.client.from("tabela_inexistente") as {
          select: (c: string) => unknown;
        }
      ).select("x"),
    ).toThrow(/não existe em shared\/database.types.ts/);
  });

  it("query legítima passa e registra a chamada", async () => {
    const d = criarSupabaseDouble({
      profiles: { rows: [{ user_id: "u1", name: "Ana" }] },
    });
    const q = (
      d.client.from("profiles") as {
        select: (c: string) => Record<string, Function>;
      }
    ).select("user_id, name");
    const r = (await q.eq("user_id", "u1")) as { data: unknown[] };
    expect(r.data).toEqual([{ user_id: "u1", name: "Ana" }]);
    expect(d.de("profiles")[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: "u1" },
    ]);
  });
});

describe("a exceção de coluna pendente de migration é conferida, não confiada", () => {
  it("só vale para coluna que ALGUMA migration do repositório declara", () => {
    // Com a lista VAZIA (estado normal) o laço abaixo não roda, e um teste que
    // não afirma nada é pior que teste nenhum. Por isso o mecanismo é
    // exercitado direto: uma coluna real declarada em migration é reconhecida,
    // e uma inventada não. Assim o teste continua tendo o que provar mesmo
    // quando não há pendência.
    const declaradas = colunasDeclaradasEmMigrations();
    expect(declaradas.has("canceled_by")).toBe(true);
    expect(declaradas.has("coluna_que_nenhuma_migration_declara")).toBe(false);

    for (const { tabela, coluna } of COLUNAS_PENDENTES) {
      expect(
        COLUNAS_PENDENTES_VALIDAS.has(`${tabela}.${coluna}`),
        `${tabela}.${coluna} não é declarada por nenhuma migration`,
      ).toBe(true);
    }
  });

  it("coluna inventada NÃO é absorvida pela exceção", () => {
    const d = criarSupabaseDouble({ subscription_cancellations: { rows: [] } });
    expect(() =>
      (
        d.client.from("subscription_cancellations") as {
          insert: (p: Record<string, unknown>) => unknown;
        }
      ).insert({ user_id: "u", coluna_com_typo: 1 }),
    ).toThrow(/não existe em "subscription_cancellations"/);
  });
});

describe("tabela pendente de migration entra com as colunas da migration", () => {
  it("o parser de CREATE TABLE lê as colunas de verdade da migration", () => {
    // Com a lista de pendentes VAZIA (estado normal), este teste exercita o
    // MECANISMO direto em vez de depender de haver pendência: um teste que só
    // itera lista vazia não afirma nada.
    const cols = colunasDeCreateTable("admin_refunds");
    expect(cols, "admin_refunds nao foi lida da migration").toBeTruthy();
    for (const esperada of [
      "user_id",
      "actor_user_id",
      "stripe_charge_id",
      "stripe_refund_id",
      "amount_cents",
      "reason",
    ]) {
      expect(cols!.has(esperada), esperada).toBe(true);
    }
    // E não inventa colunas que a migration não declara.
    expect(cols!.has("coluna_inventada")).toBe(false);
  });

  it("coluna inventada continua sendo recusada pelo dublê", () => {
    const d = criarSupabaseDouble({ admin_refunds: { rows: [] } });
    expect(() =>
      (
        d.client.from("admin_refunds") as {
          insert: (p: Record<string, unknown>) => unknown;
        }
      ).insert({ user_id: "u", coluna_inventada: 1 }),
    ).toThrow(/não existe em "admin_refunds"/);
  });

  it("tabela sem migration correspondente NAO e reconhecida", () => {
    expect(colunasDeCreateTable("tabela_que_nao_existe")).toBeNull();
  });
});
