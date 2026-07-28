// Introspecao do schema real via Management API do Supabase.
//
// POR QUE NAO PostgREST: ele nao expoe pg_indexes, pg_policy nem
// information_schema.columns. O guard de migrations sabia disso e por isso
// APENAS CONTAVA policies e indices sem verificar (ver
// docs/limites-do-guard-de-migrations.md). O caminho que faltava nao era uma RPC
// nova (que seria circular: uma migration para verificar migrations), e sim o
// endpoint POST /v1/projects/<ref>/database/query, que roda SQL como o papel
// `postgres` e nunca precisou ser criado.
//
// POR QUE NAO conexao direta: db.<ref>.supabase.co resolve so em IPv6, que esta
// inalcancavel desta rede, e o pooler IPv4 recusa a senha de
// SUPABASE_DB_PASSWORD. Medido em 2026-07-28. O endpoint HTTP nao depende de
// nenhum dos dois.
//
// SOMENTE LEITURA por convencao deste modulo: todas as consultas aqui sao
// SELECT sobre catalogo. Aplicar migration NAO passa por aqui.

export type IntrospectDeps = {
  projectRef: string;
  accessToken: string;
};

/**
 * Recusa qualquer coisa que nao seja UM comando SELECT.
 *
 * O endpoint da Management API executa SQL ARBITRARIO com o papel `postgres`:
 * `runSql` tinha, na pratica, poder de DROP num modulo que roda em `pnpm
 * check:migrations`, ou seja, rotina. Nada aqui precisa disso, entao o poder sai.
 *
 * A checagem e deliberadamente ESTREITA e conservadora: um unico statement,
 * comecando em `select` ou `with`, sem `;` no meio. Nao tenta ser um parser de
 * SQL (parser meu decidindo escopo e a classe de erro que esta base documenta):
 * ela RECUSA o que nao reconhece, em vez de tentar interpretar. Se um dia uma
 * consulta legitima for barrada, o conserto e reescrever a consulta, nao afrouxar
 * o guard.
 */
export function exigirSelect(query: string): void {
  // Sem comentarios: `-- ` e `/* */` poderiam esconder o verbo real.
  if (/--|\/\*/.test(query)) {
    throw new Error("[pgIntrospect] consulta com comentario SQL recusada.");
  }
  const limpa = query.trim().replace(/;\s*$/, "");
  if (limpa.includes(";")) {
    throw new Error("[pgIntrospect] mais de um statement recusado.");
  }
  if (!/^(select|with)\s/i.test(limpa)) {
    throw new Error(
      `[pgIntrospect] somente SELECT: recusado "${limpa.slice(0, 40)}".`,
    );
  }
  // `with ... as ( insert ... returning )` e SELECT na superficie e escrita no
  // fundo. Barra as palavras de escrita em qualquer posicao.
  if (/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy)\b/i.test(limpa)) {
    throw new Error(
      "[pgIntrospect] palavra de escrita na consulta; recusado.",
    );
  }
}

export async function runSql<T = Record<string, unknown>>(
  deps: IntrospectDeps,
  query: string,
): Promise<T[]> {
  exigirSelect(query);
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${deps.projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deps.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const corpo = await response.text();
  if (!response.ok) {
    // Fail-loud: um erro de introspecao NAO pode virar "conjunto vazio", senao
    // o guard passaria verde afirmando que nada falta. Mesma armadilha do
    // contarLinhas devolvendo -1.
    throw new Error(
      `introspecao falhou (HTTP ${response.status}): ${corpo.slice(0, 300)}`,
    );
  }
  return JSON.parse(corpo) as T[];
}

/** `tabela.coluna` de todas as colunas do schema public, em minusculas. */
export async function colunasReais(deps: IntrospectDeps): Promise<Set<string>> {
  const rows = await runSql<{ k: string }>(
    deps,
    `select table_name || '.' || column_name as k
       from information_schema.columns
      where table_schema = 'public';`,
  );
  return new Set(rows.map((r) => r.k.toLowerCase()));
}

/** Nome de todo indice do schema public, em minusculas. */
export async function indicesReais(deps: IntrospectDeps): Promise<Set<string>> {
  const rows = await runSql<{ k: string }>(
    deps,
    `select indexname as k from pg_indexes where schemaname = 'public';`,
  );
  return new Set(rows.map((r) => r.k.toLowerCase()));
}

/**
 * `tabela||policy` de toda policy do schema public, em minusculas.
 *
 * A chave inclui a TABELA de proposito: nome de policy nao e unico no banco
 * (`profiles_select_own` e `subscriptions_select_own` convivem, e nada impede
 * duas tabelas usarem o mesmo nome). Conferir so pelo nome deixaria uma policy
 * ausente passar sempre que outra tabela tivesse uma homonima.
 */
export async function policiesReais(deps: IntrospectDeps): Promise<Set<string>> {
  const rows = await runSql<{ k: string }>(
    deps,
    `select c.relname || '||' || p.polname as k
       from pg_policy p
       join pg_class c on c.oid = p.polrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public';`,
  );
  return new Set(rows.map((r) => r.k.toLowerCase()));
}
