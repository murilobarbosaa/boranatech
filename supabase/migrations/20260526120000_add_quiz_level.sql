-- Adiciona o nivel da triagem (iniciante, intermediario, avancado) as tentativas do quiz.
-- Coluna nullable e aditiva: tentativas antigas permanecem validas com level NULL.
-- Idempotente: pode rodar mais de uma vez sem erro (column IF NOT EXISTS + guarda da constraint).

alter table "public"."career_quiz_attempts"
  add column if not exists "level" "text";

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'career_quiz_attempts_level_check'
      and conrelid = 'public.career_quiz_attempts'::regclass
  ) then
    alter table "public"."career_quiz_attempts"
      add constraint "career_quiz_attempts_level_check"
      check (
        "level" is null
        or "level" = any (array['iniciante'::"text", 'intermediario'::"text", 'avancado'::"text"])
      );
  end if;
end $$;
