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

export async function runSql<T = Record<string, unknown>>(
  deps: IntrospectDeps,
  query: string,
): Promise<T[]> {
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
