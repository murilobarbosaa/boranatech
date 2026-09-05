import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);

/**
 * O INDICE QUE O UPSERT DE ASSINATURA USA PRECISA SER COMPLETO.
 *
 * `applyBoletoPending` e `applySubscription` gravam com
 * `.upsert(row, { onConflict: "provider_subscription_id" })`, e o PostgREST
 * traduz isso para `INSERT ... ON CONFLICT (provider_subscription_id) DO
 * UPDATE`. O Postgres so aceita essa forma quando existe um indice unico
 * COMPLETO sobre a coluna: com indice PARCIAL (com `WHERE`) ele levanta 42P10,
 * "there is no unique or exclusion constraint matching the ON CONFLICT
 * specification", e a gravacao inteira falha.
 *
 * POR QUE ISSO PRECISA DE UM TESTE, e de um contra um Postgres de verdade. A
 * tabela tem HOJE os dois tipos de indice: `subscriptions_provider_subscription_id_key`
 * (unico completo, de 20260517231011) e `subscriptions_one_active_per_user`
 * (unico PARCIAL, de 20260829120000). Os dois sao corretos e servem a
 * propositos diferentes, mas so o primeiro pode ser alvo de ON CONFLICT. Trocar
 * o primeiro por um parcial, ou reescrever o upsert para mirar no segundo,
 * derruba a gravacao de TODA assinatura, e nao existe unit test com duble que
 * acuse isso: o duble aceita qualquer `onConflict`, porque quem recusa e o
 * planejador do Postgres.
 *
 * O DDL NAO E REESCRITO AQUI: e LIDO das migrations reais, para o teste nao
 * virar uma prova sobre uma recriacao minha. Se a migration mudar, o teste
 * roda sobre o que mudou.
 *
 * PULA por padrao, como os outros `*.pg.test.ts`. Roda com:
 *
 *   docker run -d --name bnt-subs-pg -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=bnt postgres:16-alpine
 *   BNT_PG_CONTAINER=bnt-subs-pg npx vitest run server/providers/subscriptionsUpsert.pg.test.ts
 */

const CONTAINER = process.env.BNT_PG_CONTAINER;
const enabled = Boolean(CONTAINER);

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
);

function lerMigration(arquivo: string): string {
  return readFileSync(path.join(migrationsDir, arquivo), "utf8");
}

/** DDL REAL da chave unica que o upsert mira, sem reescrever nada. */
function ddlDaChaveUnica(): string {
  const sql = lerMigration("20260517231011_remote_schema.sql");
  const m = sql.match(
    /ALTER TABLE ONLY "public"\."subscriptions"\s*ADD CONSTRAINT "subscriptions_provider_subscription_id_key" UNIQUE \("provider_subscription_id"\);/,
  );
  if (!m) throw new Error("DDL da chave unica nao encontrado na migration");
  return m[0];
}

/** DDL REAL do indice NAO-unico auxiliar sobre a mesma coluna. */
function ddlDoIndiceAuxiliar(): string {
  const sql = lerMigration("20260517231011_remote_schema.sql");
  const m = sql.match(
    /CREATE INDEX "subscriptions_provider_subscription_id_idx"[^;]*;/,
  );
  if (!m) throw new Error("DDL do indice auxiliar nao encontrado na migration");
  return m[0];
}

