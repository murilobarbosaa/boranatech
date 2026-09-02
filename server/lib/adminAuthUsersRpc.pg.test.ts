import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * Harness de Postgres REAL para a migration 20260902020000_admin_auth_users_rpc.
 *
 * POR QUE ELE EXISTE. As duas funcoes deste lote sao `language sql` com
 * `returns table`, e nessa forma o tipo de cada coluna do SELECT tem de casar
 * EXATAMENTE com o do RETURNS TABLE. Divergencia NAO aparece ao criar a funcao:
 * aparece na primeira chamada, ja em producao. `auth.users.email` e varchar, e o
 * `::text` da migration existe por isso. Nenhum teste com duplo pega esse tipo
 * de erro, porque ele e sobre o que o Postgres aceita.
 *
 * O outro invariante e de SEGURANCA e igualmente invisivel para mock: as
 * funcoes sao `security definer` sobre `auth.users`, entao `anon` e
 * `authenticated` NAO podem ter execute. Um `grant` esquecido aqui e a base de
 * e-mails inteira exposta pelo PostgREST.
 *
 * PULA por padrao. Como rodar:
 *
 *   docker run -d --name bnt-authrpc-pg -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=bnt -p 55444:5432 postgres:16-alpine
 *   BNT_AUTHRPC_PG=1 npx vitest run server/lib/adminAuthUsersRpc.pg.test.ts
 *
 * O teste aplica o prelude (schema auth, tabela users, os tres roles, duas
 * linhas) e a migration, entao o container pode estar vazio. Usa `psql`, que ja
 * existe na maquina, em vez de um cliente Postgres novo: o lote nao pede
 * dependencia nova e um driver a mais so para isto nao se paga.
 */

const ativo = process.env.BNT_AUTHRPC_PG === "1";
const PORTA = process.env.BNT_AUTHRPC_PG_PORT ?? "55444";

function psql(sql: string): string {
  return execFileSync(
    "psql",
    [
      "-h",
      "127.0.0.1",
      "-p",
      PORTA,
      "-U",
      "postgres",
      "-d",
      "bnt",
      "-tAc",
      sql,
    ],
    { env: { ...process.env, PGPASSWORD: "test" }, encoding: "utf8" },
  ).trim();
}

const PRELUDE = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email varchar(255),
  last_sign_in_at timestamptz,
  created_at timestamptz,
  raw_user_meta_data jsonb
);
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
insert into auth.users (id, email, last_sign_in_at, created_at, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@exemplo.com', '2026-08-30T10:00:00Z', '2026-01-02T00:00:00Z', '{"name":"Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@exemplo.com', null, '2026-02-03T00:00:00Z', '{}')
on conflict (id) do nothing;
`;

describe.skipIf(!ativo)(
  "migration admin_auth_users_rpc contra Postgres real",
  () => {
    it("aplica o prelude e a migration sem erro", async () => {
      psql(PRELUDE);
      const fs = await import("node:fs");
      const sql = fs.readFileSync(
        new URL(
          "../../supabase/migrations/20260902020000_admin_auth_users_rpc.sql",
          import.meta.url,
        ),
        "utf8",
      );
      // Erro de tipo entre SELECT e RETURNS TABLE estoura AQUI, e e o ponto.
      expect(() => psql(sql)).not.toThrow();
    });

    it("as duas funcoes existem com as colunas esperadas", () => {
      const r = psql(
        `select p.proname || '|' || pg_get_function_result(p.oid)
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('admin_auth_users_lite','admin_auth_times')
       order by 1`,
      ).split("\n");

      expect(r).toHaveLength(2);
      expect(r[0]).toBe(
        "admin_auth_times|TABLE(user_id uuid, last_sign_in_at timestamp with time zone, created_at timestamp with time zone)",
      );
      // `email text` prova que o `::text` da migration resolveu o varchar.
      expect(r[1]).toBe(
        "admin_auth_users_lite|TABLE(user_id uuid, email text, last_sign_in_at timestamp with time zone, created_at timestamp with time zone, name text)",
      );
    });

    it("sao security definer com search_path pinado", () => {
      const r = psql(
        `select p.proname || '|' || p.prosecdef || '|' || coalesce(array_to_string(p.proconfig, ','), '')
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('admin_auth_users_lite','admin_auth_times')
       order by 1`,
      ).split("\n");
      // `true`, e nao `t`: booleano concatenado em texto usa a forma longa. O
      // `t` do psql em coluna e formatacao de tabela, nao o valor.
      expect(r[0]).toBe("admin_auth_times|true|search_path=public, auth");
      expect(r[1]).toBe("admin_auth_users_lite|true|search_path=public, auth");
    });

    it("admin_auth_users_lite devolve os campos do usuario, com nulos preservados", () => {
      const r = psql(
        `select user_id::text || '|' || coalesce(email,'') || '|' ||
              coalesce(last_sign_in_at::text,'') || '|' || coalesce(name,'')
       from public.admin_auth_users_lite(
         array['11111111-1111-1111-1111-111111111111',
               '22222222-2222-2222-2222-222222222222']::uuid[])
       order by email`,
      ).split("\n");

      expect(r[0]).toBe(
        "11111111-1111-1111-1111-111111111111|a@exemplo.com|2026-08-30 10:00:00+00|Alice",
      );
      // Metadata `{}` nao tem `name`: sai null, nao string vazia inventada.
      expect(r[1]).toBe("22222222-2222-2222-2222-222222222222|b@exemplo.com||");
    });

    it("id inexistente devolve VAZIO, nao linha nula", () => {
      expect(
        psql(
          `select count(*) from public.admin_auth_users_lite(
           array['99999999-9999-9999-9999-999999999999']::uuid[])`,
        ),
      ).toBe("0");
    });

    it("admin_auth_times devolve todos, com last_sign_in_at nulo preservado", () => {
      const r = psql(
        `select coalesce(last_sign_in_at::text,'(nulo)')
       from public.admin_auth_times() order by created_at`,
      ).split("\n");
      expect(r).toEqual(["2026-08-30 10:00:00+00", "(nulo)"]);
    });

    it("anon e authenticated NAO executam; service_role executa", () => {
      const r = psql(
        `select r.rolname || '|' ||
              has_function_privilege(r.rolname,'public.admin_auth_users_lite(uuid[])','execute') || '|' ||
              has_function_privilege(r.rolname,'public.admin_auth_times()','execute')
       from (values ('anon'),('authenticated'),('service_role')) r(rolname)`,
      ).split("\n");

      // Escrito a mao: sao estas tres linhas, nesta ordem, com estes valores.
      expect(r).toEqual([
        "anon|false|false",
        "authenticated|false|false",
        "service_role|true|true",
      ]);
    });
  },
);
