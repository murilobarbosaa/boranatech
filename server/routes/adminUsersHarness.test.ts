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
 * `shared/database.types.ts`. A causa pode ser a migration não ter sido
 * aplicada OU ter sido aplicada sem o `pnpm db:types` depois; os dois estados
 * são indistinguíveis daqui, então a entrada não deve AFIRMAR qual é sem que
 * alguém tenha conferido contra o banco.
 *
 * A exceção NÃO é uma lista de confiança: cada entrada é conferida contra os
 * arquivos de `supabase/migrations/`, e só vale se alguma migration do
 * repositório declarar `ADD COLUMN ... <coluna>`. Um erro de digitação não é
 * absorvido, ele simplesmente não acha migration e continua sendo recusado.
 *
 * Esvaziar esta lista é o comportamento normal depois de aplicar a migration e
 * rodar `pnpm db:types`.
 */
const COLUNAS_PENDENTES: Array<{ tabela: string; coluna: string }> = [
  // Declaradas em `20260902120000_finance_transactions_provider.sql`, que faz
  // `finance_transactions` virar o ledger de todos os provedores. Estao aqui
  // porque a migration ainda NAO foi aplicada em produção (ela e de aplicacao
  // manual pela Ana, na janela posterior ao backup, por causa do `update` de
  // backfill em `billing_events`), entao `shared/database.types.ts` ainda nao
  // as conhece.
  //
  // SAIR DAQUI E O ESTADO NORMAL depois de aplicar a migration e rodar
  // `pnpm db:types`. Se a lista continuar com estas duas entradas semanas
  // depois do deploy, o que isso indica e que a migration nunca chegou, que e
  // exatamente a falha que `pnpm check:migrations` existe para acusar.
  { tabela: "finance_transactions", coluna: "provider" },
  { tabela: "finance_transactions", coluna: "provider_transaction_id" },
  // Declaradas em `20260831140000_orphan_payments_charge_sem_dono.sql`, de
  // 31/08. Os tipos ainda nao as conhecem, e daqui os dois estados possiveis
  // (migration nao aplicada, ou aplicada sem `pnpm db:types` depois) sao
  // INDISTINGUIVEIS, entao esta entrada NAO afirma qual e.
  //
  // A diferenca importa: se a migration nao chegou ao banco, o `persistir` de
  // server/lib/chargeSemDono.ts esta falhando em producao ao gravar estas
  // colunas, e o efeito e `persisted: false`, que o cabecalho daquela migration
  // registra como indistinguivel do estado normal da fila. Conferir contra o
  // banco e o passo que resolve; `pnpm check:migrations` nao pega, porque ele
  // verifica TABELA, nao coluna.
  { tabela: "billing_orphan_payments", coluna: "stripe_charge_id" },
  { tabela: "billing_orphan_payments", coluna: "candidate_user_id" },
  { tabela: "billing_orphan_payments", coluna: "candidate_checked_at" },
  // Vazia ate 2026-09-02: `admin_refunds.settlement` saiu daqui em 2026-08-01, depois de o
  // `pnpm db:types` ser rodado sobre o banco onde a migration 20260730190000 já
  // estava aplicada. É o estado normal.
  //
  // O comentário anterior desta entrada afirmava que a migration "ainda NÃO"
  // tinha sido aplicada, e isso era falso havia dias: a coluna existia no banco
  // e só os tipos estavam atrasados. Exceção com motivo errado é pior que
  // exceção sem motivo, porque manda investigar o lugar errado.
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

/**
 * Nomes de coluna de um `select` do PostgREST, DESCARTANDO o conteúdo dos
 * embeds.
 *
 * A versão anterior fazia `split(",")` e depois `replace(/\(.*$/, "")`, o que
 * funciona para `plans(code)` e quebra para `plans(code, name, price_cents)`:
 * a vírgula de dentro do embed vira separador, e `name` e `price_cents` passam
 * a ser validados como colunas da tabela EXTERNA. O efeito é recusar uma query
 * legítima, erra para o lado seguro, mas erra, e o teste que a exercitasse
 * ficaria impossível de escrever.
 *
 * Aqui a varredura conta parênteses: o que está dentro de um embed não é
 * separador nem coluna, e só o NOME do embed sai na lista (é ele que
 * EMBEDS_CONHECIDOS reconhece).
 */
export function colunasDoSelect(cols: string): string[] {
  const nomes: string[] = [];
  let atual = "";
  let profundidade = 0;
  for (const ch of cols) {
    if (ch === "(") {
      profundidade += 1;
      continue;
    }
    if (ch === ")") {
      profundidade -= 1;
      continue;
    }
    if (profundidade > 0) continue;
    if (ch === ",") {
      if (atual.trim()) nomes.push(atual.trim());
      atual = "";
      continue;
    }
    atual += ch;
  }
  if (atual.trim()) nomes.push(atual.trim());
  // `plans!inner`, `plans!left`, `plans!fk_nome`: o `!` e uma DICA de join do
  // PostgREST, nao parte do nome da relacao. Sem tirar, `plans!inner` era
  // validado como se fosse uma coluna chamada "plans!inner" e recusava a query
  // do getMrrSnapshot, que usa exatamente essa forma.
  return nomes.map((n) => n.split("!")[0].trim()).filter(Boolean);
}

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
  /** Colunas passadas a `.order()`, na ordem. Paginação por OFFSET sem ordenação
   * tem resultado indefinido no Postgres, e é isso que um teste precisa poder
   * afirmar. */
  ordem: string[];
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
  /**
   * Chamadas de RPC, com o nome e os ARGUMENTOS.
   *
   * Existe porque parte do contrato migrou para dentro de uma funcao do banco:
   * quando a rota deixa de montar a query e passa a montar ARGUMENTOS, e o
   * argumento que precisa ser afirmado. Sem este registro, "a rota embrulha a
   * busca em curingas" so daria para inferir do resultado, e inferir do
   * resultado nao distingue "embrulhou" de "o dado casou por outro motivo".
   */
  rpcCalls: Array<{ nome: string; args: Record<string, unknown> }>;
  de: (table: string) => Chamada[];
};

