import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../supabase/migrations/20260815130000_linkedin_progress_revision.sql",
  ),
  "utf8",
).toLowerCase();

const setFunction = sql.slice(
  sql.indexOf(
    "create or replace function public.linkedin_set_improvement_progress",
  ),
);

describe("migration de revisão do progresso LinkedIn", () => {
  it("bloqueia a análise e compara a revisão antes de qualquer insert", () => {
    const lock = setFunction.indexOf("for update");
    const stale = setFunction.indexOf("v_revision <> p_revision");
    const insert = setFunction.indexOf(
      "insert into public.linkedin_improvement_progress",
    );

    expect(lock).toBeGreaterThan(0);
    expect(stale).toBeGreaterThan(lock);
    expect(insert).toBeGreaterThan(stale);
  });

  it("valida posse e índice real dentro da mesma função SQL", () => {
    expect(setFunction).toMatch(/analysis\.user_id\s*=\s*p_user_id/);
    expect(setFunction).toMatch(
      /jsonb_typeof\(v_improvements\)[\s\S]*?'array'/,
    );
    expect(setFunction).toMatch(
      /p_improvement_index\s*>=\s*jsonb_array_length\(v_improvements\)/,
    );
  });

  it("expõe as RPCs somente ao service_role e fixa search_path", () => {
    expect(sql.match(/security definer/g)).toHaveLength(2);
    expect(sql.match(/set search_path = pg_catalog, public/g)).toHaveLength(2);
    expect(sql).toMatch(
      /revoke all on function public\.linkedin_set_improvement_progress[\s\S]*?from public, anon, authenticated/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.linkedin_set_improvement_progress[\s\S]*?to service_role/,
    );
  });
});
