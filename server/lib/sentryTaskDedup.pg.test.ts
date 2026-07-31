import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);

// Prova do INVARIANTE 3 contra um Postgres DE VERDADE, com insercoes
// CONCORRENTES: um issue do Sentry corresponde a no maximo uma tarefa, e quem
// garante isso e o INDICE UNICO, nunca um `if` no codigo.
//
// POR QUE NAO BASTA TESTAR O `if`. Verificar-antes-de-inserir tem janela de
// corrida: entre o SELECT e o INSERT, outra execucao insere. Um teste sobre o
// `if` passaria com a janela intacta, porque um unit test nao tem concorrencia
// real. So o banco pode provar isto.
//
// COMO ELE E HONESTO. O teste NAO se contenta em ver "sobrou 1 linha": ele roda
// a MESMA rajada contra uma tabela SEM o indice e exige que ali sobrem N linhas.
// Sem esse controle, "sobrou 1" seria compativel com "as insercoes nem foram
// concorrentes" e o teste passaria sem provar nada. O par de assercoes e que
// separa "a constraint funcionou" de "tive sorte".
//
// O DDL do indice NAO e reescrito aqui: e LIDO da migration real
// (20260731050000), para o teste nao virar uma prova sobre uma recriacao minha.
//
// PULA por padrao, como o adminTasks.rebalance.test.ts. Roda com:
//
//   docker run -d --name bnt-fase3-pg -e POSTGRES_PASSWORD=test \
//     -e POSTGRES_DB=bnt postgres:16-alpine
//   BNT_PG_CONTAINER=bnt-fase3-pg npx vitest run server/lib/sentryTaskDedup.pg.test.ts

const CONTAINER = process.env.BNT_PG_CONTAINER;
const enabled = Boolean(CONTAINER);
const CONCORRENTES = 12;

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
);

/** Extrai o DDL REAL do indice unico da migration, sem reescrever nada. */
function ddlDoIndiceUnico(): string {
  const sql = readFileSync(
    path.join(
      migrationsDir,
      "20260731050000_add_sentry_fields_to_admin_tasks.sql",
    ),
    "utf8",
  );
  const m = sql.match(
    /create unique index if not exists admin_tasks_sentry_numeric_id_key[\s\S]*?;/i,
  );
  if (!m) throw new Error("DDL do indice unico nao encontrado na migration");
  return m[0];
}

async function psql(sqlTexto: string): Promise<string> {
  const { stdout } = await run("docker", [
    "exec",
    "-i",
    CONTAINER as string,
    "psql",
    "-U",
    "postgres",
    "-d",
    "bnt",
    "-t",
    "-A",
    "-c",
    sqlTexto,
  ]);
  return stdout.trim();
}

describe.skipIf(!enabled)("invariante 3: deduplicacao pela constraint", () => {
  beforeAll(async () => {
    // Recorte minimo: so as colunas que o indice toca. O DDL do indice vem da
    // migration; o resto e andaime para ele existir.
    await psql(`
      drop table if exists dedup_com_indice;
      drop table if exists dedup_sem_indice;
      create table dedup_com_indice (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        sentry_numeric_id text
      );
      create table dedup_sem_indice (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        sentry_numeric_id text
      );
    `);
    // replaceAll e nao replace: o DDL cita `admin_tasks` DUAS vezes (no nome do
    // indice e no `on public.admin_tasks`), e trocar so a primeira deixa o
    // indice apontando para uma tabela que nao existe aqui. Um `replace` simples
    // falha alto, o que e o desejado, mas o certo e trocar as duas.
    await psql(
      ddlDoIndiceUnico().replaceAll("admin_tasks", "dedup_com_indice"),
    );
  });

  it("N insercoes concorrentes da MESMA issue deixam exatamente 1 linha", async () => {
    await psql("truncate dedup_com_indice;");
    // Conexoes separadas, disparadas juntas: concorrencia de verdade, nao
    // sequencia disfarcada.
    await Promise.all(
      Array.from({ length: CONCORRENTES }, (_, i) =>
        psql(
          `insert into dedup_com_indice (title, sentry_numeric_id)
           values ('tentativa ${i}', '7639102906')
           on conflict (sentry_numeric_id) do nothing;`,
        ),
      ),
    );
    expect(await psql("select count(*) from dedup_com_indice;")).toBe("1");
  });

  it("CONTROLE: a mesma rajada SEM o indice deixa N linhas", async () => {
    // Esta e a asserção que da sentido a de cima. Se as insercoes nao fossem
    // concorrentes, ou se a rajada nao chegasse ao banco, aqui tambem sobraria
    // pouca coisa, e o teste anterior nao teria provado nada sobre a constraint.
    await psql("truncate dedup_sem_indice;");
    await Promise.all(
      Array.from({ length: CONCORRENTES }, (_, i) =>
        psql(
          `insert into dedup_sem_indice (title, sentry_numeric_id)
           values ('tentativa ${i}', '7639102906');`,
        ),
      ),
    );
    expect(await psql("select count(*) from dedup_sem_indice;")).toBe(
      String(CONCORRENTES),
    );
  });

  it("varios cards humanos (id nulo) convivem sob o MESMO indice unico", async () => {
    // Esta e a asserção que autoriza o indice a NAO ser parcial. O Postgres
    // trata NULLs como distintos entre si num indice unico comum, entao o
    // predicado `where ... is not null` era desnecessario, e ele quebrava o
    // `on conflict` do sync. Aqui isso deixa de ser crenca e vira medicao.
    await psql("truncate dedup_com_indice;");
    await Promise.all(
      Array.from({ length: CONCORRENTES }, (_, i) =>
        psql(
          `insert into dedup_com_indice (title, sentry_numeric_id)
           values ('card humano ${i}', null);`,
        ),
      ),
    );
    // Sem o `where ... is not null`, o segundo nulo colidiria e o modulo
    // pararia de aceitar card manual.
    expect(await psql("select count(*) from dedup_com_indice;")).toBe(
      String(CONCORRENTES),
    );
  });
});