/**
 * Cria o dublê. `respostas` mapeia tabela -> resposta; tabela ausente do mapa
 * faz a consulta LANÇAR, nunca devolver vazio.
 */
/**
 * Simulacao do RPC `admin_list_users_page` sobre as linhas de `profiles` que o
 * double ja carrega.
 *
 * O QUE ELA PROVA E O QUE NAO PROVA, e a distincao importa. Ela prova o
 * CONTRATO ENTRE A ROTA E A FUNCAO: que a rota manda os argumentos certos, que
 * o embrulho de curingas da busca sai daqui, que `total_count` vira `total`, que
 * o filtro de ids restringe ou exclui conforme a flag. Ela NAO prova que o SQL
 * escrito na migration faz isso, porque e uma reimplementacao em JS do que
 * aquele SQL deveria fazer, e reimplementacao pode divergir da fonte.
 *
 * A prova do SQL em si so existe quando a funcao esta aplicada no banco, e e por
 * isso que `check:migrations` fica VERMELHO ate la, dizendo `ausente:
 * public.admin_list_users_page()`. Este dublê nao substitui aquele guard; ele
 * cobre a metade que o guard nao cobre.
 */
export function simularListagemDeUsuarios(
  linhas: Array<Record<string, unknown>>,
  args: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const busca = args.p_search as string | null;
  const soAtivos = Boolean(args.p_only_active);
  const ids = (args.p_user_ids as string[] | null) ?? null;
  const excluir = Boolean(args.p_exclude_ids);
  const limite = Number(args.p_limit ?? 50);
  const offset = Number(args.p_offset ?? 0);

  // `%termo%` do lado do chamador vira substring aqui. Sem os curingas o `ilike`
  // do Postgres e igualdade (case-insensitive), e e exatamente esse o
  // comportamento simulado quando eles nao vem.
  const casa = (valor: unknown): boolean => {
    if (busca === null) return true;
    const texto = typeof valor === "string" ? valor.toLowerCase() : "";
    const alvo = busca.toLowerCase();
    const parcial = alvo.startsWith("%") && alvo.endsWith("%");
    const miolo = parcial ? alvo.slice(1, -1) : alvo;
    return parcial ? texto.includes(miolo) : texto === miolo;
  };

  const corte = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filtradas = linhas.filter((linha) => {
    if (busca !== null && !casa(linha.name) && !casa(linha.email)) return false;
    if (soAtivos) {
      const ts = linha.last_sign_in_at
        ? new Date(String(linha.last_sign_in_at)).getTime()
        : NaN;
      if (Number.isNaN(ts) || ts < corte) return false;
    }
    if (ids !== null) {
      const dentro = ids.includes(String(linha.user_id));
      if (excluir ? dentro : !dentro) return false;
    }
    return true;
  });

  const total = filtradas.length;
  return filtradas.slice(offset, offset + limite).map((linha) => ({
    id: linha.id ?? null,
    user_id: linha.user_id ?? null,
    name: linha.name ?? null,
    email: linha.email ?? null,
    created_at: linha.created_at ?? null,
    area_interesse: linha.area_interesse ?? null,
    last_sign_in_at: linha.last_sign_in_at ?? null,
    total_count: total,
  }));
}

