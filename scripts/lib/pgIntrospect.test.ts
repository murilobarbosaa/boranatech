import { describe, expect, it } from "vitest";

import { exigirSelect } from "./pgIntrospect";

describe("exigirSelect", () => {
  // As tres consultas REAIS do guard de migrations precisam passar, senao o
  // conserto de seguranca quebra a verificacao que ele protege.
  it.each([
    "select table_name || '.' || column_name as k\n from information_schema.columns\n where table_schema = 'public';",
    "select indexname as k from pg_indexes where schemaname = 'public';",
    "select c.relname || '||' || p.polname as k\n from pg_policy p\n join pg_class c on c.oid = p.polrelid\n where 1=1;",
  ])("aceita a consulta de introspeccao %#", (q) => {
    expect(() => exigirSelect(q)).not.toThrow();
  });

  it("aceita CTE (with)", () => {
    expect(() => exigirSelect("with x as (select 1 as a) select a from x")).not.toThrow();
  });

  it.each([
    ["drop table", "drop table public.subscriptions"],
    ["delete", "delete from public.subscriptions"],
    ["update", "update public.subscriptions set status = 'active'"],
    ["insert", "insert into public.plans (code) values ('x')"],
    ["alter", "alter table public.plans add column x text"],
    ["grant", "grant all on public.plans to anon"],
    ["truncate", "truncate public.billing_events"],
  ])("recusa %s", (_rotulo, q) => {
    expect(() => exigirSelect(q)).toThrow();
  });

  // O caso interessante: SELECT na superficie, escrita no fundo.
  it("recusa CTE que escreve (with ... as (insert ... returning))", () => {
    expect(() =>
      exigirSelect("with w as (insert into t (a) values (1) returning a) select a from w"),
    ).toThrow(/palavra de escrita/);
  });

  it("recusa mais de um statement", () => {
    expect(() => exigirSelect("select 1; drop table t")).toThrow(/mais de um statement/);
  });

  it("recusa comentario, que poderia esconder o verbo real", () => {
    expect(() => exigirSelect("select 1 -- \ndrop table t")).toThrow(/comentario/);
    expect(() => exigirSelect("/* select */ drop table t")).toThrow(/comentario/);
  });

  it("aceita o ; final, que e so terminador", () => {
    expect(() => exigirSelect("select 1;")).not.toThrow();
  });
});