/** DDL REAL do indice unico PARCIAL de uma assinatura ativa por usuario. */
function ddlDoIndiceParcial(): string {
  const sql = lerMigration(
    "20260829120000_unique_active_subscription_per_user.sql",
  );
  const m = sql.match(
    /CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user[\s\S]*?;/i,
  );
  if (!m) throw new Error("DDL do indice parcial nao encontrado na migration");
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

/**
 * Roda um comando e devolve o SQLSTATE, ou "ok".
 *
 * O codigo do erro e o que importa aqui (42P10 nao e "deu ruim", e uma resposta
 * especifica do planejador), e capturar texto de stderr do psql traria o
 * problema de casar mensagem traduzida ou reformatada. A funcao devolve o
 * codigo pelo canal normal de resultado.
 */
async function sqlstateDe(comando: string): Promise<string> {
  // Estoura em vez de escapar: um comando que contenha o proprio delimitador
  // sairia truncado, e um comando truncado que ainda roda devolve um SQLSTATE
  // sobre outra coisa. Falhar aqui e o unico jeito de nao afirmar codigo errado.
  if (comando.includes("$cmd$")) {
    throw new Error("comando contem o delimitador $cmd$ e sairia truncado");
  }
  return psql(`select bnt_sqlstate($cmd$${comando}$cmd$);`);
}

describe.skipIf(!enabled)("upsert de assinatura contra Postgres real", () => {
  beforeAll(async () => {
    // Recorte minimo: so as colunas que os indices tocam. Os indices vem das
    // migrations; o resto e andaime para eles existirem.
    await psql(`
      drop table if exists public.subscriptions cascade;
      create table public.subscriptions (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null,
        provider_subscription_id text,
        status text not null
      );
      create or replace function bnt_sqlstate(cmd text) returns text as $fn$
      begin
        execute cmd;
        return 'ok';
      exception when others then
        return sqlstate;
      end;
      $fn$ language plpgsql;
    `);
    await psql(ddlDaChaveUnica());
    await psql(ddlDoIndiceAuxiliar());
    await psql(ddlDoIndiceParcial());
  });

  it("os indices da tabela sao EXATAMENTE estes quatro, com estas naturezas", async () => {
    // Afirma o TOTAL, e nao a pertinencia. "o indice completo esta la" passaria
    // igual se alguem acrescentasse um segundo indice unico parcial que mudasse
    // o comportamento do upsert; a lista inteira quebra.
    const saida = await psql(`
      select c.relname || '|' || i.indisunique || '|' || (i.indpred is not null)
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      join pg_class t on t.oid = i.indrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relname = 'subscriptions'
      order by c.relname;
    `);

    // relname | unico | parcial
    expect(saida.split("\n")).toEqual([
      "subscriptions_one_active_per_user|true|true",
      "subscriptions_pkey|true|false",
      "subscriptions_provider_subscription_id_idx|false|false",
      "subscriptions_provider_subscription_id_key|true|false",
    ]);
  });

  it("o alvo do ON CONFLICT do upsert NAO tem WHERE", async () => {
    const indpred = await psql(`
      select coalesce(pg_get_expr(i.indpred, i.indrelid), 'SEM WHERE')
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      where c.relname = 'subscriptions_provider_subscription_id_key';
    `);

    expect(indpred).toBe("SEM WHERE");
  });

  it("INSERT ... ON CONFLICT (provider_subscription_id) roda, sem 42P10", async () => {
    const estado = await sqlstateDe(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('11111111-1111-1111-1111-111111111111', 'cs_test_boleto', 'pending')
      on conflict (provider_subscription_id) do update set status = excluded.status
    `);

    expect(estado).toBe("ok");
  });

  it("o mesmo id reentrando ATUALIZA a linha, nao cria uma segunda", async () => {
    // E o contrato de que o handler depende na reentrega da Stripe.
    await psql(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('22222222-2222-2222-2222-222222222222', 'cs_reentrega', 'pending')
      on conflict (provider_subscription_id) do update set status = excluded.status;
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('22222222-2222-2222-2222-222222222222', 'cs_reentrega', 'canceled')
      on conflict (provider_subscription_id) do update set status = excluded.status;
    `);

    const linhas = await psql(`
      select count(*) || '|' || max(status) from public.subscriptions
      where provider_subscription_id = 'cs_reentrega';
    `);

    expect(linhas).toBe("1|canceled");
  });

  /**
   * O CONTROLE QUE TORNA O CASO ACIMA HONESTO.
   *
   * "rodou sem erro" so significa alguma coisa se este ambiente for capaz de
   * produzir o erro. Aqui o mesmo INSERT, mirando o indice PARCIAL, levanta o
   * 42P10 que o caso anterior afirma nao acontecer. Sem este par, o teste
   * passaria identico num banco onde 42P10 nunca ocorresse.
   */
  it("CONTROLE: ON CONFLICT (user_id), que e parcial, levanta 42P10", async () => {
    const estado = await sqlstateDe(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('33333333-3333-3333-3333-333333333333', 'cs_parcial', 'active')
      on conflict (user_id) do update set status = excluded.status
    `);

    expect(estado).toBe("42P10");
  });

  it("o indice parcial E parcial de proposito: trava a segunda ativa", async () => {
    const usuario = "44444444-4444-4444-4444-444444444444";
    await psql(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('${usuario}', 'cs_ativa_1', 'active');
    `);

    const segundaAtiva = await sqlstateDe(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('${usuario}', 'cs_ativa_2', 'active')
    `);
    // 23505: unique_violation. E a regra de negocio que o indice existe para
    // impor, e e por causa dela que ele PRECISA ser parcial.
    expect(segundaAtiva).toBe("23505");

    const segundaCancelada = await sqlstateDe(`
      insert into public.subscriptions (user_id, provider_subscription_id, status)
      values ('${usuario}', 'cs_cancelada', 'canceled')
    `);
    // Fora do `WHERE` do indice: historico de assinatura encerrada nao concorre
    // com a ativa, e um indice completo sobre user_id proibiria isso.
    expect(segundaCancelada).toBe("ok");
  });
});