export function criarSupabaseDouble(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
  authAdmin: Record<string, unknown> = {},
  rpcImpl: (nome: string, args: unknown) => Promise<unknown> = async () => ({
    data: null,
    error: null,
  }),
  /**
   * Teto de linhas POR RESPOSTA, como o `db-max-rows` do PostgREST. `null`
   * (padrão) = sem teto, que é o comportamento de sempre. Um teste que passa um
   * número aqui está reproduzindo a condição real de produção: o servidor
   * devolve no máximo N linhas, e quem não pagina soma só as N primeiras
   * achando que somou tudo.
   */
  maxRows: number | null = null,
): SupabaseDouble {
  const chamadas: Chamada[] = [];
  const rpcCalls: Array<{ nome: string; args: Record<string, unknown> }> = [];

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
    const chamada: Chamada = {
      table,
      op,
      colunas: [],
      filtros: [],
      ordem: [],
      payload,
    };
    chamadas.push(chamada);

    if (payload) {
      validarColunas(table, Object.keys(payload));
    }

    let headOnly = false;
    let contarExato = false;

    const q: Record<string, unknown> = {};

    q.select = (cols?: string, opts?: { count?: string; head?: boolean }) => {
      if (typeof cols === "string" && cols.trim() !== "") {
        const nomes = colunasDoSelect(cols);
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
      // `lt` entrou com o guard de cobranca sem dono (corte por idade da linha).
      "lt",
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
      if (typeof coluna === "string") {
        validarColunas(table, [coluna]);
        chamada.ordem.push(coluna);
      }
      return q;
    };
    // `range` PRECISA recortar de verdade. Enquanto ele era um no-op, uma rota
    // paginada e uma rota truncada davam exatamente o mesmo resultado no dublê,
    // e o teto de 1000 linhas do PostgREST (que já cortou o custo de IA em
    // produção) era INSIMULÁVEL aqui. Um dublê que não reproduz a condição não
    // testa a correção dela.
    let rangeFrom: number | null = null;
    let rangeTo: number | null = null;
    q.range = (from: number, to: number) => {
      rangeFrom = from;
      rangeTo = to;
      return q;
    };
    q.limit = () => q;

    function resultado() {
      const r = resolver(table);
      if (r.error) return { data: null, error: r.error, count: null };
      const todas = r.rows ?? [];
      // O total do count é o do CONJUNTO, não o da página: é assim que o
      // PostgREST responde com `count=exact` mais `Range`.
      const total = r.count ?? todas.length;
      let rows = todas;
      if (rangeFrom !== null && rangeTo !== null) {
        rows = todas.slice(rangeFrom, rangeTo + 1);
      }
      // TETO DO SERVIDOR, aplicado DEPOIS do range, igual ao db-max-rows do
      // PostgREST: ele corta a página mesmo quando o cliente pediu mais. É a
      // condição que produz truncamento silencioso em quem não pagina.
      if (maxRows !== null && rows.length > maxRows) {
        rows = rows.slice(0, maxRows);
      }
      return {
        data: headOnly ? null : rows,
        error: null,
        count: contarExato ? total : null,
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
      rpc: (...args: unknown[]) => {
        rpcCalls.push({
          nome: args[0] as string,
          args: (args[1] ?? {}) as Record<string, unknown>,
        });
        return rpcImpl(args[0] as string, args[1]);
      },
    },
    chamadas,
    rpcCalls,
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

describe("o parser de colunas do select entende embeds", () => {
  it("descarta o conteúdo do embed, mantendo só o nome dele", () => {
    // A versão com split(",") quebrava aqui: `name` e `price_cents` viravam
    // colunas da tabela externa e a query legítima era recusada.
    expect(
      colunasDoSelect("user_id, status, plans(code, name, price_cents)"),
    ).toEqual(["user_id", "status", "plans"]);
  });

  it("embed com uma coluna só continua funcionando", () => {
    expect(colunasDoSelect("user_id, plans(code)")).toEqual([
      "user_id",
      "plans",
    ]);
  });

  it("select sem embed é o de sempre", () => {
    expect(colunasDoSelect("id, code, label")).toEqual(["id", "code", "label"]);
  });

  it("descarta a dica de join (`!inner`), que não é nome de coluna", () => {
    // `getMrrSnapshot` usa essa forma; sem isto o dublê recusava a query dele.
    expect(
      colunasDoSelect("status, plans!inner(code, name, price_cents, interval)"),
    ).toEqual(["status", "plans"]);
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
    // O mecanismo é exercitado direto, e não só através da lista de pendentes:
    // quando ela está vazia (estado normal) o laço abaixo não roda, e um teste
    // que não afirma nada é pior que teste nenhum.
    const declaradas = colunasDeclaradasEmMigrations();
    expect(declaradas.has("canceled_by")).toBe(true);
    expect(declaradas.has("settlement")).toBe(true);
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
